import db from '../index.js';
import SourceService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addSource = async (req, res, next) => {
  try {
    logger.info(
      'Source Controller addSource requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Source';
    let sources = await SourceService.addSource(req.body, req.user)
      .then(async (sources) => {
        await SourceService.addSourceCompanyMap(
          req.body.companyId,
          sources.id,
          req.user.id
        );
        if (sources) {
          auditData['message'] = 'Source added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'Source not added';
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
    logger.error('Source Controller addSource Error:', err);
    next(err);
  }
};

const getAllSource = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Source';
    const data = await SourceService.getAllSource(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'Source fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        sourceData: data,
      });
    } else {
      auditData['message'] = 'Source not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Source Controller getAllSource Error:', err);
    next(err);
  }
};

const getOneSource = async (req, res, next) => {
  try {
    const source = await SourceService.getSource(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: source,
    });
  } catch (err) {
    logger.error('Source Controller getOneSource Error:', err);
    next(err);
  }
};

const updateSource = async (req, res, next) => {
  try {
    logger.info(
      'Source Controller updateSource requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Source';
    let { id, sourceName, status,bridgeStatus } = req.body;
    let userId = req.user.id;

    const sourceExists = await SourceService.getSource(id);

    if (sourceExists) {
      let data = await SourceService.updateSource(
        id,
        sourceName,
        status,
        bridgeStatus,
        req.user,
        sourceExists
      );
      if (data) {
        auditData['message'] = 'Source updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await SourceService.removeSourceCompanyMap(id);
        await SourceService.addSourceCompanyMap(req.body.companyId, id, userId);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Source not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Source not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Source Controller updateSource Error:', err);
    next(err);
  }
};

const deleteSource = async (req, res, next) => {
  try {
    const id = req.params.id;

    const source = await SourceService.getSource(id);

    if (source) {
      let data = await SourceService.deleteSource(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Source Controller deleteSource Error:', err);
    next(err);
  }
};

const listSources = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Source';
    const reqBody = req.body;
    const data = await SourceService.listSources(reqBody);
    if (data) {
      auditData['message'] = 'Source fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        sourceData: data,
      });
    } else {
      auditData['message'] = 'Source not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Source Controller listSources Error:', err);
    next(err);
  }
};

const controller = {
  addSource,
  getAllSource,
  getOneSource,
  updateSource,
  deleteSource,
  listSources,
};

export default controller;
