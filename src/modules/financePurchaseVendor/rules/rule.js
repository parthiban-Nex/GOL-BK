import { check } from 'express-validator';

export const financePurchaseVendorRules = {
  create: [
    check('vendorName').notEmpty().withMessage('Vendor name is required'),
  ],
  update: [
    check('id').notEmpty().withMessage('Vendor ID is required'),
    check('vendorName').notEmpty().withMessage('Vendor name is required'),
  ],
  list: [],
};
