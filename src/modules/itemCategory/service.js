import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import ItemCategorieDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Op } from 'sequelize';

const ItemCategorie = db.itemcategories;

const addItemCategorie = async (itemcategorie, user) => {
  let result = 'failed';
  let recentActivityData = {};
  try {
    const data = await ItemCategorieDao.addItemCategorie(
      itemcategorie,
      user.id
    );
    if (data) {
      recentActivityData['activity_type'] = 'Add';
      recentActivityData['menu_name'] = 'ItemCategory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        itemcategorie.itemCategorie + ' Item Category is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (error) {
    logger.error('ItemCategoryService addItemCategorie():', error);
    throw error;
  }
  return result;
};

const findByCode_Id = async (itemCategorie, id) => {
  let data = '';
  try {
    data = await ItemCategorie.findOne({
      where: {
        itemCategorie: itemCategorie,
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

const findByCode = async (itemCategorie) => {
  return await ItemCategorie.findOne({
    where: { itemCategorie: itemCategorie },
  });
};

const getAllItemCategorie = async () => {
  const data = await ItemCategorie.findAll({
    attributes: ['id', 'itemCategorie', 'itemCategorieDescription', 'status'],
  });
  return data;
};

const getItemCategorieList = async (reqData) => {
  try {
    const { totalItems, data } =
      await ItemCategorieDao.getItemCategorieList(reqData);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('ItemCategoryList getItemCategorieList:', err);
    throw err;
  }
};

const updateItemCategorie = async (
  id,
  itemCategorie,
  itemCategorieDescription,
  status,
  user
) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const itemCategorieExists = await ItemCategorieDao.getItemCategorie(id);
    if (itemCategorieExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'ItemCategory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (itemCategorieExists.itemCategorie != itemCategorie) {
        message =
          message +
          ' itemCategorie changed from ' +
          itemCategorieExists.itemCategorie +
          ' to ' +
          itemCategorie +
          ' ,';
      }
      if (
        itemCategorieExists.itemCategorieDescription != itemCategorieDescription
      ) {
        message =
          message +
          ' itemCategorieDescription changed from ' +
          itemCategorieExists.itemCategorieDescription +
          ' to ' +
          itemCategorieDescription +
          ' ,';
      }
      if (itemCategorieExists.status != status) {
        message =
          message +
          ' status changed from ' +
          itemCategorieExists.status +
          ' to ' +
          status +
          ' ,';
      }

      const data = ItemCategorieDao.updateItemCategorie(
        id,
        itemCategorie,
        itemCategorieDescription,
        status,
        user.id
      );
      result = !data ? 'failed' : 'success';
      recentActivityData['message'] = message;
      if (message && data) {
        const recent =
          await RecentAcivityService.addRecentActivity(recentActivityData);
      }
    }
  } catch (err) {
    logger.error('Error adding item category:', err);
    throw err;
  }

  return result;
};

const deleteItemCategorie = async (id) => {
  const data = await ItemCategorie.destroy({ where: { id: id } });
  return data;
};

const ItemCategorieService = {
  addItemCategorie,
  findByCode,
  getAllItemCategorie,
  getItemCategorieList,
  updateItemCategorie,
  deleteItemCategorie,
  findByCode_Id,
};

export default ItemCategorieService;
