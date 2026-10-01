import TechnicianService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const addTechnician = async (req, res, next) => {
  try {
    logger.info('Technician Controller addTechnician requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Technician';

    const data = await TechnicianService.addTechnician(req.body, req.user);
    if (data) {
      auditData['message'] = 'Technician added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    }
    auditData['message'] = 'Technician not added';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Data not Saved ',
    });
  } catch (err) {
    logger.error('Technician Controller addTechnician Error:', err);
    next(err);
  }
};

const updateTechnician = async (req, res, next) => {
  try {
    logger.info('Technician Controller updateTechnician requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Technician';

    const { id } = req.body;
    const existing = await TechnicianService.findById(id);
    if (!existing) {
      return res.status(200).send({
        requestSuccessful: false,
        message: 'Technician not found',
      });
    }

    const data = await TechnicianService.updateTechnician(id, req.body, req.user, existing);
    if (data) {
      auditData['message'] = 'Technician updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    }
    auditData['message'] = 'Technician not Updated';
    auditData['result'] = 'failed ';
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Technician not Updated',
    });
  } catch (err) {
    logger.error('Technician Controller updateTechnician Error:', err);
    next(err);
  }
};

const getAllTechnicians = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Technician';

    const data = await TechnicianService.getAllTechnicians(req.body, req.user);
    if (data) {
      auditData['message'] = 'Technicians data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        TechnicianData: data,
      });
    }
    auditData['message'] = 'Technicians data not fetched';
    auditData['result'] = 'fail ';
    auditData['action'] = ACTION_GET;
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: false,
      message: 'No data',
    });
  } catch (err) {
    logger.error('Technician Controller getAllTechnicians Error:', err);
    next(err);
  }
};

const getOneTechnician = async (req, res, next) => {
  try {
    const tech = await TechnicianService.getOneTechnician(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: tech,
    });
  } catch (err) {
    logger.error('Technician Controller getOneTechnician Error:', err);
    next(err);
  }
};

const controller = {
  addTechnician,
  updateTechnician,
  getAllTechnicians,
  getOneTechnician,
};

export default controller;
