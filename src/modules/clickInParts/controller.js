import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import PartsService from './service.js';

const addPart = async (req, res, next) => {
  try {
    logger.info(
      'ClickInParts Controller addPart requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ClickInParts';
    auditData['action'] = ACTION_ADD;
    let result = await PartsService.addPart(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Part added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'Part not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('ClickInParts Controller addPart Error:', err);
    next(err);
  }
};

const updatePart = async (req, res, next) => {
  try {
    logger.info(
      'ClickInParts Controller updatePart requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ClickInParts';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await PartsService.updatePart(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'ClickInPart Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'ClickInPart not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'ClickInPart not Updated',
      });
    }
  } catch (err) {
    logger.error('ClickInParts Controller updatePart Error:', err);
    next(err);
  }
};

const listParts = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ClickInParts';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Parts data ';
    const data = await PartsService.listParts(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        PartsData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        PartsData: data,
      });
    }
  } catch (err) {
    logger.error('ClickInParts Controller listParts Error:', err);
    next(err);
  }
};

const deletePart = async (req, res, next) => {
  try {
    logger.info(
      'ClickInParts Controller deletePart requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'ClickInParts';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await PartsService.deletePart(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'ClickInParts deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'ClickInParts deleted successfully',
      });
    } else {
      auditData['message'] = 'ClickInParts not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'ClickInParts not deleted',
      });
    }
  } catch (err) {
    logger.error('ClickInParts Controller deletePart Error:', err);
    next(err);
  }
};
const controller = {
  addPart,
  updatePart,
  listParts,
  deletePart,
};

export default controller;
