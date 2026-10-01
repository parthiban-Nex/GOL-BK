import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import PickupTypeService from './service.js';

const addPickupType = async (req, res, next) => {
  try {
    logger.info(
      'PickupType Controller addPickupType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PickupType';
    auditData['action'] = ACTION_ADD;
    let result = await PickupTypeService.addPickupType(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'PickupType added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'PickupType not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('PickupType Controller addTyreSize Error:', err);
    next(err);
  }
};

const updatePickupType = async (req, res, next) => {
  try {
    logger.info(
      'PickupType Controller updatePickupType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PickupType';
    auditData['action'] = ACTION_UPDATE;
    let result = await PickupTypeService.updatePickupType(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'PickupType Updated successfully ';
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
        message: 'PickupType not Updated',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller updateTyreSize Error:', err);
    next(err);
  }
};

const listPickupType = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PickupType';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get PickupType data ';
    const data = await PickupTypeService.listPickupType(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        PickupTypeData: data,
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
    logger.error('PickupType Controller listPickupType Error:', err);
    next(err);
  }
};

const deletePickupType = async (req, res, next) => {
  try {
    logger.info(
      'PickupType Controller deletePickupType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PickupType';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await PickupTypeService.deletePickupType(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'PickupType deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'PickupType deleted successfully',
      });
    } else {
      auditData['message'] = 'PickupType not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'PickupType not deleted',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller deleteTyreSize Error:', err);
    next(err);
  }
};

const controller = {
  addPickupType,
  updatePickupType,
  listPickupType,
  deletePickupType,
};

export default controller;
