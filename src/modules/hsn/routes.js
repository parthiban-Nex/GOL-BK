import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { hsnRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  hsnRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addHsn(req, res, next);
  }
);

router.get('/getAllHsn', JwtMiddleware.checkToken, controller.getAllHsn);
router.post(
  '/getHsn',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  controller.getOneHsn
);

router.post(
  '/editHsn',
  idNumberBodyControl,
  hsnRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateHsn(req, res, next);
  }
);

router.post('/listHsn', JwtMiddleware.checkToken, controller.listHsn);

const hsnRouter = router;

export default hsnRouter;
