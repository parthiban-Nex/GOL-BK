import EmployeeRoleDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addEmployeeRole = async (req, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await EmployeeRoleDao.addEmployeeRole(req, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'EmployeeRole';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        req.employeeRole + ' EmployeeRole is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('EmployeeRole service addEmployeeRole Error:', err);
    next(err);
  }
  return result;
};

const updateEmployeeRole = async (id, req, user) => {
  let result = '';
  let recentActivityData = {};
  let message = '';
  try {
    const getEmployeeRoleExisted =
      await EmployeeRoleDao.findByemployeeRoleById(id);
    if (getEmployeeRoleExisted) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'EmployeeRole';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (getEmployeeRoleExisted.employeeRole != req.employeeRole) {
        message =
          message +
          ' employeeRole changed from ' +
          getEmployeeRoleExisted.employeeRole +
          ' to ' +
          req.employeeRole +
          ' ,';
      }
      if (getEmployeeRoleExisted.status != req.status) {
        message =
          message +
          ' status changed from ' +
          getEmployeeRoleExisted.status +
          ' to ' +
          req.status +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = await EmployeeRoleDao.updateEmployeeRole(id, req, user.id);
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        result = 'success';
      }
    }
  } catch (err) {
    result = 'failed';
    logger.error('EmployeeRole service updateEmployeeRole Error:', err);
    next(err);
  }
  return result;
};

const findByemployeeRoleName = async (employeeRole) => {
  try {
    return await EmployeeRoleDao.findByemployeeRoleName(employeeRole);
  } catch (err) {
    logger.error('EmployeeRole service findByemployeeRoleName Error:', err);
    next(err);
  }
};

const findByemployeeRoleById = async (id) => {
  try {
    return await EmployeeRoleDao.findByemployeeRoleById(id);
  } catch (err) {
    logger.error('EmployeeRole service getAllEmployeeRole Error:', err);
    next(err);
  }
};

const getAllEmployeeRole = async () => {
  try {
    const data = await EmployeeRoleDao.getAllEmployeeRole();
    return data;
  } catch (err) {
    logger.error('EmployeeRole service getAllEmployeeRole Error:', err);
    next(err);
  }
};

const listEmployeeRoles = async (reqData) => {
  try {
    const { totalItems, data } =
      await EmployeeRoleDao.listEmployeeRoles(reqData);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('EmployeeRole service listEmployeeRoles Error:', err);
    next(err);
  }
};

const checkUnique = async (employeeRole, id) => {
  try {
    return await EmployeeRoleDao.checkUnique(employeeRole, id);
  } catch (err) {
    logger.error('EmployeeRole service checkUnique Error:', err);
    next(err);
  }
};
const EmployeeService = {
  addEmployeeRole,
  findByemployeeRoleName,
  findByemployeeRoleById,
  updateEmployeeRole,
  getAllEmployeeRole,
  listEmployeeRoles,
  checkUnique,
};

export default EmployeeService;
