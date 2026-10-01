import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { inspectionSubsystemMapRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createInspectionSubsystem',
  inspectionSubsystemMapRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInspectionSubsystem(req, res, next);
  }
);

router.post(
  '/updateInspectionSubsystem',
  inspectionSubsystemMapRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInspectionSubsystem(req, res, next);
  }
);

router.post(
  '/listInspectionSubsystems',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInspectionSubsystem(req, res, next);
  }
);

router.post(
  '/deleteSubsystemMap',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteSubsystem(req, res, next);
  }
);

router.get(
  '/getInspectionSubsystemMaps',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getInspectionSubsystemMaps(req, res, next);
  }
);

const inspectionSubsystemMapRouter = router;
export default inspectionSubsystemMapRouter;
