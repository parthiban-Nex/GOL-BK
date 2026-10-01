import logger from '../../config/logger.js';
import UomDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const getAllUomList = async (reqData) => {
  try {
    const data = await UomDao.getAllUomList(reqData);
    return data;
  } catch (err) {
    logger.error('Uom service getAllUomList Error:', err);
    next(err);
  }
};

const addUom = async (uom, user) => {
  try {
    return await UomDao.addUom(uom, user);
  } catch (err) {
    logger.error('Uom service addUom Error:', err);
    next(err);
  }
};

const getUom = async (id) => {
  try {
    const uom = await UomDao.getUom(id);
    return uom;
  } catch (err) {
    logger.error('Uom service getUom Error:', err);
    next(err);
  }
};

const updateUom = async (
  id,
  uomType,
  uomDescription,
  status,
  user,
  uomExists
) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Uom';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (uomExists.uomType != uomType) {
      message =
        message +
        ' uomType changed from ' +
        uomExists.uomType +
        ' to ' +
        uomType +
        ' ,';
    }
    if (uomExists.uomDescription != uomDescription) {
      message =
        message +
        ' uomDescription changed from ' +
        uomExists.uomDescription +
        ' to ' +
        uomDescription +
        ' ,';
    }
    if (uomExists.status != status) {
      message =
        message +
        ' status changed from ' +
        uomExists.status +
        ' to ' +
        status +
        ' ,';
    }
    message = message.slice(0, -1);

    data = await UomDao.updateUom(id, uomType, uomDescription, status, user.id);
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Uom service updateUom Error:', err);
    next(err);
  }
  return data;
};

const listUom = async () => {
  try {
    const data = await UomDao.listUom();
    return data;
  } catch (err) {
    logger.error('Uom service listUom Error:', err);
    next(err);
  }
};

const searchUomData = async (reqData) => {
  try {
    const data = await UomDao.searchUomData(reqData);
    return data;
  } catch (err) {
    logger.error('Uom service searchUomData Error:', err);
    next(err);
  }
};

const UomService = {
  getAllUomList,
  addUom,
  getUom,
  updateUom,
  listUom,
  searchUomData,
};

export default UomService;
