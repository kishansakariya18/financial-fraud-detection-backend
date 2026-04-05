const mongoose = require("mongoose");

/** System defaults; one shared Category document per row (isSystem: true). */
const SYSTEM_CATEGORY_SEED = [
  { name: "Food & Beverage", type: "EXPENSE" },
  { name: "Transportation", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Entertainment", type: "EXPENSE" },
  { name: "Health & Wellness", type: "EXPENSE" },
  { name: "Salary", type: "INCOME" },
  { name: "Investment", type: "INCOME" },
  { name: "Rent & Utilities", type: "EXPENSE" },
  { name: "Others", type: "EXPENSE" }
];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true,
      enum: ["INCOME", "EXPENSE"]
    },

    icon: String,

    /** True for app-wide defaults; false for user-created categories. */
    isSystem: {
      type: Boolean,
      default: false
    },

    /** Set when a user adds their own category (not used for system rows). */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, isSystem: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = {
  Category,
  SYSTEM_CATEGORY_SEED
};
