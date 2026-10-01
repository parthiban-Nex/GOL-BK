import { check } from 'express-validator';
import EmployeeService from '../service.js';

export const employeeRules = {
  create: [
    check('employeeRole')
      .notEmpty()
      .withMessage('please enter a Employee Role Name')
      .bail()
      .custom(async (employeeRole) => {
        return EmployeeService.findByemployeeRoleName(employeeRole).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Employee Role must be unique');
            }
          }
        );
      })
      .withMessage('Employee Role must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('employeeRole')
      .notEmpty()
      .withMessage('please enter the Employee Role Name')
      .bail()
      .custom(async (employeeRole, { req }) => {
        return EmployeeService.checkUnique(employeeRole, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Employee Role must be unique');
            }
          }
        );
      })
      .withMessage('Employee Role must be unique'),
    check('status').notEmpty().withMessage('please select a status'),
  ],
};
