import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { checkListTypeRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createCheckListType',
  checkListTypeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addCheckListType(req, res, next);
  }
);

router.post(
  '/updateCheckListType',
  checkListTypeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateCheckListType(req, res, next);
  }
);

router.post(
  '/listCheckListTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listCheckListTypes(req, res, next);
  }
);

router.post(
  '/deleteCheckListType',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteCheckListType(req, res, next);
  }
);

router.get(
  '/getCustomerAccountTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getCustomerAccountTypes(req, res, next);
  }
);

router.get(
  '/getCheckListTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getCheckListTypes(req, res, next);
  }
);

router.get(
  '/getInspectionTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.getInspectionTypes(req, res, next);
  }
);

const checkListTypeRouter = router;
export default checkListTypeRouter;
