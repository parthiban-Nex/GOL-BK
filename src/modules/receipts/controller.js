import logger from '../../config/logger.js';
import { ACTION_GET, ACTION_ADD, ACTION_UPDATE } from "../../shared/applicationConstants.js";
import auditLog from '../../shared/auditLog.js';
import ReceiptService from "./service.js";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PdfUtility from '../../shared/pdfUtility.js';
import receiptDao from "./dao.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

const createReceipt = async (req, res, next) => {
    try {
        logger.info('Receipt Controller createReceipt requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Receipts";
        auditData['submenu_name'] = "Receipts";
        auditData['action'] = ACTION_ADD;
        let result = await ReceiptService.createReceipt(req.body, req.user);
        if (result == "success") {
            auditData['message'] = "Receipt created successfully ";
            auditData['result'] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: "Data Saved Successfully",
            });
        } else {
            auditData['message'] = "Failed to create Receipt";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Receipt Controller createReceipt Error:', err);
        next(err);
    }
}


const createOldDmsReceipt = async (req, res, next) => {
    try {
        logger.info('Receipt Controller createReceipt requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Receipts";
        auditData['submenu_name'] = "Receipts";
        auditData['action'] = ACTION_ADD;
        let result = await ReceiptService.createOldDmsReceipt(req.body, req.user);
        if (result == "success") {
            auditData['message'] = "Receipt created successfully ";
            auditData['result'] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: "Data Saved Successfully",
            });
        } else {
            auditData['message'] = "Failed to create Receipt";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Receipt Controller createReceipt Error:', err);
        next(err);
    }
}

const listReceipts = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Receipts";
        auditData["submenu_name"] = "Receipts";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "List Receipt data ";
        const data = await ReceiptService.listReceipts(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        }
    } catch (err) {
        logger.error("Receipt controller listReceipts", err);
        next(err);
    }
};

const listOldDmsReceipts = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Receipts";
        auditData["submenu_name"] = "Receipts";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "List Receipt data ";
        const data = await ReceiptService.listOldDmsReceipts(req.body, req.user);
        // console.log("listOldDmsReceipts data", data);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        }
    } catch (err) {
        logger.error("Receipt controller listReceipts", err);
        next(err);
    }
};

const getReceipt = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Receipts";
        auditData["submenu_name"] = "Receipts";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get Receipt data ";
        const data = await ReceiptService.getReceipt(req.body.id, req.user);
        if(data){
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                data: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(400).send({
                requestSuccessful: false,
                message: 'Data not fetched'
            });
        }
    } catch (err) {
        logger.error("Receipt controller getReceipt", err);
        next(err);
    }
};

const getReceiptPdf = async (req, res, next) => { 
    try {

        const auditData = {
            menu_name: "Transactions",
            submenu_name: "Receipt",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };
        const data = await ReceiptService.getReceiptPdf(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF("receipt", data);
        
        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="receipt.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error("Receipt controller getReceiptPdf", err);
        next(err);
    }
}

const getOldDmsReceiptPdf = async (req, res, next) => { 
    try {

        const auditData = {
            menu_name: "Transactions",
            submenu_name: "Receipt",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };
        const data = await ReceiptService.getOldDmsReceiptPdf(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF("receipt", data);
        
        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="DMS_receipt.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error("Receipt controller getReceiptPdf", err);
        next(err);
    }
}

const oldDmsGetJobcardDetailsForReceipt = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = ' Old Dms Receipt';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Old Dms JC data by JC Number';
        const data = await receiptDao.oldDmsGetJobcardDetailsForReceipt(req?.body?.jobCardNo,req?.user?.outlet?.outletCode);
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
        logger.error('Old Dms  Receipt controller', err);
        next(err);
    }
};
const controller = {
    createReceipt,
    listReceipts,
    getReceipt,
    createOldDmsReceipt,
    getOldDmsReceiptPdf,
    listOldDmsReceipts,
    getReceiptPdf,
    oldDmsGetJobcardDetailsForReceipt
}

export default controller;
