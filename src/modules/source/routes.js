import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { sourceRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createSource',
  sourceRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addSource(req, res, next);
  }
);

router.post(
  '/getAllSources',
  JwtMiddleware.checkToken,
  controller.getAllSource
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneSource
);

router.post(
  '/editSource',
  idNumberBodyControl,
  sourceRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateSource(req, res, next);
  }
);


router.post('/listSource', JwtMiddleware.checkToken, controller.listSources);

const sourceRouter = router;

export default sourceRouter;
