import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';

const router = express.Router();

router.post(
  '/',
  JwtMiddleware.MobileCheckToken,
  controller.labourDetailsMobile 
)
const mobileLaborScheduleRouter = router;

export default mobileLaborScheduleRouter;