import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';
import cndController from "./controller.js";

const router = express.Router();

router.post('/addCreditNotesDetails', JwtMiddleware.checkToken, cndController.addCreditNotesDetails);// this api is used for sales return purpose stock and bdo protal things handling

router.post('/addOldDmsCreditNotesDetails', JwtMiddleware.checkToken, cndController.addOldDmsCreditNotesDetails);// this api is used for old dms credit notes details addition
router.get(
    '/getCreditNotesDetailsPdf',
    JwtMiddleware.checkToken,
    cndController.creditDebitNotesPdf
  );

  router.get(
    '/getOldDmsCreditNotesDetailsPdf',
    JwtMiddleware.checkToken,
    cndController.oldDmscreditDebitNotesPdf
  );
router.post('/getCreditDebitData', JwtMiddleware.checkToken, cndController.getCreditDebitData);


router.post('/exportCreditDebitData', JwtMiddleware.checkToken, cndController.exportCreditDebitNotes);

router.post('/listLbsInsuranceCode', JwtMiddleware.checkToken, cndController.listLbsInsuranceCode);
router.post('/addLbsDebitNotes', JwtMiddleware.checkToken, cndController.addLbsDebitNotes);

router.post('/listLbsDebitNotes', JwtMiddleware.checkToken, cndController.listLbsDebitNotes);
router.post('/updateLbsDebitNotesStatus', JwtMiddleware.checkToken, cndController.updateLbsDebitNotesStatus);

const creditNotesDetailsRouter = router;

export default creditNotesDetailsRouter;