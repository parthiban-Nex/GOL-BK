import dao from './dao.js';
import logger from '../../config/logger.js';

const listPickup = async (reqData, user) => {
  return await dao.listPickup(reqData, user);
};

const getPickup = async (id) => {
  return await dao.getPickup(id);
};

const savePickup = async (reqData) => {
  return await dao.savePickup(reqData);
};

const listDropoff = async (reqData, user) => {
  return await dao.listDropoff(reqData, user);
};

const getDropoff = async (id) => {
  return await dao.getDropoff(id);
};

const saveDropoff = async (reqData) => {
  return await dao.saveDropoff(reqData);
};

const getJcDropoff = async (transId) => {
  return await dao.getJcDropoff(transId);
};

const saveJcDropoff = async (reqData) => {
  return await dao.saveJcDropoff(reqData);
};

const listDrivers = async () => {
  return await dao.listDrivers();
};

const setDropStatus = async (transactionId, isDrop) => {
  return await dao.setDropStatus(transactionId, isDrop);
};

export default {
  listPickup,
  getPickup,
  savePickup,
  listDropoff,
  getDropoff,
  saveDropoff,
  getJcDropoff,
  saveJcDropoff,
  listDrivers,
  setDropStatus,
};
