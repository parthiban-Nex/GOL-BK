import SubDisPositionService from './service.js';
import commonLogics from '../../shared/commonLogics.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import SubdispositionDao from "./dao.js"
const addSubDisPosition = async (req, res, next) => {
  try {
    logger.info(
      'SubDisPosition Controller addSubDisPosition requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SubDisPosition';
    auditData['action'] = ACTION_ADD;
    const result = await SubDisPositionService.addSubDisPosition(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'SubDisPosition added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Added successfully',
      });
    } else {
      auditData['message'] = 'SubDisPosition not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('SubDisPosition Controller addSubDisPosition Error:', err);
    next(err);
  }
};

const getOneSubDisPosition = async (req, res, next) => {
  try {
    const subDisPosition = await SubDisPositionService.getSubDisPosition(
      req.params.id
    );
    const resObj = {
      body: subDisPosition,
      action: 'SubDisPosition getone',
    };
    commonLogics.createCommonLog(req, resObj);
    res.status(200).send({
      requestSuccessful: true,
      data: subDisPosition,
    });
  } catch (err) {
    logger.error('SubDisPosition Controller getOneSubDisPosition Error:', err);
    next(err);
  }
};

const updateSubDisPosition = async (req, res, next) => {
  try {
    logger.info(
      'SubDisPosition Controller updateSubDisPosition requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SubDisPosition';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await SubDisPositionService.updateSubDisPosition(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'SubDisPosition Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'SubDisPosition not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'SubDisPosition not Updated',
      });
    }
  } catch (err) {
    logger.error('SubDisPosition Controller updateSubDisPosition Error:', err);
    next(err);
  }
};

const deleteSubDisPosition = async (req, res, next) => {
  try {
    const id = req.params.id;

    const subDisPositionExists =
      await SubDisPositionService.getSubDisPosition(id);

    if (subDisPositionExists) {
      let data = await SubDisPositionService.deleteSubDisPosition(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('SubDisPosition Controller deleteSubDisPosition Error:', err);
    next(err);
  }
};

const listSubDisPositions = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SubDisPosition';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get SubDisPosition data ';
    const data = await SubDisPositionService.listSubDisPositions(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        SubDisPositionsData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('SubDisPosition Controller listSubDisPositions Error:', err);
    next(err);
  }
};

const getCustomerSubDisPosition = async (req, res, next) => {
  try {
    const subDisPosition = await SubdispositionDao.getCustomerSubDisPosition(
      req.body.id
    );
    res.status(200).send({
      requestSuccessful: true,
      data: subDisPosition,
    });
  } catch (err) {
    logger.error('SubDisPosition Controller getOneSubDisPosition Error:', err);
    next(err);
  }
};

const controller = {
  addSubDisPosition,
  getOneSubDisPosition,
  updateSubDisPosition,
  deleteSubDisPosition,
  listSubDisPositions,
  getCustomerSubDisPosition
};

export default controller;
