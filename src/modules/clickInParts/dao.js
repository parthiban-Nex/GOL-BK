import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const ClickInPart = db.clickInPart;

const addPart = async (data, user) => {
  try {
    return await ClickInPart.create({
      CLICKINS_NAME: data.clickinPartName,
      PANEL_NAME: data.panelName,
      STATUS: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('ClickInPart dao addPart Error:', err);
    next(err);
  }
};

const updatePart = async (id, reqData, user) => {
  let data = {};
  try {
    data = await ClickInPart.update(
      {
        CLICKINS_NAME: reqData.clickinPartName,
        PANEL_NAME: reqData.panelName,
        STATUS: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('ClickInPart dao updatePart Error:', err);
    next(err);
  }
  return data;
};

const getPart = async (id) => {
  try {
    const part = await ClickInPart.findOne({
      where: { ID: id },
    });
    if (!part) {
      throw new notFoundException();
    }
    return part;
  } catch (err) {
    logger.error('ClickInPart dao getPart', err);
    next(err);
  }
};

const listParts = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { CLICKINS_NAME: { [Op.like]: `%${searchKey}%` } },
            { PANEL_NAME: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      STATUS: true,
    };
    const { count, rows } = await ClickInPart.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['ID', 'DESC']],
      attributes: ['ID', 'CLICKINS_NAME', 'PANEL_NAME', 'STATUS'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('ClickInPart dao listParts', err);
    console.log(err);
  }
};

const deletePart = async (id, user) => {
  let data = {};
  try {
    data = await ClickInPart.update(
      {
        STATUS: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('ClickInPart dao deletePart Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (CLICKINS_NAME) => {
  try {
    return await ClickInPart.findOne({
      where: { CLICKINS_NAME: CLICKINS_NAME },
    });
  } catch (err) {
    logger.error('ClickInPart dao findByCode Error:', err);
    next(err);
  }
};

const checkUnique = async (CLICKINS_NAME, id) => {
  let data = '';
  try {
    data = await ClickInPart.findOne({
      where: {
        CLICKINS_NAME: CLICKINS_NAME,
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
  addPart,
  updatePart,
  getPart,
  listParts,
  deletePart,
  findByCode,
  checkUnique,
};

export default dao;
