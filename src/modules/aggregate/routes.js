import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { aggregateRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  JwtMiddleware.checkToken,
  aggregateRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addAggregate(req, res, next);
  }
);

router.get(
  '/allAggregates',
  JwtMiddleware.checkToken,
  controller.getAllAggregates
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  roleAuth(moduleName.Aggregate, actionName.Read),
  controller.getOneAggregate
);

router.post(
  '/editAggregate',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  aggregateRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateAggregate(req, res, next);
  }
);

// router.delete('/:id', idNumberControl, JwtMiddleware.checkToken, roleAuth(moduleName.Aggregate, actionName.Delete), controller.deleteAggregate);
router.post(
  '/listAggregates',
  JwtMiddleware.checkToken,
  controller.listAggregates
);
const aggregateRouter = router;

export default aggregateRouter;
