import { check } from 'express-validator';
import Dao from '../dao.js';

export const clickInPartsRules = {
  create: [
    check('clickinPartName')
      .notEmpty()
      .withMessage('please enter the Clickin Part Name')
      .bail()
      .custom(async (clickinPartName) => {
        return Dao.findByCode(clickinPartName).then((exists) => {
          if (exists) {
            return Promise.reject('Clickin Part Name must be unique');
          }
        });
      })
      .withMessage('Clickin Part Name must be unique'),
  ],
  update: [
    check('clickinPartName')
      .notEmpty()
      .withMessage('please enter the Clickin Part Name')
      .bail()
      .custom(async (disPositionCode, { req }) => {
        return Dao.checkUnique(disPositionCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Clickin Part Name must be unique');
          }
        });
      })
      .withMessage('Clickin Part Name must be unique'),
  ],
};
