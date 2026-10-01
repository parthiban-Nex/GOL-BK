import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { employeeRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createEmployeeRole',
  employeeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addEmployeeRole(req, res, next);
  }
);

router.post(
  '/editEmployeeRole',
  idNumberBodyControl,
  employeeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateEmployeeRole(req, res, next);
  }
);

router.get(
  '/getAllEmployeeRoles',
  JwtMiddleware.checkToken,
  controller.getAllEmployeeRoles
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneEmployeeRole
);

router.post(
  '/listEmployeeRoles',
  JwtMiddleware.checkToken,
  controller.listEmployeeRoles
);

const employeeRoleRouter = router;

export default employeeRoleRouter;
