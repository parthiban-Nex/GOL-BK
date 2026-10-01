import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InspectionCheckListService from './service.js';

const addInspectionCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InspectionCheckList Controller addInspectionCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionCheckList';
    auditData['action'] = ACTION_ADD;
    let result = await InspectionCheckListService.addInspectionCheckList(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionCheckList added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'InspectionCheckList not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionCheckList Controller addInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const updateInspectionCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InspectionCheckList Controller updateInspectionCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionCheckList';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionCheckListService.updateInspectionCheckList(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionCheckList Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'InspectionCheckList not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionCheckList not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionCheckList Controller updateInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const listInspectionCheckList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionCheckList';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get InspectionCheckList data ';
    const data = await InspectionCheckListService.listInspectionCheckList(
      req.body
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionCheckListData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        inspectionCheckListData: data,
      });
    }
  } catch (err) {
    logger.error(
      'InspectionCheckList Controller listInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const getGroupedInspectionChecklist = async (req, res, next) => {
  try {
    const categories = await InspectionCheckListService.getGroupedInspectionChecklist(
      req.body.checkListTypeCode
    );
    return res.status(200).send({
      requestSuccessful: true,
      inspectionChecklistData: {
        checkListTypeCode: req.body.checkListTypeCode,
        totalCategories: categories.length,
        totalCheckpoints: categories.reduce(
          (total, category) => total + category.checkpoints.length,
          0
        ),
        categories,
      },
    });
  } catch (err) {
    logger.error('InspectionCheckList controller getGroupedInspectionChecklist', err);
    next(err);
  }
};

const deleteInspectionCheckList = async (req, res, next) => {
  try {
    logger.info(
      'InspectionCheckList Controller deleteInspectionCheckList requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InspectionCheckList';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await InspectionCheckListService.deleteInspectionCheckList(
      id,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'InspectionCheckList deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionCheckList deleted successfully',
      });
    } else {
      auditData['message'] = 'InspectionCheckList not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InspectionCheckList not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'InspectionCheckList Controller deleteInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const getAllInspectionCheckList = async (req, res, next) => {
  try {
    const data = await InspectionCheckListService.getAllInspectionCheckList();
    res.status(200).send({
      requestSuccessful: true,
      SubSystemMapdata: data,
    });
  } catch (err) {
    logger.error(
      'InspectionCheckList controller getAllInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addInspectionCheckList,
  updateInspectionCheckList,
  deleteInspectionCheckList,
  listInspectionCheckList,
  getGroupedInspectionChecklist,
  getAllInspectionCheckList,
};

export default controller;
