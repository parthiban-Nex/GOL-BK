import ItemService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const addItem = async (req, res, next) => {
  try {
    logger.info(
      'Item Master Controller addItem requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    let result = await ItemService.addItem(req.body, req.user);
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Master';
    if (result == 'success') {
      auditData['message'] = req.body.itemName + 'Item added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Item not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Item Controller addItem Error:', err);
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    logger.info(
      'Item Master Controller updateItem requestData:' +
        JSON.stringify(req.body)
    );
    let id = req.body.id;
    let userId = req.user.id;
    const auditData = {};

    let result = await ItemService.updateItem(id, req.body, req.user);
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Master';

    if (result == 'success') {
      auditData['message'] = req.body.itemName + 'Item updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Updated successfully',
      });
    } else {
      auditData['message'] = 'Item not updated';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('Item Controller updateItem Error:', err);
    next(err);
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const auditData = {};

    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Master';

    const reqBody = req.body;
    const data = await ItemService.getAllItems(reqBody);
    if (data) {
      auditData['message'] = 'Get Item data ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Get';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        itemData: data,
      });
    } else {
      auditData['message'] = 'Get Item data ';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Get';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        itemData: data,
      });
    }
  } catch (err) {
    logger.error('Item Controller getAllItems Error:', err);
    next(err);
  }
};

const getAllItemsMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Items Mobile Get';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if(usId === req.body.userId){
      const reqBody = req.body;
      const data = await ItemService.getAllItemsMobile(reqBody, req.user);
      console.log('item search api for TVSFIT:',data);
      if (data) {
        auditData['message'] = 'From Mobile_API Items fetched successfully';
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
  
        res.status(200).send({
          requestSuccessful: true,
          searchResult: data,
          searchType : "p"
        });
      } else {
        auditData['message'] = 'Items not added';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
  
        res.status(500).send({
          requestSuccessful: false,
          partSearchResult: data,
        });
      }
    } else {
      auditData['message'] = 'Items not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Item Controller getAllItems Error:', err);
    next(err);
  }
};

const getOneItem = async (req, res, next) => {
  try {
    const item = await ItemService.getOneItem(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: item,
    });
  } catch (err) {
    logger.error('Item Controller getOneItem Error:', err);
    next(err);
  }
};

const searchItemDetails = async (req, res, next) => {
  try {
    const data = await ItemService.searchItemDetails(req.body, req.user);
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        itemSearchData: data,
      });
    }
  } catch (err) {
    logger.error('Item Controller searchItemDetailsMobile Error:', err);
    next(err);
  }
};

const getItemDetails = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Item data ';
    const data = await ItemService.getItemDetails(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        itemsData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        itemsData: data,
      });
    }
  } catch (err) {
    logger.error('Item Controller getItemDetails Error:', err);
    next(err);
  }
};

const poSearchItemDetails = async (req, res, next) => {
  try {
    const data = await ItemService.poSearchItemDetails(req.body, req.user);
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        itemSearchData: data,
      });
    }
  } catch (err) {
    logger.error('Item Controller searchItemDetailsMobile Error:', err);
    next(err);
  }
};

const controller = {
  addItem,
  getOneItem,
  getAllItems,
  updateItem,
  searchItemDetails,
  getItemDetails,
  getAllItemsMobile,
  poSearchItemDetails
};

export default controller;
