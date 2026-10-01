import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { vehiclePreDeliveryCheckListRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createPredeliveryCheck',
  vehiclePreDeliveryCheckListRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVehiclePredeliveryCheckList(req, res, next);
  }
);

router.post(
  '/updatePredeliveryCheck',
  vehiclePreDeliveryCheckListRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateVehiclePredeliveryCheckList(req, res, next);
  }
);

router.post(
  '/listPredeliveryChecks',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listVehiclePredeliveryCheckLists(req, res, next);
  }
);

router.post(
  '/deletePredeliveryCheck',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteVehiclePredeliveryCheckList(req, res, next);
  }
);

const vehiclePreDeliveryCheckListRouter = router;
export default vehiclePreDeliveryCheckListRouter;
