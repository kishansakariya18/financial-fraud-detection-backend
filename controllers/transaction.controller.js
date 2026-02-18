const transactionService = require('../services/transaction.service');

/**
 * Transaction Controller
 * Handles transaction-related HTTP requests
 */

const createTransaction = async (req, res) => {
  try {
    const result = await transactionService.createTransaction(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const result = await transactionService.getTransactionById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTransactionsByUser = async (req, res) => {
  try {
    const result = await transactionService.getTransactionsByUser(req.user.id, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const result = await transactionService.getAllTransactions(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const result = await transactionService.updateTransaction(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByUser,
  getAllTransactions,
  updateTransaction
};
