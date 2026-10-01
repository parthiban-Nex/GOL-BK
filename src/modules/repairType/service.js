import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import RepairTypeDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addRepairTypes = async (repairtype, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await RepairTypeDao.addRepairTypes(repairtype, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Repairtype';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        repairtype.repairTypeName + ' Repairtype is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Repairtype Service addRepairTypes Error:', err);
    next(err);
  }
  return data;
};

const addRepairTypeCompanyMap = async (companyId, repairTypeId) => {
  try {
    return await RepairTypeDao.addRepairTypeCompanyMap(companyId, repairTypeId);
  } catch (err) {
    logger.error('Repairtype Service addRepairTypeCompanyMap Error:', err);
    next(err);
  }
};

const removeRepairTypeCompanyMap = async (id) => {
  try {
    return await RepairTypeDao.removeRepairTypeCompanyMap(id);
  } catch (err) {
    logger.error('Repairtype Service removeRepairTypeCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (repairTypeName) => {
  try {
    return await RepairTypeDao.findByCode(repairTypeName);
  } catch (err) {
    logger.error('Repairtype Service findByCode Error:', err);
    next(err);
  }
};

const getAllRepairTypes = async (companyId, roleId) => {
  try {
    const data = await RepairTypeDao.getAllRepairTypes(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('Repairtype Service getAllRepairTypes Error:', err);
    next(err);
  }
};

const getRepairTypes = async (id) => {
  try {
    return await RepairTypeDao.getRepairTypes(id);
  } catch (err) {
    logger.error('Repairtype Service getRepairTypes Error:', err);
    next(err);
  }
};

const updateRepairTypes = async (
  id,
  repairTypeName,
  scheme,
  status,
  user,
  repairTypesExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Repairtype';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (repairTypesExists.repairTypeName != repairTypeName) {
      message =
        message +
        ' repairTypeName changed from ' +
        repairTypesExists.repairTypeName +
        ' to ' +
        repairTypeName +
        ' ,';
    }
    if (repairTypesExists.status != status) {
      message =
        message +
        ' status changed from ' +
        repairTypesExists.status +
        ' to ' +
        status +
        ' ,';
    }
    if (repairTypesExists.scheme != scheme) {
      message =
        message +
        ' scheme changed from ' +
        repairTypesExists.scheme +
        ' to ' +
        scheme +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await RepairTypeDao.updateRepairTypes(
      id,
      repairTypeName,
      scheme,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Repairtype Service updateRepairTypes Error:', err);
    next(err);
  }
  return data;
};

const deleteRepairTypes = async (id) => {
  try {
    const data = await RepairTypeDao.deleteRepairTypes(id);
    return data;
  } catch (err) {
    logger.error('Repairtype Service deleteRepairTypes Error:', err);
    next(err);
  }
};

const listRepairTypes = async (reqBody) => {
  try {
    const data = await RepairTypeDao.listRepairTypes(reqBody);
    return data;
  } catch (err) {
    logger.error('Repairtype Service listRepairTypes Error:', err);
    next(err);
  }
};

const RepairTypesService = {
  addRepairTypes,
  findByCode,
  getAllRepairTypes,
  getRepairTypes,
  updateRepairTypes,
  deleteRepairTypes,
  addRepairTypeCompanyMap,
  removeRepairTypeCompanyMap,
  listRepairTypes,
};

export default RepairTypesService;
