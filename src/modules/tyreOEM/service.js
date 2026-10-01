import logger from '../../config/logger.js';
import TyreOemDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addTyreOem = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await TyreOemDao.addTyreOem(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'TyreOem';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = reqData.oemName + ' Tyre Oem is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('TyreOem service addTyreOem Error:', err);
    next(err);
  }
  return result;
};

const updateTyreOem = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const tyreOemExists = await TyreOemDao.getTyreOem(id);
    if (tyreOemExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'TyreOem';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (tyreOemExists.OEM_NAME != reqData.oemName) {
        message =
          message +
          ' oemName changed from ' +
          tyreOemExists.OEM_NAME +
          ' to ' +
          reqData.oemName +
          ' ,';
      }
      if (tyreOemExists.STATUS != reqData.status) {
        message =
          message +
          ' status changed from ' +
          tyreOemExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await TyreOemDao.updateTyreOem(id, reqData, user);
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
    logger.error('TyreOem service updateBinLocation', err);
    next(err);
  }
  return result;
};

const listTyreOems = async (reqBody) => {
  try {
    const { totalItems, data } = await TyreOemDao.listTyreOems(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('TyreOem Service listTyreOems Error:', err);
    next(err);
  }
};

const deleteTyreOem = async (id, user) => {
  let result = 'failed';
  try {
    let data = await TyreOemDao.deleteTyreOem(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('TyreOem service deleteTyreOem', err);
    next(err);
  }
  return result;
};

const TyreOemService = {
  addTyreOem,
  updateTyreOem,
  listTyreOems,
  deleteTyreOem,
};

export default TyreOemService;
