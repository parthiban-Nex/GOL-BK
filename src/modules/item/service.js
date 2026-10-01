import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import ItemDao from './dao.js';
import CompanyService from '../company/service.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Op } from 'sequelize';
const Item = db.items;
const ItemCompanyMap = db.itemcompanymaps;

const addItem = async (item, user) => {
  let result = 'failed';
  let recentActivityData = {};
  try {
    let data = await ItemDao.addItem(item, user.id);
    if (data) {
      await ItemDao.addItemCompanyMap(item.companyId, data.id);
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Item';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = item.itemCode + ' Item  is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('ItemService add Item addItem()', err);
    next(err);
  }

  return result;
};

const findByCode_Id = async (itemCode, id) => {
  let data = '';
  try {
    data = await Item.findOne({
      where: {
        itemCode: itemCode,
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
const findByCode = async (itemCode) => {
  return await Item.findOne({ where: { itemCode: itemCode } });
};

const updateItem = async (id, item, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    let itemExists = await ItemDao.findOne(id);
    if (itemExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Item';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      await ItemDao.removeItemCompanyMap(id);
      const data = await ItemDao.updateItem(id, item, user.id);

      if (itemExists.itemCode != item.itemCode) {
        message =
          message +
          ' itemCode changed from ' +
          itemExists.itemCode +
          ' to ' +
          item.itemCode +
          ' ,';
      }
      if (itemExists.itemName != item.itemName) {
        message =
          message +
          ' itemName changed from ' +
          itemExists.itemName +
          ' to ' +
          item.itemName +
          ' ,';
      }
      if (itemExists.itemDescription != item.itemDescription) {
        message =
          message +
          ' status changed from ' +
          itemExists.itemDescription +
          ' to ' +
          item.itemDescription +
          ' ,';
      }

      if (message && data) {
        recentActivityData['message'] = message;
        const recent =
          await RecentAcivityService.addRecentActivity(recentActivityData);
      }

      if (data) {
        await ItemDao.addItemCompanyMap(item.companyId, id, user.id);
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('ItemService update Item updateItem()', err);
  }
  return result;
};

const getAllItems = async (reqData) => {
  let resultList = [];
  let count = '';

  try {
    const { totalItems, data } = await ItemDao.getAllItems(reqData);
    count = totalItems;

    for (const element of data) {
      const resObj = {
        id: element.id,
        itemCode: element.itemCode,
        itemName: element.itemName,
        itemDescription: element.itemDescription,
        itemgroupId: element.itemgroupId,
        uomId: element.uomId,
        itemcategoryId: element.itemcategoryId,
        hsnId: element.hsnId,
        hsnCode: element.hsnCode,
        makeId: element.makeId,
        modelId: element.modelId,
        aggregateId: element.aggregateId,
        subaggregateId: element.subaggregateId,
        list: element.list,
        mrp: element.mrp,
        cost: element.cost,
        taxPercentage: element.taxPercentage,
        vehicletypeId: element.vehicletypeId,
        status: element.status,
      };

      let companyname = '';
      for (const companyMap of element.itemcompanymap) {
        const companyData = await CompanyService.findById(companyMap.companyId);
        companyname += companyData.name + ',';
      }

      resObj['companies'] = companyname.slice(0, -1);

      resultList.push(resObj);
    }
  } catch (err) {
    logger.error('ItemService get all Item getAllItems()', err);
    next(err);
  }

  return {
    totalItems: count,
    data: resultList,
  };
};

const getAllItemsMobile = async (reqData, user) => {
  let resultList = [];

  try {
    const data = await ItemDao.getAllItemsMobile(reqData, user.outlet);

    if (!data || !Array.isArray(data)) {
      return res.status(404).json({ message: "No items found" });
    }

    for (const element of data) {
      const resObj = {
        itemId: element.id.toString(),
        itemCode: element.itemCode?element.itemCode:null,
        itemName: element.itemName?element.itemName:null,
        itemDescription: element.itemDescription?element.itemDescription:null,
        hsnCode : element.hsnCode?element.hsnCode:null,
        itemGroup: element.itemGroup?element.itemGroup:null,
        itemCategory: element.itemCategory?element.itemCategory:null,
        itemMake: element.itemMake?element.itemMake:null,
        itemModel: element.itemModel?element.itemModel:null,
        aggregate: element.aggregate?element.aggregate:null,
        subAggregate: element.subAggregate?element.subAggregate:null,
        listPrice:element.list?element.list.toString():null,
        mrp:element.mrp?element.mrp.toString():null,
        cost: element.cost?element.cost.toString():null,
        igst: element.taxPercentage?element.taxPercentage.toFixed(2):null,
        cgst: (element.taxPercentage/2).toFixed(2),
        sgst: (element.taxPercentage/2).toFixed(2),
        dockCheckList:element.dockCheckList?element.dockCheckList:null,
        aaRepairtype:element.aaRepairtype?element.aaRepairtype:null
      };

      resultList.push(resObj);

      // let companyname = '';
      // for (const companyMap of element.itemcompanymap) {
      //   const companyData = await CompanyService.findById(companyMap.companyId);
      //   companyname += companyData.name + ',';
      // };

      // resObj['companies'] = companyname.slice(0, -1);
      // resultList.push(resObj);
    };
  } catch (err) {
    logger.error('ItemService get all Item getAllItems()', err);
    next(err);
  }

  return resultList;
};

const getOneItem = async (id) => {
  const item = await Item.findOne({
    where: { id: id },
    include: [{ model: ItemCompanyMap, as: 'itemcompanymap' }],
  });
  if (!item) {
    throw new notFoundException();
  }
  return item;
};

const searchItemDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await ItemDao.searchItemDetails(
      reqData,
      user.outlet.companyId
    );
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['itemCode'] = element.itemCode;
      resObj['itemName'] = element.itemName;
      resObj['displayText'] = `${element.itemCode} | ${element.itemName}`;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('Item service searchItemDetails', err);
    throw err;
  }
};

const getItemDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await ItemDao.getItemDetails(reqData);
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['itemCode'] = element.itemCode;
      resObj['itemName'] = element.itemName;
      resObj['itemDescription'] = element.itemDescription;
      resObj['hsnCode'] = element.hsnCode;
      resObj['list'] = element.list;
      resObj['mrp'] = Number(element.mrp.toFixed(2));
      resObj['cost'] = Number(element.cost.toFixed(2));
      resObj['taxPercentage'] = element.taxPercentage;
      if (
        reqData.customerState?.toLowerCase() === user.outlet.state.toLowerCase()
      ) {
        resObj['sgst'] = element.taxPercentage / 2;
        resObj['cgst'] = element.taxPercentage / 2;
        resObj['igst'] = 0;
      } else {
        resObj['sgst'] = 0;
        resObj['cgst'] = 0;
        resObj['igst'] = element.taxPercentage;
      }

      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('Item service getItemDetails', err);
    throw err;
  }
};

const poSearchItemDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await ItemDao.PosearchItemDetails(
      reqData,
      user.outlet.companyId
    );
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['itemCode'] = element.itemCode;
      resObj['itemName'] = element.itemName;
      resObj['displayText'] = `${element.itemCode} | ${element.itemName}`;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('Item service searchItemDetails', err);
    throw err;
  }
};

const ItemService = {
  addItem,
  findByCode,
  getOneItem,
  getAllItems,
  updateItem,
  searchItemDetails,
  getItemDetails,
  findByCode_Id,
  getAllItemsMobile,
  poSearchItemDetails
};

export default ItemService;
