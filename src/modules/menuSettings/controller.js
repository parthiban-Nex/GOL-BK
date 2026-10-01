import service from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_ADD,
  ACTION_GET,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const getMenuList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const reqData = {
      searchKey: '',
      offset: 0,
      limit: Number.MAX_SAFE_INTEGER,
    };
    const list = await service.getMenuList(reqData);
    if (list) {
      auditData['message'] = 'getMenuList data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        totalItems: list.totalItems,
        data: list.data,
      });
    } else {
      auditData['message'] = 'getMenuList data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('menuSettings Controller getMenuList Error:', err);
    next(err);
  }
};

const getMenuListByRole = async (req, res, next) => {
  try {
    const auditData = {};
    const menulist = await service.getMenulistByRole(req.body.roleId);
    auditData['message'] = 'Get Menu list ';
    auditData['result'] = 'success ';
    auditData['menu_name'] = '';
    auditData['submenu_name'] = '';
    auditData['action'] = 'GET';
    auditLog.createAuditLog(req, auditData);
    res.status(200).send({
      requestSuccessful: true,
      menuList: menulist,
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const getMenuListGrid = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller getMenuListGrid requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const list = await service.getMenuList(req.body);
    if (list) {
      auditData['message'] = 'getMenuListGrid data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        totalItems: list.totalItems,
        data: list.data,
      });
    } else {
      auditData['message'] = 'getMenuListGrid data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('menuSettings Controller getMenuListGrid Error:', err);
    next(err);
  }
};

const getSubMenuList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const reqData = {
      searchKey: '',
      offset: 0,
      limit: Number.MAX_SAFE_INTEGER,
    };
    const list = await service.getSubMenuList(reqData);
    if (list) {
      auditData['message'] = 'getSubMenuList data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        totalItems: list.totalItems,
        data: list.data,
      });
    } else {
      auditData['message'] = 'getSubMenuList data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('menuSettings Controller getSubMenuList Error:', err);
    next(err);
  }
};

const getSubMenuListGrid = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    logger.info(
      'menuSettings Controller getSubMenuListGrid requestData:' +
        JSON.stringify(req.body)
    );
    const list = await service.getSubMenuList(req.body);
    if (list) {
      auditData['message'] = 'getSubMenuListGrid data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        totalItems: list.totalItems,
        data: list.data,
      });
    } else {
      auditData['message'] = 'getSubMenuListGrid data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('menuSettings Controller getSubMenuListGrid Error:', err);
    next(err);
  }
};

const createMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller createMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.createMenu(req.body);
    if (result) {
      auditData['message'] = 'createMenu data added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Menu created successfully',
      });
    } else {
      auditData['message'] = 'createMenu data not added';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Menu not created',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller createMenu Error:', err);
    next(err);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller updateMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.updateMenu(req.body);
    if (result) {
      auditData['message'] = 'updateMenu data updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Menu updated successfully',
      });
    } else {
      auditData['message'] = 'updateMenu data not updated';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Menu not updated',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller updateMenu Error:', err);
    next(err);
  }
};

const createSubMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller createSubMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.createSubMenu(req.body);
    if (result) {
      auditData['message'] = 'createSubMenu data added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'SubMenu created successfully',
      });
    } else {
      auditData['message'] = 'createSubMenu data not added';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'subMenu not created',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller createSubMenu Error:', err);
    next(err);
  }
};

const updateSubMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller updateSubMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.updateSubMenu(req.body);
    if (result) {
      auditData['message'] = 'updateSubMenu data updated successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'subMenu updated successfully',
      });
    } else {
      auditData['message'] = 'updateSubMenu data not updated';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'subMenu not updated',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller updateSubMenu Error:', err);
    next(err);
  }
};

const createRoleSubMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller createRoleSubMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.createRoleSubMenu(req.body);
    if (result === 'success') {
      auditData['message'] = 'createRoleSubMenu data added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'roleSubMenu created successfully',
      });
    } else {
      auditData['message'] = 'createSubMenu data not added';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'roleSubMenu not created',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller createRoleSubMenu Error:', err);
    next(err);
  }
};

const createRoleMenu = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller createRoleMenu requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    const result = await service.createRoleMenu(req.body);
    if (result === 'success') {
      auditData['message'] = 'createRoleMenu data added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'roleMenu created successfully',
      });
    } else {
      auditData['message'] = 'createMenu data not added';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'roleMenu not created',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller createRoleMenu Error:', err);
    next(err);
  }
};

const getSubmenuData = async (req, res, next) => {
  try {
    const data = await service.getSubmenuData(req.body.roleId);
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        submenudData: data,
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller getSubmenuData Error:', err);
    next(err);
  }
};

const addRoleMenuTab = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller addRoleMenuTab requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    auditData['action'] = ACTION_ADD;
    let result = await service.addRoleMenuTab(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Menu Tab added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'failed to add menu tab';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller addRoleMenuTab Error:', err);
    next(err);
  }
};

const getRoleMenuTabs = async (req, res, next) => {
  try {
    const data = await service.getRoleMenuTabs(req.body);
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    } else {
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    }
  } catch (err) {
    logger.error('menuSettings controller getRoleMenuTabs', err);
    next(err);
  }
};

const deleteRoleMenuTab = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller deleteRoleMenuTab requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await service.deleteRoleMenuTab(id);
    if (result == 'success') {
      auditData['message'] = 'Menu Tab deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Menu Tab deleted successfully',
      });
    } else {
      auditData['message'] = 'failed to delete Menu Tab';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'failed to delete Menu Tab',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller deleteRoleMenuTab Error:', err);
    next(err);
  }
};

const updateRoleMenuTab = async (req, res, next) => {
  try {
    logger.info(
      'menuSettings Controller updateRoleMenuTab requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Menu Settings';
    auditData['submenu_name'] = '';
    auditData['action'] = ACTION_UPDATE;
    let result = await service.updateRoleMenuTab(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Menu Tab Updated successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Updated Successfully',
      });
    } else {
      auditData['message'] = 'failed to update menu tab';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('menuSettings Controller updateRoleMenuTab Error:', err);
    next(err);
  }
};

const controller = {
  getMenuList,
  getMenuListGrid,
  getSubMenuList,
  getSubMenuListGrid,
  createMenu,
  updateMenu,
  createSubMenu,
  updateSubMenu,
  createRoleSubMenu,
  createRoleMenu,
  getSubmenuData,
  getMenuListByRole,
  addRoleMenuTab,
  getRoleMenuTabs,
  deleteRoleMenuTab,
  updateRoleMenuTab,
};

export default controller;
