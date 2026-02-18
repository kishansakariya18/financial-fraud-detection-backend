const budgetService = require("../services/budget.service");

exports.createBudget = async (req, res) => {
   const budget = await budgetService.createBudget(req.user.id, req.body);
   res.json(budget);
};
