const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../services/auth.service');

// @route   POST /api/v1/auth/register
router.post('/register', authController.register);

// @route   POST /api/v1/auth/login
router.post('/login', authController.login);

// @route   POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// @route   POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// @route   POST /api/v1/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/v1/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
