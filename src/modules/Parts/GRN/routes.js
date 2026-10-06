import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
import { xsssanitize } from '../../../config/xssmiddleware.js';
import multer from 'multer';
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

 router.post('/createGrn',JwtMiddleware.checkToken, controller.CreateGrn);
 router.post('/createGrnDocument',JwtMiddleware.checkToken,controller.CreateGrnDocument)
 router.get('/GRNDocuments',JwtMiddleware.checkToken,controller.GetGrnDocuments)
 router.post('/GRN',JwtMiddleware.checkToken,controller.GetGrns)
 router.post('/Grnpdf',JwtMiddleware.checkToken,controller.GenerateGrnPdf)
 router.post('/GetGRNForPurchaseReturn',JwtMiddleware.checkToken,controller.GetGrnDataForReturn)
 router.post('/CreatePurchaseReturn',JwtMiddleware.checkToken,controller.CreatePurchaseReturn)
 router.post('/GetPurchaseReturn',JwtMiddleware.checkToken,controller.GetPurchaseReturn)
 router.post('/GetQuickItemSearch',JwtMiddleware.checkToken,controller.GetQuickItemSearch)
 router.post('/GetCounterSalePart',JwtMiddleware.checkToken,controller.getPartsForCounterSale)
 router.post('/GetPurchaseReport',JwtMiddleware.checkToken,controller.GetPurchaseReport)
 router.post('/GetPurchaseAxaptaReport',JwtMiddleware.checkToken,controller.GetPurchaseAxaptaReport)
 router.post('/GetStockTransferInwardReport',JwtMiddleware.checkToken,controller.GetStockTransferInwardReport)
 router.post('/GetPurchaseReturnReport',JwtMiddleware.checkToken,controller.GetPurchaseReturnReport)
 router.post('/GetSalesReport',JwtMiddleware.checkToken,controller.GetSalesReport) 
 router.post('/GetSpareSalesAxapta',JwtMiddleware.checkToken,controller.GetSpareSalesAxapta) 
 router.post('/GetStockAdjustmentSearch',JwtMiddleware.checkToken,controller.GetStockAdjustmentSearch) 
 router.post('/CreateNegStockAdjustment',JwtMiddleware.checkToken,controller.CreateNegStockAdjustment) 
 router.post('/GetStockAdjustment',JwtMiddleware.checkToken,controller.GetStockAdjustment) 
 router.post('/GetStockPositionReport',JwtMiddleware.checkToken,controller.GetStockPositionReport) 
 router.post('/GetStockAdjustmentReport',JwtMiddleware.checkToken,controller.GetStockAdjustmentReport) 
 router.post('/GetAPReport',JwtMiddleware.checkToken,controller.GetAPReport) 
 router.post('/GetReceiptReport',JwtMiddleware.checkToken,controller.GetReceiptReport)  
 router.post('/CreateOracleStockTransferGrn',JwtMiddleware.checkToken,controller.CreateOracleStockTransferGrn)  
 router.post('/GetAutoFocusGrn',JwtMiddleware.checkToken,controller.GetAutoFocusGrn)  
 router.post('/GetItemFinder',JwtMiddleware.checkToken,controller.GetItemFinder)  
 router.post('/GetPurchaseDetails',JwtMiddleware.checkToken,controller.GetPurchaseDetails)  
 router.post('/GetSaleDetails',JwtMiddleware.checkToken,controller.GetSaleDetails)  
 router.post('/GetStockTransferParts',JwtMiddleware.checkToken,controller.GetStockTransferParts)  
 router.get('/GetInventoryStockForGMS',JwtMiddleware.checkToken,controller.GetInventoryStockForGMS)
 router.post('/dashboardPurchaseFromMytvs',JwtMiddleware.checkToken,controller.dashboardPurchaseFromMytvs) 
 router.post('/GetZohoBillReport',JwtMiddleware.checkToken,controller.GetZohoBillReport)
 router.post('/GetKitaraApReport',JwtMiddleware.checkToken,controller.GetKitaraApReport)
 router.post('/GetZohoApReport',JwtMiddleware.checkToken,controller.GetZohoApReport)
 router.post('/CreatePOGrn',JwtMiddleware.checkToken,upload.single("file"),xsssanitize, controller.CreatePOGrn);
 router.post('/GetOldBinLocations',JwtMiddleware.checkToken,controller.GetOldBinLocations)
 router.post('/UpdateOldBinLocations',JwtMiddleware.checkToken,controller.UpdateOldBinLocations)
 router.post('/updateGrn',JwtMiddleware.checkToken, controller.updateGrn);


const partsRouter = router;

export default partsRouter;
