import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { itemGroupRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  itemGroupRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addItemGroup(req, res, next);
  }
);
router.get(
  '/getItemGroups',
  JwtMiddleware.checkToken,
  controller.getAllItemGroup
);

router.post(
  '/listItemGroups',
  JwtMiddleware.checkToken,
  controller.listItemGroup
);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneItemGroup
);

router.post(
  '/editItemGroup',
  idNumberBodyControl,
  itemGroupRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateItemGroup(req, res, next);
  }
);

const itemGroupRouter = router;

export default itemGroupRouter;
