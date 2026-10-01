import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { InventoryCheckListRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';

import express from 'express';

const router = express.Router();
router.post(
  '/addInventoryCheckList',
  JwtMiddleware.checkToken,
  InventoryCheckListRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInventoryCheckList(req, res, next);
  }
);

router.post(
  '/updateInventoryCheckList',
  JwtMiddleware.checkToken,
  InventoryCheckListRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInventoryCheckList(req, res, next);
  }
);

router.post(
  '/listInventoryCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInventoryCheckList(req, res, next);
  }
);

router.post(
  '/deleteInventoryCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteInventoryCheckList(req, res, next);
  }
);

router.get(
  '/listVehicleTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listVehicleTypes(req, res, next);
  }
);

const inventoryCheckListRouter = router;
export default inventoryCheckListRouter;
