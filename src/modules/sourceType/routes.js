import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { sourceTypeRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createSourceType',
  sourceTypeRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addSourceType(req, res, next);
  }
);

router.post(
  '/getAllSourceTypes',
  JwtMiddleware.checkToken,
  controller.getAllSourceType
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneSourceType
);

router.post(
  '/editSourceType',
  idNumberBodyControl,
  sourceTypeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateSourceType(req, res, next);
  }
);


router.post(
  '/listSourceTypes',
  JwtMiddleware.checkToken,
  controller.listSourceTypes
);
router.post(
  '/getSourceTypesBySource',
  JwtMiddleware.checkToken,
  controller.getSourceTypesBySource
);

const sourceTypeRouter = router;

export default sourceTypeRouter;
