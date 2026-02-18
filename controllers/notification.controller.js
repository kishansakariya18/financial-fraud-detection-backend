const notificationService = require('../services/notification.service');

/**
 * Notification Controller
 * Handles notification-related HTTP requests
 */

const getUserNotifications = async (req, res) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
