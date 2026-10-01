import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { vehicleRules } from './rules/rule.js';
import express from 'express';
import multer from 'multer';
const router = express.Router();




const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });




router.post(
  '/add_vehicles',
  vehicleRules['createM'],
  JwtMiddleware.MobileCheckToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDescription = errors.array().map(err => err.msg).join(',');
      return res.status(400).json({
        requestSuccessful: false,
        errorDescription
      });
    }
    return await controller.createVehicle(req, res, next);
  }
  // controller.createVehicle
);
router.all('/add_vehicles', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post('/vehicle_search', JwtMiddleware.MobileCheckToken, controller.vehicleSearch); 
router.all('/vehicle_search', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});



router.post(
  '/edit_vehicles',
  // idNumberBodyControl,
  // vehicleRules['update'],
  JwtMiddleware.MobileCheckToken,
  // async (req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return next(new ValidationException(errors.array()));
  //   }
  //   return await controller.updateVehicleMobile(req, res, next);
  // }
  controller.updateVehicleMobile
);

router.all('/edit_vehicles', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post('/searchGateinVehicleStatus',JwtMiddleware.MobileCheckToken,controller.searchGateinVehicleStatus); // okay

router.post('/security_gate_in',JwtMiddleware.MobileCheckToken,controller.saveSecurityGateIn); // okay
router.post('/security_gate_out',JwtMiddleware.MobileCheckToken,controller.saveSecurityGateOut); // okay 
router.post('/savedriverlocation',JwtMiddleware.MobileCheckToken,controller.savedriverlocation); // okay


router.post('/getsecuritytasklist',JwtMiddleware.MobileCheckToken,controller.getsecuritytasklist); // okay 
router.post('/getVahanData',JwtMiddleware.MobileCheckToken,controller.getVahanData); // okay

router.post('/getvehiclehistory',JwtMiddleware.MobileCheckToken,controller.getvehiclehistory); // okay
router.post('/getvehiclehistorybyvisitid',JwtMiddleware.MobileCheckToken,controller.getvehiclehistorybyvisitid); // okay
router.post('/savecustomervoice',JwtMiddleware.MobileCheckToken,controller.saveCustomerVoice);
router.post('/managerassignsa',JwtMiddleware.MobileCheckToken,controller.managerassignsa); // okay
router.post('/managergateinassignsa',JwtMiddleware.MobileCheckToken,controller.managergateinassignsa); // okay
router.post('/updatebookingdetails',JwtMiddleware.MobileCheckToken,controller.updatebookingdetails); // okay

const mobileVehicleRouter = router;

export default mobileVehicleRouter;
