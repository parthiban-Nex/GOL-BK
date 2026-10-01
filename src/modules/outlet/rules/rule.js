import { check } from 'express-validator';
import OutletService from '../service.js';
import Dao from '../dao.js';

export const outletRules = {
  create: [
    check('outletCode')
      .notEmpty()
      .withMessage('please enter the outlet code')
      .bail()
      .custom(async (outletCode) => {
        return OutletService.findByCode(outletCode).then((exists) => {
          if (exists) {
            return Promise.reject('outlet code must be unique');
          }
        });
      })
      .withMessage('outlet code must be unique'),

    check('email')
      .notEmpty()
      .withMessage('please enter the email')
      .bail()
      .custom(async (email) => {
        return OutletService.findByEmail(email).then((exists) => {
          if (exists) {
            return Promise.reject('email must be unique');
          }
        });
      })
      .withMessage('email must be unique'),

    check('phoneNumber')
      .notEmpty()
      .withMessage('please enter the phoneNumber')
      .bail()
      .custom(async (phoneNumber) => {
        return OutletService.findByPhone(phoneNumber).then((exists) => {
          if (exists) {
            return Promise.reject('phoneNumber must be unique');
          }
        });
      })
      .withMessage('phoneNumber must be unique'),

    check('outletName').notEmpty().withMessage('please enter the outletName'),
    check('gstIn').notEmpty().withMessage('please enter the gstIn'),
    check('address1').notEmpty().withMessage('please enter the address1'),
    check('pincode').notEmpty().withMessage('please enter the pincode'),
    check('state').notEmpty().withMessage('please enter the state'),
    check('city').notEmpty().withMessage('please enter the city'),
    check('contactPerson')
      .notEmpty()
      .withMessage('please enter the contactPerson'),
    check('contactPhoneNumber')
      .notEmpty()
      .withMessage('please select the contactPhoneNumber'),
    check('companyId').notEmpty().withMessage('please select the company'),
    check('latitude').notEmpty().withMessage('please enter the latitude'),
    check('longitude').notEmpty().withMessage('please enter the longitude'),
    check('bridgeId').notEmpty().withMessage('please enter the bridgeId'),
    check('googleRatingLink')
      .notEmpty()
      .withMessage('please enter the googleRatingLink'),
    check('bankName').notEmpty().withMessage('please enter the bankName'),
    check('bankAccount').notEmpty().withMessage('please enter the bankAccount'),
    check('typeofAccount')
      .notEmpty()
      .withMessage('please enter the typeofAccount'),
    check('branch').notEmpty().withMessage('please enter the branch'),
    check('micrCode').notEmpty().withMessage('please enter the micrCode'),
    check('ifscCode').notEmpty().withMessage('please enter the ifscCode'),
    check('status').notEmpty().withMessage('please select the status'),
  ],

  update: [
    check('outletCode')
      .notEmpty()
      .withMessage('please enter the outletCode')
      .bail()
      .custom(async (outletCode, { req }) => {
        return Dao.checkUnique(outletCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Outlet Code must be unique');
          }
        });
      })
      .withMessage('Outlet Code must be unique'),
    check('email')
      .notEmpty()
      .withMessage('please enter the email')
      .bail()
      .custom(async (email, { req }) => {
        return Dao.checkUniqueForEmail(email, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Email must be unique');
          }
        });
      })
      .withMessage('Email must be unique'),
    check('phoneNumber')
      .notEmpty()
      .withMessage('please enter the phoneNumber')
      .bail()
      .custom(async (phoneNumber, { req }) => {
        return Dao.checkUniqueForMobile(phoneNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('PhoneNumber must be unique');
            }
          }
        );
      })
      .withMessage('PhoneNumber must be unique'),
    check('outletName').notEmpty().withMessage('please enter the outletName'),
    check('gstIn').notEmpty().withMessage('please enter the gstIn'),
    check('address1').notEmpty().withMessage('please enter the address1'),
    check('pincode').notEmpty().withMessage('please enter the pincode'),
    check('state').notEmpty().withMessage('please enter the state'),
    check('city').notEmpty().withMessage('please enter the city'),
    check('contactPerson')
      .notEmpty()
      .withMessage('please enter the contactPerson'),
    check('contactPhoneNumber')
      .notEmpty()
      .withMessage('please enter the contactPhoneNumber'),
    check('companyId').notEmpty().withMessage('please select the company'),
    check('latitude').notEmpty().withMessage('please enter the latitude'),
    check('longitude').notEmpty().withMessage('please enter the longitude'),
    check('bridgeId').notEmpty().withMessage('please enter the bridgeId'),
    check('googleRatingLink')
      .notEmpty()
      .withMessage('please enter the googleRatingLink'),
    check('bankName').notEmpty().withMessage('please enter the bankName'),
    check('bankAccount').notEmpty().withMessage('please enter the bankAccount'),
    check('typeofAccount')
      .notEmpty()
      .withMessage('please enter the typeofAccount'),
    check('branch').notEmpty().withMessage('please enter the branch'),
    check('micrCode').notEmpty().withMessage('please enter the micrCode'),
    check('ifscCode').notEmpty().withMessage('please enter the ifscCode'),
    check('status').notEmpty().withMessage('please enter the status'),
  ],
};
