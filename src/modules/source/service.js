import SourceDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addSource = async (source, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await SourceDao.addSource(source, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Source';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = source.sourceName + ' Source is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Source Service addSource Error:', err);
    next(err);
  }
  return data;
};

const addSourceCompanyMap = async (companyId, sourceId) => {
  try {
    return await SourceDao.addSourceCompanyMap(companyId, sourceId);
  } catch (err) {
    logger.error('Source Service addSourceCompanyMap Error:', err);
    next(err);
  }
};

const removeSourceCompanyMap = async (id) => {
  try {
    return await SourceDao.removeSourceCompanyMap(id);
  } catch (err) {
    logger.error('Source Service removeSourceCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (sourceName) => {
  try {
    return await SourceDao.findByCode(sourceName);
  } catch (err) {
    logger.error('Source Service findByCode Error:', err);
    next(err);
  }
};

const getAllSource = async (companyId, roleId) => {
  try {
    const data = await SourceDao.getAllSource(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('Source Service getAllSource Error:', err);
    next(err);
  }
};

const getSource = async (id) => {
  try {
    const source = await SourceDao.getSource(id);
    return source;
  } catch (err) {
    logger.error('Source Service getSource Error:', err);
    next(err);
  }
};

const updateSource = async (id, sourceName, status,bridgeStatus, user, sourceExists) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Source';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (sourceExists.sourceName != sourceName) {
      message =
        message +
        ' sourceName changed from ' +
        sourceExists.sourceName +
        ' to ' +
        sourceName +
        ' ,';
    }
    if (sourceExists.status != status) {
      message =
        message +
        ' status changed from ' +
        sourceExists.status +
        ' to ' +
        status +
        ' ,';
    }
    message = message.slice(0, -1);
    data = await SourceDao.updateSource(id, sourceName, status,bridgeStatus, user.id);
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Source Service updateSource Error:', err);
    next(err);
  }
  return data;
};

const deleteSource = async (id) => {
  try {
    const data = await SourceDao.deleteSource(id);
    return data;
  } catch (err) {
    logger.error('Source Service deleteSource Error:', err);
    next(err);
  }
};

const listSources = async (reqBody) => {
  // console.log('req body ----',reqBody);
  try {
    const data = await SourceDao.listSources(reqBody);
    return data;
  } catch (err) {
    logger.error('Source Service listSources Error:', err);
    next(err);
  }
};

const SourceService = {
  addSource,
  findByCode,
  getAllSource,
  getSource,
  updateSource,
  deleteSource,
  addSourceCompanyMap,
  removeSourceCompanyMap,
  listSources,
};

export default SourceService;
