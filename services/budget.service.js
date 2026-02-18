const budgetRepo = require("../repositories/budget.repository");

exports.createBudget = (userId, data) => {
   return budgetRepo.create({
      ...data,
      userId
   });
};
