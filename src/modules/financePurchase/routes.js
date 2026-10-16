import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import { financePurchaseRules } from './rules/rule.js';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post(
  '/createPurchase',
  JwtMiddleware.checkToken,
  upload.single('document'),
  financePurchaseRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createPurchase(req, res, next);
  }
);

router.post(
  '/editPurchase',
  JwtMiddleware.checkToken,
  upload.single('document'),
  financePurchaseRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.editPurchase(req, res, next);
  }
);

router.post(
  '/listPurchases',
  JwtMiddleware.checkToken,
  controller.listPurchases
);

router.post(
  '/getPurchase',
  JwtMiddleware.checkToken,
  controller.getPurchase
);

router.post(
  '/uploadPurchaseDocument',
  JwtMiddleware.checkToken,
  upload.single('document'),
  controller.uploadPurchaseDocument
);

router.post(
  '/addPayment',
  JwtMiddleware.checkToken,
  financePurchaseRules['addPayment'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addPayment(req, res, next);
  }
);

router.post(
  '/getPurchasePayments',
  JwtMiddleware.checkToken,
  controller.getPurchasePayments
);

const financePurchaseRouter = router;
export default financePurchaseRouter;
