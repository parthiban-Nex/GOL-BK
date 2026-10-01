import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import ItemGroupDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Op } from 'sequelize';

const ItemGroup = db.itemgroups;

const addItemGroup = async (itemgroup, user) => {
  let result = 'failed';
  let recentActivityData = {};
  try {
    const data = await ItemGroupDao.addItemGroup(itemgroup, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Add';
      recentActivityData['menu_name'] = 'ItemGroup';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        itemgroup.itemGroupCode + ' Item Group is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (error) {
    logger.error('Error adding item category:', error);
    throw error;
  }
  return result;
};

const findByCode = async (itemGroupCode) => {
  return await ItemGroup.findOne({ where: { itemGroupCode: itemGroupCode } });
};

const findByCode_Id = async (itemGroupCode, id) => {
  let data = '';
  try {
    data = await ItemGroup.findOne({
      where: {
        itemGroupCode: itemGroupCode,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const listItemGroup = async (reqData) => {
  try {
    const { totalItems, data } = await ItemGroupDao.listItemGroup(reqData);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (error) {
    logger.error('ItemGroupService listItemGroup:', error);
    throw error;
  }
};

const updateItemGroup = async (
  id,
  itemGroupCode,
  itemGroupDescription,
  status,
  user
) => {
  let result = 'failed';
  let message = '';
  let recentActivityData = {};
  try {
    const itemGroupExists = await ItemGroupDao.getItemGroup(id);
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'ItemGroup';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;

    if (itemGroupExists) {
      if (itemGroupExists.itemGroupCode != itemGroupCode) {
        message =
          message +
          ' itemGroupCode changed from ' +
          itemGroupExists.itemGroupCode +
          ' to ' +
          itemGroupCode +
          ' ,';
      }
      if (itemGroupExists.itemGroupDescription != itemGroupDescription) {
        message =
          message +
          ' itemGroupDescription changed from ' +
          itemGroupExists.itemGroupDescription +
          ' to ' +
          itemGroupDescription +
          ' ,';
      }
      if (itemGroupExists.status != status) {
        message =
          message +
          ' status changed from ' +
          itemGroupExists.status +
          ' to ' +
          status +
          ' ,';
      }

      message.slice(0, -1);
      const data = await ItemGroupDao.updateItemGroup(
        id,
        itemGroupCode,
        itemGroupDescription,
        status,
        user.id
      );
      result = !data ? 'failed' : 'success';
      if (message && data) {
        recentActivityData['message'] = message;
        const recent =
          await RecentAcivityService.addRecentActivity(recentActivityData);
      }
    }
  } catch (error) {
    logger.error('Item Group Service :', error);
    throw error;
  }
  return result;
};

const deleteItemGroup = async (id) => {
  const data = await ItemGroup.destroy({ where: { id: id } });
  return data;
};

const getAllItemGroup = async () => {
  const data = await ItemGroup.findAll({
    attributes: ['id', 'itemGroupCode', 'itemGroupDescription', 'status'],
  });
  return data;
};
const ItemGroupService = {
  addItemGroup,
  findByCode,
  getAllItemGroup,
  updateItemGroup,
  deleteItemGroup,
  listItemGroup,
  findByCode_Id,
};

export default ItemGroupService;
