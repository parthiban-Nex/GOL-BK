import { check } from 'express-validator';
import CheckListTypeDao from '../dao.js';

export const checkListTypeRules = {
  create: [
    check('checkListTypeCode')
      .notEmpty()
      .withMessage('please enter the CheckList Type Code')
      .bail()
      .custom(async (checkListTypeCode) => {
        return CheckListTypeDao.findByCheckListCode(checkListTypeCode).then(
          (exists) => {
            if (exists) {
              return Promise.reject('CheckList Type Code must be unique');
            }
          }
        );
      })
      .withMessage('CheckList Type Code must be unique'),
  ],
  update: [
    check('checkListTypeCode')
      .notEmpty()
      .withMessage('please enter the CheckList Type Code')
      .bail()
      .custom(async (checkListTypeCode, { req }) => {
        return CheckListTypeDao.checkUnique(
          checkListTypeCode,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('CheckList Type Code must be unique');
          }
        });
      })
      .withMessage('CheckList Type Code must be unique'),
  ],
};
