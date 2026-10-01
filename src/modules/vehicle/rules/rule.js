import { check } from 'express-validator';
import VehicleDao from '../dao.js';

export const vehicleRules = {
  create: [
    check('customerId').notEmpty().withMessage('please select the customer'),
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber) => {
        return VehicleDao.findByRegistrationNumber(registrationNumber).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Registration Number must be unique');
            }
          }
        );
      })
      .withMessage('Registration Number must be unique'),
    check('makeId').notEmpty().withMessage('please select the make'),
    check('modelId').notEmpty().withMessage('please select the model'),
    check('variantId').notEmpty().withMessage('please select the variant'),
    check('fuelType').notEmpty().withMessage('please select the fuelType'),
    check('odometer').notEmpty().withMessage('please enter the odometer'),
    check('chassisNumber')
      .notEmpty()
      .withMessage('please enter the chassisNumber')
      .bail()
      .custom(async (chassisNumber) => {
        return VehicleDao.findByChassisNumber(chassisNumber).then((exists) => {
          if (exists) {
            return Promise.reject('Chassis Number must be unique');
          }
        });
      })
      .withMessage('Chassis Number must be unique'),
    check('engineNumber')
      .notEmpty()
      .withMessage('please enter the Engine Number')
      .bail()
      .custom(async (engineNumber) => {
        return VehicleDao.findByEngineNumber(engineNumber).then((exists) => {
          if (exists) {
            return Promise.reject('Engine Number must be unique');
          }
        });
      })
      .withMessage('Engine Number must be unique'),
    check('color').notEmpty().withMessage('please select the color'),
    check('status').notEmpty().withMessage('please select the status'),
  ],
  update: [
    check('customerId').notEmpty().withMessage('please select the customer'),
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber, { req }) => {
        return VehicleDao.checkUnique(registrationNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Registration Number must be unique');
            }
          }
        );
      })
      .withMessage('Registration Number must be unique'),
    check('makeId').notEmpty().withMessage('please select the make'),
    check('modelId').notEmpty().withMessage('please select the model'),
    check('variantId').notEmpty().withMessage('please select the variant'),
    check('fuelType').notEmpty().withMessage('please select the fuel type'),
    check('odometer').notEmpty().withMessage('please enter the odometer'),
    check('chassisNumber')
      .notEmpty()
      .withMessage('please enter the Chassis Number')
      .bail()
      .custom(async (chassisNumber, { req }) => {
        return VehicleDao.checkUniqueForChassisNumber(
          chassisNumber,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('Chassis Number must be unique');
          }
        });
      })
      .withMessage('Chassis Number must be unique'),
    check('engineNumber')
      .notEmpty()
      .withMessage('please enter the Engine Number')
      .bail()
      .custom(async (engineNumber, { req }) => {
        return VehicleDao.checkUniqueForEngineNumber(
          engineNumber,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('Engine Number must be unique');
          }
        });
      })
      .withMessage('Engine Number must be unique'),
    check('color').notEmpty().withMessage('please select the color'),
    check('status').notEmpty().withMessage('please select the status'),
  ],
  
  createM: [
    check('customerId').notEmpty().withMessage('please select the customer'),
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber) => {
        return VehicleDao.findByRegistrationNumber(registrationNumber).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Registration Number must be unique');
            }
          }
        );
      })
      .withMessage('Registration Number must be unique'),
    check('makeId').notEmpty().withMessage('please select the make'),
    check('modelId').notEmpty().withMessage('please select the model'),
    check('variantId').notEmpty().withMessage('please select the variant'),
    check('fuelType').notEmpty().withMessage('please select the fuelType'),
    check('odometer').notEmpty().withMessage('please enter the odometer'),
    check('chassisNumber')
      .notEmpty()
      .withMessage('please enter the chassisNumber')
      .bail()
      .custom(async (chassisNumber) => {
        return VehicleDao.findByChassisNumber(chassisNumber).then((exists) => {
          if (exists) {
            return Promise.reject('Chassis Number must be unique');
          }
        });
      })
      .withMessage('Chassis Number must be unique'),
    check('engineNumber')
      .notEmpty()
      .withMessage('please enter the Engine Number')
      .bail()
      .custom(async (engineNumber) => {
        return VehicleDao.findByEngineNumber(engineNumber).then((exists) => {
          if (exists) {
            return Promise.reject('Engine Number must be unique');
          }
        });
      })
      .withMessage('Engine Number must be unique'),
  ],
};
