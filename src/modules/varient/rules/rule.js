import { check } from 'express-validator';
import varientService from '../service.js';
import Dao from '../dao.js';

export const varientRules = {
  create: [
    check('varientName')
      .notEmpty()
      .withMessage('please enter the varientName')
      .bail()
      .custom(async (varientName) => {
        return varientService.findByvarientName(varientName).then((exists) => {
          if (exists) {
            return Promise.reject('Varient Name must be unique');
          }
        });
      })
      .withMessage('Varient Name must be unique'),
    check('status').notEmpty().withMessage('please select the status'),
    // check('fuelType').notEmpty().withMessage('please select the Fuel Type'),
  ],

  update: [
    check('varientName')
      .notEmpty()
      .withMessage('please enter a varientName')
      .bail()
      .custom(async (varientName, { req }) => {
        return Dao.checkUnique(varientName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Varient Name must be unique');
          }
        });
      })
      .withMessage('Varient Name must be unique'),
    check('status').notEmpty().withMessage('please select the status'),
    // check('fuelType').notEmpty().withMessage('please select the Fuel Type'),
  ],
};
