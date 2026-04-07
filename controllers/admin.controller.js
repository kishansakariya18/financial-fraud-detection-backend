const adminService = require("../services/admin.service");

const getDashboard = async (req, res) => {
  try {
    const result = await adminService.getAdminDashboard(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await adminService.listUsers(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const result = await adminService.getUserById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById
};
