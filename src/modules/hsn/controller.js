import HsnService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addHsn = async (req, res, next) => {
  try {
    logger.info(
      'Hsn Controller addHsn requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Hsn';
    auditData['access'] = 'Portal';
    const hsn = await HsnService.addHsn(req.body, req.user);
    if (hsn) {
      auditData['message'] = 'Hsn added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Hsn not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Hsn Controller addHsn Error:', err);
    next(err);
  }
};

const getAllHsn = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Hsn';
    auditData['access'] = 'Portal';
    const data = await HsnService.getAllHsn();
    if (data) {
      auditData['message'] = 'Get Hsn data';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        hsnData: data,
      });
    } else {
      auditData['message'] = 'Get Hsn data';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Hsn Controller getAllHsn Error:', err);
    next(err);
  }
};

const getOneHsn = async (req, res, next) => {
  try {
    const hsn = await HsnService.getHsn(req.body.id);
    res.status(200).send({
      requestSuccessful: true,
      data: hsn,
    });
  } catch (err) {
    logger.error('Hsn Controller getOneHsn Error:', err);
    next(err);
  }
};

const updateHsn = async (req, res, next) => {
  try {
    logger.info(
      'Hsn Controller updateHsn requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Hsn';
    auditData['access'] = 'Portal';
    let { id, hsnCode, tax, status } = req.body;
    let userId = req.user.id;
    const hsnExists = await HsnService.getHsn(id);
    if (hsnExists) {
      let data = await HsnService.updateHsn(
        id,
        hsnCode,
        tax,
        status,
        req.user,
        hsnExists
      );
      if (data) {
        auditData['message'] = 'Hsn updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Hsn not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Hsn not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Hsn Controller updateHsn Error:', err);
    next(err);
  }
};

const deleteHsn = async (req, res, next) => {
  try {
    const id = req.params.id;

    const hsn = await HsnService.getHsn(id);

    if (hsn) {
      let data = await HsnService.deleteHsn(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Hsn Controller deleteHsn Error:', err);
    next(err);
  }
};

const listHsn = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Hsn';
    auditData['access'] = 'Portal';
    const reqBody = req.body;
    const data = await HsnService.listHsn(reqBody);
    if (data) {
      auditData['message'] = 'Get Hsn data';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        hsnData: data,
      });
    } else {
      auditData['message'] = 'Get Hsn data';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Hsn Controller listHsn Error:', err);
    next(err);
  }
};

const controller = {
  addHsn,
  getAllHsn,
  getOneHsn,
  updateHsn,
  deleteHsn,
  listHsn,
};

export default controller;
