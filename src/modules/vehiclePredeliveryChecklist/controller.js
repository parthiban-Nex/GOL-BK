import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import PredeliveryCheckListService from './service.js';

const addVehiclePredeliveryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'PredeliveryCheckList Controller addVehiclePredeliveryCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PredeliveryCheckList';
    auditData['action'] = ACTION_ADD;
    let result =
      await PredeliveryCheckListService.addVehiclePredeliveryCheckList(
        req.body,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'PredeliveryCheck added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'PredeliveryCheck not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'PredeliveryCheckList Controller addVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
};

const updateVehiclePredeliveryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'PredeliveryCheckList Controller updateVehiclePredeliveryCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PredeliveryCheckList';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await PredeliveryCheckListService.updateVehiclePredeliveryCheckList(
        id,
        req.body,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'PredeliveryCheck Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'PredeliveryCheck not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'PredeliveryCheck not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'TyreOem Controller updateVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
};

const listVehiclePredeliveryCheckLists = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PredeliveryCheckList';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get PredeliveryCheckList data ';
    const data =
      await PredeliveryCheckListService.listVehiclePredeliveryCheckLists(
        req.body
      );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        PreDelvierCheckListData: data,
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
    logger.error(
      'PredeliveryCheckList Controller listVehiclePredeliveryCheckLists Error:',
      err
    );
    next(err);
  }
};

const deleteVehiclePredeliveryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'PredeliveryCheckList Controller deleteVehiclePredeliveryCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'PredeliveryCheckList';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await PredeliveryCheckListService.deleteVehiclePredeliveryCheckList(
        id,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'PredeliveryCheck deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'PredeliveryCheck deleted successfully',
      });
    } else {
      auditData['message'] = 'PredeliveryCheck not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'PredeliveryCheckList not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'PredeliveryCheckList Controller deleteVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
};
const controller = {
  addVehiclePredeliveryCheckList,
  updateVehiclePredeliveryCheckList,
  listVehiclePredeliveryCheckLists,
  deleteVehiclePredeliveryCheckList,
};

export default controller;
