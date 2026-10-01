import EmployeeService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const addEmployeeRole = async (req, res, next) => {
  try {
    logger.info(
      'EmployeeRole Controller addEmployeeRole requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'EmployeeRole';
    auditData['action'] = ACTION_ADD;
    const result = await EmployeeService.addEmployeeRole(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'EmployeeRole added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'EmployeeRole not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('EmployeeRole controller addEmployeeRole Error:', err);
    next(err);
  }
};

const updateEmployeeRole = async (req, res, next) => {
  try {
    logger.info(
      'EmployeeRole Controller updateEmployeeRole requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'EmployeeRole';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await EmployeeService.updateEmployeeRole(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'EmployeeRole Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'EmployeeRole not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'EmployeeRole not Updated',
      });
    }
  } catch (err) {
    logger.error('EmployeeRole controller updateEmployeeRole Error:', err);
    next(err);
  }
};

const getAllEmployeeRoles = async (req, res, next) => {
  try {
    const data = await EmployeeService.getAllEmployeeRole();
    res.status(200).send({
      requestSuccessful: true,
      employeeRoleData: data,
    });
  } catch (err) {
    logger.error('EmployeeRole controller getAllEmployeeRoles Error:', err);
    next(err);
  }
};

const getOneEmployeeRole = async (req, res, next) => {
  try {
    const data = await EmployeeService.findByemployeeRoleById(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: data,
    });
  } catch (err) {
    logger.error('EmployeeRole controller getOneEmployeeRole Error:', err);
    next(err);
  }
};

const listEmployeeRoles = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'EmployeeRole';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get EmployeeRole data ';
    const data = await EmployeeService.listEmployeeRoles(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        employeeRoleData: data,
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
    logger.error('EmployeeRole controller listEmployeeRoles Error:', err);
    next(err);
  }
};

const controller = {
  addEmployeeRole,
  updateEmployeeRole,
  getAllEmployeeRoles,
  getOneEmployeeRole,
  listEmployeeRoles,
};

export default controller;
