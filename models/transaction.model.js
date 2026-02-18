const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const transactionSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  type: {
    type: String,
    enum: ["INCOME", "EXPENSE"],
    required: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["UPI", "CARD", "CASH", "NET_BANKING", "WALLET"]
  },

  description: String,

  transactionDate: {
    type: Date,
    required: true
  },

  location: {
    city: String,
    country: String
  },

  fraudStatus: {
    type: String,
    enum: ["PENDING", "SAFE", "FLAGGED", "CONFIRMED_FRAUD"],
    default: "PENDING"
  },

  fraudScore: {
    type: Number,
    default: 0
  },

  mlModelVersion: String
});

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ fraudStatus: 1 });

transactionSchema.plugin(basePlugin);

module.exports = mongoose.model("Transaction", transactionSchema);
