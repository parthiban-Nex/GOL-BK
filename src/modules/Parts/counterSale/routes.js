import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/createCounterSale',
  JwtMiddleware.checkToken,
  controller.CreateCounterSale
);
router.post(
  '/getCounterSale',
  JwtMiddleware.checkToken,
  controller.GetCounterSale
);

router.post( 
  '/getCounterSaleSearchData',
  JwtMiddleware.checkToken,
  controller.getCounterSaleSearchData
);
router.post(
  '/countersalepdf',
  JwtMiddleware.checkToken,
  controller.GenerateCounterSalePdf
);
router.post(
  '/countersalereturnpdf',
  JwtMiddleware.checkToken,
  controller.GenerateCounterSaleReturnPdf
);
router.post(
  '/getCountersaleForReturn',
  JwtMiddleware.checkToken,
  controller.GetCounterSaleForReturn
);
router.post(
  '/createCountersaleReturn',
  JwtMiddleware.checkToken,
  controller.CreateCounterSaleReturn
);
router.post(
  '/getCountersaleReturn',
  JwtMiddleware.checkToken,
  controller.GetCounterSaleReturn
);
router.post(
  '/CreateCounterSaleRequest',
  JwtMiddleware.checkToken,
  controller.CreateCounterSaleRequest
);
router.post(
  '/GetCounterSaleRequest',
  JwtMiddleware.checkToken,
  controller.GetCounterSaleRequest
);
router.post(
  '/GetCounterSaleReqForApprove',
  JwtMiddleware.checkToken,
  controller.GetCounterSaleReqForApprove
);
router.post(
  '/ApproveCounterSale',
  JwtMiddleware.checkToken,
  controller.ApproveCounterSale
);
router.post(
  '/GetCounterSaleReqForCreateCS',
  JwtMiddleware.checkToken,
  controller.GetCounterSaleReqForCreateCS
);
router.post(
  '/CreateCounterSaleGatePass',
  JwtMiddleware.checkToken,
  controller.CreateCounterSaleGatePass
);
router.post(
  '/GenerateCounterSaleGatePassPdf',
  JwtMiddleware.checkToken,
  controller.GenerateCounterSaleGatePassPdf
);
const counterSaleRouter = router;

export default counterSaleRouter;
