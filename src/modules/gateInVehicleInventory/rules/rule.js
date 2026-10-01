import { check } from 'express-validator';
import VehicleInventoryDao from '../dao.js';

export const VehicleInventoryRules = {
  create: [
    check('label')
      .notEmpty()
      .withMessage('please enter a label')
      .bail()
      .custom(async (label) => {
        return VehicleInventoryDao.findByName(label).then((exists) => {
          if (exists) {
            return Promise.reject('Label  must be unique');
          }
        });
      })
      .withMessage('Label  must be unique'),
  ],
  update: [
    check('label')
      .notEmpty()
      .withMessage('please enter a label')
      .bail()
      .custom(async (label, { req }) => {
        return VehicleInventoryDao.findByName_Id(label, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Label  must be unique');
            }
          }
        );
      })
      .withMessage('Label  must be unique'),
  ],
};
