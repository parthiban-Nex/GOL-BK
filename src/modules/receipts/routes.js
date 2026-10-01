import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from "express-validator";
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from "../../shared/idNumberBodyControl.js";
import idNumberControl from "../../shared/idNumberControl.js";
import { receiptRules } from './rules/rule.js';
import roleAuth from '../../shared/roleAuthControl.js';
import moduleName from '../../config/moduleName.js';
import actionName from '../../config/actionName.js';
import express from 'express';

const router = express.Router();


router.post('/createReceipt',
    receiptRules['create'],
     JwtMiddleware.checkToken,
        async (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(new ValidationException(errors.array()));
            }
            return await controller.createReceipt(req, res, next);
        },
    
    // controller.createReceipt
);
router.post('/createOldDmsReceipt', JwtMiddleware.checkToken, controller.createOldDmsReceipt);
router.post('/listReceipts', JwtMiddleware.checkToken, controller.listReceipts);
router.post('/listOldDmsReceipts', JwtMiddleware.checkToken, controller.listOldDmsReceipts);
router.post('/getReceipt', JwtMiddleware.checkToken, controller.getReceipt);
router.get('/getReceiptPdf', JwtMiddleware.checkToken, controller.getReceiptPdf);  
router.get('/getOldDmsReceiptPdf', JwtMiddleware.checkToken, controller.getOldDmsReceiptPdf);  

 router.post('/oldDmsGetJobcardDetailsForReceipt', JwtMiddleware.checkToken, controller.oldDmsGetJobcardDetailsForReceipt);



const receiptRouter = router;
export default receiptRouter;
