import { check, body } from 'express-validator';
import UsersService from '../service.js';
//const User = require('../models/user');
import validateCompanyMap from '../../../shared/validateCompanyMap.js';

export const userRules = {
  forRegister: [
    //   check('email')
    //     .isEmail().withMessage('Invalid email format')
    //     .bail()
    //     .custom(async (email) => {
    //         return UsersService.findByEmail(email)
    //         .then((exists) => {
    //             if(exists) {
    //                 return Promise.reject("email already exists");
    //             }
    //         })
    //   }).withMessage('email already exists'),

    check('password').notEmpty().withMessage('please enter a password'),

    check('user_id')
      .notEmpty()
      .withMessage('please enter a User id')
      .bail()
      .custom(async (user_id) => {
        return UsersService.findByUserId(user_id).then((exists) => {
          if (exists) {
            return Promise.reject('User id must be unique');
          }
        });
      })
      .withMessage('User id  must be unique'),

    check('employeeId')
      .notEmpty()
      .withMessage('please enter employee')
      .custom(async (employeeId) => {
        // console.log("phone", phone);
        return UsersService.findByEployeeId(employeeId).then((exists) => {
          // console.log("exists", exists);
          if (exists) {
            return Promise.reject('employee must be unique');
          }
        });
      })
      .withMessage('employee must be unique'),
  ],

  employeeRoleMap: [
    check('employeeId')
      .notEmpty()
      .withMessage('please enter a employee id')
      .bail()
      .custom(async (employeeId) => {
        console.log(employeeId);
        return UsersService.getEmployee(employeeId).then((exists) => {
          console.log('exists----------', exists);
          if (exists === null) {
            return Promise.reject('Employee not found');
          }
        });
      })
      .withMessage('Employee not found'),

    check('roleId')
      .notEmpty()
      .withMessage('please enter a role id')
      .bail()
      .custom(async (roleId) => {
        return validateCompanyMap.findByRoleId(roleId).then((exists) => {
          if (exists.length !== roleId.length) {
            return Promise.reject('role Id not found');
          }
        });
      })
      .withMessage('role Id not found'),
  ],

  forUpdate: [
    check('password').notEmpty().withMessage('please enter a password'),

    check('employeeId')
      .notEmpty()
      .withMessage('please enter employee')
      .custom(async (employeeId, { req }) => {
        // console.log("phone", phone);
        return UsersService.findUniqueEployeeId(employeeId, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('employee must be unique');
            }
          }
        );
      })
      .withMessage('employee must be unique'),

    check('user_id')
      .notEmpty()
      .withMessage('please enter a User id')
      .bail()
      .custom(async (user_id, { req }) => {
        return UsersService.findUniqueUserId(user_id, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('User id must be unique');
            }
          }
        );
      })
      .withMessage('User id  must be unique'),
  ],
};
