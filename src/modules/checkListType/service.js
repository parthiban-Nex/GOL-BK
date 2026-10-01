import logger from '../../config/logger.js';
import CheckListTypeDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addCheckListType = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await CheckListTypeDao.addCheckListType(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'CheckListType';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.checkListTypeCode + ' CheckListType is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('CheckListType service addCheckListType Error:', err);
    next(err);
  }
  return result;
};

const updateCheckListType = async (id, reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const checkListTypeExists = await CheckListTypeDao.getCheckListType(id);
    if (checkListTypeExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'CheckListType';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (
        checkListTypeExists.CHECKLIST_TYPE_CODE != reqData.checkListTypeCode
      ) {
        message =
          message +
          ' checkListTypeCode changed from ' +
          checkListTypeExists.CHECKLIST_TYPE_CODE +
          ' to ' +
          reqData.checkListTypeCode +
          ' ,';
      }
      if (checkListTypeExists.ACTIVE != reqData.status) {
        message =
          message +
          ' status changed from ' +
          checkListTypeExists.ACTIVE +
          ' to ' +
          reqData.status +
          ' ,';
      }
      if (checkListTypeExists.CHECKLIST_TYPE != reqData.checkListType) {
        message =
          message +
          ' checkListType changed from ' +
          checkListTypeExists.CHECKLIST_TYPE +
          ' to ' +
          reqData.checkListType +
          ' ,';
      }
      if (
        checkListTypeExists.CHECKLIST_TYPE_CATEGORY !=
        reqData.checkListTypeCategory
      ) {
        message =
          message +
          ' checkListTypeCategory changed from ' +
          checkListTypeExists.CHECKLIST_TYPE_CATEGORY +
          ' to ' +
          reqData.checkListTypeCategory +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await CheckListTypeDao.updateCheckListType(id, reqData, user);
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
    logger.error('CheckListType service updateCheckListType', err);
    next(err);
  }
  return result;
};

const listCheckListTypes = async (reqBody) => {
  try {
    const { totalItems, data } =
      await CheckListTypeDao.listCheckListTypes(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('CheckListType Service listCheckListTypes Error:', err);
    next(err);
  }
};

const deleteCheckListType = async (id, user) => {
  let result = 'failed';
  try {
    let data = await CheckListTypeDao.deleteCheckListType(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('CheckListType service deleteCheckListType', err);
    next(err);
  }
  return result;
};

const getCustomerAccountTypes = async () => {
  try {
    const data = await CheckListTypeDao.getCustomerAccountTypes();
    return data;
  } catch (err) {
    logger.error('CheckListType service getCustomerAccountTypes Error:', err);
    next(err);
  }
};

const getCheckListTypes = async () => {
  try {
    const data = await CheckListTypeDao.getCheckListTypes();
    return data;
  } catch (err) {
    logger.error('CheckListType Service getCheckListTypes Error:', err);
    next(err);
  }
};

const getInspectionTypes = async () => {
  try {
    const data = await CheckListTypeDao.getInspectionTypes();
    return data;
  } catch (err) {
    logger.error('CheckListType Service getInspectionTypes Error:', err);
    next(err);
  }
};

const CheckListTypeService = {
  addCheckListType,
  updateCheckListType,
  listCheckListTypes,
  deleteCheckListType,
  getCustomerAccountTypes,
  getCheckListTypes,
  getInspectionTypes,
};

export default CheckListTypeService;
