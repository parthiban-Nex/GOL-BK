import SourceTypeService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addSourceType = async (req, res, next) => {
  try {
    logger.info(
      'SourceType Controller addSourceType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SourceType';
    let sourcetypes = await SourceTypeService.addSourceType(req.body, req.user)
      .then(async (sourcetypes) => {
        await SourceTypeService.addSourceTypeCompanyMap(
          req.body.companyId,
          sourcetypes.id,
          req.user.id
        );
        if (sourcetypes) {
          auditData['message'] = 'SourceType added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'SourceType not added';
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
    logger.error('SourceType Controller addSourceType Error:', err);
    next(err);
  }
};

const getAllSourceType = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SourceType';
    const data = await SourceTypeService.getAllSourceType(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'SourceTypes data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        sourceTypeData: data,
      });
    } else {
      auditData['message'] = 'SourceTypes data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('SourceType Controller getAllSourceType Error:', err);
    next(err);
  }
};

const getOneSourceType = async (req, res, next) => {
  try {
    const sourcetype = await SourceTypeService.getSourceType(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: sourcetype,
    });
  } catch (err) {
    logger.error('SourceType Controller getOneSourceType Error:', err);
    next(err);
  }
};

const updateSourceType = async (req, res, next) => {
  try {
    logger.info(
      'SourceType Controller updateSourceType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SourceType';
    let { id, sourceTypeName, sourceId, status } = req.body;
    let userId = req.user.id;

    const sourcetypeExists = await SourceTypeService.getSourceType(id);

    if (sourcetypeExists) {
      let data = await SourceTypeService.updateSourceType(
        id,
        sourceTypeName,
        sourceId,
        status,
        req.user,
        sourcetypeExists
      );
      if (data) {
        auditData['message'] = 'SourceType updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await SourceTypeService.removeSourceTypeCompanyMap(id);
        await SourceTypeService.addSourceTypeCompanyMap(
          req.body.companyId,
          id,
          userId
        );
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'SourceType not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'SourceType not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('SourceType Controller updateSourceType Error:', err);
    next(err);
  }
};

const deleteSourceType = async (req, res, next) => {
  try {
    const id = req.params.id;

    const sourcetype = await SourceTypeService.getSourceType(id);

    if (sourcetype) {
      let data = await SourceTypeService.deleteSourceType(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('SourceType Controller deleteSourceType Error:', err);
    next(err);
  }
};

const listSourceTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SourceType';
    const reqBody = req.body;
    const data = await SourceTypeService.listSourceTypes(reqBody);
    if (data) {
      auditData['message'] = 'SourceTypes data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        sourceTypeData: data,
      });
    } else {
      auditData['message'] = 'SourceTypes data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('SourceType Controller listSourceTypes Error:', err);
    next(err);
  }
};

const getSourceTypesBySource = async (req, res, next) => {
  try {
    const data = await SourceTypeService.getSourceTypesBySource(
      req.body.sourceId
    );
    res.status(200).send({
      requestSuccessful: true,
      sourceTypes: data,
    });
  } catch (err) {
    logger.error('SourceType Controller getSourceTypesBySource Error:', err);
    next(err);
  }
};

const controller = {
  addSourceType,
  getAllSourceType,
  getOneSourceType,
  updateSourceType,
  deleteSourceType,
  listSourceTypes,
  getSourceTypesBySource,
};

export default controller;
