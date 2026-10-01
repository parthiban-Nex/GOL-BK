import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/createPartIssue',
  JwtMiddleware.MobileCheckToken,
  controller.CreatePartIssue
);

const mobilePartIssueRouter = router;

export default mobilePartIssueRouter;

