import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import CheckListTypeService from './service.js';

const addCheckListType = async (req, res, next) => {
  try {
    logger.info(
      'CheckListType Controller addCheckListType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'CheckListType';
    auditData['action'] = ACTION_ADD;
    let result = await CheckListTypeService.addCheckListType(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'CheckListType added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'CheckListType not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('CheckListType Controller addCheckListType Error:', err);
    next(err);
  }
};

const updateCheckListType = async (req, res, next) => {
  try {
    logger.info(
      'CheckListType Controller updateCheckListType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'CheckListType';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await CheckListTypeService.updateCheckListType(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'CheckListType Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'CheckListType not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'CheckListType not Updated',
      });
    }
  } catch (err) {
    logger.error('CheckListType Controller updateCheckListType Error:', err);
    next(err);
  }
};

const listCheckListTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'CheckListType';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get CheckListType data ';
    const data = await CheckListTypeService.listCheckListTypes(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        CheckListTypeData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        CheckListTypeData: data,
      });
    }
  } catch (err) {
    logger.error('CheckListType Controller listCheckListTypes Error:', err);
    next(err);
  }
};

const deleteCheckListType = async (req, res, next) => {
  try {
    logger.info(
      'CheckListType Controller deleteCheckListType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'CheckListType';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await CheckListTypeService.deleteCheckListType(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'CheckListType deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'CheckListType deleted successfully',
      });
    } else {
      auditData['message'] = 'CheckListType not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'BatteryOem not deleted',
      });
    }
  } catch (err) {
    logger.error('CheckListType Controller deleteCheckListType Error:', err);
    next(err);
  }
};

const getCustomerAccountTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Aggregate';
    const data = await CheckListTypeService.getCustomerAccountTypes();
    if (data) {
      auditData['message'] = 'Get Aggregate data ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        CustomerAccountTypes: data,
      });
    } else {
      auditData['message'] = 'Get Aggregate data';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error(
      'CheckListType Controller getCustomerAccountTypes Error:',
      err
    );
    next(err);
  }
};

const getCheckListTypes = async (req, res, next) => {
  try {
    const data = await CheckListTypeService.getCheckListTypes();
    res.status(200).send({
      requestSuccessful: true,
      CheckListTypes: data,
    });
  } catch (err) {
    logger.error('CheckListType controller getCheckListTypes Error:', err);
    next(err);
  }
};

const getInspectionTypes = async (req, res, next) => {
  try {
    const data = await CheckListTypeService.getInspectionTypes();
    res.status(200).send({
      requestSuccessful: true,
      InspectionTypes: data,
    });
  } catch (err) {
    logger.error('CheckListType controller getInspectionTypes Error:', err);
    next(err);
  }
};
const controller = {
  addCheckListType,
  updateCheckListType,
  listCheckListTypes,
  deleteCheckListType,
  getCustomerAccountTypes,
  getCheckListTypes,
  getInspectionTypes,
};

export default controller;
