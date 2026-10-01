import { check } from 'express-validator';
import Dao from '../dao.js';

export const tyreOemRules = {
  create: [
    check('oemName')
      .notEmpty()
      .withMessage('please enter the OemName')
      .bail()
      .custom(async (oemName) => {
        return Dao.findByCode(oemName).then((exists) => {
          if (exists) {
            return Promise.reject('Oem Name must be unique');
          }
        });
      })
      .withMessage('Oem Name must be unique'),
  ],
  update: [
    check('oemName')
      .notEmpty()
      .withMessage('please enter the OemName')
      .bail()
      .custom(async (oemName, { req }) => {
        return Dao.checkUnique(oemName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('OemName must be unique');
          }
        });
      })
      .withMessage('OemName must be unique'),
  ],
};
