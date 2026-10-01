import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const MenuList = db.menudatas;
const subMenuList = db.subMenudatas;
const roleSubMenuSettings = db.roleSubmenuButtons;
const roleMenuSettings = db.rolesettingsdatas;
const sequelize = db.sequelize;
const RoleMenuTabSettings = db.roleMentuTabSettings;

const getMenuList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          title: { [Op.like]: `%${searchKey}%` },
        }
      : {};

    const count = await MenuList.count({ where: searchCondition });

    const list = await MenuList.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
    });
    return {
      totalItems: count,
      data: list,
    };
  } catch (err) {
    logger.error('menuSettings dao getMenuList Error:', err);
    next(err);
  }
};

const getSubMenuList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          title: { [Op.like]: `%${searchKey}%` },
        }
      : {};

    const count = await subMenuList.count({ where: searchCondition });

    const list = await subMenuList.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
    });
    return {
      totalItems: count,
      data: list,
    };
  } catch (err) {
    logger.error('menuSettings dao getSubMenuList Error:', err);
    next(err);
  }
};

const createMenu = async (reqData) => {
  try {
    return await MenuList.create({
      title: reqData.title,
      icon: reqData.icon,
      activeIcon: reqData.activeIcon,
      path: reqData.path,
    });
  } catch (err) {
    logger.error('menuSettings dao createMenu Error:', err);
    next(err);
  }
};

const updateMenu = async (reqData) => {
  try {
    return await MenuList.update(
      {
        title: reqData.title,
        icon: reqData.icon,
        activeIcon: reqData.activeIcon,
        path: reqData.path,
      },
      { where: { id: reqData.id } }
    );
  } catch (err) {
    logger.error('menuSettings dao updateMenu Error:', err);
    next(err);
  }
};

const createSubMenu = async (reqData) => {
  try {
    return await subMenuList.create({
      title: reqData.title,
      path: reqData.path,
    });
  } catch (err) {
    logger.error('menuSettings dao createSubMenu Error:', err);
    next(err);
  }
};

const updateSubMenu = async (reqData) => {
  try {
    return await subMenuList.update(
      {
        title: reqData.title,
        path: reqData.path,
      },
      { where: { id: reqData.id } }
    );
  } catch (err) {
    logger.error('menuSettings dao updateSubMenu Error:', err);
    next(err);
  }
};

const findByTitle = async (title) => {
  try {
    return await MenuList.findOne({ where: { title: title } });
  } catch (err) {
    logger.error('menuSettings dao findByTitle Error:', err);
    next(err);
  }
};

const findSubByTitle = async (title) => {
  try {
    return await subMenuList.findOne({ where: { title: title } });
  } catch (err) {
    logger.error('menuSettings dao findSubByTitle Error:', err);
    next(err);
  }
};

const findByTitle_Id = async (title, id) => {
  try {
    const data = await MenuList.findOne({
      where: {
        title: title,
        id: {
          [Op.ne]: id,
        },
      },
    });
    return data;
  } catch (err) {
    logger.error('menuSettings dao findByTitle_Id Error:', err);
    next(err);
  }
};

const findSubByTitle_Id = async (title, id) => {
  try {
    const data = await subMenuList.findOne({
      where: {
        title: title,
        id: {
          [Op.ne]: id,
        },
      },
    });
    return data;
  } catch (err) {
    logger.error('menuSettings dao findSubByTitle_Id Error:', err);
    next(err);
  }
};

const createRoleSubMenu = async (reqData) => {
  try {
    let result = 'failed';
    const data = await roleSubMenuSettings.create({
      roleId: reqData.roleId,
      submenuId: reqData.submenuId,
      button_operation: reqData.button_operation,
    });
    if (data) {
      result = 'success';
    }
    return result;
  } catch (err) {
    logger.error('menuSettings dao createRoleSubMenu Error:', err);
    next(err);
  }
};

const updateRoleSubMenu = async (reqData) => {
  try {
    let result = 'failed';
    const data = await roleSubMenuSettings.update(
      {
        button_operation: reqData.button_operation,
      },
      {
        where: {
          [Op.and]: [
            { roleId: reqData.roleId },
            { submenuId: reqData.submenuId },
          ],
        },
      }
    );
    if (data) {
      result = 'success';
    }
    return result;
  } catch (err) {
    logger.error('menuSettings dao updateRoleSubMenu Error:', err);
    next(err);
  }
};

const getSubMenus = async (roleid, subMenuId) => {
  const data = roleSubMenuSettings.findOne({
    where: {
      [Op.and]: [{ roleId: roleid }, { submenuId: subMenuId }],
    },
  });
  return data;
};

const createRoleMenu = async (reqData) => {
  try {
    let result = 'failed';
    const data = await roleMenuSettings.create({
      roleId: reqData.roleId,
      menuId: reqData.menuId,
      menu_operation: reqData.menu_operation,
      status: reqData.status === true ? 'Active' : 'InActive',
      submenuIds: reqData.subMenuIds,
    });
    if (data) {
      result = 'success';
    }
    return result;
  } catch (err) {
    logger.error('menuSettings dao createRoleSubMenu Error:', err);
    next(err);
  }
};

const updateRoleMenu = async (reqData) => {
  try {
    let result = 'failed';
    const data = await roleMenuSettings.update(
      {
        submenuIds: reqData.subMenuIds,
        menu_operation: reqData.menu_operation,
        status: reqData.status === true ? 'Active' : 'InActive',
      },
      {
        where: {
          [Op.and]: [{ roleId: reqData.roleId }, { menuId: reqData.menuId }],
        },
      }
    );
    if (data) {
      result = 'success';
    }
    return result;
  } catch (err) {
    logger.error('menuSettings dao createRoleSubMenu Error:', err);
    next(err);
  }
};

const getMenus = async (roleId, menuId) => {
  const data = roleMenuSettings.findOne({
    where: {
      [Op.and]: [{ roleId: roleId }, { menuId: menuId }],
    },
  });
  return data;
};

const getSubmenuData = async (roleId) => {
  try {
    const data = await roleSubMenuSettings.findAll({
      where: { roleId: roleId },
      order: [['id', 'DESC']],

      include: [{ model: subMenuList, as: 'submenuButtons' }],
    });
    return data;
  } catch (err) {
    logger.error('menuSettings dao getSubmenuData Error:', err);
    next(err);
  }
};
const getRoleSettings = async (id) => {
  const data = await roleMenuSettings.findAll({
    where: { roleId: id },
    order: ['menuId'],
  });
  return data;
};
const getMenusById = async (id) => {
  const data = MenuList.findOne({
    where: { id: id },
  });
  return data;
};
const getSubMenusById = async (id, roleid) => {
  const data = subMenuList.findOne({
    include: [
      {
        model: roleSubMenuSettings,
        as: 'submenuButtonsMap',
        where: { roleId: roleid },
      },
    ],
    where: { id: id },
  });
  return data;
};

const getMenuTabs = async (menuId, roleId) => {
  const [results, metadata] = await sequelize.query(
    'SELECT id, tab_name,tab_menu_operation as buttons FROM role_menu_tab_settings where roleId=' +
      roleId +
      ' and menuId=' +
      menuId
  );
  return results;
};
const getSubMenuTabs = async (menuId, roleId) => {
  const [results, metadata] = await sequelize.query(
    'SELECT id, tab_name,tab_menu_operation as buttons FROM role_menu_tab_settings where roleId=' +
      roleId +
      ' and submenuId=' +
      menuId
  );
  return results;
};

const addRoleMenuTab = async (reqData, userId) => {
  try {
    return await RoleMenuTabSettings.create({
      roleId: reqData.roleId,
      menuId: reqData.menuId,
      submenuId: reqData.submenuId,
      tab_name: reqData.tabName,
      tab_menu_operation: reqData.tabMenuOperations,
    });
  } catch (err) {
    logger.error('menuSettings dao addRoleMenuTab Error:', err);
    next(err);
  }
};

const getRoleMenuTabs = async (reqData) => {
  try {
    const { offset, limit } = reqData;
    const count = await RoleMenuTabSettings.count();
    let sqlQry =
      'select rt.tab_name,rt.tab_menu_operation,sl.title as subMenuTitle,sl.path as subMenuPath,ml.title as menuTitle,ml.path as menuPath,r.roleName from role_menu_tab_settings rt' +
      ' left outer join submenu_list sl on rt.submenuId=sl.id' +
      ' left outer join menu_list ml on rt.menuId=ml.id' +
      ' left outer join roles r on rt.roleId=r.id' +
      ' limit ' +
      offset +
      ',' +
      limit;

    const [results, metadata] = await sequelize.query(sqlQry);
    return {
      totalItems: count,
      data: results,
    };
  } catch (err) {
    logger.error('menuSettings dao getRoleMenuTabs', err);
  }
};
const deleteRoleMenuTab = async (id) => {
  let data = {};
  try {
    data = await RoleMenuTabSettings.destroy({
      where: {
        id: id,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('menuSettings Dao deleteLaborSchedules', err);
  }
  return data;
};

const updateRoleMenuTab = async (reqData, user) => {
  let data = {};
  try {
    data = await RoleMenuTabSettings.update(
      {
        roleId: reqData.roleId,
        menuId: reqData.menuId,
        submenuId: reqData.submenuId,
        tab_name: reqData.tabName,
        tab_menu_operation: reqData.tabMenuOperations,
      },
      { where: { id: reqData.id } }
    );
  } catch (err) {
    logger.error('menuSettings dao updateRoleMenuTab Error:', err);
    next(err);
  }
  return data;
};
const dao = {
  getMenuList,
  getSubMenuList,
  createMenu,
  updateMenu,
  createSubMenu,
  updateSubMenu,
  findByTitle,
  findByTitle_Id,
  findSubByTitle,
  findSubByTitle_Id,
  createRoleSubMenu,
  updateRoleSubMenu,
  getSubMenus,
  createRoleMenu,
  updateRoleMenu,
  getMenus,
  getSubmenuData,
  getRoleSettings,
  getMenusById,
  getSubMenusById,
  getMenuTabs,
  getSubMenuTabs,
  addRoleMenuTab,
  getRoleMenuTabs,
  deleteRoleMenuTab,
  updateRoleMenuTab,
};

export default dao;
