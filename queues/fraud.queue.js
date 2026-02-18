const amqp = require("amqplib");
const mlService = require("../services/ml.service");
const fraudRepo = require("../repositories/fraud.repository");

// Simplified queue - add transaction to fraud detection queue
exports.addToFraudQueue = async (transaction) => {
   // For now, directly process the transaction
   // TODO: Implement RabbitMQ or Bull queue
   try {
      await exports.consumeFraudCheck(transaction);
   } catch (error) {
      console.error('Error processing fraud check:', error);
   }
};

exports.publishTransaction = async (transaction) => {
   // Send message to RabbitMQ
   // TODO: Implement RabbitMQ publishing
};

exports.consumeFraudCheck = async (transaction) => {
   const mlResult = await mlService.checkFraud(transaction);

   await fraudRepo.createFraudLog({
      transactionId: transaction._id,
      userId: transaction.userId,
      fraudScore: mlResult.score,
      status: mlResult.isFraud ? "FLAGGED" : "SAFE",
      detectedBy: "ML",
      modelVersion: mlResult.modelVersion || "1.0.0"
   });
};

exports.processFraudQueue = async () => {
   // TODO: Implement queue processor
   console.log('Fraud queue processor initialized (placeholder)');
};
