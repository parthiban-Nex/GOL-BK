import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { varientRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();
router.get(
  '/getFuelTypes',
  JwtMiddleware.checkToken,
  controller.getAllFuelType
);

router.post(
  '/createVarient',
  varientRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVarient(req, res, next);
  }
);

router.get(
  '/getAllVariants',
  JwtMiddleware.checkToken,
  controller.getAllVarient
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneVarient
);

router.post(
  '/editVarient',
  idNumberBodyControl,
  varientRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateVarient(req, res, next);
  }
);

router.post('/listVarients', JwtMiddleware.checkToken, controller.listVarients);

const varientRouter = router;

export default varientRouter;
