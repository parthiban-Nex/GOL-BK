import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';
import creditController from "./controller.js";

const router = express.Router();

router.post('/getJobCardNumber', JwtMiddleware.checkToken, creditController.getJobCardNumber);

router.post('/addCreditNotes', JwtMiddleware.checkToken, creditController.addCreditNotes);
router.post('/oldDmsaddCreditNotes', JwtMiddleware.checkToken, creditController.oldDmsaddCreditNotes);//okay

router.post('/getCreditNotes', JwtMiddleware.checkToken, creditController.listCreditNotes); 
router.post('/oldDmsgetCreditNotes', JwtMiddleware.checkToken, creditController.listOldDmsCreditNotes); // okay 

router.get('/creditDebitNotespdf', JwtMiddleware.checkToken, creditController.downloadCreditDebitNotes);

router.post('/jobcardExists', JwtMiddleware.checkToken, creditController.getCdByTransaction);

router.post('/oldDmsjobcardExists', JwtMiddleware.checkToken, creditController.oldDmsGetCdByTransaction); //okay

router.post('/oldDmsGetJobcardDetails', JwtMiddleware.checkToken, creditController.oldDmsGetJobcardDetails); //okay
const creditRouter = router;

export default creditRouter;
