const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
// TODO: Import auth middleware when implemented
// const { authenticate } = require('../middleware/auth.middleware');

/**
 * Analytics Routes
 * Base path: /api/v1/analytics
 * All routes require authentication
 */

// @route   GET /api/v1/analytics/transactions
// @desc    Get transaction analytics
// @access  Private
router.get('/transactions', analyticsController.getTransactionAnalytics);

// @route   GET /api/v1/analytics/fraud
// @desc    Get fraud detection analytics
// @access  Private
router.get('/fraud', analyticsController.getFraudAnalytics);

// @route   GET /api/v1/analytics/users
// @desc    Get user analytics
// @access  Private (Admin only)
router.get('/users', analyticsController.getUserAnalytics);

// @route   GET /api/v1/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', analyticsController.getDashboardStats);

// @route   POST /api/v1/analytics/report
// @desc    Generate custom report
// @access  Private
router.post('/report', analyticsController.generateReport);

module.exports = router;
