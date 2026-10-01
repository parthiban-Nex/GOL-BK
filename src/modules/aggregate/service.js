import logger from '../../config/logger.js';
import AggregateDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addAggregate = async (aggregate, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await AggregateDao.addAggregate(aggregate, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Aggregate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        aggregate.aggregateName + ' Aggregate is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Aggregate service addAggregate Error:', err);
    next(err);
  }
  return data;
};

const findByName = async (aggregateName) => {
  try {
    return await AggregateDao.findByName(aggregateName);
  } catch (err) {
    logger.error('Aggregate service findByName Error:', err);
    next(err);
  }
};

const getAllAggregates = async () => {
  try {
    const data = await AggregateDao.getAllAggregates();
    return data;
  } catch (err) {
    logger.error('Aggregate service getAllAggregates Error:', err);
    next(err);
  }
};

const getAggregate = async (id) => {
  try {
    const aggregate = await AggregateDao.getAggregate(id);
    return aggregate;
  } catch (err) {
    logger.error('Aggregate service getAggregate Error:', err);
    next(err);
  }
};

const updateAggregate = async (
  id,
  aggregateName,
  status,
  user,
  aggregateExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Aggregate';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (aggregateExists.aggregateName != aggregateName) {
      message =
        message +
        ' aggregateName changed from ' +
        aggregateExists.aggregateName +
        ' to ' +
        aggregateName +
        ' ,';
    }
    if (aggregateExists.status != status) {
      message =
        message +
        ' status changed from ' +
        aggregateExists.status +
        ' to ' +
        status +
        ' ,';
    }
    message = message.slice(0, -1);
    data = await AggregateDao.updateAggregate(
      id,
      aggregateName,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Aggregate service updateAggregate Error:', err);
    next(err);
  }
  return data;
};

const deleteAggregate = async (id) => {
  try {
    const data = await AggregateDao.deleteAggregate(id);
    return data;
  } catch (err) {
    logger.error('Aggregate service deleteAggregate Error:', err);
    next(err);
  }
};

const listAllAggregates = async (reqBody) => {
  try {
    const data = await AggregateDao.listAllAggregates(reqBody);
    return data;
  } catch (err) {
    logger.error('Aggregate service listAllAggregates Error:', err);
    next(err);
  }
};

const findByCode_Id = async (aggregateName, id) => {
  try {
    return await AggregateDao.findByCode_Id(aggregateName, id);
  } catch (err) {
    logger.error('Aggregate service findByCode_Id Error:', err);
    next(err);
  }
};
const AggregateService = {
  addAggregate,
  findByName,
  getAllAggregates,
  getAggregate,
  updateAggregate,
  deleteAggregate,
  listAllAggregates,
  findByCode_Id,
};

export default AggregateService;
