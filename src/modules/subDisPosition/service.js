import SubDisPositionDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import logger from '../../config/logger.js';

const addSubDisPosition = async (subDisPosition, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await SubDisPositionDao.addSubDisPosition(
      subDisPosition,
      user.id
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'subDisPosition';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        subDisPosition.subDisPositionTitle + ' subDisPosition is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('SubDisPosition service addSubDisPosition', err);
    next(err);
  }
  return result;
};

const getSubDisPosition = async (id) => {
  try {
    const subDisPosition = await SubDisPositionDao.getSubDisPosition(id);
    return subDisPosition;
  } catch (err) {
    logger.error('SubDisPosition service getSubDisPosition', err);
    next(err);
  }
};

const updateSubDisPosition = async (id, subDisPosition, user) => {
  let result = '';
  let recentActivityData = {};
  let message = '';
  let data = {};
  try {
    const subDisPositionExists = await SubDisPositionDao.getSubDisPosition(id);
    if (subDisPositionExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'SubDisPosition';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (
        subDisPositionExists.subDisPositionTitle !=
        subDisPosition.subDisPositionTitle
      ) {
        message =
          message +
          ' subDisPositionTitle changed from ' +
          subDisPositionExists.subDisPositionTitle +
          ' to ' +
          subDisPosition.subDisPositionTitle +
          ' ,';
      }
      if (
        subDisPositionExists.subDisPositionCode !=
        subDisPosition.subDisPositionCode
      ) {
        message =
          message +
          ' subDisPositionCode changed from ' +
          subDisPositionExists.subDisPositionCode +
          ' to ' +
          subDisPosition.subDisPositionCode +
          ' ,';
      }
      if (subDisPositionExists.status != subDisPosition.status) {
        message =
          message +
          ' status changed from ' +
          subDisPositionExists.status +
          ' to ' +
          subDisPosition.status +
          ' ,';
      }
      if (subDisPositionExists.disPositionId != subDisPosition.disPositionId) {
        const OldDisPosition = await SubDisPositionDao.getDisPosition(
          subDisPositionExists.disPositionId
        );
        const newDisPosition = await SubDisPositionDao.getDisPosition(
          subDisPosition.disPositionId
        );
        message =
          message +
          ' DisPosition changed from ' +
          OldDisPosition.title +
          ' to ' +
          newDisPosition.title +
          ' ,';
      }
      message = message.slice(0, -1);
      data = await SubDisPositionDao.updateSubDisPosition(
        id,
        subDisPosition,
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
    result = 'failed';
    logger.error('SubDisPosition service updateSubDisPosition', err);
    next(err);
  }
  return result;
};

const deleteSubDisPosition = async (id) => {
  try {
    const data = await SubDisPositionDao.deleteSubDisPosition(id);
    return data;
  } catch (err) {
    logger.error('SubDisPosition service deleteSubDisPosition', err);
    next(err);
  }
};

const listSubDisPositions = async (reqData) => {
  const resultList = [];
  try {
    const { totalItems, data } =
      await SubDisPositionDao.listSubDisPositions(reqData);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['subDisPositionTitle'] = element.subDisPositionTitle;
      resObj['subDisPositionCode'] = element.subDisPositionCode;
      resObj['status'] = element.status;
      resObj['disPosition'] = element.dispositions.title;
      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('SubDisPosition service listSubDisPositions', err);
    next(err);
  }
};

const SubDisPositionService = {
  addSubDisPosition,
  getSubDisPosition,
  updateSubDisPosition,
  deleteSubDisPosition,
  listSubDisPositions,
};

export default SubDisPositionService;
