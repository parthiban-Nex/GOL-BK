import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/erp_stock_transfer',
  controller.CreateErpStockTransfer
);
router.post(
  '/GetErpStockTransfer', 
  JwtMiddleware.checkToken,
  controller.GetErpStockTransfer
);
router.post(
  '/GetErpStockTransferForGRN', 
  JwtMiddleware.checkToken,
  controller.GetErpStockTransferForGRN
);
const erpStockTransferRouter = router;

export default erpStockTransferRouter;