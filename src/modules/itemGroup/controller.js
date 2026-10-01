import db from '../index.js';
import ItemGroupService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';

const ItemGroup = db.itemgroups;

const addItemGroup = async (req, res, next) => {
  try {
    logger.info(
      'Item Group Controller addItemGroup requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};

    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item Group';

    const result = await ItemGroupService.addItemGroup(req.body, req.user);
    if (result == 'success') {
      auditData['message'] =
        req.body.itemGroupCode + ' Item Group added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Item Group not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('ItemGroup Controller addItemGroup Error:', err);
    next(err);
  }
};

const listItemGroup = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item Group';

    const data = await ItemGroupService.listItemGroup(reqBody);

    if (data) {
      auditData['message'] = 'Get Item category data ';
      auditData['result'] = 'success ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    } else {
      auditData['message'] = 'Get Item category data';
      auditData['result'] = 'failed ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('ItemGroup Controller listItemGroup Error:', err);
    next(err);
  }
};

const getOneItemGroup = async (req, res, next) => {
  try {
    const itemgroup = await ItemGroupService.getItemGroup(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: itemgroup,
    });
  } catch (err) {
    logger.error('ItemGroup Controller getOneItemGroup Error:', err);
    next(err);
  }
};

const updateItemGroup = async (req, res, next) => {
  try {
    logger.info(
      'Item Group Controller updateItemGroup requestData:' +
        JSON.stringify(req.body)
    );
    let { id, itemGroupCode, itemGroupDescription, status } = req.body;
    let userId = req.user.id;

    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item Group';

    let result = await ItemGroupService.updateItemGroup(
      id,
      itemGroupCode,
      itemGroupDescription,
      status,
      req.user
    );
    if (result == 'success') {
      auditData['message'] =
        itemGroupCode + ' Item Group updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Update';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = itemGroupCode + ' Item Group not updated';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Update';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('ItemGroup Controller updateItemGroup Error:', err);
    next(err);
  }
};

const deleteItemGroup = async (req, res, next) => {
  try {
    const id = req.params.id;

    const itemGroupExists = await ItemGroupService.getItemGroup(id);

    if (itemGroupExists) {
      let data = await ItemGroupService.deleteItemGroup(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('ItemGroup Controller deleteItemGroup Error:', err);
    next(err);
  }
};

const getAllItemGroup = async (req, res, next) => {
  try {
    const data = await ItemGroupService.getAllItemGroup();
    res.status(200).send({
      requestSuccessful: true,
      ItemGroupData: data,
    });
  } catch (err) {
    logger.error('ItemGroup Controller getAllItemGroup Error:', err);
    next(err);
  }
};

const controller = {
  addItemGroup,
  getAllItemGroup,
  getOneItemGroup,
  updateItemGroup,
  deleteItemGroup,
  listItemGroup,
};

export default controller;
