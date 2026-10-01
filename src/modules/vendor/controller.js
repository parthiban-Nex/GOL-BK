import VendorService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import { datapushMaster } from '../../shared/mobileApiUtility.js';

const addVendor = async (req, res, next) => {
  try {
    logger.info(
      'Vendor Controller addVendor requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    let vendors = await VendorService.addVendor(req.body, req.user)
      .then(async (vendors) => {
        await VendorService.addVendorCompanyMap(req.body.companyId, vendors.id);
        await VendorService.addVendorItemGroupMap(
          req.body.itemGroupId,
          vendors.id
        );
        if (vendors) {
          auditData['message'] = 'Vendor added successfully ';
          auditData['result'] = 'success ';
          auditData['action'] = ACTION_ADD;
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data Saved successfully',
          });
        } else {
          auditData['message'] = 'Vendor not added';
          auditData['result'] = 'failed ';
          auditLog.createAuditLog(req, auditData);
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Data not Saved ',
          });
        }
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  } catch (err) {
    logger.error('Vendor Controller addVendor Error:', err);
    next(err);
  }
};

const getAllVendors = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    const data = await VendorService.getAllVendors(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'Vendor data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vendorData: data,
      });
    } else {
      auditData['message'] = 'Vendor data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Vendor Controller getAllVendors Error:', err);
    next(err);
  }
};

const getAllVendorsByCompany = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    const data = await VendorService.getAllVendorsByCompany(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      auditData['message'] = 'Vendor by company data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vendorData: data,
      });
    } else {
      auditData['message'] = 'Vendor by company data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Vendor Controller getAllVendorsByCompany Error:', err);
    next(err);
  }
};

const getOneVendor = async (req, res, next) => {
  try {
    const vendor = await VendorService.getOneVendor(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: vendor,
    });
  } catch (err) {
    logger.error('Vendor Controller getOneVendor Error:', err);
    next(err);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    logger.info(
      'Vendor Controller updateVendor requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    let {
      id,
      vendorCode,
      vendorName,
      gstin,
      panNumber,
      address1,
      address2,
      state,
      city,
      pincode,
      mobileNumber,
      contactPerson,
      contactPersonMobileNo,
      vendorType,
      marginPercentage,
      status,
      areaName,
    } = req.body;
    let userId = req.user.id;

    const vendorExists = await VendorService.getOneVendor(id);

    if (vendorExists) {
      let data = await VendorService.updateVendor(
        req.body,
        req.user,
        vendorExists
      );
      if (data) {
       // Trigger master push
        const masterPushResult = await datapushMaster();
        logger.info('Master push result: ' + JSON.stringify(masterPushResult));
   
        auditLog.createAuditLog(req, {
          menu_name: 'Master',
          submenu_name: 'Vendor',
          access: 'Portal',
          message: masterPushResult.message,
          result: masterPushResult.success ? 'success' : 'failed',
          action: ACTION_UPDATE,
        });

        auditData['message'] = 'Vendor updated successfully ';
        auditData['result'] = 'success ';
        auditData['action'] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        await VendorService.removeVendorCompanyMap(id);
        await VendorService.removeVendorItemGroupMap(id);
        await VendorService.addVendorCompanyMap(req.body.companyId, id);
        await VendorService.addVendorItemGroupMap(req.body.itemGroupId, id);
        res.status(200).send({
          requestSuccessful: true,
          message: 'Data updated successfully',
        });
      } else {
        auditData['message'] = 'Vendor not Updated';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Vendor not Updated',
        });
      }
    }
  } catch (err) {
    logger.error('Vendor Controller updateVendor Error:', err);
    next(err);
  }
};

const getPincodeData = async (req, res, next) => { 
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    const reqBody = req.body;
    const data = await VendorService.getPincodeData(reqBody); 
    if (data) {
      auditData['message'] = 'Pincode data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        pincodeData: data,
      });
    } else {
      auditData['message'] = 'Pincode data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Vendor Controller getPincodeData Error:', err);
    next(err);
  }
};

const searchAreaName = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const data = await VendorService.searchAreaName(reqBody);
    res.status(200).send({
      requestSuccessful: true,
      areaData: data,
    });
  } catch (err) {
    logger.error('Vendor Controller searchAreaName Error:', err);
    next(err);
  }
};

const listVendors = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    const reqBody = req.body;
    const data = await VendorService.listVendors(reqBody);
    if (data) {
      auditData['message'] = 'Vendor data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vendorData: data,
      });
    } else {
      auditData['message'] = 'Vendor data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Vendor Controller listVendors Error:', err);
    next(err);
  }
};

const listVendorsForPo = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vendor';
    auditData['access'] = 'Portal';
    const reqBody = req.body;
    const data = await VendorService.listVendorsForPo(reqBody,req.user);
    if (data) {
      auditData['message'] = 'Vendor data fetched successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vendorData: data,
      });
    } else {
      auditData['message'] = 'Vendor data not fetched';
      auditData['result'] = 'fail ';
      auditData['action'] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
    }
  } catch (err) {
    logger.error('Vendor Controller listVendors Error:', err);
    next(err);
  }
};
const controller = {
  addVendor,
  getAllVendors,
  getOneVendor,
  updateVendor,
  getPincodeData,
  searchAreaName,
  listVendors,
  listVendorsForPo,
  getAllVendorsByCompany,
};

export default controller;
