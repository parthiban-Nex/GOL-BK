import RepairTypesService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addRepairTypes = async (req, res, next) => {
  try {
    logger.info(
      'RepairType Controller addRepairTypes requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    let repairtype = await RepairTypesService.addRepairTypes(req.body, req.user)
      .then(async (repairtype) => {
        await RepairTypesService.addRepairTypeCompanyMap(
          req.body.companyId,
          repairtype.id,
          req.user.id
        );
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'RepairType';
        if (repairtype) {
          auditData['message'] = 'RepairType added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'RepairType not added';
          auditData['result'] = 'failed ';
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data not Saved ',
          });
        }
      })
      .catch((err) => {
        console.log('err----------', err);
        next(err);
      });
  } catch (err) {
    logger.error('Repairtype Controller addRepairTypes Error:', err);
    next(err);
  }
};

const getAllRepairTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'RepairType';
    const data = await RepairTypesService.getAllRepairTypes(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'RepairType fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        repairTypeData: data,
      });
    } else {
      auditData['message'] = 'RepairType not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Repairtype Controller getAllRepairTypes Error:', err);
    next(err);
  }
};

const getOneRepairTypes = async (req, res, next) => {
  try {
    const repairtype = await RepairTypesService.getRepairTypes(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: repairtype,
    });
  } catch (err) {
    logger.error('Repairtype Controller getOneRepairTypes Error:', err);
    next(err);
  }
};

const updateRepairTypes = async (req, res, next) => {
  try {
    logger.info(
      'RepairType Controller updateRepairTypes requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'RepairType';
    let { id, repairTypeName, scheme, status } = req.body;
    let userId = req.user.id;

    const repairTypesExists = await RepairTypesService.getRepairTypes(id);

    if (repairTypesExists) {
      let data = await RepairTypesService.updateRepairTypes(
        id,
        repairTypeName,
        scheme,
        status,
        req.user,
        repairTypesExists
      );
      if (data) {
        auditData['message'] = 'RepairType updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await RepairTypesService.removeRepairTypeCompanyMap(id);
        await RepairTypesService.addRepairTypeCompanyMap(
          req.body.companyId,
          id,
          userId
        );
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'RepairType not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'RepairType not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Repairtype Controller updateRepairTypes Error:', err);
    next(err);
  }
};

const deleteRepairTypes = async (req, res, next) => {
  try {
    const id = req.params.id;

    const repairTypesExists = await RepairTypesService.getRepairTypes(id);

    if (repairTypesExists) {
      let data = await RepairTypesService.deleteRepairTypes(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Repairtype Controller deleteRepairTypes Error:', err);
    next(err);
  }
};

const listRepairTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Repairtype';
    const reqBody = req.body;
    const data = await RepairTypesService.listRepairTypes(reqBody);
    if (data) {
      auditData['message'] = 'Repairtype fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        repairTypeData: data,
      });
    } else {
      auditData['message'] = 'Repairtype not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Repairtype Controller listRepairTypes Error:', err);
    next(err);
  }
};

const controller = {
  addRepairTypes,
  getAllRepairTypes,
  getOneRepairTypes,
  updateRepairTypes,
  deleteRepairTypes,
  listRepairTypes,
};

export default controller;
