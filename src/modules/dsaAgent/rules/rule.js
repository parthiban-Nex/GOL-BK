import { check } from 'express-validator';
import DsaAgentService from '../service.js';
import Dao from '../dao.js';

export const dsaAgentRules = {
  create: [
    check('dsaCode')
      .notEmpty()
      .withMessage('please enter the DsaCode')
      .bail()
      .custom(async (dsaCode) => {
        return DsaAgentService.findByCode(dsaCode).then((exists) => {
          if (exists) {
            return Promise.reject('DsaCode must be unique');
          }
        });
      })
      .withMessage('DsaCode must be unique'),
    check('dsaName').notEmpty().withMessage('please enter the DsaName'),
    check('address1').notEmpty().withMessage('please select the address1'),

    check('city').notEmpty().withMessage('please select the city'),
    check('pincode').notEmpty().withMessage('please select the pincode'),

    check('state').notEmpty().withMessage('please select the state'),
    check('email')
      .notEmpty()
      .withMessage('please enter the email')
      .bail()
      .custom(async (email) => {
        return DsaAgentService.findByEmail(email).then((exists) => {
          if (exists) {
            return Promise.reject('email must be unique');
          }
        });
      })
      .withMessage('email must be unique'),

    check('whatsapp')
      .notEmpty()
      .withMessage('please select the whatsapp number'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please select the mobileNumber')
      .custom(async (mobileNumber) => {
        return DsaAgentService.findByPhone(mobileNumber).then((exists) => {
          if (exists) {
            return Promise.reject('mobileNumber must be unique');
          }
        });
      })
      .withMessage('mobileNumber must be unique'),
    check('alternativeMobileNumber')
      .notEmpty()
      .withMessage('please select the Alternative MobileNumber'),
    check('dsaManagedBy')
      .notEmpty()
      .withMessage('please select the dsaManagedBy'),
    check('sourceOfTheDSA')
      .notEmpty()
      .withMessage('please select the sourceOfTheDSA'),
    check('bankName').notEmpty().withMessage('please enter the bank name'),
    check('ifscCode').notEmpty().withMessage('please enter the ifsc dode'),

    check('panNo')
      .notEmpty()
      .withMessage('please enter the pan number')
      .custom(async (panNo) => {
        return DsaAgentService.findByPan(panNo).then((exists) => {
          if (exists) {
            return Promise.reject('panNo must be unique');
          }
        });
      })
      .withMessage('panNo must be unique'),
    check('accountNumber')
      .notEmpty()
      .withMessage('please enter the account number')
      .custom(async (accountNumber) => {
        return DsaAgentService.findByBankAccount(accountNumber).then(
          (exists) => {
            if (exists) {
              return Promise.reject('accountNumber must be unique');
            }
          }
        );
      })
      .withMessage('accountNumber must be unique'),
  ],

  update: [
    check('dsaCode')
      .notEmpty()
      .withMessage('please enter the DsaCode')
      .bail()
      .custom(async (dsaCode, { req }) => {
        return Dao.checkUnique(dsaCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('DSA Code must be unique');
          }
        });
      })
      .withMessage('DSA Code must be unique'),
    check('dsaName').notEmpty().withMessage('please enter the DSAName'),
    check('address1').notEmpty().withMessage('please enter the address1'),
    check('city').notEmpty().withMessage('please enter the city'),
    check('pincode').notEmpty().withMessage('please enter the pincode'),
    check('state').notEmpty().withMessage('please enter the state'),
    check('email')
      .notEmpty()
      .withMessage('please enter the Email')
      .bail()
      .custom(async (email, { req }) => {
        return Dao.checkUniqueForEmail(email, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Email must be unique');
          }
        });
      })
      .withMessage('Email must be unique'),
    check('whatsapp')
      .notEmpty()
      .withMessage('please enter the whatsapp number'),
    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber')
      .bail()
      .custom(async (mobileNumber, { req }) => {
        return Dao.checkUniqueForMobile(mobileNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('MobileNumber must be unique');
            }
          }
        );
      })
      .withMessage('MobileNumber must be unique'),
    check('alternativeMobileNumber')
      .notEmpty()
      .withMessage('please enter the alternative MobileNumber'),
    check('dsaManagedBy')
      .notEmpty()
      .withMessage('please enter the dsaManagedBy'),
    check('sourceOfTheDSA')
      .notEmpty()
      .withMessage('please enter the sourceOfTheDSA'),
    check('bankName').notEmpty().withMessage('please enter the bank name'),
    check('ifscCode').notEmpty().withMessage('please enter the ifsc code'),
    check('panNo')
      .notEmpty()
      .withMessage('please enter the panNo')
      .bail()
      .custom(async (panNo, { req }) => {
        return Dao.checkUniqueForPan(panNo, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Pan Number must be unique');
          }
        });
      })
      .withMessage('Pan Number must be unique'),
    check('accountNumber')
      .notEmpty()
      .withMessage('please enter the account number')
      .bail()
      .custom(async (accountNumber, { req }) => {
        return Dao.checkUniqueForBankAccount(accountNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Account Number must be unique');
            }
          }
        );
      })
      .withMessage('Account Number must be unique'),
  ],
};
