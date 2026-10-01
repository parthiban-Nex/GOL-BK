import LaborScheduleService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const addLaborSchedule = async (req, res, next) => {
  try {
    logger.info(
      'LaborSchedule Controller addLaborSchedule requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_ADD;
    const result = await LaborScheduleService.addLaborSchedule(
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'LaborSchedule added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'LaborSchedule not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller addLaborSchedule Error:', err);
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const laborSchedule = await LaborScheduleService.getOne(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: laborSchedule,
    });
  } catch (err) {
    logger.error('LaborSchedule Controller getOne Error:', err);
    next(err);
  }
};

const updateLaborSchedule = async (req, res, next) => {
  try {
    logger.info(
      'LaborSchedule Controller updateLaborSchedule requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await LaborScheduleService.updateLaborSchedule(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'LaborSchedule Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'LaborSchedule not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'LaborSchedule not Updated',
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller updateLaborSchedule Error:', err);
    next(err);
  }
};

const listLaborSchedule = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get LaborSchedule data ';
    const data = await LaborScheduleService.listLaborSchedule(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        laborScheduleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller listLaborSchedule Error:', err);
    next(err);
  }
};

const getLabourDetails = async (req, res, next) => { 

  // console.log('getLabourDetails req.body ',req.body);
  try {
    // console.log('outletCode : ' + req.user.outlet.outletCode);
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get LaborSchedule data ';
    const data = await LaborScheduleService.getLabourDetails(
      req.body,
      req.user
    );

    console.log('getLabourDetails data ----------------',data);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        laborScheduleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        laborScheduleData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller getLabourDetails Error:', err);
    next(err);
  }
};

const getOslLabourDetails = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get LaborSchedule data ';
    const data = await LaborScheduleService.getOslLabourDetails(
      req.body,
      req.user
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        laborScheduleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        laborScheduleData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller getOslLabourDetails Error:', err);
    next(err);
  }
};

const searchLabourDetails = async (req, res, next) => {
  try {
    const data = await LaborScheduleService.searchLabourDetails(
      req.body,
      req.user
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        labourSearchData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller searchLabourDetails Error:', err);
    next(err);
  }
};

const searchOslLabourDetails = async (req, res, next) => {
  try {
    const data = await LaborScheduleService.searchOslLabourDetails(
      req.body,
      req.user
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        oslLabourSearchData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller searchOslLabourDetails Error:', err);
    next(err);
  }
};

const labourDetailsMobile = async (req, res, next) => {
  try { 
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'LaborSchedule';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';
    auditData['message'] = 'Get LaborSchedule data Mobile';
    const data = await LaborScheduleService.labourDetailsMobile(req.body, req.user);
    let usId = req.user.id.toString();
    if(usId === req.body.userId){
      if (data) {
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
         searchResult: data,
          searchType : "l"
        });
      }
      else {
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: false,
          laborSearchResult: [],
        });
      }
    }
    else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller searchLabourDetails Error:', err);
    next(err);
  }
};

const searchAllLabourDetails = async (req, res, next) => {
  try {
    const data = await LaborScheduleService.searchAllLabourDetails(
      req.body,
      req.user
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        labourSearchData: data,
      });
    }
  } catch (err) {
    logger.error('LaborSchedule Controller searchLabourDetails Error:', err);
    next(err);
  }
};

const controller = {
  addLaborSchedule,
  getOne,
  updateLaborSchedule,
  listLaborSchedule,
  getLabourDetails,
  getOslLabourDetails,
  searchLabourDetails,
  searchOslLabourDetails,
  labourDetailsMobile,
  searchAllLabourDetails
};

export default controller;
