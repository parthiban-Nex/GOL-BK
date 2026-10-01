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
  JwtMiddleware.MobileCheckToken,
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
  JwtMiddleware.MobileCheckToken, uploadMiddleware,
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
  JwtMiddleware.MobileCheckToken,
  controller.listFranchiseOnboardings

);
router.get(
  '/getSingleFranchiseOnboardingById/:id',
  JwtMiddleware.MobileCheckToken,
  controller.getSingleFranchiseOnboardingById
);

router.post(
  '/listCombinedOnboardings',
  JwtMiddleware.MobileCheckToken,
  controller.listCombinedOnboardings
);

router.get(
  '/getAllFranchiseOnboardingDropdown',
  JwtMiddleware.MobileCheckToken,
  controller.getAllFranchiseOnboardingDropdown
);

router.post(
  '/listCombinedOnboardingsHeader',
  JwtMiddleware.MobileCheckToken,
  controller.listCombinedOnboardingsHeader
);


router.post(
  '/updateHandover',
  JwtMiddleware.MobileCheckToken,
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
  JwtMiddleware.MobileCheckToken,
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

router.get(
  '/getAllExistingFranchise',
  JwtMiddleware.MobileCheckToken,
  controller.getAllExistingFranchise
);


const mobileFranchiseOnboardingRouter = router;

export default mobileFranchiseOnboardingRouter;
