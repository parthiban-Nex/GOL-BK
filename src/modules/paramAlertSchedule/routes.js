import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { inspectionCheckListRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/addParamAlertSchedule',
  inspectionCheckListRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addParamAlertSchedule(req, res, next);
  }
);

router.post(
  '/updateParamAlertSchedule',
  inspectionCheckListRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateParamAlertSchedule(req, res, next);
  }
);

router.post(
  '/listParamAlertSchedule',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listParamAlertSchedule(req, res, next);
  }
);

router.post(
  '/deleteParamAlertSchedule',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteParamAlertSchedule(req, res, next);
  }
);

router.get(
  '/getAllInspectionCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getAllInspectionCheckList(req, res, next);
  }
);

const paramAlertScheduleRouter = router;
export default paramAlertScheduleRouter;
