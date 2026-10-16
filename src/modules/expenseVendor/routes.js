import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import { expenseVendorRules } from './rules/rule.js';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post(
  '/createExpenseVendor',
  JwtMiddleware.checkToken,
  upload.single('document'),
  expenseVendorRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createExpenseVendor(req, res, next);
  }
);

router.post(
  '/listExpenseVendors',
  JwtMiddleware.checkToken,
  controller.listExpenseVendors
);

const expenseVendorRouter = router;
export default expenseVendorRouter;
