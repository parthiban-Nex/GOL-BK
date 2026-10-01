import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InspectionCheckListService from './service.js';

const addParamAlertSchedule = async (req, res, next) => {
  try {
    logger.info(
      'ParamAlertSchedule Controller addParamAlertSchedule requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ParamAlertSchedule';
    auditData['action'] = ACTION_ADD;
    let result = await InspectionCheckListService.addParamAlertSchedule(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'ParamAlertSchedule added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'ParamAlertSchedule not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'ParamAlertSchedule Controller addParamAlertSchedule Error:',
      err
    );
    next(err);
  }
};

const updateParamAlertSchedule = async (req, res, next) => {
  try {
    logger.info(
      'ParamAlertSchedule Controller updateParamAlertSchedule requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ParamAlertSchedule';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionCheckListService.updateParamAlertSchedule(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'ParamAlertSchedule Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'ParamAlertSchedule not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'ParamAlertSchedule not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'ParamAlertSchedule Controller updateParamAlertSchedule Error:',
      err
    );
    next(err);
  }
};

const listParamAlertSchedule = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ParamAlertSchedule';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get ParamAlertSchedule data ';
    const data = await InspectionCheckListService.listParamAlertSchedule(
      req.body
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        paramAlertScheduleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        paramAlertScheduleData: data,
      });
    }
  } catch (err) {
    logger.error(
      'ParamAlertSchedule Controller listParamAlertSchedule Error:',
      err
    );
    next(err);
  }
};

const deleteParamAlertSchedule = async (req, res, next) => {
  try {
    logger.info(
      'ParamAlertSchedule Controller deleteParamAlertSchedule requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ParamAlertSchedule';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionCheckListService.deleteParamAlertSchedule(
      id,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'ParamAlertSchedule deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'ParamAlertSchedule deleted successfully',
      });
    } else {
      auditData['message'] = 'ParamAlertSchedule not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'ParamAlertSchedule not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'ParamAlertSchedule Controller deleteParamAlertSchedule Error:',
      err
    );
    next(err);
  }
};

const getAllInspectionCheckList = async (req, res, next) => {
  try {
    const data = await InspectionCheckListService.getAllInspectionCheckList();
    res.status(200).send({
      requestSuccessful: true,
      SubSystemMapdata: data,
    });
  } catch (err) {
    logger.error(
      'InspectionCheckList controller getAllInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addParamAlertSchedule,
  updateParamAlertSchedule,
  deleteParamAlertSchedule,
  listParamAlertSchedule,
  getAllInspectionCheckList,
};

export default controller;
