import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';


const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

const uploadMiddleware = upload.any();

router.post(
  '/createFranchiseOnboarding',
  JwtMiddleware.checkToken,
  uploadMiddleware,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
      return await controller.upsertFranchiseOnboarding(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/editFranchiseOnboarding',
  JwtMiddleware.checkToken, uploadMiddleware,
  idNumberBodyControl,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.upsertFranchiseOnboarding(req, res, next);
  }
);

router.post(
  '/getAllFranchiseOnboardings',
  JwtMiddleware.checkToken,
  controller.listFranchiseOnboardings

);
router.get(
  '/getSingleFranchiseOnboardingById/:id',
  JwtMiddleware.checkToken,
  controller.getSingleFranchiseOnboardingById
);

router.post(
  '/listCombinedOnboardings',
  JwtMiddleware.checkToken,
  controller.listCombinedOnboardings
);
router.post(
  '/listCombinedOnboardingsHeader',
  JwtMiddleware.checkToken,
  controller.listCombinedOnboardingsHeader
);

router.get(
  '/getAllFranchiseOnboardingDropdown',
  JwtMiddleware.checkToken,
  controller.getAllFranchiseOnboardingDropdown
);

router.post(
  '/updateHandover',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ValidationException(errors.array()));

      return await controller.updateHandover(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/updateAcceptOrReject',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ValidationException(errors.array()));

      return await controller.updateAcceptOrReject(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/updateFeeApprove',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ValidationException(errors.array()));

      return await controller.updateFeeApprove(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/handleApproval',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return next(new ValidationException(errors.array()));

      return await controller.handleApproval(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);


const franchiseOnboardingRouter = router;

export default franchiseOnboardingRouter;