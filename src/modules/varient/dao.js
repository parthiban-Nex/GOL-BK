import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Varient = db.varients;
const FuelType = db.fueltypes;

const addVarient = async (varient, userId) => {
  try {
    return await Varient.create({
      // fuelType: varient.fuelType,
      varientName: varient.varientName,
      varientDescription: varient.varientDescription,
      status: varient.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Varient dao addVarient Error:', err);
    next(err);
  }
};

const getOneVarient = async (id) => {
  try {
    const varient = await Varient.findOne({ where: { id: id } });
    if (!varient) {
      throw new notFoundException();
    }
    return varient;
  } catch (err) {
    logger.error('Varient dao getOneVarient Error:', err);
    next(err);
  }
};

const updateVarient = async (id, varient, userId) => {
  try {
    return await Varient.update(
      {
        // fuelType: varient.fuelType,
        varientName: varient.varientName,
        varientDescription: varient.varientDescription,
        status: varient.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Varient dao updateVarient Error:', err);
    next(err);
  }
};

const listVarients = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { varientName: { [Op.like]: `%${searchKey}%` } },
            { varientDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const { count, rows } = await Varient.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'varientName',
        'varientDescription',
        // 'fuelType',
        'status',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Varient dao listVarients Error:', err);
    next(err);
  }
};

const getAllVarient = async () => {
  try {
    const data = await Varient.findAll({
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'varientName',
        'varientDescription',
        // 'fuelType',
        'status',
      ],
    });
    return data;
  } catch (err) {
    logger.error('Varient dao getAllVarient Error:', err);
    next(err);
  }
};

const findByvarientName = async (varientName) => {
  try {
    return await Varient.findOne({ where: { varientName: varientName } });
  } catch (err) {
    logger.error('Varient dao findByvarientName Error:', err);
    next(err);
  }
};

const deleteVarient = async (id) => {
  try {
    const data = await Varient.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Varient dao deleteVarient Error:', err);
    next(err);
  }
};

const getAllFuelType = async () => {
  try {
    const data = await FuelType.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'fuelTypeName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Varient dao deleteVarient Error:', err);
    next(err);
  }
};

const checkUnique = async (varientName, id) => {
  let data = '';
  try {
    data = await Varient.findOne({
      where: {
        varientName: varientName,
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
  addVarient,
  getOneVarient,
  updateVarient,
  listVarients,
  getAllVarient,
  findByvarientName,
  deleteVarient,
  getAllFuelType,
  checkUnique,
};

export default dao;
