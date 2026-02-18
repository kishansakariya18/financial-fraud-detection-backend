const User = require('../models/user.model');

/**
 * User Repository
 * Handles database operations for user data
 */

const create = async (userData) => {
  return await User.create(userData);
};

const findById = async (userId) => {
  return await User.findById(userId);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const update = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

const deleteUser = async (userId) => {
  return await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
};

const findAll = async (filters = {}) => {
  return await User.find({ ...filters, isDeleted: false });
};

const updateRefreshToken = async (userId, refreshToken) => {
  return await User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
};

const clearRefreshToken = async (userId) => {
  return await User.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });
};

module.exports = {
  create,
  findById,
  findByEmail,
  update,
  deleteUser,
  findAll,
  updateRefreshToken,
  clearRefreshToken
};
