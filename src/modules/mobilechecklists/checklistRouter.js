import ChecklistController from "./controller.js";
import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';
import GoogleController from "./google.js";
const router = express.Router();

router.post('/savechecklist', JwtMiddleware.MobileCheckToken,ChecklistController.saveCheckList);
router.post('/getCheckList',JwtMiddleware.MobileCheckToken,ChecklistController.getCheckList);
router.post('/googlecheck',JwtMiddleware.MobileCheckToken,ChecklistController.whatsAppinspectionreport);
router.post('/auth',JwtMiddleware.MobileCheckToken,GoogleController.AccessToken);

const checkListsRouter = router;

export default checkListsRouter;