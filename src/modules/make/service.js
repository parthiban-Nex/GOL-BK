import MakeDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addMake = async (make, user) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await MakeDao.addMake(make, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Make';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = make.makeName + ' Make is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Make service addMake Error:', err);
    next(err);
  }
  return data;
};

const findByName = async (makeName) => {
  try {
    return MakeDao.findByName(makeName);
  } catch (err) {
    logger.error('Make service findByName Error:', err);
    next(err);
  }
};

const findByName_Id = async (makeName, id) => {
  try {
    return MakeDao.findByName_Id(makeName, id);
  } catch (err) {
    logger.error('Make service findByName Error:', err);
    next(err);
  }
};
const removeMakeCompanyMap = async (id) => {
  try {
    return await MakeDao.removeMakeCompanyMap(id);
  } catch (err) {
    logger.error('Make service removeMakeCompanyMap Error:', err);
    next(err);
  }
};

const findOne = async (id) => {
  try {
    return await MakeDao.findOne(id);
  } catch (err) {
    logger.error('Make service findOne Error:', err);
    next(err);
  }
};

const addMakeCompanyMap = async (companyId, makeId, userId) => {
  try {
    return await MakeDao.addMakeCompanyMap(companyId, makeId, userId);
  } catch (err) {
    logger.error('Make service addMakeCompanyMap Error:', err);
    next(err);
  }
};

const updateMake = async (
  id,
  makeName,
  makeDescription,
  status,
  user,
  makeExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Make';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (makeExists.makeName != makeName) {
      message =
        message +
        ' makeName changed from ' +
        makeExists.makeName +
        ' to ' +
        makeName +
        ' ,';
    }
    if (makeExists.status != status) {
      message =
        message +
        ' status changed from ' +
        makeExists.status +
        ' to ' +
        status +
        ' ,';
    }
    if (makeExists.makeDescription != makeDescription) {
      message =
        message +
        ' makeDescription changed from ' +
        makeExists.makeDescription +
        ' to ' +
        makeDescription +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await MakeDao.updateMake(
      id,
      makeName,
      makeDescription,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Make service updateMake Error:', err);
    next(err);
  }
  return data;
};

const getAllMakes = async (reqBody) => {
  try {
    const data = await MakeDao.getAllMakes(reqBody);
    return data;
  } catch (err) {
    logger.error('Make service getAllMakes Error:', err);
    next(err);
  }
};

const getOneMake = async (id) => {
  try {
    const make = await MakeDao.getOneMake(id);
    return make;
  } catch (err) {
    logger.error('Make service getOneMake Error:', err);
    next(err);
  }
};

const listMakes = async (companyId, roleId) => {
  try {
    const data = await MakeDao.listMakes(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('Make service listMakes Error:', err);
    next(err);
  }
};

const updateMakeNew = async (
  id,
  makeName,
  makeDescription,
  status,
  user,
  makeExists,
  companyId,
  editCompanyList
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Make';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (makeExists.makeName != makeName) {
      message =
        message +
        ' makeName changed from ' +
        makeExists.makeName +
        ' to ' +
        makeName +
        ' ,';
    }
    if (makeExists.status != status) {
      message =
        message +
        ' status changed from ' +
        makeExists.status +
        ' to ' +
        status +
        ' ,';
    }
    if (makeExists.makeDescription != makeDescription) {
      message =
        message +
        ' makeDescription changed from ' +
        makeExists.makeDescription +
        ' to ' +
        makeDescription +
        ' ,';
    }
    message = message.slice(0, -1);

    const companyIds = new Set(companyId.map(item => item.id));
    const editCompanyIds = new Set(editCompanyList.map(item => item.companyId));

    const inCompanyOnly = companyId.filter(item => !editCompanyIds.has(item.id));
    const inEditCompanyOnly = editCompanyList.filter(item => !companyIds.has(item.companyId));

    console.log("inCompanyOnly", inCompanyOnly);
    console.log("inEditCompanyOnly", inEditCompanyOnly);

    for(const company of inCompanyOnly) {
      await MakeDao.addMakeCompanyById(company.id, id, user.id);
    }

    for(const company of inEditCompanyOnly) {
      await MakeDao.deleteMakeCompanyById(company.id);
    }

    data = await MakeDao.updateMake(
      id,
      makeName,
      makeDescription,
      status,
      user.id
    );
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Make service updateMake Error:', err);
    next(err);
  }
  return data;
};

const MakeService = {
  addMake,
  findByName,
  addMakeCompanyMap,
  removeMakeCompanyMap,
  findOne,
  updateMake,
  getAllMakes,
  getOneMake,
  listMakes,
  findByName_Id,
  updateMakeNew
};

export default MakeService;
