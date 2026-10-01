import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';
import { UomRules } from './rules/rule.js';

const router = express.Router();

const uomRouter = router;
router.post('/getUomList', JwtMiddleware.checkToken, controller.getUomAllList);
router.post(
  '/addUom',
  UomRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addUom(req, res, next);
  }
);

router.post(
  '/editUom',
  idNumberBodyControl,
  UomRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateUom(req, res, next);
  }
);
router.get('/listUom', JwtMiddleware.checkToken, controller.listUom);
router.post('/searchUom', JwtMiddleware.checkToken, controller.searchUomData);
export default uomRouter;
