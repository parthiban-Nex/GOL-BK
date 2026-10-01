import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
 const router = express.Router();
 router.post('/getPartIssue',JwtMiddleware.checkToken, controller.GetPartIssue);
 router.post('/createPartReturn',JwtMiddleware.checkToken, controller.CreatePartReturn);
 router.post('/GetSalesReturnReport',JwtMiddleware.checkToken, controller.GetSalesReturnReport);

 const partReturnRouter = router;

export default partReturnRouter;