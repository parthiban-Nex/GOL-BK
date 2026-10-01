import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { repairTypeRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createRepairType',
  repairTypeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addRepairTypes(req, res, next);
  }
);

router.post(
  '/getAllRepairTypes',
  JwtMiddleware.checkToken,
  controller.getAllRepairTypes
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneRepairTypes
);

router.post(
  '/editRepairType',
  idNumberBodyControl,
  repairTypeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateRepairTypes(req, res, next);
  }
);

router.post(
  '/listRepairTypes',
  JwtMiddleware.checkToken,
  controller.listRepairTypes
);

const repairTypeRouter = router;

export default repairTypeRouter;
