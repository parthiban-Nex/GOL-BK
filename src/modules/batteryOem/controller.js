import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import BatteryOemService from './service.js';

const addBatteryOem = async (req, res, next) => {
  try {
    logger.info(
      'BatteryOem Controller addBatteryOem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'BatteryOem';
    auditData['action'] = ACTION_ADD;
    let result = await BatteryOemService.addBatteryOem(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'BatteryOem added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'BatteryOem not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('BatteryOem Controller addBatteryOem Error:', err);
    next(err);
  }
};

const updateBatteryOem = async (req, res, next) => {
  try {
    logger.info(
      'BatteryOem Controller updateBatteryOem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'BatteryOem';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await BatteryOemService.updateBatteryOem(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'BatteryOem Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'BatteryOem not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'BatteryOem not Updated',
      });
    }
  } catch (err) {
    logger.error('BatteryOem Controller updateBatteryOem Error:', err);
    next(err);
  }
};

const listBatteryOems = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'BatteryOem';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get BatteryOem data ';
    const data = await BatteryOemService.listBatteryOems(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        BatteryOemData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        BatteryOemData: data,
      });
    }
  } catch (err) {
    logger.error('BatteryOem Controller listBatteryOems Error:', err);
    next(err);
  }
};

const deleteBatteryOem = async (req, res, next) => {
  try {
    logger.info(
      'BatteryOem Controller deleteBatteryOem requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'BatteryOem';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await BatteryOemService.deleteBatteryOem(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'BatteryOem deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'BatteryOem deleted successfully',
      });
    } else {
      auditData['message'] = 'BatteryOem not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'BatteryOem not deleted',
      });
    }
  } catch (err) {
    logger.error('BatteryOem Controller deleteBatteryOem Error:', err);
    next(err);
  }
};
const controller = {
  addBatteryOem,
  updateBatteryOem,
  listBatteryOems,
  deleteBatteryOem,
};

export default controller;
