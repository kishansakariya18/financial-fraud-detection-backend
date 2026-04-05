/**
 * Requires req.user (use after isValidUser) and role ADMIN.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

module.exports = { requireAdmin };
