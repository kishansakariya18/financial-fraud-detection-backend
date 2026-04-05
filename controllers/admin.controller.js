const adminService = require("../services/admin.service");

const getDashboard = async (req, res) => {
  try {
    const result = await adminService.getAdminDashboard(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard
};
