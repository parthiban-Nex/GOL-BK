import logger from '../../config/logger.js';
import InspectionSubsystemMapDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addInspectionSubsystem = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InspectionSubsystemMapDao.addInspectionSubsystem(
      reqData,
      user
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'InspectionSubsystemMap';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.subSystemCode + ' InspectionSubsystemMap is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'InspectionSubsystemMap service addInspectionSubsystem Error:',
      err
    );
    next(err);
  }
  return result;
};

const updateInspectionSubsystem = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const objExists =
      await InspectionSubsystemMapDao.getInspectionSubsystem(id);
    if (objExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'InspectionSubsystemMap';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (objExists.CHECK_LIST_TYPE_CODE != reqData.checkListTypeCode) {
        message =
          message +
          ' checkListTypeCode changed from ' +
          objExists.CHECK_LIST_TYPE_CODE +
          ' to ' +
          reqData.checkListTypeCode +
          ' ,';
      }
      if (objExists.ACTIVE != reqData.status) {
        message =
          message +
          ' status changed from ' +
          objExists.ACTIVE +
          ' to ' +
          reqData.status +
          ' ,';
      }
      if (objExists.SUBSYSTEM_CODE != reqData.subSystemCode) {
        message =
          message +
          ' subSystemCode changed from ' +
          objExists.SUBSYSTEM_CODE +
          ' to ' +
          reqData.subSystemCode +
          ' ,';
      }
      if (objExists.SUBSYSTEM_NAME != reqData.subSystemName) {
        message =
          message +
          ' subSystemName changed from ' +
          objExists.SUBSYSTEM_NAME +
          ' to ' +
          reqData.subSystemName +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await InspectionSubsystemMapDao.updateInspectionSubsystem(
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
      'InspectionSubsystemMap service updateInspectionSubsystem',
      err
    );
    next(err);
  }
  return result;
};

const listInspectionSubsystem = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InspectionSubsystemMapDao.listInspectionSubsystem(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Service listInspectionSubsystem Error:',
      err
    );
    next(err);
  }
};

const deleteSubsystem = async (id, user) => {
  let result = 'failed';
  try {
    let data = await InspectionSubsystemMapDao.deleteSubsystem(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('InspectionSubsystemMap service deleteSubsystem', err);
    next(err);
  }
  return result;
};

const getInspectionSubsystemMaps = async () => {
  try {
    const data = await InspectionSubsystemMapDao.getInspectionSubsystemMaps();
    return data;
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap Service getInspectionSubsystemMaps Error:',
      err
    );
    next(err);
  }
};

const InspectionSubsystemMapService = {
  addInspectionSubsystem,
  updateInspectionSubsystem,
  listInspectionSubsystem,
  deleteSubsystem,
  getInspectionSubsystemMaps,
};

export default InspectionSubsystemMapService;
