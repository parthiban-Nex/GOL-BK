import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const BatteryOem = db.batteryOem;

const addBatteryOem = async (data, user) => {
  try {
    return await BatteryOem.create({
      OEM_NAME: data.oemName,
      STATUS: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('BatteryOem dao addBatteryOem Error:', err);
    next(err);
  }
};

const updateBatteryOem = async (id, reqData, user) => {
  let data = {};
  try {
    data = await BatteryOem.update(
      {
        OEM_NAME: reqData.oemName,
        STATUS: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('BatteryOem dao updateBatteryOem Error:', err);
    next(err);
  }
  return data;
};

const getBatteryOem = async (id) => {
  try {
    const tyreOem = await BatteryOem.findOne({
      where: { id: id },
    });
    if (!tyreOem) {
      throw new notFoundException();
    }
    return tyreOem;
  } catch (err) {
    logger.error('BatteryOem dao getBatteryOem', err);
    next(err);
  }
};

const listBatteryOems = async (reqData) => {
  const offset = reqData.offset;
  const limit = reqData.limit;
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ OEM_NAME: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      STATUS: true,
    };
    const { count, rows } = await BatteryOem.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'OEM_NAME', 'STATUS'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('BatteryOem dao listBatteryOems', err);
    console.log(err);
  }
};

const deleteBatteryOem = async (id, user) => {
  let data = {};
  try {
    data = await BatteryOem.update(
      {
        STATUS: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('BatteryOem dao deleteBatteryOem Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (OEM_NAME) => {
  try {
    return await BatteryOem.findOne({ where: { OEM_NAME: OEM_NAME } });
  } catch (err) {
    logger.error('BatteryOem dao findByCode Error:', err);
    next(err);
  }
};

const checkUnique = async (OEM_NAME, id) => {
  let data = '';
  try {
    data = await BatteryOem.findOne({
      where: {
        OEM_NAME: OEM_NAME,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const dao = {
  addBatteryOem,
  updateBatteryOem,
  getBatteryOem,
  listBatteryOems,
  deleteBatteryOem,
  findByCode,
  checkUnique,
};

export default dao;
