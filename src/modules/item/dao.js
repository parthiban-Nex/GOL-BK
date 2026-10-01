import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Item = db.items;
const ItemCompanyMap = db.itemcompanymaps;
const ItemGroup = db.itemgroups;
const ItemCategory = db.itemcategories;
const Make = db.makes;
const Model = db.models;
const Aggregate = db.aggregates;
const SubAggregate = db.subaggregates;

const addItem = async (item, userId) => {
  let data = {};
  try {
    data = await Item.create({
      itemCode: item.itemCode,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemgroupId: item.itemgroupId,
      uomId: item.uomId,
      itemcategoryId: item.itemcategoryId,
      hsnId: item.hsnId,
      hsnCode: item.hsnCode,
      makeId: item.makeId,
      modelId: item.modelId,
      aggregateId: item.aggregateId,
      subaggregateId: item.subaggregateId,
      list: item.list,
      mrp: item.mrp,
      cost: item.cost,
      taxPercentage: item.taxPercentage,
      vehicletypeId: item.vehicletypeId,
      status: item.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('ItemDao addItem()', err);
    next(err);
  }
  return data;
};

const getAllItems = async (reqData) => {
  let count = {};
  let rows = {};
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { itemCode: { [Op.like]: `%${searchKey}%` } },
            { itemName: { [Op.like]: `%${searchKey}%` } },
            { itemDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    count = await Item.count({
      where: searchCondition,
    });
    rows = await Item.findAll({
      where: searchCondition,
      limit,
      offset,
      include: [
        { model: ItemCompanyMap, as: 'itemcompanymap' }
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (err) {
    logger.error('ItemDao getAllItems()', err);
    next(err);
  }
  return {
    totalItems: count,
    data: rows,
  };
};

const addItemCompanyMap = async (companyIds, itemId) => {
  const promises = companyIds.map((value) => {
    const reqObj = {
      companyId: value,
      itemId: itemId,
    };
    return ItemCompanyMap.create(reqObj);
  });

  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error creating item-company maps:', error);
    throw error;
  }
};

const updateItem = async (id, item, userId) => {
  let data = {};
  try {
    data = await Item.update(
      {
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        itemgroupId: item.itemgroupId,
        uomId: item.uomId,
        itemcategoryId: item.itemcategoryId,
        hsnId: item.hsnId,
        hsnCode: item.hsnCode,
        makeId: item.makeId,
        modelId: item.modelId,
        aggregateId: item.aggregateId,
        subaggregateId: item.subaggregateId,
        list: item.list,
        mrp: item.mrp,
        cost: item.cost,
        taxPercentage: item.taxPercentage,
        vehicletypeId: item.vehicletypeId,
        status: item.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('ItemDao updateItem()', err);
    next(err);
  }

  return data;
};

const findOne = async (id) => {
  return await Item.findOne({ where: { id: id } });
};
const removeItemCompanyMap = async (id) => {
  return await ItemCompanyMap.destroy({ where: { itemId: id } });
};

const getItemDetails = async (reqData) => {
  try {
    const itemCode = reqData.itemCode;
    const rows = await Item.findAll({
      where: reqData.id ? { id: reqData.id } : { itemCode: itemCode },
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'itemCode',
        'itemName',
        'itemDescription',
        'list',
        'mrp',
        'cost',
        'taxPercentage',
        'hsnCode',
      ],
    });
    return rows;
  } catch (err) {
    logger.error('ItemDao getItemDetails', err);
    console.log(err);
  }
};

const searchItemDetails = async (reqData, companyId) => {
  try {
    const searchKey = reqData.itemCode;
    const whereCondition = {
      ...(searchKey && searchKey.length >= 3
        ? {
            [Op.or]: [
              { itemCode: { [Op.like]: `%${searchKey}%` } },
              { itemName: { [Op.like]: `%${searchKey}%` } },
            ],
          }
        : {}),
    };
    const rows = await Item.findAll({
      where: whereCondition,
      // include: [
      //   {
      //     model: ItemCompanyMap,
      //     as: 'itemcompanymap',
      //     where: {
      //       companyId: companyId,
      //     },
      //     attributes: [],
      //   },
      // ],
      order: [['id', 'DESC']],
      attributes: ['id', 'itemCode', 'itemName'],
      limit: 50,
    });
    return rows;
  } catch (err) {
    logger.error('ItemDao searchItemDetails', err);
    console.log(err);
  }
};

const getAllItemsMobile = async (reqData, user) => {
  let rows = [];
  let itemGroupAll = [];
  let itemCategoryAll = [];
  let itemMakeAll = [];
  let itemModelAll = [];
  let itemAggregateAll = [];
  let itemSubAggregateAll = [];

  try {
    const  searchKey  = reqData.partSearchValue;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { itemCode: { [Op.like]: `%${searchKey}%` } },
            { itemName: { [Op.like]: `%${searchKey}%` } },
            // { itemDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    rows = await Item.findAll({
      where: { ...searchCondition }, //searchCondition,
      include: [
        {
          model: ItemCompanyMap,
          as: 'itemcompanymap',
          where: {
            companyId: user.companyId,
          },
          attributes: [],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    itemGroupAll = await Promise.all(rows.map(async (item) => {
      const itemGroup = await ItemGroup.findOne({
        where: { id: item.itemgroupId },
        attributes: ['id', 'itemGroupCode'],
      });
      return itemGroup;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item.toJSON(),
        itemGroup: itemGroupAll[index] ? itemGroupAll[index].itemGroupCode : null,
      };
    });

    itemCategoryAll = await Promise.all(rows.map(async (item) => {
      const itemCategory = await ItemCategory.findOne({
        where: { id: item.itemcategoryId },
        attributes: ['id', 'itemCategorie'],
      });
      return itemCategory;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item,
        itemCategory: itemCategoryAll[index] ? itemCategoryAll[index].itemCategorie : null,
      };
    });

    itemMakeAll = await Promise.all(rows.map(async (item) => {
      const make = await Make.findOne({
        where: { id: item.makeId },
        attributes: ['id', 'makeName'],
      });
      return make;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item,
        itemMake: itemMakeAll[index] ? itemMakeAll[index].makeName : null,
      };
    });

    itemModelAll = await Promise.all(rows.map(async (item) => {
      const itemModel = await Model.findOne({
        where: { id: item.modelId },
        attributes: ['id', 'modelName'],
      });
      return itemModel;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item,
        itemModel: itemModelAll[index] ? itemModelAll[index].modelName : null,
      };
    });

    itemAggregateAll = await Promise.all(rows.map(async (item) => {
      const aggregate = await Aggregate.findOne({
        where: { id: item.makeId },
        attributes: ['id', 'aggregateName'],
      });
      return aggregate;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item,
        aggregate: itemAggregateAll[index] ? itemAggregateAll[index].aggregateName : null,
      };
    });

    itemSubAggregateAll = await Promise.all(rows.map(async (item) => {
      const subAggregate = await SubAggregate.findOne({
        where: { id: item.modelId },
        attributes: ['id', 'subAggregateName'],
      });
      return subAggregate;
    }));

    rows = rows.map((item, index) => {
      return {
        ...item,
        subAggregate: itemSubAggregateAll[index] ? itemSubAggregateAll[index].subAggregateName : null,
      };
    });
console.log('items search mobile api:', rows);
    return rows;

  } catch (err) {
    logger.error('ItemDao getAllItemsMobile()', err);
    next(err);
  }
};

const PosearchItemDetails = async (reqData, companyId) => {
  try {
    const searchKey = reqData.itemCode;
    const itemGroupCodes = reqData.itemGroupCodes;
    let whereCondition = {};

    //  Search condition
    if (searchKey && searchKey.length >= 3) {
      whereCondition[Op.or] = [
        { itemCode: { [Op.like]: `%${searchKey}%` } },
        { itemName: { [Op.like]: `%${searchKey}%` } },
      ];
    }
   //group code condition for specific companies
    if ([2, 5, 8].includes(companyId) && itemGroupCodes?.length) {
      const groupConditions = itemGroupCodes.map(code => ({
        itemCode: {
          [Op.like]: `${code}%`,
        },
      }));

      // Combine with existing condition using AND
      whereCondition = {
        [Op.and]: [
          ...(Object.keys(whereCondition).length ? [whereCondition] : []),
          {
            [Op.or]: groupConditions,
          },
        ],
      };
    }
  
    const rows = await Item.findAll({
      where: whereCondition,
      // include: [
      //   {
      //     model: ItemCompanyMap,
      //     as: 'itemcompanymap',
      //     where: {
      //       companyId: companyId,
      //     },
      //     attributes: [],
      //   },
      // ],
      order: [['id', 'DESC']],
      attributes: ['id', 'itemCode', 'itemName'],
      limit: 50,
    });
    return rows;
  } catch (err) {
    logger.error('ItemDao searchItemDetails', err);
    console.log(err);
  }
};

const ItemDao = {
  addItem,
  updateItem,
  getAllItems,
  addItemCompanyMap,
  findOne,
  removeItemCompanyMap,
  getItemDetails,
  searchItemDetails,
  getAllItemsMobile,
  PosearchItemDetails
};

export default ItemDao;
