import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InspectionCheckList = db.inspectionChekList;
const InspectionSubsystemMap = db.inspectionSubsystemMap;
const InspectionRatingReason = db.inspectionRatingReason;

const getGroupedInspectionChecklist = async (checkListTypeCode) => {
  try {
    const [categories, checkpoints, ratings] = await Promise.all([
      InspectionSubsystemMap.findAll({
        where: { CHECK_LIST_TYPE_CODE: checkListTypeCode, ACTIVE: true },
        attributes: [
          'SUBSYSTEM_ID',
          'CHECK_LIST_TYPE_CODE',
          'SUBSYSTEM_CODE',
          'SUBSYSTEM_NAME',
          'ACTIVE',
        ],
        order: [['SUBSYSTEM_ID', 'ASC']],
        raw: true,
      }),
      InspectionCheckList.findAll({
        where: { CHECKLIST_TYPE_CODE: checkListTypeCode, ACTIVE: true },
        attributes: [
          'UNIQUE_PARAM_ID',
          'INSPECTION_TYPE',
          'CHECKLIST_TYPE_CODE',
          'CHECKLIST_VERSION',
          'PARAM_CODE',
          'PARAM_NAME',
          'RELATIVE_RANKING',
          'PARAM_WEIGHT',
          'SUB_SYSTEM_ID',
          'OPTIONAL',
          'SORT_ORDER',
          'VALUE_REQUIRED',
          'ACTIVE',
        ],
        order: [['SORT_ORDER', 'ASC'], ['UNIQUE_PARAM_ID', 'ASC']],
        raw: true,
      }),
      InspectionRatingReason.findAll({
        where: { CHECKLIST_TYPE_CODE: checkListTypeCode, ACTIVE: true },
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
        order: [['UNIQUE_RATING_REASON_ID', 'ASC']],
        raw: true,
      }),
    ]);

    const ratingOrder = { GOOD: 1, AVERAGE: 2, FAIR: 3 };
    const normalizeVersion = (version) =>
      version === null || version === undefined ? null : Number(version);

    return categories.map((category) => ({
      subsystemId: category.SUBSYSTEM_ID,
      subsystemCode: category.SUBSYSTEM_CODE,
      subsystemName: category.SUBSYSTEM_NAME,
      checkListTypeCode: category.CHECK_LIST_TYPE_CODE,
      status: category.ACTIVE,
      checkpoints: checkpoints
        .filter(
          (checkpoint) =>
            Number(checkpoint.SUB_SYSTEM_ID) === Number(category.SUBSYSTEM_ID)
        )
        .map((checkpoint) => ({
          id: checkpoint.UNIQUE_PARAM_ID,
          inspectionType: checkpoint.INSPECTION_TYPE,
          checkListTypeCode: checkpoint.CHECKLIST_TYPE_CODE,
          checkListVersion: checkpoint.CHECKLIST_VERSION,
          paramCode: checkpoint.PARAM_CODE,
          paramName: checkpoint.PARAM_NAME,
          relativeRanking: checkpoint.RELATIVE_RANKING,
          paramWeight: checkpoint.PARAM_WEIGHT,
          subsystemId: checkpoint.SUB_SYSTEM_ID,
          optional: checkpoint.OPTIONAL,
          sortOrder: checkpoint.SORT_ORDER,
          valueRequired: checkpoint.VALUE_REQUIRED,
          status: checkpoint.ACTIVE,
          ratingOptions: ratings
            .filter(
              (rating) =>
                rating.PARAM_CODE === checkpoint.PARAM_CODE &&
                rating.INSPECTION_TYPE === checkpoint.INSPECTION_TYPE &&
                normalizeVersion(rating.CHECKLIST_VERSION) ===
                  normalizeVersion(checkpoint.CHECKLIST_VERSION)
            )
            .sort((a, b) => {
              const orderA = ratingOrder[String(a.RATING_REASON_DESC).toUpperCase()] || 99;
              const orderB = ratingOrder[String(b.RATING_REASON_DESC).toUpperCase()] || 99;
              return orderA - orderB || a.UNIQUE_RATING_REASON_ID - b.UNIQUE_RATING_REASON_ID;
            })
            .map((rating) => ({
              id: rating.UNIQUE_RATING_REASON_ID,
              ratingReasonCode: rating.RATING_REASON_CODE,
              ratingReasonDesc: rating.RATING_REASON_DESC,
              reasonCriticality: rating.REASON_CRITICALITY,
              status: rating.ACTIVE,
            })),
        })),
    }));
  } catch (err) {
    logger.error('InspectionCheckList dao getGroupedInspectionChecklist', err);
    throw err;
  }
};

const addInspectionCheckList = async (data, user) => {
  try {
    return await InspectionCheckList.create({
      INSPECTION_TYPE: data.inspectionType,
      CHECKLIST_TYPE_CODE: data.checkListTypeCode,
      CHECKLIST_VERSION: data.checkListVersion,
      PARAM_CODE: data.paramCode,
      PARAM_NAME: data.paramName,
      RELATIVE_RANKING: data.relativeRanking,
      PARAM_WEIGHT: data.paramWeight,
      SUB_SYSTEM_ID: data.subSystemId,
      OPTIONAL: data.optional,
      SORT_ORDER: data.sortOrder,
      VALUE_REQUIRED: data.valueRequired,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('InspectionCheckList dao addInspectionCheckList Error:', err);
    next(err);
  }
};

const updateInspectionCheckList = async (id, data, user) => {
  let dataObj = {};
  try {
    dataObj = await InspectionCheckList.update(
      {
        INSPECTION_TYPE: data.inspectionType,
        CHECKLIST_TYPE_CODE: data.checkListTypeCode,
        CHECKLIST_VERSION: data.checkListVersion,
        PARAM_CODE: data.paramCode,
        PARAM_NAME: data.paramName,
        RELATIVE_RANKING: data.relativeRanking,
        PARAM_WEIGHT: data.paramWeight,
        SUB_SYSTEM_ID: data.subSystemId,
        OPTIONAL: data.optional,
        SORT_ORDER: data.sortOrder,
        VALUE_REQUIRED: data.valueRequired,
        ACTIVE: data.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_PARAM_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionCheckList dao updateInspectionCheckList Error:',
      err
    );
    next(err);
  }
  return dataObj;
};

const getInspectionCheckList = async (id) => {
  try {
    const inspectionCheckList = await InspectionCheckList.findOne({
      where: { UNIQUE_PARAM_ID: id },
    });
    if (!inspectionCheckList) {
      throw new notFoundException();
    }
    return inspectionCheckList;
  } catch (err) {
    logger.error('InspectionCheckList dao getInspectionCheckList', err);
    next(err);
  }
};

const listInspectionCheckList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { PARAM_CODE: { [Op.like]: `%${searchKey}%` } },
            { PARAM_NAME: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await InspectionCheckList.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['UNIQUE_PARAM_ID', 'DESC']],
      attributes: [
        'UNIQUE_PARAM_ID',
        'INSPECTION_TYPE',
        'CHECKLIST_TYPE_CODE',
        'CHECKLIST_VERSION',
        'PARAM_CODE',
        'PARAM_NAME',
        'RELATIVE_RANKING',
        'PARAM_WEIGHT',
        'SUB_SYSTEM_ID',
        'OPTIONAL',
        'SORT_ORDER',
        'VALUE_REQUIRED',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('InspectionCheckList dao listInspectionCheckList', err);
    console.log(err);
  }
};

const deleteInspectionCheckList = async (id, user) => {
  let data = {};
  try {
    data = await InspectionCheckList.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { UNIQUE_PARAM_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionCheckList dao deleteInspectionCheckList Error:',
      err
    );
    next(err);
  }
  return data;
};

const findByCode = async (PARAM_CODE) => {
  try {
    return await InspectionCheckList.findOne({
      where: { PARAM_CODE: PARAM_CODE },
    });
  } catch (err) {
    logger.error('InspectionCheckList dao findByCode Error:', err);
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
    data = await InspectionCheckList.findOne({
      where: {
        PARAM_CODE: PARAM_CODE,
        UNIQUE_PARAM_ID: {
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
  addInspectionCheckList,
  updateInspectionCheckList,
  getInspectionCheckList,
  listInspectionCheckList,
  deleteInspectionCheckList,
  getAllInspectionCheckList,
  getGroupedInspectionChecklist,
  findByCode,
  checkUnique,
};

export default dao;
