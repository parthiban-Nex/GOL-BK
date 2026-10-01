import schemeService from "./service.js";
import auditLog from '../../shared/auditLog.js';
import logger from "../../config/logger.js";
import {
    ACTION_GET,
    ACTION_ADD,
    ACTION_UPDATE,
  } from '../../shared/applicationConstants.js';

const createScheme = async (req, res, next) => {
    let auditData = {};
    try {
        let data = await schemeService.createScheme(req.body, req.user);
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'Repair Type';
        if (data == 'success') {
            auditData['message'] = req.body.repair_type_name + 'Scheme added successfully';
            auditData['result'] = 'success';
            auditData['action'] = 'Add';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data Saved Successfully'
            });
        } else {
            auditData['message'] = 'Scheme not added';
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Scheme Controller createScheme', err);
        next(err);
    };
};

const getSchemeData = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'Repair Type';

        const reqBody = req.body;
        const data = await schemeService.getSchemeData(reqBody);
        if(data) {
            auditData['message'] = 'Get Scheme data';
            auditData['result'] = 'success';
            auditData['action'] = 'Get';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                schemeData: data
            });
        } else {
            auditData['message'] = 'Get Scheme data';
            auditData['result'] = 'failed';
            auditData['action'] = 'Get';
            auditLog.createAuditLog(req, auditData);
            res.status(400).send({
                requestSuccessful: false,
                schemeData: data,
            });
        }
    } catch (err) {
        logger.error('Scheme Controller getSchemeData', err);
        next(err);
    };
};

const createSchemeLabor = async (req, res, next) => {
    let auditData = {};
    try {
        let data = await schemeService.createSchemeLabor(req.body, req.user);
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'Repair Type';
        if (data == 'success') {
            auditData['message'] = req.body.labourCode + 'Scheme labor added successfully';
            auditData['result'] = 'success';
            auditData['action'] = 'Add';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data Saved Successfully'
            });
        } else {
            auditData['message'] = 'Scheme labor not added';
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Scheme Controller createSchemeLabor', err);
        next(err);
    };
};

const getSchemeLaborData = async (req, res, next) => {
    try {
      const auditData = {};
      auditData['menu_name'] = 'Master';
      auditData['submenu_name'] = 'Repair Type';
      auditData['action'] = ACTION_GET;
      auditData['access'] = 'Portal';
      auditData['message'] = 'Get Scheme labor data ';
      const data = await schemeService.getSchemeLaborData(req.body, req.user);
      if (data) {
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          schemeLabor: data,
        });
      } else {
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          itemsData: data,
        });
      }
    } catch (err) {
      logger.error('Scheme Controller getSchemeLaborData Error:', err);
      next(err);
    }
  };
  
  const createSchemePart = async (req, res, next) => {
    let auditData = {};
    try {
        let data = await schemeService.createSchemePart(req.body, req.user);
        auditData['menu_name'] = 'Master';
        auditData['submenu_name'] = 'Repair Type';
        if (data == 'success') {
            auditData['message'] = req.body.partCode + 'Scheme Part added successfully';
            auditData['result'] = 'success';
            auditData['action'] = 'Add';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data Saved Successfully'
            });
        } else {
            auditData['message'] = 'Scheme Part not added';
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Scheme Controller createSchemePart', err);
        next(err);
    };
};

const getSchemePartData = async (req, res, next) => {
    try {
      const auditData = {};
      auditData['menu_name'] = 'Master';
      auditData['submenu_name'] = 'Repair Type';
      auditData['action'] = ACTION_GET;
      auditData['access'] = 'Portal';
      auditData['message'] = 'Get Scheme Part data ';
      const data = await schemeService.getSchemePartData(req.body, req.user);
      if (data) {
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          schemeLabor: data,
        });
      } else {
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          itemsData: data,
        });
      }
    } catch (err) {
      logger.error('Scheme Controller getSchemePartData Error:', err);
      next(err);
    }
  };

const schemeController = {
    createScheme,
    getSchemeData,
    createSchemeLabor,
    getSchemeLaborData,
    createSchemePart,
    getSchemePartData
};

export default schemeController;
