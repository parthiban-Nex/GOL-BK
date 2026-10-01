import EmployeeDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addEmployee = async (emp, user) => {

  let result = '';
  let recentActivityData = {};
  try {
    console.log("outlets-----",emp.outletIds)
   let data = await EmployeeDao.addEmployee(emp, user.id);
    
    if (data) {
        await EmployeeDao.addEmployeeOutletMap(data.id, emp.outletIds, emp.outletId, emp.reports);
      
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Employee';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        emp.employeeName + ' Employee is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Employee service addEmployee', err);
    next(err);
  }
  return result;
};

const updateEmployee = async (id, emp, user) => {

  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const employeeExists = await EmployeeDao.findByemployeeById(id);
    if (employeeExists) {

      const outletIdsToUpdate = emp.reports ? emp.outletIds : [emp.outletId];

      if (Array.isArray(outletIdsToUpdate) && outletIdsToUpdate.length > 0) {
        await EmployeeDao.updateEmployeeOutlets(employeeExists.id, outletIdsToUpdate);
      }

      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Employee';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (employeeExists.employeeName != emp.employeeName) {
        message =
          message +
          ' employeeName changed from ' +
          employeeExists.employeeName +
          ' to ' +
          emp.employeeName +
          ' ,';
      }
      if (employeeExists.employeeCode != emp.employeeCode) {
        message =
          message +
          ' employeeCode changed from ' +
          employeeExists.employeeCode +
          ' to ' +
          emp.employeeCode +
          ' ,';
      }
      if (employeeExists.mobileNumber != emp.mobileNumber) {
        message =
          message +
          ' mobileNumber changed from ' +
          employeeExists.mobileNumber +
          ' to ' +
          emp.mobileNumber +
          ' ,';
      }
      if (employeeExists.email != emp.email) {
        message =
          message +
          ' email changed from ' +
          employeeExists.email +
          ' to ' +
          emp.email +
          ' ,';
      }
      if (employeeExists.status != emp.status) {
        message =
          message +
          ' status changed from ' +
          employeeExists.status +
          ' to ' +
          emp.status +
          ' ,';
      }
      if (employeeExists.employeeRoleId != emp.employeeRoleId) {
        const OldEmpRole = await EmployeeDao.findByemployeeRoleById(
          employeeExists.employeeRoleId
        );
        const newEmpRole = await EmployeeDao.findByemployeeRoleById(
          emp.employeeRoleId
        );
        message =
          message +
          ' employeeRole changed from ' +
          OldEmpRole.employeeRole +
          ' to ' +
          newEmpRole.employeeRole +
          ' ,';
      }
      if (employeeExists.outletId != emp.outletId) {
        const OldOutlet = await EmployeeDao.getOutlet(employeeExists.outletId);
        const newOutlet = await EmployeeDao.getOutlet(emp.outletId);
        message =
          message +
          ' outlet changed from ' +
          OldOutlet.outletCode +
          ' to ' +
          newOutlet.outletCode +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = await EmployeeDao.updateEmployee(id, emp, user.id);
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
    logger.error('Employee service updateEmployee', err);
    next(err);
  }
  return result;
};

const findByemployeeCode = async (employeecode) => {
  try {
    return await EmployeeDao.findByemployeeCode(employeecode);
  } catch (err) {
    logger.error('Employee service findByemployeeName', err);
    next(err);
  }
};

const findByemployeeById = async (id) => {
  try {
    return await EmployeeDao.findByemployeeById(id);
  } catch (err) {
    logger.error('Employee service findByemployeeById', err);
    next(err);
  }
};

const getAllEmployee = async () => {
  try {
    const data = await EmployeeDao.getAllEmployee();
    return data;
  } catch (err) {
    logger.error('Employee service getAllEmployee', err);
    next(err);
  }
};

const getServiceAdvisors = async (user) => {
  const outletId = user?.outlet?.id;
  if (!outletId) {
    throw new Error('Authenticated user outlet is required');
  }

  try {
    const employees = await EmployeeDao.getServiceAdvisors(outletId);
    return employees.map((employee) => ({
      id: employee.id,
      employeeName: employee.employeeName,
      employeeCode: employee.employeeCode,
      mobileNumber: employee.mobileNumber,
      email: employee.email,
      status: employee.status,
      outletId: employee.outletId,
      employeeRole: employee.employeerole?.employeeRole,
    }));
  } catch (err) {
    logger.error('Employee service getServiceAdvisors', err);
    throw err;
  }
};

const listEmployee = async (reqData) => {
  try {
    const data = await EmployeeDao.listEmployee(reqData);
    return data;
  } catch (err) {
    logger.error('Employee service listEmployee', err);
    next(err);
  }
};

const getMechanics = async (reqData) => {
  const resultList = [];
  try {
    const { totalItems, data } = await EmployeeDao.getMechanics(reqData);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['employeeName'] = element.employeeName;
      resObj['employeeCode'] = element.employeeCode;
      resObj['mobileNumber'] = element.mobileNumber;
      resObj['email'] = element.email;
      resObj['status'] = element.status;
      resObj['employeeRole'] = element.employeerole.employeeRole;
      resObj['outletCode'] = element.outlet.outletCode;

      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('Employee service listEmployee', err);
    next(err);
  }
};

const findByMobileNumber = async (mobileNumber) => {
  try {
    return await EmployeeDao.findByMobileNumber(mobileNumber);
  } catch (err) {
    logger.error('Employee service findByMobileNumber', err);
    next(err);
  }
};
const findByEmail = async (email) => {
  try {
    return await EmployeeDao.findByEmail(email);
  } catch (err) {
    logger.error('Employee service findByEmail', err);
    next(err);
  }
};

const getOutletEmployee = async (outletId) => {
  try {
    const data = await EmployeeDao.getOutletEmployee(outletId);
    return data;
  } catch (err) {
    logger.error('Employee service getAllEmployee', err);
    next(err);
  }
};

const EmployeeService = {
  addEmployee,
  findByemployeeCode,
  findByemployeeById,
  updateEmployee,
  getAllEmployee,
  getServiceAdvisors,
  listEmployee,
  findByMobileNumber,
  findByEmail,
  getMechanics,
  getOutletEmployee
};

export default EmployeeService;
