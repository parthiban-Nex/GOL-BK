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
  '/createInspectionCheckList',
  inspectionCheckListRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInspectionCheckList(req, res, next);
  }
);

router.post(
  '/updateInspectionCheckList',
  inspectionCheckListRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInspectionCheckList(req, res, next);
  }
);

router.post(
  '/listInspectionCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInspectionCheckList(req, res, next);
  }
);

router.post(
  '/getInspectionChecklist',
  JwtMiddleware.checkToken,
  inspectionCheckListRules['getGrouped'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return controller.getGroupedInspectionChecklist(req, res, next);
  }
);

router.post(
  '/deleteInspectionCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteInspectionCheckList(req, res, next);
  }
);

router.get(
  '/getAllInspectionCheckList',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getAllInspectionCheckList(req, res, next);
  }
);

const inspectionCheckListRouter = router;
export default inspectionCheckListRouter;
