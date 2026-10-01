import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const DockField = db.dockFields;
const InputType = db.inputTypes;

const addDockFields = async (data, user) => {
  try {
    return await DockField.create({
      LABEL: data.label,
      INPUT_TYPE: data.inputType,
      INPUT_VALUES: data.inputValues ? data.inputValues : '',
      IS_MANDATORY: data.isMandatory,
      STATUS: data.status ? data.status : 1,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('DockFields dao addDockFields Error:', err);
    next(err);
  }
};

const updateDockFields = async (reqData, user) => {
  let data = {};
  try {
    data = await DockField.update(
      {
        LABEL: reqData.label,
        STATUS: reqData.status,
        INPUT_VALUES: reqData.inputValues
          ? JSON.stringify(reqData.inputValues)
          : '',
        IS_MANDATORY: reqData.isMandatory,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: reqData.id } }
    );
  } catch (err) {
    logger.error('DockFields dao updateDockFields Error:', err);
    next(err);
  }
  return data;
};

const getDockFields = async (id) => {
  try {
    const dockFields = await DockField.findOne({
      where: { ID: id, STATUS: 1 },
    });
    if (!dockFields) {
      throw new notFoundException();
    }
    return dockFields;
  } catch (err) {
    logger.error('dockFields dao getDockFields', err);
  }
};

const listDockFields = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ LABEL: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const { count, rows } = await DockField.findAndCountAll({
      limit,
      offset,
      where: {
        ...searchCondition,
        STATUS: 1,
      },
      order: [['ID', 'DESC']],
      attributes: [
        'ID',
        'LABEL',
        'INPUT_TYPE',
        'INPUT_VALUES',
        'IS_MANDATORY',
        'STATUS',
      ],
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

const listInputTypes = async (reqData) => {
  const offset = reqData.offset;
  const limit = reqData.limit;
  try {
    const data = await InputType.findAll({
      limit,
      offset,
      order: [['ID', 'DESC']],
      attributes: ['ID', 'NAME'],
    });
    return data;
  } catch (err) {
    logger.error('PICKUP_TYPE dao listTyreSizes', err);
    console.log(err);
  }
};

const deleteDockFields = async (id, user) => {
  let data = {};
  try {
    data = await DockField.update(
      {
        STATUS: 0,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('TyreSize dao deletePickupType Error:', err);
    next(err);
  }
  return data;
};

const findByDockLabel = async (label) => {
  return await DockField.findOne({
    where: {
      LABEL: label,
      STATUS: 1,
    },
  });
};

const findByDockLabel_Id = async (label, id) => {
  let data = '';
  try {
    data = await DockField.findOne({
      where: {
        LABEL: label,
        STATUS: 1,
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
  addDockFields,
  getDockFields,
  updateDockFields,
  listDockFields,
  deleteDockFields,
  findByDockLabel,
  findByDockLabel_Id,
  listInputTypes,
};

export default dao;
