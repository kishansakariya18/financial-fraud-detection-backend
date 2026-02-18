const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["USER", "AUDITOR", "ADMIN"],
    default: "USER"
  },

  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  refreshToken: {
    type: String,
    default: null
  },

  lastLogin: Date
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.plugin(basePlugin);

module.exports = mongoose.model("User", userSchema);
