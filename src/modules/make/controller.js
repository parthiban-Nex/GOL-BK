import MakeService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addMake = async (req, res, next) => {
  try {
    logger.info(
      'Make Controller addMake requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Make';
    let make = await MakeService.addMake(req.body, req.user)
      .then(async (make) => {
        await MakeService.addMakeCompanyMap(
          req.body.companyId,
          make.id,
          req.user.id
        );
        if (make) {
          auditData['message'] = 'Make added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'Make not added';
          auditData['result'] = 'failed ';
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data not Saved ',
          });
        }
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    logger.error('Make Controller addMake Error:', err);
    next(err);
  }
};

const updateMake = async (req, res, next) => {
  try {
    logger.info(
      'Make Controller updateMake requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Make';
    let userId = req.user.id;
    let { id, makeName, makeDescription, status } = req.body;

    await MakeService.removeMakeCompanyMap(id);

    let makeExists = await MakeService.findOne(id);
    if (makeExists) {
      let data = await MakeService.updateMake(
        id,
        makeName,
        makeDescription,
        status,
        req.user,
        makeExists
      );
      if (data) {
        auditData['message'] = 'Make updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await MakeService.addMakeCompanyMap(req.body.companyId, id, userId);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Make not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Make not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Make Controller updateMake Error:', err);
    next(err);
  }
};

const getAllMakes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Make';
    const reqBody = req.body;
    const data = await MakeService.getAllMakes(reqBody);
    if (data) {
      auditData['message'] = 'Makes data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        MakeData: data,
      });
    } else {
      auditData['message'] = 'Makes data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Make Controller getAllMakes Error:', err);
    next(err);
  }
};

const getOneMake = async (req, res, next) => {
  try {
    const make = await MakeService.getOneMake(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: make,
    });
  } catch (err) {
    logger.error('Make Controller getOneMake Error:', err);
    next(err);
  }
};

const listMakes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Make';
    const data = await MakeService.listMakes(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'Make data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        MakeData: data,
      });
    } else {
      auditData['message'] = 'Makes data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Make Controller listMakes Error:', err);
    next(err);
  }
};

const updateMakeNew = async (req, res, next) => {
  try {
    logger.info(
      'Make Controller updateMake requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Make';
    let userId = req.user.id;
    let { id, makeName, makeDescription, status, companyId, editCompanyList } = req.body;

    let makeExists = await MakeService.findOne(id);
    if (makeExists) {
      let data = await MakeService.updateMakeNew(
        id,
        makeName,
        makeDescription,
        status,
        req.user,
        makeExists,
        companyId,
        editCompanyList
      );
      if (data) {
        auditData['message'] = 'Make updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Make not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Make not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Make Controller updateMake Error:', err);
    next(err);
  }
};

const controller = {
  addMake,
  updateMake,
  getAllMakes,
  getOneMake,
  listMakes,
  updateMakeNew
};

export default controller;
