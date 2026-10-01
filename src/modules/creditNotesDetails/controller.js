import logger from '../../config/logger.js';
import { ACTION_ADD, ACTION_GET } from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import cndService from './service.js';
import PdfUtility from '../../shared/pdfUtility.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import QrCodeGeneration from '../../shared/signedQrCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');
import ExcelJS from 'exceljs';

const addCreditNotesDetails = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Credit/Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await cndService.addCreditNotesDetails(req.body, req.user);
        if (result === 'success') {
            auditData['message'] = 'Credit/Debit Notes added succesfully';
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
        logger.error('Credit/Debit Notes controller addCreditNotesDetails:', err);
        next(err);
    };
};

const addOldDmsCreditNotesDetails = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Old Dms Credit/Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await cndService.addOldDmsCreditNotesDetails(req.body, req.user);
        if (result === 'success') {
            auditData['message'] = 'Old Dms Credit/Debit Notes added succesfully';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data saved succesfully'
            });
        } else {
            auditData['message'] = 'Old Dms Credit/Debit not added';
            auditData['result'] = 'failed';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not saved'
            });
        }
    } catch (err) {
        logger.error('Old Dms Credit/Debit Notes controller addCreditNotesDetails:', err);
        next(err);
    };
};

const creditDebitNotesPdf = async (req, res, next) => {
    try {
        
        const auditData = {
            menu_name: "Receipts",
            submenu_name: "Credit/Debit Notes",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('Credit/Debit Notes controller generatePDF requestData:' + req.query.id);
        const data = await cndService.creditDebitNotesPdf(req.query.id, req.user.outlet);
        // console.log('pdf data from backend-------------------',data)

        // return false;
      
        // console.log('12333333333',qrCodeImage);

        let creditNoteData = data.creditNotesUpdateMap?.[0]?.dataValues;

        // console.log('how value come in this',creditNoteData)

        if (creditNoteData?.signed_qr_code) {
            const qrCodeImage = await QrCodeGeneration.generateQRCodeDataUrl(creditNoteData.signed_qr_code);
            const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date(creditNoteData.invoice_bdoack_date));

            data['creditNoteUpdate'] = creditNoteData;
            data['qrCodeImage'] = qrCodeImage; 
            data['BdoDate'] = formattedCreatedAt;
        } else {
            data['creditNoteUpdate'] = {};
            data['qrCodeImage'] = '';
            data['BdoDate'] = '';
        }
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        

        const pdfBuffer = await PdfUtility.generatePDF("creditdebitpdf", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="creditdebitpdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error('Credit/Debit Notes controller creditDebitNotesPdf:', err);
        next(err);
    }
}



const oldDmscreditDebitNotesPdf = async (req, res, next) => {
    try {
        
        const auditData = {
            menu_name: "Receipts",
            submenu_name: "Old DMs Credit/Debit Notes PDF",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info(' Old Dms Credit/Debit Notes controller generatePDF requestData:' + req.query.id);
        const data = await cndService.oldDmscreditDebitNotesPdf(req.query.id, req.user.outlet);
        // console.log('pdf data from backend-------------------',data)

        // return false;
      
        // console.log('12333333333',qrCodeImage);

        let creditNoteData = data.creditNotesUpdateMap?.[0]?.dataValues;

        // console.log('how value come in this',creditNoteData)

        if (creditNoteData?.signed_qr_code) {
            const qrCodeImage = await QrCodeGeneration.generateQRCodeDataUrl(creditNoteData.signed_qr_code);
            const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date(creditNoteData.invoice_bdoack_date));

            data['creditNoteUpdate'] = creditNoteData;
            data['qrCodeImage'] = qrCodeImage; 
            data['BdoDate'] = formattedCreatedAt;
        } else {
            data['creditNoteUpdate'] = {};
            data['qrCodeImage'] = '';
            data['BdoDate'] = '';
        }
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        

        const pdfBuffer = await PdfUtility.generatePDF("creditdebitpdf", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="creditdebitpdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error(' Old Dms Credit/Debit Notes controller creditDebitNotesPdf:', err);
        next(err);
    }
}

const getCreditDebitData = async (req, res, next) => {
    
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Credit/Debit Notes",
            action: ACTION_GET,
            access: "Portal",
            message: "Credit/Debit Notes Report"
        };
        const data = await cndService.getCreditDebitData(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                CreditDebitReport: data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: false,
                CreditDebitReport: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getReceiptReportData", err);
        next(err);
    }
};

const exportCreditDebitNotes = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Credit/Debit Notes",
        action: ACTION_GET,
        access: "Portal",
        message: "Credit/Debit Notes export Report"
    };
    try {
        if (req.body.purpose === "CD") {
            const results = await cndService.getCreditDebitData(req.body, req.user);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('WorkSheet');
    
            const headers = [
                { header: 'SL No', key: 'autoId', width: 10 },
                { header: 'Outlet Code', key: 'outlet_code', width: 20 },
                { header: 'Document Type', key: 'doc_type', width: 20 },
                { header: 'Document Name', key: 'doc_no', width: 20 },
                { header: 'Document Date', key: 'createdAt', width: 25 },
                { header: 'JobCard Number', key: 'jc_number', width: 25 },
                { header: 'Invoice Number', key: 'invoiceNumber', width: 25 },
                { header: 'Customer Name', key: 'customerName', width: 25 },
                { header: 'Customer Code', key: 'customer_code', width: 25 },
                { header: 'Vehicle Number', key: 'reg_no', width: 25 },
                { header: 'Narration', key: 'narration', width: 20 },
                { header: 'Taxable Amount', key: 'amount', width: 20 },
                { header: 'CGST Amount', key: 'cgst', width: 20 },
                { header: 'SGST Amount', key: 'sgst', width: 25 },
                { header: 'IGST Amount', key: 'igst', width: 25 },
                { header: 'Grand Total', key: 'total', width: 25 },
            ];
    
            worksheet.columns = headers;
    
            worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF204060' }
                };
            });
            worksheet.addRows(results.data);
    
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber !== 1) { // Skip first row (headers)
                    row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                    });
                }
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="Credit/Debit_Notes_Statement.xlsx"');
    
            await workbook.xlsx.write(res);
    
            res.end();
        } else {
            const results = await cndService.getCreditDebitData(req.body, req.user);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('WorkSheet');

            const headers = [
                { header: 'SL No', key: 'autoId', width: 10 },
                { header: 'Outlet Code', key: 'outlet_code', width: 20 },
                { header: 'Document Type', key: 'doc_type', width: 20 },
                { header: 'Document Name', key: 'doc_no', width: 20 },
                { header: 'Document Date', key: 'createdAt', width: 25 },
                { header: 'JobCard Number', key: 'jc_number', width: 25 },
                { header: 'Invoice Number', key: 'invoiceNumber', width: 25 },
                { header: 'Invoice Date', key: 'invoiceDate', width: 25 },
                { header: 'Customer Name', key: 'customerName', width: 25 },
                { header: 'Customer Code', key: 'customer_code', width: 25 },
                { header: 'Vehicle Number', key: 'reg_no', width: 25 },
                { header: 'Credit', key: 'credit', width: 25 },
                { header: 'Labor Code/Parts Code', key: 'rot_code', width: 20 },
                { header: 'Quantity', key: 'quantity', width: 20 },
                { header: 'Taxable Amount', key: 'amount', width: 20 },
                { header: 'Discount Amount', key: 'discountAmount', width: 20 },
                { header: 'CGST%', key: 'cgstPer', width: 20 },
                { header: 'SGST%', key: 'sgstPer', width: 25 },
                { header: 'IGST%', key: 'igstPer', width: 25 },
                { header: 'CGST Amount', key: 'cgst', width: 20 },
                { header: 'SGST Amount', key: 'sgst', width: 25 },
                { header: 'IGST Amount', key: 'igst', width: 25 },
                { header: 'Grand Total', key: 'total', width: 25 },
                { header: 'Labor Amount', key: 'laborAmount', width: 25 },
                { header: 'Parts Amount', key: 'partsAmount', width: 25 },
                { header: 'Others', key: 'others', width: 20 },
                { header: 'Cost of Sales', key: 'costOfSales', width: 25 },
                { header: 'Source', key: 'source', width: 25 },
                { header: 'Source Type', key: 'sourceType', width: 25 }
            ];

            worksheet.columns = headers;

            worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF204060' }
                };
            });
            worksheet.addRows(results.data);

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber !== 1) { // Skip first row (headers)
                    row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                    });
                }
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="Credit/Debit_Notes_Statement.xlsx"');

            await workbook.xlsx.write(res);

            res.end();
        }
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error("JobCard controller exportCreditDebitNotes", err);
        next(err);
    }
};

const listLbsInsuranceCode = async (req, res, next) => {
    try {
      const reqBody = req.body;
      const auditData = {};
      auditData['menu_name'] = 'Master';
      auditData['submenu_name'] = 'lbs insurance';
  
      const data = await cndService.listLbsInsurance(reqBody);
  
      if (data) {
        auditData['message'] = 'Get lbs insurance data ';
        auditData['result'] = 'success ';
        auditData['action'] = 'View';
        auditData['access'] = 'Portal';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          data: data,
        });
      } else {
        auditData['message'] = 'Get lbs insurance data';
        auditData['result'] = 'failed ';
        auditData['action'] = 'View';
        auditData['access'] = 'Portal';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          data: data,
        });
      }
    } catch (err) {
      logger.error('lbs insurance Controller listItemGroup Error:', err);
      next(err);
    }
  };

  const addLbsDebitNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'LBS Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await cndService.addLbsDebitNotes(req.body, req.user);

        if(result === 'success') {
            auditData['message'] = 'LBS Debit Notes added successfully';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data saved succesfully'
            });
        } else {
            auditData['message'] = 'LBS Debit not added';
            auditData['result'] = 'failed';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not saved'
            });
        }
    } catch (err) {
        logger.error('LBS Debit Notes controller add CreditNotes', err);
        next(err);
    };
};

const listLbsDebitNotes = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'Credit/Debit Notes';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Credit/Debit Notes data ';
        const data = await cndService.listLbsDebitNotes(req.body, req.user);
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
        logger.error('Lbs Debit Notes controller', err);
        next(err);
    }
};

const updateLbsDebitNotesStatus = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Receipts';
        auditData['submenu_name'] = 'LBS Debit Notes';
        auditData['action'] = ACTION_ADD;
        let result = await cndService.updateLbsDebitNotesStatus(req.body?.id, req.user);
        console.log('result value----',result)
        if (result === 'success') {
            auditData['message'] = 'LBS Debit Notes Approved successfully';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Lbs Debit Notes Approved successfully'
            });
        } else {
            auditData['message'] = 'LBS Debit Notes not approved';
            auditData['result'] = 'failed';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: 'Lbs Debit Notes not approved'
            });
        }
    } catch (err) {
        logger.error('LBS Debit Notes controller update status', err);
        next(err);
    }
};

const cndController = {
    addCreditNotesDetails,
    creditDebitNotesPdf,
    getCreditDebitData,
    exportCreditDebitNotes,
    listLbsInsuranceCode,
    oldDmscreditDebitNotesPdf,
    addLbsDebitNotes,
    listLbsDebitNotes,
    addOldDmsCreditNotesDetails,
    updateLbsDebitNotesStatus
};

export default cndController;
