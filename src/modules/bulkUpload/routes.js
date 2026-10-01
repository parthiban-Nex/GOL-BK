import JwtMiddleware from '../../config/jwtMiddleware.js';
import express from 'express';
import multer from 'multer';
import controller from '../bulkUpload/controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB


 });

router.post('/validateItemMaster', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  // next();
return await controller.validateItemMaster(req, res, next); 
});

router.post('/bulkItemMaster', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
    // next();
  return await controller.uploadFile(req, res, next); 
});

router.post('/validateLaborSchedule', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  // next();
return await controller.validateLaborSchedule(req, res, next);
});

router.post('/bulkLaborSchedule', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
    // next();
    return await controller.uploadLaborFile(req, res, next);
  });

router.post('/bulkMake', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.uploadMakeFile(req, res, next);
});

router.post('/bulkValidateMake', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateMake(req, res, next);
});

router.post('/bulkModel', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.uploadModel(req, res, next);
});

router.post('/bulkValidateModel', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateModel(req, res, next);
});

router.post('/bulkValidateCustomer', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateBulkCustomer(req, res, next);
});

router.post('/bulkCustomer', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.uploadCustomers(req, res, next); 
});

router.post('/bulkValidateVehicle', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateBulkVehicle(req, res, next);
});

router.post('/bulkVehicle', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.uploadVehicles(req, res, next);
});

router.post('/bulkPincode', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  return await controller.uploadPincodeFile(req, res, next);
});

router.post('/bulkValidatePincode', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateBulkPincode(req, res, next);
});

router.post('/validateGrnUploads', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateGrnUploads(req, res, next);
});

router.post('/BulkCreateGrn', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.BulkCreateGrn(req, res, next);
});
router.post('/validatePoUploads', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validatePoUploads(req, res, next);
});

router.post('/BulkCreatePO', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.BulkCreatePO(req, res, next);
});
router.post('/validateVendorUploads', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateVendorUploads(req, res, next);
});
router.post('/BulkCreateVendor', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.BulkCreateVendor(req, res, next);
});

router.post('/bulkOutletMaster', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.uploadsFile(req, res, next);  
});
router.post('/validateOutletMaster', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
return await controller.validateOutletMaster(req, res, next); 
}); 
router.post('/validateLabourCategoryMapingUploads', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateLabourCategoryMapingUploads(req, res, next);
});
router.post('/BulkCreateLabourCategoryMapping', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.BulkCreateLabourCategoryMapping(req, res, next);
});
router.post('/validateTechnicianUploads', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.validateTechnicianUploads(req, res, next);
});
router.post('/BulkCreateTechnician', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.BulkCreateTechnician(req, res, next);
});
router.post('/validateCashier', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
return await controller.validateCashier(req, res, next); 
});
router.post('/bulkCashier', JwtMiddleware.checkToken, upload.single('file'), async (req, res, next) => {
  return await controller.bulkCashier(req, res, next); 
});
const bulkUploadRouter = router;
export default bulkUploadRouter;
