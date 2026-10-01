import HsnDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addHsn = async (hsn, user) => {
  try {
    return await HsnDao.addHsn(hsn, user);
  } catch (err) {
    logger.error('Hsn service addHsn Error:', err);
    next(err);
  }
};

const findByCode = async (hsnCode) => {
  try {
    return await HsnDao.findByCode(hsnCode);
  } catch (err) {
    logger.error('Hsn service findByCode Error:', err);
    next(err);
  }
};

const getAllHsn = async () => {
  try {
    const data = await HsnDao.getAllHsn();
    return data;
  } catch (err) {
    logger.error('Hsn service getAllHsn Error:', err);
    next(err);
  }
};

const getHsn = async (id) => {
  try {
    const hsn = await HsnDao.getHsn(id);
    return hsn;
  } catch (err) {
    logger.error('Hsn service getHsn Error:', err);
    next(err);
  }
};

const updateHsn = async (id, hsnCode, tax, status, user, hsnExists) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Hsn';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;
    if (hsnExists.hsnCode != hsnCode) {
      message =
        message +
        ' hsnCode changed from ' +
        hsnExists.hsnCode +
        ' to ' +
        hsnCode +
        ' ,';
    }
    if (hsnExists.tax != tax) {
      message =
        message + ' tax changed from ' + hsnExists.tax + ' to ' + tax + ' ,';
    }
    if (hsnExists.status != status) {
      message =
        message +
        ' status changed from ' +
        hsnExists.status +
        ' to ' +
        status +
        ' ,';
    }
    message = message.slice(0, -1);
    data = await HsnDao.updateHsn(id, hsnCode, tax, status, user.id);
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Hsn service updateHsn Error:', err);
    next(err);
  }
  return data;
};

const deleteHsn = async (id) => {
  try {
    const data = await HsnDao.deleteHsn(id);
    return data;
  } catch (err) {
    logger.error('Hsn service deleteHsn Error:', err);
    next(err);
  }
};

const listHsn = async (reqData) => {
  try {
    const data = await HsnDao.listHsn(reqData);
    return data;
  } catch (err) {
    logger.error('Hsn service listHsn Error:', err);
    next(err);
  }
};

const HsnService = {
  addHsn,
  findByCode,
  getAllHsn,
  getHsn,
  updateHsn,
  deleteHsn,
  listHsn,
};

export default HsnService;
