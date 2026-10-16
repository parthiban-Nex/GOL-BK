import { check } from 'express-validator';

export const bankDepositRules = {
  create: [
    check('bankName').notEmpty().withMessage('Bank name is required'),
    check('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    check('depositMode').notEmpty().withMessage('Deposit mode is required'),
    check('branch').optional().isString().trim(),
  ],
  update: [
    check('id').notEmpty().withMessage('Deposit ID is required'),
    check('bankName').optional().notEmpty().withMessage('Bank name cannot be empty'),
    check('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    check('branch').optional().isString().trim(),
  ],
  getById: [
    check('id').notEmpty().withMessage('Deposit ID is required'),
  ],
  delete: [
    check('id').notEmpty().withMessage('Deposit ID is required'),
  ],
};
