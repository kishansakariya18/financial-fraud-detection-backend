const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { isValidUser } = require('../middleware/authMiddleware');

/**
 * Analytics Routes
 * Base path: /api/v1/analytics
 * All routes require authentication
 */

router.get(
  '/income-vs-expense',
  isValidUser,
  analyticsController.getIncomeVsExpenseAnalytics
);

router.get(
  '/transactions',
  isValidUser,
  analyticsController.getTransactionAnalytics
);

router.get('/fraud', isValidUser, analyticsController.getFraudAnalytics);

router.get('/users', isValidUser, analyticsController.getUserAnalytics);

router.get('/dashboard', isValidUser, analyticsController.getDashboardStats);

router.post('/report', isValidUser, analyticsController.generateReport);

module.exports = router;
