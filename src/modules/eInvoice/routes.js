import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validateInvoice } from './rules/rules.js';
// import ValidationException from '../../shared/validationException.js';
// import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
// import { dsaAgentRules } from './rules/rule.js';
// import commonLogics from '../../shared/commonLogics.js';
import express from 'express';

const router = express.Router();

router.post(
    '/validator',
    validateInvoice['create'],
    controller.eInvoicePost
);

const eInvoice = router;

export default eInvoice;
