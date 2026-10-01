import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';

const router = express.Router();

router.post('/getVehicleForScheme', JwtMiddleware.checkToken, controller.getVehicleForScheme);

router.post('/getSchemeDetails', JwtMiddleware.checkToken, controller.getSchemeDetails);

router.post('/listVehicleContract', JwtMiddleware.checkToken, controller.listVehicleContract);

router.post('/createVehicleContract', JwtMiddleware.checkToken, controller.createVehicleContract);

router.post('/editVehicleContract', JwtMiddleware.checkToken); //add contoller route if edit needed in future

router.get('/vehicleContractPDF', JwtMiddleware.checkToken, controller.vehicleContractPDF); 

router.get('/vehicleContractSchemePDF', JwtMiddleware.checkToken, controller.vehicleContractSchemePDF);

router.post('/getVehicleContractData', JwtMiddleware.checkToken, controller.getVehicleContractData);

router.post('/exportVehicleContractData', JwtMiddleware.checkToken, controller.exportVehicleContractData);

const vehicleContractRouter =  router;

export default vehicleContractRouter;