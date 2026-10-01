import { check } from "express-validator";
import LeadDao from "../dao.js"

export const leadRules = {
  create: [
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber) => {
        return LeadDao.findByRegistrationNumber(registrationNumber).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Registration Number must be unique');
            }
          }
        );
      })
      .withMessage('Registration Number must be unique'),

    check('customerName').notEmpty().withMessage('please enter the customerName'),

    check('state').notEmpty().withMessage('please select the state'),

    check('city').notEmpty().withMessage('please select the city'),

    check('pincode').notEmpty().withMessage('please enter the pinCode'),

    check('customerAddress').notEmpty().withMessage('please enter the customerAddress'),

    check('makeId').notEmpty().withMessage('please select the make'),

    check('modelId').notEmpty().withMessage('please select the model'),

    check('mfgYear').notEmpty().withMessage('please select the mfgYear'),

    check('application').notEmpty().withMessage('please select the application'),

    check('stageNorm').notEmpty().withMessage('please select the stageNorm'),

    check('customerMobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber'),

    check('email')
      .notEmpty()
      .withMessage('please enter the email'),
  ],
  update: [
    check('customerName').notEmpty().withMessage('please enter the customerName'),

    check('state').notEmpty().withMessage('please select the state'),

    check('city').notEmpty().withMessage('please select the city'),

    check('pincode').notEmpty().withMessage('please enter the pinCode'),

    check('customerAddress').notEmpty().withMessage('please enter the customerAddress'),

    check('makeId').notEmpty().withMessage('please select the make'),

    check('modelId').notEmpty().withMessage('please select the model'),

    check('mfgYear').notEmpty().withMessage('please select the mfgYear'),

    check('application').notEmpty().withMessage('please select the application'),

    check('stageNorm').notEmpty().withMessage('please select the stageNorm'),

    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber, { req }) => {
        return LeadDao.checkUnique(registrationNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Registration Number must be unique');
            }
          }
        );
      })
      .withMessage('Registration Number must be unique'),

    check('customerMobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber'),

    check('email')
    .notEmpty()
    .withMessage('please enter the email'),
  ]
}