import { check } from 'express-validator';
import Dao from '../dao.js';
export const tyreSizeRules = {
  create: [
    check('tyreSize')
      .notEmpty()
      .withMessage('please enter the Tyre Size')
      .bail()
      .custom(async (tyreSize) => {
        return Dao.findByCode(tyreSize).then((exists) => {
          if (exists) {
            return Promise.reject('Tyre Size must be unique');
          }
        });
      })
      .withMessage('Tyre Size must be unique'),
  ],
  update: [
    check('tyreSize')
      .notEmpty()
      .withMessage('please enter the Tyre Size')
      .bail()
      .custom(async (tyreSize, { req }) => {
        return Dao.checkUnique(tyreSize, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Tyre Size must be unique');
          }
        });
      })
      .withMessage('Tyre Size must be unique'),
  ],
};
