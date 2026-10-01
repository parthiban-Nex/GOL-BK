import { check } from 'express-validator';
import Dao from '../dao.js';

export const inspectionCheckListRules = {
  getGrouped: [
    check('checkListTypeCode')
      .isString()
      .withMessage('checkListTypeCode must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('please enter the checkListTypeCode'),
  ],
  create: [
    check('paramCode')
      .notEmpty()
      .withMessage('please enter the paramCode')
      .bail()
      .custom(async (paramCode) => {
        return Dao.findByCode(paramCode).then((exists) => {
          if (exists) {
            return Promise.reject('ParamCode must be unique');
          }
        });
      })
      .withMessage('ParamCode must be unique'),
  ],
  update: [
    check('paramCode')
      .notEmpty()
      .withMessage('please enter the paramCode')
      .bail()
      .custom(async (paramCode, { req }) => {
        return Dao.checkUnique(paramCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('ParamCode Code must be unique');
          }
        });
      })
      .withMessage('ParamCode Code must be unique'),
  ],
};
