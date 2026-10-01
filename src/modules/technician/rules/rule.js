import { check } from 'express-validator';
import TechnicianService from '../service.js';

const TECHNICIAN_ROLE_ID = 4;

export const technicianRules = {
  create: [
    check('outletId').notEmpty().withMessage('please select an outlet'),

    check('employeeCode')
      .notEmpty()
      .withMessage('please enter a Technician Employee Code')
      .bail()
      .custom(async (employeeCode, { req }) => {
        return TechnicianService.findByEmployeeCodeAndOutlet(employeeCode, req.body.outletId).then((exists) => {
          if (exists) {
            return Promise.reject('Technician Employee Code must be unique for this outlet');
          }
        });
      })
      .withMessage('Technician Employee Code must be unique for this outlet'),

    check('employeeName').notEmpty().withMessage('please enter a Name'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter a Mobile Number')
      .bail()
      .isLength({ min: 10, max: 10 })
      .withMessage('Mobile Number must be 10 digits')
      .bail()
      .custom(async (mobileNumber) => {
        return TechnicianService.findByMobileNumber(mobileNumber, TECHNICIAN_ROLE_ID).then((exists) => {
          if (exists) {
            return Promise.reject('Mobile Number must be unique');
          }
        });
      })
      .withMessage('Mobile Number must be unique'),

    check('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email')
      .bail()
      .custom(async (email) => {
        return TechnicianService.findByEmail(email).then((exists) => {
          if (exists) {
            return Promise.reject('Email must be unique');
          }
        });
      })
      .withMessage('Email must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('outletId').notEmpty().withMessage('please select an outlet'),

    check('employeeCode')
      .notEmpty()
      .withMessage('please enter a Technician Employee Code')
      .bail()
      .custom(async (employeeCode, { req }) => {
        return TechnicianService.findByEmployeeCodeAndOutletNotId(employeeCode, req.body.outletId, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Technician Employee Code must be unique for this outlet');
          }
        });
      })
      .withMessage('Technician Employee Code must be unique for this outlet'),

    check('employeeName').notEmpty().withMessage('please enter a Name'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter a Mobile Number')
      .bail()
      .isLength({ min: 10, max: 10 })
      .withMessage('Mobile Number must be 10 digits')
      .bail()
      .custom(async (mobileNumber, { req }) => {
        return TechnicianService.findByMobileNumberNotId(mobileNumber, req.body.id, TECHNICIAN_ROLE_ID).then((exists) => {
          if (exists) {
            return Promise.reject('Mobile Number must be unique');
          }
        });
      })
      .withMessage('Mobile Number must be unique'),

    check('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email')
      .bail()
      .custom(async (email, { req }) => {
        return TechnicianService.findByEmailNotId(email, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Email must be unique');
          }
        });
      })
      .withMessage('Email must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],
};
