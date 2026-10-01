import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { makeRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  JwtMiddleware.checkToken,
  makeRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addMake(req, res, next);
  }
);
router.post('/listMakes', JwtMiddleware.checkToken, controller.listMakes);

router.post('/getAllMakes', JwtMiddleware.checkToken, controller.getAllMakes);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneMake
);

router.post(
  '/editMake',
  idNumberBodyControl,
  makeRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateMakeNew(req, res, next);
  }
);

const makeRouter = router;

export default makeRouter;
