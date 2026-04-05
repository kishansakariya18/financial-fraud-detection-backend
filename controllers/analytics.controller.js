const analyticsService = require('../services/analytics.service');

const getTransactionAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getTransactionAnalytics(
      req.user._id,
      req.query
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFraudAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getFraudAnalytics(
      req.user._id,
      req.query
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getIncomeVsExpenseAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getIncomeVsExpenseAnalytics(
      req.user._id,
      req.query
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const result = await analyticsService.getUserAnalytics(
      req.user._id,
      req.query,
      req.user
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const result = await analyticsService.getDashboardStats(
      req.user._id,
      req.query
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const generateReport = async (req, res) => {
  try {
    const result = await analyticsService.generateReport(
      req.user._id,
      req.body || {},
      req.user
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getTransactionAnalytics,
  getFraudAnalytics,
  getIncomeVsExpenseAnalytics,
  getUserAnalytics,
  getDashboardStats,
  generateReport
};
