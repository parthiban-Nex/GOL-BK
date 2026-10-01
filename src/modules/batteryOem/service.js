import logger from '../../config/logger.js';
import BatteryOemDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addBatteryOem = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await BatteryOemDao.addBatteryOem(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'BatteryOem';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.oemName + ' Battery Oem is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('BatteryOem service addBatteryOem Error:', err);
    next(err);
  }
  return result;
};

const updateBatteryOem = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const batteryOemExists = await BatteryOemDao.getBatteryOem(id);
    if (batteryOemExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'BatteryOem';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (batteryOemExists.OEM_NAME != reqData.oemName) {
        message =
          message +
          ' oemName changed from ' +
          batteryOemExists.OEM_NAME +
          ' to ' +
          reqData.oemName +
          ' ,';
      }
      if (batteryOemExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          batteryOemExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await BatteryOemDao.updateBatteryOem(id, reqData, user);
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addFitMasterRecentActivity(
              recentActivityData
            );
        }
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('BatteryOem service updateBatteryOem', err);
    next(err);
  }
  return result;
};

const listBatteryOems = async (reqBody) => {
  try {
    const { totalItems, data } = await BatteryOemDao.listBatteryOems(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('BatteryOem Service listBatteryOems Error:', err);
    next(err);
  }
};

const deleteBatteryOem = async (id, user) => {
  let result = 'failed';
  try {
    let data = await BatteryOemDao.deleteBatteryOem(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('BatteryOem service deleteBatteryOem', err);
    next(err);
  }
  return result;
};

const TyreOemService = {
  addBatteryOem,
  updateBatteryOem,
  listBatteryOems,
  deleteBatteryOem,
};

export default TyreOemService;
