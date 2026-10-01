import MastersController from "./controller.js";
import JwtMiddleware from "../../config/jwtMiddleware.js";
import PincodeMasterController from "../vendor/controller.js";
import express from 'express';

const router = express.Router();

router.post('/', JwtMiddleware.MobileCheckToken,MastersController.getMastersData);

router.post('/pincodeMaster', JwtMiddleware.MobileCheckToken,MastersController.pincodeMaster);

router.post('/fetchPincodeData', JwtMiddleware.MobileCheckToken,PincodeMasterController.getPincodeData);

router.post('/checkAppVersion',JwtMiddleware.MobileCheckToken,MastersController.checkAppVersion);
router.post('/announcements',JwtMiddleware.MobileCheckToken,MastersController.announcements);
router.post('/updateuserdetails',JwtMiddleware.MobileCheckToken,MastersController.updateuserdetails);

const mobileMastersRouter = router;

export default mobileMastersRouter;