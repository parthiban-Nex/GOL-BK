import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { serviceBookingRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/getVehicleDetails',
  JwtMiddleware.checkToken,
  controller.getVehicleDetails
);

router.post(
  '/createServiceBooking', 
  JwtMiddleware.checkToken,
  serviceBookingRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addServiceBooking(req, res, next);
  }
);

router.post(
  '/create_service_booking',
  JwtMiddleware.checkToken,
  // serviceBookingRules['create'],
  // async (req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return next(new ValidationException(errors.array()));
  //   }
  //   return await controller.addServiceBookingMobile(req, res, next);
  // }
  controller.addServiceBookingMobile
);
router.all('/create_service_booking', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});
router.all('/create_policybazaar_booking', (req, res,next) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request2222'
      });
  }
    next(); 
});
router.post('/create_policybazaar_booking',
   serviceBookingRules['create_policybazaar'],
    async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addPolicyBazzarServiceBooking(req, res, next);
  },
  controller.addPolicyBazzarServiceBooking);
router.post(
  '/listServiceBookings',
  JwtMiddleware.checkToken,
  controller.listServiceBookings
);

router.post(
  '/listAppointments',
  JwtMiddleware.checkToken,
  controller.listAppointments
);

router.post(
  '/editServiceBooking',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  serviceBookingRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateServiceBooking(req, res, next);
  }
);

router.post(
  '/exportServiceBookings',
  JwtMiddleware.checkToken,
  controller.exportServiceBookings
);
router.post(
  '/getOpenBookings',
  JwtMiddleware.checkToken,
  controller.getOpenBookings
);
router.post(
  '/getServiceBookingData',
  JwtMiddleware.checkToken,
  controller.getServiceBookingData
);
router.post(
  '/loadServiceBookings',
  JwtMiddleware.checkToken,
  controller.loadServiceBookings
);

const serviceBookingRouter = router;

export default serviceBookingRouter;
