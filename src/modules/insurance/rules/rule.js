import { check } from 'express-validator';
import insuranceDao from '../dao.js';

export const insuranceRules = {
  create: [
    check('insuranceName')
      .notEmpty()
      .withMessage('please enter the insuranceName')
      .bail()
      .custom(async (hsnCode) => {
        return insuranceDao.findByName(hsnCode).then((exists) => {
          if (exists) {
            return Promise.reject('Insurance Name must be unique');
          }
        });
      })
      .withMessage('Insurance Name must be unique'),
  ],

  update: [
    check('insuranceName')
      .notEmpty()
      .withMessage('please enter the insuranceName')
      .bail()
      .custom(async (insuranceName, { req }) => {
        return insuranceDao
          .checkUnique(insuranceName, req.body.id)
          .then((exists) => {
            if (exists) {
              return Promise.reject('Insurance Name must be unique');
            }
          });
      })
      .withMessage('Insurance Name must be unique'),
  ],
};
