const fraudService = require('../services/fraud.service');

/**
 * Fraud Controller
 * Handles fraud detection and management HTTP requests
 */

const analyzeTransaction = async (req, res) => {
  try {
    const result = await fraudService.analyzeTransaction(req.params.transactionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFraudAlerts = async (req, res) => {
  try {
    const result = await fraudService.getFraudAlerts(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFraudAlertById = async (req, res) => {
  try {
    const result = await fraudService.getFraudAlertById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateFraudStatus = async (req, res) => {
  try {
    const result = await fraudService.updateFraudStatus(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFraudStatistics = async (req, res) => {
  try {
    const result = await fraudService.getFraudStatistics(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  analyzeTransaction,
  getFraudAlerts,
  getFraudAlertById,
  updateFraudStatus,
  getFraudStatistics
};
