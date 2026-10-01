import logger from '../../config/logger.js';
import BinLocationDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addBinLocation = async (binLocation, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await BinLocationDao.addBinLocation(binLocation, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'BinLocation';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        binLocation.binLocation + ' binLocation is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('BinLocation service addBinLocation Error:', err);
    next(err);
  }
  return result;
};

const updateBinLocation = async (id, binLocation, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const binLocationExists = await BinLocationDao.getBinLocation(id);
    if (binLocationExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'BinLocation';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (binLocationExists.binLocation != binLocation.binLocation) {
        message =
          message +
          ' binLocation changed from ' +
          binLocationExists.binLocation +
          ' to ' +
          binLocation.binLocation +
          ' ,';
      }
      if (
        binLocationExists.binLocationDescription !=
        binLocation.binLocationDescription
      ) {
        message =
          message +
          ' binLocationDescription changed from ' +
          binLocationExists.binLocationDescription +
          ' to ' +
          binLocation.binLocationDescription +
          ' ,';
      }
      if (binLocationExists.status != binLocation.status) {
        message =
          message +
          ' status changed from ' +
          binLocationExists.status +
          ' to ' +
          binLocation.status +
          ' ,';
      }
      if (binLocationExists.outletCode != binLocation.outletCode) {
        message =
          message +
          ' outletCode changed from ' +
          binLocationExists.outletCode +
          ' to ' +
          binLocation.outletCode +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await BinLocationDao.updateBinLocation(
        id,
        binLocation,
        user.id
      );
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
    logger.error('BinLocation service updateBinLocation', err);
    next(err);
  }
  return result;
};
const listBinLocations = async (reqBody,user) => {
  try {
    const { totalItems, data } = await BinLocationDao.listBinLocations(reqBody,user);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('BinLocation Service listBinLocations Error:', err);
    next(err);
  }
};

const listBinLocationsForOutlet = async (reqBody,user) => {
  try {
    const data  = await BinLocationDao.listBinLocationsForOutlet(reqBody,user);
    return data
  } catch (err) {
    logger.error('BinLocation Service listBinLocations Error:', err);
    next(err);
  }
};

const BinLocationService = {
  addBinLocation,
  updateBinLocation,
  listBinLocations,
  listBinLocationsForOutlet
};

export default BinLocationService;
