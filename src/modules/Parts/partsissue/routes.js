import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post(
  '/createPartIssue',
  JwtMiddleware.checkToken,
  controller.CreatePartIssue
);
router.post('/GetIndentPartIssue',JwtMiddleware.checkToken,controller.GetIndentPartIssueReport)  
router.post('/GetSalesGrossMarginReport',JwtMiddleware.checkToken,controller.GetSalesGrossMarginReport)  
router.post('/GetARReport',JwtMiddleware.checkToken,controller.GetARReport)  
router.post('/GetDeliveryVehicles',JwtMiddleware.checkToken,controller.GetDeliveryVehicles)  
router.post('/GetDeliveryVehiclesDetails',JwtMiddleware.checkToken,controller.GetDeliveryVehiclesDetails)  
router.post('/GetCNReport',JwtMiddleware.checkToken,controller.GetCNReport)  
router.post('/UpdateEtaForIndent',JwtMiddleware.checkToken,controller.UpdateEtaForIndent)  
router.post('/GetZohoInvoiceReport',JwtMiddleware.checkToken,controller.GetZohoInvoiceReport) 
router.post('/GetKitaraArReport',JwtMiddleware.checkToken,controller.GetKitaraArReport)  
router.post('/GetZohoArReport',JwtMiddleware.checkToken,controller.GetZohoArReport)  



const partIssueRouter = router;

export default partIssueRouter;
