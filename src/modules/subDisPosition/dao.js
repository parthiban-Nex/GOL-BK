import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const SubDisPosition = db.subdispositions;
const DisPosition = db.dispositions;

const addSubDisPosition = async (subDisPosition, userId) => {
  let data = {};
  try {
    data = await SubDisPosition.create({
      disPositionId: subDisPosition.disPositionId,
      subDisPositionTitle: subDisPosition.subDisPositionTitle,
      subDisPositionCode: subDisPosition.subDisPositionCode,
      status: subDisPosition.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('SubDisPosition dao addSubDisPosition', err);
    next(err);
  }
  return data;
};

const updateSubDisPosition = async (id, subDisPosition, userId) => {
  let data = {};
  try {
    data = await SubDisPosition.update(
      {
        disPositionId: subDisPosition.disPositionId,
        subDisPositionTitle: subDisPosition.subDisPositionTitle,
        subDisPositionCode: subDisPosition.subDisPositionCode,
        status: subDisPosition.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('SubDisPosition dao updateSubDisPosition', err);
    next(err);
  }
  return data;
};

const listSubDisPositions = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { subDisPositionCode: { [Op.like]: `%${searchKey}%` } },
            { subDisPositionTitle: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await SubDisPosition.count({
      where: searchCondition,
    });
    const rows = await SubDisPosition.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'subDisPositionTitle', 'subDisPositionCode', 'status'],
      include: [{ model: DisPosition, as: 'dispositions' }],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('SubDisPosition dao listSubDisPositions', err);
    console.log(err);
  }
};

const getSubDisPosition = async (id) => {
  try {
    const subDisPosition = await SubDisPosition.findOne({
      where: {
        id: id,
      },
      include: [{ model: DisPosition, as: 'dispositions' }],
    });
    if (!subDisPosition) {
      throw new notFoundException();
    }
    return subDisPosition;
  } catch (err) {
    logger.error('SubDisPosition dao getSubDisPosition', err);
    next(err);
  }
};

const getDisPosition = async (id) => {
  try {
    const data = await DisPosition.findOne({
      where: {
        id: id,
      },
    });
    if (!data) {
      throw new notFoundException();
    }
    return data;
  } catch (err) {
    logger.error('SubDisPosition dao getDisPosition', err);
    next(err);
  }
};

const deleteSubDisPosition = async (id) => {
  try {
    const data = await SubDisPosition.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('SubDisPosition dao deleteSubDisPosition', err);
    console.log(err);
  }
};

const findBySubDisPositionCode = async (subDisPositionCode) => {
  try {
    const data = await SubDisPosition.findOne({
      where: { subDisPositionCode: subDisPositionCode },
    });
    return data;
  } catch (err) {
    logger.error('SubDisPosition dao findBySubDisPositionCode', err);
  }
};

const checkUnique = async (subDisPositionCode, id) => {
  let data = '';
  try {
    data = await SubDisPosition.findOne({
      where: {
        subDisPositionCode: subDisPositionCode,
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

const getCustomerSubDisPosition = async (id) => {
  try {
    const subDisPosition = await SubDisPosition.findAll({
      where: {
        disPositionId: id,
      },
      
    });
   
    return subDisPosition;
  } catch (err) {
    logger.error('SubDisPosition dao getSubDisPosition', err);
    next(err);
  }
};

const dao = {
  addSubDisPosition,
  updateSubDisPosition,
  listSubDisPositions,
  getSubDisPosition,
  getDisPosition,
  deleteSubDisPosition,
  findBySubDisPositionCode,
  checkUnique,
  getCustomerSubDisPosition
};

export default dao;
