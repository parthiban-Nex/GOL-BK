import logger from '../../config/logger.js';
import DockFieldDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addDockFields = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await DockFieldDao.addDockFields(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Dock Abuse Fields';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.pickupType + ' DockAbuseFields is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('DockFields service addDockFields Error:', err);
    //next(err);
  }
  return result;
};

const updateDockFields = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const dockFieldsExists = await DockFieldDao.getDockFields(reqData.id);
    if (dockFieldsExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'DockAbuseFields';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (dockFieldsExists.LABEL != reqData.label) {
        message =
          message +
          ' Label changed from ' +
          dockFieldsExists.LABEL +
          ' to ' +
          reqData.label +
          ' ,';
      }
      if (dockFieldsExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          dockFieldsExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await DockFieldDao.updateDockFields(reqData, user);
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

const listDockFields = async (reqBody) => {
  try {
    const { totalItems, data } = await DockFieldDao.listDockFields(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('DockField  Service listDockFields Error:', err);
    next(err);
  }
};

const listInputTypes = async (reqBody) => {
  try {
    const data = await DockFieldDao.listInputTypes(reqBody);
    return data;
  } catch (err) {
    logger.error('DockField  Service listInputTypes Error:', err);
  }
};

const deleteDockFields = async (id, user) => {
  let result = 'failed';
  try {
    let data = await DockFieldDao.deleteDockFields(id, user);
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
  addDockFields,
  updateDockFields,
  listDockFields,
  deleteDockFields,
  listInputTypes,
};

export default TyreSizeService;
