import { check } from 'express-validator';
import SubDisPositionDao from '../dao.js';

export const subDisPositionRules = {
  create: [
    check('subDisPositionTitle')
      .notEmpty()
      .withMessage('please select the title'),

    check('subDisPositionCode')
      .notEmpty()
      .withMessage('please enter the SubDisPositionCode')
      .bail()
      .custom(async (subDisPositionCode) => {
        return SubDisPositionDao.findBySubDisPositionCode(
          subDisPositionCode
        ).then((exists) => {
          if (exists) {
            return Promise.reject('SubDisPosition Code must be unique');
          }
        });
      })
      .withMessage('SubDisPosition Code must be unique'),
    check('status').notEmpty().withMessage('please select the status'),
  ],

  update: [
    check('subDisPositionTitle')
      .notEmpty()
      .withMessage('please select the SubDisPositionCode'),

    check('subDisPositionCode')
      .notEmpty()
      .withMessage('please enter the SubDisPositionCode')
      .bail()
      .custom(async (subDisPositionCode, { req }) => {
        return SubDisPositionDao.checkUnique(
          subDisPositionCode,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('SubDisPosition Code must be unique');
          }
        });
      })
      .withMessage('SubDisPosition Code must be unique'),
    check('status').notEmpty().withMessage('please select the status'),
  ],
};
