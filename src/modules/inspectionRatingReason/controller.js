import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InspectionRatingReasonService from './service.js';

const addInspectionRatingReason = async (req, res, next) => {
  try {
    logger.info(
      'InspectionRatingReason Controller addInspectionRatingReason requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionRatingReason';
    auditData['action'] = ACTION_ADD;
    let result = await InspectionRatingReasonService.addInspectionRatingReason(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionRatingReason added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'InspectionRatingReason not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionRatingReason Controller addInspectionRatingReason Error:',
      err
    );
    next(err);
  }
};

const updateInspectionRatingReason = async (req, res, next) => {
  try {
    logger.info(
      'InspectionRatingReason Controller updateInspectionRatingReason requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionRatingReason';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await InspectionRatingReasonService.updateInspectionRatingReason(
        id,
        req.body,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'InspectionRatingReason Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'InspectionRatingReason not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionRatingReason not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionRatingReason Controller updateInspectionRatingReason Error:',
      err
    );
    next(err);
  }
};

const listInspectionRatingReasons = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionRatingReason';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Inspection Rating Reason data ';
    const data =
      await InspectionRatingReasonService.listInspectionRatingReasons(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionRatingReasonData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionRatingReasonData: data,
      });
    }
  } catch (err) {
    logger.error(
      'InspectionRatingReason Controller listInspectionRatingReasons Error:',
      err
    );
    next(err);
  }
};

const deleteInspectionRatingReason = async (req, res, next) => {
  try {
    logger.info(
      'InspectionRatingReason Controller deleteInspectionRatingReason requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionRatingReason';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await InspectionRatingReasonService.deleteInspectionRatingReason(
        id,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'Inspection Rating Reason deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Inspection Rating Reason deleted successfully',
      });
    } else {
      auditData['message'] = 'Inspection Rating Reason not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Inspection Rating Reason not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'Inspection Rating Reason Controller deleteInspectionRatingReason Error:',
      err
    );
    next(err);
  }
};

const getAllInspectionRatingReasons = async (req, res, next) => {
  try {
    const data =
      await InspectionRatingReasonService.getAllInspectionRatingReasons();
    res.status(200).send({
      requestSuccessful: true,
      SubSystemMapdata: data,
    });
  } catch (err) {
    logger.error(
      'Inspection Rating Reason controller getAllInspectionRatingReasons Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addInspectionRatingReason,
  updateInspectionRatingReason,
  listInspectionRatingReasons,
  deleteInspectionRatingReason,
  getAllInspectionRatingReasons,
};

export default controller;
