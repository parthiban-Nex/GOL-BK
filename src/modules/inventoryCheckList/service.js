import logger from '../../config/logger.js';
import InventoryCheckListDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addInventoryCheckList = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await InventoryCheckListDao.addInventoryCheckList(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'InventoryCheckList';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.pickupType + ' InventoryCheckList is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('InventoryCheckList service addVehicleInventory Error:', err);
    //next(err);
  }
  return result;
};

const updateInventoryCheckList = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const InventoryCheckListExists =
      await InventoryCheckListDao.getInventoryCheckList(reqData.id);
    if (InventoryCheckListExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'InventoryCheckList';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (InventoryCheckListExists.INVENTORY_CODE != reqData.inventoryCode) {
        message =
          message +
          ' INVENTORY CODE changed from ' +
          InventoryCheckListExists.INVENTORY_CODE +
          ' to ' +
          reqData.inventoryCode +
          ' ,';
      }

      if (InventoryCheckListExists.INVENTORY_DESC != reqData.inventoryDesc) {
        message =
          message +
          ' INVENTORY DESC changed from ' +
          InventoryCheckListExists.INVENTORY_DESC +
          ' to ' +
          reqData.inventoryDesc +
          ' ,';
      }

      if (InventoryCheckListExists.INVENTORY_VER != reqData.inventoryVer) {
        message =
          message +
          ' INVENTORY VERSION changed from ' +
          dockFieldsExists.INVENTORY_VER +
          ' to ' +
          reqData.inventoryVer +
          ' ,';
      }

      if (InventoryCheckListExists.INVENTORY_TYPE != reqData.inventoryType) {
        message =
          message +
          ' INVENTORY TYPE changed from ' +
          InventoryCheckListExists.INVENTORY_TYPE +
          ' to ' +
          reqData.inventoryType +
          ' ,';
      }

      if (InventoryCheckListExists.VEHICLE_TYPE != reqData.vehicleType) {
        message =
          message +
          ' VEHICLE TYPE changed from ' +
          InventoryCheckListExists.VEHICLE_TYPE +
          ' to ' +
          reqData.vehicleType +
          ' ,';
      }
      if (InventoryCheckListExists.ACTIVE != reqData.active) {
        message =
          message +
          ' Status changed from ' +
          InventoryCheckListExists.ACTIVE +
          ' to ' +
          reqData.active +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = await InventoryCheckListDao.updateInventoryCheckList(
        reqData,
        user
      );
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addFitMasterRecentActivity(
              recentActivityData
            );
        }
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('InventoryCheckList service updateInventoryCheckList', err);
    next(err);
  }
  return result;
};

const listInventoryCheckList = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InventoryCheckListDao.listInventoryCheckList(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'InventoryCheckList  Service listInventoryCheckList Error:',
      err
    );
    next(err);
  }
};

const deleteInventoryCheckList = async (id, user) => {
  let result = 'failed';
  try {
    let data = await InventoryCheckListDao.deleteInventoryCheckList(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('InventoryCheckList service deletePickupType', err);
    next(err);
  }
  return result;
};

const listVehicleTypes = async (reqBody) => {
  try {
    const data = await InventoryCheckListDao.listVehicleTypes(reqBody);
    return data;
  } catch (err) {
    logger.error('DockField  Service listInputTypes Error:', err);
  }
};

const TyreSizeService = {
  addInventoryCheckList,
  updateInventoryCheckList,
  listInventoryCheckList,
  deleteInventoryCheckList,
  listVehicleTypes,
};

export default TyreSizeService;
