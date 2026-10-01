import casualGatePassController from "../../modules/casualGatepass/controller.js";
import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';

const router = express.Router();

router.post('/addCasualGatePass', JwtMiddleware.checkToken, casualGatePassController.createCasualGatePass);
router.get('/casualGatePasspdf', JwtMiddleware.checkToken, casualGatePassController.downloadCasualGatePass);

router.post('/getTechnician', JwtMiddleware.checkToken, casualGatePassController.getTechnician);

router.post('/gatePassData', JwtMiddleware.checkToken, casualGatePassController.listCasualGatePass);
router.post('/CasualGatePassReportView', JwtMiddleware.checkToken, casualGatePassController.CasualGatePassReportView);
router.post('/CasualGatePassReportExport', JwtMiddleware.checkToken, casualGatePassController.CasualGatePassReportExport);
const casualGatePassRouter = router;

export default casualGatePassRouter;
