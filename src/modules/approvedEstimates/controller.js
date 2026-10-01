import logger from "../../config/logger.js";
import approvedEstimatesService from "./service.js";
import { ACTION_GET, ACTION_UPDATE } from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const listApprovedEstimates = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Approved Estimates';
        auditData['submenu_name'] = 'Approved Estimates';
        auditData['action'] = ACTION_GET;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Get Approved Estimates data ';
        const data = await approvedEstimatesService.listApprovedEstimates(req.body, req.user);
        if (data) {
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                approvedEstimates: data.rows,
                totalItems: data.count,
                message: "Data fetched successfully."
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: "Data not fetched."
            });
        }
    } catch (err) {
        logger.error('Approved Estimates listApprovedEstimates controller', err);
        next(err);
    }
};

const setApprovalStatus = async (req, res, next) => {
    try {
        const auditData = {};
        auditData['menu_name'] = 'Approved Estimates';
        auditData['submenu_name'] = 'Approved Estimates';
        auditData['action'] = ACTION_UPDATE;
        auditData['access'] = 'Portal';
        auditData['message'] = 'Approved Estimates setApprovalStatus ';
        const data = await approvedEstimatesService.setApprovalStatus(req.body, req.user);
        if(data){
            auditData['result'] = 'success ';
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: "updated data successfully."
            });
        } else {
            auditData['result'] = 'failed ';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                message: "Data not updated."
            });
        }
    } catch (err) {
        logger.error('Approved Estimates setApprovalStatus controller', err);
        next(err);
    }
}


const approvedEstimatesController = {
    listApprovedEstimates,
    setApprovalStatus
};

export default approvedEstimatesController;
