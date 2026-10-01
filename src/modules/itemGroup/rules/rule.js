import { check } from 'express-validator';
import ItemGroupService from '../service.js';

export const itemGroupRules = {
  create: [
    check('itemGroupCode')
      .notEmpty()
      .withMessage('Please Enter a itemGroupCode')
      .bail()
      .custom(async (itemGroupCode) => {
        return ItemGroupService.findByCode(itemGroupCode).then((exists) => {
          if (exists) {
            return Promise.reject('ItemGroupCode must be unique');
          }
        });
      })
      .withMessage('ItemGroupCode must be unique'),

    check('itemGroupDescription')
      .notEmpty()
      .withMessage('please enter a itemGroupDescription'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('itemGroupCode')
      .notEmpty()
      .withMessage('Please Enter a itemGroupCode')
      .bail()
      .custom(async (itemGroupCode, { req }) => {
        return ItemGroupService.findByCode_Id(itemGroupCode, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('ItemGroupCode must be unique');
            }
          }
        );
      })
      .withMessage('ItemGroupCode must be unique'),

    check('itemGroupDescription')
      .notEmpty()
      .withMessage('please enter a itemGroupDescription'),
    check('status').notEmpty().withMessage('please select a status'),
  ],
};
