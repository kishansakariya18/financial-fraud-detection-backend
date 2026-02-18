const Transaction = require("../models/transaction.model");

exports.getMonthlyExpense = async (userId) => {

   return Transaction.aggregate([
      { $match: { userId } },
      {
         $group: {
            _id: { month: { $month: "$transactionDate" } },
            total: { $sum: "$amount" }
         }
      }
   ]);
};
