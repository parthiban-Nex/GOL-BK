import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { clickInPartsRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createPart',
  clickInPartsRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addPart(req, res, next);
  }
);

router.post(
  '/updatePart',
  clickInPartsRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updatePart(req, res, next);
  }
);

router.post('/listParts', JwtMiddleware.checkToken, async (req, res, next) => {
  return await controller.listParts(req, res, next);
});

router.post('/deletePart', JwtMiddleware.checkToken, async (req, res, next) => {
  return await controller.deletePart(req, res, next);
});

const clickInPartsRouter = router;
export default clickInPartsRouter;
