import { check } from 'express-validator';
import VehicleInventoryDao from '../dao.js';

export const InventoryCheckListRules = {
  create: [
    check('inventoryCode')
      .notEmpty()
      .withMessage('please enter a inventoryCode')
      .bail()
      .custom(async (inventoryCode) => {
        return VehicleInventoryDao.findByInventoryCode(inventoryCode).then(
          (exists) => {
            if (exists) {
              return Promise.reject('InventoryCode  must be unique');
            }
          }
        );
      })
      .withMessage('InventoryCode  must be unique'),
  ],
  update: [
    check('inventoryCode')
      .notEmpty()
      .withMessage('please enter a inventoryCode')
      .bail()
      .custom(async (inventoryCode, { req }) => {
        return VehicleInventoryDao.findByInventoryCode_Id(
          inventoryCode,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('InventoryCode  must be unique');
          }
        });
      })
      .withMessage('InventoryCode  must be unique'),
  ],
};
