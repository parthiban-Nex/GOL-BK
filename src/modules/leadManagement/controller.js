import logger from '../../config/logger.js';
import {
    ACTION_GET,
    ACTION_ADD,
    ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import LeadService from './service.js';

const listLeads = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Lead';
        auditData['submenu_name'] = 'List Lead';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Lead data ';
        const data = await LeadService.listLeads(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                leadData: data,
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: false,
                leadData: {},
            });
        }
    } catch (err) {
        logger.error('Lead controller listLeads', err);
        next(err);
    }
};

const createLead = async (req, res, next) => {
    try {
        logger.info(
            'Lead Controller createLead requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData['menu_name'] = 'LeadManagement';
        auditData['submenu_name'] = 'Lead';
        auditData['action'] = ACTION_ADD;
        let result = await LeadService.createLead(req.body, req.user);
        if (result.success) {
            auditData['message'] = 'Lead added successfully ';
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                data: result.data,
            });
        } else {
            auditData['message'] = 'Lead not added';
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            return res.status(500).send({
                requestSuccessful: false,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('Lead controller createLead', err);
        next(err);
    }
}

const updateLead = async (req, res, next) => {
    try {
        logger.info(
            'Lead Controller updateLead requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData['menu_name'] = 'LeadManagement';
        auditData['submenu_name'] = 'Lead';
        auditData['action'] = ACTION_UPDATE;

        let result = await LeadService.updateLead(req.body, req.user);
        if (result === 'success') {
            auditData['message'] = 'Lead Updated successfully ';
            auditData['result'] = 'success';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'Data updated successfully',
            });
        } else {
            auditData['message'] = 'Lead not Updated';
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Lead not Updated',
            });
        }
    } catch (err) {
        logger.error('Lead controller updateLead', err);
        next(err);
    }
}

const controller = {
    listLeads,
    createLead,
    updateLead
};

export default controller;