import JobCardService from "./service.js";
import JobCardDao from "./dao.js";
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js'
import { ACTION_GET, ACTION_ADD, ACTION_UPDATE } from "../../shared/applicationConstants.js";
import axios from 'axios';
import MobileApiTrackService from "../mobileApis/service.js";
import MobileApiTrackDao from "../mobileApis/dao.js";
import TransactionDao from "./dao.js";
import statusConstants from "../../shared/statusConstants.js";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import ExcelJS from 'exceljs';
import sendNotification from "../../shared/fbnotifications.js";
import db from "../index.js";
import { Storage } from '@google-cloud/storage';
const User = db.users
// __filename and __dirname equivalents in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

import PdfUtility from '../../shared/pdfUtility.js'
import EmployeeService from "../employee/service.js";
import { getRemoteToken } from "../../shared/mobileApiUtility.js";
import { get } from "http";
const Items = db.items
const Hsns = db.hsns

const getOTDFailureReasons = async (req, res, next) => {
    try {
        const data = await JobCardService.getOTDFailureReasons();
        res.status(200).send({
            requestSuccessful: true,
            OTDFailureReasonsData: data

        });
    } catch (err) {
        logger.error('JobCard Controller getOTDFailureReasons Error:', err);
        next(err);
    }
}

const getTransactionSubstatuses = async (req, res, next) => {
    try {
        const data = await JobCardService.getTransactionSubstatuses();
        res.status(200).send({
            requestSuccessful: true,
            TransactionSubstatusData: data
        });
    } catch (err) {
        logger.error('JobCard Controller getTransactionSubstatuses Error:', err);
        next(err);
    }
}
//testing
const getCustomerData = async (req, res, next) => {
    try {
        const data = await JobCardService.getCustomerData(req.body.registrationNumber);
        res.status(200).send({
            requestSuccessful: true,
            CustomerData: data

        });
    } catch (err) {
        logger.error("JobCard controller getCustomerData", err);
        next(err);
    }
}

const createJobCard = async (req, res, next) => {
    try {
        let result = await JobCardService.createJobCard(req.body, req.user);
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "JobCard";
        if (result == "success") {
            auditData["message"] =
                "Job Card Created for " +
                req.body.registrationNumber +
                " successfully ";
            auditData["result"] = "success ";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            // Send notification to all employees in the outlet
            if (req.body.parts.length > 0) {
                let outletId = req.user.outlet.id;
                let employess = await EmployeeService.getOutletEmployee(outletId);

                for (let item of employess) {
                    const user = await User.findOne({ where: { employeeId: item.id } });
                    // console.log("user", user.dataValues.fcm_tocken)
                    if (user.dataValues.fcm_tocken) {
                        await sendNotification(user.dataValues.fcm_tocken, {
                            title: "Job Card Created",
                            body: "Job Card Created for " + req.body.registrationNumber,
                        },
                            {
                                target_url: "/spareIssue"  // your dynamic route
                            }
                        )
                    }
                }
            }

            return res.status(200).send({
                requestSuccessful: true,
                message: "Data updated successfully",
            });
        }
        else if (result === 'estimateApprovalRequired') {
            return res.status(400).send({
                requestSuccessful: false,
                message: 'Service estimate must be approved by a service advisor before creating a job card',
            });
        }
        else if (result === 'serviceEstimateNotFound') {
            return res.status(404).send({
                requestSuccessful: false,
                message: 'Service estimate not found for this outlet',
            });
        }
        else if (result === 'noLabor') {
            auditData["message"] = "Job Card Creation fail";
            auditData["result"] = "failed ";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "noLabor",
            });
        }
        else {
            auditData["message"] = "Job Card Creation fail";
            auditData["result"] = "failed ";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data not updated ",
            });
        }
    } catch (err) {
        logger.error("JobCard Controller createServiceEstimate:", err);
        next(err);
    }
};

const createJobCardFromServiceBooking = async (req, res, next) => {
    try {
        const result = await JobCardService.createJobCardFromServiceBooking(req.body, req.user);
        if (result.result === 'success') {
            const auditData = {
                menu_name: 'Transaction',
                submenu_name: 'JobCard',
                message: `Job Card ${result.jobCardNumber} created from service booking ${req.body.serviceBookingId}`,
                result: 'success',
                action: ACTION_ADD,
            };
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Job Card created successfully',
                jobCardDetails: {
                    id: result.jobCardId,
                    jobCardNumber: result.jobCardNumber,
                    serviceBookingId: Number(req.body.serviceBookingId),
                },
            });
        }
        if (result.result === 'alreadyCreated') {
            return res.status(409).send({
                requestSuccessful: false,
                message: 'A job card has already been created for this service booking',
                jobCardDetails: {
                    id: result.jobCardId,
                    jobCardNumber: result.jobCardNumber,
                },
            });
        }
        const errors = {
            serviceBookingNotFound: [404, 'Service booking not found for this outlet'],
            linkedCustomerVehicleNotFound: [400, 'The service booking registration number must be linked to a customer and vehicle'],
            jobCardReferenceDataRequired: [400, 'Valid serviceTypeId, repairTypeId, sourceId, and sourceTypeId are required'],
            jobCardAlreadyInProgress: [409, 'A job card is already in progress for this vehicle'],
            noLabor: [400, 'Please provide at least one labour item'],
        };
        const [statusCode, message] = errors[result.result] || [400, 'Job Card could not be created'];
        return res.status(statusCode).send({ requestSuccessful: false, message });
    } catch (err) {
        logger.error('JobCard Controller createJobCardFromServiceBooking Error:', err);
        next(err);
    }
};

const createInitialPortalJobCard = async (req, res, next) => {
    try {
        const result = await JobCardService.createInitialPortalJobCard(req.body, req.user);
        const errorResponses = {
            invalidDocumentType: [400, 'documentType must be RJC, AJC, MINOR, or MAJOR'],
            serviceBookingAvailable: [409, 'An active service booking is available for this vehicle and mobile number'],
            serviceEstimateAvailable: [409, 'An open service estimate is available for this vehicle'],
            jobCardAlreadyInProgress: [409, 'A job card is already in progress for this vehicle'],
            linkedCustomerNotFound: [404, 'The vehicle customer record could not be found'],
            vehicleCustomerNotLinked: [409, 'The vehicle is not linked to a customer'],
            customerVehicleCreateFailed: [400, 'Customer vehicle could not be created'],
            customerVehicleNotFound: [404, 'Customer and vehicle could not be resolved'],
        };
        if (result.result !== 'success') {
            const [status, message] = errorResponses[result.result] || [400, 'Job card could not be created'];
            return res.status(status).send({ requestSuccessful: false, message });
        }
        return res.status(200).send({
            requestSuccessful: true,
            message: result.message,
            jobCard: {
                jobCardId: result.jobCardId,
                jobCardNumber: result.jobCardNumber,
                customerId: result.customerId,
                vehicleId: result.vehicleId,
                createdCustomerVehicle: result.createdCustomerVehicle,
                ...(result.alternativeMobileNumber ? { alternativeMobileNumber: result.alternativeMobileNumber } : {}),
            },
        });
    } catch (err) {
        logger.error('JobCard Controller createInitialPortalJobCard Error:', err);
        next(err);
    }
};

const savePortalJobCardInspection = async (req, res, next) => {
    try {
        const result = await JobCardService.savePortalJobCardInspection(req.body, req.user);
        return res.status(200).send({
            requestSuccessful: true,
            message: 'Job card inventory and inspection saved successfully',
            jobCardDetails: result,
        });
    } catch (err) {
        logger.error('JobCard Controller savePortalJobCardInspection Error:', err);
        next(err);
    }
};

const listJobCards = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard data ";
        const data = await JobCardService.listJobCards(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCards", err);
        next(err);
    }
};

const listJobCards_v1 = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard data ";
        const data = await JobCardService.listJobCards_v1(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCards", err);
        next(err);
    }
};

const getJobCardViewByIdAdmin = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "Get JobCard Admin View By ID"
        };

        const data = await JobCardService.getJobCardViewByIdAdmin(req.query.id, req.user);

        if (data && data.data != null) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                JobCardDetails: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);

            return res.status(400).send({
                requestSuccessful: false,
                JobCardDetails: ""
            });
        }

    } catch (err) {
        console.log(err);
        logger.error('JobCard Controller getJobCardViewByIdAdmin Error:', err);
        next(err);
    }
};

const listJobCardsAdmin = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard Admin data ";
        const data = await JobCardService.listJobCardsAdmin(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCardsAdmin", err);
        next(err);
    }
};

const listJobCardsByMappedOutlets = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard mapped-outlet data ";
        const data = await JobCardService.listJobCardsByMappedOutlets(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCardsByMappedOutlets", err);
        next(err);
    }
};

const listJobCardsData = async (req, res, next) => {

    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard data ";
        const data = await JobCardService.listJobCardsData(req.body, req.user);
        // console.log('from node js backend 111111111111111111',req.user)
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCardsData", err);
        next(err);
    }
};

const dashboard = async (req, res, next) => {
    try {
        const data = await JobCardService.dashboard(req.user);
        // console.log('data from controller dashboard----------------',data)
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                dashboard: data,
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                dashboard: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};


const dashboardEpro = async (req, res) => {
    try {
        // console.log('req body in controller dashboardEpro----------------',req.body)
        const data = await JobCardService.dashboardEpro(req.body, req.user);
        // console.log('data from controller dashboard----------------',data)
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboardEpro", err);
        res.status(500).send({
            requestSuccessful: false,
            message: err.message || "Internal server error",
        });
    }
};

const dashboardRevenue = async (req, res) => {
    try {
        // console.log('req body in controller dashboardEpro----------------',req)
        const data = await JobCardService.dashboardRevenue(req.body, req.user);
        // console.log('data from controller dashboard----------------',data)
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};


const dashboardAjcRjc = async (req, res) => {
    try {

        const data = await JobCardService.dashboardAjcRjc(req.body, req.user); 

        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                data
            });
        }
    } catch (err) {
        // logger.error("JobCard controller dashboard", err);
        // next(err);
        logger.error("JobCard controller dashboardAjcRjc", err);
        res.status(500).send({
            requestSuccessful: false,
            message: err.message || "Internal server error",
        });
    }
};


const dashboardLabourParts = async (req, res) => {
    try {

        const data = await JobCardService.dashboardLabourParts(req.body, req.user);

        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                data
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};


const dashboardCustomerFlow = async (req, res) => {
    try {

        const data = await JobCardService.dashboardCustomerFlow(req.body, req.user);

        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data: data,
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                data: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};

const dashboardVehicleFlow = async (req, res) => {
    try {

        const data = await JobCardService.dashboardVehicleFlow(req.body, req.user);

        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                dashboardVehicleMetrics: data,
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                dashboardVehicleMetrics: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboardVehicleMetrics", err);
        next(err);
    }
};


const jcUpdateByFit = async (req, res, next) => {

    try {

        // const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);

        // const result = await JobCardService.jcUpdateByFit(req.body, req.user);

        const [trackLogId, result] = await Promise.all([
            MobileApiTrackService.createMobileApiReq(req, req.user),
            JobCardService.jcUpdateByFit(req.body, req.user)
        ]);

        if (trackLogId) {
            await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
        }

        const auditData = {
            menu_name: "Mobile Api",
            submenu_name: "JC Update By FIT",
            action: ACTION_UPDATE,
            message: "Dashboard Mobile Api",
            access: "Mobile",
            result: result.status ? "success" : "failed"
        };

        if (result.status == true) {
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: result.status,
                jcDetails: result.message
            });

        } else {
            auditLog.createAuditLog(req, auditData);
            return res.status(400).send({
                requestSuccessful: false,
                errorDescription: result.message,
            });

        }

    } catch (err) {
        logger.error("JobCard controller jcUpdateByFit", err);
        next(err);
    }
};



const dashboardMobile = async (req, res, next) => {
    try {
        const data = await JobCardService.dashboard(req.user);
        // console.log('data from controller dashboard Mobile----------------',data)
        const auditData = {};
        auditData["menu_name"] = "Mobile Api";
        auditData["submenu_name"] = "Dashboard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Mobile";
        auditData["message"] = "Get Dashboard data ";
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                dashboard: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(400).send({
                requestSuccessful: false,
                dashboard: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};

const dashboardInflow = async (req, res, next) => {
    try {
        const data = await JobCardService.dashboardInflow(req.user);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                jobcard: data.transactionData,
                billingsRJC: data.billingRJCData,
                billingsAJC: data.billingAJCData,
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                jobcard: [],
                billingsRJC: [],
                billingsAJC: []
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboardInflow", err);
        next(err);
    }
};

const generateJobCardPDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('JobCard Controller generatePDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF("jobCard", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="jobCard.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        console.log(err)
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}

const getJobCardDetailsById = async (req, res, next) => {


    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "Get JobCard Details By ID"
        };

        logger.info('JobCard Controller Get JobCard Details By Id requestData:' + req.query.id);

        const data = await JobCardService.getJobCardDetailsById(req.query.id, req.user);

        // console.log('data in controller', data);

        if (data && data.data != null) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                JobCardDetails: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);

            return res.status(400).send({
                requestSuccessful: false,
                JobCardDetails: ""
            });
        }

    } catch (err) {
        console.log(err);
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}

// Outlet-scoped edit load for /jobcard/outletEdit (no created_by filter).
const getJobCardDetailsByIdOutlet = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "Get JobCard Details By ID (Outlet)"
        };

        logger.info('JobCard Controller Get JobCard Details By Id Outlet requestData:' + req.query.id);

        const data = await JobCardService.getJobCardDetailsByIdOutlet(req.query.id, req.user);

        if (data && data.data != null) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                JobCardDetails: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);

            return res.status(400).send({
                requestSuccessful: false,
                JobCardDetails: ""
            });
        }

    } catch (err) {
        console.log(err);
        logger.error('JobCard Controller getJobCardDetailsByIdOutlet Error:', err);
        next(err);
    }
}

const getJobCardViewById = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "Get JobCard View By ID"
        };

        logger.info('JobCard Controller Get JobCard View By Id requestData:' + req.query.id);

        const data = await JobCardService.getJobCardViewById(req.query.id, req.user);

        // console.log('data in controller', data);

        if (data && data.data != null) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                JobCardDetails: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);

            return res.status(400).send({
                requestSuccessful: false,
                JobCardDetails: ""
            });
        }

    } catch (err) {
        console.log(err);
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}

// Outlet view loader — labour/OSL filtered to status IN (1,2), matching legacy service_view.
const getJobCardViewByIdOutlet = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "Get JobCard View By ID (Outlet)"
        };

        logger.info('JobCard Controller Get JobCard View By Id Outlet requestData:' + req.query.id);

        const data = await JobCardService.getJobCardViewByIdOutlet(req.query.id, req.user);

        if (data && data.data != null) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                JobCardDetails: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            return res.status(400).send({
                requestSuccessful: false,
                JobCardDetails: ""
            });
        }
    } catch (err) {
        console.log(err);
        logger.error('JobCard Controller getJobCardViewByIdOutlet Error:', err);
        next(err);
    }
}

const generateJobCardPreInvoicePDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('JobCard Controller generatePDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        // console.log('ajc data------------------',data)
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;


        let pdfBuffer = {};

        if (data.document_type == "AJC" && data.paid_by_status == 0) {
            pdfBuffer = await PdfUtility.generatePDF("jobCardPreInvoiceCustomer", data);
        } else {
            pdfBuffer = await PdfUtility.generatePDF("jobCardPreInvoice", data);
        }

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="jobCard.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }


    } catch (err) {
        console.log(err)
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}



const generateJobCardInvoicePDF = async (req, res, next) => {
    try {

        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('JobCard Controller generatePDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        if (data.outlet && data.outlet.companyId == 3) {
            data.showTerms = true;
        } else {
            data.showTerms = false;
        }
        const outlet = data.outlet;

        if (outlet && (outlet.companyId === 3 || outlet.companyId === 8)) {
            if (outlet.name && outlet.name.toUpperCase().includes('NMSA')) {
                data.includeFranchise = false;
            } else {
                data.includeFranchise = true;
            }
        } else {
            data.includeFranchise = false;
        }
        if (outlet && (outlet.companyId === 2 || outlet.companyId === 4 || outlet.companyId === 6 || outlet.companyId === 5 || outlet.companyId === 7 || outlet.companyId === 9)) {
            console.log('Company ID is 2 or 4, setting showHeaderAllPages to true');
            data.showHeaderAllPages = true;
        } else {
            console.log('Company ID is not 2 or 4, setting showHeaderAllPages to false');
            data.showHeaderAllPages = false;
        }

        let pdfBuffer = {};

        if (data.document_type == "AJC" && data.paid_by_status == 0) {
            pdfBuffer = await PdfUtility.generatePDF("jobCardInvoiceCustomer", data);
        } else {
            pdfBuffer = await PdfUtility.generatePDF("labourParts", data);
        }

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="jobCard.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }


    } catch (err) {
        console.log(err)
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}




const generateJobCardPreInvoiceInsurancePDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('JobCard Controller generatePDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        let pdfBuffer = {};
        pdfBuffer = await PdfUtility.generatePDF("jobCardPreInvoiceInsurance", data);
        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="jobCard.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }


    } catch (err) {
        console.log(err)
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}


const generateJobCardInvoiceInsurancePDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePDF"
        };

        logger.info('JobCard Controller generatePDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        let pdfBuffer = {};
        pdfBuffer = await PdfUtility.generatePDF("jobCardInvoiceInsurance", data);
        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="jobCard.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }


    } catch (err) {
        console.log(err)
        logger.error('JobCard Controller generatePDF Error:', err);
    }
}




const listBillJobCards = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCard data ";
        const data = await JobCardService.listBillJobCards(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listJobCards", err);
        next(err);
    }
};

const createMechanicMapping = async (req, res, next) => {
    try {
        let result = await JobCardService.createMechanicMapping(req.body, req.user);
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "Mechanic";
        if (result == "success") {
            auditData["message"] =
                "Job Card Created for " +
                req.body.registrationNumber +
                " successfully ";
            auditData["result"] = "success ";
            auditData["action"] = "Add";
            // auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data updated successfully",
            });
        } else if (result === "greater") {
            auditData["message"] = "Mechanic Creation failed";
            auditData["result"] = "failed ";
            auditData["action"] = "Add";
            return res.status(200).send({
                requestSuccessful: true,
                message: "greater",
            });
        } else {
            auditData["message"] = "Mechanic Creation fail";
            auditData["result"] = "failed ";
            auditData["action"] = "Add";
            //auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data not updated ",
            });
        }
    } catch (err) {
        logger.error("JobCard Controller createMechanicMapping:", err);

        next(err);
    }
};


const updateJobCard = async (req, res, next) => {
    try {
        logger.info(
            "JobCard Controller updateJobCard requestData: " +
            JSON.stringify(req.body)
        );
        let result = await JobCardService.updateJobCard(
            req.body,
            req.user
        );
        if (result === 'jobCardNotFound') {
            return res.status(404).send({ requestSuccessful: false, message: 'Job card not found for this outlet' });
        }
        if (result === 'jobCardLineNotFound') {
            return res.status(404).send({ requestSuccessful: false, message: 'One or more line items do not belong to this job card' });
        }
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "JobCard";
        if (result == "success") {
            auditData["message"] =
                "JobCard updated for " +
                req.body.registrationNumber +
                " successfully ";
            auditData["result"] = "success ";
            auditData["action"] = "Update";
            auditLog.createAuditLog(req, auditData);
            // Send notification to all employees in the outlet
            if (req.body.parts.length > 0) {
                let outletId = req.user.outlet.id;
                let employess = await EmployeeService.getOutletEmployee(outletId);

                for (let item of employess) {
                    const user = await User.findOne({ where: { employeeId: item.id } });
                    //   console.log("user",user.dataValues.fcm_tocken)
                    if (user.dataValues.fcm_tocken) {
                        await sendNotification(user.dataValues.fcm_tocken, {
                            title: "Job Card Updated",
                            body: "Job Card Updated for " + req.body.registrationNumber,

                        }, {
                            target_url: "/spareIssue"  // your dynamic route
                        }
                        )
                    }
                }
            }
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data updated successfully",
            });
        }
        else if (result === 'noLabor') {
            auditData["message"] = "JobCard not updated";
            auditData["result"] = "failed ";
            return res.status(200).send({
                requestSuccessful: true,
                message: "noLabor",
            });
        }
        else {
            auditData["message"] = "JobCard not updated";
            auditData["result"] = "failed ";
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data not updated ",
            });
        }
    } catch (err) {
        logger.error("JobCard Controller updateJobCard:", err);
        next(err);
    }
};

const updateJobCardLineApproval = async (req, res, next) => {
    try {
        const result = await JobCardService.updateJobCardLineApproval(req.body, req.user);
        if (result.result === 'jobCardNotFound') {
            return res.status(404).send({ requestSuccessful: false, message: 'Job card not found for this outlet' });
        }
        if (result.result === 'lineNotFound') {
            return res.status(404).send({ requestSuccessful: false, message: 'Job card line item not found' });
        }
        if (result.result !== 'success') {
            return res.status(400).send({ requestSuccessful: false, message: 'Invalid line item type' });
        }
        return res.status(200).send({
            requestSuccessful: true,
            message: 'Job card line approval updated successfully',
            lineItem: result.line,
            jobCardStatus: result.status,
            jobCardStatusValue: result.statusValue,
            statusAdvancedToInProgress: result.statusAdvanced,
        });
    } catch (err) {
        logger.error('JobCard Controller updateJobCardLineApproval:', err);
        next(err);
    }
};

// Outlet edit save — same as updateJobCard but also persists parts discount to parts_issues.
const updateJobCardOutlet = async (req, res, next) => {
    try {
        logger.info(
            "JobCard Controller updateJobCardOutlet requestData: " +
            JSON.stringify(req.body)
        );
        let result = await JobCardService.updateJobCardOutlet(req.body, req.user);
        const auditData = {
            menu_name: "Transaction",
            submenu_name: "JobCard",
            action: "Update",
        };
        if (result == "success") {
            auditData["message"] =
                "JobCard (outlet) updated for " + req.body.registrationNumber + " successfully ";
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data updated successfully",
            });
        } else if (result === 'noLabor') {
            auditData["message"] = "JobCard not updated";
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "noLabor",
            });
        } else {
            auditData["message"] = "JobCard not updated";
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Data not updated ",
            });
        }
    } catch (err) {
        logger.error("JobCard Controller updateJobCardOutlet:", err);
        next(err);
    }
};






const getMechanicMapping = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard->MechanicMapping";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get getMechanicMapping data ";
        const data = await JobCardService.getMechanicMapping(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getMechanicMapping", err);
        next(err);
    }
};





const getJobcardLabor = async (req, res, next) => {
    try {
        const auditData = {};
        const data = await JobCardService.getJobcardLabor(req.body, req.user);
        res.status(200).send({
            requestSuccessful: true,
            JobCardData: data,
        });

    } catch (err) {
        logger.error("JobCard controller getMechanicMapping", err);
        next(err);
    }
};



const updateJobcardStatus = async (req, res, next) => {
    try {
        logger.info('updateJobcardStatus requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Transaction";
        auditData['submenu_name'] = "JobCard";
        auditData['action'] = ACTION_UPDATE;
        // const id = req.body.id;
        let result = await JobCardService.updateJobcardStatus(req.body, req.user);

        // console.log('result from controller---',result)
        if (result.status == "success") {
            // let rsaResult = await JobCardService.updateToRsa(req.body,req.user); 
            // console.log('rsaResult from controller---',rsaResult)   
            // if(rsaResult.status==1){
            //     auditData['menu_name'] = "RSA API UPDATE";
            //     auditData['submenu_name'] = "RSA UPDATE API CALL";
            //     auditData['action'] = ACTION_UPDATE;
            //     auditData['message'] += ' | '+rsaResult.message;

            // auditData['result'] = "success";
            // auditLog.createAuditLog(req, auditData);
            // }

            auditData['message'] = "Job Card Status updated ";
            auditData['result'] = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'Updated successfully',
            });
        } else if (result.status == "ajcfailed") {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'ajcFailed',
            });
        }
        else if (result.status == "GstCheckFailed") {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed Invalid Gst % ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'mechFailed',
            });
        }
        else if (result.status == "mechFailed") {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'mechFailed',
            });
        }
        else if (result.status == "gatepassValidationFailed") {
            auditData['message'] = "Gatepass validation failed";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: false,
                message: result.message
            });
        }
        else if (result.status == "fitApiFailed") {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: "fitApiFailed",
                errorMessage: result.message,
            });
        }
        else if (result.status == "saveJcData") {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: "fitApiFailed",
                errorMessage: result.message,
            });
        }
        else {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Failed',
            });
        }
    } catch (err) {
        logger.error('JobCard Controller deleteBatteryOem Error:', err);
        next(err);
    }
}



// const updateJobcardStatusFit = async (req, res, next) => { 
//     try {
//         logger.info('updateJobcardStatus requestData:' + JSON.stringify(req.body));
//         const auditData = {}; 
//         auditData['menu_name'] = "Mobile Api";
//         auditData['submenu_name'] = "Jobcard Update from fit app";
//         auditData['action'] = ACTION_UPDATE;
//         // const id = req.body.id;
//         let result = await JobCardService.updateJobcardStatusFit(req.body, req.user);

//         console.log('result from controller---',result)
//         if (result.status == "success") {
//             // let rsaResult = await JobCardService.updateToRsa(req.body,req.user);
//             // if(rsaResult.status==1){
//             //     auditData['menu_name'] = "RSA API UPDATE";
//             //     auditData['submenu_name'] = "RSA UPDATE API CALL";
//             //     auditData['action'] = ACTION_UPDATE;
//             //     auditData['message'] += ' | '+rsaResult.message;

//             // auditData['result'] = "success";
//             // auditLog.createAuditLog(req, auditData);
//             // }

//             auditData['message'] = "Job Card Status updated ";
//             auditData['result'] = "success";
//             auditLog.createAuditLog(req, auditData);
//             res.status(200).send({
//                 requestSuccessful: true,
//                 message: 'Updated successfully',
//             });
//         } else if (result.status == "ajcfailed") {
//             auditData['message'] = "Not updated";
//             auditData['result'] = "failed ";
//             auditLog.createAuditLog(req, auditData);
//             return res.status(400).send({
//                 requestSuccessful: false,
//                 errorDescription: result.status,
//             });
//         }
//          else if (result.status == "GstCheckFailed") {
//             auditData['message'] = "Not updated";
//             auditData['result'] = "failed Invalid Gst % ";
//             auditLog.createAuditLog(req, auditData);
//             return res.status(400).send({
//                 requestSuccessful: false,
//                 errorDescription: result.status,
//             });
//         }
//          else if (result.status == "mechFailed") {
//             auditData['message'] = "Not updated";
//             auditData['result'] = "failed ";
//             auditLog.createAuditLog(req, auditData);
//             return res.status(400).send({
//                 requestSuccessful: false,
//                 errorDescription: result.status,
//             });
//         }
//          else if (result.status == "fitApiFailed") {
//             auditData['message'] = "Not updated";
//             auditData['result'] = "failed ";
//             auditLog.createAuditLog(req, auditData);
//             return res.status(400).send({

//                 requestSuccessful: false,
//                 errorDescription: result.status,
//                         });
//         } 
//         else {
//             auditData['message'] = "Not updated";
//             auditData['result'] = "failed ";
//             auditLog.createAuditLog(req, auditData);
//             return res.status(400).send({
//                requestSuccessful: false,
//                 errorDescription: "something went wrong in DMS Api",
//             });
//         }
//     } catch (err) {
//         logger.error('JobCard Controller updateJobcardStatusFit Error:', err);
//         next(err);
//     }
// }

//original function


const updateJobcardStatusFit = async (req, res, next) => {
    try {
        logger.info("updateJobcardStatusFit request", req.body);

        const trackLogId = MobileApiTrackService.createMobileApiReq(req, req.user);



        const auditData = {
            menu_name: "Mobile Api",
            submenu_name: "Jobcard Update from fit app",
            action: ACTION_UPDATE,
        };

        const result = await JobCardService.updateJobcardStatusFit(
            req.body,
            req.user
        );

        const isSuccess = result.code === statusConstants.SUCCESS;

        if (result.message && trackLogId) {
            await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
        }

        auditData.message = result.message;
        auditData.result = isSuccess ? "success" : "failed";
        auditLog.createAuditLog(req, auditData);

        if (isSuccess) {
            return res.status(200).send({
                requestSuccessful: true,
                message: result.message,
            });
        }

        return res.status(400).send({
            requestSuccessful: false,
            errorDescription: result.message,
        });
    } catch (err) {
        logger.error("Controller error updateJobcardStatusFit", err);
        next(err);
    }
};

const generateWorkOrderPDF = async (req, res, next) => {
    // console.log('line num 666',)
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "WorkOrder",
            action: "GET",
            access: "Portal",
            message: "Generate WorkOrder PDF"
        };

        logger.info('JobCard Controller generateWorkOrderPDF : ' + req.query.billNo);

        const data = await JobCardService.getOslScheduleByWOB(req.query.billNo, req.user.outlet);
        data['base64Logo'] = base64Logo
        const templatePath = path.resolve(__dirname, 'workorder.hbs');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        const html = template(data);

        // Launch Puppeteer and generate the PDF
        const browser = await puppeteer.launch();
        // const browser = await puppeteer.launch({
        //     executablePath: '/usr/bin/chromium-browser',
        //         args: ['--no-sandbox', '--disable-setuid-sandbox'],
        //   })
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        const pdfOptions = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        };

        const pdfBuffer = await page.pdf(pdfOptions);

        if (pdfBuffer) {
            auditData.result = "success";


            // Close the browser
            await browser.close();

            // Set response headers and send the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="workorder.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";

            // Close the browser
            await browser.close();

            // Send an error response
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generatePDF Error:', err);
        if (browser) await browser.close();
        next(err);
    }
};
//testing
const getOslScheduleByWOB = async (req, res, next) => {
    try {
        const data = await JobCardService.getOslScheduleByWOB(req.body, req.user.outlet);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                WOBData: data
            });
        } else {
            res.status(200).send({
                requestSuccessful: true,
                WOBData: data
            });
        }
    } catch (err) {
        logger.error("JobCard controller getOslScheduleByWOB", err);
        next(err);
    }
}

//using utility function
const WorkOrderPDF = async (req, res, next) => {
    // console.log('line num 756',)
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "WorkOrder",
            action: "GET",
            access: "Portal",
            message: "Generate WorkOrder PDF"
        };

        logger.info('JobCard Controller generateWorkOrderPDF : ' + req.query.billNo);

        const data = await JobCardService.getOslScheduleByWOB(req.query.billNo, req.query.vendorId, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF('workorder', data);

        if (pdfBuffer) {
            auditData.result = "success";

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="workorder.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generatePDF Error:', err);
        next(err);
    }
};

const generateLabourPDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GenerateLabourPDF"
        };

        logger.info('JobCard Controller generateLabourPDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        let pdfBuffer = {}
        if (data.document_type == "AJC") {
            pdfBuffer = await PdfUtility.generatePDF("labourCustomer", data);
        } else {
            pdfBuffer = await PdfUtility.generatePDF("labour", data);
        }

        // pdfBuffer = await PdfUtility.generatePDF("labour", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            // Close the browser
            //await browser.close();
            // Set response headers and send the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Labour.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            //await browser.close();
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generateLabourPDF Error:', err);
        //if (browser) await browser.close();
    }
}


const generateLabourInsurancePDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GenerateLabourPDF"
        };

        logger.info('JobCard Controller generateLabourPDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;



        const pdfBuffer = await PdfUtility.generatePDF("labourInsurance", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            // Close the browser
            //await browser.close();
            // Set response headers and send the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Labour.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            //await browser.close();
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generateLabourPDF Error:', err);
        //if (browser) await browser.close();
    }
}

const oslWorkOrders = async (req, res, next) => {
    try {
        const data = await JobCardService.oslWorkOrders(req.body.transactionId);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                WorkOrderData: data
            });
        } else {
            res.status(200).send({
                requestSuccessful: true,
                WorkOrderData: data
            });
        }
    } catch (err) {
        logger.error("JobCard controller oslWorkOrders", err);
        next(err);
    }
}

const listGatePassJobCards = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get JobCards";
        const data = await JobCardService.listGatePassJobCards(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                GatePassJobCardsData: data,
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                GatePassJobCardsData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller listGatePassJobCards", err);
        next(err);
    }
};


//original function
const downloadGatePass = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "WorkOrder",
            action: "GET",
            access: "Portal",
            message: "Generate WorkOrder PDF"
        };

        logger.info('JobCard Controller downloadGatePass :', req.query.jobcardNo);

        const data = await JobCardService.getGatePassData(req.query.jobcardNo, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;
        const pdfBuffer = await PdfUtility.generatePDF('gatepass', data);
        if (pdfBuffer) {
            auditData.result = "success";

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="gatepass.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generatePDF Error:', err);
        if (browser) await browser.close();
        next(err);
    }
};

const constructBDOJson = async (sellerDetails, buyerDetails, invoiceNo, jcParts) => {

    // naming confusing is here sellerDetails is customer details who is buyer
    // buyerDetails is seller whom is outlet details  
    // console.log("inside constructBDOJson",req); 
    // fetch buyer and seller details
    // Normalize sellerDetails (array or object)
    const sellerDetailsData = Array.isArray(sellerDetails)
        ? sellerDetails[0]
        : sellerDetails;

    // Normalize buyerDetails (Sequelize instance or plain object)
    const buyerDetailsData =
        typeof buyerDetails?.get === 'function'
            ? buyerDetails.get()
            : buyerDetails;

    //   console.log("sellerDetailsData", sellerDetailsData);
    //   console.log("buyerDetailsData", buyerDetailsData);
    // console.log("sellerDetailsData",sellerDetailsData);
    // console.log("buyerDetailsData",buyerDetailsData);
    // console.log("invoiceNo",invoiceNo);
    //  console.log("jcParts",jcParts);



    const BDOJsonObj = {};
    const TranDtls = {};
    const DocDtls = {};
    const SellerDtls = {};
    const BuyerDtls = {};
    const DispDtls = {};
    const ShipDtls = {};
    const ValDtls = {};
    const PayDtls = {};
    const RefDtls = {};
    const ItemList = {};
    // const AddlDocDtls = {};
    // const ExpDtls = {};
    // const EwbDtls = {};
    const DocPerdDtls = {};

    TranDtls.TaxSch = "GST";
    TranDtls.SupTyp = "B2B";
    TranDtls.RegRev = "N";
    TranDtls.EcmGstin = "";
    TranDtls.IgstonIntra = "";
    TranDtls.supplydir = null;

    DocDtls.Typ = "INV";
    DocDtls.No = invoiceNo;
    const date = new Date();
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 330); // Convert to IST

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    DocDtls.Dt = `${day}-${month}-${year}`;


    // SellerDtls.Gstin = "33AAGCM0329K1ZM";
    // SellerDtls.LglNm = "ki Mobility Solutions Private Limited";
    // SellerDtls.TrdNm = "ki Mobility Solutions Private Limited";
    // SellerDtls.Addr1 = "22D/1, Samaya Nallur Road, Opp. Fathima College";
    // SellerDtls.Addr2 = "Alavai Nagar";
    // SellerDtls.Loc =  "Vadalur";
    // SellerDtls.Pin = 607303;
    // SellerDtls.Stcd =   "33"; 
    // SellerDtls.Ph = "9600047693";
    // SellerDtls.Em ="mytvscvservice.vadalur@tvs.in";


    // BuyerDtls.Gstin = "33AQEPK6104F1ZC";
    // BuyerDtls.LglNm = "Roushan Singh";
    // BuyerDtls.TrdNm = "Roushan Singh";
    // BuyerDtls.Pos =  "33"; 
    // BuyerDtls.Addr1 = "Chennai";
    // BuyerDtls.Addr2 ="Navalur";
    // BuyerDtls.Loc = "CHENNAI";
    // BuyerDtls.Pin = 600119;
    // BuyerDtls.Stcd = "33"; 
    // BuyerDtls.Ph = "9865284004";
    // BuyerDtls.Em = "";

    // DispDtls.Nm ="ki Mobility Solutions Private Limited";
    // DispDtls.Addr1 = "22D/1, Samaya Nallur Road, Opp. Fathima College";
    // DispDtls.Addr2 = "Alavai Nagar";
    // DispDtls.Loc = "Vadalur";
    // DispDtls.Pin = 607303;
    // DispDtls.Stcd = "33"; 



    // Fetch Seller Details
    //   SellerDtls.Gstin = sellerDetailsData?.customer_gstin || "";
    //   SellerDtls.LglNm = sellerDetailsData?.decryptedCustomerName || "";
    //   SellerDtls.TrdNm = sellerDetailsData?.decryptedCustomerName || "";
    //   SellerDtls.Addr1 = sellerDetailsData?.customer_address || "";
    //   SellerDtls.Addr2 = sellerDetailsData?.customer_address || "";
    //   SellerDtls.Loc = sellerDetailsData?.customer_city || "";
    //   SellerDtls.Pin = parseInt(sellerDetailsData?.customer_pincode || "0");
    //   SellerDtls.Stcd =  sellerDetailsData?.customer_gstin ? sellerDetailsData.customer_gstin.toString().substring(0, 2) : ""; 
    //   SellerDtls.Ph = sellerDetailsData?.decryptedMobileNumber || "";
    //   SellerDtls.Em = sellerDetailsData?.decryptedEmail || "";
    // console.log("sellerDetailsData---------------------",buyerDetailsData);
    // console.log("buyerDetailsData---------------------",parseInt(buyerDetailsData?.pincode || "0"));

    SellerDtls.Gstin = buyerDetailsData?.gstIn || "";
    SellerDtls.LglNm = buyerDetailsData?.outletName || "";
    SellerDtls.TrdNm = buyerDetailsData?.outletName || "";
    SellerDtls.Addr1 = buyerDetailsData?.address1 || "";
    SellerDtls.Addr2 = buyerDetailsData?.address2 || "";
    SellerDtls.Loc = buyerDetailsData?.city || "";
    SellerDtls.Pin = parseInt(buyerDetailsData?.pincode || "0");
    SellerDtls.Stcd = buyerDetailsData?.gstIn ? buyerDetailsData.gstIn.toString().substring(0, 2) : "";
    SellerDtls.Ph = buyerDetailsData?.contactPhoneNumber || "";
    SellerDtls.Em = buyerDetailsData?.email || "";


    BuyerDtls.Gstin = sellerDetailsData?.gstinNumber || "";
    BuyerDtls.LglNm = sellerDetailsData?.decryptedCustomerName || "";
    BuyerDtls.TrdNm = sellerDetailsData?.decryptedCustomerName || "";
    BuyerDtls.Pos = sellerDetailsData.gstinNumber.toString().substring(0, 2);
    BuyerDtls.Addr1 = sellerDetailsData?.address1 || "";
    BuyerDtls.Addr2 = sellerDetailsData?.address2 || "";
    BuyerDtls.Loc = sellerDetailsData?.customer_city || "";
    BuyerDtls.Pin = parseInt(sellerDetailsData?.customer_pincode || "0");
    BuyerDtls.Stcd = sellerDetailsData?.gstinNumber ? sellerDetailsData.gstinNumber.toString().substring(0, 2) : "";
    BuyerDtls.Ph = sellerDetailsData?.decryptedMobileNumber || "";
    BuyerDtls.Em = "";


    //   BuyerDtls.Gstin = buyerDetailsData?.gstIn || "";
    //   BuyerDtls.LglNm = buyerDetailsData?.outletName || "";
    //   BuyerDtls.TrdNm = buyerDetailsData?.outletName || "";
    //   BuyerDtls.Pos =  buyerDetailsData.gstIn.toString().substring(0, 2); 
    //   BuyerDtls.Addr1 = buyerDetailsData?.address1 || "";
    //   BuyerDtls.Addr2 = buyerDetailsData?.address2 || "";
    //   BuyerDtls.Loc = buyerDetailsData?.city || "";
    //   BuyerDtls.Pin = parseInt(buyerDetailsData?.pincode || "0");
    //   BuyerDtls.Stcd = buyerDetailsData?.gstIn? buyerDetailsData.gstIn.toString().substring(0, 2) : ""; 
    //   BuyerDtls.Ph = buyerDetailsData?.contactPhoneNumber || "";
    //   BuyerDtls.Em = "";

    // Dispatch Details
    DispDtls.Nm = sellerDetailsData?.decryptedCustomerName || "";
    DispDtls.Addr1 = sellerDetailsData?.address1 || "";
    DispDtls.Addr2 = sellerDetailsData?.address2 || "";
    DispDtls.Loc = sellerDetailsData?.customer_city || "";
    DispDtls.Pin = parseInt(sellerDetailsData?.customer_pincode || "0");
    DispDtls.Stcd = sellerDetailsData?.gstinNumber ? sellerDetailsData.gstinNumber.toString().substring(0, 2) : "";

    ShipDtls.Gstin = null;
    ShipDtls.LglNm = null;
    ShipDtls.TrdNm = null;
    ShipDtls.Addr1 = null;
    ShipDtls.Addr2 = null;
    ShipDtls.Loc = null;
    ShipDtls.Pin = null;
    ShipDtls.Stcd = null;

    // Processing Item List
    let Items = [];
    let totalInvoiceAmount = 0;
    let AssVal = 0;
    let CgstVal = 0;
    let SgstVal = 0;
    let IgstVal = 0;
    let discount = 0;
    let cessVal = 0;


    let sn = 1;
    let orderLine = 1;

    jcParts.forEach(part => {
        if (part.part_code && part.part_code.trim() !== "") {
            const item = {};

            item.SlNo = String(sn);
            item.PrdDesc = part.part_description.replace(/[^\w\s\-]/g, ''); // Simulate RemoveSpecialChar
            item.IsServc = "Y";
            item.HsnCd = part.hsn_code || "";

            item.BchDtls = {
                Nm: part.part_code.length <= 20 ? part.part_code.replace(/[^\w\s\-]/g, '') : "",
                Expdt: "",
                wrDt: ""
            };

            item.Barcde = "";
            item.Qty = parseInt(part.quantity);
            item.FreeQty = 0;
            item.Unit = "NOS";

            const rate = parseFloat(part.rate);
            const unitPrice = parseFloat(rate.toFixed(2));
            const itemPrice = parseFloat((rate * part.quantity).toFixed(2));

            item.UnitPrice = unitPrice;
            item.TotAmt = itemPrice;

            const discountAmount = parseFloat(part.dicount_amount || 0);
            item.Discount = parseFloat(discountAmount.toFixed(2));

            const partAmountAfterDiscount = parseFloat(part.rateafterDiscount || rate);
            item.AssAmt = parseFloat(partAmountAfterDiscount.toFixed(2));
            item.PreTaxVal = 0;

            const cgstRate = parseFloat(part.cgst || 0);
            const sgstRate = parseFloat(part.sgst || 0);
            const igstRate = parseFloat(part.igst || 0);

            const cgstAmt = parseFloat(((partAmountAfterDiscount * cgstRate) / 100).toFixed(2));
            const sgstAmt = parseFloat(((partAmountAfterDiscount * sgstRate) / 100).toFixed(2));
            const igstAmt = parseFloat(((partAmountAfterDiscount * igstRate) / 100).toFixed(2));

            item.CgstRt = cgstRate;
            item.CgstAmt = cgstAmt;
            item.SgstRt = sgstRate;
            item.SgstAmt = sgstAmt;
            item.IgstRt = igstRate;
            item.IgstAmt = igstAmt;

            item.CesRt = 0;
            item.CesAmt = 0;
            item.CesNonAdvlAmt = 0;
            item.StateCesRt = 0;
            item.StateCesAmt = 0;
            item.StateCesNonAdvlAmt = 0;
            item.OthChrg = 0;

            const itemTotalAmount = parseFloat((partAmountAfterDiscount + cgstAmt + sgstAmt + igstAmt).toFixed(2));
            item.TotItemVal = itemTotalAmount;

            item.OrdLineRef = String(orderLine);
            item.OrgCntry = "IN";
            item.PrdSlNo = "";

            item.AttribDtls = [{
                Nm: "",
                Val: ""
            }];

            item.EGST = {
                nilrated_amt: "0",
                exempted_amt: "0",
                non_gst_amt: "0",
                reason: "",
                debit_gl_id: "0",
                debit_gl_name: "",
                credit_gl_id: "0",
                credit_gl_name: "",
                sublocation: ""
            };

            Items.push(item);

            // Totals
            totalInvoiceAmount += itemTotalAmount;
            AssVal += partAmountAfterDiscount;
            CgstVal += cgstAmt;
            SgstVal += sgstAmt;
            IgstVal += igstAmt;
            discount += discountAmount;

            sn++;
            orderLine++;
        }
    });

    // console.log( '22222222222222222222222',Items)
    ItemList.Item = Items;

    if (typeof AssVal === "number" && !isNaN(AssVal)) {
        ValDtls.AssVal = parseFloat(AssVal.toFixed(2));
    } else {
        ValDtls.AssVal = parseFloat(AssVal);
    }

    ValDtls.CgstVal = CgstVal;
    ValDtls.SgstVal = SgstVal;

    if (typeof IgstVal === "number" && !isNaN(IgstVal)) {
        ValDtls.IgstVal = parseFloat(IgstVal.toFixed(2));
    } else {
        ValDtls.IgstVal = parseFloat(IgstVal);
    }

    if (typeof discount === "number" && !isNaN(discount)) {
        ValDtls.Discount = parseFloat(discount.toFixed(2));
    } else {
        ValDtls.Discount = parseFloat(discount);
    }

    ValDtls.CesVal = cessVal;
    ValDtls.StCesVal = 0;
    ValDtls.OthChrg = 0;
    ValDtls.RndOffAmt = 0;

    let totalRoundOff = Math.round(totalInvoiceAmount);

    // let roundOffAmt = totalRoundOff - totalInvoiceAmount;
    // roundOffAmt = parseFloat(roundOffAmt.toFixed(2));
    // ValDtls.RndOffAmt = roundOffAmt;

    if (typeof totalInvoiceAmount === "number" && !isNaN(totalInvoiceAmount)) {
        ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
    } else {
        ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
    }

    ValDtls.Discount = 0;
    ValDtls.TotInvValFc = null;

    PayDtls.Nm = "";
    PayDtls.Accdet = "";
    PayDtls.Mode = "";
    PayDtls.Fininsbr = "";
    PayDtls.Payterm = "";
    PayDtls.Payinstr = "";
    PayDtls.Crtrn = "";
    PayDtls.Dirdr = "";
    PayDtls.Crday = 0;
    PayDtls.Paidamt = 0;
    PayDtls.Paymtdue = 0;

    RefDtls.InvRm = "";
    DocPerdDtls.InvStDt = null;
    DocPerdDtls.InvEndDt = null;
    RefDtls.DocPerdDtls = DocPerdDtls;

    let PrecDocDtls = [];
    let PrecDocDtlsObj = {
        InvNo: null,
        InvDt: null,
        OthRefNo: ""
    };
    PrecDocDtls.push(PrecDocDtlsObj);
    RefDtls.PrecDocDtls = PrecDocDtls;

    let ContrDtls = [];
    let ContrDtlsObj = {
        RecAdvRefr: "",
        RecAdvDt: "",
        Tendrefr: "",
        Contrrefr: "",
        Extrefr: "",
        Projrefr: "",
        Porefr: "",
        PoRefDt: ""
    };
    ContrDtls.push(ContrDtlsObj);
    RefDtls.ContrDtls = ContrDtls;

    let AddlDocDtls = [];
    let AddlDocDtlsObj = {
        Url: "",
        Docs: "",
        Info: ""
    };
    AddlDocDtls.push(AddlDocDtlsObj);

    let ExpDtls = {
        ShipBNo: null,
        ShipBDt: null,
        Port: null,
        RefClm: null,
        ForCur: null,
        CntCode: null,
        ExpDuty: null
    };

    let EwbDtls = {
        Transid: "",
        Transname: "",
        Distance: "",
        Transdocno: null,
        TransdocDt: null,
        Vehno: "",
        Vehtype: "",
        TransMode: ""
    };

    BDOJsonObj.TranDtls = TranDtls;
    BDOJsonObj.DocDtls = DocDtls;
    BDOJsonObj.SellerDtls = SellerDtls;
    BDOJsonObj.BuyerDtls = BuyerDtls;
    BDOJsonObj.DispDtls = DispDtls;
    BDOJsonObj.ShipDtls = ShipDtls;
    BDOJsonObj.ItemList = ItemList;
    BDOJsonObj.ValDtls = ValDtls;
    BDOJsonObj.PayDtls = PayDtls;
    BDOJsonObj.RefDtls = RefDtls;
    BDOJsonObj.AddlDocDtls = AddlDocDtls;
    BDOJsonObj.ExpDtls = ExpDtls;
    BDOJsonObj.EwbDtls = EwbDtls;

    const BDOobj = {};
    BDOobj.grandTotal = totalInvoiceAmount;
    BDOobj.data = JSON.stringify(BDOJsonObj);
    // console.log('BDO JSON Payload :', BDOobj);

    return BDOobj;
    // s

}

const saveBillingDetails = async (req, res) => {
    const { body } = req;
    const { user } = req;
    const { jobCardNo } = body;
    let updateResult = ''
    const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);

    const isAJCJobCard = jobCardNo?.startsWith('AJC');


    let isAjcFlag = false;


    //   return false;
    // console.log('user---------',user);
    // console.log('body---------',body);

    const auth = await getRemoteToken();
    //   console.log("Auth Token:", auth);

    if (auth?.token) {
        // Status mapping
        const statusMapping = {
            1: "Open",
            2: "Work In Progress",
            3: "Ready For Billing",
            4: "Billing",
            5: "Delivered",
            6: "Cancelled",
        };

        const status = body?.status;
        const statusText = statusMapping[status] || "Unknown";

        // Prepare payload
        const updatePayload = {
            userId: auth.userId,
            authenticationToken: auth.token,
            jcId: body.id,
            updateType: "status",
            payload: { status: statusText },
        };

        // console.log("Payload for status update from saveBilling function:", updatePayload);

        // Call external API
        // try {
        //     const updateResponse = await axios.post(
        //         "https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php",
        //         updatePayload,
        //         { headers: { "Content-Type": "application/json" } }
        //     );

        //     updateResult = updateResponse.data;


        //     // console.log("Response from status update:", updateResult);

        // } catch (err) {
        //     logger.error("Error in tvsfit savejcdetails api:", err)
        //     if (err.response) {
        //         return res.status(err.response.status).json({
        //             requestSuccessful: false,
        //             message: err.response.data?.errorDescription || "External API error",
        //             // error: err.response.data,
        //         });
        //     }

        // }

        const savejcdata = await JobCardDao.savejcdetails(req.body, statusText);
        // console.log("savejcdata",savejcdata);

        if (savejcdata !== "") {
            return res.status(400).send({
                requestSuccessful: false,
                message: savejcdata,
            });
        } else {
            updateResult = {
                isSuccessfull: true
            }
        }

        // updateResult = true;

        if (updateResult && updateResult.isSuccessfull === true) {
            // if (updateResult ) {
            // console.log('11111111111111111');
            // Track API request/response
            try {
                const payload = {
                    user_id: user?.id || null,
                    api_url: "billing_status_update",
                    action: "POST",
                    request_json: JSON.stringify(updatePayload),
                    response_json: JSON.stringify(updateResult),
                    user_role_id: user?.roleid || null,
                    ip_address: "dms-web-application",
                    user_agent: "internal-server-operation",
                };

                await MobileApiTrackDao.createMobileApiReq(payload);
            } catch (err) {
                logger.error("Error in MobileApiTrackDao.createMobileApiReq:", {
                    error: err.stack,
                    reqData,
                    user,
                });
            }
            // generate invoice number
            const invoiceNo = await JobCardService.generateBillNumber(body.billType, user.outlet.outletCode);
            try {
                const [companyDetails, transactionCustomerDetails, outletDetails] = await Promise.all([
                    JobCardService.getCompanyDetails(user.outlet.companyId),
                    JobCardService.getTransactionCustomerDetails(body.id),
                    JobCardService.getOutletDetails(user.outlet.id)
                ]);

                const [scheduleDetails, oslScheduleDetails, partsIssueDetails] = await Promise.all([
                    JobCardService.getScheduleDetails(body.id),
                    JobCardService.getOslScheduleDetails(body.id),
                    JobCardService.getPartsIssueDetails(body.id)
                ]);

                // console.log('partsIssueDetails-------------',partsIssueDetails);
                //  console.log('scheduleDetails-------------',scheduleDetails);
                //  return false;
                const companyDetailsData = companyDetails.get();
                const transactionCustomerDetailsData = transactionCustomerDetails[0];

                //   console.log('transactionCustomerDetailsData---------',transactionCustomerDetailsData);



                const labourArr = [];
                let labourQuantitys = 0;
                let labourAmountAfterDiscounts = 0;
                let labourCgstAmounts = 0;
                let labourSgstAmounts = 0;
                let labourIgstAmounts = 0;
                let labourLineTotals = 0;

                scheduleDetails.forEach((schedule, index) => {


                    const rot = schedule.rot_code;
                    const labourQuantity = schedule.quantity;
                    const labourRate = schedule.amount;
                    const labourMargin = schedule.additionalMargin;
                    let labourDiscount = (labourRate + labourMargin) * (schedule.discount_percentage / 100);
                    const labourDepreciations = schedule.depreciation_per || 0;

                    let laboAmount = labourRate + labourMargin;
                    let labourAmountAfterDis = laboAmount - labourDiscount;

                    let labourDepreciation = labourDepreciations;

                    let labourCgst, labourSgst, labourIgst;

                    labourCgst = schedule.cgst;
                    labourSgst = schedule.sgst;
                    labourIgst = schedule.igst;


                    const labourCgstAmount = (labourAmountAfterDis * labourCgst) / 100;
                    const labourSgstAmount = (labourAmountAfterDis * labourSgst) / 100;
                    const labourIgstAmount = (labourAmountAfterDis * labourIgst) / 100;
                    const labourTotalTax = labourCgstAmount + labourSgstAmount + labourIgstAmount;
                    const labourLineTotal = labourAmountAfterDis + labourTotalTax;

                    if (schedule.repairTypeId != 2) {
                        labourQuantitys += labourQuantity;
                        labourAmountAfterDiscounts += labourAmountAfterDis;
                        labourCgstAmounts += labourCgstAmount;
                        labourSgstAmounts += labourSgstAmount;
                        labourIgstAmounts += labourIgstAmount;
                        labourLineTotals += labourLineTotal;
                    }


                    if (rot) {
                        const labour = {
                            part_description: schedule.description,
                            part_code: schedule.rot_code,
                            hsn_code: '998729',
                            quantity: labourQuantity,
                            rate: (laboAmount / labourQuantity).toFixed(2),
                            rateafterDiscount: labourAmountAfterDis.toFixed(2),
                            dicount_amount: labourDiscount.toFixed(2),
                            cgst: 0,
                            sgst: 0,
                            igst: 0,
                            cgstAmount: labourCgstAmount.toFixed(2),
                            sgstAmount: labourSgstAmount.toFixed(2),
                            igstAmount: labourIgstAmount.toFixed(2),
                            total: labourLineTotal.toFixed(2),
                            taxamount: labourTotalTax.toFixed(2),
                        };

                        // outlet.state_code === customer.state_code
                        if (true) {
                            labour.cgst = labourCgst;
                            labour.sgst = labourSgst;
                            labour.igst = 0;
                        } else {
                            labour.cgst = 0;
                            labour.sgst = 0;
                            labour.igst = labourIgst;
                        }

                        // special rule for FU01A
                        // if (labour.igst === 0 && labour.cgst === 0 && labour.sgst === 0) {
                        //   if (schedule.rot_code === "FU01A") {
                        //     labour.cgst = 0;
                        //     labour.sgst = 0;
                        //     labour.igst = 0;
                        //   } else {
                        //     labour.igst = 18;
                        //   }
                        // }
                        if (schedule.repairTypeId != 2) {
                            labourArr.push(labour);
                        }

                    }
                });

                // console.log(labourArr);

                const oslLabourArr = [];
                let oslLabourQuantitys = 0;
                let oslLabourAmountAfterDiscounts = 0;
                let oslLabourCgstAmounts = 0;
                let oslLabourSgstAmounts = 0;
                let oslLabourIgstAmounts = 0;
                let oslLabourLineTotals = 0;

                oslScheduleDetails.forEach((osl_labour, i) => {
                    const oslrot_code = osl_labour.rot_code;
                    const oslrot_description = osl_labour.description;
                    const oslsaccode = '998729';
                    const oslLabourQuantity = osl_labour.quantity;
                    const oslLabourRate = osl_labour.amount;
                    const oslLabour_discount = 0;
                    const oslLaboAmount = oslLabourQuantity * oslLabourRate;
                    const oslsuppliermargin = osl_labour.marginPercentage;
                    const oslAdditionalMargin = osl_labour.additionalMargin;
                    const oslLabourAmount = oslLaboAmount - oslLabour_discount;

                    const dec = oslsuppliermargin / 100;
                    const oslmarginAmount = oslLabourAmount / (1 - dec) + oslAdditionalMargin;
                    const oslLabourAmountAfterDis = oslmarginAmount;
                    const oslLabourAmountbeforedis = oslmarginAmount;

                    let oslLabourDepreciation;
                    let oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
                    let oslLabour_discount_final = oslLabour_discount;
                    oslLabourDepreciation = osl_labour.depreciation_per;
                    oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
                    oslLabour_discount_final = oslLabour_discount;
                    let oslLabourCgst, oslLabourSgst, oslLabourIgst;
                    oslLabourCgst = osl_labour.cgst;
                    oslLabourSgst = osl_labour.sgst;
                    oslLabourIgst = osl_labour.igst;
                    const oslLabourCgstAmount = oslLabourAmountAfterDiscount * (oslLabourCgst / 100);
                    const oslLabourSgstAmount = oslLabourAmountAfterDiscount * (oslLabourSgst / 100);
                    const oslLabourIgstAmount = oslLabourAmountAfterDiscount * (oslLabourIgst / 100);

                    const oslLabourtotalTax = oslLabourCgstAmount + oslLabourSgstAmount + oslLabourIgstAmount;
                    const oslLabourLineTotal = oslLabourAmountAfterDiscount + oslLabourtotalTax;

                    if (oslrot_code) {
                        // const isSameState = outlet.State.Code === customer.State.Code;
                        const isSameState = true;
                        const cgst = isSameState ? oslLabourCgst : 0;
                        const sgst = isSameState ? oslLabourSgst : 0;
                        const igst = isSameState ? 0 : oslLabourIgst;

                        oslLabourArr[i] = {
                            part_description: oslrot_description,
                            part_code: oslrot_code,
                            hsn_code: oslsaccode,
                            quantity: oslLabourQuantity,
                            rate: (oslLabourAmountbeforedis / oslLabourQuantity).toFixed(2),
                            rateafterDiscount: oslLabourAmountbeforedis.toFixed(2),
                            dicount_amount: 0,
                            cgst: cgst || oslLabourCgst,
                            sgst: sgst || oslLabourSgst,
                            igst: igst || oslLabourIgst,
                            cgstAmount: oslLabourCgstAmount.toFixed(2),
                            sgstAmount: oslLabourSgstAmount.toFixed(2),
                            igstAmount: oslLabourIgstAmount.toFixed(2),
                            total: oslLabourLineTotal.toFixed(2),
                            taxamount: oslLabourtotalTax.toFixed(2),
                        };
                    }

                    oslLabourQuantitys += oslLabourQuantity;
                    oslLabourAmountAfterDiscounts += oslLabourAmountAfterDiscount;
                    oslLabourCgstAmounts += oslLabourCgstAmount;
                    oslLabourSgstAmounts += oslLabourSgstAmount;
                    oslLabourIgstAmounts += oslLabourIgstAmount;
                    oslLabourLineTotals += oslLabourLineTotal;
                });
                // console.log('oslLabourArr',oslLabourArr);
                const partsArr = [];
                partsIssueDetails.forEach(part => {
                    // Skip repair_type == 2
                    //   if (part.repair_type === 2) return;
                    const quantity = part.quantity;
                    const rate = part.rate;
                    const discount = part.discount;
                    const amount = quantity * rate;
                    const amountAfterDiscount = amount - discount;
                    const cgst = part.cgst;
                    const sgst = part.sgst;
                    const igst = part.igst;
                    const cgstAmount = (amountAfterDiscount * cgst) / 100;
                    const sgstAmount = (amountAfterDiscount * sgst) / 100;
                    const igstAmount = (amountAfterDiscount * igst) / 100;
                    if (part.repair_type != 2) {
                        const totalTax = cgstAmount + sgstAmount + igstAmount;
                        const lineTotal = amountAfterDiscount + totalTax;
                        partsArr.push({
                            part_description: part.item_name,
                            part_code: part.item_code,
                            hsn_code: part.hsn_code,
                            quantity: quantity,
                            rate: rate,
                            rateafterDiscount: amountAfterDiscount,
                            dicount_amount: discount,
                            cgst: cgst,
                            sgst: sgst,
                            igst: igst,
                            cgstAmount: cgstAmount,
                            sgstAmount: sgstAmount,
                            igstAmount: igstAmount,
                            total: lineTotal,
                            taxamount: totalTax
                        });
                    }
                });
                // console.log(partsArr);
                let jcParts = [];
                if ((partsArr && partsArr.length > 0) ||
                    (labourArr && labourArr.length > 0) ||
                    (oslLabourArr && oslLabourArr.length > 0)) {

                    jcParts = [
                        ...(partsArr || []),
                        ...(labourArr || []),
                        ...(oslLabourArr || [])
                    ];
                }
                // console.log('jcParts',jcParts);
                //   console.log('companyDetails',companyDetailsData.enable_einvoice);
                //   console.log('transactionCustomerDetails',transactionCustomerDetailsData.customerCategory);
                //   console.log('outletDetails',outletDetails);


                if (isAJCJobCard) {
                    if (companyDetailsData.enable_einvoice === 1) {
                        const PaidByStatusValue = await TransactionDao.getTransaction(body.id);
                        if (PaidByStatusValue?.dataValues?.status_new == 0) {
                            isAjcFlag = true;
                            const insuranceDetailsByJcId =
                                await TransactionDao.getInsuranceDetailByTransId(body.id);
                            if (!insuranceDetailsByJcId) return;
                            const dummyNum = "9677700234"

                            const {
                                gstin_number: gstinNumber,
                                insurance_provider_name: decryptedCustomerName,

                                insurance_city: customer_city,
                                insurance_pincode: customer_pincode,
                                insurance_address: address1,
                                insurance_address: address2,
                            } = insuranceDetailsByJcId.dataValues;

                            const insuranceData = {
                                gstinNumber,
                                decryptedCustomerName,
                                address1,
                                address2,
                                customer_city,
                                customer_pincode,
                                decryptedMobileNumber: dummyNum
                            };

                            // console.log('Mapped Insurance Data:', insuranceData);
                            const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJson(insuranceData, outletDetails, invoiceNo, jcParts);

                            const transaction_updates = {
                                transaction_id: body.id,
                                invoice_number: invoiceNo,
                                grand_total: invoiceTotalAmt,
                                pass_args: BDOJsonStr,
                                created_by: user.id
                            };

                            const transactionUpdateResult = await JobCardService.createTransactionUpdate(transaction_updates);

                            //   console.log('transactionUpdateResult',transactionUpdateResult);
                            if (!transactionUpdateResult?.success) {
                                throw new Error(transactionUpdateResult?.error);
                            }

                            const transUpdateLastID = transactionUpdateResult.data.dataValues.id;


                            // API Request to Submit Invoice
                            const payload = {
                                BDOData: BDOJsonStr,
                                application_name: 'TVSFIT',
                                process_name: 'Job Card',
                                process_id: body.id,
                                created_at: new Date().toISOString(),
                            };

                            //   console.log('Sending Invoice Payload...');
                            //   const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
                            //     headers: { 'Content-Type': 'application/json' },
                            //   });

                                   
                                    let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (companyDetailsData?.id === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (companyDetailsData?.id === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });
                            // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, {
                            //     headers: { 'Content-Type': 'application/json' },
                            // });

                            //   console.log('API Response From BDO Portal:', apiResponse.data);
                            const IRNResponseData = apiResponse.data.data;

                            // Handle API Response
                            if (apiResponse.data.message == 'Success') {
                                if (IRNResponseData.irnStatus == 0) {

                                    await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                                        bdo_status: '2',
                                        response_arg: JSON.stringify(IRNResponseData.data.Error),
                                        created_by: user.id
                                    });
                                } else {
                                    await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                                        bdo_id: IRNResponseData.AckNo,
                                        invoice_bdoack_no: IRNResponseData.AckNo,
                                        invoice_bdoack_date: IRNResponseData.AckDt,
                                        irn_no: IRNResponseData.Irn,
                                        bdo_status: '1',
                                        qr_code: IRNResponseData.QRCode,
                                        signed_qr_code: IRNResponseData.SignedQRCode,
                                        process_status: '1',
                                        response_arg: JSON.stringify(IRNResponseData),
                                    });
                                }
                            } else {

                                await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                                    bdo_status: '2',
                                    response_arg: JSON.stringify(apiResponse.data.Error),
                                    created_by: user.id
                                });
                            }

                            const error = apiResponse.data.Error;

                            let ErrorMessage = '';
                            let ErrorObject = null;

                            if (typeof error === 'string') {
                                ErrorMessage = apiResponse.data.Error
                            } else if (typeof error === 'object') {
                                ErrorObject = Object.keys(error)[0];
                                ErrorMessage = error[ErrorObject]
                            } else {
                                ErrorMessage = 'something went wrong'
                            }

                            if (apiResponse.data.status_code === 2) {
                                return res.status(500).json({ requestSuccessful: true, status_code: 2, message: ErrorMessage, ...(ErrorObject && { error_code: ErrorObject }) });
                            }


                        }
                    }
                }
                if (companyDetailsData.enable_einvoice === 1 && transactionCustomerDetailsData.customerCategory === "B2B" && isAjcFlag != true) {
                    // console.log('inside if');
                    const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJson(transactionCustomerDetails, outletDetails, invoiceNo, jcParts);
                    // console.log('BDOJson',data);

                    const transaction_updates = {
                        transaction_id: body.id,
                        invoice_number: invoiceNo,
                        grand_total: invoiceTotalAmt,
                        pass_args: BDOJsonStr,
                        created_by: user.id
                    };

                    const transactionUpdateResult = await JobCardService.createTransactionUpdate(transaction_updates);

                    //   console.log('transactionUpdateResult',transactionUpdateResult);
                    if (!transactionUpdateResult?.success) {
                        throw new Error(transactionUpdateResult?.error);
                    }

                    const transUpdateLastID = transactionUpdateResult.data.dataValues.id;
                    ;

                    // API Request to Submit Invoice
                    const payload = {
                        BDOData: BDOJsonStr,
                        application_name: 'TVSFIT',
                        process_name: 'Job Card',
                        process_id: body.id,
                        created_at: new Date().toISOString(),
                    };

                    //   console.log('Sending Invoice Payload...');
                    //   const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
                    //     headers: { 'Content-Type': 'application/json' },
                    //   });

                   
                    // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, {
                    //     headers: { 'Content-Type': 'application/json' },
                    // });

                       let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (companyDetailsData?.id === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (companyDetailsData?.id === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });

                    //   console.log('API Response From BDO Portal:', apiResponse.data);
                    const IRNResponseData = apiResponse.data.data;

                    // Handle API Response
                    if (apiResponse.data.message == 'Success') {
                        if (IRNResponseData.irnStatus == 0) {

                            await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                                bdo_status: '2',
                                response_arg: JSON.stringify(IRNResponseData.data.Error),
                                created_by: user.id
                            });
                        } else {
                            await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                                bdo_id: IRNResponseData.AckNo,
                                invoice_bdoack_no: IRNResponseData.AckNo,
                                invoice_bdoack_date: IRNResponseData.AckDt,
                                irn_no: IRNResponseData.Irn,
                                bdo_status: '1',
                                qr_code: IRNResponseData.QRCode,
                                signed_qr_code: IRNResponseData.SignedQRCode,
                                process_status: '1',
                                response_arg: JSON.stringify(IRNResponseData),
                            });
                        }
                    } else {

                        await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                            bdo_status: '2',
                            response_arg: JSON.stringify(apiResponse.data.Error),
                            created_by: user.id
                        });
                    }

                    const error = apiResponse.data.Error;

                    let ErrorMessage = '';
                    let ErrorObject = null;

                    if (typeof error === 'string') {
                        ErrorMessage = apiResponse.data.Error
                    } else if (typeof error === 'object') {
                        ErrorObject = Object.keys(error)[0];
                        ErrorMessage = error[ErrorObject]
                    } else {
                        ErrorMessage = 'something went wrong'
                    }

                    if (apiResponse.data.status_code === 2) {
                        return res.status(500).json({ requestSuccessful: true, status_code: 2, message: ErrorMessage, ...(ErrorObject && { error_code: ErrorObject }) });
                    }
                }

                // console.log('else body');
                const auditData = {};
                auditData['menu_name'] = "Transaction";
                auditData['submenu_name'] = "Billing";
                auditData['action'] = ACTION_UPDATE;
                let result = await JobCardService.saveBillingDetails(req.body, req.user);
                if (trackLogId) {
                    await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
                }
                if (result === 'success') {
                    auditData['message'] = "Billing table updated ";
                    auditData['result'] = "success";
                    auditLog.createAuditLog(req, auditData);
                    res.status(200).send({
                        requestSuccessful: true,
                        message: 'Updated successfully',
                    });
                }
                else {
                    auditData['message'] = "Not updated";
                    auditData['result'] = "failed ";
                    auditLog.createAuditLog(req, auditData);
                    return res.status(200).send({
                        requestSuccessful: true,
                        message: 'Update fail',
                    });
                }
            } catch (err) {
                logger.error('JobCard Controller saveBillingDetails Error:', err);
                return res.status(400).send({
                    requestSuccessful: false,
                    message: 'Error in BDO Portal E-Invoice',
                });

            }

        } else {
            //  console.log('2222222222222222222');
            return res.status(200).send({
                requestSuccessful: false,
                message: "Error is tvsFit",
            });
        }


    } else {
        return res.status(200).send({
            requestSuccessful: false,
            message: "Error in tvsfit auth token generation",
        });
    }


    // return res.status(200).send({
    //     requestSuccessful: true,
    //     message: "Invoice number generated successfully",
    // });

}


const saveBillingDetailsFit = async (req, res) => {
    const { body } = req;
    const { user } = req;
    const { jobCardNo } = body;
    let updateResult = ''
    const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);
    const isAJCJobCard = jobCardNo?.startsWith('AJC');


    let isAjcFlag = false;
    // generate invoice number
    const invoiceNo = await JobCardService.generateBillNumber(body.billType, user.outlet.outletCode);
    try {
        const [companyDetails, transactionCustomerDetails, outletDetails] = await Promise.all([
            JobCardService.getCompanyDetails(user.outlet.companyId),
            JobCardService.getTransactionCustomerDetails(body.id),
            JobCardService.getOutletDetails(user.outlet.id)
        ]);

        const [scheduleDetails, oslScheduleDetails, partsIssueDetails] = await Promise.all([
            JobCardService.getScheduleDetails(body.id),
            JobCardService.getOslScheduleDetails(body.id),
            JobCardService.getPartsIssueDetails(body.id)
        ]);

        const companyDetailsData = companyDetails.get();
        const transactionCustomerDetailsData = transactionCustomerDetails[0];
        const labourArr = [];
        let labourQuantitys = 0;
        let labourAmountAfterDiscounts = 0;
        let labourCgstAmounts = 0;
        let labourSgstAmounts = 0;
        let labourIgstAmounts = 0;
        let labourLineTotals = 0;

        scheduleDetails.forEach((schedule, index) => {


            const rot = schedule.rot_code;
            const labourQuantity = schedule.quantity;
            const labourRate = schedule.amount;
            const labourMargin = schedule.additionalMargin;
            let labourDiscount = (labourRate + labourMargin) * (schedule.discount_percentage / 100);
            const labourDepreciations = schedule.depreciation_per || 0;

            let laboAmount = labourRate + labourMargin;
            let labourAmountAfterDis = laboAmount - labourDiscount;

            let labourDepreciation = labourDepreciations;

            let labourCgst, labourSgst, labourIgst;

            labourCgst = schedule.cgst;
            labourSgst = schedule.sgst;
            labourIgst = schedule.igst;


            const labourCgstAmount = (labourAmountAfterDis * labourCgst) / 100;
            const labourSgstAmount = (labourAmountAfterDis * labourSgst) / 100;
            const labourIgstAmount = (labourAmountAfterDis * labourIgst) / 100;
            const labourTotalTax = labourCgstAmount + labourSgstAmount + labourIgstAmount;
            const labourLineTotal = labourAmountAfterDis + labourTotalTax;

            if (schedule.repairTypeId != 2) {
                labourQuantitys += labourQuantity;
                labourAmountAfterDiscounts += labourAmountAfterDis;
                labourCgstAmounts += labourCgstAmount;
                labourSgstAmounts += labourSgstAmount;
                labourIgstAmounts += labourIgstAmount;
                labourLineTotals += labourLineTotal;
            }


            if (rot) {
                const labour = {
                    part_description: schedule.description,
                    part_code: schedule.rot_code,
                    hsn_code: '998729',
                    quantity: labourQuantity,
                    rate: (laboAmount / labourQuantity).toFixed(2),
                    rateafterDiscount: labourAmountAfterDis.toFixed(2),
                    dicount_amount: labourDiscount.toFixed(2),
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    cgstAmount: labourCgstAmount.toFixed(2),
                    sgstAmount: labourSgstAmount.toFixed(2),
                    igstAmount: labourIgstAmount.toFixed(2),
                    total: labourLineTotal.toFixed(2),
                    taxamount: labourTotalTax.toFixed(2),
                };

                // outlet.state_code === customer.state_code
                if (true) {
                    labour.cgst = labourCgst;
                    labour.sgst = labourSgst;
                    labour.igst = 0;
                } else {
                    labour.cgst = 0;
                    labour.sgst = 0;
                    labour.igst = labourIgst;
                }

                // special rule for FU01A
                // if (labour.igst === 0 && labour.cgst === 0 && labour.sgst === 0) {
                //   if (schedule.rot_code === "FU01A") {
                //     labour.cgst = 0;
                //     labour.sgst = 0;
                //     labour.igst = 0;
                //   } else {
                //     labour.igst = 18;
                //   }
                // }
                if (schedule.repairTypeId != 2) {
                    labourArr.push(labour);
                }

            }
        });

        // console.log(labourArr);

        const oslLabourArr = [];
        let oslLabourQuantitys = 0;
        let oslLabourAmountAfterDiscounts = 0;
        let oslLabourCgstAmounts = 0;
        let oslLabourSgstAmounts = 0;
        let oslLabourIgstAmounts = 0;
        let oslLabourLineTotals = 0;

        oslScheduleDetails.forEach((osl_labour, i) => {
            const oslrot_code = osl_labour.rot_code;
            const oslrot_description = osl_labour.description;
            const oslsaccode = '998729';
            const oslLabourQuantity = osl_labour.quantity;
            const oslLabourRate = osl_labour.amount;
            const oslLabour_discount = 0;
            const oslLaboAmount = oslLabourQuantity * oslLabourRate;
            const oslsuppliermargin = osl_labour.marginPercentage;
            const oslAdditionalMargin = osl_labour.additionalMargin;
            const oslLabourAmount = oslLaboAmount - oslLabour_discount;

            const dec = oslsuppliermargin / 100;
            const oslmarginAmount = oslLabourAmount / (1 - dec) + oslAdditionalMargin;
            const oslLabourAmountAfterDis = oslmarginAmount;
            const oslLabourAmountbeforedis = oslmarginAmount;

            let oslLabourDepreciation;
            let oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
            let oslLabour_discount_final = oslLabour_discount;
            oslLabourDepreciation = osl_labour.depreciation_per;
            oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
            oslLabour_discount_final = oslLabour_discount;
            let oslLabourCgst, oslLabourSgst, oslLabourIgst;
            oslLabourCgst = osl_labour.cgst;
            oslLabourSgst = osl_labour.sgst;
            oslLabourIgst = osl_labour.igst;
            const oslLabourCgstAmount = oslLabourAmountAfterDiscount * (oslLabourCgst / 100);
            const oslLabourSgstAmount = oslLabourAmountAfterDiscount * (oslLabourSgst / 100);
            const oslLabourIgstAmount = oslLabourAmountAfterDiscount * (oslLabourIgst / 100);

            const oslLabourtotalTax = oslLabourCgstAmount + oslLabourSgstAmount + oslLabourIgstAmount;
            const oslLabourLineTotal = oslLabourAmountAfterDiscount + oslLabourtotalTax;

            if (oslrot_code) {
                // const isSameState = outlet.State.Code === customer.State.Code;
                const isSameState = true;
                const cgst = isSameState ? oslLabourCgst : 0;
                const sgst = isSameState ? oslLabourSgst : 0;
                const igst = isSameState ? 0 : oslLabourIgst;

                oslLabourArr[i] = {
                    part_description: oslrot_description,
                    part_code: oslrot_code,
                    hsn_code: oslsaccode,
                    quantity: oslLabourQuantity,
                    rate: (oslLabourAmountbeforedis / oslLabourQuantity).toFixed(2),
                    rateafterDiscount: oslLabourAmountbeforedis.toFixed(2),
                    dicount_amount: 0,
                    cgst: cgst || oslLabourCgst,
                    sgst: sgst || oslLabourSgst,
                    igst: igst || oslLabourIgst,
                    cgstAmount: oslLabourCgstAmount.toFixed(2),
                    sgstAmount: oslLabourSgstAmount.toFixed(2),
                    igstAmount: oslLabourIgstAmount.toFixed(2),
                    total: oslLabourLineTotal.toFixed(2),
                    taxamount: oslLabourtotalTax.toFixed(2),
                };
            }

            oslLabourQuantitys += oslLabourQuantity;
            oslLabourAmountAfterDiscounts += oslLabourAmountAfterDiscount;
            oslLabourCgstAmounts += oslLabourCgstAmount;
            oslLabourSgstAmounts += oslLabourSgstAmount;
            oslLabourIgstAmounts += oslLabourIgstAmount;
            oslLabourLineTotals += oslLabourLineTotal;
        });
        // console.log('oslLabourArr',oslLabourArr);
        const partsArr = [];
        partsIssueDetails.forEach(part => {
            // Skip repair_type == 2
            //   if (part.repair_type === 2) return;
            const quantity = part.quantity;
            const rate = part.rate;
            const discount = part.discount;
            const amount = quantity * rate;
            const amountAfterDiscount = amount - discount;
            const cgst = part.cgst;
            const sgst = part.sgst;
            const igst = part.igst;
            const cgstAmount = (amountAfterDiscount * cgst) / 100;
            const sgstAmount = (amountAfterDiscount * sgst) / 100;
            const igstAmount = (amountAfterDiscount * igst) / 100;
            if (part.repair_type != 2) {
                const totalTax = cgstAmount + sgstAmount + igstAmount;
                const lineTotal = amountAfterDiscount + totalTax;
                partsArr.push({
                    part_description: part.item_name,
                    part_code: part.item_code,
                    hsn_code: part.hsn_code,
                    quantity: quantity,
                    rate: rate,
                    rateafterDiscount: amountAfterDiscount,
                    dicount_amount: discount,
                    cgst: cgst,
                    sgst: sgst,
                    igst: igst,
                    cgstAmount: cgstAmount,
                    sgstAmount: sgstAmount,
                    igstAmount: igstAmount,
                    total: lineTotal,
                    taxamount: totalTax
                });
            }
        });
        // console.log(partsArr);
        let jcParts = [];
        if ((partsArr && partsArr.length > 0) ||
            (labourArr && labourArr.length > 0) ||
            (oslLabourArr && oslLabourArr.length > 0)) {

            jcParts = [
                ...(partsArr || []),
                ...(labourArr || []),
                ...(oslLabourArr || [])
            ];
        }

        if (isAJCJobCard) {

            const PaidByStatusValue = await TransactionDao.getTransaction(body.id);
            if (PaidByStatusValue?.dataValues?.status_new == 0) {
                isAjcFlag = true;
                const insuranceDetailsByJcId =
                    await TransactionDao.getInsuranceDetailByTransId(body.id);
                if (!insuranceDetailsByJcId) return;
                const dummyNum = "9677700234"

                const {
                    gstin_number: gstinNumber,
                    insurance_provider_name: decryptedCustomerName,

                    insurance_city: customer_city,
                    insurance_pincode: customer_pincode,
                    insurance_address: address1,
                    insurance_address: address2,
                } = insuranceDetailsByJcId.dataValues;

                const insuranceData = {
                    gstinNumber,
                    decryptedCustomerName,
                    address1,
                    address2,
                    customer_city,
                    customer_pincode,
                    decryptedMobileNumber: dummyNum
                };

                // console.log('Mapped Insurance Data:', insuranceData);
                const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJson(insuranceData, outletDetails, invoiceNo, jcParts);

                const transaction_updates = {
                    transaction_id: body.id,
                    invoice_number: invoiceNo,
                    grand_total: invoiceTotalAmt,
                    pass_args: BDOJsonStr,
                    created_by: user.id
                };

                const transactionUpdateResult = await JobCardService.createTransactionUpdate(transaction_updates);

                //   console.log('transactionUpdateResult',transactionUpdateResult);
                if (!transactionUpdateResult?.success) {
                    throw new Error(transactionUpdateResult?.error);
                }

                const transUpdateLastID = transactionUpdateResult.data.dataValues.id;


                // API Request to Submit Invoice
                const payload = {
                    BDOData: BDOJsonStr,
                    application_name: 'TVSFIT',
                    process_name: 'Job Card',
                    process_id: body.id,
                    created_at: new Date().toISOString(),
                };

                //   console.log('Sending Invoice Payload...');
                //   const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
                //     headers: { 'Content-Type': 'application/json' },
                //   });

                   let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (companyDetailsData?.id === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (companyDetailsData?.id === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });
                // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, {
                //     headers: { 'Content-Type': 'application/json' },
                // });

                //   console.log('API Response From BDO Portal:', apiResponse.data);
                const IRNResponseData = apiResponse.data.data;

                // Handle API Response
                if (apiResponse.data.message == 'Success') {
                    if (IRNResponseData.irnStatus == 0) {

                        await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                            bdo_status: '2',
                            response_arg: JSON.stringify(IRNResponseData.data.Error),
                            created_by: user.id
                        });
                    } else {
                        await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                            bdo_id: IRNResponseData.AckNo,
                            invoice_bdoack_no: IRNResponseData.AckNo,
                            invoice_bdoack_date: IRNResponseData.AckDt,
                            irn_no: IRNResponseData.Irn,
                            bdo_status: '1',
                            qr_code: IRNResponseData.QRCode,
                            signed_qr_code: IRNResponseData.SignedQRCode,
                            process_status: '1',
                            response_arg: JSON.stringify(IRNResponseData),
                        });
                    }
                } else {

                    await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                        bdo_status: '2',
                        response_arg: JSON.stringify(apiResponse.data.Error),
                        created_by: user.id
                    });
                }

                const error = apiResponse.data.Error;

                let ErrorMessage = '';
                let ErrorObject = null;

                if (typeof error === 'string') {
                    ErrorMessage = apiResponse.data.Error
                } else if (typeof error === 'object') {
                    ErrorObject = Object.keys(error)[0];
                    ErrorMessage = error[ErrorObject]
                } else {
                    ErrorMessage = 'something went wrong'
                }

                if (apiResponse.data.status_code === 2) {
                    return res.status(400).json({ requestSuccessful: false, errorDescription: ErrorMessage, ...(ErrorObject && { error_code: ErrorObject }) });
                }


            }
        }
        if (companyDetailsData.enable_einvoice === 1 && transactionCustomerDetailsData.customerCategory === "B2B" && isAjcFlag != true) {
            // console.log('inside if');
            const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJson(transactionCustomerDetails, outletDetails, invoiceNo, jcParts);
            // console.log('BDOJson',data);

            const transaction_updates = {
                transaction_id: body.id,
                invoice_number: invoiceNo,
                grand_total: invoiceTotalAmt,
                pass_args: BDOJsonStr,
                created_by: user.id
            };

            const transactionUpdateResult = await JobCardService.createTransactionUpdate(transaction_updates);

            //   console.log('transactionUpdateResult',transactionUpdateResult);
            if (!transactionUpdateResult?.success) {
                throw new Error(transactionUpdateResult?.error);
            }

            const transUpdateLastID = transactionUpdateResult.data.dataValues.id;
            ;

            // API Request to Submit Invoice
            const payload = {
                BDOData: BDOJsonStr,
                application_name: 'TVSFIT',
                process_name: 'Job Card',
                process_id: body.id,
                created_at: new Date().toISOString(),
            };

            // console.log('Sending Invoice Payload...');
            //   const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
            //     headers: { 'Content-Type': 'application/json' },
            //   });

               let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (companyDetailsData?.id === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (companyDetailsData?.id === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });
            // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, {
            //     headers: { 'Content-Type': 'application/json' },
            // });

            // console.log('API Response From BDO Portal:', apiResponse.data);
            const IRNResponseData = apiResponse.data.data;

            // Handle API Response
            if (apiResponse.data.message == 'Success') {
                if (IRNResponseData.irnStatus == 0) {

                    await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                        bdo_status: '2',
                        response_arg: JSON.stringify(IRNResponseData.data.Error),
                        created_by: user.id
                    });
                } else {
                    await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                        bdo_id: IRNResponseData.AckNo,
                        invoice_bdoack_no: IRNResponseData.AckNo,
                        invoice_bdoack_date: IRNResponseData.AckDt,
                        irn_no: IRNResponseData.Irn,
                        bdo_status: '1',
                        qr_code: IRNResponseData.QRCode,
                        signed_qr_code: IRNResponseData.SignedQRCode,
                        process_status: '1',
                        response_arg: JSON.stringify(IRNResponseData),
                    });
                }
            } else {

                await JobCardDao.UpdateTransUpdateRes(transUpdateLastID, {
                    bdo_status: '2',
                    response_arg: JSON.stringify(apiResponse.data.Error),
                    created_by: user.id
                });
            }

            const error = apiResponse.data.Error;

            let ErrorMessage = '';
            let ErrorObject = null;

            if (typeof error === 'string') {
                ErrorMessage = apiResponse.data.Error
            } else if (typeof error === 'object') {
                ErrorObject = Object.keys(error)[0];
                ErrorMessage = error[ErrorObject]
            } else {
                ErrorMessage = 'something went wrong'
            }

            if (apiResponse.data.status_code === 2) {
                return res.status(400).json({ requestSuccessful: false, errorDescription: ErrorMessage, ...(ErrorObject && { error_code: ErrorObject }) });
            }
        }

        // console.log('else body');
        const auditData = {};
        auditData['menu_name'] = "Transaction";
        auditData['submenu_name'] = "Billing";
        auditData['action'] = ACTION_UPDATE;
        let result = await JobCardService.saveBillingDetailsFit(req.body, req.user);
        if (trackLogId) {
            await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
        }
        if (result.status === 'success') {
            auditData['message'] = "Billing table updated ";
            auditData['result'] = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: 'Updated successfully',
                data: result
            });
        }
        else {
            auditData['message'] = "Not updated";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(400).send({
                requestSuccessful: true,
                errorDescription: 'Update fail',
            });
        }
    } catch (err) {
        logger.error('JobCard Controller saveBillingDetails Error:', err);
        return res.status(400).send({
            requestSuccessful: false,
            errorDescription: 'Error in BDO Portal E-Invoice',
        });

    }
    // return res.status(200).send({
    //     requestSuccessful: true,
    //     message: "Invoice number generated successfully",
    // });

}

//testing
const getGatePassData = async (req, res, next) => {
    try {
        const data = await JobCardService.getGatePassData(req.query.jobcardNo, req.user.outlet);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                GatePassData: data
            });
        } else {
            res.status(200).send({
                requestSuccessful: true,
                GatePassData: data
            });
        }
    } catch (err) {
        logger.error("JobCard controller getGatePassData", err);
        next(err);
    }
}

const generatePartsPDF = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Transactions",
            submenu_name: "JobCard",
            action: ACTION_GET,
            access: "Portal",
            message: "GeneratePartsPDF"
        };

        logger.info('JobCard Controller generatePartsPDF requestData:' + req.query.id);
        const data = await JobCardService.getJobCardInvoicePDFDetails(req.query.id, req.user.outlet);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF("parts", data);

        if (pdfBuffer) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            // Close the browser
            //await browser.close();
            // Set response headers and send the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Parts.pdf"');
            res.send(pdfBuffer);
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            //await browser.close();
            res.status(500).send('Failed to generate PDF');
        }
    } catch (err) {
        logger.error('JobCard Controller generatePartsPDF Error:', err);
        //if (browser) await browser.close();
    }
}

const getAllJobCardsForOutlets = async (req, res, next) => {
    try {
        let { formattedData: data, count } = await JobCardService.getAllJobCardsForOutlets(req.body, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data,
            count
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }
}

const getJobCardDetails = async (req, res, next) => {
    let data = {}
    try {
        data = await JobCardService.getJobCardDetails(req.body, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}
const addInsuranceAddress = async (req, res, next) => {
    try {
        logger.info('JobCard Controller addInsuranceAddress requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Transactions";
        auditData['submenu_name'] = "JobCard";
        auditData['action'] = ACTION_ADD;
        let result = await JobCardService.addInsuranceAddress(req.body, req.user);
        if (result == "success") {
            auditData['message'] = "Insurance Address added successfully ";
            auditData['result'] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: "Data Saved Successfully",
            });
        } else {
            auditData['message'] = "Failed to add the address";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('JobCard Controller addInsuranceAddress Error:', err);
        next(err);
    }
}

const listInsuranceAddresses = async (req, res, next) => {
    try {
        const data = await JobCardService.listInsuranceAddresses(req.body);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                AddressData: data
            });
        }
    } catch (err) {
        logger.error('JobCard Controller listInsuranceAddresses Error:', err);
        next(err);
    }
}

const addInsurance = async (req, res, next) => {
    try {
        logger.info('JobCard Controller addInsurance requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Transactions";
        auditData['submenu_name'] = "JobCard";
        auditData['action'] = ACTION_ADD;
        let result = await JobCardService.addInsurance(req.body, req.user);
        if (result == "success") {
            auditData['message'] = "Insurance added successfully ";
            auditData['result'] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: "Data Saved Successfully",
            });
        } else {
            auditData['message'] = "Failed to add the Insurance";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error('JobCard Controller addInsurance Error:', err);
        next(err);
    }
}

const getInsurance = async (req, res, next) => {
    try {
        const data = await JobCardService.getInsurance(req.body.transactionId);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                InsuranceData: data
            });
        }
    } catch (err) {
        logger.error('JobCard Controller getInsurance Error:', err);
        next(err);
    }
}

const updateJobCardInsurance = async (req, res, next) => {
    try {
        logger.info('JobCard Controller updateJobCardInsurance requestData:' + JSON.stringify(req.body));
        const auditData = {};
        auditData['menu_name'] = "Transactions";
        auditData['submenu_name'] = "JobCard";
        auditData['action'] = ACTION_UPDATE;
        let result = await JobCardService.updateJobCardInsurance(req.body, req.user);
        if (result == "success") {
            auditData['message'] = "Insurance Updated successfully ";
            auditData['result'] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: "Data updated Successfully",
            });
        } else {
            auditData['message'] = "Failed to update the Insurance";
            auditData['result'] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not updated ',
            });
        }
    } catch (err) {
        logger.error('JobCard Controller addInsurance Error:', err);
        next(err);
    }
}

//grid
const getJobCardStatusReportData = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Jobcard Status",
            action: ACTION_GET,
            access: "Portal",
            message: "Jobcard Status Report"
        };
        const data = await JobCardService.getJobCardStatusReportData(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getJobCardStatusReportData", err);
        next(err);
    }
};


const exportJobCardStatusReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Jobcard Status",
        action: ACTION_GET,
        access: "Portal",
        message: "Jobcard Status Report Export"
    };
    try {
        const results = await JobCardService.getJobCardStatusReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Document Type', key: 'document_type', width: 20 },
            { header: 'Document NO', key: 'job_card_no', width: 20 },
            { header: 'Document Date', key: 'created_date', width: 20 },
            { header: 'Status', key: 'status_value', width: 20 },
            { header: 'Customer Code', key: 'customer_code', width: 25 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Phone', key: 'customer_mobileNumber', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Customer Type', key: 'customer_type', width: 25 },
            { header: 'Custsomer GSTIN', key: 'customer_gstin', width: 25 },
            { header: 'Reg No', key: 'reg_no', width: 25 },
            { header: 'Make', key: 'make', width: 25 },
            { header: 'Model', key: 'model', width: 25 },
            { header: 'Km Reading', key: 'odometer', width: 25 },
            { header: 'Engine No', key: 'engineNo', width: 25 },
            { header: 'Chassis No', key: 'chassisNo', width: 25 },
            { header: 'Service Type', key: 'serviceType', width: 25 },
            { header: 'Repair Type', key: 'repairType', width: 25 },
            { header: 'Source', key: 'source', width: 25 },
            { header: 'Source Type', key: 'sourceType', width: 25 },
            { header: 'Expected Completion Time', key: 'expectedCompletionTime', width: 25 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 25 },
            { header: 'Delivery Date', key: 'deliveryDate', width: 25 },
            { header: 'SDD', key: 'sdd', width: 25 },
            { header: 'SDD(within 24 hrs)', key: 'sddTime', width: 25 },
            { header: 'Spare Amount', key: 'spareAmount', width: 25 },
            { header: 'Labour Amount', key: 'labourAmount', width: 25 },
            { header: 'Insurance Company', key: 'Insurancecompany', width: 25 },
            { header: 'Insurance Company GSTIN', key: 'InsuranceCompanyGSTIN', width: 25 },
            { header: 'Insurance Claim No', key: 'InsuranceClaimNo', width: 25 },
            { header: 'Insurance Est Cost', key: 'InsuranceEstCost', width: 25 },
            { header: 'Customer Arrival Date', key: 'CustomerArrivalDate', width: 25 },
            { header: 'Service Advisor', key: 'ServiceAdvisor', width: 25 },
            { header: 'DSA Code', key: 'DSACode', width: 25 },
            { header: 'DSA Name', key: 'DSAName', width: 25 },
            { header: 'DSA Contact Details', key: 'DSAContactDetails', width: 25 },
            { header: 'Sub Status', key: 'Substatus', width: 25 },
            { header: 'Sub Status Reason', key: 'SubStatusReason', width: 25 },
            { header: 'Surveyor Date', key: 'SurveyorDate', width: 25 },
            { header: 'Ins Approval Date', key: 'InsApprovalDate', width: 25 },
            { header: 'No of Hours(WH)', key: 'NoOfHours', width: 25 }

        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Job_card_status.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('ServiceBooking Controller exportServiceBookings Error:', err);
        next(err);
    }
};

// Gate IN - Gate OUT report — grid (paginated JSON).
const getGateInGateOutReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Gate In Gate Out",
        action: ACTION_GET,
        access: "Portal",
        message: "Gate In Gate Out Report"
    };
    try {
        const data = await JobCardService.getGateInGateOutReportData(req.body, req.user);
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
            requestSuccessful: true,
            totalItems: data?.totalItems ?? 0,
            data: data?.data ?? [],
        });
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error("JobCard controller getGateInGateOutReport", err);
        next(err);
    }
};

// Gate IN - Gate OUT report — Excel export (all 36 legacy columns A-AJ).
const exportGateInGateOutReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Gate In Gate Out",
        action: ACTION_GET,
        access: "Portal",
        message: "Gate In Gate Out Report Export"
    };
    try {
        const results = await JobCardService.getGateInGateOutReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Outlet Code', key: 'outlet_code', width: 20 },
            { header: 'City', key: 'city', width: 20 },
            { header: 'Vehicle Reg No', key: 'reg_no', width: 20 },
            { header: 'Vehicle Make', key: 'make', width: 20 },
            { header: 'Vehicle Model', key: 'model', width: 20 },
            { header: 'Booking No', key: 'booking_no', width: 22 },
            { header: 'Booking Date', key: 'booking_date', width: 22 },
            { header: 'Booking Status', key: 'booking_status', width: 18 },
            { header: 'Pick Up Driver Name', key: 'pickup_driver', width: 22 },
            { header: 'Pick Up Assigned Date', key: 'pickup_assigned_date', width: 22 },
            { header: 'Driver Picked accepted Date', key: 'driver_picked_accepted', width: 24 },
            { header: 'Customer Vehicle Pickup Date', key: 'customer_pickup_date', width: 24 },
            { header: 'Gate IN Date', key: 'gate_in_date', width: 22 },
            { header: 'Service Estimate No', key: 'service_estimate_no', width: 22 },
            { header: 'Service Estimate Date', key: 'service_estimate_date', width: 22 },
            { header: 'Job Card No', key: 'job_card_no', width: 20 },
            { header: 'Job Card Date', key: 'job_card_date', width: 22 },
            { header: 'Job Card Status', key: 'job_card_status', width: 18 },
            { header: 'Jobcard Sub Status', key: 'jobcard_sub_status', width: 20 },
            { header: 'First Estimate Submitted Date', key: 'first_estimate_submitted', width: 24 },
            { header: 'Last Estimate Approved Date', key: 'last_estimate_approved', width: 24 },
            { header: 'First Parts Indent Requested Date', key: 'first_parts_indent_requested', width: 26 },
            { header: 'Last parts indent issued Date', key: 'last_parts_indent_issued', width: 26 },
            { header: 'Ready For Billing', key: 'ready_for_billing', width: 20 },
            { header: 'Invoice Date', key: 'invoice_date', width: 22 },
            { header: 'Gate OUT Date', key: 'gate_out_date', width: 22 },
            { header: 'Drop Off Driver Name', key: 'dropoff_driver', width: 22 },
            { header: 'Drop Off Requested Date', key: 'dropoff_requested_date', width: 22 },
            { header: 'Drop Off Accepted Date', key: 'dropoff_accepted_date', width: 22 },
            { header: 'Driver Dropoff Customer Date', key: 'driver_dropoff_customer_date', width: 24 },
            { header: 'Inspection Startdate', key: 'inspection_startdate', width: 22 },
            { header: 'Inspection Enddate', key: 'inspection_enddate', width: 22 },
            { header: 'Service Advisor', key: 'service_advisor', width: 22 },
            { header: 'Delivery Date', key: 'delivery_date', width: 22 },
            { header: 'Casual Gatepass Date', key: 'casual_gatepass_date', width: 22 },
        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results?.data ?? []);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) {
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Gate_In_Gate_Out_Report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard controller exportGateInGateOutReport', err);
        next(err);
    }
};

const exportWipStatusReport = async (req, res, next) => {

    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "WIP report",
            action: ACTION_GET,
            access: "Portal",
            message: "WIP report Export"
        };
        const type = 1;
        const results = await JobCardService.getWipStatusReportData(req.body, req.user, type);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const header = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Document Type', key: 'document_type', width: 20 },
            { header: 'Document No', key: 'job_card_no', width: 20 },
            { header: 'Document Date', key: 'created_date', width: 20 },
            { header: 'Customer Arrival Date', key: 'customer_arrived_date', width: 20 },
            { header: 'Expected Delivery Date', key: 'work_end_date_time', width: 20 },
            { header: 'No of Days', key: 'no_of_days', width: 20 },
            { header: 'Make', key: 'makeName', width: 20 },
            { header: 'Model', key: 'modelName', width: 20 },
            { header: 'Km Reading', key: 'odometer', width: 20 },
            { header: 'Reg No', key: 'reg_no', width: 20 },
            { header: 'Chassis No', key: 'chassisNumber', width: 20 },
            { header: 'Engine No', key: 'engineNumber', width: 20 },
            { header: 'Status', key: 'status_value', width: 20 },
            { header: 'Customer Code', key: 'customer_code', width: 20 },
            { header: 'Customer Name', key: 'customer_name', width: 20 },
            { header: 'Phone', key: 'customer_mobileNumber', width: 20 },
            { header: 'Service Engg', key: 'service_engg', width: 20 },
            { header: 'Estimated Cost', key: 'estimate_cost', width: 20 },
            // { header: 'Labour Estimate Amount', key: 'lab_estimate_cost', width: 20 },
            { header: 'Email', key: 'emailId', width: 20 },
            // { header: 'Billed Date', key: 'billed_date', width: 20 },
            // { header: 'Delivery Date', key: 'delivery_date', width: 20 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Source Type', key: 'source_type', width: 20 },
            { header: 'Sub Status', key: 'sub_status', width: 20 },
            { header: 'Sub Status Reason', key: 'sub_status_reason', width: 20 },
            { header: 'Surveyor Name', key: 'surveyor_name', width: 20 },
            { header: 'Surveyor Mobile Number', key: 'surveyor_mobile', width: 20 },
            { header: 'Outlet City', key: 'city', width: 20 },
            { header: 'Outlet State', key: 'state', width: 20 },
            { header: 'Repair Type', key: 'repair_type', width: 20 },
            { header: 'No of Hours', key: 'no_of_hours', width: 20 },
            { header: 'Labour Estimate Amount', key: 'lab_estimate_cost', width: 20 },
            { header: 'Paid Issued Amount', key: 'paidIssuedAmount', width: 20 },
            { header: 'Total Paid amount', key: 'totalPaidAmount', width: 20 },
            { header: 'AX Code', key: 'axCode', width: 20 },
            { header: 'Vehicle Used By', key: 'vehicleUsedBy', width: 20 },
        ]
        worksheet.columns = header;


        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="wip_status.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportWipStatusReport Error:', err);
        next(err);
    }
}

const exportBillReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Bill Report",
        action: ACTION_GET,
        access: "Portal",
        message: "Bill Report Export"
    };
    try {
        const type = 1;
        const results = await JobCardService.getBillReportData(req.body, req.user, type);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const header = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Job Card No', key: 'job_card_no', width: 20 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Make', key: 'makeName', width: 20 },
            { header: 'Model', key: 'modelName', width: 20 },
            { header: 'JobCard Date', key: 'created_date', width: 20 },
            { header: 'Customer Code', key: 'customer_code', width: 20 },
            { header: 'Customer Name', key: 'customer_name', width: 20 },
            { header: 'Mobile', key: 'customer_mobileNumber', width: 20 },
            { header: 'Customer Type', key: 'customer_type', width: 20 },
            { header: 'Km Reading', key: 'odometer', width: 20 },
            { header: 'Reg No', key: 'reg_no', width: 20 },
            { header: 'Chassis No', key: 'chassisNumber', width: 20 },
            { header: 'Engine No', key: 'engineNumber', width: 20 },
            { header: 'Repair Type', key: 'repair_type', width: 20 },
            { header: 'Service Advisor', key: 'service_advisor', width: 20 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Source Type', key: 'source_type', width: 20 },
            { header: 'Invoice no', key: 'invoice_no', width: 20 },
            { header: 'Invoice Date', key: 'invoice_date', width: 20 },
            { header: 'Item Amount', key: 'item_amt', width: 20 },
            { header: 'Labour Amount', key: 'labour_amt', width: 20 },
            { header: 'Labour + OSL Amount Without Tax', key: 'labour_osl_amt_notax', width: 20 },
            { header: 'Spare Amount Without Tax', key: 'spare_amt_notax', width: 20 },
            { header: 'Invoice Amount Without Tax', key: 'invoice_amt_notax', width: 20 },
            { header: 'Cash(Inc OSL) Discount', key: 'discount', width: 20 },
            { header: 'CGST', key: 'totalcgst', width: 20 },
            { header: 'SGST', key: 'totalsgst', width: 20 },
            { header: 'IGST', key: 'totaligst', width: 20 },
            { header: 'Invoice Amount', key: 'invoice_amt', width: 20 },
            { header: 'Bill Type', key: 'bill_type', width: 20 },
            { header: 'Insurance Company Name', key: 'insurance_name', width: 20 },
            { header: 'Insurance Company GSTIN', key: 'insurance_gstin', width: 20 },
            { header: 'Insurance Company Code', key: 'insurance_code', width: 20 },
            { header: 'Insurance claim No', key: 'insurance_claim_no', width: 20 },
            { header: 'Customer GSTIN', key: 'customer_gstin', width: 20 },
            { header: 'Document Type', key: 'document_type', width: 20 },
            { header: 'DSA Coupon Code', key: 'dsa_coupon_code', width: 20 },
            { header: 'Labour CGST', key: 'cgst', width: 20 },
            { header: 'Labour SGST', key: 'sgst', width: 20 },
            { header: 'Labour IGST', key: 'igst', width: 20 },
            { header: 'Parts CGST', key: 'p_cgst', width: 20 },
            { header: 'Parts SGST', key: 'p_sgst', width: 20 },
            { header: 'Parts IGST', key: 'p_igst', width: 20 },
            { header: 'Customer Voice', key: 'customer_voice', width: 20 },
            { header: 'Service Engineer’s Remarks', key: 'service_engineer_remarks', width: 20 },
            { header: 'Service Advice', key: 'service_advice', width: 20 },
            { header: 'Policy Number', key: 'policy_no', width: 20 },
            { header: 'Labour Invoice No', key: 'labourInvoiceNo', width: 20 },
            { header: 'Parts Invoice No', key: 'partsInvoiceNo', width: 20 },
            { header: 'Gobumpr Payment Id', key: 'gobumprPaymentId', width: 20 },
            { header: 'Gobumpr Txn Id', key: 'gobumprTxnId', width: 20 },
            { header: 'Gobumpr Advance Amount', key: 'gobumprAdvanceAmount', width: 20 },
            { header: 'Gobumpr Payment Response', key: 'gobumprPaymentResponse', width: 20 },
            { header: 'Gobumpr Payment Date', key: 'gobumprPaymentDate', width: 20 },
            { header: 'Gobumpr Payment Remarks', key: 'gobumprPaymentRemarks', width: 20 },
            { header: 'Gobumpr Booking Id', key: 'gobumprBookingId', width: 20 },
            { header: 'Gobumpr B2B Booking Id', key: 'gobumprB2bBookingId', width: 20 },
            { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
            { header: 'Receipt Amount', key: 'receiptAmount', width: 20 },
            { header: 'Pending Amount', key: 'pendingAmount', width: 20 },
            { header: 'Paid Status', key: 'paidStatus', width: 20 },
            { header: 'Physical Delivery Status', key: 'physicalDeliveryStatus', width: 20 },
            { header: 'LBS Number', key: 'lbsNumber', width: 20 },
            { header: 'LBS Amount', key: 'lbsAmount', width: 20 },
            { header: 'Coupon Code', key: 'couponCode', width: 20 },
            { header: 'Coupon Value', key: 'couponValue', width: 20 },
            { header: 'Coupon Expiry Date', key: 'couponExpiryDate', width: 20 },
            { header: 'Vehicle Used By', key: 'vehicleUsedBy', width: 20 },
        ]

        worksheet.columns = header;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        // worksheet.eachRow({ includeEmpty: true }, (row) => {
        //     row.eachCell({ includeEmpty: true }, (cell) => {
        //         cell.alignment = { 
        //             horizontal: 'center'
        //         };
        //     });
        // });

        // worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        //     cell.alignment = { 
        //         horizontal: 'center', 
        //         vertical: 'middle', 
        //         wrapText: true
        //     };
        //     cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: 'FF204060' }
        //     };
        // });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="bill_report.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportBillReport Error:', err);
        next(err);
    }
}

const exportJobCardDeliveryReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Delivery Report",
        action: ACTION_GET,
        access: "Portal",
        message: "Delivery Report Export"
    };
    try {
        const results = await JobCardService.getJobCardDeliveryReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Invoice Date', key: 'bill_date', width: 20 },
            { header: 'InvoiceNumber', key: 'bill_no', width: 20 },
            { header: 'Job Card Date', key: 'jobcard_date', width: 20 },
            { header: 'Job Card Number', key: 'job_card_no', width: 20 },
            { header: 'Customer Code', key: 'customer_code', width: 25 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Customer GSTIN', key: 'customer_gstin', width: 25 },
            { header: 'Vehicle Reg Number', key: 'reg_no', width: 25 },

            { header: 'Labour Amount', key: 'l_rate', width: 25 },
            { header: 'Labour Cash Discount', key: 'discount_percentage_l', width: 25 },
            { header: 'Labour CGST', key: 'cgst', width: 25 },
            { header: 'Labour SGST', key: 'sgst', width: 25 },
            { header: 'Labour IGST', key: 'igst', width: 25 },
            // { header: 'Labour Invoice Amount', key: 'l_rate', width: 25 },

            { header: 'Spare Amount', key: 'p_rate', width: 25 },
            { header: 'Spare CGST', key: 'p_cgst', width: 25 },
            { header: 'Spare SGST', key: 'p_sgst', width: 25 },
            { header: 'Spare IGST', key: 'p_igst', width: 25 },
            // { header: 'Spare Invoice Amount', key: 'p_rate', width: 25 },

            { header: 'Invoice Amount With Out Tax', key: 'total_amount', width: 25 },
            { header: 'Total Invoice Amount', key: 'total_amount_tax', width: 25 },
            { header: 'Source', key: 'sourceName', width: 25 },
            { header: 'Source Type', key: 'sourceTypeName', width: 25 },
            { header: 'Employee Name', key: 'emp_name', width: 25 },
            // { header: 'Pick Up Driver Name', key: 'driverName', width: 25 },
            // { header: 'Pick Up Driver Mobile', key: 'driverMobile', width: 25 },
            { header: 'Delivery Number', key: 'delivery_number', width: 25 },

        ];
        worksheet.columns = headers;

        // const dataWithCustomHeaders = results.map((item, index) => {
        //     return {
        //     autoId: index + 1,
        //     outlet_code: item.outlet_code,
        //     bill_date: item.bill_date,
        //     bill_no: item.bill_no,
        //     jobcard_date: item.jobcard_date,
        //     job_card_no: item.job_card_no,
        //     customer_code: item.customer_code,
        //     customer_name: item.customer_name,
        //     customer_gstin: item.customer_gstin,
        //     reg_no: item.reg_no,
        //     schedules_amount: item.schedules_amount,
        //     labour_cash_discount:item.schedules_discount_percentage,
        //     schedules_cgst: item.schedules_cgst,
        //     schedules_sgst: item.schedules_sgst,
        //     schedules_igst: item.schedules_igst,
        //     labor_amount: item.labor_amount,
        //     partsIndent_amount: item.partsIndent_amount,
        //     spare_dis: '0',
        //     partsIndent_cgst: item.partsIndent_cgst,
        //     partsIndent_sgst: item.partsIndent_sgst,
        //     partsIndent_igst: item.partsIndent_igst,

        //     parts_amount: item.parts_amount,
        //     total_amount: item.total_amount,
        //     total_amount_tax: item.total_amount,
        //     sourceName: item.sourceName,
        //     sourceTypeName: item.sourceTypeName,
        //     emp_name: item.emp_name,

        //     driverName: '',
        //     driverMobile: '',
        //     delivery_number: item.delivery_number,
        //     // Insurancecompany: item.insurance?.insurance_provider_name || '',
        //     // InsuranceCompanyGSTIN: item.insurance?.gstin_number || '',
        //     // InsuranceClaimNo: item.insurance?.claim_no || '',
        //     // InsuranceEstCost: item.insurance?.estimated_cost || 0,
        //     // CustomerArrivalDate: item.customer_arrived_date,
        //     // ServiceAdvisor: "",
        //     // DSACode: item.dsaagent?.dsaCode || '',
        // };
        // });

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results?.DeliveryReportData);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Delivery_Report.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('Jobcard Controller exportJobCardDeliveryReport Error:', err);
        next(err);
    }
};

const getJobCardDeliveryReportData = async (req, res, next) => {
    const reslist = [];
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Delivery Report",
            action: ACTION_GET,
            access: "Portal",
            message: "Delivery Report"
        };
        const data = await JobCardService.getJobCardDeliveryReportData(req.body, req.user);

        // for (const item of data.DeliveryReportData) {
        //     const itemObj = {
        //         ...item,
        //         labor_amount: item?.labor_amount || null,
        //         discount_percentage_l: item?.discount_percentage_l || null,
        //         cgst: item?.cgst || null,
        //         sgst: item?.sgst || null,
        //         igst: item?.igst || null,
        //         l_rate: item?.l_rate || null,
        //         parts_amount: item?.parts_amount || null,
        //         discount_percentage_p: item?.discount_percentage_p || null,
        //         p_cgst: item?.p_cgst || null,
        //         p_sgst: item?.p_sgst || null,
        //         p_igst: item?.p_igst || null,
        //         p_rate: item?.p_rate || null,
        //     };
        //     reslist.push(itemObj);
        // }
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                data: {
                    DeliveryReportData: data.DeliveryReportData,
                    totalItems: data.totalItems
                },
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                data: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getJobCardDeliveryReportData", err);
        next(err);
    }
};

const WipGridView = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "WIP report",
            action: ACTION_GET,
            access: "Portal",
            message: "WIP report"
        };
        const type = 2;
        const results = await JobCardService.getWipStatusReportData(req.body, req.user, type);
        if (results) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                totalItems: results.totalItems,
                data: results.data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: false,
                totalItems: 0,
                data: [],
            });
        }
    } catch (err) {
        logger.error('JobCard Controller WipGridView Error:', err);
        next(err);
    }
}

const billGridView = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Bill Report",
            action: ACTION_GET,
            access: "Portal",
            message: "Bill Report"
        };
        const type = 2;
        const results = await JobCardService.getBillReportData(req.body, req.user, type);
        if (results) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                totalItems: results.totalItems,
                data: results.data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: false,
                totalItems: 0,
                data: [],
            });
        }
    } catch (err) {
        logger.error('JobCard Controller billGridView Error:', err);
        next(err);
    }
}

// JC Bill Summary Split-Up — Excel export (legacy jc_bill_summarys_split_up columns).
const exportBillSummarySplitUp = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "JC Bill Summary Split Up",
        action: ACTION_GET,
        access: "Portal",
        message: "JC Bill Summary Split Up Export"
    };
    try {
        const type = 1;
        const results = await JobCardService.getBillSummarySplitUpData(req.body, req.user, type);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const header = [
            { header: 'Job Card No', key: 'jobCardNo', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Make', key: 'make', width: 20 },
            { header: 'Model', key: 'model', width: 20 },
            { header: 'Job Card Date', key: 'jobCardDate', width: 22 },
            { header: 'Customer Code', key: 'customerCode', width: 20 },
            { header: 'Customer Name', key: 'customerName', width: 22 },
            { header: 'Mobile', key: 'mobile', width: 16 },
            { header: 'Customer Type', key: 'customerType', width: 16 },
            { header: 'Km Reading', key: 'kmReading', width: 14 },
            { header: 'Reg No', key: 'regNo', width: 16 },
            { header: 'Chassis No', key: 'chassisNo', width: 20 },
            { header: 'Engine No', key: 'engineNo', width: 20 },
            { header: 'Repair Type', key: 'repairType', width: 18 },
            { header: 'Service Advisor', key: 'serviceAdvisor', width: 20 },
            { header: 'Source', key: 'source', width: 18 },
            { header: 'Source Type', key: 'sourceType', width: 18 },
            { header: 'Activity Name', key: 'activityName', width: 18 },
            { header: 'Labour Invoice no', key: 'labourInvoiceNo', width: 20 },
            { header: 'Parts Invoice no', key: 'partsInvoiceNo', width: 20 },
            { header: 'Invoice no', key: 'invoiceNo', width: 20 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 22 },
            { header: 'FOC Item Amount', key: 'focItemAmount', width: 18 },
            { header: 'FOC Labour Amount', key: 'focLabourAmount', width: 18 },
            { header: 'Item Amount', key: 'itemAmount', width: 16 },
            { header: 'Labour Amount', key: 'labourAmount', width: 16 },
            { header: 'Labour + OSL Amount Without Tax', key: 'labourOslWithoutTax', width: 28 },
            { header: 'Spares Amount Without Tax', key: 'sparesWithoutTax', width: 24 },
            { header: 'Invoice Amount Without Tax', key: 'invoiceWithoutTax', width: 24 },
            { header: 'Cash(Inc OSL) Discount', key: 'cashDiscount', width: 22 },
            { header: 'CGST', key: 'cgst', width: 14 },
            { header: 'SGST', key: 'sgst', width: 14 },
            { header: 'IGST', key: 'igst', width: 14 },
            { header: 'Invoice Amount', key: 'invoiceAmount', width: 18 },
            { header: 'Bill Type', key: 'billType', width: 16 },
            { header: 'Insurance Company Name', key: 'insCompanyName', width: 22 },
            { header: 'Insurance Company GSTIN', key: 'insCompanyGstin', width: 22 },
            { header: 'Insurance Company Code', key: 'insCompanyCode', width: 20 },
            { header: 'Insurance Claim No', key: 'insClaimNo', width: 20 },
            { header: 'Reason For Credit', key: 'reasonForCredit', width: 20 },
            { header: 'Membership No.', key: 'membershipNo', width: 18 },
            { header: 'Membership Exp Date', key: 'membershipExpDate', width: 20 },
            { header: 'Customer Liability', key: 'customerLiability', width: 18 },
            { header: 'Insurance Liability', key: 'insuranceLiability', width: 18 },
            { header: 'Custsomer GSTIN', key: 'customerGstin', width: 22 },
            { header: 'JIRA TICKET ID', key: 'jiraTicketId', width: 18 },
            { header: 'Document Type', key: 'documentType', width: 16 },
            { header: 'DSA Coupon Code', key: 'dsaCouponCode', width: 18 },
            { header: 'Labor KFC 1%', key: 'laborKfc', width: 14 },
            { header: 'Parts KFC 1%', key: 'partsKfc', width: 14 },
            { header: 'TOTAL KFC 1%', key: 'totalKfc', width: 14 },
            { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
            { header: 'Receipt Amount', key: 'receiptAmount', width: 16 },
            { header: 'Pending Amount', key: 'pendingAmount', width: 16 },
            { header: 'Paid Status', key: 'paidStatus', width: 16 },
            { header: 'Labour CGST', key: 'labourCgst', width: 14 },
            { header: 'Labour SGST', key: 'labourSgst', width: 14 },
            { header: 'Labour IGST', key: 'labourIgst', width: 14 },
            { header: 'Parts CGST', key: 'partsCgst', width: 14 },
            { header: 'Parts SGST', key: 'partsSgst', width: 14 },
            { header: 'Parts IGST', key: 'partsIgst', width: 14 },
            { header: 'Outlet City', key: 'outletCity', width: 18 },
            { header: 'Outlet State', key: 'outletState', width: 18 },
            { header: 'Type', key: 'type', width: 16 },
            { header: 'Job card Status', key: 'jobCardStatus', width: 24 },
            { header: 'Payment Process', key: 'paymentProcess', width: 20 },
            { header: 'Promised Delivery Date', key: 'promisedDeliveryDate', width: 20 },
            { header: 'Promised Delivery Time', key: 'promisedDeliveryTime', width: 20 },
            { header: 'OTD Status', key: 'otdStatus', width: 14 },
            { header: 'OTD Failure Reason', key: 'otdFailureReason', width: 22 },
            { header: 'LBS  Receipt Number', key: 'lbsReceiptNumber', width: 20 },
            { header: 'LBS Receipt Amount', key: 'lbsReceiptAmount', width: 18 },
            { header: 'Labour @5', key: 'labour5', width: 14 },
            { header: 'Labour @18', key: 'labour18', width: 14 },
            { header: 'Labour @28', key: 'labour28', width: 14 },
            { header: 'Parts @5', key: 'parts5', width: 14 },
            { header: 'Parts @18', key: 'parts18', width: 14 },
            { header: 'Parts @28', key: 'parts28', width: 14 },
        ];

        worksheet.columns = header;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF204060' } };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) {
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="jc_bill_summary_split_up.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportBillSummarySplitUp Error:', err);
        next(err);
    }
}

// JC Bill Summary Split-Up — paginated grid view.
const billSummarySplitUpGridView = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "JC Bill Summary Split Up",
            action: ACTION_GET,
            access: "Portal",
            message: "JC Bill Summary Split Up"
        };
        const type = 2;
        const results = await JobCardService.getBillSummarySplitUpData(req.body, req.user, type);
        if (results) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                totalItems: results.totalItems,
                data: results.data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: false,
                totalItems: 0,
                data: [],
            });
        }
    } catch (err) {
        logger.error('JobCard Controller billSummarySplitUpGridView Error:', err);
        next(err);
    }
}

const getWorkOrderReportData = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Work Order",
            action: ACTION_GET,
            access: "Portal",
            message: "Work Order Report"
        };
        const data = await JobCardService.getWorkOrderReportData(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                WorkOrderData: data,
            });
        } else {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                WorkOrderData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getWorkOrderReportData", err);
        next(err);
    }
};

const exportWorkOrderReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Work Order",
        action: ACTION_GET,
        access: "Portal",
        message: "Work Order Report Export"
    };
    try {
        const results = await JobCardService.getWorkOrderReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Work Order No', key: 'osl_bill_no', width: 20 },
            { header: 'Work Order Date', key: 'workOrderDate', width: 20 },
            { header: 'Reg No', key: 'reg_no', width: 20 },
            { header: 'Make', key: 'make', width: 20 },
            { header: 'Model', key: 'model', width: 20 },
            { header: 'Job Card No', key: 'jobcard_no', width: 25 },
            { header: 'Job Card Date', key: 'jobcard_date', width: 25 },
            { header: 'Invoice No', key: 'invoiceNo', width: 25 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 25 },
            { header: 'Labour Schedule Code', key: 'laborScheduleCode', width: 25 },
            { header: 'Labour Schedule Description', key: 'laborScheduleDescription', width: 25 },
            { header: 'quantity', key: 'quantity', width: 25 },
            { header: 'OSL Cost', key: 'amount', width: 25 },
            { header: 'Margin Amount', key: 'additionalMargin', width: 25 },
            { header: 'Discount', key: 'discount_percentage', width: 25 },
            { header: 'Tax Amount', key: 'OslTax', width: 25 },
            { header: 'Billed Value', key: 'billedValue', width: 25 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'Supplier Code', key: 'supplierCode', width: 25 },
            { header: 'Source', key: 'source', width: 25 },
            { header: 'Source Type', key: 'sourceType', width: 25 }
        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Work_Order_Statement.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('ServiceBooking Controller exportWorkOrderReport Error:', err);
        next(err);
    }
};

const getRepairOrderReportData = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Repair Order",
            action: ACTION_GET,
            access: "Portal",
            message: "Repair Order Report"
        };
        const data = await JobCardService.getRepairOrderReportData(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                RepairOrderData: data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                RepairOrderData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getRepairOrderReportData", err);
        next(err);
    }
};

const exportRepairOrderReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Repair Order",
        action: ACTION_GET,
        access: "Portal",
        message: "Repair Order Report Export"
    };
    try {
        const results = await JobCardService.getRepairOrderReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Document Date', key: 'documentDate', width: 20 },
            { header: 'Document No', key: 'documentNumber', width: 20 },
            { header: 'Make', key: 'make', width: 20 },
            { header: 'Model', key: 'model', width: 20 },
            { header: 'Job Card No', key: 'jobcard_no', width: 25 },
            { header: 'Job Card Date', key: 'jobcard_date', width: 25 },
            { header: 'Labour Code', key: 'laborScheduleCode', width: 25 },
            { header: 'Labour Description', key: 'laborScheduleDescription', width: 25 },
            { header: 'SAC Code', key: 'sac_code', width: 25 },
            { header: 'Reg No', key: 'reg_no', width: 20 },
            { header: 'Chassis No', key: 'chassisNumber', width: 20 },
            { header: 'Engine No', key: 'engineNumber', width: 20 },
            { header: 'Customer Code', key: 'customerCode', width: 25 },
            { header: 'Customer Name', key: 'customerName', width: 25 },
            { header: 'Customer GSTIN', key: 'customerGstin', width: 25 },
            { header: 'Insurance GSTIN', key: 'insurance_gstin', width: 25 },
            { header: 'Billing To', key: 'billingTo', width: 25 },
            { header: 'Repair Type', key: 'repairType', width: 25 },
            // { header: 'Invoice Number', key: 'supplier', width: 25 },   // bill number
            { header: 'quantity', key: 'Quantity', width: 25 },
            { header: 'Customer Amount', key: 'customerAmount', width: 25 },
            { header: 'Rate(AMT+Mar-Dis)', key: 'rate', width: 25 },
            { header: 'CGST%', key: 'cgstPercent', width: 25 },
            { header: 'CGST', key: 'cgst', width: 25 },
            { header: 'SGST%', key: 'sgstPercent', width: 25 },
            { header: 'SGST', key: 'sgst', width: 25 },
            { header: 'IGST%', key: 'igstPercent', width: 25 },
            { header: 'IGST', key: 'igst', width: 25 },
            { header: 'Total Tax', key: 'totalTax', width: 25 },
            { header: 'Amount', key: 'laborTotals', width: 25 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'Labour Billing Name', key: 'labourBillingName', width: 25 },
            { header: 'Parts Billing Name', key: 'partsBillingName', width: 25 },
            { header: 'IRN No', key: 'irnNo', width: 25 },
            { header: 'Inv Ack No', key: 'invAckNo', width: 25 },
            { header: 'Inv Ack Date', key: 'invAckDate', width: 25 },
            { header: 'Job Card Status', key: 'jobcardStatus', width: 25 },
            { header: 'Remarks', key: 'remarks', width: 25 },

        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Repair_Order_Statement.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('ServiceBooking Controller exportRepairOrderReport Error:', err);
        next(err);
    }
};

const getEliteStatementData = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Elite Statement",
            action: ACTION_GET,
            access: "Portal",
            message: "Elite Statement Report"
        };
        const data = await JobCardService.getEliteStatementData(req.body, req.user);
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
            requestSuccessful: true,
            EliteStatementData: data,
        });
    } catch (err) {
        logger.error("JobCard controller getEliteStatementData", err);
        next(err);
    }
};

const exportEliteStatement = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Elite Statement",
        action: ACTION_GET,
        access: "Portal",
        message: "Elite Statement Report Export"
    };
    try {
        const fullBody = { ...req.body, limit: null, offset: 0 };
        const results = await JobCardService.getEliteStatementData(fullBody, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Invoice Category', key: 'invoiceCategory', width: 18 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 18 },
            { header: 'Invoice Name', key: 'invoiceName', width: 22 },
            { header: 'Job Card No', key: 'jobcard_no', width: 22 },
            { header: 'Customer Name', key: 'customerName', width: 25 },
            { header: 'Contact No', key: 'contactNo', width: 18 },
            { header: 'GST Number', key: 'gstNumber', width: 22 },
            { header: 'Registration Number', key: 'registrationNumber', width: 22 },
            { header: 'Basic parts 5 %', key: 'basicParts5', width: 18 },
            { header: 'Parts 5 %', key: 'parts5', width: 14 },
            { header: 'Basic parts 12 %', key: 'basicParts12', width: 18 },
            { header: 'Parts 12 %', key: 'parts12', width: 14 },
            { header: 'Basic parts 18%', key: 'basicParts18', width: 18 },
            { header: 'Parts 18 %', key: 'parts18', width: 14 },
            { header: 'Basic parts 28 % ', key: 'basicParts28', width: 18 },
            { header: 'Parts 28 %', key: 'parts28', width: 14 },
            { header: 'Basic parts IGST 5%', key: 'basicPartsIgst5', width: 20 },
            { header: 'parts IGST 5%', key: 'partsIgst5', width: 16 },
            { header: 'Basic parts IGST 12%', key: 'basicPartsIgst12', width: 20 },
            { header: 'parts IGST 12%', key: 'partsIgst12', width: 16 },
            { header: 'Basic parts IGST 18%', key: 'basicPartsIgst18', width: 20 },
            { header: 'parts IGST 18%', key: 'partsIgst18', width: 16 },
            { header: 'Basic parts IGST 28% ', key: 'basicPartsIgst28', width: 20 },
            { header: 'Parts IGST 28%', key: 'partsIgst28', width: 16 },
            { header: 'Basic Labour 18%', key: 'basicLabour18', width: 18 },
            { header: 'Labour @ 18%', key: 'labour18', width: 16 },
            { header: 'Labour @ IGST', key: 'labourIgst', width: 16 },
            { header: 'InVoice Amount', key: 'invoiceAmount', width: 18 },
            { header: 'Status', key: 'status', width: 22 },
            { header: 'Type', key: 'type', width: 14 },
            { header: 'Technician', key: 'technician', width: 14 },
        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) {
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Elite_GST_work.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportEliteStatement Error:', err);
        next(err);
    }
};

const getJobCardData = async (req, res, next) => { 
    try {
        const data = await JobCardService.getJobCardData(req.body.jobCardNo, req.user);
        res.status(200).send({
            requestSuccessful: true,
            data: data
        });
    } catch (err) {
        logger.error('Job Card controller getJobCardData Error:', err);
        next(err);
    }
}

const exportChittaReport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Chitta Statement",
        action: ACTION_GET,
        access: "Portal",
        message: "Chitta Statement Report Export"
    };
    try {
        const results = await JobCardService.getReceiptReportData(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Receipted Date', key: 'receiptDate', width: 20 },
            { header: 'Receipted No', key: 'receiptNo', width: 20 },
            { header: 'Customer Code', key: 'customerCode', width: 20 },
            { header: 'Customer Name', key: 'customerName', width: 20 },
            { header: 'Reg No', key: 'regNo', width: 25 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 25 },
            { header: 'JobCard Number', key: 'jobCardNo', width: 25 },
            { header: 'Invoice No', key: 'invoiceNo', width: 25 },
            { header: 'Invoice Amount', key: 'invoiceAmount', width: 25 },
            { header: 'Payment Mode', key: 'paymentMode', width: 25 },
            { header: 'Amount', key: 'amount', width: 25 },
            { header: 'Card No/Cheque No', key: 'cardOrCheckNo', width: 25 },
            { header: 'Reference Number', key: 'referenceNo', width: 25 },
            { header: 'Reference Date', key: 'referenceDate', width: 25 },
            { header: 'Created by', key: 'createdBy', width: 25 },
            { header: 'Remarks', key: 'remarks', width: 25 },
            { header: 'Source', key: 'source', width: 25 },
            { header: 'Source Type', key: 'sourceType', width: 25 },
            { header: 'Customer Type', key: 'customerType', width: 25 },
            { header: 'Labour Invoice No', key: 'labourInvoiceNo', width: 25 },
            { header: 'Parts Invoice No', key: 'partsInvoiceNo', width: 25 },
            { header: 'Outlet City', key: 'outletCity', width: 25 },
            { header: 'Outlet Name', key: 'outletName', width: 25 },
            { header: 'Bank Name', key: 'bankName', width: 25 },
        ];
        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Receipts_Chitta_Statement.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('Job Card Controller exportChittaReport Error:', err);
        next(err);
    }
};

const getReceiptReportData = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Chitta Statement",
        action: ACTION_GET,
        access: "Portal",
        message: "Chitta Statement Report"
    };
    try {
        const data = await JobCardService.getReceiptReportData(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                ReceiptData: data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller getReceiptReportData", err);
        next(err);
    }
};

const vehicleHistory = async (req, res, next) => {
    try {
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Portal";
        auditData["message"] = "Get Vehicle History";
        const data = await JobCardService.vehicleHistory(req.body, req.user);
        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                JobCardData: data,
                message: "Vehicle history fetched successfully."
            });
        } else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                requestSuccessful: true,
                JobCardData: data,
                message: "Vehicle history not fetched."
            });
        }
    } catch (err) {
        logger.error("JobCard controller vehicleHistory", err);
        next(err);
    }
};

const getJobCardForAutoPO = async (req, res, next) => {
    let data = {}
    try {
        data = await JobCardService.getJobCardForAutoPO(req.body, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}
const createJobCardMobile = async (req, res, next) => {
    try {
        const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);
        let result = await JobCardService.createJobCardMobile(req.body, req.user);

        if (trackLogId) {
            await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
        }
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "JobCard";
        auditData["access"] = "Mobile";
        let usId = req.user.id.toString();
        if (usId === req.body.userId) {
            if (result.result == "success") {
                auditData["message"] =
                    "Job Card Created for " +
                    " successfully ";
                auditData["result"] = "success ";
                auditData["action"] = "Add";
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    message: "Jobcard Saved Sucessfully",
                    jobCardDetail: result.jobCardDetail,
                    laborSchedules: result.laborSchedules,
                    part: result.part,
                    oslLaborSchedules: result.oslLaborSchedules
                });
            } else if (result.result === 'estimateApprovalRequired' || result.result === 'serviceEstimateNotFound') {
                return res.status(result.result === 'serviceEstimateNotFound' ? 404 : 400).send({
                    requestSuccessful: false,
                    message: result.message,
                });
            } else {
                auditData["message"] = "Job Card Creation fail";
                auditData["result"] = "failed ";
                auditData["action"] = "Add";
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    message: "Data not updated ",
                });
            }
        }
        else {
            auditData["message"] = "Job Card Creation fail";
            auditData["result"] = "failed ";
            auditData["action"] = "Add";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error("JobCard Controller createServiceEstimate:", err);
        next(err);
    }
};

const getJobCardDetailsMobile = async (req, res, next) => {
    try {
        const data = await JobCardService.getJobCardDetailsMobile(req.body);
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Mobile";
        auditData["message"] = "Get getJobCardDetailsMobile data ";
        let usId = req.user.id.toString();
        if (usId === req.body.userId) {
            if (data) {
                auditData["result"] = "success ";
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    transaction: data.transaction,
                    laborSchedules: data.schedules,
                    part: data.partsIndent,
                    oslLaborSchedules: data.oslSchedules
                });
            }
            else {
                auditData["result"] = "failed ";
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: false,
                    transaction: {},
                    laborSchedules: {},
                    part: {},
                    oslLaborSchedules: {}
                });
            }
        }
        else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error("JobCard Controller getJobCardDetailsMobile:", err);
        next(err);
    }
}

const getJobCardDetailsBridge = async (req, res, next) => {
    try {
        const data = await JobCardService.getJobCardDetailsBridge(req.body);

        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Mobile";
        auditData["message"] = "Get getJobCardDetailsMobile data ";

        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                // transaction: data.transaction,
                message: data.message ? data.message : "",
                // laborSchedules: data.schedules,
                // part: data.partsIndent,
                // oslLaborSchedules: data.oslSchedules,
                // Estimate : data.serviceEstimate
                data: data
            });
        }
        else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,

                transaction: {},
                laborSchedules: {},
                part: {},
                oslLaborSchedules: {}
            });
        }

    } catch (err) {
        logger.error("JobCard Controller getJobCardDetailBridge:", err);
        next(err);
    }
}

const updateJobCardMobile = async (req, res, next) => {
    try {
        const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);
        // console.log('jobcard update payload', req.body);

        let result = await JobCardService.updateJobCardMobile(req.body, req.user);

        if (trackLogId) {
            await MobileApiTrackService.updateMobileApiRes(trackLogId, result);
        }

        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "JobCard";
        auditData["access"] = "Mobile";
        let usId = req.user.id.toString();
        if (usId === req.body.userId) {
            if (result.result == "success") {
                auditData["message"] =
                    "Job Card updated for " +
                    " successfully ";
                auditData["result"] = "success ";
                auditData["action"] = ACTION_UPDATE;
                auditLog.createAuditLog(req, auditData);
                if (req.body.updateType === "data") {
                    return res.status(200).send({
                        requestSuccessful: true,
                        jcId: result.jobCardDetail.id,
                        laborSchedules: result.laborSchedules,
                        part: result.part,
                        oslLaborSchedules: result.oslLaborSchedules
                    });
                } else {
                    return res.status(200).send({
                        requestSuccessful: true,
                        jcId: result.jobCardDetail.id,
                    });
                }
            } else {
                auditData["message"] = "Job Card updation fail";
                auditData["result"] = "failed ";
                auditData["action"] = ACTION_UPDATE;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    message: "Data not updated ",
                });
            }
        }
        else {
            auditData["message"] = "Job Card updation fail";
            auditData["result"] = "failed ";
            auditData["action"] = ACTION_UPDATE;
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error("JobCard Controller updateJobCardMobile:", err);
        next(err);
    }
};

const createGatepassMobile = async (req, res, next) => {
    try {
        let result = await JobCardService.createGatepassMobile(req.body, req.user);
        const auditData = {};
        auditData["menu_name"] = "Transaction";
        auditData["submenu_name"] = "JobCard";
        auditData["access"] = "Mobile";
        let usId = req.user.id.toString();
        if (usId === req.body.userId) {
            if (result.result == "success") {
                auditData["message"] =
                    "Job Card updated for " +
                    " successfully ";
                auditData["result"] = "success ";
                auditData["action"] = ACTION_UPDATE;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    message: "Jobcard updated Sucessfully",
                    jobCardDetail: result.jobCardDetail,
                });

            } else {
                auditData["message"] = "Job Card updation fail";
                auditData["result"] = "failed ";
                auditData["action"] = ACTION_UPDATE;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    message: "Data not updated ",
                });
            }
        }
        else {
            res.status(200).send({
                requestSuccessful: true,
                message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error("JobCard Controller createGatepassMobile:", err);
        next(err);
    }
};

const getJobCardStatement = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Jobcard Statement",
            action: ACTION_GET,
            access: "Portal",
            message: "Jobcard Statement Report"
        };
        const data = await JobCardService.getJobCardStatement(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                jobCardStatement: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                message: 'Data not fetched'
            });
        }
    } catch (err) {
        logger.error('Job card controller getJobCardStatement', err);
        next(err);
    }
};


const exportJobCardStatement = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Jobcard Statement",
        action: ACTION_GET,
        access: "Portal",
        message: "Jobcard Statement Report Export"
    };
    try {
        const results = await JobCardService.getJobCardStatement(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outletCode', width: 20 },
            { header: 'Document Type', key: 'docType', width: 20 },
            { header: 'Job Card No', key: 'jobCardNo', width: 20 },
            { header: 'Job Card Date', key: 'jobCardDate', width: 25 },
            { header: 'Vehicle Make', key: 'vehicleMake', width: 25 },
            { header: 'Vehicle Model', key: 'vehicleModel', width: 25 },
            { header: 'Reg No', key: 'regNo', width: 25 },
            { header: 'Chassis No', key: 'chassisNo', width: 25 },
            { header: 'Engine No', key: 'engineNo', width: 25 },
            { header: 'Customer Name', key: 'customerName', width: 25 },
            { header: 'Phone', key: 'mobileNo', width: 20 },
            { header: 'Email', key: 'email', width: 20 },
            // { header: 'Landline', key: 'landline', width: 20 },
            { header: 'Customer Type', key: 'customerType', width: 20 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Source Type', key: 'sourceType', width: 20 },


            { header: 'Item/Service Indication', key: 'itemIndication', width: 20 },
            { header: 'Item Code', key: 'itemCode', width: 20 },
            { header: 'Item Name', key: 'itemName', width: 20 },
            { header: 'Repair Type', key: 'repairType', width: 20 },
            { header: 'Requested Qty', key: 'reqQty', width: 20 },
            { header: 'Issued Qty', key: 'issuedQty', width: 20 },
            // { header: 'Returned Qty', key: 'returnedQty', width: 10 },
            // { header: 'Cancelled Qty', key: 'cancelledQty', width: 20 },
            //{ header: 'Estimated Cost', key: 'estCost', width: 20 },
            { header: 'Km Reading', key: 'kmReading', width: 20 },
            { header: 'Service Advisor', key: 'serviceAdvisor', width: 25 },
            { header: 'Rate', key: 'rate', width: 25 },
            { header: 'Discount', key: 'discount', width: 25 },
            { header: 'CGST %', key: 'cgstPer', width: 25 },
            { header: 'CGST', key: 'cgst', width: 25 },
            { header: 'SGST %', key: 'sgstPer', width: 25 },
            { header: 'SGST', key: 'sgst', width: 25 },
            { header: 'IGST %', key: 'igstPer', width: 20 },
            { header: 'IGST', key: 'igst', width: 20 },
            { header: 'Total Tax', key: 'totalTax', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Status', key: 'status_value', width: 20 },
            { header: 'Cancellation Type', key: 'cancellationType', width: 20 },
            { header: 'Cancellation Date', key: 'cancellationDate', width: 20 },
            { header: 'Cancellation Remarks', key: 'cancellationRemarks', width: 20 },
            // { header: 'Email', key: 'email', width: 20 },
            // { header: 'Indent Number', key: 'indentNumber', width: 20 },
            // { header: 'Membership Expiry Date', key: 'membershipExpiry', width: 20 },
            // { header: 'Membership Number', key: 'membershipNo', width: 20 },
            { header: 'Customer Liability', key: 'customerLiability', width: 20 },
            { header: 'Insurer Liability', key: 'insurerLiability', width: 20 },
            { header: 'Customer Gstin', key: 'customerGSTIN', width: 20 },
            { header: 'Insurance Company Gstin', key: 'insuranceCompanyGSTIN', width: 20 },
            { header: 'Insurance Company Code', key: 'insuranceCompanyCode', width: 20 },
            { header: 'Insurance Company Name', key: 'insuranceCompanyName', width: 20 },
            { header: 'Insurance Expiry Date', key: 'insuranceExpiryDate', width: 20 },
            { header: 'Bill Number', key: 'billNo', width: 20 },
            { header: 'Bill Date', key: 'billDate', width: 20 },
            { header: 'Promised Delivery Date', key: 'promisedDeliveryDate', width: 20 },
            { header: 'Promised Delivery Time', key: 'promisedDeliveryTime', width: 20 },
            { header: 'OTD Status', key: 'otdStatus', width: 20 },
            { header: 'OTD Failure Reason', key: 'otdFailureReason', width: 20 },
            // { header: 'AX Code', key: 'axCode', width: 20 },
            // { header: 'Coupon Code', key: 'couponCode', width: 20 },
            // { header: 'Coupon Value', key: 'couponValue', width: 20 },
            { header: 'Job Card Created Date', key: 'jobCardCreatedDate', width: 20 },
            // { header: 'Labour Category', key: 'labourCategory', width: 20 },
            // { header: 'Labour Sub Category', key: 'labourSubCategory', width: 20 },
        ];

        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });
        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        await res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await res.setHeader('Content-Disposition', 'attachment; filename="Job_Card_Statement.xlsx"');

        await workbook.xlsx.write(res);

        await res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('Job card controller exportJobCardStatement Error:', err);
        next(err);
    }
};

const getMechanicEfficiency = async (req, res, next) => {

    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Mechanic Efficiency",
            action: ACTION_GET,
            access: "Portal",
            message: "Mechanic Efficiency Report"
        };
        const data = await JobCardService.getMechanicEfficiency(req.body, req.user);
        if (data) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                mechanicEfficiency: data
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(500).send({
                message: 'Data not fetched'
            });
        }
    } catch (err) {
        logger.error('Jobcard controller getMechanicEfficiency', err);
        next(err);
    }
};


const exportMechanicEfficiency = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Mechanic Efficiency",
        action: ACTION_GET,
        access: "Portal",
        message: "Mechanic Efficiency Report Export"
    };
    try {
        const results = await JobCardService.getMechanicEfficiency(req.body, req.user);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const headers = [
            { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Branch', key: 'outletCode', width: 20 },
            { header: 'Labour Code', key: 'labourCode', width: 20 },
            { header: 'Labour Name', key: 'labourName', width: 20 },
            { header: 'Mechanic Name', key: 'mechanicName', width: 25 },
            { header: 'Mechanic Code', key: 'mechanicCode', width: 25 },
            { header: 'Mechanic Percentage', key: 'mechanicPer', width: 25 },
            { header: 'Margin Amount', key: 'marginAmt', width: 25 },
            { header: 'Labour Amount', key: 'labourAmount', width: 25 },
            { header: 'Split Amount', key: 'splitAmt', width: 25 },
            { header: 'Standard Duration', key: 'standardDuration', width: 25 },
            { header: 'Actual Duration', key: 'actualDuration', width: 25 },
            { header: 'Billing Rate (per Hour)', key: 'billingRate', width: 25 },
            { header: '% Revenue', key: 'revenue', width: 25 },
            { header: '% Efficiency', key: 'efficiency', width: 20 },
            { header: 'Job Card No', key: 'jobCardNo', width: 20 },
            { header: 'Job Card Date', key: 'jobCardDate', width: 20 },
            { header: 'Reg No', key: 'regNo', width: 20 },
            { header: 'Chassis No', key: 'chassisNo', width: 20 },
            { header: 'Engine No', key: 'engineNo', width: 20 },
            { header: 'Model', key: 'model', width: 20 },
            { header: 'Reason', key: 'reason', width: 20 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 20 },
            { header: 'Start Time', key: 'startTime', width: 20 },
            { header: 'End Time', key: 'endTime', width: 20 },
        ];

        worksheet.columns = headers;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        await res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await res.setHeader('Content-Disposition', 'attachment; filename="Mechanic_Efficiency.xlsx"');

        await workbook.xlsx.write(res);

        await res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('Jobcard controller exportMechanicEfficiency Error:', err);
        next(err);
    }
};

const encryptJc = async (req, res, next) => {
    try {
        await JobCardService.encryptJc(req.body.status);
        res.status(200).send({
            requestSuccessful: true,
        });
    } catch (err) {
        logger.error('Jobcard controller encryptJc', err);
        next(err);
    }
}

const updatePartApprove = async (req, res, next) => {
    try {
        const result = await JobCardService.updatePartApprove(req.body, req.user);
        res.status(200).send({
            requestSuccessful: true,
            result
        });
    } catch (err) {
        logger.error('Jobcard controller updatePartApprove', err);
        next(err);
    }
}

const updateCreditApproval = async (req, res, next) => {

    try {
        logger.info(
            "Credit Approval Jobcard: " +
            JSON.stringify(req.body)
        );
        let result = await JobCardService.updateCreditApproval(
            req.body,
            req.user
        );
        // console.log("controller data111111111111111111", result);
        const auditData = {};
        auditData["menu_name"] = "Credit Approval";
        auditData["submenu_name"] = "JobCard Credit";
        if (result) {
            auditData["message"] =
                "Credit Approval Completed ";
            auditData["result"] = "success ";
            auditData["action"] = "Update";
            auditLog.createAuditLog(req, auditData);

            return res.status(200).send({
                requestSuccessful: true,
                message: "Data updated successfully",
            });
        }
        else {
            auditData["message"] = "Credit Approval not updated";
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: "Data not updated ",
            });
        }
    } catch (err) {
        logger.error("JobCard Controller updateJobCard:", err);
        next(err);
    }
};

const createHsnandItemforPartCatalogue = async (req, res, next) => {
    let item = req.body
    let user = req.user
    try {
        let findhsn
        findhsn = await Hsns.findOne({ where: { hsnCode: item.hsnCode } })
        if (!findhsn) {
            findhsn = await Hsns.create({
                hsnCode: item.hsnCode,
                tax: item.cgst + item.sgst + item.igst,
                createdBy: user.id,
                updatedBy: user.id,
            })
        }
        const newitem = await Items.create({
            itemCode: item.item_code,
            itemName: item.item_description,
            itemDescription: item.item_description,
            hsnId: findhsn.id,
            hsnCode: item.hsnCode,
            createdBy: user.id,
            updatedBy: user.id,
            list: item.mrp,
            mrp: item.mrp,
            cost: item.cost,
            taxPercentage: item.cgst + item.sgst + item.igst,
        })
        return res.status(200).send({
            itemId: newitem.id,
            requestSuccessful: true,
            message: "Data updated successfully",
        });
    }
    catch (err) {
        logger.error("hsn for partcatalogue:", err);
        next(err);
    }
}
const getJobCardForEtaUpdate = async (req, res, next) => {
    let data = {}
    try {
        data = await JobCardService.getJobCardForEtaUpdate(req.body, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}

const UploadVerificationDetails = async (req, res, next) => {
    try {
        const storage = new Storage({
            projectId: "prj-stag-gobumpr-service-6567",
            keyFilename: "prj-stag-gobumpr-service-6567.json",
        });

        const bucketName = "bkt-dearo-prod";
        const bucket = storage.bucket(bucketName);

        let payload = {};
        payload["transaction_id"] = req.body.transaction_id;

        if (req.files) {
            for (const fieldName in req.files) {
                const file = req.files[fieldName][0];

                const date = new Date();
                const newName =
                    date.getTime().toString() +
                    Math.random().toString(36).slice(2, 7) +
                    file.originalname.replace(/\ /g, "_");

                const blob = bucket.file(`Jobcard/Verification/${newName}`);

                await new Promise((resolve, reject) => {
                    const blobStream = blob.createWriteStream({ resumable: false });

                    blobStream
                        .on("error", reject)
                        .on("finish", resolve)
                        .end(file.buffer);
                });

                const link = `https://storage.googleapis.com/${bucketName}/Jobcard/Verification/${newName}`;

                payload[fieldName] = link;
            }
        }

        const data = await JobCardService.UploadVerificationDetails(payload, req.user);

        return res.status(200).json({
            requestSuccessful: true,
            message: "Verification Details Uploaded Successfully",
            data,
        });

    } catch (err) {
        logger.error("Upload Verification Details Error:", err);
        next(err);
    }
};

const GetVerificationDetails = async (req, res) => {
    try {
        const data = await JobCardService.getVerificationDetails(req.body, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });
    }
    catch (err) {
        logger.error("Get Verification Details Error:", err);
        next(err);
    }
}

const getTopFiveCustomerForGMS = async (req, res, next) => {
    let data = {}
    try {
        data = await JobCardService.getTopFiveCustomerForGMS(req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}

const getJobCardStatus = async (req, res, next) => {
    let data = {}
    try {
        const username = req.headers["username"] || null;
        const password = req.headers["password"] || null;

        const validUsername = "tvs_parts";
        const validPassword = "Tvs@1234";

        if (username !== validUsername || password !== validPassword) {
            return res.status(401).json({
                status: false,
                msg: "Invalid authentication",
            });
        }

        /* ---------------- PAYLOAD ---------------- */
        const payload = req.body;

        if (!payload || typeof payload !== "object") {
            return res.status(400).json({
                status: false,
                msg: "Invalid or empty payload",
            });
        }

        const { job_card_no } = payload;

        if (!job_card_no) {
            return res.status(400).json({
                status: false,
                msg: "Missing job_card_no",
            });
        }
        data = await JobCardService.getJobCardStatus(job_card_no);

        if (!data) {
            return res.status(404).json({
                status: false,
                msg: "Job Card not found",
            });
        }
        return res.status(200).json({
            status: true,
            job_card_no,
            jobcard_status: data.status,
            jobcard_status_text: data.status_value,
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}

const getSingleCustomerView = async (req, res, next) => {
    let data = {}
    try {
        const { mobile_no } = req.body;
        if (!mobile_no) {
            return res.status(400).json({
                requestSuccessful: false,
                message: "Missing mobile_no",
            });
        }

        data = await JobCardService.getSingleCustomerView(mobile_no, req.user);
        return res.status(200).json({
            requestSuccessful: true,
            data: data
        });

    } catch (err) {
        logger.error('Jobcard Contrller Error:', err);
        next(err);
    }

}


const getpreviousvisits = async (req, res) => {
    const previousVisit = await JobCardService.getpreviousvisits(req.body);
    if (previousVisit) {
        if (previousVisit.VehicleStauts == true) {
            return res.status(400).send({
                ErrorDescription: "Open order for this vehicle already exists",
                orderDetails: previousVisit.previousVehicleResponse,
                Error: 400
            });
        } else if (previousVisit.VehiclePresent == true) {
            if (previousVisit.visitMetadata) {
                return res.status(200).send({
                    vehicleDetails: previousVisit.vehicleDetails,
                    customerDetails: previousVisit.customerDetails,
                    visitMetadata: previousVisit.visitMetadata,
                    visitTime: previousVisit.visitTime,
                    vahanData: previousVisit.vahanData && Object.keys(previousVisit.vahanData).length > 0
                        ? previousVisit.vahanData
                        : null,
                    leadDetails:
                        previousVisit.leadDetails && Object.keys(previousVisit.leadDetails).length > 0
                            ? [previousVisit.leadDetails]
                            : null
                });
            } else {
                return res.status(200).send({
                    vehicleDetails: previousVisit.vehicleDetails,
                    customerDetails: previousVisit.customerDetails,
                    vahanData: previousVisit.vahanData && Object.keys(previousVisit.vahanData).length > 0
                        ? previousVisit.vahanData
                        : null,
                    leadDetails:
                        previousVisit.leadDetails && Object.keys(previousVisit.leadDetails).length > 0
                            ? [previousVisit.leadDetails]
                            : null
                });
            }
        }
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getinspectionreport = async (req, res) => {
    const inspectionreport = await JobCardService.getinspectionreport(req.body);
    if (inspectionreport) {
        let checkList = inspectionreport.pastcheckListType;
        return res.status(200).send({
            [checkList]: inspectionreport.inspection,
            inspectionPhotos: inspectionreport.IMAGES,
            inspectionVideos: "",
            CarpmList: inspectionreport.carpmRecords
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getinventorydetails = async (req, res) => {
    const inventorydetails = await JobCardService.getinventorydetails(req.body);
    if (inventorydetails) {
        return res.status(200).send({
            dentScratch: inventorydetails.dentScratch,
            InventoryReport: inventorydetails.InventoryReport,
            inventoryPhotos: inventorydetails.inventoryPhotos
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getmanagerworklist = async (req, res) => {
    const managerWorkList = await JobCardService.getmanagerworklist(req.body);
    if (managerWorkList) {
        return res.status(200).send({
            managerWorkList: managerWorkList.managerWorkListResponse,
            leadDetails: managerWorkList.leadDetails,
            GateinDetails: managerWorkList.GateinDetails
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}
const getinspectorworklist = async (req, res) => {
    const inspectorworklist = await JobCardService.getinspectorworklist(req.body);
    if (inspectorworklist) {
        return res.status(200).send({
            InspectorWorkList: inspectorworklist.InspectorWorkList
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getgiworklist_new = async (req, res) => {
    const gateInworklist = await JobCardService.getgiworklist_new(req.body);
    // console.log("gateInworklist", gateInworklist);

    if (gateInworklist.status) {
        return res.status(200).send({
            gateinPickuplist: gateInworklist.gateinPickuplist
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getqiworklist = async (req, res) => {
    const qiWorkList = await JobCardService.getqiworklist(req.body);
    // const qiWorkList = await utils.sendSms(
    //     "9972721888",
    //     "Hello",
    //     "1",
    //     "1107161339212669786"
    // );

    if (qiWorkList.success == true) {
        return res.status(200).send({
            managerWorkList: qiWorkList.qiWorkListResponse
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getsaworklist = async (req, res) => {
    const saWorkList = await JobCardService.getsaworklist(req.body);
    if (saWorkList.success == true) {
        return res.status(200).send({
            saWorklist: saWorkList.saWorkListResponse,
            saAppointments: saWorkList.saAppoitmentsResponse
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getdetailsforfi = async (req, res) => {
    try {
        const DetailsForQI = await JobCardService.getdetailsforfi(req.body);
        if (DetailsForQI.status == true) {
            return res.status(200).send({
                dentScratch: DetailsForQI.dentScratch,
                Estimation: DetailsForQI.Estimation
            })
        } else {
            return res.status(400).send({
                requestSuccessful: false,
                message: 'No Data Found'
            })
        }
    } catch (err) {
        logger.error('Job Card Service getdetailsforfi', err)
    }
}

const getJobCardDetailsCustomerComplaint = async (req, res, next) => {
    // console.log(req.user, "req.user")
    try {
        const data = await JobCardService.getJobCardDetailsCustomerComplant(req.body, req.user);
        // console.log(data, "data")
        const auditData = {};
        auditData["menu_name"] = "Transactions";
        auditData["submenu_name"] = "JobCard";
        auditData["action"] = ACTION_GET;
        auditData["access"] = "Mobile";
        auditData["message"] = "Get getJobCardDetailsCustomerComplaint data ";

        if (data) {
            auditData["result"] = "success ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: "Customer Complaint Jc Details fetched successfully",
                data: data
            });
        }
        else {
            auditData["result"] = "failed ";
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: false,
                message: "Customer Complaint Jc Details not fetched",
                data: {}
            });
        }

    } catch (err) {
        logger.error("JobCard Controller getJobCardDetailsCustomerComplaint:", err);
        next(err);
    }
}

const verifyGstin = async (req, res, next) => {
    try {
        const { gstin, provider } = req.body;
        if (!gstin || gstin.length !== 15) {
            return res.status(200).send({
                status: "failiure",
                reason: "Please enter valid gstin"
            });
        }

        const getGSTINURL = `https://dms.mytvs.in/einvoice_ki_live/bdoapis/getgstdetail/?gstiNumber=${gstin}`;
        const apiResponse = await axios.get(getGSTINURL);
        const responseData = apiResponse.data?.response;

        if (responseData?.message === "Success") {
            const customerDetails = typeof responseData.data === 'string' ? JSON.parse(responseData.data) : responseData.data;

            if (customerDetails?.ErrorCodes) {
                return res.status(200).send({
                    status: "failiure",
                    reason: "Please enter valid gstin"
                });
            }

            const tradeName = (customerDetails.TradeName || '').toUpperCase();    
            const providerName = (provider || '').toUpperCase();

            if (!providerName || !tradeName || !tradeName.includes(providerName)) {
                return res.status(200).send({
                    status: "failiure",
                    reason: "Please enter valid gstin"
                });
            }

            return res.status(200).send({
                status: "success",
                customer_type: "B2B"
            });
        } else {
            return res.status(200).send({
                status: "failiure",
                reason: "Please enter valid gstin"
            });
        }
    }
    catch (err) {
        logger.error('JobCard Controller verifyGstin Error:', err);
        next(err);
    }
}

const getcustomerpastvisitdata = async (req, res) => {

    const customerPasVisit = await JobCardService.getcustomerpastvisitdata(req.body);
    if (customerPasVisit.status == "success") {
        let checkList = customerPasVisit.pastcheckListType;
        return res.status(200).send({
            VisitDetails: customerPasVisit.VisitDetails,
            InventoryReport: customerPasVisit.InventoryReport,
            Estimation: customerPasVisit.Estimation,
            [checkList]: customerPasVisit.inspection,
            IMAGES: customerPasVisit.IMAGES,
            CarpmList: customerPasVisit.carpmRecords
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const getAlertMoevVehicleDetails = async (req, res) => {
    try {
        const customerPasVisit = await JobCardService.getAlertMoevVehicleDetails(req.body);
        if (customerPasVisit.status == "success") {
            return res.status(200).send({
                status: "success"
            });
        } else {
            return res.status(400).send({
                requestSuccessful: false,
                message: 'No data found'
            });
        }
    }
    catch (err) {
        logger.error('JobCard Controller updatesourcedetails Error:', err);
    }
}

const updatesourcedetails = async (req, res) => {

    try {
        const customerPasVisit = await JobCardService.updatesourcedetails(req.body);
        if (customerPasVisit.status == "success") {
            return res.status(200).send({
                status: "success"
            });
        } else {
            return res.status(400).send({
                requestSuccessful: false,
                message: 'Status Change Failed'
            });
        }
    }
    catch (err) {
        logger.error('JobCard Controller updatesourcedetails Error:', err);
    }
}

const getOldJobcardOpenAndWorkinProgress = async (req, res, next) => {

    try {
        const data = await JobCardService.getOldJobcardOpenWorkInProgress(req.user);
            return res.status(200).send({
                requestSuccessful: true,
                data,
                message: "Old Jobcard Open and Work in Progress synced successfully"
            });
        
    }
    catch (err) {
        logger.error('JobCard Controller  Error:', err);
        next(err);
    }
}
const JobCardBillSummaryItReturnDataView = async (req, res, next) => {
    try {
        const auditData = {
            menu_name: "Reports",
            submenu_name: "Bill Report",
            action: ACTION_GET,
            access: "Portal",
            message: "Bill Report"
        };
        const type = 2;
        const results = await JobCardService.getJobCardBillSummaryItReturnData(req.body, req.user, type);
        if (results) {
            auditData.result = "success";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                totalItems: results.totalItems,
                data: results.data,
            });
        } else {
            auditData.result = "failed";
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: false,
                totalItems: 0,
                data: [],
            });
        }
    } catch (err) {
        logger.error('JobCard Controller billGridView Error:', err);
        next(err);
    }
}

const JobCardBillSummaryITReturnDataExport = async (req, res, next) => {
    const auditData = {
        menu_name: "Reports",
        submenu_name: "Bill Report",
        action: ACTION_GET,
        access: "Portal",
        message: "Bill Report Export"
    };
    try {
        const type = 1;
        const results = await JobCardService.getJobCardBillSummaryItReturnData(req.body, req.user, type);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worksheet');

        const header = [
            // { header: 'SL No', key: 'autoId', width: 10 },
            { header: 'Job Card No', key: 'job_card_no', width: 20 },
            { header: 'Branch', key: 'outlet_code', width: 20 },
            { header: 'Make', key: 'makeName', width: 20 },
            { header: 'Model', key: 'modelName', width: 20 },
            { header: 'JobCard Date', key: 'created_date', width: 20 },
            { header: 'Customer Code', key: 'customer_code', width: 20 },
            { header: 'Customer Name', key: 'customer_name', width: 20 },
            { header: 'Mobile', key: 'customer_mobileNumber', width: 20 },
            { header: 'Customer Type', key: 'customer_type', width: 20 },
            { header: 'Km Reading', key: 'odometer', width: 20 },
            { header: 'Reg No', key: 'reg_no', width: 20 },
            { header: 'Chassis No', key: 'chassisNumber', width: 20 },
            { header: 'Engine No', key: 'engineNumber', width: 20 },
            { header: 'Repair Type', key: 'repair_type', width: 20 },
            { header: 'Service Advisor', key: 'service_advisor', width: 20 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Source Type', key: 'source_type', width: 20 },
            {header: "Activity Name",key:"",width:20},
            { header: 'Labour Invoice no', key: 'labourInvoiceNo', width: 20 },
            { header: 'Parts Invoice no', key: 'partsInvoiceNo', width: 20 },
            { header: 'Invoice no', key: 'invoice_no', width: 20 },
            { header: 'Invoice Date', key: 'invoice_date', width: 20 },
            { header: 'FOC Item Amount', key: 'FOCItemAmount', width: 20 },
            { header: 'FOC Labour Amount', key: 'FOCLaborAmount', width: 20 },
            { header: 'Item Amount', key: 'item_amt', width: 20 },
            { header: 'Labour Amount', key: 'labour_amt', width: 20 },
            { header: 'Labour + OSL Amount Without Tax', key: 'labour_osl_amt_notax', width: 20 },
            { header: 'Spare Amount Without Tax', key: 'spare_amt_notax', width: 20 },
            { header: 'Invoice Amount Without Tax', key: 'invoice_amt_notax', width: 20 },
            { header: 'Cash(Inc OSL) Discount', key: 'discount', width: 20 },
            { header: 'CGST', key: 'totalcgst', width: 20 },
            { header: 'SGST', key: 'totalsgst', width: 20 },
            { header: 'IGST', key: 'totaligst', width: 20 },
            { header: 'Invoice Amount', key: 'invoice_amt', width: 20 },
            { header: 'Bill Type', key: 'bill_type', width: 20 },
            { header: 'Insurance Company Name', key: 'insurance_name', width: 20 },
            { header: 'Insurance Company GSTIN', key: 'insurance_gstin', width: 20 },
            { header: 'Insurance Company Code', key: 'insurance_code', width: 20 },
            { header: 'Insurance claim No', key: 'insurance_claim_no', width: 20 },
            { header: 'Reason For Credit', key: '', width: 20 },
            { header: 'Membership No.', key: '', width: 20 },
            { header: 'Membership Exp Date', key: '', width: 20 },
            { header: 'Customer Liability', key: '', width: 20 },
            { header: 'Insurance Liability', key: '', width: 20 },
            { header: 'Customer GSTIN', key: 'customer_gstin', width: 20 },
            { header: 'JIRA TICKET ID', key: '', width: 20 },
            { header: 'Document Type', key: 'document_type', width: 20 },
            { header: 'DSA Coupon Code', key: 'dsa_coupon_code', width: 20 },
            { header: 'Labor KFC 1%', key: '', width: 20 },
            { header: 'Parts KFC 1%', key: '', width: 20 },
            { header: 'TOTAL KFC 1%', key: '', width: 20 },
            { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
            { header: 'Receipt Amount', key: 'receiptAmount', width: 20 },
            { header: 'Pending Amount', key: 'pendingAmount', width: 20 },
            { header: 'Paid Status', key: 'paidStatus', width: 20 },
            { header: 'Labour CGST', key: 'cgst', width: 20 },
            { header: 'Labour SGST', key: 'sgst', width: 20 },
            { header: 'Labour IGST', key: 'igst', width: 20 },
            { header: 'Parts CGST', key: 'p_cgst', width: 20 },
            { header: 'Parts SGST', key: 'p_sgst', width: 20 },
            { header: 'Parts IGST', key: 'p_igst', width: 20 },
            { header: 'Outlet City', key: 'outletCity', width: 20 },
            { header: 'Outlet State', key: 'outletState', width: 20 },
            { header: 'Type', key: 'Type', width: 20 },
            { header: 'Job card Status', key: 'jobCardStatus', width: 20 },
            { header: 'Payment Process', key: '', width: 20 },
            { header: 'Promised Delivery Date', key: 'promisedDeliveryDate', width: 20 },
            { header: 'Promised Delivery Time', key: 'promisedDeliveryTime', width: 20 },
            { header: ' OTD Status', key: 'otdStatus', width: 20 },
            { header: 'OTD Failure Reason', key: 'otdReason', width: 20 },
            { header: 'LBS Receipt Number', key: 'lbsNumber', width: 20 },
            { header: 'LBS Receipt Amount', key: 'lbsAmount', width: 20 },
            { header: 'Sale Return CN', key: '', width: 20 },
            { header: 'NMSA Invoice No', key: 'invoice_no', width: 20 },
            { header: 'Coupon Code', key: 'couponCode', width: 20 },
            { header: 'Coupon Value', key: 'couponValue', width: 20 },
            { header: 'Coupon Expiry Date', key: 'couponExpiryDate', width: 20 },
            { header: 'Redemption Coupon', key: '', width: 20 },
            { header: 'Redemption Coupon Value', key: '', width: 20 },
        ]

        worksheet.columns = header;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF204060' }
            };
        });

        // worksheet.eachRow({ includeEmpty: true }, (row) => {
        //     row.eachCell({ includeEmpty: true }, (cell) => {
        //         cell.alignment = { 
        //             horizontal: 'center'
        //         };
        //     });
        // });

        // worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        //     cell.alignment = { 
        //         horizontal: 'center', 
        //         vertical: 'middle', 
        //         wrapText: true
        //     };
        //     cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: 'FF204060' }
        //     };
        // });

        worksheet.addRows(results.data);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip first row (headers)
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="bill_report.xlsx"');

        await workbook.xlsx.write(res);

        res.end();
        auditData.result = "success";
        auditLog.createAuditLog(req, auditData);
    } catch (err) {
        auditData.result = "failed";
        auditLog.createAuditLog(req, auditData);
        logger.error('JobCard Controller exportBillReport Error:', err);
        next(err);
    }
}
const controller = {
    getOTDFailureReasons,
    getTransactionSubstatuses,
    getCustomerData,
    createJobCard,
    createJobCardFromServiceBooking,
    createInitialPortalJobCard,
    savePortalJobCardInspection,
    listJobCards,
    generateJobCardPDF,
    createMechanicMapping,
    getMechanicMapping,
    updateJobCard,
    updateJobCardLineApproval,
    updateJobcardStatus,
    getJobcardLabor,
    listBillJobCards,
    generateWorkOrderPDF,
    getOslScheduleByWOB,
    WorkOrderPDF,
    generateLabourPDF,
    generateJobCardPreInvoicePDF,
    oslWorkOrders,
    listGatePassJobCards,
    downloadGatePass,
    saveBillingDetails,
    getGatePassData,
    generatePartsPDF,

    getAllJobCardsForOutlets,
    getJobCardDetails,
    addInsuranceAddress,
    listInsuranceAddresses,
    addInsurance,
    getInsurance,
    generateJobCardPreInvoiceInsurancePDF,
    updateJobCardInsurance,
    generateLabourInsurancePDF,
    getJobCardStatusReportData,
    exportJobCardStatusReport,
    getGateInGateOutReport,
    exportGateInGateOutReport,
    exportWipStatusReport,
    exportBillReport,
    generateJobCardInvoicePDF,
    generateJobCardInvoiceInsurancePDF,
    exportJobCardDeliveryReport,
    getJobCardDeliveryReportData,
    WipGridView,
    billGridView,
    exportBillSummarySplitUp,
    billSummarySplitUpGridView,
    getWorkOrderReportData,
    exportWorkOrderReport,
    getJobCardData,
    exportChittaReport,
    getReceiptReportData,
    listJobCardsData,
    dashboardEpro,
    getRepairOrderReportData,
    exportRepairOrderReport,
    getEliteStatementData,
    exportEliteStatement,
    vehicleHistory,
    getJobCardForAutoPO,
    createJobCardMobile,
    getJobCardDetailsMobile,
    updateJobCardMobile,
    createGatepassMobile,
    dashboard,
    dashboardInflow,
    getJobCardStatement,
    exportJobCardStatement,
    getMechanicEfficiency,
    exportMechanicEfficiency,
    encryptJc,
    updateCreditApproval,
    updatePartApprove,
    getJobCardDetailsBridge,
    createHsnandItemforPartCatalogue,
    getJobCardForEtaUpdate,
    UploadVerificationDetails,
    GetVerificationDetails,
    listJobCards_v1,
    listJobCardsAdmin,
    listJobCardsByMappedOutlets,
    getJobCardViewByIdAdmin,
    getJobCardDetailsById,
    getJobCardDetailsByIdOutlet,
    updateJobCardOutlet,
    getJobCardViewById,
    getJobCardViewByIdOutlet,
    dashboardAjcRjc,
    dashboardLabourParts,
    jcUpdateByFit,
    dashboardCustomerFlow,
    updateJobcardStatusFit,
    saveBillingDetailsFit,
    dashboardRevenue,
    dashboardMobile,
    dashboardVehicleFlow,
    getTopFiveCustomerForGMS,
    getJobCardStatus,
    getSingleCustomerView,
    verifyGstin,
    getJobCardDetailsCustomerComplaint,
    getpreviousvisits,
    getinspectionreport,
    getinventorydetails,
    getmanagerworklist,
    getinspectorworklist,
    getqiworklist,
    getsaworklist,
    getdetailsforfi,
    getgiworklist_new,
    getcustomerpastvisitdata,
    getAlertMoevVehicleDetails,
    updatesourcedetails,
    getOldJobcardOpenAndWorkinProgress,
    JobCardBillSummaryItReturnDataView,
    JobCardBillSummaryITReturnDataExport
}

export default controller;
