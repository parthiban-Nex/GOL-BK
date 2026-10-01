import logger from '../../config/logger.js';
import PredeliveryCheckListDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addVehiclePredeliveryCheckList = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await PredeliveryCheckListDao.addVehiclePredeliveryCheckList(
      reqData,
      user
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'PredeliveryCheckList';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.VEHICLE_PDC_CODE + ' vehicle predelivery CheckList is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'PredeliveryCheckList service addVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
  return result;
};

const updateVehiclePredeliveryCheckList = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const checkListExists =
      await PredeliveryCheckListDao.getVehiclePredeliveryCheckList(id);
    if (checkListExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'PredeliveryCheckList';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (checkListExists.VEHICLE_PDC_CODE != reqData.vehiclePdcCode) {
        message =
          message +
          ' oemName changed from ' +
          checkListExists.VEHICLE_PDC_CODE +
          ' to ' +
          reqData.vehiclePdcCode +
          ' ,';
      }
      if (checkListExists.ACTIVE != reqData.status) {
        message =
          message +
          ' status changed from ' +
          checkListExists.STATUS +
          ' to ' +
          reqData.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data =
        await PredeliveryCheckListDao.updateVehiclePredeliveryCheckList(
          id,
          reqData,
          user
        );
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
    logger.error(
      'PredeliveryCheckList service updateVehiclePredeliveryCheckList',
      err
    );
    next(err);
  }
  return result;
};

const listVehiclePredeliveryCheckLists = async (reqBody) => {
  try {
    const { totalItems, data } =
      await PredeliveryCheckListDao.listVehiclePredeliveryCheckLists(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'PredeliveryCheckList Service listVehiclePredeliveryCheckLists Error:',
      err
    );
    next(err);
  }
};

const deleteVehiclePredeliveryCheckList = async (id, user) => {
  let result = 'failed';
  try {
    let data = await PredeliveryCheckListDao.deleteVehiclePredeliveryCheckList(
      id,
      user
    );
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error(
      'PredeliveryCheckList service deleteVehiclePredeliveryCheckList',
      err
    );
    next(err);
  }
  return result;
};

const PredeliveryCheckListService = {
  addVehiclePredeliveryCheckList,
  updateVehiclePredeliveryCheckList,
  listVehiclePredeliveryCheckLists,
  deleteVehiclePredeliveryCheckList,
};

export default PredeliveryCheckListService;
