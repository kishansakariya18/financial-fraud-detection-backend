const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { isValidUser } = require('../middleware/authMiddleware');


router.get('/', isValidUser, categoryController.getCategories);
router.post('/', isValidUser, categoryController.createCategory);
router.put('/:id', isValidUser, categoryController.updateCategory);

module.exports = router;
