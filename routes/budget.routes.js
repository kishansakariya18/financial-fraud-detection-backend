const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
// TODO: Import auth middleware when implemented
// const { authenticate } = require('../middleware/auth.middleware');

/**
 * Budget Routes
 * Base path: /api/v1/budgets
 * All routes require authentication
 */

// @route   POST /api/v1/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', budgetController.createBudget);

module.exports = router;
