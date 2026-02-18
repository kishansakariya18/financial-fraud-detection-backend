/**
 * Models Index
 * Central export point for all database models
 */

const User = require('./user.model');
const Organization = require('./organization.model');
const Transaction = require('./transaction.model');
const Category = require('./category.model');
const FraudLog = require('./fraudLog.model');
const Budget = require('./budget.model');
const Notification = require('./notification.model');
const AuditLog = require('./auditLog.model');
const MLModel = require('./mlModel.model');

module.exports = {
  User,
  Organization,
  Transaction,
  Category,
  FraudLog,
  Budget,
  Notification,
  AuditLog,
  MLModel
};
