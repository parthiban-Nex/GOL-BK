import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InsuranceService from './service.js';

const addInsurance = async (req, res, next) => {
  try {
    logger.info(
      'Insurance Controller addInsurance requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Insurance';
    auditData['action'] = ACTION_ADD;
    let result = await InsuranceService.addInsurance(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Insurance added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'Insurance not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Insurance Controller addInsurance Error:', err);
    next(err);
  }
};

const updateInsurance = async (req, res, next) => {
  try {
    logger.info(
      'Insurance Controller updateInsurance requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Insurance';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InsuranceService.updateInsurance(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Insurance Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Insurance not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Insurance not Updated',
      });
    }
  } catch (err) {
    logger.error('Insurance Controller updateInsurance Error:', err);
    next(err);
  }
};

const listInsurances = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Insurance';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Insurance data ';
    const data = await InsuranceService.listInsurances(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InsuranceData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InsuranceData: data,
      });
    }
  } catch (err) {
    logger.error('Insurance Controller listInsurances Error:', err);
    next(err);
  }
};

const getAllInsurances = async (req, res, next) => {
  try {
    const data = await InsuranceService.getAllInsurances();
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        InsuracesData: data,
      });
    }
  } catch (err) {
    logger.error('Insurance Controller getAllInsurances Error:', err);
    next(err);
  }
};

const controller = {
  addInsurance,
  updateInsurance,
  listInsurances,
  getAllInsurances,
};

export default controller;
