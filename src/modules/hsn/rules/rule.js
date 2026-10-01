import { check } from 'express-validator';
import HsnService from '../service.js';
import Dao from '../dao.js';

export const hsnRules = {
  create: [
    check('hsnCode')
      .notEmpty()
      .withMessage('please enter the hsnCode')
      .bail()
      .custom(async (hsnCode) => {
        return HsnService.findByCode(hsnCode).then((exists) => {
          if (exists) {
            return Promise.reject('HSN Code must be unique');
          }
        });
      })
      .withMessage('HSN Code must be unique'),

    check('tax').notEmpty().withMessage('please enter the tax'),
  ],

  update: [
    check('hsnCode')
      .notEmpty()
      .withMessage('please enter the hsnCode')
      .bail()
      .custom(async (hsnCode, { req }) => {
        return Dao.checkUnique(hsnCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('HSN Code must be unique');
          }
        });
      })
      .withMessage('HSN Code must be unique'),
  ],
};
