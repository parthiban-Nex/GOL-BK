import { check } from 'express-validator';
import Dao from '../dao.js';
export const vehiclePreDeliveryCheckListRules = {
  create: [
    check('vehiclePdcCode')
      .notEmpty()
      .withMessage('please enter the Vehicle PDC Code')
      .bail()
      .custom(async (vehiclePdcCode) => {
        return Dao.findByCode(vehiclePdcCode).then((exists) => {
          if (exists) {
            return Promise.reject('Vehicle PDC Code must be unique');
          }
        });
      })
      .withMessage('Vehicle PDC Code must be unique'),
  ],
  update: [
    check('vehiclePdcCode')
      .notEmpty()
      .withMessage('please enter the Vehicle PDC Code')
      .bail()
      .custom(async (vehiclePdcCode, { req }) => {
        return Dao.checkUnique(vehiclePdcCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Vehicle PDC Code must be unique');
          }
        });
      })
      .withMessage('Vehicle PDC Code must be unique'),
  ],
};
