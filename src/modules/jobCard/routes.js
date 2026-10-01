import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { jobCardRules } from './rules/rule.js';
import express from 'express';
import multer from 'multer';
import dao from './dao.js';
const upload = multer({ storage: multer.memoryStorage() });

const uploadVerificationFiles = upload.fields([
  { name: "basic_vehicle_photo", maxCount: 1 },
  { name: "insurance_copy", maxCount: 1 },
  { name: "rc_copy", maxCount: 1 },
  { name: "licence_copy", maxCount: 1 },
  { name: "filled_claim_form", maxCount: 1 },
  { name: "permit_copy", maxCount: 1 },
  { name: "fitness_certificate_copy", maxCount: 1 },
  { name: "gd_fir_entry", maxCount: 1 },
  { name: "pan_card_copy", maxCount: 1 },
  { name: "customer_photo_copy", maxCount: 1 },
  { name: "aadhar_copy", maxCount: 1 },
  { name: "kyc_copy", maxCount: 1 },
  { name: "estimate_copy", maxCount: 1 },
  { name: "satisfaction_voucher", maxCount: 1 },
  { name: "damage_photos", maxCount: 1 },
  { name: "reinspection_photos", maxCount: 1 },
  { name: "payment_receipt_copy", maxCount: 1 },
]);

// router
const router = express.Router();
router.get(
  '/getOTDFailureReasons',
  JwtMiddleware.checkToken,
  controller.getOTDFailureReasons
);
router.get(
  '/getTransactionSubstatuses',
  JwtMiddleware.checkToken,
  controller.getTransactionSubstatuses
);
router.get(
  '/generateJobCardPDF',
  JwtMiddleware.checkToken,
  controller.generateJobCardPDF
);

// router.get(
//   '/getJobCardDetails',
//   JwtMiddleware.checkToken,
//   controller.getJobCardDetailsById
// );

router.post(
  '/getJobCardDetailsById',
  (req, res, next) => {
    // console.log(" Route HIT: /getJobCardDetails", req.query);
    next();
  },
  JwtMiddleware.checkToken,
  controller.getJobCardDetailsById
);

router.post(
  '/getJobCardDetailsByIdOutlet',
  JwtMiddleware.checkToken,
  controller.getJobCardDetailsByIdOutlet
);

router.post(
  '/getJobCardViewById',
  (req, res, next) => {
    // console.log(" Route HIT: /getJobCardDetails", req.query);
    next();
  },
  JwtMiddleware.checkToken,
  controller.getJobCardViewById
);

router.post(
  '/getJobCardViewByIdOutlet',
  JwtMiddleware.checkToken,
  controller.getJobCardViewByIdOutlet
);

router.get(
  '/generateJobCardPreInvoicePDF',
  JwtMiddleware.checkToken,
  controller.generateJobCardPreInvoicePDF 
);
router.get(
  '/generateJobCardPreInvoiceInsurancePDF',
  JwtMiddleware.checkToken,
  controller.generateJobCardPreInvoiceInsurancePDF
);
router.get( 
  '/generateJobCardInvoicePDF',
  JwtMiddleware.checkToken,
  controller.generateJobCardInvoicePDF  
);
router.get(
  '/generateJobCardInvoiceInsurancePDF',
  JwtMiddleware.checkToken,
  controller.generateJobCardInvoiceInsurancePDF
);
router.post(
  '/getCustomerData',
  JwtMiddleware.checkToken,
  controller.getCustomerData
);
router.get(
  '/generateLabourPDF',
  JwtMiddleware.checkToken,
  controller.generateLabourPDF
);
router.get(
  '/generatePartsPDF',
  JwtMiddleware.checkToken,
  controller.generatePartsPDF
);
router.get(
  '/generateLabourInsurancePDF',
  JwtMiddleware.checkToken,
  controller.generateLabourInsurancePDF
);

router.post(
  '/createJobCard',
  JwtMiddleware.checkToken,
  jobCardRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createJobCard(req, res, next);
  }
);
router.post(
  '/createJobCardFromServiceBooking',
  JwtMiddleware.checkToken,
  jobCardRules['createFromServiceBooking'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createJobCardFromServiceBooking(req, res, next);
  }
);
router.post(
  '/createInitialPortalJobCard',
  JwtMiddleware.checkToken,
  jobCardRules['createInitialPortal'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.createInitialPortalJobCard(req, res, next);
  }
);
router.post(
  '/savePortalJobCardInspection',
  JwtMiddleware.checkToken,
  jobCardRules['savePortalInspection'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.savePortalJobCardInspection(req, res, next);
  }
);
router.post('/listJobCards', JwtMiddleware.checkToken, controller.listJobCards);

router.post('/listJobCards_v1', JwtMiddleware.checkToken, controller.listJobCards_v1);
router.post('/listJobCardsAdmin', JwtMiddleware.checkToken, controller.listJobCardsAdmin);
router.post('/listJobCardsByMappedOutlets', JwtMiddleware.checkToken, controller.listJobCardsByMappedOutlets);
router.post('/getJobCardViewByIdAdmin', JwtMiddleware.checkToken, controller.getJobCardViewByIdAdmin);

router.post('/listJobCardsData', JwtMiddleware.checkToken, controller.listJobCardsData);
router.post(
  '/listBillJobCards', 
  JwtMiddleware.checkToken,
  controller.listBillJobCards
);

router.post(
  '/saveBillingDetails',  
  JwtMiddleware.checkToken,
  controller.saveBillingDetails
);

router.post(
  '/updateJobcardStatus',
  JwtMiddleware.checkToken,
  controller.updateJobcardStatus 
);

router.post(
  '/createMechanicMapping',
  JwtMiddleware.checkToken,
  controller.createMechanicMapping
);
router.post(
  '/getMechanicMapping',
  JwtMiddleware.checkToken,
  controller.getMechanicMapping
);
router.post(
  '/getJobcardLabor',
  JwtMiddleware.checkToken,
  controller.getJobcardLabor
);

router.post(
  '/updateJobCard',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateJobCard(req, res, next);
  }
);
router.post(
  '/updateJobCardLineApproval',
  JwtMiddleware.checkToken,
  jobCardRules['updateLineApproval'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationException(errors.array()));
    return controller.updateJobCardLineApproval(req, res, next);
  }
);
router.post(
  '/updateJobCardOutlet',
  JwtMiddleware.checkToken,
  controller.updateJobCardOutlet
);
router.post(
  '/updateCreditApproval', 
  JwtMiddleware.checkToken,
  controller.updateCreditApproval

);

router.get(
  '/generateWorkOrderPDF',
  JwtMiddleware.checkToken,
  controller.WorkOrderPDF
);
router.post(
  '/getOslScheduleByWOB',
  JwtMiddleware.checkToken,
  controller.getOslScheduleByWOB
);
router.post(
  '/oslWorkOrders',
  JwtMiddleware.checkToken,
  controller.oslWorkOrders
);
router.post(
  '/listGatePassJobCards',
  JwtMiddleware.checkToken,
  controller.listGatePassJobCards 
);

router.get(
  '/downloadGatePass',
  JwtMiddleware.checkToken,
  controller.downloadGatePass
);
router.post(
  '/getGatePassData',
  JwtMiddleware.checkToken,
  controller.getGatePassData
);
router.post(
  '/getAllJobCardsForOutlets',
  JwtMiddleware.checkToken,
  controller.getAllJobCardsForOutlets
);
router.post(
  '/getJobCardDetails',
  JwtMiddleware.checkToken,
  controller.getJobCardDetails
);

router.post(
  '/addInsuranceAddress',
  JwtMiddleware.checkToken,
  controller.addInsuranceAddress
);
router.post(
  '/listInsuranceAddresses',
  JwtMiddleware.checkToken,
  controller.listInsuranceAddresses
);

// router.post('/addInsurance',JwtMiddleware.checkToken,jobCardRules['add'], controller.addInsurance);
router.post(
  '/addInsurance',
  JwtMiddleware.checkToken,
  jobCardRules['add'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addInsurance(req, res, next);
  }
);
router.post('/getInsurance', JwtMiddleware.checkToken, controller.getInsurance);
router.post( 
  '/updateJobCardInsurance',
  JwtMiddleware.checkToken,
  controller.updateJobCardInsurance
);
router.post(
  '/getJobCardStatusReportData',
  JwtMiddleware.checkToken,
  controller.getJobCardStatusReportData
);
router.post(
  '/exportJobCardStatusReport',
  JwtMiddleware.checkToken,
  controller.exportJobCardStatusReport
);
router.post(
  '/getGateInGateOutReport',
  JwtMiddleware.checkToken,
  controller.getGateInGateOutReport
);
router.post(
  '/exportGateInGateOutReport',
  JwtMiddleware.checkToken,
  controller.exportGateInGateOutReport
);
router.post(
  '/exportWipStatusReport',
  JwtMiddleware.checkToken,
  controller.exportWipStatusReport
);
router.post(
  '/exportBillReport',
  JwtMiddleware.checkToken,
  controller.exportBillReport
);
router.post(
  '/getJobCardDeliveryReportData',
  JwtMiddleware.checkToken,
  controller.getJobCardDeliveryReportData
);
router.post(
  '/exportJobCardDeliveryReport',
  JwtMiddleware.checkToken,
  controller.exportJobCardDeliveryReport
);
router.post('/wipGridView', JwtMiddleware.checkToken, controller.WipGridView);
router.post('/billGridView', JwtMiddleware.checkToken, controller.billGridView);
router.post('/billSummarySplitUpGridView', JwtMiddleware.checkToken, controller.billSummarySplitUpGridView);
router.post('/exportBillSummarySplitUp', JwtMiddleware.checkToken, controller.exportBillSummarySplitUp);
router.post(
  '/getWorkOrderReportData',
  JwtMiddleware.checkToken,
  controller.getWorkOrderReportData
);
router.post(
  '/exportWorkOrderReport',
  JwtMiddleware.checkToken,
  controller.exportWorkOrderReport
);
router.post(
  '/getJobCardData',
  JwtMiddleware.checkToken,
  controller.getJobCardData
);
router.post('/getReceiptReportData', JwtMiddleware.checkToken, controller.getReceiptReportData);
router.post('/exportChittaReport', JwtMiddleware.checkToken, controller.exportChittaReport);

router.post(
  '/getRepairOrderReportData',
  JwtMiddleware.checkToken,
  controller.getRepairOrderReportData
);
router.post(
  '/exportRepairOrderReport',
  JwtMiddleware.checkToken,
  controller.exportRepairOrderReport
);

router.post(
  '/getEliteStatementData',
  JwtMiddleware.checkToken,
  controller.getEliteStatementData
);
router.post(
  '/exportEliteStatement',
  JwtMiddleware.checkToken,
  controller.exportEliteStatement
);

router.post('/vehicleHistory', JwtMiddleware.checkToken, controller.vehicleHistory);

router.post(
  '/getJobCardForAutoPO',
  JwtMiddleware.checkToken,
  controller.getJobCardForAutoPO
);
router.post('/create_jc', JwtMiddleware.checkToken, controller.createJobCardMobile);

router.post('/get_jobcard_details', JwtMiddleware.checkToken, controller.getJobCardDetailsMobile);

router.post('/integrate_jc_details', JwtMiddleware.checkToken, controller.getJobCardDetailsBridge);

router.post('/update_jc', JwtMiddleware.checkToken, controller.updateJobCardMobile);

router.post('/createGatepassMobile', JwtMiddleware.checkToken, controller.createGatepassMobile);

router.post('/dashboard', JwtMiddleware.checkToken, controller.dashboard);

router.post('/dashboard_epro', JwtMiddleware.checkToken, controller.dashboardEpro);
router.post('/dashboard_revenue', JwtMiddleware.checkToken, controller.dashboardRevenue);
router.post('/dashboard_ajc_rjc', JwtMiddleware.checkToken, controller.dashboardAjcRjc); 
router.post('/dashboard_labour_parts', JwtMiddleware.checkToken, controller.dashboardLabourParts);

router.post('/dashboard_customer_summary', JwtMiddleware.checkToken, controller.dashboardCustomerFlow);

router.post('/dashboard_vehicle_flow', JwtMiddleware.checkToken, controller.dashboardVehicleFlow); 

router.post('/dashboardFlow', JwtMiddleware.checkToken, controller.dashboardInflow);

router.post('/getJobCardStatement', JwtMiddleware.checkToken, controller.getJobCardStatement);

router.post('/exportJobCardStatement', JwtMiddleware.checkToken, controller.exportJobCardStatement);

router.post('/getMechanicEfficiency', JwtMiddleware.checkToken, controller.getMechanicEfficiency);

router.post('/exportMechanicEfficiency', JwtMiddleware.checkToken, controller.exportMechanicEfficiency);

router.post('/encryptJc', JwtMiddleware.checkToken, controller.encryptJc);
router.post('/updatePartApprove', JwtMiddleware.checkToken, controller.updatePartApprove);

router.post('/createHsnandItemforPartCatalogue', JwtMiddleware.checkToken, controller.createHsnandItemforPartCatalogue);
router.post(
  '/getJobCardForEtaUpdate',
  JwtMiddleware.checkToken,
  controller.getJobCardForEtaUpdate
);

router.post(
  '/UploadVerificationDetails',
  JwtMiddleware.checkToken,uploadVerificationFiles,
  controller.UploadVerificationDetails
);

router.post(
  '/GetVerificationDetails',
  JwtMiddleware.checkToken,
  controller.GetVerificationDetails
);

router.post(
  '/getJobCardStatus',
  controller.getJobCardStatus
);

router.post(
  '/getJobCardDetailsCustomerComplaint',JwtMiddleware.checkToken,
  controller.getJobCardDetailsCustomerComplaint
);

router.post(
  '/verifyGstin',
  JwtMiddleware.checkToken,
  controller.verifyGstin
);
router.post(
  '/getOldJobcardOpenAndWorkinProgress',
  JwtMiddleware.checkToken,
  controller.getOldJobcardOpenAndWorkinProgress
);
router.post(
  '/getOldJobcardOpenAndWorkInProgressValidation',
  JwtMiddleware.checkToken,
  dao.getOldJobcardOpenAndWorkInProgressValidation
);

router.post(
  '/JobCardBillSummaryItReturnDataView',
  JwtMiddleware.checkToken,
  controller.JobCardBillSummaryItReturnDataView
);

router.post(
  '/JobCardBillSummaryITReturnDataExport',
  JwtMiddleware.checkToken,
  controller.JobCardBillSummaryITReturnDataExport
);
const jobCardRouter = router;

export default jobCardRouter;
