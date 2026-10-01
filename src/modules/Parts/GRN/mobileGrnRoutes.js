import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();


  
 router.get('/GetInventoryStockForGMS',JwtMiddleware.MobileCheckToken,
    controller.GetInventoryStockForGMS)
 router.post('/dashboardPurchaseFromMytvs',JwtMiddleware.MobileCheckToken,controller.dashboardPurchaseFromMytvs)
 router.post('/createGrn',JwtMiddleware.MobileCheckToken, controller.CreateGrn);
 router.post('/CreateOracleStockTransferGrn',JwtMiddleware.MobileCheckToken,controller.CreateOracleStockTransferGrn)  

const mobilePartsRouter = router;

export default mobilePartsRouter;