import db from '../index.js'
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { raw } from 'express';
import { Op, where, fn, col, literal, Sequelize, QueryTypes } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import crypto from 'crypto';
import commonLogic from "../../shared/commonLogics.js";
import moment from "moment";
import MobileApiTrackDao from '../mobileApis/dao.js';
import { getRemoteToken } from '../../shared/mobileApiUtility.js';
import axios from 'axios';
import statusConstants from '../../shared/statusConstants.js';
import { stat } from 'fs';
import CarpmDao from '../carpm/dao.js';
import utils from '../Utils/Utils.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";
import UsersService from '../user/service.js';
import {updateBridgeStatusCommon} from '../../shared/bridgeApiUtility.js';
import NeshApi from './../nesh/neshInsightApi.js'
import { EXTERNAL_API } from '../../config/externalUrl.js';
import { oldsequelize } from '../../config/oldDbSequalizeConnection.js';
// import { EXTERNAL_API } from '../../config/externalUrl.js';
import excel from 'exceljs';
import fs from 'fs';
import path from 'path'; 


const TransactionSubstatus = db.transactionsubstatuses;
const Otdfailurereason = db.otdfailurereason;
const Vehicle = db.vehicles;
const Customer = db.customers;
const Model = db.models;
const Make = db.makes;
const LabourSchedules = db.laborschedules;
const Company = db.companies;
const transactionUpdate = db.transactionupdates;
const MonthlyTarget = db.monthlyTarget;


const JobCard = db.jobCard;
const JobCardComplaintAdvice = db.jobCardComplaintAdvice;
const inventoryData = db.saveInventoryCheckList;
const masterInventory = db.vehicleInventoryCheckList;
const Schedules = db.schedules
const OslSchedules = db.oslSchedules
const PartsIndent = db.partsIndent;
const PartsIssue = db.partsIssue;
const MechanicMapping = db.mechaniceMapping;
const sequelize = db.sequelize
const ServiceEstimate = db.servicEstimates;
const Billings = db.billings;
const Items = db.items;
const Stocks = db.stocks
const InsuranceAddress = db.insuranceAddress;
const TransactionInsurance = db.transactionInsurance;

const RepairType = db.repairtypes;
const DsaAgent = db.dsaagents;
const source = db.sources;
const Sourcetypes = db.sourcetypes;
const Servicetypes = db.servicetypes;
const Vendor = db.vendors;
const Users = db.users;
const Employees = db.employees;
const Receipt = db.receipt;
const employeeOutletMap = db.employeeoutletmap
const DisPosition = db.dispositions;
const ServiceBooking = db.servicebookings;
const DriverMaster = db.driverMaster;
const CasualGatePass = db.casualGatePass;
const LabourEstimate = db.labourEstimates;
const OslLabourEstimate = db.oslLabourEstimate;
const PartsEstimate = db.partsEstimates;
const ServiceReminderAlert = db.serviceReminderAlert;
const Outlets = db.outlets;
const CreditNotes = db.creditNotes;
const creditNoteDetails = db.creditNotesDetails;
const vehicleContract = db.vehicleContract;
const vehicleContractScheme = db.vehicleContractScheme;
const LbsDebitNotes = db.lbsDebitNotes;
const Scheme = db.scheme;
const Enquiry = db.enquiry
const checkListTypeMobile = db.saveCheckListType;
const securityGateInModel = db.securityGateIn;
const Reasons = db.preReasons;
const Images = db.mobileImages;
const carpmRecordsModel = db.carpmRecords;
const dentAndScratchModel = db.saveDentAndScratch;
const insurance = db.insurances;
const getOTDFailureReasons = async () => {
    try {
        const data = await Otdfailurereason.findAll({
            order: [['id', 'DESC']],
            attributes: ['id', 'reason', 'status']
        });
        return data;
    } catch (err) {
        logger.error('JobCard dao getOTDFailureReasons Error:', err);
        next(err);
    }
}

const getCompanyDetails = async (companyId) => {
    try {
        return await Company.findOne({ where: { id: companyId } })
    } catch (err) {
        logger.error('Error fetching company details:', err);
        throw err;
    }
};

const getOutletDetails = async (outletId) => {
    try {
        return await db.outlets.findOne({
            where: { id: outletId }
        });

    } catch (err) {
        logger.error('Error fetching outlet details:', err);
        throw err;
    }
}
const getTransactionSubstatuses = async () => {
    try {
        const data = await TransactionSubstatus.findAll({
            order: [['id', 'DESC']],
            attributes: ['id', 'title', 'status']
        });
        return data;
    } catch (err) {
        logger.error('JobCard dao getTransactionSubstatuses Error:', err);
        next(err);
    }
}

const getCustomerData = async (registrationNumber) => {
    try {
        return await Vehicle.findOne({
            where: { registrationNumber: registrationNumber },
            include: [
                { model: Customer, as: 'customer' }
            ],
            attributes: {
                include: [[
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedFirstName'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedLastName'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedMobileNumber'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedEmail'
                ]]
            }
        });
    } catch (err) {
        logger.error("JobCard dao getCustomerData", err);
        next(err);
    }
}

const getCustomerDataRsa = async (customeId) => {
    try {
        return await Customer.findOne({
            where: { id: customeId },
            attributes: {
                include: [[
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedFirstName'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedLastName'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedMobileNumber'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedEmail'
                ]]
            }
        });
    } catch (err) {
        logger.error("JobCard dao getCustomerData", err);
        next(err);
    }
}
const getVehicleDataRsa = async (vehicleId) => {
    try {
        return await Vehicle.findOne({
            where: { id: vehicleId },
            include: [
                { model: Make, as: 'make', attributes: ["id", "makeName"] },
                { model: Model, as: 'model', attributes: ["id", "makeId", "modelName"] }
            ]

        });
    } catch (err) {
        logger.error("JobCard dao getCustomerData", err);
        next(err);
    }
}

const getRecentJobCard = async () => {
    const recentEstimate = JobCard.findOne({
        order: [["createdAt", "DESC"]],
    });

    return recentEstimate;
};

const getTransactionCustomerDetails = async (transaction_id) => {

    try {
        // const query = `
        //     SELECT transaction.*,customers.*,
        //      CAST(AES_DECRYPT(UNHEX(transaction.customer_name), 'mytvs_dms') AS CHAR) AS decryptedCustomerName,
        //      CAST(AES_DECRYPT(UNHEX(transaction.customer_mobileNumber), 'mytvs_dms') AS CHAR) AS decryptedMobileNumber,
        //      CAST(AES_DECRYPT(UNHEX(transaction.customer_name), 'mytvs_dms') AS CHAR) AS decryptedCustomerName
        //     FROM transactions AS transaction
        //     LEFT JOIN customers as customers ON transaction.customer_id=customers.id
        //     WHERE transaction.id = :id 

        // `;

        const query = `
            SELECT 
              transaction.*,
              customers.*,
              CAST(AES_DECRYPT(UNHEX(transaction.customer_name), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS decryptedCustomerName,
              CAST(AES_DECRYPT(UNHEX(transaction.customer_mobileNumber), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS decryptedMobileNumber,
                            CAST(AES_DECRYPT(UNHEX(transaction.customer_email), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS decryptedEmail
            FROM transactions AS transaction
            LEFT JOIN customers AS customers 
              ON transaction.customer_id = customers.id
            WHERE transaction.id = :id
          `;

        const rows = await sequelize.query(query, {
            replacements: { id: transaction_id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;

    } catch (err) {
        logger.error("JobCard dao getTransactionCustomerDetails", err);

        throw err;

    }
}

const getScheduleDetails = async (transaction_id) => {
    try {
        const query = `
            SELECT schedules.*
            FROM schedules AS schedules
            WHERE schedules.transaction_id = :transaction_id AND status = 2
           
        `;

        const rows = await sequelize.query(query, {
            replacements: { transaction_id: transaction_id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;

    } catch (err) {
        logger.error("JobCard dao getScheduleDetails", err);

        throw err;

    }
}

const getOslScheduleDetails = async (transaction_id) => {
    try {
        const query = `
            SELECT osl_schedules.*
            FROM osl_schedules AS osl_schedules
            WHERE osl_schedules.transaction_id = :transaction_id AND status = 2
           
        `;

        const rows = await sequelize.query(query, {
            replacements: { transaction_id: transaction_id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;

    } catch (err) {
        logger.error("JobCard dao getOslScheduleDetails", err);

        throw err;

    }
}

const getScheduleByRotValue = async (transaction_id, rot_id) => {
    try {
        const query = `
            SELECT schedules.*
            FROM schedules AS schedules
            WHERE schedules.transaction_id = :transaction_id AND schedules.rot_id = :rot_id
           
        `;

        const rows = await sequelize.query(query, {
            replacements: { transaction_id: transaction_id, rot_id: rot_id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;

    } catch (err) {
        logger.error("JobCard dao getScheduleRotId", err);

        throw err;

    }
}

const getPartsIssueDetails = async (transaction_id) => {
    try {
        const query = `
            SELECT parts_issues.*,items.hsnCode AS hsn_code
            FROM parts_issues AS parts_issues
            LEFT JOIN items AS items ON parts_issues.item_id=items.id
            WHERE parts_issues.transaction_id = :transaction_id AND quantity != 0
           
        `;

        const rows = await sequelize.query(query, {
            replacements: { transaction_id: transaction_id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;

    } catch (err) {
        logger.error("JobCard dao getPartsIssueDetails", err);

        throw err;

    }
}


const createTransactionUpdate = async (data) => {
    try {

        const newRecord = await transactionUpdate.create({
            transaction_id: data.transaction_id,
            invoice_number: data.invoice_number,
            grand_total: data.grand_total,
            pass_args: data.pass_args,
            created_by: data.created_by
        });

        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const UpdateTransUpdateRes = async (id, updateData) => {
    try {
        const updatedRecord = await transactionUpdate.update(updateData, {
            where: { id: id },
        });

        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


const getRecentJobCardForJcNo = async (documentType, outletCode, year) => {
    const recentEstimate = JobCard.findOne({
        where: {
            // job_card_no: {
            //     [Op.like]: `${documentType}-${outletCode}${year}%`
            // }
            job_card_no: {
                [Op.and]: [
                    { [Op.ne]: null },
                    { [Op.ne]: "" },
                    { [Op.like]: `${documentType}-${outletCode}${year}%` }
                ]
            }
        },
        // order: [["createdAt", "DESC"]],
        order: [[Sequelize.literal('CAST(SUBSTRING_INDEX(job_card_no, "-", -1) AS UNSIGNED)'), 'DESC']
        ],
    });

    return recentEstimate;
};

const createJobCard = async (reqData, user, customerData) => {
    // console.log('jc create req body', reqData)
    let data = {};
    const currentDate = new Date();
    try {
        let formattedDate = null;
        if (reqData.expectedWorkCompletion) {
            formattedDate = moment(
                reqData.expectedWorkCompletion,
                ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
            ).format("YYYY-MM-DD HH:mm:ss");
        } else {
            formattedDate = moment().format("YYYY-MM-DD HH:mm:ss"); // default current time
        }

        data = await JobCard.create({
            outlet_id: user.outlet.id,
            outlet_code: user.outlet.outletCode,
            document_type: reqData.documentType,
            job_card_no: reqData.jobCardNumber,
            customer_id: customerData.customeId,
            customer_code: customerData.customerCode,
            customer_name: customerData.customerName,
            customer_address: customerData.customerAddress,
            customer_state: customerData.customerState,
            customer_city: customerData.customerCity,
            customer_pincode: customerData.pincode,
            customer_type: customerData.customerType,
            customer_gstin: customerData.gstinNumber,
            vehicle_id: customerData.vehicleId,
            customer_mobileNumber: customerData.customerMobileNumber,
            customer_email: customerData.customerEmail,
            reg_no: reqData.registrationNumber,
            // work_end_date_time: reqData.expectedWorkCompletion,
            work_end_date_time: formattedDate,
            customer_arrived_date: reqData.customerArrivedDate,
            repair_type: reqData.repairTypeId,
            service_type: reqData.serviceTypeId,
            odometer: reqData.odometer,
            service_booking_id: reqData.serviceBookingId ? String(reqData.serviceBookingId) : null,
            status: 1,
            status_value: "Open",
            service_estimate_id: reqData.serviceEstimateId ? reqData.serviceEstimateId : 0,
            service_estimate_code: reqData.serviceEstimateNumber ? reqData.serviceEstimateNumber : "",
            customer_voice: reqData.customerVoice,
            source: reqData.sourceId,
            source_type: reqData.sourceTypeId,
            dsa_agent_id: reqData.dsaAgent && reqData.dsaAgent.id > 0
                ? reqData.dsaAgent.id
                : null,

            // dsa_agent_id: reqData.dsaAgent ? reqData.dsaAgent.id : null,
            dsa_agent: reqData.dsaAgent ? reqData.dsaAgent.dsaCode : null,
            service_engineer_remarks: reqData.serviceEngineerRemarks,
            service_advice: reqData.serviceAdvice,
            part_approve: 1,
            credit_approve: 1,
            credit_approve_reason: "test",



            otd_reason_id: reqData.OtdFailureReason ? reqData.OtdFailureReason.id : 0,
            otd_reason: reqData.OtdFailureReason ? reqData.OtdFailureReason.reason : "",
            sub_status: reqData.TransactionSubStatus ? reqData.TransactionSubStatus.title : "",
            sub_status_reason: reqData.TransactionSubStatusReason ? reqData.TransactionSubStatusReason : "",
            paid_by_status: reqData.paidByStatus,
            stageNorms: reqData.stageNorms ? reqData.stageNorms : null,
            axle: reqData.axle ? reqData.axle : null,
            application: reqData.application ? reqData.application : null,
            nextDueDateFC: reqData.fc ? reqData.fc : null,
            engineOilCapacity: reqData.engineOilCapacity ? reqData.engineOilCapacity : null,
            // expectedWorkCompletedDate: estimateData.expectedWorkCompletedDate
            //   ? estimateData.expectedWorkCompletedDate
            //   : "2024-07-23",
            // serviceBookingId: estimateData.serviceBookingId
            //   ? estimateData.serviceBookingId
            //   : "0",
            jobType: reqData.jobType,
            per_day_km: reqData.PerDayKm,
            insuranceName: reqData.insuranceName ? reqData.insuranceName : null,
            insuranceExpDate: reqData.insuranceExpDate ? reqData.insuranceExpDate : null,
            created_by: user.id,
            updated_by: user.id,
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createJobCard", err);
    }

    return data;
};

const findPortalVehicleByRegistration = async (registrationNumber) => {
    return Vehicle.findOne({
        where: where(fn('UPPER', col('registrationNumber')), String(registrationNumber || '').toUpperCase()),
    });
};

const setVehicleAlternativeMobile = async (vehicleId, mobileNumber, userId) => {
    return Vehicle.update(
        { mobileNumber, updatedBy: userId },
        { where: { id: vehicleId } }
    );
};

const linkPortalVehicleToCustomer = async (vehicleId, customerId, userId) => {
    return Vehicle.update(
        { customerId, updatedBy: userId },
        { where: { id: vehicleId, customerId: null } }
    );
};

const createInitialPortalJobCard = async (details, user) => {
    const now = new Date();
    return JobCard.create({
        outlet_id: user.outlet.id,
        outlet_code: user.outlet.outletCode,
        document_type: details.documentType || 'RJC',
        job_card_no: details.jobCardNumber,
        customer_id: details.customer.id,
        customer_code: details.customer.customerCode || `CUST-${details.customer.id}`,
        customer_name: details.customer.name,
        customer_address: details.customer.address1 || '',
        customer_state: details.customer.state || '',
        customer_city: details.customer.city || '',
        customer_pincode: Number(details.customer.pinCode) || 0,
        customer_type: details.customer.customerType || null,
        customer_mobileNumber: details.mobileNumber,
        customer_email: details.customer.email || null,
        vehicle_id: details.vehicle.id,
        reg_no: details.vehicle.registrationNumber,
        work_end_date_time: now,
        customer_arrived_date: now,
        repair_type: details.repairTypeId || 1,
        service_type: details.serviceTypeId || 1,
        odometer: Number(details.odometer) || 0,
        status: 1,
        status_value: 'Open',
        source: details.sourceId || 1,
        source_type: details.sourceTypeId || 1,
        created_by: user.id,
        updated_by: user.id,
    });
};

const savePortalJobCardInspection = async (jobCardId, details, user) => {
    const transaction = await sequelize.transaction();
    try {
        const jobCard = await JobCard.findOne({
            where: { id: jobCardId, outlet_id: user.outlet.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!jobCard) {
            const err = new Error('Job card not found for this outlet');
            err.status = 404;
            throw err;
        }

        await jobCard.update({
            odometer: Number(details.odometer),
            fuel_level_percentage: Number(details.fuelLevel),
            updated_by: user.id,
        }, { transaction });
        await Vehicle.update(
            { odometer: Number(details.odometer), updatedBy: user.id },
            { where: { id: jobCard.vehicle_id }, transaction }
        );

        await inventoryData.destroy({ where: { visit_id: String(jobCardId) }, transaction });
        const inventoryRows = details.inventory.map((item) => ({
            visit_id: String(jobCardId),
            vehicle_inv_ver: item.version || '1.0',
            inventory_code: item.code,
            inventory_type: item.type || 'CUSTOMER',
            inventory_condition: item.condition || 'Present',
            remarks: item.remarks || null,
            created_date: new Date(),
        }));
        if (inventoryRows.length) await inventoryData.bulkCreate(inventoryRows, { transaction });

        await db.preMajorCheckList.destroy({ where: { VISIT_ID: String(jobCardId) }, transaction });
        await db.preReasons.destroy({ where: { VISIT_ID: String(jobCardId) }, transaction });
        const checklistRows = details.inspection.map((item) => ({
            VISIT_ID: String(jobCardId),
            CHECKLIST_ID: item.paramCode,
            CONTENTS: JSON.stringify({ ratingReasonCode: item.ratingReasonCode, remarks: item.remarks || null }),
            CREATED_BY: String(user.id),
            UPDATED_BY: String(user.id),
        }));
        const reasonRows = details.inspection.map((item) => ({
            VISIT_ID: String(jobCardId),
            INSPECTION_TYPE: item.inspectionType || 'Major',
            CHECKLIST_TYPE_CODE: item.checklistTypeCode || 'CHK_LIST_MAJOR',
            CHECKLIST_VERSION: item.checklistVersion || '1.0',
            PARAM_CHECKLIST_ID: item.paramCode,
            RATING_CHECKLIST_ID: item.ratingReasonCode,
            RATING_REASON_REMARKS: item.remarks || null,
            MEASUREMENT_READING: item.measurementReading || null,
            CREATED_BY: String(user.id),
            UPDATED_BY: String(user.id),
        }));
        if (checklistRows.length) await db.preMajorCheckList.bulkCreate(checklistRows, { transaction });
        if (reasonRows.length) await db.preReasons.bulkCreate(reasonRows, { transaction });

        await JobCardComplaintAdvice.destroy({ where: { transaction_id: jobCardId }, transaction });
        const complaintAdviceRows = (details.complaintAdvice || []).map((item) => ({
            transaction_id: jobCardId,
            customer_complaint: item.customerComplaint.trim(),
            service_advice: item.serviceAdvice?.trim() || null,
            attended: item.attended,
            created_by: user.id,
            updated_by: user.id,
        }));
        if (complaintAdviceRows.length) {
            await JobCardComplaintAdvice.bulkCreate(complaintAdviceRows, { transaction });
        }

        await transaction.commit();
        return jobCard;
    } catch (err) {
        await transaction.rollback();
        logger.error('JobCard dao savePortalJobCardInspection', err);
        throw err;
    }
};

const getServiceBookingForJobCard = async (serviceBookingId, outletId) => {
    try {
        return await ServiceBooking.findOne({
            where: { id: serviceBookingId, outletId },
            raw: true,
        });
    } catch (err) {
        logger.error('JobCard dao getServiceBookingForJobCard', err);
        throw err;
    }
};

const getJobCardByServiceBookingId = async (serviceBookingId, outletId) => {
    try {
        return await JobCard.findOne({
            where: { service_booking_id: String(serviceBookingId), outlet_id: outletId },
        });
    } catch (err) {
        logger.error('JobCard dao getJobCardByServiceBookingId', err);
        throw err;
    }
};

const saveServiceBookingJobCardActivity = async (serviceBookingId, jobCardId, userId) => {
    const transaction = await sequelize.transaction();
    try {
        await db.servicebookingactivities.create({
            serviceBookingId,
            status: 'Proceed to Jobcard',
            createEstimate: false,
            jobCardId,
            createdBy: userId,
        }, { transaction });
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        logger.error('JobCard dao saveServiceBookingJobCardActivity', err);
        throw err;
    }
};

const createSchedule = async (schedulesData, user) => {
    let data = {};
    const currentDate = new Date();
    console.log('create schedule data dao.js -------------', schedulesData)
    try {
        if (schedulesData.laborId !== null && schedulesData.laborId !== undefined && schedulesData.laborId !== "") {
            console.log('inside create schedule dao')
            data = await Schedules.create({
                transaction_id: schedulesData.transactionId,
                rot_id: schedulesData.laborId,
                rot_code: schedulesData.laborCode,
                description: schedulesData.laborDescription,
                quantity: schedulesData.quantity,
                singleAmount: schedulesData.singleAmount,
                amount: schedulesData.rate ?? schedulesData.amount,
                additionalMargin: schedulesData.additionalMargin,
                discount_percentage: schedulesData.discountAmount,
                sgst: schedulesData.sgst,
                cgst: schedulesData.cgst,
                igst: schedulesData.igst,
                depreciation_per: schedulesData.depreciation,
                customer_amount: schedulesData.customerAmount,
                insurance_amount: schedulesData.insuranceAmount,
                laborTotal: schedulesData.laborTotal,
                status: schedulesData.status ? schedulesData.status : 1,
                repairTypeId: schedulesData.repairType.id,
                repairTypeName: schedulesData.repairType.repairTypeName,
                created_by: user.id,
                updated_by: user.id,
                approvalStatus: 'PENDING',
                sourceType: 'JOB_CARD',
                sourceEstimateItemId: null,
            });
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao createSchedule", err);
    }

    return data;
};

// const updateSchedule = async (schedulesData, user) => {
//     let data = {};
//     const currentDate = new Date();
//     try { 
//         if(schedulesData.laborId !== null && schedulesData.laborId !== undefined && schedulesData.laborId !== "" ){
//             data = await Schedules.update({
//                 transaction_id: schedulesData.transactionId,
//                 rot_id: schedulesData.laborId,
//                 rot_code: schedulesData.laborCode,
//                 description: schedulesData.laborDescription,
//                 quantity: schedulesData.quantity,
//                 singleAmount: schedulesData.singleAmount,
//                 amount: schedulesData.rate,
//                 additionalMargin: schedulesData.additionalMargin,
//                 discount_percentage: schedulesData.discountAmount,
//                 sgst: schedulesData.sgst?schedulesData.sgst:'0',
//                 cgst: schedulesData.cgst?schedulesData.cgst:'0',
//                 igst: schedulesData.igst?schedulesData.igst:'0',
//                 depreciation_per: schedulesData.depreciation,
//                 customer_amount: schedulesData.customerAmount,
//                 insurance_amount: schedulesData.insuranceAmount,
//                 laborTotal: schedulesData.laborTotal,
//                 status: schedulesData.status ? schedulesData.status : 1,
//                 repairTypeId: schedulesData.repairType.id,
//                 repairTypeName: schedulesData.repairType.repairTypeName,
//                 updated_by: user.id,
//             }, {where: {id: schedulesData.id}});
//         }
//     } catch (err) {
//         console.log(err);
//         logger.error("Job Card Dao updateSchedule", err);
//     }

//     return data;
// };

const updateSchedule = async (schedulesData, user) => {
    // console.log('schedule',schedulesData)
    let updatedData = {};
    const currentDate = new Date();

    try {
        if (
            schedulesData.laborId !== null &&
            schedulesData.laborId !== undefined &&
            schedulesData.laborId !== ""
        ) {

            const existingSchedule = await Schedules.findOne({
                where: { id: schedulesData.id, transaction_id: schedulesData.transactionId },
            });
            if (!existingSchedule) return null;
            // console.log('existing data',existingSchedule)

            const mergedData = {
                transaction_id: schedulesData.transactionId,
                rot_id: schedulesData.laborId,
                rot_code: schedulesData.laborCode,
                description: schedulesData.laborDescription,
                quantity: schedulesData.quantity ?? existingSchedule.quantity,
                singleAmount: schedulesData.singleAmount ?? existingSchedule.singleAmount,
                amount: schedulesData.rate ?? existingSchedule.amount,
                additionalMargin: schedulesData.additionalMargin ?? existingSchedule.additionalMargin,
                discount_percentage:
                    schedulesData.discountAmount ??
                    existingSchedule.discount_percentage ??
                    0,
                sgst: schedulesData.sgst ?? existingSchedule.sgst ?? "0",
                cgst: schedulesData.cgst ?? existingSchedule.cgst ?? "0",
                igst: schedulesData.igst ?? existingSchedule.igst ?? "0",
                depreciation_per:
                    schedulesData.depreciation ?? existingSchedule.depreciation_per,
                customer_amount:
                    schedulesData.customerAmount ?? existingSchedule.customer_amount,
                insurance_amount:
                    schedulesData.insuranceAmount ?? existingSchedule.insurance_amount,
                laborTotal: schedulesData.laborTotal ?? existingSchedule.laborTotal,
                status: schedulesData.status ?? existingSchedule.status,
                repairTypeId:
                    schedulesData.repairType?.id ?? existingSchedule.repairTypeId,
                repairTypeName:
                    schedulesData.repairType?.repairTypeName ??
                    existingSchedule.repairTypeName,
                updated_by: user.id,
                fitId: schedulesData.fitId ?? existingSchedule.fitId

            };

            await Schedules.update(mergedData, {
                where: { id: schedulesData.id, transaction_id: schedulesData.transactionId },
            });

            updatedData = await Schedules.findOne({
                where: { id: schedulesData.id, transaction_id: schedulesData.transactionId },
            });

            return updatedData?.dataValues;
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao updateSchedule", err);
    }

    return updatedData;
};


const createOslSchedule = async (oslScheduleData, user) => {
    let data = {};
    const currentDate = new Date();
    try {
        if (oslScheduleData.laborId !== null && oslScheduleData.laborId !== undefined && oslScheduleData.laborId !== "") {
            data = await OslSchedules.create({
                transaction_id: oslScheduleData.transactionId,
                rot_id: oslScheduleData.laborId,
                rot_code: oslScheduleData.laborCode,
                description: oslScheduleData.laborDescription,
                quantity: oslScheduleData.quantity,
                singleAmount: oslScheduleData.rate == "" ? 0 : oslScheduleData.rate,
                amount: oslScheduleData.rate == "" ? 0 : oslScheduleData.rate,
                additionalMargin: oslScheduleData.additionalMargin,
                discount_percentage: oslScheduleData.discountAmount,
                sgst: oslScheduleData.sgst ? oslScheduleData.sgst : '0',
                cgst: oslScheduleData.cgst ? oslScheduleData.cgst : '0',
                igst: oslScheduleData.igst ? oslScheduleData.igst : '0',
                depreciation_per: oslScheduleData.depreciation,
                customer_amount: oslScheduleData.customerAmount,
                insurance_amount: oslScheduleData.insuranceAmount,
                laborTotal: oslScheduleData.laborTotal,
                status: oslScheduleData.status ? oslScheduleData.status : 1,
                vendorId: oslScheduleData.supplierCode.id,
                marginPercentage: oslScheduleData.supplierCode.marginPercentage,
                osl_bill_no: oslScheduleData.oslBillNo,
                // osl_bill_no: "test123",
                created_by: user.id,
                updated_by: user.id,
                approvalStatus: 'PENDING',
                sourceType: 'JOB_CARD',
                sourceEstimateItemId: null,
            });
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao createOslSchedule", err);
    }

    return data;
};

// const updateOslSchedule = async (oslScheduleData, user) => {
//     let data = {};
//     const currentDate = new Date();
//     try {
//         if(oslScheduleData.laborId !== null && oslScheduleData.laborId !== undefined && oslScheduleData.laborId !== "" ){
//             data = await OslSchedules.update({
//                 transaction_id: oslScheduleData.transactionId,
//                 rot_id: oslScheduleData.laborId,
//                 rot_code: oslScheduleData.laborCode,
//                 description: oslScheduleData.laborDescription,
//                 quantity: oslScheduleData.quantity,
//                 singleAmount: oslScheduleData.rate == "" ? 0 : oslScheduleData.rate,
//                 amount: oslScheduleData.rate == "" ? 0 : oslScheduleData.rate,
//                 additionalMargin: oslScheduleData.additionalMargin,
//                 discount_percentage: oslScheduleData.discountAmount,
//                 sgst: oslScheduleData.sgst?oslScheduleData.sgst:'0',
//                 cgst: oslScheduleData.cgst?oslScheduleData.cgst:'0',
//                 igst: oslScheduleData.igst?oslScheduleData.igst:'0',
//                 depreciation_per: oslScheduleData.depreciation,
//                 customer_amount: oslScheduleData.customerAmount,
//                 insurance_amount: oslScheduleData.insuranceAmount,
//                 laborTotal: oslScheduleData.laborTotal,
//                 status: oslScheduleData.status ? oslScheduleData.status : 1,
//                 vendorId: oslScheduleData.supplierCode.id,
//                 marginPercentage: oslScheduleData.supplierCode.marginPercentage,
//                 osl_bill_no: oslScheduleData.oslBillNo,
//                 // osl_bill_no: "test123",
//                 updated_by: user.id,
//             }, {where: {id: oslScheduleData.id}});
//         }
//     } catch (err) {
//         console.log(err);
//         logger.error("Job Card Dao updateOslSchedule", err);
//     }

//     return data;
// };

const updateOslSchedule = async (oslScheduleData, user) => {
    console.log('job card osl schedule update data', oslScheduleData)
    let updatedData = {};
    try {
        if (oslScheduleData.laborId !== null && oslScheduleData.laborId !== undefined && oslScheduleData.laborId !== "") {

            const existingOsl = await OslSchedules.findOne({ where: { id: oslScheduleData.id, transaction_id: oslScheduleData.transactionId } });
            if (!existingOsl) return null;

            const mergedData = {
                transaction_id: oslScheduleData.transactionId,
                rot_id: oslScheduleData.laborId,
                rot_code: oslScheduleData.laborCode,
                description: oslScheduleData.laborDescription,
                quantity: oslScheduleData.quantity,
                singleAmount: oslScheduleData.rate == '' ? 0 : oslScheduleData.rate,
                amount: oslScheduleData.rate == '' ? 0 : oslScheduleData.rate,
                additionalMargin: oslScheduleData.additionalMargin ?? existingOsl.additionalMargin ?? 0,
                discount_percentage: oslScheduleData.discountAmount ?? existingOsl.discount_percentage ?? 0,
                sgst: oslScheduleData.sgst ?? existingOsl.sgst ?? '0',
                cgst: oslScheduleData.cgst ?? existingOsl.cgst ?? '0',
                igst: oslScheduleData.igst ?? existingOsl.igst ?? '0',
                depreciation_per: oslScheduleData.depreciation ?? existingOsl.depreciation_per,
                customer_amount: oslScheduleData.customerAmount ?? existingOsl.customer_amount,
                insurance_amount: oslScheduleData.insuranceAmount ?? existingOsl.insurance_amount,
                laborTotal: oslScheduleData.laborTotal ?? existingOsl.laborTotal,
                status: oslScheduleData.status ?? existingOsl.status,
                vendorId: oslScheduleData.supplierCode?.id ?? existingOsl.vendorId ?? 0,
                marginPercentage: oslScheduleData.supplierCode?.marginPercentage ?? existingOsl.marginPercentage ?? 0,
                osl_bill_no: oslScheduleData.oslBillNo ?? existingOsl.osl_bill_no,
                fitId: oslScheduleData.fitId ?? existingOsl.fitId,
                updated_by: user.id,
            };

            await OslSchedules.update(mergedData, { where: { id: oslScheduleData.id, transaction_id: oslScheduleData.transactionId } });

            updatedData = await OslSchedules.findOne({ where: { id: oslScheduleData.id, transaction_id: oslScheduleData.transactionId } });

            return updatedData?.dataValues;
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao updateOslSchedule", err);
    }

    return updatedData;
};

const listJobCards_v1 = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        const userCondition = {
            created_by: user.id, outlet_id: user.outlet.id, status:
            {
                [Op.in]: [1, 2, 3]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ],
                }


            ],
            attributes: [
                'id', 'document_type', 'vehicle_id', 'customer_name', 'reg_no', 'job_card_no', 'status', 'status_value',
                'sub_status', 'sub_status_reason', 'updatedAt',
                "jobType", "outlet_id"


            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCards", err);
        throw err;
    }
};


const listJobCardsAdmin = async (reqData, user) => {
    try {
        console.log('user:', user);
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        const userCondition = {
            outlet_id: user.outlet.id,
            status: {
                [Op.in]: [1, 2, 3]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ],
                }
            ],
            attributes: [
                'id', 'document_type', 'vehicle_id', 'customer_name', 'reg_no', 'job_card_no', 'status', 'status_value',
                'sub_status', 'sub_status_reason', 'updatedAt',
                "jobType", "outlet_id"
            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCardsAdmin", err);
        console.log(err);
    }
};

// Outlet-mapped variant of listJobCardsAdmin. Instead of the single home outlet
// (user.outlet.id), it filters job cards by ALL outlets the user is mapped to in
// employee_outlet_map (emp_id = user.employeeId). listJobCardsAdmin is untouched.
const listJobCardsByMappedOutlets = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;

        // Outlet ids the user is mapped to (employee_outlet_map).
        const mappings = await db.employeeoutletmap.findAll({
            where: { emp_id: user.employeeId },
            attributes: ['outlet_id'],
            raw: true,
        });
        const outletIds = mappings.map((m) => m.outlet_id);

        // No mapped outlets => no data. Does NOT fall back to the home outlet.
        if (outletIds.length === 0) {
            return { totalItems: 0, data: [] };
        }

        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        const userCondition = {
            outlet_id: { [Op.in]: outletIds },
            status: {
                [Op.in]: [1, 2, 3]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ],
                }
            ],
            attributes: [
                'id', 'document_type', 'vehicle_id', 'customer_name', 'reg_no', 'job_card_no', 'status', 'status_value',
                'sub_status', 'sub_status_reason', 'updatedAt',
                "jobType", "outlet_id"
            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCardsByMappedOutlets", err);
        throw err;
    }
};

const getJobCardDetailsById = async (JcId, user) => {
    try {
        const searchCondition = {
            id: JcId
        };

        const userCondition = {
            created_by: user.id, outlet_id: user.outlet.id
        };

        const rows = await JobCard.findOne({
            where: { ...searchCondition, ...userCondition },
            include: [
                {
                    model: Schedules, as: "schedules", attributes: ['id', 'rot_id', ['rot_code', "laborCode"], ['description', "laborDescription"],
                        'quantity', 'singleAmount', 'amount', 'additionalMargin', ['discount_percentage', "discountAmount"], 'sgst', 'cgst', 'igst',
                        ['depreciation_per', "depreciation"], ['customer_amount', "customerAmount"],
                        ['insurance_amount', "insuranceAmount"], 'laborTotal', 'status', 'repairTypeId', 'repairTypeName', 'approveDatetime', 'approvalStatus', 'sourceType', 'sourceEstimateItemId']
                },
                {
                    model: OslSchedules, as: "oslSchedules",
                    attributes:
                        [
                            'id', 'rot_id', ['rot_code', "laborCode"],
                            ['description', "laborDescription"], 'quantity',
                            'singleAmount', 'amount', 'additionalMargin', ['discount_percentage', "discountAmount"],
                            'sgst', 'cgst', 'igst', ['depreciation_per', "depreciation"], ['customer_amount', "customerAmount"],
                            ['insurance_amount', "insuranceAmount"], 'laborTotal', 'status', 'vendorId', ['osl_bill_no', "oslBillNo"],
                            'marginPercentage', 'approveDatetime', 'approvalStatus', 'sourceType', 'sourceEstimateItemId']
                },
                {
                    model: PartsIndent, as: "partsIndent", attributes: [
                        "id",
                        "transaction_id",
                        "item_id",
                        ["item_code", "partNo"],
                        ["item_name", "partDescription"],
                        "status",
                        ["request_quantity", "requestedQuantity"],
                        "received_quantity",
                        "return_quantity",
                        ["amount", "rate"],
                        ["part_total", "partTotal"],
                        "sgst",
                        "cgst",
                        "igst",
                        ["hsn_code", "hsnCode"],
                        "created_by",
                        "updated_by",
                        "fitId",
                        "approveDatetime",
                        "approvalStatus",
                        "sourceType",
                        "sourceEstimateItemId",
                        "indentType",
                        "eta",
                        "remarks",
                        "createdAt",
                        "updatedAt",
                        // Expose the parts_indent.discount column (written by the outlet
                        // edit) so editJobCard also shows the part discount. Aliased to
                        // discountAmount to match the labour/part discount field name.
                        ["discount", "discountAmount"]
                    ]
                },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber', ['mobileNumber', 'alternativeMobileNumber']],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName', ["segment", "modelSegment"]] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                        {
                            model: vehicleContract, as: 'vehicleContracts',
                            include: [
                                { model: Scheme, as: 'scheme', attributes: ['repair_type_id'] },
                                { model: vehicleContractScheme, as: 'vehicleContractSchemes', attributes: ['labor_parts_id', 'scheme_labor_parts_code', 'balance_count', 'item_type'] }
                            ],
                            attributes: ['vehicle_number'],
                            required: false,
                            where: {
                                end_date: {
                                    [Op.gt]: new Date() // current date
                                }
                            }
                        }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: db.customers, as: 'jcCustomerMapping',
                    attributes: [['state', "customerState"]]
                },
                {
                    model: Outlets,
                    as: 'outlet',
                    attributes: ['id', 'companyId']
                }

            ],
            attributes: [
                'id', ['document_type', "documentType"], 'vehicle_id', ['reg_no', 'registrationNumber'], 'job_card_no', 'repair_type', 'service_type', 'odometer', ['fuel_level_percentage', 'fuelLevel'], 'status',
                'source', 'source_type', 'sub_status', ['sub_status_reason', 'TransactionSubStatusReason'],
                "dsa_agent", "otd_reason",
                "insuranceName", ["customer_voice", "customerVoice"], ["service_engineer_remarks", "serviceEngineerRemarks"], ["service_advice", "serviceAdvice"],
                "insuranceExpDate", "customer_id",
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'expectedWorkCompletion'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customerArrivedDate'],

            ]
        });

        const plain = rows ? rows.get({ plain: true }) : null;

        if (plain) {
            const savedFuelLevel = plain.fuelLevel;
            plain.fuelLevel = savedFuelLevel === null || savedFuelLevel === undefined || savedFuelLevel === ''
                ? null
                : (Number.isFinite(Number(savedFuelLevel)) ? Number(savedFuelLevel) : null);
            const [savedInventory, savedInspection, savedComplaintAdvice] = await Promise.all([
                inventoryData.findAll({
                    where: { visit_id: String(JcId) },
                    attributes: ['inventory_code', 'inventory_type', 'inventory_condition', 'remarks', 'vehicle_inv_ver'],
                }),
                db.preReasons.findAll({
                    where: { VISIT_ID: String(JcId) },
                    attributes: [
                        ['PARAM_CHECKLIST_ID', 'paramCode'],
                        ['RATING_CHECKLIST_ID', 'ratingReasonCode'],
                        ['RATING_REASON_REMARKS', 'remarks'],
                        ['MEASUREMENT_READING', 'measurementReading'],
                        'INSPECTION_TYPE', 'CHECKLIST_TYPE_CODE', 'CHECKLIST_VERSION',
                    ],
                }),
                JobCardComplaintAdvice.findAll({
                    where: { transaction_id: Number(JcId) },
                    attributes: ['id', ['customer_complaint', 'customerComplaint'], ['service_advice', 'serviceAdvice'], 'attended'],
                    order: [['id', 'ASC']],
                }),
            ]);
            plain.inventoryChecklist = savedInventory.map((item) => item.get({ plain: true }));
            plain.inspectionChecklist = savedInspection.map((item) => item.get({ plain: true }));
            plain.complaintAdvice = savedComplaintAdvice.map((item) => {
                const data = item.get({ plain: true });
                return { ...data, attended: Boolean(data.attended) };
            });
        }

        return { data: plain };

    } catch (err) {
        logger.error("Job Card dao by id err:", err);
        console.log(err);
    }
};

// Outlet-scoped variant of getJobCardDetailsById used by /jobcard/outletEdit.
// Mirrors the legacy tvsfitpv_new outlet/transactions/add load conditions:
//   - scope by outlet_id only (NO created_by) so cards created by other users
//     in the outlet can be edited,
//   - load labour/osl only where status IN (1,2),
//   - load parts (PartsIssue) only where quantity != 0.
// The status >= 3 editability guard is enforced on the frontend (redirect).
const getJobCardDetailsByIdOutlet = async (JcId, user) => {
    console.log('user:', user);
    try {
        const searchCondition = {
            id: JcId
        };

        // Scope by the user's mapped outlets (employee_outlet_map), matching the
        // outletJC list (listJobCardsByMappedOutlets). Previously this filtered by
        // the single home outlet (user.outlet.id), so a card shown in the list but
        // belonging to another mapped outlet (or whose outlet_id was changed by a
        // standard edit) returned no row -> 400 on the edit page.
        const mappings = await db.employeeoutletmap.findAll({
            where: { emp_id: user.employeeId },
            attributes: ['outlet_id'],
            raw: true,
        });
        const outletIds = mappings.map((m) => m.outlet_id);

        const userCondition = {
            outlet_id: { [Op.in]: outletIds }
        };

        const rows = await JobCard.findOne({
            where: { ...searchCondition, ...userCondition },
            include: [
                {
                    model: Schedules, as: "schedules",
                    where: { status: { [Op.in]: [1, 2] } },
                    required: false,
                    attributes: ['id', 'rot_id', ['rot_code', "laborCode"], ['description', "laborDescription"],
                        'quantity', 'singleAmount', 'amount', 'additionalMargin', ['discount_percentage', "discountAmount"], 'sgst', 'cgst', 'igst',
                        ['depreciation_per', "depreciation"], ['customer_amount', "customerAmount"],
                        ['insurance_amount', "insuranceAmount"], 'laborTotal', 'status', 'repairTypeId', 'repairTypeName', 'approveDatetime', 'approvalStatus', 'sourceType', 'sourceEstimateItemId']
                },
                {
                    model: OslSchedules, as: "oslSchedules",
                    where: { status: { [Op.in]: [1, 2] } },
                    required: false,
                    attributes:
                        [
                            'id', 'rot_id', ['rot_code', "laborCode"],
                            ['description', "laborDescription"], 'quantity',
                            'singleAmount', 'amount', 'additionalMargin', ['discount_percentage', "discountAmount"],
                            'sgst', 'cgst', 'igst', ['depreciation_per', "depreciation"], ['customer_amount', "customerAmount"],
                            ['insurance_amount', "insuranceAmount"], 'laborTotal', 'status', 'vendorId', ['osl_bill_no', "oslBillNo"],
                            'marginPercentage', 'approveDatetime', 'approvalStatus', 'sourceType', 'sourceEstimateItemId']
                },
                {
                    model: PartsIndent, as: "partsIndent", attributes: [
                        "id",
                        "transaction_id",
                        "item_id",
                        ["item_code", "partNo"],
                        ["item_name", "partDescription"],
                        "status",
                        ["request_quantity", "requestedQuantity"],
                        "received_quantity",
                        "return_quantity",
                        ["amount", "rate"],
                        ["part_total", "partTotal"],
                        "sgst",
                        "cgst",
                        "igst",
                        ["hsn_code", "hsnCode"],
                        "created_by",
                        "updated_by",
                        "fitId",
                        "approveDatetime",
                        "approvalStatus",
                        "sourceType",
                        "sourceEstimateItemId",
                        "indentType",
                        "eta",
                        "remarks",
                        "createdAt",
                        "updatedAt",
                        ["discount", "discountAmount"]
                    ]
                },
                {
                    model: PartsIssue, as: "partsIssue",
                    where: { quantity: { [Op.gt]: 0 } },
                    required: false
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName', ["segment", "modelSegment"]] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                        {
                            model: vehicleContract, as: 'vehicleContracts',
                            include: [
                                { model: Scheme, as: 'scheme', attributes: ['repair_type_id'] },
                                { model: vehicleContractScheme, as: 'vehicleContractSchemes', attributes: ['labor_parts_id', 'scheme_labor_parts_code', 'balance_count', 'item_type'] }
                            ],
                            attributes: ['vehicle_number'],
                            required: false,
                            where: {
                                end_date: {
                                    [Op.gt]: new Date() // current date
                                }
                            }
                        }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: db.customers, as: 'jcCustomerMapping',
                    attributes: [['state', "customerState"]]
                },
                {
                    model: Outlets,
                    as: 'outlet',
                    attributes: ['id', 'companyId']
                }

            ],
            attributes: [
                'id', ['document_type', "documentType"], 'vehicle_id', ['reg_no', 'registrationNumber'], 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status',
                'source', 'source_type', 'sub_status', ['sub_status_reason', 'TransactionSubStatusReason'],
                "dsa_agent", "otd_reason",
                "insuranceName", ["customer_voice", "customerVoice"], ["service_engineer_remarks", "serviceEngineerRemarks"], ["service_advice", "serviceAdvice"],
                "insuranceExpDate", "customer_id",
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'expectedWorkCompletion'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customerArrivedDate'],

            ]
        });

        const plain = rows ? rows.get({ plain: true }) : null;

        return { data: plain };

    } catch (err) {
        logger.error("Job Card dao by id outlet err:", err);
        console.log(err);
    }
};

const getJobCardViewById = async (JcId, user) => {
    try {
        const searchCondition = {
            id: JcId
        };

        const userCondition = {
             outlet_id: user.outlet.id
        };

        const rows = await JobCard.findOne({
            where: { ...searchCondition, ...userCondition },
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                {
                    model: PartsIssue, as: "partsIssue", where: {
                        quantity: {
                            [Op.gt]: 0
                        }
                    },
                    required: false,
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: Customer, as: 'jcCustomerMapping',
                    attributes: ['state', "is_b2b"]

                },
                {
                    model: Outlets,
                    as: 'outlet',
                    attributes: ['id', 'companyId']
                }

            ],
            attributes: [
                'id', 'customer_name', 'vehicle_id', 'reg_no', 'job_card_no', 'odometer', 'status', 'status_value',
                'source', 'source_type', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'created_by', 'updated_by', 'updatedAt',
                "nextDueDateFC", "jobType", "document_type",

                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('transactions.createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        const outlet = await Outlets.findOne({
            where: { id: user.outlet.id },
            attributes: ['companyId']
        });
        const plain = rows ? rows.get({ plain: true }) : null;
        //   console.log('plain data-----------',plain);
        if (
            plain &&
            plain.status === 3 &&
            [2, 5, 8].includes(outlet.companyId) &&
            plain.jcCustomerMapping?.is_b2b !== 1 &&
            plain.jcCustomerMapping?.state !== 'KERALA'
        ) {
            let labourAmountAfterDiscounts = 0;
            let labourQuantitys = 0;

            const schedules = (plain.schedules || []).filter(s => {
                if (s.status !== 2) return false;

                if (
                    plain.document_type === 'AJC' &&
                    plain.paid_by_status !== 2
                ) {
                    return s.depreciation_per !== 0;
                }

                return true;
            });

            schedules.forEach((schedule) => {
                if (schedule.repairtype == 2) {
                    return; // continue
                }

                const labourQuantity = schedule.quantity || 0;
                const labourRate = schedule.amount || 0;
                const labourMargin = schedule.additionalMargin || 0;
                const labourDiscountPercent = schedule.discount_percentage || 0;
                let labourDepreciation = schedule.depreciation_per;

                let laboAmount = labourRate + labourMargin;
                let labourDiscount = (laboAmount * labourDiscountPercent) / 100;
                let labourAmountAfterDis = laboAmount - labourDiscount;

                if (
                    plain.document_type === 'AJC' &&
                    plain.paid_by_status !== 2
                ) {
                    if (!labourDepreciation) {
                        labourDepreciation = 100;
                    }

                    laboAmount = (laboAmount / 100) * labourDepreciation;
                    labourAmountAfterDis = (labourAmountAfterDis / 100) * labourDepreciation;
                    labourDiscount = (labourDiscount / 100) * labourDepreciation;
                }

                labourQuantitys += labourQuantity;
                labourAmountAfterDiscounts += labourAmountAfterDis;
            });
            // OSL Schedule Calculation
            let oslLabourQuantitys = 0;
            let oslLabourAmountAfterDiscounts = 0;

            const oslSchedules = plain.oslSchedules || [];

            oslSchedules.forEach((osl) => {
                const oslLabourQuantity = osl.quantity || 0;
                const oslLabourRate = osl.amount || 0;
                const oslDiscountPercent = osl.discount_percentage || 0;
                const supplierMargin = osl.marginPercentage || 0;
                const additionalMargin = osl.additionalMargin || 0;

                const oslLaboAmount = oslLabourQuantity * oslLabourRate;

                const dec = supplierMargin / 100;
                let baseAmount = oslLaboAmount;

                if (dec < 1) {
                    baseAmount = (oslLaboAmount / (1 - dec)) + additionalMargin;
                }
                const oslDiscount = (baseAmount * oslDiscountPercent) / 100;
                let oslLabourAmountAfterDiscount = baseAmount - oslDiscount;

                let oslLabourDepreciation = osl.depreciation_per;

                if (plain.document_type === 'AJC') {
                    if (oslLabourDepreciation === null || oslLabourDepreciation === undefined) {
                        oslLabourDepreciation = 100;
                    }

                    oslLabourAmountAfterDiscount =
                        (oslLabourAmountAfterDiscount / 100) * oslLabourDepreciation;
                }

                oslLabourQuantitys += oslLabourQuantity;
                oslLabourAmountAfterDiscounts += oslLabourAmountAfterDiscount;
            });
            const cusAmount = labourAmountAfterDiscounts + oslLabourAmountAfterDiscounts;
            const consumablePrice = cusAmount * 0.06;

            if (consumablePrice > 0) {

                const transaction_id = plain.id;
                const partsIndentExists = await PartsIndent.findOne({
                    where: {
                        transaction_id: transaction_id,
                        item_id: 639827
                    }
                });
                console.log('partsIndentExists', partsIndentExists);

                if (partsIndentExists) {
                    await JobCard.update(
                        { status: 3 },
                        { where: { id: transaction_id } }
                    );
                    const partIssue = await PartsIssue.findOne({
                        where: {
                            transaction_id: transaction_id,
                            item_id: 639827
                        }
                    });

                    if (partIssue) {
                        await PartsIssue.update(
                            {
                                rate: consumablePrice,
                                cost: consumablePrice,
                                mrp: consumablePrice,
                                discount: 0
                            },
                            { where: { id: partIssue.id } }
                        );
                    }
                } else {
                    const newPartsIndent = await PartsIndent.create({
                        transaction_id: transaction_id,
                        item_code: 'Consumables',
                        item_id: 639827,
                        item_name: 'Consumables',
                        request_quantity: 1,
                        received_quantity: 1,
                        amount: consumablePrice,
                        status: 2,
                        created_by: user.id,
                    });

                    if (newPartsIndent) {
                        const outletUser = await Outlets.findOne({
                            where: { id: user.outlet.id },
                            attributes: ['state']
                        });
                        const vehicle = await Vehicle.findOne({
                            where: { id: plain.vehicle_id },
                            include: [
                                {
                                    model: Customer,
                                    as: 'customer',
                                    attributes: ['state', 'id']
                                }
                            ]
                        });
                        const partsIndentWithItem = await PartsIndent.findByPk(newPartsIndent.id, {
                            include: [{ model: Items, as: 'items' }]
                        });
                        const item = partsIndentWithItem?.items;
                        console.log('Item details for tax rates', item);
                        const baseAmount = consumablePrice;
                        let cgstAmount = 0;
                        let sgstAmount = 0;
                        let igstAmount = 0;

                        const consumePrices = {
                            outlet_id: user.outlet.id,
                            transaction_id: transaction_id,
                            // consumable_price: consumablePrice,
                            indent_id: newPartsIndent.id,
                            stock_indent_id: null,
                            item_id: item?.id || null,
                            item_code: item?.itemCode || null,
                            item_name: 'Consumables',
                            quantity: 1,
                            rate: baseAmount,
                            cost: baseAmount,
                            mrp: baseAmount,
                            total: baseAmount,
                            repair_type: 1,
                            createdBy: user.id,

                        };

                        if (outletUser && vehicle?.customer) {
                            const taxPercent = Number(item?.taxPercentage || 0);

                            if (outletUser.state === vehicle.customer.state) {
                                cgstAmount = (baseAmount * (taxPercent / 2)) / 100;
                                sgstAmount = (baseAmount * (taxPercent / 2)) / 100;

                                consumePrices.cgst = taxPercent / 2;
                                consumePrices.sgst = taxPercent / 2;
                                consumePrices.igst = 0;

                                console.log('Applied CGST & SGST', {
                                    cgst: consumePrices.cgst,
                                    sgst: consumePrices.sgst
                                });

                            } else {
                                igstAmount = (baseAmount * taxPercent) / 100;
                                consumePrices.cgst = 0;
                                consumePrices.sgst = 0;
                                consumePrices.igst = taxPercent;

                                console.log('Applied IGST', {
                                    igst: consumePrices.igst
                                });
                            }
                            const totalTax = cgstAmount + sgstAmount + igstAmount;
                            consumePrices.total = baseAmount + totalTax;

                        }

                        await PartsIssue.create(consumePrices);

                    }
                }

            }
        }

        return { data: plain };

    } catch (err) {
        logger.error("Job Card dao view details err:", err);
        console.log(err);
    }
};


const getJobCardViewByIdAdmin = async (JcId, user) => {
    try {
        const searchCondition = {
            id: JcId
        };

        const userCondition = {
            outlet_id: user.outlet.id
        };

        const rows = await JobCard.findOne({
            where: { ...searchCondition, ...userCondition },
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                {
                    model: PartsIssue, as: "partsIssue", where: {
                        quantity: {
                            [Op.gt]: 0
                        }
                    },
                    required: false,
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: Customer, as: 'jcCustomerMapping',
                    attributes: ['state', "is_b2b"]

                },

            ],
            attributes: [
                'id', 'customer_name', 'vehicle_id', 'reg_no', 'job_card_no', 'odometer', 'status', 'status_value',
                'source', 'source_type', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'created_by', 'updated_by', 'updatedAt',
                "nextDueDateFC", "jobType", "document_type",

                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('transactions.createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        const plain = rows ? rows.get({ plain: true }) : null;
        return { data: plain };

    } catch (err) {
        logger.error("Job Card dao getJobCardViewByIdAdmin err:", err);
        console.log(err);
    }
};

const listJobCards = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const dashboardStatusCode = {
            initiated: 1,
            'in progress': 2,
            'ready for billing': 3,
            billing: 4,
            delivered: 5,
            cancelled: 6,
        }[String(searchKey || '').trim().toLowerCase()];
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } },
                ...(dashboardStatusCode ? [{ status: dashboardStatusCode }] : []),
            ]
        } : {};
        const userCondition = {
            created_by: user.id,
            outlet_id: user.outlet.id,
            status: { [Op.in]: [1, 2, 3, 4, 5, 6] },
        };
        const dashboardStatusCounts = await JobCard.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            where: {
                created_by: user.id,
                outlet_id: user.outlet.id,
            },
            group: ['status'],
            raw: true,
        });
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                        {
                            model: vehicleContract, as: 'vehicleContracts',
                            include: [
                                { model: Scheme, as: 'scheme', attributes: ['repair_type_id'] },
                                { model: vehicleContractScheme, as: 'vehicleContractSchemes', attributes: ['labor_parts_id', 'scheme_labor_parts_code', 'balance_count', 'item_type'] }
                            ],
                            attributes: ['vehicle_number'],
                            required: false,
                            where: {
                                end_date: {
                                    [Op.gt]: new Date() // current date
                                }
                            }
                        }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                }
            ],
            attributes: [
                'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt',
                "health_report_link", "inspectionStatus", "initialInspectionStatus", "customerApprove", "jobType", "per_day_km", "stageNorms", "axle", "application", "engineOilCapacity", "nextDueDateFC",
                "insuranceName", "insuranceExpDate",
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        return {
            totalItems: count,
            data: rows,
            dashboardStatusCounts,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCards", err);
        console.log(err);
    }
};

const listJobCardsData = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};

        let outletCondition = {};
        if (user.reportAccess === 1) {
            outletCondition = {
                outlet_id: {
                    [Op.in]: literal(
                        `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                    ),
                },
            };
        } else {
            outletCondition = {
                outlet_id: user.outlet.id,
            };
        }
        const userCondition = {
            ...outletCondition,
            status:
            {
                [Op.in]: [3]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                        {
                            model: vehicleContract, as: 'vehicleContracts',
                            include: [
                                { model: Scheme, as: 'scheme', attributes: ['repair_type_id'] },
                                { model: vehicleContractScheme, as: 'vehicleContractSchemes', attributes: ['labor_parts_id', 'scheme_labor_parts_code', 'balance_count', 'item_type'] }
                            ],
                            attributes: ['vehicle_number'],
                            required: false,
                            where: {
                                end_date: {
                                    [Op.gt]: new Date() // current date
                                }
                            }
                        }
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                }
            ],
            attributes: [
                'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt',
                "health_report_link", "inspectionStatus", "initialInspectionStatus", "customerApprove", "jobType", "per_day_km", "stageNorms", "axle", "application", "engineOilCapacity", "nextDueDateFC",
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("list credit approval api", err);
        console.log(err);
    }
};


const listBillJobCards = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        const userCondition = {
            created_by: user.id, outlet_id: user.outlet.id, status:
            {
                [Op.in]: [3]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Billings,
                    as: 'billing',
                    attributes: ['bill_type']
                },
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: Customer,
                    as: "jcCustomerMapping",
                    attributes: [
                        "id",
                        "customerCode",
                        "oracleCustomerCode",
                        "siteNumber"
                    ],
                    required: false
                },
                {
                    model: Outlets,
                    as: "outlet",
                    attributes: [
                        "id",
                        "companyId"
                    ],
                    required: false
                },

            ],
            attributes: [
                'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt',
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCards", err);
        console.log(err);
    }
};

const getJcDetails = async (id) => {
    console.log("id in dao", id);
    try {
        const JCdetails = await JobCard.findOne({
            where: { id: id },
            attributes: {
                include: [[
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customer_name), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedCustomerName'
                ], [
                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customer_mobileNumber), '${encryptConfig.code}') AS CHAR)`),
                    'decryptedMobileNumber'
                ]
                ]
            }
        });
        return JCdetails;
    } catch (err) {
        logger.error("Job Card dao getJcDetails", err);
        console.log(err);
    }
};

const getGroupByDate = (option) => {
    return option === 'yearly'
        ? [sequelize.fn('MONTH', sequelize.col('billing.billed_date'))]
        : [sequelize.fn('DATE', sequelize.col('billing.billed_date'))];
};


const dashboard = async (user) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const startDate = new Date(year, month, 1);
        const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')} 00:00:00`;

        const endDate = new Date(year, month + 1, 0);
        const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')} 23:59:59`;

        const lmStartDate = new Date(year, month - 1, 1);
        const formattedLmStartDate = `${lmStartDate.getFullYear()}-${(lmStartDate.getMonth() + 1).toString().padStart(2, '0')}-${lmStartDate.getDate().toString().padStart(2, '0')} 00:00:00`;

        const lmEndDate = new Date(year, month, 0);
        const formattedLmEndDate = `${lmEndDate.getFullYear()}-${(lmEndDate.getMonth() + 1).toString().padStart(2, '0')}-${lmEndDate.getDate().toString().padStart(2, '0')} 23:59:59`;
        const userCondition = {
            status: { [Op.in]: [1, 2] },
            outlet_id: user.outlet.id
        };
        const userConditionWithoutStatus = {
            outlet_id: user.outlet.id
        };

        const monthlyTargetCondition = {
            outlet_id: user.outlet.id,
            user_id: user.id
        };

        const searchCondition = {
            createdAt: {
                [Op.between]: [formattedStartDate, formattedEndDate]
            }
        };

        const receiptCondition = {
            createdAt: {
                [Op.between]: [formattedStartDate, formattedEndDate]
            },
            outlet_id: user.outlet.id
        };



        const billSearchCondition = {
            delivery_date: {
                [Op.between]: [formattedStartDate, formattedEndDate]
            },
            outlet_id: user.outlet.id
        };

        const count = await JobCard.count({
            where: { ...userCondition }
        });
        const rowsWithoutStatus = await JobCard.findAll({
            where: { ...userCondition, ...searchCondition }
        });

        const monthlyTargetData = await MonthlyTarget.findOne({
            where: { ...monthlyTargetCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...userCondition },
            include: [
                {
                    model: Schedules, as: "schedules",
                    include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                {
                    model: OslSchedules, as: "oslSchedules",
                    include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                {
                    model: PartsIssue, as: "partsIssue",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
            ]
        });

        const billData = await Billings.findAll({
            where: { ...billSearchCondition },
            include: [
                {
                    model: JobCard, as: 'jobcard',
                    include: [
                        {
                            model: CreditNotes, as: 'creditNotes',
                            include: [
                                { model: creditNoteDetails, as: 'creditNotesDetails' }
                            ]
                        }
                    ]
                }
            ]
        });

        const billDataLM = await Billings.findAll({
            where: {
                delivery_date: {
                    [Op.between]: [formattedLmStartDate, formattedLmEndDate]
                }
            },
            include: [
                {
                    model: JobCard, as: 'jobcard',
                    include: [
                        { model: CreditNotes, as: 'creditNotes' }
                    ]
                }
            ]
        });

        const receiptData = await Receipt.findAll({
            where: { ...receiptCondition }
        });

        return { count, rows, billData, rowsWithoutStatus, billDataLM, monthlyTargetData, receiptData };
    } catch (err) {
        logger.error('Job Card dao dashboard', err);
    };
}

// const dashboardEpro = async (body,user) => {  
//     try {

// // assume from body we get type
// body.type = 'RJC'; // Default to 'RJC' if not provided
// body.option = "monthly" || "yearly"; // Default to 'monthly' if not provided

//         const userCondition = {
//              status: { [Op.in]: [ 4] },
//              document_type : body.type,
//              outlet_id: user.outlet.id
//         };

//         const count = await JobCard.findAll({
//             where: { ...userCondition },
//             include: [
//                 {
//                     model: Billings, as: 'billing',
//                     include: [
//                         { model: CreditNotes, as: 'creditNotes' }
//                     ]
//                 }
//             ]
//         }); 


//         return { count };
//     } catch (err) {
//         logger.error('Job Card dao dashboard', err);
//     };
// }


// const dashboardEpro = async (body, user) => { 
//     // epro function
//     try {
//         const type = body.type || 'RJC';
//         const option = body.option || 'monthly';
//         let formattedStartDate = '';
//         let formattedEndDate = '';

//         if (option !== 'monthly' && option !== 'yearly') {
//             throw new Error('Invalid option. Must be either "monthly" or "yearly".');
//         }
//         const currentDate = new Date();
//         const year = currentDate.getFullYear();
//         const month = currentDate.getMonth();

//         if (option === 'monthly') {
//             const startDate = new Date(year, month, 1);
//             formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')} 00:00:00`;
//             const endDate = new Date(year, month + 1, 0);
//             formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')} 23:59:59`;

//         } else if (option === 'yearly') {
//             let fyStartYear;
//             let fyEndYear;
//             if (month >= 3) {
//                 fyStartYear = year;
//                 fyEndYear = year + 1;
//             } else {
//                 fyStartYear = year - 1;
//                 fyEndYear = year;
//             }
//             formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
//             formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
//         }

//         const query = `  WITH billing_cte AS (
//   SELECT
//     b.id,
//     b.transaction_id,
//     b.createdAt,
//     COALESCE(b.total_amount,0) AS total_amount
//   FROM billings b
//   JOIN transactions t ON b.transaction_id = t.id
//   WHERE
//     t.document_type = :type
//     AND b.outlet_id = :outletId
//     AND b.createdAt BETWEEN :startDate AND :endDate
// ),

// cn_cte AS (
//   SELECT
//     transaction_id,
//     SUM(amount) AS cn_amount
//   FROM credit_debit_notes
//   WHERE purpose = 'SaleReturn'
//   GROUP BY transaction_id
// )

// SELECT
//   CASE 
//     WHEN :option = 'monthly' THEN DAY(b.createdAt)
//     ELSE LOWER(LEFT(MONTHNAME(b.createdAt),3))
//   END AS period,

//   ROUND(
//     SUM(b.total_amount) - SUM(COALESCE(c.cn_amount,0))
//     /
//     NULLIF(COUNT(DISTINCT b.id),0)
//   ,0) AS amount

// FROM billing_cte b
// LEFT JOIN cn_cte c ON c.transaction_id = b.transaction_id

// GROUP BY period
// ORDER BY period;

// `;


//         const rows = await sequelize.query(query, {
//             replacements: {
//                 type: type,
//                 option: option,
//                 outletId: user.outlet.id,
//                 startDate: formattedStartDate,
//                 endDate: formattedEndDate
//             },
//             type: db.Sequelize.QueryTypes.SELECT
//         });


//         console.log('dashboardEpro rows:', rows);

//         return rows;
//     } catch (err) {
//         logger.error('dashboardEpro error', err);
//         throw err;
//     }
// };


const dashboardRevenue = async (body, user) => {
    try {



        const query = `  SELECT * FROM billings WHERE outlet_id = :outletId
`;


        const rows = await sequelize.query(query, {
            replacements: {

                outletId: user.outlet.id,

            },
            type: db.Sequelize.QueryTypes.SELECT
        });


        // console.log('dashboardRevenue rows:', rows);

        return rows;
    } catch (err) {
        logger.error('dashboardRevenue error', err);
        throw err;
    }
};


const getExternalDashBoardLabourParts = async (reqData) => {
  try {
    console.log("getOldDmsDashboardV2LabourParts called with :", reqData);
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/OldDmsDashBoardV2/getOldDmsDashboardV2LabourParts`,reqData,
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data; 
  } catch (err) {
    console.log(err);
    logger.error("External Vehicle History API Error", err);
    return null;
  }
};


// const dashboardLabourParts = async (body, user) => {
//     try {
//         const option = body.option || 'monthly';
//         body.outletCode = user.outlet.outletCode;

//         if (!['monthly', 'yearly'].includes(option)) {
//             throw new Error('Invalid option. Must be either "monthly" or "yearly".');
//         }

//         const now = new Date();
//         const year = now.getFullYear();
//         const month = now.getMonth(); // 0 = Jan, 3 = Apr

//         let formattedStartDate = '';
//         let formattedEndDate = '';
//         let periodSelect = '';
//         let groupBy = '';
//         let orderBy = '';

//         /* ---------------- MONTHLY ---------------- */
//         if (option === 'monthly') {
//             const startDate = new Date(year, month, 1);
//             const endDate = new Date(year, month + 1, 0);

//             formattedStartDate =
//                 `${year}-${String(month + 1).padStart(2, '0')}-01 00:00:00`;
//             formattedEndDate =
//                 `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59`;

//             //   periodSelect = `DATE(b.createdAt)`;
//             //   groupBy = `DATE(b.createdAt)`;
//             //   orderBy = `DATE(b.createdAt)`;

//             periodSelect = `
  
//       DAY(b.createdAt)
    
// `;

//             groupBy = `DAY(b.createdAt)`;

//             orderBy = `DAY(b.createdAt)`;


//         }

//         /* ---------------- YEARLY (FINANCIAL YEAR) ---------------- */
//         if (option === 'yearly') {
//             let fyStartYear;
//             let fyEndYear;

//             if (month >= 3) {
//                 // Apr–Dec → FY starts this year
//                 fyStartYear = year;
//                 fyEndYear = year + 1;
//             } else {
//                 // Jan–Mar → FY started last year
//                 fyStartYear = year - 1;
//                 fyEndYear = year;
//             }

//             formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
//             formattedEndDate = `${fyEndYear}-03-31 23:59:59`;

//             periodSelect = `MONTH(b.createdAt)`;
//             groupBy = `MONTH(b.createdAt)`;
//             orderBy = `
//         CASE 
//           WHEN MONTH(b.createdAt) >= 4 THEN MONTH(b.createdAt)
//           ELSE MONTH(b.createdAt) + 12
//         END
//       `;
//         }


//         const query = `
//       SELECT
//           ${periodSelect} AS period,
//           b.*
//       FROM billings b
//       WHERE
//           b.outlet_id = :outletId
//           AND b.createdAt BETWEEN :startDate AND :endDate
//       GROUP BY ${groupBy}, b.id
//       ORDER BY ${orderBy};
//     `;

//         const rows = await sequelize.query(query, {
//             replacements: {
//                 outletId: user.outlet.id,
//                 startDate: formattedStartDate,
//                 endDate: formattedEndDate,
//             },
//             type: db.Sequelize.QueryTypes.SELECT,
//         });
//  const oldDmsRow = await getExternalDashBoardLabourParts(body);
// //    console.log('old dms records-------',oldDmsRow);
 
//         //  console.log('dashboard labour rows:', rows);
//  const normalizeOldDmsBilling = (row) => ({
//   period: Number(row.period || 0),

//   // old id keep separate to avoid conflict with new id
//   id: `old_${row.id}`,
//   outlet_id: null,
//   branch_id: row.branch_id,
//   transaction_id: row.transaction_id,
//   jobcard_no: row.job_card_no,
//   bill_no: row.bill_no,
//   bill_type: row.bill_type,
//   labor_amount: Number(row.labour_amount || 0),
//   labor_taxamount: 0,
//   osl_labor_amount: Number(row.osl_amount || 0),
//   osllabor_taxamount: 0,
//   parts_amount: Number(row.parts_amount || 0),
//   parts_taxamount: 0,
//   total_amount:
//     Number(row.labour_amount || 0) +
//     Number(row.parts_amount || 0) +
//     Number(row.osl_amount || 0),
//   foc_labor_amount: 0,
//   foc_parts_amount: 0,
//   foc_parts_bill_no: row.foc_parts_bill_no,
//   foc_labor_bill_no: row.foc_labor_bill_no,
//   delivery_number: row.delivery_no,
//   delivery_date: row.delivery_date,
//   created_by: null,
//   updated_by: null,
//   createdAt: row.created,
//   updatedAt: null,
//   source: 'old_dms',
// });

// const normalizedOldRows = Array.isArray(oldDmsRow)
//   ? oldDmsRow.map(normalizeOldDmsBilling)
//   : [];

// const normalizedNewRows = Array.isArray(rows)
//   ? rows.map((row) => ({
//       ...row,
//       period: Number(row.period || 0),
//       labor_amount: Number(row.labor_amount || 0),
//       osl_labor_amount: Number(row.osl_labor_amount || 0),
//       parts_amount: Number(row.parts_amount || 0),
//       total_amount: Number(row.total_amount || 0),
//       source: 'new_dms',
//     }))
//   : [];

// const finalRows = [
//   ...normalizedNewRows,
//   ...normalizedOldRows,
// ];

// // console.log('final merged labour rows:', finalRows);

// return finalRows;

// //         return rows;

//     } catch (err) {
//         logger.error('dashboardAjcRjc error', err);
//         throw err;
//     }
// };


const dashboardLabourParts = async (body, user) => {
    try {
        const option = body.option || 'monthly';

        body.outletCode = user.outlet.outletCode;

        const validOptions = [
            'monthly',
            'q1',
            'q2',
            'q3',
            'q4',
            'halfyearly',
            'yearly',
            'preyear',
        ];

        if (!validOptions.includes(option.toLowerCase())) {
            throw new Error(
                `Invalid option. Must be one of: ${validOptions.join(', ')}`
            );
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        let fyStartYear;
        let fyEndYear;

        // Financial Year => Apr to Mar
        if (currentMonth >= 4) {
            fyStartYear = currentYear;
            fyEndYear = currentYear + 1;
        } else {
            fyStartYear = currentYear - 1;
            fyEndYear = currentYear;
        }

        let formattedStartDate = '';
        let formattedEndDate = '';
        let periodSelect = '';
        let groupBy = '';
        let orderBy = '';

        /* ---------------- MONTHLY ---------------- */
        if (option === 'monthly') {
            const endDate = new Date(currentYear, currentMonth, 0);

            formattedStartDate =
                `${currentYear}-${String(currentMonth).padStart(2, '0')}-01 00:00:00`;

            formattedEndDate =
                `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59`;

            periodSelect = `DAY(b.createdAt)`;
            groupBy = `DAY(b.createdAt)`;
            orderBy = `DAY(b.createdAt)`;
        }

        /* ---------------- Q1 => Apr-Jun ---------------- */
        if (option === 'q1') {
            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
            formattedEndDate = `${fyStartYear}-06-30 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;
            orderBy = `MONTH(b.createdAt)`;
        }

        /* ---------------- Q2 => Jul-Sep ---------------- */
        if (option === 'q2') {
            formattedStartDate = `${fyStartYear}-07-01 00:00:00`;
            formattedEndDate = `${fyStartYear}-09-30 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;
            orderBy = `MONTH(b.createdAt)`;
        }

        /* ---------------- Q3 => Oct-Dec ---------------- */
        if (option === 'q3') {
            formattedStartDate = `${fyStartYear}-10-01 00:00:00`;
            formattedEndDate = `${fyStartYear}-12-31 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;
            orderBy = `MONTH(b.createdAt)`;
        }

        /* ---------------- Q4 => Jan-Mar ---------------- */
        if (option === 'q4') {
            formattedStartDate = `${fyEndYear}-01-01 00:00:00`;
            formattedEndDate = `${fyEndYear}-03-31 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;
            orderBy = `MONTH(b.createdAt)`;
        }

        /* ---------------- HALF YEARLY => Apr-Sep ---------------- */
        if (option === 'halfyearly') {
            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
            formattedEndDate = `${fyStartYear}-09-30 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;

            orderBy = `
                CASE 
                    WHEN MONTH(b.createdAt) >= 4 THEN MONTH(b.createdAt)
                    ELSE MONTH(b.createdAt) + 12
                END
            `;
        }

        /* ---------------- YEARLY => Full FY ---------------- */
        if (option === 'yearly') {
            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
            formattedEndDate = `${fyEndYear}-03-31 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;

            orderBy = `
                CASE 
                    WHEN MONTH(b.createdAt) >= 4 THEN MONTH(b.createdAt)
                    ELSE MONTH(b.createdAt) + 12
                END
            `;
        }

        /* ---------------- PREVIOUS YEAR ---------------- */
        if (option === 'preyear') {
            formattedStartDate = `${fyStartYear - 1}-04-01 00:00:00`;
            formattedEndDate = `${fyEndYear - 1}-03-31 23:59:59`;

            periodSelect = `MONTH(b.createdAt)`;
            groupBy = `MONTH(b.createdAt)`;

            orderBy = `
                CASE 
                    WHEN MONTH(b.createdAt) >= 4 THEN MONTH(b.createdAt)
                    ELSE MONTH(b.createdAt) + 12
                END
            `;
        }

        const query = `
            SELECT
                ${periodSelect} AS period,
                b.*
            FROM billings b
            WHERE
                b.outlet_id = :outletId
                AND b.createdAt BETWEEN :startDate AND :endDate
            GROUP BY ${groupBy}, b.id
            ORDER BY ${orderBy};
        `;

        const rows = await sequelize.query(query, {
            replacements: {
                outletId: user.outlet.id,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
            },
            type: db.Sequelize.QueryTypes.SELECT,
        });

        const oldDmsRow = await getExternalDashBoardLabourParts(body);

        /* ---------------- NORMALIZE OLD DMS ---------------- */
        const normalizeOldDmsBilling = (row) => ({
            period: Number(row.period || 0),

            id: `old_${row.id}`,

            outlet_id: null,
            branch_id: row.branch_id,
            transaction_id: row.transaction_id,

            jobcard_no: row.job_card_no,
            bill_no: row.bill_no,
            bill_type: row.bill_type,

            labor_amount: Number(row.labour_amount || 0),
            labor_taxamount: 0,

            osl_labor_amount: Number(row.osl_amount || 0),
            osllabor_taxamount: 0,

            parts_amount: Number(row.parts_amount || 0),
            parts_taxamount: 0,

            total_amount:
                Number(row.labour_amount || 0) +
                Number(row.parts_amount || 0) +
                Number(row.osl_amount || 0),

            foc_labor_amount: 0,
            foc_parts_amount: 0,

            foc_parts_bill_no: row.foc_parts_bill_no,
            foc_labor_bill_no: row.foc_labor_bill_no,

            delivery_number: row.delivery_no,
            delivery_date: row.delivery_date,

            created_by: null,
            updated_by: null,

            createdAt: row.created,
            updatedAt: null,

            source: 'old_dms',
        });

        const normalizedOldRows = Array.isArray(oldDmsRow)
            ? oldDmsRow.map(normalizeOldDmsBilling)
            : [];

        /* ---------------- NORMALIZE NEW DMS ---------------- */
        const normalizedNewRows = Array.isArray(rows)
            ? rows.map((row) => ({
                  ...row,

                  period: Number(row.period || 0),

                  labor_amount: Number(row.labor_amount || 0),
                  osl_labor_amount: Number(row.osl_labor_amount || 0),
                  parts_amount: Number(row.parts_amount || 0),
                  total_amount: Number(row.total_amount || 0),

                  source: 'new_dms',
              }))
            : [];

        /* ---------------- MERGE ---------------- */
        const finalRows = [
            ...normalizedNewRows,
            ...normalizedOldRows,
        ];

        console.log('final merged labour rows:', finalRows);

        return finalRows;
        // return {
        //     option,
        //     startDate: formattedStartDate,
        //     endDate: formattedEndDate,
        //     totalRecords: finalRows.length,
        //     data: finalRows,
        // };

    } catch (err) {
        logger.error('dashboardLabourParts error', err);
        throw err;
    }
};
// const dashboardAjcRjc = async (body, user) => {
//     try {
//         const option = body.option || 'monthly';
//         let formattedStartDate = '';
//         let formattedEndDate = '';

//         if (option !== 'monthly' && option !== 'yearly') {
//             throw new Error('Invalid option. Must be either "monthly" or "yearly".');
//         }
//         const currentDate = new Date();
//         const year = currentDate.getFullYear();
//         const month = currentDate.getMonth();

//         if (option === 'monthly') {
//             const startDate = new Date(year, month, 1);
//             formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')} 00:00:00`;
//             const endDate = new Date(year, month + 1, 0);
//             formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')} 23:59:59`;

//         } else if (option === 'yearly') {
//             let fyStartYear;
//             let fyEndYear;
//             if (month >= 3) {
//                 fyStartYear = year;
//                 fyEndYear = year + 1;
//             } else {
//                 fyStartYear = year - 1;
//                 fyEndYear = year;
//             }
//             formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
//             formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
//         }

//         const query = `SELECT CASE 
//     WHEN :option = 'monthly' THEN 
//       DAY(b.createdAt)
//     ELSE 
//       LOWER(LEFT(MONTHNAME(b.createdAt), 3))
//   END AS period,

//   -- MECH (RJC)
//   ROUND(
//     SUM(
//       CASE 
//         WHEN t.document_type = 'RJC' 
//         THEN COALESCE(b.labor_amount, 0)
//            + COALESCE(b.parts_amount, 0)
//            + COALESCE(b.osl_labor_amount, 0)
//         ELSE 0
//       END
//     ),
//     0
//   ) AS mech,

//   -- BODY (AJC)
//   ROUND(
//     SUM(
//       CASE 
//         WHEN t.document_type = 'AJC' 
//         THEN COALESCE(b.labor_amount, 0)
//            + COALESCE(b.parts_amount, 0)
//            + COALESCE(b.osl_labor_amount, 0)
//         ELSE 0
//       END
//     ),
//     0
//   ) AS body

// FROM billings b
// LEFT JOIN transactions t ON b.transaction_id = t.id

// WHERE
//   b.outlet_id = :outletId
//   AND b.createdAt BETWEEN :startDate AND :endDate

// GROUP BY
//   CASE 
//     WHEN :option = 'monthly' THEN 
//       DAY(b.createdAt)
//     ELSE LOWER(LEFT(MONTHNAME(b.createdAt), 3))
//   END
// `;


//         const [rows, externalRows] = await Promise.all([
//             sequelize.query(query, {
//                 replacements: {
//                     option: option,
//                     outletId: user.outlet.id,
//                     startDate: formattedStartDate,
//                     endDate: formattedEndDate
//                 },
//                 type: db.Sequelize.QueryTypes.SELECT
//             }),

//             getExternalDashboardAjcRjc(body, user)
//         ]);

//         const primaryData = (rows || []).map(row => ({
//             ...row,
//             type: "primary"
//         }));

//         const externalData = (externalRows || []).map(row => ({
//             ...row,
//             type: "external"
//         }));

//         const map = new Map();

//         // [...primaryData, ...externalData].forEach(item => {
//         //     const key = String(item.period);
//         //     if (!map.has(key)) {
//         //         map.set(key, item);
//         //     }
//         // });

//         [...primaryData, ...externalData].forEach(item => {
//             const key = String(item.period);
//             const existing = map.get(key);
//             if (existing) {
//                 existing.mech = Number(existing.mech || 0) + Number(item.mech || 0);
//                 existing.body = Number(existing.body || 0) + Number(item.body || 0);
//             } else {
//                 map.set(key, { ...item });
//             }
//         });

//         const mergedRows = Array.from(map.values());

//         // console.log('dashboardMechbody rows:', mergedRows);

//         return mergedRows;
//     } catch (err) {
//         logger.error('dashboardMechbody error', err);
//         throw err;
//     }
// };

const dashboardAjcRjc = async (body, user) => {
    try {
        const option = String(
            body.option || 'monthly'
        ).toLowerCase();

        let formattedStartDate = '';
        let formattedEndDate = '';

        const validOptions = [
            'monthly',
            'q1',
            'q2',
            'q3',
            'q4',
            'offyearly',
            'halfyearly',
            'yearly',
            'preyear'
        ];

        if (!validOptions.includes(option)) {
            throw new Error(
                'Invalid option. Must be monthly/q1/q2/q3/q4/offyearly/yearly/preyear'
            );
        }

        const currentDate = new Date();

        const year = currentDate.getFullYear();

        const month = currentDate.getMonth();

        // Financial Year
        const fyStartYear =
            month >= 3 ? year : year - 1;

        const fyEndYear = fyStartYear + 1;

        /* ---------------- MONTHLY ---------------- */

        if (option === 'monthly') {

            const startDate = new Date(
                year,
                month,
                1
            );

            const endDate = new Date(
                year,
                month + 1,
                0
            );

            formattedStartDate = `${startDate.getFullYear()}-${(
                startDate.getMonth() + 1
            )
                .toString()
                .padStart(2, '0')}-${startDate
                .getDate()
                .toString()
                .padStart(2, '0')} 00:00:00`;

            formattedEndDate = `${endDate.getFullYear()}-${(
                endDate.getMonth() + 1
            )
                .toString()
                .padStart(2, '0')}-${endDate
                .getDate()
                .toString()
                .padStart(2, '0')} 23:59:59`;
        }

        /* ---------------- Q1 ---------------- */

        else if (option === 'q1') {

            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;

            formattedEndDate = `${fyStartYear}-06-30 23:59:59`;
        }

        /* ---------------- Q2 ---------------- */

        else if (option === 'q2') {

            formattedStartDate = `${fyStartYear}-07-01 00:00:00`;

            formattedEndDate = `${fyStartYear}-09-30 23:59:59`;
        }

        /* ---------------- Q3 ---------------- */

        else if (option === 'q3') {

            formattedStartDate = `${fyStartYear}-10-01 00:00:00`;

            formattedEndDate = `${fyStartYear}-12-31 23:59:59`;
        }

        /* ---------------- Q4 ---------------- */

        else if (option === 'q4') {

            formattedStartDate = `${fyEndYear}-01-01 00:00:00`;

            formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
        }

        /* ---------------- HALF YEARLY ---------------- */

        else if (
            option === 'offyearly' ||
            option === 'halfyearly'
        ) {

            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;

            formattedEndDate = `${fyStartYear}-09-30 23:59:59`;
        }

        /* ---------------- YEARLY ---------------- */

        else if (option === 'yearly') {

            formattedStartDate = `${fyStartYear}-04-01 00:00:00`;

            formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
        }

        /* ---------------- PREVIOUS YEAR ---------------- */

        else if (option === 'preyear') {

            formattedStartDate = `${
                fyStartYear - 1
            }-04-01 00:00:00`;

            formattedEndDate = `${
                fyStartYear
            }-03-31 23:59:59`;
        }

        const query = `
SELECT 
    CASE 
        WHEN :option = 'monthly'
        THEN DAY(b.createdAt)

        ELSE LOWER(LEFT(MONTHNAME(b.createdAt), 3))
    END AS period,

    -- MECH (RJC)
    ROUND(
        SUM(
            CASE 
                WHEN t.document_type = 'RJC'
                THEN COALESCE(b.labor_amount, 0)
                   + COALESCE(b.parts_amount, 0)
                   + COALESCE(b.osl_labor_amount, 0)
                ELSE 0
            END
        ),
        0
    ) AS mech,

    -- BODY (AJC)
    ROUND(
        SUM(
            CASE 
                WHEN t.document_type = 'AJC'
                THEN COALESCE(b.labor_amount, 0)
                   + COALESCE(b.parts_amount, 0)
                   + COALESCE(b.osl_labor_amount, 0)
                ELSE 0
            END
        ),
        0
    ) AS body

FROM billings b

LEFT JOIN transactions t
    ON b.transaction_id = t.id

WHERE
    b.outlet_id = :outletId
    AND b.createdAt BETWEEN :startDate AND :endDate

GROUP BY
    CASE 
        WHEN :option = 'monthly'
        THEN DAY(b.createdAt)

        ELSE LOWER(LEFT(MONTHNAME(b.createdAt), 3))
    END
`;

        const [rows, externalRows] = await Promise.all([

            sequelize.query(query, {
                replacements: {
                    option,
                    outletId: user.outlet.id,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate
                },

                type: db.Sequelize.QueryTypes.SELECT
            }),

            getExternalDashboardAjcRjc(body, user)
        ]);

        const primaryData = (rows || []).map(row => ({
            ...row,
            type: "primary"
        }));

        const externalData = (externalRows || []).map(row => ({
            ...row,
            type: "external"
        }));
// console.log("primary rows:---------", primaryData);
        // console.log("external rows:---------", externalRows);
        const map = new Map();

        [...primaryData, ...externalData].forEach(item => {

            const key = String(item.period).toLowerCase();

            const existing = map.get(key);

            if (existing) {

                existing.mech =
                    Number(existing.mech || 0) +
                    Number(item.mech || 0);

                existing.body =
                    Number(existing.body || 0) +
                    Number(item.body || 0);

            } else {

                map.set(key, {
                    ...item
                });
            }
        });

        const mergedRows = Array.from(map.values());

        // console.log('dashboardAjcRjc rows:---------', mergedRows);

        return mergedRows;

    } catch (err) {

        logger.error(
            'dashboardMechbody error',
            err
        );

        throw err;
    }
};
// const dashboardCustomerFlow = async (body, user) => { 
//     const now = new Date();
//     let startDate, endDate;

//     const year = now.getFullYear();
//     const month = now.getMonth();

//     //   if (body.option === 'daily') {
//     //     startDate = new Date(year, month, now.getDate(), 0, 0, 0);
//     //     endDate   = new Date(year, month, now.getDate(), 23, 59, 59);
//     //   }

//     if (body.option === 'monthly') {
//         startDate = new Date(year, month, 1, 0, 0, 0);
//         endDate = new Date(year, month, now.getDate(), 23, 59, 59);
//     }

//     if (body.option === 'yearly') {
//         if (month >= 3) {
//             startDate = new Date(year, 3, 1);
//             endDate = new Date(year + 1, 2, 31, 23, 59, 59);
//         } else {
//             startDate = new Date(year - 1, 3, 1);
//             endDate = new Date(year, 2, 31, 23, 59, 59);
//         }
//     }

//     const query = `
// SELECT
//   COUNT(
//     CASE
//       WHEN first_tx.first_tx_date BETWEEN :startDate AND :endDate
//       THEN 1
//     END
//   ) AS new_customer_count,

//   COUNT(
//     CASE
//       WHEN first_tx.first_tx_date < :startDate
//        AND tx_in_period.customer_id IS NOT NULL
//       THEN 1
//     END
//   ) AS repeat_customer_count

// FROM (
//   SELECT
//     customer_id,
//     MIN(createdAt) AS first_tx_date
//   FROM transactions
//   WHERE outlet_id = :outletId
//   GROUP BY customer_id
// ) first_tx

// LEFT JOIN (
//   SELECT DISTINCT customer_id
//   FROM transactions
//   WHERE
//     outlet_id = :outletId
//     AND createdAt BETWEEN :startDate AND :endDate
// ) tx_in_period
// ON tx_in_period.customer_id = first_tx.customer_id;

//   `;

//     const [result] = await sequelize.query(query, {
//         replacements: {
//             outletId: user.outlet.id,
//             startDate,
//             endDate
//         },
//         type: sequelize.QueryTypes.SELECT
//     });

//     return result;
// };


// const dashboardVehicleFlow = async (body, user) => {
//   const { option, flow, sourceId } = body;
//   const now = new Date();

//   let startDate, endDate, dateColumn, periodExpr, groupBy, orderBy, flowCondition;

//   const year = now.getFullYear();
//   const month = now.getMonth();

//   // -------- Date range --------
//   if (option === 'daily' || option === 'monthly') {
//     startDate = new Date(year, month, 1, 0, 0, 0);
//     endDate   = new Date(year, month, now.getDate(), 23, 59, 59);

//     dateColumn = 't.createdAt';
//     periodExpr = `
//       CONCAT(
//         DAY(t.createdAt),
//         ' ',
//         LOWER(LEFT(DAYNAME(t.createdAt),3))
//       )`;
//     groupBy = `DAY(t.createdAt), DAYNAME(t.createdAt)`;
//     orderBy = `DAY(t.createdAt)`;
//   }

//   if (option === 'yearly') {
//     startDate = month >= 3
//       ? new Date(year, 3, 1)
//       : new Date(year - 1, 3, 1);

//     endDate = month >= 3
//       ? new Date(year + 1, 2, 31, 23, 59, 59)
//       : new Date(year, 2, 31, 23, 59, 59);

//     dateColumn = 't.createdAt';
//     periodExpr = `MONTH(t.createdAt)`;
//     groupBy = `MONTH(t.createdAt)`;
//     orderBy = `
//       CASE WHEN MONTH(t.createdAt) >= 4
//       THEN MONTH(t.createdAt)
//       ELSE MONTH(t.createdAt)+12 END`;
//   }

//   // -------- Flow condition --------
//   if (flow === 'inflow') {
//     flowCondition = ``;
//   } else {
//     flowCondition = `AND t.status = 5`;
//     dateColumn = 't.updatedAt';
//   }

//   const query = `
//   SELECT
//   ${periodExpr} AS period,

//   SUM(
//     CASE WHEN t.document_type = 'AJC'
//     THEN b.labor_amount + b.osl_labor_amount + b.parts_amount
//     ELSE 0 END
//   ) AS ajc_amount,

//   SUM(
//     CASE WHEN t.document_type = 'RJC'
//     THEN b.labor_amount + b.osl_labor_amount + b.parts_amount
//     ELSE 0 END
//   ) AS rjc_amount

// FROM transactions t
// JOIN billings b
//   ON b.transaction_id = t.id

// WHERE
//   t.outlet_id = :outletId
//   AND t.source = :sourceId
//   ${flowCondition}
//   AND ${dateColumn} BETWEEN :startDate AND :endDate

// GROUP BY ${groupBy}
// ORDER BY ${orderBy};

//   `;

//   return sequelize.query(query, {
//     replacements: {
//       outletId: user.outlet.id,
//       sourceId,
//       startDate,
//       endDate
//     },
//     type: sequelize.QueryTypes.SELECT
//   });
// };



// const dashboardVehicleFlow = async (body, user) => {
//     try {
//         const { option, flow, sourceTypeId } = body;
//         const now = new Date();

//         let startDate, endDate;
//         let dateColumn = 't.createdAt';
//         let periodExpr, orderBy;
//         let flowCondition = ``;
//         let sourceTypeCondition = ``;

//         const year = now.getFullYear();
//         const month = now.getMonth(); // 0-based

//         /* ---------- DATE RANGE ---------- */
//         if (option === 'monthly') {
//             startDate = new Date(year, month, 1, 0, 0, 0);
//             endDate = new Date(year, month, now.getDate(), 23, 59, 59);

//             periodExpr = `
      
//       DAY(t.createdAt)

//     `;

//             orderBy = `CAST(SUBSTRING_INDEX(period, ' ', 1) AS UNSIGNED)`;
//         }

//         if (option === 'yearly') {
//             startDate = month >= 3
//                 ? new Date(year, 3, 1)
//                 : new Date(year - 1, 3, 1);

//             endDate = month >= 3
//                 ? new Date(year + 1, 2, 31, 23, 59, 59)
//                 : new Date(year, 2, 31, 23, 59, 59);

//             periodExpr = `MONTH(${dateColumn})`;

//             orderBy = `
//       CASE
//         WHEN period >= 4 THEN period
//         ELSE period + 12
//       END
//     `;
//         }

//         /* ---------- FLOW CONDITION ---------- */
//         if (flow === 'outflow') {
//             flowCondition = `AND t.status = 5`;
//             dateColumn = 't.updatedAt';
//         }

//         /* ---------- SOURCE TYPE ---------- */
//         if (sourceTypeId) {
//             sourceTypeCondition = `AND t.source_type = :sourceTypeId`;
//         }

//         const query = `
//     SELECT
//       ${periodExpr} AS period,

//       SUM(CASE WHEN t.document_type = 'AJC' THEN 1 ELSE 0 END) AS ajc_count,
//       SUM(CASE WHEN t.document_type = 'RJC' THEN 1 ELSE 0 END) AS rjc_count

//     FROM transactions t
//     WHERE
//       t.outlet_id = :outletId
//       ${sourceTypeCondition}
//       ${flowCondition}
//       AND ${dateColumn} BETWEEN :startDate AND :endDate

//     GROUP BY period
//     ORDER BY ${orderBy};
//   `;

//         const rows = await sequelize.query(query, {
//             replacements: {
//                 outletId: user.outlet.id,
//                 sourceTypeId,
//                 startDate,
//                 endDate
//             },
//             type: sequelize.QueryTypes.SELECT
//         });

//         return rows;
//     } catch (err) {
//         logger.error('dashboardVehicleFlow error', err);
//         console.log("dashboardVehicleFlow error", err);
//     }

// };

const dashboardCustomerFlow = async (body, user) => {
    const option = body.option || 'monthly';

    const validOptions = [
        'monthly',
        'q1',
        'q2',
        'q3',
        'q4',
        'halfyearly',
        'yearly',
        'preyear',
    ];

    if (!validOptions.includes(option)) {
        throw new Error(
            `Invalid option. Must be one of: ${validOptions.join(', ')}`
        );
    }

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    let fyStartYear;
    let fyEndYear;

    // Financial Year => Apr to Mar
    if (currentMonth >= 4) {
        fyStartYear = currentYear;
        fyEndYear = currentYear + 1;
    } else {
        fyStartYear = currentYear - 1;
        fyEndYear = currentYear;
    }

    let startDate;
    let endDate;

    /* =========================================================
        MONTHLY
    ========================================================= */
    if (option === 'monthly') {
        startDate = new Date(
            currentYear,
            currentMonth - 1,
            1,
            0,
            0,
            0
        );

        endDate = new Date(
            currentYear,
            currentMonth - 1,
            now.getDate(),
            23,
            59,
            59
        );
    }

    /* =========================================================
        Q1 => Apr-Jun
    ========================================================= */
    if (option === 'q1') {
        startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
        endDate = new Date(fyStartYear, 5, 30, 23, 59, 59);
    }

    /* =========================================================
        Q2 => Jul-Sep
    ========================================================= */
    if (option === 'q2') {
        startDate = new Date(fyStartYear, 6, 1, 0, 0, 0);
        endDate = new Date(fyStartYear, 8, 30, 23, 59, 59);
    }

    /* =========================================================
        Q3 => Oct-Dec
    ========================================================= */
    if (option === 'q3') {
        startDate = new Date(fyStartYear, 9, 1, 0, 0, 0);
        endDate = new Date(fyStartYear, 11, 31, 23, 59, 59);
    }

    /* =========================================================
        Q4 => Jan-Mar
    ========================================================= */
    if (option === 'q4') {
        startDate = new Date(fyEndYear, 0, 1, 0, 0, 0);
        endDate = new Date(fyEndYear, 2, 31, 23, 59, 59);
    }

    /* =========================================================
        HALF YEARLY => Apr-Sep
    ========================================================= */
    if (option === 'halfyearly') {
        startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
        endDate = new Date(fyStartYear, 8, 30, 23, 59, 59);
    }

    /* =========================================================
        YEARLY => Full FY
    ========================================================= */
    if (option === 'yearly') {
        startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
        endDate = new Date(fyEndYear, 2, 31, 23, 59, 59);
    }

    /* =========================================================
        PREVIOUS YEAR
    ========================================================= */
    if (option === 'preyear') {
        startDate = new Date(fyStartYear - 1, 3, 1, 0, 0, 0);
        endDate = new Date(fyEndYear - 1, 2, 31, 23, 59, 59);
    }

    const query = `
        SELECT
            COUNT(
                CASE
                    WHEN first_tx.first_tx_date BETWEEN :startDate AND :endDate
                    THEN 1
                END
            ) AS new_customer_count,

            COUNT(
                CASE
                    WHEN first_tx.first_tx_date < :startDate
                    AND tx_in_period.customer_id IS NOT NULL
                    THEN 1
                END
            ) AS repeat_customer_count

        FROM (
            SELECT
                customer_id,
                MIN(createdAt) AS first_tx_date

            FROM transactions

            WHERE outlet_id = :outletId

            GROUP BY customer_id
        ) first_tx

        LEFT JOIN (
            SELECT DISTINCT customer_id

            FROM transactions

            WHERE
                outlet_id = :outletId
                AND createdAt BETWEEN :startDate AND :endDate

        ) tx_in_period

        ON tx_in_period.customer_id = first_tx.customer_id;
    `;

    const result = await sequelize.query(query, {
        replacements: {
            outletId: user.outlet.id,
            startDate,
            endDate,
        },
        type: sequelize.QueryTypes.SELECT,
    });

    return result;
    // return {
    //     option,
    //     startDate,
    //     endDate,
    //     new_customer_count: Number(result?.new_customer_count || 0),
    //     repeat_customer_count: Number(result?.repeat_customer_count || 0),
    // };
};

const dashboardVehicleFlow = async (body, user) => {
    try {
        const { option, flow, sourceTypeId } = body;

        const now = new Date();

        let startDate, endDate;
        let dateColumn = 't.createdAt';
        let periodExpr, orderBy;
        let flowCondition = ``;
        let sourceTypeCondition = ``;

        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based

        const fyStartYear = month >= 3 ? year : year - 1;

        const validOptions = [
            'monthly',
            'q1',
            'q2',
            'q3',
            'q4',
            'halfyearly',
            'yearly',
            'preyear'
        ];

        if (!validOptions.includes(option)) {
            throw new Error(
                'Invalid option. Must be monthly, q1, q2, q3, q4, halfyearly, yearly, or preyear.'
            );
        }

        /* ---------- DATE RANGE ---------- */

        if (option === 'monthly') {
            startDate = new Date(year, month, 1, 0, 0, 0);
            endDate = new Date(year, month + 1, 0, 23, 59, 59);

            periodExpr = `DAY(${dateColumn})`;

            orderBy = `CAST(period AS UNSIGNED)`;
        }

        if (option === 'q1') {
            // Apr - Jun
            startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
            endDate = new Date(fyStartYear, 6, 0, 23, 59, 59);
        }

        if (option === 'q2') {
            // Jul - Sep
            startDate = new Date(fyStartYear, 6, 1, 0, 0, 0);
            endDate = new Date(fyStartYear, 9, 0, 23, 59, 59);
        }

        if (option === 'q3') {
            // Oct - Dec
            startDate = new Date(fyStartYear, 9, 1, 0, 0, 0);
            endDate = new Date(fyStartYear, 12, 0, 23, 59, 59);
        }

        if (option === 'q4') {
            // Jan - Mar
            startDate = new Date(fyStartYear + 1, 0, 1, 0, 0, 0);
            endDate = new Date(fyStartYear + 1, 3, 0, 23, 59, 59);
        }

        if (option === 'halfyearly') {
            // Apr - Sep
            startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
            endDate = new Date(fyStartYear, 9, 0, 23, 59, 59);
        }

        if (option === 'yearly') {
            // Current FY
            startDate = new Date(fyStartYear, 3, 1, 0, 0, 0);
            endDate = new Date(fyStartYear + 1, 3, 0, 23, 59, 59);
        }

        if (option === 'preyear') {
            // Previous FY
            startDate = new Date(fyStartYear - 1, 3, 1, 0, 0, 0);
            endDate = new Date(fyStartYear, 3, 0, 23, 59, 59);
        }

        /* ---------- PERIOD GROUPING ---------- */

        if (option === 'monthly') {
            periodExpr = `DAY(${dateColumn})`;

            orderBy = `CAST(period AS UNSIGNED)`;
        } else {
            periodExpr = `
                LOWER(LEFT(MONTHNAME(${dateColumn}), 3))
            `;

            orderBy = `
                CASE period
                    WHEN 'apr' THEN 1
                    WHEN 'may' THEN 2
                    WHEN 'jun' THEN 3
                    WHEN 'jul' THEN 4
                    WHEN 'aug' THEN 5
                    WHEN 'sep' THEN 6
                    WHEN 'oct' THEN 7
                    WHEN 'nov' THEN 8
                    WHEN 'dec' THEN 9
                    WHEN 'jan' THEN 10
                    WHEN 'feb' THEN 11
                    WHEN 'mar' THEN 12
                END
            `;
        }

        /* ---------- FLOW CONDITION ---------- */

        if (flow === 'outflow') {
            flowCondition = `AND t.status = 5`;
            dateColumn = 't.updatedAt';

            // regenerate periodExpr because dateColumn changed
            if (option === 'monthly') {
                periodExpr = `DAY(${dateColumn})`;
            } else {
                periodExpr = `
                    LOWER(LEFT(MONTHNAME(${dateColumn}), 3))
                `;
            }
        }

        /* ---------- SOURCE TYPE ---------- */

        if (sourceTypeId) {
            sourceTypeCondition = `AND t.source_type = :sourceTypeId`;
        }

        const query = `
            SELECT
                ${periodExpr} AS period,

                SUM(CASE WHEN t.document_type = 'AJC' THEN 1 ELSE 0 END) AS ajc_count,

                SUM(CASE WHEN t.document_type = 'RJC' THEN 1 ELSE 0 END) AS rjc_count

            FROM transactions t

            WHERE
                t.outlet_id = :outletId
                ${sourceTypeCondition}
                ${flowCondition}
                AND ${dateColumn} BETWEEN :startDate AND :endDate

            GROUP BY period

            ORDER BY ${orderBy};
        `;

        const rows = await sequelize.query(query, {
            replacements: {
                outletId: user.outlet.id,
                sourceTypeId,
                startDate,
                endDate
            },
            type: sequelize.QueryTypes.SELECT
        });

        console.log('dashboardVehicleFlow rows----------------:', rows);

        return rows;

    } catch (err) {
        logger.error('dashboardVehicleFlow error', err);
        console.log("dashboardVehicleFlow error", err);
        throw err;
    }
};


const dashboardInflow = async (user) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const startDate = new Date(year, month, 1);
        const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')} 00:00:00`;

        const endDate = new Date(year, month + 1, 0);
        const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')} 23:59:59`;

        // console.log('formattedStartDate---------',formattedStartDate);
        // console.log('formattedEndDate----------',formattedEndDate);

        let transactionQuery = `SELECT 
                        DATE(createdAt) AS date,
                        document_type,  
                        COUNT(*) AS value
                    FROM 
                        transactions
                    WHERE
                        (createdAt BETWEEN '${formattedStartDate}' AND '${formattedEndDate}') AND (status = 1 OR status = 2) AND outlet_id = ${user.outlet.id}
                    GROUP BY 
                        date,document_type
                    ORDER BY 
                        date,document_type;`

        const transactionData = await sequelize.query(transactionQuery, { type: Sequelize.QueryTypes.SELECT });

        let billingRJCQuery = `SELECT 
                        DATE(delivery_date) AS date,  
                        COUNT(*) AS value
                    FROM 
                        billings
                    WHERE
                        (delivery_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}') AND (jobcard_no LIKE 'RJC%') AND outlet_id = ${user.outlet.id}
                    GROUP BY 
                        date
                    ORDER BY 
                        date;`
        const billingRJCData = await sequelize.query(billingRJCQuery, { type: Sequelize.QueryTypes.SELECT });

        let billingAJCQuery = `SELECT 
                        DATE(delivery_date) AS date,  
                        COUNT(*) AS value
                    FROM 
                        billings
                    WHERE
                        (delivery_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}') AND (jobcard_no LIKE 'AJC%') AND outlet_id = ${user.outlet.id}
                    GROUP BY 
                        date
                    ORDER BY 
                        date;`
        const billingAJCData = await sequelize.query(billingAJCQuery, { type: Sequelize.QueryTypes.SELECT });

        return { transactionData, billingRJCData, billingAJCData };
    } catch (err) {
        logger.error('Job Card dao dashboardInflow', err);
    }
}

const createPartsIndent = async (partsIndentData, user) => {
    let data = {};
    const currentDate = new Date();
    try {
        if (partsIndentData.partId !== null && partsIndentData.partId !== undefined && partsIndentData.partId !== "") {
            data = await PartsIndent.create({
                transaction_id: partsIndentData.transactionId,
                item_id: partsIndentData.partId,
                item_code: partsIndentData.partNo,
                item_name: partsIndentData.partDescription,
                request_quantity: partsIndentData.requestedQuantity,
                received_quantity: partsIndentData.receivedQuantity,
                return_quantity: partsIndentData.returnQuantity,
                amount: partsIndentData.rate,
                part_total: partsIndentData.partTotal,
                sgst: partsIndentData.sgst ? partsIndentData.sgst : '0',
                cgst: partsIndentData.cgst ? partsIndentData.cgst : '0',
                igst: partsIndentData.igst ? partsIndentData.igst : '0',
                hsn_code: partsIndentData.hsnCode,
                created_by: user.id,
                updated_by: user.id,
                status: partsIndentData.status ? partsIndentData.status : 1,
                indentType: partsIndentData.indentType ? partsIndentData.indentType : null,
                approveDatetime: null,
                approvalStatus: 'PENDING',
                sourceType: 'JOB_CARD',
                sourceEstimateItemId: null,
            });
        }
        else if (partsIndentData.partDescription !== "") {
            data = await PartsIndent.create({
                transaction_id: partsIndentData.transactionId,
                item_id: null,
                item_code: partsIndentData.partNo ? partsIndentData.partNo : null,
                item_name: partsIndentData.partDescription,
                request_quantity: partsIndentData.requestedQuantity ? partsIndentData.requestedQuantity : 0,
                received_quantity: partsIndentData.receivedQuantity ? partsIndentData.receivedQuantity : 0,
                return_quantity: partsIndentData.returnQuantity ? partsIndentData.returnQuantity : 0,
                amount: partsIndentData.rate ? partsIndentData.rate : 0,
                part_total: partsIndentData.partTotal ? partsIndentData.partTotal : 0,
                sgst: partsIndentData.sgst ? partsIndentData.sgst : 0,
                cgst: partsIndentData.cgst ? partsIndentData.cgst : 0,
                igst: partsIndentData.igst ? partsIndentData.igst : 0,
                hsn_code: partsIndentData.hsnCode ? partsIndentData.hsnCode : null,
                created_by: user.id,
                updated_by: user.id,
                status: partsIndentData.status ? partsIndentData.status : 1,
                indentType: partsIndentData.indentType ? partsIndentData.indentType : null,
                approveDatetime: null,
                approvalStatus: 'PENDING',
                sourceType: 'JOB_CARD',
                sourceEstimateItemId: null,

            })
        }
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createPartsIndent", err);
    }
    return data;
};

const updatePartsIndent = async (partsIndentData, user) => {
    let data = {};
    let updatedData = {};
    const currentDate = new Date();
    // try {
    //     if(partsIndentData.partId !== null && partsIndentData.partId !== undefined && partsIndentData.partId !== "" ){
    //         data = await PartsIndent.update({
    //             transaction_id: partsIndentData.transactionId,
    //             item_id: partsIndentData.partId,
    //             item_code: partsIndentData.partNo,
    //             item_name: partsIndentData.partDescription,
    //             request_quantity: partsIndentData.requestedQuantity,
    //             received_quantity: partsIndentData.receivedQuantity,
    //             return_quantity: partsIndentData.returnQuantity,
    //             amount: partsIndentData.rate,
    //             part_total: partsIndentData.partTotal,
    //             sgst: partsIndentData.sgst?partsIndentData.sgst:'0',
    //             cgst: partsIndentData.cgst?partsIndentData.cgst:'0',
    //             igst: partsIndentData.igst?partsIndentData.igst:'0',
    //             hsn_code: partsIndentData.hsnCode,
    //             updated_by: user.id,
    //             status: partsIndentData.status ? partsIndentData.status : 1
    //         }, {where: {id: partsIndentData.id}});
    //     }
    //     else if( partsIndentData.partDescription !== "") {
    //         data =await PartsIndent.update({
    //             transaction_id: partsIndentData.transactionId,
    //             item_id: null,
    //             item_code: null,
    //             item_name: partsIndentData.partDescription,
    //             request_quantity: partsIndentData.requestedQuantity ? partsIndentData.requestedQuantity: 0,
    //             received_quantity: partsIndentData.receivedQuantity ? partsIndentData.receivedQuantity: 0,
    //             return_quantity: partsIndentData.returnQuantity ? partsIndentData.returnQuantity: 0,
    //             amount: partsIndentData.rate ? partsIndentData.rate : 0 ,
    //             part_total: partsIndentData.partTotal ? partsIndentData.partTotal : 0,
    //             sgst: 0,
    //             cgst: 0,
    //             igst: 0,
    //             hsn_code: null,
    //             updated_by: user.id,
    //             status: partsIndentData.status ? partsIndentData.status : 1
    //         }, {where: {id: partsIndentData.id}});
    //     }
    // } catch (err) {
    //     console.log(err);
    //     logger.error("JobCard Dao updatePartsIndent", err);
    // }
    try {
        if (partsIndentData.partId) {
            const existing = await PartsIndent.findOne({ where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });
            if (!existing) return null;

            const mergedData = {
                transaction_id: partsIndentData.transactionId,
                item_id: partsIndentData.partId,
                item_code: partsIndentData.partNo,
                item_name: partsIndentData.partDescription,
                request_quantity: partsIndentData.requestedQuantity ?? existing.request_quantity ?? 0,
                received_quantity: partsIndentData.receivedQuantity ?? existing.received_quantity ?? 0,
                return_quantity: partsIndentData.returnQuantity ?? existing.return_quantity ?? 0,
                amount: partsIndentData.rate ?? existing.amount ?? 0,
                part_total: partsIndentData.partTotal ?? existing.part_total ?? 0,
                sgst: partsIndentData.sgst ?? existing.sgst ?? '0',
                cgst: partsIndentData.cgst ?? existing.cgst ?? '0',
                igst: partsIndentData.igst ?? existing.igst ?? '0',
                hsn_code: partsIndentData.hsnCode ?? existing.hsn_code,
                updated_by: user.id,
                status: partsIndentData.status ?? existing.status,
                fitId: partsIndentData.fitId ?? existing.fitId,
                indentType: partsIndentData.indentType ?? existing.indentType
            };

            await PartsIndent.update(mergedData, { where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });
            updatedData = await PartsIndent.findOne({ where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });
        } else if (partsIndentData.partDescription !== "") {
            const existing = await PartsIndent.findOne({ where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });
            if (!existing) return null;

            const mergedData = {
                transaction_id: partsIndentData.transactionId,
                item_id: null,
                item_code: partsIndentData.partNo ?? existing.item_code ?? null,
                item_name: partsIndentData.partDescription,
                request_quantity: partsIndentData.requestedQuantity ?? existing.request_quantity ?? 0,
                received_quantity: partsIndentData.receivedQuantity ?? existing.received_quantity ?? 0,
                return_quantity: partsIndentData.returnQuantity ?? existing.return_quantity ?? 0,
                amount: partsIndentData.rate ?? existing.amount ?? 0,
                part_total: partsIndentData.partTotal ?? existing.part_total ?? 0,
                sgst: 0,
                cgst: 0,
                igst: 0,
                hsn_code: partsIndentData.hsnCode ?? existing.hsn_code ?? null,
                updated_by: user.id,
                status: partsIndentData.status ?? existing.status,
                fitId: partsIndentData.fitId ?? existing.fitId,
                indentType: partsIndentData.indentType ?? existing.indentType ?? null

            };

            await PartsIndent.update(mergedData, { where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });
            updatedData = await PartsIndent.findOne({ where: { id: partsIndentData.id, transaction_id: partsIndentData.transactionId } });

        }
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao updatePartsIndent", err);
    }
    return updatedData?.dataValues ?? {};
};

const getPartsIssueByIndentId = async (indentId) => {
    try {
        if (!indentId) return null;

        const partsIssue = await PartsIssue.findOne({
            where: { indent_id: indentId },
            include: [
                {
                    model: Items,
                    as: 'items',
                    attributes: ['hsnCode'],
                    required: false
                }
            ]
        });

        return partsIssue ? partsIssue.dataValues : null;
    } catch (error) {
        console.error("Error fetching PartsIssue:", error);
        return null;
    }
};

// Persist a part's discount to its parts_indent row (the table the outletEdit
// Parts table reads/writes). Used by the outletEdit save path only — parts_indent
// gained a `discount` column for this; updateJobCard's updatePartsIndent doesn't write it.
const updatePartsIndentDiscount = async (indentId, discount) => {
    try {
        if (indentId === undefined || indentId === null) return null;
        return await PartsIndent.update(
            { discount: Number(discount) || 0 },
            { where: { id: indentId } }
        );
    } catch (err) {
        logger.error("JobCard dao updatePartsIndentDiscount", err);
    }
};

const updateLaborFitId = async (id, fitId) => {
    try {
        await Schedules.update(
            { fitId: fitId },
            { where: { id: id } }
        );
    } catch (err) {
        logger.error('JobCardDao updateLaborFitId error:', err);
    }
};

const updateOslLaborFitId = async (id, fitId) => {
    try {
        await OslSchedules.update(
            { fitId: fitId },
            { where: { id: id } }
        );
    } catch (err) {
        logger.error('JobCardDao updateOslLaborFitId error:', err);
    }
};

const updatePartsFitId = async (id, fitId) => {
    try {
        await PartsIndent.update(
            { fitId: fitId },
            { where: { id: id } }
        );
    } catch (err) {
        logger.error('JobCardDao updatePartsFitId error:', err);
    }
};


const findJobCardByStatus = async (registrationNumber) => {
    try {
        const rows = await JobCard.findOne({
            where: {
                reg_no: registrationNumber,
                status: {
                    [Op.in]: [1, 2, 3, 4]
                }
            },
        });
        return rows;
    } catch (err) {
        logger.error("JobCard dao findJobCardByStatus", err);
    }
};

const getJobCardPDFDetails = async (id) => {
    try {
        const data = await JobCard.findOne({
            where: { id: id },
            include: [
                {
                    model: Vehicle, as: "vehicle",
                    include: [{ model: Model, as: 'model' },
                    { model: Make, as: 'make' },
                    ]
                },
                {
                    model: Schedules, as: "schedules",
                    include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                {
                    model: OslSchedules, as: "oslSchedules",
                    include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                {
                    model: PartsIndent, as: "partsIndent",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
                {
                    model: PartsIssue, as: "partsIssue",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
                {
                    model: Servicetypes, as: "servicetype",
                    attributes: ['serviceTypeName'],
                },
                {
                    model: RepairType, as: 'repairtype',
                    attributes: ['repairTypeName']
                },
                {
                    model: Billings, as: "billing",
                },
                {
                    model: Outlets, as: 'outlet'
                },
                {
                    model: transactionUpdate, as: 'transactionupdates',
                    limit: 1,
                    order: [['id', 'DESC']]
                }
            ]
        })
        // console.log("PDF DATA", data);
        return data;
    } catch (err) {
        logger.error("JobCard dao getJobCardPDFDetails", err);
        console.log(err);
    }
}


const getPrevJobCard = async (regno) => {
    try {
        const data = await JobCard.findOne({
            where: {
                status: 5,
                reg_no: regno
            },
            order: [['id', 'DESC']],
            limit: 1,
            include: [
                {
                    model: Vehicle, as: "vehicle",
                    include: [{ model: Model, as: 'model' },
                    { model: Make, as: 'make' },
                    ]
                },
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                { model: PartsIssue, as: "partsIssue" }
            ]
        });
        return data;
    } catch (err) {
        logger.error("JobCard dao getPrevJobCard Error", err);
    }
}

const createMechanicMapping = async (mechanicMapData, user) => {
    let data = {};
    const currentDate = new Date();
    try {
        data = await MechanicMapping.create({
            transaction_id: mechanicMapData.transaction_id,
            schedule_id: mechanicMapData.schedule_id,
            rot_id: mechanicMapData.rot_id,
            labour_code: mechanicMapData.labour_code,
            mechanic_id: mechanicMapData.mechanic_id,
            mechanic_name: mechanicMapData.mechanic_name,
            percentage: mechanicMapData.percentage,
            start_time: mechanicMapData.start_time,
            end_time: mechanicMapData.end_time,
            status: mechanicMapData.status,
            mechanic_hrs: mechanicMapData.mechanic_hrs,
            reason: mechanicMapData.reason,
            created_by: user.id,
            updated_by: user.id,
            stdhrs: mechanicMapData.stdhrs
        });

        return data;
    } catch (err) {
        logger.error("Job Card Dao createMechanicMapping", err);
    }
};

const updateMechanicMapping = async (mechanicMapData, user) => {
    let data = {};
    const currentDate = new Date();
    try {
        data = await MechanicMapping.update({
            transaction_id: mechanicMapData.transaction_id,
            schedule_id: mechanicMapData.schedule_id,
            rot_id: mechanicMapData.rot_id,
            labour_code: mechanicMapData.labour_code,
            mechanic_id: mechanicMapData.mechanic_id,
            mechanic_name: mechanicMapData.mechanic_name,
            percentage: mechanicMapData.percentage,
            start_time: mechanicMapData.start_time,
            end_time: mechanicMapData.end_time,
            status: mechanicMapData.status,
            mechanic_hrs: mechanicMapData.mechanic_hrs,
            reason: mechanicMapData.reason,
            created_by: user.id,
            updated_by: user.id,
            stdhrs: mechanicMapData.stdhrs
        }, {
            where: {
                id: mechanicMapData.id
                // transaction_id: mechanicMapData.transaction_id,
                // schedule_id: mechanicMapData.schedule_id,
                // mechanic_id: mechanicMapData.mechanic_id
            }
        });

        return data;
    } catch (err) {
        logger.error("Job Card Dao createMechanicMapping", err);
    }
};

const getJobCard = async (id) => {
    try {
        const rows = await JobCard.findOne({
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        {
                            model: vehicleContract, as: 'vehicleContracts',
                            include: [
                                { model: Scheme, as: 'scheme', attributes: ['id', 'repair_type_id'] },
                                { model: vehicleContractScheme, as: 'vehicleContractSchemes', attributes: ['id', 'labor_parts_id', 'scheme_labor_parts_code', 'balance_count', 'item_type'] }
                            ],
                            attributes: ['vehicle_number'],
                            required: false,
                            where: {
                                end_date: {
                                    [Op.gt]: new Date() // current date
                                }
                            }
                        }
                    ],
                },
            ],
            where: { id: id },
        });
        return rows;
    } catch (err) {
        logger.error(
            "JobCard dao getJobCard",
            err
        );
        console.log(err);
    }
};

const updateJobCardLineApproval = async (approvalData, user) => {
    const lineModels = {
        PART: PartsIndent,
        LABOUR: Schedules,
        OSL: OslSchedules,
    };
    const LineModel = lineModels[approvalData.lineType];
    if (!LineModel) return { result: 'invalidLineType' };

    return sequelize.transaction(async (transaction) => {
        const jobCard = await JobCard.findOne({
            where: { id: approvalData.jobCardId, outlet_id: user.outlet.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!jobCard) return { result: 'jobCardNotFound' };

        const line = await LineModel.findOne({
            where: { id: approvalData.lineId, transaction_id: approvalData.jobCardId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!line) return { result: 'lineNotFound' };

        const approvalStatus = approvalData.approvalStatus;
        await line.update({
            approvalStatus,
            status: approvalStatus === 'APPROVED' ? 2 : 1,
            approveDatetime: approvalStatus === 'APPROVED' ? new Date() : null,
            updated_by: user.id,
        }, { transaction });

        const workflow = await advanceJobCardToInProgressIfApproved(jobCard, user, transaction);

        return {
            result: 'success',
            line: line.get({ plain: true }),
            status: workflow.status,
            statusValue: workflow.statusValue,
            statusAdvanced: workflow.statusAdvanced,
        };
    });
};

const advanceJobCardToInProgressIfApproved = async (jobCard, user, transaction) => {
    const lineModels = [PartsIndent, Schedules, OslSchedules];
    const allLines = [];
    for (const LineModel of lineModels) {
        const lines = await LineModel.findAll({
            where: { transaction_id: jobCard.id },
            attributes: ['id', 'approvalStatus'],
            transaction,
        });
        allLines.push(...lines);
    }

    const allApproved = allLines.length > 0 && allLines.every(
        (line) => String(line.approvalStatus || '').toUpperCase() === 'APPROVED'
    );
    const statusAdvanced = Number(jobCard.status) === 1 && allApproved;

    if (statusAdvanced) {
        await jobCard.update({
            status: 2,
            status_value: 'Work In Progress',
            updated_by: user.id,
        }, { transaction });
    }

    const status = statusAdvanced ? 2 : Number(jobCard.status);
    const statusValueByCode = {
        1: 'Open',
        2: 'Work In Progress',
        3: 'Ready For Billing',
        4: 'Billing',
        5: 'Delivered',
        6: 'Cancelled',
    };
    return {
        status,
        statusValue: statusValueByCode[status] || jobCard.status_value,
        statusAdvanced,
    };
};

const advanceJobCardToInProgressIfApprovedById = async (jobCardId, user) => {
    return sequelize.transaction(async (transaction) => {
        const jobCard = await JobCard.findOne({
            where: { id: jobCardId, outlet_id: user.outlet.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!jobCard) return { result: 'jobCardNotFound' };
        const workflow = await advanceJobCardToInProgressIfApproved(jobCard, user, transaction);
        return { result: 'success', ...workflow };
    });
};

const deleteLaborSchedules = async (transaction_id) => {
    let data = {};
    try {
        data = await Schedules.destroy({
            where: {
                transaction_id: transaction_id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteLaborSchedules", err);
    }
    return data;
};

const deleteOslLaborSchedules = async (transaction_id) => {
    let data = {};
    try {
        data = await OslSchedules.destroy({
            where: {
                transaction_id: transaction_id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteOslLaborSchedules", err);
    }
    return data;
};

const deletePartsIndents = async (transaction_id) => {
    let data = {};
    try {
        data = await PartsIndent.destroy({
            where: {
                transaction_id: transaction_id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deletePartsIndents", err);
    }
    return data;
};




const updateJobCard = async (reqData, user) => {
    let data = {};
    const currentDate = new Date();
    let statusValue = "";
    try {
        if (reqData.status === 1) {
            statusValue = "Open";
        } else if (reqData.status === 2) {
            statusValue = "Work In Progress";
        } else if (reqData.status === 3) {
            statusValue = "Ready For Billing";
        } else if (reqData.status === 4) {
            statusValue = "Billing";
        } else if (reqData.status === 5) {
            statusValue = "Delivered";
        } else if (reqData.status === 6) {
            statusValue = "Cancelled";
        }
        // data = await JobCard.update({
        //     outlet_id: user.outlet.id,
        //     outlet_code: user.outlet.outletCode,
        //     document_type: reqData.documentType,
        //     job_card_no: reqData.jobCardNumber,
        //     customer_id: reqData.customeId,
        //     customer_code: reqData.customerCode,
        //     customer_name: reqData.customerName,
        //     customer_address: reqData.customerAddress,
        //     customer_state: reqData.customerState,
        //     customer_city: reqData.customerCity,
        //     customer_pincode: reqData.pincode,
        //     customer_type: reqData.customerType,
        //     customer_gstin: reqData.gstinNumber,
        //     vehicle_id: reqData.vehicleId,
        //     customer_mobileNumber: reqData.customerMobileNumber,

        //     reg_no: reqData.registrationNumber,
        //     work_end_date_time: reqData.expectedWorkCompletion,
        //     customer_arrived_date: reqData.customerArrivedDate,
        //     repair_type: reqData.repairTypeId,
        //     service_type: reqData.serviceTypeId,
        //     odometer: reqData.odometer,
        //     status: reqData.status,
        //     status_value: statusValue,
        //     // service_estimate_id: reqData.serviceEstimateId ,
        //     // service_estimate_code: reqData.serviceEstimateNumber ,
        //     // customer_voice: reqData.customerVoice,
        //     source: reqData.sourceId,
        //     source_type: reqData.sourceTypeId,
        //     dsa_agent_id: reqData.dsaAgent ? reqData.dsaAgent.id : null,
        //     dsa_agent: reqData.dsaAgent ? reqData.dsaAgent.dsaCode : null,
        //     part_approve: 1,
        //     credit_approve: reqData.credit_approve ? reqData.credit_approve : 0,
        //     credit_approve_reason: "test",
        //     service_engineer_remarks: reqData.serviceEngineerRemarks,
        //     service_advice: reqData.serviceAdvice,
        //     otd_reason_id: reqData.OtdFailureReason ? reqData.OtdFailureReason.id : 0,
        //     otd_reason: reqData.OtdFailureReason ? reqData.OtdFailureReason.reason : "",
        //     sub_status: reqData.TransactionSubStatus ? reqData.TransactionSubStatus.title : "",
        //     sub_status_reason: reqData.TransactionSubStatusReason ? reqData.TransactionSubStatusReason : "",

        //     stageNorms: reqData.stageNorms ? reqData.stageNorms : null,
        //     axle: reqData.axle ? reqData.axle : null,
        //     application: reqData.application ? reqData.application : null,
        //     nextDueDateFC: reqData.fc ? reqData.fc : null,
        //     engineOilCapacity: reqData.engineOilCapacity ? reqData.engineOilCapacity : null,


        //     // otd_reason_id: reqData.OtdFailureReason.id,
        //     // otd_reason: reqData.OtdFailureReason.reason,
        //     // sub_status: reqData.TransactionSubStatus.title,
        //     // sub_status_reason: reqData.TransactionSubStatusReason,
        //     paid_by_status: reqData.paidByStatus,
        //     jobType: reqData.jobType,
        //     per_day_km: reqData.PerDayKm,
        //     insuranceName: reqData.insuranceName ? reqData.insuranceName : null,
        //     insuranceExpDate: reqData.insuranceExpDate ? reqData.insuranceExpDate : null,
        //     customer_voice: reqData?.customerVoice ? reqData?.customerVoice : null,
        //     created_by: user.id,
        //     updated_by: user.id,
        // }, { where: { id: reqData.id } });

            const updateData = {
      outlet_id: user.outlet.id,
      outlet_code: user.outlet.outletCode,
      document_type: reqData.documentType,
      job_card_no: reqData.jobCardNumber,
      customer_id: reqData.customeId,
      customer_code: reqData.customerCode,
      customer_name: reqData.customerName,
      customer_address: reqData.customerAddress,
      customer_state: reqData.customerState,
      customer_city: reqData.customerCity,
      customer_pincode: reqData.pincode,
      customer_type: reqData.customerType,
      customer_gstin: reqData.gstinNumber,
      vehicle_id: reqData.vehicleId,
      customer_mobileNumber: reqData.customerMobileNumber,
      reg_no: reqData.registrationNumber,
      work_end_date_time: reqData.expectedWorkCompletion,
      customer_arrived_date: reqData.customerArrivedDate,
      repair_type: reqData.repairTypeId,
      service_type: reqData.serviceTypeId,
      odometer: reqData.odometer,
      status: reqData.status,
      status_value: statusValue,
      customer_voice: reqData.customerVoice ? reqData.customerVoice : null,
      source: reqData.sourceId,
      source_type: reqData.sourceTypeId,
      dsa_agent_id: reqData.dsaAgent ? reqData.dsaAgent.id : null,
      dsa_agent: reqData.dsaAgent ? reqData.dsaAgent.dsaCode : null,
      part_approve: 1,
      credit_approve: reqData.credit_approve ? reqData.credit_approve : 0,
      credit_approve_reason: "",
      service_engineer_remarks: reqData.serviceEngineerRemarks,
      service_advice: reqData.serviceAdvice,
      otd_reason_id: reqData.OtdFailureReason ? reqData.OtdFailureReason.id : 0,
      otd_reason: reqData.OtdFailureReason ? reqData.OtdFailureReason.reason : "",
      sub_status: reqData.TransactionSubStatus ? reqData.TransactionSubStatus.title : "",
      sub_status_reason: reqData.TransactionSubStatusReason ? reqData.TransactionSubStatusReason : "",
      stageNorms: reqData.stageNorms ? reqData.stageNorms : null,
      axle: reqData.axle ? reqData.axle : null,
      application: reqData.application ? reqData.application : null,
      nextDueDateFC: reqData.fc ? reqData.fc : null,
      engineOilCapacity: reqData.engineOilCapacity ? reqData.engineOilCapacity : null,
      paid_by_status: reqData.paidByStatus,
      jobType: reqData.jobType,
      per_day_km: reqData.PerDayKm,
      insuranceName: reqData.insuranceName ? reqData.insuranceName : null,
      insuranceExpDate: reqData.insuranceExpDate ? reqData.insuranceExpDate : null,
      created_by: user.id,
      updated_by: user.id,
    };

    if (reqData.serviceEstimateId !== undefined && reqData.serviceEstimateId !== null && reqData.serviceEstimateId !== "") {
      updateData.service_estimate_id = reqData.serviceEstimateId;
    }

    if (
      reqData.serviceEstimateNumber !== undefined &&
      reqData.serviceEstimateNumber !== null &&
      reqData.serviceEstimateNumber !== ""
    ) {
      updateData.service_estimate_code = reqData.serviceEstimateNumber;
    }

    data = await JobCard.update(updateData, {
      where: { id: reqData.id },
    });


    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createJobCard", err);
    }

    return data;
};

// Restores ownership fields on a job card. The shared updateJobCard overwrites
// created_by/outlet_id/outlet_code with the editor's identity; the outlet edit
// path calls this afterwards to put the ORIGINAL values back, so an Outlet Admin
// editing another user's card doesn't reassign it away from its creator/outlet.
const restoreJobCardOwnership = async (id, fields) => {
    try {
        return await JobCard.update(
            {
                created_by: fields.created_by,
                outlet_id: fields.outlet_id,
                outlet_code: fields.outlet_code,
            },
            { where: { id } }
        );
    } catch (err) {
        logger.error("Job Card dao restoreJobCardOwnership", err);
        throw err;
    }
};

const getMechanicMapByTransactionId = async (transId) => {
    try {
        const rows = await MechanicMapping.findAll({
            where: { transaction_id: transId }
        });
        return rows;
    } catch (err) {
        logger.error("Job Card dao getMechanicMapByTransactionId", err);
        console.log(err);
    }
};

const getMechanicMapByTransactionIdMechanicId = async (id, transId, schId, mechId) => {
    try {
        const rows = await MechanicMapping.findAll({
            where: {
                id: id
                // transaction_id: transId,
                // schedule_id: schId,
                // mechanic_id: mechId
            }
        });
        return rows;
    } catch (err) {
        logger.error("Job Card dao getMechanicMapByTransactionId", err);
        console.log(err);
    }
};

const getJobcardLabor = async (transId) => {
    try {

        let laborQuery = "select transaction_id,rot_id,description,quantity,singleAmount,laborTotal, a.id, "
            + " laborCode,taxPercentage,stdhrsA, a.status from schedules a "
            + "left outer join laborschedules b on a.rot_id=b.id "
            + "where transaction_id=" + transId + " and a.status=2"

        const [results, metadata] = await sequelize.query(laborQuery);
        return results;
    } catch (err) {
        logger.error("Job Card dao getMechanicMapByTransactionId", err);
        console.log(err);
    }
};

const deleteMechanicMapByTransactionId = async (transId) => {
    try {

        const rows = await MechanicMapping.destroy({
            where: { transaction_id: transId }
        });
        return rows;
    } catch (err) {
        logger.error("Job Card dao deleteMechanicMapByTransactionId", err);
        console.log(err);
    }
};

const deleteMechanicMapByMechanicId = async (id) => {
    try {

        const rows = await MechanicMapping.destroy({
            where: { id: id }
        });
        return rows;
    } catch (err) {
        logger.error("Job Card dao deleteMechanicMapByMechanicId", err);
        console.log(err);
    }
};

const updateJobcardStatus = async (reqData, user) => {
    let data = {};
    let statusValue = "";
    let schedulePercentages = {};
    let mechMapping = true;
    let gstCheck = true;
    const statusMapping = {
        1: "Open",
        2: "Work In Progress",
        3: "Ready For Billing",
        4: "Billing",
        5: "Delivered",
        6: "Cancelled",
    };


    let approvedObj = {
        "limit": 25,
        "offset": 0,
        "searchKey": ""
    };

    let approvedDetails = await Schedules.findAll({
        where: { transaction_id: reqData.id, status: 2 }
    });

    const skipMechValidation = user?.outlet?.companyId === 3;

    // console.log("approvedDetails-------------------", approvedDetails[0].get({ plain: true }));

    const labourDetails = approvedDetails[0].get({ plain: true });



    let result = await getMechanicMapByTransactionId(reqData.id);

    console.log("approvedDetails-------------------", result);
    // let isJcId = await ServiceReminderAlert.findAll({
    //     where: { jc_id: reqData.id }
    // });

    // let CustomerApprovalTransaction =  await JobCard.findOne({
    //     where: {id: reqData.id}
    // })
    // let CustomerApprovalTransactionCustomer_id = CustomerApprovalTransaction?.customer_id

    // let isCustomerApproved = await Customer.findOne({
    //     where: {id: CustomerApprovalTransactionCustomer_id}
    // })

    let missingRecords = approvedDetails.filter(approved => {
        return !result.some(res => res.schedule_id === approved.id);
    });

    console.log("missingRecords-------------------", missingRecords);

    for (const element of result) {
        if (schedulePercentages[element.schedule_id]) {

            schedulePercentages[element.schedule_id] += element.percentage;
            // console.log("inside loop ----------", schedulePercentages)
        } else {
            schedulePercentages[element.schedule_id] = element.percentage;
        }
    };



    if (missingRecords.length > 0) {
        mechMapping = false;
    } else {
        for (const [key, value] of Object.entries(schedulePercentages)) {
            if (value < 100) {
                mechMapping = false;
                break;
            }
        };
    };

    let ajcInsurance = true;

    if (reqData.jobCardNo.split("-")[0] === "AJC") {
        let hasInsurance = await TransactionInsurance.findOne({ where: { transaction_id: reqData.id } });
        if (hasInsurance) {
            ajcInsurance = true;
        }
        else {
            ajcInsurance = false;
        }
    }

    // let srReminder = true;
    // let fetchJobcard = await JobCard.findOne({
    //     where: { id: reqData.id }
    // });

    // if(fetchJobcard && fetchJobcard.jobType === "Vehicle") {
    //     if(isJcId.length >= 11) {
    //         srReminder = true;
    //     } else {
    //         srReminder = false;
    //     };
    // };

    // let CustomerApproval = true;
    // if(isCustomerApproved?.aprrovalStatus){
    //     CustomerApproval = true
    // } else {
    //     CustomerApproval = false
    // }
    console.log('condition', mechMapping, ajcInsurance);
    if (user?.outlet?.companyId === 3) {
    mechMapping = true;
    }
    if (mechMapping && ajcInsurance
        // &&  CustomerApproval
    ) {

        // const auth = await getRemoteToken();

        if (true) {
            // const JCdetails = await getTransactionDetails(reqData.id);
            const statusText = statusMapping[reqData.status || 1] || "Unknown";

            // const updatePayload = {
            //     userId: auth.userId,
            //     authenticationToken: auth.token,
            //     jcId: reqData.id,
            //     updateType: "status",
            //     payload: { status: statusText },
            // };

            // console.log("Payload for status update:", updatePayload);

            //  External FIT API CALL 
            try {
                //Revert Back 
                // const updateResponse = await axios.post(
                //     "https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php", // TO DO Check savejcdetails.php replace from php file 
                //     updatePayload,
                //     { timeout: 8000, headers: { "Content-Type": "application/json" } }
                // );

                // if (!updateResponse?.data) {
                //     throw new Error("Empty response from FIT API");
                // }

                // // Track success response
                // await MobileApiTrackDao.createMobileApiReq({
                //     user_id: user?.id || null,
                //     api_url: "status_update_dms_tvsfit",
                //     action: "POST",
                //     request_json: JSON.stringify(updatePayload),
                //     response_json: JSON.stringify(updateResponse.data),
                //     user_role_id: user?.roleid || null,
                //     ip_address: "dms-web-application",
                //     user_agent: "internal-server-operation",
                // });
                // Revert Back 

                if (reqData.status === 1) {
                    statusValue = "Open";
                } else if (reqData.status === 2) {
                    statusValue = "Work In Progress";
                } else if (reqData.status === 3) {
                    statusValue = "Ready For Billing";
                } else if (reqData.status === 4) {
                    statusValue = "Billing";
                } else if (reqData.status === 5) {
                    statusValue = "Delivered";
                } else if (reqData.status === 6) {
                    statusValue = "Cancelled";
                }

                const updateAuditTrail = await utils.updateAuditTrail(
                    reqData.id,
                    statusValue,
                    user.id,
                    ""
                )
                console.log("statusValue", statusValue);
                const savejcdata = await savejcdetails(reqData, statusValue);
                console.log("savejcdata", savejcdata);

                if (savejcdata !== "") {
                    data = {
                        status: "saveJcData",
                        message: savejcdata
                    };
                    return data;
                }

                if (reqData.status === 3) {
                    const jcDetails = await JobCard.findOne({ where: { id: reqData.id } });
                    const jcCustmerDetails = jcDetails.get({ plain: true });

                    if (jcCustmerDetails.customer_state === user.outlet.state) {

                        if (labourDetails.igst !== 0) {
                            gstCheck = false;
                            // console.log('invalid igst for same state');

                        }
                    } else {
                        if (labourDetails.igst == 0) {
                            gstCheck = false;
                            // console.log('invalid igst for different state');

                        }
                    }

                    // console.log("user", user);

                    const outletId = await db.users.findOne({
                        where: { id: user.id },
                        include: [{
                            model: db.employees,
                            as: 'employee',
                            attributes: ['outletId']
                        }]
                    });

                    // console.log("outlet", outletId);


                    const finalInspectorData = await db.employees.findAll({
                        where: {
                            outletId: outletId.employee.outletId
                        },
                        include: [
                            {
                                model: db.employeeroles,
                                as: 'employeerole',
                            },
                            {
                                model: db.users,
                                as: 'user',   // alias defined in association
                                required: true,
                                include: [
                                    {
                                        model: db.userrolemaps,
                                        as: 'userrolemaps',
                                        required: true,
                                        where: {
                                            role_name: "Floor Incharge"
                                        }
                                    }
                                ]   // ensures only employees with user record are returned
                            }
                        ]
                    })

                    for (const element of finalInspectorData) {
                        await sendNotificationDataToToken(
                            element.user.fcm_tocken,
                            {
                                title: "Post Inspection",
                                body: "Complete the " + jcDetails.reg_no + " Inspection Before Billing",
                                tab: "POST_INSPECTION_COMPLETED",
                                visitID: reqData.id.toString()
                            }
                        );
                    }

                    // console.log("jcDetails before status update:", jcDetails.get({ plain: true }));

                }

                if (gstCheck === true) {
                    data = await JobCard.update(
                        {
                            status: reqData.status,
                            status_value: statusValue,
                            sub_status: reqData.subStatus,
                            updated_by: user.id
                        },
                        { where: { id: reqData.id } }
                    );
                    data = "Approved";
                }



            } catch (fitErr) {
                console.log('updateJobcardSAtatus error api in dao', fitErr)
                //  FIT API FAILURE HANDLED HERE
                logger.error("FIT API FAILED", {
                    error: fitErr.message,
                    reqData,
                });
                //    if (err.response) {
                //     return res.status(err.response.status).json({
                //         success: false,
                //         message: err.response.data?.errorDescription || "External API error",
                //         error: err.response.data,
                //     });
                //   }
                //   data = "fitApiFailed";

                //   result = fitErr.response.data?.errorDescription || "External API error"; 

                data = {
                    status: "fitApiFailed",
                    message:
                        fitErr.response?.data?.errorDescription ||
                        "External Jc Status update FIT API error",
                    // errorCode: fitErr.response?.status || 500,
                };
            }
        } else {
            logger.error("Failed to obtain auth token for FIT API", { reqData, user });
            result = "fitApiFailed";
            data = "fitApiFailed";
        }


        // try {

        // } catch (err) {
        //     logger.error('JobCard dao updateJobcardStatus Error:', err);
        //     next(err);
        // }
    } else if (ajcInsurance === false) {
        data = "ajcfailed";
    }
    else if (mechMapping === false && !skipMechValidation) {
        data = "mechFailed";
    }
    else if (
        gstCheck === false) {
        data = "GstCheckFailed";
    }

    // else if (CustomerApproval === false){
    //     data = "customerApprovalFailed";
    // }
    else {
        data = "failed";
    }

    return data;
};


const savejcdetails = async (reqData, statusValue) => {
    const jobCardData = await JobCard.findOne({
        where: {
            id: reqData.id
        }
    });

    // console.log("statusValue", statusValue);
    if (statusValue == "Billing" && jobCardData.fit_status == "JC_TO_GENERATE") {
        return "Final inspection for vehicle not done";
    } else if (statusValue == "Ready For Billing" && jobCardData.fit_status == "INSPECTION_ASSIGNED") {
        return "Error, Vehicle inspection is not complete. Please finish FIT inspection and try again.";
    } else if (statusValue == "Ready For Billing" && jobCardData.fit_status !== "JC_TO_GENERATE") {
        return "Error, estimates not approved by the customer. Try again after custoemr approval";
    } else {
        if (statusValue == "Work In Progress" && jobCardData.fit_status == "POST_INSPECTION_COMPLETED") {
            const updateJobCard = await updateFitStatus(reqData, "JC_TO_GENERATE");
            if (updateJobCard[0] == 1) {
                const updateVisitAuditTrail = await utils.updateAuditTrail(
                    reqData.id,
                    "JC_TO_GENERATE",
                    reqData.userId,
                    ""
                )
            }
        }
        if (statusValue == "Cancelled") {
            const updateJobCard = await updateFitStatus(reqData, "CANCELLED");
            if (updateJobCard[0] == 1) {
                const updateVisitAuditTrail = await utils.updateAuditTrail(
                    reqData.id,
                    "JC_TO_GENERATE",
                    reqData.userId,
                    ""
                )
            }
        }
        return "";
    }
}

const updateFitStatus = async (reqData, fitStatusValue) => {
    const updateJobCard = await JobCard.update({
        fit_status: fitStatusValue
    }, {
        where: {
            id: reqData.id
        }
    })

    return updateJobCard;
}

// const updateJobcardStatusFit = async (reqData, user) => { 
//     let data = {};
//     let statusValue = "";
//     let schedulePercentages = {};
//     let mechMapping = true;
//     let gstCheck = true;
//     const statusMapping = {
//         1: "Open",
//         2: "Work In Progress",
//         3: "Ready For Billing",
//         4: "Billing",
//         5: "Delivered",
//         6: "Cancelled",
//     };
//    statusValue = statusMapping[reqData.status || 1] || "Unknown";

//     let approvedObj = {
//         "limit": 25,
//         "offset": 0,
//         "searchKey": ""
//     };

//     let approvedDetails = await Schedules.findAll({
//         where: { transaction_id: reqData.id, status: 2 }
//     });

//     // console.log("approvedDetails-------------------", approvedDetails[0].get({ plain: true }));

//     const labourDetails = approvedDetails[0].get({ plain: true });



//     let result = await getMechanicMapByTransactionId(reqData.id);

//     console.log("approvedDetails-------------------", result);
//     // let isJcId = await ServiceReminderAlert.findAll({
//     //     where: { jc_id: reqData.id }
//     // });

//     // let CustomerApprovalTransaction =  await JobCard.findOne({
//     //     where: {id: reqData.id}
//     // })
//     // let CustomerApprovalTransactionCustomer_id = CustomerApprovalTransaction?.customer_id

//     // let isCustomerApproved = await Customer.findOne({
//     //     where: {id: CustomerApprovalTransactionCustomer_id}
//     // })

//     let missingRecords = approvedDetails.filter(approved => {
//         return !result.some(res => res.schedule_id === approved.id);
//     });

//     console.log("missingRecords-------------------", missingRecords);

//     for(const element of result) {
//         if(schedulePercentages[element.schedule_id]) {

//             schedulePercentages[element.schedule_id] += element.percentage;
//             console.log("inside loop ----------",schedulePercentages)
//         } else {
//             schedulePercentages[element.schedule_id] = element.percentage;
//         }
//     };

//     console.log("schedulePercentages-------------------", schedulePercentages);


//     if(missingRecords.length > 0) {
//         mechMapping = false;
//     } else {
//         for(const [key, value] of Object.entries(schedulePercentages)){
//             if (value < 100) {
//                 mechMapping = false;
//                 break;
//             }
//         };
//     };

//     console.log("mechMapping-------------------", mechMapping);
//     let ajcInsurance = true;
//     if (reqData.jobCardNo.split("-")[0] === "AJC"){
//         console.log("inside ajc");
//         let hasInsurance = await TransactionInsurance.findOne({ where: {transaction_id: reqData.id}});
//         if (hasInsurance) {
//             ajcInsurance = true;
//         }
//         else {
//             ajcInsurance =false;
//         }
//     }

//     // let srReminder = true;
//     // let fetchJobcard = await JobCard.findOne({
//     //     where: { id: reqData.id }
//     // });

//     // if(fetchJobcard && fetchJobcard.jobType === "Vehicle") {
//     //     if(isJcId.length >= 11) {
//     //         srReminder = true;
//     //     } else {
//     //         srReminder = false;
//     //     };
//     // };

//     // let CustomerApproval = true;
//     // if(isCustomerApproved?.aprrovalStatus){
//     //     CustomerApproval = true
//     // } else {
//     //     CustomerApproval = false
//     // }
//     console.log("ajcInsurance-------------------", ajcInsurance);

//     if(mechMapping && ajcInsurance  
//         // &&  CustomerApproval
//     ) {
//         console.log("inside mechMapping and ajcInsurance");
//         if(reqData.status === 3){
//             console.log("inside if for status 3");
//           const jcDetails = await JobCard.findOne({ where: { id: reqData.id } });

//           const jcCustmerDetails = jcDetails.get({ plain: true });

//           console.log("jcCustmerDetails:", jcCustmerDetails);

//           if(jcCustmerDetails.customer_state === user.outlet.state){

//             if(labourDetails.igst !== 0){
//                 gstCheck = false;
//                 console.log('invalid igst for same state');

//             }
//           }else{
//             if(labourDetails.igst == 0){
//                 gstCheck = false;
//                 console.log('invalid igst for different state');

//             }
//           }

//             console.log("jcDetails before status update:", jcDetails.get({ plain: true }));

//             }

//             if(gstCheck === true){
//                 console.log("Updating JobCard status in DB");
//             data = await JobCard.update( 
//                 {
//                     status: reqData.status,
//                     status_value: statusValue,
//                     sub_status: reqData.subStatus??"",
//                     updated_by: user.id
//                 },
//                 { where: { id: reqData.id } }
//             );
//             data = "Approved";
//             }
//         }
//         //    if (err.response) {
//         //     return res.status(err.response.status).json({
//         //         success: false,
//         //         message: err.response.data?.errorDescription || "External API error",
//         //         error: err.response.data,
//         //     });
//         //   }
//         //   data = "fitApiFailed";

//         //   result = fitErr.response.data?.errorDescription || "External API error"; 





//         // try {

//         // } catch (err) {
//         //     logger.error('JobCard dao updateJobcardStatus Error:', err);
//         //     next(err);
//         // }
//      if(ajcInsurance === false) {
//         data = "ajcfailed";
//     } 
//     else if(mechMapping === false ){
//         data = "mechFailed";
//     } else if(
//         gstCheck === false){
//         data = "GstCheckFailed";
//     }

//     // else if (CustomerApproval === false){
//     //     data = "customerApprovalFailed";
//     // }


//     console.log("Final data to return from updateJobcardStatusFit:", data);

//     return data;
// };

const updateJobcardStatusFit = async (reqData, user) => {
    try {
        const statusMapping = {
            1: "Open",
            2: "Work In Progress",
            3: "Ready For Billing",
            4: "Billing",
            5: "Delivered",
            6: "Cancelled",
        };

        const statusValue =
            statusMapping[reqData.status] || "Unknown";


        const jobCard = await JobCard.findOne({
            where: { id: reqData.id },
        });

        if (!jobCard) {
            return statusConstants.JOB_NOT_FOUND;
        }


        if ([1, 2, 6].includes(reqData.status)) {
            await JobCard.update(
                {
                    status: reqData.status,
                    status_value: statusValue,
                    sub_status: reqData.subStatus ?? "",
                    updated_by: user.id,
                },
                { where: { id: reqData.id } }
            );

            return statusConstants.SUCCESS;
        }

        /* ---------------- Mechanic Mapping ---------------- */

        const approvedDetails = await Schedules.findAll({
            where: { transaction_id: reqData.id, status: 2 },
        });

        if (!approvedDetails.length) {
            return statusConstants.MECH_FAILED;
        }

        const labourDetails = approvedDetails[0].get({ plain: true });

        const mechanicMappings =
            await getMechanicMapByTransactionId(reqData.id);

        const schedulePercentages = {};
        for (const m of mechanicMappings) {
            schedulePercentages[m.schedule_id] =
                (schedulePercentages[m.schedule_id] || 0) + m.percentage;
        }

        const missingSchedules = approvedDetails.filter(
            s => !mechanicMappings.some(m => m.schedule_id === s.id)
        );

        if (
            missingSchedules.length > 0 ||
            Object.values(schedulePercentages).some(p => p < 100)
        ) {
            return statusConstants.MECH_FAILED;
        }

        /* ---------------- AJC Insurance ---------------- */

        if (reqData.jobCardNo?.startsWith("AJC")) {
            const hasInsurance = await TransactionInsurance.findOne({
                where: { transaction_id: reqData.id },
            });
            if (!hasInsurance) {
                return statusConstants.AJC_FAILED;
            }
        }

        /* ---------------- GST Validation ---------------- */

        if (reqData.status === 3) {
            const jcDetails = await JobCard.findOne({
                where: { id: reqData.id },
            });

            const jc = jcDetails.get({ plain: true });

            const sameState = jc.customer_state === user.outlet.state;

            if (
                (sameState && labourDetails.igst !== 0) ||
                (!sameState && labourDetails.igst === 0)
            ) {
                return statusConstants.GST_FAILED;
            }
        }

        /* ---------------- Update JobCard ---------------- */

        await JobCard.update(
            {
                status: reqData.status,
                status_value: statusValue,
                sub_status: reqData.subStatus ?? "",
                updated_by: user.id,
            },
            { where: { id: reqData.id } }
        );

        return statusConstants.SUCCESS;
    } catch (err) {
        logger.error("DAO error updateJobcardStatusFit", err);
        return statusConstants.INTERNAL_ERROR;
    }
};

const getRecentOslSchedule = async () => {
    const recentEstimate = OslSchedules.findOne({
        order: [["createdAt", "DESC"]],
    });
    return recentEstimate;
};

const getRecentOslScheduleForWobNo = async (documentType, outletCode, year) => {
    const recentEstimate = OslSchedules.findOne({
        where: {
            osl_bill_no: {
                [Op.like]: `${documentType}-${outletCode}${year}%`
            }
        },
        order: [["createdAt", "DESC"]],
    });
    return recentEstimate;
};

const getOslByVendor = async (vendorId, transactionId) => {
    try {
        const rows = await OslSchedules.findOne({
            where: {
                vendorId: vendorId,
                transaction_id: transactionId
            },
        });
        return rows;
    } catch (err) {
        logger.error("Jobcard dao getOslByVendor", err);
    }
};
const updateJobcardMechanicMap = async (reqData, user) => {
    let data = {};
    let statusValue = "";
    try {
        const existingJobCard = await JobCard.findOne({
            where: { id: reqData.id }
        });
        // Determine the status_value based on the status
        if (reqData.status === 1) {
            statusValue = "Open";
        } else if (reqData.status === 2) {
            statusValue = "Work In Progress";
        } else if (reqData.status === 3) {
            statusValue = "Ready for billing";
        }
        const isStatusChanged = existingJobCard.status !== reqData.status;
        // console.log("isStatusChanged", isStatusChanged);
        // Update the job card status and status_value
        data = await JobCard.update(
            {
                status: reqData.status,
                status_value: statusValue,
                // sub_status:reqData.subStatus,
                updated_by: user.id
            },
            { where: { id: reqData.id } }
        );
        // not defined
        if (data && isStatusChanged) {
            await updateBridgeStatusCommon(
                reqData.id,
                reqData.status,
                user
            );
        }
    } catch (err) {
        logger.error('JobCard dao updateJobcardStatus Error:', err);
        next(err);
    }

    return data;
}

const getOslScheduleByWOB = async (billNo) => {
    try {
        // const { searchKey, offset, limit } = reqData;
        const oslBillNo = billNo;
        let sqlQry = 'select * from osl_schedules osl'
            + ' left outer join vendors v on osl.vendorId=v.id'
            + ' left outer join transactions t on osl.transaction_id=t.id'
            + ' left outer join vehicles veh on t.vehicle_id=veh.id'
            + ' left outer join models m on veh.modelId=m.id'
            + ' where osl.osl_bill_no = :oslBillNo';

        const [results, metadata] = await sequelize.query(sqlQry, {
            replacements: { oslBillNo }
        });
        return results;
    } catch (err) {
        logger.error("JobCard dao getOslScheduleByWOB", err);
    }
}

const getWOB = async (id, vendorId) => {
    try {
        const vendorData = await Vendor.findOne({
            where: { vendorCode: vendorId }
        });

        const data = await OslSchedules.findAll({
            where: {
                transaction_id: id,
                vendorId: vendorData.id,
                status: 2
            },
            orderBy: ['id', 'DESC'],
            include: [
                { model: Vendor, as: 'vendor' },
                {
                    model: JobCard, as: 'oslschedulesMapping',
                    include: [{
                        model: Vehicle, as: "vehicle",
                        include: [
                            { model: Model, as: 'model' },
                            { model: Make, as: 'make' },
                        ]
                    }]
                },

            ]
        });
        return data;
    } catch (err) {
        logger.error("JobCard dao getOslScheduleByWOB", err);
    }
}
const updateServiceEstimateStatus = async (id, user) => {
    let data = {};
    try {
        data = await ServiceEstimate.update(
            {
                status: 2,
                modifiedBy: user.id
            },
            { where: { id: id } }
        );
    } catch (err) {
        logger.error('JobCard dao updateServiceEstimateStatus Error:', err);
        throw err;
    }
    return data;
}

const oslWorkOrders = async (jobCardId) => {
    try {
        const transactionId = jobCardId;
        let sqlQry = 'select osl.transaction_id,osl.osl_bill_no,v.vendorCode,v.vendorName from osl_schedules osl left join vendors v on osl.vendorId=v.id where osl.transaction_id = :transactionId group by osl.transaction_id,osl.osl_bill_no,v.vendorCode,v.vendorName';

        const [results, metadata] = await sequelize.query(sqlQry, {
            replacements: { transactionId }
        });
        return results;
    } catch (err) {
        logger.error("JobCard dao oslWorkOrders", err);
    }
}

const listGatePassJobCards = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        const userCondition = {
            created_by: user.id, outlet_id: user.outlet.id, status:
            {
                [Op.in]: [4, 5, 6]
            }
        };
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            limit,
            offset,
            order: [["id", "DESC"]],
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIssue, as: "partsIssue" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                }
            ],
            attributes: [
                'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt',
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                [fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCards", err);
        console.log(err);
    }
};

const updateBillings = async (data, user) => {
    let result = {}
    try {
        result = await Billings.create({
            outlet_id: data.outletId,
            transaction_id: data.transactionId,
            jobcard_no: data.jobCardNo,
            bill_no: data.billNo,
            ins_invoice_no: data.insuranceBillNo,
            labor_amount: data.lamt,
            labor_taxamount: data.ltaxamt,
            osl_labor_amount: data.oslamt,
            osllabor_taxamount: data.osltaxamt,
            parts_amount: data.partsamt,
            parts_taxamount: data.partstaxamt,
            total_amount: data.TotalAmount,
            bill_type: data.billType,
            foc_labor_bill_no: data.focLabor,
            foc_parts_bill_no: data.focPart,
            created_by: user.id,
            foc_labor_amount: data.focLaborAmt,
            foc_parts_amount: data.focPartsAmt
        });
        return result;
    } catch (err) {
        console.log(err);
        logger.error("JobCard dao updateBillings", err);
    }
}

const getRecentGatePass = async (documentType, outletCode, year) => {
    const recentEstimate = await Billings.findOne({
        where: {
            delivery_number: {
                [Op.like]: `${documentType}-${outletCode}${year}%`
            }
        },
        order: [
            ["createdAt", "DESC"],
            ["delivery_number", "DESC"]
        ],
    });

    return recentEstimate;
};

const getRecentBillNumber = async (documentType, outletCode, year) => {
    const recentEstimate = Billings.findOne({
        where: {
            bill_no: {
                [Op.like]: `${documentType}-${outletCode}${year}%`
            }
        },
        order: [["createdAt", "DESC"]],
    });

    return recentEstimate;
};

const getRecentFOCLabourNumber = async (outlet, year) => {
    const recentEstimate = await Billings.findOne({
        where: {
            foc_labor_bill_no: {
                [Op.like]: `SEREXPINV-${outlet}${year}%`
            }
        },
        order: [["createdAt", "DESC"]],
    });

    return recentEstimate;
};

const getRecentFOCPartNumber = async (outlet, year) => {
    const recentEstimate = await Billings.findOne({
        where: {
            foc_parts_bill_no: {
                [Op.like]: `SPAEXPINV-${outlet}${year}%`
            }
        },
        order: [["createdAt", "DESC"]],
    });

    return recentEstimate;
};

const updateDeliveryNumber = async (reqData, deliveryNumber) => {
    const currentDate = new Date();
    let data = {};
    try {
        const result = await Billings.update(
            {
                delivery_number: deliveryNumber,
                delivery_date: currentDate
            },
            { where: { transaction_id: reqData.id } }
        );

        if (result[0] === 0) {
            logger.info("No record found for the given transaction_id", { transactionId: reqData.id });
        } else {
            logger.info("Updated delivery number successfully", { transactionId: reqData.id, deliveryNumber });
        }
        return result;

    } catch (err) {
        logger.error("Error updating delivery number:", { error: err.stack, transactionId: reqData.id });
        throw new Error("Failed to update delivery number");
    }
};


const getGatePassData = async (jobcardNo) => {
    try {

        // let sqlQry = 'select * from billings b'
        //     + ' left outer join transactions t on b.transaction_id= t.id'
        //     + ' left outer join vehicles veh on t.vehicle_id=veh.id'
        //     + ' left outer join models m on veh.modelId=m.id'
        //     + ' where b.jobcard_no = :jobcardNo';

        // const [results, metadata] = await sequelize.query(sqlQry, {
        //     replacements: { jobcardNo }
        // });
        const data = await Billings.findOne({
            where: {
                jobcard_no: jobcardNo
            },
            include: [
                {
                    model: JobCard, as: 'jobcard',
                    include: [
                        {
                            model: Vehicle, as: 'vehicle',
                            include: [
                                { model: Model, as: 'model', attributes: ['modelName'] },
                                { model: Make, as: 'make', attributes: ['makeName'] },
                            ],
                        },
                        {
                            model: Outlets, as: 'outlet'
                        }
                    ]
                },
            ],
            orderBy: ['createdAt', 'DESC']
        })
        return data;
    } catch (err) {
        logger.error("JobCard dao getGatePassData", err);
    }
}

const getJobCardForOutlet = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
            ]
        } : {};
        const userCondition = { outlet_id: user.outlet.id, status: { [Op.or]: [1, 2, 3] } };
        const data = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            attributes: ["job_card_no", "reg_no", "status_value", "id", "customer_state", "part_approve", "customer_name"],
            include: [
                {
                    model: Vehicle, as: "vehicle", attributes: ["chassisNumber","fuelType","engineNumber"],
                    include: [{ model: Model, as: 'model', attributes: ['modelName'] },
                    { model: Make, as: 'make', attributes: ['makeName'] },
                    ]
                },
                {
                    model: source, as: "sources", attributes: ["sourceName"]
                },
                {
                    model: Enquiry, as: "enquiries", attributes: ["id", "enquiry_no"]
                }

            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        })
        let count = await JobCard.count({ where: userCondition })

        return { data, count };
    } catch (err) {
        logger.error("JobCard dao getJobCardForOutlet", err);
    }
}

const addInsuranceAddress = async (insuranceAddress, userId) => {
    try {
        return await InsuranceAddress.create({
            insuranceProviderId: insuranceAddress.insuranceProviderId,
            insuranceProviderName: insuranceAddress.insuranceProviderName,
            gstin: insuranceAddress.gstin,
            pincode: insuranceAddress.pincode,
            state: insuranceAddress.state,
            city: insuranceAddress.city,
            address: insuranceAddress.address,
            createdBy: userId
        });
    } catch (err) {
        logger.error('JobCard dao addInsuranceAddress Error:', err);
        next(err);
    }
}

const addInsurance = async (insurance, userId) => {
    let addr = "";
    try {
        if (insurance.isNewAddress === 0) {
            addr = insurance.address;
        } else if (insurance.isNewAddress === 1) {
            addr = insurance.newAddress;
            await addNewAddress(insurance, userId);
        }
        return await TransactionInsurance.create({
            transaction_id: insurance.transactionId,
            insurance_provider_id: insurance.provider.id,
            insurance_provider_name: insurance.provider.insuranceName,
            insurance_state: insurance.customerState,
            insurance_city: insurance.customerCity,
            insurance_pincode: insurance.pincode,
            insurance_address: addr,
            insurance_area_name: insurance.areaName || null,
            gstin_number: insurance.gstinNumber,
            idv_value: insurance.idvValue,
            policy_no: insurance.policyNo,
            policy_exp_date: insurance.policyExpDate ? insurance.policyExpDate : null,
            claim_no: insurance.claimNo,
            surveyor_name: insurance.surveyorName,
            surveyor_mob: insurance.surveyorMobileNo,
            surveyor_email: insurance.surveyorEmail,
            surveyor_intimate_date: insurance.surveyorIntimatedDateTime ? insurance.surveyorIntimatedDateTime : null,
            surveyor_proposed_date: insurance.surveyorProposedDateTime ? insurance.surveyorProposedDateTime : null,
            surveyor_visited_date: insurance.surveyorVisitedDateTime ? insurance.surveyorVisitedDateTime : null,
            estimated_cost: insurance.estimatedCost,
            surveyor_approved_date: insurance.surveyorApprovedDateTime ? insurance.surveyorApprovedDateTime : null,
            status: insurance.status,
            createdBy: userId
        });
    } catch (err) {
        logger.error('JobCard dao addInsurance Error:', err);
        next(err);
    }
}

const addDirectInsurance = async (insurance, userId) => {
    let addr = "";
    try {
        return await TransactionInsurance.create({
            transaction_id: insurance.transactionId,
            insurance_provider_id: null,
            insurance_provider_name: null,
            insurance_state: null,
            insurance_city: null,
            insurance_pincode: null,
            insurance_address: null,
            insurance_area_name: null,
            gstin_number: null,
            idv_value: null,
            policy_no: null,
            policy_exp_date: insurance.policyExpDate ? insurance.policyExpDate : null,
            claim_no: null,
            surveyor_name: null,
            surveyor_mob: null,
            surveyor_email: null,
            surveyor_intimate_date: insurance.surveyorIntimatedDateTime ? insurance.surveyorIntimatedDateTime : null,
            surveyor_proposed_date: insurance.surveyorProposedDateTime ? insurance.surveyorProposedDateTime : null,
            surveyor_visited_date: insurance.surveyorVisitedDateTime ? insurance.surveyorVisitedDateTime : null,
            estimated_cost: null,
            surveyor_approved_date: insurance.surveyorApprovedDateTime ? insurance.surveyorApprovedDateTime : null,
            status: insurance.status,
            createdBy: userId
        });
    } catch (err) {
        logger.error('JobCard dao addInsurance Error:', err);
        next(err);
    }
}



const getInsuranceDetailByTransId = async (transId) => {
    let data = {};
    try {
        data = TransactionInsurance.findOne({
            where: { transaction_id: transId }
        });
    } catch (err) {
        logger.error('JobCard dao getInsuranceDetailByTransId Error:', err);
        next(err);
    }
    return data;
}

const listInsuranceAddresses = async (reqData) => {
    try {
        const whereCondition = {};
        if (reqData.pincode) {
            whereCondition.pincode = reqData.pincode;
        }
        if (reqData.provider) {
            whereCondition.insuranceProviderName = reqData.provider.insuranceName;
        }
        const data = await InsuranceAddress.findAll({
            where: whereCondition
        });
        return data;
    } catch (err) {
        logger.error('JobCard dao listInsuranceAddresses Error:', err);
        next(err);
    }
}

const addNewAddress = async (insuranceAddress, userId) => {
    try {
        return await InsuranceAddress.create({
            insuranceProviderId: insuranceAddress.provider.id,
            insuranceProviderName: insuranceAddress.provider.insuranceName,
            gstin: insuranceAddress.gstinNumber,
            pincode: insuranceAddress.pincode,
            state: insuranceAddress.customerState,
            city: insuranceAddress.customerCity,
            address: insuranceAddress.newAddress,
            createdBy: userId
        });
    } catch (err) {
        logger.error('JobCard dao addNewAddress Error:', err);
        next(err);
    }
}


const updatePaidStatus = async (id, status) => {
    let data = {};
    try {
        data = await JobCard.update(
            {
                paid_by_status: status,
            },
            { where: { id: id } }
        );
    } catch (err) {
        logger.error('JobCard dao updatePaidStatus Error:', err);
        next(err);
    }

    return data;
}

const getInsurance = async (transactionId) => {
    try {
        const rows = await TransactionInsurance.findOne({
            where: {
                transaction_id: transactionId
            },
            include: [
                { model: JobCard, as: 'jobcard' }
            ]
        });
        return rows;
    } catch (err) {
        logger.error("JobCard dao getInsurance", err);
    }
};

const getInsuranceData = async (jobcardNo) => {
    try {

        let sqlQry = 'select * from billings b'
            + ' left outer join transactions t on b.transaction_id= t.id'
            + ' left outer join vehicles veh on t.vehicle_id=veh.id'
            + ' left outer join models m on veh.modelId=m.id'
            + ' where b.jobcard_no = :jobcardNo';

        const [results, metadata] = await sequelize.query(sqlQry, {
            replacements: { jobcardNo }
        });
        return results;
    } catch (err) {
        logger.error("JobCard dao getInsuranceData", err);
    }
}

const getTransaction = async (id) => {
    try {
        const rows = await JobCard.findOne({
            where: { id: id },
            attributes: ['id', ['paid_by_status', 'status_new'], ['status', 'transaction_status']]
        });
        return rows;
    } catch (err) {
        logger.error(
            "JobCard dao getTransaction",
            err
        );
        console.log(err);
    }
};

const getTransactionDetails = async (id) => {
    try {
        const rows = await JobCard.findOne({
            where: { id: id },
            raw: true
        });

        return rows;
    } catch (err) {
        logger.error(
            "JobCard dao getTransaction",
            err
        );
        console.log(err);
    }
};

const updateJobCardInsurance = async (insurance, userId) => {

    // console.log("insurance data in dao------------------", insurance);
    let addr = "";
    try {
        if (insurance.isNewAddress === 0) {
            addr = insurance.address;
        } else if (insurance.isNewAddress === 1) {
            addr = insurance.newAddress;
            await addNewAddress(insurance, userId);
        }
        return await TransactionInsurance.update({
            transaction_id: insurance.transactionId,
            insurance_provider_id: insurance.provider.id,
            insurance_provider_name: insurance.provider.insuranceName,
            insurance_state: insurance.customerState,
            insurance_city: insurance.customerCity,
            insurance_pincode: insurance.pincode,
            insurance_address: addr,
            insurance_area_name: insurance.areaName || null,
            gstin_number: insurance.gstinNumber,
            idv_value: insurance.idvValue,
            policy_no: insurance.policyNo,
            policy_exp_date: insurance.policyExpDate ? insurance.policyExpDate : null,
            claim_no: insurance.claimNo,
            surveyor_name: insurance.surveyorName,
            surveyor_mob: insurance.surveyorMobileNo,
            surveyor_email: insurance.surveyorEmail,
            surveyor_intimate_date: insurance.surveyorIntimatedDateTime ? insurance.surveyorIntimatedDateTime : null,
            surveyor_proposed_date: insurance.surveyorProposedDateTime ? insurance.surveyorProposedDateTime : null,
            surveyor_visited_date: insurance.surveyorVisitedDateTime ? insurance.surveyorVisitedDateTime : null,
            estimated_cost: insurance.estimatedCost,
            surveyor_approved_date: insurance.surveyorApprovedDateTime ? insurance.surveyorApprovedDateTime : null,
            status: insurance.status,
            updatedBy: userId
        }, { where: { transaction_id: insurance.transactionId } });
    } catch (err) {
        logger.error('JobCard dao addInsurance Error:', err);
        next(err);
    }
}

const updateJobCardDirectInsurance = async (insurance, userId) => {
    let addr = "";
    try {
        return await TransactionInsurance.update({
            transaction_id: insurance.transactionId,
            insurance_provider_id: null,
            insurance_provider_name: null,
            insurance_state: null,
            insurance_city: null,
            insurance_pincode: null,
            insurance_address: null,
            insurance_area_name: null,
            gstin_number: null,
            idv_value: null,
            policy_no: null,
            policy_exp_date: insurance.policyExpDate ? insurance.policyExpDate : null,
            claim_no: null,
            surveyor_name: null,
            surveyor_mob: null,
            surveyor_email: null,
            surveyor_intimate_date: insurance.surveyorIntimatedDateTime ? insurance.surveyorIntimatedDateTime : null,
            surveyor_proposed_date: insurance.surveyorProposedDateTime ? insurance.surveyorProposedDateTime : null,
            surveyor_visited_date: insurance.surveyorVisitedDateTime ? insurance.surveyorVisitedDateTime : null,
            estimated_cost: null,
            surveyor_approved_date: insurance.surveyorApprovedDateTime ? insurance.surveyorApprovedDateTime : null,
            status: insurance.status,
            updatedBy: userId
        }, { where: { transaction_id: insurance.transactionId } });
    } catch (err) {
        logger.error('JobCard dao addInsurance Error:', err);
        next(err);
    }
}

const getInsuranceById = async (id) => {
    try {
        const rows = await TransactionInsurance.findOne({
            where: {
                id: id
            },
        });
        return rows;
    } catch (err) {
        logger.error("JobCard dao getInsuranceById", err);
    }
};

const deleteJobCardInsurance = async (id) => {
    let data = {};
    try {
        data = await TransactionInsurance.destroy({
            where: {
                id: id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteLaborSchedules", err);
    }
    return data;
};

const getOutletByEmpId = async (id) => {
    try {
        const rows = await employeeOutletMap.findOne({
            where: {
                id: id
            },
        });
        return rows;
    } catch (err) {
        logger.error("JobCard dao getInsuranceById", err);
    }
};

const getJobCardStatusReportData = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';
        let queryOptions = {};
        if (user.reportAccess == 1) {

            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: Vehicle,
                        as: "vehicle",
                        include: [
                            { model: Model, as: 'model', attributes: ['modelName'] },
                            { model: Make, as: 'make', attributes: ['makeName'] }
                        ],
                        attributes: ['engineNumber', 'chassisNumber']
                    },
                    {
                        model: RepairType,
                        as: 'repairtype',
                        attributes: ['repairTypeName']
                    },
                    {
                        model: DsaAgent,
                        as: 'dsaagent',
                        attributes: ['dsaCode', 'dsaName', 'mobileNumber']
                    },
                    {
                        model: source,
                        as: 'sources',
                        attributes: ['sourceName']
                    },
                    {
                        model: Sourcetypes,
                        as: 'sourcetype',
                        attributes: ['sourceTypeName']
                    },
                    {
                        model: Servicetypes,
                        as: 'servicetype',
                        attributes: ['serviceTypeName']
                    },
                    {
                        model: TransactionInsurance,
                        as: 'insurance',
                        attributes: ['insurance_provider_name', 'gstin_number', 'claim_no', 'estimated_cost', 'surveyor_visited_date', 'surveyor_approved_date']
                    },
                    {
                        model: Billings,
                        as: 'billing',
                        attributes: ['delivery_date', 'createdAt', 'parts_amount', 'labor_amount']
                    },
                    {
                        model: Users,
                        as: "user",
                        include: [
                            { model: Employees, as: 'employee', attributes: ['employeeName'] }
                        ],
                        attributes: ['user_id']
                    },
                    {
                        model: Schedules,
                        as: "schedules",
                    },
                    {
                        model: OslSchedules,
                        as: "oslSchedules",
                    },
                    {
                        model: PartsIndent,
                        as: "partsIndent",
                    },
                ]
            };

        } else {

            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: Vehicle,
                        as: "vehicle",
                        include: [
                            { model: Model, as: 'model', attributes: ['modelName'] },
                            { model: Make, as: 'make', attributes: ['makeName'] }
                        ],
                        attributes: ['engineNumber', 'chassisNumber']
                    },
                    {
                        model: RepairType,
                        as: 'repairtype',
                        attributes: ['repairTypeName']
                    },
                    {
                        model: DsaAgent,
                        as: 'dsaagent',
                        attributes: ['dsaCode', 'dsaName', 'mobileNumber']
                    },
                    {
                        model: source,
                        as: 'sources',
                        attributes: ['sourceName']
                    },
                    {
                        model: Sourcetypes,
                        as: 'sourcetype',
                        attributes: ['sourceTypeName']
                    },
                    {
                        model: Servicetypes,
                        as: 'servicetype',
                        attributes: ['serviceTypeName']
                    },
                    {
                        model: TransactionInsurance,
                        as: 'insurance',
                        attributes: ['insurance_provider_name', 'gstin_number', 'claim_no', 'estimated_cost', 'surveyor_visited_date', 'surveyor_approved_date']
                    },
                    {
                        model: Billings,
                        as: 'billing',
                        attributes: ['delivery_date', 'createdAt', 'parts_amount', 'labor_amount']
                    },
                    {
                        model: Users,
                        as: "user",
                        include: [
                            { model: Employees, as: 'employee', attributes: ['employeeName'] }
                        ],
                        attributes: ['user_id']
                    },
                    {
                        model: Schedules,
                        as: "schedules",
                    },
                    {
                        model: OslSchedules,
                        as: "oslSchedules",
                    },
                    {
                        model: PartsIndent,
                        as: "partsIndent",
                    },
                ]
            };

        }



        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$reg_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$job_card_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$customer_name$': { [Op.like]: `%${searchKey}%` } },
                    { '$customer_mobileNumber$': { [Op.like]: `%${searchKey}%` } },
                ];
            }
        }

        const rows = await JobCard.findAll(queryOptions);

        return {
            totalItems: rows.length, rows: rows
        };
    } catch (err) {
        logger.error("Job Card dao getJobCardStatusReportData", err);
        console.log(err);
    }
};

// Gate IN - Gate OUT report (ported from legacy tvsfitpv_new
// finance_gatein_gateout_report_new_booking). Re-anchored on transactions
// (job cards): a Company is selected -> its outlets (outlet.companyId) ->
// job cards where outlet_id IN (those outlets) within the date range.
const getGateInGateOutReportData = async (reqData, user) => {
  try {
    const startDate = reqData.startDate + ' 00:00:00';
    const endDate = reqData.endDate + ' 23:59:59';

    // Resolve the outlets that belong to the selected company. Accept an
    // explicit outletIds list too (falls back to companyId lookup).
    let outletIds = Array.isArray(reqData.outletIds) ? reqData.outletIds : [];
    if (!outletIds.length && reqData.companyId) {
      const outlets = await Outlets.findAll({
        where: { companyId: reqData.companyId },
        attributes: ['id'],
        raw: true,
      });
      outletIds = outlets.map((o) => o.id);
    }
    if (!outletIds.length) {
      return { totalItems: 0, rows: [] };
    }

    // Outlet code/city map (cols B/C) keyed by outlet id.
    const outletMap = {};
    const outletRows = await Outlets.findAll({
      where: { id: { [Op.in]: outletIds } },
      attributes: ['id', 'outletCode', 'city'],
      raw: true,
    });
    outletRows.forEach((o) => {
      outletMap[o.id] = { outletCode: o.outletCode, city: o.city };
    });

    // Base = service bookings in the date range for these outlets (legacy parity:
    // finance_gatein_gateout_report_new_booking anchored on service_bookings and
    // filtered on ServiceBooking.created). Estimate / job card are LEFT-joined on top,
    // so every row carries booking details.
    const bookingWhere = {
      outletId: { [Op.in]: outletIds },
      createdAt: { [Op.between]: [startDate, endDate] },
    };
    const searchKey = reqData.searchKey ? reqData.searchKey.trim() : '';
    if (searchKey) {
      bookingWhere[Op.or] = [
        { serviceBookingNumber: { [Op.like]: `%${searchKey}%` } },
        { registrationNumber: { [Op.like]: `%${searchKey}%` } },
      ];
    }
    const bookings = await ServiceBooking.findAll({
      where: bookingWhere,
      order: [['id', 'DESC']],
      attributes: [
        'id', 'serviceBookingNumber', 'status', 'createdAt', 'outletId', 'registrationNumber',
        'pickup_driver_id', 'dropoff_driver_id', 'pickup_date', 'drop_off_date',
        'fit_driver_pickup_start_date', 'fit_driver_pickup_date',
        'fit_driver_pcikup_outlet_date', 'fit_driver_dropoff_cus_date',
      ],
      raw: true,
    });
    if (!bookings.length) {
      return { totalItems: 0, rows: [] };
    }
    const bookingIds = bookings.map((b) => b.id);

    // Estimates for those bookings, grouped by serviceBookingId.
    const estimates = await ServiceEstimate.findAll({
      where: { serviceBookingId: { [Op.in]: bookingIds } },
      attributes: ['id', 'serviceBookingId', 'serviceEstimateNumber', 'createdAt', 'gatein_date_time', 'registrationNumber'],
      order: [['id', 'ASC']],
      raw: true,
    });
    const estByBooking = {};
    const estimateIds = [];
    estimates.forEach((e) => {
      (estByBooking[e.serviceBookingId] = estByBooking[e.serviceBookingId] || []).push(e);
      estimateIds.push(e.id);
    });

    // Job cards for those estimates (with the includes the column mapping needs),
    // grouped by service_estimate_id.
    const txnByEstimate = {};
    if (estimateIds.length) {
      const txns = await JobCard.findAll({
        where: { service_estimate_id: { [Op.in]: estimateIds } },
        order: [['id', 'DESC']],
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'registrationNumber'],
            include: [
              { model: Make, as: 'make', attributes: ['makeName'] },
              { model: Model, as: 'model', attributes: ['modelName'] },
            ],
          },
          { model: Billings, as: 'billing', attributes: ['createdAt', 'delivery_date'] },
          {
            model: Users,
            as: 'user',
            attributes: ['user_id'],
            include: [{ model: Employees, as: 'employee', attributes: ['employeeName'] }],
          },
          { model: Schedules, as: 'schedules', attributes: ['createdAt', 'approveDatetime'] },
          { model: OslSchedules, as: 'oslSchedules', attributes: ['createdAt', 'approveDatetime'] },
          { model: PartsIndent, as: 'partsIndent', attributes: ['createdAt', 'approveDatetime'] },
          { model: PartsIssue, as: 'partsIssue', attributes: ['createdAt'] },
        ],
      });
      txns.forEach((t) => {
        const p = t.get({ plain: true });
        (txnByEstimate[p.service_estimate_id] = txnByEstimate[p.service_estimate_id] || []).push(p);
      });
    }

    // Driver id -> "first last" map (mirrors legacy $findAllDriver). Wrapped
    // defensively: if the bridged driver_masters table is absent, the report
    // still renders with blank driver names instead of failing entirely.
    const driverMap = {};
    try {
      const drivers = await DriverMaster.findAll({
        attributes: ['id', 'first_name', 'last_name'],
        raw: true,
      });
      drivers.forEach((d) => {
        driverMap[d.id] = `${d.first_name || ''} ${d.last_name || ''}`.trim();
      });
    } catch (driverErr) {
      logger.error('JobCard dao getGateInGateOutReportData driverMap', driverErr);
    }

   
    const todayEnd = moment().format('YYYY-MM-DD') + ' 23:59:59';

    // Assemble rows: booking × estimate × job card (LEFT-join style). A booking with
    // no estimate, or an estimate with no job card, still produces a row so every row
    // carries booking details (matches legacy's service_bookings-anchored output).
    const assembled = [];
    for (const booking of bookings) {
      const ests = estByBooking[booking.id] || [null];
      for (const est of ests) {
        const txns = est && txnByEstimate[est.id] ? txnByEstimate[est.id] : [null];
        for (const txn of txns) {
          const row = Object.assign({}, txn || {});
          row.serviceBooking = booking;
          row.serviceEstimate = est || null;
          const om = outletMap[booking.outletId] || {};
          row.outlet = { city: om.city || '' };
          row.outlet_code = om.outletCode || (txn && txn.outlet_code) || '';
          row.reg_no = (txn && txn.reg_no) || (est && est.registrationNumber) || booking.registrationNumber || '';
          row._pickupDriverName = booking.pickup_driver_id ? (driverMap[booking.pickup_driver_id] || '') : '';
          row._dropoffDriverName = booking.dropoff_driver_id ? (driverMap[booking.dropoff_driver_id] || '') : '';
          row._casualDate = '';
          assembled.push(row);
        }
      }
    }

    // Casual gatepass date (col AJ): per row, reg_no + created window
    // [row date 00:00:00 .. today 23:59:59], earliest (legacy find('first')).
    await Promise.all(
      assembled.map(async (row) => {
        const rowDate = row.createdAt || (row.serviceBooking && row.serviceBooking.createdAt);
        if (row.reg_no && rowDate) {
          const fromCas = moment(rowDate).format('YYYY-MM-DD') + ' 00:00:00';
          const casual = await CasualGatePass.findOne({
            where: { reg_no: row.reg_no, createdAt: { [Op.between]: [fromCas, todayEnd] } },
            order: [['id', 'ASC']],
            attributes: ['createdAt'],
            raw: true,
          });
          if (casual) row._casualDate = casual.createdAt;
        }
      })
    );

    return { totalItems: assembled.length, rows: assembled };
  } catch (err) {
    logger.error('JobCard dao getGateInGateOutReportData', err);
    console.log(err);
  }
};

const getWipStatusReportData = async (reqData, user, type) => {

    try {

        // const startDate = reqData.startDate + ' 00:00:00';
        // const endDate = reqData.endDate + ' 23:59:59';
        const limit = type === 1 ? Number.MAX_SAFE_INTEGER : reqData.limit;
        const offset = type === 1 ? 0 : reqData.offset;
        const searchKey = type === 1 ? "" : reqData.searchKey;

        let queryOptions = {};

        // if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    status: {
                        [Op.in]: [1, 2, 3]
                    },
                    // createdAt: {
                    //     [Op.between]: [startDate, endDate]
                    // },
                    [Op.or]: [
                        { customer_name: { [Op.like]: `%${searchKey}%` } },
                        { customer_mobileNumber: { [Op.like]: `%${searchKey}%` } },
                        { job_card_no: { [Op.like]: `%${searchKey}%` } }
                    ]
                },
                order: [["id", "DESC"]],
                // offset,
                // limit,
                include: [
                    {
                        model: Vehicle, as: "vehicle",
                        include: [
                            { model: Model, as: 'model' },
                            { model: Make, as: 'make' },
                        ]
                    },
                    { model: source, as: 'sources' },
                    { model: Sourcetypes, as: 'sourcetype' },
                    { model: TransactionInsurance, as: 'insurance' },
                    { model: RepairType, as: 'repairtype' },
                    { model: Servicetypes, as: 'servicetype' },
                    { model: Billings, as: 'billing' },
                    { model: Outlets, as: 'outlet' },
                    { model: Schedules, as: 'schedules' },
                    { model: OslSchedules, as: 'oslSchedules' },
                    { model: PartsIssue, as: 'partsIssue' },
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    status: {
                        [Op.in]: [1, 2, 3]
                    },
                    // createdAt: {
                    //     [Op.between]: [startDate, endDate]
                    // },
                    [Op.or]: [
                        { customer_name: { [Op.like]: `%${searchKey}%` } },
                        { customer_mobileNumber: { [Op.like]: `%${searchKey}%` } },
                        { job_card_no: { [Op.like]: `%${searchKey}%` } }
                    ]
                },
                order: [["id", "DESC"]],
                // offset,
                // limit,
                include: [
                    {
                        model: Vehicle, as: "vehicle",
                        include: [
                            { model: Model, as: 'model' },
                            { model: Make, as: 'make' },
                        ]
                    },
                    { model: source, as: 'sources' },
                    { model: Sourcetypes, as: 'sourcetype' },
                    { model: TransactionInsurance, as: 'insurance' },
                    { model: RepairType, as: 'repairtype' },
                    { model: Servicetypes, as: 'servicetype' },
                    { model: Billings, as: 'billing' },
                    { model: Outlets, as: 'outlet' },
                    { model: Schedules, as: 'schedules' },
                    { model: OslSchedules, as: 'oslSchedules' },
                ]
            };
        }

        const totalItems = await JobCard.count(queryOptions);

        const rows = await JobCard.findAll(queryOptions);

        return {
            totalItems: totalItems,
            rows: rows
        };

    } catch (err) {
        logger.error("Job Card dao getWipStatusReportData", err);
        console.log(err);
    }
};


// const getJobCardDetails = async (id) => {
//     try {
//         const rows = await JobCard.findAll({
//             include: [

//                 { model: PartsIndent, as: "partsIndent",
//                     include: [ {model: Items, as: 'items',attributes:["hsnCode"],include:[{model:Stocks,as:"stocks",attributes:["quantity"]}]}]  }
//             ],
//             where: { id: id },
//             attributes:[],
//             raw:true
//         });
//         console.log(rows,"rows")
//         return rows;
//     } catch (err) {
//         logger.error(
//             "JobCard dao getJobCard",
//             err
//         );
//         console.log(err);
//     }
// };
const getJobCardDetails = async (id, user) => {
    try {
        const query = `
            WITH first_stock AS (
    SELECT 
        s.item_id, 
        s.outlet_id,
        ROUND(s.rate, 2) AS rate,
        ROUND(s.cost, 2) AS cost,
        ROUND(s.mrp, 2) AS mrp,
        ROW_NUMBER() OVER (PARTITION BY s.item_id, s.outlet_id ORDER BY s.id) AS rn
    FROM stocks s
)
SELECT 
    partsIndent.*,
    items.hsnCode,
    items.taxPercentage,
    COALESCE(MAX(fs.rate), 0) AS rate, 
    COALESCE(MAX(fs.cost), 0) AS cost, 
    COALESCE(MAX(fs.mrp), 0) AS mrp,
    COALESCE(SUM(stocks.quantity), 0) AS quantity
FROM transactions AS transaction
INNER JOIN parts_indent AS partsIndent 
    ON transaction.id = partsIndent.transaction_id
LEFT JOIN items AS items 
    ON partsIndent.item_id = items.id
LEFT JOIN stocks 
    ON items.id = stocks.item_id AND stocks.outlet_id = :outletid
LEFT JOIN first_stock fs 
    ON items.id = fs.item_id AND fs.outlet_id = :outletid AND fs.rn = 1
WHERE transaction.id = :id
  AND (partsIndent.received_quantity IS NULL OR partsIndent.received_quantity = 0)
GROUP BY partsIndent.id, partsIndent.transaction_id, partsIndent.item_id, items.id;

        `;

        const rows = await sequelize.query(query, {
            replacements: { id, outletid: user.outlet.id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;
    } catch (err) {
        console.error("Error in getTransactionDetails:", err);
    }
};

const getBillReportData = async (reqData, user, type) => {
    try {

        const startDate = reqData?.startDate + ' 00:00:00';
        const endDate = reqData?.endDate + ' 23:59:59';
        const limit = type === 1 ? Number.MAX_SAFE_INTEGER : reqData.limit;
        const offset = type === 1 ? 0 : reqData.offset;
        const searchKey = type === 1 ? "" : reqData.searchKey;

        let queryOptions = {};

        // if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    jobcard_no: { [Op.like]: `%${searchKey}%` },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    }
                },
                order: [["id", "DESC"]],
                // limit,
                // offset,
                include: [
                    {
                        model: JobCard, as: "jobcard",
                        include: [
                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Model, as: 'model' },
                                    { model: Make, as: 'make' },
                                ]
                            },
                            { model: TransactionInsurance, as: 'insurance' },
                            {
                                model: Schedules, as: 'schedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: OslSchedules, as: 'oslSchedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: PartsIssue, as: 'partsIssue',
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'payment_id',
                                            'txnid',
                                            'advance_amount',
                                            'payment_response',
                                            'payment_date',
                                            'payment_remarks',
                                            'bookingId',
                                            'b2bBookingId'
                                        ]
                                    }
                                ]
                            },
                            {
                                model: Receipt,
                                as: "receipts",
                                attributes: ['doc_no'],
                                where: {
                                    receipt_type: {
                                        [Op.ne]: 5
                                    }
                                },
                                required: false
                            }
                        ]
                    }
                ]
            };
        } else {
            queryOptions = {
                where: {
                    jobcard_no: { [Op.like]: `%${searchKey}%` },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    created_by: user.id,
                },
                // raw: true,
                order: [["id", "DESC"]],
                // limit,
                // offset,
                include: [
                    {
                        model: JobCard, as: "jobcard",
                        include: [
                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Model, as: 'model' },
                                    { model: Make, as: 'make' },
                                ]
                            },
                            { model: TransactionInsurance, as: 'insurance' },
                            {
                                model: Schedules, as: 'schedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: OslSchedules, as: 'oslSchedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: PartsIssue, as: 'partsIssue',
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                            },
                            // { model: PartsIndent, as: 'partsIndent' },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                    'driverMobileNumber',
                                    'driverName'
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'payment_id',
                                            'txnid',
                                            'advance_amount',
                                            'payment_response',
                                            'payment_date',
                                            'payment_remarks',
                                            'bookingId',
                                            'b2bBookingId'
                                        ]
                                    }
                                ]
                            },
                            {
                                model: Receipt,
                                as: "receipts",
                                attributes: ['doc_no'],
                                where: {
                                    receipt_type: {
                                        [Op.ne]: 5
                                    }
                                },
                                required: false
                            }
                        ]
                    }
                ]
            };
        }

        // const totalItems = await Billings.count(queryOptions);

        const rows = await Billings.findAll(queryOptions);

        const totalItems = rows.length;
        return {
            totalItems: totalItems,
            rows: rows
        };
    } catch (err) {
        logger.error("Job Card dao getBillReportData", err);
        console.log(err);
    }
};

// JC Bill Summary Split-Up (for /JobCardBillSummarySplitUp). Same include tree as
// getBillReportData, but the new-DMS conditions: billings.createdAt in range,
// billings.outlet_id IN (mapped outlet ids passed from the frontend), and
// billings.transaction_id IS NOT NULL. Adds the outlet include (city/state) and
// returns all receipts (no receipt_type filter) so the service can split LBS vs normal.
const getBillSummarySplitUpData = async (reqData, user, type) => {
    try {
        const startDate = reqData?.startDate + ' 00:00:00';
        const endDate = reqData?.endDate + ' 23:59:59';
        const searchKey = type === 1 ? "" : (reqData.searchKey || "");
        const outletIds = (Array.isArray(reqData.outletIds) && reqData.outletIds.length)
            ? reqData.outletIds
            : [0]; // no mapped outlets -> match nothing

        const where = {
            transaction_id: { [Op.ne]: null },
            createdAt: { [Op.between]: [startDate, endDate] },
            outlet_id: { [Op.in]: outletIds },
        };
        if (type === 2 && searchKey) {
            where.jobcard_no = { [Op.like]: `%${searchKey}%` };
        }

        const rows = await Billings.findAll({
            where,
            order: [["id", "DESC"]],
            include: [
                {
                    model: JobCard, as: "jobcard",
                    include: [
                        {
                            model: Vehicle, as: "vehicle",
                            include: [
                                { model: Model, as: 'model' },
                                { model: Make, as: 'make' },
                            ]
                        },
                        { model: TransactionInsurance, as: 'insurance' },
                        {
                            model: Schedules, as: 'schedules',
                            include: [{ model: LabourSchedules, as: 'labourschedules' }]
                        },
                        {
                            model: OslSchedules, as: 'oslSchedules',
                            include: [{ model: LabourSchedules, as: 'labourschedules' }]
                        },
                        {
                            model: PartsIssue, as: 'partsIssue',
                            include: [{ model: Items, as: 'items' }]
                        },
                        { model: source, as: 'sources', attributes: ['sourceName'] },
                        { model: Sourcetypes, as: 'sourcetype', attributes: ['sourceTypeName'] },
                        { model: RepairType, as: 'repairtype', attributes: ['repairTypeName'] },
                        {
                            model: Users, as: "user",
                            include: [{ model: Employees, as: 'employee', attributes: ['employeeName'] }],
                            attributes: ['user_id']
                        },
                        { model: Outlets, as: 'outlet', attributes: ['outletCode', 'city', 'state'], required: false },
                        {
                            model: Receipt, as: "receipts",
                            attributes: ['doc_no', 'amount', 'receipt_type'],
                            required: false
                        }
                    ]
                }
            ]
        });

        return { totalItems: rows.length, rows };
    } catch (err) {
        logger.error("Job Card dao getBillSummarySplitUpData", err);
        console.log(err);
    }
};

const getJobCardDeliveryReportData = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let queryOptions = {};

        // if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    delivery_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Schedules,
                                as: "schedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'amount', 'discount_percentage']
                            },
                            {
                                model: OslSchedules,
                                as: "oslSchedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'amount']
                            },
                            {
                                model: PartsIssue,
                                as: "partsIssue",
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'total']
                            },
                            // {
                            //     model: PartsIndent,
                            //     as: "partsIndent",
                            //     attributes: ['sgst', 'cgst', 'igst', 'part_total']
                            // },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                    'driverMobileNumber',
                                    'driverName'
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'pickup_driver_id',
                                            'dropoff_driver_id',
                                            'pick_up_address',
                                            'pickup_date',
                                            'drop_off_date'
                                        ]
                                    }
                                ]
                            }
                        ],
                        attributes: ['customer_code', 'customer_name', 'customer_mobileNumber', 'customer_type', 'reg_no', 'customer_gstin', 'outlet_code', 'job_card_no', 'createdAt']
                    },
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    delivery_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Schedules,
                                as: "schedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'amount', 'discount_percentage']
                            },
                            {
                                model: OslSchedules,
                                as: "oslSchedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'amount']
                            },
                            {
                                model: PartsIssue,
                                as: "partsIssue",
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                                //attributes: ['sgst', 'cgst', 'igst', 'total']
                            },
                            // {
                            //     model: PartsIndent,
                            //     as: "partsIndent",
                            //     attributes: ['sgst', 'cgst', 'igst', 'part_total']
                            // },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                    'driverMobileNumber',
                                    'driverName'
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'pickup_driver_id',
                                            'dropoff_driver_id',
                                            'pick_up_address',
                                            'pickup_date',
                                            'drop_off_date'
                                        ]
                                    }
                                ]
                            }
                        ],
                        attributes: ['customer_code', 'customer_name', 'customer_mobileNumber', 'customer_type', 'reg_no', 'customer_gstin', 'outlet_code', 'job_card_no', 'createdAt']
                    }
                ]
            };
        }

        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$jobcard_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$bill_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$delivery_number$': { [Op.like]: `%${searchKey}%` } }
                ];
            }
        }

        const rows = await Billings.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Job Card dao getJobCardDeliveryReportData", err);
        console.log(err);
    }
};

const getWorkOrderReportData = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let queryOptions = {};

        //   if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    status: 2,
                    [Op.and]: literal(`oslschedulesMapping.outlet_id IN (SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId}) AND oslschedulesMapping.status >=4`)
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "oslschedulesMapping",
                        //   where: {
                        //     outlet_id: {
                        //       [Op.in]: literal(
                        //         `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        //       )
                        //     }
                        //   },
                        include: [
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'osl_labor_amount', 'osllabor_taxamount']
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Vehicle,
                                as: "vehicle",
                                include: [
                                    { model: Make, as: 'make', attributes: ['makeName'] },
                                    { model: Model, as: 'model', attributes: ['modelName'] },
                                ],
                                attributes: ['engineNumber', 'chassisNumber']
                            }
                        ],
                        attributes: ['reg_no', 'outlet_code', 'job_card_no', 'createdAt']
                    },
                    {
                        model: Vendor,
                        as: 'vendor',
                        attributes: ['vendorName', 'vendorCode']
                    }
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    status: 2,
                    [Op.and]: literal(`oslschedulesMapping.status >=4`)
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "oslschedulesMapping",
                        include: [
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'osl_labor_amount', 'osllabor_taxamount']
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Vehicle,
                                as: "vehicle",
                                include: [
                                    { model: Make, as: 'make', attributes: ['makeName'] },
                                    { model: Model, as: 'model', attributes: ['modelName'] },
                                ],
                                attributes: ['engineNumber', 'chassisNumber']
                            }
                        ],
                        attributes: ['reg_no', 'outlet_code', 'job_card_no', 'createdAt']
                    },
                    {
                        model: Vendor,
                        as: 'vendor',
                        attributes: ['vendorName', 'vendorCode']
                    },
                    { model: LabourSchedules, as: 'labourschedules' }
                ]
            };
        }

        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$osl_bill_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$rot_code$': { [Op.like]: `%${searchKey}%` } },
                    { '$oslschedulesMapping.job_card_no$': { [Op.like]: `%${searchKey}%` } }
                ];
            }
        }

        const rows = await OslSchedules.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Job Card dao getWorkOrderReportData", err);
        console.log(err);
    }
};


const getRepairOrderReportData = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let queryOptions = {};

        //   if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    //[Op.and]: literal(`oslschedulesMapping.status >=4`)
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Schedules,
                                as: "schedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ],
                                where: {
                                    status: 2
                                }
                            },
                            {
                                model: OslSchedules,
                                as: "oslSchedules",
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ],
                                where: {
                                    status: 2
                                }
                            },
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'osl_labor_amount', 'osllabor_taxamount', 'foc_parts_bill_no', 'foc_labor_bill_no']
                            },
                            {
                                model: Vehicle,
                                as: "vehicle",
                                include: [
                                    { model: Make, as: 'make', attributes: ['makeName'] },
                                    { model: Model, as: 'model', attributes: ['modelName'] },
                                ],
                                attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: transactionUpdate,
                                as: 'transactionupdates',
                                required: false,
                                where: {
                                    bdo_status: 1
                                },
                                attributes: ['transaction_id', 'irn_no', 'invoice_bdoack_no', 'invoice_bdoack_date']
                            },
                        ],
                        attributes: [
                            'document_type', 'customer_code', 'customer_name', 'customer_gstin', 'reg_no',
                            'outlet_code', 'job_card_no', 'createdAt', 'customer_mobileNumber', 'status'
                        ]
                    },
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Schedules,
                                as: "schedules",
                                required: false,
                                where: {
                                    status: 2
                                },
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ],
                            },
                            {
                                model: OslSchedules,
                                as: "oslSchedules",
                                required: false,
                                where: {
                                    status: 2
                                },
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ],
                            },
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'osl_labor_amount', 'osllabor_taxamount', 'foc_parts_bill_no', 'foc_labor_bill_no']
                            },
                            {
                                model: Vehicle,
                                as: "vehicle",
                                include: [
                                    { model: Make, as: 'make', attributes: ['makeName'] },
                                    { model: Model, as: 'model', attributes: ['modelName'] },
                                ],
                                attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: transactionUpdate,
                                as: 'transactionupdates',
                                required: false,
                                where: {
                                    bdo_status: 1
                                },
                                attributes: ['transaction_id', 'irn_no', 'invoice_bdoack_no', 'invoice_bdoack_date']
                            },
                        ],
                        attributes: [
                            'document_type', 'customer_code', 'customer_name', 'customer_gstin', 'reg_no',
                            'outlet_code', 'job_card_no', 'createdAt', 'customer_mobileNumber', 'status'
                        ]
                    },
                ]
            };
        }

        let searchKey;
        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$billings.jobcard_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$billings.bill_no$': { [Op.like]: `%${searchKey}%` } },
                    { '$jobcard.customer_name$': { [Op.like]: `%${searchKey}%` } },
                    { '$jobcard.customer_mobileNumber$': { [Op.like]: `%${searchKey}%` } },
                ];
            }
        }

        const rows = await Billings.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Job Card dao getRepairOrderReportData", err);
        console.log(err);
    }
};


const getEliteBillings = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        const where = {
            createdAt: { [Op.between]: [startDate, endDate] },
            parts_amount: { [Op.ne]: 0 },
        };

        if (user.reportAccess === 1) {
            where.outlet_id = {
                [Op.in]: literal(
                    `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                ),
            };
        } else {
            where.outlet_id = user.outlet?.id;
        }

        if (reqData.searchKey) {
            const searchKey = reqData.searchKey.trim();
            where[Op.or] = [
                { bill_no: { [Op.like]: `%${searchKey}%` } },
                { jobcard_no: { [Op.like]: `%${searchKey}%` } },
                { '$jobcard.customer_name$': { [Op.like]: `%${searchKey}%` } },
                { '$jobcard.customer_mobileNumber$': { [Op.like]: `%${searchKey}%` } },
                { '$jobcard.reg_no$': { [Op.like]: `%${searchKey}%` } },
            ];
        }

        return await Billings.findAll({
            where,
            order: [['id', 'DESC']],
            include: [
                {
                    model: JobCard,
                    as: 'jobcard',
                    attributes: [
                        'id', 'document_type', 'customer_name', 'customer_gstin',
                        'customer_mobileNumber', 'reg_no', 'job_card_no', 'status',
                    ],
                },
            ],
        });
    } catch (err) {
        logger.error('Job Card dao getEliteBillings', err);
    }
};

const getEliteParts = async (transactionId) => {
    try {
        return await PartsIssue.findAll({
            attributes: [
                [fn('SUM', literal('(rate * quantity) - IFNULL(discount, 0)')), 'total_cost'],
                [literal('(sgst + cgst)'), 'sgst_plus_cgst'],
                [col('igst'), 'IGST'],
            ],
            where: {
                transaction_id: transactionId,
                repair_type: { [Op.ne]: 2 },
            },
            group: ['sgst_plus_cgst', 'IGST'],
            having: literal('sgst_plus_cgst IN (5,12,18,28) OR IGST IN (5,12,18,28)'),
            raw: true,
        });
    } catch (err) {
        logger.error('Job Card dao getEliteParts', err);
    }
};

const getEliteSchedules = async (transactionId) => {
    try {
        return await Schedules.findAll({
            where: {
                transaction_id: transactionId,
                status: 2,
                repairTypeId: { [Op.ne]: 2 },
            },
            raw: true,
        });
    } catch (err) {
        logger.error('Job Card dao getEliteSchedules', err);
    }
};

const getEliteOslSchedules = async (transactionId) => {
    try {
        return await OslSchedules.findAll({
            where: {
                transaction_id: transactionId,
                status: 2,
            },
            raw: true,
        });
    } catch (err) {
        logger.error('Job Card dao getEliteOslSchedules', err);
    }
};


const getJobCardData1 = async (jobCardNo) => {
    try {
        return await JobCard.findAll({ where: { job_card_no: jobCardNo } });
    } catch (err) {
        logger.error("Job Card dao getJobCardData", err);
        next(err);
    }
}


const getJobCardData = async (jobCardNo, user) => { 
    try {
        let rows = [];
        const searchKey = jobCardNo;
        const whereCondition = {
            outlet_id: user.outlet.id,
            ...(searchKey && searchKey.length >= 5 ? {
                [Op.or]: [
                    { job_card_no: { [Op.like]: `%${searchKey}%` } }
                ]
            } : {})
        };
        if (searchKey.length >= 5) {
            rows = await JobCard.findAll({
                where: whereCondition,
                order: [['id', 'DESC']],
                // include: [
                //     { model: Billings, as: 'billing',attributes: ['total_amount'], required: false }
                //  ]
            });

            for (const data of rows) {
                let billData = await Billings.findAll({
                    where: { transaction_id: data.id }
                });

                if (billData.length > 0) {
                    data.dataValues['total_amount'] = billData[0].total_amount ?
                        billData[0].total_amount : "";
                };
            };

        } else {
            rows = await JobCard.findAll({
                where: whereCondition,
                order: [['id', 'DESC']]
            });
        };

        return rows;
    } catch (err) {
        logger.error("JobCard dao getJobCardData", err);
        console.log(err)
    }
};

const getReceiptReportData = async (reqData, user) => {

    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let queryOptions = {};

        //   if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'total_amount']
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Outlets, as: 'outlet'
                            }
                        ],
                        attributes: ['reg_no', 'job_card_no', 'createdAt', 'customer_code', 'customer_name', 'customer_type']
                    }
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: "jobcard",
                        include: [
                            {
                                model: Billings,
                                as: 'billing',
                                attributes: ['bill_no', 'createdAt', 'total_amount']
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Outlets, as: 'outlet'
                            }
                        ],
                        attributes: ['reg_no', 'job_card_no', 'createdAt', 'customer_code', 'customer_name', 'customer_type']
                    }
                ]
            };
        }

        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$doc_no$': { [Op.like]: `%${searchKey}%` } }
                ];
            }
        }

        const rows = await Receipt.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Job Card dao getReceiptReportData", err);
        console.log(err);
    }
};

const getServiceBookingReport = async (reqData, user) => {
    try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let queryOptions = {};

        const fieldsToDecrypt = [
            { field: 'customerName', alias: 'decryptedCustomerName' },
            { field: 'customerMobileNumber', alias: 'decryptedCustomerMobileNumber' },
        ];

        const decryptedAttributes = fieldsToDecrypt.map(item => [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(servicebooking.${item.field}), '${encryptConfig.code}') AS CHAR)`),
            item.alias
        ]);

        //   if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outletId: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        ),
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
                order: [['id', 'DESC']],
                include: [
                    { model: DisPosition, as: 'disposition' },
                    { model: Make, as: 'make' },
                    { model: Model, as: 'model' },
                    {
                        model: Vehicle,
                        as: 'vehicle',
                        attributes: [
                            'id',
                            'chassisNumber',
                            'engineNumber',
                        ]
                    },
                    {
                        model: Sourcetypes, as: 'sourcetype',
                        attributes: ['sourceTypeName']
                    },
                    {
                        model: ServiceEstimate,
                        as: 'serviceEstimate',
                        attributes: [
                            'id',
                            'driverName',
                            'driverMobileNumber'
                        ],
                    }
                ],
                attributes: [
                    'id',
                    'serviceBookingNumber',
                    'status',
                    'registrationNumber',
                    [db.sequelize.col('servicebooking.customerName'), 'customerName'],
                    [db.sequelize.col('servicebooking.customerMobileNumber'), 'customerMobileNumber'],
                    [db.sequelize.col('servicebooking.createdAt'), 'createdAt'],
                    'phoneCallNotes',
                    'scheduledStartDate',
                    'scheduledEndDate',
                    'status',
                    'pickup_date',
                    'pick_up_address',
                    ...decryptedAttributes
                ],
            };
        } else {
            queryOptions = {
                where: {
                    createdby: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
                order: [['id', 'DESC']],
                include: [
                    { model: DisPosition, as: 'disposition' },
                    { model: Make, as: 'make' },
                    { model: Model, as: 'model' },
                    {
                        model: Vehicle,
                        as: 'vehicle',
                        attributes: [
                            'id',
                            'chassisNumber',
                            'engineNumber',
                        ]
                    },
                    {
                        model: Sourcetypes, as: 'sourcetype',
                        attributes: ['sourceTypeName']
                    },
                    {
                        model: ServiceEstimate,
                        as: 'serviceEstimate',
                        attributes: [
                            'id',
                            'driverName',
                            'driverMobileNumber'
                        ],
                    }
                ],
                attributes: [
                    'serviceBookingNumber',
                    'status',
                    'registrationNumber',
                    [db.sequelize.col('servicebooking.customerName'), 'customerName'],
                    [db.sequelize.col('servicebooking.customerMobileNumber'), 'customerMobileNumber'],
                    [db.sequelize.col('servicebooking.createdAt'), 'createdAt'],
                    'phoneCallNotes',
                    'scheduledStartDate',
                    'scheduledEndDate',
                    'status',
                    'pickup_date',
                    'pick_up_address',
                    ...decryptedAttributes
                ],
            };
        }

        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { serviceBookingNumber: { [Op.like]: `%${searchKey}%` } },
                    { registrationNumber: { [Op.like]: `%${searchKey}%` } },
                    { customerMobileNumber: { [Op.like]: `%${searchKey}%` } },
                    { customerName: { [Op.like]: `%${searchKey}%` } },
                ];
            }
        };

        //   const totalItems = await ServiceBooking.count(queryOptions);
        const data = await ServiceBooking.findAll(queryOptions);

        return {
            totalItems: data.length,
            rows: data
        };

    } catch (err) {
        logger.error('ServiceBooking dao exportServiceBookings Error:', err);
        next(err);
    }
};


// const vehicleHistory = async (reqData, user) => {
//     try {
//         const searchCondition = reqData ? {
//             reg_no: reqData.registrationNumber
//         } : {};
//         const userCondition = {
//             created_by: user.id, status:
//             {
//                 [Op.in]: [1, 2, 3, 4, 5, 6, 7]
//             }
//         };
//         const rows = await JobCard.findAll({
//             where: { ...searchCondition, ...userCondition },
//             order: [["id", "DESC"]],
//             include: [
//                 { model: Schedules, as: "schedules" },
//                 { model: OslSchedules, as: "oslSchedules" },
//                 { model: PartsIndent, as: "partsIndent" },
//                 { model: PartsIssue, as: "partsIssue" },
//                 {
//                     model: Vehicle,
//                     as: 'vehicle',
//                     attributes: ['chassisNumber'],
//                     include: [
//                         { model: Model, as: 'model', attributes: ['modelName'] },
//                         { model: Make, as: 'make', attributes: ['makeName'] },
//                     ],
//                 },
//                 {
//                     model: Sourcetypes, as: 'sourcetype',
//                     attributes: ['sourceTypeName']
//                 },
//                 {
//                     model: source, as: 'sources',
//                     attributes: ['sourceName']
//                 }
//             ],
//             attributes: [
//                 'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
//                 'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt', 'createdAt',
//                 [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
//                 [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
//                 // [fn('DATE_FORMAT', col('created_date'), '%d-%m-%Y %H:%i:%s'), 'created_date']
//             ]
//         });
//         return rows;
//     } catch (err) {
//         logger.error("Job Card dao vehicleHistory", err);
//         console.log(err);
//     }
// };

// const vehicleHistory = async (reqData, user) => {
//     try {
//         const searchCondition = reqData ? {
//             reg_no: reqData.registrationNumber
//         } : {};

//         const userCondition = {
//             created_by: user.id,
//             status: {
//                 [Op.in]: [1, 2, 3, 4, 5, 6, 7]
//             }
//         };

//         const [rows, externalRes] = await Promise.all([
//             JobCard.findAll({
//                 where: { ...searchCondition, ...userCondition },
//                 order: [["id", "DESC"]],
//                 include: [
//                     { model: Schedules, as: "schedules" },
//                     { model: OslSchedules, as: "oslSchedules" },
//                     { model: PartsIndent, as: "partsIndent" },
//                     { model: PartsIssue, as: "partsIssue" },
//                     {
//                         model: Vehicle,
//                         as: 'vehicle',
//                         attributes: ['chassisNumber'],
//                         include: [
//                             { model: Model, as: 'model', attributes: ['modelName'] },
//                             { model: Make, as: 'make', attributes: ['makeName'] },
//                         ],
//                     },
//                     {
//                         model: Sourcetypes, as: 'sourcetype',
//                         attributes: ['sourceTypeName']
//                     },
//                     {
//                         model: source, as: 'sources',
//                         attributes: ['sourceName']
//                     }
//                 ],
//                 attributes: [
//                     'id', 'document_type', 'customer_id', 'customer_code', 'customer_name',
//                     'customer_address', 'customer_state', 'customer_city', 'customer_pincode',
//                     'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id',
//                     'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer',
//                     'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
//                     'customer_voice', 'service_engineer_remarks', 'service_advice', 'source',
//                     'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve',
//                     'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason',
//                     'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code',
//                     'paid_by_status', 'customer_email', 'created_by', 'updated_by',
//                     'updatedAt', 'createdAt',
//                     [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
//                     [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
//                 ]
//             }),

//             getExternalVehicleHistory(reqData)
//         ]);

//         const primaryData = (rows || []).map(row => ({
//             ...row.toJSON(),
//             type: "primary"
//         }));

//         const externalRows = externalRes?.JobCardData || [];
//         console.log("externalRows", externalRows);

//         const externalData = externalRows.map(jc => ({
//             id: jc.id,
//             document_type: jc.document_type,
//             reg_no: jc.veg_reg_no, // mapping
//             job_card_no: jc.job_card_no,
//             customer_name: jc.customer_name,
//             status: jc.status,
//             status_value: jc.status_value,

//             vehicle: {
//                 model: { modelName: jc.modelName },
//                 make: { makeName: jc.makeName }
//             },

//             outlet_id: jc.outlet_id,
//             outlet_code: jc.outlet_code,

//             type: "external"
//         }));

//         const map = new Map();

//         [...primaryData, ...externalData].forEach(item => {
//             const key = item.job_card_no;
//             if (!map.has(key)) {
//                 map.set(key, item);
//             }
//         });

//         const mergedData = Array.from(map.values());

//         mergedData.sort((a, b) => b.id - a.id);

//         return mergedData;

//     } catch (err) {
//         logger.error("Job Card dao vehicleHistory", err);
//         console.log(err);
//         return [];
//     }
// };

const vehicleHistory = async (reqData, user) => {
    try {
        const searchCondition = reqData ? {
            reg_no: reqData.registrationNumber
        } : {};

        const userCondition = {
            // created_by: user.id,
            status: {
                [Op.in]: [1, 2, 3, 4, 5, 6, 7]
            }
        };

        const [rows, externalRes] = await Promise.all([
            JobCard.findAll({
                where: { ...searchCondition, ...userCondition },
                order: [["id", "DESC"]],
                include: [
                    { model: Schedules, as: "schedules" },
                    { model: OslSchedules, as: "oslSchedules" },
                    { model: PartsIndent, as: "partsIndent" },
                    { model: PartsIssue, as: "partsIssue" },
                    {
                        model: Vehicle,
                        as: 'vehicle',
                        attributes: ['chassisNumber'],
                        include: [
                            { model: Model, as: 'model', attributes: ['modelName'] },
                            { model: Make, as: 'make', attributes: ['makeName'] },
                        ],
                    },
                    { model: Sourcetypes, as: 'sourcetype', attributes: ['sourceTypeName'] },
                    { model: source, as: 'sources', attributes: ['sourceName'] }
                ],
                attributes: [
                    'id', 'document_type', 'customer_id', 'customer_code', 'customer_name',
                    'customer_address', 'customer_state', 'customer_city', 'customer_pincode',
                    'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id',
                    'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer',
                    'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                    'customer_voice', 'service_engineer_remarks', 'service_advice', 'source',
                    'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve',
                    'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason',
                    'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code',
                    'paid_by_status', 'customer_email', 'created_by', 'updated_by',
                    'updatedAt', 'createdAt',
                    [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                    [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                ]
            }),

            getExternalVehicleHistory(reqData) 



        ]);

        const primaryData = (rows || []).map(row => ({
            ...row.toJSON(),
            type: "primary"
        }));

        const externalRows = externalRes?.JobCardData || [];

            const externalData = externalRows.map(jc => {

        const isAJC = jc.document_type === "AJC";

        return {
            id: jc.id,
            document_type: jc.document_type,
            reg_no: jc.veg_reg_no,
            job_card_no: jc.job_card_no,

            customer_id: jc.customer_id,
            customer_code: jc.customer_code,
            customer_name: jc.customer_name,
            customer_address: jc.customer_address,
            customer_state: jc.customer_state,
            customer_city: jc.customer_city,
            customer_pincode: jc.customer_pincode,
            customer_gstin: jc.customer_gstin,
            customer_mobileNumber: jc.customer_mobileNumber,
            customer_email: jc.customer_email,

            vehicle_id: jc.vehicle_id,
            repair_type: jc.repair_type,
            service_type: jc.service_type,
            odometer: jc.odo_meter,

            status: jc.status,
            status_value: jc.status_value,

            outlet_id: jc.outlet_id,
            outlet_code: jc.outlet_code,

            work_end_date_time: jc.work_end_date_time,
            customer_arrived_date: jc.customer_arrived_date,
            customer_voice: jc.customer_voice,

            vehicle: {
                chassisNumber: jc.chassisNumber,
                model: { modelName: jc.modelName },
                make: { makeName: jc.makeName }
            },

            sources: {
                sourceName: jc.sourceName
            },
            sourcetype: {
                sourceTypeName: jc.sourceTypeName
            },

            schedules: (jc.schedules || []).map(s => {
                const rate = Number(s.amount || 0);
                const margin = Number(s.margin || 0);
                const discount = Number(s.discount || 0);

                const amount = rate + margin - discount;

                const depreciation = Number(s.depreciation_per || 0);

                let customerAmount = amount;
                let insuranceAmount = 0;

                if (isAJC) {
                    customerAmount = (amount * depreciation) / 100;
                    insuranceAmount = amount - customerAmount;
                }

                const cgst = Number(s.cgst || 0);
                const sgst = Number(s.sgst || 0);
                const igst = Number(s.igst || 0);

                const customerGST =
                    (customerAmount * cgst) / 100 +
                    (customerAmount * sgst) / 100 +
                    (customerAmount * igst) / 100;

                const insuranceGST =
                    (insuranceAmount * cgst) / 100 +
                    (insuranceAmount * sgst) / 100 +
                    (insuranceAmount * igst) / 100;

                const total = amount + customerGST + insuranceGST;

                return {
                    rot_code: s.rot_code,
                    description: s.description,
                    quantity: s.quantity,
                    singleAmount: rate,
                    amount,
                    additionalMargin: margin,
                    discount_percentage: discount,
                    depreciation,
                    customerAmount,
                    insuranceAmount,
                    cgst,
                    sgst,
                    igst,
                    laborTotal: total,
                    status: s.status,
                    repairTypeId: s.repairtype
                };
            }),

            oslSchedules: (jc.oslSchedules || []).map(o => {
                const qty = Number(o.quantity || 0);
                const rate = Number(o.amount || 0);
                const discount = Number(o.discount || 0);
                const additionalMargin = Number(o.additional_margin || 0);
                const supplierMargin = Number(o.supplier_margin || 0) / 100;

                const base = qty * rate - discount;
                const oslAmount = (base / (1 - supplierMargin)) + additionalMargin;

                const depreciation = Number(o.depreciation_per || 0);

                let customerAmount = oslAmount;
                let insuranceAmount = 0;

                if (isAJC) {
                    customerAmount = (oslAmount * depreciation) / 100;
                    insuranceAmount = oslAmount - customerAmount;
                }

                const cgst = Number(o.cgst || 9);
                const sgst = Number(o.sgst || 9);
                const igst = Number(o.igst || 0);

                const customerGST =
                    (customerAmount * cgst) / 100 +
                    (customerAmount * sgst) / 100 +
                    (customerAmount * igst) / 100;

                const insuranceGST =
                    (insuranceAmount * cgst) / 100 +
                    (insuranceAmount * sgst) / 100 +
                    (insuranceAmount * igst) / 100;

                const total = oslAmount + customerGST + insuranceGST;

                return {
                    rot_code: o.rot_code,
                    description: o.description,
                    quantity: qty,
                    amount: oslAmount,
                    additionalMargin,
                    discount_percentage: discount,
                    marginPercentage: o.supplier_margin || 0,
                    depreciation,
                    customerAmount,
                    insuranceAmount,
                    cgst,
                    sgst,
                    igst,
                    totalAmount: total,
                    status: o.status
                };
            }),

            partsIssue: (jc.partsIssue || []).map(p => {
                const qty = Number(p.quantity || 0);
                const rate = Number(p.rate || 0);
                const discount = Number(p.discount || 0);

                const base = qty * rate - discount;

                const cgst = Number(p.cgst || 0);
                const sgst = Number(p.sgst || 0);
                const igst = Number(p.igst || 0);

                const total =
                    base +
                    (base * cgst) / 100 +
                    (base * sgst) / 100 +
                    (base * igst) / 100;

                return {
                    item_code: p.parts_code,
                    item_name: p.parts_name,
                    quantity: qty,
                    rate,
                    cgst,
                    sgst,
                    igst,
                    total,
                    repair_type: p.repairtype
                };
            }),

            type: "external"
        };
    });

        const map = new Map();

        [...primaryData, ...externalData].forEach(item => {
            const key = item.job_card_no;
            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        const mergedData = Array.from(map.values());

        mergedData.sort((a, b) => b.id - a.id);

        return mergedData;

    } catch (err) {
        logger.error("Job Card dao vehicleHistory", err);
        console.log(err);
        return [];
    }
};

const getServiceEstimateById = async (id, outletId) => {
    try {
        const result = await ServiceEstimate.findOne({
            where: { id: id, ...(outletId ? { outletId } : {}) },
            include: [
                { model: LabourEstimate, as: 'labourEstimate' },
                { model: OslLabourEstimate, as: 'oslLabourEstimate' },
                { model: PartsEstimate, as: 'partEstimate' },
            ]
        });
        return result;
    } catch (err) {
        logger.error("Job Card dao getServiceEstimateById", err);
        console.log(err);
    }
}

const createScheduleMobile = async (schedulesData, user) => {
    let data = {};
    let customerAmt = 0;
    let insuranceAmt = 0;
    // if(schedulesData.depreciationPercentage){
    // there is no value come from depreciationPercentage in mobile that's why condition is change and calculation is done based on quantity and rate only
    let amtWithoutTax = Number.parseFloat(schedulesData.quantity) * Number.parseFloat(schedulesData.rate);
    customerAmt = amtWithoutTax * Number.parseFloat(schedulesData.depreciationPercentage) / 100;
    insuranceAmt = amtWithoutTax - customerAmt;
    // }
    try {
        data = await Schedules.create({
            transaction_id: schedulesData.transactionId,
            rot_id: schedulesData.laborId,
            rot_code: schedulesData.laborCode,
            description: schedulesData.laborDescription,
            quantity: schedulesData.quantity,
            singleAmount: schedulesData.singleAmount,
            amount: schedulesData.rate,
            additionalMargin: schedulesData.additionalMargin === '' || schedulesData.additionalMargin == null
                ? 0
                : parseFloat(schedulesData.additionalMargin) || 0,


            discount_percentage: schedulesData.discountAmount === '' || schedulesData.discountAmount == null
                ? 0
                : parseFloat(schedulesData.discountAmount) || 0,
            sgst: schedulesData.sgst ? schedulesData.sgst : '0',
            cgst: schedulesData.cgst ? schedulesData.cgst : '0',
            igst: schedulesData.igst ? schedulesData.igst : '0',
            depreciation_per: schedulesData.depreciationPercentage ? schedulesData.depreciationPercentage : 0,
            customer_amount: customerAmt,
            insurance_amount: insuranceAmt,
            laborTotal: schedulesData.laborTotal,
            status: schedulesData.isEstimateCopy ? 2 : 1,
            repairTypeId: schedulesData.repairTypeId ? schedulesData.repairTypeId : 7,
            repairTypeName: schedulesData.repairTypeName ? schedulesData.repairTypeName : "Paid Service",
            created_by: user.id,
            updated_by: user.id,
            fitId: schedulesData.fitId,
            approveDatetime: schedulesData.isEstimateCopy ? (schedulesData.approveDatetime || new Date()) : null,
            approvalStatus: schedulesData.isEstimateCopy ? 'APPROVED' : 'PENDING',
            sourceType: schedulesData.isEstimateCopy ? 'ESTIMATE' : 'JOB_CARD',
            sourceEstimateItemId: schedulesData.isEstimateCopy ? schedulesData.sourceEstimateItemId : null,
        });
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao createScheduleMobile", err);
    }

    return data;
};

const createOslScheduleMobile = async (oslScheduleData, user) => {
    let data = {};
    let customerAmt = 0;
    let insuranceAmt = 0;
    if (oslScheduleData.depreciationPercentage) {
        let amtWithoutTax = Number.parseFloat(oslScheduleData.quantity) * Number.parseFloat(oslScheduleData.rate);
        customerAmt = amtWithoutTax * Number.parseFloat(oslScheduleData.depreciationPercentage) / 100;
        insuranceAmt = amtWithoutTax - customerAmt;
    }
    try {
        // data = await OslSchedules.create({
        //     transaction_id: oslScheduleData.transactionId,
        //     rot_id: oslScheduleData.laborId,
        //     rot_code: oslScheduleData.laborCode,
        //     description: oslScheduleData.laborDescription,
        //     quantity: oslScheduleData.quantity,
        //     singleAmount: oslScheduleData.rate ? oslScheduleData.rate: 0,
        //     amount: oslScheduleData.rate,
        //     additionalMargin: oslScheduleData.additionalMargin,
        //     discount_percentage: oslScheduleData.discountAmount,
        //     sgst: oslScheduleData.sgst?oslScheduleData.sgst:'0',
        //     cgst: oslScheduleData.cgst?oslScheduleData.cgst:'0',
        //     igst: oslScheduleData.igst?oslScheduleData.igst:'0',
        //     depreciation_per: oslScheduleData.depreciationPercentage? oslScheduleData.depreciationPercentage: 0,
        //     customer_amount: customerAmt,
        //     insurance_amount: insuranceAmt,
        //     laborTotal: oslScheduleData.laborTotal,
        //     status: oslScheduleData.approveStatus? oslScheduleData.approveStatus : 1,
        //     vendorId: oslScheduleData.vendorId,
        //     marginPercentage: 1,
        //     osl_bill_no: oslScheduleData.oslBillNo,
        //     // osl_bill_no: "test123",
        //     created_by: user.id,
        //     updated_by: user.id,
        //     fitId: oslScheduleData.fitId
        // });

        data = await OslSchedules.create({
            transaction_id: oslScheduleData.transactionId,
            rot_id: oslScheduleData.laborId,
            rot_code: oslScheduleData.laborCode,
            description: oslScheduleData.laborDescription,
            quantity: oslScheduleData.quantity,
            singleAmount: oslScheduleData.rate ? parseFloat(oslScheduleData.rate) : 0,
            amount: oslScheduleData.rate,
            additionalMargin: oslScheduleData.additionalMargin
                ? parseFloat(oslScheduleData.additionalMargin)
                : 0,
            discount_percentage: oslScheduleData.discountAmount
                ? parseFloat(oslScheduleData.discountAmount)
                : 0,
            sgst: oslScheduleData.sgst ? parseFloat(oslScheduleData.sgst) : 0,
            cgst: oslScheduleData.cgst ? parseFloat(oslScheduleData.cgst) : 0,
            igst: oslScheduleData.igst ? parseFloat(oslScheduleData.igst) : 0,
            depreciation_per: oslScheduleData.depreciationPercentage
                ? parseFloat(oslScheduleData.depreciationPercentage)
                : 0,
            customer_amount: customerAmt,
            insurance_amount: insuranceAmt,
            laborTotal: oslScheduleData.laborTotal ? parseFloat(oslScheduleData.laborTotal) : 0,
            status: oslScheduleData.isEstimateCopy ? 2 : 1,
            vendorId: oslScheduleData.vendorId,
            marginPercentage: 1,
            osl_bill_no: oslScheduleData.oslBillNo,
            created_by: user.id,
            updated_by: user.id,
            fitId: oslScheduleData.fitId,
            approveDatetime: oslScheduleData.isEstimateCopy ? (oslScheduleData.approveDatetime || new Date()) : null,
            approvalStatus: oslScheduleData.isEstimateCopy ? 'APPROVED' : 'PENDING',
            sourceType: oslScheduleData.isEstimateCopy ? 'ESTIMATE' : 'JOB_CARD',
            sourceEstimateItemId: oslScheduleData.isEstimateCopy ? oslScheduleData.sourceEstimateItemId : null,
        });
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao createOslScheduleMobile", err);
    }

    return data;
};

const createPartsIndentMobile = async (partsIndentData, user) => {
    let data = {};
    try {
        data = await PartsIndent.create({
            transaction_id: partsIndentData.transactionId,
            // item_id: partsIndentData.partId || null,
            // item_code: partsIndentData.partNo || null,
            item_id: partsIndentData.partId != null ? String(partsIndentData.partId).trim() : null,
            item_code: partsIndentData.partNo != null ? String(partsIndentData.partNo).trim() : null,
            item_name: partsIndentData.partDescription,
            request_quantity: partsIndentData.requestedQuantity,
            received_quantity: null,
            return_quantity: null,
            amount: partsIndentData.rate,
            part_total: partsIndentData.partTotal,
            sgst: partsIndentData.sgst ? partsIndentData.sgst : '0',
            cgst: partsIndentData.cgst ? partsIndentData.cgst : '0',
            igst: partsIndentData.igst ? partsIndentData.igst : '0',
            hsn_code: partsIndentData.hsnCode,
            created_by: user.id,
            updated_by: user.id,
            status: partsIndentData.isEstimateCopy ? 2 : 1,
            // fitId: partsIndentData.fitId,
            fitId: partsIndentData.fitId != null ? String(partsIndentData.fitId).trim() : null,
            approveDatetime: partsIndentData.isEstimateCopy ? (partsIndentData.approveDatetime || new Date()) : null,
            approvalStatus: partsIndentData.isEstimateCopy ? 'APPROVED' : 'PENDING',
            sourceType: partsIndentData.isEstimateCopy ? 'ESTIMATE' : 'JOB_CARD',
            sourceEstimateItemId: partsIndentData.isEstimateCopy ? partsIndentData.sourceEstimateItemId : null,
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createPartsIndentMobile", err);
    }
    return data;
};

const getIdByServiceTypeMobile = async (serviceType) => {
    try {
        const data = await Servicetypes.findOne({ where: { serviceTypeName: serviceType } });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getIdByServiceTypeMobile", err);
    }
}

const getIdByRepairTypeMobile = async (repairType) => {
    try {
        const data = await RepairType.findOne({ where: { repairTypeName: repairType } });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getIdByRepairTypeMobile", err);
    }
}

const getIdBySourceMobile = async (repairType) => {
    try {
        const data = await source.findOne({ where: { sourceName: repairType } });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getIdBySourceMobile", err);
    }
}

const getIdBySourceTypeMobile = async (repairType) => {
    try {
        const data = await Sourcetypes.findOne({ where: { sourceTypeName: repairType } });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getIdBySourceTypeMobile", err);
    }
}

const getJobCardDetailsMobile = async (id, userId) => {
    try {
        const data = await JobCard.findOne({
            where: {
                id: id,
                created_by: userId
            },
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                {
                    model: PartsIssue, as: "partsIssue",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: Servicetypes, as: "servicetype",
                    attributes: ['serviceTypeName'],
                },
                {
                    model: RepairType, as: 'repairtype',
                    attributes: ['repairTypeName']
                },
            ]
        });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getJobCardDetailsMobile", err);
    }
}



const getJobCardDetailsForRsa = async (id, userId) => {
    try {
        const data = await JobCard.findOne({
            where: {
                id: id,
            },
            include: [
                { model: Schedules, as: "schedules" },
                { model: OslSchedules, as: "oslSchedules" },
                { model: PartsIndent, as: "partsIndent" },
                {
                    model: PartsIssue, as: "partsIssue",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: Servicetypes, as: "servicetype",
                    attributes: ['serviceTypeName'],
                },
                {
                    model: RepairType, as: 'repairtype',
                    attributes: ['repairTypeName']
                },

            ],
            raw: true

        });
        return data;
    } catch (err) {
        logger.error("JobCard Dao getJobCardDetailsMobile", err);
    }
}
const getJobCardDetailsBridge = async (reqParams) => {
    // console.log('from dao', reqParams);
    let data = {}
    try {

        if (reqParams.mobileNo || reqParams.vehicleNo) {
            const whereCondition = {};
            if (reqParams.mobileNo) {
                let encryptedMobileNo = await commonLogic.encrypt(reqParams.mobileNo)
                whereCondition["customer_mobileNumber"] = encryptedMobileNo;
            }
            if (reqParams.vehicleNo) {
                whereCondition["reg_no"] = reqParams.vehicleNo;
            }
            data = await JobCard.findAll({
                where: whereCondition,
                limit: 3,
                order: [['id', 'DESC']],
                include: [
                    { model: Schedules, as: "schedules" },
                    { model: OslSchedules, as: "oslSchedules" },
                    { model: PartsIndent, as: "partsIndent" },
                    {
                        model: PartsIssue, as: "partsIssue",
                        include: [
                            { model: Items, as: 'items' }
                        ]
                    },
                    {
                        model: Sourcetypes, as: 'sourcetype',
                        attributes: ['sourceTypeName']
                    },
                    {
                        model: source, as: 'sources',
                        attributes: ['sourceName']
                    },
                    {
                        model: Servicetypes, as: "servicetype",
                        attributes: ['serviceTypeName'],
                    },
                    {
                        model: RepairType, as: 'repairtype',
                        attributes: ['repairTypeName']
                    },
                    {
                        model: ServiceEstimate,
                        as: "serviceEstimate",

                    },
                    {
                        model: Vehicle,
                        as: 'vehicle',
                        attributes: ["id"],
                        include: [
                            { model: Model, as: 'model', attributes: ['modelName'] },
                            { model: Make, as: 'make', attributes: ['makeName'] },
                        ],
                    }

                ]

            });
            // if sbk means need to work
        } else if (reqParams.serviceBookingNo) {
            let serviceEstimate = await ServiceEstimate.findOne({
                where: {
                    serviceBookingNo: reqParams.serviceBookingNo
                }
            })
            // console.log('serviceEstimate', serviceEstimate)
            if (serviceEstimate && serviceEstimate.id) {
                data = await JobCard.findAll({
                    where: {
                        service_estimate_id: serviceEstimate.id
                    },
                    limit: 1,
                    order: [['id', 'DESC']],
                    include: [
                        { model: Schedules, as: "schedules" },
                        { model: OslSchedules, as: "oslSchedules" },
                        // { model: PartsIndent, as: "partsIndent" },
                        {
                            model: PartsIssue, as: "partsIssue",
                            include: [
                                { model: Items, as: 'items' }
                            ]
                        },
                        {
                            model: Sourcetypes, as: 'sourcetype',
                            attributes: ['sourceTypeName']
                        },
                        {
                            model: source, as: 'sources',
                            attributes: ['sourceName']
                        },
                        {
                            model: Servicetypes, as: "servicetype",
                            attributes: ['serviceTypeName'],
                        },
                        {
                            model: RepairType, as: 'repairtype',
                            attributes: ['repairTypeName']
                        },
                        {
                            model: ServiceEstimate,
                            as: "serviceEstimate",
                        },
                        {
                            model: Vehicle,
                            as: 'vehicle',
                            attributes: ['id'],
                            include: [
                                { model: Model, as: 'model', attributes: ['modelName'] },
                                { model: Make, as: 'make', attributes: ['makeName'] },
                            ],
                        }
                    ]

                });

            }
        }
        // console.log('final result', data)
        // return false;
        return data;
    } catch (err) {
        logger.error("JobCard Dao getJobCardDetailsMobile", err);
    }
}

// const updateSchedule = async (schedulesData, user) => {
//     let data = {};
//     let result = {};
//     let amtWithoutTax = Number.parseFloat(schedulesData.quantity) * Number.parseFloat(schedulesData.rate);
//     let customerAmt = amtWithoutTax * Number.parseFloat(schedulesData.depreciationPercentage) / 100 ;
//     let insuranceAmt = amtWithoutTax - customerAmt;
//     try {
//         data = await Schedules.update({
//             rot_id: schedulesData.laborId,
//             rot_code: schedulesData.laborCode,
//             description: schedulesData.laborDescription,
//             quantity: schedulesData.quantity,
//             singleAmount: schedulesData.singleAmount,
//             amount: schedulesData.rate,
//             additionalMargin: schedulesData.additionalMargin,
//             discount_percentage: schedulesData.discountAmount,
//             sgst: schedulesData.sgst,
//             cgst: schedulesData.cgst,
//             igst: schedulesData.igst,
//             depreciation_per: schedulesData.depreciationPercentage,
//             customer_amount: customerAmt.toFixed(2),
//             insurance_amount: insuranceAmt.toFixed(2),
//             laborTotal: schedulesData.laborTotal,
//             status: schedulesData.approveStatus? schedulesData.approveStatus: 1, //need to ask clarification
//             updated_by: user.id,
//         }, {where: {id: schedulesData.id}
//     });
//     if(data) {
//         result = await Schedules.findOne({where: {id: schedulesData.id}});
//     }
//     } catch (err) {
//         console.log(err);
//         logger.error("Job Card Dao updateScheduleMobile", err);
//     }

//     return result;
// };

// const updateOslSchedule = async (oslScheduleData, user) => {
//     let data = {};
//     let result = {};
//     let amtWithoutTax = Number.parseFloat(oslScheduleData.quantity) * Number.parseFloat(oslScheduleData.rate);
//     let customerAmt = amtWithoutTax * Number.parseFloat(oslScheduleData.depreciationPercentage) / 100 ;
//     let insuranceAmt = amtWithoutTax - customerAmt;
//     try {
//         data = await OslSchedules.update({
//             rot_id: oslScheduleData.laborId,
//             rot_code: oslScheduleData.laborCode,
//             description: oslScheduleData.laborDescription,
//             quantity: oslScheduleData.quantity,
//             amount: oslScheduleData.rate,
//             singleAmount: oslScheduleData.rate,
//             additionalMargin: oslScheduleData.additionalMargin,
//             discount_percentage: oslScheduleData.discountAmount,
//             sgst: oslScheduleData.sgst,
//             cgst: oslScheduleData.cgst,
//             igst: oslScheduleData.igst,
//             depreciation_per: oslScheduleData.depreciationPercentage,
//             customer_amount: customerAmt,
//             insurance_amount: insuranceAmt,
//             laborTotal: oslScheduleData.laborTotal,
//             status: oslScheduleData.approveStatus? oslScheduleData.approveStatus: 1,
//             vendorId: oslScheduleData.vendorId,
//             updated_by: user.id,
//         }, { where: {id: oslScheduleData.id}});
//         if(data) {
//             result = await OslSchedules.findOne({where: {id: oslScheduleData.id}});
//         }
//     } catch (err) {
//         console.log(err);
//         logger.error("Job Card Dao updateOslScheduleMobile", err);
//     }

//     return result;
// };

// const updatePartsIndent = async (partsIndentData, user) => {
//     let data = {};
//     let result = {};
//     try {
//         data = await PartsIndent.update({
//             item_id: partsIndentData.partId,
//             item_code: partsIndentData.partNo,
//             item_name: partsIndentData.partDescription,
//             request_quantity: partsIndentData.requestedQuantity,
//             updated_by: user.id,
//             status: partsIndentData.approveStatus? partsIndentData.approveStatus: 1,
//         }, { where: { id: partsIndentData.id}});
//         if(data) {
//             result = await PartsIndent.findOne({where: {id: partsIndentData.id}});
//         }
//     } catch (err) {
//         console.log(err);
//         logger.error("JobCard Dao updatePartsIndentMobile", err);
//     }
//     return result;
// };

const updateScheduleMobile = async (schedulesData, user) => {
    let data = {};
    let result = {};
    let amtWithoutTax = parseFloat(schedulesData.quantity || 0) * parseFloat(schedulesData.rate || 0);
    // there is no value come from depreciationPercentage in mobile that's why direct add to insuranceAmt
    let customerAmt = amtWithoutTax * parseFloat(schedulesData.depreciationPercentage || 0) / 100;
    let insuranceAmt = amtWithoutTax - customerAmt;

    try {
        // need to check with siva bro its come from mobile api
        data = await Schedules.update({
            rot_id: schedulesData.laborId,
            rot_code: schedulesData.laborCode,
            description: schedulesData.laborDescription,
            quantity: schedulesData.quantity,
            singleAmount: schedulesData.singleAmount,
            amount: schedulesData.rate,
            additionalMargin: schedulesData.additionalMargin
                ? parseFloat(schedulesData.additionalMargin)
                : 0,
            discount_percentage: schedulesData.discountAmount ? parseFloat(schedulesData.discountAmount)
                : 0,
            sgst: schedulesData.sgst ? schedulesData.sgst : '0',
            cgst: schedulesData.cgst ? schedulesData.cgst : '0',
            igst: schedulesData.igst ? schedulesData.igst : '0',
            depreciation_per: schedulesData.depreciationPercentage,
            customer_amount: customerAmt.toFixed(2),
            insurance_amount: insuranceAmt.toFixed(2),
            laborTotal: schedulesData.laborTotal,
            fitId: schedulesData.fitId,
            approveDatetime: schedulesData.approveDatetime,
            status: schedulesData.approveStatus ? schedulesData.approveStatus : 1, //need to ask clarification
            updated_by: user.id,
        }, {
            where: { id: schedulesData.id }
        });
        if (data) {
            result = await Schedules.findOne({ where: { id: schedulesData.id } });
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao updateScheduleMobile", err);
    }

    return result;
};

const updateOslScheduleMobile = async (oslScheduleData, user) => {
    // console.log('job card update osl schedulemobile ----', oslScheduleData);
    let data = {};
    let result = {};
    let amtWithoutTax = Number.parseFloat(oslScheduleData.quantity) * Number.parseFloat(oslScheduleData.rate);
    let customerAmt = amtWithoutTax * Number.parseFloat(oslScheduleData.depreciationPercentage) / 100;
    let insuranceAmt = amtWithoutTax - customerAmt;

    try {
        data = await OslSchedules.update({
            rot_id: oslScheduleData.laborId,
            rot_code: oslScheduleData.laborCode,
            description: oslScheduleData.laborDescription,
            quantity: oslScheduleData.quantity,
            amount: oslScheduleData.rate,
            singleAmount: oslScheduleData.rate,
            // additionalMargin: oslScheduleData.additionalMargin,
            // discount_percentage: oslScheduleData.discountAmount,
            additionalMargin: oslScheduleData.additionalMargin
                ? parseFloat(oslScheduleData.additionalMargin)
                : 0,
            discount_percentage: oslScheduleData.discountAmount ? parseFloat(oslScheduleData.discountAmount)
                : 0,
            sgst: oslScheduleData.sgst ? oslScheduleData.sgst : '0',
            cgst: oslScheduleData.cgst ? oslScheduleData.cgst : '0',
            igst: oslScheduleData.igst ? oslScheduleData.igst : '0',
            depreciation_per: oslScheduleData.depreciationPercentage ? parseFloat(oslScheduleData.depreciationPercentage) : 0,
            customer_amount: customerAmt ? customerAmt : 0,
            insurance_amount: insuranceAmt ? insuranceAmt : 0,
            laborTotal: oslScheduleData.laborTotal,
            fitId: oslScheduleData.fitId,
            approveDatetime: oslScheduleData.approveDatetime,
            status: oslScheduleData.approveStatus ? oslScheduleData.approveStatus : 1,
            vendorId: oslScheduleData.vendorId,
            updated_by: user.id,
        }, { where: { id: oslScheduleData.id } });
        if (data) {
            result = await OslSchedules.findOne({ where: { id: oslScheduleData.id } });
        }
    } catch (err) {
        console.log(err);
        logger.error("Job Card Dao updateOslScheduleMobile", err);
    }

    return result;
};

const updatePartsIndentMobile = async (partsIndentData, user) => {
    let data = {};
    let result = {};
    try {
        data = await PartsIndent.update({
            item_id: partsIndentData.partId?.trim() || null,
            item_code: partsIndentData.partNo?.trim() || null,
            item_name: partsIndentData.partDescription,
            request_quantity: partsIndentData.requestedQuantity,
            updated_by: user.id,
            status: partsIndentData.approveStatus ? partsIndentData.approveStatus : 1,
            fitId: partsIndentData.fitId ? partsIndentData.fitId : 1,
            approveDatetime: partsIndentData.approveDatetime ? partsIndentData.approveDatetime : 1,
        }, { where: { id: partsIndentData.id } });
        if (data) {
            result = await PartsIndent.findOne({ where: { id: partsIndentData.id } });
        }
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao updatePartsIndentMobile", err);
    }
    return result;
};

const updateJobCardMobile = async (jobcardData, user) => {
    let data = {};
    let result = {};
    try {
        let formattedDate = null;
        if (jobcardData.payload.expectedWorkCompletedDate) {
            formattedDate = moment(
                jobcardData.payload.expectedWorkCompletedDate,
                ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
            ).format("YYYY-MM-DD HH:mm:ss");
        }
        // console.log('formattedDate------------------------', formattedDate);
        if (jobcardData.updateType === "data") {
            data = await JobCard.update({
                health_report_link: jobcardData.payload.healthReportLink,
                service_engineer_remarks: jobcardData.payload.technicianRemarks,
                work_end_date_time: formattedDate,
                updated_by: user.id
            }, { where: { id: jobcardData.jcId } })
        }
        else if (jobcardData.updateType === "status" && jobcardData.payload.status === "2") {
            data = await JobCard.update({
                status: 2,
                status_value: "Work In Progress",
                updated_by: user.id
            }, { where: { id: jobcardData.jcId } });
        }
        else if (jobcardData.updateType === "status" && jobcardData.payload.status === "3") {
            data = await JobCard.update({
                status: 3,
                status_value: "Ready For Billing",
                inspectionStatus: jobcardData.payload.inspectionStatus,
                initialInspectionStatus: jobcardData.payload.initialInspectionStatus,
                customerApprove: (jobcardData.payload.customerApprove),
                updated_by: user.id
            }, { where: { id: jobcardData.jcId } });
        }
        if (data) {
            result = await JobCard.findOne({ where: { id: jobcardData.jcId } });
        }
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao updateJobCardMobile", err);
    }
    return result;
}

const createGatepassMobile = async (jobcardData, user) => {
    let data = {};
    let result = {};
    try {
        data = await JobCard.update({
            status: jobcardData.payload.status,
            status_value: "Delivered",
            updated_by: user.id
        }, { where: { id: jobcardData.jcId } });
        if (data) {
            result = await JobCard.findOne({ where: { id: jobcardData.jcId } });
        }
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createGatepassMobile", err);
    }
    return result;
}

const getJobCardForAutoPO = async (id, user) => {
    try {
        const query = `
            SELECT partsIndent.*, items.hsnCode,items.taxPercentage,items.list,ROUND(items.cost,2) as cost,items.mrp, COALESCE(SUM(stocks.quantity),0) as quantity,
            transaction.job_card_no,transaction.reg_no,transaction.id as jobCardId,customers.state as customerState,
            makes.makeName as Make,models.modelName as Model,itemcategories.itemCategorie,makes.id as makeId,models.id as modelsId,itemcategories.id as itemCategoryId,vehicles.fuelType,vehicles.chassisNumber
            FROM transactions AS transaction
            INNER JOIN parts_indent AS partsIndent ON transaction.id = partsIndent.transaction_id
            INNER JOIN items AS items ON partsIndent.item_id = items.id
            LEFT JOIN stocks AS stocks ON items.id = stocks.item_id AND stocks.outlet_id= :outletid
            LEFT JOIN makes as makes ON items.makeId=makes.id
            LEFT JOIN models as models ON items.modelId=models.id
            LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
            LEFT JOIN customers as customers ON transaction.customer_id=customers.id
            LEFT JOIN vehicles as vehicles ON transaction.vehicle_id=vehicles.id
            WHERE transaction.id = :id 
            GROUP BY partsIndent.id, partsIndent.transaction_id, partsIndent.item_id, 
              items.id,vehicles.fuelType,vehicles.chassisNumber
        `;

        const rows = await sequelize.query(query, {
            replacements: { id, outletid: user.outlet.id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;
    } catch (err) {
        console.error("Error in getTransactionDetails:", err);
    }
};

const listJobCardStatement = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        let userCondition = {};

        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey}%` } },
                { reg_no: { [Op.like]: `%${searchKey}%` } },
                { customer_name: { [Op.like]: `%${searchKey}%` } },
                { status_value: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};
        if (user.reportAccess === 1) {
            userCondition = {
                outlet_id: {
                    [Op.in]: literal(
                        `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                    )
                },
                status: {
                    [Op.in]: [1, 2, 3, 4, 5]
                },
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }
        else {
            userCondition = {
                created_by: user.id, outlet_id: user.outlet.id,
                status: {
                    [Op.in]: [1, 2, 3, 4, 5]
                },
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }
        const count = await JobCard.count({
            where: { ...searchCondition, ...userCondition }
        });
        const rows = await JobCard.findAll({
            where: { ...searchCondition, ...userCondition },
            // limit,
            // offset,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Schedules, as: "schedules", include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                {
                    model: OslSchedules, as: "oslSchedules", include: [
                        { model: LabourSchedules, as: 'labourschedules' }
                    ]
                },
                { model: PartsIndent, as: "partsIndent" },
                {
                    model: PartsIssue, as: "partsIssue",
                    include: [
                        { model: Items, as: 'items' }
                    ]
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber', 'engineNumber'],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] },
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: source, as: 'sources',
                    attributes: ['sourceName']
                },
                {
                    model: TransactionInsurance, as: 'insurance'
                },
                {
                    model: Billings, as: 'billing'
                }
                //repiar type
                //service type
                //service_estimate
            ],
            attributes: [
                'id', 'document_type', 'customer_id', 'customer_code', 'customer_name', 'customer_email', 'customer_address', 'customer_state', 'customer_city', 'customer_pincode', 'customer_type', 'customer_gstin', 'customer_mobileNumber', 'vehicle_id', 'reg_no', 'job_card_no', 'repair_type', 'service_type', 'odometer', 'status', 'status_value', 'service_estimate_id', 'service_estimate_code',
                'customer_voice', 'service_engineer_remarks', 'service_advice', 'source', 'source_type', 'dsa_agent_id', 'dsa_agent', 'part_approve', 'credit_approve', 'credit_approve_reason', 'otd_reason_id', 'otd_reason', 'sub_status', 'sub_status_reason', 'outlet_id', 'outlet_code', 'paid_by_status', 'customer_email', 'created_by', 'updated_by', 'updatedAt', 'createdAt',
                "health_report_link", "inspectionStatus", "initialInspectionStatus", "customerApprove", "jobType", "per_day_km", "stageNorms", "axle", "application", "engineOilCapacity", "nextDueDateFC",
                [fn('DATE_FORMAT', col('work_end_date_time'), '%d-%m-%Y %H:%i:%s'), 'work_end_date_time'],
                [fn('DATE_FORMAT', col('customer_arrived_date'), '%d-%m-%Y %H:%i:%s'), 'customer_arrived_date'],
                //[fn('DATE_FORMAT', col('created_date'), '%d-%m-%Y %H:%i:%s'), 'created_date']
            ]
        });
        return {
            totalItems: rows.length,
            data: rows,
        };
    } catch (err) {
        logger.error("Job Card dao listJobCardstatement", err);
        console.log(err);
    }
};

const getMechanicEfficiency = async (reqData, user) => {

    try {
        const { searchKey } = reqData;
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        const userCondition = {
            createdAt: {
                [Op.between]: [startDate, endDate]
            },
        };

        const searchCondition = searchKey ? {
            [Op.or]: [
                { labour_code: { [Op.like]: `%${searchKey}%` } },
                { mechanic_name: { [Op.like]: `%${searchKey}%` } }
            ]
        } : {};

        let queryOptions = {};

        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: 'jobcard',
                        include: [
                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Make, as: 'make' },
                                    { model: Model, as: 'model' }
                                ]
                            },
                            { model: Schedules, as: 'schedules' },
                            { model: Billings, as: 'billing' }
                        ]
                    },
                    {
                        model: MechanicMapping, as: 'mechanicMap',
                        include: [
                            { model: Employees, as: 'employee' },
                            // { model: Schedules, as: 'scheduleMech'}
                        ]
                    },
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: JobCard,
                        as: 'jobcard',
                        include: [
                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Make, as: 'make' },
                                    { model: Model, as: 'model' }
                                ]
                            },
                            { model: Schedules, as: 'schedules' },
                            { model: Billings, as: 'billing' }
                        ]
                    },
                    {
                        model: MechanicMapping, as: 'mechanicMap',
                        include: [
                            { model: Employees, as: 'employee' },
                            // { model: Schedules, as: 'scheduleMech'}
                        ]
                    },
                ]
            };
        }

        if (reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if (reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$labour_code$': { [Op.like]: `%${searchKey}%` } },
                    { '$mechanic_name$': { [Op.like]: `%${searchKey}%` } },
                ];
            }
        };

        // const rows = await MechanicMapping.findAll(queryOptions);
        const rows = await Billings.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Job Card dao getMechanicEfficiency", err);
        console.log(err);
    };
};


const deleteSingleLaborSchedule = async (id) => {
    let data = {};
    try {
        data = await Schedules.destroy({
            where: {
                id: id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteSingleLaborSchedule", err);
    }
    return data;
};


const deleteSingleOslLaborSchedule = async (id) => {
    let data = {};
    try {
        data = await OslSchedules.destroy({
            where: {
                id: id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteSingleOslLaborSchedule", err);
    }
    return data;
};

const deleteSinglePartsIndent = async (id) => {
    let data = {};
    try {
        data = await PartsIndent.destroy({
            where: {
                id: id,
            },
        });
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao deleteSinglePartsIndent", err);
    }
    return data;
};

function encrypt(text) {
    const cipher = crypto.createCipheriv(encryptConfig.algorithm, encryptConfig.code.padEnd(16, '*'), null);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decryption function
function decrypt(text) {
    const decipher = crypto.createDecipheriv(encryptConfig.algorithm, encryptConfig.code.padEnd(16, '*'), null);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const encryptJc = async (status) => {
    try {
        const jcData = await sequelize.query('SELECT * FROM transactions', QueryTypes.SELECT);
        if (status === 1) {
            for (const jc of jcData[0]) {
                if (jc.customer_name) {
                    const name = commonLogic.encrypt(jc.customer_name);
                    let query = `UPDATE transactions 
                        SET customer_name = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
                if (jc.customer_mobileNumber) {
                    const name = commonLogic.encrypt(jc.customer_mobileNumber);
                    let query = `UPDATE transactions 
                        SET customer_mobileNumber = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
                if (jc.customer_email) {
                    const name = commonLogic.encrypt(jc.customer_email);
                    let query = `UPDATE transactions 
                        SET customer_email = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
            }
        }
        else {
            for (const jc of jcData[0]) {
                if (jc.customer_name) {
                    const name = commonLogic.decrypt(jc.customer_name);
                    let query = `UPDATE transactions 
                        SET customer_name = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
                if (jc.customer_mobileNumber) {
                    const name = commonLogic.decrypt(jc.customer_mobileNumber);
                    let query = `UPDATE transactions 
                        SET customer_mobileNumber = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
                if (jc.customer_email) {
                    const name = commonLogic.decrypt(jc.customer_email);
                    let query = `UPDATE transactions 
                        SET customer_email = '${name}' 
                        WHERE id = ${jc.id};`;
                    await sequelize.query(query, { type: QueryTypes.UPDATE });
                }
            }
        }
    } catch (err) {
        logger.error("Job Card dao encryptJc", err);
        console.log(err);
    }
}

const updateVehicleContractSchemeCount = async (id, count) => {
    try {
        return await vehicleContractScheme.update({
            balance_count: count
        }, { where: { id: id } })
    } catch (err) {
        logger.error("Job Card dao updateVehicleContractSchemeCount", err);
        console.log(err);
    }
}

const updateVehicleRSA = async (id, data) => {
    // console.log('updateVehicleRSA dao called with id and data', id, data)
    try {
        const vehicleData = await Vehicle.findOne({ where: { id: id } })
        if (vehicleData) {
            await Vehicle.update(
                {
                    ...data,

                },
                { where: { id } }
            );
        }
        return true;

    } catch (err) {
        logger.error("Job Card dao updateVehicleRSA", err);
        console.log(err);
    }
}
const updatePartApprove = (body, user) => {
    return JobCard.update({
        part_approve: body.part_approve,
        updated_by: user.id
    }, { where: { id: body.id } })
}

const jcUpdateByFit = async (body, user) => {

    // if (body.status != 4 || body.status != 5) {
    // return { status: false, message: "Billing status is Invalid" };
    // }
    const statusMapping = {
        1: "Open",
        2: "Work In Progress",
        3: "Ready For Billing",
        4: "Billing",
        5: "Delivered",
        6: "Cancelled",
    };

    const statusValue = statusMapping[body.status] || "Unknown";

    const billType = body.billType?.toLowerCase();

    if (!billType) {
        return { status: false, message: "Bill type is required" };
    }
    if (billType !== "cash" && billType !== "credit") {
        return { status: false, message: "Invalid bill type" };
    }

    const jcData = await JobCard.findOne({ where: { id: body.id } });

    if (!jcData) {
        return { status: false, message: "Jobcard not found" };
    }

    const jcDataDetails = jcData.get({ plain: true });


    if (body.status == 4 || body.status == 5) {

        if (billType === "cash") {
            if (jcDataDetails.part_approve === 1) {
                return { status: false, message: "Please approve the parts before billing" };
            }
        }
        if (billType === "credit") {
            if (jcDataDetails.part_approve === 1) {
                return { status: false, message: "Please approve the parts before billing" };
            }

            if (jcDataDetails.credit_approve === 1) {
                return { status: false, message: "Please approve the credit approval before billing" };
            }
        }
    }

    const [affectedRows] = await JobCard.update(
        {
            status: body.status,
            status_value: statusValue,
            updated_by: user.id
        },
        { where: { id: body.id } }
    );

    if (affectedRows === 0) {
        return { status: false, message: "Update failed" };
    }

    return { status: true, message: "Updated successfully" };
};


const updateCreditApproval = (body, user) => {
    return JobCard.update({
        credit_approve: body.credit_approve,
        updated_by: user.id
    }, { where: { id: body.id } })
}

const getJobCardForEtaUpdate = async (id, user) => {
    try {
        const query = `
            SELECT partsIndent.*, items.hsnCode, COALESCE(SUM(stocks.quantity),0) as quantity
        
            FROM transactions AS transaction
            INNER JOIN parts_indent AS partsIndent ON transaction.id = partsIndent.transaction_id
            INNER JOIN items AS items ON partsIndent.item_id = items.id
            LEFT JOIN stocks AS stocks ON items.id = stocks.item_id AND stocks.outlet_id= :outletid
           
            WHERE transaction.id = :id 
            GROUP BY partsIndent.id, partsIndent.transaction_id, partsIndent.item_id, 
              items.id
        `;

        const rows = await sequelize.query(query, {
            replacements: { id, outletid: user.outlet.id },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return rows;
    } catch (err) {
        console.error("Error in Eta Details:", err);
    }
};
const mergeCustomers = (rows, oldjcData) => {
    const customerMap = new Map();

    // Add new DMS rows first
    rows.forEach(customer => {
        customerMap.set(customer.customer_code, {
            ...customer,
            total_amount: Number(customer.total_amount),
            total_repeat_count: Number(customer.total_repeat_count),
            vehicles: [...(customer.vehicles || [])]
        });
    });

    // Merge old DMS data
    oldjcData.forEach(oldCustomer => {

        const existing = customerMap.get(oldCustomer.customer_code);

        if (existing) {

            // Add main totals
            existing.total_amount += Number(oldCustomer.total_amount || 0);
            existing.total_repeat_count += Number(oldCustomer.total_repeat_count || 0);

            // Merge vehicles
            (oldCustomer.vehicles || []).forEach(oldVehicle => {

                const vehicleExist = existing.vehicles.find(v =>   v.reg_no === oldVehicle.reg_no );

                if (vehicleExist) {
                    vehicleExist.amount += Number(oldVehicle.amount || 0);
                    vehicleExist.repeat_count += Number(oldVehicle.repeat_count || 0);
                } else {
                    existing.vehicles.push({
                        ...oldVehicle,
                        amount: Number(oldVehicle.amount || 0),
                        repeat_count: Number(oldVehicle.repeat_count || 0)
                    });
                }
            });

        } else {

            // If customer not exists, add directly
            customerMap.set(oldCustomer.customer_code, {
                ...oldCustomer,
                total_amount: Number(oldCustomer.total_amount || 0),
                total_repeat_count: Number(oldCustomer.total_repeat_count || 0),
                vehicles: (oldCustomer.vehicles || []).map(v => ({
                    ...v,
                    amount: Number(v.amount || 0),
                    repeat_count: Number(v.repeat_count || 0)
                }))
            });
        }
    });

    // Convert map to array
    return Array.from(customerMap.values())
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 6);
};
const getTopFiveCustomerForGMS = async (user) => {
    try {
        const query = `
        WITH customer_vehicle_amount AS (
    SELECT
        tr.customer_id,
        tr.customer_code,
        tr.customer_name,
        tr.customer_mobileNumber,
        mk.makeName,
        mo.modelName,
        ve.registrationNumber as reg_no,
        COUNT(tr.id) AS repeat_count,
        ROUND(SUM(bi.total_amount), 0) AS total_amount
    FROM transactions tr
    INNER JOIN billings bi ON bi.transaction_id = tr.id
    LEFT JOIN vehicles ve ON tr.vehicle_id = ve.id
    LEFT JOIN makes mk ON ve.makeId = mk.id
    LEFT JOIN models mo ON ve.modelId = mo.id
    WHERE
        tr.status = 5
        AND DATEDIFF(CURDATE(), bi.createdAt) < 31
        AND tr.outlet_id = :outletid
        AND (
            (tr.document_type = 'AJC' AND tr.paid_by_status = 2)
            OR tr.document_type = 'RJC'
        )
    GROUP BY
        tr.customer_id,
        tr.customer_code,
        tr.customer_name,
        mk.id,
        mo.id,
        ve.registrationNumber,
        tr.customer_mobileNumber
)

SELECT
    CAST(
        AES_DECRYPT(
            UNHEX(customer_name),
            RPAD('${encryptConfig.code}', 16, '*')
        ) AS CHAR
    ) AS customer_name,
      CAST(
        AES_DECRYPT(
            UNHEX(customer_mobileNumber),
            RPAD('${encryptConfig.code}', 16, '*')
        ) AS CHAR
    ) AS customer_mobile,
customer_code,
SUM(total_amount) AS total_amount,
SUM(repeat_count) AS total_repeat_count,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'make_name', makeName,
            'model_name', modelName,
            'repeat_count', repeat_count,
            'amount', total_amount,
            'reg_no', reg_no
        )
    ) AS vehicles

    



FROM customer_vehicle_amount
GROUP BY customer_id, customer_name,customer_mobileNumber, customer_code
ORDER BY total_amount DESC
LIMIT 6;

        `;

        const [rows, response] = await Promise.all([

            sequelize.query(query, {
                replacements: { outletid: user.outlet.id },
                type: db.Sequelize.QueryTypes.SELECT
            }),

            axios.post(
                `${EXTERNAL_API.OLdDMS_BASE_URL}/jobcard/getTopFiveCustomerForGMS`,
                {
                    outletCode: user.outlet.outletCode
                    // outletCode : "VLR"
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "API_KEY_INTERNAL":
                            "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
                    }
                }
            )

        ]);
    console.log(response.data?.data,"response")
    
    const oldjcData = response.data?.data || [];

console.log(rows,"rows")
const mergedData = mergeCustomers(rows, oldjcData);
console.log(mergedData,"mergedData")
return mergedData;
    } catch (err) {
        console.error("Error in Top 5 Customer Details:", err);
    }
};

const getJobCardStatus = async (job_card_no) => {
    try {

        const transaction = await JobCard.findOne({
            where: { job_card_no },
            attributes: ["status", "status_value"],
        });



        return transaction

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            msg: "Internal server error",
        });
    }
}

const getSingleCustomerView = async (mobile_no, user) => {
    try {

        // -------------------------
        // New DB Customer Summary
        // -------------------------
        const customerSummary = await Customer.findOne({
            where: sequelize.literal(
                `mobileNumber = HEX(AES_ENCRYPT(:mobile, '${encryptConfig.code}'))`
            ),
            replacements: { mobile: mobile_no },

            attributes: [
                "id",
                "customerCode",
                [
                    db.Sequelize.literal(
                        `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
                    ),
                    "firstName",
                ],
                [
                    db.Sequelize.literal(
                        `IFNULL(CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR), '')`
                    ),
                    "lastName",
                ],
                [
                    db.Sequelize.fn(
                        "COUNT",
                        db.Sequelize.fn("DISTINCT", db.Sequelize.col("cusjobcards.id"))
                    ),
                    "noOfVisits",
                ],
                [
                    db.Sequelize.literal(`(
                        SELECT IFNULL(ROUND(SUM(b.total_amount),0),0)
                        FROM transactions jc
                        LEFT JOIN billings b ON b.transaction_id = jc.id
                        WHERE jc.customer_id = customer.id
                        AND jc.status = 5
                    )`),
                    "customerValue",
                ],
                [
                    db.Sequelize.fn(
                        "COUNT",
                        db.Sequelize.fn("DISTINCT", db.Sequelize.col("cusvehicles.id"))
                    ),
                    "noOfVehicles",
                ],
                ["createdAt", "customerSince"],
            ],

            include: [
                {
                    model: Vehicle,
                    as: "cusvehicles",
                    attributes: [],
                    required: false,
                },
                {
                    model: JobCard,
                    as: "cusjobcards",
                    where: { status: 5 },
                    attributes: [],
                    required: false,
                    include: [
                        {
                            model: Billings,
                            as: "billing",
                            attributes: [],
                            required: false,
                        },
                    ],
                },
            ],

            group: [
                "customer.id",
                "customer.customerCode",
                "customer.firstName",
                "customer.lastName",
                "customer.createdAt",
            ],

            subQuery: false,
        });

        // -------------------------
        // Old DMS API
        // -------------------------
        let oldCustomer = {};

        try {
            const oldResponse = await axios.post(
                `${EXTERNAL_API.OLdDMS_BASE_URL}/jobcard/GetSingleCustomerView`,
                {
                    mobile_no,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        API_KEY_INTERNAL:
                            "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa",
                    },
                }
            );

            oldCustomer = oldResponse?.data?.data || {};
        } catch (err) {
            console.log("Old DMS API failed", err.message);
        }

        let newCustomer = null;

        if (customerSummary?.id) {

            // -------------------------
            // Job Cards
            // -------------------------
            const JobCards = await JobCard.findAll({
                where: {
                    customer_id: customerSummary.id,
                    status: 5,
                },
                attributes: [
                    "id",
                    "job_card_no",
                    "outlet_code",
                    "createdAt",
                ],
                include: [
                    {
                        model: Vehicle,
                        as: "vehicle",
                        include: [
                            { model: Make, as: "make" },
                            { model: Model, as: "model" },
                        ],
                    },
                    {
                        model: Outlets,
                        as: "outlet",
                        attributes: ["outletName"],
                    },
                    {
                        model: Billings,
                        as: "billing",
                        attributes: ["total_amount"],
                    },
                ],
            });

            // -------------------------
            // Vehicles
            // -------------------------
            const vehicles = await Vehicle.findAll({
                where: {
                    customerId: customerSummary.id,
                },
                attributes: ["id", "registrationNumber"],
                include: [
                    {
                        model: Model,
                        as: "model",
                        attributes: ["modelName"],
                    },
                    {
                        model: Make,
                        as: "make",
                        attributes: ["makeName"],
                    },
                ],
            });

            const structuredjobCards = JobCards.map((jobCard) => ({
                id: jobCard.id,
                jobCardNo: jobCard.job_card_no,
                outletCode: jobCard.outlet_code,
                outletName: jobCard.outlet?.outletName ?? null,
                totalAmount: jobCard.billing
                    ? Number(jobCard.billing.total_amount).toFixed(2)
                    : 0,
                registrationNumber:
                    jobCard.vehicle?.registrationNumber ?? null,
                makeName: jobCard.vehicle?.make?.makeName ?? null,
                modelName: jobCard.vehicle?.model?.modelName ?? null,
                createdAt: jobCard.createdAt,
            }));

            const structuredVehicles = vehicles.map((vehicle) => ({
                id: vehicle.id,
                registrationNumber: vehicle.registrationNumber,
                makeName: vehicle.make?.makeName ?? null,
                modelName: vehicle.model?.modelName ?? null,
            }));

            newCustomer = {
                ...customerSummary.toJSON(),
                vehicles: structuredVehicles,
                jobCards: structuredjobCards,
            };
        }

        // -------------------------
        // If only old customer exists
        // -------------------------
        if (!newCustomer && oldCustomer?.customerCode) {
            return oldCustomer;
        }

        // -------------------------
        // If neither exists
        // -------------------------
        if (!newCustomer && !oldCustomer?.customerCode) {
            return {};
        }

        // -------------------------
        // Merge Vehicles
        // -------------------------
        const mergedVehicles = Array.from(
    new Map(
        [...(oldCustomer?.vehicles || []), ...(newCustomer?.vehicles || [])]
            .filter(v => v.registrationNumber)
            .map(v => [
                v.registrationNumber
                    .replace(/\s+/g, "")
                    .toUpperCase()
                    .trim(),
                v,
            ])
    ).values()
);

        // -------------------------
        // Merge Job Cards
        // -------------------------
        const mergedJobCards = Array.from(
    new Map(
        [...(oldCustomer?.jobCards || []), ...(newCustomer?.jobCards || [])]
            .filter(j => j.jobCardNo)
            .map(j => [
                String(j.jobCardNo).trim().toUpperCase(),
                j,
            ])
    ).values()
);

        // -------------------------
        // Final Response
        // -------------------------
        return {
            ...newCustomer,

            vehicles: mergedVehicles,
            jobCards: mergedJobCards,

            noOfVehicles: mergedVehicles.length,
            noOfVisits: mergedJobCards.length,

            customerValue:
                Number(newCustomer?.customerValue || 0) +
                Number(oldCustomer?.customerValue || 0),
        };

    } catch (err) {
        logger.error("getSingleCustomerView error", err);
        throw err;
    }
};

const PincodeData = db.pincodes;
const customerCategoryData = db.customercategory;
const fuelType = db.fueltypes;
const dispositionModel = db.dispositions;
const FlaData = db.flaData;

const getpreviousvisits = async (req) => {
    let FLAResponseServer = {};
    let FLAResponseModel = {};
    let FLAPresent = false;
    let customerDetails = {};

    const vehicleSearch = await JobCard.findOne({
        attributes: [
            'customer_name',
            'fit_status',
            'status_value',
            'createdAt',
            'outlet_code',
            'assigned_sa_id',
            'vehicle_id'
        ],
        where: {
            reg_no: req.VehicleRegNo,
            [Op.not]: Sequelize.and(
                { fit_status: 'POST_INSPECTION_COMPLETED' },
                { status_value: 'Delivered' }
            ),
            fit_status: {
                [Op.notIn]: ['CANCELLED']
            }
        },
        include: [
            {
                model: Vehicle,
                as: 'vehicle',
            },
            {
                model: Users,
                as: 'user',
                include: [
                    {
                        model: Employees,
                        as: 'employee'
                    }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    })

    if (vehicleSearch) {
        return {
            PreviousVehicle: true,
            vehicleSearch: vehicleSearch
        }
    } else {
        const vehicleDetails = await Vehicle.findOne({
            where: {
                registrationNumber: req.VehicleRegNo
            },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    include: [
                        {
                            model: customerCategoryData,
                            as: 'Category'
                        }
                    ],
                    attributes: [
                        'id',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'firstName'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'lastName'
                        ],
                        'customerCode',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'mobileNumber'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'emailId'
                        ],
                        'address1',
                        'address2',
                        'pinCode',
                        'sourceId',
                        'sourceTypeId',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(contactPersonNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'contactPersonNumber'
                        ],
                        'gstinNumber',
                        'customerCategory',
                        'is_b2b'
                    ]
                },
                {
                    model: fuelType,
                    as: 'fuelTypeDetails'
                }
            ]
        });

        const leadData = await ServiceBooking.findOne({
            where: {
                registrationNumber: req.VehicleRegNo,
                status: {
                    [Op.in]: ['Inprogress']
                }
            },
            attributes: [
                [
                    db.Sequelize.literal(
                        `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
                    ),
                    'customerName',
                ],
                [
                    db.Sequelize.literal(
                        `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
                    ),
                    'customerMobileNumber',
                ],
                'id',
                'serviceBookingNumber',
                'status',
                'registrationNumber',
                'vehicleId',
                'vehicleMakeId',
                'vehicleModelId',
                'odometer',
                'customeId',
                'customerAddress',
                'customerState',
                'customerCity',
                'pincode',
                'customerStatus',
                'dmsSourceId',
                'dmsSourceTypeId',
                'bookingId',
                'b2bBookingId',
                'source',
                'appointmentDate',
                'serviceType',
                'phoneCallNotes',
                'service_description'
            ],
            include: [
                {
                    model: dispositionModel,
                    as: 'disposition'
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        if (!vehicleDetails) {
            const FLAData = await FlaData.findOne({
                where: {
                    VEHICLE_REGISTRATION_NUMBER: req.VehicleRegNo
                }
            })

            if (!FLAData) {
                const FLAResults = await CarpmDao.callflaAPI("GET", req.VehicleRegNo);

                if (FLAResults) {
                    FLAResponseServer = FLAResults;

                    if (FLAResults.status == 100) {
                        FLAPresent = true;

                        const flaVehicle = FLAResults.results[0].vehicle;
                        const hypth = FLAResults.results[0].hypth;
                        const insurance = FLAResults.results[0].insurance;

                        const getValue = (obj, key) => obj?.[key] ?? '';


                        const vehicleFlaAdd = await FlaData.create({
                            ACCESS_TOKEN: "TVST410PROD",
                            VEHICLE_REGISTRATION_NUMBER: getValue(flaVehicle, 'regn_no'),
                            VEHICLE_STATE_CODE: getValue(flaVehicle, 'state_cd'),
                            VEHICLE_RTO_CODE: getValue(flaVehicle, 'rto_cd'),
                            VEHICLE_RTO_NAME: getValue(flaVehicle, 'rto_name'),
                            VEHICLE_CHASI_NO: getValue(flaVehicle, 'chasi_no'),
                            VEHICLE_ENGINE_NO: getValue(flaVehicle, 'eng_no'),
                            VEHICLE_REGISTERED_DATE: getValue(flaVehicle, 'regn_dt'),
                            VEHICLE_AGE: getValue(flaVehicle, 'vehicle_age'),
                            VEHICLE_PURCHASE_DATE: getValue(flaVehicle, 'purchase_dt'),
                            VEHICLE_CLASS_DESCRIPTION: getValue(flaVehicle, 'vh_class_desc'),
                            VEHICLE_OWNER_SR: getValue(flaVehicle, 'owner_sr'),
                            VEHICLE_PUCC_NO: getValue(flaVehicle, 'pucc_no'),
                            VEHICLE_PERMANENT_ADDRESS: getValue(flaVehicle, 'pAddress'),
                            VEHICLE_CURRENT_ADDRESS: getValue(flaVehicle, 'cAddress'),
                            VEHICLE_MAKE: getValue(flaVehicle, 'maker_desc'),
                            VEHICLE_MODEL: getValue(flaVehicle, 'maker_model'),
                            VEHICLE_COLOR: getValue(flaVehicle, 'color'),
                            VEHICLE_FUEL_TYPE: getValue(flaVehicle, 'fuel_type_desc'),
                            VEHICLE_CUBIC_CAPACITY: getValue(flaVehicle, 'cubic_cap'),
                            VEHICLE_MANUFACTURE_YEAR: getValue(flaVehicle, 'manu_yr'),
                            VEHICLE_SEAT_CAPACITY: getValue(flaVehicle, 'seat_cap'),
                            VEHICLE_FLA_RTO_GEO: getValue(flaVehicle, 'fla_rto_geo'),
                            VEHICLE_BLACKLIST_FLAG: getValue(flaVehicle, 'blacklist_flag'),
                            VEHICLE_BLACKLIST_STATUS: getValue(flaVehicle, 'blacklist_status'),
                            VEHICLE_FIT_UPTO: getValue(flaVehicle, 'fit_upto'),
                            VEHICLE_MANUFACTURE_MONTH_YEAR: getValue(flaVehicle, 'manu_month_yr'),
                            VEHICLE_NOC_DETAILS: getValue(flaVehicle, 'noc_details'),
                            VEHICLE_PERMIT_ISSUE_DATE: getValue(flaVehicle, 'permit_issue_dt'),
                            VEHICLE_PERMIT_NUMBER: getValue(flaVehicle, 'permit_no'),
                            VEHICLE_PERMIT_TYPE: getValue(flaVehicle, 'permit_type'),
                            VEHICLE_COMMERCIAL_FLAG: getValue(flaVehicle, 'commercial_flag'),
                            VEHICLE_PERMIT_VALID_FROM: getValue(flaVehicle, 'permit_valid_from'),
                            VEHICLE_PERMIT_VALID_UPTO: getValue(flaVehicle, 'permit_valid_upto'),
                            VEHICLE_PUCC_UPTO: getValue(flaVehicle, 'pucc_upto'),
                            VEHICLE_REGISTERED_AT: getValue(flaVehicle, 'registered_at'),
                            VEHICLE_TAX_UPTO: getValue(flaVehicle, 'tax_upto'),
                            VEHICLE_FATHER_NAME: getValue(flaVehicle, 'father_name'),
                            VEHICLE_OWNER_NAME: getValue(flaVehicle, 'owner_name'),
                            HYPTH_FNCR_NAME: getValue(hypth, 'fncr_name'),
                            HYPTH_PUCC_NO: getValue(hypth, 'pucc_no'),
                            INSURANCE_POLICY_NUMBER: getValue(insurance, 'insurance_policy_no'),
                            INSURANCE_ISEXPIRED: getValue(insurance, 'insurance_expired'),
                            INSURANCE_COMPANY: getValue(insurance, 'insurance_comp'),
                            INSURANCE_PUCC_NO: getValue(insurance, 'pucc_no'),
                            INSURANCE_EXPIRY_DATE: getValue(insurance, 'insurance_upto'),
                            CREATED_BY: req.userId,
                            UPDATED_BY: req.userId
                        });
                    }
                }
            } else {
                FLAPresent = true;
                FLAResponseModel = FLAData;
            }

            if (leadData) {
                const customerData = await Customer.findOne({
                    where: sequelize.literal(
                        `mobileNumber = HEX(AES_ENCRYPT('${leadData.customerMobileNumber}', '${encryptConfig.code}'))`
                    ),
                    include: [
                        {
                            model: customerCategoryData,
                            as: 'Category'
                        }
                    ],
                    attributes: [
                        'id',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'firstName'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'lastName'
                        ],
                        'customerCode',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'mobileNumber'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'emailId'
                        ],
                        'address1',
                        'address2',
                        'pinCode',
                        'sourceId',
                        'sourceTypeId',
                        'state',
                        'city',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(contactPersonNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'contactPersonNumber'
                        ],
                        'gstinNumber',
                        'customerCategory',
                        'is_b2b'

                    ]
                })

                if (customerData) {
                    customerDetails = customerData;
                }
            }
        }

        if (vehicleDetails || leadData || FLAResponseModel || FLAResponseServer) {
            return {
                PreviousVehicle: false,
                VehiclePresent: true,
                FLAPresent: FLAPresent,
                vehicleDetails: vehicleDetails,
                customerDetails: customerDetails,
                leadData: leadData,
                FLAResponseModel: FLAResponseModel,
                FLAResponseServer: FLAResponseServer
            }
        }
    }
}

const createJobCardInital = async (parent, visitMetadata, reqData, user, customerData) => {
    let data = {};
    const currentDate = new Date();
    const userrole = await UsersService.getUserRole(reqData.userId);
    let userRole = "";
    if (userrole.role_name == "manger") {
        userRole = "ROLE_MGR"
    } else if (userrole.role_name == "Service Advisor") {
        userRole = "ROLE_SA"
    } else if (userrole.role_name == "Technician") {
        userRole = "ROLE_TS"
    } else if (userrole.role_name == "Security") {
        userRole = "ROLE_SEC"
    } else if (userrole.role_name == "Floor Incharge") {
        userRole = "ROLE_QI"
    } else if (userrole.role_name == "GateIN") {
        userRole = "ROLE_GI"
    } else if (userrole.role_name == "Audit") {
        userRole = "ROLE_MOVE_AUDIT"
    }

     let insruance  = "";
    if(visitMetadata.insuranceCompany != "" && visitMetadata.insuranceCompany != null && visitMetadata.insuranceCompany != undefined){
         insruance = await insurance.findOne({
        where: {
            id: visitMetadata.insuranceCompany
        }
    })
    }
    // const insruance = await insurance.findOne({
    //     where: {
    //         id: visitMetadata.insuranceCompany
    //     }
    // })

    try {
        data = await JobCard.create({
            outlet_id: user.outlet.id,
            outlet_code: user.outlet.outletCode,
            document_type: "",
            job_card_no: "",
            customer_id: customerData.customeId,
            customer_code: customerData.customerCode,
            customer_name: customerData.customerName,
            customer_address: customerData.customerAddress,
            customer_state: customerData.customerState,
            customer_city: customerData.customerCity,
            customer_pincode: customerData.pincode,
            customer_type: customerData.customerType,
            vehicle_id: customerData.vehicleId,
            customer_mobileNumber: customerData.customerMobileNumber,
            customer_email: customerData.customerEmail,
            odometer: reqData.odometer,
            source: reqData.sourceId,
            source_type: reqData.sourceTypeId,
            reg_no: reqData.registrationNumber,
            work_end_date_time: currentDate,
            assigned_sa_id: userRole == "ROLE_SA" ? reqData.userId : "",
            customer_arrived_date: currentDate,
            repair_type: 1,
            service_type: 1,
            status: 0,
            fit_status: parent.VISIT_STATUS,
            created_by: user.id,
            updated_by: user.id,
            vehicle_monthly_usage: parent.VEHICLE_MONTHLY_USAGE,
            insuranceName: insruance && insruance.insuranceName ? insruance.insuranceName : "",// for mobile app 02/04
            insuranceExpDate: parent.VEHICLE_INSURANCE_EXPIRY ? parent.VEHICLE_INSURANCE_EXPIRY : ""
        })

        if ('docType' in visitMetadata) {
            const updateJobCard = await JobCard.update({
                document_type: visitMetadata.docType,
                customer_voice: parent.CUSTOMER_VOICE
            }, {
                where: {
                    id: data.id
                }
            })
        }

        const vehicle = await Vehicle.update({
            odometer: reqData.odometer,
            insuranceExpDate: parent.VEHICLE_INSURANCE_EXPIRY ? parent.VEHICLE_INSURANCE_EXPIRY : ""
        },
            {
                where: {
                    id: customerData.vehicleId
                }
            }
        )

        const updateVisitAuditTrail = await utils.updateAuditTrail(
            data.id,
            data.fit_status,
            user.id,
            ""
        )

        return data;
    } catch (err) {
        console.log(err);
        logger.error("JobCard Dao createJobCard", err);
    }
}

const getinspectionreport = async (req) => {
    const checkListTypeResponse = await checkListTypeMobile.findOne({
        where: { VISIT_ID: req.VISIT_ID }
    })

    let carpmRecords = await utils.getCarpmRecords(req.VISIT_ID);

    let checkListType = "";
    let checkListTypeCode = checkListTypeResponse.CHECKLIST_TYPE_CODE;
    if (checkListTypeCode == "CHK_LIST_MAJOR") {
        checkListType = "MajorChecklist";
    } else if (checkListTypeCode == "CHK_LIST_MINOR") {
        checkListType = "MinorChecklist";
    } else if (checkListTypeCode == "CHK_LIST_MOEV") {
        checkListType = "MoevCheklist";
    } else if (checkListTypeCode == "CHK_LIST_SUNMOB") {
        checkListType = "SunMobChecklist";
    } else if (checkListTypeCode == "CHK_LIST_SUN_3W") {
        checkListType = "Sun3WChecklist";
    }

    let inspectionResponse = await utils.getInspection(req.VISIT_ID, checkListType, req.INSPECTION_MODE);
    let imagesResponse = await utils.getShortendImages(req.VISIT_ID);

    return {
        pastcheckListType: checkListType,
        inspection: inspectionResponse,
        IMAGES: imagesResponse,
        carpmRecords: Object.keys(carpmRecords).length > 0 ? JSON.parse(carpmRecords) : null
    };
}

const getinventorydetails = async (req) => {
    let inventoryResponse = await utils.getInventory(req.VISIT_ID);
    let dentScratch = await utils.getDentAndScrarch(req.VISIT_ID);
    let inventoryPhotos = await utils.getShortendImages(req.VISIT_ID);

    return {
        InventoryReport: inventoryResponse,
        dentScratch: dentScratch,
        inventoryPhotos: inventoryPhotos
    };
}

const getqiworklist = async (req) => {

    const outletId = await Users.findOne({
        where: { id: req.userId },
        include: [{
            model: Employees,
            as: 'employee',
            attributes: ['outletId']
        }]
    });

    const jobcardData = await JobCard.findAll({
        where: {
            fit_status: 'JC_TO_GENERATE',
            status_value: ['Ready For Billing', 'Delivered', 'Billing'],
            outlet_id: outletId.employee.outletId
        },
        include: [
            {
                model: Users,
                as: 'user_sa'
            },
            {
                model: checkListTypeMobile,
                as: 'checklistType'
            },
            {
                model: Vehicle,
                as: 'vehicleDetails'
            }
        ],
        distinct: true
    })

    if (jobcardData) {
        return {
            qiWorkList: jobcardData
        }
    }
}


const getmanagerworklist = async (req) => {

    const outletId = await Users.findOne({
        where: { id: req.userId },
        include: [{
            model: Employees,
            as: 'employee',
            attributes: ['outletId']
        }]
    });

    const workList = await JobCard.findAll({
        where: {
            fit_status: {
                [Op.notIn]: ['POST_INSPECTION_COMPLETED', 'CANCELLED']
            },
            outlet_id: outletId.employee.outletId
        }
    });

    let workListResponse = [];

    if (workList) {
        workListResponse = workList.map(item => {

            const date = new Date(item.updatedAt);

            const formatted =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, '0') + "-" +
                String(date.getDate()).padStart(2, '0') + " " +
                String(date.getHours()).padStart(2, '0') + ":" +
                String(date.getMinutes()).padStart(2, '0') + ":" +
                String(date.getSeconds()).padStart(2, '0');

            return {
                VISIT_ID: item.id,
                VISIT_TIMESTAMP: formatted,
                VEHICLE_REG_NO: item.reg_no,
                VISIT_STATUS: item.fit_status,
                ASSIGNED_SA_USER_ID: item.assigned_sa_id,
                ASSIGNED_TECH_USER_ID: item.assigned_tech_id,
                VISIT_LAST_STATUS_CHANGED_TIMESTAMP: formatted,
                DOC_TYPE: item.document_type,
            }
        });
    }

    const serviceBookingResult = await ServiceBooking.findAll({
        where: {
            outletId: outletId.employee.outletId,
            status: {
                [Op.notIn]: ['CANCELLED']
            }
        },
        attributes: [
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerName',
            ],
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerMobileNumber',
            ],
            'id',
            'serviceBookingNumber',
            'status',
            'registrationNumber',
            'vehicleId',
            'vehicleMakeId',
            'vehicleModelId',
            'odometer',
            'customeId',
            'customerAddress',
            'customerState',
            'customerCity',
            'pincode',
            'customerStatus',
            'dmsSourceId',
            'dmsSourceTypeId',
            'bookingId',
            'b2bBookingId',
            'source',
            'appointmentDate',
            'serviceType',
            'phoneCallNotes',
            'service_description'
        ],
        include: [{
            model: dispositionModel,
            as: 'disposition'
        }],
        order: [['createdAt', 'DESC']],
    })

    let serviceBookingResponse = [];

    if (serviceBookingResult) {

        serviceBookingResponse = serviceBookingResult.map(item => {
            let status;
            if (item.status === "Progress") {
                status = "PROG";
            } else if (item.status === "Completed") {
                status = "COMP";
            } else {
                status = item.status;
            }
            return {
                serviceBookingId: item.id,
                serviceBookingNumber: item.serviceBookingNumber,
                status: status,
                serviceBookingDate: item.createdAt,
                registrationNumber: item.registrationNumber,
                vehicleId: item.vehicleId,
                vehicleMake: item.vehicleMakeId,
                vehicleModel: item.vehicleModelId,
                odometer: item.odometer,
                customerName: item.customerName,
                customerMobileNumber: item.customerMobileNumber,
                customerAddress: item.customerAddress,
                customerState: item.customerState,
                customerCity: item.customerCity,
                customerPincode: item.pincode,
                shopId: null,
                shopName: null,
                bookingId: item.bookingId,
                b2bBookingId: item.b2bBookingId,
                source: item.source,
                DmsSource: item.dmsSourceId,
                DmsSourceType: item.dmsSourceTypeId,
                paymentId: null,
                txnId: null,
                amount: null,
                paymentResponse: null,
                paymentDate: null,
                paymentRemarks: null,
                disposition: item.disposition.disPositionCode,
                dispositionDetails: {
                    appointmentDate: item.appointmentDate,
                    serviceType: item.serviceType,
                    remarks: item.phoneCallNotes

                }
            }
        });
    }

    const securityGateInResults = await securityGateInModel.findAll({
        include: [{
            model: Users,
            as: 'securityId',
            required: true,
            include: [{
                model: Employees,
                as: 'employee',
                required: true,
                where: {
                    outletId: outletId.employee.outletId
                }
            }]
        }]
    })

    let securityGateInResponse = [];

    if (securityGateInResults) {
        securityGateInResponse = securityGateInResults.map(item => {

            const date = new Date(item.createdAt);

            const formatted =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, '0') + "-" +
                String(date.getDate()).padStart(2, '0') + " " +
                String(date.getHours()).padStart(2, '0') + ":" +
                String(date.getMinutes()).padStart(2, '0') + ":" +
                String(date.getSeconds()).padStart(2, '0');
            return {
                VisitId: item.id,
                Vehicle_Number: item.vehicle_reg_no,
                Kilometer: item.vehicle_km_reading,
                Make_Id: item.vehicle_make_id,
                Model_Id: item.vehicle_model_id,
                Pickup_Id: item.pick_up_by,
                Assigned_SA: item.assigned_sa,
                TimeStamp: formatted
            }
        });
    }

    return {
        managerWorkListResponse: workListResponse,
        leadDetails: serviceBookingResponse,
        GateinDetails: securityGateInResponse
    };
}

const getinspectorworklist = async (req) => {

    const Vehicle = db.vehicles;
    const Customer = db.customers;
    const techJobCard = await JobCard.findAll({
        where: {
            assigned_tech_id: req.userId,
            fit_status: {
                [Op.in]: [
                    'INSPECTION_ASSIGNED',
                    'INSPECTION_COMPLETED',
                    'CALLBACK_REQUESTED',
                    'ESTIMATION_IN_PROGRESS',
                    'ESTIMATION_PROVIDED',
                    'ESTIMATION_APPROVED',
                    'JC_TO_GENERATE'
                ]
            },
            [Op.or]: [
                { status_value: null },
                {
                    status_value: {
                        [Op.notIn]: ['Delivered', 'Ready For Billing', 'Billing']
                    }
                }
            ]
        },
        include: [
            {
                model: checkListTypeMobile,
                as: 'checklistType'
            },
            {
                model: Vehicle,
                as: 'vehicle',
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: [
                            [
                                db.Sequelize.literal(
                                    `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
                                ),
                                'emailId'
                            ],
                            [
                                db.Sequelize.literal(
                                    `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
                                ),
                                'firstName'
                            ],
                            [
                                db.Sequelize.literal(
                                    `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
                                ),
                                'emailId'
                            ]
                        ]
                    },
                    {
                        model: fuelType,
                        as: 'fuelTypeDetails'
                    }
                ]
            }
        ],
        order: [['createdAt', 'DESC']],
        raw: false,
    })

    let inspectorWorkListResponse = [];

    if (techJobCard) {
        inspectorWorkListResponse = techJobCard.map(item => ({
            VISIT_ID: item.id,
            VISIT_TIMESTAMP: item.createdAt,
            VEHICLE_REG_NO: item.reg_no,
            VISIT_STATUS: item.fit_status,
            CUSTOMER_NAME: item.vehicle.customer.firstName,
            CUSTOMER_MOBILE_NUMBER: item.vehicle.customer.mobileNumber,
            CUSTOMER_VOICE: item.customer_voice,
            CUSTOMER_EMAIL: item.vehicle.customer.emailId,
            VEHICLE_MAKE_ID: item.vehicle.makeId,
            VEHICLE_MODEL_ID: item.vehicle.modelId,
            VEHICLE_TRANSMISSION_TYPE: "",
            VEHICLE_FUEL_TYPE: item.vehicle.fuelTypeDetails.id,
            VEHICLE_KM_READING: item.odometer,
            VEHICLE_MONTHLY_USAGE: item.vehicle_monthly_usage,
            VISIT_LAST_STATUS_CHANGED_TIMESTAMP: item.createdAt,
            OBD_STATUS: "",
            "CHECKLIST_TYPE_CODE": [
                item.checklistType?.CHECKLIST_TYPE_CODE || ""
            ]
        }));
    }

    return {
        InspectorWorkList: inspectorWorkListResponse
    };

}

const getgiworklist_new = async (req) => {

    const outletId = await Users.findOne({
        where: { id: req.userId },
        include: [{
            model: Employees,
            as: 'employee',
            attributes: ['outletId']
        }]
    });

    const serviceBookingResult = await ServiceBooking.findAll({
        where: {
            outletId: outletId.employee.outletId,
            status: "Inprogress"
        },
        attributes: [
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerName',
            ],
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerMobileNumber',
            ],
            'id',
            'serviceBookingNumber',
            'status',
            'registrationNumber',
            'vehicleId',
            'vehicleMakeId',
            'vehicleModelId',
            'odometer',
            'customeId',
            'customerAddress',
            'customerState',
            'customerCity',
            'pincode',
            'customerStatus',
            'dmsSourceId',
            'dmsSourceTypeId',
            'bookingId',
            'b2bBookingId',
            'source',
            'appointmentDate',
            'serviceType',
            'phoneCallNotes',
            'service_description',
            'assigned_pickup_id',
            'pickup_status',
            'pickup_date',
            'pickup_time',
            'fit_status'
        ],
        include: [{
            model: dispositionModel,
            as: 'disposition'
        }, {
            model: Users,
            as: 'serviceBookingUsers',
            include: [{ model: Employees, as: 'employee', attributes: ['employeeName', 'mobileNumber'] }]
        }],
        order: [['createdAt', 'DESC']],
    })

    if (serviceBookingResult) {
        return {
            status: true,
            serviceBookingResult: serviceBookingResult
        }
    } else {
        return {
            status: false
        }
    }
}

const getsaworklist = async (req) => {

    // SA WorkList
    const include = [
        {
            model: Vehicle,
            as: 'vehicleDetails',
            include: [
                {
                    model: fuelType,
                    as: 'fuelTypeDetails'
                },
                {
                    model: Customer,
                    as: 'customer',
                    include: [
                        {
                            model: customerCategoryData,
                            as: 'Category'
                        },
                        {
                            model: db.customertypes,
                            as: 'customerTypeDetails'
                        }
                    ],
                    attributes: [
                        'id',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'firstName'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'lastName'
                        ],
                        'customerCode',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(\`vehicleDetails->customer\`.mobileNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'mobileNumber'
                        ],
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'emailId'
                        ],
                        'address1',
                        'address2',
                        'pinCode',
                        'customerCategory',
                        'state',
                        'city',
                        'is_b2b'
                    ]
                },
                {
                    model: db.insurances,
                    as: 'insuranceNameDetails'
                }
            ]
        }
    ];

    // Step 1: Fetch job cards first
    const jobCards = await JobCard.findAll({
        where: {
            assigned_sa_id: req.userId,
            fit_status: { [Op.ne]: 'CANCELLED' },
            [Op.and]: db.Sequelize.literal(
                "(fit_status, status_value) NOT IN (('POST_INSPECTION_COMPLETED', 'Delivered'))"
            ),
        }
    });

    // Step 2: Add user_tech include ONLY if any job card has assigned_tech_id
    const hasTechAssigned = await JobCard.count({
        where: {
            assigned_sa_id: req.userId,
            assigned_tech_id: { [Op.ne]: null }
        }
    }) > 0;


    if (hasTechAssigned) {
        include.push({
            model: Users,
            as: 'user_tech',
            include: [{
                model: Employees,
                as: 'employee'
            }],
            required: false
        });
    }


    // Step 3: Now fetch with dynamic include
    const jobCardData = await JobCard.findAll({
        where: {
            assigned_sa_id: req.userId,
            fit_status: { [Op.ne]: 'CANCELLED' },
            [Op.and]: db.Sequelize.literal(
                "(fit_status, status_value) NOT IN (('POST_INSPECTION_COMPLETED', 'Delivered'))"
            ),
        },
        include,
        order: [['updatedAt', 'DESC']],
        distinct: true
    });

    // SA Appoitments
    const outletId = await Users.findOne({
        where: { id: req.userId },
        include: [{
            model: Employees,
            as: 'employee',
            attributes: ['outletId']
        }]
    });

    const serviceBookingResult = await ServiceBooking.findAll({
        where: {
            outletId: outletId.employee.outletId,
            status: {
                [Op.notIn]: ['CANCELLED']
            }
        },
        attributes: [
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerName',
            ],
            [
                db.Sequelize.literal(
                    `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
                ),
                'customerMobileNumber',
            ],
            'id',
            'serviceBookingNumber',
            'status',
            'registrationNumber',
            'assigned_pickup_id',
            'outletId',
            'vehicleId',
            'vehicleMakeId',
            'vehicleModelId',
            'odometer',
            'customeId',
            'customerAddress',
            'customerState',
            'customerCity',
            'pincode',
            'customerStatus',
            'source',
            'dmsSourceId',
            'dmsSourceTypeId',
            'bookingId',
            'b2bBookingId',
            'source',
            'appointmentDate',
            'serviceType',
            'phoneCallNotes',
            'service_description',
            'assigned_pickup_id'
        ],
        order: [['createdAt', 'DESC']],
    })


    if (jobCardData && serviceBookingResult) {
        return {
            saWorkList: jobCardData,
            serviceBookingResult: serviceBookingResult
        }
    } else if (jobCardData) {
        return {
            saWorkList: jobCardData,
            serviceBookingResult: null
        }
    } else if (serviceBookingResult) {
        return {
            saWorkList: null,
            serviceBookingResult: serviceBookingResult
        }

    }
}

const getdetailsforfi = async (req) => {

    const dentScratch = await utils.getDentAndScrarch(req.VisitId);

    let estimateId = "";
    estimateId = await JobCard.findOne({
        where: {
            id: req.VisitId
        }
    })
    const data = await utils.getEstimation(req.VisitId, estimateId.service_estimate_id);

    if (dentScratch || estimateResponse) {
        return {
            status: true,
            dentScratch: dentScratch,
            Estimation: data.estimateResponse
        }
    } else {
        return {
            status: false
        }
    }
}

const getBillingSummaryForGatepass = async (jobCardId, user) => {
    try {

        const jobcard = await JobCard.findOne({

            where: {
                id: jobCardId,
                outlet_id: user.outlet.id
            },

            include: [

                {
                    model: Billings,
                    as: "billing",
                },

                {
                    model: Schedules,
                    as: "schedules",
                },

                {
                    model: OslSchedules,
                    as: "oslSchedules",
                },

                {
                    model: PartsIssue,
                    as: "partsIssue",
                },
                {
                    model: CreditNotes,
                    as: "creditNotes",
                },
                {
                    model: LbsDebitNotes,
                    as: "lbsDebitNotes",
                },
                {
                    model: Receipt,
                    as: "receipts",
                },
                {
                    model: Customer,
                    as: "jcCustomerMapping",
                }
            ],
        });

        return jobcard;
    } catch (err) {
        logger.error(
            "JobCard dao getBillingSummaryForGatepass",
            err
        );
        throw err;
    }
};

const getJobCardDetailsForCustomerComplaint = async (reqParams) => {
    try {

        return await JobCard.findOne({
            where: {
                reg_no: reqParams.vehicleNo,
                status: 5
            },
            order: [['id', 'DESC']],
            attributes: ['id', 'reg_no', 'job_card_no', 'customer_name', 'customer_mobileNumber', 'createdAt'],
            include: [
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ["id"],
                    include: [
                        { model: Model, as: 'model', attributes: ['modelName'] },
                        { model: Make, as: 'make', attributes: ['makeName'] }
                    ]
                },
                {
                    model: Billings,
                    as: 'billing',
                    attributes: ['delivery_date']
                }
            ]
        });

    } catch (err) {
        logger.error("JobCard Dao getJobCardDetailsForCustomerComplaint", err);
        throw err;
    }
};

const getcustomerpastvisitdata = async (req) => {

    const vehicleData = await JobCard.findAll({
        where: {
            reg_no: req.VehicleNumber,
            fit_status: "POST_INSPECTION_COMPLETED",
            status: "DELIVERED"
        },
        include: [{
            model: Outlets,
            as: 'outlet', // must match the alias in the association
            attributes: ['outletName', 'address1', 'address2', 'city', 'state', 'pincode'],  // attributes you want to select
        }],
        order: [['createdAt', 'DESC']],
        limit: 1,
        raw: false
    })

    console.log("idVehicleData", vehicleData);
    if (vehicleData && vehicleData.length > 0) {
        const customerPastVisit = vehicleData[0];
        const visitId = customerPastVisit.id;
        const customerVoice = customerPastVisit.customer_voice;
        const assignedTechUserid = customerPastVisit.assigned_tech_id;
        const assignedSaId = customerPastVisit.assigned_sa_id;
        const odometerReading = customerPastVisit.odometer;
        const createdDate = customerPastVisit.createdAt;
        const outletName = customerPastVisit.outlet.outletName;
        const outletAddress = customerPastVisit.outlet.address1 + " " + customerPastVisit.outlet.address2 + " " + customerPastVisit.outlet.city + " " + customerPastVisit.outlet.state + " " + customerPastVisit.outlet.pincode;

        // Return all the above to the result

        const VisitData = {
            CUSTOMER_VOICE: customerVoice,
            ASSIGNED_TECH_USER_ID: assignedTechUserid,
            ASSIGNED_SA_USER_ID: assignedSaId,
            VEHICLE_KM_READING: odometerReading,
            CREATED_DATE: createdDate,
            OUTLET_NAME: outletName,
            OUTLET_ADDRESS: outletAddress
        }

        const checkListTypeResponse = await JobCard.findAll({
            attributes: ['createdAt'],
            where: {
                reg_no: req.VehicleNumber,
            },
            include: [{
                model: checkListTypeMobile,
                as: "checklistType",
                attributes: ['CHECKLIST_TYPE_CODE'],
                required: false,
            }],
            order: [['createdAt', 'DESC']],
            raw: false,
        })

        let inspectionType = "";
        let checkListType = "";
        let checkListTypeCode = checkListTypeResponse[0].checklistType.CHECKLIST_TYPE_CODE;
        if (checkListTypeCode == "CHK_LIST_MAJOR") {
            checkListType = "MajorChecklist";
        } else if (checkListTypeCode == "CHK_LIST_MINOR") {
            checkListType = "MinorChecklist";
        }

        for (const checkList of checkListTypeResponse) {
            if (checkList.checklistType.CHECKLIST_TYPE_CODE === 'CHK_LIST_MAJOR') {
                const targetDate = new Date(checkList.createdAt);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 60) {
                    inspectionType = "Major";
                }
                break;
            }
        }

        if (!inspectionType && checkListTypeResponse.length > 0) {
            const latest = checkListTypeResponse[0];
            const targetDate = new Date(latest.createdAt);
            const now = new Date();

            const diffDays = Math.floor((now - targetDate) / (1000 * 60 * 60 * 24));

            if (diffDays > 60) inspectionType = "Major";
            else if (diffDays > 15 && diffDays <= 60) inspectionType = "Minor";
            else if (diffDays < 15) inspectionType = "Na";
            else inspectionType = "";
        }

        // console.log("inspectionType",inspectionType); // Add inspectionType in result 

        let inventoryResponse = await getInventory(visitId);

        const previousEstimate = await PartsIndent.findAll({
            where: {
                transaction_id: visitId
            },
            attributes: [
                'id',
                'status',
                'item_id',
                'item_code',
                'item_name',
                'cgst',
                'sgst',
                'hsn_code',
                'amount',
                'request_quantity',
                'part_total'
            ],
            raw: false
        })

        let estimateResponse = [];


        if (previousEstimate) {
            estimateResponse = previousEstimate.map(item => ({
                ESTIMATE_ID: customerPastVisit.service_estimate_id,
                ESTIMATION_APPROVAL_STATUS: item.status,
                ESTIMATION_TYPE: "PARTS",
                ESTIMATION_OBJECT_ID: item.item_code,
                ESTIMATION_OBJECT: {
                    id: item.id,
                    cgst: item.cgst,
                    sgst: item.sgst,
                    partId: item.item_id,
                    partNo: item.item_code,
                    status: "true",
                    hsnCode: item.hsn_code,
                    partTotal: item.part_total,
                    discountAmount: "",
                    partDescription: item.item_name,
                    additionalMargin: "",
                    requestedQuantity: item.request_quantity,
                    serviceRecommendation: false
                }
            }));
        }

        const prevoiusLabours = await Schedules.findAll({
            where: {
                transaction_id: visitId
            },
            attributes: [
                'id',
                'status',
                'rot_id',
                'rot_code',
                'cgst',
                'sgst',
                'singleAmount',
                'quantity',
                'laborTotal',
                'description',
                'additionalMargin',
            ]
        })

        let labourEstimates = [];

        if (prevoiusLabours) {
            labourEstimates = prevoiusLabours.map(item => ({
                ESTIMATE_ID: customerPastVisit.service_estimate_id,
                ESTIMATION_APPROVAL_STATUS: item.status,
                ESTIMATION_TYPE: "LABOUR",
                ESTIMATION_OBJECT_ID: item.rot_id,
                ESTIMATION_OBJECT: {
                    id: item.id,
                    cgst: item.cgst,
                    sgst: item.sgst,
                    laborId: item.rot_id,
                    laborCode: item.rot_code,
                    status: "true",
                    singleAmount: item.singleAmount,
                    laborTotal: item.laborTotal,
                    discountAmount: "",
                    laborDescription: item.description,
                    additionalMargin: item.additionalMargin,
                    quantity: item.quantity,
                    serviceRecommendation: false
                }
            }));
        }

        let oslEstimates = [];

        const previousOslEstimates = await OslSchedules.findAll({
            where: {
                transaction_id: visitId
            },
            attributes: [
                'id',
                'status',
                'rot_id',
                'rot_code',
                'cgst',
                'sgst',
                'singleAmount',
                'quantity',
                'laborTotal',
                'description',
                'additionalMargin',
                'discount_percentage'
            ]
        })

        if (previousOslEstimates) {
            oslEstimates = previousOslEstimates.map(item => ({
                ESTIMATE_ID: customerPastVisit.service_estimate_id,
                ESTIMATION_APPROVAL_STATUS: item.status,
                ESTIMATION_TYPE: "OSL",
                ESTIMATION_OBJECT_ID: item.rot_id,
                ESTIMATION_OBJECT: {
                    id: item.id,
                    cgst: item.cgst,
                    sgst: item.sgst,
                    laborId: item.rot_id,
                    laborCode: item.rot_code,
                    status: "true",
                    singleAmount: item.singleAmount,
                    laborTotal: item.laborTotal,
                    discountAmount: item.discount_percentage,
                    laborDescription: item.description,
                    additionalMargin: item.additionalMargin,
                    quantity: item.quantity,
                    serviceRecommendation: false
                }
            }));
        }

        estimateResponse = [...estimateResponse, ...labourEstimates, ...oslEstimates];

        // console.log("estimateResponse",estimateResponse); // Add estimateResponse to result 


        let inspectionResponse = await utils.getInspection(visitId, checkListType, "");

        // console.log("inspectionResponse",inspectionResponse); // Add inspectionResponse to result

        let images = await getImages(visitId);

        // console.log("images",images); // Add images to result

        let carpmRecords = await getCarpmRecords(visitId);

        return {
            status: "success",
            VisitDetails: VisitData,
            InventoryReport: inventoryResponse,
            Estimation: estimateResponse,
            pastcheckListType: checkListType,
            inspection: inspectionResponse,
            IMAGES: images,
            carpmRecords: carpmRecords && carpmRecords.length > 0
                ? JSON.parse(carpmRecords)
                : null
        };
    } else {
        return {
            status: "failure"
        }
    }
}

const getDentAndScrarch = async (visitId) => {
    let dentScratch = [];

    const dentScratchResponse = await dentAndScratchModel.findAll({
        where: { VISIT_ID: visitId },
        order: [['CREATED_DATE', 'DESC']],
    });

    if (dentScratchResponse) {
        dentScratch = dentScratchResponse.map(item => ({
            xPoint: item.X_POINT,
            yPoint: item.Y_POINT,
            type: item.TYPE
        }))
    }

    return dentScratch;
}

const getCarpmRecords = async (visitId) => {
    let carpmRecords = [];

    const carpmResponse = await carpmRecordsModel.findOne({
        where: { VISIT_ID: visitId },
        order: [['createdAt', 'DESC']],
    })

    if (carpmResponse) {
        carpmRecords = carpmResponse.REPORT_DATA;
    }

    return carpmRecords;
}

const getInventory = async (visitId) => {
    // if you have one jobcard with many inventory or data in different table with same id then use findOne 
    // if you have many jobcard with the same search and other remains same user findAll
    const vehicleInventory = await JobCard.findOne({
        where: { id: visitId },
        include: [{
            model: inventoryData,
            as: "inventory",
            attributes: ['inventory_code', 'inventory_condition', 'remarks'],
            include: [{
                model: masterInventory,
                as: "masterInventoryCode",
                attributes: ['INVENTORY_DESC', 'INVENTORY_TYPE']
            }]
        }],
        raw: false
    })

    let inventoryResponse = [];

    if (vehicleInventory && vehicleInventory.inventory) {
        inventoryResponse = vehicleInventory.inventory.map(item => ({
            INVENTORY_TYPE: item.masterInventoryCode?.INVENTORY_TYPE || null,
            INVENTORY_DESC: item.masterInventoryCode?.INVENTORY_DESC || null,
            INVENTORY_CONDITION: item.inventory_condition || null, // if you have this in inventoryData
            REMARKS: item.remarks || "" // if you have this in inventoryData
        }));
    }

    return inventoryResponse;
}


const getImages = async (visitId) => {
    const pastImages = await Images.findAll({
        where: { visit_id: visitId }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => ({
            IMAGE_LINK: item.link,
            IMAGE_TYPE: item.type,
        }));
    }

    return images;

}

const getShortendImages = async (visitId) => {
    const pastImages = await Images.findAll({
        where: { visit_id: visitId }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => (
            item.link.split("tvs-fit-storage-account/")[1]
        ));
    }

    return images;

}

const updatesourcedetails = async (reqData) => {
    const updatesourcedetailsData = await JobCard.update({
        source: reqData.SourceId,
        source_type: reqData.SourceTypeId
    }, {
        where: { visit_id: reqData.VisitId }
    })

    if (updatesourcedetailsData[0] == 1) {
        return {
            status: "succes"
        }
    } else {
        return {
            status: "failure"
        }
    }
}

const getAlertMoevVehicleDetails = async (reqData) => {
    const data = {
        vehicleNo: reqData.vehicleNumber,
        apiKey: '9Cs3UkNYsonv8YcH6Nv2gwkaVkOLF1l7fUWnIA2L6eoPxLcsm7uxoOFpy/aw+DZM'
    };
    const vehicleResponse = await NeshApi.callNeshInsightAPI(
        "POST",
        "https://evdrivenostics.mytvs.in:9443/clientWebService/getVehicleAlertsinfo",
        data,
        null
    )

    if (vehicleResponse) {
        if (vehicleResponse.apiSuccess == true) {
            return {
                status: 'success'
            }
        } else {
            return {
                status: 'failed',
                ErrorDescription: vehicleResponse.message
            }
        }
    } else {
        return {
            status: 'failed'
        }
    }
}

const getExternalVehicleHistory = async (reqData) => {
  try {
    console.log("getExternalVehicleHistory called with registrationNumber:", reqData.registrationNumber);
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/vehiclehistory/getVehicleDataHeaders`,
      {
        registrationNumber: reqData.registrationNumber
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data; 
  } catch (err) {
    console.log(err);
    logger.error("External Vehicle History API Error", err);
    return null;
  }
};



const getExternalDashBoardEPRO = async (reqData) => {
  try {
    console.log("getExternalDashBoardEPRO called with :", reqData);
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/OldDmsDashBoardV2/getOldDmsDashboardV2EPRO`,reqData,
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data; 
  } catch (err) {
    console.log(err);
    logger.error("External Vehicle History API Error", err);
    return null;
  }
};

const dashboardEpro = async (body, user) => { 
    // epro function
    try {
        const type = body.type || 'RJC';
        const option = body.option || 'monthly';
        body.outletCode =  user.outlet.code;
        // let formattedStartDate = '';
        // let formattedEndDate = '';

        // if (option !== 'monthly' && option !== 'yearly') {
        //     throw new Error('Invalid option. Must be either "monthly" or "yearly".');
        // }
          const currentDate = new Date();
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth(); // Jan = 0
            const validOptions = [
            'monthly',
            'q1',
            'q2',
            'q3',
            'q4',
            'halfyearly',
            'yearly',
            'preyear',
            ];
            if (!validOptions.includes(option)) {
                throw new Error(
                    'Invalid option. Must be monthly, q1, q2, q3, q4, halfyearly, yearly, or preyear.'
                );
                }
                 const formatDate = (date, end = false) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      return `${yyyy}-${mm}-${dd} ${end ? '23:59:59' : '00:00:00'}`;
    };
  const fyStartYear = month >= 3 ? year : year - 1;
    let startDate;
    let endDate;

    if (option === 'monthly') {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    }

    if (option === 'q1') {
      // Apr - Jun
      startDate = new Date(fyStartYear, 3, 1);
      endDate = new Date(fyStartYear, 6, 0);
    }

    if (option === 'q2') {
      // Jul - Sep
      startDate = new Date(fyStartYear, 6, 1);
      endDate = new Date(fyStartYear, 9, 0);
    }

    if (option === 'q3') {
      // Oct - Dec
      startDate = new Date(fyStartYear, 9, 1);
      endDate = new Date(fyStartYear, 12, 0);
    }

    if (option === 'q4') {
    // Jan - Mar
    startDate = new Date(fyStartYear + 1, 0, 1);
    endDate = new Date(fyStartYear + 1, 3, 0);
    }

    if (option === 'halfyearly') {
      // Half-Yearly current FY H1: Apr-Sep
      startDate = new Date(fyStartYear, 3, 1);
      endDate = new Date(fyStartYear, 9, 0);
    }

    if (option === 'yearly') {
      // Current financial year
      startDate = new Date(fyStartYear, 3, 1);
      endDate = new Date(fyStartYear + 1, 3, 0);
    }

    if (option === 'preyear') {
      // Previous financial year
      startDate = new Date(fyStartYear - 1, 3, 1);
      endDate = new Date(fyStartYear, 3, 0);
    }

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate, true);



        const query = `
SELECT
  CASE
    WHEN :option = 'monthly' THEN DAY(b.createdAt)
    ELSE LOWER(LEFT(MONTHNAME(b.createdAt),3))
  END AS period,

  ROUND(
    SUM(b.total_amount) - SUM(COALESCE(c.cn_amount,0))
    /
    NULLIF(COUNT(DISTINCT b.id),0)
  ,0) AS amount

FROM (
  SELECT
    b.id,
    b.transaction_id,
    b.createdAt,
    COALESCE(b.total_amount,0) AS total_amount
  FROM billings b
  JOIN transactions t ON b.transaction_id = t.id
  WHERE
    t.document_type = :type
    AND b.outlet_id = :outletId
    AND b.createdAt BETWEEN :startDate AND :endDate
) b
LEFT JOIN (
  SELECT
    transaction_id,
    SUM(amount) AS cn_amount
  FROM credit_debit_notes
  WHERE purpose = 'SaleReturn'
  GROUP BY transaction_id
) c ON c.transaction_id = b.transaction_id

GROUP BY period
ORDER BY period;
`;


        const rows = await sequelize.query(query, {
            replacements: {
                type: type,
                option: option,
                outletId: user.outlet.id,
                startDate: formattedStartDate,
                endDate: formattedEndDate
            },
            type: db.Sequelize.QueryTypes.SELECT
        });
        const oldDmsRows = await getExternalDashBoardEPRO({
        type,
        option,
        outletCode: user.outlet.outletCode,
        });


        // console.log('dashboardEpro rows:', rows);

// console.log('new dms dashboardEpro rows:', rows);
// console.log('old dms dashboardEpro rows:', oldDmsRows);

const mergedMap = new Map();

rows.forEach((item) => {
  mergedMap.set(item.period, {
    period: item.period,
    amount: Number(item.amount || 0),
  });
});

(oldDmsRows || []).forEach((item) => {
  const existing = mergedMap.get(item.period);

  if (existing) {
    existing.amount += Number(item.amount || 0);
  } else {
    mergedMap.set(item.period, {
      period: item.period,
      amount: Number(item.amount || 0),
    });
  }
});

const finalRows = Array.from(mergedMap.values());

// console.log('final dashboardEpro rows:', finalRows);

return finalRows;


        // return rows;
    } catch (err) {
        logger.error('dashboardEpro error', err);
        throw err;
    }
};
const getOldJobcardOpenAndWorkInProgress = async (user) => {
    let transaction= await sequelize.transaction();
  try {
    const customerTypeMap = {
      1: "Individual",
      2: "Corporate",
      3: "Corporate-OLA",
    };

    const jcStatusMap = {
      1: "Open",
      2: "Work In Progress",
      3: "Ready For Billing",
      4: "Billing",
      5: "Delivered",
    };

    /* ---------------- FETCH FROM OLD SYSTEM ---------------- */

    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/jobcard/getOldJobcardOpenAndWorkInProgress`,
      { outletCode: user.outlet.outletCode },
      {
        headers: {
          "Content-Type": "application/json",
          API_KEY_INTERNAL:
            "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa",
        },
      }
    );

    const jobCards = response?.data?.data || [];

    if (!jobCards.length) {
      return [];
    }

    /* ---------------- COLLECT MASTER KEYS ---------------- */

    const regNos = [
      ...new Set(jobCards.map((j) => j.reg_no).filter(Boolean)),
    ];

    const customerCodes = [
      ...new Set(jobCards.map((j) => j.customer_code).filter(Boolean)),
    ];

    const empCodes = [
      ...new Set(jobCards.map((j) => j.emp_code).filter(Boolean)),
    ];

    /* ---------------- COLLECT CHILD KEYS ---------------- */

    const allRotCodes = [
      ...new Set(
        jobCards.flatMap((jc) => [
          ...(jc.schedules || []).map((s) => s.rot_code),
          ...(jc.osl_schedules || []).map((o) => o.rot_code),
        ]).filter(Boolean)
      ),
    ];

    const allItemNames = [
      ...new Set(
        jobCards.flatMap((jc) =>
          (jc.parts_indents || []).map((p) => p.item_name)
        ).filter(Boolean)
      ),
    ];

    /* ---------------- FETCH ALL MASTER DATA ---------------- */

    const [
      vehicles,
      customers,
      employees,
      labours,
      items,
    ] = await Promise.all([
      Vehicle.findAll({
        where: {
          registrationNumber: regNos,
        },
      }),

      Customer.findAll({
        where: {
          customerCode: customerCodes,
        },
      }),

      Employees.findAll({
        where: {
          dms_emp_id: empCodes,
        },
      }),

      LabourSchedules.findAll({
        where: {
          laborCode: allRotCodes,
        },
      }),

      Items.findAll({
        where: {
          itemName: allItemNames,
        },
      }),
    ]);

    /* ---------------- MAPS ---------------- */

    const vehicleMap = new Map(
      vehicles.map((v) => [v.registrationNumber, v])
    );

    const customerMap = new Map(
      customers.map((c) => [c.customerCode, c])
    );

    const employeeMap = new Map(
      employees.map((e) => [e.dms_emp_id, e])
    );

    const laborMap = new Map(
      labours.map((l) => [l.laborCode, l])
    );

    const itemMap = new Map(
      items.map((i) => [i.itemName, i])
    );

    /* ---------------- USERS ---------------- */

    const employeeIds = employees.map((e) => e.id);

    const users = await Users.findAll({
      where: {
        employeeId: employeeIds,
      },
    });

    const userMap = new Map(
      users.map((u) => [u.employeeId, u])
    );

    /* ---------------- BUILD JOBCARDS ---------------- */

    const jobcarddata = jobCards.map((jc) => {
const employee = employeeMap.get(parseInt(jc.emp_code));

      const newuser = userMap.get(employee?.id);

      return {
        ...jc,

        outlet_id: user.outlet.id,


        customer_arrived_date:
          jc.customer_arrived_date || jc.created,

        vehicle_id:
          vehicleMap.get(jc.reg_no)?.id,

        customer_id:
          customerMap.get(jc.customer_code)?.id,

        customer_pincode:
          Number(jc.customer_pincode) || 0,

        created_by:
          newuser?.id ,

        status_value:
          jcStatusMap[jc.status],

        customer_type:
          customerTypeMap[jc.customer_category] ||
          "Unknown",

      };
    });

    /* ---------------- INSERT JOBCARDS ---------------- */

    const newJobcard = await JobCard.bulkCreate(
      jobcarddata,
      {
        returning: true,transaction
      }
    );

    const jobcardMap = new Map(
      newJobcard.map((j) => [j.job_card_no, j])
    );

    /* ---------------- CHILD TABLE DATA ---------------- */

    const scheduledata = [];
    const oslScheduledata = [];
    const partsIndentData = [];

    for (const jc of jobCards) {
      const findjobcard = jobcardMap.get(jc.job_card_no);

      /* ---------------- SCHEDULES ---------------- */

      if (jc.schedules?.length) {
        for (const s of jc.schedules) {
          const lab = laborMap.get(s.rot_code);
        if(lab&&lab?.id){
          scheduledata.push({
            ...s,

            rot_id: lab?.id ,

            transaction_id: findjobcard?.id,

            created_by: findjobcard?.created_by,

            status: 1,

            quantity: s.quantity || 1,

            depreciation_per:
              s.depreciation_per || 0,

            customer_amount:
              s.customer_amount || 0,

            insurance_amount:
              s.insurance_amount || 0,
          });
        }
    }
      }

      /* ---------------- OSL ---------------- */

      if (jc.osl_schedules?.length) {
        for (const o of jc.osl_schedules) {
          const lab = laborMap.get(o.rot_code);
     if(lab&&lab?.id){
          oslScheduledata.push({
            ...o,

            rot_id: lab?.id ,

            transaction_id: findjobcard?.id,

            created_by: findjobcard?.created_by,

            status: 1,

            quantity: o.quantity || 1,

            depreciation_per:
              o.depreciation_per || 0,

            customer_amount:
              o.customer_amount || 0,

            insurance_amount:
              o.insurance_amount || 0,

            cgst: o.cgst || 0,
            sgst: o.sgst || 0,
            igst: o.igst || 0,
          });
        }
        }
      }

      /* ---------------- PARTS ---------------- */

      if (jc.parts_indents?.length) {
        for (const p of jc.parts_indents) {
          const item = itemMap.get(p.item_name);

          partsIndentData.push({
            ...p,

            item_id: item?.id || null,

            transaction_id: findjobcard?.id,

            created_by: findjobcard?.created_by,

            status: p.status || 1,

            request_quantity:
              p.request_quantity || 1,

            amount: p.amount
              ? parseFloat(p.amount)
              : 0,
          });
        }
      }
    }

    /* ---------------- BULK INSERT CHILD TABLES ---------------- */

    await Promise.all([
      scheduledata.length
        ? Schedules.bulkCreate(scheduledata, { transaction })
        : null,

      oslScheduledata.length
        ? OslSchedules.bulkCreate(oslScheduledata, { transaction })
        : null,

      partsIndentData.length
        ? PartsIndent.bulkCreate(partsIndentData, { transaction })
        : null,
    ]);
   await transaction.commit();
    return jobCards;
  } catch (err) {
        await transaction.rollback();
    console.error(
      "DAO getJobCardDetails error:",
      err
    );

    throw err;
  }
};

const oldDmsDashboardRevenue = async (reqData) => {
  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/dashboardV1/getDashboardRevenue`,
      {
        outletCode: reqData.outletCode
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data; 
  } catch (err) {
    console.log(err);
    logger.error("Old DMS Dashboard Revenue API Error", err);
    return null;
  }
};

const oldDmsDashboardVehicleFlow = async (reqData) => {
  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/dashboardV1/getDashboardVehicleFlow`,
      {
        outletCode: reqData.outletCode,
        option: reqData.option,
        flow: reqData.flow,
        sourceTypeId: reqData.sourceTypeId
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.dashboardVehicleMetrics;
  } catch (err) {
    console.log(err);
    logger.error("Old DMS Dashboard Vehicle Flow API Error", err);
    return null;
  }
};

const oldDmsDashboardCustomerFlow = async (reqData) => {
  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/dashboardV1/getDashboardCustomerFlow`,
      {
        outletCode: reqData.outletCode,
        option: reqData.option,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data;
  } catch (err) {
    console.log(err);
    logger.error("Old DMS Dashboard Customer Flow API Error", err);
    return null;
  }
      }
const getExternalDashboardAjcRjc = async (body, user) => {
  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/dashboardV1/dashboard_ajc_rjc`,
      {
        outletCode: user?.outlet?.outletCode,
        option: body?.option,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data;
  } catch (err) {
    console.log(err);
    logger.error("External Dashboard AJC/RJC API Error", err);
    return null;
  }
};


const getOldJobcardOpenAndWorkInProgressValidation = async (req, res) => {
  const user = req.user;

  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/jobcard/getOldJobcardOpenAndWorkInProgress`,
      {
        outletCode: user.outlet.outletCode,
      },
      {
        headers: {
          "Content-Type": "application/json",
          API_KEY_INTERNAL:
            "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa",
        },
      }
    );

    const jobCards = response?.data?.data || [];

    let missingData = [];

    // =========================
    // Collect unique values
    // =========================

    const regNos = [
      ...new Set(jobCards.map((jc) => jc.reg_no).filter(Boolean)),
    ];

    const customerCodes = [
      ...new Set(jobCards.map((jc) => jc.customer_code).filter(Boolean)),
    ];

    const laborCodes = [
      ...new Set(
        jobCards.flatMap((jc) => [
          ...(jc.schedules || []).map((s) => s.rot_code),
          ...(jc.osl_schedules || []).map((o) => o.rot_code),
        ]).filter(Boolean)
      ),
    ];

    

    // =========================
    // Fetch all data in parallel
    // =========================

    const [vehicles, customers, labourSchedules] = await Promise.all([
      Vehicle.findAll({
        where: {
          registrationNumber: {
            [Op.in]: regNos,
          },
        },
        raw: true,
      }),

      Customer.findAll({
        where: {
          customerCode: {
            [Op.in]: customerCodes,
          },
        },
        raw: true,
      }),

      LabourSchedules.findAll({
        where: {
          laborCode: {
            [Op.in]: laborCodes,
          },
        },
        raw: true,
      }),
    ]);

    // =========================
    // Convert to Set for fast lookup
    // =========================

    const vehicleSet = new Set(
      vehicles.map((v) => v.registrationNumber)
    );

    const customerSet = new Set(
      customers.map((c) => c.customerCode)
    );

    const labourSet = new Set(
      labourSchedules.map((l) => l.laborCode)
    );

    

    // =========================
    // Validation
    // =========================

    for (const jc of jobCards) {

      // Vehicle validation
      if (jc.reg_no && !vehicleSet.has(jc.reg_no)) {
        missingData.push({
          type: "Vehicle",
          value: jc.reg_no,
          job_card_no: jc.job_card_no,
          reason: "Vehicle not found",
        });
      }

      // Customer validation
      if (
        jc.customer_code &&
        !customerSet.has(jc.customer_code)
      ) {
        missingData.push({
          type: "Customer",
          value: jc.customer_code,
          job_card_no: jc.job_card_no,
          reason: "Customer not found",
        });
      }

      // Labour schedules
      for (const s of jc.schedules || []) {
        if (s.rot_code && !labourSet.has(s.rot_code)) {
          missingData.push({
            type: "Labour Schedule",
            value: s.rot_code,
            job_card_no: jc.job_card_no,
            reason: "Labour schedule not found",
          });
        }
      }

      // OSL labour schedules
      for (const o of jc.osl_schedules || []) {
        if (o.rot_code && !labourSet.has(o.rot_code)) {
          missingData.push({
            type: "OSL Labour Schedule",
            value: o.rot_code,
            job_card_no: jc.job_card_no,
            reason: "OSL labour schedule not found",
          });
        }
      }

      
    }

    // =========================
    // Generate Excel
    // =========================

    if (missingData.length > 0) {

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="failed_validation.xlsx"'
      );

      const workbook = new excel.stream.xlsx.WorkbookWriter({
        stream: res,
      });

      const worksheet = workbook.addWorksheet("Failed Rows");

      worksheet.addRow(Object.keys(missingData[0])).commit();

      for (const row of missingData) {
        worksheet.addRow(Object.values(row)).commit();
      }

      await workbook.commit();
      return;
    }

    return res.json({
      success: true,
      message: "Jobcards validated successfully",
      data: jobCards,
    });

  } catch (err) {

    console.error(
      "DAO getJobCardDetails error:",
      err
    );

    throw err;
  }
};

const getJobCardBillSummaryItReturnData = async (reqData, user, type) => {
    try {

        const startDate = reqData?.startDate + ' 00:00:00';
        const endDate = reqData?.endDate + ' 23:59:59';
        const limit = type === 1 ? Number.MAX_SAFE_INTEGER : reqData.limit;
        const offset = type === 1 ? 0 : reqData.offset;
        const searchKey = type === 1 ? "" : reqData.searchKey;

        let queryOptions = {};

        // if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            queryOptions = {
                where: {
                    jobcard_no: { [Op.like]: `%${searchKey}%` },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    }
                },
                order: [["id", "DESC"]],
                // limit,
                // offset,
                include: [
                    {
                        model: JobCard, as: "jobcard",
                        include: [

                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Model, as: 'model' },
                                    { model: Make, as: 'make' },
                                ]
                            },
                            { model: TransactionInsurance, as: 'insurance' },
                            {
                                model: Schedules, as: 'schedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: OslSchedules, as: 'oslSchedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: PartsIssue, as: 'partsIssue',
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                            },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'payment_id',
                                            'txnid',
                                            'advance_amount',
                                            'payment_response',
                                            'payment_date',
                                            'payment_remarks',
                                            'bookingId',
                                            'b2bBookingId'
                                        ]
                                    }
                                ]
                            },
                            {
                                model: Receipt,
                                as: "receipts",
                                attributes: ['doc_no'],
                                where: {
                                    receipt_type: {
                                        [Op.ne]: 5
                                    }
                                },
                                required: false
                            }
                        ]
                    }
                ]
            };
        } else {
            queryOptions = {
                where: {
                    jobcard_no: { [Op.like]: `%${searchKey}%` },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    created_by: user.id,
                },
                // raw: true,
                order: [["id", "DESC"]],
                // limit,
                // offset,
                include: [
                    {
                        model: JobCard, as: "jobcard",
                        include: [
                            {
                    model: Customer, as: 'jcCustomerMapping',
                    attributes: ['customerCategory']

                },
                            {
                                model: Vehicle, as: "vehicle",
                                include: [
                                    { model: Model, as: 'model' },
                                    { model: Make, as: 'make' },
                                ]
                            },
                            { model: TransactionInsurance, as: 'insurance' },
                            {
                                model: Schedules, as: 'schedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: OslSchedules, as: 'oslSchedules',
                                include: [
                                    { model: LabourSchedules, as: 'labourschedules' }
                                ]
                            },
                            {
                                model: PartsIssue, as: 'partsIssue',
                                include: [
                                    { model: Items, as: 'items' }
                                ]
                            },
                            // { model: PartsIndent, as: 'partsIndent' },
                            {
                                model: source,
                                as: 'sources',
                                attributes: ['sourceName']
                            },
                            {
                                model: Sourcetypes,
                                as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: RepairType,
                                as: 'repairtype',
                                attributes: ['repairTypeName']
                            },
                            {
                                model: Users,
                                as: "user",
                                include: [
                                    { model: Employees, as: 'employee', attributes: ['employeeName'] }
                                ],
                                attributes: ['user_id']
                            },
                            {
                                model: ServiceEstimate,
                                as: "serviceEstimate",
                                attributes: [
                                    'id',
                                    'serviceBookingId',
                                    'driverMobileNumber',
                                    'driverName'
                                ],
                                include: [
                                    {
                                        model: ServiceBooking,
                                        as: "serviceBooking",
                                        attributes: [
                                            'payment_id',
                                            'txnid',
                                            'advance_amount',
                                            'payment_response',
                                            'payment_date',
                                            'payment_remarks',
                                            'bookingId',
                                            'b2bBookingId'
                                        ]
                                    }
                                ]
                            },
                            {
                                model: Receipt,
                                as: "receipts",
                                attributes: ['doc_no'],
                                where: {
                                    receipt_type: {
                                        [Op.ne]: 5
                                    }
                                },
                                required: false
                            }
                        ]
                    }
                ]
            };
        }

        // const totalItems = await Billings.count(queryOptions);

        const rows = await Billings.findAll(queryOptions);

        const totalItems = rows.length;
        return {
            totalItems: totalItems,
            rows: rows
        };
    } catch (err) {
        logger.error("Job Card dao getBillReportData", err);
        console.log(err);
    }
};
const dao = {
    jcUpdateByFit,
    getOTDFailureReasons,
    updateCreditApproval,
    getTransactionSubstatuses,
    getCustomerData,
    getRecentJobCard,
    createJobCard,
    findPortalVehicleByRegistration,
    setVehicleAlternativeMobile,
    linkPortalVehicleToCustomer,
    createInitialPortalJobCard,
    savePortalJobCardInspection,
    getServiceBookingForJobCard,
    getJobCardByServiceBookingId,
    saveServiceBookingJobCardActivity,
    createSchedule,
    dashboardVehicleFlow,
    createOslSchedule,
    listJobCards,
    listJobCardsData,
    createPartsIndent,
    findJobCardByStatus,
    getJobCardPDFDetails,
    getPrevJobCard,
    createMechanicMapping,
    getMechanicMapByTransactionId,
    deleteMechanicMapByTransactionId,
    getJobCard,
    updateJobCardLineApproval,
    advanceJobCardToInProgressIfApprovedById,
    deleteLaborSchedules,
    deleteOslLaborSchedules,
    deletePartsIndents,
    updateJobCard,
    updateJobcardStatus,
    getRecentOslSchedule,
    getOslByVendor,
    getJobcardLabor,
    updateJobcardMechanicMap,
    listBillJobCards,
    getOslScheduleByWOB,
    updateServiceEstimateStatus,
    oslWorkOrders,
    listGatePassJobCards,
    updateBillings,
    getRecentGatePass,
    updateDeliveryNumber,
    getGatePassData,
    getJobCardForOutlet,
    getJobCardDetails,
    addInsuranceAddress,
    addInsurance,
    listInsuranceAddresses,
    addNewAddress,
    getPartsIssueByIndentId,
    updatePaidStatus,
    getInsurance,
    getInsuranceData,
    getTransaction,
    getInsuranceDetailByTransId,
    updateJobCardInsurance,
    getInsuranceById,
    deleteJobCardInsurance,
    getJobCardStatusReportData,
    getGateInGateOutReportData,
    getWipStatusReportData,
    getBillReportData,
    getBillSummarySplitUpData,
    getJobCardDeliveryReportData,
    getRecentBillNumber,
    getWorkOrderReportData,
    getJobCardData,
    getReceiptReportData,
    getRepairOrderReportData,
    getEliteBillings,
    getEliteParts,
    getEliteSchedules,
    getEliteOslSchedules,
    getOutletByEmpId,
    getServiceBookingReport,
    vehicleHistory,
    getServiceEstimateById,
    createScheduleMobile,
    createOslScheduleMobile,
    createPartsIndentMobile,
    getIdByServiceTypeMobile,
    getIdByRepairTypeMobile,
    getIdBySourceMobile,
    getIdBySourceTypeMobile,
    getJobCardDetailsMobile,
    updateScheduleMobile,
    updateOslScheduleMobile,
    updatePartsIndentMobile,
    updateJobCardMobile,
    dashboardEpro,
    createGatepassMobile,
    getJobCardForAutoPO,
    dashboard,
    dashboardInflow,
    addDirectInsurance,
    updateJobCardDirectInsurance,
    getWOB,
    updateLaborFitId,
    updateOslLaborFitId,
    updatePartsFitId,
    updateMechanicMapping,
    getMechanicMapByTransactionIdMechanicId,
    listJobCardStatement,
    getMechanicEfficiency,
    dashboardAjcRjc,
    deleteSingleLaborSchedule,
    deleteSingleOslLaborSchedule,
    deleteSinglePartsIndent,
    updateSchedule,
    updateOslSchedule,
    updatePartsIndent,
    encryptJc,
    getCompanyDetails,
    getOutletDetails,
    getTransactionCustomerDetails,
    getScheduleDetails,
    getOslScheduleDetails,
    getPartsIssueDetails,
    createTransactionUpdate,
    UpdateTransUpdateRes,
    getRecentFOCLabourNumber,
    getRecentFOCPartNumber,
    deleteMechanicMapByMechanicId,
    getRecentJobCardForJcNo,
    getRecentOslScheduleForWobNo,
    updateVehicleContractSchemeCount,
    updatePartApprove,
    getTransactionDetails,
    getVehicleDataRsa,
    getCustomerDataRsa,
    getJcDetails,
    updateVehicleRSA,
    getJobCardDetailsBridge,
    getJobCardForEtaUpdate,
    listJobCards_v1,
    listJobCardsAdmin,
    listJobCardsByMappedOutlets,
    getJobCardViewByIdAdmin,
    dashboardLabourParts,
    getJobCardDetailsById,
    getJobCardDetailsByIdOutlet,
    updatePartsIndentDiscount,
    restoreJobCardOwnership,
    getJobCardViewById,
    dashboardCustomerFlow,
    getTopFiveCustomerForGMS,
    getJobCardStatus,
    dashboardRevenue,
    updateJobcardStatusFit,
    getSingleCustomerView,
    getScheduleByRotValue,
    getJobCardDetailsForRsa,
    getJobCardDetailsForCustomerComplaint,
    getBillingSummaryForGatepass,
    getpreviousvisits,
    createJobCardInital,
    getinspectionreport,
    getinventorydetails,
    getmanagerworklist,
    getinspectorworklist,
    getqiworklist,
    getsaworklist,
    getdetailsforfi,
    getgiworklist_new,
    savejcdetails,
    getcustomerpastvisitdata,
    getAlertMoevVehicleDetails,
    updatesourcedetails,
    getExternalVehicleHistory,
    getOldJobcardOpenAndWorkInProgress,
    oldDmsDashboardRevenue,
    oldDmsDashboardVehicleFlow,
    oldDmsDashboardCustomerFlow,
    getExternalDashboardAjcRjc,
    getOldJobcardOpenAndWorkInProgressValidation,
    getJobCardBillSummaryItReturnData

};

export default dao;
