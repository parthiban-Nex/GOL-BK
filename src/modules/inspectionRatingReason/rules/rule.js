import { check } from 'express-validator';
import Dao from '../dao.js';

export const inspectionRaingReasonRules = {
  create: [
    check('ratingReasonCode')
      .notEmpty()
      .withMessage('please enter the Rating Reason Code')
      .bail()
      .custom(async (ratingReasonCode) => {
        return Dao.findByCode(ratingReasonCode).then((exists) => {
          if (exists) {
            return Promise.reject('Rating Reason Code must be unique');
          }
        });
      })
      .withMessage('Rating Reason Code must be unique'),
  ],
  update: [
    check('ratingReasonCode')
      .notEmpty()
      .withMessage('please enter the Rating Reason Code')
      .bail()
      .custom(async (ratingReasonCode, { req }) => {
        return Dao.checkUnique(ratingReasonCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Rating Reason Code must be unique');
          }
        });
      })
      .withMessage('Rating Reason Code must be unique'),
  ],
};
