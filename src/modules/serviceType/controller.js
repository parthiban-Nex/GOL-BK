import db from '../index.js';
import ServiceTypesService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const ServiceType = db.servicetypes;

const addServiceType = async (req, res, next) => {
  try {
    logger.info(
      'ServiceType Controller addServiceType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    let servicetypes = await ServiceTypesService.addServiceType(
      req.body,
      req.user
    )
      .then(async (servicetypes) => {
        await ServiceTypesService.addServiceTypeCompanyMap(
          req.body.companyId,
          servicetypes.id,
          req.user.id
        );
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'ServiceType';
        if (servicetypes) {
          auditData['message'] = 'ServiceType added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'ServiceType not added';
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
    logger.error('ServiceType controller addServiceType Error:', err);
    next(err);
  }
};

const getAllServiceType = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'ServiceType';
    const data = await ServiceTypesService.getAllServiceType(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'ServiceTypes fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        serviceTypeData: data,
      });
    } else {
      auditData['message'] = 'ServiceTypes not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('ServiceType controller getAllServiceType Error:', err);
    next(err);
  }
};

const getOneServiceType = async (req, res, next) => {
  try {
    const servicetype = await ServiceTypesService.getServiceType(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: servicetype,
    });
  } catch (err) {
    logger.error('ServiceType controller getOneServiceType Error:', err);
    next(err);
  }
};

const updateServiceType = async (req, res, next) => {
  try {
    logger.info(
      'ServiceType Controller updateServiceType requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'ServiceType';
    let { id, serviceTypeName, status } = req.body;
    let userId = req.user.id;

    const serviceTypesExists = await ServiceTypesService.getServiceType(id);

    if (serviceTypesExists) {
      let data = await ServiceTypesService.updateServiceType(
        id,
        serviceTypeName,
        status,
        req.user,
        serviceTypesExists
      );
      if (data) {
        auditData['message'] = 'ServiceType updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await ServiceTypesService.removeServiceTypeCompanyMap(id);
        await ServiceTypesService.addServiceTypeCompanyMap(
          req.body.companyId,
          id,
          userId
        );
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'ServiceType not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'ServiceType not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('ServiceType controller updateServiceType Error:', err);
    next(err);
  }
};

const deleteServiceType = async (req, res, next) => {
  try {
    const id = req.params.id;

    const serviceTypesExists = await ServiceTypesService.getServiceType(id);

    if (serviceTypesExists) {
      let data = await ServiceTypesService.deleteServiceType(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('ServiceType controller deleteServiceType Error:', err);
    next(err);
  }
};

const listServiceTypes = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'ServiceType';
    const reqBody = req.body;
    const data = await ServiceTypesService.listServiceTypes(reqBody);
    if (data) {
      auditData['message'] = 'ServiceTypes fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        serviceTypeData: data,
      });
    } else {
      auditData['message'] = 'ServiceTypes not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('ServiceType controller listServiceTypes Error:', err);
    next(err);
  }
};
const controller = {
  addServiceType,
  getAllServiceType,
  getOneServiceType,
  updateServiceType,
  deleteServiceType,
  listServiceTypes,
};

export default controller;
