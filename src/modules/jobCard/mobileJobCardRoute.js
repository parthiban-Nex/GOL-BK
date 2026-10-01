import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { jobCardRules } from './rules/rule.js';
import express from 'express';

// router
const router = express.Router();

router.post('/create_jc', JwtMiddleware.MobileCheckToken, controller.createJobCardMobile);  // okay

router.post('/get_jobcard_details', JwtMiddleware.MobileCheckToken, controller.getJobCardDetailsMobile); // okay

router.post('/update_jc', JwtMiddleware.MobileCheckToken, controller.updateJobCardMobile); // okay


 router.get(
  '/getTopFiveCustomerForGMS',
  JwtMiddleware.MobileCheckToken,
  controller.getTopFiveCustomerForGMS
);
router.post('/dashboard', JwtMiddleware.MobileCheckToken, controller.dashboardMobile);

router.post('/dashboardFlow', JwtMiddleware.MobileCheckToken, controller.dashboardInflow);


router.post('/jc_update_by_fit', JwtMiddleware.MobileCheckToken, controller.jcUpdateByFit);

router.post(
  '/updateJobcardStatusFit',
  JwtMiddleware.MobileCheckToken,
  controller.updateJobcardStatusFit 
);


router.post('/dashboard_epro', JwtMiddleware.MobileCheckToken, controller.dashboardEpro);
router.post('/dashboard_revenue', JwtMiddleware.MobileCheckToken, controller.dashboardRevenue);
router.post('/dashboard_ajc_rjc', JwtMiddleware.MobileCheckToken, controller.dashboardAjcRjc);
router.post('/dashboard_labour_parts', JwtMiddleware.MobileCheckToken, controller.dashboardLabourParts);

router.post('/dashboard_customer_summary', JwtMiddleware.MobileCheckToken, controller.dashboardCustomerFlow);

router.post('/dashboard_vehicle_flow', JwtMiddleware.MobileCheckToken, controller.dashboardVehicleFlow);



router.post(
  '/saveBillingDetailsFit',  
  JwtMiddleware.MobileCheckToken,
  controller.saveBillingDetailsFit
);

 router.post(
  '/getSingleCustomerView',
  JwtMiddleware.MobileCheckToken,
  controller.getSingleCustomerView
);

router.post('/getpreviousvisits',JwtMiddleware.MobileCheckToken,controller.getpreviousvisits);
router.post('/getinspectionreport',JwtMiddleware.MobileCheckToken,controller.getinspectionreport);
router.post('/getinventorydetails',JwtMiddleware.MobileCheckToken,controller.getinventorydetails);
router.post('/getmanagerworklist',JwtMiddleware.MobileCheckToken,controller.getmanagerworklist);
router.post('/getinspectorworklist',JwtMiddleware.MobileCheckToken,controller.getinspectorworklist); 
router.post('/getgiworklist_new',JwtMiddleware.MobileCheckToken,controller.getgiworklist_new);
router.post('/getqiworklist',JwtMiddleware.MobileCheckToken,controller.getqiworklist); // okay
router.post('/getdetailsforfi',JwtMiddleware.MobileCheckToken,controller.getdetailsforfi); // okay
router.post('/getsaworklist',JwtMiddleware.MobileCheckToken,controller.getsaworklist); // okay 
router.post('/getcustomerpastvisitdata',JwtMiddleware.MobileCheckToken,controller.getcustomerpastvisitdata) // okay
router.post('/getAlertMoevVehicleDetails.php',JwtMiddleware.MobileCheckToken,controller.getAlertMoevVehicleDetails) // okay
router.post('/updatesourcedetails.php',JwtMiddleware.MobileCheckToken,controller.updatesourcedetails) // okay



const MobileJobCardRouter = router;

export default MobileJobCardRouter;