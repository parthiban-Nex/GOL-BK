import logger from '../../config/logger.js';
import {
    ACTION_GET,
    ACTION_ADD,
    ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import service from './service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PdfUtility from '../../shared/pdfUtility.js';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

const getVehicleForScheme = async (req, res, next) => {
    try {
        logger.info(
            'VehicleContract Controller getVehicleForScheme requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData['menu_name'] = 'Contract Sale';
        auditData['submenu_name'] = 'Vehicle Contract';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get getVehicleForScheme ';

        let data = await service.getVehicleForScheme(req.body, req.user);

        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                vehicleData: data,
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                vehicleData: {},
            });
        }
    } catch (err) {
        logger.error('VehicleContract controller getVehicleForScheme', err);
        next(err);
    }
}

const getSchemeDetails = async (req, res, next) => {
    try {
        logger.info(
            'VehicleContract Controller getSchemeDetails requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData['menu_name'] = 'Contract Sale';
        auditData['submenu_name'] = 'Vehicle Contract';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get getSchemeDetails ';

        let data = await service.getSchemeDetails(req.body, req.user);

        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                schemeData: data,
            });
        }
        else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                schemeData: {},
            });
        }
    } catch (err) {
        logger.error('VehicleContract controller getSchemeDetails', err);
        next(err);
    }
}

const listVehicleContract = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Contract Sale';
        auditData['submenu_name'] = 'Vehicle Contract';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get listVehicleContract ';
        const data = await service.listVehicleContract(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                vehicleContractData: data,
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                vehicleContractData: {},
            });
        }
    } catch (err) {
        logger.error('Vehicle controller listVehicles', err);
        next(err);
    }
}

const createVehicleContract = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Contract Sale';
        auditData['submenu_name'] = 'Vehicle Contract';
        auditData['action'] = ACTION_ADD;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Add VehicleContract ';
        const data = await service.createVehicleContract(req.body, req.user);
        if (data === 'success') {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'Data Saved successfully',
            });
        } else if(data === 'duplicate') {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'duplicate',
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Vehicle controller createVehicleContract', err);
        next(err);
    }
}

const editVehicleContract = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Contract Sale';
        auditData['submenu_name'] = 'Vehicle Contract';
        auditData['action'] = ACTION_UPDATE;
        auditData['access'] = 'Portal';
        auditData['message'] = 'edit VehicleContract ';
        const data = await service.editVehicleContract(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'Data Edited successfully',
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: 'Data not Edited ',
            });
        }
    } catch (err) {
        logger.error('Vehicle controller createVehicleContract', err);
        next(err);
    }
}

const vehicleContractPDF = async (req, res, next) => {

    console.log('vehicle contracthjBDKJNFA;LJFN;AKLFN;LKAF;KLANF;LKANF11111111111111111111111')
    
    try {
        const auditData = {
            menu_name: 'Contract Sale',
            submenu_name: 'Vehicle Contract',
            action: ACTION_GET,
            access: 'Portal',
            message: 'GeneratePDF',
        };

        logger.info(
            'ServiceEstimate Controller generatePDF requestData:' + req.query.id
        );

        const data = await service.getVehicleContract(req.query.id, req.user.outlet);

        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF('vehicleContractInvoice', data);

        if (pdfBuffer) {
            auditData.result = 'success';
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="vehicleContract.pdf"'
            );
            res.send(pdfBuffer);
        } else {
            auditData.result = 'failed';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error('Vehicle controller vehicleContractPDF', err);
        next(err);
    }
}

const vehicleContractSchemePDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: 'Contract Sale',
            submenu_name: 'Vehicle Contract',
            action: ACTION_GET,
            access: 'Portal',
            message: 'GeneratePDF',
        };

        logger.info(
            'ServiceEstimate Controller generatePDF requestData:' + req.query.id
        );

        const data = await service.getVehicleContract(req.query.id, req.user.outlet);

        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF('vehicleContractLaborInvoice', data);

        if (pdfBuffer) {
            auditData.result = 'success';
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="vehicleContractScheme.pdf"'
            );
            res.send(pdfBuffer);
        } else {
            auditData.result = 'failed';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error('Vehicle controller vehicleContractSchemePDF', err);
        next(err);
    }
}

const getVehicleContractData = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Vehicle Contract",
            action: ACTION_GET,
            access: "Portal",
            message: "Vehicle Contract Report"
        };
      const data = await service.getVehicleContractData(req.body, req.user);
      if (data) {
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          vehicleContractData: data
        });
      } else {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        res.status(500).send({
          message: 'Data not fetched'
        });
      }
    } catch (err) {
      logger.error('Service Reminder Alert controller getServiceReminderData', err);
      next(err);
    }
  };  

const exportVehicleContractData = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Vehicle Contract",
        action: ACTION_GET,
        access: "Portal",
        message: "Vehicle Contract Report Export"
    };
    try {
      const results = await service.getVehicleContractData(req.body, req.user);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Worksheet');
  
      const headers = [
        { header: 'SL No', key: 'autoId', width: 10 },
        { header: 'Branch', key: 'outletCode', width: 20 },
        { header: 'Document Number', key: 'doc_no', width: 20 },
        { header: 'Document Date', key: 'doc_date', width: 20 },
        { header: 'Repair Type', key: 'repair_type', width: 25 },
        { header: 'Scheme Name', key: 'scheme_name', width: 25 },
        { header: 'Start Date', key: 'start_date', width: 25 },
        { header: 'End Date', key: 'end_date', width: 25 },
        { header: 'Customer Code', key: 'customer_code', width: 25 },
        { header: 'Customer Name', key: 'customer_name', width: 25 },
        { header: 'Address', key: 'address', width: 25 },
        { header: 'Mobile Number', key: 'mobileNo', width: 20 },
        { header: 'Vehicle Reg No', key: 'vehicle_number', width: 20 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'CGST%', key: 'cgst', width: 20 },
        { header: 'CGST', key: 'cgstA', width: 20 },
        { header: 'SGST%', key: 'sgst', width: 20 },
        { header: 'SGST', key: 'sgstA', width: 20 },
        { header: 'IGST%', key: 'igst', width: 20 },
        { header: 'IGST', key: 'igstA', width: 20 },
        { header: 'Invoice Total', key: 'total_amount', width: 20 },
        { header: 'Registration Date', key: 'registrationDate', width: 20 },
        { header: 'Mfg Date', key: 'mfgDate', width: 20 },
        { header: 'Item Make', key: 'itemMake', width: 20 },
        { header: 'Item Model', key: 'itemModel', width: 20 },
        // { header: 'Discount %', key: 'discountPercent', width: 20 },
        // { header: 'Discount', key: 'Discount', width: 20 },
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
      
      await res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      await res.setHeader('Content-Disposition', 'attachment; filename="Vehicle_Contarct_Report.xlsx"');
  
      await workbook.xlsx.write(res);
  
      await res.end();
      auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
      logger.error('ServiceBooking Controller exportServiceReminderReport Error:', err);
      next(err);
    }
  };
  
const controller = {
    getVehicleForScheme,
    getSchemeDetails,
    listVehicleContract,
    createVehicleContract,
    editVehicleContract,
    vehicleContractPDF,
    vehicleContractSchemePDF,
    exportVehicleContractData,
    getVehicleContractData
}

export default controller;