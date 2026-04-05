const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const FraudLog = require("../models/fraudLog.model");
const User = require("../models/user.model");

function toObjectId(id) {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

function parseDateRange(query) {
  const end = query.endDate ? new Date(query.endDate) : new Date();
  let start;
  if (query.startDate) {
    start = new Date(query.startDate);
  } else {
    start = new Date(end.getTime());
    start.setUTCMonth(start.getUTCMonth() - 3);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const err = new Error("Invalid startDate or endDate");
    err.statusCode = 400;
    throw err;
  }
  if (start > end) {
    return { start: end, end: start };
  }
  return { start, end };
}

function resolveGranularity(query, start, end) {
  const g = String(query.granularity || "").toLowerCase();
  if (g === "day" || g === "week" || g === "month") return g;
  const days = (end - start) / 86400000;
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

function transactionMatch(userId, start, end) {
  return {
    userId: toObjectId(userId),
    isDeleted: { $ne: true },
    transactionDate: { $gte: start, $lte: end }
  };
}

/** Mongo expression: string period key for bucketing */
function periodKeyExpr(granularity) {
  if (granularity === "day") {
    return { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } };
  }
  if (granularity === "month") {
    return { $dateToString: { format: "%Y-%m", date: "$transactionDate" } };
  }
  return {
    $concat: [
      { $toString: { $isoWeekYear: "$transactionDate" } },
      "-W",
      {
        $cond: [
          { $lt: [{ $isoWeek: "$transactionDate" }, 10] },
          {
            $concat: [
              "0",
              { $toString: { $isoWeek: "$transactionDate" } }
            ]
          },
          { $toString: { $isoWeek: "$transactionDate" } }
        ]
      }
    ]
  };
}

function sortPeriodKeys(keys, granularity) {
  const sorted = [...keys];
  if (granularity === "week") {
    sorted.sort((a, b) => {
      const [ay, aw] = a.split("-W").map(Number);
      const [by, bw] = b.split("-W").map(Number);
      if (ay !== by) return ay - by;
      return aw - bw;
    });
  } else {
    sorted.sort();
  }
  return sorted;
}

function chartJsBarOrLine(labels, datasets) {
  return {
    labels,
    datasets: datasets.map((d) => ({
      label: d.label,
      data: d.data,
      ...(d.backgroundColor && { backgroundColor: d.backgroundColor }),
      ...(d.borderColor && { borderColor: d.borderColor }),
      ...(d.fill !== undefined && { fill: d.fill })
    }))
  };
}

/**
 * Income vs expense over time (line/bar charts).
 */
async function getIncomeVsExpenseAnalytics(userId, query) {
  const { start, end } = parseDateRange(query);
  const granularity = resolveGranularity(query, start, end);
  const match = transactionMatch(userId, start, end);
  const pKey = periodKeyExpr(granularity);

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { period: pKey, type: "$type" },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const periodSet = new Set();
  const incomeByP = new Map();
  const expenseByP = new Map();
  for (const r of rows) {
    const p = r._id.period;
    if (!p) continue;
    periodSet.add(p);
    if (r._id.type === "INCOME") {
      incomeByP.set(p, {
        totalAmount: r.totalAmount,
        count: r.count
      });
    } else if (r._id.type === "EXPENSE") {
      expenseByP.set(p, {
        totalAmount: r.totalAmount,
        count: r.count
      });
    }
  }

  const labels = sortPeriodKeys([...periodSet], granularity);
  const incomeTotals = labels.map((l) => incomeByP.get(l)?.totalAmount ?? 0);
  const expenseTotals = labels.map((l) => expenseByP.get(l)?.totalAmount ?? 0);
  const incomeCounts = labels.map((l) => incomeByP.get(l)?.count ?? 0);
  const expenseCounts = labels.map((l) => expenseByP.get(l)?.count ?? 0);

  const totalIncome = incomeTotals.reduce((a, b) => a + b, 0);
  const totalExpense = expenseTotals.reduce((a, b) => a + b, 0);

  return {
    meta: {
      chartHint: "line_or_bar",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      granularity
    },
    summary: {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      incomeTransactionCount: incomeCounts.reduce((a, b) => a + b, 0),
      expenseTransactionCount: expenseCounts.reduce((a, b) => a + b, 0)
    },
    comparison: chartJsBarOrLine(["Income", "Expense"], [
      {
        label: "Total amount",
        data: [totalIncome, totalExpense],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"]
      }
    ]),
    overTime: chartJsBarOrLine(labels, [
      {
        label: "Income",
        data: incomeTotals,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        fill: true
      },
      {
        label: "Expense",
        data: expenseTotals,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        fill: true
      }
    ]),
    countsOverTime: chartJsBarOrLine(labels, [
      { label: "Income (count)", data: incomeCounts },
      { label: "Expense (count)", data: expenseCounts }
    ])
  };
}

/**
 * Transaction volume, payment methods, categories — graph-ready.
 */
async function getTransactionAnalytics(userId, query) {
  const { start, end } = parseDateRange(query);
  const granularity = resolveGranularity(query, start, end);
  const match = transactionMatch(userId, start, end);
  const pKey = periodKeyExpr(granularity);

  const [
    summaryAgg,
    volumeRows,
    paymentRows,
    categoryRows,
    typeSummary
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalVolume: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: pKey, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "cat"
        }
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$cat.name", "Unknown"] },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 12 }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const s = summaryAgg[0] || {
    totalCount: 0,
    totalVolume: 0,
    avgAmount: 0
  };

  const volMap = new Map(volumeRows.map((r) => [r._id, r]));
  const volLabels = sortPeriodKeys([...volMap.keys()], granularity);
  const volumeData = volLabels.map((l) => volMap.get(l)?.total ?? 0);
  const countData = volLabels.map((l) => volMap.get(l)?.count ?? 0);

  const byType = {};
  for (const t of typeSummary) {
    byType[t._id] = { totalAmount: t.totalAmount, count: t.count };
  }

  const pmLabels = paymentRows.map((r) => r._id || "UNKNOWN");
  const pmTotals = paymentRows.map((r) => r.total);

  const catLabels = categoryRows.map((r) => r._id);
  const catTotals = categoryRows.map((r) => r.total);

  return {
    meta: {
      chartHint: "mixed",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      granularity
    },
    summary: {
      totalCount: s.totalCount,
      totalVolume: s.totalVolume,
      avgAmount: Math.round((s.avgAmount || 0) * 100) / 100,
      byType
    },
    volumeOverTime: chartJsBarOrLine(volLabels, [
      {
        label: "Transaction volume",
        data: volumeData,
        borderColor: "rgb(59, 130, 246)",
        fill: false
      }
    ]),
    transactionCountOverTime: chartJsBarOrLine(volLabels, [
      { label: "Count", data: countData, backgroundColor: "rgba(99, 102, 241, 0.5)" }
    ]),
    byPaymentMethod: chartJsBarOrLine(pmLabels, [
      {
        label: "Amount by payment method",
        data: pmTotals,
        backgroundColor: "rgba(168, 85, 247, 0.6)"
      }
    ]),
    byCategory: chartJsBarOrLine(catLabels, [
      {
        label: "Amount by category",
        data: catTotals,
        backgroundColor: "rgba(14, 165, 233, 0.6)"
      }
    ])
  };
}

/**
 * Fraud scores and status from transactions (+ fraud log summary).
 */
async function getFraudAnalytics(userId, query) {
  const { start, end } = parseDateRange(query);
  const granularity = resolveGranularity(query, start, end);
  const match = transactionMatch(userId, start, end);
  const pKey = periodKeyExpr(granularity);

  const [
    scoreSummary,
    statusRows,
    scoreOverTime,
    histogram,
    logStatusRows
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgFraudScore: { $avg: "$fraudScore" },
          maxFraudScore: { $max: "$fraudScore" },
          minFraudScore: { $min: "$fraudScore" },
          flaggedOrWorse: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$fraudStatus",
                    ["FLAGGED", "CONFIRMED_FRAUD"]
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: "$fraudStatus", count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: pKey,
          avgFraudScore: { $avg: "$fraudScore" },
          maxFraudScore: { $max: "$fraudScore" }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $addFields: {
          _fs: { $ifNull: ["$fraudScore", 0] }
        }
      },
      {
        $bucket: {
          groupBy: "$_fs",
          boundaries: [0, 0.25, 0.5, 0.75, 1.01],
          default: "other",
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    FraudLog.aggregate([
      {
        $match: {
          userId: toObjectId(userId),
          isDeleted: { $ne: true },
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  const ss = scoreSummary[0] || {
    avgFraudScore: 0,
    maxFraudScore: 0,
    minFraudScore: 0,
    flaggedOrWorse: 0
  };

  const statusLabels = ["PENDING", "SAFE", "FLAGGED", "CONFIRMED_FRAUD"];
  const statusMap = new Map(statusRows.map((r) => [r._id, r.count]));
  const statusData = statusLabels.map((l) => statusMap.get(l) ?? 0);

  const timeMap = new Map(scoreOverTime.map((r) => [r._id, r]));
  const timeLabels = sortPeriodKeys([...timeMap.keys()], granularity);
  const avgScoreSeries = timeLabels.map(
    (l) => Math.round((timeMap.get(l)?.avgFraudScore || 0) * 1000) / 1000
  );
  const maxScoreSeries = timeLabels.map(
    (l) => Math.round((timeMap.get(l)?.maxFraudScore || 0) * 1000) / 1000
  );

  const bucketLabels = ["0 – 0.25", "0.25 – 0.5", "0.5 – 0.75", "0.75 – 1", "> 1 / other"];
  const bucketData = [0, 0, 0, 0, 0];
  for (const b of histogram) {
    if (b._id === "other") {
      bucketData[4] += b.count;
      continue;
    }
    const idx =
      b._id === 0
        ? 0
        : b._id === 0.25
          ? 1
          : b._id === 0.5
            ? 2
            : b._id === 0.75
              ? 3
              : -1;
    if (idx >= 0) bucketData[idx] = b.count;
  }

  const logLabels = logStatusRows.map((r) => r._id || "UNKNOWN");
  const logData = logStatusRows.map((r) => r.count);

  return {
    meta: {
      chartHint: "line_bar_pie",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      granularity
    },
    summary: {
      avgFraudScore: Math.round((ss.avgFraudScore || 0) * 1000) / 1000,
      maxFraudScore: ss.maxFraudScore ?? 0,
      minFraudScore: ss.minFraudScore ?? 0,
      flaggedOrHighRiskCount: ss.flaggedOrWorse
    },
    fraudStatusOnTransactions: chartJsBarOrLine(statusLabels, [
      {
        label: "Transactions",
        data: statusData,
        backgroundColor: [
          "rgba(234, 179, 8, 0.6)",
          "rgba(34, 197, 94, 0.6)",
          "rgba(249, 115, 22, 0.6)",
          "rgba(220, 38, 38, 0.6)"
        ]
      }
    ]),
    fraudScoreOverTime: chartJsBarOrLine(timeLabels, [
      {
        label: "Avg fraud score",
        data: avgScoreSeries,
        borderColor: "rgb(220, 38, 38)",
        fill: false
      },
      {
        label: "Max fraud score",
        data: maxScoreSeries,
        borderColor: "rgb(127, 29, 29)",
        fill: false
      }
    ]),
    fraudScoreHistogram: chartJsBarOrLine(bucketLabels, [
      {
        label: "Transactions",
        data: bucketData,
        backgroundColor: "rgba(239, 68, 68, 0.55)"
      }
    ]),
    fraudLogsByStatus:
      logLabels.length > 0
        ? chartJsBarOrLine(logLabels, [
            {
              label: "Fraud log entries",
              data: logData,
              backgroundColor: "rgba(107, 114, 128, 0.6)"
            }
          ])
        : chartJsBarOrLine([], [])
  };
}

/**
 * Compact dashboard payload for cards + small charts.
 */
async function getDashboardStats(userId, query) {
  const { start, end } = parseDateRange(query);
  const match = transactionMatch(userId, start, end);

  const [txSummary, fraudSummary, incomeExpense] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          volume: { $sum: "$amount" }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgFraudScore: { $avg: "$fraudScore" },
          flagged: {
            $sum: {
              $cond: [{ $eq: ["$fraudStatus", "FLAGGED"] }, 1, 0]
            }
          },
          confirmedFraud: {
            $sum: {
              $cond: [{ $eq: ["$fraudStatus", "CONFIRMED_FRAUD"] }, 1, 0]
            }
          }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ])
  ]);

  const t = txSummary[0] || { count: 0, volume: 0 };
  const f = fraudSummary[0] || {
    avgFraudScore: 0,
    flagged: 0,
    confirmedFraud: 0
  };
  const inc =
    incomeExpense.find((x) => x._id === "INCOME")?.total ?? 0;
  const exp =
    incomeExpense.find((x) => x._id === "EXPENSE")?.total ?? 0;

  const granularity = resolveGranularity(query, start, end);
  const pKey = periodKeyExpr(granularity);
  const trendRows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: pKey,
        volume: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);
  const trendMap = new Map(trendRows.map((r) => [r._id, r]));
  const trendLabels = sortPeriodKeys([...trendMap.keys()], granularity);
  const trendVolume = trendLabels.map((l) => trendMap.get(l)?.volume ?? 0);

  return {
    meta: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      granularity
    },
    cards: {
      transactionCount: t.count,
      totalVolume: t.volume,
      totalIncome: inc,
      totalExpense: exp,
      netFlow: inc - exp,
      avgFraudScore: Math.round((f.avgFraudScore || 0) * 1000) / 1000,
      flaggedTransactions: f.flagged,
      confirmedFraudTransactions: f.confirmedFraud
    },
    sparklineVolume: chartJsBarOrLine(trendLabels, [
      {
        label: "Volume",
        data: trendVolume,
        borderColor: "rgb(59, 130, 246)",
        fill: false
      }
    ])
  };
}

/**
 * Admin: coarse platform metrics. Non-admin: 403.
 */
async function getUserAnalytics(userId, query, requestUser) {
  if (!requestUser || requestUser.role !== "ADMIN") {
    const err = new Error("Admin role required");
    err.statusCode = 403;
    throw err;
  }

  const { start, end } = parseDateRange(query);

  const [userCount, txAgg, fraudAgg] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Transaction.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          transactionDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          transactions: { $sum: 1 },
          volume: { $sum: "$amount" }
        }
      }
    ]),
    FraudLog.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          logs: { $sum: 1 },
          avgScore: { $avg: "$fraudScore" }
        }
      }
    ])
  ]);

  const tx = txAgg[0] || { transactions: 0, volume: 0 };
  const fr = fraudAgg[0] || { logs: 0, avgScore: 0 };

  return {
    meta: {
      scope: "platform",
      startDate: start.toISOString(),
      endDate: end.toISOString()
    },
    summary: {
      registeredUsers: userCount,
      transactionsInRange: tx.transactions,
      transactionVolumeInRange: tx.volume,
      fraudLogsInRange: fr.logs,
      avgFraudScoreInLogs: Math.round((fr.avgScore || 0) * 1000) / 1000
    }
  };
}

/**
 * Bundled report for export or single fetch.
 */
async function generateReport(userId, body, requestUser) {
  const q = {
    startDate: body.startDate,
    endDate: body.endDate,
    granularity: body.granularity
  };
  const defaultSections = [
    "incomeVsExpense",
    "transactions",
    "fraud",
    "dashboard"
  ];
  const sections =
    Array.isArray(body.sections) && body.sections.length > 0
      ? body.sections
      : defaultSections;

  const include = (name) => sections.includes(name);

  const out = {
    generatedAt: new Date().toISOString(),
    meta: {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity
    }
  };

  const tasks = [];
  if (include("incomeVsExpense")) {
    tasks.push(
      getIncomeVsExpenseAnalytics(userId, q).then((r) => {
        out.incomeVsExpense = r;
      })
    );
  }
  if (include("transactions")) {
    tasks.push(
      getTransactionAnalytics(userId, q).then((r) => {
        out.transactions = r;
      })
    );
  }
  if (include("fraud")) {
    tasks.push(
      getFraudAnalytics(userId, q).then((r) => {
        out.fraud = r;
      })
    );
  }
  if (include("dashboard")) {
    tasks.push(
      getDashboardStats(userId, q).then((r) => {
        out.dashboard = r;
      })
    );
  }
  if (include("platform") && requestUser?.role === "ADMIN") {
    tasks.push(
      getUserAnalytics(userId, q, requestUser).then((r) => {
        out.platform = r;
      })
    );
  }

  await Promise.all(tasks);
  return out;
}

module.exports = {
  getMonthlyExpense: async (userId) => {
    return Transaction.aggregate([
      { $match: { userId: toObjectId(userId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { month: { $month: "$transactionDate" } },
          total: { $sum: "$amount" }
        }
      }
    ]);
  },
  getTransactionAnalytics,
  getFraudAnalytics,
  getIncomeVsExpenseAnalytics,
  getUserAnalytics,
  getDashboardStats,
  generateReport
};
