import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { laborScheduleRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createLaborSchedule',
  laborScheduleRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addLaborSchedule(req, res, next);
  }
);

router.post(
  '/editLaborSchedule',
  idNumberBodyControl,
  laborScheduleRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateLaborSchedule(req, res, next);
  }
);

router.post(
  '/listLaborSchedule',
  JwtMiddleware.checkToken,
  controller.listLaborSchedule
);

router.post(
  '/getLabourDetails',  
  laborScheduleRules['get'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.getLabourDetails(req, res, next);
  }
);
router.post(
  '/getOslLabourDetails',
  laborScheduleRules['get'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.getOslLabourDetails(req, res, next);
  }
);
router.post(
  '/searchLabourDetails',
  JwtMiddleware.checkToken,
  controller.searchLabourDetails
);
router.post(
  '/searchOslLabourDetails',
  JwtMiddleware.checkToken,
  controller.searchOslLabourDetails
);
router.post(
  '/searchAllLabourDetails',
  JwtMiddleware.checkToken,
  controller.searchAllLabourDetails
);

router.post(
  '/labor_master',
  JwtMiddleware.checkToken,
  controller.labourDetailsMobile
)
const laborScheduleRouter = router;

export default laborScheduleRouter;
