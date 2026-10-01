import SubAggregateService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addSubAggregate = async (req, res, next) => {
  try {
    logger.info(
      'SubAggregate Controller addSubAggregate requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SubAggregate';
    const subAggregate = await SubAggregateService.addSubAggregate(
      req.body,
      req.user
    );
    if (subAggregate) {
      auditData['message'] = 'SubAggregate added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'SubAggregate not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('SubAggregate Controller addSubAggregate Error:', err);
    next(err);
  }
};

const updateSubAggregate = async (req, res, next) => {
  try {
    logger.info(
      'SubAggregate Controller updateSubAggregate requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SubAggregate';
    let { id, subAggregateName, status, aggregateId } = req.body;
    let userId = req.user.id;

    const subAggregateExists = await SubAggregateService.getSubAggregate(id);

    if (subAggregateExists) {
      let data = await SubAggregateService.updateSubAggregate(
        id,
        subAggregateName,
        status,
        aggregateId,
        req.user,
        subAggregateExists
      );
      if (data) {
        auditData['message'] = 'SubAggregate updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data Updated Successfully',
        });
      } else {
        auditData['message'] = 'SubAggregate not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'SubAggregate not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('SubAggregate Controller updateSubAggregate Error:', err);
    next(err);
  }
};

const getAllsubAggregates = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'SourceType';
    const data = await SubAggregateService.getAllsubAggregates();
    res.status(200).send({
      requestSuccessful: true,
      subAggregateData: data,
    });
  } catch (err) {
    logger.error('SubAggregate Controller getAllsubAggregates Error:', err);
    next(err);
  }
};

const getOnesubAggregate = async (req, res, next) => {
  try {
    const subaggregate = await SubAggregateService.getSubAggregate(
      req.params.id
    );
    res.status(200).send({
      requestSuccessful: true,
      data: subaggregate,
    });
  } catch (err) {
    logger.error('SubAggregate Controller getOnesubAggregate Error:', err);
    next(err);
  }
};

const listSubAggregates = async (req, res, next) => {
  try {
    logger.info('Fetching listSubAggregates');
    const reqBody = req.body;
    const data = await SubAggregateService.listSubAggregates(reqBody);
    res.status(200).send({
      requestSuccessful: true,
      subAggregateData: data,
    });
  } catch (err) {
    logger.error('SubAggregate Controller listSubAggregates Error:', err);
    next(err);
  }
};

const getSubAggregatesByAggregateId = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const data =
      await SubAggregateService.getSubAggregatesByAggregateId(reqBody);
    res.status(200).send({
      requestSuccessful: true,
      subAggregates: data,
    });
  } catch (err) {
    logger.error(
      'SubAggregate Controller getSubAggregatesByAggregateId Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addSubAggregate,
  updateSubAggregate,
  getAllsubAggregates,
  getOnesubAggregate,
  listSubAggregates,
  getSubAggregatesByAggregateId,
};

export default controller;
