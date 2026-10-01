import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { pickupTypeRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';

import express from 'express';

const router = express.Router();
router.post(
  '/addPickupType',
  JwtMiddleware.checkToken,
  pickupTypeRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addPickupType(req, res, next);
  }
);

router.post(
  '/updatePickupType',
  JwtMiddleware.checkToken,
  pickupTypeRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updatePickupType(req, res, next);
  }
);

router.post(
  '/listPickupType',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listPickupType(req, res, next);
  }
);

router.post(
  '/deletePickupType',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deletePickupType(req, res, next);
  }
);

const pickupTypeRouter = router;
export default pickupTypeRouter;
