import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import GateInVehicleInventoryService from './service.js';

const addVehicleInventory = async (req, res, next) => {
  try {
    logger.info(
      'GateInVehicleInventory addVehicleInventory requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'GateInVehicleInventory';
    auditData['action'] = ACTION_ADD;
    let result = await GateInVehicleInventoryService.addVehicleInventory(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'GateInVehicleInventory added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'GateInVehicleInventory  Fields not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('GateInVehicleInventory Controller addDockFields Error:', err);
    next(err);
  }
};

const updateVehicleInventory = async (req, res, next) => {
  try {
    logger.info(
      'GateInVehicleInventory Controller updateVehicleInventory requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'GateInVehicleInventory';
    auditData['action'] = ACTION_UPDATE;
    let result = await GateInVehicleInventoryService.updateVehicleInventory(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'GateInVehicleInventory Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'GateInVehicleInventory not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'GateInVehicleInventory not Updated',
      });
    }
  } catch (err) {
    logger.error(
      'GateInVehicleInventory Controller updateTyreSize Error:',
      err
    );
  }
};

const listVehicleInventory = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'GateInVehicleInventory';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get GateInVehicleInventory data ';
    const data = await GateInVehicleInventoryService.listVehicleInventory(
      req.body
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        GateInVehicleInventoryData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        GateInVehicleInventoryData: data,
      });
    }
  } catch (err) {
    logger.error('DockField Controller listPickupType Error:', err);
  }
};

const deleteVehicleInventory = async (req, res, next) => {
  try {
    logger.info(
      'GateInVehicleInventory Controller deleteDockFields requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'GateInVehicleInventory';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await GateInVehicleInventoryService.deleteVehicleInventory(
      id,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'GateInVehicleInventory deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'GateInVehicleInventory deleted successfully',
      });
    } else {
      auditData['message'] = 'GateInVehicleInventory not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'GateInVehicleInventory not deleted',
      });
    }
  } catch (err) {
    logger.error(
      'GateInVehicleInventory Controller deleteVehicleInventory Error:',
      err
    );
    next(err);
  }
};

const updateleadfitstatus = async (req, res) => {
  try {
    const auditData = {};
    const result = await GateInVehicleInventoryService.updateleadfitstatus(req.body);

    auditData['menu_name'] = 'Gate in Visit ';
    auditData['submenu_name'] = 'updateleadfitstatus';
    auditData['access'] = 'Portal';

    if (result.success == true) {
      auditData['message'] = 'Get updateleadfitstatus Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);

      res.status(200).send({
        status: "Success"
      });
    } else {
      auditData['message'] = 'Get updateleadfitstatus Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: "No data found"
      });
    }
  } catch (err) {
    logger.error(
      'GateInVehicleInventory Controller gateinVehicleInventory Error:',
      err
    );
    /*  */
  }
}

const getvisitgateindata = async (req, res, next) => {
  try {
    const auditData = {};
    const result = await GateInVehicleInventoryService.getvisitgateindata(req.body);

    auditData['menu_name'] = 'Gate in Visit ';
    auditData['submenu_name'] = 'GateInVehicleInventory';
    auditData['access'] = 'Portal';

    if (result.success) {
      auditData['message'] = 'Get getvehiclepastvisit Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      let checkList = result.pastcheckListType;

      res.status(200).send({
        requestSuccessful: true,
        visitDetails: result.visitDetails,
        inventoryReport: result.inventory,
        dentScratch: result.dentScratch,
        inventoryPhotos: result.inventoryPhotos,
        signaturePhotos: result.signaturePhotos
      });
    } else {
      auditData['message'] = 'Get getvehiclepastvisit Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: "No vehicle found"
      });
    }
  } catch (err) {
    logger.error(
      'GateInVehicleInventory Controller getvisitgateindata Error:',
      err
    );
    next(err);
  }
}

const gateinVehicleInventory = async (req, res) => {
  try {
    const auditData = {};
    const result = await GateInVehicleInventoryService.gateinVehicleInventory(req.body);

    auditData['menu_name'] = 'Gate in Visit ';
    auditData['submenu_name'] = 'gateinVehicleInventory';
    auditData['access'] = 'Portal';

    if (result.success == true) {
      auditData['message'] = 'Get gateinVehicleInventory Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);

      res.status(200).send({
        requestSuccessful: true,
        gateinVehicle: result.gateinVehicle
      });
    } else {
      auditData['message'] = 'Get getvehiclepastvisit Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: "No data found"
      });
    }
  } catch (err) {
    logger.error(
      'GateInVehicleInventory Controller gateinVehicleInventory Error:',
      err
    );
    /*  */
  }
}

const controller = {
  addVehicleInventory,
  updateVehicleInventory,
  listVehicleInventory,
  deleteVehicleInventory,
  updateleadfitstatus, 
  getvisitgateindata,
  gateinVehicleInventory,
};

export default controller;
