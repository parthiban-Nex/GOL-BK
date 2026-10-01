import { check } from 'express-validator';
import BinLocationDao from '../dao.js';

export const binLocationRules = {
  create: [
    check('binLocation')
      .notEmpty()
      .withMessage('please enter a binLocation')
      .bail()
      .custom(async (binLocation) => {
        return BinLocationDao.findByBinLocation(binLocation).then((exists) => {
          if (exists) {
            return Promise.reject('binLocation must be unique');
          }
        });
      })
      .withMessage('binLocation must be unique'),
    check('outletCode').notEmpty().withMessage('please select a outletCode'),
  ],
  update: [
    check('binLocation')
      .notEmpty()
      .withMessage('please enter a binLocation')
      .bail()
      .custom(async (binLocation, { req }) => {
        return BinLocationDao.checkUnique(binLocation, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Bin Location Name must be unique');
            }
          }
        );
      })
      .withMessage('Bin Location must be unique'),
    check('outletCode').notEmpty().withMessage('please select a outletCode'),
  ],
};
