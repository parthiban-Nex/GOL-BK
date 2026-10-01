import AggregateService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addAggregate = async (req, res, next) => {
  try {
    logger.info(
      'Aggregate Controller addAggregate requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Aggregate';
    const aggregate = await AggregateService.addAggregate(req.body, req.user);
    if (aggregate) {
      auditData['message'] = 'Aggregate added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'Aggregate not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Aggregate Controller addAggregate Error:', err);
    next(err);
  }
};

const getAllAggregates = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Aggregate';
    const data = await AggregateService.getAllAggregates();
    if (data) {
      auditData['message'] = 'Get Aggregate data ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        aggregateData: data,
      });
    } else {
      auditData['message'] = 'Get Aggregate data';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Aggregate Controller getAllAggregates Error:', err);
    next(err);
  }
};

const getOneAggregate = async (req, res, next) => {
  try {
    const aggregate = await AggregateService.getAggregate(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: aggregate,
    });
  } catch (err) {
    logger.error('Aggregate Controller getOneAggregate Error:', err);
    next(err);
  }
};

const updateAggregate = async (req, res, next) => {
  try {
    logger.info(
      'Aggregate Controller updateAggregate requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Aggregate';
    let { id, aggregateName, status } = req.body;
    let userId = req.user.id;

    const aggregateExists = await AggregateService.getAggregate(id);
    if (aggregateExists) {
      let data = await AggregateService.updateAggregate(
        id,
        aggregateName,
        status,
        req.user,
        aggregateExists
      );
      if (data) {
        auditData['message'] = 'Aggregate updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data Updated Successfully',
        });
      } else {
        auditData['message'] = 'Aggregate not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Aggregate not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Aggregate Controller updateAggregate Error:', err);
    next(err);
  }
};

const deleteAggregate = async (req, res, next) => {
  try {
    const id = req.params.id;

    const aggregateExists = await AggregateService.getAggregate(id);

    if (aggregateExists) {
      let data = await AggregateService.deleteAggregate(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Aggregate Controller deleteAggregate Error:', err);
    next(err);
  }
};

const listAggregates = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Aggregate';
    const reqBody = req.body;
    const data = await AggregateService.listAllAggregates(reqBody);
    if (data) {
      auditData['message'] = 'Get Aggregate data ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        aggregateData: data,
      });
    } else {
      auditData['message'] = 'Get Aggregate data';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Aggregate Controller listAggregates Error:', err);
    next(err);
  }
};

const controller = {
  addAggregate,
  getAllAggregates,
  getOneAggregate,
  updateAggregate,
  deleteAggregate,
  listAggregates,
};

export default controller;
