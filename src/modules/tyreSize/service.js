import logger from '../../config/logger.js';
import TyreSizeDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addTyreSize = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await TyreSizeDao.addTyreSize(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'TyreSize';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.tyreSize + ' Tyre Size is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('TyreSize service addTyreSize Error:', err);
    next(err);
  }
  return result;
};

const updateTyreSize = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const tyreSizeExists = await TyreSizeDao.getTyreSize(id);
    if (tyreSizeExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'TyreSize';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (tyreSizeExists.TYRE_SIZE != reqData.tyreSize) {
        message =
          message +
          ' tyreSize changed from ' +
          tyreSizeExists.TYRE_SIZE +
          ' to ' +
          reqData.tyreSize +
          ' ,';
      }
      if (tyreSizeExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          tyreSizeExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await TyreSizeDao.updateTyreSize(id, reqData, user);
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
    logger.error('TyreSize service updateTyreSize', err);
    next(err);
  }
  return result;
};

const listTyreSizes = async (reqBody) => {
  try {
    const { totalItems, data } = await TyreSizeDao.listTyreSizes(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('TyreSize Service listTyreSizes Error:', err);
    next(err);
  }
};

const deleteTyreSize = async (id, user) => {
  let result = 'failed';
  try {
    let data = await TyreSizeDao.deleteTyreSize(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('TyreSize service deleteTyreSize', err);
    next(err);
  }
  return result;
};

const TyreSizeService = {
  addTyreSize,
  updateTyreSize,
  listTyreSizes,
  deleteTyreSize,
};

export default TyreSizeService;
