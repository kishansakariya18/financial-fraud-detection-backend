const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const notificationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: String,
  message: String,

  type: {
    type: String,
    enum: ["FRAUD_ALERT", "BUDGET_ALERT", "SYSTEM"]
  },

  isRead: {
    type: Boolean,
    default: false
  },

  referenceId: mongoose.Schema.Types.ObjectId
});

notificationSchema.index({ userId: 1, isRead: 1 });

notificationSchema.plugin(basePlugin);

module.exports = mongoose.model("Notification", notificationSchema);
