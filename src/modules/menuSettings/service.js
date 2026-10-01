import dao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const getMenuList = async (reqData) => {
  try {
    const data = await dao.getMenuList(reqData);
    return data;
  } catch (err) {
    logger.error('menuSettings service getMenuList error:', err);
    next(err);
  }
};

const getMenulistByRole = async (id) => {
  const menuData = [];

  const roleAccess = await dao.getRoleSettings(id);

  for (const roleData of roleAccess) {
    const obj = {};
    const menuData1 = await dao.getMenusById(roleData.menuId);
    const menuTab = await dao.getMenuTabs(roleData.menuId, id);

    obj['id'] = menuData1.id;
    obj['title'] = menuData1.title;
    obj['icon'] = menuData1.icon;
    obj['activeIcon'] = menuData1.activeIcon;
    obj['path'] = menuData1.path;
    obj['buttons'] = roleData.menu_operation;
    obj['status'] = roleData.status;

    if (menuTab) {
      obj['menuTab'] = menuTab;
    }

    if (roleData.submenuIds && roleData.submenuIds !== '0') {
      const subMenuListId = roleData.submenuIds.split(',');
      const submenuList = [];

      for (const element of subMenuListId) {
        const obj1 = {};
        const submenuItem = await dao.getSubMenusById(element, id);
        const subMenuTabs = await dao.getSubMenuTabs(element, id);
        const subbutton = submenuItem.submenuButtonsMap;

        obj1['id'] = submenuItem.id;
        obj1['title'] = submenuItem.title;
        obj1['path'] = submenuItem.path;
        obj1['buttons'] = subbutton[0].button_operation;

        if (subMenuTabs) {
          obj1['menuTab'] = subMenuTabs;
        }

        submenuList.push(obj1);
      }

      obj['submenu'] = submenuList;
    }

    menuData.push(obj);
  }

  return menuData;
};

const getSubMenuList = async (reqData) => {
  try {
    const data = await dao.getSubMenuList(reqData);
    return data;
  } catch (err) {
    logger.error('menuSettings service getSubMenuList error:', err);
    next(err);
  }
};

const createMenu = async (reqData) => {
  try {
    const result = await dao.createMenu(reqData);
    return result;
  } catch (err) {
    logger.error('menuSettings service createMenu error:', err);
    next(err);
  }
};

const updateMenu = async (reqData) => {
  try {
    const result = await dao.updateMenu(reqData);
    return result;
  } catch (err) {
    logger.error('menuSettings service updateMenu error:', err);
    next(err);
  }
};

const createSubMenu = async (reqData) => {
  try {
    const result = await dao.createSubMenu(reqData);
    return result;
  } catch (err) {
    logger.error('menuSettings service createSubMenu error:', err);
    next(err);
  }
};

const updateSubMenu = async (reqData) => {
  try {
    const result = await dao.updateSubMenu(reqData);
    return result;
  } catch (err) {
    logger.error('menuSettings service updateSubMenu error:', err);
    next(err);
  }
};

const findByTitle = async (title) => {
  try {
    const result = await dao.findByTitle(title);
    return result;
  } catch (err) {
    logger.error('menuSettings service findByTitle error:', err);
    next(err);
  }
};

const findSubByTitle = async (title) => {
  try {
    const result = await dao.findSubByTitle(title);
    return result;
  } catch (err) {
    logger.error('menuSettings service findSubByTitle error:', err);
    next(err);
  }
};

const findByTitle_Id = async (title, id) => {
  try {
    const result = await dao.findByTitle_Id(title, id);
    return result;
  } catch (err) {
    logger.error('menuSettings service findByTitle_Id error:', err);
    next(err);
  }
};

const findSubByTitle_Id = async (title, id) => {
  try {
    const result = await dao.findSubByTitle_Id(title, id);
    return result;
  } catch (err) {
    logger.error('menuSettings service findSubByTitle_Id error:', err);
    next(err);
  }
};

const createRoleSubMenu = async (reqData) => {
  try {
    const roleId = reqData.roleId;
    reqData.roleSubMenuSetting.forEach(async (item) => {
      const data = {
        roleId: roleId,
        submenuId: item.SubMenu,
        button_operation: item.button_operation,
      };

      if (await dao.getSubMenus(roleId, item.SubMenu)) {
        const result = await dao.updateRoleSubMenu(data);
        if (result === 'failed') {
          return result;
        }
      } else {
        const result = await dao.createRoleSubMenu(data);
        if (result === 'failed') {
          return result;
        }
      }
    });
    return 'success';
  } catch (err) {
    logger.error('menuSettings service createRoleSubMenu error:', err);
    next(err);
  }
};

const createRoleMenu = async (reqData) => {
  try {
    const roleId = reqData.role.id;
    let result = 'failed';
    reqData.roleMenuSetting.forEach(async (item) => {
      const data = {
        roleId: roleId,
        menuId: item.menu.id,
        menu_operation: item.button_operation,
        subMenuIds: item.SubMenu,
        status: item.status,
      };
      if (await dao.getMenus(roleId, item.menu.id)) {
        result = await dao.updateRoleMenu(data);
        if (result === 'failed') {
          return result;
        }
      } else {
        result = await dao.createRoleMenu(data);
        if (result === 'failed') {
          return result;
        }
      }
    });
    return 'success';
  } catch (err) {
    logger.error('menuSettings service createRoleSubMenu error:', err);
    next(err);
  }
};

const getSubmenuData = async (roleId) => {
  const resultList = [];
  try {
    const data = await dao.getSubmenuData(roleId);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.submenuButtons.id;
      resObj['title'] = element.submenuButtons.title;
      resObj['path'] = element.submenuButtons.path;
      resultList.push(resObj);
    });
    return resultList;
  } catch (err) {
    logger.error('menuSettings service getSubmenuData error:', err);
    next(err);
  }
};

const addRoleMenuTab = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await dao.addRoleMenuTab(reqData, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Menu Settings';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = reqData.tabName + ' Tab is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('menuSettings service addRoleMenuTab Error:', err);
    next(err);
  }
  return result;
};

const getRoleMenuTabs = async (reqBody) => {
  try {
    const { totalItems, data } = await dao.getRoleMenuTabs(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('menuSettings Service getRoleMenuTabs Error:', err);
    next(err);
  }
};

const deleteRoleMenuTab = async (id) => {
  let result = 'failed';
  try {
    let data = await dao.deleteRoleMenuTab(id);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('menuSettings service deleteRoleMenuTab', err);
    next(err);
  }
  return result;
};

const updateRoleMenuTab = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await dao.updateRoleMenuTab(reqData, user.id);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('menuSettings service updateRoleMenuTab Error:', err);
    next(err);
  }
  return result;
};

const service = {
  getMenuList,
  getSubMenuList,
  createMenu,
  updateMenu,
  createSubMenu,
  updateSubMenu,
  findByTitle,
  findSubByTitle,
  findByTitle_Id,
  findSubByTitle_Id,
  createRoleSubMenu,
  createRoleMenu,
  getSubmenuData,
  getMenulistByRole,
  addRoleMenuTab,
  getRoleMenuTabs,
  deleteRoleMenuTab,
  updateRoleMenuTab,
};

export default service;
