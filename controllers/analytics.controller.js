const analyticsService = require('../services/analytics.service');

/**
 * Analytics Controller
 * Handles analytics and reporting HTTP requests
 */

const getTransactionAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getTransactionAnalytics(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFraudAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getFraudAnalytics(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getUserAnalytics(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const result = await analyticsService.getDashboardStats(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const generateReport = async (req, res) => {
  try {
    const result = await analyticsService.generateReport(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getTransactionAnalytics,
  getFraudAnalytics,
  getUserAnalytics,
  getDashboardStats,
  generateReport
};
