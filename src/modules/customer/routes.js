import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { customerRules } from './rules/rule.js';
import express from 'express';
import multer from 'multer';

const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

router.post(
  '/getCustomerVehicleNumbers',
  JwtMiddleware.checkToken,
  customerRules['getCustomerVehicleNumbers'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.getCustomerVehicleNumbers(req, res, next);
  }
);

router.post(
  '/validateBulkCustomer',
  JwtMiddleware.checkToken,
  upload.single('customerxls'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.validateCustomer(req, res, next);
  }
);



 router.post(
  '/createBulkCustomer',
  JwtMiddleware.checkToken,
  upload.single('customerxls'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addBulkCustomer(req, res, next);
  }
);

router.post(
  '/createCustomer',
  JwtMiddleware.checkToken,
  upload.any('images'),
  customerRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addCustomer(req, res, next);
  }
);

router.post(
  '/quickAddCustomer',
  JwtMiddleware.checkToken,
  customerRules['quickAdd'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.quickAddCustomer(req, res, next);
  }
);

router.post(
  '/searchCustomerVehicle',
  JwtMiddleware.checkToken,
  customerRules['searchCustomerVehicle'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.searchCustomerVehicle(req, res, next);
  }
);

router.post(
  '/createPortalCustomer',
  JwtMiddleware.checkToken,
  customerRules['createPortalCustomer'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.createPortalCustomer(req, res, next);
  }
);

router.post(
  '/quickAddVehicleForCustomer',
  JwtMiddleware.checkToken,
  customerRules['quickAddVehicleForCustomer'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.quickAddVehicleForCustomer(req, res, next);
  }
);

router.post(
  '/updateCustomerVehicleDetails',
  JwtMiddleware.checkToken,
  customerRules['updateCustomerVehicleDetails'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateCustomerVehicleDetails(req, res, next);
  }
);

router.post(
  '/updateCustomerVehicleInsurance',
  JwtMiddleware.checkToken,
  customerRules['updateCustomerVehicleInsurance'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateCustomerVehicleInsurance(req, res, next);
  }
);

router.post(
  '/add_customer',
  customerRules['createM'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addCustomerMobile(req, res, next);
  }
  // controller.addCustomerMobile
);

router.all('/add_customer', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post(
  '/listCustomers',
  JwtMiddleware.checkToken,
  controller.listCustomers
);

router.post('/customer_search', JwtMiddleware.checkToken, controller.listCustomersMobile);
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
  '/editCustomer',
  JwtMiddleware.checkToken,
  upload.any('images'),
  idNumberBodyControl,
  customerRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateCustomer(req, res, next);
  }
);

router.post(
  '/edit_customer',
  // idNumberBodyControl,
  customerRules['updateM'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
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

router.get(
  '/getAllCustomertypes',
  JwtMiddleware.checkToken,
  controller.getAllCustomertypes
);
router.get(
  '/getAllCustomercategories',
  JwtMiddleware.checkToken,
  controller.getAllCustomercategory
);
router.get(
  '/getAllBilltypes',
  JwtMiddleware.checkToken,
  controller.getAllBilltypes
);
router.post(
  '/getAllCustomers',
  JwtMiddleware.checkToken,
  controller.getAllCustomers
);
router.post(
  '/getAllSearchedCustomers',
  JwtMiddleware.checkToken,
  controller.getAllSearchedCustomers
);
router.post(
  '/getCustomerData',
  JwtMiddleware.checkToken,
  controller.getCustomerData
);
router.post(
  '/searchCustomer',
  JwtMiddleware.checkToken,
  controller.searchCustomer
);

router.post('/createManyCustomers', JwtMiddleware.checkToken, controller.createManyCustomers);

router.post('/approveCustomer', JwtMiddleware.checkToken, controller.approveCustomer);
const customerRouter = router;

router.post(
  '/getCustomerImages',
  JwtMiddleware.checkToken,
  controller.getCustomerImages
);



router.post(
  '/oracle_code_search',
  JwtMiddleware.checkToken,
  controller.oracleCodeSearch
);

router.post(
  '/oracle_code_update',
  JwtMiddleware.checkToken,
  controller.oracleCodeUpdate
);

router.post(
  '/oracle_code_fetch',
  JwtMiddleware.checkToken,
  controller.oracleCodeFetch
);

export default customerRouter;
