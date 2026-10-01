import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InventoryCheckListService from './service.js';

const addInventoryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InventoryCheckList addInventoryCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryCheckList';
    auditData['action'] = ACTION_ADD;
    let result = await InventoryCheckListService.addInventoryCheckList(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InventoryCheckList added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'InventoryCheckList  not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'InventoryCheckList Controller addInventoryCheckList Error:',
      err
    );
    next(err);
  }
};

const updateInventoryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InventoryCheckList Controller updateInventoryCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryCheckList';
    auditData['action'] = ACTION_UPDATE;
    let result = await InventoryCheckListService.updateInventoryCheckList(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InventoryCheckList Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'InventoryCheckList not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryCheckList not Updated',
      });
    }
  } catch (err) {
    logger.error('InventoryCheckList Controller updateTyreSize Error:', err);
  }
};

const listInventoryCheckList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryCheckList';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get InventoryCheckList data ';
    const data = await InventoryCheckListService.listInventoryCheckList(
      req.body
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InventoryCheckListData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InventoryCheckListData: data,
      });
    }
  } catch (err) {
    logger.error(
      'InventoryCheckList Controller listInventoryCheckList Error:',
      err
    );
  }
};

const deleteInventoryCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InventoryCheckList Controller deleteDockFields requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryCheckList';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InventoryCheckListService.deleteInventoryCheckList(
      id,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InventoryCheckList deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryCheckList deleted successfully',
      });
    } else {
      auditData['message'] = 'InventoryCheckList not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryCheckList not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'InventoryCheckList Controller deleteVehicleInventory Error:',
      err
    );
    next(err);
  }
};

const listVehicleTypes = async (req, res, next) => {
  try {
    const data = await InventoryCheckListService.listVehicleTypes(req.body);
    res.status(200).send({
      requestSuccessful: true,
      VehicleTypeData: data,
    });
  } catch (err) {
    logger.error('InventoryCheckList Controller listVehicleTypes Error:', err);
  }
};

const controller = {
  addInventoryCheckList,
  updateInventoryCheckList,
  listInventoryCheckList,
  deleteInventoryCheckList,
  listVehicleTypes,
};

export default controller;
