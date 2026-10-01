import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/GetTaslAutoGrn',
  JwtMiddleware.checkToken,
  controller.GetTaslAutoGrn
);
router.post(
  '/GetTaslAutoGrnDetails',
  JwtMiddleware.checkToken,
  controller.GetTaslAutoGrnForGateIn
);
const TaslAutoGrnRouter = router;

export default TaslAutoGrnRouter;