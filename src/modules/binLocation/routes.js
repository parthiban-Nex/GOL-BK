import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { binLocationRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createBinLocation',
  binLocationRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBinLocation(req, res, next);
  }
);

router.post(
  '/editBinLocation',
  idNumberBodyControl,
  binLocationRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateBinLocation(req, res, next);
  }
);

router.post(
  '/listBinLocations',
  JwtMiddleware.checkToken,
  controller.listBinLocations
);

router.post(
  '/listBinLocationsForOutlet',
  JwtMiddleware.checkToken,
  controller.listBinLocationsForOutlet
);
const binLocationRouter = router;
export default binLocationRouter;
