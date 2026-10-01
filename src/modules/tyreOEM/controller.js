import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import TyreOemService from './service.js';

const addTyreOem = async (req, res, next) => {
  try {
    logger.info(
      'TyreOem Controller addTyreOem requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreOem';
    auditData['action'] = ACTION_ADD;
    let result = await TyreOemService.addTyreOem(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreOem added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'TyreOem not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('TyreOem Controller addTyreOem Error:', err);
    next(err);
  }
};

const updateTyreOem = async (req, res, next) => {
  try {
    logger.info(
      'TyreOem Controller updateTyreOem requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreOem';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await TyreOemService.updateTyreOem(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreOem Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'TyreOem not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'TyreOem not Updated',
      });
    }
  } catch (err) {
    logger.error('TyreOem Controller updateTyreOem Error:', err);
    next(err);
  }
};

const listTyreOems = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreOem';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get TyreOem data ';
    const data = await TyreOemService.listTyreOems(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        TyreOemData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        TyreOemData: data,
      });
    }
  } catch (err) {
    logger.error('TyreOem Controller listTyreOems Error:', err);
    next(err);
  }
};

const deleteTyreOem = async (req, res, next) => {
  try {
    logger.info(
      'TyreOem Controller deleteTyreOem requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'TyreOem';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await TyreOemService.deleteTyreOem(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'TyreOem deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'TyreOem deleted successfully',
      });
    } else {
      auditData['message'] = 'TyreOem not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'TyreOem not deleted',
      });
    }
  } catch (err) {
    logger.error('TyreOem Controller deleteTyreOem Error:', err);
    next(err);
  }
};
const controller = {
  addTyreOem,
  updateTyreOem,
  listTyreOems,
  deleteTyreOem,
};

export default controller;
