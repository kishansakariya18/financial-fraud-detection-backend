const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const FraudLog = require("../models/fraudLog.model");
const User = require("../models/user.model");
const userRepository = require("../repositories/user.repository");

function parseAdminDateRange(query) {
  const end = query.endDate ? new Date(query.endDate) : new Date();
  let start;
  if (query.startDate) {
    start = new Date(query.startDate);
  } else {
    start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - 30);
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

/** UTC calendar days from start through end (inclusive), YYYY-MM-DD */
function eachDayLabel(start, end) {
  const labels = [];
  const cur = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  const endDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  );
  while (cur <= endDay) {
    labels.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return labels;
}

function chartJs(labels, datasets) {
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
 * Admin home dashboard: KPIs + chart-ready series for the selected period.
 */
async function getAdminDashboard(query) {
  const { start, end } = parseAdminDateRange(query);
  const dayLabels = eachDayLabel(start, end);

  const txMatch = {
    isDeleted: { $ne: true },
    transactionDate: { $gte: start, $lte: end }
  };

  const fraudLogMatch = {
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lte: end }
  };

  const [
    totalUsers,
    totalTransactions,
    volumeAgg,
    fraudLogCount,
    flaggedTxCount,
    txPerDay,
    fraudFromTxPerDay,
    fraudLogsPerDay,
    activeUsersPerDay
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Transaction.countDocuments(txMatch),
    Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0]
            }
          }
        }
      }
    ]),
    FraudLog.countDocuments(fraudLogMatch),
    Transaction.countDocuments({
      ...txMatch,
      fraudStatus: { $in: ["FLAGGED", "CONFIRMED_FRAUD"] }
    }),
    Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
          },
          count: { $sum: 1 },
          volume: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
          },
          avgFraudScore: { $avg: "$fraudScore" },
          flaggedCount: {
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
      },
      { $sort: { _id: 1 } }
    ]),
    FraudLog.aggregate([
      { $match: fraudLogMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          fraudAlerts: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
            },
            userId: "$userId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.day",
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const vol = volumeAgg[0] || {
    totalVolume: 0,
    totalIncome: 0,
    totalExpense: 0
  };

  const txDayMap = new Map(txPerDay.map((r) => [r._id, r]));
  const fraudTxDayMap = new Map(fraudFromTxPerDay.map((r) => [r._id, r]));
  const fraudLogDayMap = new Map(fraudLogsPerDay.map((r) => [r._id, r]));
  const activeMap = new Map(activeUsersPerDay.map((r) => [r._id, r]));

  const txCountData = dayLabels.map((d) => txDayMap.get(d)?.count ?? 0);
  const txVolumeData = dayLabels.map((d) => txDayMap.get(d)?.volume ?? 0);

  const avgFraudScoreData = dayLabels.map((d) => {
    const v = fraudTxDayMap.get(d)?.avgFraudScore;
    return v == null ? 0 : Math.round(v * 1000) / 1000;
  });
  const flaggedPerDayData = dayLabels.map(
    (d) => fraudTxDayMap.get(d)?.flaggedCount ?? 0
  );
  const fraudAlertsPerDayData = dayLabels.map(
    (d) => fraudLogDayMap.get(d)?.fraudAlerts ?? 0
  );
  const activeUsersData = dayLabels.map(
    (d) => activeMap.get(d)?.activeUsers ?? 0
  );

  return {
    meta: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      chartHint: "chartjs",
      description:
        "KPIs: users are lifetime total; other headline numbers are for the selected date range. Charts use daily buckets (zeros filled)."
    },
    kpis: {
      totalUsers,
      totalTransactions,
      fraudCases: fraudLogCount,
      highRiskTransactions: flaggedTxCount,
      revenueVolume: {
        total: vol.totalVolume,
        income: vol.totalIncome,
        expense: vol.totalExpense,
        net: vol.totalIncome - vol.totalExpense
      }
    },
    charts: {
      transactionsPerDay: chartJs(dayLabels, [
        {
          label: "Transactions",
          data: txCountData,
          backgroundColor: "rgba(59, 130, 246, 0.55)",
          borderColor: "rgb(37, 99, 235)"
        }
      ]),
      transactionVolumePerDay: chartJs(dayLabels, [
        {
          label: "Volume (sum of amounts)",
          data: txVolumeData,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          fill: true
        }
      ]),
      fraudTrends: chartJs(dayLabels, [
        {
          label: "Avg fraud score (transactions)",
          data: avgFraudScoreData,
          borderColor: "rgb(220, 38, 38)",
          fill: false
        },
        {
          label: "High-risk tx (flagged + confirmed)",
          data: flaggedPerDayData,
          backgroundColor: "rgba(249, 115, 22, 0.35)",
          borderColor: "rgb(234, 88, 12)"
        },
        {
          label: "Fraud alerts (new logs)",
          data: fraudAlertsPerDayData,
          borderColor: "rgb(127, 29, 29)",
          fill: false
        }
      ]),
      activeUsers: chartJs(dayLabels, [
        {
          label: "Active users (distinct, ≥1 txn)",
          data: activeUsersData,
          backgroundColor: "rgba(139, 92, 246, 0.45)",
          borderColor: "rgb(109, 40, 217)"
        }
      ])
    }
  };
}

/**
 * Paginated user list (admin). Query: page, limit, search, role, isActive, sortBy, sortOrder.
 */
async function listUsers(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

  const filter = { isDeleted: { $ne: true } };
  const role = query.role;
  if (role && ["USER", "AUDITOR", "ADMIN"].includes(String(role).toUpperCase())) {
    filter.role = String(role).toUpperCase();
  }
  if (query.isActive === "true") filter.isActive = true;
  if (query.isActive === "false") filter.isActive = false;

  if (query.search && String(query.search).trim()) {
    const s = String(query.search).trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } }
    ];
  }

  let sortField = "createdAt";
  if (query.sortBy === "email") sortField = "email";
  else if (query.sortBy === "name") sortField = "name";
  else if (query.sortBy === "role") sortField = "role";

  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const { users, total, page: p, limit: l } =
    await userRepository.listUsersPaginated({
      filter,
      page,
      limit,
      sort
    });

  return {
    data: users,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 0
    }
  };
}

/**
 * Single user for admin (no password / refresh token). Organization populated when present.
 */
async function getUserById(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error("Invalid user id");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true }
  })
    .select("-password -refreshToken")
    .populate("organizationId", "name industryType contactEmail address")
    .lean();

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return { user };
}

module.exports = {
  getAdminDashboard,
  parseAdminDateRange,
  listUsers,
  getUserById
};
