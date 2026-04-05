const categoryService = require('../services/category.service');

/**
 * Categories available to the user (system defaults + their own), for transaction UI.
 */
const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getCategoriesForUser(req.user._id);
    res.status(200).json({ categories });
  } catch (error) {
    console.log('error: ', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add a user-owned category (also linked via UserCategory).
 */
const createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    const newCategory = await categoryService.createUserCategory(req.user._id, {
      name,
      type,
      icon
    });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Update only user-created categories (not system defaults).
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon } = req.body;
    const category = await categoryService.updateUserCategory(req.user._id, id, {
      name,
      type,
      icon
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory
};
