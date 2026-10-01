import logger from '../../config/logger.js';
import InspectionCheckListDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addParamAlertSchedule = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InspectionCheckListDao.addParamAlertSchedule(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'ParamAlertSchedule';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = 'A new ParamAlertSchedule is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'ParamAlertSchedule service addParamAlertSchedule Error:',
      err
    );
    next(err);
  }
  return result;
};

const updateParamAlertSchedule = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const objExists = await InspectionCheckListDao.getParamAlertSchedule(id);
    if (objExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'ParamAlertSchedule';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (objExists.INSPECTION_TYPE != reqData.inspectionType) {
        message =
          message +
          ' inspectionType changed from ' +
          objExists.INSPECTION_TYPE +
          ' to ' +
          reqData.inspectionType +
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
      if (objExists.CHECKLIST_TYPE_CODE != reqData.checkListTypeCode) {
        message =
          message +
          ' checkListTypeCode changed from ' +
          objExists.CHECKLIST_TYPE_CODE +
          ' to ' +
          reqData.checkListTypeCode +
          ' ,';
      }
      if (objExists.CHECKLIST_VERSION != reqData.checkListVersion) {
        message =
          message +
          ' checkListVersion changed from ' +
          objExists.CHECKLIST_VERSION +
          ' to ' +
          reqData.checkListVersion +
          ' ,';
      }
      if (objExists.PARAM_CODE != reqData.paramCode) {
        message =
          message +
          ' paramCode changed from ' +
          objExists.PARAM_CODE +
          ' to ' +
          reqData.paramCode +
          ' ,';
      }
      if (objExists.PARAM_RATING != reqData.paramRating) {
        message =
          message +
          ' paramRating changed from ' +
          objExists.PARAM_RATING +
          ' to ' +
          reqData.paramRating +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await InspectionCheckListDao.updateParamAlertSchedule(
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
    logger.error('InspectionCheckList service updateInspectionCheckList', err);
    next(err);
  }
  return result;
};

const listParamAlertSchedule = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InspectionCheckListDao.listParamAlertSchedule(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'ParamAlertSchedule Service listParamAlertSchedule Error:',
      err
    );
    next(err);
  }
};

const deleteParamAlertSchedule = async (id, user) => {
  let result = 'failed';
  try {
    let data = await InspectionCheckListDao.deleteParamAlertSchedule(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('ParamAlertSchedule service deleteParamAlertSchedule', err);
    next(err);
  }
  return result;
};

const getAllInspectionCheckList = async () => {
  try {
    const data = await InspectionCheckListDao.getAllInspectionCheckList();
    return data;
  } catch (err) {
    logger.error(
      'InspectionCheckList Service getAllInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const InspectionCheckListService = {
  addParamAlertSchedule,
  updateParamAlertSchedule,
  deleteParamAlertSchedule,
  listParamAlertSchedule,
  getAllInspectionCheckList,
};

export default InspectionCheckListService;
