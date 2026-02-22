const Transaction = require("../models/transaction.model");

exports.create = (data) => Transaction.create(data);

exports.findByUser = (userId, query, options = {}) => {
   const { limit = 10, skip = 0, sort = { transactionDate: -1 } } = options;
   return Transaction.find({ userId, ...query })
      .sort(sort)
      .limit(limit)
      .skip(skip);
};

exports.countByUser = (userId, query) => {
   return Transaction.countDocuments({ userId, ...query });
};

exports.findByID = (transactionId) => {
   return Transaction.findById(transactionId);
};

exports.updateFraudStatus = async (transactionId, fraudStatus) => {
   return await Transaction.findByIdAndUpdate(
      transactionId,
      { fraudStatus },
      { new: true }
   );
};
