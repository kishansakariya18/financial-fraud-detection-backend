const Notification = require("../models/notification.model");

exports.sendFraudAlert = async (userId, transactionId) => {
   return Notification.create({
      userId,
      type: "FRAUD_ALERT",
      referenceId: transactionId
   });
};
