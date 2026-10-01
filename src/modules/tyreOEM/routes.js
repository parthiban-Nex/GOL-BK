import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { tyreOemRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createTyreOem',
  tyreOemRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addTyreOem(req, res, next);
  }
);

router.post(
  '/updateTyreOem',
  tyreOemRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateTyreOem(req, res, next);
  }
);

router.post(
  '/listTyreOems',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listTyreOems(req, res, next);
  }
);

router.post(
  '/deleteTyreOem',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteTyreOem(req, res, next);
  }
);

const tyreOemRouter = router;
export default tyreOemRouter;
