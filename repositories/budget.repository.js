const Budget = require('../models/budget.model');

/**
 * Budget Repository
 * Handles database operations for budget data
 */

const create = async (budgetData) => {
  return await Budget.create(budgetData);
};

const findById = async (budgetId) => {
  return await Budget.findById(budgetId);
};

const findByUserId = async (userId) => {
  return await Budget.find({ userId, isDeleted: false });
};

const update = async (budgetId, updateData) => {
  return await Budget.findByIdAndUpdate(budgetId, updateData, { new: true });
};

const deleteBudget = async (budgetId) => {
  return await Budget.findByIdAndUpdate(budgetId, { isDeleted: true }, { new: true });
};

const findActiveBudgets = async (userId) => {
  return await Budget.find({ userId, isDeleted: false });
};

module.exports = {
  create,
  findById,
  findByUserId,
  update,
  deleteBudget,
  findActiveBudgets
};
