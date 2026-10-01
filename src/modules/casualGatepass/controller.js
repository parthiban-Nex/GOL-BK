import casualGatePassService from "./service.js";
import logger from '../../config/logger.js';
import auditLog from "../../shared/auditLog.js";
import { ACTION_GET } from '../../shared/applicationConstants.js';
import PdfUtility from '../../shared/pdfUtility.js'

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');
import ExcelJS from 'exceljs';

const createCasualGatePass = async (req, res, next) => {
    try {
        let data = await casualGatePassService.createCasualGatePass(req.body, req.user);
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "Casual_Gate_Pass";
        if (data === "success") {
            auditData["message"] = "Casual Gate Pass created for " +
                req.body.registrationNumber + " successfully ";
            auditData["result"] = "success";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data added successfully.",
                casualGatepass: data
            });
        } else {
            auditData["message"] = "Casual Gate Pass creation fail";
            auditData["result"] = "failed";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            return res.status(500).send({
                requestSuccessful: true,
                message: "Data not added"
            });
        }
    } catch (err) {
        logger.error("Casual Gate Pass controller createCasualGatePass: ", err);
        next(err); 
    };
};

const listCasualGatePass = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Transaction';
        auditData['submenu_name'] = 'Casual_Gate_Pass';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Casual_Gate_Pass data ';
        const data = await casualGatePassService.listCasualGatePass(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                casualGatePass: data,
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
        logger.error('Casual Gate Pass controller listEmployee', err);
        next(err);
    }
};

const getTechnician = async (req, res, next) => {
    try {
        const data = await casualGatePassService.getTechnician(req.body, req.user);
        res.status(200).send({
            requestSuccessful: true,
            casualGatePass: data,
            message: "Data fetched successfully."
        });
    } catch (err) {
        logger.error("Casual Gate Pass controller getCustomerData", err);
        next(err);
    }
};

const downloadCasualGatePass = async (req, res, next) => {
    console.log("controller")
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "casualGatePass",
            action: "GET",
            access: "Portal",
            message: "Generate casualGatePass PDF"
        };

        logger.info('CasualGatePassController downloadCasualGatePass :', req.query.registrationNo);

        const data = await casualGatePassService.downloadCasualGatePass(req.query.registrationNo, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        const pdfBuffer = await PdfUtility.generatePDF('casualGatePass', data);
        if (pdfBuffer) {
            auditData.result = "success";

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="casualGatePass.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('CasualGatePass Controller generatePDF Error:', err);
        if (browser) await browser.close();
        next(err);
    }
};

const CasualGatePassReportView = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Casual Gate Pass Report",
            action: ACTION_GET,
            access: "Portal",
            message: "Casual Gate Pass Report"
        };
        const type = 2;
        const results = await casualGatePassService.CasualGatePassReport(req.body, req.user);
        if (results) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                totalItems: results.totalItems,
                data: results.data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: false,
                totalItems: 0,
                data: [],
            });
        }
    } catch (err) {
        logger.error('JobCard Controller billGridView Error:', err);
        next(err);
    }
}

const CasualGatePassReportExport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Casual Gate Pass Report",
        action: ACTION_GET,
        access: "Portal",
        message: "Casual Gate Pass Report Export"
    };
    try {
        const type = 1;
        const results = await casualGatePassService.CasualGatePassReport(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const header = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Document No', key: 'document_no', width: 20 },
            { header: 'Document Date', key: 'created_date', width: 20 },
            { header: 'Customer Name', key: 'customerName', width: 20 },
            { header: 'Customer Mobile Number', key: 'customerMobileNumber', width: 20 },
            { header: 'Vehicle Reg No', key: 'reg_no', width: 20 },
            { header: 'Make', key: 'makeName', width: 20 },
            { header: 'Model', key: 'modelName', width: 20 },
            { header: 'Gate In Date Time', key: 'gateInTime', width: 20 },
            { header: 'Gate Out Date Time', key: 'gateOutTime', width: 20 },
            { header: 'Reason', key: 'reason', width: 20 },
            { header: 'Next Appointment Date', key: 'nextAppointmentDate', width: 20 },
            { header: 'Remarks', key: 'remarks', width: 20 },
            { header: 'Service Advisor', key: 'serviceAdvisor', width: 20 },
            { header: 'Technician Name', key: 'technicianName', width: 20 },
           
        ]

        worksheet.columns = header;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
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
        res.setHeader('Content-Disposition', 'attachment; filename="bill_report.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportBillReport Error:', err);
        next(err);
    }
}
const casualGatePassController = {
    createCasualGatePass,
    downloadCasualGatePass,
    getTechnician, listCasualGatePass,CasualGatePassReportView,CasualGatePassReportExport
};

export default casualGatePassController;
