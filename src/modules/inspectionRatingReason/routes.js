import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { inspectionRaingReasonRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createInspectionRatingReason',
  inspectionRaingReasonRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInspectionRatingReason(req, res, next);
  }
);

router.post(
  '/updateInspectionRatingReason',
  inspectionRaingReasonRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInspectionRatingReason(req, res, next);
  }
);

router.post(
  '/listInspectionRatingReasons',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInspectionRatingReasons(req, res, next);
  }
);

router.post(
  '/deleteInspectionRatingReason',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteInspectionRatingReason(req, res, next);
  }
);

router.get(
  '/getAllInspectionRatingReasons',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getAllInspectionRatingReasons(req, res, next);
  }
);

const inspectionRatingReasonRouter = router;
export default inspectionRatingReasonRouter;
