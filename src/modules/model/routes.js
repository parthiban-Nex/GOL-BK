import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { modelRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createmodel',
  modelRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addModel(req, res, next);
  }
);

router.post('/getAllModels', JwtMiddleware.checkToken, controller.getAllModels);

router.post(
  '/getModelsByMake',
  JwtMiddleware.checkToken,
  controller.getModelsByMake
);
router.post(
  '/getVarientByModel',
  JwtMiddleware.checkToken,
  controller.getVarientByModel
);
router.post( 
  '/getModelList',
  JwtMiddleware.checkToken,
  controller.getAllModelsList
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneModel
);

router.post(
  '/updateModel',
  modelRules['update'],
  JwtMiddleware.checkToken,
  idNumberBodyControl,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateModel(req, res, next);
  }
);


const modelRouter = router;

export default modelRouter;
