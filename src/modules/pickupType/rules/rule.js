import { check } from 'express-validator';
import PickupDao from '../dao.js';

export const pickupTypeRules = {
  create: [
    check('pickupType')
      .notEmpty()
      .withMessage('please enter a Item Code')
      .bail()
      .custom(async (pickupType) => {
        return PickupDao.findByPickupType(pickupType).then((exists) => {
          if (exists) {
            return Promise.reject('pickupType  must be unique');
          }
        });
      })
      .withMessage('pickupType  must be unique'),
  ],
  update: [
    check('pickupType')
      .notEmpty()
      .withMessage('please enter a Item Code')
      .bail()
      .custom(async (pickupType) => {
        return PickupDao.findByPickupType(pickupType).then((exists) => {
          if (exists) {
            return Promise.reject('pickupType  must be unique');
          }
        });
      })
      .withMessage('pickupType  must be unique'),
  ],
};
