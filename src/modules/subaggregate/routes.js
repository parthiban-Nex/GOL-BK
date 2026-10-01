import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { subAggregateRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  JwtMiddleware.checkToken,
  subAggregateRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addSubAggregate(req, res, next);
  }
);

router.post(
  '/editSubAggregate',
  idNumberBodyControl,
  subAggregateRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateSubAggregate(req, res, next);
  }
);

router.get(
  '/allSubaggregates',
  JwtMiddleware.checkToken,
  controller.getAllsubAggregates
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  roleAuth(moduleName.Subaggregate, actionName.Read),
  controller.getOnesubAggregate
);
router.post(
  '/listSubaggregates',
  JwtMiddleware.checkToken,
  controller.listSubAggregates
);
router.post(
  '/getSubaggregates',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  controller.getSubAggregatesByAggregateId
);
const subaggregateRouter = router;

export default subaggregateRouter;
