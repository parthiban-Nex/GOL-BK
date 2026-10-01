import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import TyreSizeService from './service.js';

const addTyreSize = async (req, res, next) => {
  try {
    logger.info(
      'TyreSize Controller addTyreSize requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreSize';
    auditData['action'] = ACTION_ADD;
    let result = await TyreSizeService.addTyreSize(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreSize added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'TyreSize not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller addTyreSize Error:', err);
    next(err);
  }
};

const updateTyreSize = async (req, res, next) => {
  try {
    logger.info(
      'TyreSize Controller updateTyreSize requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreSize';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await TyreSizeService.updateTyreSize(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreSize Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'TyreSize not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'TyreSize not Updated',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller updateTyreSize Error:', err);
    next(err);
  }
};

const listTyreSizes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreSize';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get TyreSize data ';
    const data = await TyreSizeService.listTyreSizes(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        TyreSizeData: data,
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
    logger.error('TyreSize Controller listTyreSizes Error:', err);
    next(err);
  }
};

const deleteTyreSize = async (req, res, next) => {
  try {
    logger.info(
      'TyreSize Controller deleteTyreSize requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreSize';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await TyreSizeService.deleteTyreSize(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreSize deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'TyreSize deleted successfully',
      });
    } else {
      auditData['message'] = 'TyreSize not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'TyreSize not deleted',
      });
    }
  } catch (err) {
    logger.error('TyreSize Controller deleteTyreSize Error:', err);
    next(err);
  }
};

const controller = {
  addTyreSize,
  updateTyreSize,
  listTyreSizes,
  deleteTyreSize,
};

export default controller;
