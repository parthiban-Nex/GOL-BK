import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InventoryCheckList = db.vehicleInventoryCheckList;
const VehicleType = db.VehicleTypes;

const addInventoryCheckList = async (data, user) => {
  try {
    return await InventoryCheckList.create({
      INVENTORY_CODE: data.inventoryCode,
      INVENTORY_DESC: data.inventoryDesc,
      INVENTORY_VER: data.inventoryVer,
      INVENTORY_TYPE: data.inventoryType,
      VEHICLE_TYPE: data.vehicleType,
      SORT_ORDER: data.sortOrder,
      ACTIVE: data.active,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('InventoryCheckList dao addInventoryCheckList Error:', err);
  }
};

const updateInventoryCheckList = async (reqData, user) => {
  let data = {};
  try {
    data = await InventoryCheckList.update(
      {
        INVENTORY_CODE: reqData.inventoryCode,
        INVENTORY_DESC: reqData.inventoryDesc,
        INVENTORY_VER: reqData.inventoryVer,
        INVENTORY_TYPE: reqData.inventoryType,
        VEHICLE_TYPE: reqData.vehicleType,
        SORT_ORDER: reqData.sortOrder,
        ACTIVE: reqData.active,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: reqData.id } }
    );
  } catch (err) {
    console.log(err);
    logger.error('InventoryCheckList dao updateInventoryCheckList Error:', err);
  }
  return data;
};

const getInventoryCheckList = async (id) => {
  try {
    const inventoryCheckList = await InventoryCheckList.findOne({
      where: { ID: id, ACTIVE: 1 },
    });
    if (!inventoryCheckList) {
      throw new notFoundException();
    }
    return inventoryCheckList;
  } catch (err) {
    logger.error('InventoryCheckList dao getInventoryCheckList', err);
  }
};

const listInventoryCheckList = async (reqData) => {
  const offset = reqData.offset;
  const limit = reqData.limit;
  try {
    const { searchKey, offset, limit } = reqData;
    const vehicleTypeCondition = reqData.vehicleType
      ? { VEHICLE_TYPE: String(reqData.vehicleType).trim().toUpperCase() }
      : {};
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { INVENTORY_CODE: { [Op.like]: `%${searchKey}%` } },
            { INVENTORY_DESC: { [Op.like]: `%${searchKey}%` } },
            { INVENTORY_TYPE: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const { count, rows } = await InventoryCheckList.findAndCountAll({
      limit,
      offset,
      where: {
        ...vehicleTypeCondition,
        ...searchCondition,
        ACTIVE: 1,
      },
      order: [['ID', 'DESC']],
      attributes: [
        'ID',
        'INVENTORY_CODE',
        'INVENTORY_DESC',
        'INVENTORY_VER',
        'INVENTORY_TYPE',
        'VEHICLE_TYPE',
        'SORT_ORDER',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('InventoryCheckList dao listInventoryCheckList', err);
    console.log(err);
  }
};

const deleteInventoryCheckList = async (id, user) => {
  let data = {};
  try {
    data = await InventoryCheckList.update(
      {
        ACTIVE: 0,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('InventoryCheckList dao deleteInventoryCheckList Error:', err);
    next(err);
  }
  return data;
};

const findByInventoryCode = async (inventoryCode) => {
  return await InventoryCheckList.findOne({
    where: {
      INVENTORY_CODE: inventoryCode,
      ACTIVE: 1,
    },
  });
};

const findByInventoryCode_Id = async (inventoryCode, id) => {
  let data = '';
  try {
    data = await InventoryCheckList.findOne({
      where: {
        INVENTORY_CODE: inventoryCode,
        ACTIVE: 1,
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

const listVehicleTypes = async (reqData) => {
  const offset = reqData.offset;
  const limit = reqData.limit;
  try {
    const data = await VehicleType.findAll({
      limit,
      offset,
      order: [['ID', 'DESC']],
      attributes: ['ID', 'VEHICLE_TYPE', 'VEHICLE_TYPE_DESCRIPTION'],
    });
    return data;
  } catch (err) {
    logger.error('PICKUP_TYPE dao listTyreSizes', err);
    console.log(err);
  }
};

const dao = {
  addInventoryCheckList,
  getInventoryCheckList,
  updateInventoryCheckList,
  listInventoryCheckList,
  deleteInventoryCheckList,
  findByInventoryCode,
  findByInventoryCode_Id,
  listVehicleTypes,
};

export default dao;
