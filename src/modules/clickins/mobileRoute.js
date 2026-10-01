import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';

// router
const router = express.Router();

router.post('/getInspectionLink',JwtMiddleware.MobileCheckToken,controller.getInspectionLink);
router.post('/clickinautosaveestimate',JwtMiddleware.MobileCheckToken,controller.clickinautosaveestimate);
router.post('/clickinpostcallback',JwtMiddleware.MobileCheckToken,controller.clickinpostcallback);


const MobileClickinsRouter = router;

export default MobileClickinsRouter;