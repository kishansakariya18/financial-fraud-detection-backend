const FraudLog = require('../models/fraudLog.model');

/**
 * Fraud Repository
 * Handles database operations for fraud data
 */

const createAlert = async (alertData) => {
  return await FraudLog.create(alertData);
};

const createFraudLog = async (logData) => {
  return await FraudLog.create(logData);
};

const findAlertById = async (alertId) => {
  return await FraudLog.findById(alertId);
};

const findAlerts = async (filters = {}) => {
  return await FraudLog.find(filters).populate('transactionId userId');
};

const updateAlert = async (alertId, updateData) => {
  return await FraudLog.findByIdAndUpdate(alertId, updateData, { new: true });
};

const updateStatus = async (fraudId, status, reviewerId) => {
  return await FraudLog.findByIdAndUpdate(
    fraudId,
    { 
      status, 
      reviewedBy: reviewerId, 
      reviewedAt: new Date() 
    },
    { new: true }
  ).populate('transactionId');
};

const deleteAlert = async (alertId) => {
  return await FraudLog.findByIdAndUpdate(alertId, { isDeleted: true }, { new: true });
};

const getFraudStats = async (filters = {}) => {
  return await FraudLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$fraudScore' }
      }
    }
  ]);
};

const findByTransactionId = async (transactionId) => {
  return await FraudLog.findOne({ transactionId });
};

module.exports = {
  createAlert,
  createFraudLog,
  findAlertById,
  findAlerts,
  updateAlert,
  updateStatus,
  deleteAlert,
  getFraudStats,
  findByTransactionId
};
