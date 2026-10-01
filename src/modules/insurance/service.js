import logger from '../../config/logger.js';
import InsuranceDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addInsurance = async (insurance, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InsuranceDao.addInsurance(insurance, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Insurance';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        insurance.insuranceName + ' Insurance is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Insurance service addInsurance Error:', err);
    next(err);
  }
  return result;
};

const updateInsurance = async (id, insurance, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const insuranceExists = await InsuranceDao.getInsurance(id);
    if (insuranceExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Insurance';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (insuranceExists.insuranceName != insurance.insuranceName) {
        message =
          message +
          ' insuranceName changed from ' +
          insuranceExists.insuranceName +
          ' to ' +
          insurance.insuranceName +
          ' ,';
      }
      if (insuranceExists.status != insurance.status) {
        message =
          message +
          ' status changed from ' +
          insuranceExists.status +
          ' to ' +
          insurance.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await InsuranceDao.updateInsurance(id, insurance, user.id);
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
    logger.error('Insurance service updateInsurance', err);
    next(err);
  }
  return result;
};

const listInsurances = async (reqBody) => {
  try {
    const { totalItems, data } = await InsuranceDao.listInsurances(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Insurance Service listInsurances Error:', err);
    next(err);
  }
};

const getAllInsurances = async () => {
  try {
    const data = await InsuranceDao.getAllInsurances();
    return data;
  } catch (err) {
    logger.error('Insurance service getAllInsurances', err);
    next(err);
  }
};

const InsuranceService = {
  addInsurance,
  updateInsurance,
  listInsurances,
  getAllInsurances,
};

export default InsuranceService;
