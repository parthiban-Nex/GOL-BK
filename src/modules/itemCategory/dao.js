import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const ItemCategorie = db.itemcategories;

const addItemCategorie = async (itemcategorie, userId) => {
  try {
    const newItemCategorie = await ItemCategorie.create({
      itemCategorie: itemcategorie.itemCategorie,
      itemCategorieDescription: itemcategorie.itemCategorieDescription,
      status: itemcategorie.status,
      createdBy: userId,
    });
    return newItemCategorie;
  } catch (error) {
    logger.error('Error adding item category:', error);
    throw error;
  }
};

const updateItemCategorie = async (
  id,
  itemCategorie,
  itemCategorieDescription,
  status,
  userId
) => {
  let data = {};
  try {
    data = await ItemCategorie.update(
      {
        itemCategorie: itemCategorie,
        itemCategorieDescription: itemCategorieDescription,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('ItemCategoryDao updateItemCategorie():', err);
    throw err;
  }
  return data;
};

const getItemCategorie = async (id) => {
  const itemcategorie = await ItemCategorie.findOne({ where: { id: id } });
  if (!itemcategorie) {
    throw new notFoundException();
  }
  return itemcategorie;
};

const getItemCategorieList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { itemCategorie: { [Op.like]: `%${searchKey}%` } },
            { itemCategorieDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const { count, rows } = await ItemCategorie.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'itemCategorie', 'itemCategorieDescription', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('ItemCategoryDao getItemCategorieList():', err);
    throw err;
  }
};

const ItemCategorieDao = {
  addItemCategorie,
  updateItemCategorie,
  getItemCategorie,
  getItemCategorieList,
};

export default ItemCategorieDao;
