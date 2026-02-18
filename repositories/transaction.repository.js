const Transaction = require("../models/transaction.model");

exports.create = (data) => Transaction.create(data);

exports.findByUser = (userId, filters) => {
   return Transaction.find({ userId, ...filters });
};

exports.updateFraudStatus = async (transactionId, fraudStatus) => {
   return await Transaction.findByIdAndUpdate(
      transactionId,
      { fraudStatus },
      { new: true }
   );
};
