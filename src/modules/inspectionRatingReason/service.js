import logger from '../../config/logger.js';
import InspectionRatingReasonDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addInspectionRatingReason = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InspectionRatingReasonDao.addInspectionRatingReason(
      reqData,
      user
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'InspectionRatingReason';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.RATING_REASON_CODE + ' InspectionRatingReason is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'InspectionRatingReason service addInspectionRatingReason Error:',
      err
    );
    next(err);
  }
  return result;
};

const updateInspectionRatingReason = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const objExists =
      await InspectionRatingReasonDao.getInspectionRatingReason(id);
    if (objExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'InspectionRatingReason';
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
      if (objExists.RATING_REASON_CODE != reqData.ratingReasonCode) {
        message =
          message +
          ' ratingReasonCode changed from ' +
          objExists.RATING_REASON_CODE +
          ' to ' +
          reqData.ratingReasonCode +
          ' ,';
      }
      if (objExists.RATING_REASON_DESC != reqData.ratingReasonDesc) {
        message =
          message +
          ' ratingReasonDesc changed from ' +
          objExists.RATING_REASON_DESC +
          ' to ' +
          reqData.ratingReasonDesc +
          ' ,';
      }
      if (objExists.REASON_CRITICALITY != reqData.reasonCriticality) {
        message =
          message +
          ' reasonCriticality changed from ' +
          objExists.REASON_CRITICALITY +
          ' to ' +
          reqData.reasonCriticality +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await InspectionRatingReasonDao.updateInspectionRatingReason(
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
      'InspectionRatingReason service updateInspectionRatingReason',
      err
    );
    next(err);
  }
  return result;
};

const listInspectionRatingReasons = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InspectionRatingReasonDao.listInspectionRatingReasons(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'InspectionRatingReason Service listInspectionRatingReasons Error:',
      err
    );
    next(err);
  }
};

const deleteInspectionRatingReason = async (id, user) => {
  let result = 'failed';
  try {
    let data = await InspectionRatingReasonDao.deleteInspectionRatingReason(
      id,
      user
    );
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error(
      'InspectionRatingReason service deleteInspectionRatingReason',
      err
    );
    next(err);
  }
  return result;
};

const getAllInspectionRatingReasons = async () => {
  try {
    const data =
      await InspectionRatingReasonDao.getAllInspectionRatingReasons();
    return data;
  } catch (err) {
    logger.error(
      'InspectionRatingReason Service getAllInspectionRatingReasons Error:',
      err
    );
    next(err);
  }
};

const InspectionRatingReasonService = {
  addInspectionRatingReason,
  updateInspectionRatingReason,
  listInspectionRatingReasons,
  deleteInspectionRatingReason,
  getAllInspectionRatingReasons,
};

export default InspectionRatingReasonService;
