const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
// TODO: Import auth middleware when implemented
// const { authenticate } = require('../middleware/auth.middleware');

/**
 * Notification Routes
 * Base path: /api/v1/notifications
 * All routes require authentication
 */

// @route   GET /api/v1/notifications
// @desc    Get all notifications for authenticated user
// @access  Private
router.get('/', notificationController.getUserNotifications);

// @route   GET /api/v1/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', notificationController.getUnreadCount);

// @route   PUT /api/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', notificationController.markAsRead);

// @route   PUT /api/v1/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', notificationController.markAllAsRead);

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
