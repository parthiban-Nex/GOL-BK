import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { batteryOemRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createBatteryOem',
  batteryOemRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBatteryOem(req, res, next);
  }
);

router.post(
  '/updateBatteryOem',
  batteryOemRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateBatteryOem(req, res, next);
  }
);

router.post(
  '/listBatteryOems',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listBatteryOems(req, res, next);
  }
);

router.post(
  '/deleteBatteryOem',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteBatteryOem(req, res, next);
  }
);

const batteryOemRouter = router;
export default batteryOemRouter;
