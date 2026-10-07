import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import { expenseRules } from './rules/rule.js';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post(
  '/createExpense',
  JwtMiddleware.checkToken,
  upload.single('document'),
  expenseRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createExpense(req, res, next);
  }
);

router.post(
  '/editExpense',
  JwtMiddleware.checkToken,
  upload.single('document'),
  expenseRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.editExpense(req, res, next);
  }
);

router.post(
  '/listExpenses',
  JwtMiddleware.checkToken,
  controller.listExpenses
);

router.post(
  '/uploadExpenseDocument',
  JwtMiddleware.checkToken,
  upload.single('document'),
  controller.uploadExpenseDocument
);

const expenseRouter = router;
export default expenseRouter;
