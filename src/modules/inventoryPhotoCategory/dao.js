import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const InventoryPhotoCategory = db.inventoryPhotoCategory;

const addInventoryPhotoCategory = async (data, user, link) => {
  try {
    return await InventoryPhotoCategory.create({
      VEHICLE_TYPE: data.vehicleType,
      CATEGORY_NAME: data.categoryName,
      ICON_LINK: link,
      IS_MANDATORY: data.isMandatory,
      MIN_COUNT: data.minCount,
      MAX_COUNT: data.maxCount,
      SORT_ORDER: data.sortOrder,
      ACTIVE: data.status,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory dao addInventoryPhotoCategory Error:',
      err
    );
  }
};

const updateInventoryPhotoCategory = async (id, data, user, link) => {
  let dataObj = {};
  try {
    dataObj = await InventoryPhotoCategory.update(
      {
        VEHICLE_TYPE: data.vehicleType,
        CATEGORY_NAME: data.categoryName,
        ICON_LINK: link,
        IS_MANDATORY: data.isMandatory,
        MIN_COUNT: data.minCount,
        MAX_COUNT: data.maxCount,
        SORT_ORDER: data.sortOrder,
        ACTIVE: data.status,
        UPDATED_BY: user.employeeCode,
      },
      { where: { CATEGORY_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory dao updateInventoryPhotoCategory Error:',
      err
    );
    next(err);
  }
  return dataObj;
};

const getInventoryPhotoCategory = async (id) => {
  try {
    const inventoryPhotoCategory = await InventoryPhotoCategory.findOne({
      where: { CATEGORY_ID: id },
    });
    if (!inventoryPhotoCategory) {
      throw new notFoundException();
    }
    return inventoryPhotoCategory;
  } catch (err) {
    logger.error('InventoryPhotoCategory dao getInventoryPhotoCategory', err);
    next(err);
  }
};

const listInventoryPhotoCategories = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ CATEGORY_NAME: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      ACTIVE: true,
    };
    const { count, rows } = await InventoryPhotoCategory.findAndCountAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['CATEGORY_ID', 'DESC']],
      attributes: [
        'CATEGORY_ID',
        'VEHICLE_TYPE',
        'CATEGORY_NAME',
        'ICON_LINK',
        'IS_MANDATORY',
        'MIN_COUNT',
        'MAX_COUNT',
        'SORT_ORDER',
        'ACTIVE',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory dao listInventoryPhotoCategories',
      err
    );
    console.log(err);
  }
};

const deleteInventoryPhotoCategory = async (id, user) => {
  let data = {};
  try {
    data = await InventoryPhotoCategory.update(
      {
        ACTIVE: false,
        UPDATED_BY: user.employeeCode,
      },
      { where: { CATEGORY_ID: id } }
    );
  } catch (err) {
    logger.error(
      'InspectionCheckList dao deleteInventoryPhotoCategory Error:',
      err
    );
    next(err);
  }
  return data;
};

const findByCode = async (CATEGORY_NAME) => {
  try {
    return await InventoryPhotoCategory.findOne({
      where: { CATEGORY_NAME: CATEGORY_NAME },
    });
  } catch (err) {
    logger.error('InventoryPhotoCategory dao findByCode Error:', err);
    next(err);
  }
};

const dao = {
  addInventoryPhotoCategory,
  updateInventoryPhotoCategory,
  getInventoryPhotoCategory,
  listInventoryPhotoCategories,
  deleteInventoryPhotoCategory,
  findByCode,
};
export default dao;
