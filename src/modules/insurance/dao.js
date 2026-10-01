import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
const RecentAcivity = db.recentActivity;
import { Op } from 'sequelize';

const Insurance = db.insurances;

const findByName = async (insuranceName) => {
  try {
    return await Insurance.findOne({ where: { insuranceName: insuranceName } });
  } catch (err) {
    logger.error('Insurance dao findByName Error:', err);
    next(err);
  }
};
const addInsurance = async (insurance, userId) => {
  try {
    return await Insurance.create({
      insuranceName: insurance.insuranceName,
      status: insurance.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Insurance dao addInsurance Error:', err);
    next(err);
  }
};

const updateInsurance = async (id, insurance, userId) => {
  let data = {};
  try {
    data = await Insurance.update(
      {
        insuranceName: insurance.insuranceName,
        status: insurance.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Insurance dao updateInsurance:', err);
    next(err);
  }
  return data;
};

const getInsurance = async (id) => {
  try {
    const insurance = await Insurance.findOne({
      where: { id: id },
    });
    if (!insurance) {
      throw new notFoundException();
    }
    return insurance;
  } catch (err) {
    logger.error('Insurance dao getInsurance', err);
    next(err);
  }
};

const listInsurances = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ insuranceName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const { count, rows } = await Insurance.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'insuranceName', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Insurance dao listInsurances', err);
    console.log(err);
  }
};

const getAllInsurances = async () => {
  try {
    const data = await Insurance.findAll({
      attributes: ['id', 'insuranceName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Insurance dao getAllInsurances Error:', err);
    next(err);
  }
};

const checkUnique = async (insuranceName, id) => {
  let data = '';
  try {
    data = await Insurance.findOne({
      where: {
        insuranceName: insuranceName,
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
  findByName,
  addInsurance,
  getInsurance,
  updateInsurance,
  listInsurances,
  getAllInsurances,
  checkUnique,
};

export default dao;
