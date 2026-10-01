import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/stock_transfer_data',
  controller.CreateOracleStockTransfer
);
router.post(
  '/GetOracleStockTransfer', 
  JwtMiddleware.checkToken,
  controller.GetOracleStockTransfer
);
router.post(
  '/GetOracleStockTransferForGRN', 
  JwtMiddleware.checkToken,
  controller.GetOracleStockTransferForGRN
);

const StockTransferOracleRouter = router;

export default StockTransferOracleRouter;