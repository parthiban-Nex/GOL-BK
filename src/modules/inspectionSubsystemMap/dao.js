import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InspectionSubsystemMap = db.inspectionSubsystemMap;

const addInspectionSubsystem = async (data, user) => {
  try {
    return await InspectionSubsystemMap.create({
      CHECK_LIST_TYPE_CODE: data.checkListTypeCode,
      SUBSYSTEM_CODE: data.subSystemCode,
      SUBSYSTEM_NAME: data.subSystemName,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap dao addInspectionSubsystem Error:',
      err
    );
    next(err);
  }
};

const updateInspectionSubsystem = async (id, reqData, user) => {
  let data = {};
  try {
    data = await InspectionSubsystemMap.update(
      {
        CHECK_LIST_TYPE_CODE: reqData.checkListTypeCode,
        SUBSYSTEM_CODE: reqData.subSystemCode,
        SUBSYSTEM_NAME: reqData.subSystemName,
        ACTIVE: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { SUBSYSTEM_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionSubsystemMap dao updateInspectionSubsystem Error:',
      err
    );
    next(err);
  }
  return data;
};

const getInspectionSubsystem = async (id) => {
  try {
    const tyreOem = await InspectionSubsystemMap.findOne({
      where: { SUBSYSTEM_ID: id },
    });
    if (!tyreOem) {
      throw new notFoundException();
    }
    return tyreOem;
  } catch (err) {
    logger.error('InspectionSubsystemMap dao getInspectionSubsystem', err);
    next(err);
  }
};

const listInspectionSubsystem = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { SUBSYSTEM_CODE: { [Op.like]: `%${searchKey}%` } },
            { SUBSYSTEM_NAME: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await InspectionSubsystemMap.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['SUBSYSTEM_ID', 'DESC']],
      attributes: [
        'SUBSYSTEM_ID',
        'CHECK_LIST_TYPE_CODE',
        'SUBSYSTEM_CODE',
        'SUBSYSTEM_NAME',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('InspectionSubsystemMap dao listInspectionSubsystem', err);
    console.log(err);
  }
};

const deleteSubsystem = async (id, user) => {
  let data = {};
  try {
    data = await InspectionSubsystemMap.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { SUBSYSTEM_ID: id } }
    );
  } catch (err) {
    logger.error('InspectionSubsystemMap dao deleteSubsystem Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (SUBSYSTEM_CODE) => {
  try {
    return await InspectionSubsystemMap.findOne({
      where: { SUBSYSTEM_CODE: SUBSYSTEM_CODE },
    });
  } catch (err) {
    logger.error('InspectionSubsystemMap dao findByCode Error:', err);
    next(err);
  }
};

const getInspectionSubsystemMaps = async () => {
  try {
    const data = await InspectionSubsystemMap.findAll({
      where: { ACTIVE: true },
      order: [['SUBSYSTEM_ID', 'DESC']],
      attributes: ['SUBSYSTEM_ID', 'SUBSYSTEM_CODE'],
    });
    return data;
  } catch (err) {
    logger.error('InspectionSubsystemMap dao getInspectionSubsystemMaps', err);
    console.log(err);
  }
};

const checkUnique = async (SUBSYSTEM_CODE, id) => {
  let data = '';
  try {
    data = await InspectionSubsystemMap.findOne({
      where: {
        SUBSYSTEM_CODE: SUBSYSTEM_CODE,
        SUBSYSTEM_ID: {
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
  addInspectionSubsystem,
  updateInspectionSubsystem,
  getInspectionSubsystem,
  listInspectionSubsystem,
  deleteSubsystem,
  findByCode,
  getInspectionSubsystemMaps,
  checkUnique,
};

export default dao;
