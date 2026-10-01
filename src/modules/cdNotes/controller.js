import logger from '../../config/logger.js';
import { ACTION_ADD } from '../../shared/applicationConstants.js';
import creditService from './service.js';
import auditLog from '../../shared/auditLog.js';
import { ACTION_GET } from '../../shared/applicationConstants.js';
import PdfUtility from '../../shared/pdfUtility.js'

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import creditDao from './dao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

const getJobCardNumber = async (req, res, next) => {
    try {
        const data = await creditService.getJobCardNumber(req.body, req.user);
        res.status(200).send({
            requestSuccessful: true,
            jobCardNumber: data
        });
    } catch (err) {
        logger.error('Credit controller getJobCardNumber Err:', err);
        next(err);
    };
};

const addCreditNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Credit/Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await creditService.addCreditNotes(req.body, req.user);
        if(result === 'success') {
            auditData['message'] = 'Credit/Debit Notes added successfully';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data saved succesfully'
            });
        } else {
            auditData['message'] = 'Credit/Debit not added';
            auditData['result'] = 'failed';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not saved'
            });
        }
    } catch (err) {
        logger.error('Credit/Debit Notes controller add CreditNotes', err);
        next(err);
    };
};

const oldDmsaddCreditNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = ' Old Dms Credit/Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await creditService.oldDmsaddCreditNotes(req.body, req.user);
        //  console.log('D:dms_node_user_backendsrcmodulescdNotesservice.js -----result',result)
        if(result.success) {
            auditData['message'] = 'Old DMs Credit/Debit Notes added successfully';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: result.message,
                data: result.data
            });
        } else {
            auditData['message'] = 'Old DMs Credit/Debit Notes not added';
            auditData['result'] = 'failed';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: result.message
            });
        }
    } catch (err) {
        logger.error('Old Dms Credit/Debit Notes controller add CreditNotes', err);
        return res.status(500).send({
            requestSuccessful: false,
            message: 'Internal server error'
        });
    };
};

const listCreditNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Credit/Debit Notes data ';
        const data = await creditService.lisrCreditNotes(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                creditNotes: data,
                message: "Data fetched successfully."
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: "Data not fetched."
            });
        }
    } catch (err) {
        logger.error('Credit/Debit Notes controller', err);
        next(err);
    }
};

const listOldDmsCreditNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Old Dms Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Old Dms Credit/Debit Notes data ';
        const data = await creditService.listOldDmsCreditNotes(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                creditNotes: data,
                message: "Data fetched successfully."
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: "Data not fetched."
            });
        }
    } catch (err) {
        logger.error('Old Dms Credit/Debit Notes controller', err);
        next(err);
    }
};

const downloadCreditDebitNotes = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Receipts",
            submenu_name: "Credit/Debit Notes",
            action: "GET",
            access: "Portal",
            message: "Generate creditDebitNotes PDF"
        };

        logger.info('creditDebitNotesController downloadcreditDebitNotes :', req.query.id);

        const data = await creditService.downloadCreditDebitNotes(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        const pdfBuffer = await PdfUtility.generatePDF('creditDebitNotes', data);
        if (pdfBuffer) {
            auditData.result = "success";

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="creditDebitNotes.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('creditDebitNotes Controller generatePDF Error:', err);
        if (browser) await browser.close();
        next(err);
    }
};

const getCdByTransaction = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Credit/Debit Notes data by JC';
        const data = await creditService.getCdByTransaction(req.body);
        if (data) {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                uniqueJC: false,
                message: "Credit/Debit note for jobcard already exists"
            });
        } else {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                uniqueJC: true,
                message: "New Jobcard"
            });
        }
    } catch (err) {
        logger.error('Credit/Debit Notes controller', err);
        next(err);
    }
};

const oldDmsGetCdByTransaction = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = ' Old Dms Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Old Dms Credit/Debit Notes data by JC';
        const data = await creditService.oldDmsGetCdByTransaction(req.body);
        if (data) {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                uniqueJC: false,
                message: "Credit/Debit note for jobcard already exists"
            });
        } else {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                uniqueJC: true,
                message: "New Jobcard"
            });
        }
    } catch (err) {
        logger.error('Old Dms Credit/Debit Notes controller', err);
        next(err);
    }
};

const oldDmsGetJobcardDetails = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = ' Old Dms Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Old Dms JC data by JC Number';
        const data = await creditDao.oldDmsGetJobcardDetails(req?.body?.jobCard);
        if (data) {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send(data);
        } else {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send(data);
        }
    } catch (err) {
        logger.error('Old Dms Credit/Debit Notes controller', err);
        next(err);
    }
};
const creditController = {
    getJobCardNumber, addCreditNotes,oldDmsaddCreditNotes, listCreditNotes,downloadCreditDebitNotes,
    getCdByTransaction,oldDmsGetCdByTransaction,listOldDmsCreditNotes,oldDmsGetJobcardDetails
};

export default creditController;
