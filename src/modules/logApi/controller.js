import logger from '../../config/logger.js';
import logservice from './service.js';
const saveAuditLog = async (req, res, next) => {
  try {
    logservice.createAuditLog(req, req.body);
    res.status(200).send({
      requestSuccessful: true,
      menuList: 'menulist',
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const getAuditLog = async (req, res, next) => {
  try {
    const { totalItems, rows } = await logservice.getAuditLog(req);

    res.status(200).send({
      requestSuccessful: true,
      totalItems: totalItems,
      data: rows,
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const controller = {
  saveAuditLog,
  getAuditLog,
};
export default controller;
