import { check } from 'express-validator';
import Dao from '../dao.js';

export const inspectionSubsystemMapRules = {
  create: [
    check('subSystemCode')
      .notEmpty()
      .withMessage('please enter the SubSystem Code')
      .bail()
      .custom(async (subSystemCode) => {
        return Dao.findByCode(subSystemCode).then((exists) => {
          if (exists) {
            return Promise.reject('SubSystem Code must be unique');
          }
        });
      })
      .withMessage('SubSystem Code must be unique'),
  ],
  update: [
    check('subSystemCode')
      .notEmpty()
      .withMessage('please enter the SubSystem Code')
      .bail()
      .custom(async (subSystemCode, { req }) => {
        return Dao.checkUnique(subSystemCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('SubSystem Code must be unique');
          }
        });
      })
      .withMessage('SubSystem Code must be unique'),
  ],
};
