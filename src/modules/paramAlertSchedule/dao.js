import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InspectionCheckList = db.inspectionChekList;
const ParamAlertSchedules = db.paramAlertSchedules;

const addParamAlertSchedule = async (data, user) => {
  try {
    return await ParamAlertSchedules.create({
      INSPECTION_TYPE: data.inspectionType,
      CHECKLIST_TYPE_CODE: data.checklistTypeCode,
      CHECKLIST_VERSION: data.checklistVersion,
      PARAM_CODE: data.paramCode,
      PARAM_RATING: data.paramRating,
      LIFE_REMAINING: data.lifeRemaining,
      ACTIVE: data.active,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('ParamAlertSchedule dao addParamAlertSchedule Error:', err);
    next(err);
  }
};

const updateParamAlertSchedule = async (id, data, user) => {
  let dataObj = {};
  try {
    dataObj = await ParamAlertSchedules.update(
      {
        INSPECTION_TYPE: data.inspectionType,
        CHECKLIST_TYPE_CODE: data.checklistTypeCode,
        CHECKLIST_VERSION: data.checklistVersion,
        PARAM_CODE: data.paramCode,
        PARAM_RATING: data.paramRating,
        LIFE_REMAINING: data.lifeRemaining,
        ACTIVE: data.active,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_PARAM_PRIORITY_ID: id } }
    );
  } catch (err) {
    logger.error('ParamAlertSchedule dao updateParamAlertSchedule Error:', err);
    next(err);
  }
  return dataObj;
};

const getParamAlertSchedule = async (id) => {
  try {
    const paramAlertScheduleList = await ParamAlertSchedules.findOne({
      where: { UNIQUE_PARAM_PRIORITY_ID: id },
    });
    if (!paramAlertScheduleList) {
      throw new notFoundException();
    }
    return paramAlertScheduleList;
  } catch (err) {
    logger.error('ParamAlertSchedule dao getParamAlertSchedule', err);
    next(err);
  }
};

const listParamAlertSchedule = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { PARAM_CODE: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await ParamAlertSchedules.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['UNIQUE_PARAM_PRIORITY_ID', 'DESC']],
      attributes: [
        'UNIQUE_PARAM_PRIORITY_ID',
        'INSPECTION_TYPE',
        'CHECKLIST_TYPE_CODE',
        'CHECKLIST_VERSION',
        'PARAM_CODE',
        'PARAM_RATING',
        'LIFE_REMAINING',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('ParamAlertSchedule dao listParamAlertSchedule', err);
  }
};

const deleteParamAlertSchedule = async (id, user) => {
  let data = {};
  try {
    data = await ParamAlertSchedules.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_PARAM_PRIORITY_ID: id } }
    );
  } catch (err) {
    logger.error('ParamAlertSchedule dao deleteParamAlertSchedule Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (PARAM_CODE) => {
  try {
    return await ParamAlertSchedules.findOne({
      where: { PARAM_CODE: PARAM_CODE, ACTIVE: 1 },
    });
  } catch (err) {
    logger.error('ParamAlertSchedule dao findByCode Error:', err);
    next(err);
  }
};

const getAllInspectionCheckList = async () => {
  try {
    const data = await InspectionCheckList.findAll({
      where: { ACTIVE: true },
      order: [['UNIQUE_PARAM_ID', 'DESC']],
      attributes: ['UNIQUE_PARAM_ID', 'PARAM_CODE'],
    });
    return data;
  } catch (err) {
    logger.error('InspectionCheckList dao getAllInspectionCheckList', err);
    console.log(err);
  }
};

const checkUnique = async (PARAM_CODE, id) => {
  let data = '';
  try {
    data = await ParamAlertSchedules.findOne({
      where: {
        PARAM_CODE: PARAM_CODE,
        UNIQUE_PARAM_PRIORITY_ID: {
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
  addParamAlertSchedule,
  updateParamAlertSchedule,
  getParamAlertSchedule,
  listParamAlertSchedule,
  deleteParamAlertSchedule,
  getAllInspectionCheckList,
  findByCode,
  checkUnique,
};

export default dao;
