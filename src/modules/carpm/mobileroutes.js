import JwtMiddleware from '../../config/jwtMiddleware.js';
import CarpmController from './controller.js';
import express from 'express';


const router = express.Router();

router.post("/carpmcallback",CarpmController.carpmcallback );

router.post("/carpmscanrequired",JwtMiddleware.MobileCheckToken ,CarpmController.carpmScanRequired);

router.post("/carpmscanvalidcheck",JwtMiddleware.MobileCheckToken,CarpmController.carpmscanvalidcheck);

router.post("/savecarpmstatus",JwtMiddleware.MobileCheckToken,CarpmController.savecarpmstatus); // okay 

const carpmRouter = router;
export default carpmRouter;
