import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
import multer from 'multer';
import { xsssanitize } from '../../../config/xssmiddleware.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

 router.post('/createPO',JwtMiddleware.checkToken,upload.single("file"),xsssanitize, controller.CreatePO);

 router.post('/getPO',JwtMiddleware.checkToken,controller.GetPO)
 router.post('/POpdf',JwtMiddleware.checkToken,controller.GeneratePOPdf)
 router.post('/createAutoPO',JwtMiddleware.checkToken, controller.CreateAutoPO);
router.post('/POReport',JwtMiddleware.checkToken,controller.GetPOReport)
router.post('/getPOForApprove',JwtMiddleware.checkToken,controller.GetPOForApporove)
router.post('/getPODetailsForApprove',JwtMiddleware.checkToken,controller.GetPODetailsForApprove)
router.post('/approvePO',JwtMiddleware.checkToken, controller.ApprovePO);
router.post('/getPOForGRN',JwtMiddleware.checkToken,controller.GetPOForGRN)
router.post('/getPOForEditing',JwtMiddleware.checkToken,controller.GetPOForEditing)
router.post('/GetPOForView',JwtMiddleware.checkToken,controller.GetPOForView)




const PORouter = router;

export default PORouter;
