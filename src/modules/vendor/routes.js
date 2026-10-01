import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { vendorRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createVendor',
  vendorRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVendor(req, res, next);
  }
);

router.post(
  '/getAllVendors',
  JwtMiddleware.checkToken,
  controller.getAllVendors
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneVendor
);

router.post(
  '/editVendor',
  idNumberBodyControl,
  vendorRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateVendor(req, res, next);
  }
);

router.post(
  '/getPincodeData',
  JwtMiddleware.checkToken,
  controller.getPincodeData
);
router.post(
  '/searchAreaName',
  JwtMiddleware.checkToken,
  controller.searchAreaName
);
router.post('/listVendors', JwtMiddleware.checkToken, controller.listVendors);
router.post('/listVendorsForPo', JwtMiddleware.checkToken, controller.listVendorsForPo);

router.post(
  '/getAllVendorsByCompany',
  JwtMiddleware.checkToken,
  controller.getAllVendorsByCompany
);

const vendorRouter = router;

export default vendorRouter;
