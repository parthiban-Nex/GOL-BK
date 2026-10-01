import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import DockFieldService from './service.js';

const addDockFields = async (req, res, next) => {
  try {
    logger.info(
      'DockFields Controller addPickupType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'Dock Fields';
    auditData['action'] = ACTION_ADD;
    let result = await DockFieldService.addDockFields(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'DockFields added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'DockFields not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('DockFields Controller addDockFields Error:', err);
    next(err);
  }
};

const updateDockFields = async (req, res, next) => {
  try {
    logger.info(
      'DockFieldService Controller updatePickupType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'Dock FieldS';
    auditData['action'] = ACTION_UPDATE;
    let result = await DockFieldService.updateDockFields(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'DockFieldS Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'PickupType not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'DockFields not Updated',
      });
    }
  } catch (err) {
    logger.error('DockFieldS Controller updateTyreSize Error:', err);
    next(err);
  }
};

const listDockFields = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'Dock Fields';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Dock Fields data ';
    const data = await DockFieldService.listDockFields(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        DockFieldData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        TyreSizeData: data,
      });
    }
  } catch (err) {
    logger.error('DockField Controller listPickupType Error:', err);
    next(err);
  }
};

const listInputTypes = async (req, res, next) => {
  try {
    const data = await DockFieldService.listInputTypes(req.body);
    res.status(200).send({
      requestSuccessful: true,
      DockFieldData: data,
    });
  } catch (err) {
    logger.error('DockField Controller listPickupType Error:', err);
  }
};

const deleteDockFields = async (req, res, next) => {
  try {
    logger.info(
      'Dock Fields Controller deleteDockFields requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'Dock Fields';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await DockFieldService.deleteDockFields(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'Dock Fields deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Dock Fields deleted successfully',
      });
    } else {
      auditData['message'] = 'Dock Fields not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Dock Fields not deleted',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller deleteTyreSize Error:', err);
    next(err);
  }
};

const controller = {
  addDockFields,
  updateDockFields,
  listDockFields,
  deleteDockFields,
  listInputTypes,
};

export default controller;
