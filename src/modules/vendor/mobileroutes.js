import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';

const router = express.Router();

router.post(
  '/getPincodeData',
  JwtMiddleware.MobileCheckToken,
  controller.getPincodeData
);
  
const mobileVendorRouter = router;

export default mobileVendorRouter;
