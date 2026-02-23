const transactionRepository = require('../repositories/transaction.repository');
const fraudService = require('./fraud.service');
const { addToFraudQueue } = require('../queues/fraud.queue');

/**
 * Transaction Service
 * Handles transaction business logic
 */

const createTransaction = async (transactionData, userId) => {


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
  const transaction = await transactionRepository.findByID(transactionId);
  return transaction;
};

const getTransactionsByUser = async (userId, filters) => {
  // TODO: Implement get transactions by user logic
  // - Apply filters (date range, amount, status, etc.)
  // - Pagination
  throw new Error('Method not implemented');
};

const getAllTransactions = async (userId, filters) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'transactionDate',
    sortOrder = 'desc',
    startDate,
    endDate,
    minAmount,
    maxAmount,
    type,
    categoryId,
    paymentMethod,
    city,
    country
  } = filters;

  const query = {};

  console.log('startDate', startDate);
  console.log('endDate', endDate);
  

  // Date range filter
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) {
      const start = isNaN(startDate) ? new Date(startDate) : new Date(Number(startDate));
      query.transactionDate.$gte = start.toISOString();
    }
    if (endDate) {
      const end = isNaN(endDate) ? new Date(endDate) : new Date(Number(endDate));
      query.transactionDate.$lte = end.toISOString();
    }
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = Number(minAmount);
    if (maxAmount) query.amount.$lte = Number(maxAmount);
  }

  // Simple equality filters
  if (type) query.type = type;
  if (categoryId) query.categoryId = categoryId;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (city) query['location.city'] = city;
  if (country) query['location.country'] = country;

  // Pagination options
  const skip = (Number(page) - 1) * Number(limit);
  const options = {
    limit: Number(limit),
    skip,
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const [transactions, total] = await Promise.all([
    transactionRepository.findByUser(userId, query, options),
    transactionRepository.countByUser(userId, query)
  ]);

  return {
    data: transactions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
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
