import DisPositionDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addDisPosition = async (disposition, user) => {
  let result = 'failed';
  let recentActivityData = {};
  try {
    let data = await DisPositionDao.addDisPosition(disposition, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'DisPosition';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        disposition.title + ' DisPosition is created ';
      await DisPositionDao.addDisPositionCompanyMap(
        disposition.companyId,
        data.id
      );
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('DisPosition service addDisPosition', err);
    next(err);
  }
  return result;
};

const addDisPositionCompanyMap = async (companyId, dispositionId) => {
  try {
    return await DisPositionDao.addDisPositionCompanyMap(
      companyId,
      dispositionId
    );
  } catch (err) {
    logger.error('DisPosition service addDisPositionCompanyMap', err);
    next(err);
  }
};

const removeDisPositionCompanyMap = async (id) => {
  try {
    return await DisPositionDao.removeDisPositionCompanyMap(id);
  } catch (err) {
    logger.error('DisPosition service removeDisPositionCompanyMap', err);
    next(err);
  }
};

const findByCode = async (disPositionCode) => {
  try {
    return await DisPositionDao.findByCode(disPositionCode);
  } catch (err) {
    logger.error('DisPosition service findByCode', err);
    next(err);
  }
};

const getAllDisPositions = async (companyId, roleId) => {
  try {
    const data = await DisPositionDao.getAllDisPositions(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('DisPosition service getAllDisPositions', err);
    next(err);
  }
};

const getDisPosition = async (id) => {
  try {
    const disposition = await DisPositionDao.getDisPosition(id);
  } catch (err) {
    logger.error('DisPosition service getDisPosition', err);
    next(err);
  }
};

const updateDisPosition = async (id, disPosition, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const dispositionExists = await DisPositionDao.getDisPosition(id);
    if (dispositionExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'DisPosition';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (dispositionExists.title != disPosition.title) {
        message =
          message +
          ' title changed from ' +
          dispositionExists.title +
          ' to ' +
          disPosition.title +
          ' ,';
      }
      if (dispositionExists.disPositionCode != disPosition.disPositionCode) {
        message =
          message +
          ' disPositionCode changed from ' +
          dispositionExists.disPositionCode +
          ' to ' +
          disPosition.disPositionCode +
          ' ,';
      }
      if (dispositionExists.status != disPosition.status) {
        message =
          message +
          ' status changed from ' +
          dispositionExists.status +
          ' to ' +
          disPosition.status +
          ' ,';
      }
      if (dispositionExists.disPositionType != disPosition.disPositionType) {
        message =
          message +
          ' disPositionType changed from ' +
          dispositionExists.disPositionType +
          ' to ' +
          disPosition.disPositionType +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await DisPositionDao.updateDisPosition(
        id,
        disPosition,
        user.id
      );
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        await DisPositionDao.removeDisPositionCompanyMap(id);
        await DisPositionDao.addDisPositionCompanyMap(
          disPosition.companyId,
          id,
          user.id
        );
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('DisPosition service updateDisPosition', err);
    next(err);
  }
  return result;
};

const listDisPositions = async (reqData) => {
  const resultList = [];
  try {
    const { totalItems, data } = await DisPositionDao.listDisPositions(reqData);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['title'] = element.title;
      resObj['disPositionCode'] = element.disPositionCode;
      resObj['disPositionType'] = element.disPositionType;
      resObj['status'] = element.status;
      const companyMaps = element.dispositioncompanymap;
      let companyname = '';
      companyMaps.forEach(async (companyId) => {
        companyname = companyname + companyId.name + ',';
      });
      resObj['companies'] = companyname.slice(0, -1);
      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('DisPosition service listDisPositions', err);
    next(err);
  }
};

const deleteDisPosition = async (id) => {
  try {
    const data = await DisPositionDao.deleteDisPosition(id);
    return data;
  } catch (error) {
    logger.error('DisPosition service deleteDisPosition', error);
    next(error);
  }
};

const checkUnique = async (disPositionCode, id) => {
  try {
    return await DisPositionDao.checkUnique(disPositionCode, id);
  } catch (err) {
    logger.error('DisPosition service checkUnique Error:', err);
    next(err);
  }
};

const DisPositionService = {
  addDisPosition,
  findByCode,
  getAllDisPositions,
  getDisPosition,
  updateDisPosition,
  deleteDisPosition,
  addDisPositionCompanyMap,
  removeDisPositionCompanyMap,
  listDisPositions,
  checkUnique,
};

export default DisPositionService;
