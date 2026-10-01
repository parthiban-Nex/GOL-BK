import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();


  
 router.post('/erp_stock_transfer',JwtMiddleware.MobileCheckToken,
    controller.CreateErpStockTransfer)

const mobileErpRouter = router;

export default mobileErpRouter;