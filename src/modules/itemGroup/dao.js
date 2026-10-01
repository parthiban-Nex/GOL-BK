import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const ItemGroup = db.itemgroups;

const addItemGroup = async (itemgroup, userId) => {
  let data = {};
  try {
    data = await ItemGroup.create({
      itemGroupCode: itemgroup.itemGroupCode,
      itemGroupDescription: itemgroup.itemGroupDescription,
      status: itemgroup.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('ItemGroupDao addItemGroup() ', err);
    next(err);
  }
  return data;
};

const getItemGroup = async (id) => {
  const itemgroup = await ItemGroup.findOne({ where: { id: id } });
  if (!itemgroup) {
    throw new notFoundException();
  }
  return itemgroup;
};

const updateItemGroup = async (
  id,
  itemGroupCode,
  itemGroupDescription,
  status,
  userId
) => {
  let data = {};
  try {
    data = await ItemGroup.update(
      {
        itemGroupCode: itemGroupCode,
        itemGroupDescription: itemGroupDescription,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('ItemGroup updateItemGroup():', err);
    throw err;
  }
  return data;
};

const listItemGroup = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { itemGroupCode: { [Op.like]: `%${searchKey}%` } },
            { itemGroupDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const { count, rows } = await ItemGroup.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'itemGroupCode', 'itemGroupDescription', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('ItemGroupDao listItemGroup():', err);
    throw err;
  }
};

const ItemGroupDao = {
  addItemGroup,
  updateItemGroup,
  getItemGroup,
  listItemGroup,
};

export default ItemGroupDao;
