import EmployeeService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const addEmployee = async (req, res, next) => {
  try {
    logger.info(
      'Employee Controller addEmployee requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Employee';
    auditData['action'] = ACTION_ADD;
    let result = await EmployeeService.addEmployee(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Employee added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Employee not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Employee controller addEmployee', err);
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    logger.info(
      'Employee Controller updateEmployee requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Employee';
    auditData['action'] = ACTION_UPDATE;

    const id = req.body.id;
    let result = await EmployeeService.updateEmployee(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Employee Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Employee not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Employee not Updated',
      });
    }
  } catch (err) {
    logger.error('Employee controller updateEmployee', err);
    next(err);
  }
};

const getAllEmployee = async (req, res, next) => {
  try {
    const data = await EmployeeService.getAllEmployee();
    res.status(200).send({
      requestSuccessful: true,
      employeeData: data,
    });
  } catch (err) {
    logger.error('Employee controller getAllEmployee', err);
    next(err);
  }
};

const getServiceAdvisors = async (req, res, next) => {
  try {
    const employeeData = await EmployeeService.getServiceAdvisors(req.user);
    return res.status(200).send({
      requestSuccessful: true,
      employeeData,
    });
  } catch (err) {
    logger.error('Employee controller getServiceAdvisors', err);
    next(err);
  }
};

const getOneEmployee = async (req, res, next) => {
  try {
    const data = await EmployeeService.findByemployeeById(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: data,
    });
  } catch (err) {
    logger.error('Employee controller getOneEmployee', err);
    next(err);
  }
};
const listEmployee = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Employee';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Employee data ';
    const data = await EmployeeService.listEmployee(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        employeeData: data,
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
    logger.error('Employee controller listEmployee', err);
    next(err);
  }
};

const getMechanics = async (req, res, next) => {
  try {
    const auditData = {};

    const data = await EmployeeService.getMechanics(req.body);
    res.status(200).send({
      requestSuccessful: true,
      employeeData: data,
    });
  } catch (err) {
    logger.error('Employee controller listEmployee', err);
    next(err);
  }
};

const controller = {
  addEmployee,
  updateEmployee,
  getAllEmployee,
  getServiceAdvisors,
  getOneEmployee,
  listEmployee,
  getMechanics,
};

export default controller;
