import { check } from 'express-validator';
import EmployeeService from '../service.js';
import Dao from '../dao.js';

export const employeeRules = {
  create: [
    check('employeeCode')
      .notEmpty()
      .withMessage('please enter a Employee Code')
      .bail()
      .custom(async (employeeCode) => {
        return EmployeeService.findByemployeeCode(employeeCode).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Employee Code must be unique');
            }
          }
        );
      })
      .withMessage('Employee Code must be unique'),

    check('employeeName')
      .notEmpty()
      .withMessage('please enter a Employee Name'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter a Employee mobileNumber')
      .bail()
      .custom(async (mobileNumber) => {
        return EmployeeService.findByMobileNumber(mobileNumber).then(
          (exists) => {
            if (exists) {
              return Promise.reject('mobileNumber must be unique');
            }
          }
        );
      })
      .withMessage('mobileNumber must be unique'),

    check('email')
      .notEmpty()
      .withMessage('please enter a Employee email')
      .bail()
      .custom(async (email) => {
        return EmployeeService.findByEmail(email).then((exists) => {
          if (exists) {
            return Promise.reject('email must be unique');
          }
        });
      })
      .withMessage('email must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('employeeCode')
      .notEmpty()
      .withMessage('please enter a Employee Code')
      .bail()
      .custom(async (employeeCode, { req }) => {
        return Dao.checkUnique(employeeCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Employee Code must be unique');
          }
        });
      })
      .withMessage('Employee Code must be unique'),

    check('employeeName')
      .notEmpty()
      .withMessage('please enter a Employee Name'),

    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter a Employee mobileNumber')
      .bail()
      .custom(async (mobileNumber, { req }) => {
        return Dao.checkMobileUnique(mobileNumber, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('MobileNumber must be unique');
            }
          }
        );
      })
      .withMessage('MobileNumber must be unique'),

    check('email')
      .notEmpty()
      .withMessage('please enter a Employee email')
      .bail()
      .custom(async (email, { req }) => {
        return Dao.checkEmailUnique(email, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Email must be unique');
          }
        });
      })
      .withMessage('Email must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],
};
