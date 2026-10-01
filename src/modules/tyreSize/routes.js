import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { tyreSizeRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createTyreSize',
  tyreSizeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addTyreSize(req, res, next);
  }
);

router.post(
  '/updateTyreSize',
  tyreSizeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateTyreSize(req, res, next);
  }
);

router.post(
  '/listTyreSizes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listTyreSizes(req, res, next);
  }
);

router.post(
  '/deleteTyreSize',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteTyreSize(req, res, next);
  }
);

const tyreSizeRouter = router;
export default tyreSizeRouter;
