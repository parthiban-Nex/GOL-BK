import logger from '../../config/logger.js';
import SubAggregateDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addSubAggregate = async (subAggregate, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await SubAggregateDao.addSubAggregate(subAggregate, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'SubAggregate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        subAggregate.subAggregateName + ' SubAggregate is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('SubAggregate Service addSubAggregate Error:', err);
    next(err);
  }
  return data;
};

const findByName = async (subaggregateName) => {
  try {
    return await SubAggregateDao.findByName(subaggregateName);
  } catch (err) {
    logger.error('SubAggregate Service findByName Error:', err);
    next(err);
  }
};

const getSubAggregate = async (id) => {
  try {
    const subaggregate = await SubAggregateDao.getSubAggregate(id);
    return subaggregate;
  } catch (err) {
    logger.error('SubAggregate Service getSubAggregate Error:', err);
    next(err);
  }
};

const updateSubAggregate = async (
  id,
  subAggregateName,
  status,
  aggregateId,
  user,
  subAggregateExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'SubAggregate';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (subAggregateExists.subAggregateName != subAggregateName) {
      message =
        message +
        ' subAggregateName changed from ' +
        subAggregateExists.subAggregateName +
        ' to ' +
        subAggregateName +
        ' ,';
    }
    if (subAggregateExists.status != status) {
      message =
        message +
        ' status changed from ' +
        subAggregateExists.status +
        ' to ' +
        status +
        ' ,';
    }
    if (subAggregateExists.aggregateId != aggregateId) {
      const OldAggregate = await SubAggregateDao.findByAggregateId(
        subAggregateExists.aggregateId
      );
      const newAggregate = await SubAggregateDao.findByAggregateId(aggregateId);
      message =
        message +
        ' aggregate changed from ' +
        OldAggregate.aggregateName +
        ' to ' +
        newAggregate.aggregateName +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await SubAggregateDao.updateSubAggregate(
      id,
      subAggregateName,
      status,
      aggregateId,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('SubAggregate Service updateSubAggregate Error:', err);
    next(err);
  }
  return data;
};

const getAllsubAggregates = async () => {
  try {
    const data = await SubAggregateDao.getAllsubAggregates();
    return data;
  } catch (err) {
    logger.error('SubAggregate Service getAllsubAggregates Error:', err);
    next(err);
  }
};

const findByAggregateId = async (id) => {
  try {
    const aggregate = await SubAggregateDao.findByAggregateId(id);
    return aggregate;
  } catch (err) {
    logger.error('SubAggregate Service findByAggregateId Error:', err);
    next(err);
  }
};

const listSubAggregates = async (reqBody) => {
  try {
    const data = await SubAggregateDao.listSubAggregates(reqBody);
    return data;
  } catch (err) {
    logger.error('SubAggregate Service listSubAggregates Error:', err);
    next(err);
  }
};

const getSubAggregatesByAggregateId = async (reqBody) => {
  let data;
  try {
    data = await SubAggregateDao.getSubAggregatesByAggregateId(reqBody);
  } catch (err) {
    logger.error(
      'SubAggregate Service getSubAggregatesByAggregateId Error:',
      err
    );
    next(err);
  }
  return data;
};

const checkUnique = async (subAggregateName, id) => {
  try {
    return await SubAggregateDao.checkUnique(subAggregateName, id);
  } catch (err) {
    logger.error('SubAggregate service checkUnique Error:', err);
    next(err);
  }
};

const SubAggregateService = {
  addSubAggregate,
  findByName,
  getSubAggregate,
  updateSubAggregate,
  getAllsubAggregates,
  findByAggregateId,
  listSubAggregates,
  getSubAggregatesByAggregateId,
  checkUnique,
};

export default SubAggregateService;
