const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
// TODO: Import auth middleware when implemented
// const { authenticate } = require('../middleware/auth.middleware');

/**
 * Transaction Routes
 * Base path: /api/v1/transactions
 * All routes require authentication
 */

// @route   POST /api/v1/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', transactionController.createTransaction);

// @route   GET /api/v1/transactions
// @desc    Get all transactions (with filters)
// @access  Private
router.get('/', transactionController.getAllTransactions);

// @route   GET /api/v1/transactions/user
// @desc    Get transactions for authenticated user
// @access  Private
router.get('/user', transactionController.getTransactionsByUser);

// @route   GET /api/v1/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', transactionController.getTransactionById);

// @route   PUT /api/v1/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', transactionController.updateTransaction);

module.exports = router;
