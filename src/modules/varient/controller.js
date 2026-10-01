import varientService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addVarient = async (req, res, next) => {
  try {
    logger.info(
      'Varient Controller addVarient requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Varient';
    const varient = await varientService.addVarient(req.body, req.user);
    if (varient) {
      auditData['message'] = 'Varient added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Varient not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Varient Controller addVarient Error:', err);
    next(err);
  }
};

const getAllVarient = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Varient';
    const data = await varientService.getAllVarient();
    if (data) {
      auditData['message'] = 'Varients data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        varientData: data,
      });
    } else {
      auditData['message'] = 'Varients data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Varient Controller getAllVarient Error:', err);
    next(err);
  }
};

const getOneVarient = async (req, res, next) => {
  try {
    const varient = await varientService.getOneVarient(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: varient,
    });
  } catch (err) {
    logger.error('Varient Controller getOneVarient Error:', err);
    next(err);
  }
};

const updateVarient = async (req, res, next) => {
  try {
    logger.info(
      'Varient Controller updateVarient requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Varient';
    const id = req.body.id;
    let userId = req.user.id;
    const varientExists = await varientService.getOneVarient(id);
    if (varientExists) {
      let data = await varientService.updateVarient(
        id,
        req.body,
        req.user,
        varientExists
      );
      if (data) {
        auditData['message'] = 'Varient updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Varient not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Varient not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Varient Controller updateVarient Error:', err);
    next(err);
  }
};

const deleteVarient = async (req, res, next) => {
  try {
    const id = req.params.id;

    const varient = await varientService.getOneVarient(id);

    if (varient) {
      let data = await varientService.deleteVarient(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Varient Controller updateVarient Error:', err);
    next(err);
  }
};

const listVarients = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Varient';
    const reqBody = req.body;
    const data = await varientService.listVarients(reqBody);
    if (data) {
      auditData['message'] = 'Varient data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        varientData: data,
      });
    } else {
      auditData['message'] = 'Varient data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Varient Controller listVarients Error:', err);
    next(err);
  }
};

const getAllFuelType = async (req, res, next) => {
  try {
    const data = await varientService.getAllFuelType();
    res.status(200).send({
      requestSuccessful: true,
      fuelTypeData: data,
    });
  } catch (err) {
    logger.error('Varient Controller getAllFuelType Error:', err);
    next(err);
  }
};

const controller = {
  addVarient,
  getAllVarient,
  getOneVarient,
  updateVarient,
  deleteVarient,
  listVarients,
  getAllFuelType,
};

export default controller;
