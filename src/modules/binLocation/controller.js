import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import BinLocationService from './service.js';

const addBinLocation = async (req, res, next) => {
  try {
    logger.info(
      'BinLocation Controller addBinLocation requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'BinLocation';
    auditData['action'] = ACTION_ADD;
    let result = await BinLocationService.addBinLocation(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'BinLocation added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'BinLocation not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('BinLocation Controller addBinLocation Error:', err);
    next(err);
  }
};

const updateBinLocation = async (req, res, next) => {
  try {
    logger.info(
      'BinLocation Controller updateBinLocation requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'BinLocation';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await BinLocationService.updateBinLocation(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'BinLocation Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'BinLocation not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'BinLocation not Updated',
      });
    }
  } catch (err) {
    logger.error('BinLocation Controller updateBinLocation Error:', err);
    next(err);
  }
};

const listBinLocations = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'BinLocation';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get BinLocation data ';
    const data = await BinLocationService.listBinLocations(req.body,req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        BinLocationsData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        BinLocationsData: data,
      });
    }
  } catch (err) {
    logger.error('BinLocation Controller listBinLocations Error:', err);
    next(err);
  }
};

const listBinLocationsForOutlet = async (req, res, next) => {
  try {
    // const auditData = {};
    // auditData['menu_name'] = 'Master';
    // auditData['submenu_name'] = 'BinLocation';
    // auditData['action'] = ACTION_GET;
    // auditData['access'] = 'Portal';
    // auditData['message'] = 'Get BinLocation data ';
    const data = await BinLocationService.listBinLocationsForOutlet(req.body,req.user);
      // auditData['result'] = 'success ';
      // auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        data,
      });
    
    
  } catch (err) {
    logger.error('BinLocation Controller listBinLocations Error:', err);
    next(err);
  }
};
const controller = {
  addBinLocation,
  updateBinLocation,
  listBinLocations,
  listBinLocationsForOutlet
};

export default controller;
