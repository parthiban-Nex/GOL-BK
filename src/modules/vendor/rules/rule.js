import { check } from 'express-validator';
import VendorService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';

export const vendorRules = {
  create: [
    check('vendorCode')
      .notEmpty()
      .withMessage('please enter the vendorCode')
      .bail()
      .custom(async (vendorCode) => {
        return VendorService.findByCode(vendorCode).then((exists) => {
          if (exists) {
            return Promise.reject('Vendor Code must be unique');
          }
        });
      })
      .withMessage('Vendor Code must be unique'),

    check('vendorName').notEmpty().withMessage('please enter the vendorName'),

    check('address1').notEmpty().withMessage('please enter the address1'),

    check('address2').notEmpty().withMessage('please enter the address2'),

    check('state').notEmpty().withMessage('please enter the state'),

    check('city').notEmpty().withMessage('please enter the city'),

    check('pincode').notEmpty().withMessage('please enter the pincode'),

    // check('mobileNumber')
    //   .notEmpty()
    //   .withMessage('please enter the mobileNumber')
    //   .custom(async (mobileNumber) => {
    //     return VendorService.findByMobileNo(mobileNumber).then((exists) => {
    //       if (exists) {
    //         return Promise.reject('mobileNumber must be unique');
    //       }
    //     });
    //   })
    //   .withMessage('mobileNumber must be unique'),

    check('contactPerson')
      .notEmpty()
      .withMessage('please enter the contact person'),

    // check('contactPersonMobileNo')
    //   .notEmpty()
    //   .withMessage('please enter the contact person MobileNo')
    //   .custom(async (contactPersonMobileNo) => {
    //     return VendorService.ContactPersonMobileNo(contactPersonMobileNo).then(
    //       (exists) => {
    //         if (exists) {
    //           return Promise.reject(
    //             'contactPerson mobileNumber must be unique'
    //           );
    //         }
    //       }
    //     );
    //   })
    //   .withMessage('contactPerson mobileNumber must be unique'),

    check('vendorType').notEmpty().withMessage('please select a vendorType'),

    check('marginPercentage')
      .notEmpty()
      .withMessage('please select a marginPercentage'),
  ],

  update: [
    check('vendorCode')
      .notEmpty()
      .withMessage('please enter the vendorCode')
      .bail()
      .custom(async (vendorCode, { req }) => {
        return Dao.checkUnique(vendorCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Vendor Code must be unique');
          }
        });
      })
      .withMessage('Vendor Code must be unique'),
    // check('mobileNumber')
    //   .notEmpty()
    //   .withMessage('please enter the mobileNumber')
    //   .bail()
    //   .custom(async (mobileNumber, { req }) => {
    //     return Dao.checkUniqueForMobile(mobileNumber, req.body.id).then(
    //       (exists) => {
    //         if (exists) {
    //           return Promise.reject('MobileNumber must be unique');
    //         }
    //       }
    //     );
    //   })
    //   .withMessage('MobileNumber must be unique'),
    
    // check('contactPersonMobileNo')
    //   .notEmpty()
    //   .withMessage('please enter the Contact Person MobileNo')
    //   .bail()
    //   .custom(async (contactPersonMobileNo, { req }) => {
    //     return Dao.checkUniqueForContact(
    //       contactPersonMobileNo,
    //       req.body.id
    //     ).then((exists) => {
    //       if (exists) {
    //         return Promise.reject('Contact Person MobileNo must be unique');
    //       }
    //     });
    //   })
    //   .withMessage('Contact Person MobileNo must be unique'),
  ],
};
