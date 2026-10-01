import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import InventoryPhotoCategoryService from './service.js';
import { Storage } from '@google-cloud/storage';

const addInventoryPhotoCategory = async (req, res, next) => {
  try {
    logger.info(
      'InventoryPhotoCategory Controller addInventoryPhotoCategory requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryPhotoCategory';
    auditData['action'] = ACTION_ADD;
    let result = await InventoryPhotoCategoryService.addInventoryPhotoCategory(
      req.body,
      req.user,
      req.file
    );
    if (result == 'success') {
      auditData['message'] = 'InventoryPhotoCategory added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'InventoryPhotoCategory not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory Controller addInventoryPhotoCategory Error:',
      err
    );
    next(err);
  }
};

const updateInventoryPhotoCategory = async (req, res, next) => {
  try {
    logger.info(
      'InventoryPhotoCategory Controller updateInventoryPhotoCategory requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryPhotoCategory';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await InventoryPhotoCategoryService.updateInventoryPhotoCategory(
        id,
        req.body,
        req.user,
        req.file
      );
    if (result == 'success') {
      auditData['message'] = 'InventoryPhotoCategory Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'InventoryPhotoCategory not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryPhotoCategory not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory Controller updateInventoryPhotoCategory Error:',
      err
    );
    next(err);
  }
};

const listInventoryPhotoCategories = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryPhotoCategory';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get InventoryPhotoCategory data ';
    const data =
      await InventoryPhotoCategoryService.listInventoryPhotoCategories(
        req.body
      );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InventoryPhotoCategoryData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        InventoryPhotoCategoryData: data,
      });
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory Controller listInventoryPhotoCategories Error:',
      err
    );
    next(err);
  }
};

const deleteInventoryPhotoCategory = async (req, res, next) => {
  try {
    logger.info(
      'InventoryPhotoCategory Controller deleteInventoryPhotoCategory requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'InventoryPhotoCategory';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result =
      await InventoryPhotoCategoryService.deleteInventoryPhotoCategory(
        id,
        req.user
      );
    if (result == 'success') {
      auditData['message'] = 'InventoryPhotoCategory deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryPhotoCategory deleted successfully',
      });
    } else {
      auditData['message'] = 'InventoryPhotoCategory not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'InventoryPhotoCategory not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory Controller deleteInventoryPhotoCategory Error:',
      err
    );
    next(err);
  }
};

const controller = {
  addInventoryPhotoCategory,
  updateInventoryPhotoCategory,
  listInventoryPhotoCategories,
  deleteInventoryPhotoCategory,
};

export default controller;
