import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import { bankDepositRules } from './rules/rule.js';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post(
  '/createBankDeposit',
  JwtMiddleware.checkToken,
  upload.single('slip'),
  bankDepositRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createBankDeposit(req, res, next);
  }
);

router.post(
  '/editBankDeposit',
  JwtMiddleware.checkToken,
  upload.single('slip'),
  bankDepositRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.editBankDeposit(req, res, next);
  }
);

router.post(
  '/listBankDeposits',
  JwtMiddleware.checkToken,
  controller.listBankDeposits
);

router.post(
  '/getBankDeposit',
  JwtMiddleware.checkToken,
  bankDepositRules['getById'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.getBankDeposit(req, res, next);
  }
);

router.post(
  '/deleteBankDeposit',
  JwtMiddleware.checkToken,
  bankDepositRules['delete'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.deleteBankDeposit(req, res, next);
  }
);

router.post(
  '/uploadDepositSlip',
  JwtMiddleware.checkToken,
  upload.single('slip'),
  controller.uploadDepositSlip
);

router.post(
  '/getBankDepositStats',
  JwtMiddleware.checkToken,
  controller.getBankDepositStats
);

router.post(
  '/listEditHistories',
  JwtMiddleware.checkToken,
  controller.listEditHistories
);

router.post(
  '/history',
  JwtMiddleware.checkToken,
  controller.listEditHistories
);

const bankDepositRouter = router;
export default bankDepositRouter;
