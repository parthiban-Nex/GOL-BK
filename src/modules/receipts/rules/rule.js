// import { check } from 'express-validator';
// import Dao from '../dao.js';

// export const receiptRules = {
//   create: [],
// };

import { check } from 'express-validator';
import ReceiptDao from '../dao.js';
export const receiptRules = {
  create: [
    check('refNo')
      // .notEmpty()
      // .withMessage('please enter the refNo')
       .optional({ checkFalsy: true }) 
      .bail()
      .custom(async (refNo) => {
        return ReceiptDao.findByReceiptRefNo(refNo).then((exists) => {
          if (exists) {
            return Promise.reject('refNo must be unique');
          }
        });
      })
      .withMessage('Reference Number must be unique'),

 
    // check('gstinNumber')
    //   .custom(async (gstinNumber) => {
    //     if (gstinNumber) {
    //       return ReceiptDao.findByGstNo(gstinNumber).then((exists) => {
    //         if (exists) {
    //           return Promise.reject('gstinNumber must be unique');
    //         }
    //       });
    //     }
    //   })
    //   .withMessage('gstinNumber must be unique'),
  ],
  update: [


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

  ],

};


