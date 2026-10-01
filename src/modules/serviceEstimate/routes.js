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
  '/searchEstimateLineItems',
  serviceEstimateRules['searchEstimateLineItems'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.searchEstimateLineItems(req, res, next);
  }
);

router.post(
  '/getEstimateLineItemDetails',
  serviceEstimateRules['getEstimateLineItemDetails'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.getEstimateLineItemDetails(req, res, next);
  }
);

router.post(
  '/createServiceEstimate',
  serviceEstimateRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createServiceEstimate(req, res, next);
  }
);

router.post(
  '/create_service_estimate',
  // serviceEstimateRules['create'],
  JwtMiddleware.checkToken,
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
  '/listServiceEstimate',
  JwtMiddleware.checkToken,
  controller.listServiceEstimate
);
router.post(
  '/updateServiceEstimate',
  JwtMiddleware.checkToken,
  serviceEstimateRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateServiceEstimate(req, res, next);
  }
);

// router.post(
//   '/update_estimate',
//   JwtMiddleware.checkToken,
//   controller.updateServiceEstimateMobile
// );
// router.all('/update_estimate', (req, res) => {
//   if (req.method !== 'POST') {
//       return res.status(400).json({ 
//         requestSuccessful: false,
//         code: 400,
//         message: 'Bad Request'
//       });
//   }
// });
router.get('/generatePDF', JwtMiddleware.checkToken, controller.generatePDF); 
router.post(
  '/shareEstimateOnWhatsApp',
  JwtMiddleware.checkToken,
  serviceEstimateRules['shareEstimateOnWhatsApp'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.shareEstimateOnWhatsApp(req, res, next);
  }
);
router.post(
  '/approveServiceEstimate',
  JwtMiddleware.checkToken,
  serviceEstimateRules['approveServiceEstimate'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.approveServiceEstimate(req, res, next);
  }
);
router.get(
  '/getEstimate',
  JwtMiddleware.checkToken,
  controller.getServiceEstimate
);
router.post(
  '/getOpenEstimates',
  JwtMiddleware.checkToken,
  controller.getOpenEstimates
);
router.post(
  '/loadOpenEstimate',
  JwtMiddleware.checkToken,
  controller.loadOpenEstimate
);

// router.post(
//   '/get_service_estimate',
//   JwtMiddleware.checkToken,
//   controller.getServiceEstimateMobile
// );
// router.all('/get_service_estimate', (req, res) => {
//   if (req.method !== 'POST') {
//       return res.status(400).json({ 
//         requestSuccessful: false,
//         code: 400,
//         message: 'Bad Request'
//       });
//   }
// });
router.post('/createManyEstimate', JwtMiddleware.checkToken, controller.createManyEstimate);
const serviceEstimateRouter = router;

export default serviceEstimateRouter;
