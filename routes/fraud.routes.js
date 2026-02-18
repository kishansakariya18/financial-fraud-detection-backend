const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraud.controller');
// TODO: Import auth middleware when implemented
// const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Fraud Detection Routes
 * Base path: /api/v1/fraud
 * All routes require authentication
 */

// @route   PUT /api/v1/fraud/review/:id
// @desc    Review and update fraud alert status
// @access  Private (Admin/Auditor only)
// router.put('/review/:id', fraudController.reviewFraud);

module.exports = router;
