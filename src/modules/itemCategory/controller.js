import db from '../index.js';
import ItemCategorieService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';

const ItemCategorie = db.itemcategories;

const addItemCategorie = async (req, res, next) => {
  try {
    logger.info(
      'Item Controller addItemCategorie requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};

    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item category';
    const result = await ItemCategorieService.addItemCategorie(
      req.body,
      req.user
    );

    if (result == 'success') {
      auditData['message'] = 'Item category added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Item category not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('ItemCategoryController addItemCategorie() ', err);
    next(err);
  }
};

const getAllItemCategorie = async (req, res, next) => {
  try {
    const data = await ItemCategorieService.getAllItemCategorie();
    res.status(200).send({
      requestSuccessful: true,
      ItemCategorieData: data,
    });
  } catch (err) {
    next(err);
  }
};

const getItemCategoryList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item category';
    const data = await ItemCategorieService.getItemCategorieList(reqBody);
    if (data) {
      auditData['message'] = 'Get Item category data ';
      auditData['result'] = 'success ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        itemData: data,
      });
    } else {
      auditData['message'] = 'Get Item category data';
      auditData['result'] = 'failed ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        itemData: data,
      });
    }
  } catch (err) {
    logger.error('ItemCategoryController getItemCategoryList() ', err);
    next(err);
  }
};

const getOneItemCategorie = async (req, res, next) => {
  try {
    const itemcategorie = await ItemCategorieService.getItemCategorie(
      req.params.id
    );
    res.status(200).send({
      requestSuccessful: true,
      data: itemcategorie,
    });
  } catch (err) {
    next(err);
  }
};

const getItemCategoryById = async (req, res, next) => {
  try {
    const itemcategorie = await ItemCategorieService.getItemCategorie(
      req.body.id
    );
    res.status(200).send({
      requestSuccessful: true,
      data: itemcategorie,
    });
  } catch (err) {
    next(err);
  }
};

const updateItemCategorie = async (req, res, next) => {
  try {
    logger.info(
      'Item Controller updateItemCategorie requestData:' +
        JSON.stringify(req.body)
    );
    const id = req.body.id;
    let { itemCategorie, itemCategorieDescription, status } = req.body;
    let userId = req.user.id;
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Item category';
    let result = await ItemCategorieService.updateItemCategorie(
      id,
      itemCategorie,
      itemCategorieDescription,
      status,
      req.user
    );

    if (result == 'success') {
      auditData['message'] =
        itemCategorie + ' Item category updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = itemCategorie + 'Item category not updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('ItemCategoryController updateItemCategorie() ', err);
    next(err);
  }
};

const updateItemCategorById = async (req, res, next) => {
  try {
    const id = req.body.id;
    let { itemCategorie, itemCategorieDescription, status } = req.body;
    let userId = req.user.id;

    const itemCategorieExists = await ItemCategorieService.getItemCategorie(id);

    if (itemCategorieExists) {
      let data = await ItemCategorieService.updateItemCategorie(
        id,
        itemCategorie,
        itemCategorieDescription,
        status,
        userId
      );
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteItemCategorie = async (req, res, next) => {
  try {
    const id = req.params.id;

    const itemCategrieExists = await ItemCategorieService.getItemCategorie(id);

    if (itemCategrieExists) {
      let data = await ItemCategorieService.deleteItemCategorie(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    next(err);
  }
};

const controller = {
  addItemCategorie,
  getAllItemCategorie,
  getItemCategoryList,
  getOneItemCategorie,
  updateItemCategorie,
  deleteItemCategorie,
  getItemCategoryById,
  updateItemCategorById,
};

export default controller;
