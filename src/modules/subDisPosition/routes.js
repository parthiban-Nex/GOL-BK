import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { subDisPositionRules } from './rules/rule.js';
import commonLogics from '../../shared/commonLogics.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createSubDisPosition',
  subDisPositionRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addSubDisPosition(req, res, next);
  }
);
router.post(
  '/editSubDisPosition',
  idNumberBodyControl,
  subDisPositionRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateSubDisPosition(req, res, next);
  }
);
router.post(
  '/listSubDisPositions',
  JwtMiddleware.checkToken,
  controller.listSubDisPositions
);
router.post(
  '/getCustomerSubDisPosition',
  JwtMiddleware.checkToken,
  controller.getCustomerSubDisPosition
);

const subDisPositionRouter = router;
export default subDisPositionRouter;
