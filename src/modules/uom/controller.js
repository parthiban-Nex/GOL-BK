import UomService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const getUomAllList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Uom';
    auditData['access'] = 'Portal';

    const reqBody = req.body;
    const data = await UomService.getAllUomList(reqBody);
    if (data) {
      auditData['message'] = 'Uom data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        UomData: data,
      });
    } else {
      auditData['message'] = 'Uom data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Uom Controller getUomAllList Error:', err);
    next(err);
  }
};

const addUom = async (req, res, next) => {
  try {
    logger.info(
      'Uom Controller addUom requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Uom';
    auditData['access'] = 'Portal';
    const uom = await UomService.addUom(req.body, req.user);
    if (uom) {
      auditData['message'] = 'Uom added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'Uom not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Uom Controller addUom Error:', err);
    next(err);
  }
};

const updateUom = async (req, res, next) => {
  try {
    logger.info(
      'Uom Controller updateUom requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Uom';
    auditData['access'] = 'Portal';
    let { id, uomType, uomDescription, status } = req.body;
    let userId = req.user.id;
    const uomExists = await UomService.getUom(id);
    if (uomExists) {
      let data = await UomService.updateUom(
        id,
        uomType,
        uomDescription,
        status,
        req.user,
        uomExists
      );
      if (data) {
        auditData['message'] = 'Uom updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Uom not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Uom not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Uom Controller updateUom Error:', err);
    next(err);
  }
};

const listUom = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Uom';
    auditData['access'] = 'Portal';
    const data = await UomService.listUom();
    if (data) {
      auditData['message'] = 'Uom data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        UomData: data,
      });
    } else {
      auditData['message'] = 'Uom data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Uom Controller listUom Error:', err);
    next(err);
  }
};

const searchUomData = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Uom';
    auditData['access'] = 'Portal';

    const reqBody = req.body;
    const data = await UomService.searchUomData(reqBody);
    if (data) {
      auditData['message'] = 'Uom data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        UomSearchData: data,
      });
    } else {
      auditData['message'] = 'Uom data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Uom Controller searchUomData Error:', err);
    next(err);
  }
};

const controller = {
  getUomAllList,
  addUom,
  updateUom,
  listUom,
  searchUomData,
};

export default controller;
