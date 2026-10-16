import { check } from 'express-validator';

export const expenseRules = {
  create: [
    check('head').notEmpty().withMessage('Expense head is required'),
    check('type').notEmpty().withMessage('Expense type is required'),
    check('vendor').notEmpty().withMessage('Vendor / payee is required'),
    check('invoiceNo').notEmpty().withMessage('Invoice / reference number is required'),
  ],
  update: [
    check('id').notEmpty().withMessage('Expense id is required'),
    check('head').notEmpty().withMessage('Expense head is required'),
    check('type').notEmpty().withMessage('Expense type is required'),
    check('vendor').notEmpty().withMessage('Vendor / payee is required'),
    check('invoiceNo').notEmpty().withMessage('Invoice / reference number is required'),
  ],
  list: [],
  addPayment: [
    check('expenseId').notEmpty().withMessage('Expense ID is required'),
    check('amount')
      .notEmpty()
      .withMessage('Payment amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Payment amount must be greater than 0'),
    check('paymentMode').notEmpty().withMessage('Payment mode is required'),
  ],
};
