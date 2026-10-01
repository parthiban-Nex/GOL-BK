import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { insuranceRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createInsurance',
  insuranceRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInsurance(req, res, next);
  }
);
router.post(
  '/editInsurance',
  idNumberBodyControl,
  insuranceRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInsurance(req, res, next);
  }
);

router.post(
  '/listInsurances',
  JwtMiddleware.checkToken,
  controller.listInsurances
);
router.get(
  '/getAllInsurances',
  JwtMiddleware.checkToken,
  controller.getAllInsurances
);

const insuranceRouter = router;

export default insuranceRouter;
