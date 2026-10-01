import { check } from 'express-validator';
import ItemCategorieService from '../service.js';

export const itemCategorieRules = {
  create: [
    check('itemCategorie')
      .notEmpty()
      .withMessage('please enter a itemCategorie')
      .bail()
      .custom(async (itemCategorie) => {
        return ItemCategorieService.findByCode(itemCategorie).then((exists) => {
          if (exists) {
            return Promise.reject('itemCategorie must be unique');
          }
        });
      })
      .withMessage('itemCategorie must be unique'),

    check('itemCategorieDescription')
      .notEmpty()
      .withMessage('please enter a itemCategorieDescription'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('itemCategorie')
      .notEmpty()
      .withMessage('please enter a itemCategorie')
      .bail()
      .custom(async (itemCategorie, { req }) => {
        return ItemCategorieService.findByCode_Id(
          itemCategorie,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('itemCategorie must be unique');
          }
        });
      })
      .withMessage('itemCategorie must be unique'),
    check('itemCategorieDescription')
      .notEmpty()
      .withMessage('please enter a itemCategorieDescription'),
    check('status').notEmpty().withMessage('please select a status'),
  ],
};
