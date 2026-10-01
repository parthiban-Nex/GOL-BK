import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { disPositionRules } from './rules/rule.js';
import commonLogics from '../../shared/commonLogics.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createDisposition',
  disPositionRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addDisPosition(req, res, next);
  }
);

router.post(
  '/getAllDisPositions',
  JwtMiddleware.checkToken,
  controller.getAllDisPositions
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneDisPosition
);

router.post(
  '/editDisposition',
  idNumberBodyControl,
  disPositionRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateDisPosition(req, res, next);
  }
);

router.post(
  '/import',
  JwtMiddleware.checkToken,
  controller.bulkImportOnCsvFiles
);
router.post(
  '/listDispositions',
  JwtMiddleware.checkToken,
  controller.listDisPositions
);

router.post(
  '/getCustomerDisPositions',
  JwtMiddleware.checkToken,
  controller.getCustomerDisPositions
);

router.post(
  '/getDisPositionsByType',
  JwtMiddleware.checkToken,
  controller.getDisPositionsByType
);


const dispositionRouter = router;
export default dispositionRouter;
