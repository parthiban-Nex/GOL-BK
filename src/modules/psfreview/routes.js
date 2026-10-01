import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';
import multer from 'multer';
import { xsssanitize } from '../../config/xssmiddleware.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory
 router.post('/CreatePsfReview',JwtMiddleware.checkToken,controller.CreatePsfReview)
 router.post('/GetPsfReviewLog',JwtMiddleware.checkToken,controller.GetPsfReviewLog)
 router.post('/GetPsfReport',JwtMiddleware.checkToken,controller.GetPsfReport)
 router.get('/GetCustomerComplaintSource',JwtMiddleware.checkToken,controller.GetCustomerComplaintSource)
 router.post('/GetCustomerComplaint',JwtMiddleware.checkToken,controller.GetCustomerComplaint)
 router.post('/GetClosedCustomerComplaint',JwtMiddleware.checkToken,controller.GetClosedCustomerComplaint)
 router.post('/CreateCustomerCompliant',JwtMiddleware.checkToken,upload.single("file"),xsssanitize,controller.CreateCustomerCompliant)
 router.post('/GetComplaintReport',JwtMiddleware.checkToken,controller.GetComplaintReport)
 router.post('/UpdateCustomerCompliant',JwtMiddleware.checkToken,controller.UpdateCustomerCompliant)
  router.post('/GetCustomerComplaintForSa',JwtMiddleware.checkToken,controller.GetCustomerComplaintForSa)
 router.post('/UpdateCustomerComplaintForSa',JwtMiddleware.checkToken,upload.single("file"),xsssanitize,controller.UpdateCustomerComplaintForSa)



const PsfReviewRouter = router;

export default PsfReviewRouter;
