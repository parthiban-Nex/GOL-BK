import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/createStockTransfer',
  JwtMiddleware.checkToken,
  controller.CreateStockTransfer
);
router.post(
  '/getStockTransfer',
  JwtMiddleware.checkToken,
  controller.GetStockTransfer
);
router.post(
  '/getInwardStockTransfer',
  JwtMiddleware.checkToken,
  controller.GetInwardStockTransfer
);
router.post(
  '/stockTransferPdf',
  JwtMiddleware.checkToken,
  controller.GenerateStockTransferPdf
);
router.post(
  '/getStockTransferForInward',
  JwtMiddleware.checkToken,
  controller.GetStockTransferForInward
);
router.post(
  '/stockTransferReport',
  JwtMiddleware.checkToken,
  controller.GetStockTransferReport
);

router.post(
  '/CreateStockTransferGatePass',
  JwtMiddleware.checkToken,
  controller.CreateStockTransferGatePass
);

router.post(
  '/GenerateStockTransferGatePassPdf',
  JwtMiddleware.checkToken,
  controller.GenerateStockTransferGatePassPdf
);
router.post(
  '/CreateStockTransferReq',
  JwtMiddleware.checkToken,
  controller.CreateStockTransferReq
);

router.post(
  '/GetStockTransferReq',
  JwtMiddleware.checkToken,
  controller.GetStockTransferReq
);

router.post(
  '/GetStockTransferReqForApprove',
  JwtMiddleware.checkToken,
  controller.GetStockTransferReqForApprove
);

router.post(
  '/GetStockTransferReqFrom',
  JwtMiddleware.checkToken,
  controller.GetStockTransferReqFrom
);


const StockTransferRouter = router;

export default StockTransferRouter;
