import { check } from 'express-validator';
import disPositionService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';

export const disPositionRules = {
  create: [
    check('title').notEmpty().withMessage('please select a title'),

    check('disPositionCode')
      .notEmpty()
      .withMessage('please enter a disPositionCode')
      .bail()
      .custom(async (disPositionCode) => {
        return disPositionService.findByCode(disPositionCode).then((exists) => {
          if (exists) {
            return Promise.reject('DisPosition Code must be unique');
          }
        });
      })
      .withMessage('DisPosition Code must be unique'),

    check('disPositionType')
      .notEmpty()
      .withMessage('please select a disPositionType'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('title').notEmpty().withMessage('please select a title'),

    check('disPositionCode')
      .notEmpty()
      .withMessage('please enter a code')
      .bail()
      .custom(async (disPositionCode, { req }) => {
        return disPositionService
          .checkUnique(disPositionCode, req.body.id)
          .then((exists) => {
            if (exists) {
              return Promise.reject('DisPosition Code must be unique');
            }
          });
      })
      .withMessage('DisPosition Code must be unique'),

    check('disPositionType')
      .notEmpty()
      .withMessage('please select a disPositionType'),

    check('status').notEmpty().withMessage('please select a status'),
  ],
};
