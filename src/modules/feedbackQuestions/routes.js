import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();
 router.get('/GetFeedbackQn',JwtMiddleware.checkToken,controller.GetFeedbackQn)


const feedbackQnRouter = router;

export default feedbackQnRouter;
