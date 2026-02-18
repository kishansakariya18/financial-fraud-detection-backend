const fraudRepo = require("../repositories/fraud.repository");
const transactionRepo = require("../repositories/transaction.repository");

exports.reviewFraud = async (fraudId, data, reviewerId) => {

   const fraudLog = await fraudRepo.updateStatus(
      fraudId,
      data.status,
      reviewerId
   );

   if (data.status === "CONFIRMED") {
      await transactionRepo.updateFraudStatus(
         fraudLog.transactionId,
         "CONFIRMED_FRAUD"
      );
   }

   return fraudLog;
};
