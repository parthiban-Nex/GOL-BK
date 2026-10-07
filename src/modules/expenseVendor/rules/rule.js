import { check } from 'express-validator';

export const expenseVendorRules = {
  create: [
    check('vendorName')
      .custom((value, { req }) => {
        const name = value || req.body.name;
        if (!name || !name.trim()) {
          throw new Error('Vendor name is required');
        }
        return true;
      }),
  ],
  list: [],
};
