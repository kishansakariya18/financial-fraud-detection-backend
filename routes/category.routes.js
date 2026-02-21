const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { isValidUser } = require('../middleware/authMiddleware');

/**
 * Category Routes
 * Base path: /api/v1/categories
 */

// @route   GET /api/v1/categories
// @desc    Get all categories for the user
// @access  Private
router.get('/', isValidUser, categoryController.getCategories);

// @route   POST /api/v1/categories
// @desc    Create a new category
// @access  Private
router.post('/', isValidUser, categoryController.createCategory);

// @route   PUT /api/v1/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', isValidUser, categoryController.updateCategory);

module.exports = router;
