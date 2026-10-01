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
  '/createEmployee',
  employeeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addEmployee(req, res, next);
  }
);

router.get(
  '/getAllEmployee',
  JwtMiddleware.checkToken,
  controller.getAllEmployee
);

router.get(
  '/getServiceAdvisors',
  JwtMiddleware.checkToken,
  controller.getServiceAdvisors
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneEmployee
);

router.post('/listEmployee', JwtMiddleware.checkToken, controller.listEmployee);
router.post('/getMechanics', JwtMiddleware.checkToken, controller.getMechanics);

router.post(
  '/editEmployee',
  idNumberBodyControl,
  employeeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateEmployee(req, res, next);
  }
);

const employeeRouter = router;

export default employeeRouter;
