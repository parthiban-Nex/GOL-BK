import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';
const router = express.Router();
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
const images = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
]);



  
 router.get('/getAllActivityPlans',JwtMiddleware.MobileCheckToken,
    controller.getAllActivityPlans)

router.post(
  '/createBeatPlan',
  JwtMiddleware.MobileCheckToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBeatPlan(req, res, next);
  }
);

 router.get('/getAllBeatPlans',JwtMiddleware.MobileCheckToken,
    controller.getAllBeatPlans)
 router.get('/getOneBeatPlan/:id',JwtMiddleware.MobileCheckToken,
    controller.getBeatPlanById)

router.post(
  '/addBeatPlanFranchiseUpdate',
  JwtMiddleware.MobileCheckToken,images,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBeatPlanFranchiseUpdate(req, res, next);
  }
);
router.post(
  '/getOneBeatPlanFranchiseUpdateById',
  JwtMiddleware.MobileCheckToken,
  controller.getOneBeatPlanFranchiseUpdateById
);

const mobileBeatPlanRouter = router;

export default mobileBeatPlanRouter;