import logger from '../../config/logger.js';
import InspectionCheckListDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addInspectionCheckList = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InspectionCheckListDao.addInspectionCheckList(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'InspectionCheckList';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.subSystemCode + ' InspectionCheckList is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'InspectionCheckList service addInspectionCheckList Error:',
      err
    );
    next(err);
  }
  return result;
};

const updateInspectionCheckList = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const objExists = await InspectionCheckListDao.getInspectionCheckList(id);
    if (objExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'InspectionCheckList';
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
      message = message.slice(0, -1);
      let data = await InspectionCheckListDao.updateInspectionCheckList(
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

const listInspectionCheckList = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InspectionCheckListDao.listInspectionCheckList(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'InspectionCheckList Service listInspectionCheckList Error:',
      err
    );
    next(err);
  }
};

const getGroupedInspectionChecklist = async (checkListTypeCode) => {
  return InspectionCheckListDao.getGroupedInspectionChecklist(checkListTypeCode);
};

const deleteInspectionCheckList = async (id, user) => {
  let result = 'failed';
  try {
    let data = await InspectionCheckListDao.deleteInspectionCheckList(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('InspectionCheckList service deleteInspectionCheckList', err);
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
  addInspectionCheckList,
  updateInspectionCheckList,
  deleteInspectionCheckList,
  listInspectionCheckList,
  getAllInspectionCheckList,
  getGroupedInspectionChecklist,
};

export default InspectionCheckListService;
