import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { itemCategorieRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createItemCategory',
  itemCategorieRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addItemCategorie(req, res, next);
  }
);

router.get(
  '/getAllItemCategory',
  JwtMiddleware.checkToken,
  controller.getAllItemCategorie
);

router.post(
  '/getItemCategoryList',
  JwtMiddleware.checkToken,
  controller.getItemCategoryList
);

router.post(
  '/getItemCategoryById',
  JwtMiddleware.checkToken,
  idNumberBodyControl,
  controller.getItemCategoryById
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneItemCategorie
);

router.post(
  '/updateItemCategory',
  itemCategorieRules['update'],
  JwtMiddleware.checkToken,
  idNumberBodyControl,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateItemCategorie(req, res, next);
  }
);

const itemcategorieRouter = router;

export default itemcategorieRouter;
