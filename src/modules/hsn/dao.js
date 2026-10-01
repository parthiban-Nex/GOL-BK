import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const RecentAcivity = db.recentActivity;

const Hsn = db.hsns;

const addHsn = async (hsn, user) => {
  let data = {};
  try {
    data = await Hsn.create({
      hsnCode: hsn.hsnCode,
      tax: hsn.tax,
      status: hsn.status,
      createdBy: user.id,
    });
    RecentAcivity.create({
      activity_type: 'Create',
      message: data.hsnCode + ' Hsn is created ',
      menu_name: 'hsn',
      createdBy: user.id,
      username: user.employeeCode,
    });
  } catch (err) {
    logger.error('Hsn dao addHsn Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (hsnCode) => {
  try {
    return await Hsn.findOne({ where: { hsnCode: hsnCode } });
  } catch (err) {
    logger.error('Hsn dao findByCode Error:', err);
    next(err);
  }
};

const getAllHsn = async () => {
  try {
    const data = await Hsn.findAll({
      attributes: ['id', 'hsnCode', 'tax', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Hsn dao getAllHsn Error:', err);
    next(err);
  }
};

const getHsn = async (id) => {
  try {
    const hsn = await Hsn.findOne({
      where: { id: id },
      attributes: ['id', 'hsnCode', 'tax', 'status'],
    });
    if (!hsn) {
      throw new notFoundException();
    }
    return hsn;
  } catch (err) {
    logger.error('Hsn dao getHsn Error:', err);
    next(err);
  }
};

const updateHsn = async (id, hsnCode, tax, status, userId) => {
  try {
    return await Hsn.update(
      {
        hsnCode: hsnCode,
        tax: tax,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Hsn dao updateHsn Error:', err);
    next(err);
  }
};

const deleteHsn = async (id) => {
  try {
    const data = await Hsn.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Hsn dao deleteHsn Error:', err);
    next(err);
  }
};

const listHsn = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ hsnCode: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const { count, rows } = await Hsn.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'hsnCode', 'tax', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Hsn dao listHsn Error:', err);
    next(err);
  }
};
const checkUnique = async (hsnCode, id) => {
  let data = '';
  try {
    data = await Hsn.findOne({
      where: {
        hsnCode: hsnCode,
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
  addHsn,
  findByCode,
  getAllHsn,
  getHsn,
  updateHsn,
  deleteHsn,
  listHsn,
  checkUnique,
};

export default dao;
