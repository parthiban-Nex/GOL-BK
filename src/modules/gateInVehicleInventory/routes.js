import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { VehicleInventoryRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';

import express from 'express';

const router = express.Router();
router.post(
  '/addVehicleInventory',
  JwtMiddleware.checkToken,
  VehicleInventoryRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVehicleInventory(req, res, next);
  }
);

router.post(
  '/updateVehicleInventory',
  JwtMiddleware.checkToken,
  VehicleInventoryRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateVehicleInventory(req, res, next);
  }
);

router.post(
  '/listGateInVehicleInventory',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listVehicleInventory(req, res, next);
  }
);

router.post(
  '/deleteGateInVehicleInventory',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteVehicleInventory(req, res, next);
  }
);

router.post(
  '/updateleadfitstatus',
  JwtMiddleware.MobileCheckToken,
  controller.updateleadfitstatus
);

router.post('/getvisitgateindata', JwtMiddleware.MobileCheckToken,
  async (req, res, next) => {
    return await controller.getvisitgateindata(req, res, next);
  }
);

router.post(
  '/gateinVehicleInventory',
  JwtMiddleware.MobileCheckToken,
  controller.gateinVehicleInventory
);

const gateinVehicleInventoryRouter = router;
export default gateinVehicleInventoryRouter;
