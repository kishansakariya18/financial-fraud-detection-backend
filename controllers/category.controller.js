const { Category, TRANSACTION_CATEGORIES } = require('../models/category.model');

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ 
      $or: [
        { createdBy: req.user.id },
        { createdBy: { $exists: false } } // System default categories if any
      ]
    });
    
    res.status(200).json({
      categories
    });
  } catch (error) {
    console.log('error: ', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new category
 */
const createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    
    const newCategory = new Category({
      name,
      type,
      icon,
      createdBy: req.user.id
    });
    
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a category
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon } = req.body;
    
    const category = await Category.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      { name, type, icon },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory
};
