import { check } from 'express-validator';
import UomDao from '../dao.js';

export const UomRules = {
  create: [
    check('uomType')
      .notEmpty()
      .withMessage('please enter the uomType')
      .bail()
      .custom(async (uomType) => {
        return UomDao.findByUomType(uomType).then((exists) => {
          if (exists) {
            return Promise.reject('Uom Type must be unique');
          }
        });
      })
      .withMessage('Uom Type must be unique'),
  ],
  update: [
    check('uomType')
      .notEmpty()
      .withMessage('please enter the uomType')
      .bail()
      .custom(async (uomType, { req }) => {
        return UomDao.checkUnique(uomType, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Uom Type must be unique');
          }
        });
      })
      .withMessage('Uom Type must be unique'),
  ],
};
