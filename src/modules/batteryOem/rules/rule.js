import { check } from 'express-validator';
import Dao from '../dao.js';

export const batteryOemRules = {
  create: [
    check('oemName')
      .notEmpty()
      .withMessage('please enter the Oem Name')
      .bail()
      .custom(async (oemName) => {
        return Dao.findByCode(oemName).then((exists) => {
          if (exists) {
            return Promise.reject('Oem name must be unique');
          }
        });
      })
      .withMessage('Oem name must be unique'),
  ],
  update: [
    check('oemName')
      .notEmpty()
      .withMessage('please enter a oemName')
      .bail()
      .custom(async (oemName, { req }) => {
        return Dao.checkUnique(oemName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Oem name must be unique');
          }
        });
      })
      .withMessage('Oem name must be unique'),
  ],
};
