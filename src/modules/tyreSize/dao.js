import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const TyreSize = db.tyreSize;

const addTyreSize = async (data, user) => {
  try {
    return await TyreSize.create({
      TYRE_SIZE: data.tyreSize,
      STATUS: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('TyreSize dao addTyreSize Error:', err);
    next(err);
  }
};

const updateTyreSize = async (id, reqData, user) => {
  let data = {};
  try {
    data = await TyreSize.update(
      {
        TYRE_SIZE: reqData.tyreSize,
        STATUS: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('TyreSize dao updateTyreSize Error:', err);
    next(err);
  }
  return data;
};

const getTyreSize = async (id) => {
  try {
    const tyreSize = await TyreSize.findOne({
      where: { id: id },
    });
    if (!tyreSize) {
      throw new notFoundException();
    }
    return tyreSize;
  } catch (err) {
    logger.error('TyreSize dao getTyreSize', err);
    next(err);
  }
};

const listTyreSizes = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ TYRE_SIZE: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      STATUS: true,
    };
    const { count, rows } = await TyreSize.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'TYRE_SIZE', 'STATUS'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('TyreSize dao listTyreSizes', err);
    console.log(err);
  }
};

const deleteTyreSize = async (id, user) => {
  let data = {};
  try {
    data = await TyreSize.update(
      {
        STATUS: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('TyreSize dao deleteTyreSize Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (tyreSize) => {
  try {
    return await TyreSize.findOne({ where: { TYRE_SIZE: tyreSize } });
  } catch (err) {
    logger.error('TyreSize dao findByCode Error:', err);
    next(err);
  }
};

const checkUnique = async (TYRE_SIZE, id) => {
  let data = '';
  try {
    data = await TyreSize.findOne({
      where: {
        TYRE_SIZE: TYRE_SIZE,
        ID: {
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
  addTyreSize,
  getTyreSize,
  updateTyreSize,
  listTyreSizes,
  deleteTyreSize,
  findByCode,
  checkUnique,
};

export default dao;
