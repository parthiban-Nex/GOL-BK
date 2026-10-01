import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const UomGroup = db.uom;
const RecentAcivity = db.recentActivity;

const getAllUomList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { uomType: { [Op.like]: `%${searchKey}%` } },
            { uomDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const { count, rows } = await UomGroup.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'uomType', 'uomDescription', 'status'],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Uom dao getAllUomList Error:', err);
    next(err);
  }
};

const addUom = async (uom, user) => {
  let data = {};
  try {
    data = await UomGroup.create({
      uomType: uom.uomType,
      uomDescription: uom.uomDescription,
      status: uom.status,
      createdBy: user.id,
    });
    RecentAcivity.create({
      activity_type: 'Create',
      message: data.uomType + ' Uom is created ',
      menu_name: 'uom',
      createdBy: user.id,
      username: user.employeeCode,
    });
  } catch (err) {
    logger.error('Uom dao addUom Error:', err);
    next(err);
  }
  return data;
};

const getUom = async (id) => {
  try {
    const uom = await UomGroup.findOne({ where: { id: id } });
    if (!uom) {
      throw new notFoundException();
    }
    return uom;
  } catch (err) {
    logger.error('Uom dao getUom Error:', err);
    next(err);
  }
};

const updateUom = async (id, uomType, uomDescription, status, userId) => {
  try {
    return await UomGroup.update(
      {
        uomType: uomType,
        uomDescription: uomDescription,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Uom dao updateUom Error:', err);
    next(err);
  }
};

const listUom = async () => {
  try {
    const data = await UomGroup.findAll({
      attributes: ['id', 'uomType', 'uomDescription', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Uom dao listUom Error:', err);
    next(err);
  }
};

const findByUomType = async (uomType) => {
  try {
    return await UomGroup.findOne({ where: { uomType: uomType } });
  } catch (err) {
    logger.error('Uom dao findByUomType', err);
    next(err);
  }
};

const checkUnique = async (uomType, id) => {
  let data = '';
  try {
    data = await UomGroup.findOne({
      where: {
        uomType: uomType,
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

const searchUomData = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { uomType: { [Op.like]: `%${searchKey}%` } },
            { uomDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const { count, rows } = await UomGroup.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'uomType', 'uomDescription', 'status'],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Uom dao getAllUomList Error:', err);
    next(err);
  }
};

const dao = {
  getAllUomList,
  addUom,
  getUom,
  updateUom,
  listUom,
  findByUomType,
  checkUnique,
  searchUomData,
};

export default dao;
