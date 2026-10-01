import logger from '../../config/logger.js';
import SourceTypeDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addSourceType = async (sourcetype, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await SourceTypeDao.addSourceType(sourcetype, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'SourceType';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        sourcetype.sourceTypeName + ' sourcetype is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
  return data;
};

const addSourceTypeCompanyMap = async (companyId, sourceTypeId) => {
  try {
    return await SourceTypeDao.addSourceTypeCompanyMap(companyId, sourceTypeId);
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const removeSourceTypeCompanyMap = async (id) => {
  try {
    return await SourceTypeDao.removeSourceTypeCompanyMap(id);
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const findByCode = async (sourceTypeName) => {
  try {
    return await SourceTypeDao.findByCode(sourceTypeName);
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const findBySourceId = async (sourceId) => {
  try {
    return await SourceTypeDao.findBySourceId(sourceId);
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const getAllSourceType = async (companyId, roleId) => {
  try {
    const data = await SourceTypeDao.getAllSourceType(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const getSourceType = async (id) => {
  try {
    const sourcetype = await SourceTypeDao.getSourceType(id);
    return sourcetype;
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const updateSourceType = async (
  id,
  sourceTypeName,
  sourceId,
  status,
  user,
  sourcetypeExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'SourceType';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (sourcetypeExists.sourceTypeName != sourceTypeName) {
      message =
        message +
        ' sourceTypeName changed from ' +
        sourcetypeExists.sourceTypeName +
        ' to ' +
        sourceTypeName +
        ' ,';
    }
    if (sourcetypeExists.status != status) {
      message =
        message +
        ' status changed from ' +
        sourcetypeExists.status +
        ' to ' +
        status +
        ' ,';
    }
    if (sourcetypeExists.sourceId != sourceId) {
      const OldSource = await SourceTypeDao.findBySourceId(
        sourcetypeExists.sourceId
      );
      const newSource = await SourceTypeDao.findBySourceId(sourceId);
      message =
        message +
        ' source changed from ' +
        OldSource.sourceName +
        ' to ' +
        newSource.sourceName +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await SourceTypeDao.updateSourceType(
      id,
      sourceTypeName,
      sourceId,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
  return data;
};

const deleteSourceType = async (id) => {
  try {
    const data = await SourceTypeDao.deleteSourceType(id);
    return data;
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const listSourceTypes = async (reqBody) => {
  try {
    const data = await SourceTypeDao.listSourceTypes(reqBody);
    return data;
  } catch (err) {
    logger.error('SourceType Service addSourceType Error:', err);
    next(err);
  }
};

const getSourceTypesBySource = async (sourceId) => {
  try {
    const data = await SourceTypeDao.getSourceTypesBySource(sourceId);
    return data;
  } catch (err) {
    logger.error('SourceType Service getSourceTypesBySource Error:', err);
    next(err);
  }
};

const SourceTypeService = {
  addSourceType,
  findByCode,
  findBySourceId,
  getAllSourceType,
  getSourceType,
  updateSourceType,
  deleteSourceType,
  addSourceTypeCompanyMap,
  removeSourceTypeCompanyMap,
  listSourceTypes,
  getSourceTypesBySource,
};

export default SourceTypeService;
