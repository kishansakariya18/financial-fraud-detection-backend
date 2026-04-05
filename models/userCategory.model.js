const mongoose = require("mongoose");

const userCategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    }
  },
  { timestamps: true }
);

userCategorySchema.index({ userId: 1, categoryId: 1 }, { unique: true });

const UserCategory = mongoose.model("UserCategory", userCategorySchema);

module.exports = { UserCategory };
