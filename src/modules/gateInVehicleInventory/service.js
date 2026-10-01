import logger from '../../config/logger.js';
import VehicleInventoryDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const addVehicleInventory = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    data = await VehicleInventoryDao.addVehicleInventory(reqData, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'GateInVehicleInventory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.pickupType + ' GateInVehicleInventory is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'GateInVehicleInventory service addVehicleInventory Error:',
      err
    );
  }
  return result;
};

const updateVehicleInventory = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const dockFieldsExists =
      await VehicleInventoryDao.getGateInVehicleInventory(reqData.id);
    if (dockFieldsExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'GateInVehicleInventory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (dockFieldsExists.LABEL != reqData.label) {
        message =
          message +
          ' Name changed from ' +
          dockFieldsExists.NAME +
          ' to ' +
          reqData.label +
          ' ,';
      }
      if (dockFieldsExists.IS_ACTIVE != reqData.status) {
        message =
          message +
          ' status changed from ' +
          dockFieldsExists.IS_ACTIVE +
          ' to ' +
          reqData.status +
          ' ,';
      }

      if (dockFieldsExists.INPUT_TYPE != reqData.inputType) {
        message =
          message +
          ' InputType changed from ' +
          dockFieldsExists.INPUT_TYPE +
          ' to ' +
          reqData.inputType +
          ' ,';
      }
      if (dockFieldsExists.IS_MANDATORY != reqData.isMandatory) {
        message =
          message +
          ' IsMandatory changed from ' +
          dockFieldsExists.IS_MANDATORY +
          ' to ' +
          reqData.isMandatory +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = await VehicleInventoryDao.updateVehicleInventory(
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
    logger.error('pickupType service updateTyreSize', err);
    next(err);
  }
  return result;
};

const listVehicleInventory = async (reqBody) => {
  try {
    const { totalItems, data } =
      await VehicleInventoryDao.listVehicleInventory(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('DockField  Service listDockFields Error:', err);
    next(err);
  }
};

const deleteVehicleInventory = async (id, user) => {
  let result = 'failed';
  try {
    let data = await VehicleInventoryDao.deleteVehicleInventory(id, user);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error('PickupTypeDao service deletePickupType', err);
    next(err);
  }
  return result;
};

const updateleadfitstatus = async (req) => {

  try {
    let data = await VehicleInventoryDao.updateleadfitstatus(req);
    console.log("data.status", data.status);
    if (data.status == true) {
      return {
        success: true,
      }
    } else {
      return {
        success: false
      }
    }
  } catch (err) {
    logger.error('PickupTypeDao service updateleadfitstatus', err);
    next(err);
  }
  return {
    success: false
  }
};

const gateinVehicleInventory = async (req) => {

  try {
    let data = await VehicleInventoryDao.gateinVehicleInventory(req);
    console.log("data.status", data.status);
    if (data.status == true) {
      return {
        success: true,
        gateinVehicle: data.gateinVehicle
      }
    } else {
      return {
        success: false
      }
    }
  } catch (err) {
    logger.error('PickupTypeDao service gateinVehicleInventory', err);
    next(err);
  }
  return {
    success: false
  }
};

const getvisitgateindata = async (req) => {

  let visitDetails = {};

  try {
    const results = await VehicleInventoryDao.getvisitgateindata(req);

    if (results.data) {
      let vehicleDetails = results.data;
      visitDetails = {
        customerVoice: vehicleDetails.customer_voice,
        visitStatus: vehicleDetails.fit_status,
        customerName: vehicleDetails.jobcardcustomer.firstName,
        vehicleRegNo: vehicleDetails.reg_no,
        vehicleKmReading: vehicleDetails.odometer,
        assignedSAUserID: vehicleDetails.user_sa.user_id,
        customerMobileNumber: vehicleDetails.jobcardcustomer.customer_mobileNumber,
        insuranceExpiry: vehicleDetails.vehicle.insuranceExpDate,
        customerAddress: vehicleDetails.jobcardcustomer.address1 + " " + vehicleDetails.jobcardcustomer.address2,
        chassisNumber: vehicleDetails.vehicle.chassisNumber,
        monthlyUsage: vehicleDetails.odometer,
        customerEmail: vehicleDetails.jobcardcustomer.emailId,
        fuellevel: vehicleDetails.fuel_level,
        dmsCustomerId: vehicleDetails.customer_id,
        dmsVehicleId: vehicleDetails.vehicle_id,
        fuelType: vehicleDetails.vehicle.fuelTypeDetails.id,
        vehicleMakeId: vehicleDetails.vehicle.makeId,
        vehicleModelId: vehicleDetails.vehicle.modelId,
        source: vehicleDetails.source,
        sourceType: vehicleDetails.source_type,
        state: vehicleDetails.jobcardcustomer.state,
        city: vehicleDetails.jobcardcustomer.city,
        docType: vehicleDetails.document_type
      }
    }

    if (visitDetails) {
      return {
        success: true,
        visitDetails: visitDetails,
        inventory: results.inventory,
        dentScratch: results.dentScratch,
        inventoryPhotos: results.inventoryPhotos,
        signaturePhotos: results.signaturePhotos
      }
    } else {
      return {
        success: false,
      }
    }

  } catch (err) {
    logger.error('Gate in service getvisitgateindata', err);
    return {
      success: false
    }
  }
}

const TyreSizeService = {
  addVehicleInventory,
  updateVehicleInventory,
  listVehicleInventory,
  deleteVehicleInventory,
  updateleadfitstatus,
  getvisitgateindata,
  gateinVehicleInventory,
};

export default TyreSizeService;
