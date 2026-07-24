const { body } = require('express-validator');

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().trim(),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const validateCreateTicket = [
  body('title').notEmpty().trim().isLength({ min: 3 }),
  body('category').notEmpty().trim(),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']),
  body('status').optional().isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
  body('description').optional().trim(),
];

const validateUpdateTicket = [
  body('title').optional().trim().isLength({ min: 3 }),
  body('category').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('status').optional().isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
  body('description').optional().trim(),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTicket,
  validateUpdateTicket,
};
