import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const PredeliveryCheckList = db.predeliveryCheckList;

const addVehiclePredeliveryCheckList = async (data, user) => {
  try {
    return await PredeliveryCheckList.create({
      VEHICLE_PDC_CODE: data.vehiclePdcCode,
      VEHICLE_PDC_DESC: data.vehiclePdcDescription,
      VEHICLE_PDC_VER: data.vehiclePdcVersion,
      VEHICLE_TYPE: data.vehicleType,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error(
      'PredeliveryCheckList dao addVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
};

const updateVehiclePredeliveryCheckList = async (id, reqData, user) => {
  let data = {};
  try {
    data = await PredeliveryCheckList.update(
      {
        VEHICLE_PDC_CODE: reqData.vehiclePdcCode,
        VEHICLE_PDC_DESC: reqData.vehiclePdcDescription,
        VEHICLE_PDC_VER: reqData.vehiclePdcVersion,
        VEHICLE_TYPE: reqData.vehicleType,
        ACTIVE: reqData.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error(
      'PredeliveryCheckList dao updateVehiclePredeliveryCheckList Error:',
      err
    );
    next(err);
  }
  return data;
};

const getVehiclePredeliveryCheckList = async (id) => {
  try {
    const tyreOem = await PredeliveryCheckList.findOne({
      where: { id: id },
    });
    if (!tyreOem) {
      throw new notFoundException();
    }
    return tyreOem;
  } catch (err) {
    logger.error('PredeliveryCheckList dao getTyreOem', err);
    next(err);
  }
};

const listVehiclePredeliveryCheckLists = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { VEHICLE_PDC_CODE: { [Op.like]: `%${searchKey}%` } },
            { VEHICLE_PDC_DESC: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await PredeliveryCheckList.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'VEHICLE_PDC_CODE',
        'VEHICLE_PDC_DESC',
        'VEHICLE_PDC_VER',
        'VEHICLE_TYPE',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error(
      'PredeliveryCheckList dao listVehiclePredeliveryCheckLists',
      err
    );
    console.log(err);
  }
};

const deleteVehiclePredeliveryCheckList = async (id, user) => {
  let data = {};
  try {
    data = await PredeliveryCheckList.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('PredeliveryCheckList dao deleteTyreOem Error:', err);
    next(err);
  }
  return data;
};

const findByCode = async (VEHICLE_PDC_CODE) => {
  try {
    return await PredeliveryCheckList.findOne({
      where: { VEHICLE_PDC_CODE: VEHICLE_PDC_CODE },
    });
  } catch (err) {
    logger.error('PredeliveryCheckList dao findByCode Error:', err);
    next(err);
  }
};

const checkUnique = async (VEHICLE_PDC_CODE, id) => {
  let data = '';
  try {
    data = await PredeliveryCheckList.findOne({
      where: {
        VEHICLE_PDC_CODE: VEHICLE_PDC_CODE,
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
  addVehiclePredeliveryCheckList,
  updateVehiclePredeliveryCheckList,
  getVehiclePredeliveryCheckList,
  listVehiclePredeliveryCheckLists,
  deleteVehiclePredeliveryCheckList,
  findByCode,
  checkUnique,
};

export default dao;
