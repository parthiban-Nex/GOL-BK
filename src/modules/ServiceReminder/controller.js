import service from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import serviceReminderAlert from './ServiceReminderAlert.js';
import ExcelJS from 'exceljs';

const createServiceReminder = async (req, res, next) => {
  try {
    logger.info(
      'Service Reminder Alert Controller createServiceReminder requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Service Reminder Alert';
    auditData['action'] = ACTION_ADD;
    let result = await service.createServiceReminder(req.body, req.user);
    if (result.success) {
      auditData['message'] = 'Service Reminder Alert added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Service Reminder Alert not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Service Reminder Alert controller createServiceReminder', err);
    next(err);
  }
};

const listServiceReminderAlert = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Lead Management';
    auditData['submenu_name'] = 'Servcie Reminder Alert';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Servcie Reminder Alert data ';
    const data = await service.listServiceReminderAlert();
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        servcieReminder: data,
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

const getServiceReminderAlert = async (req, res) => {
  const auditData = {};
  try {
    auditData['menu_name'] = 'Lead Management';
    auditData['submenu_name'] = 'Service Reminder Alert';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Service Reminder Alert data';
    const data = await service.getServiceReminderAlert(req.body.jcId, req.body.lead_id);
    if (data) {
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "Data fetched successfully",
        serviceReminderAlerts: data
      });
    } else {
      auditData['result'] = 'failed'
      auditLog.createAuditLog(req, auditData);
      res.status(500).send({
        requestSuccessful: true,
        message: "Data not fetched."
      });
    }
  } catch (err) {
    logger.error('Service Reminder Alert getServiceReminderAlert controller', err);
  }
};

const getServiceReminderData = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: "Reports",
      submenu_name: "Service Reminder",
      action: ACTION_GET,
      access: "Portal",
      message: "Service Reminder Report"
    };
    const data = await service.getServiceReminderData(req.body, req.user);
    if (data) {
      auditData.result = "success";
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        serviceReminderData: data
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
 
const exportServiceReminderReport = async (req, res, next) => {
  const auditData = {
    menu_name: "Reports",
    submenu_name: "Service Reminder",
    action: ACTION_GET,
    access: "Portal",
    message: "Service Reminder Report Export"
  };
  try {
    const results = await service.getServiceReminderData(req.body, req.user);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    const headers = [
      { header: 'SL No', key: 'autoId', width: 10 },
      { header: 'Branch', key: 'outletCode', width: 20 },
      { header: 'Vehicle', key: 'vehicleRegNo', width: 20 },
      { header: 'Make', key: 'makeName', width: 20 },
      { header: 'Model', key: 'modelName', width: 25 },
      { header: 'Service', key: 'scheduleDescription', width: 25 },
      { header: 'Last Service Date', key: 'lastServiceDate', width: 25 },
      { header: 'Last Service KM', key: 'lastServicekm', width: 25 },
      { header: 'Avg KM per day', key: 'avgkmPerDay', width: 25 },
      { header: 'Next Service Due Date', key: 'nextServiceDate', width: 25 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Customer Mobile Number', key: 'customerMobileNumber', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
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
    await res.setHeader('Content-Disposition', 'attachment; filename="Service_Reminder_Report.xlsx"');

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
  createServiceReminder,
  listServiceReminderAlert,
  getServiceReminderAlert,
  getServiceReminderData,
  exportServiceReminderReport
};

export default controller;