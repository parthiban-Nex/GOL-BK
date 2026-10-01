import TechnicianDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addTechnician = async (tech, user) => {
  let data = {};
  try {
    data = await TechnicianDao.addTechnician(tech, user.id);
    if (data) {
      await TechnicianDao.addOutletMap(data.id, tech.outletId);

      const recentActivityData = {
        activity_type: 'Create',
        menu_name: 'Technician',
        createdBy: user.id,
        username: user.employeeCode,
        message: tech.employeeName + ' Technician is created ',
      };
      await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Technician service addTechnician Error:', err);
    throw err;
  }
  return data;
};

const updateTechnician = async (id, tech, user, existing) => {
  let message = '';
  let data = {};
  try {
    if (existing.employeeName != tech.employeeName) {
      message += ' employeeName changed from ' + existing.employeeName + ' to ' + tech.employeeName + ' ,';
    }
    if (existing.employeeCode != tech.employeeCode) {
      message += ' employeeCode changed from ' + existing.employeeCode + ' to ' + tech.employeeCode + ' ,';
    }
    if (existing.mobileNumber != tech.mobileNumber) {
      message += ' mobileNumber changed from ' + existing.mobileNumber + ' to ' + tech.mobileNumber + ' ,';
    }
    if (existing.email != tech.email) {
      message += ' email changed from ' + existing.email + ' to ' + tech.email + ' ,';
    }
    if (existing.status != tech.status) {
      message += ' status changed from ' + existing.status + ' to ' + tech.status + ' ,';
    }
    if (existing.outletId != tech.outletId) {
      message += ' outletId changed from ' + existing.outletId + ' to ' + tech.outletId + ' ,';
    }
    message = message.slice(0, -1);

    data = await TechnicianDao.updateTechnician(id, tech, user.id);

    if (existing.outletId != tech.outletId) {
      await TechnicianDao.replaceOutletMap(id, tech.outletId);
    }

    if (message && data) {
      const recentActivityData = {
        activity_type: 'Update',
        menu_name: 'Technician',
        createdBy: user.id,
        username: user.employeeCode,
        message: message,
      };
      await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Technician service updateTechnician Error:', err);
    throw err;
  }
  return data;
};

const findById = async (id) => {
  try {
    return await TechnicianDao.findById(id);
  } catch (err) {
    logger.error('Technician service findById Error:', err);
    throw err;
  }
};

const findByEmployeeCode = async (employeeCode) => {
  try {
    return await TechnicianDao.findByEmployeeCode(employeeCode);
  } catch (err) {
    logger.error('Technician service findByEmployeeCode Error:', err);
    throw err;
  }
};

const findByEmployeeCodeAndOutlet = async (employeeCode, outletId) => {
  try {
    return await TechnicianDao.findByEmployeeCodeAndOutlet(employeeCode, outletId);
  } catch (err) {
    logger.error('Technician service findByEmployeeCodeAndOutlet Error:', err);
    throw err;
  }
};

const findByEmployeeCodeNotId = async (employeeCode, id) => {
  try {
    return await TechnicianDao.findByEmployeeCodeNotId(employeeCode, id);
  } catch (err) {
    logger.error('Technician service findByEmployeeCodeNotId Error:', err);
    throw err;
  }
};

const findByEmployeeCodeAndOutletNotId = async (employeeCode, outletId, id) => {
  try {
    return await TechnicianDao.findByEmployeeCodeAndOutletNotId(employeeCode, outletId, id);
  } catch (err) {
    logger.error('Technician service findByEmployeeCodeAndOutletNotId Error:', err);
    throw err;
  }
};

const findByMobileNumber = async (mobileNumber, roleId) => {
  try {
    return await TechnicianDao.findByMobileNumber(mobileNumber, roleId);
  } catch (err) {
    logger.error('Technician service findByMobileNumber Error:', err);
    throw err;
  }
};

const findByMobileNumberNotId = async (mobileNumber, id, roleId) => {
  try {
    return await TechnicianDao.findByMobileNumberNotId(mobileNumber, id, roleId);
  } catch (err) {
    logger.error('Technician service findByMobileNumberNotId Error:', err);
    throw err;
  }
};

const findByEmail = async (email) => {
  try {
    return await TechnicianDao.findByEmail(email);
  } catch (err) {
    logger.error('Technician service findByEmail Error:', err);
    throw err;
  }
};

const findByEmailNotId = async (email, id) => {
  try {
    return await TechnicianDao.findByEmailNotId(email, id);
  } catch (err) {
    logger.error('Technician service findByEmailNotId Error:', err);
    throw err;
  }
};

const getAllTechnicians = async (reqBody, user) => {
  try {
    return await TechnicianDao.getAllTechnicians(reqBody, user);
  } catch (err) {
    logger.error('Technician service getAllTechnicians Error:', err);
    throw err;
  }
};

const getOneTechnician = async (id) => {
  try {
    return await TechnicianDao.getOneTechnician(id);
  } catch (err) {
    logger.error('Technician service getOneTechnician Error:', err);
    throw err;
  }
};

const TechnicianService = {
  addTechnician,
  updateTechnician,
  findById,
  findByEmployeeCode,
  findByEmployeeCodeAndOutlet,
  findByEmployeeCodeNotId,
  findByEmployeeCodeAndOutletNotId,
  findByMobileNumber,
  findByMobileNumberNotId,
  findByEmail,
  findByEmailNotId,
  getAllTechnicians,
  getOneTechnician,
};

export default TechnicianService;
