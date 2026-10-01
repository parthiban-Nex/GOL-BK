import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const TyreOem = db.tyreOem;

const addTyreOem = async (data, user) => {
  try {
    return await TyreOem.create({
      OEM_NAME: data.oemName,
      STATUS: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('TyreOem dao addTyreOem Error:', err);
    next(err);
  }
};

const updateTyreOem = async (id, reqData, user) => {
  let data = {};
  try {
    data = await TyreOem.update(
      {
        OEM_NAME: reqData.oemName,
        STATUS: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('TyreOem dao updateTyreOem Error:', err);
    next(err);
  }
  return data;
};

const getTyreOem = async (id) => {
  try {
    const tyreOem = await TyreOem.findOne({
      where: { id: id },
    });
    if (!tyreOem) {
      throw new notFoundException();
    }
    return tyreOem;
  } catch (err) {
    logger.error('TyreOem dao getTyreOem', err);
    next(err);
  }
};

const listTyreOems = async (reqData) => {
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
    const { count, rows } = await TyreOem.findAndCountAll({
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
    logger.error('TyreOem dao listTyreOems', err);
    console.log(err);
  }
};

const deleteTyreOem = async (id, user) => {
  let data = {};
  try {
    data = await TyreOem.update(
      {
        STATUS: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('TyreOem dao deleteTyreOem Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (OEM_NAME) => {
  try {
    return await TyreOem.findOne({ where: { OEM_NAME: OEM_NAME } });
  } catch (err) {
    logger.error('TyreOem dao findByCode Error:', err);
    next(err);
  }
};

const checkUnique = async (OEM_NAME, id) => {
  let data = '';
  try {
    data = await TyreOem.findOne({
      where: {
        OEM_NAME: OEM_NAME,
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
  addTyreOem,
  updateTyreOem,
  getTyreOem,
  listTyreOems,
  deleteTyreOem,
  findByCode,
  checkUnique,
};

export default dao;
