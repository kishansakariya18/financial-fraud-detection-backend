const transactionRepository = require('../repositories/transaction.repository');
const fraudService = require('./fraud.service');
const { addToFraudQueue } = require('../queues/fraud.queue');

/**
 * Transaction Service
 * Handles transaction business logic
 */

const createTransaction = async (transactionData, userId) => {
  // TODO: Implement transaction creation logic
  // - Validate transaction data
  // - Create transaction in database
  // - Trigger fraud detection queue


   const transaction = await transactionRepository.create({
      ...transactionData,
      userId,
      status: "pending"
   });

   await addToFraudQueue(transaction);

   return transaction;
};


const getTransactionById = async (transactionId) => {
  // TODO: Implement get transaction by ID logic
  throw new Error('Method not implemented');
};

const getTransactionsByUser = async (userId, filters) => {
  // TODO: Implement get transactions by user logic
  // - Apply filters (date range, amount, status, etc.)
  // - Pagination
  throw new Error('Method not implemented');
};

const getAllTransactions = async (userId, filters) => {
  // TODO: Implement get all transactions logic
  // - Apply filters
  // - Pagination
  // - Sorting
  const transactions = await transactionRepository.findByUser(userId,filters);
  return transactions;
};

const updateTransaction = async (transactionId, updateData) => {
  // TODO: Implement transaction update logic
  throw new Error('Method not implemented');
};

const getTransactionStats = async (userId, period) => {
  // TODO: Implement transaction statistics logic
  throw new Error('Method not implemented');
};

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByUser,
  getAllTransactions,
  updateTransaction,
  getTransactionStats
};
