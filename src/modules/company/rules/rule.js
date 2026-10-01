import { check } from 'express-validator';
import CompanyService from '../service.js';

export const companyRules = {
  create: [
    check('code')
      .notEmpty()
      .withMessage('please enter a code')
      .bail()
      .custom(async (code) => {
        return CompanyService.findByCode(code).then((exists) => {
          if (exists) {
            return Promise.reject('code must be unique');
          }
        });
      })
      .withMessage('code must be unique'),

    check('name')
      .notEmpty()
      .withMessage('please enter a name')
      .bail()
      .custom(async (name) => {
        return CompanyService.findByName(name).then((exists) => {
          if (exists) {
            return Promise.reject('name must be unique');
          }
        });
      })
      .withMessage('name must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('code').notEmpty().withMessage('please enter a code'),

    check('name').notEmpty().withMessage('please enter a name'),
    check('status').notEmpty().withMessage('please select a status'),
  ],
};
