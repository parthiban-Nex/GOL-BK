import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { serviceTypeRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createServiceType',
  serviceTypeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addServiceType(req, res, next);
  }
);

router.post(
  '/getAllServiceTypes',
  JwtMiddleware.checkToken,
  controller.getAllServiceType
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneServiceType
);

router.post(
  '/editServiceType',
  idNumberBodyControl,
  serviceTypeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateServiceType(req, res, next);
  }
);

router.post(
  '/listServiceTypes',
  JwtMiddleware.checkToken,
  controller.listServiceTypes
);

const serviceTypeRouter = router;

export default serviceTypeRouter;
