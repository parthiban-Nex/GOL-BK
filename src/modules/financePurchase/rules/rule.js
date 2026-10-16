import { check } from 'express-validator';

export const financePurchaseRules = {
  create: [
    check('vendor').notEmpty().withMessage('Vendor is required'),
    check('invoiceNo').notEmpty().withMessage('Invoice number is required'),
  ],
  update: [
    check('id').notEmpty().withMessage('Purchase ID is required'),
    check('vendor').notEmpty().withMessage('Vendor is required'),
    check('invoiceNo').notEmpty().withMessage('Invoice number is required'),
  ],
  list: [],
  addPayment: [
    check('purchaseId').notEmpty().withMessage('Purchase ID is required'),
    check('amount')
      .notEmpty()
      .withMessage('Payment amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Payment amount must be greater than 0'),
    check('paymentMode').notEmpty().withMessage('Payment mode is required'),
  ],
};
