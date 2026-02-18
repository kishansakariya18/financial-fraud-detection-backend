const mongoose = require("mongoose");

const mlModelSchema = new mongoose.Schema({

  modelName: String,
  version: String,

  trainingDatasetSize: Number,
  accuracy: Number,

  deployedAt: Date,

  isActive: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("MLModel", mlModelSchema);
