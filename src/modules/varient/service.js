import db from '../index.js';
import VarientDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addVarient = async (varient, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await VarientDao.addVarient(varient, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Varient';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        varient.varientName + ' Varient is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Varient service addVarient Error:', err);
    next(err);
  }
  return data;
};

const findByvarientName = async (varientName) => {
  try {
    return await VarientDao.findByvarientName(varientName);
  } catch (err) {
    logger.error('Varient service findByvarientName Error:', err);
    next(err);
  }
};

const getAllVarient = async () => {
  try {
    const data = await VarientDao.getAllVarient();
    return data;
  } catch (err) {
    logger.error('Varient service getAllVarient Error:', err);
    next(err);
  }
};

const getOneVarient = async (id) => {
  try {
    const varient = await VarientDao.getOneVarient(id);
    return varient;
  } catch (err) {
    logger.error('Varient service getOneVarient Error:', err);
    next(err);
  }
};

const updateVarient = async (id, varient, user, varientExists) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Varient';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;
    if (varientExists.varientName != varient.varientName) {
      message =
        message +
        ' aggregateName changed from ' +
        varientExists.varientName +
        ' to ' +
        varient.varientName +
        ' ,';
    }
    if (varientExists.status != varient.status) {
      message =
        message +
        ' status changed from ' +
        varientExists.status +
        ' to ' +
        varient.status +
        ' ,';
    }
    if (varientExists.fuelType != varient.fuelType) {
      message =
        message +
        ' fuelType changed from ' +
        varientExists.fuelType +
        ' to ' +
        varient.fuelType +
        ' ,';
    }
    if (varientExists.varientDescription != varient.varientDescription) {
      message =
        message +
        ' varientDescription changed from ' +
        varientExists.varientDescription +
        ' to ' +
        varient.varientDescription +
        ' ,';
    }
    message = message.slice(0, -1);
    data = await VarientDao.updateVarient(id, varient, user.id);
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Varient service updateVarient Error:', err);
    next(err);
  }
  return data;
};

const deleteVarient = async (id) => {
  try {
    const data = await VarientDao.deleteVarient(id);
    return data;
  } catch (err) {
    logger.error('Varient service deleteVarient Error:', err);
    next(err);
  }
};

const listVarients = async (reqBody) => {
  try {
    const data = await VarientDao.listVarients(reqBody);
    return data;
  } catch (err) {
    logger.error('Varient service listVarients Error:', err);
    next(err);
  }
};

const getAllFuelType = async () => {
  try {
    const data = await VarientDao.getAllFuelType();
    return data;
  } catch (err) {
    logger.error('Varient service getAllFuelType Error:', err);
    next(err);
  }
};

const varientService = {
  addVarient,
  findByvarientName,
  getAllVarient,
  getOneVarient,
  updateVarient,
  deleteVarient,
  listVarients,
  getAllFuelType,
};

export default varientService;
