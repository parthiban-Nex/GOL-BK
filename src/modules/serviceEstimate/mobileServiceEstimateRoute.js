import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { serviceEstimateRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createServiceEstimate',
  serviceEstimateRules['create'],
  JwtMiddleware.MobileCheckToken,
  // async (req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return next(new ValidationException(errors.array()));
  //   }
  //   return await controller.createServiceEstimate(req, res, next);
  // }
  controller.createServiceEstimateMobile
);

router.post(
  '/create_service_estimate',
  // serviceEstimateRules['create'],
  JwtMiddleware.MobileCheckToken,
  // async (req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return next(new ValidationException(errors.array()));
  //   }
  //   return await controller.createServiceEstimateMobile(req, res, next);
  // }
  controller.createServiceEstimateMobile
);
router.all('/create_service_estimate', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post(
  '/update_estimate',
  JwtMiddleware.MobileCheckToken,
  controller.updateServiceEstimateMobile
);
router.all('/update_estimate', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post(
  '/get_service_estimate',
  JwtMiddleware.MobileCheckToken,
  controller.getServiceEstimateMobile
);
router.all('/get_service_estimate', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

const serviceEstimateRouter = router;

export default serviceEstimateRouter;