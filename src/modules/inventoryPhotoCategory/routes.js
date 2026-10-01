import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { InventoryPhotoCategoryRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import multer from 'multer';
import express from 'express';

const router = express.Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

router.post(
  '/createInventoryPhotoCategory',
  JwtMiddleware.checkToken,
  upload.single('iconLink'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInventoryPhotoCategory(req, res, next);
  }
);

router.post(
  '/updateInventoryPhotoCategory',
  JwtMiddleware.checkToken,
  upload.single('iconLink'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateInventoryPhotoCategory(req, res, next);
  }
);

router.post(
  '/deleteInventoryPhotoCategory',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.deleteInventoryPhotoCategory(req, res, next);
  }
);

router.post(
  '/listInventoryPhotoCategories',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    return await controller.listInventoryPhotoCategories(req, res, next);
  }
);

const inventoryPhotoCategoryRouter = router;
export default inventoryPhotoCategoryRouter;
