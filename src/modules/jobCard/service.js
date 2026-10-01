import JobCardDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import numberToWords from 'number-to-words';
import moment from 'moment-timezone';
import commonLogic from '../../shared/commonLogics.js';
import axios from 'axios';
import MobileApiTrackDao from '../mobileApis/dao.js';
import { EXTERNAL_API } from '../../config/externalUrl.js';
import QrCodeGeneration from '../../shared/signedQrCode.js';
import UserDao from '../user/dao.js';
import EmployeeDao from '../employee/dao.js';
import md5 from 'md5';
import db from '../index.js';
import { updateBridgeStatusCommon } from '../../shared/bridgeApiUtility.js';
import TransactionDao from "./dao.js";

const TransUpload = db.transUploadDetails;
import {
  getRemoteToken,
  pushJobCardDataToRemote,
  createMobileApiRemoteReq,
} from '../../shared/mobileApiUtility.js';
import { body } from 'express-validator';
import { Storage } from '@google-cloud/storage';
import statusConstants from '../../shared/statusConstants.js';
import Utils from "../Utils/Utils.js";
import CustomerDao from '../customer/dao.js';
import ServiceEstimateDao from '../serviceEstimate/dao.js';


//due to urgent requirement unable to follow code governance 24-03-2026
const Schedule = db.schedules;
const OslSchedule = db.oslSchedules;
const PartsIndent = db.partsIndent;
const PartsIssue = db.partsIssue;
const Item = db.items;
const Transaction = db.jobCard;
const outletSequenceNums = db.outletSequenceNums;

const getOTDFailureReasons = async () => {
  try {
    const data = await JobCardDao.getOTDFailureReasons();
    return data;
  } catch (err) {
    logger.error('JobCard service getOTDFailureReasons Error:', err);
    next(err);
  }
};

const getTransactionSubstatuses = async () => {
  try {
    const data = await JobCardDao.getTransactionSubstatuses();
    return data;
  } catch (err) {
    logger.error('JobCard service getTransactionSubstatuses Error:', err);
    next(err);
  }
};

const getCustomerData = async (registrationNumber) => {
  const resultList = [];
  const resObj = {};
  try {
    const data = await JobCardDao.getCustomerData(registrationNumber);
    if (data) {
      let firstName = data.dataValues.decryptedFirstName;
      let lastName = data.dataValues.decryptedLastName
        ? data.dataValues.decryptedLastName
        : '';
      resObj['registrationNumber'] = data.registrationNumber;
      resObj['vehicleId'] = data.id;
      resObj['customeId'] = data.customer.id;
      resObj['customerCode'] = data.customer.customerCode;
      resObj['customerName'] = firstName + ' ' + lastName;
      resObj['customerMobileNumber'] = data.dataValues.decryptedMobileNumber;
      resObj['customerAddress'] = data.customer.address1;
      resObj['customerState'] = data.customer.state;
      resObj['customerCity'] = data.customer.city;
      resObj['pincode'] = data.customer.pinCode;
      resObj['gstinNumber'] = data.customer.gstinNumber;
      resObj['customerType'] = data.customer.customerType;
      resObj['customerEmail'] = data.dataValues.decryptedEmail;
      // resObj['customerStatus'] = 2;
      // resObj['message'] = "Existing customer";
    } else {
      resObj['customerStatus'] = 1;
      resObj['message'] = 'New customer';
    }
    resultList.push(resObj);
  } catch (err) {
    logger.error('ServiceBooking service getVehicleDetails', err);
    next(err);
  }
  return resObj;
};

const createJobCard = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  try {
    if (reqData.serviceEstimateId) {
      reqData.documentType = 'RJC';
      const estimateData = await JobCardDao.getServiceEstimateById(
        Number(reqData.serviceEstimateId),
        user.outlet.id
      );
      if (!estimateData) {
        return 'serviceEstimateNotFound';
      }
      if (![true, 1, '1'].includes(estimateData.estimateApproved)) {
        return 'estimateApprovalRequired';
      }
    }

    reqData.labor = Array.isArray(reqData.labor) ? reqData.labor : [];
    reqData.oslLabor = Array.isArray(reqData.oslLabor) ? reqData.oslLabor : [];
    reqData.parts = Array.isArray(reqData.parts) ? reqData.parts : [];
    if (
      reqData.labor.length === 0 ||
      (reqData.labor.length > 0 &&
        (!reqData.labor[0]?.laborCode || reqData.labor[0]?.laborCode === ''))
    ) {
      return 'noLabor';
    }
    const jobCardNumber = await generateJobCardNumber(
      reqData.documentType,
      user.outlet.outletCode
    );
    reqData['jobCardNumber'] = jobCardNumber;
    const customerData = await getCustomerData(reqData.registrationNumber);
    let data = await JobCardDao.createJobCard(reqData, user, customerData);
    if (Object.keys(data).length > 0) {
      const labor = reqData.labor;
      const oslLabor = reqData.oslLabor;
      const parts = reqData.parts;
      labor.forEach(async (schedulesObj) => {
        schedulesObj['transactionId'] = data.id;
        await JobCardDao.createSchedule(schedulesObj, user);
      });
      // oslLabor.forEach(async (oslSchedulesObj) => {
      //   const osl = await JobCardDao.getOslByVendor(oslScheduleData.supplierCode.id,data.id);
      //   const oslBillNo = await generateOSLBill("WOB",user.outlet.outletCode);
      //   oslSchedulesObj["transactionId"] = data.id;
      //   oslSchedulesObj["oslBillNo"] = oslBillNo;
      //   await JobCardDao.createOslSchedule(
      //     oslSchedulesObj,
      //     user
      //   );
      // });

      //
      for (const oslSchedulesObj of oslLabor) {
        const osl = await JobCardDao.getOslByVendor(
          oslSchedulesObj.supplierCode.id,
          data.id
        );

        if (osl) {
          // OSL record exists, use existing OSL Bill Number
          oslSchedulesObj['oslBillNo'] = osl.osl_bill_no;
        } else {
          // OSL record does not exist, generate a new OSL Bill Number
          const oslBillNo = await generateOSLBill(
            'WOB',
            user.outlet.outletCode
          );
          oslSchedulesObj['oslBillNo'] = oslBillNo;
        }
        oslSchedulesObj['transactionId'] = data.id;
        await JobCardDao.createOslSchedule(oslSchedulesObj, user);
      }
      //
      parts.forEach(async (partsIndent) => {
        partsIndent['transactionId'] = data.id;
        await JobCardDao.createPartsIndent(partsIndent, user);
      });
      result = 'success';
    }
    if (result == 'success') {
      logger.info('ServiceEstimate call : ' + reqData.serviceEstimateId);
      if (reqData.serviceEstimateId) {
        await JobCardDao.updateServiceEstimateStatus(
          reqData.serviceEstimateId,
          user
        );
        logger.info('ServiceEstimate status updated');
      }
    }
    if (Object.keys(data).length > 0) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Job Card';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        ' Job Card created for ' + reqData.registrationNumber;
      const recent =
        RecentAcivityService.addTransactionRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('Job Card Service  createJobCard', err);
    // next(err);
  }
  return result;
};

const createJobCardFromServiceBooking = async (reqData, user) => {
  try {
    if (!Array.isArray(reqData.labor) || reqData.labor.length === 0) {
      return { result: 'noLabor' };
    }
    const serviceBookingId = Number(reqData.serviceBookingId);
    const existingBooking = await JobCardDao.getServiceBookingForJobCard(
      serviceBookingId,
      user.outlet.id
    );
    if (!existingBooking) return { result: 'serviceBookingNotFound' };

    const existingJobCard = await JobCardDao.getJobCardByServiceBookingId(
      serviceBookingId,
      user.outlet.id
    );
    if (existingJobCard) {
      return {
        result: 'alreadyCreated',
        jobCardId: existingJobCard.id,
        jobCardNumber: existingJobCard.job_card_no,
      };
    }

    const registrationNumber = reqData.registrationNumber || existingBooking.registrationNumber;
    const activeJobCard = await JobCardDao.findJobCardByStatus(registrationNumber);
    if (activeJobCard) return { result: 'jobCardAlreadyInProgress' };
    const customerData = await getCustomerData(registrationNumber);
    if (!customerData?.vehicleId || !customerData?.customeId ||
        (existingBooking.vehicleId && Number(existingBooking.vehicleId) !== Number(customerData.vehicleId)) ||
        (existingBooking.customeId && Number(existingBooking.customeId) !== Number(customerData.customeId))) {
      return { result: 'linkedCustomerVehicleNotFound' };
    }

    let sourceId = Number(existingBooking.dmsSourceId || reqData.sourceId);
    let sourceTypeId = Number(existingBooking.dmsSourceTypeId || reqData.sourceTypeId);
    if (!sourceId) {
      const sourceData = await JobCardDao.getIdBySourceMobile('Digital');
      sourceId = Number(sourceData?.id);
    }
    if (!sourceTypeId && existingBooking.source) {
      const sourceTypeData = await JobCardDao.getIdBySourceTypeMobile(existingBooking.source);
      sourceTypeId = Number(sourceTypeData?.id);
    }
    const repairTypeId = Number(reqData.repairTypeId);
    const serviceTypeId = Number(reqData.serviceTypeId);
    const labor = reqData.labor.map((item) => ({
      ...item,
      repairType: item.repairType || {
        id: repairTypeId,
        repairTypeName: reqData.repairTypeName || '',
      },
    }));
    const jobCardRequest = {
      ...reqData,
      documentType: 'RJC',
      registrationNumber,
      serviceBookingId,
      serviceEstimateId: null,
      customerArrivedDate: reqData.customerArrivedDate || new Date(),
      repairTypeId,
      serviceTypeId,
      odometer: reqData.odometer ?? existingBooking.odometer ?? 0,
      sourceId,
      sourceTypeId,
      labor,
      oslLabor: Array.isArray(reqData.oslLabor) ? reqData.oslLabor : [],
      parts: Array.isArray(reqData.parts) ? reqData.parts : [],
      dsaAgent: reqData.dsaAgent || { id: 0, dsaCode: '' },
      OtdFailureReason: reqData.OtdFailureReason || { id: 0, reason: '' },
      TransactionSubStatus: reqData.TransactionSubStatus || '',
      paidByStatus: reqData.paidByStatus ?? 0,
    };

    if (!Number.isInteger(repairTypeId) || repairTypeId < 1 ||
        !Number.isInteger(serviceTypeId) || serviceTypeId < 1 ||
        !Number.isInteger(sourceId) || sourceId < 1 ||
        !Number.isInteger(sourceTypeId) || sourceTypeId < 1) {
      return { result: 'jobCardReferenceDataRequired' };
    }

    const result = await createJobCard(jobCardRequest, user);
    if (result !== 'success') return { result };

    const createdJobCard = await JobCardDao.getJobCardByServiceBookingId(
      serviceBookingId,
      user.outlet.id
    );
    if (!createdJobCard) return { result: 'failed' };

    await JobCardDao.saveServiceBookingJobCardActivity(
      serviceBookingId,
      createdJobCard.id,
      user.id
    );
    return {
      result: 'success',
      jobCardId: createdJobCard.id,
      jobCardNumber: createdJobCard.job_card_no,
    };
  } catch (err) {
    logger.error('Job Card Service createJobCardFromServiceBooking', err);
    throw err;
  }
};

const createInitialPortalJobCard = async (reqData, user) => {
  const registrationNumber = String(reqData.registrationNumber || '').trim().toUpperCase();
  const mobileNumber = String(reqData.mobileNumber || '').trim();
  const normalizedName = String(reqData.name || '').trim();
  const documentType = String(reqData.documentType || 'RJC').trim().toUpperCase();

  if (!['RJC', 'AJC', 'MINOR', 'MAJOR'].includes(documentType)) {
    return { result: 'invalidDocumentType' };
  }

  const booking = await ServiceEstimateDao.findActiveServiceBookingForEstimate(
    registrationNumber,
    mobileNumber
  );
  if (booking) return { result: 'serviceBookingAvailable', serviceBookingId: booking.id };

  const estimate = await ServiceEstimateDao.findOpenServiceEstimate(registrationNumber);
  if (estimate) return { result: 'serviceEstimateAvailable', serviceEstimateId: estimate.id };

  if (await JobCardDao.findJobCardByStatus(registrationNumber)) {
    return { result: 'jobCardAlreadyInProgress' };
  }

  let vehicle = await JobCardDao.findPortalVehicleByRegistration(registrationNumber);
  let customer = await CustomerDao.findByMobileNumber(mobileNumber);
  let alternativeMobileNumber = null;
  let createdCustomerVehicle = false;

  if (vehicle && vehicle.customerId) {
    customer = await CustomerDao.findByCustomerId(vehicle.customerId);
    if (!customer) return { result: 'linkedCustomerNotFound' };
    const ownerMobile = customer.dataValues.decryptedMobileNumber || '';
    if (ownerMobile !== mobileNumber) {
      await JobCardDao.setVehicleAlternativeMobile(vehicle.id, mobileNumber, user.id);
      alternativeMobileNumber = mobileNumber;
    }
  } else if (vehicle) {
    if (!customer) {
      const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
      const created = await CustomerDao.quickAddPortalCustomer({
        firstName,
        lastName: lastNameParts.join(' ') || null,
        mobileNumber,
        pinCode: reqData.pinCode || '',
        address1: reqData.address1 || '',
      }, user);
      customer = await CustomerDao.findByCustomerId(created.customerId);
      createdCustomerVehicle = true;
    }
    await JobCardDao.linkPortalVehicleToCustomer(vehicle.id, customer.id, user.id);
  } else if (customer) {
    const linked = await CustomerDao.quickAddVehicleForCustomer({
      customerId: customer.id,
      registrationNumber,
      makeId: Number(reqData.makeId),
      modelId: Number(reqData.modelId),
      fuelType: reqData.fuelType || 'Petrol',
    }, user);
    vehicle = await JobCardDao.findPortalVehicleByRegistration(registrationNumber);
    customer = await CustomerDao.findByCustomerId(linked.customerId);
    createdCustomerVehicle = true;
    if (!vehicle || Number(vehicle.id) !== Number(linked.vehicleId)) {
      return { result: 'customerVehicleCreateFailed' };
    }
  } else {
    const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
    const linked = await CustomerDao.quickAddCustomer({
      firstName,
      lastName: lastNameParts.join(' ') || null,
      name: normalizedName,
      mobileNumber,
      pinCode: reqData.pinCode || '',
      address1: reqData.address1 || '',
      registrationNumber,
      makeId: Number(reqData.makeId),
      modelId: Number(reqData.modelId),
      fuelType: reqData.fuelType || 'Petrol',
    }, user);
    vehicle = await JobCardDao.findPortalVehicleByRegistration(registrationNumber);
    customer = await CustomerDao.findByCustomerId(linked.customerId);
    createdCustomerVehicle = true;
  }

  if (!vehicle || !customer) return { result: 'customerVehicleNotFound' };
  const customerName = [customer.dataValues.decryptedFirstName, customer.dataValues.decryptedLastName]
    .filter(Boolean).join(' ').trim();
  const jobCardNumber = await generateJobCardNumber(documentType, user.outlet.outletCode);
  const jobCard = await JobCardDao.createInitialPortalJobCard({
    jobCardNumber,
    registrationNumber,
    mobileNumber: customer.dataValues.decryptedMobileNumber || mobileNumber,
    odometer: reqData.odometer || vehicle.odometer || 0,
    documentType,
    repairTypeId: 1,
    serviceTypeId: 1,
    sourceId: 1,
    sourceTypeId: 1,
    customer: {
      id: customer.id,
      customerCode: customer.customerCode,
      name: customerName || normalizedName,
      address1: customer.address1,
      state: customer.state,
      city: customer.city,
      pinCode: customer.pinCode,
      customerType: customer.customerType,
      email: customer.dataValues.decryptedEmailId,
    },
    vehicle,
  }, user);

  return {
    result: 'success',
    jobCardId: jobCard.id,
    jobCardNumber: jobCard.job_card_no,
    customerId: customer.id,
    vehicleId: vehicle.id,
    alternativeMobileNumber,
    message: alternativeMobileNumber
      ? 'Mobile number saved as an alternative number for this vehicle'
      : 'Job card created successfully',
    createdCustomerVehicle,
  };
};

const savePortalJobCardInspection = async (reqData, user) => {
  const result = await JobCardDao.savePortalJobCardInspection(
    Number(reqData.jobCardId),
    reqData,
    user
  );
  return {
    jobCardId: result.id,
    odometer: result.odometer,
    fuelLevel: Number(result.fuel_level_percentage),
    inventoryCount: reqData.inventory.length,
    inspectionCount: reqData.inspection.length,
    complaintAdviceCount: (reqData.complaintAdvice || []).length,
  };
};

const createMechanicMapping = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let data = {};
  let allData = [];

  try {
    if (reqData.mechanics) {
      const mechanics = reqData.mechanics;

      let schedulePercentages = {};
      for (const element of reqData.mechanics) {
        if (schedulePercentages[element.schedule_id]) {
          schedulePercentages[element.schedule_id] += element.percentage;
        } else {
          schedulePercentages[element.schedule_id] = element.percentage;
        }
      }

      let allMeetCondition = false;
      for (const [key, value] of Object.entries(schedulePercentages)) {
        if (value > 100) {
          allMeetCondition = true;
          break;
        }
      }

      if (allMeetCondition) {
        result = 'greater';
      } else {
        const existingMechanicList =
          await JobCardDao.getMechanicMapByTransactionId(
            reqData.transaction_id
          );
        const diffMechanic = existingMechanicList.filter(
          (item1) =>
            !reqData.mechanics.some(
              (item2) => item2.schedule_id === item1.schedule_id
            )
        );
        for (const mechanic of diffMechanic) {
          if (mechanic.id !== undefined && mechanic.id !== null) {
            await JobCardDao.deleteMechanicMapByMechanicId(mechanic.id);
          }
        }

        for (const mechanicObj of mechanics) {
          mechanicObj['transaction_id'] = reqData.transaction_id;
          let existingMechanicData =
            await JobCardDao.getMechanicMapByTransactionIdMechanicId(
              mechanicObj.id
              // reqData.transaction_id,
              // mechanicObj.schedule_id,
              // mechanicObj.mechanic_id
            );

          if (existingMechanicData.length > 0) {
            data = await JobCardDao.updateMechanicMapping(mechanicObj, user);
          } else {
            data = await JobCardDao.createMechanicMapping(mechanicObj, user);
          }
          if (data) {
            allData.push(data.dataValues);
          }
          result = 'success';
        }
      }
    }

    if (allData.length >= 1) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Job Card Mechanic mapping';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        ' Mechanic mapped ' + reqData.transaction_id;
      const recent =
        RecentAcivityService.addTransactionRecentActivity(recentActivityData);
      const jobCardStatus = {
        status: 2,
        id: reqData.transaction_id,
      };
      let data = await JobCardDao.updateJobcardMechanicMap(jobCardStatus, user);

      result = 'success';
    }
  } catch (err) {
    logger.error('Job Card Service  createJobCard', err);
    // next(err);
  }
  return result;
};

const generateJobCardNumber = async (jobType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentJobCardData = await JobCardDao.getRecentJobCardForJcNo(
    jobType,
    outletCode,
    currentYear
  );
  if (recentJobCardData) {
    const lastNumber = recentJobCardData.job_card_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `${jobType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const listJobCards = async (reqData, user) => {
  try {
    const { totalItems, data, dashboardStatusCounts = [] } = await JobCardDao.listJobCards(reqData, user);
    const displayStatusByCode = {
      1: 'Initiated',
      2: 'In Progress',
      3: 'Ready for Billing',
      4: 'Billing',
      5: 'Delivered',
      6: 'Cancelled',
    };
    const statusCounts = Object.fromEntries(
      Object.entries(displayStatusByCode).map(([status, label]) => [label, 0])
    );
    for (const row of dashboardStatusCounts) {
      const label = displayStatusByCode[Number(row.status)];
      if (label) statusCounts[label] = Number(row.count || 0);
    }

    return {
      totalItems: totalItems,
      data: data.map((row) => {
        const item = row.get ? row.get({ plain: true }) : row;
        return {
          ...item,
          displayStatus: displayStatusByCode[Number(item.status)] || item.status_value,
        };
      }),
      statusCounts,
    };
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    throw err;
  }
};

const getJobCardDetailsById = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.getJobCardDetailsById(
      reqData,
      user
    );
    return {
      // totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const getJobCardDetailsByIdOutlet = async (reqData, user) => {
  try {
    const { data } = await JobCardDao.getJobCardDetailsByIdOutlet(
      reqData,
      user
    );
    return {
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service getJobCardDetailsByIdOutlet', err);
    throw err;
  }
};

// Outlet edit save: reuse the standard updateJobCard, then persist each part's
// discount to parts_indent.discount (updateJobCard's updatePartsIndent doesn't write
// the discount column). Scoped to /jobcard/outletEdit only — mirrors legacy outlet_add.
const updateJobCardOutlet = async (jobCard, user) => {
  try {
    // Capture the original ownership before the shared updateJobCard overwrites
    // created_by/outlet_id/outlet_code with the editing Outlet Admin's identity.
    const original = await JobCardDao.getJobCard(jobCard.id);

    const result = await updateJobCard(jobCard, user);

    if (result === 'success') {
      // Restore the original ownership so the card stays with its creator/outlet
      // (otherwise it disappears from the creator's /jobcard list).
      if (original) {
        await JobCardDao.restoreJobCardOwnership(jobCard.id, {
          created_by: original.created_by,
          outlet_id: original.outlet_id,
          outlet_code: original.outlet_code,
        });
      }

      if (Array.isArray(jobCard.parts)) {
        for (const part of jobCard.parts) {
          if (part.id !== undefined && part.id !== null) {
            await JobCardDao.updatePartsIndentDiscount(
              part.id,
              part.discountAmount
            );
          }
        }
      }
    }
    return result;
  } catch (err) {
    logger.error('JobCard service updateJobCardOutlet', err);
    throw err;
  }
};

const getJobCardViewById = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.getJobCardViewById(
      reqData,
      user
    );
    // console.log("service data==================",data);
    // console.log("service totalItems==================",user);
    if (
      user.outlet.companyId == 2 ||
      user.outlet.companyId == 5 ||
      (user.outlet.companyId == 8 && data.status <= 2)
    ) {
      if (data.jcCustomerMapping.is_b2b != 1) {
        if (data.document_type == 'RJC') {
          const rsaUpdateDetails = await CreateScheduleForRSAByCompanyId(
            reqData,
            user
          );
          if (rsaUpdateDetails.requestSuccessful == false) {
            logger.error(
              'rsa creation and fit push issue function name : CreateScheduleForRSAByCompanyId',
              rsaUpdateDetails
            );
            // return {
            //   requestSuccessful : false,
            //   message : "rsa creation and fit push issue"
            // }
          }
        } else if (data.document_type == 'AJC' && data.paid_by_status == 2) {
          const rsaUpdateDetails = await CreateScheduleForRSAByCompanyId(
            reqData,
            user
          );

          if (rsaUpdateDetails.requestSuccessful == false) {
            logger.error(
              'rsa creation and fit push issue function name : CreateScheduleForRSAByCompanyId',
              rsaUpdateDetails
            );
            // return {
            //   requestSuccessful : false,
            //   message : "rsa creation and fit push issue"
            // }
          }
        }
      }
    }
    if (user.outlet.companyId == 3 && data.status == 2 && data.source != 48) {
      const mcflRsaDetails = await mcflRsa(reqData, user);
      if (mcflRsaDetails.requestSuccessful == false) {
        logger.error(
          'rsa creation and fit push issue function name : mcflRsa',
          mcflRsaDetails
        );
        // return {
        //   requestSuccessful : false,
        //   message : "rsa creation and fit push issue"
        // }
      }
    }

    // return false;
    // console
    // need to ask siva if rsa or fit push data got failed need to stop this api call
    return {
      // totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service view details', err);
    next(err);
  }
};

// Outlet view (/jobcard/outletJC -> View): reuse getJobCardViewById, then filter
// labour + OSL rows to status IN (1,2) to match the legacy outlet service_view.
// Parts already come back as partsIssue with quantity > 0 (also matches legacy).
const getJobCardViewByIdOutlet = async (reqData, user) => {
  try {
    const result = await getJobCardViewById(reqData, user);
    if (result && result.data) {
      if (Array.isArray(result.data.schedules)) {
        result.data.schedules = result.data.schedules.filter(
          (s) => s.status === 1 || s.status === 2
        );
      }
      if (Array.isArray(result.data.oslSchedules)) {
        result.data.oslSchedules = result.data.oslSchedules.filter(
          (o) => o.status === 1 || o.status === 2
        );
      }
    }
    return result;
  } catch (err) {
    logger.error('JobCard service getJobCardViewByIdOutlet', err);
    throw err;
  }
};

const listJobCards_v1 = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.listJobCards_v1(
      reqData,
      user
    );
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const getJobCardViewByIdAdmin = async (reqData, user) => {
  try {
    const { data } = await JobCardDao.getJobCardViewByIdAdmin(reqData, user);
    return {
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service getJobCardViewByIdAdmin', err);
    next(err);
  }
};

const listJobCardsAdmin = async (reqData, user) => {
  try {
    const { totalItems, data } = await JobCardDao.listJobCardsAdmin(
      reqData,
      user
    );
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCardsAdmin', err);
    throw err;
  }
};

const listJobCardsByMappedOutlets = async (reqData, user) => {
  try {
    const { totalItems, data } = await JobCardDao.listJobCardsByMappedOutlets(
      reqData,
      user
    );
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCardsByMappedOutlets', err);
    throw err;
  }
};

const listJobCardsData = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.listJobCardsData(
      reqData,
      user
    );
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCardsData', err);
    next(err);
  }
};

const dashboard = async (user) => {
  let totalBillAmountWithTax = 0;
  let totalBillAmountWithoutTax = 0;
  let totalBillAmountWithTaxRJC = 0;
  let totalBillAmountWithoutTaxRJC = 0;
  let totalBillAmountWithTaxAJC = 0;
  let totalBillAmountWithoutTaxAJC = 0;
  let totalBillCount = 0;
  let totalBillCountRJC = 0;
  let totalBillCountAJC = 0;
  let totalWipWithTax = 0;
  let totalWipWithOutTax = 0;
  let wipValueRjcWithTax = 0;
  let wipValueRjcWithOutTax = 0;
  let wipValueAjcWithTax = 0;
  let wipValueAjcWithOutTax = 0;
  let wipRjcCount = 0;
  let wipAjcCount = 0;
  let totalWipCount = 0;
  let InflowRJC = 0;
  let InflowAJC = 0;
  let stoRJC = 0;
  let lmStoRJC = 0;
  let stoAJC = 0;
  let lmStoAJC = 0;
  let cdAmountRJC = 0;
  let cdAmountAJC = 0;
  let lmcdAmountRJC = 0;
  let lmcdAmountAJC = 0;
  let totalLmBillAmountWithoutTaxRJC = 0;
  let totalLmBillAmountWithoutTaxAJC = 0;
  let totalBillLabAmountWithoutTaxRJC = 0;
  let totalBillLabAmountWithoutTaxAJC = 0;
  let totalBillPartAmountWithoutTaxRJC = 0;
  let totalBillPartAmountWithoutTaxAJC = 0;
  let cdLaborAmtRJC = 0;
  let cdPartAmtRJC = 0;
  let cdLaborAmtAJC = 0;
  let cdPartAmtAJC = 0;
  let totalToRJC = 0;
  let totalToAJC = 0;
  let receiptAmountRJC = 0;
  let receiptAmountAJC = 0;

  try {
    const {
      count,
      rows,
      billData,
      rowsWithoutStatus,
      billDataLM,
      monthlyTargetData,
      receiptData,
    } = await JobCardDao.dashboard(user);
    // console.log("monthlyTargetData=========================",receiptData);
    // console.log("monthlyTargetData-------------------------",receiptData.get({plain:true}));
    const monthlyTarget = monthlyTargetData
      ? monthlyTargetData.get({ plain: true })
      : {};

    for (const jobcard of rowsWithoutStatus) {
      if (jobcard.document_type === 'RJC') {
        InflowRJC++;
      } else {
        InflowAJC++;
      }
    }

    for (const receipt of receiptData) {
      // console.log("receipt=========================111111111",receipt.get({plain:true}));
      if (receipt.jc_number.split('-')[0] === 'RJC') {
        receiptAmountRJC += receipt.amount;
      } else {
        receiptAmountAJC += receipt.amount;
      }
    }

    // console.log('receiptAmountRJC=========================', receiptAmountRJC);
    // console.log('receiptAmountAJC=========================', receiptAmountAJC);

    const getNumber = (v) => Number(v || 0);

    const targetInflowRJC = getNumber(monthlyTarget.target_in_flow_rjc);
    const targetInflowAJC = getNumber(monthlyTarget.target_in_flow_ajc);
    const targetBilledRJC = getNumber(monthlyTarget.target_billed_rjc);
    const targetBilledAJC = getNumber(monthlyTarget.target_billed_ajc);
    const targetLaboursToRJC = getNumber(monthlyTarget.target_labours_to_rjc);
    const targetLaboursToAJC = getNumber(monthlyTarget.target_labours_to_ajc);
    const targetPartsToRJC = getNumber(monthlyTarget.target_parts_to_rjc);
    const targetPartsToAJC = getNumber(monthlyTarget.target_parts_to_ajc);

    const inflowAchievedPercentRJC =
      targetInflowRJC > 0 ? (InflowRJC / targetInflowRJC) * 100 : 0;

    // console.log(
    //   'inflowAchievedPercentRJC-------------------------',
    //   inflowAchievedPercentRJC
    // );

    const inflowAchievedPercentAJC =
      targetInflowAJC > 0 ? (InflowAJC / targetInflowAJC) * 100 : 0;

    for (const jobcard of rows) {
      let jobcardData = {};
      jobcardData = jobcard;

      const calcLabour = commonLogic.calcSchedules(jobcard.schedules, 'RJC');
      const calcOslLabour = commonLogic.calcOslSchedules(
        jobcard.oslSchedules,
        'RJC'
      );
      const calcPartsIssue = commonLogic.calcPartsIssue(jobcard.partsIssue);

      totalWipWithTax +=
        parseFloat(calcLabour.totalLaborAmount) +
        parseFloat(calcOslLabour.totalLaborAmount) +
        parseFloat(calcPartsIssue.totalPartsAmount);
      totalWipWithOutTax +=
        parseFloat(calcLabour.labBeforeTaxAmt) +
        parseFloat(calcOslLabour.labBeforeTaxAmt) +
        parseFloat(calcPartsIssue.totalPartsRate);

      if (jobcard.document_type === 'RJC') {
        wipRjcCount++;
        wipValueRjcWithTax +=
          parseFloat(calcLabour.totalLaborAmount) +
          parseFloat(calcOslLabour.totalLaborAmount) +
          parseFloat(calcPartsIssue.totalPartsAmount);
        wipValueRjcWithOutTax +=
          parseFloat(calcLabour.labBeforeTaxAmt) +
          parseFloat(calcOslLabour.labBeforeTaxAmt) +
          parseFloat(calcPartsIssue.totalPartsRate);
      } else {
        wipAjcCount++;
        wipValueAjcWithTax +=
          parseFloat(calcLabour.totalLaborAmount) +
          parseFloat(calcOslLabour.totalLaborAmount) +
          parseFloat(calcPartsIssue.totalPartsAmount);
        wipValueAjcWithOutTax +=
          parseFloat(calcLabour.labBeforeTaxAmt) +
          parseFloat(calcOslLabour.labBeforeTaxAmt) +
          parseFloat(calcPartsIssue.totalPartsRate);
      }

      // for (const labors of jobcard.schedules) {
      //   totalWipWithTax += labors.laborTotal;
      //   totalWipWithOutTax += labors.amount;

      //   if (jobcard.document_type === "RJC") {
      //     wipValueRjcWithTax += labors.laborTotal;
      //     wipValueRjcWithOutTax += labors.amount;
      //   }
      //   else {
      //     wipValueAjcWithTax += labors.laborTotal;
      //     wipValueAjcWithOutTax += labors.amount;
      //   }
      // }

      // for (const osl of jobcard.oslSchedules) {
      //   totalWipWithTax += osl.laborTotal;
      //   totalWipWithOutTax += osl.amount;

      //   if (jobcard.document_type === "RJC") {
      //     wipValueRjcWithTax += osl.laborTotal;
      //     wipValueRjcWithOutTax += osl.amount;
      //   }
      //   else {
      //     wipValueAjcWithTax += osl.laborTotal;
      //     wipValueAjcWithOutTax += osl.amount;
      //   }
      // }

      // for (const parts of jobcard.partsIndent) {
      //   totalWipWithTax += parts.part_total;
      //   totalWipWithOutTax += parts.amount;

      //   if (jobcard.document_type === "RJC") {
      //     wipValueRjcWithTax += parts.part_total;
      //     wipValueRjcWithOutTax += parts.amount;
      //   }
      //   else {
      //     wipValueAjcWithTax += parts.part_total;
      //     wipValueAjcWithOutTax += parts.amount;
      //   }
      // }
    }
    for (const bill of billData) {
      let billings = {};
      billings = bill;

      if (bill.jobcard.document_type === 'RJC') {
        for (const cdnote of bill.jobcard.creditNotes) {
          cdAmountRJC += cdnote.amount;
          for (const cdDetails of cdnote?.creditNotesDetails) {
            if (cdDetails.itemType === 1 || cdDetails.itemType === 2) {
              cdLaborAmtRJC += cdDetails.total;
            } else {
              cdPartAmtRJC += cdDetails.total;
            }
          }
        }
        billings.dataValues['isRJC'] = true;
        totalBillCountRJC++;
        totalBillLabAmountWithoutTaxRJC +=
          billings.labor_amount + billings.osl_labor_amount;
        totalBillPartAmountWithoutTaxRJC += billings.parts_amount;
        totalBillAmountWithTaxRJC += billings.total_amount;
        totalBillAmountWithoutTaxRJC +=
          billings.labor_amount +
          billings.osl_labor_amount +
          billings.parts_amount;
      } else {
        for (const cdnote of bill.jobcard.creditNotes) {
          cdAmountAJC += cdnote.amount;
          for (const cdDetails of cdnote?.creditNotesDetails) {
            if (cdDetails.itemType === 1 || cdDetails.itemType === 2) {
              cdLaborAmtAJC += cdDetails.total;
            } else {
              cdPartAmtAJC += cdDetails.total;
            }
          }
        }
        billings.dataValues['isRJC'] = false;
        totalBillCountAJC++;
        totalBillLabAmountWithoutTaxAJC +=
          billings.labor_amount + billings.osl_labor_amount;
        totalBillPartAmountWithoutTaxAJC += billings.parts_amount;
        totalBillAmountWithTaxAJC += billings.total_amount;
        totalBillAmountWithoutTaxAJC +=
          billings.labor_amount +
          billings.osl_labor_amount +
          billings.parts_amount;
      }

      totalBillAmountWithTax += billings.total_amount;
      totalBillAmountWithoutTax +=
        billings.labor_amount +
        billings.osl_labor_amount +
        billings.parts_amount;
    }

    stoRJC = totalBillAmountWithoutTaxRJC - cdAmountRJC;
    stoAJC = totalBillAmountWithoutTaxAJC - cdAmountAJC;
    totalBillLabAmountWithoutTaxRJC =
      totalBillLabAmountWithoutTaxRJC - cdLaborAmtRJC;
    totalBillPartAmountWithoutTaxRJC =
      totalBillPartAmountWithoutTaxRJC - cdPartAmtRJC;
    totalBillLabAmountWithoutTaxAJC =
      totalBillLabAmountWithoutTaxAJC - cdLaborAmtAJC;
    totalBillPartAmountWithoutTaxAJC =
      totalBillPartAmountWithoutTaxAJC - cdPartAmtAJC;

    totalToRJC =
      totalBillLabAmountWithoutTaxRJC + totalBillPartAmountWithoutTaxRJC;
    totalToAJC =
      totalBillLabAmountWithoutTaxAJC + totalBillPartAmountWithoutTaxAJC;

    for (const bill of billDataLM) {
      let billings = {};
      billings = bill;

      if (bill.jobcard.document_type === 'RJC') {
        for (const cdnote of bill.jobcard.creditNotes) {
          lmcdAmountRJC += cdnote.amount;
        }
        totalLmBillAmountWithoutTaxRJC +=
          billings.labor_amount +
          billings.osl_labor_amount +
          billings.parts_amount;
      } else {
        for (const cdnote of bill.jobcard.creditNotes) {
          lmcdAmountAJC += cdnote.amount;
        }
        totalLmBillAmountWithoutTaxAJC +=
          billings.labor_amount +
          billings.osl_labor_amount +
          billings.parts_amount;
      }
    }

    lmStoRJC = totalLmBillAmountWithoutTaxRJC - lmcdAmountRJC;
    lmStoAJC = totalLmBillAmountWithoutTaxAJC - lmcdAmountAJC;

    let counts = count + billData.length;
    totalBillCount = billData.length;
    totalWipCount = count;

    return {
      counts,
      totalBillCount,
      totalBillCountRJC,
      totalBillCountAJC,
      totalBillAmountWithTax,
      totalBillAmountWithoutTax,
      totalBillAmountWithTaxRJC,
      totalBillAmountWithoutTaxRJC,
      totalBillAmountWithTaxAJC,
      totalBillAmountWithoutTaxAJC,
      totalWipWithTax,
      totalWipWithOutTax,
      wipValueRjcWithTax,
      wipValueRjcWithOutTax,
      wipValueAjcWithTax,
      wipValueAjcWithOutTax,
      wipRjcCount,
      wipAjcCount,
      totalWipCount,
      stoRJC,
      stoAJC,
      lmStoRJC,
      lmStoAJC,
      InflowRJC,
      InflowAJC,
      totalBillLabAmountWithoutTaxRJC,
      totalBillPartAmountWithoutTaxRJC,
      totalBillLabAmountWithoutTaxAJC,
      totalBillPartAmountWithoutTaxAJC,
      totalToRJC,
      totalToAJC,
      receiptAmountAJC,
      receiptAmountRJC,

      targets: {
        inflow: {
          RJC: targetInflowRJC,
          AJC: targetInflowAJC,
        },
        billed: {
          RJC: targetBilledRJC,
          AJC: targetBilledAJC,
        },
        laboursTo: {
          RJC: targetLaboursToRJC,
          AJC: targetLaboursToAJC,
        },
        partsTo: {
          RJC: targetPartsToRJC,
          AJC: targetPartsToAJC,
        },
      },
      achievedPercent: {
        inflow: {
          RJC: inflowAchievedPercentRJC,
          AJC: inflowAchievedPercentAJC,
        },
      },
      receiptData,
    };
  } catch (err) {
    logger.error('JobCard service dashboard', err);
    next(err);
  }
};

const dashboardEpro = async (body, user) => {
  try {
    const data = await JobCardDao.dashboardEpro(body, user);
    // console.log('dashboardEpro data=========================', data);
    const option = body.option || 'monthly';
    if (option === 'monthly') {
      const today = new Date();

      const year = today.getFullYear();
      const month = today.getMonth(); // 0-based
      const totalDays = today.getDate(); // till today

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Build labels: "1 Mon", "2 Tue", ...
      const labels = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(year, month, i + 1);
        return `${i + 1} ${dayNames[date.getDay()]}`;
      });

      // Normalize API data
      const map = Object.fromEntries(
        data.map((d) => [d.period.trim(), d.amount])
      );

      return labels.map((label) => ({
        period: label,
        amount: map[label.split(' ')[0]] || 0,
      }));
    } 

    const MONTH_GROUPS = {
      q1: ['Apr', 'May', 'Jun'],
      q2: ['Jul', 'Aug', 'Sep'],
      q3: ['Oct', 'Nov', 'Dec'],
      q4: ['Jan', 'Feb', 'Mar'],
      halfyearly: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      yearly: [
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
        'Jan',
        'Feb',
        'Mar',
      ],
      preyear: [
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
        'Jan',
        'Feb',
        'Mar',
      ],
    };

    if (MONTH_GROUPS[option]) {
      const map = Object.fromEntries(
        data.map((d) => [String(d.period).trim().toLowerCase(), d.amount])
      );

      return MONTH_GROUPS[option].map((month) => ({
        period: month,
        amount: map[month.toLowerCase()] || 0,
      }));
    }

    return data;
  } catch (err) {
    logger.error('JobCard service dashboardEpro error', err);
    throw err;
  }
};

const dashboardRevenue = async (body, user) => {
  try {
    // const data = await JobCardDao.dashboardRevenue(body, user);
    const outletCode = user.outlet.outletCode;
    const [data, oldData] = await Promise.all([
      JobCardDao.dashboardRevenue(body, user),
      JobCardDao.oldDmsDashboardRevenue({ outletCode })
    ]);

    let totalMechMTD = 0;
    let totalBodyMTD = 0;
    let totalMechYTD = 0;
    let totalBodyYTD = 0;

    const now = new Date();

    const fyStart =
      now.getMonth() >= 3
        ? new Date(now.getFullYear(), 3, 1)
        : new Date(now.getFullYear() - 1, 3, 1);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    data.forEach((item) => {
      const revenue =
        Number(item.labor_amount || 0) +
        Number(item.osl_labor_amount || 0) +
        Number(item.parts_amount || 0);

      const txnDate = new Date(item.createdAt);

      const isMTD =
        txnDate.getMonth() === currentMonth &&
        txnDate.getFullYear() === currentYear;

      const isFY = txnDate >= fyStart;

      const isMech = item.jobcard_no?.startsWith('RJC');

      /* ---------- FINANCIAL YTD ---------- */
      if (isFY) {
        if (isMech) totalMechYTD += revenue;
        else totalBodyYTD += revenue;
      }

      /* ---------- MONTH TO DATE ---------- */
      if (isMTD) {
        if (isMech) totalMechMTD += revenue;
        else totalBodyMTD += revenue;
      }
    });

    const old = oldData || {
      totalMechMTD: 0,
      totalBodyMTD: 0,
      totalMechYTD: 0,
      totalBodyYTD: 0,
      totalSalesMTD: 0,
      totalSalesYTD: 0
    };

    const finalMechMTD = totalMechMTD + old.totalMechMTD;
    const finalBodyMTD = totalBodyMTD + old.totalBodyMTD;
    const finalMechYTD = totalMechYTD + old.totalMechYTD;
    const finalBodyYTD = totalBodyYTD + old.totalBodyYTD;

    return {
      totalMechMTD: finalMechMTD,
      totalBodyMTD: finalBodyMTD,
      totalMechYTD: finalMechYTD,
      totalBodyYTD: finalBodyYTD,
      totalSalesMTD: finalMechMTD + finalBodyMTD,
      totalSalesYTD: finalMechYTD + finalBodyYTD,
      outletName: user.outlet.outletName,
    };
  } catch (err) {
    logger.error('JobCard service dashboardRevenue', err);
    throw err;
  }
};

// const transformAjcRjcData = (rows) => {
//   const ajcMap = {};
//   const rjcMap = {};

//   for (const row of rows) {
//     const {
//       period,
//       jobcard_no,
//       labor_amount = 0,
//       osl_labor_amount = 0,
//       parts_amount = 0
//     } = row;

//     const totalWithoutTax =
//       Number(labor_amount) +
//       Number(osl_labor_amount) +
//       Number(parts_amount);

//     // ---- AJC ----
//     if (jobcard_no.startsWith('AJC')) {
//       if (!ajcMap[period]) {
//         ajcMap[period] = 0;
//       }
//       ajcMap[period] += totalWithoutTax;
//     }

//     // ---- RJC ----
//     if (jobcard_no.startsWith('RJC')) {
//       if (!rjcMap[period]) {
//         rjcMap[period] = 0;
//       }
//       rjcMap[period] += totalWithoutTax;
//     }
//   }

//   // Convert maps to array format
//   const ajc = Object.keys(ajcMap).map((period) => ({
//     period,
//     totalAjc_withoutTax: Number(ajcMap[period].toFixed(2))
//   }));

//   const rjc = Object.keys(rjcMap).map((period) => ({
//     period,
//     totalRjc_withoutTax: Number(rjcMap[period].toFixed(2))
//   }));

//   return { ajc, rjc };
// };

const transformAjcRjcData = (rows, option, startDate, endDate) => {
  const ajcMap = {};
  const rjcMap = {};

  // 1️⃣ Aggregate DB rows
  for (const row of rows) {
    const {
      period,
      jobcard_no,
      labor_amount = 0,
      osl_labor_amount = 0,
      parts_amount = 0,
    } = row;

    const totalWithoutTax =
      Number(labor_amount) + Number(osl_labor_amount) + Number(parts_amount);

    if (jobcard_no.startsWith('AJC')) {
      ajcMap[period] = (ajcMap[period] || 0) + totalWithoutTax;
    }

    if (jobcard_no.startsWith('RJC')) {
      rjcMap[period] = (rjcMap[period] || 0) + totalWithoutTax;
    }
  }

  const ajc = [];
  const rjc = [];

  // 2️⃣ YEARLY → SAME AS BEFORE
  if (option === 'yearly') {
    const fyMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

    for (const month of fyMonths) {
      ajc.push({
        period: String(month),
        totalAjc_withoutTax: Number((ajcMap[month] || 0).toFixed(2)),
      });

      rjc.push({
        period: String(month),
        totalRjc_withoutTax: Number((rjcMap[month] || 0).toFixed(2)),
      });
    }
  } else {
    // 3️⃣ MONTHLY → Fill missing days
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDate();
      const weekday = d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toLowerCase();
      const periodKey = `${day} ${weekday}`;

      ajc.push({
        period: periodKey,
        totalAjc_withoutTax: Number((ajcMap[periodKey] || 0).toFixed(2)),
      });

      rjc.push({
        period: periodKey,
        totalRjc_withoutTax: Number((rjcMap[periodKey] || 0).toFixed(2)),
      });
    }
  }

  return { ajc, rjc };
};

// const dashboardAjcRjc = async (body, user) => {
//   try {
//     const data = await JobCardDao.dashboardAjcRjc(body, user);

//     if (body.option === 'monthly') {
//       const today = new Date();

//       const year = today.getFullYear();
//       const month = today.getMonth(); // 0-based
//       const totalDays = today.getDate(); // till today

//       const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//       // Build labels: "1 Mon", "2 Tue", ...
//       const labels = Array.from({ length: totalDays }, (_, i) => {
//         const date = new Date(year, month, i + 1);
//         return `${i + 1} ${dayNames[date.getDay()]}`;
//       });

//       // Normalize API data
//       const map = Object.fromEntries(
//         // data.map((d) => [d.period.trim(), { mech: d.mech, body: d.body }])
//         data.map((d) => [String(d.period).trim(), { mech: d.mech, body: d.body }])
//       );
//       return labels.map((label) => ({
//         period: label,
//         mech: map[label.split(' ')[0]]?.mech || 0,
//         body: map[label.split(' ')[0]]?.body || 0,
//       }));
//     } else if (body.option === 'yearly') {
//       const FY_MONTHS = [
//         'Apr',
//         'May',
//         'Jun',
//         'Jul',
//         'Aug',
//         'Sep',
//         'Oct',
//         'Nov',
//         'Dec',
//         'Jan',
//         'Feb',
//         'Mar',
//       ];

//       // Normalize API data
//       const map = Object.fromEntries(
//         data.map((d) => [
//           String(d.period).trim().toLowerCase(),
//           { mech: d.mech, body: d.body },
//         ])
//       );

//       return FY_MONTHS.map((month) => ({
//         period: month,
//         mech: map[month.toLowerCase()] ? map[month.toLowerCase()].mech : 0,
//         body: map[month.toLowerCase()] ? map[month.toLowerCase()].body : 0,
//       }));
//     }
//     return data;
//   } catch (err) {
//     // logger.error('JobCard service dashboard', err);
//     // next(err);
//     logger.error('JobCard service dashboardAjcRjc', err);
//     throw err;
//   }
// };


const dashboardAjcRjc = async (body, user) => {
  try {

    const option = String(
      body.option || 'monthly'
    ).toLowerCase();

    const data = await JobCardDao.dashboardAjcRjc(
      body,
      user
    );

    /* ---------------- MONTHLY ---------------- */

    if (option === 'monthly') {

      const today = new Date();

      const year = today.getFullYear();

      const month = today.getMonth();

      const totalDays = today.getDate();

      const dayNames = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ];

      const labels = Array.from(
        { length: totalDays },
        (_, i) => {

          const date = new Date(
            year,
            month,
            i + 1
          );

          return `${i + 1} ${
            dayNames[date.getDay()]
          }`;
        }
      );

      const map = Object.fromEntries(
        data.map((d) => [
          String(d.period).trim(),
          {
            mech: Number(d.mech || 0),
            body: Number(d.body || 0),
          },
        ])
      );

      return labels.map((label) => ({

        period: label,

        mech:
          map[label.split(' ')[0]]?.mech || 0,

        body:
          map[label.split(' ')[0]]?.body || 0,
      }));
    }

    /* ---------------- MONTH CONFIG ---------------- */

    const MONTH_LABELS = {
      apr: 'Apr',
      may: 'May',
      jun: 'Jun',
      jul: 'Jul',
      aug: 'Aug',
      sep: 'Sep',
      oct: 'Oct',
      nov: 'Nov',
      dec: 'Dec',
      jan: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
    };

    const OPTION_MONTHS = {

      q1: ['apr', 'may', 'jun'],

      q2: ['jul', 'aug', 'sep'],

      q3: ['oct', 'nov', 'dec'],

      q4: ['jan', 'feb', 'mar'],

      offyearly: [
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
      ],

      halfyearly: [
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
      ],

      yearly: [
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
        'jan',
        'feb',
        'mar',
      ],

      preyear: [
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
        'jan',
        'feb',
        'mar',
      ],
    };

    /* ---------------- COMMON HANDLER ---------------- */

    if (OPTION_MONTHS[option]) {

      const map = Object.fromEntries(
        data.map((d) => [
          String(d.period)
            .trim()
            .toLowerCase(),
          {
            mech: Number(d.mech || 0),
            body: Number(d.body || 0),
          },
        ])
      );

      return OPTION_MONTHS[option].map(
        (month) => ({

          period: MONTH_LABELS[month],

          mech: map[month]?.mech || 0,

          body: map[month]?.body || 0,
        })
      );
    }
console.log('final data to pass in frontend --------------',data)
    return data;

  } catch (err) {

    logger.error(
      'JobCard service dashboardAjcRjc',
      err
    );

    throw err;
  }
};


// labour parts dashboard
// const transformLabourPartsData = (rows, option, startDate, endDate) => {
//   const periodMap = {};

//   /* ---------------- 1️⃣ Aggregate DB rows ---------------- */
//   for (const row of rows) {
//     let {
//       period,
//       labor_amount = 0,
//       osl_labor_amount = 0,
//       parts_amount = 0,
//     } = row;

//     if (!periodMap[period]) {
//       periodMap[period] = {
//         labour_withoutTax: 0,
//         parts_withoutTax: 0,
//       };
//     }

//     periodMap[period].labour_withoutTax +=
//       Number(labor_amount) + Number(osl_labor_amount);

//     periodMap[period].parts_withoutTax += Number(parts_amount);
//   }

//   const result = [];

//   /* ---------------- 2️⃣ YEARLY → Financial Year ---------------- */
//   if (option === 'yearly') {
//     const fyMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

//     for (const month of fyMonths) {
//       result.push({
//         period: new Date(0, month - 1).toLocaleString('en-US', {
//           month: 'short',
//         }),
//         labour: Number((periodMap[month]?.labour_withoutTax || 0).toFixed(2)),
//         parts: Number((periodMap[month]?.parts_withoutTax || 0).toFixed(2)),
//       });
//     }
//   } else {

//     /* ---------------- 3️⃣ MONTHLY → Date-wise (1 sun) ---------------- */
//     for (
//       let d = new Date(startDate);
//       d <= endDate;
//       d.setDate(d.getDate() + 1)
//     ) {
//       const day = d.getDate();
//       const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });

//       const periodKey = `${day} ${weekday}`;

//       result.push({
//         period: periodKey,
//         labour: Number(
//           (periodMap[periodKey.split(' ')[0]]?.labour_withoutTax || 0).toFixed(
//             2
//           )
//         ),
//         parts: Number(
//           (periodMap[periodKey.split(' ')[0]]?.parts_withoutTax || 0).toFixed(2)
//         ),
//       });
//     }
//   }

//   console.log('labour parts periodMap:', JSON.stringify(periodMap));
//   console.log('labour parts result:', JSON.stringify(result));

//   return result;
// };

// const dashboardLabourParts = async (body, user) => {
//   try {
//     const data = await JobCardDao.dashboardLabourParts(body, user);
//     // console.log('dashboardLabourParts data=========================', data);
//     // 2️⃣ Compute dates ONLY for monthly
//     let startDate = null;
//     let endDate = null;

//     if (body.option == 'monthly') {
//       const now = new Date();
//       const year = now.getFullYear();
//       const month = now.getMonth();

//       startDate = new Date(year, month, 1); // 1st of month
//       endDate = new Date(year, month, now.getDate()); // today
//     }

//     const result = transformLabourPartsData(
//       data,
//       body.option,
//       startDate,
//       endDate
//     );

//     // console.log('result ----------', result);

//     return result;
//   } catch (err) {
//     logger.error('JobCard service dashboard', err);
//     next(err);
//   }
// };
//labour parts dashboard with dynamic date range for all options


const dashboardLabourParts = async (body, user) => {
  try {
    const response = await JobCardDao.dashboardLabourParts(body, user);

    console.log(
      'dashboardLabourParts data=========================',
      response
    );

    const rows = response || [];
    const option = body.option || 'monthly';

    let startDate = null;
    let endDate = null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

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

    /* ---------------- MONTHLY ---------------- */
    if (option === 'monthly') {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth - 1, now.getDate());
    }

    /* ---------------- Q1 ---------------- */
    if (option === 'q1') {
      startDate = new Date(fyStartYear, 3, 1); // Apr
      endDate = new Date(fyStartYear, 5, 30); // Jun
    }

    /* ---------------- Q2 ---------------- */
    if (option === 'q2') {
      startDate = new Date(fyStartYear, 6, 1); // Jul
      endDate = new Date(fyStartYear, 8, 30); // Sep
    }

    /* ---------------- Q3 ---------------- */
    if (option === 'q3') {
      startDate = new Date(fyStartYear, 9, 1); // Oct
      endDate = new Date(fyStartYear, 11, 31); // Dec
    }

    /* ---------------- Q4 ---------------- */
    if (option === 'q4') {
      startDate = new Date(fyEndYear, 0, 1); // Jan
      endDate = new Date(fyEndYear, 2, 31); // Mar
    }

    /* ---------------- HALF YEARLY ---------------- */
    if (option === 'halfyearly') {
      startDate = new Date(fyStartYear, 3, 1); // Apr
      endDate = new Date(fyStartYear, 8, 30); // Sep
    }

    /* ---------------- YEARLY ---------------- */
    if (option === 'yearly') {
      startDate = new Date(fyStartYear, 3, 1); // Apr
      endDate = new Date(fyEndYear, 2, 31); // Mar
    }

    /* ---------------- PREVIOUS YEAR ---------------- */
    if (option === 'preyear') {
      startDate = new Date(fyStartYear - 1, 3, 1); // Prev Apr
      endDate = new Date(fyEndYear - 1, 2, 31); // Prev Mar
    }

    const result = transformLabourPartsData(
      rows,
      option,
      startDate,
      endDate
    );

    return result;
  } catch (err) {
    logger.error('JobCard service dashboard', err);
    throw err;
  }
};

const transformLabourPartsData = (
  rows,
  option,
  startDate,
  endDate
) => {
  const periodMap = {};

  console.log('transformLabourPartsData - rows:', rows);
  console.log('transformLabourPartsData - option:', option);
  console.log('transformLabourPartsData - startDate:', startDate);
  console.log('transformLabourPartsData - endDate:', endDate);


  /* ---------------- AGGREGATE DB ROWS ---------------- */
  for (const row of rows) {
    let {
      period,
      labor_amount = 0,
      osl_labor_amount = 0,
      parts_amount = 0,
    } = row;

    period = Number(period);

    if (!periodMap[period]) {
      periodMap[period] = {
        labour_withoutTax: 0,
        parts_withoutTax: 0,
      };
    }

    periodMap[period].labour_withoutTax +=
      Number(labor_amount) + Number(osl_labor_amount);

    periodMap[period].parts_withoutTax += Number(parts_amount);
  }
console.log('periodMap after aggregation:', periodMap);
  const result = [];

  /* =========================================================
      MONTHLY => DAY WISE
  ========================================================= */
  if (option === 'monthly') {
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const day = d.getDate();

      const weekday = d.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      const periodKey = `${day} ${weekday}`;

      result.push({
        period: periodKey,

        labour: Number(
          (
            periodMap[day]?.labour_withoutTax || 0
          ).toFixed(2)
        ),

        parts: Number(
          (
            periodMap[day]?.parts_withoutTax || 0
          ).toFixed(2)
        ),
      });
    }

    return result;
  }

  /* =========================================================
      MONTH BASED OPTIONS
  ========================================================= */

  let monthsToRender = [];

  if (option === 'q1') {
    monthsToRender = [4, 5, 6];
  }

  if (option === 'q2') {
    monthsToRender = [7, 8, 9];
  }

  if (option === 'q3') {
    monthsToRender = [10, 11, 12];
  }

  if (option === 'q4') {
    monthsToRender = [1, 2, 3];
  }

  if (option === 'halfyearly') {
    monthsToRender = [4, 5, 6, 7, 8, 9];
  }

  if (option === 'yearly') {
    monthsToRender = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  }

  if (option === 'preyear') {
    monthsToRender = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  }

  /* ---------------- BUILD RESULT ---------------- */

  for (const month of monthsToRender) {
    result.push({
      period: new Date(0, month - 1).toLocaleString('en-US', {
        month: 'short',
      }),

      labour: Number(
        (
          periodMap[month]?.labour_withoutTax || 0
        ).toFixed(2)
      ),

      parts: Number(
        (
          periodMap[month]?.parts_withoutTax || 0
        ).toFixed(2)
      ),
    });
  }

  return result;
};








// const dashboardCustomerFlow = async (body, user) => {
//   try {
//     const data = await JobCardDao.dashboardCustomerFlow(body, user);
//     const chartdata = [
//       {
//         name: 'Repeat',
//         value: data.repeat_customer_count,
//         fill: 'rgba(246, 141, 43, 1)',
//       },
//       {
//         name: 'New',
//         value: data.new_customer_count,
//         fill: 'rgba(52, 75, 253, 1)',
//       },
//     ];
//     return chartdata;
//   } catch (err) {
//     console.log('err in service dashboardCustomerFlow --', err);
//     logger.error('JobCard service dashboardCustomerFlow', err);
//   }
// };

const dashboardCustomerFlow = async (body, user) => {
  try {
    const outletCode = user.outlet.outletCode;
    const [data, oldData] = await Promise.all([
      JobCardDao.dashboardCustomerFlow(body, user),

      JobCardDao.oldDmsDashboardCustomerFlow({
        outletCode,
        option: body.option,
      }),
    ]);

    console.log('dashboardCustomerFlow data=========================', data);
    console.log('dashboardCustomerFlow oldData=========================', oldData);

    const oldRepeat =
      oldData?.find((item) => item.name === 'Repeat')?.value || 0;

    const oldNew =
      oldData?.find((item) => item.name === 'New')?.value || 0;

    const finalRepeat =
      Number(data[0]?.repeat_customer_count || 0) + Number(oldRepeat);

    const finalNew =
      Number(data[0]?.new_customer_count || 0) + Number(oldNew);

    const chartdata = [
      {
        name: 'Repeat',
        value: finalRepeat,
        fill: 'rgba(246, 141, 43, 1)',
      },
      {
        name: 'New',
        value: finalNew,
        fill: 'rgba(52, 75, 253, 1)',
      },
    ];

    console.log('final dashboardCustomerFlow chartdata =========================', chartdata);
    return chartdata;
  } catch (err) {
    console.log('err in service dashboardCustomerFlow --', err);
    logger.error('JobCard service dashboardCustomerFlow', err);
  }
};

// const dashboardVehicleFlow = async (body, user) => { 
//   try {
//     // const rows = await JobCardDao.dashboardVehicleFlow(body, user);
//     const outletCode = user.outlet.outletCode;

//     const [rows, oldRows] = await Promise.all([
//       JobCardDao.dashboardVehicleFlow(body, user),
//       JobCardDao.oldDmsDashboardVehicleFlow({
//         outletCode,
//         option: body.option,
//         flow: body.flow,
//         sourceTypeId: body.sourceTypeId
//       })
//     ]);
//     const FY_MONTH_MAP = {
//       Apr: 4,
//       May: 5,
//       Jun: 6,
//       Jul: 7,
//       Aug: 8,
//       Sep: 9,
//       Oct: 10,
//       Nov: 11,
//       Dec: 12,
//       Jan: 1,
//       Feb: 2,
//       Mar: 3,
//     };
//     const formattedOldRows = (oldRows || []).map((item) => ({
//       period:
//         body.option === 'monthly'
//           ? Number(item.period.split(' ')[0])
//           : FY_MONTH_MAP[item.period],

//       ajc_count: Number(item.body || 0),
//       rjc_count: Number(item.mech || 0),
//     }));
//     const combinedRows = [...rows, ...formattedOldRows];

//     // console.log('rows ----------', rows);

//     // Map result for quick lookup
//     const map = {};
//     combinedRows.forEach((item) => {
//       if (!map[item.period]) {
//         map[item.period] = {
//           ajc_count: 0,
//           rjc_count: 0,
//         };
//       }

//       map[item.period].ajc_count += Number(item.ajc_count || 0);
//       map[item.period].rjc_count += Number(item.rjc_count || 0);
//     });

//     const response = [];

//     // if (body.option === 'yearly') {
//     //   // Financial Year Apr–Mar
//     //   for (let m = 4; m <= 15; m++) {
//     //     const month = m > 12 ? m - 12 : m;

//     //     response.push({
//     //       period: month,
//     //       ajc_count: map[month]?.ajc_count || 0,
//     //       rjc_count: map[month]?.rjc_count || 0
//     //     });
//     //   }
//     // }

//     if (body.option === 'yearly') {
//       const FY_MAP = {
//         4: 'Apr',
//         5: 'May',
//         6: 'Jun',
//         7: 'Jul',
//         8: 'Aug',
//         9: 'Sep',
//         10: 'Oct',
//         11: 'Nov',
//         12: 'Dec',
//         1: 'Jan',
//         2: 'Feb',
//         3: 'Mar',
//       };

//       const FY_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

//       FY_ORDER.forEach((monthNum) => {
//         response.push({
//           period: FY_MAP[monthNum],
//           body: map[monthNum]?.ajc_count || 0,
//           mech: map[monthNum]?.rjc_count || 0,
//         });
//       });
//     }

//     /* ---------- MONTHLY (FIXED) ---------- */
//     if (body.option === 'monthly') {
//       const now = new Date();
//       const year = now.getFullYear();
//       const month = now.getMonth(); // current month
//       const today = now.getDate(); // IMPORTANT: only till today

//       for (let day = 1; day <= today; day++) {
//         const date = new Date(year, month, day);

//         const label = `${day} ${date.toLocaleDateString('en-US', {
//           weekday: 'short',
//         })}`;

//         response.push({
//           period: label,
//           body: map[label.split(' ')[0]]?.ajc_count || 0,
//           mech: map[label.split(' ')[0]]?.rjc_count || 0,
//         });
//       }
//     }
//     return response;
//   } catch (err) {
//     // console.log('jobcard error dashboardVehilceFlow', err);
//     logger.error('jobcard error dashboardVehilceFlow', err);
//   }
// };


const dashboardVehicleFlow = async (body, user) => {
  try {
    const outletCode = user.outlet.outletCode;

    const [rows, oldRows] = await Promise.all([
      JobCardDao.dashboardVehicleFlow(body, user),

      JobCardDao.oldDmsDashboardVehicleFlow({
        outletCode,
        option: body.option,
        flow: body.flow,
        sourceTypeId: body.sourceTypeId
      })
    ]);

    // console.log("old rows ----------", oldRows);
    // console.log("new rows ----------", rows);

    const FY_MONTH_MAP = {
      Apr: 'apr',
      May: 'may',
      Jun: 'jun',
      Jul: 'jul',
      Aug: 'aug',
      Sep: 'sep',
      Oct: 'oct',
      Nov: 'nov',
      Dec: 'dec',
      Jan: 'jan',
      Feb: 'feb',
      Mar: 'mar',
    };

    /* ---------- FORMAT OLD DMS ---------- */

    const formattedOldRows = (oldRows || []).map((item) => ({
      period:
        body.option === 'monthly'
          ? String(Number(item.period.split(' ')[0]))
          : FY_MONTH_MAP[item.period],

      ajc_count: Number(item.body || 0),

      rjc_count: Number(item.mech || 0),
    }));

    const combinedRows = [...rows, ...formattedOldRows];

    /* ---------- MAP DATA ---------- */

    const map = {};

    combinedRows.forEach((item) => {
      const key = String(item.period).toLowerCase();

      if (!map[key]) {
        map[key] = {
          ajc_count: 0,
          rjc_count: 0,
        };
      }

      map[key].ajc_count += Number(item.ajc_count || 0);

      map[key].rjc_count += Number(item.rjc_count || 0);
    });

    const response = [];

    const MONTH_LABELS = {
      apr: 'Apr',
      may: 'May',
      jun: 'Jun',
      jul: 'Jul',
      aug: 'Aug',
      sep: 'Sep',
      oct: 'Oct',
      nov: 'Nov',
      dec: 'Dec',
      jan: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
    };

    const FY_MONTHS = [
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
      'jan',
      'feb',
      'mar',
    ];

    /* ---------- MONTHLY ---------- */

    if (body.option === 'monthly') {
      const now = new Date();

      const year = now.getFullYear();

      const month = now.getMonth();

      const today = now.getDate();

      for (let day = 1; day <= today; day++) {
        const date = new Date(year, month, day);

        const label = `${day} ${date.toLocaleDateString('en-US', {
          weekday: 'short',
        })}`;

        response.push({
          period: label,

          body: map[String(day)]?.ajc_count || 0,

          mech: map[String(day)]?.rjc_count || 0,
        });
      }
    }

    /* ---------- Q1 ---------- */

    if (body.option === 'q1') {
      ['apr', 'may', 'jun'].forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }

    /* ---------- Q2 ---------- */

    if (body.option === 'q2') {
      ['jul', 'aug', 'sep'].forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }

    /* ---------- Q3 ---------- */

    if (body.option === 'q3') {
      ['oct', 'nov', 'dec'].forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }

    /* ---------- Q4 ---------- */

    if (body.option === 'q4') {
      ['jan', 'feb', 'mar'].forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }

    /* ---------- HALF YEARLY ---------- */

    if (body.option === 'halfyearly') {
      ['apr', 'may', 'jun', 'jul', 'aug', 'sep'].forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }

    /* ---------- YEARLY / PREYEAR ---------- */

    if (
      body.option === 'yearly' ||
      body.option === 'preyear'
    ) {
      FY_MONTHS.forEach((month) => {
        response.push({
          period: MONTH_LABELS[month],

          body: map[month]?.ajc_count || 0,

          mech: map[month]?.rjc_count || 0,
        });
      });
    }
// console.log('final response of vheicle inflow --------',response);
    return response;

  } catch (err) {
    logger.error('jobcard error dashboardVehilceFlow', err);

    throw err;
  }
};
const dashboardInflow = async (user) => {
  let result = {};
  try {
    const data = await JobCardDao.dashboardInflow(user);
    result = data;
  } catch (err) {
    logger.error('JobCard service dashboardInflow', err);
    next(err);
  }
  return result;
};

const getJobCardPDFDetails = async (id, outlet) => {
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const bookingObj = {};
  const totalsObj = {};

  try {
    const data = await JobCardDao.getJobCardPDFDetails(id);

    //outlet start
    (outletObj['name'] = outlet.outletCode),
      (outletObj['address'] = outlet.address1),
      (outletObj['city'] = outlet.city),
      (outletObj['state'] = outlet.state),
      (outletObj['pincode'] = outlet.pincode),
      (outletObj['phone'] = outlet.phoneNumber),
      (outletObj['mobile'] = outlet.phoneNumber),
      (outletObj['email'] = outlet.email),
      (outletObj['dealerGstin'] = outlet.gstIn);
    //outlet end

    //booking start
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    (bookingObj['documentName'] = data.job_card_no),
      (bookingObj['documentDate'] = formattedDate),
      (bookingObj['model'] = data.vehicle.model.modelName),
      (bookingObj['regNo'] = data.reg_no),
      (bookingObj['kmReading'] = data.odometer),
      (bookingObj['checkinTime'] = data.customer_arrived_date
        .toString()
        .substring(0, 25)),
      (bookingObj['expectedTime'] = data.work_end_date_time
        .toString()
        .substring(0, 25)),
      (bookingObj['repairType'] = data.repair_type),
      (bookingObj['serviceType'] = data.service_type);
    //booking end

    //customer start
    (customerObj['name'] = data.customer_name),
      (customerObj['gstin'] = data.customer_gstin),
      (customerObj['address'] = data.customer_address),
      (customerObj['chassisNo'] = data.vehicle.chassisNumber),
      (customerObj['customerVoice'] = data.customer_voice),
      (customerObj['serviceEngineerRemarks'] = data.service_engineer_remarks),
      (customerObj['city'] = data.customer_city),
      (customerObj['state'] = data.customer_state),
      (customerObj['pincode'] = data.customer_pincode),
      (customerObj['engNo'] = data.vehicle.engineNumber);
    //customer end

    let lsno = 1;
    const labours = [];
    let laborTotalAmount = 0;
    let partsTotalAmount = 0;
    const parts = [];
    let psno = 1;

    //parts start
    data.partsIndent.forEach((itm) => {
      const baseAmount = parseFloat(
        (itm.request_quantity * itm.amount).toFixed(2)
      );

      const igstAmount = parseFloat(((itm.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((itm.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((itm.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
      );

      const part = {
        sno: psno++,
        code: itm.item_code,
        description: itm.item_name,
      };

      parts.push(part);

      partsTotalAmount = amount;
    });
    //parts end

    //osl start
    data.oslSchedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      const oslLabour = {
        sno: lsno++,
        code: osl.rot_code,
        description: osl.description,
      };

      labours.push(oslLabour);

      laborTotalAmount += amount;
    });
    //osl end

    //labour schedule start
    data.schedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      const oslLabour = {
        sno: lsno++,
        code: osl.rot_code,
        description: osl.description,
      };

      labours.push(oslLabour);

      laborTotalAmount += amount;
    });
    // labour schedule end

    //previous jobCard start
    const prevData = await JobCardDao.getPrevJobCard(data.reg_no);

    const prevJobObj = {};
    prevJobObj['cardNo'] = prevData[0]?.job_card_no;
    prevJobObj['cardDate'] = prevData[0]?.work_end_date_time;
    prevJobObj['repairType'] = prevData[0]?.repair_type;
    prevJobObj['serviceType'] = prevData[0]?.service_type;
    prevJobObj['kmReading'] = prevData[0]?.odometer;
    //previous jobCard end

    const prevTotalObj = {};
    let prevLabourAmt = 0;
    let prevPartAmt = 0;

    //previous jobcard parts amount
    prevData[0]?.partsIndent.forEach((itm) => {
      const baseAmount = parseFloat(
        (itm.request_quantity * itm.amount).toFixed(2)
      );

      const igstAmount = parseFloat(((itm.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((itm.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((itm.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
      );

      prevPartAmt = amount;
    });

    //previous jobcard osl amount
    prevData[0]?.oslSchedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      prevLabourAmt += amount;
    });

    //previous jobcard labour amount
    prevData[0]?.schedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      prevLabourAmt += amount;
    });

    prevTotalObj['labourAmt'] = prevLabourAmt.toFixed(2);
    prevTotalObj['partsAmt'] = prevPartAmt.toFixed(2);
    prevTotalObj['grandAmt'] = (prevLabourAmt + prevPartAmt).toFixed(2);

    totalsObj['labourAmt'] = laborTotalAmount.toFixed(2);
    totalsObj['partsAmt'] = partsTotalAmount.toFixed(2);
    totalsObj['grandAmt'] = (laborTotalAmount + partsTotalAmount).toFixed(2);

    resObj['labours'] = labours;
    resObj['parts'] = parts;
    resObj['total'] = totalsObj;
    resObj['booking'] = bookingObj;
    resObj['branch'] = outletObj;
    resObj['customer'] = customerObj;
    resObj['prevData'] = prevJobObj;
    resObj['prevTotal'] = prevTotalObj;
    return resObj;
  } catch (err) {
    logger.error('JobCard service getJobCardPDFDetails', err);
  }
};

const getJobCardInvoicePDFDetails = async (id, outlet) => {
  // existing code is very lengthy and complex, we need to refactor it for better readability and maintainability inspected date 12/03/2026
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const insuranceObj = {};
  const bdoObj = {};
  const bookingObj = {};
  const totalsObj = {};
  const labour = [];
  const parts = [];
  const partIndent = [];

  try {
    const data = await JobCardDao.getJobCardPDFDetails(id);

    const transactionUpdate = data.transactionupdates?.[0];
    // console.log("data--------------------",transactionUpdate);

    const currentDate = new Date(data.createdAt);
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    //outlet start
    (outletObj['name'] = data.outlet.outletCode),
      (outletObj['address'] = data.outlet.address1),
      (outletObj['city'] = data.outlet.city),
      (outletObj['state'] = data.outlet.state),
      (outletObj['pincode'] = data.outlet.pincode),
      (outletObj['phone'] = data.outlet.phoneNumber),
      (outletObj['mobile'] = data.outlet.phoneNumber),
      (outletObj['email'] = data.outlet.email),
      (outletObj['outletName'] = data.outlet.outletName),
      (outletObj['dealerGstin'] = data.outlet.gstIn),
      (outletObj['companyId'] = data.outlet.companyId);

    resObj['outlet'] = outletObj;
    //outlet end

    let IrnformattedDate = '';

    if (transactionUpdate?.invoice_bdoack_date) {
      const irn_date = new Date(transactionUpdate.invoice_bdoack_date);
      const irnDay = String(irn_date.getDate()).padStart(2, '0');
      const irnMonth = String(irn_date.getMonth() + 1).padStart(2, '0');
      const irnYear = irn_date.getFullYear();
      IrnformattedDate = `${irnDay}/${irnMonth}/${irnYear}`;
    }

    if (transactionUpdate?.signed_qr_code) {
      // BDO details
      bdoObj['irn_no'] = transactionUpdate ? transactionUpdate.irn_no : '';
      bdoObj['irn_date'] = IrnformattedDate;
      const bdoQrCode = await QrCodeGeneration.generateQRCodeDataUrl(
        transactionUpdate.signed_qr_code
      );
      bdoObj['qr_code'] = bdoQrCode;
      bdoObj['bdo_details'] = transactionUpdate;
    } else {
      bdoObj['irn_no'] = '';
      bdoObj['irn_date'] = '';
      bdoObj['qr_code'] = '';
      bdoObj['bdo_details'] = {};
    }
    resObj['bdoObj'] = bdoObj;

    //customer start
    (customerObj['name'] = data.customer_name),
      (customerObj['customer_code'] = data.customer_code),
      (customerObj['document_type'] = data.document_type);
    customerObj['isAJC'] = data.document_type === 'AJC' ? true : false;
    (customerObj['gstin'] = data.customer_gstin),
      (customerObj['address'] =
        data.customer_address +
        ' ' +
        data.customer_city +
        ',' +
        data.customer_state +
        ' ' +
        data.customer_pincode),
      (customerObj['chassisNo'] = data.vehicle.chassisNumber),
      (customerObj['customerVoice'] = data.customer_voice),
      (customerObj['serviceEngineerRemarks'] = data.service_engineer_remarks),
      (customerObj['city'] = data.customer_city),
      (customerObj['state'] = data.customer_state),
      (customerObj['pincode'] = data.customer_pincode),
      (customerObj['mobile'] = data.customer_mobileNumber),
      (customerObj['engNo'] = data.vehicle.engineNumber);
    customerObj['documentName'] = data.job_card_no;
    customerObj['documentDate'] = formattedDate;
    customerObj['model'] = data.vehicle.model.modelName;
    customerObj['regNo'] = data.reg_no;
    customerObj['kmReading'] = data.odometer;
    // customerObj["checkinTime"] = data.customer_arrived_date.toString().substring(0, 25);
    customerObj['checkinTime'] = moment(data.customer_arrived_date)
      .tz('Asia/Kolkata')
      .format('DD-MM-YYYY HH:mm:ss');
    // customerObj["expectedTime"] = data.work_end_date_time.toString().substring(0, 25);
    customerObj['expectedTime'] = moment(data.work_end_date_time)
      .tz('Asia/Kolkata')
      .format('DD-MM-YYYY HH:mm:ss');
    customerObj['repairType'] = data.repairtype.repairTypeName;
    customerObj['serviceType'] = data.servicetype.serviceTypeName;
    customerObj['InvoiceNumber'] = data.billing ? data.billing.bill_no : '';
    customerObj['InvoiceType'] = data.billing
      ? data.billing.bill_type === 'cash'
        ? 'Cash bill'
        : 'Credit bill'
      : '';
    const createdBy = data.created_by;
    if (createdBy) {
      try {
        const userData = await UserDao.findUserById(createdBy);
        if (userData) {
          const employee_Id = userData.employeeId;
          const employeeData = await EmployeeDao.findByemployeeById(employee_Id);
          customerObj['createdBy'] = employeeData
            ? employeeData.employeeName
            : '';
        } else {
          customerObj['createdBy'] = '';
        }
      } catch (error) {
        console.error('Error fetching createdBy user/employee:', error);
        customerObj['createdBy'] = '';
      }
    }
    resObj['customer'] = customerObj;
    //customer end

    if (data.document_type == 'AJC' && data.paid_by_status == 0) {
      const insuranceData = await JobCardDao.getInsuranceDetailByTransId(id);
      insuranceObj['insurance_provider_name'] =
        insuranceData.insurance_provider_name;
      insuranceObj['insurance_provider_id'] =
        insuranceData.insurance_provider_id;
      insuranceObj['policy_no'] = insuranceData.policy_no;
      insuranceObj['gstin_number'] = insuranceData.gstin_number;
      insuranceObj['insurance_address'] = insuranceData.insurance_address;
      insuranceObj['claim_no'] = insuranceData.claim_no;

      const date = insuranceData.policy_exp_date;
      const day = String(date.getDate()).padStart(2, '0'); // Two-digit day
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Two-digit month (Months are zero-based)
      const year = date.getFullYear();

      const formattedDate = `${day}-${month}-${year}`;

      insuranceObj['policy_exp_date'] = formattedDate;
      insuranceObj['surveyor_name'] = insuranceData.surveyor_name;
      insuranceObj['surveyor_mob'] = insuranceData.surveyor_mob;

      insuranceObj['insurance_state'] = insuranceData.insurance_state;
      insuranceObj['insurance_city'] = insuranceData.insurance_city;
      insuranceObj['insurance_pincode'] = insuranceData.insurance_pincode;

      resObj['insuranceData'] = insuranceObj;
    } else if (data.document_type == 'AJC' && data.paid_by_status == 2) {
      insuranceObj['insurance_provider_name'] = data.customer_name;
      insuranceObj['insurance_provider_id'] = data.customer_code;
      insuranceObj['gstin_number'] = data.customer_gstin;

      resObj['insuranceData'] = insuranceObj;
    }

    let sno = 1;
    //osl start
    let totallabQty = 0;
    let totallabDiscount = 0;
    let totallabSGst = 0;
    let totallabCGst = 0;
    let totallabiGst = 0;
    let totalabAmount = 0;
    let totallabbeforetax = 0;

    let totalInsuranceLabbeforetax = 0;
    let totalInsuranceLabQty = 0;
    let totalInsuranceLabDiscount = 0;
    let totalInsuranceLabSGst = 0;
    let totalInsuranceLabCGst = 0;
    let totalInsuranceLabiGst = 0;
    let totalInsuranceLabAmount = 0;

    let totalCustomerLabbeforetax = 0;
    let totalCustomerLabQty = 0;
    let totalCustomerLabDiscount = 0;
    let totalCustomerLabSGst = 0;
    let totalCustomerLabCGst = 0;
    let totalCustomerLabiGst = 0;
    let totalCustomerLabAmount = 0;

    const laborArray = data.schedules.filter((item) => item.status === 2);
    const oslLaborArray = data.oslSchedules.filter((item) => item.status === 2);
    //labor start
    laborArray.forEach((osl) => {
      const laborObj = {};
      let baseAmount = 0;
      let baseInsuranceAmount = 0;
      let baseCustomerAmount = 0;

      let igstAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;

      let igstInsuranceAmount = 0;
      let cgstInsuranceAmount = 0;
      let sgstInsuranceAmount = 0;

      let igstCustomerAmount = 0;
      let cgstCustomerAmount = 0;
      let sgstCustomerAmount = 0;

      if (data.document_type == 'AJC' && data.paid_by_status == 0) {
        // console.log('pdf inside data-----------',osl)
        let customerDiscount =
          (osl.discount_percentage * osl.depreciation_per) / 100;
        let insuranceDiscount =
          osl.discount_percentage * (1 - osl.depreciation_per / 100);

        let customerMargin =
          (osl.additionalMargin * osl.depreciation_per) / 100;
        let insuranceMargin =
          osl.additionalMargin * (1 - osl.depreciation_per / 100);
        // mobile creation time they are not providing depreciation percentage so we are considering 100% for insurance and 0% for customer for those records to avoid negative value in calculation
        baseInsuranceAmount = parseFloat(
          (osl.insurance_amount - insuranceDiscount + insuranceMargin).toFixed(
            2
          )
        );
        igstInsuranceAmount = parseFloat(
          ((osl.igst / 100) * baseInsuranceAmount).toFixed(2)
        );
        cgstInsuranceAmount = parseFloat(
          ((osl.cgst / 100) * baseInsuranceAmount).toFixed(2)
        );
        sgstInsuranceAmount = parseFloat(
          ((osl.sgst / 100) * baseInsuranceAmount).toFixed(2)
        );

        laborObj['cgstInsuranceAmount'] = cgstInsuranceAmount.toFixed(2);
        laborObj['sgstInsuranceAmount'] = sgstInsuranceAmount.toFixed(2);
        laborObj['igstInsuranceAmount'] = igstInsuranceAmount.toFixed(2);
        //laborObj['valdisc'] = (baseInsuranceAmount - osl.discount_percentage).toFixed(2);
        const totalGstInsurance =
          igstInsuranceAmount == 0
            ? cgstInsuranceAmount + sgstInsuranceAmount
            : igstInsuranceAmount;
        laborObj['totalInsuranceamtwithTx'] = (
          baseInsuranceAmount + totalGstInsurance
        ).toFixed(2);
        laborObj['totalInsuranceamt'] = baseInsuranceAmount.toFixed(2);
        laborObj['totalInsuranceAmtrate'] = parseFloat(
          osl.amount - ((osl.depreciation_per / 100) * osl.amount).toFixed(2)
        );
        if (osl.repairTypeId != 2) {
          totalInsuranceLabbeforetax += baseInsuranceAmount;
          totalInsuranceLabQty = totalInsuranceLabQty + osl.quantity;
          totalInsuranceLabDiscount =
            totalInsuranceLabDiscount + insuranceDiscount;
          totalInsuranceLabSGst = totalInsuranceLabSGst + sgstInsuranceAmount;
          totalInsuranceLabCGst = totalInsuranceLabCGst + cgstInsuranceAmount;
          totalInsuranceLabiGst = totalInsuranceLabiGst + igstInsuranceAmount;
          totalInsuranceLabAmount =
            totalInsuranceLabAmount + baseInsuranceAmount;
        }
        baseCustomerAmount = parseFloat(
          (osl.customer_amount - customerDiscount + customerMargin).toFixed(2)
        );
        igstCustomerAmount = parseFloat(
          ((osl.igst / 100) * baseCustomerAmount).toFixed(2)
        );
        cgstCustomerAmount = parseFloat(
          ((osl.cgst / 100) * baseCustomerAmount).toFixed(2)
        );
        sgstCustomerAmount = parseFloat(
          ((osl.sgst / 100) * baseCustomerAmount).toFixed(2)
        );

        laborObj['cgstCustomerAmount'] = cgstCustomerAmount.toFixed(2);
        laborObj['sgstCustomerAmount'] = sgstCustomerAmount.toFixed(2);
        laborObj['igstCustomerAmount'] = igstCustomerAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount - customerDiscount).toFixed(2);
        const totalGst =
          igstCustomerAmount == 0
            ? cgstCustomerAmount + sgstCustomerAmount
            : igstCustomerAmount;
        laborObj['totalCustomeramt'] = baseCustomerAmount.toFixed(2);
        laborObj['totalCustomeramtwithTx'] = (
          baseCustomerAmount + totalGst
        ).toFixed(2);
        laborObj['totalCustomeramrate'] = parseFloat(
          ((osl.depreciation_per / 100) * osl.amount).toFixed(2)
        );
        if (osl.repairTypeId != 2) {
          totalCustomerLabbeforetax += baseCustomerAmount;
          totalCustomerLabQty = totalCustomerLabQty + osl.quantity;
          totalCustomerLabDiscount =
            totalCustomerLabDiscount + customerDiscount;
          totalCustomerLabSGst = totalCustomerLabSGst + sgstCustomerAmount;
          totalCustomerLabCGst = totalCustomerLabCGst + cgstCustomerAmount;
          totalCustomerLabiGst = totalCustomerLabiGst + igstCustomerAmount;
          totalCustomerLabAmount = totalCustomerLabAmount + baseCustomerAmount;
        }
      } else {
        // console.log('pdf inside data-----------2222222222',osl)

        baseAmount = parseFloat(
          (osl.amount - osl.discount_percentage + osl.additionalMargin).toFixed(
            2
          )
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = osl.laborTotal.toFixed(2);
        totallabbeforetax += baseAmount;
        //totallabQty = totallabQty + osl.quantity;
        if (osl.repairTypeId != 2) {
          totallabDiscount = totallabDiscount + osl.discount_percentage;
          totallabSGst = totallabSGst + sgstAmount;
          totallabCGst = totallabCGst + cgstAmount;
          totallabiGst = totallabiGst + igstAmount;
          totalabAmount = totalabAmount + osl.laborTotal;
        }
        // totallabDiscount = totallabDiscount + osl.discount_percentage;
      }

      let newBaseAmount = (
        osl.amount -
        osl.discount_percentage +
        osl.additionalMargin
      ).toFixed(2);
      laborObj['sno'] = sno++;
      laborObj['rot_code'] = osl.rot_code;
      laborObj['description'] = osl.description;
      laborObj['quantity'] = osl.quantity.toFixed(2);
      laborObj['rate'] = osl.amount.toFixed(2);
      laborObj['totalval'] = newBaseAmount;
      laborObj['discount'] = osl.discount_percentage.toFixed(2);
      laborObj['cgst'] = osl.cgst;
      laborObj['sgst'] = osl.sgst;
      laborObj['igst'] = osl.igst;
      laborObj['hsn'] = osl.labourschedules.sacCode;
      if (osl.repairTypeId != 2) {
        totallabQty = totallabQty + osl.quantity;
      }

      if (osl.repairTypeId != 2) {
        labour.push(laborObj);
      }
    });

    oslLaborArray.forEach((osl) => {
      const laborObj = {};
      let baseAmount = 0;
      let baseInsuranceAmount = 0;
      let baseCustomerAmount = 0;

      let igstAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;

      let igstInsuranceAmount = 0;
      let cgstInsuranceAmount = 0;
      let sgstInsuranceAmount = 0;

      let igstCustomerAmount = 0;
      let cgstCustomerAmount = 0;
      let sgstCustomerAmount = 0;
      let margin = osl.marginPercentage / 100;
      if (data.document_type == 'AJC' && data.paid_by_status == 0) {
        let customerDiscount =
          (osl.discount_percentage * osl.depreciation_per) / 100;
        let insuranceDiscount =
          osl.discount_percentage * (1 - osl.depreciation_per / 100);

        let customerMargin =
          (osl.additionalMargin * osl.depreciation_per) / 100;
        let insuranceMargin =
          osl.additionalMargin * (1 - osl.depreciation_per / 100);

        baseInsuranceAmount = parseFloat(
          (
            (osl.quantity * osl.insurance_amount - insuranceDiscount) /
            (1 - margin) +
            insuranceMargin
          ).toFixed(2)
        );
        igstInsuranceAmount = parseFloat(
          ((osl.igst / 100) * baseInsuranceAmount).toFixed(2)
        );
        cgstInsuranceAmount = parseFloat(
          ((osl.cgst / 100) * baseInsuranceAmount).toFixed(2)
        );
        sgstInsuranceAmount = parseFloat(
          ((osl.sgst / 100) * baseInsuranceAmount).toFixed(2)
        );

        laborObj['cgstInsuranceAmount'] = cgstInsuranceAmount.toFixed(2);
        laborObj['sgstInsuranceAmount'] = sgstInsuranceAmount.toFixed(2);
        laborObj['igstInsuranceAmount'] = igstInsuranceAmount.toFixed(2);
        //laborObj['valdisc'] = (baseInsuranceAmount - osl.discount_percentage).toFixed(2);
        const totalGstInsurance =
          igstInsuranceAmount == 0
            ? cgstInsuranceAmount + sgstInsuranceAmount
            : igstInsuranceAmount;
        laborObj['totalInsuranceamtwithTx'] = (
          baseInsuranceAmount + totalGstInsurance
        ).toFixed(2);
        laborObj['totalInsuranceamt'] = baseInsuranceAmount.toFixed(2);
        laborObj['totalInsuranceAmtrate'] = parseFloat(
          osl.amount - ((osl.depreciation_per / 100) * osl.amount).toFixed(2)
        );

        totalInsuranceLabbeforetax += baseInsuranceAmount;
        totalInsuranceLabQty = totalInsuranceLabQty + osl.quantity;
        totalInsuranceLabDiscount =
          totalInsuranceLabDiscount + insuranceDiscount;
        totalInsuranceLabSGst = totalInsuranceLabSGst + sgstInsuranceAmount;
        totalInsuranceLabCGst = totalInsuranceLabCGst + cgstInsuranceAmount;
        totalInsuranceLabiGst = totalInsuranceLabiGst + igstInsuranceAmount;
        totalInsuranceLabAmount = totalInsuranceLabAmount + baseInsuranceAmount;

        baseCustomerAmount = parseFloat(
          (
            (osl.quantity * osl.customer_amount - customerDiscount) /
            (1 - margin) +
            customerMargin
          ).toFixed(2)
        );
        igstCustomerAmount = parseFloat(
          ((osl.igst / 100) * baseCustomerAmount).toFixed(2)
        );
        cgstCustomerAmount = parseFloat(
          ((osl.cgst / 100) * baseCustomerAmount).toFixed(2)
        );
        sgstCustomerAmount = parseFloat(
          ((osl.sgst / 100) * baseCustomerAmount).toFixed(2)
        );

        laborObj['cgstCustomerAmount'] = cgstCustomerAmount.toFixed(2);
        laborObj['sgstCustomerAmount'] = sgstCustomerAmount.toFixed(2);
        laborObj['igstCustomerAmount'] = igstCustomerAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount - osl.discount_percentage).toFixed(2);
        const totalGst =
          igstCustomerAmount == 0
            ? cgstCustomerAmount + sgstCustomerAmount
            : igstCustomerAmount;
        laborObj['totalCustomeramt'] = baseCustomerAmount.toFixed(2);
        laborObj['totalCustomeramtwithTx'] = (
          baseCustomerAmount + totalGst
        ).toFixed(2);
        laborObj['totalCustomeramrate'] = parseFloat(
          ((osl.depreciation_per / 100) * osl.amount).toFixed(2)
        );

        totalCustomerLabbeforetax += baseCustomerAmount;
        totalCustomerLabQty = totalCustomerLabQty + osl.quantity;
        totalCustomerLabDiscount = totalCustomerLabDiscount + customerDiscount;
        totalCustomerLabSGst = totalCustomerLabSGst + sgstCustomerAmount;
        totalCustomerLabCGst = totalCustomerLabCGst + cgstCustomerAmount;
        totalCustomerLabiGst = totalCustomerLabiGst + igstCustomerAmount;
        totalCustomerLabAmount = totalCustomerLabAmount + baseCustomerAmount;
      } else {
        baseAmount = parseFloat(
          (
            (osl.quantity * osl.amount - osl.discount_percentage) /
            (1 - margin) +
            osl.additionalMargin
          ).toFixed(2)
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        let tax = igstAmount > 0 ? igstAmount : sgstAmount + cgstAmount;
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = (baseAmount + tax).toFixed(2);
        totallabbeforetax += baseAmount;
        //totallabQty = totallabQty + osl.quantity;
        totallabDiscount = totallabDiscount + osl.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + baseAmount + tax;
      }

      let newBaseAmount = (
        (osl.quantity * osl.amount - osl.discount_percentage) / (1 - margin) +
        osl.additionalMargin
      ).toFixed(2);
      laborObj['sno'] = sno++;
      laborObj['rot_code'] = osl.rot_code;
      laborObj['description'] = osl.description;
      laborObj['quantity'] = osl.quantity.toFixed(2);
      laborObj['rate'] = osl.amount.toFixed(2);
      laborObj['totalval'] = newBaseAmount;
      laborObj['discount'] = osl.discount_percentage.toFixed(2);
      laborObj['cgst'] = osl.cgst;
      laborObj['sgst'] = osl.sgst;
      laborObj['igst'] = osl.igst;
      laborObj['hsn'] = osl.labourschedules.sacCode;
      totallabQty = totallabQty + osl.quantity;

      labour.push(laborObj);
    });

    if (data.document_type == 'AJC' && data.paid_by_status == 0) {
      resObj['totalInsureanceLaborDiscount'] =
        totalInsuranceLabDiscount.toFixed(2);
      resObj['totalInsureanceLaborSGst'] = totalInsuranceLabSGst.toFixed(2);
      resObj['totalInsureanceLaborCGst'] = totalInsuranceLabCGst.toFixed(2);
      resObj['totalInsureanceLaborIGst'] = totalInsuranceLabiGst.toFixed(2);

      const totalInsureanceGstOnLabor =
        totalInsuranceLabiGst == 0
          ? (totalInsuranceLabSGst + totalInsuranceLabCGst).toFixed(2)
          : totalInsuranceLabiGst.toFixed(2);
      resObj['totalInsureanceLaborAmount'] = (
        parseFloat(totalInsuranceLabAmount) +
        parseFloat(totalInsureanceGstOnLabor)
      ).toFixed(2);
      resObj['totalInsureanceGstOnLabor'] = totalInsureanceGstOnLabor;
      resObj['labInsuranceBeforeTaxAmt'] =
        totalInsuranceLabbeforetax.toFixed(2);
      let roundtotalInsuranceLabAmount = Math.round(
        totalInsuranceLabAmount + parseFloat(totalInsureanceGstOnLabor)
      );
      resObj['labInsuranceAmtRound'] = roundtotalInsuranceLabAmount.toFixed(2);
      resObj['labInsuranceRound'] = (
        totalInsuranceLabDiscount - roundtotalInsuranceLabAmount
      ).toFixed(2);
      resObj['totalLabInsuranceAmountWords'] = numberToWords.toWords(
        roundtotalInsuranceLabAmount
      );

      resObj['totalCustomerLaborDiscount'] =
        totalCustomerLabDiscount.toFixed(2);
      resObj['totalCustomerLaborSGst'] = totalCustomerLabSGst.toFixed(2);
      resObj['totalCustomerLaborCGst'] = totalCustomerLabCGst.toFixed(2);
      resObj['totalCustomerLaborIGst'] = totalCustomerLabiGst.toFixed(2);
      const totalCustomerGstOnLabor =
        totalCustomerLabiGst == 0
          ? (totalCustomerLabSGst + totalCustomerLabCGst).toFixed(2)
          : totalCustomerLabiGst.toFixed(2);
      // console.log('lllllllllllllllllllllllll',totalCustomerLabAmount);
      // console.log('sddddddddddddddddddddddddddddd',totalCustomerGstOnLabor)
      // const totalLabandtotaltax = parseFloat(totalCustomerLabAmount)
      resObj['totalCustomerLaborAmount'] = (
        parseFloat(totalCustomerLabAmount) + parseFloat(totalCustomerGstOnLabor)
      ).toFixed(2);
      // console.log('aaaaaaaaaaaaaaa',(parseFloat(totalCustomerLabAmount) +  parseFloat(totalCustomerGstOnLabor)).toFixed(2))

      resObj['totalCustomerGstOnLabor'] = totalCustomerGstOnLabor;
      resObj['labCustomerBeforeTaxAmt'] = totalCustomerLabbeforetax.toFixed(2);
      let roundtotalCustomerLabAmount = Math.round(
        totalCustomerLabAmount + parseFloat(totalCustomerGstOnLabor)
      );
      resObj['labCustomerAmtRound'] = roundtotalCustomerLabAmount.toFixed(2);
      resObj['labCustomerRound'] = (
        totalCustomerLabDiscount - roundtotalCustomerLabAmount
      ).toFixed(2);
      resObj['totalLabCustomerAmountWords'] = numberToWords.toWords(
        roundtotalCustomerLabAmount
      );

      resObj['totalRoundLabAmountAJC'] = Math.round(
        parseFloat(totalInsuranceLabAmount) +
        parseFloat(totalInsureanceGstOnLabor) +
        parseFloat(totalCustomerLabAmount) +
        parseFloat(totalCustomerGstOnLabor)
      ).toFixed(2);
    } else {
      resObj['totalLaborDiscount'] = totallabDiscount.toFixed(2);
      resObj['totalLaborSGst'] = totallabSGst.toFixed(2);
      resObj['totalLaborCGst'] = totallabCGst.toFixed(2);
      resObj['totalLaborIGst'] = totallabiGst.toFixed(2);
      //totalabAmount = totalabAmount + (totallabiGst == 0 ? (totallabSGst + totallabCGst) : totallabiGst);
      resObj['totalLaborAmount'] = totalabAmount.toFixed(2);
      resObj['totalGstOnLabor'] =
        totallabiGst == 0
          ? (totallabSGst + totallabCGst).toFixed(2)
          : totallabiGst.toFixed(2);
      resObj['labBeforeTaxAmt'] = totallabbeforetax.toFixed(2);
      let roundtotalLabAmount = Math.round(resObj['totalLaborAmount']);
      resObj['labAmtRound'] = roundtotalLabAmount.toFixed(2);
      resObj['labRound'] = (
        roundtotalLabAmount - resObj['totalLaborAmount']
      ).toFixed(2);
      resObj['totalLabAmountWords'] =
        numberToWords.toWords(roundtotalLabAmount);
    }

    resObj['totalLaborQuantity'] = totallabQty.toFixed(2);
    resObj['labours'] = labour;
    //osl end

    //parts start
    let psno = 1;

    let totalpartQty = 0;
    let totalpartDiscount = 0;
    let totalpartSGst = 0;
    let totalpartCGst = 0;
    let totalpartiGst = 0;
    let totapartAmount = 0;

    data.partsIssue.forEach((itm) => {
      // console.log('pdf inside itm-----------',itm)
      const partObj = {};
      const baseAmount = parseFloat((itm.quantity * itm.rate).toFixed(2));
      const igstAmount = parseFloat(((itm.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((itm.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((itm.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount + (igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount)
        ).toFixed(2)
      );

      partObj['sno'] = psno++;
      partObj['code'] = itm.item_code;
      partObj['description'] = itm.item_name;
      partObj['hsn'] = itm.items.hsnCode;
      partObj['quantity'] = itm.quantity.toFixed(2);
      partObj['rate'] = itm.rate.toFixed(2);
      partObj['totalval'] = amount.toFixed(2);
      // partObj['discount']=osl.discount_percentage;
      partObj['cgst'] = itm.cgst;
      partObj['sgst'] = itm.sgst;
      partObj['igst'] = itm.igst;
      partObj['totalamt'] = amount.toFixed(2);

      partObj['cgstamt'] = cgstAmount.toFixed(2);
      partObj['sgstamt'] = sgstAmount.toFixed(2);
      partObj['igstamt'] = igstAmount.toFixed(2);

      if (itm.repair_type != 2) {
        totalpartQty = totalpartQty + itm.quantity;
        //totalpartDiscount=totalpartDiscount+osl.discount_percentage;
        totalpartSGst = totalpartSGst + sgstAmount;
        totalpartCGst = totalpartCGst + cgstAmount;
        totalpartiGst = totalpartiGst + igstAmount;
        totapartAmount = totapartAmount + amount;
      }

      if (itm.repair_type != 2) {
        parts.push(partObj);
      }
    });

    resObj['totalPartsQuantity'] = totalpartQty.toFixed(2);
    //resObj['totalPartsDiscount']=totallabDiscount;
    resObj['totalPartsSGst'] = totalpartSGst.toFixed(2);
    resObj['totalPartsCGst'] = totalpartCGst.toFixed(2);
    resObj['totalPartsIGst'] = totalpartiGst.toFixed(2);
    resObj['totalPartsAmount'] = totapartAmount.toFixed(2);
    resObj['totalGstOnParts'] =
      totalpartiGst == 0
        ? (totalpartSGst + totalpartCGst).toFixed(2)
        : totalpartiGst.toFixed(2);

    let roundtotalPartsAmount = Math.round(totapartAmount);
    resObj['partAmtRound'] = roundtotalPartsAmount.toFixed(2);
    resObj['partRound'] = (roundtotalPartsAmount - totapartAmount).toFixed(2);
    resObj['totalPartsAmountWords'] = numberToWords.toWords(
      roundtotalPartsAmount
    );
    data.partsIndent.forEach((itm) => {
      // console.log('pdf inside itm-----------',itm)
      const partIndentObj = {};

      partIndentObj['sno'] = psno++;
      partIndentObj['code'] = itm.item_code;
      partIndentObj['description'] = itm.item_name;
      partIndentObj['quantity'] = itm.request_quantity;

      if (itm.status == 2) {
        partIndent.push(partIndentObj);
      }
    });
    if (data.document_type == 'AJC' && data.paid_by_status == 0) {
      let totalsum =
        totapartAmount +
        totalabAmount +
        parseFloat(resObj['totalInsureanceLaborAmount']);
      resObj['totalLaborPartsAmount'] = totalsum.toFixed(2);
      resObj['totalLaborPartsAmountRnd'] = Math.round(totalsum).toFixed(2);
      resObj['totalLaborPartsAmountWords'] = numberToWords
        .toWords(Math.round(totalsum))
        .toUpperCase();
    } else {
      resObj['totalLaborPartsAmount'] = (
        totapartAmount + totalabAmount
      ).toFixed(2);
      resObj['totalLaborPartsAmountRnd'] = Math.round(
        totapartAmount + totalabAmount
      ).toFixed(2);
      resObj['totalLaborPartsAmountWords'] = numberToWords
        .toWords(Math.round(totapartAmount + totalabAmount))
        .toUpperCase();
    }
    resObj['document_type'] = data.document_type;
    resObj['paid_by_status'] = data.paid_by_status;
    //previous data
    const prevData = await JobCardDao.getPrevJobCard(data.reg_no);

    const prevJobObj = {};
    prevJobObj['cardNo'] = prevData?.job_card_no;
    prevJobObj['cardDate'] = prevData?.work_end_date_time
      ? moment(prevData?.work_end_date_time)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss')
      : '';
    prevJobObj['repairType'] = prevData?.repair_type;
    prevJobObj['serviceType'] = prevData?.service_type;
    prevJobObj['kmReading'] = prevData?.odometer;
    //previous jobCard end

    const prevTotalObj = {};
    let prevLabourAmt = 0;
    let prevPartAmt = 0;

    //previous jobcard parts amount
    prevData?.partsIssue.forEach((itm) => {
      const baseAmount = parseFloat((itm.quantity * itm.rate).toFixed(2));

      const igstAmount = parseFloat(((itm.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((itm.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((itm.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
      );

      prevPartAmt += amount;
    });

    //previous jobcard osl amount
    prevData?.oslSchedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      prevLabourAmt += amount;
    });

    //previous jobcard labour amount
    prevData?.schedules.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));

      const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount +
          igstAmount +
          cgstAmount +
          sgstAmount -
          osl.discount_percentage
        ).toFixed(2)
      );

      prevLabourAmt += amount;
    });

    prevTotalObj['labourAmt'] = prevLabourAmt.toFixed(2);
    prevTotalObj['partsAmt'] = prevPartAmt.toFixed(2);
    prevTotalObj['grandAmt'] = (prevLabourAmt + prevPartAmt).toFixed(2);
    resObj['prevData'] = prevJobObj;
    resObj['prevTotal'] = prevTotalObj;

    resObj['parts'] = parts;
    resObj['partIndents'] = partIndent;
    //parts end
    return resObj;
  } catch (err) {
    console.log(err);
    logger.error('JobCard service getJobCardInvoicePDFDetails', err);
  }
};

const listBillJobCards = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.listBillJobCards(
      reqData,
      user
    );

    const filterSchedules = (scheduleArray) => {
      return scheduleArray.filter((app) => app.status === 2);
    };

    for (const item of data) {
      item.dataValues.schedules = filterSchedules(item.dataValues.schedules);
      item.dataValues.oslSchedules = filterSchedules(
        item.dataValues.oslSchedules
      );
      item.dataValues.partsIssue = item.dataValues.partsIssue;
    }

    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const getMechanicMapping = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await JobCardDao.getMechanicMapByTransactionId(
      reqData.transaction_id
    );

    return data;
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const getJobcardLabor = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await JobCardDao.getJobcardLabor(reqData.transaction_id);

    return data;
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const updateJobCard = async (jobCard, user) => {
  // console.log("222222222222222222222222",jobCard);
  // return false;
  // console.log("JobCard Service updateJobCard", jobCard);
  // return false;
  let result = 'failed';
  let recentActivityData = {};
  let isStatusChanged = false;
  const currentDate = new Date();

  const updatedLaborList = [];
  const updatedOslList = [];
  const updatedPartsList = [];
  const partsIdMap = new Map();
  const oslIdMap = new Map();
  const laborIdMap = new Map();
  const year = currentDate.getFullYear();
  let message = '';
  try {
    jobCard.labor = Array.isArray(jobCard.labor) ? jobCard.labor : [];
    jobCard.oslLabor = Array.isArray(jobCard.oslLabor) ? jobCard.oslLabor : [];
    jobCard.parts = Array.isArray(jobCard.parts) ? jobCard.parts : [];
    if (
      jobCard.labor.length === 0 ||
      (jobCard.labor.length > 0 &&
        (!jobCard.labor[0]?.laborCode || jobCard.labor[0]?.laborCode === ''))
    ) {
      return 'noLabor';
    }
    let jobCardExists = await JobCardDao.getJobCard(jobCard.id);
    // console.log("JobCard Service updateJobCard jobCardExists", jobCardExists);
    if (!jobCardExists) return 'jobCardNotFound';
    if (jobCardExists && Number(jobCardExists.outlet_id) !== Number(user.outlet.id)) {
      return 'jobCardNotFound';
    }
    if (jobCardExists) {
      // Status transitions are owned by the workflow/status APIs. Preserve the
      // stored status so a stale full-form edit cannot move the card backwards.
      const workflowStatusValue = {
        1: 'Open',
        2: 'Work In Progress',
        3: 'Ready For Billing',
        4: 'Billing',
        5: 'Delivered',
        6: 'Cancelled',
      };
      const storedStatus = Number(jobCardExists.status) || 1;
      jobCard.status = storedStatus;
      jobCard.status_value = workflowStatusValue[storedStatus] || jobCardExists.status_value;
      const existingLabor = new Map((jobCardExists.schedules || []).map((line) => [String(line.id), line]));
      const existingOsl = new Map((jobCardExists.oslSchedules || []).map((line) => [String(line.id), line]));
      const existingParts = new Map((jobCardExists.partsIndent || []).map((line) => [String(line.id), line]));
      for (const line of jobCard.labor) {
        if (line.id !== undefined && line.id !== null) {
          const existing = existingLabor.get(String(line.id));
          if (!existing) return 'jobCardLineNotFound';
          line.status = existing.status;
        } else {
          line.status = 1;
          line.approvalStatus = 'PENDING';
          line.sourceType = 'JOB_CARD';
          line.sourceEstimateItemId = null;
        }
      }
      for (const line of jobCard.oslLabor) {
        if (line.id !== undefined && line.id !== null) {
          const existing = existingOsl.get(String(line.id));
          if (!existing) return 'jobCardLineNotFound';
          line.status = existing.status;
        } else {
          line.status = 1;
          line.approvalStatus = 'PENDING';
          line.sourceType = 'JOB_CARD';
          line.sourceEstimateItemId = null;
        }
      }
      for (const line of jobCard.parts) {
        if (line.id !== undefined && line.id !== null) {
          const existing = existingParts.get(String(line.id));
          if (!existing) return 'jobCardLineNotFound';
          line.status = existing.status;
        } else {
          line.status = 1;
          line.approvalStatus = 'PENDING';
          line.sourceType = 'JOB_CARD';
          line.sourceEstimateItemId = null;
        }
      }
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'JobCard';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (jobCardExists.status_value != jobCard.status_value) {
        isStatusChanged = true;
        message =
          message +
          ' status changed from ' +
          jobCardExists.status_value +
          ' to ' +
          jobCard.status_value +
          ' ,';
      }

      message = message.slice(0, -1);

      let data = await JobCardDao.updateJobCard(jobCard, user);
      if (data && isStatusChanged) {
        await updateBridgeStatusCommon(
          jobCard.id,
          jobCard.status_value,
          user
        );
      }
      if (data) {
        const labor = jobCard.labor;
        const oslLabor = jobCard.oslLabor;
        const parts = jobCard.parts;

        // console.log('given labour data--------',labor)
        // console.log('given oslLabor data--------',oslLabor)
        // console.log('given parts data--------',parts)

        const jcData = {
          labor: jobCardExists.schedules || [],
          oslLabor: jobCardExists.oslSchedules || [],
          part: jobCardExists.partsIndent || [],
        };

        const diffLabour = jcData.labor.filter(
          (item1) => !labor.some((item2) => String(item2.id) === String(item1.id))
        );
        // console.log('labour diff data records-----------',diffLabour);
        for (const lab of diffLabour) {
          if (lab.id !== undefined && lab.id !== null) {
            await JobCardDao.deleteSingleLaborSchedule(lab.id);
          }
        }

        const diffOslLabour = jcData.oslLabor.filter(
          (item1) => !oslLabor.some((item2) => String(item2.id) === String(item1.id))
        );
        for (const lab of diffOslLabour) {
          if (lab.id !== undefined && lab.id !== null) {
            await JobCardDao.deleteSingleOslLaborSchedule(lab.id);
          }
        }

        const diffPartsIndent = jcData.part.filter(
          (item1) => !parts.some((item2) => String(item2.id) === String(item1.id))
        );
        for (const lab of diffPartsIndent) {
          if (lab.id !== undefined && lab.id !== null) {
            await JobCardDao.deleteSinglePartsIndent(lab.id);
          }
        }

        for (const schedulesObj of labor) {
          schedulesObj['transactionId'] = jobCardExists.id;

          let updatedLaborRecord;

          if (schedulesObj.id !== undefined && schedulesObj.id !== null) {
            //  console.log('updating labor record--------',schedulesObj.id)
            updatedLaborRecord = await JobCardDao.updateSchedule(
              schedulesObj,
              user
            );
          } else {
            // console.log('creating labor record--------',schedulesObj)
            updatedLaborRecord = await JobCardDao.createSchedule(
              schedulesObj,
              user
            );
          }

          if (updatedLaborRecord?.id) {
            // console.log('updated labor record--------111111111111111111',updatedLaborRecord)
            laborIdMap.set(updatedLaborRecord.id, updatedLaborRecord.id);
            updatedLaborList.push(updatedLaborRecord);
          }
        }

        for (const oslSchedulesObj of oslLabor) {
          const osl = await JobCardDao.getOslByVendor(
            oslSchedulesObj.supplierCode.id,
            jobCardExists.id
          );

          if (osl) {
            oslSchedulesObj['oslBillNo'] = osl.osl_bill_no;
          } else {
            const oslBillNo = await generateOSLBill(
              'WOB',
              user.outlet.outletCode
            );
            oslSchedulesObj['oslBillNo'] = oslBillNo;
          }

          oslSchedulesObj['transactionId'] = jobCardExists.id;

          let updatedOslRecord;

          if (oslSchedulesObj.id !== undefined && oslSchedulesObj.id !== null) {
            // console.log(
            //   'updating osl labor record--------',
            //   oslSchedulesObj.id
            // );
            updatedOslRecord = await JobCardDao.updateOslSchedule(
              oslSchedulesObj,
              user
            );
          } else {
            // console.log('creating osl labor record--------', oslSchedulesObj);
            updatedOslRecord = await JobCardDao.createOslSchedule(
              oslSchedulesObj,
              user
            );
          }

          if (updatedOslRecord?.id) {
            // console.log(
            //   'updated osl labor record--------111111111111111111',
            //   updatedOslRecord
            // );
            oslIdMap.set(updatedOslRecord.id, updatedOslRecord.id);
            updatedOslList.push(updatedOslRecord);
          }
        }
        // console.log('EEEEEEEEEEEEEEEEEEEEEEEEE',updatedOslList);

        for (const partsIndent of parts) {
          partsIndent['transactionId'] = jobCardExists.id;

          let updatedPartRecord;

          if (partsIndent.id !== undefined && partsIndent.id !== null) {
            // console.log('updating parts record--------', partsIndent.id);
            updatedPartRecord = await JobCardDao.updatePartsIndent(
              partsIndent,
              user
            );
          } else {
            // console.log('creating parts record--------', partsIndent);
            updatedPartRecord = await JobCardDao.createPartsIndent(
              partsIndent,
              user
            );
          }
          if (updatedPartRecord?.id) {
            partsIdMap.set(updatedPartRecord.id, updatedPartRecord.id);
            // updatedPartsList.push(updatedPartRecord);
            // Check if PartsIssue exists first
            const partsIssue = await JobCardDao.getPartsIssueByIndentId(
              updatedPartRecord.id
            );
            // console.log('xxxxxxxxxxxxxxxxxxxxxxxx',partsIssue)

            let partPayload = {};

            // if (partsIssue) {
            //   //  console.log('cccccccccccccccccccccccc',partsIssue)
            //   // Use PartsIssue data
            //   partPayload = {
            //     id: partsIssue.indent_id,
            //     partId: partsIssue.item_id,
            //     partNo: partsIssue.item_code,
            //     partDescription: partsIssue.item_name,
            //     hsnCode: partsIssue.items.hsn_code,
            //     requestedQuantity: partsIssue.quantity,
            //     rate: partsIssue.rate,
            //     additionalMargin: partsIssue.margin ?? null,
            //     discountAmount: partsIssue.discount ?? null,
            //     sgst: partsIssue.sgst,
            //     cgst: partsIssue.cgst,
            //     igst: partsIssue.igst,
            //     fitId: partsIndent.fitId ?? null,
            //     approveStatus:
            //       partsIndent.status == 1 ? null : partsIndent.status,
            //     status: true,
            //   };
            // } else {
            //   // console.log('kkkkkkkkkkkkkkkkkkkkkkk',updatedPartRecord)
            //   partPayload = {
            //     id: updatedPartRecord.id,
            //     partId: updatedPartRecord.item_id,
            //     partNo: updatedPartRecord.item_code,
            //     partDescription: updatedPartRecord.item_name,
            //     hsnCode: updatedPartRecord.hsn_code,
            //     requestedQuantity: updatedPartRecord.request_quantity,
            //     rate: updatedPartRecord.amount,
            //     additionalMargin: updatedPartRecord.margin ?? null,
            //     discountAmount: updatedPartRecord.discount ?? null,
            //     sgst: updatedPartRecord.sgst,
            //     cgst: updatedPartRecord.cgst,
            //     igst: updatedPartRecord.igst,
            //     fitId: updatedPartRecord.fitId ?? null,
            //     approveStatus:
            //       updatedPartRecord.status == 1
            //         ? null
            //         : updatedPartRecord.status,
            //     status: false,
            //   };
            // }

            updatedPartsList.push(partPayload);
          }
        }
      }
      // console.log('RRRRRRRRRRRRRRRRRRRRRRRRRRR',updatedPartsList);
      // console.log('sssssssssssssssssssssssssss',updatedLaborList);
      // console.log('ccccccccccccccccccccccccccc',updatedOslList);

      // const auth = await getRemoteToken();
      // console.log('Auth Token:', auth);

      // if (auth?.token) {
      if (true) {
        // const remotePayload = {
        //   userId: auth.userId,
        //   authenticationToken: auth.token,
        //   jcId: String(jobCard.id),
        //   updateType: 'data',
        //   payload: {
        //     laborSchedules: updatedLaborList.map((labor) => ({
        //       id: String(labor.id),
        //       laborId: String(labor.rot_id),
        //       laborCode: String(labor.rot_code),
        //       laborDescription: String(labor.description),
        //       quantity: String(labor.quantity),
        //       sacCode: '998729',
        //       singleAmount: String(labor.singleAmount),
        //       rate: String(labor.amount),
        //       additionalMargin: String(labor.additionalMargin) ?? null,
        //       discountAmount: String(labor.discount_percentage) ?? null,
        //       sgst: String(labor.sgst) ?? null,
        //       cgst: String(labor.cgst) ?? null,
        //       igst: String(labor.igst) ?? null,
        //       laborTotal: String(labor.laborTotal) ?? null,
        //       fitId: labor.fitId == null ? null : String(labor.fitId),
        //       approveStatus: labor.status == 1 ? null : String(labor.status),
        //     })),
        //     part: updatedPartsList.map((part) => ({
        //       id: String(part.id),
        //       partId: String(part.partId) ?? null,
        //       partNo: String(part.partNo) ?? null,
        //       partDescription: String(part.partDescription) ?? null,
        //       hsnCode: String(part.hsnCode) ?? null,
        //       requestedQuantity: String(part.requestedQuantity) ?? null,
        //       rate: String(part.rate),
        //       additionalMargin: String(part.additionalMargin) ?? null,
        //       discountAmount: String(part.discountAmount) ?? null,
        //       sgst: String(part.sgst) ?? null,
        //       cgst: String(part.cgst) ?? null,
        //       igst: String(part.igst) ?? null,
        //       fitId: part.fitId == null ? null : String(part.fitId),
        //       status: part.status,
        //       approveStatus:
        //         part.approveStatus == null ? null : String(part.approveStatus),
        //     })),
        //     oslLaborSchedules: updatedOslList.map((osl) => ({
        //       id: String(osl.id),
        //       laborId: String(osl.rot_id),
        //       laborCode: String(osl.rot_code),
        //       laborDescription: String(osl.description),
        //       quantity: String(osl.quantity),
        //       sacCode: '998729',
        //       rate: String(osl.amount),
        //       additionalMargin: String(osl.additionalMargin) ?? null,
        //       discountAmount: String(osl.discount_percentage) ?? null,
        //       sgst: String(osl.sgst),
        //       cgst: String(osl.cgst),
        //       igst: String(osl.igst),
        //       laborTotal: osl.laborTotal,
        //       vendorId: String(osl.vendorId) ?? null,
        //       fitId: osl.fitId == null ? null : String(osl.fitId),
        //       approveStatus: osl.status == 1 ? null : String(osl.status),
        //     })),
        //   },
        // };

        // console.log('Remote Payload:----------------', remotePayload);

        // const remoteResponse = await pushJobCardDataToRemote(remotePayload);
        // console.log('Remote Response:', remoteResponse);

        // await createMobileApiRemoteReq(
        //   remotePayload,
        //   remoteResponse,
        //   user,
        //   'Dms-to-tvsFit-jc-Update'
        // );

        // if (remoteResponse?.fitDMSMap) {
        //   const { LABOUR, OSL, PARTS } = remoteResponse.fitDMSMap;

        //   for (const labor of LABOUR || []) {
        //     const localId = laborIdMap.get(labor.dmsId);
        //     if (localId)
        //       await JobCardDao.updateLaborFitId(localId, labor.fitId);
        //   }

        //   for (const osl of OSL || []) {
        //     const localId = oslIdMap.get(osl.dmsId);
        //     if (localId)
        //       await JobCardDao.updateOslLaborFitId(localId, osl.fitId);
        //   }

        //   for (const part of PARTS || []) {
        //     const localId = partsIdMap.get(part.dmsId);
        //     if (localId) await JobCardDao.updatePartsFitId(localId, part.fitId);
        //   }
        // }

        const JCdetails = await JobCardDao.getTransactionDetails(jobCard.id);

        const statusMapping = {
          1: 'Open',
          2: 'Work In Progress',
          3: 'Ready For Billing',
          4: 'Billing',
          5: 'Delivered',
          6: 'Cancelled',
        };

        const status = JCdetails.status || 1;
        const statusText = statusMapping[status] || 'Unknown';

        // const updatePayload = {
        //   userId: auth.userId,
        //   authenticationToken: auth.token,
        //   jcId: jobCard.id,
        //   updateType: 'status',
        //   payload: { status: statusText },
        // };

        let updateToFitAboutStatus = {};
        updateToFitAboutStatus = JobCardDao.savejcdetails(jobCard, statusText);



        // console.log('userId11111111111111:', updatePayload);

        // const updateResponse = await axios.post(
        //   'https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php',
        //   updatePayload,
        //   { headers: { 'Content-Type': 'application/json' } }
        // );

        // const updateResult = updateResponse.data;

        // console.log('resposne from status upadte ', updateResult);

        try {
          const payload = {
            user_id: user?.id || null,
            api_url: 'status_update_dms_tvsfit',
            action: 'POST',
            request_json: JSON.stringify({
              message: "data and status updated for Job Card ID " + jobCard.id + " with status " + statusText
            }),
            response_json: JSON.stringify({
              message: `Status update for Job Card ID ${jobCard.id} from fit function resposne : ${updateToFitAboutStatus} `
            }),
            user_role_id: user?.roleid || null,
            ip_address: 'dms-web-application',
            user_agent: 'internal-server-operation',
          };

          await MobileApiTrackDao.createMobileApiReq(payload);
        } catch (err) {
          logger.error('Mobile API Remote Tracking Error:', err);
          return null;
        }
      }
      await advanceJobCardWorkflowIfApproved(jobCard.id, user);
      result = 'success';
    }
    if (message) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
    }
    result = 'success';
  } catch (err) {
    logger.error('JobCard Service  updateJobCard', err);
    // next(err);
  }
  return result;
};

const updateJobCardLineApproval = async (approvalData, user) => {
  try {
    const result = await JobCardDao.updateJobCardLineApproval(approvalData, user);
    if (result?.statusAdvanced) {
      await updateBridgeStatusCommon(approvalData.jobCardId, result.status, user);
    }
    return result;
  } catch (err) {
    logger.error('JobCard service updateJobCardLineApproval', err);
    throw err;
  }
};

const advanceJobCardWorkflowIfApproved = async (jobCardId, user) => {
  const workflow = await JobCardDao.advanceJobCardToInProgressIfApprovedById(jobCardId, user);
  if (workflow?.statusAdvanced) {
    await updateBridgeStatusCommon(jobCardId, workflow.status, user);
  }
  return workflow;
};

const dataPushDmsToFitJc = async (transId, user) => {
  let results = null;

  try {
    // 1) Login API call
    const tvsfitAuth = await getRemoteToken();
    const loginData = tvsfitAuth;

    if (!loginData.token || loginData.userId == '') {
      return {
        requestSuccessful: false,
        message: 'FIT login failed',
        data: loginData,
      };
    }

    // 2) Get transaction
    const transaction = await Transaction.findOne({
      where: { id: transId },
      attributes: ['id', 'outlet_id'],
      raw: true,
    });

    if (!transaction) {
      return {
        requestSuccessful: false,
        message: 'Transaction not found',
      };
    }
    //no col name isB2Bapprove in table so set false
    const isB2Bapprove = false;

    // 3) Get labour schedules
    const labours = await Schedule.findAll({
      where: { transaction_id: transaction.id },
      raw: true,
    });

    const labourSchedules = labours?.length
      ? labours.map((labour) => ({
        id: labour.id,
        laborId: labour.rot_id,
        laborCode: labour.rot_code,
        laborDescription: labour.description,
        quantity: labour.quantity,
        sacCode: '998729',
        singleAmount: labour.single_amount,
        amount: labour.amount,
        additionalMargin: labour.additionalMargin,
        discountAmount: labour.discount_percentage,
        cgst: labour.cgst,
        sgst: labour.sgst,
        igst: labour.igst,
        laborTotal: labour.laborTotal,
        fitId: labour.fitid,
        approveStatus: labour.status,
      }))
      : [];

    // 4) Get parts indent
    const seParts = await PartsIndent.findAll({
      where: {
        transaction_id: transaction.id,
        request_quantity: {
          [db.Sequelize.Op.ne]: 0,
        },
      },
      raw: true,
    });

    const partsIndent = [];

    if (seParts?.length) {
      for (const sePart of seParts) {
        const partsIssue = await PartsIssue.findOne({
          where: { indent_id: sePart.id },
          include: [
            {
              model: Item,
              as: 'items', // change alias if your association uses different alias
              attributes: ['hsnCode'],
              required: false,
            },
          ],
        });

        if (partsIssue) {
          const partsIssueJson = partsIssue.toJSON();

          partsIndent.push({
            id: partsIssueJson.indent_id,
            partId: partsIssueJson.item_id,
            partNo: partsIssueJson.item_code,
            partDescription: partsIssueJson.item_name,
            hsnCode: partsIssueJson.item?.hsnCode || null,
            requestedQuantity: partsIssueJson.quantity,
            rate: partsIssueJson.rate,
            additionalMargin: 0, // no col in parts issue so set 0
            discountAmount: partsIssueJson.discount,
            sgst: partsIssueJson.sgst,
            cgst: partsIssueJson.cgst,
            igst: partsIssueJson.igst,
            fitId: sePart.fitId,
            status: true,
            approveStatus: sePart.status,
          });
        } else {
          partsIndent.push({
            id: sePart.id,
            partId: sePart.item_id,
            partNo: sePart.item_code,
            partDescription: sePart.item_name,
            hsnCode: sePart.hsn_code,
            requestedQuantity: sePart.request_quantity,
            rate: sePart.amount,
            additionalMargin: 0, // no col in parts indent
            discountAmount: 0, // no col in parts indent
            sgst: sePart.sgst,
            cgst: sePart.cgst,
            igst: sePart.igst,
            fitId: sePart.fitid,
            status: false,
            approveStatus: sePart.status,
          });
        }
      }
    }

    // 5) Get OSL schedules
    const oslSchedulesDb = await OslSchedule.findAll({
      where: { transaction_id: transaction.id },
      raw: true,
    });

    const oslLaborSchedules = oslSchedulesDb?.length
      ? oslSchedulesDb.map((osl) => {
        const laborTotal =
          Number(osl.amount || 0) * Number(osl.quantity || 0);
        const oslLabourAmount =
          laborTotal - Number(osl.discount_percentage || 0);

        const oslLabourCgst = Number(osl.cgst || 0);
        const oslLabourSgst = Number(osl.sgst || 0);
        const oslLabourIgst = Number(osl.igst || 0);

        const oslLabourCgstAmount = (oslLabourAmount / 100) * oslLabourCgst;
        const oslLabourSgstAmount = (oslLabourAmount / 100) * oslLabourSgst;
        const oslLabourIgstAmount = (oslLabourAmount / 100) * oslLabourIgst;

        const oslLabourTotalTax =
          oslLabourCgstAmount + oslLabourSgstAmount + oslLabourIgstAmount;

        const oslLabourLineTotal = oslLabourAmount + oslLabourTotalTax;

        return {
          id: osl.id,
          laborId: osl.rot_id,
          laborCode: osl.rot_code,
          laborDescription: osl.description,
          quantity: osl.quantity,
          sacCode: '998729',
          rate: osl.amount,
          discountAmount: osl.discount_percentage,
          additionalMargin: osl.additionalMargin,
          sgst: osl.sgst,
          cgst: osl.cgst,
          igst: osl.igst,
          laborTotal: oslLabourLineTotal,
          vendorId: osl.vendorId,
          fitId: osl.fitid,
          approveStatus: osl.status,
        };
      })
      : [];

    // 6) Build payload
    const payload = {
      userId: loginData.userId,
      authenticationToken: loginData.token,
      jcId: transaction.id,
      isB2Bapprove,
      updateType: 'data',
      payload: {
        laborSchedules: labourSchedules,
        part: partsIndent,
        oslLaborSchedules,
      },
    };

    // 7) Save JC details API call
    // const saveResponse = await axios.post(FIT_SAVE_JC_URL, payload, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // });

    const remoteResponse = await pushJobCardDataToRemote(payload);
    // console.log('Remote Response:', remoteResponse);

    // results = saveResponse?.data;
    results = remoteResponse;
    await createMobileApiRemoteReq(
      payload,
      remoteResponse,
      user,
      'RSA_Related_DMSTOFIT_JC_PUSH'
    );

    // 8) Update fitid mappings
    const fitDMSMap = results?.fitDMSMap;

    //  if (remoteResponse?.fitDMSMap) {
    //       const { LABOUR, OSL, PARTS } = remoteResponse.fitDMSMap;

    //       for (const labor of LABOUR || []) {
    //         const localId = laborIdMap.get(labor.dmsId);
    //         if (localId) await JobCardDao.updateLaborFitId(localId, labor.fitId);
    //       }

    //       for (const osl of OSL || []) {
    //         const localId = oslIdMap.get(osl.dmsId);
    //         if (localId) await JobCardDao.updateOslLaborFitId(localId, osl.fitId);
    //       }

    //       for (const part of PARTS || []) {
    //         const localId = partsIdMap.get(part.dmsId);
    //         if (localId) await JobCardDao.updatePartsFitId(localId, part.fitId);
    //       }
    //     }
    if (fitDMSMap?.LABOUR?.length) {
      for (const labor of fitDMSMap.LABOUR) {
        // const [affectedCount] = await Schedule.update(
        //   { fitid: labor.fitId },
        //   { where: { id: labor.dmsId } }
        // );

        await JobCardDao.updateLaborFitId(labor.dmsId, labor.fitId);

        // console.log(`LABOUR id ${labor.dmsId} updated rows: ${affectedCount}`);
      }
    }

    if (fitDMSMap?.OSL?.length) {
      for (const osl of fitDMSMap.OSL) {
        // const [affectedCount] = await OslSchedule.update(
        //   { fitid: osl.fitId },
        //   { where: { id: osl.dmsId } }
        // );
        await JobCardDao.updateOslLaborFitId(osl.dmsId, osl.fitId);
        // console.log(`OSL id ${osl.dmsId} updated rows: ${affectedCount}`);
      }
    }

    if (fitDMSMap?.PARTS?.length) {
      for (const part of fitDMSMap.PARTS) {
        // const [affectedCount] = await PartsIndent.update(
        //   { fitid: part.fitId },
        //   { where: { id: part.dmsId } }
        // );
        await JobCardDao.updatePartsFitId(part.dmsId, part.fitId);
        // console.log(`PARTS id ${part.dmsId} updated rows: ${affectedCount}`);
      }
    }

    return {
      requestSuccessful: true,
      data: results,
    };
  } catch (error) {
    logger?.error?.(`dataPushDmsToFitJc Error: ${error.message}`);
    return {
      requestSuccessful: false,
      message: 'Error while pushing JC data',
      error: error.message,
      data: results,
    };
  }
};

// const updateJobcardStatus = async (reqData, user) => {
//   let result = "failed";
//   try {
//     const data = await JobCardDao.updateJobcardStatus(reqData, user);
//     if (data === "Approved") {
//       result = "success";
//       if (reqData.status === 5) {
//         const deliveryNumber = await generateOutPassNumber("EOUT", user.outlet.outletCode);
//         const billData = await JobCardDao.updateDeliveryNumber(reqData, deliveryNumber);

//         if (billData && billData[0] > 0) {
//           logger.info("Delivery number updated successfully", { reqData, deliveryNumber });
//         } else {
//           logger.warn("Failed to update delivery number", { reqData, deliveryNumber });
//         }
//       }
//         const auth = await getRemoteToken();
//       console.log('Auth Token:', auth);

//       if(auth?.token){
//       const JCdetails = await JobCardDao.getTransactionDetails(jobCard.id)
//       const statusMapping = {
//       1: "Open",
//       2: "Work In Progress",
//       3: "Ready For Billing",
//       4: "Billing",
//       5: "Delivered",
//       6: "Cancelled",
//     };

//     const status =  JCdetails.status || 1;
//     const statusText = statusMapping[status] || "Unknown";

//       const updatePayload = {
//       userId: auth.userId,
//       authenticationToken: auth.token,
//       jcId: jobCard.id,
//       updateType: "status",
//       payload: { status: statusText },
//     };

//      console.log('userId11111111111111:', updatePayload);

//     const updateResponse = await axios.post(
//       "https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php",
//       updatePayload,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     const updateResult = updateResponse.data;

//     console.log('resposne from status upadte ',updateResult)

//      try {
//     const payload = {
//       user_id: user?.id || null,
//       api_url: 'status_update_dms_tvsfit',
//       action: 'POST',
//       request_json: JSON.stringify(updatePayload),
//       response_json: JSON.stringify(updateResult),
//       user_role_id: user?.roleid || null,
//       ip_address: 'dms-web-application',
//       user_agent: 'internal-server-operation',
//     };

//     await MobileApiTrackDao.createMobileApiReq(payload);
//       }catch(err){
//       logger.error("Error in remote updateJobcardStatus TVSFIT:", { error: err.stack, reqData, user });
//       }

//     }
//     else if (data === "ajcfailed") {
//       result = "ajcfailed";
//     } else if (data === "srFailed") {
//       result = "srFailed";
//     } else if (data === "customerApprovalFailed") {
//       result = "customerApprovalFailed";
//     }

//   } catch (err) {
//     logger.error("Error in updateJobcardStatus:", { error: err.stack, reqData, user });
//     result = "failed";
//   }
//   return result;
// };

// const updateJobcardStatus = async (reqData, user) => {

//   let result = "failed";
//   try {
//     const data = await JobCardDao.updateJobcardStatus(reqData, user);

//     if (data === "Approved") {
//       result = "success";

//       // If status is Delivered, generate delivery number
//       if (reqData.status === 5) {
//         const deliveryNumber = await generateOutPassNumber("EOUT", user.outlet.outletCode);
//         const billData = await JobCardDao.updateDeliveryNumber(reqData, deliveryNumber);

//         if (billData && billData[0] > 0) {
//           logger.info("Delivery number updated successfully", { reqData, deliveryNumber });
//         } else {
//           logger.warn("Failed to update delivery number", { reqData, deliveryNumber });
//         }
//       }

//       // Get remote auth token
//       const auth = await getRemoteToken();
//       console.log("Auth Token:", auth);

//       if (auth?.token) {
//         // Fetch Job Card details
//         const JCdetails = await JobCardDao.getTransactionDetails(reqData.id);

//         // Status mapping
//         const statusMapping = {
//           1: "Open",
//           2: "Work In Progress",
//           3: "Ready For Billing",
//           4: "Billing",
//           5: "Delivered",
//           6: "Cancelled",
//         };

//         const status = JCdetails?.status || 1;
//         const statusText = statusMapping[status] || "Unknown";

//         // Prepare payload
//         const updatePayload = {
//           userId: auth.userId,
//           authenticationToken: auth.token,
//           jcId: reqData.id,
//           updateType: "status",
//           payload: { status: statusText },
//         };

//          console.log("Payload for status update:", updatePayload);

//         // Call external API
//         const updateResponse = await axios.post(
//           "https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php",
//           updatePayload,
//           { headers: { "Content-Type": "application/json" } }
//         );

//         const updateResult = updateResponse.data;
//         console.log("Response from status update:", updateResult);

//         // Track API request/response
//         try {
//           const payload = {
//             user_id: user?.id || null,
//             api_url: "status_update_dms_tvsfit",
//             action: "POST",
//             request_json: JSON.stringify(updatePayload),
//             response_json: JSON.stringify(updateResult),
//             user_role_id: user?.roleid || null,
//             ip_address: "dms-web-application",
//             user_agent: "internal-server-operation",
//           };

//           await MobileApiTrackDao.createMobileApiReq(payload);
//         } catch (err) {
//           logger.error("Error in MobileApiTrackDao.createMobileApiReq:", {
//             error: err.stack,
//             reqData,
//             user,
//           });
//         }
//       }
//     } else if (data === "ajcfailed") {
//       result = "ajcfailed";
//     } else if (data === "mechFailed") {
//       result = "mechFailed";
//     }
//   } catch (err) {
//     logger.error("Error in updateJobcardStatus:"+err, {
//       error: err.stack,
//       reqData,
//       user,
//     });
//     result = "failed";
//   }
//   return result;
// };

const updateJobcardStatus = async (reqData, user) => {
  let result = {};

  try {
    if (reqData.status === 5) {
      const gatepassValidation = await validateBeforeGatePass(reqData, user);

      if (!gatepassValidation.success) {
        return {
          status: gatepassValidation.status || "gatepassValidationFailed",
          message: gatepassValidation.message
        };
      }
    }
    const data = await JobCardDao.updateJobcardStatus(reqData, user);

    // console.log("data",data);
    if (data === 'Approved') {
      result = { status: 'success' };

      await updateBridgeStatusCommon(
        reqData.id,
        reqData.status,
        user
      );
      console.log('Bridge status updated successfully for transaction ID:', reqData.id);
      if (reqData.status === 5) {
        // While GatePass Creation we will call RSA External Api To Get memberShip Details

        if (
          user.outlet.companyId == 2 ||
          user.outlet.companyId == 5 ||
          user.outlet.companyId == 8
        ) {
          const rsaScheduleIsTrue = await JobCardDao.getScheduleByRotValue(
            reqData.id,
            4097
          );

          if (rsaScheduleIsTrue && rsaScheduleIsTrue.length > 0) {
            // rsa function
            const updateRsaDetails = await updateToRsa(reqData, user);
          }
        }
        if (user.outlet.companyId == 3) {
          const rsaScheduleIsTrue = await JobCardDao.getScheduleByRotValue(
            reqData.id,
            4096
          );

          console.log('rsaScheduleIsTrue', rsaScheduleIsTrue);

          if (rsaScheduleIsTrue && rsaScheduleIsTrue.length > 0) {
            // rsa function
            const updateRsaDetails = await updateToRsaFOCO(reqData, user);

          }
        }

        if (user.outlet.companyId == 6) {
          // const rsaScheduleIsTrue =  await JobCardDao.getScheduleByRotValue(jcId,61454);

          if (reqData.jobCardNo?.startsWith('RJC')) {
            // rsa function
            const updateRsaDetails = await sendRsaTVSFCCC(reqData, user);
          }
        }
        const deliveryNumber = await generateOutPassNumber(
          'EOUT',
          user.outlet.outletCode
        );
        const billData = await JobCardDao.updateDeliveryNumber(
          reqData,
          deliveryNumber
        );

        if (billData && billData[0] > 0) {
          logger.info('Delivery number updated successfully', {
            reqData,
            deliveryNumber,
          });
        } else {
          logger.warn('Failed to update delivery number', {
            reqData,
            deliveryNumber,
          });
        }
      }

      // const auth = await getRemoteToken();

      // if (auth?.token) {
      //   const JCdetails = await JobCardDao.getTransactionDetails(reqData.id);

      //   const statusMapping = {
      //     1: "Open",
      //     2: "Work In Progress",
      //     3: "Ready For Billing",
      //     4: "Billing",
      //     5: "Delivered",
      //     6: "Cancelled",
      //   };

      //   const statusText = statusMapping[JCdetails?.status || 1] || "Unknown";

      //   const updatePayload = {
      //     userId: auth.userId,
      //     authenticationToken: auth.token,
      //     jcId: reqData.id,
      //     updateType: "status",
      //     payload: { status: statusText },
      //   };

      //   console.log("Payload for status update:", updatePayload);

      //   //  External FIT API CALL
      //   try {
      //     const updateResponse = await axios.post(
      //       "https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php",
      //       updatePayload,
      //       { timeout: 8000, headers: { "Content-Type": "application/json" } }
      //     );

      //     if (!updateResponse?.data) {
      //       throw new Error("Empty response from FIT API");
      //     }

      //     // Track success response
      //     await MobileApiTrackDao.createMobileApiReq({
      //       user_id: user?.id || null,
      //       api_url: "status_update_dms_tvsfit",
      //       action: "POST",
      //       request_json: JSON.stringify(updatePayload),
      //       response_json: JSON.stringify(updateResponse.data),
      //       user_role_id: user?.roleid || null,
      //       ip_address: "dms-web-application",
      //       user_agent: "internal-server-operation",
      //     });

      //   } catch (fitErr) {
      //     //  FIT API FAILURE HANDLED HERE
      //     logger.error("FIT API FAILED", {
      //       error: fitErr.message,
      //       reqData,
      //     });

      //     result = "fitApiFailed";
      //   }
      // } else {
      //   logger.error("Failed to obtain auth token for FIT API", { reqData, user });
      //   result = "fitApiFailed";
      // }
    } else if (data === 'ajcfailed') {
      result = { status: 'ajcfailed' };
    } else if (data === 'mechFailed') {
      result = { status: 'mechFailed' };
    } else if (data === 'GstCheckFailed') {
      result = { status: 'GstCheckFailed' };
    } else if (data?.status === 'fitApiFailed') {
      result = data;
    } else if (data?.status === 'saveJcData') {
      result = data;
    } else {
      result = { status: 'failed' };
    }
  } catch (err) {
    logger.error('Error in updateJobcardStatus', {
      error: err.stack,
      reqData,
      user,
    });
    result = { status: 'failed' };
  }

  return result;
};

// const updateJobcardStatusFit = async (reqData, user) => {
//   let result = {};

//   try {
//     const data = await JobCardDao.updateJobcardStatusFit(reqData, user);

//     console.log('data from dao------------------',data);

//     if (data === "Approved") {
//       result = { status: "success" };

//         if (reqData.status === 5) {
//         const deliveryNumber = await generateOutPassNumber("EOUT", user.outlet.outletCode);
//         const billData = await JobCardDao.updateDeliveryNumber(reqData, deliveryNumber);

//         if (billData && billData[0] > 0) {
//           logger.info("Delivery number updated successfully", { reqData, deliveryNumber });
//         } else {
//           logger.warn("Failed to update delivery number", { reqData, deliveryNumber });
//         }
//       }
//     } else if (data === "ajcfailed") {
//     result = { status: "Complete the insurance details to proceed ." };
//     } else if (data === "mechFailed") {
//       result = { status: "Update failed / Mechanic Mapping is not 100% to proceed ." };
//     }
//     else if (data === "GstCheckFailed") {
//       result = { status: "GST % details are not valid. Please Customer State and Outlet State." };
//     }
//     else {
//   result = { status: "failed" };
// }

//   } catch (err) {
//     logger.error("Error in updateJobcardStatus11111", {
//       error: err.stack,
//       reqData,
//       user,
//     });
//    result = { status: "failed" };
//   }

//   return result;
// };

// const updateToRsa = async (jcDetails, user) => {
//   try {
//     let auditmessage = '';
//     const data = await JobCardDao.getJcDetails(jcDetails.id);
//     if (!data) return { status: 0, message: "JobCard not found" };

//     const jcdata = data?.dataValues;
//     console.log('JC data------------------',jcdata);
//     const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);
//     if (!vehicle) return { status: 0, message: "Vehicle details missing" };
//     const vehicleDetails = vehicle?.dataValues;

//     console.log('vehicle details------------------',vehicleDetails);
//     let sendRsa = true;
//     const todayDate = moment().startOf("day");
//     if (vehicle.rsa_end_date) {
//       const rsaEndDate = moment(vehicle.rsa_end_date).startOf("day");

//       if (todayDate < rsaEndDate) {
//         sendRsa = false;
//       }
//     }
//     const customerData = await JobCardDao.getCustomerDataRsa(jcdata.customer_id);
//     const customerDetails = customerData?.dataValues;

//     if(vehicle && sendRsa){
//       const scheduleData = await JobCardDao.getScheduleDetails(jcDetails.id);
//        let labourAmount = 0;
//         for (const row of scheduleData) {
//           if (row.repairtype == 2) continue;
//           labourAmount += row.amount + row.additionalMargin - row.discount_percentage;
//         }

//     const oslScheduleData = await JobCardDao.getOslScheduleDetails(jcDetails.id);

//     let oslTotalBeforeTax = 0;

//     for (const osl of oslScheduleData) {
//       const qty = osl.quantity;
//       const rate = osl.amount;
//       const discount = osl.discount_percentage;
//       const supplierMargin = osl.marginPercentage / 100;
//       const addMargin = osl.additional_margin;

//       const amount = qty * rate;
//       const afterDiscount = amount - discount;
//       const marginAmount = (afterDiscount / (1 - supplierMargin)) + addMargin;

//       oslTotalBeforeTax += marginAmount;
//     }
//      if (labourAmount + oslTotalBeforeTax >= 1000) {

//          const payload = {
//       client: "TVS CONNECT",
//       vin_no: vehicleDetails.chassisNumber,
//       vehicle_type: "car",
//       vehicle_make: vehicleDetails.make.makeName, // need to check make name
//       vehicle_model: vehicleDetails.model.modelName, // model name
//       year: "",
//       registration_number: vehicleDetails.registrationNumber,
//       first_name: customerDetails.decryptedFirstName,
//       last_name: customerDetails.decryptedLastName,
//       mobile_phone: customerDetails.decryptedMobileNumber,
//       primary_email: customerDetails.decryptedEmail,
//       gst_no: customerDetails.gstinNumber?customerDetails.gstinNumber:"",
//       address: customerDetails.address1,
//       city: customerDetails.city,
//       state: customerDetails.state,
//       Postal_code: customerDetails.pinCode,
//       rsa_plan: "MyTVS SHIELD - CARS",
//       dealer_code: "MYTW"
//     };

//     console.log('RSA Payload:', payload);

//       const RSA_URL = `${EXTERNAL_API.RSA_CREATE_MEMBERSHIP}`;
//      const rsaApiResponse = await axios.post(RSA_URL, payload);

//       console.log('RSA API Response:', rsaApiResponse.data);

//        let updateVehicle = false;
//         if(rsaApiResponse.data.membership_number){
//            updateVehicle = await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {

//                 rsa_start_date: trim(rsaApiResponse.data.rsa_start_date),
//                 rsa_end_date: trim(rsaApiResponse.data.rsa_end_date),
//                 rsa_transaction_id : trim(rsaApiResponse.data.rsa_transaction_id),
//                 membership_number : rsaApiResponse.data.membership_number,
//                 certificate_url: rsaApiResponse.data.certificate_url,
//                 rsa_flag: "SUCCESS",
//                 rsa_transaction_id: jcdata.id
//               });
//         }else{
//             updateVehicle=  await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
//                 rsa_flag : rsaApiResponse

//               });

//         }

//         if(updateVehicle){
//           const scheduleLabor = {
//                 transactionId: jcdata.id,
//                 laborId:"60182",
//                 laborCode: 'RSA',
//                 laborDescription: 'RSA Membership',
//                 quantity: 1,
//                 singleAmount: 0,
//                 insuranceAmount: 0,
//                 additionalMargin: 0,
//                 discountAmount: 0,
//                 sgst:0,
//                 cgst: 0,
//                 igst: 0,
//                 depreciation: 0,
//                 customerAmount: 0,
//                 laborTotal: 0,
//                 status: 2,
//                 repairType: {
//                       id: 2,
//                       repairTypeName: "RSA Membership"
//                   },
//           }
//           const creatScheduleRsa = await  JobCardDao.createSchedule(scheduleLabor,user)
//         }

//       // api tracking section
//          try {
//           const payload = {
//             user_id: user?.id || null,
//             api_url: 'RSA_Membership_api',
//             action: 'POST',
//             request_json: JSON.stringify(payload),
//             response_json: JSON.stringify(rsaApiResponse.data),
//             user_role_id: user?.roleid || null,
//             ip_address: 'dms-web-application',
//             user_agent: 'internal-server-operation',
//           };

//           await MobileApiTrackDao.createMobileApiReq(payload);
//           } catch (err) {
//             logger.error('Mobile API Remote Tracking Error in RSA Membership Api:', err);
//             return null;
//           }

//      }else{
//       console.log('RSA to be sent amount is less then 1000');
//      }
//     auditmessage = 'RSA API call made successfully.';

//     }else{
//      auditmessage = 'Vehicle details missing or RSA is still active, skipping RSA API call.';
//      console.log(auditmessage);
//     }
//     return {
//       status: 1,
//       message: auditmessage,
//       data: rsaApiResponse.data
//     };

//   } catch (err) {
//     console.log("Error in updateToRsa()", err);
//     return { status: 0, message: "Something went wrong" };
//   }
// };

const STATUS_MESSAGES = {
  [statusConstants.SUCCESS]: 'Job card updated successfully',
  [statusConstants.AJC_FAILED]: 'Complete insurance details to proceed',
  [statusConstants.MECH_FAILED]: 'Mechanic mapping is not 100%',
  [statusConstants.JOB_NOT_FOUND]: 'Jobcard Id not found In DMS',
  [statusConstants.GST_FAILED]: 'Invalid GST %. Check customer & outlet state',
  [statusConstants.FAILED]: 'Job card update failed',
  [statusConstants.INTERNAL_ERROR]: 'Internal server error',
};

const updateJobcardStatusFit = async (reqData, user) => {
  try {
    const code = await JobCardDao.updateJobcardStatusFit(reqData, user);

    if (code === statusConstants.SUCCESS && reqData.status === 5) {
      try {
        const deliveryNumber = await generateOutPassNumber(
          'EOUT',
          user.outlet.outletCode
        );
        await JobCardDao.updateDeliveryNumber(reqData, deliveryNumber);
      } catch (err) {
        logger.warn('Delivery number update failed', err);
      }
    }

    return {
      code,
      message: STATUS_MESSAGES[code] || STATUS_MESSAGES[statusConstants.FAILED],
    };
  } catch (err) {
    logger.error('Service error updateJobcardStatusFit', err);
    return {
      code: statusConstants.INTERNAL_ERROR,
      message: STATUS_MESSAGES[statusConstants.INTERNAL_ERROR],
    };
  }
};

const CreateScheduleForRSAByCompanyId = async (jcId, user) => {
  try {
    let auditmessage = '';
    let rsaApiResponse = null;

    const data = await JobCardDao.getJcDetails(jcId);
    if (!data) return { status: 0, message: 'JobCard not found' };

    const jcdata = data.dataValues;
    const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);

    if (!vehicle) {
      return { status: 0, message: 'Vehicle details missing' };
    }

    const vehicleDetails = vehicle.dataValues;
    const customerData = await JobCardDao.getCustomerDataRsa(
      jcdata.customer_id
    );
    const customerDetails = customerData?.dataValues;
    // console.log('customer details ----------',customerDetails)
    // ----- RSA ACTIVE CHECK -----
    let sendRsa = true;
    const todayDate = moment().startOf('day');

    if (vehicle.rsa_end_date) {
      const rsaEndDate = moment(vehicle.rsa_end_date).startOf('day');
      if (todayDate < rsaEndDate) sendRsa = false;
    }

    if (sendRsa) {
      // ----- LABOUR CALC -----
      const scheduleData = await JobCardDao.getScheduleDetails(jcId);
      let labourAmount = 0;

      if (Array.isArray(scheduleData)) {
        for (const row of scheduleData) {
          if (row.repairtype == 2) continue;
          labourAmount +=
            row.amount + row.additionalMargin - row.discount_percentage;
        }
      }

      // ----- OSL CALC -----
      const oslScheduleData = await JobCardDao.getOslScheduleDetails(jcId);
      // console.log("OSL Schedule Data:---------------", oslScheduleData);
      let oslTotalBeforeTax = 0;

      if (Array.isArray(oslScheduleData)) {
        for (const osl of oslScheduleData) {
          const qty = osl.quantity;
          const rate = osl.amount;
          const discount = osl.discount_percentage;
          const supplierMargin = osl.marginPercentage / 100;
          const addMargin = osl.additionalMargin;

          const amount = qty * rate;
          const afterDiscount = amount - discount;
          const marginAmount = afterDiscount / (1 - supplierMargin) + addMargin;

          oslTotalBeforeTax += marginAmount;
        }
      }

      const partsIssueDetails = await JobCardDao.getPartsIssueDetails(jcId);
      // console.log("Parts Issue Data:---------------", partsIssueDetails);

      let partsTotalBeforeTax = 0;
      if (Array.isArray(partsIssueDetails)) {
        for (const parts of partsIssueDetails) {
          if (parts.repair_type == 2) continue;
          const qty = parts.quantity;
          const rate = parts.rate;
          const discount = parts.discount;
          const supplierMargin = 0;
          const addMargin = 0;

          const amount = qty * rate;
          const afterDiscount = amount - discount;
          const marginAmount = afterDiscount / (1 - supplierMargin) + addMargin;

          partsTotalBeforeTax += marginAmount;
        }
      }

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      const hasIgst =
        scheduleData?.some((r) => Number(r.igst) > 0) ||
        oslScheduleData?.some((r) => Number(r.igst) > 0) ||
        partsIssueDetails?.some((r) => Number(r.igst) > 0);

      if (hasIgst) {
        igst = 18;
      } else {
        cgst = 9;
        sgst = 9;
      }

      // console.log("Labour Amount:", Math.round(labourAmount));
      // console.log("OSL Total Before Tax:", Math.round(oslTotalBeforeTax));
      // console.log("Parts Amount Before Tax:", Math.round(partsTotalBeforeTax));

      const rsaScheduleIsTrue = await JobCardDao.getScheduleByRotValue(
        jcId,
        4097
      );
      // console.log('ddddddddddddd',rsaScheduleIsTrue)
      let payload = {};
      let scheduleCreate = {};
      if (rsaScheduleIsTrue && rsaScheduleIsTrue.length > 0) {
        // console.log('RSA Already exist');
        logger.info(`${'RSA Already Created Transaction Id :'}${jcId}`);
        // payload.message = `${"RSA Already Created Transaction Id"}${jcId}`;
        // scheduleCreate.message =`${"RSA Already Created Transaction Id"}${jcId}`;
      } else {
        //  console.log('Creating RSA schedule...');

        payload = {
          transactionId: jcId,
          // laborId: 62548,
          laborId: 4097,
          laborCode: 'RSA_DMS',
          laborDescription: 'MyTVS SHIELD',
          quantity: 1,
          singleAmount: 199,
          amount: 199,
          // rate: 199,
          insuranceAmount: 0,
          additionalMargin: 0,
          discountAmount: 0,
          sgst: sgst,
          cgst: cgst,
          igst: igst,
          depreciation: 0,
          customerAmount: 199,
          laborTotal: 235,
          status: 2,
          repairType: { id: 1, repairTypeName: 'PAID SERVICE' },
        };

        scheduleCreate = await JobCardDao.createSchedule(payload, user);
        let dataPushToFitApp = null;
        if (scheduleCreate.id || scheduleCreate.transaction_id) {
          // no need to push data to fit noe 26-03-2026
          // dataPushToFitApp = await dataPushDmsToFitJc(jcId, user);

          // console.log('data push to fit ', dataPushToFitApp);
        }

        try {
          await MobileApiTrackDao.createMobileApiReq({
            user_id: user?.id || null,
            api_url: 'RSA_ScheduleCreated_199_for_company_2,5,8',
            action: 'POST',
            request_json: JSON.stringify(payload),
            response_json: JSON.stringify({
              message: scheduleCreate?.message || 'Schedule created successfully',
              scheduleId: scheduleCreate?.id || null,
            }),
            user_role_id: user?.roleid || null,
            ip_address: 'dms-web-application',
            user_agent: 'internal-server-operation',
          });
          // if (dataPushToFitApp.requestSuccessful == false) {
          //   return {
          //     requestSuccessful: false,
          //     status: 0,
          //   };
          // }
        } catch (trackingErr) {
          logger.error('Mobile API Tracking Error:', trackingErr);
        }
      }
    } else {
      auditmessage = 'RSA is still active. Skipping API.';
    }

    return {
      requestSuccessful: true,
      status: 1,
    };
  } catch (err) {
    console.log('Error in updateToRsa()', err);
    return { status: 0, message: 'Something went wrong' };
  }
};

const mcflRsa = async (jcId, user) => {
  try {
    let auditmessage = '';
    let rsaApiResponse = null; // <-- FIXED : so it can be safely returned

    const data = await JobCardDao.getJcDetails(jcId);
    if (!data) return { status: 0, message: 'JobCard not found' };

    const jcdata = data.dataValues;
    const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);

    if (!vehicle) {
      return { status: 0, message: 'Vehicle details missing' };
    }

    const vehicleDetails = vehicle.dataValues;
    const customerData = await JobCardDao.getCustomerDataRsa(
      jcdata.customer_id
    );
    const customerDetails = customerData?.dataValues;

    // ----- RSA ACTIVE CHECK -----
    let sendRsa = true;
    const todayDate = moment().startOf('day');

    if (vehicle.rsa_end_date) {
      const rsaEndDate = moment(vehicle.rsa_end_date).startOf('day');
      if (todayDate < rsaEndDate) sendRsa = false;
    }

    if (sendRsa) {
      // ----- LABOUR CALC -----
      const scheduleData = await JobCardDao.getScheduleDetails(jcId);
      let labourAmount = 0;

      if (Array.isArray(scheduleData)) {
        for (const row of scheduleData) {
          if (row.repairtype == 2) continue;
          labourAmount +=
            row.amount + row.additionalMargin - row.discount_percentage;
        }
      }

      // ----- OSL CALC -----
      const oslScheduleData = await JobCardDao.getOslScheduleDetails(jcId);
      // console.log('OSL Schedule Data:---------------', oslScheduleData);
      let oslTotalBeforeTax = 0;

      if (Array.isArray(oslScheduleData)) {
        for (const osl of oslScheduleData) {
          const qty = osl.quantity;
          const rate = osl.amount;
          const discount = osl.discount_percentage;
          const supplierMargin = osl.marginPercentage / 100;
          const addMargin = osl.additionalMargin;

          const amount = qty * rate;
          const afterDiscount = amount - discount;
          const marginAmount = afterDiscount / (1 - supplierMargin) + addMargin;

          oslTotalBeforeTax += marginAmount;
        }
      }

      const partsIssueDetails = await JobCardDao.getPartsIssueDetails(jcId);
      // console.log("Parts Issue Data:---------------", partsIssueDetails);

      let partsTotalBeforeTax = 0;
      if (Array.isArray(partsIssueDetails)) {
        for (const parts of partsIssueDetails) {
          if (parts.repair_type == 2) continue;
          const qty = parts.quantity;
          const rate = parts.rate;
          const discount = parts.discount;
          const supplierMargin = 0;
          const addMargin = 0;

          const amount = qty * rate;
          const afterDiscount = amount - discount;
          const marginAmount = afterDiscount / (1 - supplierMargin) + addMargin;

          partsTotalBeforeTax += marginAmount;
        }
      }

      // console.log("Labour Amount:", Math.round(labourAmount));
      // console.log("OSL Total Before Tax:", Math.round(oslTotalBeforeTax));
      // console.log("Parts Amount Before Tax:", Math.round(partsTotalBeforeTax));

      const rsaScheduleIsTrue = await JobCardDao.getScheduleByRotValue(
        jcId,
        4096
      );
      // console.log('ddddddddddddd',rsaScheduleIsTrue)

      const TotalAmountBeforetax =
        Math.round(labourAmount) +
        Math.round(oslTotalBeforeTax) +
        Math.round(partsTotalBeforeTax);
      let sgst = 0;
      let cgst = 0;
      let igst = 0;
      let approveStatus = 1;
      if (user.outlet.state == customerDetails.state) {
        sgst = 9;
        cgst = 9;
        igst = 0;
      } else {
        sgst = 0;
        cgst = 0;
        igst = 18;
      }
      // if ((user.outlet.companyId = 1)) {
      //   approveStatus = 2;
      // }

      if (
        rsaScheduleIsTrue &&
        rsaScheduleIsTrue.length == 0 &&
        TotalAmountBeforetax >= 10
      ) {
        // console.log('Creating RSA schedule...');
        const payload = {
          transactionId: jcId,
          // laborId: 61454,
          laborId: 4096,
          laborCode: 'RSAFOFO',
          laborDescription: 'myTVS Covered',
          quantity: 1,
          singleAmount: 299,
          amount: 299,
          // rate: 199,
          insuranceAmount: 0,
          additionalMargin: 0,
          discountAmount: 0,
          sgst: sgst,
          cgst: cgst,
          igst: igst,
          depreciation: 0,
          customerAmount: 299,
          laborTotal: 353,
          status: approveStatus,
          repairType: { id: 1, repairTypeName: 'PAID SERVICE' },
        };

        let scheduleCreated = null;

        scheduleCreated = await JobCardDao.createSchedule(payload, user);

        if (scheduleCreated.id || scheduleCreated.transaction_id) {
          // no need to push data to fit now 26-03-2026
          // dataPushToFitApp = await dataPushDmsToFitJc(jcId, user);

          // console.log('data push to fit ', dataPushToFitApp);
        }

        try {
          await MobileApiTrackDao.createMobileApiReq({
            user_id: user?.id || null,
            api_url: 'RSA_ScheduleCreated_299_for_company_3',
            action: 'POST',
            request_json: JSON.stringify(payload),
            response_json: JSON.stringify({
              message: scheduleCreated?.message || 'Schedule created successfully',
              scheduleId: scheduleCreated?.id || null
            }),
            user_role_id: user?.roleid || null,
            ip_address: 'dms-web-application',
            user_agent: 'internal-server-operation',
          });
        } catch (trackingErr) {
          logger.error('Mobile API Tracking Error:', trackingErr);
        }
        // error here
        // if (dataPushToFitApp.requestSuccessful == false) {
        //   return {
        //     requestSuccessful: false,
        //     status: 0,
        //   };
        // }
      } else {
      }

      // want to ask siva bro .from here need to push fit app
    } else {
      auditmessage = 'RSA is still active. Skipping API.';
    }

    return {
      requestSuccessful: true,
      status: 1,
    };
  } catch (err) {
    console.log('Error in MCFLRsa()', err);
    return { status: 0, message: 'Something went wrong' };
  }
};

const updateToRsa = async (jcDetails, user) => {
  try {
    let auditmessage = '';
    let rsaApiResponse = null; // <-- FIXED : so it can be safely returned

    const data = await JobCardDao.getJcDetails(jcDetails.id);
    if (!data) return { status: 0, message: 'JobCard not found' };

    const jcdata = data.dataValues;
    const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);

    if (!vehicle) {
      return { status: 0, message: 'Vehicle details missing' };
    }

    const vehicleDetails = vehicle.dataValues;
    const customerData = await JobCardDao.getCustomerDataRsa(
      jcdata.customer_id
    );
    const customerDetails = customerData?.dataValues;

    // ----- RSA ACTIVE CHECK -----
    let sendRsa = true;
    const todayDate = moment().startOf('day');

    if (vehicle.rsa_end_date) {
      const rsaEndDate = moment(vehicle.rsa_end_date).startOf('day');
      if (todayDate < rsaEndDate) sendRsa = false;
    }

    if (sendRsa) {
      // ----- CHECK AMOUNT >= 1000 -----

      const rsaPayload = {
        client: 'TVS CONNECT',
        vin_no: vehicleDetails.chassisNumber,
        vehicle_type: 'car',
        vehicle_make: vehicleDetails.make?.makeName || '',
        vehicle_model: vehicleDetails.model?.modelName || '',
        year: '',
        registration_number: vehicleDetails.registrationNumber,
        first_name: customerDetails?.decryptedFirstName,
        last_name: customerDetails?.decryptedLastName,
        mobile_phone: customerDetails?.decryptedMobileNumber,
        primary_email: customerDetails?.decryptedEmail,
        gst_no: customerDetails?.gstinNumber || '',
        address: customerDetails?.address1,
        city: customerDetails?.city,
        state: customerDetails?.state,
        Postal_code: customerDetails?.pinCode,
        rsa_plan: 'MyTVS SHIELD',
        dealer_code: 'CF001',
      };

      const timestamp = Math.floor(Date.now() / 1000);

      // Secret key
      const secret_key = 'af1cdd8etele7dc308G17D48craft8823432#@t5&rvpc88';
      // Create the string and MD5 token
      const string = `${secret_key} ${timestamp}`;
      const token = md5(string);
      // Prepare headers
      const headers = {
        Token: token,
        Timestamp: timestamp,
        'Content-Type': 'application/json',
      };

      // console.log('Headers for RSA API:', headers);

      // // API URL
      // const url = "https://uat.tvs.in/rsa/qa1/api/rsa-policy/create";

      // // Axios POST
      // const response = await axios.post(url, payload, { headers });

      const RSA_URL = EXTERNAL_API.RSA_CREATE_MEMBERSHIP;
      // console.log('RSA Payload:', rsaPayload);
      // console.log('RSA Headers:', headers);
      // console.log('RSA URL:', RSA_URL);
      rsaApiResponse = await axios.post(RSA_URL, rsaPayload, { headers });

      // rsaApiResponse = {
      //   data: {
      //     membership_number: "MYS123456789",
      //     rsa_start_date: "2024-01-01",
      //     rsa_end_date: "2025-01-01",
      //     rsa_transaction_id: "TXN123456789",
      //     certificate_url: "https://example.com/certificate.pdf"

      //   }
      // }

      // ----- UPDATE VEHICLE -----
      if (rsaApiResponse.data?.membership_number) {
        // console.log(
        //   'Updating vehicle with RSA details...',
        //   rsaApiResponse.data
        // );
        const startDateRaw = rsaApiResponse.data.rsa_start_date;
        const endDateRaw = rsaApiResponse.data.rsa_end_date;

        const startDate = moment(startDateRaw, 'DD-MM-YYYY').format(
          'YYYY-MM-DD'
        );
        const endDate = moment(endDateRaw, 'DD-MM-YYYY').format('YYYY-MM-DD');

        // if (!startDate.isValid() || !endDate.isValid()) {
        //   throw new Error("Invalid date format received from RSA API");
        // }
        await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          // rsa_start_date: trim(rsaApiResponse.data.rsa_start_date),
          // rsa_end_date: trim(rsaApiResponse.data.rsa_end_date),
          // rsa_transaction_id: trim(rsaApiResponse.data.rsa_transaction_id),
          rsa_start_date: startDate,
          rsa_end_date: endDate,
          rsa_transaction_id: parseInt(jcDetails.id) || null,
          membership_number: rsaApiResponse.data.membership_number,
          certificate_url: rsaApiResponse.data.certificate_url,
          rsa_flag: 'SUCCESS',
        });
        // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
        //   rsa_start_date: (rsaApiResponse.data.rsa_start_date || "").trim(),
        //   rsa_end_date: (rsaApiResponse.data.rsa_end_date || "").trim(),
        //   rsa_transaction_id: jcdata.id ,
        //   membership_number: rsaApiResponse.data.membership_number,
        //   certificate_url: rsaApiResponse.data.certificate_url,
        //   rsa_flag: "SUCCESS"
        // });
      } else {
        // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
        //   rsa_flag: rsaApiResponse.data
        // });

        const errorMessage = rsaApiResponse.data?.error || 'UNKNOWN_ERROR';

        await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          rsa_flag: errorMessage, // ✅ store string only
        });
      }

      // ----- TRACK API -----
      try {
        await MobileApiTrackDao.createMobileApiReq({
          user_id: user?.id || null,
          api_url: 'RSA_Membership_api_Call_2_5_8',
          action: 'POST',
          request_json: JSON.stringify(rsaPayload),
          response_json: JSON.stringify(rsaApiResponse.data),
          user_role_id: user?.roleid || null,
          ip_address: 'dms-web-application',
          user_agent: 'internal-server-operation',
        });
      } catch (trackingErr) {
        logger.error('Mobile API Tracking Error:', trackingErr);
      }

      auditmessage = 'RSA API call made successfully.';
    } else {
      auditmessage = 'RSA is still active. Skipping API.';
    }

    return {
      status: 1,
      message: auditmessage,
      data: rsaApiResponse?.data || null,
    };
  } catch (err) {
    console.log('Error in updateToRsa()', err);
    return { status: 0, message: 'Something went wrong' };
  }
};

const updateToRsaFOCO = async (jcDetails, user) => {
  try {
    let auditmessage = '';
    let rsaApiResponse = null; // <-- FIXED : so it can be safely returned

    const data = await JobCardDao.getJcDetails(jcDetails.id);
    if (!data) return { status: 0, message: 'JobCard not found' };

    const jcdata = data.dataValues;
    const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);

    if (!vehicle) {
      return { status: 0, message: 'Vehicle details missing' };
    }

    const vehicleDetails = vehicle.dataValues;
    const customerData = await JobCardDao.getCustomerDataRsa(
      jcdata.customer_id
    );
    const customerDetails = customerData?.dataValues;

    // ----- RSA ACTIVE CHECK -----
    let sendRsa = true;
    const todayDate = moment().startOf('day');

    if (vehicle.rsa_end_date) {
      const rsaEndDate = moment(vehicle.rsa_end_date).startOf('day');
      if (todayDate < rsaEndDate) sendRsa = false;
    }

    if (sendRsa) {
      const rsaPayload = {
        client: 'MYTVS.IN',
        vin_no: vehicleDetails.chassisNumber,
        vehicle_type: 'car',
        vehicle_make: vehicleDetails.make?.makeName || '',
        vehicle_model: vehicleDetails.model?.modelName || '',
        year: '',
        registration_number: vehicleDetails.registrationNumber,
        first_name: customerDetails?.decryptedFirstName,
        last_name: customerDetails?.decryptedLastName,
        mobile_phone: customerDetails?.decryptedMobileNumber,
        primary_email: customerDetails?.decryptedEmail,
        gst_no: customerDetails?.gstinNumber || '',
        address: customerDetails?.address1,
        city: customerDetails?.city,
        state: customerDetails?.state,
        Postal_code: customerDetails?.pinCode,
        rsa_plan: 'myTVS Covered 1',
        dealer_code: 'KIRSA15',
      };

      const timestamp = Math.floor(Date.now() / 1000);

      // Secret key
      const secret_key = 'af1cdd8etele7dc308G17D48craft8823432#@t5&rvpc88';

      // Create the string and MD5 token
      const string = `${secret_key} ${timestamp}`;
      const token = md5(string);
      // Prepare headers
      const headers = {
        Token: token,
        Timestamp: timestamp,
        'Content-Type': 'application/json',
      };

      // console.log('Headers for RSA API:', headers);

      // // API URL
      // const url = "https://uat.tvs.in/rsa/qa1/api/rsa-policy/create";

      // // Axios POST
      // const response = await axios.post(url, payload, { headers });

      const RSA_URL = EXTERNAL_API.RSA_CREATE_MEMBERSHIP;
      // console.log('RSA Payload:', rsaPayload);
      // console.log('RSA Headers:', headers);
      // console.log('RSA URL:', RSA_URL);
      rsaApiResponse = await axios.post(RSA_URL, rsaPayload, { headers });

      // rsaApiResponse = {
      //   data: {
      //     membership_number: "MYS123456789",
      //     rsa_start_date: "2024-01-01",
      //     rsa_end_date: "2025-01-01",
      //     rsa_transaction_id: "TXN123456789",
      //     certificate_url: "https://example.com/certificate.pdf"

      //   }
      // }

      // ----- UPDATE VEHICLE -----
      if (rsaApiResponse.data?.membership_number) {
        // console.log(
        //   'Updating vehicle with RSA details...',
        //   rsaApiResponse.data
        // );
        const startDateRaw = rsaApiResponse.data.rsa_start_date;
        const endDateRaw = rsaApiResponse.data.rsa_end_date;

        const startDate = moment(startDateRaw, 'DD-MM-YYYY').format(
          'YYYY-MM-DD'
        );
        const endDate = moment(endDateRaw, 'DD-MM-YYYY').format('YYYY-MM-DD');

        // if (!startDate.isValid() || !endDate.isValid()) {
        //   throw new Error("Invalid date format received from RSA API");
        // }
        await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          // rsa_start_date: trim(rsaApiResponse.data.rsa_start_date),
          // rsa_end_date: trim(rsaApiResponse.data.rsa_end_date),
          // rsa_transaction_id: trim(rsaApiResponse.data.rsa_transaction_id),
          rsa_start_date: startDate,
          rsa_end_date: endDate,
          rsa_transaction_id: parseInt(jcDetails.id) || null,
          membership_number: rsaApiResponse.data.membership_number,
          certificate_url: rsaApiResponse.data.certificate_url,
          rsa_flag: 'SUCCESS',
        });
        // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
        //   rsa_start_date: (rsaApiResponse.data.rsa_start_date || "").trim(),
        //   rsa_end_date: (rsaApiResponse.data.rsa_end_date || "").trim(),
        //   rsa_transaction_id: jcdata.id ,
        //   membership_number: rsaApiResponse.data.membership_number,
        //   certificate_url: rsaApiResponse.data.certificate_url,
        //   rsa_flag: "SUCCESS"
        // });
      } else {
        // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
        //   rsa_flag: rsaApiResponse.data
        // });

        const errorMessage = rsaApiResponse.data?.error || 'UNKNOWN_ERROR';

        await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          rsa_flag: errorMessage, // ✅ store string only
        });
      }

      // ----- TRACK API -----
      try {
        await MobileApiTrackDao.createMobileApiReq({
          user_id: user?.id || null,
          api_url: 'RSA_Membership_api_3_FOFO',
          action: 'POST',
          request_json: JSON.stringify(rsaPayload),
          response_json: JSON.stringify(rsaApiResponse.data),
          user_role_id: user?.roleid || null,
          ip_address: 'dms-web-application',
          user_agent: 'internal-server-operation',
        });
      } catch (trackingErr) {
        logger.error('Mobile API Tracking Error:', trackingErr);
      }

      auditmessage = 'RSA API call made successfully.';
    } else {
      auditmessage = 'RSA is still active. Skipping API.';
    }

    return {
      status: 1,
      message: auditmessage,
      data: rsaApiResponse?.data || null,
    };
  } catch (err) {
    console.log('Error in updateToRsa()', err);
    return { status: 0, message: 'Something went wrong' };
  }
};

const sendRsaTVSFCCC = async (jcDetails, user) => {
  try {
    let auditmessage = '';
    let rsaApiResponse = null; // <-- FIXED : so it can be safely returned

    const data = await JobCardDao.getJcDetails(jcDetails.id);
    if (!data) return { status: 0, message: 'JobCard not found' };

    const jcdata = data.dataValues;
    const vehicle = await JobCardDao.getVehicleDataRsa(jcdata.vehicle_id);

    if (!vehicle) {
      return { status: 0, message: 'Vehicle details missing' };
    }

    const vehicleDetails = vehicle.dataValues;
    const customerData = await JobCardDao.getCustomerDataRsa(
      jcdata.customer_id
    );
    const customerDetails = customerData?.dataValues;

    // ----- RSA ACTIVE CHECK -----
    let sendRsa = true;
    const todayDate = moment().startOf('day');

    if (vehicle.rsa_end_date) {
      const rsaEndDate = moment(vehicle.rsa_end_date).startOf('day');
      if (todayDate < rsaEndDate) sendRsa = false;
    }

    if (sendRsa) {
      // ----- LABOUR CALC -----
      const scheduleData = await JobCardDao.getScheduleDetails(jcDetails.id);
      let labourAmount = 0;

      if (Array.isArray(scheduleData)) {
        for (const row of scheduleData) {
          if (row.repairtype == 2) continue;
          labourAmount +=
            row.amount + row.additionalMargin - row.discount_percentage;
        }
      }

      // ----- OSL CALC -----
      const oslScheduleData = await JobCardDao.getOslScheduleDetails(
        jcDetails.id
      );
      // console.log("OSL Schedule Data:---------------", oslScheduleData);
      let oslTotalBeforeTax = 0;

      if (Array.isArray(oslScheduleData)) {
        for (const osl of oslScheduleData) {
          const qty = osl.quantity;
          const rate = osl.amount;
          const discount = osl.discount_percentage;
          const supplierMargin = osl.marginPercentage / 100;
          const addMargin = osl.additionalMargin;

          const amount = qty * rate;
          const afterDiscount = amount - discount;
          const marginAmount = afterDiscount / (1 - supplierMargin) + addMargin;

          oslTotalBeforeTax += marginAmount;
        }
      }

      // console.log('Labour Amount:', labourAmount);
      // console.log('OSL Total Before Tax:', oslTotalBeforeTax);

      // ----- CHECK AMOUNT >= 1000 -----
      if (labourAmount + oslTotalBeforeTax >= 1000) {
        const rsaPayload = {
          client: 'TVS CONNECT',
          vin_no: vehicleDetails.chassisNumber,
          vehicle_type: 'car',
          vehicle_make: vehicleDetails.make?.makeName || '',
          vehicle_model: vehicleDetails.model?.modelName || '',
          year: '',
          registration_number: vehicleDetails.registrationNumber,
          first_name: customerDetails?.decryptedFirstName,
          last_name: customerDetails?.decryptedLastName,
          mobile_phone: customerDetails?.decryptedMobileNumber,
          primary_email: customerDetails?.decryptedEmail,
          gst_no: customerDetails?.gstinNumber || '',
          address: customerDetails?.address1,
          city: customerDetails?.city,
          state: customerDetails?.state,
          Postal_code: customerDetails?.pinCode,
          rsa_plan: 'MyTVS SHIELD - CARS',
          dealer_code: 'MYTW2',
        };

        const timestamp = Math.floor(Date.now() / 1000);

        // Secret key
        const secret_key = 'af1cdd8etele7dc308G17D48craft8823432#@t5&rvpc88';

        // Create the string and MD5 token
        const string = `${secret_key} ${timestamp}`;
        const token = md5(string);
        // Prepare headers
        const headers = {
          Token: token,
          Timestamp: timestamp,
          'Content-Type': 'application/json',
        };

        // console.log('Headers for RSA API:', headers);

        // // API URL
        // const url = "https://uat.tvs.in/rsa/qa1/api/rsa-policy/create";

        // // Axios POST
        // const response = await axios.post(url, payload, { headers });

        const RSA_URL = EXTERNAL_API.RSA_CREATE_MEMBERSHIP;
        // console.log('RSA Payload:', rsaPayload);
        // console.log('RSA Headers:', headers);
        // console.log('RSA URL:', RSA_URL);
        rsaApiResponse = await axios.post(RSA_URL, rsaPayload, { headers });

        // rsaApiResponse = {
        //   data: {
        //     membership_number: "MYS123456789",
        //     rsa_start_date: "2024-01-01",
        //     rsa_end_date: "2025-01-01",
        //     rsa_transaction_id: "TXN123456789",
        //     certificate_url: "https://example.com/certificate.pdf"

        //   }
        // }

        // ----- UPDATE VEHICLE -----
        if (rsaApiResponse.data?.membership_number) {
          // console.log(
          //   'Updating vehicle with RSA details...',
          //   rsaApiResponse.data
          // );
          const startDateRaw = rsaApiResponse.data.rsa_start_date;
          const endDateRaw = rsaApiResponse.data.rsa_end_date;

          const startDate = moment(startDateRaw, 'DD-MM-YYYY').format(
            'YYYY-MM-DD'
          );
          const endDate = moment(endDateRaw, 'DD-MM-YYYY').format('YYYY-MM-DD');

          // if (!startDate.isValid() || !endDate.isValid()) {
          //   throw new Error("Invalid date format received from RSA API");
          // }
          await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
            // rsa_start_date: trim(rsaApiResponse.data.rsa_start_date),
            // rsa_end_date: trim(rsaApiResponse.data.rsa_end_date),
            // rsa_transaction_id: trim(rsaApiResponse.data.rsa_transaction_id),
            rsa_start_date: startDate,
            rsa_end_date: endDate,
            rsa_transaction_id: parseInt(jcDetails.id) || null,
            membership_number: rsaApiResponse.data.membership_number,
            certificate_url: rsaApiResponse.data.certificate_url,
            rsa_flag: 'SUCCESS',
          });
          // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          //   rsa_start_date: (rsaApiResponse.data.rsa_start_date || "").trim(),
          //   rsa_end_date: (rsaApiResponse.data.rsa_end_date || "").trim(),
          //   rsa_transaction_id: jcdata.id ,
          //   membership_number: rsaApiResponse.data.membership_number,
          //   certificate_url: rsaApiResponse.data.certificate_url,
          //   rsa_flag: "SUCCESS"
          // });
        } else {
          // await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
          //   rsa_flag: rsaApiResponse.data
          // });

          const errorMessage = rsaApiResponse.data?.error || 'UNKNOWN_ERROR';

          await JobCardDao.updateVehicleRSA(jcdata.vehicle_id, {
            rsa_flag: errorMessage, // ✅ store string only
          });
        }

        // ---- CREATE LABOR ENTRY ----
        const scheduleLabor = {
          transactionId: jcdata.id,
          // laborId:61470,
          laborId: 4098,
          laborCode: 'RSAFOFO1',
          laborDescription: 'MyTVS SHIELD - CARS',
          quantity: 1,
          singleAmount: 0,
          status: 2,
          insuranceAmount: 0,
          additionalMargin: 0,
          discountAmount: 0,
          sgst: 0,
          cgst: 0,
          igst: 0,
          depreciation: 0,
          customerAmount: 0,
          laborTotal: 0,
          repairType: { id: 2, repairTypeName: 'FOC' },
        };

        await JobCardDao.createSchedule(scheduleLabor, user);

        // ----- TRACK API -----
        try {
          await MobileApiTrackDao.createMobileApiReq({
            user_id: user?.id || null,
            api_url: 'RSA_GatePass_Generation_3',
            action: 'POST',
            request_json: JSON.stringify(rsaPayload),
            response_json: JSON.stringify(rsaApiResponse.data),
            user_role_id: user?.roleid || null,
            ip_address: 'dms-web-application',
            user_agent: 'internal-server-operation',
          });
        } catch (trackingErr) {
          logger.error('Mobile API Tracking Error:', trackingErr);
        }

        auditmessage = 'RSA API call made successfully.';
      } else {
        auditmessage = 'Amount less than 1000. RSA not triggered.';
      }
    } else {
      auditmessage = 'RSA is still active. Skipping API.';
    }

    return {
      status: 1,
      message: auditmessage,
      data: rsaApiResponse?.data || null,
    };
  } catch (err) {
    console.log('Error in updateToRsa()', err);
    return { status: 0, message: 'Something went wrong' };
  }
};

const generateOSLBill = async (jobType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentOsl = await JobCardDao.getRecentOslScheduleForWobNo(
    jobType,
    outletCode,
    currentYear
  );
  if (recentOsl) {
    const lastNumber = recentOsl.osl_bill_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `${jobType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const getOslScheduleByWOB = async (billNo, vendorId, otlet) => {
  const resObj = {};
  const outlet = {};
  const customer = {};
  const document = {};
  const supplier = {};
  const vehicle = {};
  const items = [];

  let subtotalQty = 0;
  let subtotalTDisc = 0;
  let subtotalIGST = 0;
  let subtotalCGST = 0;
  let subtotalSGST = 0;
  let subtotalAmount = 0;

  try {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const data = await JobCardDao.getWOB(billNo, vendorId);
    // If `data` is not an array, wrap it in an array
    const dataArray = Array.isArray(data) ? data : [data];

    // Set Outlet information
    outlet['code'] = otlet.outletCode;
    (outlet['address'] = otlet.address1),
      (outlet['city'] = otlet.city),
      (outlet['state'] = otlet.state),
      (outlet['pincode'] = otlet.pincode),
      (outlet['phone'] = otlet.phoneNumber);
    outlet['mobile'] = otlet.phoneNumber;
    outlet['email'] = otlet.email;
    outlet['gstin'] = otlet.gstIn;
    outlet['outletName'] = otlet.outletName;

    // Assuming all entries have the same customer, document, supplier, and vehicle data
    if (dataArray.length > 0) {
      const firstElement = dataArray[0];

      // Set Customer information
      customer['name'] = firstElement.oslschedulesMapping.customer_name;
      customer['gstin'] = firstElement.oslschedulesMapping.customer_gstin;
      customer['code'] = firstElement.oslschedulesMapping.customer_code;

      // Set Document information
      document['name'] = firstElement.osl_bill_no;
      document['date'] = formattedDate;
      document['branch'] = otlet.outletCode;

      // Set Supplier information
      supplier['name'] = firstElement.vendor?.vendorName;
      supplier['code'] = firstElement.vendor?.vendorCode;
      supplier['gstin'] = firstElement.vendor?.gstin;

      // Set Vehicle information
      vehicle['model'] =
        firstElement.oslschedulesMapping.vehicle.model.modelName;
      vehicle['regNo'] = firstElement.oslschedulesMapping.reg_no;
      vehicle['engineNo'] =
        firstElement.oslschedulesMapping.vehicle.engineNumber;
    }

    // Iterate over dataArray to build items array and calculate subtotals
    dataArray.forEach((element, index) => {
      // console.log(element)
      let margin = element.marginPercentage / 100;
      // let baseAmount = parseFloat(((element.quantity * element.amount - element.discount_percentage + element.additionalMargin)/(1-margin) ).toFixed(2));

      let baseAmount = parseFloat(
        (element.quantity * element.amount).toFixed(2)
      );

      let igstAmount = parseFloat(
        ((element.igst / 100) * baseAmount).toFixed(2)
      );
      let cgstAmount = parseFloat(
        ((element.cgst / 100) * baseAmount).toFixed(2)
      );
      let sgstAmount = parseFloat(
        ((element.sgst / 100) * baseAmount).toFixed(2)
      );
      let tax = igstAmount > 0 ? igstAmount : sgstAmount + cgstAmount;

      const igst = (element.igst * element.amount) / 100;
      const cgst = (element.cgst * element.amount) / 100;
      const sgst = (element.sgst * element.amount) / 100;

      let totalItemAmt = (baseAmount + tax).toFixed(2);

      const item = {
        sno: index + 1,
        workOrder: element.description,
        account: 'service purchase account',
        rate: element.amount,
        qty: element.quantity,
        labor: element.description,
        tdisc: element.discount_percentage,
        igstPercent: element.igst,
        igst: igstAmount,
        cgstPercent: element.cgst,
        cgst: cgstAmount,
        sgstPercent: element.sgst,
        sgst: sgstAmount,
        amount: totalItemAmt,
      };

      // if(element.vendorId){
      //   const itemWithMargin = element.amount * ((element.marginPercentage + 100)/100);
      //   const igst = Math.round(((element.igst * itemWithMargin)) * element.quantity)/100;
      //   const cgst = Math.round(((element.cgst * itemWithMargin)) * element.quantity)/100;
      //   const sgst = Math.round(((element.sgst * itemWithMargin)) * element.quantity)/100;
      //   let totalItemAmt = (itemWithMargin * element.quantity + cgst + sgst + igst - element.discount_percentage * element.quantity).toFixed(2);
      //   item = {
      //     sno: index + 1,
      //     workOrder: element.description,
      //     account: "service purchase account",
      //     rate: element.amount,
      //     qty: element.quantity,
      //     labor: element.description,
      //     tdisc: element.discount_percentage,
      //     igstPercent: element.igst,
      //     igst: igst,
      //     cgstPercent: element.cgst,
      //     cgst: cgst,
      //     sgstPercent: element.sgst,
      //     sgst: sgst,
      //     amount: totalItemAmt
      //   };
      //   subtotalQty += element.quantity;
      //   subtotalTDisc += element.discount_percentage * element.quantity;
      //   subtotalIGST += igst;
      //   subtotalCGST += cgst;
      //   subtotalSGST += sgst;
      //   subtotalAmount += itemWithMargin * element.quantity;
      // } else {
      //   let totalItemAmt = ((element.amount - element.discount_percentage) * element.quantity).toFixed(2);
      //   item = {
      //     sno: index + 1,
      //     workOrder: element.description,
      //     account: "service purchase account",
      //     rate: element.amount,
      //     qty: element.quantity,
      //     labor: element.description,
      //     tdisc: element.discount_percentage,
      //     igstPercent: element.igst,
      //     igst: 0,
      //     cgstPercent: element.cgst,
      //     cgst: 0,
      //     sgstPercent: element.sgst,
      //     sgst: 0,
      //     amount: totalItemAmt
      //   };

      //   subtotalQty += element.quantity;
      //   subtotalTDisc += element.discount_percentage;
      //   subtotalIGST += 0;
      //   subtotalCGST += 0;
      //   subtotalSGST += 0;
      //   subtotalAmount += element.amount * element.quantity;
      // }

      items.push(item);

      // Accumulate subtotals
      subtotalQty += element.quantity;
      subtotalTDisc += element.discount_percentage;
      subtotalIGST += igstAmount;
      subtotalCGST += cgstAmount;
      subtotalSGST += sgstAmount;
      subtotalAmount += baseAmount;
    });

    // Add the items and other sections to the response object
    resObj['outlet'] = outlet;
    resObj['customer'] = customer;
    resObj['document'] = document;
    resObj['supplier'] = supplier;
    resObj['vehicle'] = vehicle;
    resObj['items'] = items;
    resObj['subtotalQty'] = subtotalQty;
    resObj['subtotalTDisc'] = subtotalTDisc;
    resObj['subtotalIGST'] = subtotalIGST;
    resObj['subtotalCGST'] = subtotalCGST;
    resObj['subtotalSGST'] = subtotalSGST;
    resObj['subtotalAmount'] = subtotalAmount;

    const totalTax =
      subtotalIGST > 0 ? subtotalIGST : subtotalCGST + subtotalSGST;
    resObj['totalTax'] = totalTax;
    resObj['cashDiscount'] = subtotalTDisc;
    let totalAmount = subtotalAmount + totalTax;
    // resObj["totalAmount"] = totalAmount;

    // Round-off calculation
    const decimalPart = totalAmount - Math.floor(totalAmount);
    let roundOff = 0;

    if (decimalPart >= 0.5) {
      roundOff = Math.ceil(totalAmount) - totalAmount;
    } else {
      roundOff = Math.floor(totalAmount) - totalAmount;
    }

    const finalAmount = totalAmount + roundOff;
    resObj['roundOff'] = roundOff.toFixed(2);
    resObj['totalAmount'] = finalAmount;

    // Convert final amount to words
    let amountInWords = numberToWords.toWords(finalAmount);
    resObj['amountInWords'] = amountInWords + ' Rupees Only';
    return resObj;
  } catch (err) {
    logger.error('JobCard service getOslScheduleByWOB', err);
    next(err);
  }
};

const oslWorkOrders = async (jobCardId) => {
  try {
    const data = await JobCardDao.oslWorkOrders(jobCardId);
    return data;
  } catch (err) {
    logger.error('JobCard service oslWorkOrders', err);
    next(err);
  }
};

const listGatePassJobCards = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await JobCardDao.listGatePassJobCards(
      reqData,
      user
    );

    const filterSchedules = (scheduleArray) => {
      return scheduleArray.filter((app) => app.status === 2);
    };

    for (const item of data) {
      item.dataValues.schedules = filterSchedules(item.dataValues.schedules);
      item.dataValues.oslSchedules = filterSchedules(
        item.dataValues.oslSchedules
      );
      item.dataValues.partsIssue = item.dataValues.partsIssue;
    }

    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('JobCard service listGatePassJobCards', err);
    next(err);
  }
};

const saveBillingDetails = async (reqData, user) => {
  let result = 'failed';
  try {
    let data = await JobCardDao.getJobCard(reqData.id);
    // console.log('schedules details--------', data.schedules);
    // console.log('partsIssue details--------', data.partsIssue);

    if (data && data.status === 3) {
      let TotalAmount = 0;
      let ltaxamt = 0;
      let lamt = 0;

      let isFOC = false;
      let focLaborAmt = 0;

      //labour scedule
      // for (const osl of data.schedules) {
      //   if ( osl.status === 2 ){
      //   const baseAmount = parseFloat((osl.quantity * osl.amount - osl.discount_percentage + osl.additionalMargin).toFixed(2));

      //   const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      //   const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      //   const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      //   if(osl.repairTypeName === "FOC"){
      //     isFOC = true;
      //   }

      //   const amount = parseFloat(
      //     (
      //       baseAmount +
      //       igstAmount +
      //       cgstAmount +
      //       sgstAmount
      //     ).toFixed(2)
      //   )

      //   TotalAmount += amount;
      //   ltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
      //   lamt += baseAmount;

      //   let breakLabor = false;
      //   for (const contract of data.vehicle?.vehicleContracts) {
      //     for (const contractScheme of contract?.vehicleContractSchemes) {
      //       if (osl.rot_id === contractScheme.labor_parts_id && osl.repairTypeId === contract.scheme.repair_type_id && contractScheme.item_type === 1) {
      //         if (contractScheme.balance_count > 0) {
      //           await JobCardDao.updateVehicleContractSchemeCount(contractScheme.id, contractScheme.balance_count - 1);
      //           breakLabor = true;
      //           break;
      //         }
      //       }
      //     }
      //     if (breakLabor) {
      //       break;
      //     }
      //   }
      //   }
      // };

      for (const osl of data.schedules) {
        if (osl.status === 2) {
          const baseAmount = parseFloat(
            (
              osl.quantity * osl.singleAmount -
              osl.discount_percentage +
              osl.additionalMargin
            ).toFixed(2)
          );

          const igstAmount = parseFloat(
            ((osl.igst / 100) * baseAmount).toFixed(2)
          );
          const cgstAmount = parseFloat(
            ((osl.cgst / 100) * baseAmount).toFixed(2)
          );
          const sgstAmount = parseFloat(
            ((osl.sgst / 100) * baseAmount).toFixed(2)
          );

          const amount = parseFloat(
            (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
          );
          // console.log('outside  labour foc',amount)

          if (osl.repairTypeName === 'FOC' || osl.repairTypeId == 2) {
            isFOC = true;
            focLaborAmt += amount;
            // console.log('inside labour foc',focLaborAmt)
          } else {
            TotalAmount += amount;
            ltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
            lamt += baseAmount;
          }

          // Always update contract scheme (for both normal & FOC)
          let breakLabor = false;
          for (const contract of data.vehicle?.vehicleContracts) {
            for (const contractScheme of contract?.vehicleContractSchemes) {
              if (
                osl.rot_id === contractScheme.labor_parts_id &&
                osl.repairTypeId === contract.scheme.repair_type_id &&
                contractScheme.item_type === 1
              ) {
                if (contractScheme.balance_count > 0) {
                  await JobCardDao.updateVehicleContractSchemeCount(
                    contractScheme.id,
                    contractScheme.balance_count - 1
                  );
                  breakLabor = true;
                  break;
                }
              }
            }
            if (breakLabor) break;
          }
        }
      }

      let oslamt = 0;
      let osltaxamt = 0;

      data.oslSchedules.forEach((osl) => {
        if (osl.status === 2) {
          let margin = osl.marginPercentage / 100;
          const baseAmount = parseFloat(
            (
              (osl.quantity * osl.amount - osl.discount_percentage) /
              (1 - margin) +
              osl.additionalMargin
            ).toFixed(2)
          );

          const igstAmount = parseFloat(
            ((osl.igst / 100) * baseAmount).toFixed(2)
          );
          const cgstAmount = parseFloat(
            ((osl.cgst / 100) * baseAmount).toFixed(2)
          );
          const sgstAmount = parseFloat(
            ((osl.sgst / 100) * baseAmount).toFixed(2)
          );

          const amount = parseFloat(
            (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
          );

          TotalAmount += amount;
          osltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
          oslamt += baseAmount;
        }
      });

      // let partsamt = 0;
      // let partstaxamt = 0;
      // data.partsIssue.forEach((osl) => {
      //   const baseAmount = parseFloat((osl.quantity * osl.rate).toFixed(2));

      //   const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      //   const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      //   const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      //   const amount = parseFloat(
      //     (
      //       baseAmount +
      //       igstAmount +
      //       cgstAmount +
      //       sgstAmount
      //     ).toFixed(2)
      //   )

      //   TotalAmount += amount;
      //   partstaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
      //   partsamt += baseAmount;

      // })

      let partsamt = 0;
      let partstaxamt = 0;
      let focPartsAmt = 0;

      data.partsIssue.forEach((osl) => {
        const baseAmount = parseFloat((osl.quantity * osl.rate).toFixed(2));

        const igstAmount = parseFloat(
          ((osl.igst / 100) * baseAmount).toFixed(2)
        );
        const cgstAmount = parseFloat(
          ((osl.cgst / 100) * baseAmount).toFixed(2)
        );
        const sgstAmount = parseFloat(
          ((osl.sgst / 100) * baseAmount).toFixed(2)
        );

        const amount = parseFloat(
          (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
        );
        // console.log('outside parts foc',amount)
        if (osl.repair_type === 2) {
          isFOC = true;
          focPartsAmt += amount;
          // console.log('inside parts foc',focPartsAmt)
        } else {
          TotalAmount += amount;
          partstaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
          partsamt += baseAmount;
        }
      });

      const billNumber = await generateBillNumber(
        reqData.billType,
        data.outlet_code
      );
      let insInvoiceNo = null;

      const isAJCJobCard = data.job_card_no?.startsWith('AJC');
      if (user.outlet.companyId == 3 && isAJCJobCard) {

        const paid_status = await TransactionDao.getTransaction(reqData.id);

        const paid_by_status = paid_status?.dataValues?.status_new;
        if (paid_by_status != 2) {
          insInvoiceNo = await generateBillNumber(
            'insurance',
            data.outlet_code
          );

          console.log('Generated insurance invoice number:', insInvoiceNo);
        }
      }
      let focPart = null;
      let focLabor = null;

      if (isFOC) {
        focLabor = await generateFOCLaborNum(data.outlet_code);
        focPart = await generateFOCPartNum(data.outlet_code);
      }
      let billData = {
        outletId: user.outlet.id,
        transactionId: data.id,
        jobCardNo: data.job_card_no,
        billNo: billNumber,
        insuranceBillNo: insInvoiceNo,
        TotalAmount: TotalAmount,
        partsamt: partsamt,
        partstaxamt: partstaxamt,
        ltaxamt: ltaxamt,
        lamt: lamt,
        oslamt: oslamt,
        osltaxamt: osltaxamt,
        billType: reqData.billType,
        focLabor: focLabor,
        focPart: focPart,
        focLaborAmt: focLaborAmt,
        focPartsAmt: focPartsAmt,
      };
      let update = await JobCardDao.updateBillings(billData, user);
      if (update) {
        let data = await JobCardDao.updateJobcardStatus(reqData, user);
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('JobCard service saveBillingDetails', err);
    // next(err);
  }
  return result;
};

const saveBillingDetailsFit = async (reqData, user) => {
  let result = { status: 'failed' };
  try {
    let data = await JobCardDao.getJobCard(reqData.id);
    if (data && data.status === 3) {
      let TotalAmount = 0;
      let ltaxamt = 0;
      let lamt = 0;

      let isFOC = false;
      let focLaborAmt = 0;

      //labour scedule
      // for (const osl of data.schedules) {
      //   if ( osl.status === 2 ){
      //   const baseAmount = parseFloat((osl.quantity * osl.amount - osl.discount_percentage + osl.additionalMargin).toFixed(2));

      //   const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      //   const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      //   const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      //   if(osl.repairTypeName === "FOC"){
      //     isFOC = true;
      //   }

      //   const amount = parseFloat(
      //     (
      //       baseAmount +
      //       igstAmount +
      //       cgstAmount +
      //       sgstAmount
      //     ).toFixed(2)
      //   )

      //   TotalAmount += amount;
      //   ltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
      //   lamt += baseAmount;

      //   let breakLabor = false;
      //   for (const contract of data.vehicle?.vehicleContracts) {
      //     for (const contractScheme of contract?.vehicleContractSchemes) {
      //       if (osl.rot_id === contractScheme.labor_parts_id && osl.repairTypeId === contract.scheme.repair_type_id && contractScheme.item_type === 1) {
      //         if (contractScheme.balance_count > 0) {
      //           await JobCardDao.updateVehicleContractSchemeCount(contractScheme.id, contractScheme.balance_count - 1);
      //           breakLabor = true;
      //           break;
      //         }
      //       }
      //     }
      //     if (breakLabor) {
      //       break;
      //     }
      //   }
      //   }
      // };

      for (const osl of data.schedules) {
        if (osl.status === 2) {
          const baseAmount = parseFloat(
            (
              osl.quantity * osl.singleAmount -
              osl.discount_percentage +
              osl.additionalMargin
            ).toFixed(2)
          );

          const igstAmount = parseFloat(
            ((osl.igst / 100) * baseAmount).toFixed(2)
          );
          const cgstAmount = parseFloat(
            ((osl.cgst / 100) * baseAmount).toFixed(2)
          );
          const sgstAmount = parseFloat(
            ((osl.sgst / 100) * baseAmount).toFixed(2)
          );

          const amount = parseFloat(
            (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
          );
          // console.log('outside  labour foc',amount)

          if (osl.repairTypeName === 'FOC' || osl.repairTypeId == 2) {
            isFOC = true;
            focLaborAmt += amount;
            // console.log('inside labour foc',focLaborAmt)
          } else {
            TotalAmount += amount;
            ltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
            lamt += baseAmount;
          }

          // Always update contract scheme (for both normal & FOC)
          let breakLabor = false;
          for (const contract of data.vehicle?.vehicleContracts) {
            for (const contractScheme of contract?.vehicleContractSchemes) {
              if (
                osl.rot_id === contractScheme.labor_parts_id &&
                osl.repairTypeId === contract.scheme.repair_type_id &&
                contractScheme.item_type === 1
              ) {
                if (contractScheme.balance_count > 0) {
                  await JobCardDao.updateVehicleContractSchemeCount(
                    contractScheme.id,
                    contractScheme.balance_count - 1
                  );
                  breakLabor = true;
                  break;
                }
              }
            }
            if (breakLabor) break;
          }
        }
      }

      let oslamt = 0;
      let osltaxamt = 0;

      data.oslSchedules.forEach((osl) => {
        if (osl.status === 2) {
          let margin = osl.marginPercentage / 100;
          const baseAmount = parseFloat(
            (
              (osl.quantity * osl.amount - osl.discount_percentage) /
              (1 - margin) +
              osl.additionalMargin
            ).toFixed(2)
          );

          const igstAmount = parseFloat(
            ((osl.igst / 100) * baseAmount).toFixed(2)
          );
          const cgstAmount = parseFloat(
            ((osl.cgst / 100) * baseAmount).toFixed(2)
          );
          const sgstAmount = parseFloat(
            ((osl.sgst / 100) * baseAmount).toFixed(2)
          );

          const amount = parseFloat(
            (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
          );

          TotalAmount += amount;
          osltaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
          oslamt += baseAmount;
        }
      });

      // let partsamt = 0;
      // let partstaxamt = 0;
      // data.partsIssue.forEach((osl) => {
      //   const baseAmount = parseFloat((osl.quantity * osl.rate).toFixed(2));

      //   const igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
      //   const cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
      //   const sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));

      //   const amount = parseFloat(
      //     (
      //       baseAmount +
      //       igstAmount +
      //       cgstAmount +
      //       sgstAmount
      //     ).toFixed(2)
      //   )

      //   TotalAmount += amount;
      //   partstaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
      //   partsamt += baseAmount;

      // })

      let partsamt = 0;
      let partstaxamt = 0;
      let focPartsAmt = 0;

      data.partsIssue.forEach((osl) => {
        const baseAmount = parseFloat((osl.quantity * osl.rate).toFixed(2));

        const igstAmount = parseFloat(
          ((osl.igst / 100) * baseAmount).toFixed(2)
        );
        const cgstAmount = parseFloat(
          ((osl.cgst / 100) * baseAmount).toFixed(2)
        );
        const sgstAmount = parseFloat(
          ((osl.sgst / 100) * baseAmount).toFixed(2)
        );

        const amount = parseFloat(
          (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
        );
        // console.log('outside parts foc',amount)
        if (osl.repair_type === 2) {
          isFOC = true;
          focPartsAmt += amount;
          // console.log('inside parts foc',focPartsAmt)
        } else {
          TotalAmount += amount;
          partstaxamt += igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
          partsamt += baseAmount;
        }
      });

      const billNumber = await generateBillNumber(
        reqData.billType,
        data.outlet_code
      );

      let focPart = null;
      let focLabor = null;

      if (isFOC) {
        focLabor = await generateFOCLaborNum(data.outlet_code);
        focPart = await generateFOCPartNum(data.outlet_code);
      }
      let billData = {
        outletId: user.outlet.id,
        transactionId: data.id,
        jobCardNo: data.job_card_no,
        billNo: billNumber,
        TotalAmount: TotalAmount,
        partsamt: partsamt,
        partstaxamt: partstaxamt,
        ltaxamt: ltaxamt,
        lamt: lamt,
        oslamt: oslamt,
        osltaxamt: osltaxamt,
        billType: reqData.billType,
        focLabor: focLabor,
        focPart: focPart,
        focLaborAmt: focLaborAmt,
        focPartsAmt: focPartsAmt,
      };
      let update = await JobCardDao.updateBillings(billData, user);
      if (update) {
        let data = await JobCardDao.updateJobcardStatusFit(reqData, user);
        result = { status: 'success', billNo: billNumber };
      }
    }
  } catch (err) {
    logger.error('JobCard service saveBillingDetails', err);
    // next(err);
  }
  return result;
};

const generateFOCLaborNum = async (outletCode) => {
  let seqNo = 1;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentBill = await JobCardDao.getRecentFOCLabourNumber(
    outletCode,
    currentYear
  );
  if (recentBill) {
    const lastNumber = recentBill.foc_labor_bill_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `SEREXPINV-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const generateFOCPartNum = async (outletCode) => {
  let seqNo = 1;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentBill = await JobCardDao.getRecentFOCPartNumber(
    outletCode,
    currentYear
  );
  if (recentBill) {
    const lastNumber = recentBill.foc_parts_bill_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `SPAEXPINV-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const generateOutPassNumber = async (documentType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentOutPass = await JobCardDao.getRecentGatePass(
    documentType,
    outletCode,
    currentYear
  );
  await delay(500);
  if (recentOutPass) {
    const lastNumber = await recentOutPass.delivery_number.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const generateBillNumber = async (documentType, outletCode) => {
  let billType = '';
  if (documentType == 'cash') {
    billType = 'CLS';
  } else if (documentType == 'credit') {
    billType = 'DLS';
  } else if (documentType == 'insurance') {
    billType = 'IS';
  }
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
 
  // check old dms seqence number generation logic and add delay to avoid sequence number duplication due to concurrent requests
  // const sequenceNum = await outletSequenceNums.findOne({
  //   where: {
  //     outlet_code: outletCode
  //   },
  // });

  // console.log('sequenceNum', sequenceNum);
  // return false;


  const currentYear = fyYear.toString().slice(-2);
  const recentOutPass = await JobCardDao.getRecentBillNumber(
    billType,
    outletCode,
    currentYear
  );
  console.log('recentOutPass', recentOutPass);
  if (recentOutPass) {
    const lastNumber = recentOutPass.bill_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(5, '0');

  console.log('Generated bill number:', `${billType}-${outletCode}${currentYear}-${formattedSequenceNumber}`);

  return `${billType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};
const validateBeforeGatePass = async (reqData, user) => {
  try {

    const jobcardData =
      await JobCardDao.getBillingSummaryForGatepass(
        reqData.id,
        user
      );
    if (!jobcardData) {
      return {
        success: false,
        message: "JC details not found"
      };
    }
    let totalAmount = 0;
    let cnTotalAmount = 0;
    let cnTotalAmountLB = 0;
    let receiptAmount = 0;
    let billAmount = 0;
    const schedules = jobcardData.schedules || [];
    let totalLaborAmount = 0;

    if (schedules.length !== 0) {

      let labourAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      for (const schedule of schedules) {

        if (Number(schedule.repairTypeId) === 6) {
          continue;
        }

        const amount = Number(schedule.amount || 0);
        const margin = Number(schedule.additionalMargin || 0);
        const discount = Number(schedule.discount_percentage || 0);
        const cgstPercent = Number(schedule.cgst || 0);
        const sgstPercent = Number(schedule.sgst || 0);
        const igstPercent = Number(schedule.igst || 0);
        const baseAmount = amount + margin;
        const discountAmount = (baseAmount * discount) / 100;
        const labAmtAfterDiscount = amount + margin - discountAmount;
        labourAmount += labAmtAfterDiscount;

        if (igstPercent) {
          igst += (igstPercent * labAmtAfterDiscount) / 100;
        } else {
          if (cgstPercent) {
            cgst += (cgstPercent * labAmtAfterDiscount) / 100;
          }
          if (sgstPercent) {
            sgst += (sgstPercent * labAmtAfterDiscount) / 100;
          }
        }
      }

      totalLaborAmount = labourAmount + cgst + sgst + igst;

    }

    const oslSchedules = jobcardData.oslSchedules || [];
    let totalOslLaborAmount = 0;

    if (oslSchedules.length !== 0) {

      let oslLabourAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      const isAJC = jobcardData.document_type === "AJC";

      for (const oslSchedule of oslSchedules) {
        const quantity = Number(oslSchedule.quantity || 0);
        const rate = Number(oslSchedule.singleAmount || 0);
        const discount = Number(oslSchedule.discount_percentage || 0);
        const supplierMarginPercent = Number(oslSchedule.marginPercentage || 0);
        const additionalMargin = Number(oslSchedule.additionalMargin || 0);
        const depreciationPercent = Number(oslSchedule.depreciation_per || 0);
        const cgstPercent = Number(oslSchedule.cgst || 0);
        const sgstPercent = Number(oslSchedule.sgst || 0);
        const igstPercent = Number(oslSchedule.igst || 0);
        const baseAmount = quantity * rate;
        const discountAmount = (baseAmount * discount) / 100;
        const amountAfterDiscount = baseAmount - discountAmount;
        let amountAfterMargin = 0;
        if (supplierMarginPercent > 0) {
          const dec = supplierMarginPercent / 100;
          amountAfterMargin = (amountAfterDiscount / (1 - dec)) + additionalMargin;
        } else {
          amountAfterMargin = amountAfterDiscount + additionalMargin;
        }
        let finalAmount = amountAfterMargin;
        if (isAJC) {
          const dep = depreciationPercent || 100;
          finalAmount = (amountAfterMargin / 100) * dep;
        }
        oslLabourAmount += finalAmount;
        if (igstPercent > 0) {
          igst += (igstPercent * finalAmount) / 100;
        } else {
          const finalCgst = cgstPercent || 9;
          const finalSgst = sgstPercent || 9;
          cgst += (finalCgst * finalAmount) / 100;
          sgst += (finalSgst * finalAmount) / 100;
        }

      }
      totalOslLaborAmount = oslLabourAmount + cgst + sgst + igst;
    }
    const partsIssues = jobcardData.partsIssue || [];
    let totalPartsAmount = 0;
    if (partsIssues.length !== 0) {
      let partsAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      for (const part of partsIssues) {
        if (Number(part.repair_type) === 2) {
          continue;
        }
        const quantity = Number(part.quantity || 0);
        const rate = Number(part.rate || 0);
        const discount = Number(part.discount || 0);
        const cgstPercent = Number(part.cgst || 0);
        const sgstPercent = Number(part.sgst || 0);
        const igstPercent = Number(part.igst || 0);
        const baseAmount = rate * quantity;
        const amountAfterDiscount = baseAmount - discount;
        partsAmount += amountAfterDiscount;
        if (igstPercent > 0) {
          igst += (igstPercent * amountAfterDiscount) / 100;
        } else {
          if (cgstPercent) {
            cgst += (cgstPercent * amountAfterDiscount) / 100;
          }
          if (sgstPercent) {
            sgst += (sgstPercent * amountAfterDiscount) / 100;
          }
        }
      }
      totalPartsAmount = partsAmount + cgst + sgst + igst;
    }
    totalAmount = totalLaborAmount + totalOslLaborAmount + totalPartsAmount;
    billAmount = Math.round(totalAmount);
    const creditNotes = jobcardData.creditNotes || [];

    for (const cn of creditNotes) {
      if (cn.purpose === "CreditNote") {
        cnTotalAmount += Number(cn.amount || 0);
      }
    }

    const lbsDebitNotes = jobcardData.lbsDebitNotes || [];
    for (const lbs of lbsDebitNotes) {
      if (lbs.status === 1) {
        cnTotalAmountLB += Number(lbs.amount || 0);
      }
    }

    const receipts = jobcardData.receipts || [];

    for (const receipt of receipts) {
      receiptAmount += Number(receipt.amount || 0);
    }

    const receiptCnAmount = cnTotalAmount + receiptAmount + cnTotalAmountLB;
    const billAmountAfterDeduction = billAmount - 1000;
    const customer = jobcardData.jcCustomerMapping || {};
    const companyId = user.outlet.companyId;
    const is_b2b = Number(customer.is_b2b || 0);
    const gatepassApprove = Number(jobcardData.gatepassApprove || 0);
    if (
      [2, 5, 8].includes(companyId) && is_b2b !== 1) {
      if (billAmount === receiptCnAmount) {
        return {
          success: true,
          message:
            "Full payment received"
        };
      }

      if (receiptCnAmount >= billAmountAfterDeduction) {
        return {
          success: true,
          message:
            "Minimum payment received"
        };
      }

      if (gatepassApprove === 1) {
        return {
          success: true,
          message:
            "Gatepass approved manually"
        };
      }

      return {
        success: false,
        status: "gatepassValidationFailed",
        message: "Kindly create Cash Receipt"
      };

    }

    return {
      success: true,
      message:
        "Gatepass allowed"
    };
  } catch (err) {
    logger.error("Gatepass validation failed", err);

    return {
      success: false,
      status: "gatepassValidationError",
      message: "Validation error occurred"
    };
  }
};

const getGatePassData = async (jobcardNo, otlet) => {
  const resultList = [];
  const resObj = {};
  const outlet = {};
  const customer = {};
  const document = {};
  const vehicle = {};
  try {
    const data = await JobCardDao.getGatePassData(jobcardNo);
    const dataArray = Array.isArray(data) ? data : [data];

    if (dataArray.length > 0) {
      outlet['code'] = data.jobcard.outlet.outletCode;
      (outlet['address'] = data.jobcard.outlet.address1),
        (outlet['city'] = data.jobcard.outlet.city),
        (outlet['state'] = data.jobcard.outlet.state),
        (outlet['pincode'] = data.jobcard.outlet.pincode),
        (outlet['phone'] = data.jobcard.outlet.phoneNumber);
      outlet['mobile'] = data.jobcard.outlet.phoneNumber;
      outlet['email'] = data.jobcard.outlet.email;
      outlet['gstin'] = data.jobcard.outlet.gstIn;
      outlet['outletName'] = data.jobcard.outlet.outletName;

      const firstElement = dataArray[0];

      customer['name'] = firstElement.jobcard.customer_name;
      customer['address'] = firstElement.jobcard.customer_address;
      const deliveryData = firstElement?.delivery_date
        ? moment(firstElement.delivery_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY')
        : '';
      document['name'] = firstElement.delivery_number;
      document['date'] = deliveryData;
      document['amount'] = firstElement.total_amount;
      document['no'] = firstElement.jobcard_no;
      document['type'] = 'Cash';
      document['serviceAdvisor'] = firstElement.created_by;

      const arrival = firstElement?.jobcard?.customer_arrived_date
        ? moment(firstElement.jobcard.customer_arrived_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY')
        : '';
      vehicle['model'] = firstElement.jobcard.vehicle.model.modelName;
      vehicle['regNo'] = firstElement.jobcard.reg_no;
      vehicle['checkInTime'] = arrival;
      vehicle['checkOutTime'] = deliveryData;
      vehicle['kmReading'] = firstElement.jobcard.odometer;
    }
    resObj['outlet'] = outlet;
    resObj['customer'] = customer;
    resObj['document'] = document;
    resObj['vehicle'] = vehicle;
    return resObj;
  } catch (err) {
    logger.error('JobCard service getGatePassData', err);
    next(err);
  }
};

const getAllJobCardsForOutlets = async (body, user) => {
  try {
    const { data, count } = await JobCardDao.getJobCardForOutlet(body, user);
    // console.log(data[0].enquiries, 'data');

    const formattedData = data.map((jobCard) => ({
      job_card_number: jobCard.job_card_no,
      vehicle_reg_no: jobCard.reg_no,
      vechicle_make: jobCard.vehicle?.make?.makeName, // Ensure vehicle and make are present
      vehicle_model: jobCard.vehicle?.model?.modelName, // Ensure vehicle and model are present
      status: jobCard.status_value,
      id: jobCard.id,
      customer_state: jobCard.customer_state,
      part_approve: jobCard.part_approve,
      customer_name: jobCard.customer_name,
      source: jobCard.sources?.sourceName,
      enquiry_no: jobCard?.enquiries?.enquiry_no || null,
      enquiry_id: jobCard?.enquiries?.id || null,
      chassisNumber: jobCard.vehicle?.chassisNumber || null,
      fuelType: jobCard.vehicle?.fuelType || null,
      engineNumber: jobCard.vehicle?.engineNumber
    }));
    return { formattedData, count };
  } catch (err) {
    logger.error(' Jobcard fetching error', err);
  }
};

const getJobCardDetails = async (body, user) => {
  try {
    const data = await JobCardDao.getJobCardDetails(body.id, user);
    const { customer_state } = body;
    // console.log(body, 'customerstate');
    const formattedData = [];
    for (const jobCard of data) {
      const resObj = {};
      resObj['Parts Code'] = jobCard['item_code'];
      resObj['item_id'] = jobCard['item_id'];
      resObj['Description'] = jobCard['item_name'];
      resObj['Hsn Code'] = jobCard['hsnCode']; // Ensure vehicle and make are present
      resObj['Requested Qty'] = jobCard['request_quantity']; // Ensure vehicle and model are present
      resObj['Rate'] = jobCard['rate'];
      resObj['Cost'] = jobCard['cost'];
      resObj['MRP'] = jobCard['mrp'];
      resObj['Available Stock Qty'] = jobCard['quantity']
        ? jobCard['quantity']
        : 0;
      resObj['indent_id'] = jobCard.id;
      resObj['enquiry_id'] = jobCard['enquiry_id'];

      if (customer_state.toLowerCase() === user.outlet.state.toLowerCase()) {
        resObj['SGST'] = jobCard.taxPercentage / 2;
        resObj['CGST'] = jobCard.taxPercentage / 2;
        resObj['IGST'] = 0;
      } else {
        resObj['SGST'] = 0;
        resObj['CGST'] = 0;
        resObj['IGST'] = jobCard.taxPercentage;
      }
      formattedData.push(resObj);
    }
    return formattedData;
  } catch (err) {
    logger.error(' Jobcard fetching error', err);
  }
};
const addInsuranceAddress = async (address, user) => {
  let result = '';
  let data = {};
  try {
    data = await JobCardDao.addInsuranceAddress(address, user.id);
    if (data) {
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('JobCard service addInsuranceAddress Error:', err);
    next(err);
  }
  return result;
};

const listInsuranceAddresses = async (reqData) => {
  try {
    const data = await JobCardDao.listInsuranceAddresses(reqData);
    return data;
  } catch (err) {
    logger.error('JobCard service listInsuranceAddresses', err);
    next(err);
  }
};

const addInsurance = async (insurance, user) => {
  let result = '';
  let data = {};
  try {
    if (insurance.status === 0) {
      data = await JobCardDao.addInsurance(insurance, user.id);
      // if (insurance.isNewAddres === 1) {
      //   await JobCardDao.addNewAddress(insurance, user.id);
      // }
      if (data) {
        //updated the paid_by_status as 0
        await JobCardDao.updatePaidStatus(insurance.transactionId, 0);
        result = 'success';
      }
    } else if (insurance.status === 1) {
      data = await JobCardDao.addDirectInsurance(insurance, user.id);
      await JobCardDao.updatePaidStatus(insurance.transactionId, 2);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('JobCard service addInsurance Error:', err);
    next(err);
  }
  return result;
};

const getInsurance = async (transactionId) => {
  try {
    // Try to fetch insurance details from the DAO
    const data = await JobCardDao.getInsurance(transactionId);

    if (data) {
      // Build the response object if data exists
      return {
        id: data.transaction_id,
        transaction_id: data.transaction_id,
        insurance_provider_id: data.insurance_provider_id,
        insurance_provider_name: data.insurance_provider_name,
        insurance_state: data.insurance_state,
        insurance_city: data.insurance_city,
        insurance_pincode: data.insurance_pincode,
        insurance_address: data.insurance_address,
        insurance_area_name: data.insurance_area_name,
        gstin_number: data.gstin_number,
        policy_no: data.policy_no,
        idvValue: data.idv_value,
        policy_exp_date: data.policy_exp_date,
        claim_no: data.claim_no,
        surveyor_name: data.surveyor_name,
        surveyor_mob: data.surveyor_mob,
        surveyor_email: data.surveyor_email,
        surveyor_intimate_date: data.surveyor_intimate_date,
        surveyor_proposed_date: data.surveyor_proposed_date,
        surveyor_visited_date: data.surveyor_visited_date,
        estimated_cost: data.estimated_cost,
        surveyor_approved_date: data.surveyor_approved_date,
        status: data.status,
        transaction_status: data.jobcard.status,
      };
    }

    // If no insurance data, fetch transaction details instead
    const transactionData = await JobCardDao.getTransaction(transactionId);
    return transactionData || {}; // Return the transaction data or an empty object if not found
  } catch (err) {
    // Log the error and pass it to the next middleware
    logger.error('JobCard service getInsurance', err);
    // Make sure next is defined if used
    return {}; // Return empty object in case of an error
  }
};

const updateJobCardInsurance = async (insurance, user) => {
  let result = '';
  let data = {};
  try {
    if (insurance.status === 0) {
      data = await JobCardDao.updateJobCardInsurance(insurance, user.id);
      if (data) {
        await JobCardDao.updatePaidStatus(insurance.transactionId, 0);
        result = 'success';
      }
    } else if (insurance.status === 1) {
      data = await JobCardDao.updateJobCardDirectInsurance(insurance, user.id);
      await JobCardDao.updatePaidStatus(insurance.transactionId, 2);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('JobCard service addInsurance Error:', err);
    next(err);
  }
  return result;
};

const getJobCardStatusReportData = async (reqData, user) => {
  try {
    const { totalItems, rows } = await JobCardDao.getJobCardStatusReportData(
      reqData,
      user
    );

    let dataWithCustomHeaders = rows.map((item, index) => {
      const workEndDate = item.work_end_date_time
        ? new Date(item.work_end_date_time)
        : null;
      const customerArrivedDate = item.customer_arrived_date
        ? new Date(item.customer_arrived_date)
        : null;

      let sdd = 'No';
      let sddTime = '';

      if (workEndDate && customerArrivedDate) {
        const isSameDay =
          workEndDate.getDate() === customerArrivedDate.getDate() &&
          workEndDate.getMonth() === customerArrivedDate.getMonth() &&
          workEndDate.getFullYear() === customerArrivedDate.getFullYear();
        if (isSameDay) {
          sdd = 'Yes';
        }

        const diffInMilliseconds = workEndDate - customerArrivedDate;
        const diffInHours = Math.abs(diffInMilliseconds / (1000 * 60 * 60));
        sddTime = diffInHours.toFixed(2);
      }
      const createdDate = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const workCompleteDate = item.work_end_date_time
        ? moment(item.work_end_date_time)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const billDate = item.billing?.createdAt
        ? moment(item.billing.createdAt)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const deliveryDate = item.billing?.delivery_date
        ? moment(item.billing.delivery_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const customerArrivalDate = item.customer_arrived_date
        ? moment(item.customer_arrived_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const survyDate = item.insurance?.surveyor_visited_date
        ? moment(item.insurance.surveyor_visited_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const insApprovDate = item.insurance?.surveyor_approved_date
        ? moment(item.insurance.surveyor_approved_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const approvalDates = [];

      const schedules = item.schedules || [];
      const oslSchedules = item.oslSchedules || [];
      const partsIndent = item.partsIndent || [];

      schedules.forEach((s) => {
        if (s.approveDatetime) {
          approvalDates.push(new Date(s.approveDatetime));
        }
      });

      oslSchedules.forEach((s) => {
        if (s.approveDatetime) {
          approvalDates.push(new Date(s.approveDatetime));
        }
      });

      partsIndent.forEach((p) => {
        if (p.approveDatetime) {
          approvalDates.push(new Date(p.approveDatetime));
        }
      });
      let firstApproval = '';
      let lastApproval = '';

      if (approvalDates.length > 0) {
        approvalDates.sort((a, b) => a - b);

        firstApproval = moment(approvalDates[0])
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss');

        lastApproval = moment(approvalDates[approvalDates.length - 1])
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss');
      }
      return {
        autoId: index + 1,
        outlet_code: item.outlet_code,
        document_type: item.document_type,
        job_card_no: item.job_card_no,
        created_date: createdDate,
        status_value: item.status_value,
        customer_code: item.customer_code,
        customer_name: item.customer_name,
        customer_mobileNumber: item.customer_mobileNumber,
        email: item?.customer_email ?? '',
        customer_type: item.customer_type,
        customer_gstin: item.customer_gstin,
        reg_no: item.reg_no,
        make: item.vehicle.make.makeName,
        model: item.vehicle.model.modelName,
        odometer: item.odometer,
        engineNo: item.vehicle.engineNumber,
        chassisNo: item.vehicle.chassisNumber,
        serviceType: item.servicetype.serviceTypeName,
        repairType: item.repairtype.repairTypeName,
        source: item.sources.sourceName,
        sourceType: item.sourcetype.sourceTypeName,
        expectedCompletionTime: workCompleteDate,
        invoiceDate: billDate,
        deliveryDate: deliveryDate,
        sdd: sdd,
        sddTime: sddTime,
        spareAmount: item?.billing?.parts_amount,
        labourAmount: item?.billing?.labor_amount,
        Insurancecompany: item.insurance?.insurance_provider_name || '',
        InsuranceCompanyGSTIN: item.insurance?.gstin_number || '',
        InsuranceClaimNo: item.insurance?.claim_no || '',
        InsuranceEstCost: item.insurance?.estimated_cost || 0,
        CustomerArrivalDate: customerArrivalDate,
        ServiceAdvisor: item.user.employee.employeeName,
        DSACode: item.dsaagent?.dsaCode || '',
        DSAName: item.dsaagent?.dsaName || '',
        DSAContactDetails: item.dsaagent?.mobileNumber || '',
        DSACouponCode: '',
        Substatus: item.sub_status,
        SubStatusReason: item.sub_status_reason,
        SurveyorDate: survyDate,
        InsApprovalDate: insApprovDate,
        NoOfHours: sddTime,
        firstApprovalDate: firstApproval,
        lastApprovalDate: lastApproval,
      };
    });

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    }

    if (dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    }

    return { totalItems: count, data: dataWithCustomHeaders };
  } catch (err) {
    logger.error('JobCard service getJobCardStatusReportData', err);
    next(err);
  }
};

// Gate IN - Gate OUT report. Maps each job-card row to the 36 legacy columns
// (A-AJ). Columns with no DMS_PV source yet (L, M, N, Y, AA, AD, AE, AF, AG)
// are intentionally left blank. Used by both the grid (sliced) and the Excel
// export (full) endpoints, mirroring getJobCardStatusReportData.
const getGateInGateOutReportData = async (reqData, user) => {
  try {
    const { totalItems, rows } = await JobCardDao.getGateInGateOutReportData(
      reqData,
      user
    );

    const fmt = (d) =>
      d ? moment(d).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : '';

    const bookingStatusLabel = (status) => {
      switch (String(status)) {
        case '1':
          return 'Open';
        case '2':
          return 'In Progress';
        case '3':
          return 'Completed';
        case '4':
          return 'Cancelled';
        default:
          return status || '';
      }
    };

    const jobCardStatusLabel = (status) => {
      switch (Number(status)) {
        case 1:
          return 'Open';
        case 2:
          return 'In Progress';
        case 3:
          return 'RFB';
        case 4:
          return 'Billed';
        case 5:
          return 'Delivered';
        case 6:
          return 'Cancelled';
        default:
          return '';
      }
    };

    let dataWithCustomHeaders = rows.map((item, index) => {
      const est = item.serviceEstimate || {};
      // Booking is the report's anchor now (service_bookings), so it sits at the
      // top level of each row rather than nested under the estimate.
      const booking = item.serviceBooking || {};
      const schedules = item.schedules || [];
      const oslSchedules = item.oslSchedules || [];
      const partsIndent = item.partsIndent || [];
      const partsIssue = item.partsIssue || [];

      // U: first estimate submitted = earliest line-item creation across
      // schedules / osl schedules / parts indents.
      const submittedDates = [
        ...schedules.map((s) => s.createdAt),
        ...oslSchedules.map((s) => s.createdAt),
        ...partsIndent.map((p) => p.createdAt),
      ]
        .filter(Boolean)
        .map((d) => new Date(d))
        .sort((a, b) => a - b);

      // V: last estimate approved = latest approveDatetime across the three.
      const approvedDates = [
        ...schedules.map((s) => s.approveDatetime),
        ...oslSchedules.map((s) => s.approveDatetime),
        ...partsIndent.map((p) => p.approveDatetime),
      ]
        .filter(Boolean)
        .map((d) => new Date(d))
        .sort((a, b) => a - b);

      // W: first parts indent requested. X: last parts issued.
      const indentDates = partsIndent
        .map((p) => p.createdAt)
        .filter(Boolean)
        .map((d) => new Date(d))
        .sort((a, b) => a - b);
      const issueDates = partsIssue
        .map((p) => p.createdAt)
        .filter(Boolean)
        .map((d) => new Date(d))
        .sort((a, b) => a - b);

      const jobCardStatus = jobCardStatusLabel(item.status);
      // Legacy clears the sub status once a job card is billed/delivered/cancelled.
      const subStatus = [4, 5, 6].includes(Number(item.status))
        ? ''
        : item.sub_status || '';

      const serviceAdvisor = item.user?.employee?.employeeName || '';

      return {
        autoId: index + 1,                                        // A
        outlet_code: item.outlet_code || '',                      // B
        city: item.outlet?.city || '',                            // C
        reg_no: item.reg_no || '',                                // D
        make: item.vehicle?.make?.makeName || '',                 // E
        model: item.vehicle?.model?.modelName || '',              // F
        booking_no: booking.serviceBookingNumber || '',           // G
        booking_date: fmt(booking.createdAt),                     // H
        booking_status: bookingStatusLabel(booking.status),       // I
        pickup_driver: item._pickupDriverName || '',              // J
        pickup_assigned_date: fmt(booking.pickup_date),           // K
        driver_picked_accepted: fmt(booking.fit_driver_pickup_start_date),     // L
        customer_pickup_date: fmt(booking.fit_driver_pickup_date),             // M
        gate_in_date: fmt(est.gatein_date_time),                  // N
        service_estimate_no: est.serviceEstimateNumber || '',     // O
        service_estimate_date: fmt(est.createdAt),                // P
        job_card_no: item.job_card_no || '',                      // Q
        job_card_date: fmt(item.createdAt),                       // R
        job_card_status: jobCardStatus,                           // S
        jobcard_sub_status: subStatus,                            // T
        first_estimate_submitted: fmt(submittedDates[0]),         // U
        last_estimate_approved: fmt(approvedDates[approvedDates.length - 1]), // V
        first_parts_indent_requested: fmt(indentDates[0]),        // W
        last_parts_indent_issued: fmt(issueDates[issueDates.length - 1]),     // X
        ready_for_billing: '',                                    // Y (no source)
        invoice_date: fmt(item.billing?.createdAt),               // Z
        gate_out_date: '',                                        // AA (no source)
        dropoff_driver: item._dropoffDriverName || '',            // AB
        dropoff_requested_date: fmt(booking.drop_off_date),       // AC
        dropoff_accepted_date: fmt(booking.fit_driver_pcikup_outlet_date),     // AD
        driver_dropoff_customer_date: fmt(booking.fit_driver_dropoff_cus_date), // AE
        inspection_startdate: '',                                 // AF (no source)
        inspection_enddate: '',                                   // AG (no source)
        service_advisor: serviceAdvisor,                          // AH
        delivery_date: fmt(item.billing?.delivery_date),          // AI
        casual_gatepass_date: fmt(item._casualDate),              // AJ
      };
    });

    const count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    }
    if (reqData.limit && dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    }

    return { totalItems: count, data: dataWithCustomHeaders };
  } catch (err) {
    logger.error('JobCard service getGateInGateOutReportData', err);
    throw err;
  }
};

const getWipStatusReportData = async (reqData, user, type) => {
  try {
    const data = await JobCardDao.getWipStatusReportData(reqData, user, type);
    let tableData = data.rows.map((item, index) => {
      // Convert dates to Date objects
      const workEndDate = item.work_end_date_time
        ? new Date(item.work_end_date_time)
        : null;
      const customerArrivedDate = item.customer_arrived_date
        ? new Date(item.customer_arrived_date)
        : null;

      let sddTime = '';
      let noOfDays = '';

      if (workEndDate && customerArrivedDate) {
        // Calculate the difference in hours
        const diffInMilliseconds = Math.abs(workEndDate - customerArrivedDate);
        const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60)); // Convert ms to hours
        const diffInDays = Math.floor(
          diffInMilliseconds / (1000 * 60 * 60 * 24)
        );
        noOfDays = diffInDays.toString();
        sddTime = diffInHours.toString();
      }
      const createdDate = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const customerArriveDate = moment(item.customer_arrived_date)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const workEnd_Date = item.work_end_date_time
        ? moment(item.work_end_date_time)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const billDate = item.billing?.createdAt
        ? moment(item.billing.createdAt)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const DeliveryDate = item?.billing?.delivery_date
        ? moment(item.billing.delivery_date)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const calcLabour = commonLogic.calcSchedules(
        item.schedules,
        item.document_type
      );
      const calcOslLabour = commonLogic.calcOslSchedules(
        item.oslSchedules,
        item.document_type
      );
      const lab_estimate_cost =
        parseFloat(calcLabour?.labBeforeTaxAmt || 0) +
        parseFloat(calcOslLabour?.labBeforeTaxAmt || 0);
      const calcPartsIssue = commonLogic.calcPartsIssue(item.partsIssue) || {};
      const totalPartsIssued = parseFloat(calcPartsIssue?.totalPartsRate || 0);
      const totalPaidAmount = parseFloat(lab_estimate_cost + totalPartsIssued);
      return {
        autoId: index + 1,
        outlet_code: item.outlet_code,
        document_type: item.document_type,
        job_card_no: item.job_card_no,
        created_date: createdDate,
        customer_arrived_date: customerArriveDate,
        no_of_days: noOfDays,
        makeName: item.vehicle.make.makeName,
        modelName: item.vehicle.model.modelName,
        odometer: item.odometer,
        reg_no: item.reg_no,
        chassisNumber: item.vehicle.chassisNumber,
        engineNumber: item.vehicle.engineNumber,
        status: item.status,
        status_value: item?.status_value,
        customer_code: item.customer_code,
        customer_name: item.customer_name,
        customer_mobileNumber: item.customer_mobileNumber,
        service_engg: item.service_engineer_remarks,
        work_end_date_time: workEnd_Date,
        estimate_cost: item?.insurance?.estimated_cost || '',
        lab_estimate_cost: lab_estimate_cost || 0,
        emailId: item.customer_email,
        billed_date: billDate,
        delivery_date: DeliveryDate,
        source: item.sources.sourceName,
        source_type: item.sourcetype.sourceTypeName,
        sub_status: item.sub_status,
        sub_status_reason: item.sub_status_reason,
        surveyor_name: item?.insurance?.surveyor_name || '',
        surveyor_mobile: item?.insurance?.surveyor_mob || '',
        city: item?.outlet?.city,
        state: item?.outlet?.state,
        repair_type: item.repairtype?.repairTypeName || '',
        no_of_hours: sddTime,
        paidIssuedAmount: totalPartsIssued,
        totalPaidAmount: totalPaidAmount,
      };
    });

    let count = tableData.length;

    if (reqData.offset && reqData.offset > 0) {
      tableData = tableData.slice(reqData.offset);
    }

    if (tableData.length > reqData.limit) {
      tableData = tableData.slice(0, reqData.limit);
    }

    return {
      totalItems: count,
      data: tableData,
    };
  } catch (err) {
    logger.error('JobCard service getWipStatusReportData', err);
    next(err);
  }
};

const getBillReportData = async (reqData, user, type) => {
  let finalArray = [];
  try {
    const data = await JobCardDao.getBillReportData(reqData, user, type);
    const tableData = data.rows.map((item, index) => {
      // for (const item of data.rows){
      let item_amt = item.parts_amount;
      let labour_amt = item.labor_amount + item.osl_labor_amount;
      let labour_osl_amt_notax = item.labor_amount + item.osl_labor_amount;
      let invoice_amt_notax = labour_osl_amt_notax + item.parts_amount;
      const createDated = moment(item.jobcard.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const billDated = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const estimate = item.jobcard?.serviceEstimate;
      const booking = estimate?.serviceBooking;
      const receipts = item.jobcard?.receipts || [];

      const receiptNumbers = receipts
        .map((r) => r.doc_no)
        .filter(Boolean)
        .join(',');
      let l_rate = 0;
      let resObj = {
        autoId: index + 1,
        job_card_no: item.jobcard_no,
        outlet_code: item.jobcard.outlet_code,
        makeName: item.jobcard.vehicle.make.makeName,
        modelName: item.jobcard.vehicle.model.modelName,
        created_date: createDated,
        customer_code: item.jobcard.customer_code,
        customer_name: item.jobcard.customer_name,
        customer_mobileNumber: item.jobcard.customer_mobileNumber,
        customer_type: item.jobcard.customer_type,
        odometer: item.jobcard.odometer,
        reg_no: item.jobcard.reg_no,
        chassisNumber: item.jobcard.vehicle.chassisNumber,
        engineNumber: item.jobcard.vehicle.engineNumber,
        repair_type: item.jobcard.repairtype.repairTypeName,
        service_advisor: item.jobcard?.user?.employee?.employeeName,
        source: item.jobcard.sources.sourceName,
        source_type: item.jobcard.sourcetype.sourceTypeName,
        labour_invoice_no: '',
        parts_invoice_no: '',
        invoice_no: item.bill_no,
        invoice_date: billDated,
        item_amt: item_amt,
        labour_amt: labour_amt,
        labour_osl_amt_notax: labour_osl_amt_notax,
        spare_amt_notax: item.parts_amount,
        invoice_amt_notax: invoice_amt_notax,
        discount: '',
        // invoice_amt: item.total_amount,
        bill_type: item.bill_type,
        insurance_name: item.jobcard.insurance?.insurance_provider_name || '',
        insurance_gstin: item.jobcard.insurance?.gstin_number || '',
        insurance_code: '',
        insurance_claim_no: item.jobcard.insurance?.claim_no || '',
        customer_gstin: item.jobcard.customer_gstin,
        document_type: item.jobcard.document_type,
        dsa_coupon_code: '',
        customer_voice: item.jobcard.customer_voice,
        service_engineer_remarks: item.jobcard.service_engineer_remarks,
        service_advice: item.jobcard.service_advice,
        policy_no: item.jobcard.insurance?.policy_no || '',
        labourInvoiceNo: item.bill_no,
        partsInvoiceNo: item.bill_no,
        gobumprPaymentId: booking?.payment_id || '',
        gobumprTxnId: booking?.txnid || '',
        gobumprAdvanceAmount: booking?.advance_amount || '',
        gobumprPaymentResponse: booking?.payment_response || '',
        gobumprPaymentDate: booking?.payment_date || '',
        gobumprPaymentRemarks: booking?.payment_remarks || '',
        gobumprBookingId: booking?.bookingId || '',
        gobumprB2bBookingId: booking?.b2bBookingId || '',
        receiptNumber: receiptNumbers,
      };

      let cgstAmount = 0;
      let igstAmount = 0;
      let sgstAmount = 0;
      let calcLabour = commonLogic.calcSchedules(item.jobcard.schedules, "RJC");
      // console.log(calcLabour, 'calcLabour');

      for (const labor of calcLabour?.labour) {
        cgstAmount += parseFloat(labor.cgstamt);
        sgstAmount += parseFloat(labor.sgstamt);
        igstAmount += parseFloat(labor.igstamt);
      }
      let calcOslLabour = commonLogic.calcOslSchedules(
        item.jobcard.oslSchedules,
        "RJC"
      );
      for (const labor of calcOslLabour?.labour) {
        cgstAmount += parseFloat(labor.cgstamt);
        sgstAmount += parseFloat(labor.sgstamt);
        igstAmount += parseFloat(labor.igstamt);
      }
      l_rate =
        parseFloat(calcLabour.labBeforeTaxAmt) +
        parseFloat(calcOslLabour.labBeforeTaxAmt);

      let calcPartsIssue = commonLogic.calcPartsIssue(
        item?.jobcard?.partsIssue
      );
      let p_rate = parseFloat(calcPartsIssue.totalPartsRate);
      let cgstAmountp = parseFloat(calcPartsIssue.totalPartsCGst);
      let sgstAmountp = parseFloat(calcPartsIssue.totalPartsSGst);
      let igstAmountp = parseFloat(calcPartsIssue.totalPartsIGst);
      let totalWithoutTax = l_rate + p_rate;
      const finalObj = {
        ...resObj,
        cgst: cgstAmount,
        sgst: sgstAmount,
        igst: igstAmount,
        p_cgst: cgstAmountp,
        p_sgst: sgstAmountp,
        p_igst: igstAmountp,
        totalcgst: cgstAmount + cgstAmountp,
        totalsgst: sgstAmount + sgstAmountp,
        totaligst: igstAmount + igstAmountp,
        l_rate: l_rate.toFixed(2),
        p_rate: p_rate.toFixed(2),
        invoice_amt:
          totalWithoutTax +
          cgstAmount +
          sgstAmount +
          igstAmount +
          cgstAmountp +
          sgstAmountp +
          igstAmountp,
      };
      finalArray.push(finalObj);
    });
    // };

    let count = finalArray.length;

    if (reqData.offset && reqData.offset > 0) {
      finalArray = finalArray.slice(reqData.offset);
    }

    if (finalArray.length > reqData.limit) {
      finalArray = finalArray.slice(0, reqData.limit);
    }

    return {
      totalItems: count,
      data: finalArray,
    };
  } catch (err) {
    logger.error('JobCard service getBillReportData', err);
    next(err);
  }
};

// JC Bill Summary Split-Up: reproduces the legacy jc_bill_summarys_split_up Excel
// columns from the new-DMS schema. Reuses commonLogic.calc* for amount/GST totals
// and buckets each line's tax into @5/@18/@28 by its (cgst+sgst+igst) rate.
const getBillSummarySplitUpData = async (reqData, user, type) => {
  let finalArray = [];
  try {
    const data = await JobCardDao.getBillSummarySplitUpData(reqData, user, type);

    // Bucket a calc* line array's tax amounts by GST rate (5 / 18 / 28).
    const splitByRate = (lines) => {
      const b = { 5: 0, 18: 0, 28: 0 };
      for (const ln of (lines || [])) {
        const rate = Math.round((Number(ln.cgst) || 0) + (Number(ln.sgst) || 0) + (Number(ln.igst) || 0));
        const tax = (Number(ln.cgstamt) || 0) + (Number(ln.sgstamt) || 0) + (Number(ln.igstamt) || 0);
        if (b[rate] !== undefined) b[rate] += tax;
      }
      return b;
    };

    for (let index = 0; index < (data?.rows || []).length; index++) {
      const item = data.rows[index];
      const jc = item.jobcard || {};

      const calcLabour = commonLogic.calcSchedules(jc.schedules, 'RJC');
      const calcOsl = commonLogic.calcOslSchedules(jc.oslSchedules, 'RJC');
      const calcParts = commonLogic.calcPartsIssue(jc.partsIssue) || {};

      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      for (const l of (calcLabour?.labour || [])) {
        cgstAmount += Number(l.cgstamt) || 0; sgstAmount += Number(l.sgstamt) || 0; igstAmount += Number(l.igstamt) || 0;
      }
      for (const l of (calcOsl?.labour || [])) {
        cgstAmount += Number(l.cgstamt) || 0; sgstAmount += Number(l.sgstamt) || 0; igstAmount += Number(l.igstamt) || 0;
      }
      const p_cgst = Number(calcParts.totalPartsCGst) || 0;
      const p_sgst = Number(calcParts.totalPartsSGst) || 0;
      const p_igst = Number(calcParts.totalPartsIGst) || 0;

      const l_rate = (Number(calcLabour?.labBeforeTaxAmt) || 0) + (Number(calcOsl?.labBeforeTaxAmt) || 0);
      const p_rate = Number(calcParts.totalPartsRate) || 0;
      const totalWithoutTax = l_rate + p_rate;
      const invoiceAmount = totalWithoutTax + cgstAmount + sgstAmount + igstAmount + p_cgst + p_sgst + p_igst;

      const labSplit = splitByRate(calcLabour?.labour);
      const oslSplit = splitByRate(calcOsl?.labour);
      const partSplit = splitByRate(calcParts?.parts);

      const discount = (Number(calcLabour?.totalLaborDiscount) || 0) + (Number(calcOsl?.totalLaborDiscount) || 0);

      // Receipts (normal vs LBS where receipt_type === 5).
      const receipts = jc.receipts || [];
      const normalReceipts = receipts.filter((r) => Number(r.receipt_type) !== 5);
      const lbsReceipts = receipts.filter((r) => Number(r.receipt_type) === 5);
      const receiptAmount = normalReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const lbsReceiptAmount = lbsReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const pendingAmount = invoiceAmount - receiptAmount;

      let paidStatus = '';
      if (invoiceAmount === 0 || receiptAmount === 0) paidStatus = 'Not Paid';
      else if (Math.round(receiptAmount) === Math.round(invoiceAmount)) paidStatus = jc.status === 6 ? 'Not Paid' : 'Fully Paid';
      else if (receiptAmount < invoiceAmount) paidStatus = 'Partially Paid';
      else paidStatus = 'Excessly Paid';

      // OTD: promised (work_end_date_time) vs billed date.
      let otdStatus = '', promisedDeliveryDate = '', promisedDeliveryTime = '';
      if (jc.work_end_date_time) {
        promisedDeliveryDate = moment(jc.work_end_date_time).tz('Asia/Kolkata').format('YYYY-MM-DD');
        promisedDeliveryTime = moment(jc.work_end_date_time).tz('Asia/Kolkata').format('h:mmA');
        const billDate = moment(item.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD');
        otdStatus = promisedDeliveryDate === billDate ? 'YES' : 'NO';
      }

      // Payment Process — legacy logic: only for AJC, mapped from transaction.payment_process
      // (1=Cash, 2=Cashless process, 3=Cash Reimbursement); blank for non-AJC.
      let paymentProcess = '';
      if (jc.document_type === 'AJC') {
        const pp = Number(jc.payment_process);
        if (pp === 1) paymentProcess = 'Cash';
        else if (pp === 2) paymentProcess = 'Cashless process';
        else if (pp === 3) paymentProcess = 'Cash Reimbursement';
      } else {
        paymentProcess = '';
      }

      finalArray.push({
        jobCardNo: item.jobcard_no,
        branch: jc.outlet_code,
        make: jc.vehicle?.make?.makeName || '',
        model: jc.vehicle?.model?.modelName || '',
        jobCardDate: jc.createdAt ? moment(jc.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : '',
        customerCode: jc.customer_code,
        customerName: jc.customer_name,
        mobile: jc.customer_mobileNumber,
        customerType: jc.customer_type,
        kmReading: jc.odometer,
        regNo: jc.reg_no,
        chassisNo: jc.vehicle?.chassisNumber || '',
        engineNo: jc.vehicle?.engineNumber || '',
        repairType: jc.repairtype?.repairTypeName || '',
        serviceAdvisor: jc.user?.employee?.employeeName || '',
        source: jc.sources?.sourceName || '',
        sourceType: jc.sourcetype?.sourceTypeName || '',
        activityName: '',
        labourInvoiceNo: item.foc_labor_bill_no || '',
        partsInvoiceNo: item.foc_parts_bill_no || '',
        invoiceNo: item.bill_no,
        invoiceDate: item.createdAt ? moment(item.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss') : '',
        focItemAmount: item.foc_parts_amount || 0,
        focLabourAmount: item.foc_labor_amount || 0,
        itemAmount: item.parts_amount,
        labourAmount: (item.labor_amount || 0) + (item.osl_labor_amount || 0),
        labourOslWithoutTax: Number(l_rate.toFixed(2)),
        sparesWithoutTax: Number(p_rate.toFixed(2)),
        invoiceWithoutTax: Number(totalWithoutTax.toFixed(2)),
        cashDiscount: Number(discount.toFixed(2)),
        cgst: Number((cgstAmount + p_cgst).toFixed(2)),
        sgst: Number((sgstAmount + p_sgst).toFixed(2)),
        igst: Number((igstAmount + p_igst).toFixed(2)),
        invoiceAmount: Number(invoiceAmount.toFixed(2)),
        billType: item.bill_type,
        insCompanyName: jc.insurance?.insurance_provider_name || '',
        insCompanyGstin: jc.insurance?.gstin_number || '',
        insCompanyCode: '',
        insClaimNo: '',
        reasonForCredit: '',
        membershipNo: '',
        membershipExpDate: '',
        customerLiability: '',
        insuranceLiability: '',
        customerGstin: jc.customer_gstin || '',
        jiraTicketId: '',
        documentType: jc.document_type,
        dsaCouponCode: '',
        laborKfc: 0,
        partsKfc: 0,
        totalKfc: Number(item.cess) || 0,
        receiptNumber: normalReceipts.map((r) => r.doc_no).filter(Boolean).join(','),
        receiptAmount: Number(receiptAmount.toFixed(2)),
        pendingAmount: Number(pendingAmount.toFixed(2)),
        paidStatus,
        labourCgst: Number(cgstAmount.toFixed(2)),
        labourSgst: Number(sgstAmount.toFixed(2)),
        labourIgst: Number(igstAmount.toFixed(2)),
        partsCgst: Number(p_cgst.toFixed(2)),
        partsSgst: Number(p_sgst.toFixed(2)),
        partsIgst: Number(p_igst.toFixed(2)),
        outletCity: jc.outlet?.city || '',
        outletState: jc.outlet?.state || '',
        type: jc.customer_type || '',
        jobCardStatus: jc.status === 6 ? 'Billed and Invoice cancelled' : 'Billed',
        paymentProcess,
        promisedDeliveryDate,
        promisedDeliveryTime,
        otdStatus,
        otdFailureReason: jc.otd_reason || '',
        lbsReceiptNumber: lbsReceipts.map((r) => r.doc_no).filter(Boolean).join(','),
        lbsReceiptAmount: Number(lbsReceiptAmount.toFixed(2)),
        labour5: Number(labSplit[5].toFixed(2)),
        labour18: Number((labSplit[18] + oslSplit[18]).toFixed(2)),
        labour28: Number(labSplit[28].toFixed(2)),
        parts5: Number(partSplit[5].toFixed(2)),
        parts18: Number(partSplit[18].toFixed(2)),
        parts28: Number(partSplit[28].toFixed(2)),
      });
    }

    const count = finalArray.length;
    // Grid pagination (type 2). type 1 (export) returns everything.
    if (type === 2) {
      const offset = Number(reqData.offset) || 0;
      const limit = Number(reqData.limit) || count;
      finalArray = finalArray.slice(offset, offset + limit);
    }

    return { totalItems: count, data: finalArray };
  } catch (err) {
    logger.error('JobCard service getBillSummarySplitUpData', err);
    throw err;
  }
};

const getJobCardDeliveryReportData = async (reqData, user) => {
  const resultList = [];
  let finalArray = [];
  let newIndex = 1;
  try {
    const data = await JobCardDao.getJobCardDeliveryReportData(reqData, user);

    // for (const element of data) {
    const dataWithCustomHeaders = data.map((element, index) => {
      const estimate = element.jobcard?.serviceEstimate;
      const booking = estimate?.serviceBooking;
      const resObj = {};

      resObj['autoId'] = newIndex++;
      resObj['outlet_code'] = element.jobcard.outlet_code;
      resObj['bill_date'] = element.createdAt;
      resObj['bill_no'] = element.bill_no;
      resObj['focLabourinvoiceNumber'] = element.foc_labor_bill_no || '';
      resObj['focSpareNumber'] = element.foc_parts_bill_no || '';
      resObj['focLabourAmount'] = parseFloat(
        element.foc_labor_amount || 0
      ).toFixed(2);
      resObj['focSpareAmount'] = parseFloat(
        element.foc_parts_amount || 0
      ).toFixed(2);
      resObj['deliveryDate'] = element.delivery_date || '';
      resObj['jobcard_date'] = element.jobcard.createdAt;
      resObj['job_card_no'] = element.jobcard.job_card_no;
      resObj['customer_code'] = element.jobcard.customer_code;
      resObj['customer_name'] = element.jobcard.customer_name;
      resObj['customer_gstin'] = element.jobcard.customer_gstin;
      resObj['reg_no'] = element.jobcard.reg_no;
      resObj['labor_amount'] = element.labor_amount;
      resObj['sourceName'] = element.jobcard.sources.sourceName;
      resObj['sourceTypeName'] = element.jobcard.sourcetype.sourceTypeName;
      resObj['delivery_number'] = element.delivery_number;
      resObj['parts_amount'] = element.parts_amount;
      resObj['labor_taxamount'] = element.labor_taxamount;
      resObj['osl_labor_amount'] = element.osl_labor_amount;
      resObj['osllabor_taxamount'] = element.osllabor_taxamount;
      resObj['parts_taxamount'] = element.parts_taxamount;
      // resObj['total_amount_tax'] = element.total_amount;
      resObj['delivery_date'] = element.delivery_date;
      resObj['customer_mobileNumber'] = element.jobcard.customer_mobileNumber;
      resObj['customer_type'] = element.jobcard.customer_type;
      resObj['sourceName'] = element.jobcard.sources.sourceName;
      resObj['sourceTypeName'] = element.jobcard.sourcetype.sourceTypeName;
      resObj['emp_name'] = element.jobcard?.user?.employee?.employeeName;
      resObj['pickupDriverName'] = estimate?.driverName || '';
      resObj['pickupDriverMobile'] = estimate?.driverMobileNumber || '';
      resObj['pickupAddress'] = booking?.pick_up_address || '';
      resObj['pickupDate'] = booking?.pickup_date || '';
      resObj['dropOffDate'] = booking?.drop_off_date || '';
      resObj['expectedCompletionTime'] =
        element.jobcard?.work_end_date_time || '';

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let l_rate = 0;
      let discount_percentage_l = 0;
      // console.log(element?.jobcard?.schedules, 'element?.jobcard?.schedules');
      const laborArray = commonLogic.calcSchedules(
        element?.jobcard?.schedules,
        'RJC'
      );

      cgstAmount += parseFloat(laborArray.totalLaborCGst);
      sgstAmount += parseFloat(laborArray.totalLaborSGst);
      igstAmount += parseFloat(laborArray.totalLaborIGst);
      l_rate += parseFloat(laborArray.labBeforeTaxAmt);
      discount_percentage_l += parseFloat(laborArray.totalLaborDiscount);

      const oslLaborArray = commonLogic.calcOslSchedules(
        element?.jobcard?.oslSchedules,
        'RJC'
      );

      cgstAmount += parseFloat(oslLaborArray.totalLaborCGst);
      sgstAmount += parseFloat(oslLaborArray.totalLaborSGst);
      igstAmount += parseFloat(oslLaborArray.totalLaborIGst);
      l_rate += parseFloat(oslLaborArray.labBeforeTaxAmt);
      discount_percentage_l += parseFloat(oslLaborArray.totalLaborDiscount);
      // console.log(element?.jobcard?.partsIssue, 'element?.jobcard?.partsIssue');
      const partsArray = commonLogic.calcPartsIssue(
        element?.jobcard?.partsIssue
      );
      let spareCashDiscount = 0;

      for (const itm of element?.jobcard?.partsIssue || []) {
        spareCashDiscount += parseFloat(itm.discount || 0);
      }
      let cgstAmountp = parseFloat(partsArray.totalPartsCGst);
      let sgstAmountp = parseFloat(partsArray.totalPartsSGst);
      let igstAmountp = parseFloat(partsArray.totalPartsIGst);
      let p_rate = parseFloat(partsArray.totalPartsRate);
      let spareInvoiceAmount = parseFloat(partsArray.totalPartsAmount);

      let totalWithoutTax = l_rate + p_rate;

      resObj['cgst'] = igstAmount === 0 ? cgstAmount.toFixed(2) : '0.00';
      resObj['sgst'] = igstAmount === 0 ? sgstAmount.toFixed(2) : '0.00';
      resObj['igst'] = igstAmount > 0 ? igstAmount.toFixed(2) : '0.00';
      resObj['l_rate'] = l_rate.toFixed(2);
      resObj['discount_percentage_l'] = discount_percentage_l.toFixed(2);
      resObj['p_cgst'] = igstAmountp === 0 ? cgstAmountp.toFixed(2) : '0.00';
      resObj['p_sgst'] = igstAmountp === 0 ? sgstAmountp.toFixed(2) : '0.00';
      resObj['p_igst'] = igstAmountp > 0 ? igstAmountp.toFixed(2) : '0.00';
      resObj['p_rate'] = p_rate.toFixed(2);
      resObj['total_amount'] = totalWithoutTax.toFixed(2);
      resObj['total_amount_tax'] =
        totalWithoutTax +
        cgstAmount +
        sgstAmount +
        igstAmount +
        cgstAmountp +
        sgstAmountp +
        igstAmountp;
      resObj['spareCashDiscount'] = spareCashDiscount.toFixed(2);
      resObj['spareInvoiceAmount'] = spareInvoiceAmount.toFixed(2);

      finalArray.push(resObj);

      // for( const labor of laborArray.labour){
      //   const laborObj = {
      //     autoId: newIndex ++,
      //     cgst : (labor?.dataValues?.cgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     sgst : (labor?.dataValues?.sgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     igst : (labor?.dataValues?.igst * labor?.dataValues?.amount) / 100 ?? 0,
      //     l_rate : labor.dataValues?.amount + labor.dataValues?.discount_percentage - labor.dataValues?.additionalMargin,
      //     discount_percentage_l: labor?.dataValues?.discount_percentage ?? 0,
      //   }
      // const finalObj = {...resObj, ...laborObj};
      // finalArray.push(finalObj);
      // };

      // for( const labor of element?.jobcard?.oslSchedules){
      //   const oslLaborObj = {
      //     autoId: newIndex ++,
      //     cgst : (labor?.dataValues?.cgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     sgst : (labor?.dataValues?.sgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     igst : (labor?.dataValues?.igst * labor?.dataValues?.amount) / 100 ?? 0,
      //     supplierMargin: labor.dataValues?.marginPercentage,
      //     discount_percentage_l: labor?.dataValues?.discount_percentage ?? 0,
      //     l_rate : labor.dataValues?.amount + labor.dataValues?.discount_percentage - labor.dataValues?.additionalMargin,
      //   };

      //   const finalObj = {...resObj, ...oslLaborObj};
      //   finalArray.push(finalObj);
      // };

      // for( const labor of element?.jobcard?.partsIssue){
      //   const partsObj = {
      //     autoId: newIndex ++,
      //     p_cgst : (labor?.dataValues?.cgst * labor?.dataValues?.rate) / 100 ?? 0,
      //     p_sgst : (labor?.dataValues?.sgst * labor?.dataValues?.rate) / 100 ?? 0,
      //     p_igst : (labor?.dataValues?.igst * labor?.dataValues?.rate) / 100 ?? 0,
      //     p_rate : labor.rate,
      //     discount_percentage_p: labor?.dataValues?.discount ?? 0,
      //   };

      //   const finalObj = {...resObj, ...partsObj};
      //   finalArray.push(finalObj);
      // };
    });
    // };

    let count = finalArray.length;

    if (reqData.offset && reqData.offset > 0) {
      finalArray = finalArray.slice(reqData.offset);
    }

    if (finalArray.length > reqData.limit) {
      finalArray = finalArray.slice(0, reqData.limit);
    }

    return { totalItems: count, DeliveryReportData: finalArray };
  } catch (err) {
    logger.error('JobCard service getJobCardDeliveryReportData', err);
    next(err);
  }
};

const getWorkOrderReportData = async (reqData, user) => {
  try {
    const data = await JobCardDao.getWorkOrderReportData(reqData, user);
    let newDataList = data.filter((item) => {
      if (
        item.oslschedulesMapping?.billing !== undefined &&
        item.oslschedulesMapping?.billing !== null
      ) {
        return true;
      }
      return false;
    });
    let dataWithCustomHeaders = newDataList.map((item, index) => {
      const workOrderDate = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const jobcardDate = moment(item.oslschedulesMapping?.createdAt ?? '')
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const billDate = item.oslschedulesMapping?.billing?.createdAt
        ? moment(item.oslschedulesMapping.billing.createdAt)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      const amountVal = parseFloat(
        item.oslschedulesMapping?.billing?.osl_labor_amount || 0
      );

      const quantityVal = parseFloat(item.quantity || 0);

      const discountPercent = parseFloat(item.discount_percentage || 0);

      const marginPercent = parseFloat(item.marginPercentage || 0);

      const additionalMarginVal = parseFloat(item.additionalMargin || 0);

      const baseAmount = amountVal * quantityVal;

      const discountAmount = (baseAmount * discountPercent) / 100;

      const totalAmt = baseAmount - discountAmount;

      const dec = marginPercent / 100;

      let saleAmountWithoutTax = 0;

      if (marginPercent < 100) {
        saleAmountWithoutTax = (
          totalAmt / (1 - dec) +
          additionalMarginVal
        ).toFixed(2);
      }
      return {
        autoId: index + 1,
        outlet_code: item.oslschedulesMapping?.outlet_code ?? '',
        osl_bill_no: item.osl_bill_no,
        workOrderDate: workOrderDate,
        reg_no: item.oslschedulesMapping?.reg_no ?? '',
        make: item.oslschedulesMapping?.vehicle?.make?.makeName ?? '',
        model: item.oslschedulesMapping?.vehicle?.model?.modelName ?? '',
        jobcard_no: item.oslschedulesMapping?.job_card_no ?? '',
        jobcard_date: jobcardDate,
        invoiceNo: item.oslschedulesMapping?.billing?.bill_no ?? '',
        invoiceDate: billDate,
        laborScheduleCode: item.rot_code,
        laborScheduleDescription: item.description,
        quantity: item.quantity,
        amount: item.oslschedulesMapping?.billing?.osl_labor_amount,
        additionalMargin: item.additionalMargin,
        discount_percentage: item.discount_percentage,
        OslTax: item.oslschedulesMapping?.billing?.osllabor_taxamount ?? '',
        billedValue:
          (
            parseFloat(item.oslschedulesMapping?.billing?.osl_labor_amount) +
            parseFloat(item.oslschedulesMapping?.billing?.osllabor_taxamount)
          ).toFixed(2) ?? '',
        supplier: item.vendor?.vendorName ?? '',
        supplierCode: item.vendor?.vendorCode ?? '',
        source: item.oslschedulesMapping?.sources?.sourceName ?? '',
        sourceType: item.oslschedulesMapping?.sourcetype?.sourceTypeName ?? '',
        saleAmountWithoutTax: saleAmountWithoutTax,
      };
    });

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    }

    if (dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    }

    return { totalItems: count, data: dataWithCustomHeaders };
  } catch (err) {
    logger.error('JobCard service getWorkOrderReportData', err);
    next(err);
  }
};

const getRepairOrderReportData = async (reqData, user) => {
  try {
    const data = await JobCardDao.getRepairOrderReportData(reqData, user);
    let finalArray = [];
    let newIndex = 1;
    // for (const item of data) {
    for (let item of data) {
      const billing = item?.jobcard?.billing ?? {};
      const transactionUpdate = item?.jobcard?.transactionupdates?.[0] ?? {};
      const irnNo = transactionUpdate?.irn_no || '';
      const ackNo = transactionUpdate?.invoice_bdoack_no || '';
      const ackDate = transactionUpdate?.invoice_bdoack_date || '';
      const transactionStatus = item?.jobcard?.status ?? '';
      let jobCardStatus = '';
      if (transactionStatus == 6) {
        jobCardStatus = 'Billed and Invoice cancelled';
      } else {
        jobCardStatus = 'Billed';
      }

      // const workOrderDate = moment(item.created_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss');
      const jobcardDate = moment(item.jobcard?.createdAt ?? '')
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      // const billDate = item.oslschedulesMapping?.billing?.created_date
      //   ? moment(item.oslschedulesMapping.billing.created_date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss')
      //   : '';
      // console.log('item', item.jobcard?.schedules);
      const commonObj = {
        outlet_code: item?.jobcard?.outlet_code ?? '',
        make: item?.jobcard?.vehicle?.make?.makeName ?? '',
        model: item?.jobcard?.vehicle?.model?.modelName ?? '',
        jobcard_no: item?.jobcard?.job_card_no ?? '',
        jobcard_date: jobcardDate,
        reg_no: item?.jobcard?.reg_no ?? '',
        chassisNumber: item?.jobcard?.vehicle?.chassisNumber,
        engineNumber: item?.jobcard?.vehicle?.engineNumber,
        customerCode: item?.jobcard?.customer_code ?? '',
        customerName: item?.jobcard?.customer_name ?? '',
        customerGstin: item?.jobcard?.customer_gstin ?? '',
        sac_code: 998729,
        insurance_gstin: item?.jobcard?.customer_gstin ?? '',
        // repairType: item?.jobcard?.repairtype?.repairTypeName,
        documentDate: item?.jobcard?.billing?.createdAt,
        documentNumber: item?.jobcard?.billing?.bill_no,
        registrationNumber: item?.jobcard?.vehicle?.registrationNumber,
        mobileNumber: item?.jobcard?.customer_mobileNumber,
        jobcardStatus: jobCardStatus,
        // billingTo: item?.jobcard?.document_type === "RJC" ? "C" : "I"
      };

      const calcLabour = commonLogic.calcSchedules(
        item?.jobcard?.schedules,
        item?.jobcard?.document_type
      );
      for (const labor of calcLabour?.labour || []) {
        let labourBillingName = '';
        if (labor?.repairType == 2) {
          labourBillingName = billing?.foc_labor_bill_no || '';
        } else {
          labourBillingName = billing?.bill_no || '';
        }
        if (item?.jobcard?.document_type === 'RJC') {
          const laborObj = {
            autoId: newIndex++,
            laborScheduleCode: labor.rot_code ?? '',
            laborScheduleDescription: labor.description ?? '',
            Quantity: labor.quantity ?? 0,
            cgstPercent: labor.cgst ?? 0,
            sgstPercent: labor.sgst ?? 0,
            igstPercent: labor.igst ?? 0,
            cgst: labor.cgstamt ?? 0,
            sgst: labor.sgstamt ?? 0,
            igst: labor.igstamt ?? 0,
            customerAmount: labor.totalamtBeforeTax ?? 0,
            rate: labor.rateWithdisc,
            additionalMargin: labor.additionalMargin ?? 0,
            discount_percentage: labor.discount ?? 0,
            laborTotals: labor.totalamt ?? 0,
            totalTax:
              parseFloat(labor.igst) > 0
                ? labor.igstamt
                : (
                  parseFloat(labor.cgstamt) + parseFloat(labor.sgstamt)
                ).toFixed(2),
            billingTo: 'C',
            repairType: labor.repairType,
            supplier: '1',
            labourBillingName: labourBillingName,
            partsBillingName: billing?.bill_no || '',
            irnNo: irnNo,
            invAckNo: ackNo,
            invAckDate: ackDate,
          };

          const finalObj = { ...commonObj, ...laborObj };
          finalArray.push(finalObj);
        } else {
          const round2 = (v) => Number((Number(v) || 0).toFixed(2));

          let cgstval =
            round2(labor?.cgstCustomerAmount) +
            round2(labor?.cgstInsuranceAmount);

          let sgstval =
            round2(labor?.sgstCustomerAmount) +
            round2(labor?.sgstInsuranceAmount);

          let igstval =
            round2(labor?.igstCustomerAmount) +
            round2(labor?.igstInsuranceAmount);

          const cuslaborObj = {
            autoId: newIndex++,
            laborScheduleCode: labor.rot_code ?? '',
            laborScheduleDescription: labor.description ?? '',
            Quantity: labor.quantity ?? 0,
            cgstPercent: labor.cgst ?? 0,
            sgstPercent: labor.sgst ?? 0,
            igstPercent: labor.igst ?? 0,
            cgst: cgstval,
            sgst: sgstval,
            igst: igstval,
            customerAmount: labor.totalCustomeramt ?? 0,
            insuranceAmount: labor.totalInsuranceamt ?? 0,
            rate: labor.rateWithdisc,
            additionalMargin: labor.additionalMargin ?? 0,
            discount_percentage: labor.discount ?? 0,
            laborTotals:
              parseFloat(Number(labor.totalCustomeramtwithTx).toFixed(2)) +
              parseFloat(Number(labor.totalInsuranceamtwithTx).toFixed(2)) ??
              0,
            totalTax: parseFloat(labor.igst) > 0 ? igstval : cgstval + sgstval,
            billingTo: 'C',
            repairType: labor.repairType,
            supplier: '1',
            labourBillingName: labourBillingName,
            partsBillingName: billing?.bill_no || '',
            irnNo: irnNo,
            invAckNo: ackNo,
            invAckDate: ackDate,
          };

          // const inslaborObj = {
          //   autoId: newIndex ++,
          //   laborScheduleCode : labor.rot_code ?? '',
          //   laborScheduleDescription : labor.description ?? '',
          //   Quantity : labor.quantity ?? 0,
          //   cgstPercent : labor.cgst ?? 0,
          //   sgstPercent : labor.sgst ?? 0,
          //   igstPercent : labor.igst ?? 0,
          //   cgst : labor.cgstInsuranceAmount  ?? 0,
          //   sgst : labor.sgstInsuranceAmount  ?? 0,
          //   igst : labor.igstInsuranceAmount  ?? 0,
          //   customerAmount : labor.totalInsuranceamt ?? 0,
          //   rate : labor.rateWithdisc,
          //   additionalMargin : labor.additionalMargin ?? 0,
          //   discount_percentage : labor.discount ?? 0,
          //   laborTotals : labor.totalInsuranceamtwithTx ?? 0,
          //   totalTax: parseFloat(labor.igst) > 0 ? labor.igstInsuranceAmount : (parseFloat(labor.cgstInsuranceAmount) + parseFloat(labor.sgstInsuranceAmount)).toFixed(2),
          //   billingTo: "I",
          //   repairType: labor.repairType,
          // };

          finalArray.push({ ...commonObj, ...cuslaborObj });
          // finalArray.push({...commonObj, ...inslaborObj});
        }
      }

      // for( const labor of item?.jobcard?.schedules){
      //   const laborObj = {
      //     autoId: newIndex ++,
      //     laborScheduleCode : labor?.dataValues?.rot_code ?? '',
      //     laborScheduleDescription : labor?.dataValues?.description ?? '',
      //     Quantity : labor?.dataValues?.quantity ?? 0,
      //     cgstPercent : labor?.dataValues?.cgst ?? 0,
      //     sgstPercent : labor?.dataValues?.sgst ?? 0,
      //     igstPercent : labor?.dataValues?.igst ?? 0,
      //     cgst : (labor?.dataValues?.cgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     sgst : (labor?.dataValues?.sgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     igst : (labor?.dataValues?.igst * labor?.dataValues?.amount) / 100 ?? 0,
      //     customerAmount : labor?.dataValues?.customer_amount ?? 0,
      //     rate : labor.amount + labor.discount_percentage - labor.additionalMargin,
      //     additionalMargin : labor?.dataValues?.additionalMargin ?? 0,
      //     discount_percentage : labor?.dataValues?.discount_percentage ?? 0,
      //     laborTotals : labor?.dataValues?.laborTotal ?? 0,
      //     totalTax: labor.cgst + labor.sgst + labor.igst,
      //   };

      //   const finalObj = {...commonObj, ...laborObj};
      //   finalArray.push(finalObj);
      // };

      const calcOslLabour = commonLogic.calcOslSchedules(
        item?.jobcard?.oslSchedules,
        item?.jobcard?.document_type
      );
      for (const labor of calcOslLabour?.labour || []) {
        if (item?.jobcard?.document_type === 'RJC') {
          const oslLaborObj = {
            autoId: newIndex++,
            laborScheduleCode: labor.rot_code ?? '',
            laborScheduleDescription: labor.description ?? '',
            Quantity: labor.quantity ?? 0,
            cgstPercent: labor.cgst ?? 0,
            sgstPercent: labor.sgst ?? 0,
            igstPercent: labor.igst ?? 0,
            cgst: labor.cgstamt ?? 0,
            sgst: labor.sgstamt ?? 0,
            igst: labor.igstamt ?? 0,
            customerAmount: labor.totalamtBeforeTax ?? 0,
            rate: labor.rateWithdisc,
            additionalMargin: labor.additionalMargin ?? 0,
            discount_percentage: labor.discount ?? 0,
            laborTotals: labor.totalamt ?? 0,
            totalTax:
              parseFloat(labor.igst) > 0
                ? labor.igstamt
                : (
                  parseFloat(labor.cgstamt) + parseFloat(labor.sgstamt)
                ).toFixed(2),
            billingTo: 'C',
            supplierMargin: labor.marginPercentage,
            repairType: 'Paid Service',
            labourBillingName: billing?.bill_no || '',
            partsBillingName: billing?.bill_no || '',
          };

          const finalObj = { ...commonObj, ...oslLaborObj };
          finalArray.push(finalObj);
        } else {
          const round2 = (v) => Number((Number(v) || 0).toFixed(2));

          let cgstval =
            round2(labor?.cgstCustomerAmount) +
            round2(labor?.cgstInsuranceAmount);

          let sgstval =
            round2(labor?.sgstCustomerAmount) +
            round2(labor?.sgstInsuranceAmount);

          let igstval =
            round2(labor?.igstCustomerAmount) +
            round2(labor?.igstInsuranceAmount);

          const cusOslLaborObj = {
            autoId: newIndex++,
            laborScheduleCode: labor.rot_code ?? '',
            laborScheduleDescription: labor.description ?? '',
            Quantity: labor.quantity ?? 0,
            cgstPercent: labor.cgst ?? 0,
            sgstPercent: labor.sgst ?? 0,
            igstPercent: labor.igst ?? 0,
            cgst: cgstval,
            sgst: sgstval,
            igst: igstval,
            customerAmount: labor.totalCustomeramt ?? 0,
            insuranceAmount: labor.totalInsuranceamt ?? 0,
            rate: labor.rateWithdisc,
            additionalMargin: labor.additionalMargin ?? 0,
            discount_percentage: labor.discount ?? 0,
            laborTotals:
              parseFloat(Number(labor.totalCustomeramtwithTx).toFixed(2)) +
              parseFloat(Number(labor.totalInsuranceamtwithTx).toFixed(2)) ??
              0,
            totalTax: parseFloat(labor.igst) > 0 ? igstval : cgstval + igstval,
            billingTo: 'C',
            supplierMargin: labor.marginPercentage,
            repairType: 'Paid Service',
            labourBillingName: billing?.bill_no || '',
            partsBillingName: billing?.bill_no || '',
          };

          // const insOslLaborObj = {
          //   autoId: newIndex ++,
          //   laborScheduleCode : labor.rot_code ?? '',
          //   laborScheduleDescription : labor.description ?? '',
          //   Quantity : labor.quantity ?? 0,
          //   cgstPercent : labor.cgst ?? 0,
          //   sgstPercent : labor.sgst ?? 0,
          //   igstPercent : labor.igst ?? 0,
          //   cgst : labor.cgstInsuranceAmount  ?? 0,
          //   sgst : labor.sgstInsuranceAmount  ?? 0,
          //   igst : labor.igstInsuranceAmount  ?? 0,
          //   customerAmount : labor.totalInsuranceamt ?? 0,
          //   rate : labor.rateWithdisc,
          //   additionalMargin : labor.additionalMargin ?? 0,
          //   discount_percentage : labor.discount ?? 0,
          //   laborTotals : labor.totalInsuranceamtwithTx ?? 0,
          //   totalTax: parseFloat(labor.igst) > 0 ? labor.igstInsuranceAmount : (parseFloat(labor.cgstInsuranceAmount) + parseFloat(labor.sgstInsuranceAmount)).toFixed(2),
          //   billingTo: "I",
          //   supplierMargin: labor.marginPercentage,
          //   repairType: "Paid Service",
          // };

          finalArray.push({ ...commonObj, ...cusOslLaborObj });
          // finalArray.push({...commonObj, ...insOslLaborObj});
        }
      }

      // for( const labor of item?.jobcard?.oslSchedules){
      //   const oslLaborObj = {
      //     autoId: newIndex ++,
      //     laborScheduleCode : labor?.dataValues?.rot_code ?? '',
      //     laborScheduleDescription : labor?.dataValues?.description ?? '',
      //     Quantity : labor?.dataValues?.quantity ?? 0,
      //     cgstPercent : labor?.dataValues?.cgst ?? 0,
      //     sgstPercent : labor?.dataValues?.sgst ?? 0,
      //     igstPercent : labor?.dataValues?.igst ?? 0,
      //     cgst : (labor?.dataValues?.cgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     sgst : (labor?.dataValues?.sgst * labor?.dataValues?.amount) / 100 ?? 0,
      //     igst : (labor?.dataValues?.igst * labor?.dataValues?.amount) / 100 ?? 0,
      //     customerAmount : labor?.dataValues?.customer_amount ?? 0,
      //     rate : labor.amount + labor.discount_percentage - labor.additionalMargin,
      //     additionalMargin : labor?.dataValues?.additionalMargin ?? 0,
      //     discount_percentage : labor?.dataValues?.discount_percentage ?? 0,
      //     laborTotals : labor?.dataValues?.laborTotal ?? 0,
      //     totalTax: labor.cgst + labor.sgst + labor.igst,
      //     supplierMargin: labor.marginPercentage
      //   };

      //   const finalObj = {...commonObj, ...oslLaborObj};
      //   finalArray.push(finalObj);
      // };
    }
    // };

    let count = finalArray.length;

    if (reqData.offset && reqData.offset > 0) {
      finalArray = finalArray.slice(reqData.offset);
    }

    if (finalArray.length > reqData.limit) {
      finalArray = finalArray.slice(0, reqData.limit);
    }

    return { totalItems: count, data: finalArray };
  } catch (err) {
    logger.error('JobCard service getRepairOrderReportData', err);
    next(err);
  }
};

const getEliteStatementData = async (reqData, user) => {
  try {
    const billings = await JobCardDao.getEliteBillings(reqData, user);
    const finalArray = [];
    let sn = 1;

    for (const bill of billings || []) {
      const billPlain = bill.toJSON ? bill.toJSON() : bill;
      const tx = billPlain.jobcard || {};
      const transactionId = billPlain.transaction_id;

      const jobcardStatus = tx.status === 6
        ? 'Billed and Invoice Cancelled'
        : 'Billed';

      let sum5 = 0, sum12 = 0, sum18 = 0, sum28 = 0;
      let sum5_per = 0, sum12_per = 0, sum18_per = 0, sum28_per = 0;
      let sum_IGST5 = 0, sum_IGST12 = 0, sum_IGST18 = 0, sumIGST = 0;
      let sumIGST_5per = 0, sumIGST_12per = 0, sumIGST_18per = 0, sumIGST_per = 0;

      const parts = await JobCardDao.getEliteParts(transactionId);
      for (const result of parts || []) {
        const totalCost = parseFloat(result.total_cost) || 0;
        const sgstPlusCgst = parseFloat(result.sgst_plus_cgst) || 0;
        const igst = parseFloat(result.IGST) || 0;

        switch (igst) {
          case 5: sum_IGST5 += totalCost; sumIGST_5per = sum_IGST5 * (5 / 100); break;
          case 12: sum_IGST12 += totalCost; sumIGST_12per = sum_IGST12 * (12 / 100); break;
          case 18: sum_IGST18 += totalCost; sumIGST_18per = sum_IGST18 * (18 / 100); break;
          case 28: sumIGST = totalCost; sumIGST_per = sumIGST * (28 / 100); break;
        }

        switch (sgstPlusCgst) {
          case 5: sum5 += totalCost; sum5_per = sum5 * (5 / 100); break;
          case 12: sum12 += totalCost; sum12_per = sum12 * (12 / 100); break;
          case 18: sum18 += totalCost; sum18_per = sum18 * (18 / 100); break;
          case 28: sum28 += totalCost; sum28_per = sum28 * (28 / 100); break;
        }
      }

      const kerelacess = parseFloat(billPlain.cess) || 0;
      const kerelacess_old = parseInt(billPlain.cess_old) || 0;

      let sched_before_tax = 0, sched_cgst = 0, sched_sgst = 0, sched_igst = 0;
      const schedules = await JobCardDao.getEliteSchedules(transactionId);
      for (const sched of schedules || []) {
        const amount = parseFloat(sched.amount) || 0;
        const margin = parseFloat(sched.additionalMargin) || 0;
        const discount = parseFloat(sched.discount_percentage) || 0;
        const cgst = parseFloat(sched.cgst) || 0;
        const sgst = parseFloat(sched.sgst) || 0;
        const igst = parseFloat(sched.igst) || 0;

        const baseAmt = amount + margin - discount;
        const laborkerelacess = (baseAmt / 100) * kerelacess;
        const laborkerelacesso = kerelacess_old === 1 ? laborkerelacess : 0;

        sched_before_tax += baseAmt;
        sched_cgst += ((baseAmt + laborkerelacesso) * cgst) / 100;
        sched_sgst += ((baseAmt + laborkerelacesso) * sgst) / 100;
        sched_igst += ((baseAmt + laborkerelacesso) * igst) / 100;
      }

      let oslTotalBeforeTax = 0;
      let oslLabourCgstAmount = 0, oslLabourSgstAmount = 0, oslLabourIgstAmount = 0;
      const oslScheds = await JobCardDao.getEliteOslSchedules(transactionId);
      for (const osl of oslScheds || []) {
        const oslLabourQuantity = parseFloat(osl.quantity) || 0;
        const oslLabourRate = parseFloat(osl.singleAmount) || 0;
        const oslLabour_discount = parseFloat(osl.discount_percentage) || 0;
        const oslLaboAmount = oslLabourQuantity * oslLabourRate;
        const oslsuppliermargin = parseFloat(osl.marginPercentage) || 0;
        const oslAdditionalMargin = parseFloat(osl.additionalMargin) || 0;
        const oslLabourAmount = oslLaboAmount - oslLabour_discount;
        const dec = oslsuppliermargin / 100;
        const oslLabourAmountbeforedis = (oslLabourAmount / (1 - dec)) + oslAdditionalMargin;
        let oslLabourAmountAfterDiscount = oslLabourAmountbeforedis;

        let oslLabourDepreciation = parseFloat(osl.depreciation_per) || 0;
        oslLabourDepreciation = 100 - oslLabourDepreciation;

        if (tx.document_type === 'AJC') {
          oslLabourAmountAfterDiscount = (oslLabourAmountbeforedis / 100) * oslLabourDepreciation;
        }

        let oslLabourCgst = parseFloat(osl.cgst);
        let oslLabourSgst = parseFloat(osl.sgst);
        const oslLabourIgst = parseFloat(osl.igst) || 0;
        if (!oslLabourIgst) {
          if (!oslLabourCgst) oslLabourCgst = 9;
          if (!oslLabourSgst) oslLabourSgst = 9;
        }

        const oslkerelacess = (oslLabourAmountAfterDiscount / 100) * kerelacess;
        const oslLabourAmountAfterDiscountces = kerelacess_old === 1
          ? oslLabourAmountAfterDiscount + oslkerelacess
          : oslLabourAmountAfterDiscount;

        oslTotalBeforeTax += oslLabourAmountAfterDiscount;
        oslLabourCgstAmount += (oslLabourAmountAfterDiscountces / 100) * (oslLabourCgst || 0);
        oslLabourSgstAmount += (oslLabourAmountAfterDiscountces / 100) * (oslLabourSgst || 0);
        oslLabourIgstAmount += (oslLabourAmountAfterDiscountces / 100) * oslLabourIgst;
      }

      const TotalLabour = oslTotalBeforeTax + sched_before_tax;
      const TotalIgst = sched_igst + oslLabourIgstAmount;
      const TotalTaxlabor = sched_cgst + sched_sgst + oslLabourCgstAmount + oslLabourSgstAmount;

      const invoiceAmount =
        sum5 + sum12 + sum18 + sum28 + TotalLabour + TotalTaxlabor +
        sum5_per + sum12_per + sum18_per + sum28_per + TotalIgst +
        sumIGST + sumIGST_per + sum_IGST18 + sumIGST_18per +
        sumIGST_5per + sum_IGST5 + sum_IGST12 + sumIGST_12per;

      const fmt = (v) => Number(v || 0).toFixed(2);

      finalArray.push({
        autoId: sn++,
        invoiceCategory: 'Sales',
        invoiceDate: billPlain.createdAt
          ? moment(billPlain.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY')
          : '',
        invoiceName: billPlain.bill_no || '',
        jobcard_no: tx.job_card_no || '',
        customerName: tx.customer_name || '',
        contactNo: tx.customer_mobileNumber || '',
        gstNumber: tx.customer_gstin || '',
        registrationNumber: tx.reg_no || '',
        basicParts5: fmt(sum5),
        parts5: fmt(sum5_per),
        basicParts12: fmt(sum12),
        parts12: fmt(sum12_per),
        basicParts18: fmt(sum18),
        parts18: fmt(sum18_per),
        basicParts28: fmt(sum28),
        parts28: fmt(sum28_per),
        basicPartsIgst5: fmt(sum_IGST5),
        partsIgst5: fmt(sumIGST_5per),
        basicPartsIgst12: fmt(sum_IGST12),
        partsIgst12: fmt(sumIGST_12per),
        basicPartsIgst18: fmt(sum_IGST18),
        partsIgst18: fmt(sumIGST_18per),
        basicPartsIgst28: fmt(sumIGST),
        partsIgst28: fmt(sumIGST_per),
        basicLabour18: fmt(TotalLabour),
        labour18: fmt(TotalTaxlabor),
        labourIgst: fmt(TotalIgst),
        invoiceAmount: fmt(invoiceAmount),
        status: jobcardStatus,
        type: 'Sales',
        technician: '-',
      });
    }

    const totalItems = finalArray.length;
    let data = finalArray;
    if (reqData.limit) {
      const offset = reqData.offset || 0;
      data = finalArray.slice(offset, offset + reqData.limit);
    }

    return { data, totalItems };
  } catch (err) {
    logger.error('JobCard service getEliteStatementData', err);
  }
};

const getJobCardData = async (jobCardNo, user) => {
  try {
    const data = await JobCardDao.getJobCardData(jobCardNo, user);
    return data;
  } catch (err) {
    logger.error('JobCard service getJobCardData Error:', err);
    next(err);
  }
};

const getReceiptReportData = async (reqData, user) => {
  try {
    const data = await JobCardDao.getReceiptReportData(reqData, user);
    const dataWithCustomHeaders = data.map((item, index) => {
      const receiptDate = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const refDate = item.ref_date
        ? moment(item.ref_date).tz('Asia/Kolkata').format('DD-MM-YYYY')
        : '';
      const jobcardDate = moment(item.jobcard?.createdAt ?? '')
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const billDate = item.jobcard?.billing?.createdAt
        ? moment(item.jobcard.billing.createdAt)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';
      let labourNo = '';
      let partsNo = '';

      if (item.transaction_id) {
        labourNo = item.jobcard?.billing?.bill_no ?? '';

        partsNo = item.jobcard?.billing?.bill_no ?? '';
      }
      let cardOrCheckNo = '';

      const paymentMode = (item.mode_of_payment || '').toLowerCase();

      if (paymentMode === 'credit card') {
        cardOrCheckNo = item.cardNumber || '';

      } else if (paymentMode === 'cheque') {
        cardOrCheckNo = item.cheque_draft_number || '';

      } else if (['upi', 'neft', 'razor pay', 'razorpay'].includes(paymentMode)) {
        cardOrCheckNo = item.transaction_number || '';

      }

      return {
        autoId: index + 1,
        outlet_code: item.jobcard?.outlet?.outletCode ?? '',
        receiptDate: receiptDate,
        receiptNo: item.doc_no,
        customerCode: item.jobcard?.customer_code ?? '',
        customerName: item.jobcard?.customer_name ?? '',
        regNo: item.jobcard?.reg_no ?? '',
        invoiceDate: billDate,
        jobCardNo: item.jobcard?.job_card_no ?? '',
        invoiceNo: item.jobcard?.billing?.bill_no ?? '',
        invoiceAmount: item.jobcard?.billing?.total_amount ?? '',
        paymentMode: item.mode_of_payment,
        amount: item.amount,
        cardOrCheckNo: cardOrCheckNo,
        referenceNo: item.ref_no,
        referenceDate: refDate,
        createdBy: 'DMS',
        remarks: item.remarks,
        source: item.jobcard?.sources?.sourceName ?? '',
        sourceType: item.jobcard?.sourcetype?.sourceTypeName ?? '',
        customerType: item.jobcard?.customer_type ?? '',
        labourInvoiceNo: labourNo,
        partsInvoiceNo: partsNo,
        outletCity: item.jobcard?.outlet?.city ?? '',
        outletName: item.jobcard?.outlet?.outletName ?? '',
        bankName: item.utr_bank_name,
      };
    });

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    }

    if (dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    }

    return { totalItems: count, data: dataWithCustomHeaders };
  } catch (err) {
    logger.error('JobCard service getReceiptReportData', err);
    next(err);
  }
};

const vehicleHistory = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await JobCardDao.vehicleHistory(reqData, user);
    return data;
  } catch (err) {
    logger.error('JobCard service listJobCards', err);
    next(err);
  }
};

const getJobCardForAutoPO = async (body, user) => {
  try {
    const data = await JobCardDao.getJobCardForAutoPO(body.id, user);
    // console.log(body, 'customerstate');
    const formattedData = [];
    for (const jobCard of data) {
      const margin = jobCard['list'] - jobCard['cost'];
      const marginPercentage = Number(
        ((margin / jobCard['list']) * 100).toFixed(2)
      );
      const resObj = {};
      resObj['Parts Code'] = jobCard['item_code'];
      resObj['item_id'] = jobCard['item_id'];
      resObj['Description'] = jobCard['item_name'];
      resObj['Hsn Code'] = jobCard['hsnCode']; // Ensure vehicle and make are present
      resObj['Requested Qty'] = jobCard['request_quantity']; // Ensure vehicle and model are present
      resObj['Rate'] = jobCard['list'];
      resObj['Cost'] = jobCard['cost'];
      resObj['MRP'] = jobCard['mrp'];
      resObj['Available Stock Qty'] = jobCard['quantity']
        ? jobCard['quantity']
        : 0;
      resObj['indent_id'] = jobCard.id;
      resObj['Make'] = jobCard.Make;
      resObj['Model'] = jobCard.Model;
      resObj['Parts Category'] = jobCard.itemCategorie;
      resObj['Fuel Type'] = jobCard.fuelType;
      resObj['Vin Number'] = jobCard.chassisNumber;
      resObj['Job Card No'] = jobCard.job_card_no;
      resObj['Reg No'] = jobCard.reg_no;
      resObj['Margin %'] = marginPercentage;
      resObj['Total Amount'] = '';
      resObj['Job Card Id'] = jobCard.jobCardId;
      resObj['Make_Id'] = jobCard.makeId;
      resObj['Model_Id'] = jobCard.modelsId;
      resObj['Parts_Category_Id'] = jobCard.itemCategoryId;
       
      if (jobCard?.customerState?.toLowerCase() === user.outlet.state.toLowerCase()) {
        resObj['SGST'] = jobCard.taxPercentage / 2;
        resObj['CGST'] = jobCard.taxPercentage / 2;
        resObj['IGST'] = 0;
      } else {
        resObj['SGST'] = 0;
        resObj['CGST'] = 0;
        resObj['IGST'] = jobCard.taxPercentage;
      }
      formattedData.push(resObj);
    }
    return formattedData;
  } catch (err) {
    logger.error(' Jobcard fetching error', err);
  }
};
const createJobCardMobile = async (reqData, user) => {
  let result = 'success'; //change
  let recentActivityData = {};
  let resObj = {};
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  try {
    const estimateData = await JobCardDao.getServiceEstimateById(
      parseInt(reqData.estimateId),
      user.outlet.id
    );
    if (!estimateData) {
      return {
        result: 'serviceEstimateNotFound',
        message: 'Service estimate not found for this outlet',
      };
    }
    if (![true, 1, '1'].includes(estimateData.estimateApproved)) {
      return {
        result: 'estimateApprovalRequired',
        message: 'Service estimate must be approved by a service advisor before creating a job card',
      };
    }
    const jobCardNumber = await generateJobCardNumber(
      'RJC',
      user.outlet.outletCode
    );

    const repairId = await JobCardDao.getIdByRepairTypeMobile(
      estimateData.repairType
    );
    const serviceId = await JobCardDao.getIdByServiceTypeMobile(
      estimateData.serviceType
    );
    const sourceId = await JobCardDao.getIdBySourceMobile(estimateData.source);
    const sourceTypeId = await JobCardDao.getIdBySourceTypeMobile(
      estimateData.sourceType
    );

    let createData = {
      documentType: 'RJC',
      jobCardNumber: jobCardNumber,
      registrationNumber: estimateData.registrationNumber,
      expectedWorkCompletion: estimateData.expectedWorkCompletedDate,
      customerArrivedDate: currentDate,
      repairTypeId: repairId.id,
      serviceTypeId: serviceId.id,
      odometer: estimateData.odometer,
      serviceEstimateId: estimateData.id,
      serviceEstimateNumber: estimateData.serviceEstimateNumber,
      customerVoice: estimateData.customerVoice,
      sourceId: sourceId.id,
      sourceTypeId: sourceTypeId.id,
      dsaAgent: { id: 0, dsaCode: '' },
      OtdFailureReason: { id: 0, reason: '' },
      TransactionSubStatus: '',
      TransactionSubStatusReason: '',
      paidByStatus: 0,
    };
    reqData['jobCardNumber'] = jobCardNumber;
    const customerData = await getCustomerData(estimateData.registrationNumber);
    let data = await JobCardDao.createJobCard(createData, user, customerData);
    resObj['jobCardDetail'] = {
      id: data.id.toString(),
      jobCardNo: data.job_card_no,
    };
    resObj['laborSchedules'] = [];
    resObj['oslLaborSchedules'] = [];
    resObj['part'] = [];
    if (Object.keys(data).length > 0) {
      const labor = estimateData.labourEstimate;
      const oslLabor = estimateData.oslLabourEstimate;
      const parts = estimateData.partEstimate;
      for (const schedulesObj of labor) {
        const estimateLine = schedulesObj.get ? schedulesObj.get({ plain: true }) : { ...schedulesObj };
        Object.assign(estimateLine, {
          transactionId: data.id,
          status: 2,
          approvalStatus: 'APPROVED',
          sourceType: 'ESTIMATE',
          sourceEstimateItemId: estimateLine.id,
          approveDatetime: estimateData.estimateApprovedAt || currentDate,
          isEstimateCopy: true,
        });
        let labourData = await JobCardDao.createScheduleMobile(
          estimateLine,
          user
        );
        resObj['laborSchedules'].push({
          id: labourData.id.toString(),
          laborId: labourData.rot_id.toString(),
          fitId: labourData.fitId.toString(),
        });
      }
      for (const oslSchedulesObj of oslLabor) {
        const estimateLine = oslSchedulesObj.get ? oslSchedulesObj.get({ plain: true }) : { ...oslSchedulesObj };
        const osl = await JobCardDao.getOslByVendor(
          estimateLine.vendorId,
          data.id
        );

        if (osl) {
          // OSL record exists, use existing OSL Bill Number
          estimateLine['oslBillNo'] = osl.osl_bill_no;
        } else {
          // OSL record does not exist, generate a new OSL Bill Number
          const oslBillNo = await generateOSLBill(
            'WOB',
            user.outlet.outletCode
          );
          estimateLine['oslBillNo'] = oslBillNo;
        }
        Object.assign(estimateLine, {
          transactionId: data.id,
          status: 2,
          approvalStatus: 'APPROVED',
          sourceType: 'ESTIMATE',
          sourceEstimateItemId: estimateLine.id,
          approveDatetime: estimateData.estimateApprovedAt || currentDate,
          isEstimateCopy: true,
        });
        let oslData = await JobCardDao.createOslScheduleMobile(
          estimateLine,
          user
        );
        resObj['oslLaborSchedules'].push({
          id: oslData.id.toString(),
          laborId: oslData.rot_id.toString(),
          fitId: oslData.fitId.toString(),
        });
      }
      //
      for (const partsIndent of parts) {
        const estimateLine = partsIndent.get ? partsIndent.get({ plain: true }) : { ...partsIndent };
        Object.assign(estimateLine, {
          transactionId: data.id,
          status: 2,
          approvalStatus: 'APPROVED',
          sourceType: 'ESTIMATE',
          sourceEstimateItemId: estimateLine.id,
          approveDatetime: estimateData.estimateApprovedAt || currentDate,
          isEstimateCopy: true,
        });
        let partsData = await JobCardDao.createPartsIndentMobile(
          estimateLine,
          user
        );
        resObj['part'].push({
          id: partsData.id.toString(),
          partId: partsData.item_id.toString(),
          fitId: partsData.fitId.toString(),
        });
      }
      const workflow = await advanceJobCardWorkflowIfApproved(data.id, user);
      resObj['jobCardStatus'] = workflow.status;
      resObj['jobCardStatusValue'] = workflow.statusValue;
      result = 'success';
    }
    if (result == 'success') {
      logger.info('ServiceEstimate call : ' + reqData.estimateId);
      await JobCardDao.updateServiceEstimateStatus(reqData.estimateId, user);
      logger.info('ServiceEstimate status updated');
    }
    if (Object.keys(data).length > 0) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Job Card';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        ' Job Card created for ' + estimateData.registrationNumber;
      const recent =
        RecentAcivityService.addTransactionRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('Job Card Service  createJobCardMobile', err);
    // next(err);
  }
  resObj['result'] = result;
  return resObj;
};
const getCompanyDetails = async (companyId) => {
  try {
    return await JobCardDao.getCompanyDetails(companyId);
  } catch (err) {
    logger.error('Error fetching company details:', err);
    throw err;
  }
};

const getTransactionCustomerDetails = async (transaction_id) => {
  try {
    return await JobCardDao.getTransactionCustomerDetails(transaction_id);
  } catch (err) {
    logger.error('Error fetching customer details:', err);
    throw err;
  }
};

const getScheduleDetails = async (transaction_id) => {
  try {
    return await JobCardDao.getScheduleDetails(transaction_id);
  } catch (err) {
    logger.error('Error fetching schedule details:', err);
    throw err;
  }
};

const getOslScheduleDetails = async (transaction_id) => {
  try {
    return await JobCardDao.getOslScheduleDetails(transaction_id);
  } catch (err) {
    logger.error('Error fetching OSL schedule details:', err);
    throw err;
  }
};

const getPartsIssueDetails = async (transaction_id) => {
  try {
    return await JobCardDao.getPartsIssueDetails(transaction_id);
  } catch (err) {
    logger.error('Error fetching parts issue details:', err);
    throw err;
  }
};

const getOutletDetails = async (outletId) => {
  try {
    return await JobCardDao.getOutletDetails(outletId);
  } catch (err) {
    logger.error('Error fetching outlet details:', err);
    throw err;
  }
};

const createTransactionUpdate = async (transactionUpdateData) => {
  try {
    return await JobCardDao.createTransactionUpdate(transactionUpdateData);
  } catch (err) {
    logger.error('Error creating transaction update:', err);
    throw err;
  }
};

const getJobCardDetailsMobile = async (reqData) => {
  let result = {};
  let finalResult = {};
  try {
    const data = await JobCardDao.getJobCardDetailsMobile(
      reqData.jcId,
      reqData.userId
    );
    result['id'] = data.id.toString();
    result['cusCode'] = data.customer_id.toString();
    result['vehicleRegNo'] = data.reg_no;
    result['jobCardNo'] = data.job_card_no;
    result['expectedWorkCompletedDate'] = data.work_end_date_time;
    result['actualWorkStartDate'] = '';
    result['actualEndStartDate'] = '';
    result['customerArrivedDate'] = data.customer_arrived_date;
    result['repairType'] = data.repairtype.repairTypeName;
    result['serviceType'] = data.servicetype.serviceTypeName;
    result['km'] = data.odometer.toString();
    result['advisor'] = '';
    result['customerVoice'] = data.customer_voice;
    result['serviceEngineerRemarks'] = data.service_engineer_remarks;
    result['serviceAdvice'] = data.service_advice;
    result['source'] = data.sources.sourceName;
    result['sourceType'] = data.sourcetype.sourceTypeName;
    result['jobCardCreatedDate'] = data.createdAt;

    let schedules = [];
    let oslSchedules = [];
    let partsIndent = [];
    let partsIssue = [];

    for (const labor of data.schedules) {
      let laborData = {};
      laborData.id = labor.id.toString();
      laborData.laborId = labor.rot_id.toString();
      laborData.laborCode = labor.rot_code;
      laborData.quantity = labor.quantity.toString();
      laborData.laborDescription = labor.description;
      laborData.amount = labor.amount.toString();
      laborData.marginAmount = labor.additionalMargin.toString();
      laborData.discountAmount = labor.discount_percentage.toString();
      laborData.sgst = labor.sgst.toString();
      laborData.cgst = labor.cgst.toString();
      laborData.igst = labor.igst.toString();
      laborData.depreciationPercentage = labor.depreciation_per.toString();
      laborData.customerAmount = labor.customer_amount.toString();
      laborData.insuranceAmount = labor.insurance_amount.toString();
      laborData.totalLabor = labor.laborTotal.toString();
      laborData.repairType = labor.repairTypeId.toString();
      laborData.fitId = labor.fitId;

      schedules.push(laborData);
    }

    for (const labor of data.oslSchedules) {
      let laborData = {};
      laborData.id = labor.id.toString();
      laborData.laborId = labor.rot_id.toString();
      laborData.laborCode = labor.rot_code;
      laborData.quantity = labor.quantity.toString();
      laborData.laborDescription = labor.description;
      laborData.amount = labor.amount.toString();
      laborData.marginAmount = labor.additionalMargin.toString();
      laborData.discountAmount = labor.discount_percentage.toString();
      laborData.sgst = labor.sgst.toString();
      laborData.cgst = labor.cgst.toString();
      laborData.igst = labor.igst.toString();
      laborData.depreciationPercentage = labor.depreciation_per.toString();
      laborData.customerAmount = labor.customer_amount.toString();
      laborData.insuranceAmount = labor.insurance_amount.toString();
      laborData.totalLabor = labor.laborTotal.toString();
      laborData.fitId = labor.fitId;

      oslSchedules.push(laborData);
    }

    for (const part of data.partsIndent) {
      let partData = {};
      partData.id = part.id.toString();
      partData.partId = part.item_id.toString();
      partData.partNo = part.item_code;
      partData.partDescription = part.item_name;
      partData.hsnCode = part.hsn_code;
      partData.partQuantity = part.request_quantity.toString();
      partData.receivedQuantity = part.received_quantity;
      partData.partRate = part.amount.toString();
      partData.partMargin = null;
      partData.partDiscount = '0';
      partData.partSgst = part.sgst.toString();
      partData.partCgst = part.cgst.toString();
      partData.partIgst = part.igst.toString();
      partData.depreciationPercentage = null;
      partData.fitId = part.fitId;

      partsIndent.push(partData);
    }

    for (const part of data.partsIssue) {
      let partData = {};
      partData.id = part.id.toString();
      partData.partId = part.item_id.toString();
      partData.partNo = part.item_code;
      partData.partDescription = part.item_name;
      partData.hsnCode = part?.items?.hsnCode;
      partData.partQuantity = part.quantity.toString();
      partData.receivedQuantity = part.quantity;
      partData.partRate = part.rate.toString();
      partData.partMargin = null;
      partData.partDiscount = '0';
      partData.partSgst = part.sgst.toString();
      partData.partCgst = part.cgst.toString();
      partData.partIgst = part.igst.toString();
      partData.depreciationPercentage = null;
      partData.fitId = part?.fitId;

      partsIssue.push(partData);
    }

    finalResult = {
      transaction: result,
      schedules: schedules,
      oslSchedules: oslSchedules,
      partsIndent: partsIndent,
    };
    return finalResult;
  } catch (err) {
    logger.error('Job Card Service  getJobCardDetailsMobile', err);
  }
};

// const getJobCardDetailsBridge = async (reqData) => {
//   let result = {};
//   let finalResult = {};
//   try {
//     const data = await JobCardDao.getJobCardDetailsBridge(reqData.jcId, reqData.userId);
//     result['id'] = data.id.toString();
//     result['cusCode'] = data.customer_id.toString();
//     result['vehicleRegNo'] = data.reg_no;
//     result['jobCardNo'] = data.job_card_no;
//     result['expectedWorkCompletedDate'] = data.work_end_date_time;
//     result['actualWorkStartDate'] = "";
//     result['actualEndStartDate'] = "";
//     result['customerArrivedDate'] = data.customer_arrived_date;
//     result['repairType'] = data.repairtype.repairTypeName;
//     result['serviceType'] = data.servicetype.serviceTypeName;
//     result['km'] = data.odometer.toString();
//     result['advisor'] = "";
//     result['customerVoice'] = data.customer_voice;
//     result['serviceEngineerRemarks'] = data.service_engineer_remarks;
//     result['serviceAdvice'] = data.service_advice;
//     result['source'] = data.sources.sourceName;
//     result['sourceType'] = data.sourcetype.sourceTypeName;
//     result['jobCardCreatedDate'] = data.createdAt;

//     let schedules = [];
//     let oslSchedules = [];
//     let partsIndent = [];
//     let partsIssue = []

//     for (const labor of data.schedules) {
//       let laborData = {};
//       laborData.id = labor.id.toString();
//       laborData.laborId = labor.rot_id.toString();
//       laborData.laborCode = labor.rot_code;
//       laborData.quantity = labor.quantity.toString();
//       laborData.laborDescription = labor.description;
//       laborData.amount = labor.amount.toString();
//       laborData.marginAmount = labor.additionalMargin.toString();
//       laborData.discountAmount = labor.discount_percentage.toString();
//       laborData.sgst = labor.sgst.toString();
//       laborData.cgst = labor.cgst.toString();
//       laborData.igst = labor.igst.toString();
//       laborData.depreciationPercentage = labor.depreciation_per.toString();
//       laborData.customerAmount = labor.customer_amount.toString();
//       laborData.insuranceAmount = labor.insurance_amount.toString();
//       laborData.totalLabor = labor.laborTotal.toString();
//       laborData.repairType = labor.repairTypeId.toString();
//       laborData.fitId = labor.fitId;

//       schedules.push(laborData);
//     }

//     for (const labor of data.oslSchedules) {
//       let laborData = {};
//       laborData.id = labor.id.toString();
//       laborData.laborId = labor.rot_id.toString();
//       laborData.laborCode = labor.rot_code;
//       laborData.quantity = labor.quantity.toString();
//       laborData.laborDescription = labor.description;
//       laborData.amount = labor.amount.toString();
//       laborData.marginAmount = labor.additionalMargin.toString();
//       laborData.discountAmount = labor.discount_percentage.toString();
//       laborData.sgst = labor.sgst.toString();
//       laborData.cgst = labor.cgst.toString();
//       laborData.igst = labor.igst.toString();
//       laborData.depreciationPercentage = labor.depreciation_per.toString();
//       laborData.customerAmount = labor.customer_amount.toString();
//       laborData.insuranceAmount = labor.insurance_amount.toString();
//       laborData.totalLabor = labor.laborTotal.toString();
//       laborData.fitId = labor.fitId;

//       oslSchedules.push(laborData);
//     }

//     for (const part of data.partsIndent) {
//       let partData = {};
//       partData.id = part.id.toString();
//       partData.partId = part.item_id.toString();
//       partData.partNo = part.item_code;
//       partData.partDescription = part.item_name;
//       partData.hsnCode = part.hsn_code;
//       partData.partQuantity = part.request_quantity.toString();
//       partData.receivedQuantity = part.received_quantity;
//       partData.partRate = part.amount.toString();
//       partData.partMargin = null;
//       partData.partDiscount = "0";
//       partData.partSgst = part.sgst.toString();
//       partData.partCgst = part.cgst.toString();
//       partData.partIgst = part.igst.toString();
//       partData.depreciationPercentage = null;
//       partData.fitId = part.fitId;

//       partsIndent.push(partData);
//     }

//     for (const part of data.partsIssue) {
//       let partData = {};
//       partData.id = part.id.toString();
//       partData.partId = part.item_id.toString();
//       partData.partNo = part.item_code;
//       partData.partDescription = part.item_name;
//       partData.hsnCode = part?.items?.hsnCode;
//       partData.partQuantity = part.quantity.toString();
//       partData.receivedQuantity = part.quantity;
//       partData.partRate = part.rate.toString();
//       partData.partMargin = null;
//       partData.partDiscount = "0";
//       partData.partSgst = part.sgst.toString();
//       partData.partCgst = part.cgst.toString();
//       partData.partIgst = part.igst.toString();
//       partData.depreciationPercentage = null;
//       partData.fitId = part?.fitId;

//       partsIssue.push(partData);
//     }

//     finalResult = {
//       transaction: result,
//       schedules: schedules,
//       oslSchedules: oslSchedules,
//       partsIndent: partsIndent
//     }
//     return finalResult;
//   } catch (err) {
//     logger.error("Job Card Service  getJobCardDetailsBridge", err);
//   }
// }

const getJobCardDetailsBridge = async (reqData) => {
  try {
    const response = await JobCardDao.getJobCardDetailsBridge(reqData);
    // console.log('bridge status api', response);

    // 🧩 Handle case where no record found
    if (!response) {
      return {
        requestSuccessful: true,
        message: 'No JobCard found for the given details',
      };
    }
    let finalarr = [];
    for (const data of response) {
      //  let decryptedCustomerName= await commonLogic.decrypt(data.customer_name)
      const result = {
        id: data.id.toString(),
        // cusCode: data.customer_id.toString(),
        customerName: data.customer_name,
        vehicleRegNo: data.reg_no,
        jobCardNo: data.job_card_no,
        updatedAt: data?.updatedAt
          ? moment(data.updatedAt)
            .tz('Asia/Kolkata')
            .format('DD-MM-YYYY HH:mm:ss')
          : '',
        expectedWorkCompletedDate: data.work_end_date_time
          ? moment(data.work_end_date_time)
            .tz('Asia/Kolkata')
            .format('DD-MM-YYYY HH:mm:ss')
          : '',

        // actualWorkStartDate: "",
        // actualEndStartDate: "",
        customerArrivedDate: data.customer_arrived_date
          ? moment(data.customer_arrived_date)
            .tz('Asia/Kolkata')
            .format('DD-MM-YYYY HH:mm:ss')
          : '',
        repairType: data.repairtype?.repairTypeName ?? '',
        serviceType: data.servicetype?.serviceTypeName ?? '',
        km: data.odometer.toString(),
        // advisor: "",
        customerVoice: data.customer_voice,
        serviceEngineerRemarks: data.service_engineer_remarks,
        serviceAdvice: data.service_advice,
        source: data.sources?.sourceName ?? '',
        sourceType: data.sourcetype?.sourceTypeName ?? '',
        jobCardCreatedDate: data.createdAt
          ? moment(data.createdAt)
            .tz('Asia/Kolkata')
            .format('DD-MM-YYYY HH:mm:ss')
          : '',
        jobCardStatus: data.status_value,
        make: data.vehicle?.make?.makeName ?? '',
        model: data.vehicle?.model?.modelName ?? '',
      };

      //     const serviceEstimate = data.service_estimate?.map(estimate =>({
      //       id: estimate.id.toString(),
      // estimateCreate : estimate.createdAt,
      // serviceEstimateNumber:estimate.serviceEstimateNumber,
      // updateServiceEstimateStatus: estimate.status

      //     }));

      const serviceEstimate = data.serviceEstimate
        ? {
          id: data.serviceEstimate.id?.toString() ?? '',
          estimateCreate: data.serviceEstimate.createdAt
            ? moment(data.createdAt)
              .tz('Asia/Kolkata')
              .format('DD-MM-YYYY HH:mm:ss')
            : '',
          serviceEstimateNumber:
            data.serviceEstimate.serviceEstimateNumber ?? '',
          updateServiceEstimateStatus: data.serviceEstimate.status ?? '',
        }
        : null;

      const schedules =
        data.schedules?.map((labor) => ({
          id: labor.id.toString(),
          laborId: labor.rot_id.toString(),
          laborCode: labor.rot_code,
          quantity: labor.quantity.toString(),
          laborDescription: labor.description,
          amount: labor.amount.toString(),
          marginAmount: labor.additionalMargin?.toString() ?? '0',
          discountAmount: labor.discount_percentage?.toString() ?? '0',
          sgst: labor.sgst.toString(),
          cgst: labor.cgst.toString(),
          igst: labor.igst.toString(),
          depreciationPercentage: labor.depreciation_per?.toString() ?? '0',
          customerAmount: labor.customer_amount?.toString() ?? '0',
          insuranceAmount: labor.insurance_amount?.toString() ?? '0',
          totalLabor: labor.laborTotal?.toString() ?? '0',
          repairType: labor.repairTypeId?.toString() ?? '',
          fitId: labor.fitId,
        })) ?? [];

      const oslSchedules =
        data.oslSchedules?.map((labor) => ({
          id: labor.id.toString(),
          laborId: labor.rot_id.toString(),
          laborCode: labor.rot_code,
          quantity: labor.quantity.toString(),
          laborDescription: labor.description,
          amount: labor.amount.toString(),
          marginAmount: labor.additionalMargin?.toString() ?? '0',
          discountAmount: labor.discount_percentage?.toString() ?? '0',
          sgst: labor.sgst.toString(),
          cgst: labor.cgst.toString(),
          igst: labor.igst.toString(),
          depreciationPercentage: labor.depreciation_per?.toString() ?? '0',
          customerAmount: labor.customer_amount?.toString() ?? '0',
          insuranceAmount: labor.insurance_amount?.toString() ?? '0',
          totalLabor: labor.laborTotal?.toString() ?? '0',
          fitId: labor.fitId,
        })) ?? [];

      // const partsIndent = data.partsIndent?.map(part => ({
      //   id: part.id.toString(),
      //   partId: part.item_id.toString(),
      //   partNo: part.item_code,
      //   partDescription: part.item_name,
      //   hsnCode: part.hsn_code,
      //   partQuantity: part.request_quantity.toString(),
      //   receivedQuantity: part.received_quantity,
      //   partRate: part.amount.toString(),
      //   partMargin: null,
      //   partDiscount: "0",
      //   partSgst: part.sgst?.toString() ?? "0",
      //   partCgst: part.cgst?.toString() ?? "0",
      //   partIgst: part.igst?.toString() ?? "0",
      //   depreciationPercentage: null,
      //   fitId: part.fitId
      // })) ?? [];

      const partsIssue =
        data.partsIssue?.map((part) => ({
          id: part.id.toString(),
          partId: part.item_id.toString(),
          partNo: part.item_code,
          partDescription: part.item_name,
          hsnCode: part.items?.hsnCode ?? '',
          partQuantity: part.quantity.toString(),
          receivedQuantity: part.quantity,
          partRate: part.rate.toString(),
          partMargin: null,
          partDiscount: '0',
          partSgst: part.sgst?.toString() ?? '0',
          partCgst: part.cgst?.toString() ?? '0',
          partIgst: part.igst?.toString() ?? '0',
          depreciationPercentage: null,
          fitId: part.fitId,
        })) ?? [];
      finalarr.push({
        transaction: result,
        schedules,
        oslSchedules,
        // partsIndent,
        partsIssue,
        serviceEstimate,
      });
    }
    // console.log('222222222222',serviceEstimate)

    return finalarr;
  } catch (err) {
    logger.error('Job Card Service getJobCardDetailsBridge', err);
    throw err;
  }
};

const updateJobCardMobile = async (reqData, user) => {
  let resObj = {};
  let result = 'failed';
  try {
    if (reqData.updateType === 'data') {
      const labour = reqData.payload.laborSchedules;
      const osl = reqData.payload.oslLaborSchedules;
      const parts = reqData.payload.part;

      // console.log('jobCard update req payload labour -----', labour);
      // console.log('jobCard update req payload OSLlabour -----', osl);
      // console.log('jobCard update req payload Parts -----', parts);

      let jobcardData = await JobCardDao.updateJobCardMobile(reqData, user);
      resObj['jobCardDetail'] = {
        id: jobcardData.id.toString(),
        jobCardNo: jobcardData.job_card_no,
      };

      resObj['laborSchedules'] = [];
      resObj['oslLaborSchedules'] = [];
      resObj['part'] = [];

      // const jobCardExists = await JobCardDao.getJobCard(reqData.jcId);
      // const jcData = {
      //   labor: jobCardExists.schedules || [],
      //   oslLabor: jobCardExists.oslSchedules || [],
      //   part: jobCardExists.partsIndent || []
      // }
      const jobCardExists = await JobCardDao.getJobCard(reqData.jcId);

      const jcData = {
        labor: (jobCardExists.schedules || []).map(
          (item) => item.dataValues || item
        ),
        oslLabor: (jobCardExists.oslSchedules || []).map(
          (item) => item.dataValues || item
        ),
        part: (jobCardExists.partsIndent || []).map(
          (item) => item.dataValues || item
        ),
      };

      const diffLabour = jcData.labor.filter(
        (item1) =>
          !labour.some((item2) => parseInt(item2.id) === parseInt(item1.id))
      );
      const diffOslLabour = jcData.oslLabor.filter(
        (item1) =>
          !osl.some((item2) => parseInt(item2.id) === parseInt(item1.id))
      );
      const diffPartsIndent = jcData.part.filter(
        (item1) =>
          !parts.some((item2) => parseInt(item2.id) === parseInt(item1.id))
      );

      // console.log(
      //   'Deleting Labour IDs: ',
      //   diffLabour.map((l) => l.id)
      // );
      // console.log(
      //   'Deleting OSL Labour IDs: ',
      //   diffOslLabour.map((l) => l.id)
      // );
      // console.log(
      //   'Deleting Parts IDs: ',
      //   diffPartsIndent.map((l) => l.id)
      // );

      for (const lab of diffLabour) {
        if (lab.id !== undefined && lab.id !== null) {
          await JobCardDao.deleteSingleLaborSchedule(lab.id);
        }
      }

      for (const lab of diffOslLabour) {
        if (lab.id !== undefined && lab.id !== null) {
          await JobCardDao.deleteSingleOslLaborSchedule(lab.id);
        }
      }

      for (const lab of diffPartsIndent) {
        if (lab.id !== undefined && lab.id !== null) {
          await JobCardDao.deleteSinglePartsIndent(lab.id);
        }
      }

      // const diffLabour = jcData.labor.filter(item1 => !labour.some(item2 => item2.id === item1.id));
      // for (const lab of diffLabour){
      //   if(lab.id !== undefined && lab.id !== null) {
      //     await JobCardDao.deleteSingleLaborSchedule(lab.id);
      //   }
      // }

      // const diffOslLabour = jcData.oslLabor.filter(item1 => !osl.some(item2 => item2.id === item1.id));
      // for (const lab of diffOslLabour){
      //   if(lab.id !== undefined && lab.id !== null) {
      //     await JobCardDao.deleteSingleOslLaborSchedule(lab.id);
      //   }
      // }

      // const diffPartsIndent = jcData.part.filter(item1 => !parts.some(item2 => item2.id === item1.id));
      // for (const lab of diffPartsIndent){
      //   if(lab.id !== undefined && lab.id !== null) {
      //     await JobCardDao.deleteSinglePartsIndent(lab.id);
      //   }
      // }

      for (const schedulesObj of labour) {
        let labourData = {};
        // if (schedulesObj.id !== undefined && schedulesObj.id !== null && jcData.labor.find(item => schedulesObj.id === item.id) === undefined){
        //   await JobCardDao.deleteSingleLaborSchedule()
        // }
        schedulesObj['transactionId'] = reqData.jcId;
        if (schedulesObj.id !== undefined && schedulesObj.id !== null) {
          labourData = await JobCardDao.updateScheduleMobile(
            schedulesObj,
            user
          );
        } else {
          labourData = await JobCardDao.createScheduleMobile(
            schedulesObj,
            user
          );
        }
        const values = labourData.get
          ? labourData.get({ plain: true })
          : labourData;
        // console.log('after update response schedulesObj ------------', values);
        // resObj["laborSchedules"].push({
        //   id: labourData.id.toString(),
        //   laborId: labourData.rot_id.toString(),
        //   fitId: labourData.fitId.toString()
        // })

        resObj.laborSchedules.push({
          id: values.id != null ? values.id.toString() : null,
          laborId: values.rot_id != null ? values.rot_id.toString() : null,
          fitId: values.fitId != null ? values.fitId.toString() : null,
        });
      }

      // for (const oslSchedulesObj of osl) {
      //   let oslData = {};
      //   const osl = await JobCardDao.getOslByVendor(oslSchedulesObj.vendorId, reqData.jcId);
      //   if (osl) {
      //     // OSL record exists, use existing OSL Bill Number
      //     oslSchedulesObj["oslBillNo"] = osl.osl_bill_no;
      //   } else {
      //     // OSL record does not exist, generate a new OSL Bill Number
      //     const oslBillNo = await generateOSLBill("WOB", user.outlet.outletCode);
      //     oslSchedulesObj["oslBillNo"] = oslBillNo;
      //   }
      //   oslSchedulesObj["transactionId"] = reqData.jcId;

      //   if (oslSchedulesObj.id !== undefined && oslSchedulesObj.id !== null) {
      //     oslData = await JobCardDao.updateOslScheduleMobile(oslSchedulesObj, user);
      //   }
      //   else {
      //     oslData = await JobCardDao.createOslScheduleMobile(oslSchedulesObj, user);
      //   }
      //   resObj["oslLaborSchedules"].push({
      //     id: oslData.id.toString(),
      //     laborId: oslData.rot_id.toString(),
      //     fitId: oslData.fitId.toString()
      //   })
      // };

      for (const oslSchedulesObj of osl) {
        let oslData = {};
        const oslExisting = await JobCardDao.getOslByVendor(
          oslSchedulesObj.vendorId,
          reqData.jcId
        );

        if (oslExisting) {
          oslSchedulesObj['oslBillNo'] = oslExisting.osl_bill_no;
        } else {
          const oslBillNo = await generateOSLBill(
            'WOB',
            user.outlet.outletCode
          );
          oslSchedulesObj['oslBillNo'] = oslBillNo;
        }

        oslSchedulesObj['transactionId'] = reqData.jcId;

        if (oslSchedulesObj.id !== undefined && oslSchedulesObj.id !== null) {
          oslData = await JobCardDao.updateOslScheduleMobile(
            oslSchedulesObj,
            user
          );
        } else {
          oslData = await JobCardDao.createOslScheduleMobile(
            oslSchedulesObj,
            user
          );
        }
        const values = oslData.get ? oslData.get({ plain: true }) : oslData;
        // console.log(
        //   'after update response oslSchedulesObj ------------',
        //   values
        // );
        resObj['oslLaborSchedules'].push({
          // id: oslData.id.toString(),
          // laborId: oslData.rot_id.toString(),
          // fitId: oslData.fitId.toString()

          id: values.id != null ? values.id.toString() : null,
          laborId: values.rot_id != null ? values.rot_id.toString() : null,
          fitId: values.fitId != null ? values.fitId.toString() : null,
        });
      }

      for (const part of parts) {
        let partsData = {};
        part['transactionId'] = reqData.jcId;
        if (part.id !== undefined && part.id !== null) {
          partsData = await JobCardDao.updatePartsIndentMobile(part, user);
        } else {
          partsData = await JobCardDao.createPartsIndentMobile(part, user);
        }
        const values = partsData.get
          ? partsData.get({ plain: true })
          : partsData;
        // console.log('after update response partsData ------------', values);
        resObj['part'].push({
          // id: partsData.id.toString(),
          // partId: partsData.item_id.toString(),
          // fitId: partsData.fitId.toString()

          id: values.id != null ? values.id.toString() : null,
          partId: values.rot_id != null ? values.rot_id.toString() : null,
          fitId: values.fitId != null ? values.fitId.toString() : null,
        });
      }
      result = 'success';
    } else if (reqData.updateType === 'status') {
      let jobcardData = await JobCardDao.updateJobCardMobile(reqData, user);
      resObj['jobCardDetail'] = {
        id: jobcardData.id.toString(),
        jobCardNo: jobcardData.job_card_no,
      };
      result = 'success';
    }
  } catch (err) {
    logger.error('Job Card Service updateJobCardMobile', err);
    resObj['result'] = 'failed';
  }
  resObj['result'] = result;
  // console.log(resObj);
  return resObj;
};

const createGatepassMobile = async (reqData, user) => {
  let resObj = {};
  let result = 'failed';
  try {
    let jobcardData = await JobCardDao.createGatepassMobile(reqData, user);
    resObj['jobCardDetail'] = {
      id: jobcardData.id,
      jobCardNo: jobcardData.job_card_no,
    };
    result = 'success';
  } catch (err) {
    logger.error('Job Card Service createGatepassMobile', err);
  }
  resObj['result'] = result;
  return resObj;
};

const getJobCardStatement = async (reqData, user) => {
  try {
    const { totalItems, data } = await JobCardDao.listJobCardStatement(
      reqData,
      user
    );
    let finalArray = [];
    let sno = 1;
    // for (const item of data.data){
    const dataWithCustomHeaders = data.forEach((item, index) => {
      const createdDate = item?.createdAt
        ? moment(item.createdAt)
          .tz('Asia/Kolkata')
          .format('DD-MM-YYYY HH:mm:ss')
        : '';

      const commonObj = {
        outletId: item.outlet_id ?? '',
        outletCode: item.outlet_code ?? '',
        docType: item.document_type ?? '',
        jobCardNo: item.job_card_no ?? '',
        jobCardDate: createdDate ?? '',
        vehicleMake: item.vehicle.make.makeName ?? '',
        vehicleModel: item.vehicle.model.modelName ?? '',
        regNo: item.reg_no ?? '',
        chassisNo: item.vehicle.chassisNumber ?? '',
        engineNo: item.vehicle.engineNumber ?? '',
        customerName: item.customer_name ?? '',
        mobileNo: item.customer_mobileNumber ?? '',
        email: item.customer_email ?? '',
        landline: '' ?? '',
        customerType: item.customer_type ?? '',
        source: item.sources.sourceName ?? '',
        sourceType: item.sourcetype.sourceTypeName ?? '',
        kmReading: item.odometer ?? '',
        serviceAdvisor: user.employeeName ?? '',
        status: item.status ?? '',
        status_value: item.status_value ?? '',
        email: item.created_by ?? '',
        customerGSTIN: item.customer_gstin ?? '',
        insuranceCompanyGSTIN: item.insurance?.gstin_number ?? '',
        insuranceCompanyCode: item.insurance?.insurance_provider_id ?? '',
        insuranceCompanyName: item.insurance?.insurance_provider_name ?? '',
        insuranceExpiryDate: item.insurance?.policy_exp_date ?? '',
        billNo: item.billing?.bill_no ?? '',
        billDate: item.billing?.createdAt ?? '',
        promisedDeliveryDate: item.billing?.delivery_date ?? '',
        promisedDeliveryTime: item.billing?.delivery_date ?? '',
        otdStatus: item.otd_reason_id ?? '',
        otdFailureReason: item.otd_reason ?? '',
        jobCardCreatedDate: createdDate ?? '',
      };

      const calcLabour = commonLogic.calcSchedules(
        item?.schedules,
        item?.document_type
      );
      for (const labor of calcLabour.labour) {
        if (item?.jobcard?.document_type === 'RJC') {
          const laborObj = {
            autoId: sno++,
            itemIndication: 'L',
            itemCode: labor.rot_code ?? '',
            itemName: labor.description ?? '',
            repairType: labor.repairTypeName ?? '',
            reqQty: '',
            issuedQty: labor.quantity ?? '',
            returnedQty: '',
            cancelledQty: '',
            estCost: labor.rateWithdisc ?? '',
            rate: labor.rateWithdisc ?? '',
            discount: labor.discount ?? '',
            cgstPer: labor.cgst ?? '',
            cgst: labor.cgstamt ?? '',
            sgstPer: labor.sgst ?? '',
            sgst: labor.sgstamt ?? '',
            igstPer: labor.igst ?? '',
            igst: labor.igstamt ?? '',
            totalTax: labor.totalTax ?? '',
            totalAmount: labor.totalamt ?? '',
            cancellationType: '' ?? '', //
            cancellationDate: '' ?? '', //
            cancellationRemarks: '' ?? '', //
            indentNumber: '' ?? '', //
            membershipExpiry: '' ?? '', //
            membershipNo: '' ?? '', //
            customerLiability: labor.totalCustomeramt ?? '',
            insurerLiability: labor.totalInsuranceamt ?? '',
            axCode: '' ?? '', //
            couponCode: '' ?? '', //
            couponValue: '' ?? '', //
            labourCategory: '' ?? '', //
            labourSubCategory: '' ?? '', //
          };

          const finalObj = { ...commonObj, ...laborObj };
          finalArray.push(finalObj);
        } else {
          const laborObj = {
            autoId: sno++,
            itemIndication: 'L',
            itemCode: labor.rot_code ?? '',
            itemName: labor.description ?? '',
            repairType: labor.repairTypeName ?? '',
            reqQty: '',
            issuedQty: labor.quantity ?? '',
            returnedQty: '',
            cancelledQty: '',
            estCost: labor.rateWithdisc ?? '',
            rate: labor.rateWithdisc ?? '',
            discount: labor.discount ?? '',
            cgstPer: labor.cgst ?? '',
            cgst: labor.cgstamt ?? '',
            sgstPer: labor.sgst ?? '',
            sgst: labor.sgstamt ?? '',
            igstPer: labor.igst ?? '',
            igst: labor.igstamt ?? '',
            totalTax: labor.totalTax ?? '',
            totalAmount: labor.totalamt ?? '',
            cancellationType: '' ?? '', //
            cancellationDate: '' ?? '', //
            cancellationRemarks: '' ?? '', //
            indentNumber: '' ?? '', //
            membershipExpiry: '' ?? '', //
            membershipNo: '' ?? '', //
            customerLiability: labor.totalCustomeramt ?? '',
            insurerLiability: labor.totalInsuranceamt ?? '',
            axCode: '' ?? '', //
            couponCode: '' ?? '', //
            couponValue: '' ?? '', //
            labourCategory: '' ?? '', //
            labourSubCategory: '' ?? '', //
          };

          const finalObj = { ...commonObj, ...laborObj };
          finalArray.push(finalObj);
        }
      }
      // for( const labor of item.schedules){
      //   const laborObj = {
      //     autoId: sno ++,
      //     itemIndication: 'L',
      //     itemCode: labor.rot_id ?? '',
      //     itemName: labor.rot_code ?? '',
      //     repairType: labor.repairTypeName ?? '',
      //     reqQty: '',
      //     issuedQty: labor.quantity ?? '',
      //     returnedQty: "",
      //     cancelledQty: "",
      //     estCost: labor.amount ?? '',
      //     rate: labor.singleAmount ?? '',
      //     discount: labor.discount_percentage ?? '',
      //     cgstPer: labor.cgst ?? '',
      //     cgst: (labor.cgst*labor.singleAmount / 100).toFixed(2) ?? '',
      //     sgstPer: labor.sgst ?? '',
      //     sgst: (labor.sgst*labor.singleAmount / 100).toFixed(2) ?? '',
      //     igstPer: labor.igst ?? '',
      //     igst: (labor.igst*labor.singleAmount / 100).toFixed(2) ?? '',
      //     totalTax: labor.laborTotal - labor.amount + labor.discount_percentage ?? '',
      //     totalAmount: labor.laborTotal ?? '',
      //     cancellationType: "" ?? '', //
      //     cancellationDate: "" ?? '', //
      //     cancellationRemarks: "" ?? '', //
      //     indentNumber: "" ?? '', //
      //     membershipExpiry: "" ?? '', //
      //     membershipNo: "" ?? '', //
      //     customerLiability: labor.customer_amount ?? '',
      //     insurerLiability: labor.insurance_amount ?? '',
      //     axCode: "" ?? '', //
      //     couponCode: "" ?? '', //
      //     couponValue: "" ?? '', //
      //     labourCategory: "" ?? '', //
      //     labourSubCategory: "" ?? '', //
      //   }

      //   const finalObj = {...commonObj, ...laborObj};
      //   finalArray.push(finalObj);
      // }

      const calcOslLabour = commonLogic.calcOslSchedules(
        item?.oslSchedules,
        item?.document_type
      );
      for (const labor of calcOslLabour.labour) {
        if (item?.jobcard?.document_type === 'RJC') {
          const laborObj = {
            autoId: sno++,
            itemIndication: 'L',
            itemCode: labor.rot_code ?? '',
            itemName: labor.description ?? '',
            repairType: '',
            reqQty: '',
            issuedQty: labor.quantity ?? '',
            returnedQty: '',
            cancelledQty: '',
            estCost: labor.totalval ?? '',
            rate: labor.totalval ?? '',
            discount: labor.discount ?? '',
            cgstPer: labor.cgst ?? '',
            cgst: labor.cgstamt ?? '',
            sgstPer: labor.sgst ?? '',
            sgst: labor.sgstamt ?? '',
            igstPer: labor.igst ?? '',
            igst: labor.igstamt ?? '',
            totalTax: labor.totalTax ?? '',
            totalAmount: labor.totalamt ?? '',
            cancellationType: '' ?? '', //
            cancellationDate: '' ?? '', //
            cancellationRemarks: '' ?? '', //
            indentNumber: '' ?? '', //
            membershipExpiry: '' ?? '', //
            membershipNo: '' ?? '', //
            customerLiability: labor.totalCustomeramt ?? '',
            insurerLiability: labor.totalInsuranceamt ?? '',
            axCode: '' ?? '', //
            couponCode: '' ?? '', //
            couponValue: '' ?? '', //
            labourCategory: '' ?? '', //
            labourSubCategory: '' ?? '', //
          };

          const finalObj = { ...commonObj, ...laborObj };
          finalArray.push(finalObj);
        } else {
          const laborObj = {
            autoId: sno++,
            itemIndication: 'L',
            itemCode: labor.rot_code ?? '',
            itemName: labor.description ?? '',
            repairType: '',
            reqQty: '',
            issuedQty: labor.quantity ?? '',
            returnedQty: '',
            cancelledQty: '',
            estCost: labor.totalval ?? '',
            rate: labor.totalval ?? '',
            discount: labor.discount ?? '',
            cgstPer: labor.cgst ?? '',
            cgst: labor.cgstamt ?? '',
            sgstPer: labor.sgst ?? '',
            sgst: labor.sgstamt ?? '',
            igstPer: labor.igst ?? '',
            igst: labor.igstamt ?? '',
            totalTax: labor.totalTax ?? '',
            totalAmount: labor.totalamt ?? '',
            cancellationType: '' ?? '', //
            cancellationDate: '' ?? '', //
            cancellationRemarks: '' ?? '', //
            indentNumber: '' ?? '', //
            membershipExpiry: '' ?? '', //
            membershipNo: '' ?? '', //
            customerLiability: labor.totalCustomeramt ?? '',
            insurerLiability: labor.totalInsuranceamt ?? '',
            axCode: '' ?? '', //
            couponCode: '' ?? '', //
            couponValue: '' ?? '', //
            labourCategory: '' ?? '', //
            labourSubCategory: '' ?? '', //
          };

          const finalObj = { ...commonObj, ...laborObj };
          finalArray.push(finalObj);
        }
      }
      // for( const labor of item.oslSchedules){
      //   const laborObj = {
      //     autoId: sno ++,
      //     itemIndication: 'L',
      //     itemCode: labor.rot_id ?? '',
      //     itemName: labor.rot_code ?? '',
      //     repairType: '',
      //     reqQty: '',
      //     issuedQty: labor.quantity ?? '',
      //     returnedQty: "",
      //     cancelledQty: "",
      //     estCost: labor.amount ?? '',
      //     rate: labor.amount ?? '',
      //     discount: labor.discount_percentage ?? '',
      //     cgstPer: labor.cgst ?? '',
      //     cgst: (labor.cgst*labor.amount / 100).toFixed(2) ?? '',
      //     sgstPer: labor.sgst ?? '',
      //     sgst: (labor.sgst*labor.amount / 100).toFixed(2) ?? '',
      //     igstPer: labor.igst ?? '',
      //     igst: (labor.igst*labor.amount / 100).toFixed(2) ?? '',
      //     totalTax: labor.laborTotal - labor.amount + labor.discount_percentage ?? '',
      //     totalAmount: labor.laborTotal ?? '',
      //     cancellationType: "" ?? '', //
      //     cancellationDate: "" ?? '', //
      //     cancellationRemarks: "" ?? '', //
      //     indentNumber: "" ?? '', //
      //     membershipExpiry: "" ?? '', //
      //     membershipNo: "" ?? '', //
      //     customerLiability: labor.customer_amount ?? '',
      //     insurerLiability: labor.insurance_amount ?? '',
      //     axCode: "" ?? '', //
      //     couponCode: "" ?? '', //
      //     couponValue: "" ?? '', //
      //     labourCategory: "" ?? '', //
      //     labourSubCategory: "" ?? '', //
      //   }

      //   const finalObj = {...commonObj, ...laborObj};
      //   finalArray.push(finalObj);
      // }

      const calcPartsIssue = commonLogic.calcPartsIssue(item.partsIssue);

      for (const labor of calcPartsIssue.parts) {
        const cgstAmount = labor.cgstamt;
        const sgstAmount = labor.sgstamt;
        const igstAmount = labor.igstamt;
        const laborObj = {
          autoId: sno++,
          itemIndication: 'P',
          itemCode: labor.item_code ?? '',
          itemName: labor.item_name ?? '',
          repairType: '',
          reqQty: '',
          issuedQty: labor.quantity.toFixed(2) ?? '',
          returnedQty: '',
          cancelledQty: '',
          estCost: labor.cost ?? '',
          rate: labor.rate ?? '',
          discount: '0.00',
          cgstPer: labor.cgst ?? '',
          cgst: cgstAmount ?? '',
          sgstPer: labor.sgst ?? '',
          sgst: sgstAmount ?? '',
          igstPer: labor.igst ?? '',
          igst: igstAmount ?? '',
          totalTax:
            parseFloat(igstAmount) === 0
              ? (parseFloat(cgstAmount) + parseFloat(sgstAmount)).toFixed(2)
              : igstAmount,
          totalAmount: labor.total ?? '',
          cancellationType: '' ?? '', //
          cancellationDate: '' ?? '', //
          cancellationRemarks: '' ?? '', //
          indentNumber: labor.indent_id ?? '', //
          membershipExpiry: '' ?? '', //
          membershipNo: '' ?? '', //
          customerLiability: '',
          insurerLiability: '',
          axCode: '' ?? '', //
          couponCode: '' ?? '', //
          couponValue: '' ?? '', //
          labourCategory: '' ?? '', //
          labourSubCategory: '' ?? '', //
        };

        const finalObj = { ...commonObj, ...laborObj };
        finalArray.push(finalObj);
      }
      // }
    });

    let count = finalArray.length;

    if (reqData.offset && reqData.offset > 0) {
      finalArray = finalArray.slice(reqData.offset);
    }

    if (finalArray.length > reqData.limit) {
      finalArray = finalArray.slice(0, reqData.limit);
    }

    return { totalItems: count, data: finalArray };
  } catch (err) {
    logger.error('JobCard service getJobCardStatement', err);
  }
};

const getMechanicEfficiency = async (reqData, user) => {
  try {
    const data = await JobCardDao.getMechanicEfficiency(reqData, user);
    // for(const item of data) {
    let dataWithCustomHeaders = data.map((item, index) => {
      const startTime = moment(item.dataValues.start_time)
        .tz('Asia/kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const endTime = moment(item.dataValues.end_time)
        .tz('Asia/kolkata')
        .format('DD-MM-YYYY HH:mm:ss');

      const endDate = moment(item.dataValues.end_time)
        .tz('Asia/kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const createdAt = moment(item.dataValues.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY');

      let billingRateIs = '';
      let revenueIs = '';
      let efficiencyIs = '';
      if (
        item.mechanicMap &&
        item.mechanicMap.mechanic_hrs.split('h')[0].trim() > 0
      ) {
        billingRateIs =
          item.jobcard.schedules[0].amount /
          item.mechanicMap.mechanic_hrs.split('h')[0].trim();
        if (item.jobcard.schedules[0].amount / item.mechanicMap.stdhrs) {
          revenueIs =
            ((billingRateIs -
              item.jobcard.schedules[0].amount / item.mechanicMap.stdhrs) /
              (item.jobcard.schedules[0].amount / item.mechanicMap.stdhrs)) *
            100;
        } else {
          revenueIs = 0;
        }
      } else {
        billingRateIs = item.jobcard.schedules[0].amount;
      }

      if (
        item.mechanicMap &&
        item.mechanicMap.mechanic_hrs.split('h')[0].trim() > 0
      ) {
        efficiencyIs =
          (item.mechanicMap.stdhrs /
            item.mechanicMap.mechanic_hrs.split('h')[0].trim()) *
          100;
      }

      return {
        autoId: index + 1,
        outletId: item.jobcard.outlet_id ?? '',
        outletCode: item.jobcard.outlet_code ?? '',
        labourCode: item.mechanicMap ? item.mechanicMap.labour_code : '',
        labourName: item.mechanicMap ? item.mechanicMap.labour_code : '',
        mechanicCode: item.mechanicMap
          ? item.mechanicMap.employee.employeeCode
          : '',
        mechanicName: item.mechanicMap ? item.mechanicMap.mechanic_name : '',
        mechanicPer: item.mechanicMap ? item.mechanicMap.percentage : '',
        marginAmt: item.jobcard
          ? item.jobcard.schedules[0].additionalMargin
          : '',
        labourAmount: item.total_amount ?? '',
        splitAmt: item.total_amount / 2,
        standardDuration: item.mechanicMap ? item.mechanicMap.stdhrs : '',
        actualDuration: item.mechanicMap ? item.mechanicMap.mechanic_hrs : '',
        billingRate: billingRateIs ? billingRateIs : '',
        revenue: revenueIs ?? '',
        efficiency: efficiencyIs ?? '',
        jobCardNo: item.jobcard.job_card_no ?? '',
        billDate: endDate ?? '',
        regNo: item.jobcard.reg_no ?? '',
        chassisNo: item.jobcard.vehicle.chassisNumber ?? '',
        engineNo: item.jobcard.vehicle.engineNumber ?? '',
        make: item.jobcard.vehicle.make.makeName ?? '',
        model: item.jobcard.vehicle.model.modelName ?? '',
        reason: item.mechanicMap ? item.mechanicMap.reason : '',
        invoiceDate: item.createdAt,
        startTime: startTime ?? '',
        endTime: endTime ?? '',
        jobCardDate: item.jobcard.createdAt,
      };
    });
    // };

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    }

    if (dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    }

    return { totalItems: count, data: dataWithCustomHeaders };
  } catch (err) {
    logger.error('Jobcard service getMechanicEfficiency', err);
  }
};

const encryptJc = async (status) => {
  try {
    return await JobCardDao.encryptJc(status);
  } catch (err) {
    logger.error('Jobcard service encryptJc', err);
  }
};
const updatePartApprove = async (body, user) => {
  try {
    return await JobCardDao.updatePartApprove(body, user);
  } catch (err) {
    logger.error('Jobcard service updatePartApprove', err);
  }
};
const updateCreditApproval = async (body, user) => {
  try {
    return await JobCardDao.updateCreditApproval(body, user);
  } catch (err) {
    logger.error('Jobcard service updatePartApprove', err);
  }
};

const jcUpdateByFit = async (body, user) => {
  try {
    return await JobCardDao.jcUpdateByFit(body, user);
  } catch (err) {
    logger.error('Jobcard service jcUpdateByFit err:', err);
    throw err;
  }
};

const getJobCardForEtaUpdate = async (body, user) => {
  try {
    const data = await JobCardDao.getJobCardForEtaUpdate(body.id, user);
    const formattedData = [];
    for (const jobCard of data) {
      const resObj = {};
      let etaformat = jobCard.eta
        ? jobCard.eta.split('-').reverse().join('-')
        : null;
      resObj['Parts Code'] = jobCard['item_code'];
      resObj['item_id'] = jobCard['item_id'];
      resObj['Description'] = jobCard['item_name'];
      resObj['Hsn Code'] = jobCard['hsnCode']; // Ensure vehicle and make are present
      resObj['Requested Qty'] = jobCard['request_quantity']; // Ensure vehicle and model are present
      resObj['Available Stock Qty'] = jobCard['quantity']
        ? jobCard['quantity']
        : 0;
      resObj['indent_id'] = jobCard.id;
      (resObj['ETA'] = etaformat), (resObj['Remarks'] = jobCard.remarks);
      formattedData.push(resObj);
    }
    return formattedData;
  } catch (err) {
    logger.error(' Jobcard fetching error', err);
  }
};

const UploadVerificationDetails = async (body, user) => {
  let data = {};
  try {
    const findExisting = await TransUpload.findOne({
      where: { transaction_id: body.transaction_id },
    });
    if (findExisting) {
      data = await TransUpload.update(body, {
        where: { transaction_id: body.transaction_id },
      });
    } else {
      data = await TransUpload.create(body);
    }
  } catch (err) {
    logger.error('Add Transaction Upload', err);
    next(err);
  }

  return data;
};

export const getVerificationDetails = async (body, user) => {
  try {
    const IMAGE_FIELDS = [
      'basic_vehicle_photo',
      'insurance_copy',
      'rc_copy',
      'licence_copy',
      'filled_claim_form',
      'permit_copy',
      'fitness_certificate_copy',
      'gd_fir_entry',
      'pan_card_copy',
      'customer_photo_copy',
      'aadhar_copy',
      'kyc_copy',
      'estimate_copy',
      'satisfaction_voucher',
      'damage_photos',
      'reinspection_photos',
      'payment_receipt_copy',
    ];

    const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
    let data = await TransUpload.findOne({
      where: { transaction_id: body.transaction_id },
    });

    if (!data) return null;

    let updatePayload = {};

    for (let field of IMAGE_FIELDS) {
      const normalUrl = data[field];

      if (!normalUrl) continue;
      // check if signed url already exists and not expired
      let isSignedUrlValid =
        data[`${field}_signed_url`] &&
        data[`${field}_signed_url`].includes('Expires=');
      if (isSignedUrlValid) {
        const expiresPart = data[`${field}_signed_url`].split('Expires=')[1];

        const expiresTimestamp = parseInt(expiresPart.split('&')[0]) * 1000; // Convert to milliseconds
        if (Date.now() < expiresTimestamp) {
          continue;
        }
      }
      const filePath = normalUrl.split(`${bucketName}/`)[1];
      if (!filePath) continue;

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      updatePayload[`${field}_signed_url`] = signedUrl;
    }

    // Save signed URLs to DB
    await TransUpload.update(updatePayload, {
      where: { transaction_id: body.transaction_id },
    });

    let outputdata = await TransUpload.findOne({
      attributes: IMAGE_FIELDS.map((field) => `${field}_signed_url`),
      where: { transaction_id: body.transaction_id },
    });
    let filternullvalue = {};
    for (const [key, value] of Object.entries(outputdata.dataValues)) {
      if (value !== null) {
        filternullvalue[key] = value;
      }
    }
    return filternullvalue;
  } catch (err) {
    logger.error('Get Transaction Upload Error:', err);
    throw err;
  }
};

const getTopFiveCustomerForGMS = async (user) => {
  try {
    const data = await JobCardDao.getTopFiveCustomerForGMS(user);
    return data;
  } catch (err) {
    logger.error('JobCard service Top Five Customer For GMS Error:', err);
    next(err);
  }
};

const getJobCardStatus = async (jc_no) => {
  try {
    const data = await JobCardDao.getJobCardStatus(jc_no);
    return data;
  } catch (err) {
    logger.error('JobCard service Top Five Customer For GMS Error:', err);
    next(err);
  }
};

const getSingleCustomerView = async (mobile_no, user) => {
  try {
    const data = await JobCardDao.getSingleCustomerView(mobile_no, user);
    return data;
  } catch (err) {
    logger.error('JobCard service Single Customer  View For GMS Error:', err);
    next(err);
  }
};

const getJobCardDetailsCustomerComplant = async (reqData, user) => {
  try {
    const data =
      await JobCardDao.getJobCardDetailsForCustomerComplaint(reqData);
    // console.log('data in service', data);
    let result = {};
    if (data) {
      result = {
        customerName: data?.customer_name ?? '',
        customerMobile: data?.customer_mobileNumber ?? '',
        vehicleRegNo: data?.reg_no ?? '',
        jobCardNo: data?.job_card_no ?? '',

        jobCardCreatedDate: data.createdAt
          ? moment(data.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD')
          : '',
        deliveryDate: data?.billing?.delivery_date
          ? moment(data.billing.delivery_date)
            .tz('Asia/Kolkata')
            .format('YYYY-MM-DD')
          : '',
        make: data.vehicle?.make?.makeName ?? '',
        model: data.vehicle?.model?.modelName ?? '',
        outlet: user.outlet.outletCode,
      };
    }
    return result;
  } catch (err) {
    logger.error('Job Card Service getJobCardDetailsBridge', err);
    throw err;
  }
};

const getpreviousvisits = async (req) => {
  try {
    const results = await JobCardDao.getpreviousvisits(req);

    let previousVehicleResponse = {};
    let vehicleDetails = {};
    let customerDetails = {};
    let visitMetadata = {};
    let leadDetails = {};
    let FLAResponse = {};

    if (results.PreviousVehicle == true) {
      const vehicleSearch = results.vehicleSearch;
      const formatDate = (isoDate) => {
        const date = new Date(isoDate);

        return date.getFullYear() + "-" +
          String(date.getMonth() + 1).padStart(2, '0') + "-" +
          String(date.getDate()).padStart(2, '0') + " " +
          String(date.getHours()).padStart(2, '0') + ":" +
          String(date.getMinutes()).padStart(2, '0') + ":" +
          String(date.getSeconds()).padStart(2, '0');
      };
      previousVehicleResponse = {
        "vehicleExists": true,
        "visitStatus": vehicleSearch.fit_status,
        "visitTime": formatDate(vehicleSearch.createdAt),
        "outletCode": vehicleSearch.outlet_code,
        "assignedSa": vehicleSearch.user.employee.employeeName,
        "name": vehicleSearch.customer_name,
        "chasseNo": vehicleSearch.vehicle.chassisNumber,
        "engNo": vehicleSearch.vehicle.engineNumber
      }
      return {
        VehicleStauts: true,
        previousVehicleResponse: previousVehicleResponse
      }
    } else if (results.VehiclePresent == true) {
      if (results.vehicleDetails) {
        const vehicleDataResponse = results.vehicleDetails;
        const customerDataResponse = results.vehicleDetails.customer;

        vehicleDetails = {
          vehicleID: vehicleDataResponse.id,
          vehicleNumber: vehicleDataResponse.registrationNumber,
          chassisNumber: vehicleDataResponse.chassisNumber,
          engineNumber: vehicleDataResponse.engineNumber,
          makeId: vehicleDataResponse.makeId,
          modelId: vehicleDataResponse.modelId,
          variantId: vehicleDataResponse.variantId,
          segment: 'B',
          odometerReading: vehicleDataResponse.odometer,
          insuranceProvider: null,
          insuranceExpDate: vehicleDataResponse.insuranceExpDate,
          fuelType: vehicleDataResponse.fuelTypeDetails.id,
          vehicleUsedBy: null,
          motorNumber: null,
          mcu: null,
          batteryNo_1: null,
          batteryNo_2: null,
          chargerNo: null,
          imei: null,
          colourCode: null,
          insurancePolicyNo: null
        }


        customerDetails = {
          customerID: customerDataResponse.id,
          customerFirstName: customerDataResponse.firstName,
          customerLastName: customerDataResponse.lastName,
          customerCode: customerDataResponse.customerCode,
          phoneNumber: customerDataResponse.mobileNumber,
          emailId: customerDataResponse.emailId,
          addressLine1: customerDataResponse.address1,
          addressLine2: customerDataResponse.address2,
          state: customerDataResponse.state,
          city: customerDataResponse.city,
          pinCode: customerDataResponse.pinCode,
          source: customerDataResponse.sourceId,
          sourceType: customerDataResponse.sourceTypeId,
          contactPersonNumber: customerDataResponse.contactPersonNumber,
          gstinNumber: customerDataResponse.gstinNumber,
          customerCategory: customerDataResponse.Category.id,
          b2bApprove: null,
          RJCTASL: customerDataResponse.is_b2b == 1 ? true : false,
        }

        visitMetadata = {
          pinCode: customerDataResponse.pinCode,
          gstinNumber: customerDataResponse.gstinNumber,
          everestStatus: false,
          vehicleUsedBy: "",
          alternateNumber: "",
          customerCategory: customerDataResponse.Category.id,
          insuranceCompany: "",
          manufacturingYear: vehicleDataResponse.manufacturingYear
        }
      }

      if (Object.keys(results.customerDetails).length > 0) {
        const customerDataResponse = results.customerDetails;
        customerDetails = {
          customerID: customerDataResponse.id,
          customerFirstName: customerDataResponse.firstName,
          customerLastName: customerDataResponse.lastName,
          customerCode: customerDataResponse.customerCode,
          phoneNumber: customerDataResponse.mobileNumber,
          emailId: customerDataResponse.emailId,
          addressLine1: customerDataResponse.address1,
          addressLine2: customerDataResponse.address2,
          state: customerDataResponse.state,
          city: customerDataResponse.city,
          pinCode: customerDataResponse.pinCode,
          source: customerDataResponse.sourceId,
          sourceType: customerDataResponse.sourceTypeId,
          contactPersonNumber: customerDataResponse.contactPersonNumber,
          gstinNumber: customerDataResponse.gstinNumber,
          customerCategory: customerDataResponse.Category.id,
          b2bApprove: null,
          RJCTASL: customerDataResponse.is_b2b == 1 ? true : false
        }
      }

      if (results.leadData) {
        const leadDetailsresponse = results.leadData;
        leadDetails = {
          DMS_BOOKING_ID: leadDetailsresponse.id,
          DMS_BOOKING_NUMBER: leadDetailsresponse.serviceBookingNumber,
          STATUS: 'PROG',
          VISIT_ID: null,
          FIT_STATUS: 'LEAD_CREATED',
          DRIVER_ID: null,
          DRIVER_NAME: '',
          DRIVER_NUMBER: null,
          PICKUP_DATETIME: null,
          ASSIGNED_PICKUP_ID: null,
          TP_BOOKING_NUMBER: 'Need to Check',
          OUTLET_CODE: leadDetailsresponse.outletId,
          BOOKING_DATE: leadDetailsresponse.createdAt,
          VEHICLE_NUMBER: leadDetailsresponse.registrationNumber,
          VEHICLE_ID: leadDetailsresponse.vehicleId,
          VEHICLE_MAKE: leadDetailsresponse.vehicleMakeId,
          VEHICLE_MODEL: leadDetailsresponse.vehicleModelId,
          ODOMETER_READING: leadDetailsresponse.odometer,
          CUSTOMER_NAME: leadDetailsresponse.customerName,
          CUSTOMER_PHONE: leadDetailsresponse.customerMobileNumber,
          CUSTOMER_ADDRESS: leadDetailsresponse.customerAddress,
          CUSTOMER_STATE: leadDetailsresponse.customerState,
          CUSTOMER_CITY: leadDetailsresponse.customerCity,
          CUSTOMER_PINCODE: leadDetailsresponse.pincode,
          SHOP_ID: 'Need to Check',
          SHOP_NAME: 'Need to Check',
          GOBUMPR_BOOKING_ID: 'Need to Check',
          DISPOSITION: leadDetailsresponse.disposition.disPositionCode,
          ORDER_SOURCE: leadDetailsresponse.source,
          DMS_SOURCE: leadDetailsresponse.dmsSourceId,
          DMS_SOURCE_TYPE: leadDetailsresponse.dmsSourceTypeId,
          PAYMENT_ID: null,
          TRANSACTION_ID: null,
          AMOUNT: null,
          PAYMENT_RESPONSE: null,
          PAYMENT_DATE: null,
          PAYMENT_REMARKS: leadDetailsresponse.serviceType,
          CREATED_DATE: leadDetailsresponse.createdAt,
          CREATED_BY: leadDetailsresponse.createdBy,
          UPDATED_DATE: leadDetailsresponse.updatedAt,
          UPDATED_BY: leadDetailsresponse.updatedBy
        }
      }

      if (results.FLAPresent) {
        if (Object.keys(results.FLAResponseServer).length > 0) {
          const FLAData = results.FLAResponseServer;

          FLAResponse = {
            status: FLAData.status,
            found_by: FLAData.found_by,
            timestamp: FLAData.timestamp,
            error_code: FLAData.error_code,
            description: FLAData.description,
            vehicleClass: FLAData.vehicleClass,
            vehicleClassStatus: FLAData.vehicleClassStatus,
            apiSuccess: FLAData.apiSuccess,
            httpcode: FLAData.httpcode,
            result: FLAData.results[0]
          }
        } else if (Object.keys(results.FLAResponseModel).length > 0) {
          const FLAData = results.FLAResponseModel;

          // console.log("FLAData", FLAData);

          const now = new Date();
          const timestamp = now.toString(); // Example: "Fri Nov 07 2025 12:42:55 GMT+0530 (India Standard Time)"

          // To make it look exactly like: Fri Nov 07 12:42:55 IST 2025
          const formatted = timestamp
            .replace("GMT+0530 (India Standard Time)", "IST");

          FLAResponse = {
            status: "100",
            found_by: "regn_no",
            timestamp: formatted,
            description: "Record found",
            apiSuccess: "true",
            httpcode: "200",
            result: {
              vehicle: {
                regn_no: req.VehicleRegNo,
                state_cd: FLAData.VEHICLE_STATE_CODE,
                rto_cd: FLAData.VEHICLE_RTO_CODE,
                rto_name: FLAData.VEHICLE_RTO_NAME,
                chasi_no: FLAData.VEHICLE_CHASI_NO,
                eng_no: FLAData.VEHICLE_ENGINE_NO,
                regn_dt: FLAData.VEHICLE_REGISTERED_DATE,
                vehicle_age: FLAData.VEHICLE_AGE,
                purchase_dt: FLAData.VEHICLE_PURCHASE_DATE,
                vh_class_desc: FLAData.VEHICLE_CLASS_DESCRIPTION,
                owner_sr: FLAData.VEHICLE_OWNER_SR,
                pucc_no: FLAData.VEHICLE_PUCC_NO,
                pAddress: FLAData.VEHICLE_PERMANENT_ADDRESS,
                cAddress: FLAData.VEHICLE_CURRENT_ADDRESS,
                maker_desc: FLAData.VEHICLE_MAKE,
                maker_model: FLAData.VEHICLE_MODEL,
                color: FLAData.VEHICLE_COLOR,
                fuel_type_desc: FLAData.VEHICLE_FUEL_TYPE,
                cubic_cap: FLAData.VEHICLE_CUBIC_CAPACITY,
                manu_yr: FLAData.VEHICLE_MANUFACTURE_YEAR,
                seat_cap: FLAData.VEHICLE_SEAT_CAPACITY,
                fla_rto_geo: FLAData.VEHICLE_FLA_RTO_GEO,
                blacklist_flag: FLAData.VEHICLE_BLACKLIST_FLAG,
                blacklist_status: FLAData.VEHICLE_BLACKLIST_STATUS,
                fit_upto: FLAData.VEHICLE_FIT_UPTO,
                manu_month_yr: FLAData.VEHICLE_MANUFACTURE_MONTH_YEAR,
                noc_details: FLAData.VEHICLE_NOC_DETAILS,
                permit_issue_dt: FLAData.VEHICLE_PERMIT_ISSUE_DATE,
                permit_no: FLAData.VEHICLE_PERMIT_NUMBER,
                permit_type: FLAData.VEHICLE_PERMIT_TYPE,
                commercial_flag: FLAData.VEHICLE_COMMERCIAL_FLAG,
                permit_valid_from: FLAData.VEHICLE_PERMIT_VALID_FROM,
                permit_valid_upto: FLAData.VEHICLE_PERMIT_VALID_UPTO,
                pucc_upto: FLAData.VEHICLE_PUCC_UPTO,
                registered_at: FLAData.VEHICLE_REGISTERED_AT,
                tax_upto: FLAData.VEHICLE_TAX_UPTO,
                father_name: FLAData.VEHICLE_FATHER_NAME,
                owner_name: FLAData.VEHICLE_OWNER_NAME,
              },
              hypth: {
                fncr_name: FLAData.HYPTH_FNCR_NAME,
                pucc_no: FLAData.HYPTH_PUCC_NO
              },
              insurance: {
                insurance_policy_no: FLAData.INSURANCE_POLICY_NUMBER,
                insurance_expired: FLAData.INSURANCE_ISEXPIRED,
                pucc_no: FLAData.INSURANCE_PUCC_NO,
                insurance_comp: FLAData.INSURANCE_COMPANY,
                insurance_upto: FLAData.INSURANCE_EXPIRY_DATE,
              },
            }
          }
        }
      }

      return {
        VehiclePresent: true,
        vehicleDetails: Object.keys(vehicleDetails).length > 0 ? vehicleDetails : null,
        customerDetails: Object.keys(customerDetails).length > 0 ? customerDetails : null,
        visitMetadata: Object.keys(visitMetadata).length > 0 ? visitMetadata : null,
        visitTime: Object.keys(vehicleDetails).length > 0 ? results.vehicleDetails.createdAt : null,
        vahanData: Object.keys(FLAResponse).length > 0 ? FLAResponse : null,
        ...(leadDetails ? { leadDetails: leadDetails } : { leadDetails: null })
      }
    } else {
    }
  } catch (err) {
    logger.error('Jobcard service getpreviousvisits', err);
  }
}

const createJobCardMobileInitial = async (reqData, user) => {
  let result = "success"; //change
  let recentActivityData = {};
  let resObj = {};
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  try {
    const customerData = await getCustomerData(reqData.registrationNumber);
    let createData = {
      registrationNumber: reqData.registrationNumber,
      customerArrivedDate: currentDate,
      odometer: reqData.odometer,
      sourceId: reqData.source,
      sourceTypeId: reqData.sourceType,
      userId: reqData.userId
    }
    let data = await JobCardDao.createJobCardInital(reqData.Parent[0], reqData.visitMetadata, createData, user, customerData);

    if (data && 'bookingNumber' in reqData) {
      const updateBookingTable = db.servicebookings.update({
        visit_id: data.id,
        updatedBy: reqData.userId,
        updatedAt: Utils.getDateTime()
      }, {
        where: {
          id: reqData.bookingNumber
        }
      })

      const updateJobCard = await db.jobCard.update({
        service_booking_id: reqData.bookingNumber
      }, {
        where: {
          id: data.id
        }
      })
    }

    const securityGateinUpdate = await db.securityGateIn.findOne({
      where: {
        vehicle_reg_no: reqData.registrationNumber,
        visit_id: null
      },
      order: [['id', 'DESC']]
    })

    // console.log("securityGateinUpdate",securityGateinUpdate)

    if (securityGateinUpdate !== null) {
      console.log("Inside");
      await securityGateinUpdate.update({
        visit_id: data.id,
        updatedBy: reqData.userId,
        updatedAt: Utils.getDateTime()
      });
    }

    return data;

  } catch (err) {
    logger.error("Job Card Service createJobCardMobileInitial", err);
    // next(err);
  }
}

const getinspectionreport = async (req) => {
  try {
    const results = await JobCardDao.getinspectionreport(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getinspectionreport', err);
  }
}

const getinventorydetails = async (req) => {
  try {
    const results = await JobCardDao.getinventorydetails(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getinventorydetails', err);
  }
}

const getmanagerworklist = async (req) => {
  try {
    const results = await JobCardDao.getmanagerworklist(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getmanagerworklist', err);
  }
}

const getinspectorworklist = async (req) => {
  try {
    const results = await JobCardDao.getinspectorworklist(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getinspectorworklist', err);
  }
}


const getqiworklist = async (req) => {
  try {
    let qiWorkListResponse = [];

    const results = await JobCardDao.getqiworklist(req);

    if (results.qiWorkList) {

      qiWorkListResponse = results.qiWorkList.map(qiWorkList => {
        {

          const date = new Date(qiWorkList.updatedAt);

          const formatted =
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, '0') + "-" +
            String(date.getDate()).padStart(2, '0') + " " +
            String(date.getHours()).padStart(2, '0') + ":" +
            String(date.getMinutes()).padStart(2, '0') + ":" +
            String(date.getSeconds()).padStart(2, '0');

          return {
            VISIT_ID: qiWorkList.id,
            ASSIGNED_SA_USER_ID: qiWorkList.user_sa.user_id,
            VISIT_TIMESTAMP: qiWorkList.createdAt,
            VISIT_STATUS: qiWorkList.fit_status,
            VISIT_LAST_STATUS_CHANGED_TIMESTAMP: formatted,
            VEHICLE_REG_NO: qiWorkList.reg_no,
            JC_STATUS: qiWorkList.status_value,
            OBD_STATUS: "",
            VEHICLE_KM_READING: qiWorkList.odometer,
            VEHICLE_MAKE_ID: qiWorkList.vehicleDetails.makeId,
            VEHICLE_MODEL_ID: qiWorkList.vehicleDetails.modelId,
            CUSTOMER_VOICE: qiWorkList.customer_voice,
            DOC_TYPE: qiWorkList.document_type,
            CHECKLIST_TYPE_CODE: qiWorkList.checklistType.CHECKLIST_TYPE_CODE
          }
        }
      });

      if (qiWorkListResponse.length > 0) {
        return {
          success: true,
          qiWorkListResponse: qiWorkListResponse
        }
      } else {
        return {
          success: false,
        }
      }
    } else {

    }
  } catch (err) {
    logger.error('Jobcard service getqiworklist', err);
  }
}

const getsaworklist = async (req) => {
  try {

    let saWorkListResponse = [];
    let saAppoitmentsResponse = [];
    const results = await JobCardDao.getsaworklist(req);

    if (results.saWorkList) {
      saWorkListResponse = results.saWorkList.map(saWorkList => {

        let assignedTechnicianId = "";

        if (saWorkList.user_tech !== null) {
          // assignedTechnicianId = saWorkList.user_tech.employee.employeeCode;
          assignedTechnicianId = saWorkList.assigned_tech_id;
        }

        const date = new Date(saWorkList.updatedAt);

        const formatted =
          date.getFullYear() + "-" +
          String(date.getMonth() + 1).padStart(2, '0') + "-" +
          String(date.getDate()).padStart(2, '0') + " " +
          String(date.getHours()).padStart(2, '0') + ":" +
          String(date.getMinutes()).padStart(2, '0') + ":" +
          String(date.getSeconds()).padStart(2, '0');

        return {
          visitId: saWorkList.id,
          customerCode: saWorkList.customer_code,
          customerName: saWorkList.vehicleDetails.customer.firstName,
          customerMobileNumber: saWorkList.vehicleDetails.customer.mobileNumber,
          visitTimestamp: saWorkList.createdAt,
          visitStatus: saWorkList.fit_status,
          jcStatus: saWorkList.status_value,
          obdStatus: "",
          customerEmail: saWorkList.vehicleDetails.customer.emailId,
          customerAddress: saWorkList.vehicleDetails.customer.address1 + "," + saWorkList.vehicleDetails.customer.address2,
          customerVoice: saWorkList.customer_voice,
          state: saWorkList.vehicleDetails.customer.state,
          city: saWorkList.vehicleDetails.customer.city,
          // city: saWorkList.vehicleDetails.customer.pincodeDetailsMany[0]?.cv_cityId,
          vehicleChassisNum: saWorkList.vehicleDetails.chassisNumber,
          vehicleEngineNum: saWorkList.vehicleDetails.engineNumber,
          lastStatusChangedTime: formatted,
          vehicleRegNum: saWorkList.reg_no,
          vehicleMakeId: saWorkList.vehicleDetails.makeId,
          vehicleModelId: saWorkList.vehicleDetails.modelId,
          vehicleVariantId: saWorkList.vehicleDetails.variantId,
          vehicleFuelType: saWorkList.vehicleDetails.fuelTypeDetails.id,
          source: saWorkList.source,
          sourceType: saWorkList.source_type,
          dmsCustomerId: saWorkList.customer_id,
          dmsVehicleId: saWorkList.vehicle_id,
          insuranceExpiryDate: saWorkList.vehicleDetails.insuranceExpDate,
          monthlyUsage: saWorkList.odometer, // TODO Need to Change to Monthly Usage
          odometerReading: saWorkList.odometer,
          assignedTechnicianId: assignedTechnicianId,
          visitMetadata: {
            manufacturingYear: saWorkList.vehicleDetails.manufacturingYear,
            insuranceCompany: saWorkList.vehicleDetails.insuranceNameDetails?.id || "",
            alternateNumber: "",
            gstinNumber: saWorkList.vehicleDetails.customer.gstinNumber,
            customerCategory: saWorkList.vehicleDetails.customer?.customerTypeDetails?.id || "",
            pinCode: saWorkList.vehicleDetails.customer.pinCode,
            vehicleUsedBy: "",
            everestStatus: false,
            RJCTASL: saWorkList.vehicleDetails.customer.is_b2b == 1 ? true : false,
            motorNumber: saWorkList.vehicleDetails.motor_number,
            controllerNumber: saWorkList.vehicleDetails.mcu
          },
          isB2b: saWorkList.vehicleDetails.customer.is_b2b == 1 ? 1 : 0,
          docType: saWorkList.document_type
        }

      });

    }

    if (results.serviceBookingResult) {
      saAppoitmentsResponse = results.serviceBookingResult.map(serviceBookingResult => ({
        bookingNumber: serviceBookingResult.bookingId,
        vehicleId: serviceBookingResult.vehicleId,
        vehicleNumber: serviceBookingResult.registrationNumber,
        assignedPickupId: serviceBookingResult.assigned_pickup_id,
        outletId: serviceBookingResult.outletId,
        bookingDate: serviceBookingResult.createdAt,
        vehicleMake: serviceBookingResult.vehicleMakeId,
        vehicleModel: serviceBookingResult.vehicleModelId,
        odometerReading: serviceBookingResult.odometer,
        customerName: serviceBookingResult.customerName,
        customerPhone: serviceBookingResult.customerMobileNumber,
        customerVoice: serviceBookingResult.phoneCallNotes,
        pickupAddress: serviceBookingResult.customerAddress,
        customerState: serviceBookingResult.customerState,
        customerCity: serviceBookingResult.customerCity,
        customerPincode: serviceBookingResult.pincode,
        orderSource: serviceBookingResult.source,
        dmsSource: serviceBookingResult.dmsSourceId,
        dmsSourceType: serviceBookingResult.dmsSourceTypeId,
        paymentId: null,
        transactionId: null,
        amount: null,
        paymentResponse: null,
        paymentDate: null,
        paymentRemarks: null
      }));
    }

    return {
      success: true,
      saWorkListResponse: saWorkListResponse,
      saAppoitmentsResponse: saAppoitmentsResponse
    }
  } catch (err) {
    logger.error('Jobcard service getsaworklist', err);
  }
}

const getdetailsforfi = async (req) => {
  try {
    const data = await JobCardDao.getdetailsforfi(req);

    if (data.status == true) {
      return {
        status: true,
        dentScratch: data.dentScratch,
        Estimation: data.Estimation
      }
    } else {
      return {
        status: false
      }
    }

  } catch (err) {
    logger.error('Job Card Service getdetailsforfi', err)
  }
}
const getgiworklist_new = async (req) => {
  try {
    let gateinPickuplist = [];
    const data = await JobCardDao.getgiworklist_new(req);
    if (data.status == true) {

      if (data.serviceBookingResult) {
        gateinPickuplist = data.serviceBookingResult.map(serviceBookingResult => ({
          bookingNumber: serviceBookingResult.id,
          vehicleId: serviceBookingResult.vehicleId,
          vehicleNumber: serviceBookingResult.registrationNumber,
          fitStatus: serviceBookingResult.pickup_status == 1 ? serviceBookingResult.fit_status : "LEAD_CREATED",
          driverId: serviceBookingResult.assigned_pickup_id ? serviceBookingResult.assigned_pickup_id : "",
          driverName: serviceBookingResult.assigned_pickup_id ? serviceBookingResult.serviceBookingUsers.employee.employeeName : "",
          driverNumber: serviceBookingResult.assigned_pickup_id ? serviceBookingResult.serviceBookingUsers.employee.mobileNumber : "",
          pickupDatetime: serviceBookingResult.pickup_date ? serviceBookingResult.pickup_date : "",
          assignedPickupId: serviceBookingResult.assigned_pickup_id ? serviceBookingResult.assigned_pickup_id : "",
          outletId: serviceBookingResult.outletId,
          bookingDate: serviceBookingResult.createdAt,
          vehicleMake: serviceBookingResult.vehicleMakeId,
          vehicleModel: serviceBookingResult.vehicleModelId,
          odometerReading: serviceBookingResult.odometer,
          customerName: serviceBookingResult.customerName,
          customerPhone: serviceBookingResult.customerMobileNumber,
          customerVoice: serviceBookingResult.phoneCallNotes,
          pickupAddress: serviceBookingResult.customerAddress,
          customerState: serviceBookingResult.customerState,
          customerCity: serviceBookingResult.customerCity,
          customerPincode: serviceBookingResult.pincode,
          orderSource: serviceBookingResult.source,
          dmsSource: serviceBookingResult.dmsSourceId,
          dmsSourceType: serviceBookingResult.dmsSourceTypeId,
          paymentId: "",
          transactionId: "",
          amount: "",
          paymentResponse: "",
          paymentDate: "",
          paymentRemarks: ""
        }));
      }

      return {
        status: true,
        gateinPickuplist: gateinPickuplist
      }
    } else {
      return {
        status: false
      }
    }

  } catch (err) {
    logger.error('Job Card Service getgiworklist_new', err)
  }
}

const getcustomerpastvisitdata = async (req) => {
  try {
    const results = await JobCardDao.getcustomerpastvisitdata(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getcustomerpastvisitdata', err);
  }
}

const getAlertMoevVehicleDetails = async (req) => {
  try {
    const results = await JobCardDao.getAlertMoevVehicleDetails(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service getAlertMoevVehicleDetails', err);
  }
}

const updatesourcedetails = async (req) => {
  try {
    const results = await JobCardDao.updatesourcedetails(req);
    return results;
  } catch (err) {
    logger.error('Jobcard service updatesourcedetails', err);
  }
}

const getOldJobcardOpenWorkInProgress = async (user) => {
  try {
    const results = await JobCardDao.getOldJobcardOpenAndWorkInProgress(user);
    return results;
  } catch (err) {
    logger.error('Jobcard service getOldJobcardOpenWorkInProgress', err);
    throw err;
  }
}

const getJobCardBillSummaryItReturnData = async (reqData, user, type) => {
  let finalArray = [];
  try {
    const data = await JobCardDao.getJobCardBillSummaryItReturnData(reqData, user, type);
    const tableData = data.rows.map((item, index) => {
      // for (const item of data.rows){
      let item_amt = item.parts_amount;
      let labour_amt = item.labor_amount + item.osl_labor_amount;
      let labour_osl_amt_notax = item.labor_amount + item.osl_labor_amount;
      let invoice_amt_notax = labour_osl_amt_notax + item.parts_amount;
      const createDated = moment(item.jobcard.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      const billDated = moment(item.createdAt)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY HH:mm:ss');
      
      const promisedDeliveryDate= moment(item.jobcard.work_end_date_time)
        .tz('Asia/Kolkata')
        .format('DD-MM-YYYY');

      const promisedDeliveryTime= moment(item.jobcard.work_end_date_time)
        .tz('Asia/Kolkata')
        .format('HH:mm:ss');

      const otdStatus= item?.createdAt ==item?.jobcard?.work_end_date_time ? "Yes" : "No"
      const estimate = item.jobcard?.serviceEstimate;
      const booking = estimate?.serviceBooking;
      const receipts = item.jobcard?.receipts || [];

      const receiptNumbers = receipts
        .map((r) => r.doc_no)
        .filter(Boolean)
        .join(',');
      let l_rate = 0;
      let resObj = {
        autoId: index + 1,
        job_card_no: item.jobcard_no,
        outlet_code: item.jobcard.outlet_code,
        makeName: item.jobcard.vehicle.make.makeName,
        modelName: item.jobcard.vehicle.model.modelName,
        created_date: createDated,
        customer_code: item.jobcard.customer_code,
        customer_name: item.jobcard.customer_name,
        customer_mobileNumber: item.jobcard.customer_mobileNumber,
        customer_type: item.jobcard.customer_type,
        odometer: item.jobcard.odometer,
        reg_no: item.jobcard.reg_no,
        chassisNumber: item.jobcard.vehicle.chassisNumber,
        engineNumber: item.jobcard.vehicle.engineNumber,
        repair_type: item.jobcard.repairtype.repairTypeName,
        service_advisor: item.jobcard?.user?.employee?.employeeName,
        source: item.jobcard.sources.sourceName,
        source_type: item.jobcard.sourcetype.sourceTypeName,
        labour_invoice_no: '',
        parts_invoice_no: '',
        invoice_no: item.bill_no,
        invoice_date: billDated,
        item_amt: item_amt,
        labour_amt: labour_amt,
        labour_osl_amt_notax: labour_osl_amt_notax,
        spare_amt_notax: item.parts_amount,
        invoice_amt_notax: invoice_amt_notax,
        discount: '',
        // invoice_amt: item.total_amount,
        bill_type: item.bill_type,
        insurance_name: item.jobcard.insurance?.insurance_provider_name || '',
        insurance_gstin: item.jobcard.insurance?.gstin_number || '',
        insurance_code: '',
        insurance_claim_no: item.jobcard.insurance?.claim_no || '',
        customer_gstin: item.jobcard.customer_gstin,
        document_type: item.jobcard.document_type,
        dsa_coupon_code: '',
        customer_voice: item.jobcard.customer_voice,
        service_engineer_remarks: item.jobcard.service_engineer_remarks,
        service_advice: item.jobcard.service_advice,
        policy_no: item.jobcard.insurance?.policy_no || '',
        labourInvoiceNo: item.bill_no,
        partsInvoiceNo: item.bill_no,
        gobumprPaymentId: booking?.payment_id || '',
        gobumprTxnId: booking?.txnid || '',
        gobumprAdvanceAmount: booking?.advance_amount || '',
        gobumprPaymentResponse: booking?.payment_response || '',
        gobumprPaymentDate: booking?.payment_date || '',
        gobumprPaymentRemarks: booking?.payment_remarks || '',
        gobumprBookingId: booking?.bookingId || '',
        gobumprB2bBookingId: booking?.b2bBookingId || '',
        receiptNumber: receiptNumbers,
        outletCity: user?.outlet?.city,
        outletState: user?.outlet?.state,
        FOCItemAmount: item?.foc_parts_amount,
        FOCLaborAmount: item?.foc_labor_amount,
        type:item?.jobcard?.jcCustomerMapping?.customerCategory,
        jobCardStatus:item?.jobcard?.status_value,
        promisedDeliveryDate:promisedDeliveryDate,
        promisedDeliveryTime:promisedDeliveryTime,
        otdReason:item?.jocard?.otd_reason,
        otdStatus:otdStatus
      };

      let cgstAmount = 0;
      let igstAmount = 0;
      let sgstAmount = 0;
     
      let calcLabour = commonLogic.calcSchedules(item.jobcard.schedules,"RJC" );

      for (const labor of calcLabour?.labour) {
        cgstAmount += parseFloat(labor.cgstamt);
        sgstAmount += parseFloat(labor.sgstamt);
        igstAmount += parseFloat(labor.igstamt);
       
      }
      let calcOslLabour = commonLogic.calcOslSchedules(
        item.jobcard.oslSchedules,
        "RJC"
      );
      for (const labor of calcOslLabour?.labour) {
        cgstAmount += parseFloat(labor.cgstamt);
        sgstAmount += parseFloat(labor.sgstamt);
        igstAmount += parseFloat(labor.igstamt);
      }
      l_rate =
        parseFloat(calcLabour.labBeforeTaxAmt) +
        parseFloat(calcOslLabour.labBeforeTaxAmt);

      let calcPartsIssue = commonLogic.calcPartsIssue(
        item?.jobcard?.partsIssue
      );
      
      let p_rate = parseFloat(calcPartsIssue.totalPartsRate);
      let cgstAmountp = parseFloat(calcPartsIssue.totalPartsCGst);
      let sgstAmountp = parseFloat(calcPartsIssue.totalPartsSGst);
      let igstAmountp = parseFloat(calcPartsIssue.totalPartsIGst);
      let totalWithoutTax = l_rate + p_rate;
      const finalObj = {
        ...resObj,
        cgst: cgstAmount,
        sgst: sgstAmount,
        igst: igstAmount,
        p_cgst: cgstAmountp,
        p_sgst: sgstAmountp,
        p_igst: igstAmountp,
        totalcgst: cgstAmount + cgstAmountp,
        totalsgst: sgstAmount + sgstAmountp,
        totaligst: igstAmount + igstAmountp,
        l_rate: l_rate.toFixed(2),
        p_rate: p_rate.toFixed(2),
        invoice_amt:
         Number(totalWithoutTax) +
        Number(cgstAmount) +
        Number(sgstAmount) +  
        Number(igstAmount) +
        Number(cgstAmountp) +
        Number(sgstAmountp) +
        Number(igstAmountp)
          
      };
      finalArray.push(finalObj);
    });
    // };

    let count = finalArray.length;

    if (reqData.offset && reqData.offset > 0) {
      finalArray = finalArray.slice(reqData.offset);
    }

    if (finalArray.length > reqData.limit) {
      finalArray = finalArray.slice(0, reqData.limit);
    }

    return {
      totalItems: count,
      data: finalArray,
    };
  } catch (err) {
    logger.error('JobCard service getBillReportData', err);
    next(err);
  }
};
const JobCardService = {
  getOTDFailureReasons,
  updateCreditApproval,
  jcUpdateByFit,
  saveBillingDetailsFit,
  getTransactionSubstatuses,
  getCustomerData,
  createJobCard,
  createJobCardFromServiceBooking,
  createInitialPortalJobCard,
  savePortalJobCardInspection,
  listJobCards,
  listJobCardsData,
  createMechanicMapping,
  getMechanicMapping,
  updateJobCard,
  updateJobCardLineApproval,
  updateJobcardStatus,
  getJobcardLabor,
  listBillJobCards,
  getOslScheduleByWOB,
  getTransactionCustomerDetails,
  getOutletDetails,
  dashboardAjcRjc,
  dashboardLabourParts,
  generateBillNumber,
  getJobCardInvoicePDFDetails,
  oslWorkOrders,
  listGatePassJobCards,
  saveBillingDetails,
  getGatePassData,
  dashboardVehicleFlow,
  getAllJobCardsForOutlets,
  getJobCardDetails,
  addInsuranceAddress,
  listInsuranceAddresses,
  addInsurance,
  getInsurance,
  updateJobCardInsurance,
  getJobCardStatusReportData,
  getGateInGateOutReportData,
  getWipStatusReportData,
  getBillReportData,
  getBillSummarySplitUpData,
  getJobCardDeliveryReportData,
  getWorkOrderReportData,
  getJobCardData,
  getReceiptReportData,
  getRepairOrderReportData,
  getEliteStatementData,
  vehicleHistory,
  getCompanyDetails,
  getScheduleDetails,
  getOslScheduleDetails,
  getPartsIssueDetails,
  createTransactionUpdate,
  getJobCardForAutoPO,
  createJobCardMobile,
  getJobCardDetailsMobile,
  updateJobCardMobile,
  createGatepassMobile,
  dashboardRevenue,
  dashboard,
  dashboardInflow,
  getJobCardStatement,
  getMechanicEfficiency,
  encryptJc,
  updatePartApprove,
  updateToRsa,
  getJobCardDetailsBridge,
  getJobCardForEtaUpdate,
  UploadVerificationDetails,
  getVerificationDetails,
  listJobCards_v1,
  listJobCardsAdmin,
  listJobCardsByMappedOutlets,
  getJobCardViewByIdAdmin,
  updateJobcardStatusFit,
  getJobCardDetailsById,
  getJobCardDetailsByIdOutlet,
  updateJobCardOutlet,
  getJobCardViewById,
  getJobCardViewByIdOutlet,
  dashboardEpro,
  dashboardCustomerFlow,
  getTopFiveCustomerForGMS,
  getJobCardStatus,
  getSingleCustomerView,
  getJobCardDetailsCustomerComplant,
  getpreviousvisits,
  createJobCardMobileInitial,
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
  getOldJobcardOpenWorkInProgress,
  getJobCardBillSummaryItReturnData
};

export default JobCardService;
