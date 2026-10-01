import { check } from 'express-validator';
import CustomerDao from '../dao.js';
import VehicleDao from '../../vehicle/dao.js';
export const customerRules = {
  getCustomerVehicleNumbers: [
    check('customerId')
      .isInt({ min: 1 })
      .withMessage('please provide a valid customerId'),
  ],
  searchCustomerVehicle: [
    check('mobileNumber').trim().notEmpty().withMessage('please enter the mobileNumber'),
    check('registrationNumber').trim().notEmpty().withMessage('please enter the Registration Number'),
  ],
  createPortalCustomer: [
    check('name').trim().notEmpty().withMessage('please enter the name'),
    check('mobileNumber').trim().notEmpty().withMessage('please enter the mobileNumber'),
  ],
  quickAddVehicleForCustomer: [
    check('customerId').isInt({ min: 1 }).withMessage('please provide a valid customerId'),
    check('registrationNumber').trim().notEmpty().withMessage('please enter the Registration Number'),
    check('makeId').isInt({ min: 1 }).withMessage('please select a valid make'),
    check('modelId').isInt({ min: 1 }).withMessage('please select a valid model'),
    check('fuelType').trim().notEmpty().withMessage('please select the fuelType'),
  ],
  updateCustomerVehicleDetails: [
    check('customerId').isInt({ min: 1 }).withMessage('please provide a valid customerId'),
    check('vehicleId').isInt({ min: 1 }).withMessage('please provide a valid vehicleId'),
    check('name').trim().notEmpty().withMessage('please enter the name'),
    check('mobileNumber').trim().notEmpty().withMessage('please enter the mobileNumber'),
    check('registrationNumber').trim().notEmpty().withMessage('please enter the Registration Number'),
    check('makeId').isInt({ min: 1 }).withMessage('please select a valid make'),
    check('modelId').isInt({ min: 1 }).withMessage('please select a valid model'),
    check('fuelType').trim().notEmpty().withMessage('please select the fuelType'),
  ],
  updateCustomerVehicleInsurance: [
    check('customerId').isInt({ min: 1 }).withMessage('please provide a valid customerId'),
    check('vehicleId').isInt({ min: 1 }).withMessage('please provide a valid vehicleId'),
    check('insurance').isObject().withMessage('please provide insurance details'),
  ],
  quickAdd: [
    check('name').trim().notEmpty().withMessage('please enter the name'),
    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async mobileNumber => {
        const exists = await CustomerDao.findByMobileNumber(mobileNumber);
        if (exists) {
          return Promise.reject('mobileNumber must be unique');
        }
      }),
    check('pinCode').notEmpty().withMessage('please enter the pinCode'),
    check('address1').notEmpty().withMessage('please enter the address1'),
    check('registrationNumber')
      .trim()
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async registrationNumber => {
        const exists = await VehicleDao.findByRegistrationNumber(registrationNumber);
        if (exists) {
          return Promise.reject('Registration Number must be unique');
        }
      }),
    check('makeId').isInt({ min: 1 }).withMessage('please select a valid make'),
    check('modelId').isInt({ min: 1 }).withMessage('please select a valid model'),
    check('fuelType').trim().notEmpty().withMessage('please select the fuelType'),
  ],
  create: [
    check('firstName').notEmpty().withMessage('please enter the firstName'),

    check('lastName').notEmpty().withMessage('please enter the lastName'),

    check('address1').notEmpty().withMessage('please enter the address1 '),

    check('state').notEmpty().withMessage('please select the state'),

    check('city').notEmpty().withMessage('please select the city'),

    check('pinCode').notEmpty().withMessage('please enter the pinCode'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async (mobileNumber) => {
        return CustomerDao.findByMobileNumber(mobileNumber).then((exists) => {
          if (exists) {
            return Promise.reject('mobileNumber must be unique');
          }
        });
      })
      .withMessage('mobileNumber must be unique'),

    check('sourceId').notEmpty().withMessage('please select the source'),

    check('sourceTypeId')
      .notEmpty()
      .withMessage('please select the sourceType'),

    check('customerCategory')
      .notEmpty()
      .withMessage('please select the customerCategory'),

    check('customerType')
      .notEmpty()
      .withMessage('please select the customerType'),

    check('billType').notEmpty().withMessage('please select the billType'),

    check('status').notEmpty().withMessage('please select the status'),

    // check('emailId')
    //   .custom(async (emailId) => {
    //     if (emailId) {
    //       return CustomerDao.findByEmail(emailId).then((exists) => {
    //         if (exists) {
    //           return Promise.reject('emailId must be unique');
    //         }
    //       });
    //     }
    //   })
    //   .withMessage('emailId must be unique'),

    check('gstinNumber')
      .custom(async (gstinNumber) => {
        if (gstinNumber) {
          return CustomerDao.findByGstNo(gstinNumber).then((exists) => {
            if (exists) {
              return Promise.reject('gstinNumber must be unique');
            }
          });
        }
      })
      .withMessage('gstinNumber must be unique'),
  ],
  update: [
    check('firstName').notEmpty().withMessage('please enter the firstName'),

    check('lastName').notEmpty().withMessage('please enter the lastName'),

    check('address1').notEmpty().withMessage('please enter the address1 '),

    check('state').notEmpty().withMessage('please select the state'),

    check('city').notEmpty().withMessage('please select the city'),

    check('pinCode').notEmpty().withMessage('please enter the pinCode'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async (mobileNumber, { req }) => {
        return CustomerDao.checkUniqueForMobile(mobileNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('MobileNumber must be unique');
            }
          }
        );
      })
      .withMessage('MobileNumber must be unique'),

    check('sourceId').notEmpty().withMessage('please select the source'),

    check('sourceTypeId')
      .notEmpty()
      .withMessage('please select the sourceType'),
    check('customerCategory')
      .notEmpty()
      .withMessage('please select the customerCategory'),

    check('customerType')
      .notEmpty()
      .withMessage('please select the customerType'),

    check('billType').notEmpty().withMessage('please select the billType'),

    check('status').notEmpty().withMessage('please select the status'),
    check('gstFileNumber')
      .custom(async (gstinNumber, { req }) => {
        return CustomerDao.checkUniqueForGstIn(gstinNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('GstinNumber must be unique');
            }
          }
        );
      })
      .withMessage('GstinNumber must be unique')
    // check('emailId')
    //   .custom(async (emailId, { req }) => {
    //     return CustomerDao.checkUniqueForEmail(emailId, req.body.id).then(
    //       (exists) => {
    //         if (exists) {
    //           return Promise.reject('Email must be unique');
    //         }
    //       }
    //     );
    //   })
    //   .withMessage('Email must be unique'),
  ],
  
  createM: [
    check('firstName').notEmpty().withMessage('please enter the firstName'),
    check('address').notEmpty().withMessage('please enter the address'),
    check('state').notEmpty().withMessage('please select the state'),
    check('city').notEmpty().withMessage('please select the city'),
    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async (mobileNumber) => {
        return CustomerDao.findByMobileNumber(mobileNumber).then((exists) => {
          if (exists) {
            return Promise.reject('mobileNumber must be unique');
          }
        });
      })
      .withMessage('mobileNumber must be unique'),
      // check('emailId')
      // .custom(async (emailId) => {
      //   if (emailId) {
      //     return CustomerDao.findByEmail(emailId).then((exists) => {
      //       if (exists) {
      //         return Promise.reject('emailId must be unique');
      //       }
      //     });
      //   }
      // })
      // .withMessage('emailId must be unique'),
    check('source').notEmpty().withMessage('please select the source'),
    check('sourceType')
      .notEmpty()
      .withMessage('please select the sourceType'),

    check('customerCategory')
      .notEmpty()
      .withMessage('please select the customerCategory'),
      
      check('gstFileNumber')
      .custom(async (gstinNumber) => {
        if (gstinNumber) {
          return CustomerDao.findByGstNo(gstinNumber).then((exists) => {
            if (exists) {
              return Promise.reject('gstinNumber must be unique');
            }
          });
        }
      })
      .withMessage('gstinNumber must be unique'),
  ],

  updateM: [
    check('firstName').notEmpty().withMessage('please enter the firstName'),
    check('address').notEmpty().withMessage('please enter the address'),
    check('state').notEmpty().withMessage('please select the state'),
    check('city').notEmpty().withMessage('please select the city'),
    check('pinCode').notEmpty().withMessage('please enter the pinCode'),
    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async (mobileNumber, { req }) => {
        return CustomerDao.checkUniqueForMobile(mobileNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('MobileNumber must be unique');
            }
          }
        );
      })
      .withMessage('MobileNumber must be unique'),
    check('source').notEmpty().withMessage('please select the source'),
    check('sourceType')
      .notEmpty()
      .withMessage('please select the sourceType'),
    check('customerCategory')
      .notEmpty()
      .withMessage('please select the customerCategory')
    // check('emailId')
    //   .custom(async (emailId, { req }) => {
    //     return CustomerDao.checkUniqueForEmail(emailId, req.body.id).then(
    //       (exists) => {
    //         if (exists) {
    //           return Promise.reject('Email must be unique');
    //         }
    //       }
    //     );
    //   })
    //   .withMessage('Email must be unique'),
  ],
};
