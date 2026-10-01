import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const CheckListTypes = db.checkListTypes;
const CustomerAccountType = db.customerAccountType;
const VehicleType = db.VehicleTypes;

const addCheckListType = async (data, user) => {
  try {
    return await CheckListTypes.create({
      CHECKLIST_TYPE_CODE: data.checkListTypeCode,
      CHECKLIST_TYPE: data.checkListType,
      CHECKLIST_TYPE_CATEGORY: data.checkListTypeCategory,
      CUSTOMER_ACCOUNT_TYPE_ID: data.customerAccountTypeId,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('CheckListTypes dao addCheckListType Error:', err);
    next(err);
  }
};

const updateCheckListType = async (id, reqData, user) => {
  let data = {};
  try {
    data = await CheckListTypes.update(
      {
        CHECKLIST_TYPE_CODE: reqData.checkListTypeCode,
        CHECKLIST_TYPE: reqData.checkListType,
        CHECKLIST_TYPE_CATEGORY: reqData.checkListTypeCategory,
        CUSTOMER_ACCOUNT_TYPE_ID: reqData.customerAccountTypeId,
        ACTIVE: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('CheckListTypes dao updateCheckListType Error:', err);
    next(err);
  }
  return data;
};

const getCheckListType = async (id) => {
  try {
    const tyreOem = await CheckListTypes.findOne({
      where: { ID: id },
    });
    if (!tyreOem) {
      throw new notFoundException();
    }
    return tyreOem;
  } catch (err) {
    logger.error('CheckListTypes dao getCheckListType', err);
    next(err);
  }
};

const listCheckListTypes = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { CHECKLIST_TYPE_CODE: { [Op.like]: `%${searchKey}%` } },
            { CHECKLIST_TYPE: { [Op.like]: `%${searchKey}%` } },
            { CHECKLIST_TYPE_CATEGORY: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await CheckListTypes.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['ID', 'DESC']],
      attributes: [
        'ID',
        'CHECKLIST_TYPE_CODE',
        'CHECKLIST_TYPE',
        'CHECKLIST_TYPE_CATEGORY',
        'CUSTOMER_ACCOUNT_TYPE_ID',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('CheckListTypes dao listCheckListTypes', err);
    console.log(err);
  }
};

const deleteCheckListType = async (id, user) => {
  let data = {};
  try {
    data = await CheckListTypes.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('CheckListTypes dao deleteCheckListType Error:', err);
    next(err);
  }
  return data;
};

const findByCheckListCode = async (checkListCode) => {
  try {
    return await CheckListTypes.findOne({
      where: { CHECKLIST_TYPE_CODE: checkListCode },
    });
  } catch (err) {
    logger.error('CheckListTypes dao findByCheckListCode Error:', err);
    next(err);
  }
};

const getCustomerAccountTypes = async () => {
  try {
    const data = await CustomerAccountType.findAll();
    return data;
  } catch (err) {
    logger.error('CheckListTypes dao getCustomerAccountTypes Error:', err);
    next(err);
  }
};

const getCheckListTypes = async () => {
  try {
    const data = await CheckListTypes.findAll({
      where: { ACTIVE: true },
      order: [['ID', 'DESC']],
      attributes: ['ID', 'CHECKLIST_TYPE_CODE'],
    });
    return data;
  } catch (err) {
    logger.error('CheckListTypes dao getCheckListTypes', err);
    console.log(err);
  }
};

const checkUnique = async (CHECKLIST_TYPE_CODE, id) => {
  let data = '';
  try {
    data = await CheckListTypes.findOne({
      where: {
        CHECKLIST_TYPE_CODE: CHECKLIST_TYPE_CODE,
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

const getInspectionTypes = async () => {
  try {
    const data = await VehicleType.findAll({
      order: [['ID', 'DESC']],
      attributes: ['ID', 'VEHICLE_TYPE'],
    });
    return data;
  } catch (err) {
    logger.error('CheckListTypes dao getInspectionTypes', err);
    console.log(err);
  }
};

const dao = {
  addCheckListType,
  updateCheckListType,
  getCheckListType,
  listCheckListTypes,
  deleteCheckListType,
  findByCheckListCode,
  getCustomerAccountTypes,
  getCheckListTypes,
  checkUnique,
  getInspectionTypes,
};

export default dao;
