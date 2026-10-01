import service from './service.js';
import logger from '../../config/logger.js';

const listPickup = async (req, res, next) => {
  try {
    const data = await service.listPickup(req.body, req.user);
    res.status(200).send({ requestSuccessful: true, PickupData: data });
  } catch (err) {
    logger.error('pickupDropoff controller listPickup', err);
    next(err);
  }
};

const getPickup = async (req, res, next) => {
  try {
    const data = await service.getPickup(req.body.id);
    res.status(200).send({ requestSuccessful: true, data });
  } catch (err) {
    logger.error('pickupDropoff controller getPickup', err);
    next(err);
  }
};

const savePickup = async (req, res, next) => {
  try {
    const result = await service.savePickup(req.body);
    res.status(200).send({
      requestSuccessful: result.success !== false,
      message: result.success === false ? result.message : 'Pickup saved successfully',
      data: result,
    });
  } catch (err) {
    logger.error('pickupDropoff controller savePickup', err);
    next(err);
  }
};

const listDropoff = async (req, res, next) => {
  try {
    const data = await service.listDropoff(req.body, req.user);
    res.status(200).send({ requestSuccessful: true, DropoffData: data });
  } catch (err) {
    logger.error('pickupDropoff controller listDropoff', err);
    next(err);
  }
};

const getDropoff = async (req, res, next) => {
  try {
    const data = await service.getDropoff(req.body.id);
    res.status(200).send({ requestSuccessful: true, data });
  } catch (err) {
    logger.error('pickupDropoff controller getDropoff', err);
    next(err);
  }
};

const saveDropoff = async (req, res, next) => {
  try {
    const result = await service.saveDropoff(req.body);
    res.status(200).send({
      requestSuccessful: result.success !== false,
      message: result.success === false ? result.message : 'Dropoff saved successfully',
      data: result,
    });
  } catch (err) {
    logger.error('pickupDropoff controller saveDropoff', err);
    next(err);
  }
};

const getJcDropoff = async (req, res, next) => {
  try {
    const data = await service.getJcDropoff(req.body.transId);
    res.status(200).send({ requestSuccessful: true, data });
  } catch (err) {
    logger.error('pickupDropoff controller getJcDropoff', err);
    next(err);
  }
};

const saveJcDropoff = async (req, res, next) => {
  try {
    const result = await service.saveJcDropoff(req.body);
    res.status(200).send({
      requestSuccessful: result.success !== false,
      message: result.success === false ? result.message : 'Dropoff saved successfully',
      data: result,
    });
  } catch (err) {
    logger.error('pickupDropoff controller saveJcDropoff', err);
    next(err);
  }
};

const listDrivers = async (req, res, next) => {
  try {
    const data = await service.listDrivers();
    res.status(200).send({ requestSuccessful: true, data });
  } catch (err) {
    logger.error('pickupDropoff controller listDrivers', err);
    next(err);
  }
};

const setDropStatus = async (req, res, next) => {
  try {
    const result = await service.setDropStatus(
      req.body.transactionId,
      req.body.isDrop
    );
    res.status(200).send({
      requestSuccessful: true,
      message: 'Drop status updated',
      data: result,
    });
  } catch (err) {
    logger.error('pickupDropoff controller setDropStatus', err);
    next(err);
  }
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
