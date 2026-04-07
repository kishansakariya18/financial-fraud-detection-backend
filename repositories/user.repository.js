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

/**
 * Paginated user list for admin (password and refreshToken excluded).
 */
const listUsersPaginated = async ({
  filter = {},
  page = 1,
  limit = 20,
  sort = { createdAt: -1 }
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .select("-password -refreshToken")
      .lean(),
    User.countDocuments(filter)
  ]);
  return {
    users,
    total,
    page: Number(page),
    limit: safeLimit
  };
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
  listUsersPaginated,
  updateRefreshToken,
  clearRefreshToken
};
