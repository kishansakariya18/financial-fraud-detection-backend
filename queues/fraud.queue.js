const { getChannel } = require('../utils/rabbitmq');
const mlService = require("../services/ml.service");
const fraudRepo = require("../repositories/fraud.repository");
const transactionRepo = require("../repositories/transaction.repository");

const QUEUE_NAME = 'fraud_tasks';

exports.addToFraudQueue = async (transaction) => {
   try {
      const channel = getChannel();
      const message = JSON.stringify(transaction);
      
      channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
         persistent: true
      });
      
      console.log(`[x] Sent transaction ${transaction._id} to fraud queue`);
   } catch (error) {
      console.error('Error adding to fraud queue:', error);
      // Fallback: process immediately if queue fails
      await exports.consumeFraudCheck(transaction);
   }
};

exports.publishTransaction = async (transaction) => {
   return exports.addToFraudQueue(transaction);
};

exports.consumeFraudCheck = async (transaction) => {
   try {
      console.log(`[.] Processing fraud check for transaction ${transaction._id}`);
      const mlResult = await mlService.checkFraud(transaction);

      // Create fraud log
      await fraudRepo.createFraudLog({
         transactionId: transaction._id,
         userId: transaction.userId,
         fraudScore: mlResult.score,
         status: mlResult.isFraud ? "FLAGGED" : "SAFE",
         detectedBy: "ML",
         modelVersion: mlResult.modelVersion || "1.0.0"
      });

      // Update transaction status
      await transactionRepo.updateFraudStatus(
         transaction._id,
         mlResult.isFraud ? "FLAGGED" : "SAFE"
      );
      
      console.log(`[√] Fraud check complete for transaction ${transaction._id}: ${mlResult.isFraud ? "FLAGGED" : "SAFE"}`);
   } catch (error) {
      console.error('Error in consumeFraudCheck:', error);
      throw error;
   }
};

exports.processFraudQueue = async () => {
   try {
      const channel = getChannel();
      
      // Ensure queue exists
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      // Process one message at a time
      channel.prefetch(1);
      
      console.log(`[*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);
      
      channel.consume(QUEUE_NAME, async (msg) => {
         if (msg !== null) {
            try {
               const transaction = JSON.parse(msg.content.toString());
               
               await exports.consumeFraudCheck(transaction);
               
               // Acknowledge the message
               channel.ack(msg);
            } catch (error) {
               console.error('[!] Error processing message:', error);
               // Requeue the message if it failed
               // channel.nack(msg, false, true);
               
               // For now, ack it to avoid infinite loops on bad data
               channel.ack(msg);
            }
         }
      }, {
         // Manual acknowledgment
         noAck: false
      });
   } catch (error) {
      console.error('Failed to start fraud queue processor:', error);
   }
};
