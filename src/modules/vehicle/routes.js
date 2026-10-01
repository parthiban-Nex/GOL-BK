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
  '/validateBulkVehicle',
  JwtMiddleware.checkToken,
  upload.single('vehiclexls'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.validateBulkVehicle(req, res, next);
  }
);


 router.post(
  '/createBulkVehicle',
  JwtMiddleware.checkToken,
  upload.single('vehiclexls'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBulkVehicle(req, res, next);
  }
);

router.post(
  '/createVehicle',
  vehicleRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVehicle(req, res, next);
  }
);

router.post(
  '/add_vehicle',
  vehicleRules['createM'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createVehicle(req, res, next);
  }
  // controller.createVehicle
);
router.all('/add_vehicle', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});
router.post('/listVehicles', JwtMiddleware.checkToken, controller.listVehicles);

router.post('/vehicle_search', JwtMiddleware.checkToken, controller.vehicleSearch);
router.all('/vehicle_search', (req, res) => {
  if (req.method !== 'POST') {
    // console.log('route console trigger')
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post(
  '/editVehicle',
  idNumberBodyControl,
  vehicleRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateVehicle(req, res, next);
  }
);

router.post(
  '/edit_vehicles',
  // idNumberBodyControl,
  // vehicleRules['update'],
  JwtMiddleware.checkToken,
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

router.get(
  '/getAllVechicleColors',
  JwtMiddleware.checkToken,
  controller.getAllVechicleColors
);

router.post(
  '/addVehicleTest',
  vehicleRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addVehicleTest(req, res, next);
  }
);

router.post(
  '/getVehicleDetailsByRegNo',
  JwtMiddleware.checkToken,
  controller.getVehicleDetails
);

router.post(
  '/listVehiclesForCustomerComplaint',
  JwtMiddleware.checkToken,
  controller.listVehiclesForCustomerComplaint
);

const vehicleRouter = router;

export default vehicleRouter;
