import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const PickupType = db.pickupTypes;

const addPickupType = async (data, user) => {
  try {
    return await PickupType.create({
      PICKUP_TYPE: data.pickupType,
      STATUS: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('PickupType dao addPickupType Error:', err);
    next(err);
  }
};

const updatePickupType = async (reqData, user) => {
  let data = {};
  try {
    data = await PickupType.update(
      {
        PICKUP_TYPE: reqData.pickupType,
        STATUS: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { PICKUP_ID: reqData.id } }
    );
  } catch (err) {
    logger.error('PickupType dao updatePickupType Error:', err);
    next(err);
  }
  return data;
};

const getPickupType = async (id) => {
  try {
    const pickupType = await PickupType.findOne({
      where: { PICKUP_ID: id },
    });
    if (!pickupType) {
      throw new notFoundException();
    }
    return pickupType;
  } catch (err) {
    logger.error('TyreSize dao getTyreSize', err);
    next(err);
  }
};

const listPickupType = async (reqData) => {
  const offset = reqData.offset;
  const limit = reqData.limit;
  const searchKey = reqData.searchKey;
  const searchCondition = searchKey
    ? {
      [Op.or]: [
        { PICKUP_TYPE: { [Op.like]: `%${searchKey}%` } },
      ],
      STATUS: true
    }
  : { STATUS: true };
  try {
    const { count, rows } = await PickupType.findAndCountAll({
      limit,
      offset,
      where: searchCondition ,
      order: [['PICKUP_ID', 'DESC']],
      attributes: ['PICKUP_ID', 'PICKUP_TYPE', 'STATUS'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('PICKUP_TYPE dao listTyreSizes', err);
    console.log(err);
  }
};

const deletePickupType = async (id, user) => {
  let data = {};
  try {
    data = await PickupType.update(
      {
        STATUS: 0,
        UPDATED_BY: user.employeeCode,
      },
      { where: { PICKUP_ID: id } }
    );
  } catch (err) {
    logger.error('TyreSize dao deletePickupType Error:', err);
    next(err);
  }
  return data;
};

const findByPickupType = async (pickupType) => {
  return await PickupType.findOne({
    where: {
      PICKUP_TYPE: pickupType,
      STATUS: 1,
    },
  });
};

const dao = {
  addPickupType,
  getPickupType,
  updatePickupType,
  listPickupType,
  deletePickupType,
  findByPickupType,
};

export default dao;
