import logger from '../../config/logger.js';
import PickupTypeDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addPickupType = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await PickupTypeDao.addPickupType(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Pickup Type';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.pickupType + ' PickupType is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('PickupType service addTyreSize Error:', err);
    //next(err);
  }
  return result;
};

const updatePickupType = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const pickupTypeExists = await PickupTypeDao.getPickupType(reqData.id);
    if (pickupTypeExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'PickupType';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (pickupTypeExists.PICKUP_TYPE != reqData.pickupType) {
        message =
          message +
          ' pickupType changed from ' +
          pickupTypeExists.PICKUP_TYPE +
          ' to ' +
          reqData.pickupType +
          ' ,';
      }
      if (pickupTypeExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          pickupTypeExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await PickupTypeDao.updatePickupType(reqData, user);
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
    logger.error('pickupType service updateTyreSize', err);
    next(err);
  }
  return result;
};

const listPickupType = async (reqBody) => {
  try {
    const { totalItems, data } = await PickupTypeDao.listPickupType(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('TyreSize Service listPickupType Error:', err);
    next(err);
  }
};

const deletePickupType = async (id, user) => {
  let result = 'failed';
  try {
    let data = await PickupTypeDao.deletePickupType(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('PickupTypeDao service deletePickupType', err);
    next(err);
  }
  return result;
};

const TyreSizeService = {
  addPickupType,
  updatePickupType,
  listPickupType,
  deletePickupType,
};

export default TyreSizeService;
