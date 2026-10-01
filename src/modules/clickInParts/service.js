import logger from '../../config/logger.js';
import PartsDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addPart = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await PartsDao.addPart(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'ClickInParts';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.CLICKINS_NAME + '  Part is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('ClickInParts service addPart Error:', err);
    next(err);
  }
  return result;
};

const updatePart = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const partExists = await PartsDao.getPart(id);
    if (partExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'ClickInParts';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (partExists.CLICKINS_NAME != reqData.clickinPartName) {
        message =
          message +
          ' clickinPartName changed from ' +
          partExists.CLICKINS_NAME +
          ' to ' +
          reqData.clickinPartName +
          ' ,';
      }
      if (partExists.PANEL_NAME != reqData.panelName) {
        message =
          message +
          ' panelName changed from ' +
          partExists.PANEL_NAME +
          ' to ' +
          reqData.panelName +
          ' ,';
      }
      if (partExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          partExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await PartsDao.updatePart(id, reqData, user);
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
    logger.error('ClickInParts service updatePart', err);
    next(err);
  }
  return result;
};

const listParts = async (reqBody) => {
  try {
    const { totalItems, data } = await PartsDao.listParts(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('ClickInParts Service listParts Error:', err);
    next(err);
  }
};

const deletePart = async (id, user) => {
  let result = 'failed';
  try {
    let data = await PartsDao.deletePart(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('ClickInParts service deletePart', err);
    next(err);
  }
  return result;
};

const TyreOemService = {
  addPart,
  updatePart,
  listParts,
  deletePart,
};

export default TyreOemService;
