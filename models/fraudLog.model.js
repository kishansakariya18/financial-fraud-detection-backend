const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const fraudLogSchema = new mongoose.Schema({

  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  fraudScore: Number,

  detectedBy: {
    type: String,
    enum: ["ML", "RULE_ENGINE"]
  },

  modelVersion: String,

  reasons: [String],

  status: {
    type: String,
    enum: ["FLAGGED", "REVIEWED", "CONFIRMED", "REJECTED"],
    default: "FLAGGED"
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  reviewedAt: Date
});

fraudLogSchema.index({ transactionId: 1 });
fraudLogSchema.index({ status: 1 });

fraudLogSchema.plugin(basePlugin);

module.exports = mongoose.model("FraudLog", fraudLogSchema);
