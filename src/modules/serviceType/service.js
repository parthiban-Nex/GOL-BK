import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import ServiceTypeDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addServiceType = async (servicetype, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await ServiceTypeDao.addServiceType(servicetype, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'ServiceType';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        servicetype.serviceTypeName + ' ServiceType is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('ServiceType service addServiceType Error:', err);
    next(err);
  }
  return data;
};

const addServiceTypeCompanyMap = async (companyId, serviceTypeId) => {
  try {
    return await ServiceTypeDao.addServiceTypeCompanyMap(
      companyId,
      serviceTypeId
    );
  } catch (err) {
    logger.error('ServiceType service addServiceTypeCompanyMap Error:', err);
    next(err);
  }
};

const removeServiceTypeCompanyMap = async (id) => {
  try {
    return await ServiceTypeDao.removeServiceTypeCompanyMap(id);
  } catch (err) {
    logger.error('ServiceType service removeServiceTypeCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (serviceTypeName) => {
  try {
    return await ServiceTypeDao.findByCode(serviceTypeName);
  } catch (err) {
    logger.error('ServiceType service findByCode Error:', err);
    next(err);
  }
};

const getAllServiceType = async (companyId, roleId) => {
  try {
    const data = await ServiceTypeDao.getAllServiceType(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('ServiceType service getAllServiceType Error:', err);
    next(err);
  }
};

const getServiceType = async (id) => {
  try {
    const servicetype = await ServiceTypeDao.getServiceType(id);
    return servicetype;
  } catch (err) {
    logger.error('ServiceType service getServiceType Error:', err);
    next(err);
  }
};

const updateServiceType = async (
  id,
  serviceTypeName,
  status,
  user,
  serviceTypesExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'ServiceType';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (serviceTypesExists.serviceTypeName != serviceTypeName) {
      message =
        message +
        ' serviceTypeName changed from ' +
        serviceTypesExists.serviceTypeName +
        ' to ' +
        serviceTypeName +
        ' ,';
    }
    if (serviceTypesExists.status != status) {
      message =
        message +
        ' status changed from ' +
        serviceTypesExists.status +
        ' to ' +
        status +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await ServiceTypeDao.updateServiceType(
      id,
      serviceTypeName,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('ServiceType service updateServiceType Error:', err);
    next(err);
  }
  return data;
};

const deleteServiceType = async (id) => {
  try {
    const data = await ServiceTypeDao.deleteServiceType(id);
    return data;
  } catch (err) {
    logger.error('ServiceType service deleteServiceType Error:', err);
    next(err);
  }
};

const listServiceTypes = async (reqBody) => {
  try {
    const data = await ServiceTypeDao.listServiceTypes(reqBody);
    return data;
  } catch (err) {
    logger.error('ServiceType service listServiceTypes Error:', err);
    next(err);
  }
};

const ServiceTypesService = {
  addServiceType,
  findByCode,
  getAllServiceType,
  getServiceType,
  updateServiceType,
  deleteServiceType,
  addServiceTypeCompanyMap,
  removeServiceTypeCompanyMap,
  listServiceTypes,
};

export default ServiceTypesService;
