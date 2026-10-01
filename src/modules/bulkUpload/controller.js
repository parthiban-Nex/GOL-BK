import service from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import xlsx from 'xlsx';
import GrnService from '../Parts/GRN/service.js';
import db from '../index.js';
import OutletDao from '../outlet/dao.js'
import { Op } from 'sequelize';
import POService from '../Parts/PurchaseOrder/service.js';
import VendorService from '../vendor/service.js'
import excel from 'exceljs';
import fs from 'fs';
import path from 'path'; 
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import VendorDao from '../vendor/dao.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const Outlet = db.outlets
const Make = db.makes
const Model = db.models
const PartsCategory = db.itemcategories
const Item = db.items
const Company = db.companies
const ItemGroups = db.itemgroups
const LabourCatogryMapping=db.laborCategoryMapping
const Employee = db.employees

const validateItemMaster = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Item master';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateItemMaster(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Item master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate Grn Upload Error:',
      err
    );
    next(err);
  }
};

const validateGrnUploads = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Grn Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData, message,actualHeaders } = await service.validateGrnUploads(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Grn upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
     res.setHeader('Content-Disposition', 'attachment; filename="failed_grns.xlsx"');

      const workbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet('Failed Rows');

      const finalHeaders = [...actualHeaders, "Error Message","item error"];
      worksheet.addRow(finalHeaders).commit();

      for (const row of exceptionData) {
        const rowData = finalHeaders.map(h => row[h] || '');
        worksheet.addRow(rowData).commit();
      }

      await workbook.commit();
      return;
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate Po Upload Error:',
      err
    );
    next(err);
  }
};

const validateVendorUploads = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Vendor Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData, message } = await service.validateVendorUploads(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Vendor upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: message || 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate vendor upload Error:',
      err
    );
    next(err);
  }
};

const validatePoUploads = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Po Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData, message } = await service.validatePoUploads(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Po upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: message || 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateItemMaster Error:',
      err
    );
    next(err);
  }
};

const uploadFile = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Item master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Item master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.processFileAndSaveToDB(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Item master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Item master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Item master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const validateLaborSchedule = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Labur Schedule';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateLaborSchdeule(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate labor schedule ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateLaborSchedule Error:',
      err
    );
    next(err);
  }
};

const uploadLaborFile = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Labor master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Labor master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.processFileAndSaveToDBLabor(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Labor master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Labor master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Labor master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};


const validateMake = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Make';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateBulkMake(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk make';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateMake Error:',
      err
    );
    next(err);
  }
};

const uploadMakeFile = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Make master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Make master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.procesFileAndSaveToDBMake(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Make master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Make master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Make master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const uploadModel = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Model master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Model master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(500).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows, duplicateModels, invalidRecords } = await service.procesFileAndSaveToDBModel(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Model master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows,
        duplicateModels,
        invalidRecords
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Model master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows: 0,
        insertedRows: 0,
        duplicateModels: 0,
        invalidRecords: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Model master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const validateModel = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Model';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateBulkModel(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate model bulk upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        successCount: successData.length,
        successData: successData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        successCount: successData.length,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateModel Error:',
      err
    );
    next(err);
  }
};


const validateBulkCustomer = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Model';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateBulkCustomer(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate customers bulk upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        successCount: successData,
        successData: successData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateBulkCustomer Error:',
      err
    );
    next(err);
  }
};

const uploadCustomers = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Customer master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Customer master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(500).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows, duplicateCustomers, invalidRecords } = await service.procesFileAndSaveToDBCustomers(fileBuffer, req.user);

    if (totalRows) {
      auditData['message'] = 'Bulk Upload Customer master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows,
        duplicateCustomers,
        invalidRecords
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Customer master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows: 0,
        insertedRows: 0,
        duplicateCustomers: 0,
        invalidRecords: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Customer master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const validateBulkVehicle = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Model';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateBulkVehicle(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate vehicle bulk upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        successCount: successData,
        successData: successData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateBulkVehicle Error:',
      err
    );
    next(err);
  }
};

const uploadVehicles = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Vehicle master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Vehicle master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(500).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows, duplicateCustomers, invalidRecords } = await service.procesFileAndSaveToDBVehicles(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Vehicle master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows,
        duplicateCustomers,
        invalidRecords
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Vehicle master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows: 0,
        insertedRows: 0,
        duplicateCustomers: 0,
        invalidRecords: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Vehicle master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const validateBulkPincode = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Pincode';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateBulkPincode(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Pincode';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validateBulkPincode Error:',
      err
    );
    next(err);
  }
}

const uploadPincodeFile = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Pincode master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Pincode master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.procesFileAndSaveToDBPincode(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Pincode master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Pincode master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Pincode master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const BulkCreateGrn = async (req, res, next) => {
        const mainTransaction = await db.sequelize.transaction();
  try {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    const [headers, ...rows] = data;

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: "Empty file", requestSuccessful: false });
    }

    const CHUNK_SIZE = 500;

    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    // STEP 1: GROUP BY OUTLET
    const outletGroups = {};

    for (const row of rows) {
      const obj = headers.reduce((acc, key, idx) => {
        acc[key] = row[idx];
        return acc;
      }, {});

      const outletCode = obj["Branch"];

      if (!outletCode) continue;

      if (!outletGroups[outletCode]) {
        outletGroups[outletCode] = [];
      }

      outletGroups[outletCode].push(row);
    }

    const now = new Date();
    const todaydate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let failedRows = [];
    let uniqueid = 1;
    let createdGrns = [];

    // STEP 2: PROCESS EACH OUTLET
    for (const outletCode of Object.keys(outletGroups)) {

      const outlet = await Outlet.findOne({ where: { outletCode } });

      if (!outlet) {
        // mark all rows failed
        for (const row of outletGroups[outletCode]) {
          const obj = headers.reduce((acc, key, idx) => {
            acc[key] = row[idx];
            return acc;
          }, {});
          failedRows.push({
            ...obj,
            "Error Message": `Outlet not found: ${outletCode}`
          });
        }
        continue;
      }

      //  CREATE GRN PER OUTLET
      const grndata = {
        document_type: "ADJ",
        outlet_id: outlet.id,
        outlet_code: outlet.outletCode,
        vendor_code: "0",
        invoice_date: todaydate,
        status: 2,
        frieght_charges: 0,
        mis_charges: 0,
      };

      let GRN_data;

        GRN_data = await GrnService.BulkCreateGrn(grndata, req.user, mainTransaction);
     

      let grand_total = 0;

      const rowChunks = chunkArray(outletGroups[outletCode], CHUNK_SIZE);

      for (const chunk of rowChunks) {

        let grnPartsPayload = [];
        let binPayload = [];
        const normalize = val =>
  String(val)
    .trim()
    .toUpperCase();
        const itemCodes = chunk.map(r => normalize(r[headers.indexOf("Item Code")]));

        const items = await Item.findAll({
          where: { itemCode: { [Op.in]: itemCodes } },
          attributes: ['id', 'itemCode']
        });

const itemCodeSet = new Set(
  items.map(item => normalize(item.itemCode))
);
        for (const row of chunk) {
          const obj = headers.reduce((acc, key, idx) => {
            acc[key] = row[idx];
            return acc;
          }, {});

          const item = itemCodeSet.has(normalize(obj["Item Code"]))
            ? items.find(i => normalize(i.itemCode) === normalize(obj["Item Code"]))
            : null;

          if (!item?.id) {
            failedRows.push({
              ...obj,
              "Error Message": `Item not found for ${obj["Item Code"]}`
            });
              throw new Error(`Item not found for ${obj["Item Code"]}`);
            // continue;
          }

          const total = parseFloat(obj["Value"]) || 0;
          grand_total += total;

          grnPartsPayload.push({
            item_id: item.id,
            item_code: item.itemCode,
            item_description: obj["Item Name"],
            sup_invoice_quantity: parseFloat(obj["Qty"]),
            quantity: parseFloat(obj["Qty"]),
            rate: parseFloat(obj["Unit Sale Rate"]),
            cost: parseFloat(obj["Unit Cost"]),
            mrp: parseFloat(obj["MRP"]),
            discount: parseFloat(obj["Discount"] || 0),
            binlocation: 0,
            total: total,
            binid: uniqueid,
            old_grn_no: obj["GRN No"],
            old_grn_date: obj["GRN Date"],
            old_stocks_id: obj["DMS ID"],
            old_supplier_name: obj["Supplier Name"],
            old_supplier_date: obj["Supplier Invoice Date"]
            
          });

          binPayload.push({
            item_code: item.itemCode,
            quantity: parseFloat(obj["Qty"]),
            binLocation: obj["Location"] || null,
            outlet_code: outlet?.outletCode,
            binid: uniqueid,
          });

          uniqueid++;
        }
if (grnPartsPayload.length === 0) {
  continue;
}
            const GRN_Parts_data = await GrnService.BulkCreatePartsAndStocks(
            grnPartsPayload,
            GRN_data,
            req.user,
            mainTransaction
          );

          await GrnService.BulkCreateGateeinBinLocation(
            binPayload,
            req.user,
            GRN_Parts_data,
            mainTransaction
          );


       
      }
        const stockAdjustment = await GrnService.CreateStockAdjustment(
          GRN_data,
          grand_total,
          req.user,
          mainTransaction
        );

        const parts = await db.grnparts.findAll({
          where: { grn_id: GRN_data?.dataValues?.id },
          transaction: mainTransaction
        });
        const plainParts = parts.map(p => p.get({ plain: true }));

        await GrnService.CreateStockAdjustmentParts(
          plainParts,
          stockAdjustment,
          mainTransaction
        );   
    }

    //  FAILED EXPORT
    if (failedRows.length > 0) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="failed_grns.xlsx"');

      const workbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet('Failed Rows');

      const finalHeaders = [...headers, "Error Message"];
      worksheet.addRow(finalHeaders).commit();

      for (const row of failedRows) {
        const rowData = finalHeaders.map(h => row[h] || '');
        worksheet.addRow(rowData).commit();
      }

      await workbook.commit();
      return;
    }
        mainTransaction.commit();
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Multiple GRNs created successfully',
      grnIds: createdGrns,
    });

  } catch (error) {
    await mainTransaction.rollback();
    next(error);
  }
};



const BulkCreatePO = async (req, res, next) => {
  let PO_data = {};
  let PO_Parts_data = {};
  try {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    const headers = Object.keys(data[0]);
    const failedRows = [];

    const date = new Date();
    date.setDate(date.getDate() + 30);
    const validTillDate = date.toISOString().split('T')[0];

    const uniqueBranches = [...new Set(data.map(r => r.Branch))];
    const outletData = await Outlet.findAll({ where: { outletCode: { [Op.in]: uniqueBranches } } });
    const outletMap = Object.fromEntries(outletData.map(o => [o.outletCode, o]));

    for (let row of data) {
      try {
        const outlet = outletMap[row.Branch];
        if (!outlet) throw new Error(`Branch not found: ${row.Branch}`);

        const make = await Make.findOne({ where: { makeName: row["Make"] }, attributes: ['id'] });
        if (!make) throw new Error(`Make not found: ${row["Make"]}`);

        const model = await Model.findOne({ where: { modelName: row["Model"], makeId: make.id }, attributes: ['id'] });
        if (!model) throw new Error(`Model not found: ${row["Model"]}`);

        const partcategory = await PartsCategory.findOne({ where: { itemCategorie: row["Parts Category"] }, attributes: ['id'] });
        if (!partcategory) throw new Error(`Parts Category not found: ${row["Parts Category"]}`);

        const item = await Item.findOne({
          where: {
            [Op.or]: [
              { itemCode: row["Item Code"] },
              { itemName: row["Item Name"] },
              { itemDescription: row["Item Name"] }
            ]
          },
          attributes: ['id']
        });
        if (!item) throw new Error(`Item not found: ${row["Item Name"]}`);

        const podata = {
          valid_till_date: validTillDate,
          vendor_code: row["Vendor Code"],
        };

        const poparts = [{
          item_id: item.id,
          item_code: row["Item Code"],
          item_description: row["Item Name"],
          quantity: parseFloat(row['Qty']),
          back_order_quantity: parseFloat(row["Qty"]),
          hsncode: row["HSN"],
          make_id: make.id,
          model_id: model.id,
          part_category_id: partcategory.id,
          vin_number: row["Vin Number"],
          reg_no: row["Reg No"],
          rate: parseFloat(row["Purchase Price"]),
          cost: parseFloat(row["Cost"]),
          mrp: parseFloat(row["MRP"]),
          discount: 0,
          cgst: row["CGST"],
          sgst: row["SGST"],
          igst: row["IGST"],
          total: parseFloat(row["Value"]),
        }];

        const user = {
          ...req.user,
          outlet: {
            id: outlet.id,
            outletCode: outlet.outletCode,
          }
        };

        PO_data = await POService.CreatePO(podata, user);
        PO_Parts_data = await POService.CreatePOParts(poparts, PO_data);
      } catch (err) {
        failedRows.push({ ...row, "Error Message": err.message });
        continue;
      }
    }

    if (failedRows.length > 0) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="failed_po.xlsx"');

      const failedWorkbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const sheet = failedWorkbook.addWorksheet('Failed Rows');

      const finalHeaders = [...headers, "Error Message"];
      sheet.addRow(finalHeaders).commit();

      for (const failed of failedRows) {
        const rowData = finalHeaders.map(h => failed[h] || '');
        sheet.addRow(rowData).commit();
      }

      await failedWorkbook.commit();
      return;
    }

    return res.status(200).json({
      requestSuccessful: true,
      message: 'All POs created successfully',
    });

  } catch (error) {
    logger.error('PO Controller Error:', error);
    next(error);
  }
};


const BulkCreateVendor = async (req, res, next) => {
  try {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const failedRows = [];
    const headers = Object.keys(data[0]);

    for (let row of data) {
      const transaction = await db.sequelize.transaction();
      try {
        // const arrofCompany = row["Company"].split(",");
        // const arrofItemGroup = row["Item Group"].split(",");
        // const arrofCompany = row["Company"].toString().split(",");
        // const arrofItemGroup = row["Item Group"].toString().split(",");
        const arrofItemGroup = row["Item Group"] != null ? row["Item Group"].toString().split(",") : [];
        // const trimmedCompanies = arrofCompany.map(c => c.trim());
        const trimmedItemGroups = arrofItemGroup.map(c => c.trim()).filter(c => c);
        // const companyIds = row["Company"].toString().split(",").map(c => parseInt(c.trim()));
        const companyIds = row["Company"] != null ? row["Company"].toString().split(",").map(c => parseInt(c.trim())).filter(c => !isNaN(c)) : [];
        // const pinCode = row["Pin Code"].toString().trim();
        const pinCode = row["Pin Code"] != null ? row["Pin Code"].toString().trim() : "";

        // const companies = await Company.findAll({
        //   where: {
        //     [Op.or]: [
        //       { name: { [Op.in]: trimmedCompanies } },
        //       { code: { [Op.in]: trimmedCompanies } }
        //     ]
        //   },
        //   attributes: ['id', 'name', 'code']
        // });
        const companies = await Company.findAll({
          where: {
            id: { [Op.in]: companyIds }
          },
          attributes: ['id', 'name', 'code']
        });

        const itemGroups = await ItemGroups.findAll({
          where: {
            [Op.or]: [
              { itemGroupDescription: { [Op.in]: trimmedItemGroups } },
              { itemGroupCode: { [Op.in]: trimmedItemGroups } }
            ]
          },
          attributes: ['id', 'itemGroupCode', 'itemGroupDescription']
        });
        // const foundCompanyValues = companies.map(c => c.name).concat(companies.map(c => c.code));
        const foundCompanyIds = companies.map(c => c.id);
        const foundItemGroupValues = itemGroups.map(g => g.itemGroupDescription).concat(itemGroups.map(g => g.itemGroupCode));

        // Determine missing values
        // const missingCompanies = trimmedCompanies.filter(c => !foundCompanyValues.includes(c));
        const missingCompanies = companyIds.filter(id => !foundCompanyIds.includes(id));
        const missingItemGroups = trimmedItemGroups.filter(g => !foundItemGroupValues.includes(g));

        // if (missingCompanies.length || missingItemGroups.length) {
        //   const errorParts = [];
        //   if (missingCompanies.length) errorParts.push(`Company ID not found: ${missingCompanies.join(', ')}`);
        //   if (missingItemGroups.length) errorParts.push(`Item Group not found: ${missingItemGroups.join(', ')}`);
        //
        //   failedRows.push({ ...row, "Error Message": errorParts.join(' | ') });
        //   await transaction.rollback();
        //   continue;
        // }

        // Company ID check — still fails if missing
        if (missingCompanies.length) {
          failedRows.push({ ...row, "Error Message": `Company ID not found: ${missingCompanies.join(', ')}` });
          await transaction.rollback();
          continue;
        }

        // Auto-create missing item groups — findOrCreate to handle duplicates
        if (missingItemGroups.length) {
          for (const missing of missingItemGroups) {
            const trimmed = missing.trim();
            const [newItemGroup] = await ItemGroups.findOrCreate({
              where: { itemGroupCode: trimmed },
              defaults: {
                itemGroupDescription: trimmed,
                status: 1,
                createdBy: req.user.id,
              },
              transaction,
            });
            itemGroups.push(newItemGroup);
          }
        }
        const getData = await VendorDao.getPincodeData({ pinCode });

        const vendorData = {
          vendorCode: row["Vendor Code"],
          vendorName: row["Vendor Name"],
          // gstin: row["Gstin"].toString(),
          // gstin: row["Gstin"] != null ? row["Gstin"].toString() : "",
          gstin: row["Gstin"] != null ? row["Gstin"].toString().trim().substring(0, 15) : "",
          panNumber: row["Pan Number"] || "",
          address1: row["Address 1"] || "",
          address2: row["Address 2"] || "",
          pincode: row["Pin Code"] || null,
          state: getData?.state || row["State"] || "",
          city: getData?.city || row["City"] || "",
          // areaName: row["Area Name"],
          areaName: row["Area Name"] || "",
          // mobileNumber: row["Mobile Number"] || null,
          // mobileNumber: row["Mobile Number"] && row["Mobile Number"].toString().trim() !== "+91-0000000000" ? row["Mobile Number"] : null,
          // mobileNumber: row["Mobile Number"] ? (() => { const m = row["Mobile Number"].toString().trim().replace(/^\+91-/, ""); return m === "0000000000" ? null : m; })() : null,
          // mobileNumber: row["Mobile Number"] ? (() => { const m = row["Mobile Number"].toString().trim(); if (m === "-" || m === "") return null; const cleaned = m.replace(/^\+91-/, ""); return cleaned === "0000000000" ? null : cleaned; })() : null,
          // mobileNumber: row["Mobile Number"] ? (() => { const m = row["Mobile Number"].toString().trim(); if (m === "-" || m === "" || m === ".") return null; const cleaned = m.replace(/^\+91-/, ""); return cleaned === "0000000000" ? null : cleaned; })() : null,
          // mobileNumber: row["Mobile Number"] ? (() => { const m = row["Mobile Number"].toString().trim(); if (["-", "", ".", "XXXXX"].includes(m)) return null; const cleaned = m.replace(/^\+91-/, ""); return cleaned === "0000000000" ? null : cleaned; })() : null,
          mobileNumber: row["Mobile Number"] ? (() => { const m = row["Mobile Number"].toString().trim(); if (["-", "", ".", "XXXXX", "+00-0000000000", "+91-0000000000"].includes(m)) return null; return m; })() : null,
          contactPerson: row["Contact Person"] || "",
          // contactPersonMobileNo: row["Contact Person Mobile Number"] ? (() => { const m = row["Contact Person Mobile Number"].toString().trim(); if (["-", "", ".", "XXXXX"].includes(m)) return null; const cleaned = m.replace(/^\+91-/, ""); return cleaned === "0000000000" ? null : cleaned; })() : null,
          contactPersonMobileNo: row["Contact Person Mobile Number"] ? (() => { const m = row["Contact Person Mobile Number"].toString().trim(); if (["-", "", ".", "XXXXX", "+00-0000000000", "+91-0000000000"].includes(m)) return null; return m; })() : null,
          vendorType: row["Vendor Type"] || "",
          // marginPercentage: row["Margin Percentage"].toString(),
          // marginPercentage: row["Margin Percentage"] != null ? row["Margin Percentage"].toString() : "",
          marginPercentage: row["Margin Percentage"] != null && row["Margin Percentage"] !== "" ? row["Margin Percentage"] : null,
          vendor_site_code: row["VENDOR_SITE_CODE"] || "",
          oracle_vendor_number: row["ORACLE_VENDOR_NUMBER"] || null,
          isWarehouse: row["isWarehouse"] || 0,
        };

        const vendor = await VendorService.addVendor(vendorData, req.user, transaction);

        await VendorService.addVendorCompanyMap(companies, vendor.id, transaction);
        await VendorService.addVendorItemGroupMap(itemGroups, vendor.id, transaction);
        await transaction.commit();

      } catch (err) {
        await transaction.rollback();

        let errorMessage = err.message;

        if (
          (err.name === 'SequelizeUniqueConstraintError' ||
            err.name === 'SequelizeValidationError') &&
          Array.isArray(err.errors)
        ) {
          errorMessage = err.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        }

        // Push failed row with detailed error
        failedRows.push({ ...row, "Error Message": errorMessage });
        continue;
      }
    }

    if (failedRows.length > 0) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="failed_vendors.xlsx"');

      const failedWorkbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const sheet = failedWorkbook.addWorksheet('Failed Vendors');

      const finalHeaders = [...headers, "Error Message"];
      sheet.addRow(finalHeaders).commit();

      for (const failed of failedRows) {
        const rowData = finalHeaders.map(h => failed[h] || '');
        sheet.addRow(rowData).commit();
      }

      await failedWorkbook.commit();
      return; // response ends here due to stream
    }

    return res.status(200).json({
      requestSuccessful: true,
      message: 'All vendors processed successfully',
    });

  } catch (error) {
    logger.error('Vendor Controller Error:', error);
    next(error);
  }
};


const uploadsFile = async (req, res) => { 
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Outlet master';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Outlet master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.processAndSaveToDB(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Outlet master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Outlet master';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Outlet master';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};

const validateOutletMaster = async (req, res, next) => {
  try {
    logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Outlet master';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateOutletMaster(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Outlet master';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate Grn Upload Error:',
      err
    );
    next(err);
  }
};

const validateLabourCategoryMapingUploads = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Labour Category Mapping Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData, message } = await service.validatelabourCatagoryMappingUploads(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'Validate Bulk Labour Category Mapping Upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: message || 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate Labour Category Mapping Upload Error:',
      err
    );
    next(err);
  }
};

const BulkCreateLabourCategoryMapping= async (req, res, next) => {
  const fileBuffer = req.file.buffer;
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const [headers, ...rows] = data;

  try {

    
      let failedRows = [];
      let labourCategoryPayload=[]
      for (const row of rows) {
        const obj = headers.reduce((acc, key, idx) => {
          acc[key] = row[idx];
          return acc;
        }, {});

        const Labour = await db.laborschedules.findOne({
          where: {
           laborCode: obj ["Labour Code"]
          },
          attributes: ['id']
        });

        if (!Labour) {
          failedRows.push({ ...obj, "Error Message": `Labour not found for ${obj["Labour Code"]}` });
          continue;
        }

        labourCategoryPayload.push({
         labour_code: obj ["Labour Code"],
         labour_id: Labour.id,
         category_id: obj ["Category Id"],
         subcategory_id:obj ["SubCategory Id"],
         createdAt: new Date(),
         updatedAt: new Date(),
        })

      }

      const data= await LabourCatogryMapping.bulkCreate(labourCategoryPayload);

      if (failedRows.length > 0) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="failed_labour_category_mapping.xlsx"');
      


      const workbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet('Failed Rows');
      worksheet.addRow(['Labour Code', 'Category Id', 'SubCategory Id', 'Error Message']);
      failedRows.forEach(row => {
        worksheet.addRow([
          row["Labour Code"],
          row["Category Id"],
          row["SubCategory Id"],
          row["Error Message"]
        ]);
      });
      workbook.commit();
    } else {
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Labour Category Mapping created successfully',
        totalRows: rows.length,
        insertedRows: data.length,
        failedRows: failedRows.length
      });
    }
  } catch (error) {
    next(error);
  }
};

const validateTechnicianUploads = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Technician Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData, message } = await service.validateTechnicianUploads(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Technician upload';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: message || 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate technician upload Error:',
      err
    );
    next(err);
  }
};

const BulkCreateTechnician = async (req, res, next) => {
  try {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'No data found in the uploaded file.',
      });
    }

    const failedRows = [];
    const headers = Object.keys(data[0]);

    for (let row of data) {
      const transaction = await db.sequelize.transaction();
      try {
        const outletCode = row["Outlet Code"] ? row["Outlet Code"].toString().trim() : "";
        const outlet = await Outlet.findOne({ where: { outletCode: outletCode } });

        if (!outlet) {
          failedRows.push({ ...row, "Error Message": `Outlet Code not found: ${outletCode}` });
          await transaction.rollback();
          continue;
        }

        const employeeData = {
          outletId: outlet.id,
          employeeRoleId: 5,
          employeeName: row["Technician Name"] ? row["Technician Name"].toString().trim() : "",
          employeeCode: row["Technician Code"] ? row["Technician Code"].toString().trim() : "",
          mobileNumber: row["Mobile Number"] ? row["Mobile Number"].toString().trim() : null,
          email: null,
          status: 1,
          reports: 0,
          createdBy: req.user.id,
        };

        await Employee.create(employeeData, { transaction, validate: false });
        await transaction.commit();

      } catch (err) {
        await transaction.rollback();

        let errorMessage = err.message;

        if (
          (err.name === 'SequelizeUniqueConstraintError' ||
            err.name === 'SequelizeValidationError') &&
          Array.isArray(err.errors)
        ) {
          errorMessage = err.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        }

        failedRows.push({ ...row, "Error Message": errorMessage });
        continue;
      }
    }

    if (failedRows.length > 0) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="failed_technicians.xlsx"');

      const failedWorkbook = new excel.stream.xlsx.WorkbookWriter({ stream: res });
      const sheet = failedWorkbook.addWorksheet('Failed Technicians');

      const finalHeaders = [...headers, "Error Message"];
      sheet.addRow(finalHeaders).commit();

      for (const failed of failedRows) {
        const rowData = finalHeaders.map(h => failed[h] || '');
        sheet.addRow(rowData).commit();
      }

      await failedWorkbook.commit();
      return;
    }

    return res.status(200).json({
      requestSuccessful: true,
      message: 'All technicians processed successfully',
    });

  } catch (error) {
    logger.error('BulkCreateTechnician error:', error);
    next(error);
  }
};

const validateCashier = async (req, res, next) => {
  try {
    // logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Cashier Upload';
    auditData['action'] = ACTION_GET;
    let { result, exceptionData, successData } = await service.validateCashier(req, req.user, req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk Cashier';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        successData: successData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Bulk upload controller validate Bulk Cashier Error:',
      err
    );
    next(err);
  }
};

const bulkCashier = async (req, res) => {
  const auditData = {};
  auditData['menu_name'] = 'Bulk Upload';
  auditData['submenu_name'] = 'Cashier Upload';
  auditData['action'] = ACTION_ADD;
  if (!req.file) {
    auditData['message'] = 'Bulk Upload Cashier';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send('No file uploaded');
  }

  const fileBuffer = req.file.buffer;

  try {
    const { totalRows, insertedRows } = await service.bulkCashier(fileBuffer, req.user);
    if (totalRows) {
      auditData['message'] = 'Bulk Upload Cashier';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File uploaded and processed successfully',
        totalRows,
        insertedRows
      });
    }
    else {
      auditData['message'] = 'Bulk Upload Cashier';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'File not uploaded',
        totalRows: 0,
        insertedRows: 0
      });
    }
  } catch (err) {
    auditData['message'] = 'Bulk Upload Cashier';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    console.error(err);
    res.status(500).send('Error processing file');
  }
};


const controller = {
  uploadFile,
  uploadLaborFile,
  uploadMakeFile,
  uploadModel,
  validateMake,
  validateModel,
  validateItemMaster,
  validateLaborSchedule,
  validateBulkCustomer,
  uploadCustomers,
  validateBulkVehicle,
  uploadVehicles,
  validateBulkPincode,
  uploadPincodeFile,
  validateGrnUploads,
  BulkCreateGrn,
  validatePoUploads,
  BulkCreatePO,
  validateVendorUploads,
  BulkCreateVendor,
  validateTechnicianUploads,
  BulkCreateTechnician,
  uploadsFile,
  validateOutletMaster,
  validateLabourCategoryMapingUploads,
  BulkCreateLabourCategoryMapping,
  validateCashier,
  bulkCashier
};

export default controller;
