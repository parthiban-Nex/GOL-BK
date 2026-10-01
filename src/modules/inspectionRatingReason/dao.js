import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InspectionRatingReason = db.inspectionRatingReason;

const addInspectionRatingReason = async (data, user) => {
  try {
    return await InspectionRatingReason.create({
      INSPECTION_TYPE: data.inspectionType,
      CHECKLIST_TYPE_CODE: data.checkListTypeCode,
      CHECKLIST_VERSION: data.checkListVersion,
      PARAM_CODE: data.paramCode,
      RATING_REASON_CODE: data.ratingReasonCode,
      RATING_REASON_DESC: data.ratingReasonDesc,
      REASON_CRITICALITY: data.reasonCriticality,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error(
      'InspectionRatingReason dao addInspectionRatingReason Error:',
      err
    );
    next(err);
  }
};

const updateInspectionRatingReason = async (id, data, user) => {
  let dataObj = {};
  try {
    dataObj = await InspectionRatingReason.update(
      {
        INSPECTION_TYPE: data.inspectionType,
        CHECKLIST_TYPE_CODE: data.checkListTypeCode,
        CHECKLIST_VERSION: data.checkListVersion,
        PARAM_CODE: data.paramCode,
        RATING_REASON_CODE: data.ratingReasonCode,
        RATING_REASON_DESC: data.ratingReasonDesc,
        REASON_CRITICALITY: data.reasonCriticality,
        ACTIVE: data.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_RATING_REASON_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionRatingReason dao updateInspectionRatingReason Error:',
      err
    );
    next(err);
  }
  return dataObj;
};

const getInspectionRatingReason = async (id) => {
  try {
    const inspectionCheckList = await InspectionRatingReason.findOne({
      where: { UNIQUE_RATING_REASON_ID: id },
    });
    if (!inspectionCheckList) {
      throw new notFoundException();
    }
    return inspectionCheckList;
  } catch (err) {
    logger.error('InspectionRatingReason dao getInspectionRatingReason', err);
    next(err);
  }
};

const listInspectionRatingReasons = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { RATING_REASON_CODE: { [Op.like]: `%${searchKey}%` } },
            { RATING_REASON_DESC: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await InspectionRatingReason.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['UNIQUE_RATING_REASON_ID', 'DESC']],
      attributes: [
        'UNIQUE_RATING_REASON_ID',
        'INSPECTION_TYPE',
        'CHECKLIST_TYPE_CODE',
        'CHECKLIST_VERSION',
        'PARAM_CODE',
        'RATING_REASON_CODE',
        'RATING_REASON_DESC',
        'REASON_CRITICALITY',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('InspectionRatingReason dao listInspectionRatingReasons', err);
    console.log(err);
  }
};

const deleteInspectionRatingReason = async (id, user) => {
  let data = {};
  try {
    data = await InspectionRatingReason.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_RATING_REASON_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionRatingReason dao deleteInspectionRatingReason Error:',
      err
    );
    next(err);
  }
  return data;
};

const findByCode = async (RATING_REASON_CODE) => {
  try {
    return await InspectionRatingReason.findOne({
      where: { RATING_REASON_CODE: RATING_REASON_CODE },
    });
  } catch (err) {
    logger.error('InspectionRatingReason dao findByCode Error:', err);
    next(err);
  }
};

const getAllInspectionRatingReasons = async () => {
  try {
    const data = await InspectionRatingReason.findAll({
      where: { ACTIVE: true },
      order: [['UNIQUE_RATING_REASON_ID', 'DESC']],
      attributes: ['UNIQUE_RATING_REASON_ID', 'RATING_REASON_CODE'],
    });
    return data;
  } catch (err) {
    logger.error('InspectionRatingReason dao getAllInspectionCheckList', err);
    console.log(err);
  }
};

const checkUnique = async (RATING_REASON_CODE, id) => {
  let data = '';
  try {
    data = await InspectionRatingReason.findOne({
      where: {
        RATING_REASON_CODE: RATING_REASON_CODE,
        UNIQUE_RATING_REASON_ID: {
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
  addInspectionRatingReason,
  updateInspectionRatingReason,
  getInspectionRatingReason,
  listInspectionRatingReasons,
  deleteInspectionRatingReason,
  findByCode,
  getAllInspectionRatingReasons,
  checkUnique,
};

export default dao;
