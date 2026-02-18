const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const budgetSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  monthlyLimit: {
    type: Number,
    required: true
  },

  alertThreshold: {
    type: Number,
    default: 80
  },

  month: Number,
  year: Number
});

budgetSchema.index({ userId: 1, month: 1, year: 1 });

budgetSchema.plugin(basePlugin);

module.exports = mongoose.model("Budget", budgetSchema);
