import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createRoughEstimate',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createRoughEstimate(req, res, next);
  }
);

router.post(
  '/listRoughEstimate',
  JwtMiddleware.checkToken,
  controller.listRoughEstimate
);
router.post(
  '/updateRoughEstimate',
  JwtMiddleware.checkToken,
  controller.updateRoughEstimate 
);
router.get('/generatePDF', JwtMiddleware.checkToken, controller.generatePDF); 


const roughEstimateRouter = router;

export default roughEstimateRouter;