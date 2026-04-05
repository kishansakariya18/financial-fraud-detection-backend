const Transaction = require("../models/transaction.model");

exports.create = (data) => Transaction.create(data);

exports.findByUser = (userId, query, options = {}) => {
   const {
      limit = 10,
      skip = 0,
      sort = { transactionDate: -1 },
      populateCategory = false
   } = options;
   let q = Transaction.find({ userId, ...query })
      .sort(sort)
      .limit(limit)
      .skip(skip);
   if (populateCategory) {
      q = q.populate({
         path: "categoryId",
         select: "name type icon isSystem"
      });
   }
   return q;
};

exports.countByUser = (userId, query) => {
   return Transaction.countDocuments({ userId, ...query });
};

exports.findByID = (transactionId) => {
   return Transaction.findById(transactionId);
};

exports.updateFraudStatus = async (transactionId, fraudStatus, fraudScore) => {
   return await Transaction.findByIdAndUpdate(
      transactionId,
      { fraudStatus, fraudScore },
      { new: true }
   );
};
