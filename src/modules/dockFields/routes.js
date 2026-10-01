import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { DockFieldRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';

import express from 'express';

const router = express.Router();
router.post(
  '/addDockFields',
  JwtMiddleware.checkToken,
  DockFieldRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addDockFields(req, res, next);
  }
);

router.post(
  '/updateDockFields',
  JwtMiddleware.checkToken,
  DockFieldRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateDockFields(req, res, next);
  }
);

router.post(
  '/listDockFields',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listDockFields(req, res, next);
  }
);

router.get(
  '/listInputTypes',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInputTypes(req, res, next);
  }
);

router.post(
  '/deleteDockFields',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteDockFields(req, res, next);
  }
);

const dockFieldRouter = router;
export default dockFieldRouter;
