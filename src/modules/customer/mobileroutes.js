import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import { customerRules } from './rules/rule.js';
import express from 'express';
import multer from 'multer';
import CustomerDao from './dao.js';
import VehicleDao from './../vehicle/dao.js'
import VehicleService from '../vehicle/service.js';
import JobCardService from '../jobCard/service.js';
import CustomerService from './service.js';
import { vehicleRules } from './../vehicle/rules/rule.js';
import Utils from './../Utils/Utils.js';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });



router.post(
  '/add_customer',
  customerRules['createM'],
  JwtMiddleware.MobileCheckToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    const errorList = errors.array();
    const hasEmailError = errorList.some(err => err.msg === "emailId must be unique");
    const hasGstinError = errorList.some(err => err.msg === "visitMetadata.gstinNumber");
    const hasphoneError = errorList.some(err => err.msg === "mobileNumber must be unique");
    console.log('errors', errors);

    const updateFitLogs = await Utils.saveFitAppLogs(req.body, 'add_customer', 'request');

    if (!errors.isEmpty() && hasphoneError) {
      const updateCustomer = await CustomerService.updateCustomerMobile(req.body.customerID, req.body, req.user);

      if (updateCustomer[0] == 1) {
        const vehicleDetails = await addVehicle(req, res);
        const updateFitLogs = await Utils.saveFitAppLogs(req.body, 'add_customer', 'request', vehicleDetails);
        if (vehicleDetails.success) {
          return res.status(200).json({
            requestSuccessful: true,
            data: vehicleDetails.data
          });
        } else {
          return res.status(400).json({
            requestSuccessful: false,
            message: vehicleDetails.message
          });
        }
      } else {
        return res.status(400).json({
          requestSuccessful: false,
          message: "Upate Customer Failed !"
        })
      }
    }
    const addCustomerData = await CustomerService.addCustomerMobile(req.body, req.user);
    if (addCustomerData) {
      const vehicleDetails = await addVehicle(req, res);
      const updateFitLogs = await Utils.saveFitAppLogs(req.body, 'add_customer', 'response', vehicleDetails);
      if (vehicleDetails.success) {
        console.log("Outside")
        return res.status(200).json({
          requestSuccessful: true,
          data: vehicleDetails.data
        });
      } else {
        return res.status(400).json({
          requestSuccessful: false,
          message: vehicleDetails.message
        });
      }
    } else {
      return res.status(400).json({
        requestSuccessful: false,
        message: addCustomerData.message
      });
    }
  }
); // check again TODO

async function addVehicle(req, res) {
  const customerData = await CustomerDao.findByMobileNumber(req.body.mobileNumber);
  let vehicleId = "";
  let customerCode = "";
  let jobCardData;
  let successReturn = {};
  if (customerData.id) {
    req.body.customerId = String(customerData.id);
    customerCode = String(customerData.customerCode);
  }

  const tempReq = { body: req.body };

  // Run vehicle validations manually
  for (const validation of vehicleRules['createM']) {
    await validation.run(tempReq); // Pass only body
  }

  // Get only vehicle errors
  const vehicleErrors = validationResult(tempReq);
  if (vehicleErrors.array().length > 0) {
    const VehicleDataRegNo = await VehicleDao.findByRegistrationNumber(req.body.registrationNumber);
    if (VehicleDataRegNo) {
      vehicleId = VehicleDataRegNo.id;
    } else {
      return successReturn = { success: false, message: "Chasis Number / Engine Number is Already Registered" }
    }
  } else {
    const VehicleDataChasisNo = await VehicleDao.findByChassisNumber(req.body.chassisNumber);
    const VehicleDataEngineNo = await VehicleDao.findByEngineNumber(req.body.engineNumber);

    if (VehicleDataChasisNo) {
      return successReturn = { success: false, message: "Chasis Number is Duplicate" }
    }

    if (VehicleDataEngineNo) {
      return successReturn = { success: false, message: "Engine Number is Duplicate" }
    }
    const VehicleData = await VehicleService.createVehicle(req.body, req.user);
    vehicleId = VehicleData.vehicleId;
  }

  if (vehicleId) {
    console.log("MobileRoutes")
    jobCardData = await JobCardService.createJobCardMobileInitial(req.body, req.user);
    console.log(jobCardData);
  }

  return successReturn = { success: true, data: jobCardData };
}

router.all('/add_customer', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({
      requestSuccessful: false,
      code: 400,
      message: 'Bad Request'
    });
  }
});



router.post('/customer_search', JwtMiddleware.MobileCheckToken, controller.listCustomersMobile);
router.all('/customer_search', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({
      requestSuccessful: false,
      code: 400,
      message: 'Bad Request'
    });
  }
});

router.post(
  '/edit_customer',
  // idNumberBodyControl,
  customerRules['updateM'],
  JwtMiddleware.MobileCheckToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDescription = errors.array().map(err => err.msg).join(',');
      return res.status(400).join({
        requestSuccessful: false,
        errorDescription
      })
    }
    return await controller.updateCustomerMobile(req, res, next);
  }
  // controller.updateCustomerMobile
);

router.all('/edit_customer', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({
      requestSuccessful: false,
      code: 400,
      message: 'Bad Request'
    });
  }
});

router.post('/updatecustomervisit', JwtMiddleware.MobileCheckToken, controller.updatecustomervisit);

const mobileCustomerRouter = router;

export default mobileCustomerRouter;
