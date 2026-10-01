import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InspectionSubsystemMapService from './service.js';

const addInspectionSubsystem = async (req, res, next) => {
  try {
    logger.info(
      'InspectionSubsystemMap Controller addInspectionSubsystem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionSubsystemMap';
    auditData['action'] = ACTION_ADD;
    let result = await InspectionSubsystemMapService.addInspectionSubsystem(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionSubsystemMap added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'InspectionSubsystemMap not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Controller addInspectionSubsystem Error:',
      err
    );
    next(err);
  }
};

const updateInspectionSubsystem = async (req, res, next) => {
  try {
    logger.info(
      'InspectionSubsystemMap Controller updateInspectionSubsystem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionSubsystemMap';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionSubsystemMapService.updateInspectionSubsystem(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionSubsystemMap Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'InspectionSubsystemMap not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionSubsystemMap not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Controller updateInspectionSubsystem Error:',
      err
    );
    next(err);
  }
};

const listInspectionSubsystem = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionSubsystemMap';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get InspectionSubsystemMap data ';
    const data = await InspectionSubsystemMapService.listInspectionSubsystem(
      req.body
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionSubsystemData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionSubsystemData: data,
      });
    }
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Controller listInspectionSubsystem Error:',
      err
    );
    next(err);
  }
};

const deleteSubsystem = async (req, res, next) => {
  try {
    logger.info(
      'InspectionSubsystemMap Controller deleteSubsystem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionSubsystemMap';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionSubsystemMapService.deleteSubsystem(
      id,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionSubsystemMap deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionSubsystemMap deleted successfully',
      });
    } else {
      auditData['message'] = 'InspectionSubsystemMap not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionSubsystemMap not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Controller deleteSubsystem Error:',
      err
    );
    next(err);
  }
};

const getInspectionSubsystemMaps = async (req, res, next) => {
  try {
    const data =
      await InspectionSubsystemMapService.getInspectionSubsystemMaps();
    res.status(200).send({
      requestSuccessful: true,
      SubSystemMapdata: data,
    });
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap controller getInspectionSubsystemMaps Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addInspectionSubsystem,
  updateInspectionSubsystem,
  listInspectionSubsystem,
  deleteSubsystem,
  getInspectionSubsystemMaps,
};

export default controller;
