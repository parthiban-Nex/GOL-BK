import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();
import multer from 'multer';
import { xsssanitize } from '../../../config/xssmiddleware.js';
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory
 router.post('/createGateIn',JwtMiddleware.checkToken, controller.CreateGateIn);
 router.post('/getGateIn',JwtMiddleware.checkToken,controller.GetGateIn)
 router.post("/getGateInForGRN",JwtMiddleware.checkToken,controller.GetGateinForGRN)
 router.post("/updateGateIn",JwtMiddleware.checkToken,upload.single("file"),xsssanitize,controller.UpdateGateIn)
 router.post("/GetGateinReport",JwtMiddleware.checkToken,controller.GetGateinReport)

const partsRouter = router;

export default partsRouter;
