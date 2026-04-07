const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { isValidUser } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

/**
 * Admin panel API — requires JWT and role ADMIN.
 * Base: /api/v1/admin
 */

router.get(
  "/dashboard",
  isValidUser,
  requireAdmin,
  adminController.getDashboard
);

router.get("/users", isValidUser, requireAdmin, adminController.getUsers);

router.get("/users/:id", isValidUser, requireAdmin, adminController.getUserById);

module.exports = router;
