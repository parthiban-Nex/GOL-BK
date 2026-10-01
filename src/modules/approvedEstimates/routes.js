import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';
import approvedEstimatesController from './controller.js'

const router = express.Router();

router.post('/getApprovedEstimates', JwtMiddleware.checkToken, approvedEstimatesController.listApprovedEstimates);

router.post('/setApprovalStatus', JwtMiddleware.checkToken, approvedEstimatesController.setApprovalStatus);

const approvedEstimates = router;

export default approvedEstimates;