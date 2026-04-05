const { Category, SYSTEM_CATEGORY_SEED } = require("../models/category.model");
const { UserCategory } = require("../models/userCategory.model");

/**
 * Ensures system Category documents exist (idempotent).
 * @returns {Promise<import('mongoose').Document[]>}
 */
const ensureSystemCategories = async () => {
  const categories = [];
  for (const row of SYSTEM_CATEGORY_SEED) {
    let doc = await Category.findOne({ name: row.name, isSystem: true });
    if (!doc) {
      doc = await Category.create({
        name: row.name,
        type: row.type,
        isSystem: true
      });
    }
    categories.push(doc);
  }
  return categories;
};

/**
 * Links a user to every system category via UserCategory.
 */
const assignSystemCategoriesToUser = async (userId) => {
  const systemCats = await ensureSystemCategories();
  const rows = systemCats.map((c) => ({ userId, categoryId: c._id }));
  await UserCategory.insertMany(rows);
};

const normalizeCategoryType = (type) => {
  if (type == null) return null;
  const u = String(type).toUpperCase();
  if (u === "INCOME" || u === "EXPENSE") return u;
  return null;
};

const getCategoriesForUser = async (userId) => {
  const rows = await UserCategory.find({ userId }).populate("categoryId");
  return rows
    .filter((uc) => uc.categoryId)
    .map((uc) => ({
      userCategoryId: uc._id,
      categoryId: uc.categoryId._id,
      name: uc.categoryId.name,
      type: uc.categoryId.type,
      icon: uc.categoryId.icon,
      isSystem: uc.categoryId.isSystem
    }));
};

const createUserCategory = async (userId, { name, type, icon }) => {
  const normalized = normalizeCategoryType(type);
  if (!normalized) {
    const err = new Error("Invalid type; use INCOME or EXPENSE");
    err.statusCode = 400;
    throw err;
  }
  const cat = await Category.create({
    name,
    type: normalized,
    icon,
    isSystem: false,
    createdBy: userId
  });
  await UserCategory.create({ userId, categoryId: cat._id });
  return cat;
};

const updateUserCategory = async (userId, categoryId, { name, type, icon }) => {
  const cat = await Category.findById(categoryId);
  if (!cat || cat.isSystem) {
    const err = new Error("Cannot update system categories");
    err.statusCode = 403;
    throw err;
  }
  if (!cat.createdBy || String(cat.createdBy) !== String(userId)) {
    const err = new Error("Category not found or unauthorized");
    err.statusCode = 404;
    throw err;
  }
  let normalized;
  if (type !== undefined) {
    normalized = normalizeCategoryType(type);
    if (!normalized) {
      const err = new Error("Invalid type; use INCOME or EXPENSE");
      err.statusCode = 400;
      throw err;
    }
  }
  const updates = {
    ...(name !== undefined && { name }),
    ...(normalized !== undefined && { type: normalized }),
    ...(icon !== undefined && { icon })
  };
  return Category.findByIdAndUpdate(categoryId, updates, {
    new: true,
    runValidators: true
  });
};

module.exports = {
  ensureSystemCategories,
  assignSystemCategoriesToUser,
  normalizeCategoryType,
  getCategoriesForUser,
  createUserCategory,
  updateUserCategory
};
