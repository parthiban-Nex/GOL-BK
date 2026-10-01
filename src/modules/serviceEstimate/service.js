import logger from '../../config/logger.js';
import db from '../index.js';
import ServiceEstimateDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import moment from 'moment-timezone';
import JobCardDao from './../jobCard/dao.js';
import { getRemoteToken, pushEstimateDataToRemote, createMobileApiRemoteReq } from '../../shared/mobileApiUtility.js';
import utils from '../Utils/Utils.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";
import CustomerService from '../customer/service.js';
import CustomerDao from '../customer/dao.js';
import ItemService from '../item/service.js';
import LaborScheduleService from '../laborSchedule/service.js';
const JobCard = db.jobCard;
const User = db.users;
const Employee = db.employees;
const Outlet = db.outlets;

const calculateEstimateLine = (line, gstStatus, totalField) => {
  const quantity = Number(line.quantity ?? line.requestedQuantity ?? 0);
  const rate = Number(line.rate ?? 0);
  const additionalMargin = Number(line.additionalMargin ?? 0);
  const discountAmount = Number(line.discountAmount ?? 0);
  const taxableAmount = Number((quantity * rate + additionalMargin - discountAmount).toFixed(2));
  const igstAmount = gstStatus ? Number((taxableAmount * Number(line.igst ?? 0) / 100).toFixed(2)) : 0;
  const cgstAmount = gstStatus ? Number((taxableAmount * Number(line.cgst ?? 0) / 100).toFixed(2)) : 0;
  const sgstAmount = gstStatus ? Number((taxableAmount * Number(line.sgst ?? 0) / 100).toFixed(2)) : 0;

  return {
    ...line,
    quantity,
    [totalField]: Number((taxableAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)).toFixed(2),
  };
};

const createServiceEstimate = async (reqData, user, options = {}) => {
  let result = 'failed';
  let recentActivityData = {};
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const isServiceBookingInternalCall =
    options.internalCall === true && options.source === 'serviceBooking';
  try {
    if (isServiceBookingInternalCall) {
      reqData.serviceBookingId = Number(options.serviceBookingId || reqData.serviceBookingId);
      if (!reqData.serviceBookingId || !reqData.customerId || !reqData.vehicleId) {
        const err = new Error('Booking conversion requires serviceBookingId, customerId, and vehicleId');
        err.status = 400;
        throw err;
      }

      const existingEstimate = await ServiceEstimateDao.findServiceEstimateByBookingId(
        reqData.serviceBookingId
      );
      if (existingEstimate) {
        return {
          result: 'success',
          estimateId: existingEstimate.id,
          serviceEstimateNumber: existingEstimate.serviceEstimateNumber,
        };
      }
    }

    if (!isServiceBookingInternalCall && (!reqData.customerId || !reqData.vehicleId)) {
      const mobileNumber = reqData.mobileNumber || reqData.customerMobileNumber;
      const activeBooking = await ServiceEstimateDao.findActiveServiceBookingForEstimate(
        reqData.registrationNumber,
        mobileNumber
      );
      if (activeBooking) {
        const err = new Error('Service booking is available');
        err.status = 400;
        throw err;
      }

      const existingCustomer = await CustomerDao.findByMobileNumber(mobileNumber);
      const customerVehicle = existingCustomer
        ? await CustomerDao.quickAddVehicleForCustomer({
            customerId: existingCustomer.id,
            registrationNumber: reqData.registrationNumber,
            makeId: reqData.makeId,
            modelId: reqData.modelId,
            fuelType: reqData.fuelType,
          }, user)
        : await CustomerService.quickAddCustomer({
            name: reqData.name,
            mobileNumber,
            pinCode: reqData.pinCode,
            address1: reqData.address1,
            registrationNumber: reqData.registrationNumber,
            makeId: reqData.makeId,
            modelId: reqData.modelId,
            fuelType: reqData.fuelType,
          }, user);

      reqData.customerId = customerVehicle.customerId;
      reqData.vehicleId = customerVehicle.vehicleId;
      reqData.customerName = reqData.name;
      reqData.customerMobileNumber = mobileNumber;
      reqData.customerAddress = reqData.address1;
      reqData.pincode = reqData.pinCode;
      reqData.customerState = reqData.customerState || null;
      reqData.customerCity = reqData.customerCity || null;
      reqData.jobType = reqData.jobType || 'SQRT';
    } else if (isServiceBookingInternalCall) {
      reqData.jobType = reqData.jobType || 'SQRT';
    }

    const serviceEstimateNo = await generateServiceEstimateNumber(
      reqData.jobType,
      user.outlet.outletCode
    );
    reqData['serviceEstimateNumber'] = serviceEstimateNo;
    reqData.laborEstimate = Array.isArray(reqData.laborEstimate) ? reqData.laborEstimate : [];
    reqData.oslLaborEstimate = Array.isArray(reqData.oslLaborEstimate) ? reqData.oslLaborEstimate : [];
    reqData.partsEstimate = Array.isArray(reqData.partsEstimate) ? reqData.partsEstimate : [];
    reqData.gstStatus = reqData.gstStatus === true || reqData.gstStatus === 1 || reqData.gstStatus === 'true';
    reqData.laborEstimate = reqData.laborEstimate.map(line => calculateEstimateLine(line, reqData.gstStatus, 'laborTotal'));
    reqData.oslLaborEstimate = reqData.oslLaborEstimate.map(line => calculateEstimateLine(line, reqData.gstStatus, 'laborTotal'));
    reqData.partsEstimate = reqData.partsEstimate.map(line => calculateEstimateLine(line, reqData.gstStatus, 'partTotal'));
    let data = await ServiceEstimateDao.createServiceEstimate(reqData, user);
    if (Object.keys(data).length > 0) {
      for (const labourEstimateObj of reqData.laborEstimate) {
        labourEstimateObj['serviceEstimateId'] = data.id;
        await ServiceEstimateDao.createServiceLabourEstimate(
          labourEstimateObj,
          user
        );
      }
      for (const oslLabourEstimateObj of reqData.oslLaborEstimate) {
        oslLabourEstimateObj['serviceEstimateId'] = data.id;
        await ServiceEstimateDao.createServiceOslLabourEstimate(
          oslLabourEstimateObj,
          user
        );
      }
      for (const partEstimateObj of reqData.partsEstimate) {
        partEstimateObj['serviceEstimateId'] = data.id;
        await ServiceEstimateDao.createServicePartsEstimate(
          partEstimateObj,
          user
        );
      }
      result = { result: 'success', estimateId: data.id, serviceEstimateNumber: data.serviceEstimateNumber };
      if (reqData.serviceBookingId && !isServiceBookingInternalCall) {
        await ServiceEstimateDao.updateServiceBookingStatus(
          reqData.serviceBookingId
        );
      }
    }
    if (Object.keys(data).length > 0) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Service Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        ' Service Estimate created for ' + reqData.registrationNumber;
      const recent =
        RecentAcivityService.addTransactionRecentActivity(recentActivityData);
      result = { result: 'success', estimateId: data.id, serviceEstimateNumber: data.serviceEstimateNumber };
    }
  } catch (err) {
    logger.error('Service Estimate Service  createServiceEstimate()', err);
    if (err.status) {
      throw err;
    }
  }
  return result;
};

const searchEstimateLineItems = async (searchQuery, user) => {
  try {
    const [labour, parts, osl] = await Promise.all([
      LaborScheduleService.searchLabourDetails({ laborCode: searchQuery }, user),
      ItemService.searchItemDetails({ itemCode: searchQuery }, user),
      LaborScheduleService.searchOslLabourDetails({ laborCode: searchQuery }, user),
    ]);

    return { labour, parts, osl };
  } catch (err) {
    logger.error('Service Estimate Service searchEstimateLineItems()', err);
    throw err;
  }
};

const getEstimateLineItemDetails = async (reqData, user) => {
  try {
    const getDetails = async (item) => {
      if (item.lineItemType === 'LABOUR') {
        return LaborScheduleService.getLabourDetails({
          ...reqData,
          ...item,
          laborCode: item.lineItemCode,
        }, user);
      }
      if (item.lineItemType === 'OSL') {
        return LaborScheduleService.getOslLabourDetails({
          ...reqData,
          ...item,
          laborCode: item.lineItemCode,
        }, user);
      }
      return ItemService.getItemDetails({
        ...reqData,
        ...item,
        itemCode: item.lineItemCode,
      }, user);
    };

    const lineItems = reqData.lineItems || [{
      lineItemType: reqData.lineItemType,
      lineItemCode: reqData.lineItemCode,
    }];
    const resolvedItems = await Promise.all(lineItems.map(async (item) => ({
      lineItemType: item.lineItemType,
      lineItemCode: item.lineItemCode,
      details: await getDetails(item),
    })));

    if (!reqData.isBatchLineItems) {
      return {
        lineItemType: resolvedItems[0].lineItemType,
        lineItemDetails: resolvedItems[0].details,
      };
    }

    const groupedDetails = { labour: [], parts: [], osl: [] };
    for (const item of resolvedItems) {
      const group = item.lineItemType === 'LABOUR'
        ? 'labour'
        : item.lineItemType === 'PART'
          ? 'parts'
          : 'osl';
      groupedDetails[group].push({
        lineItemCode: item.lineItemCode,
        details: item.details,
      });
    }

    return {
      lineItemType: 'MULTIPLE',
      lineItemDetails: groupedDetails,
    };
  } catch (err) {
    logger.error('Service Estimate Service getEstimateLineItemDetails()', err);
    throw err;
  }
};


const createServiceEstimateMobile = async (reqData, user) => {
  let result = 'failed';
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let serviceEstimateDetail = "";
  let serviceEstimateNumber = "";
  let laborEstimateDetails = [];
  let oslLaborSchedules = [];
  let partEstimates = [];
  let recentActivityData = {};

  try {

    const vehicleDetails = await JobCardDao.getJobCardDetailsMobile(reqData.VISIT_ID, reqData.userId);
    let serviceEstimateNo = "";
    let data = "";
    let serviceEstimateResponse = "";
    reqData['vehicleId'] = vehicleDetails.vehicle_id;
    reqData['customerVoice'] = vehicleDetails.customer_voice;
    reqData['jobType'] = vehicleDetails.jobType;
    reqData['serviceType'] = vehicleDetails.service_type;
    reqData['repairType'] = vehicleDetails.repair_type;
    reqData['source'] = vehicleDetails.source;
    reqData['sourceType'] = vehicleDetails.source_type;
    reqData['odometer'] = vehicleDetails.odometer;
    reqData['document_type'] = vehicleDetails.document_type;

    if (vehicleDetails.service_estimate_code != "" && vehicleDetails.service_estimate_code != null) {
      serviceEstimateNo = vehicleDetails.service_estimate_code
      data = vehicleDetails.service_estimate_id
    } else {
      serviceEstimateNo = await generateServiceEstimateNumber(
        reqData.jobType,
        user.outlet.outletCode
      );
      reqData['serviceEstimateNumber'] = serviceEstimateNo;

      serviceEstimateResponse = await ServiceEstimateDao.createServiceEstimateMobile(reqData, user);
      data = serviceEstimateResponse.id;
    }

    serviceEstimateDetail = data;
    // console.log('data from service -----',data);
    // if (Object.keys(data).length > 0) {
    if (data > 0) {
      const labourEstimate = reqData.laborEstimate;
      const oslLabourEstimate = reqData.oslLaborSchedules;
      const partEstimate = reqData.partEstimate;
      serviceEstimateNumber = serviceEstimateNo;

      if (labourEstimate) {
        const deleteServiceLabourEstimateMobile = await ServiceEstimateDao.deleteServiceLabourEstimateMobile(data);
        for (let labourEstimateObj of labourEstimate) {
          labourEstimateObj['serviceEstimateId'] = data;
          let labourData = await ServiceEstimateDao.createServiceLabourEstimateMobile(
            labourEstimateObj,
            user
          );
          // console.log('after creating labour ----',labourData);
          if (labourData && labourData.laborId) {
            laborEstimateDetails.push({
              id: labourData.id.toString(),
              laborId: labourData.laborId.toString(),
              fitId: labourData.fitId.toString()
            });
          }
        }
      }

      if (oslLabourEstimate) {
        const deleteOslServiceLabourEstimateMobile = await ServiceEstimateDao.deleteOslServiceLabourEstimateMobile(data);
        for (let oslLabourEstimateObj of oslLabourEstimate) {
          oslLabourEstimateObj['serviceEstimateId'] = data;
          let oslLabourData = await ServiceEstimateDao.createServiceOslLabourEstimateMobile(
            oslLabourEstimateObj,
            user
          );
          // console.log('after osl labour------',oslLabourData)
          if (oslLabourData && oslLabourData.laborId) {
            oslLaborSchedules.push({
              id: oslLabourData.id.toString(),
              laborId: oslLabourData.laborId.toString(),
              fitId: oslLabourData.fitId.toString()
            });
          }
        }
      }

      if (partEstimate) {
        const deleteServicePartsEstimateMobile = await ServiceEstimateDao.deleteServicePartsEstimateMobile(data);
        for (let partEstimateObj of partEstimate) {
          partEstimateObj['serviceEstimateId'] = data;
          let partsEstimate = await ServiceEstimateDao.createServicePartsEstimateMobile(
            partEstimateObj,
            user
          );

          // console.log('after parts created-----',partsEstimate)
          if (partsEstimate && partsEstimate.partId) {
            partEstimates.push({
              id: partsEstimate.id.toString(),
              partId: partsEstimate.partId.toString(),
              fitId: partsEstimate.fitId.toString()
            });
          }
        }
      }
      if (serviceEstimateResponse.serviceBookingId && serviceEstimateResponse.serviceBookingId !== '0') { // estimateId check for this
        await ServiceEstimateDao.updateServiceBookingStatusMobile(
          serviceEstimateResponse.serviceBookingId
        );
      }

      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Service Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = 'Service Estimate created for ' + reqData.vehicleId //registrationNumber;
      await RecentAcivityService.addTransactionRecentActivity(recentActivityData);

      const updateDmsDetails = await JobCard.update({
        fit_status: reqData.Parent.VISIT_STATUS,
        service_estimate_code: serviceEstimateNumber,
        service_estimate_id: serviceEstimateDetail,
        status: reqData.Parent.VISIT_STATUS == "INITIAL_ESTIMATION_APPROVED" ? 1 : 0,
      }, { where: { id: reqData.VISIT_ID } })

      if (updateDmsDetails[0] === 0) {
        return { result: "Error", message: "Dms Details Saved Failed!" };
      }

      // This is called only When visit Status in INITIAL_ESTIMATION_APPROVED
      if (reqData.Parent.VISIT_STATUS == "INITIAL_ESTIMATION_APPROVED") {
        const user = await User.findOne({
          where: { id: reqData.userId },
          attributes: ["id"],
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["outletId"],
              include: [
                {
                  model: Outlet,
                  as: "outlet",
                  attributes: ["outletCode"]
                }
              ]
            }
          ],
          raw: true
        });

        const jobCardNumber = await generateJobCardNumber(
          reqData.document_type,
          user["employee.outlet.outletCode"]
        );

        let formattedDate = null;
        if (reqData.expectedWorkCompletedDate) {
          formattedDate = moment(
            reqData.expectedWorkCompletedDate,
            ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
          ).format("YYYY-MM-DD HH:mm:ss");
        }
        console.log('formattedDate------------------------', formattedDate);

        const updateDmsDetails = await JobCard.update({
          job_card_no: jobCardNumber,
          work_end_date_time: formattedDate
        }, { where: { id: reqData.VISIT_ID } })

        if (updateDmsDetails[0] === 0) {
          return { status: "Error", message: "Job Card Saved Failed!" };
        }
      }

      result = 'success';
      serviceEstimateDetail;
    }

  } catch (err) {
    logger.error('Service Estimate Service createServiceEstimateMobile()', err);
  }

  const visitAuditTrail = await utils.updateAuditTrail(
    reqData.VISIT_ID,
    reqData.Parent.VISIT_STATUS,
    reqData.userId,
    ""
  )

  return {
    result: result,
    serviceEstimateDetail: serviceEstimateDetail,
    serviceEstimateNumber: serviceEstimateNumber,
    laborEstimate: laborEstimateDetails,
    oslLaborSchedules: oslLaborSchedules,
    partEstimates: partEstimates
  };
  
};

const generateJobCardNumber = async (jobType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  }
  else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentJobCardData =
    await JobCardDao.getRecentJobCardForJcNo(jobType, outletCode, currentYear);
  if (recentJobCardData) {
    const lastNumber = recentJobCardData.job_card_no.split("-")[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, "0");

  return `${jobType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const updateServiceEstimate = async (serviceEstimate, user) => {
  let result = 'failed';
  let recentActivityData = {};
  const currentDate = new Date();
  const laborIdMap = new Map();
  const oslIdMap = new Map();
  const partIdMap = new Map();
  const updatedLaborList = [];
  const updatedOslRecords = [];
  const updatedPartsRecords = [];
  const year = currentDate.getFullYear();
  let message = '';
  let gstStatusChanged = false;

  try {
    let serviceEstimateExists =
      await ServiceEstimateDao.findOpenServiceEstimateByEstimateId(
        serviceEstimate.id
      );

    if (serviceEstimateExists) {
      const gstStatus = Object.prototype.hasOwnProperty.call(serviceEstimate, 'gstStatus')
        ? serviceEstimate.gstStatus === true || serviceEstimate.gstStatus === 1 || serviceEstimate.gstStatus === 'true'
        : Boolean(serviceEstimateExists.gstStatus);
      gstStatusChanged = Object.prototype.hasOwnProperty.call(serviceEstimate, 'gstStatus')
        && gstStatus !== Boolean(serviceEstimateExists.gstStatus);
      serviceEstimate.gstStatus = gstStatus;
      serviceEstimate.laborEstimate = Array.isArray(serviceEstimate.laborEstimate)
        ? serviceEstimate.laborEstimate
        : serviceEstimateExists.labourEstimate.map(item => item.get({ plain: true }));
      serviceEstimate.oslLaborEstimate = Array.isArray(serviceEstimate.oslLaborEstimate)
        ? serviceEstimate.oslLaborEstimate
        : serviceEstimateExists.oslLabourEstimate.map(item => item.get({ plain: true }));
      serviceEstimate.partsEstimate = Array.isArray(serviceEstimate.partsEstimate)
        ? serviceEstimate.partsEstimate
        : serviceEstimateExists.partEstimate.map(item => item.get({ plain: true }));
      const mergeExistingLines = (lines, existingLines) => lines.map(line => {
        const existingLine = line.id && existingLines.find(item => String(item.id) === String(line.id));
        return existingLine
          ? { ...existingLine.get({ plain: true }), ...line }
          : line;
      });
      serviceEstimate.laborEstimate = mergeExistingLines(serviceEstimate.laborEstimate, serviceEstimateExists.labourEstimate);
      serviceEstimate.oslLaborEstimate = mergeExistingLines(serviceEstimate.oslLaborEstimate, serviceEstimateExists.oslLabourEstimate);
      serviceEstimate.partsEstimate = mergeExistingLines(serviceEstimate.partsEstimate, serviceEstimateExists.partEstimate);
      serviceEstimate.laborEstimate = serviceEstimate.laborEstimate.map(line => calculateEstimateLine(line, gstStatus, 'laborTotal'));
      serviceEstimate.oslLaborEstimate = serviceEstimate.oslLaborEstimate.map(line => calculateEstimateLine(line, gstStatus, 'laborTotal'));
      serviceEstimate.partsEstimate = serviceEstimate.partsEstimate.map(line => calculateEstimateLine(line, gstStatus, 'partTotal'));
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Service Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (
        serviceEstimateExists.registrationNumber !=
        serviceEstimate.registrationNumber
      ) {
        message =
          message +
          ' registrationNumber changed from ' +
          serviceEstimateExists.registrationNumber +
          ' to ' +
          serviceEstimate.registrationNumber +
          ' ,';
      }
      if (serviceEstimateExists.customerName != serviceEstimate.customerName) {
        message =
          message +
          ' customerName changed from ' +
          serviceEstimateExists.customerName +
          ' to ' +
          serviceEstimate.customerName +
          ' ,';
      }
      if (serviceEstimateExists.status != serviceEstimate.status) {
        message =
          message +
          ' status changed from ' +
          serviceEstimateExists.status +
          ' to ' +
          serviceEstimate.status +
          ' ,';
      }
      if (serviceEstimateExists.odometer != serviceEstimate.odometer) {
        message =
          message +
          ' odometer changed from ' +
          serviceEstimateExists.odometer +
          ' to ' +
          serviceEstimate.odometer +
          ' ,';
      }
      if (
        serviceEstimateExists.customerMobileNumber !=
        serviceEstimate.customerMobileNumber
      ) {
        message =
          message +
          ' customerMobileNumber changed from ' +
          serviceEstimateExists.customerMobileNumber +
          ' to ' +
          serviceEstimate.customerMobileNumber +
          ' ,';
      }
      if (
        serviceEstimateExists.customerAddress != serviceEstimate.customerAddress
      ) {
        message =
          message +
          ' customerAddress changed from ' +
          serviceEstimateExists.customerAddress +
          ' to ' +
          serviceEstimate.customerAddress +
          ' ,';
      }
      if (
        serviceEstimateExists.customerState != serviceEstimate.customerState
      ) {
        message =
          message +
          ' customerState changed from ' +
          serviceEstimateExists.customerState +
          ' to ' +
          serviceEstimate.customerState +
          ' ,';
      }
      if (serviceEstimateExists.customerCity != serviceEstimate.customerCity) {
        message =
          message +
          ' customerCity changed from ' +
          serviceEstimateExists.customerCity +
          ' to ' +
          serviceEstimate.customerCity +
          ' ,';
      }
      if (
        serviceEstimateExists.customerStatus != serviceEstimate.customerStatus
      ) {
        message =
          message +
          ' customerStatus changed from ' +
          serviceEstimateExists.customerStatus +
          ' to ' +
          serviceEstimate.customerStatus +
          ' ,';
      }
      if (serviceEstimateExists.pincode != serviceEstimate.pincode) {
        message =
          message +
          ' pincode changed from ' +
          serviceEstimateExists.pincode +
          ' to ' +
          serviceEstimate.pincode +
          ' ,';
      }
      if (serviceEstimateExists.serviceType != serviceEstimate.serviceType) {
        message =
          message +
          ' serviceType changed from ' +
          serviceEstimateExists.serviceType +
          ' to ' +
          serviceEstimate.serviceType +
          ' ,';
      }

      message = message.slice(0, -1);

      let data = await ServiceEstimateDao.updateServiceEstimate(
        serviceEstimate,
        user
      );

      if (data) {
        const labourEstimateOld = serviceEstimateExists.labourEstimate;
        const labourEstimate = serviceEstimate.laborEstimate;

        let delLabor = labourEstimateOld.filter(del => !labourEstimate.some(newOne => newOne.id === del.id));

        if (delLabor.length > 0) {
          for (const del of delLabor) {
            await ServiceEstimateDao.deleteServiceLabourEstimate(
              del.id
            );
          }
        };

        if (labourEstimate.length > 0) {
          for (const labourEstimateObj of labourEstimate) {
            labourEstimateObj['serviceEstimateId'] = serviceEstimate.id;

            let updatedLaborRecord;
            if (labourEstimateObj.id) {
              updatedLaborRecord = await ServiceEstimateDao.updateServiceLabourEstimate(labourEstimateObj, user);
            } else {
              updatedLaborRecord = await ServiceEstimateDao.createServiceLabourEstimate(labourEstimateObj, user);
            }

            if (updatedLaborRecord) {
              laborIdMap.set(updatedLaborRecord.id, updatedLaborRecord.id);
              updatedLaborList.push(updatedLaborRecord);
            }

          }
          // labourEstimate.forEach(async (labourEstimateObj) => {
          //   labourEstimateObj['serviceEstimateId'] = serviceEstimate.id;
          //   if (labourEstimateObj.id) {
          // //  console.log('labourEstimateObj22222222222222222222',labourEstimateObj.id)
          //  let lastLabourId =   await ServiceEstimateDao.updateServiceLabourEstimate(
          //       labourEstimateObj,
          //       user
          //     );
          //   } else {
          //   let lastLabourId  = await ServiceEstimateDao.createServiceLabourEstimate(
          //       labourEstimateObj,
          //       user
          //     )
          //   }
          // });
          // labourEstimate.forEach(async (labourEstimateObj) => {
          //   labourEstimateObj['serviceEstimateId'] = serviceEstimate.id;
          //   if (labourEstimateObj.id) {
          // //  console.log('labourEstimateObj22222222222222222222',labourEstimateObj.id)
          //  let lastLabourId =   await ServiceEstimateDao.updateServiceLabourEstimate(
          //       labourEstimateObj,
          //       user
          //     );
          //   } else {
          //   let lastLabourId  = await ServiceEstimateDao.createServiceLabourEstimate(
          //       labourEstimateObj,
          //       user
          //     )
          //   }
          // });
        }



        const oslLaborEstimateOld = serviceEstimateExists.oslLabourEstimate;
        const oslLaborEstimate = serviceEstimate.oslLaborEstimate;
        // console.log('oslLaborEstimateOld',oslLaborEstimateOld);
        let delOslLabor = oslLaborEstimateOld.filter(del => !oslLaborEstimate.some(newOne => newOne.id === del.id));

        if (delOslLabor.length > 0) {
          for (const del of delOslLabor) {
            await ServiceEstimateDao.deleteOslServiceLabourEstimate(
              del.id
            );
          }
        };

        if (oslLaborEstimate.length > 0) {
          for (const oslLabourEstimateObj of oslLaborEstimate) {
            oslLabourEstimateObj['serviceEstimateId'] = serviceEstimate.id;

            let lastOslRecord;
            if (oslLabourEstimateObj.id) {
              // This will return full updated record
              lastOslRecord = await ServiceEstimateDao.updateServiceOslLabourEstimate(oslLabourEstimateObj, user);
            } else {
              lastOslRecord = await ServiceEstimateDao.createServiceOslLabourEstimate(oslLabourEstimateObj, user);
            }

            if (lastOslRecord?.id) {
              oslIdMap.set(lastOslRecord.id, lastOslRecord.id);
              updatedOslRecords.push(lastOslRecord);
            }
          }
        }

        const partEstimateOld = serviceEstimateExists.partEstimate;
        const partEstimate = serviceEstimate.partsEstimate;

        let delParts = partEstimateOld.filter(del => !partEstimate.some(newOne => newOne.id === del.id));

        if (delParts.length > 0) {
          for (const del of delParts) {
            await ServiceEstimateDao.deleteServicePartsEstimate(
              del.id
            );
          }
        };


        if (partEstimate.length > 0) {

          for (const partEstimateObj of partEstimate) {
            partEstimateObj['serviceEstimateId'] = serviceEstimate.id;

            let lastPartsId;
            if (partEstimateObj.id) {
              lastPartsId = await ServiceEstimateDao.updateServicePartsEstimate(partEstimateObj, user);
            } else {
              lastPartsId = await ServiceEstimateDao.createServicePartsEstimate(partEstimateObj, user);
            }

            if (lastPartsId) partIdMap.set(lastPartsId, lastPartsId);

            if (lastPartsId?.id) {
              partIdMap.set(lastPartsId.id, lastPartsId.id);
              updatedPartsRecords.push(lastPartsId);
            }
          }
        }
      }
      // console.log('22222222222222222222222222serviceEstimate',serviceEstimate);
      result = 'success';

      if (result === 'success') {

        const auth = await getRemoteToken();


        console.log('Auth Token:', auth);

        if (auth && auth.token) {
          const remotePayload = {
            userId: auth.userId,
            authenticationToken: auth.token,
            estimateId: serviceEstimate.id,
            laborEstimate: updatedLaborList.map(labor => ({
              id: labor.id,
              laborId: labor.laborId,
              laborCode: labor.laborCode,
              laborDescription: labor.laborDescription,
              quantity: labor.quantity,
              singleAmount: labor.singleAmount,
              rate: labor.rate,
              additionalMargin: labor.additionalMargin,
              discountAmount: labor.discountAmount,
              sgst: labor.sgst,
              cgst: labor.cgst,
              igst: labor.igst,
              laborTotal: labor.laborTotal,
              fitId: labor.fitId || 0
            })),
            oslLaborSchedules: updatedOslRecords.map(osl => ({
              id: osl.id,
              laborId: osl.laborId,
              laborCode: osl.laborCode,
              laborDescription: osl.laborDescription,
              quantity: osl.quantity,
              rate: osl.rate,
              additionalMargin: osl.additionalMargin,
              discountAmount: osl.discountAmount,
              sgst: osl.sgst,
              cgst: osl.cgst,
              igst: osl.igst,
              laborTotal: osl.laborTotal,
              vendorId: osl.vendorId ?? '0',
              fitId: osl.fitId ?? 0,
            }))
            ,
            partEstimate: (updatedPartsRecords || []).map(part => ({
              id: part.id,
              partId: part.partId,
              partNo: part.partNo,
              partDescription: part.partDescription,
              hsnCode: part.hsnCode,
              requestedQuantity: part.requestedQuantity,
              rate: part.rate,
              additionalMargin: part.additionalMargin,
              discountAmount: part.discountAmount,
              sgst: part.sgst,
              cgst: part.cgst,
              igst: part.igst,
              partTotal: part.partTotal,
              fitId: part.fitId ? part.fitId : 0
            }))
          };
          console.log('Remote Payload:', remotePayload);
          const remoteResponse = await pushEstimateDataToRemote(remotePayload);
          console.log('Remote Response:', remoteResponse);
          await createMobileApiRemoteReq(remotePayload, remoteResponse, user, 'Dms-to-tvsFit-Estimate-Update');
          if (remoteResponse?.fitDMSMap) {
            const { LABOUR, OSL, PARTS } = remoteResponse.fitDMSMap;
            for (const labor of LABOUR || []) {
              const localId = laborIdMap.get(labor.dmsId);
              if (localId) {
                await ServiceEstimateDao.updateLaborFitId(localId, labor.fitId);
              }
            }
            for (const osl of OSL || []) {
              const localId = oslIdMap.get(osl.dmsId);
              if (localId) {
                await ServiceEstimateDao.updateOslLaborFitId(localId, osl.fitId);
              }
            }
            for (const part of PARTS || []) {
              const localId = partIdMap.get(part.dmsId);
              if (localId) {
                await ServiceEstimateDao.updatePartFitId(localId, part.fitId);
              }
            }
          }
        }
      }
    }
    if (message) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
    }
    result = 'success';
    if (gstStatusChanged) {
      const updatedEstimate = await ServiceEstimateDao.findOpenServiceEstimateByEstimateId(serviceEstimate.id);
      if (!updatedEstimate) {
        throw new Error(`Updated service estimate ${serviceEstimate.id} could not be reloaded`);
      }
      const estimateData = updatedEstimate.get({ plain: true });
      estimateData.customerName = estimateData.decryptedCustomerName;
      estimateData.customerMobileNumber = estimateData.decryptedCustomerMobileNumber;
      delete estimateData.decryptedCustomerName;
      delete estimateData.decryptedCustomerMobileNumber;
      result = { result: 'success', estimateData };
    }
  } catch (err) {
    logger.error('Service Estimate Service  createServiceEstimate()', err);
  }
  return result;
};

const updateServiceEstimateMobile = async (serviceEstimate, user) => {
  let result = 'failed';
  let recentActivityData = {};
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let message = '';
  let serviceEstimateDetail = "";
  let laborEstimateDetails = [];
  let oslLaborSchedules = [];
  let partEstimates = [];
  let jobCardNumber = "";
  let updateDmsDetails = "";
  let serviceEstimateNumber = "";
  let serviceEstimateResponse = "";
  const vehicleDetails = await JobCardDao.getJobCardDetailsMobile(serviceEstimate.VISIT_ID, serviceEstimate.userId);
  const techFcmToken = await User.findOne({
    where: {
      id: vehicleDetails.assigned_tech_id
    }
  })

  const saFcmToken = await User.findOne({
    where: {
      id: vehicleDetails.assigned_tech_id
    }
  })
  try {

    // From here need to check with harman sir 
    // This is called only When visit Status in INITIAL_ESTIMATION_APPROVED
    if (serviceEstimate.Parent.VISIT_STATUS == "INITIAL_ESTIMATION_APPROVED") {
      // TODO : NEED TO CREATE VISIT AUDIT TRAIL
      // const user = await User.findOne({
      //   where: { id: serviceEstimate.userId },
      //   attributes: ["id"],
      //   include: [
      //     {
      //       model: Employee,
      //       as: "employee",
      //       attributes: ["outletId"],
      //       include: [
      //         {
      //           model: Outlet,
      //           as: "outlet",
      //           attributes: ["outletCode","id"]
      //         }
      //       ]
      //     }
      //   ],
      //   raw: true
      // });
      serviceEstimate['vehicleId'] = vehicleDetails.vehicle_id;
      serviceEstimate['customerVoice'] = vehicleDetails.customer_voice;
      serviceEstimate['jobType'] = vehicleDetails.jobType;
      serviceEstimate['serviceType'] = vehicleDetails.service_type;
      serviceEstimate['repairType'] = vehicleDetails.repair_type;
      serviceEstimate['source'] = vehicleDetails.source;
      serviceEstimate['sourceType'] = vehicleDetails.source_type;
      serviceEstimate['odometer'] = vehicleDetails.odometer;
      serviceEstimate['document_type'] = vehicleDetails.document_type;
      serviceEstimate['partOrAggregate'] = vehicleDetails.partOrAggregate;


      jobCardNumber = await generateJobCardNumber(
        serviceEstimate.document_type,
        user.outlet.outletCode
      );

      if (vehicleDetails.service_estimate_code != "" && vehicleDetails.service_estimate_code != null) {
        serviceEstimateNumber = vehicleDetails.service_estimate_code
        serviceEstimate['estimateId'] = vehicleDetails.service_estimate_id;
        const updateServiceEstimate = await db.servicEstimates.update({
          expectedWorkCompletedDate: serviceEstimate.expectedWorkCompletedDate
        }, {
          where: {
            id: vehicleDetails.service_estimate_id
          }
        })
      } else {
        serviceEstimateNumber = await generateServiceEstimateNumber(
          serviceEstimate.jobType,
          user.outlet.outletCode
        );
        serviceEstimate['serviceEstimateNumber'] = serviceEstimateNumber;

        serviceEstimateResponse = await ServiceEstimateDao.createServiceEstimateMobile(serviceEstimate, user);
        serviceEstimate['estimateId'] = serviceEstimateResponse.id;
      }

      let fit_status = "";

      if (serviceEstimate.partOrAggregate == 1) {
        fit_status = "JC_TO_GENERATE";
      } else {
        fit_status = "INSPECTION_ASSIGNED";
      }

      await sendNotificationDataToToken(techFcmToken.fcm_tocken,
        {
          title: "Inspection Assigned",
          body: "Inspection for vehicle number " + vehicleDetails.reg_no + " has been assigned to you",
          tab: "TECH",
          visitID: vehicleDetails.id.toString()
        }
      )

      await sendNotificationDataToToken(saFcmToken.fcm_tocken,
        {
          title: "Estimation Approved",
          body: "Customer has approved the estimates for vehicle number " + vehicleDetails.reg_no,
          tab: "",
          visitID: vehicleDetails.id.toString()
        }
      )

      let formattedDate = null;
      if (serviceEstimate.expectedWorkCompletedDate) {
        formattedDate = moment(
          serviceEstimate.expectedWorkCompletedDate,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      console.log('formattedDate------------------------', formattedDate);

      updateDmsDetails = await JobCard.update({
        job_card_no: jobCardNumber,
        service_estimate_id: serviceEstimate.estimateId,
        service_estimate_code: serviceEstimateNumber,
        fit_status: fit_status,
        status_value: "Open",
        status: 1,
        service_advice: serviceEstimate.technicianRemarks,
        work_end_date_time: formattedDate
      }, { where: { id: serviceEstimate.VISIT_ID } })


      const visitAuditTrailESTIMATIONAPPROVED = await utils.updateAuditTrail(
        serviceEstimate.VISIT_ID,
        serviceEstimate.Parent.VISIT_STATUS,
        serviceEstimate.userId,
        ""
      )

      if (serviceEstimate.partOrAggregate == 1) {
        const visitAuditTrailJCTOGENERATE = await utils.updateAuditTrail(
          serviceEstimate.VISIT_ID,
          "JC_TO_GENERATE",
          serviceEstimate.userId,
          ""
        )
      } else {
        const visitAuditTrailINSPECTIONASSIGNED = await utils.updateAuditTrail(
          serviceEstimate.VISIT_ID,
          "INSPECTION_ASSIGNED",
          serviceEstimate.userId,
          ""
        )
      }


      if (updateDmsDetails[0] === 0) {
        return { status: "Error", message: "Job Card Saved Failed!" };
      } else {
        const saveApprovedEstimate = await ServiceEstimateDao.createServiceEstimateApproved(serviceEstimate, serviceEstimate.estimateId)
        console.log("saveApprovedEstimate", saveApprovedEstimate);

        if (saveApprovedEstimate.status == "success") {
          if (serviceEstimateResponse.serviceBookingId && serviceEstimateResponse.serviceBookingId !== '0') { // estimateId check for this
            await ServiceEstimateDao.updateServiceBookingStatusMobile(
              serviceEstimateResponse.serviceBookingId
            );
          }
          return { result: "success", insert: 'direct', message: "Job Card Saved Successfully!" };
        } else {
          return { result: "Error", insert: 'direct', message: "Job Card Saved Failed!" };
        }
      }
    } else if (serviceEstimate.Parent.VISIT_STATUS == "ESTIMATION_IN_PROGRESS" || serviceEstimate.Parent.VISIT_STATUS == "ESTIMATION_APPROVED") {
      const saveApprovedEstimate = await ServiceEstimateDao.createServiceEstimateApproved(serviceEstimate, serviceEstimate.estimateId)
      const updateServiceEstimate = await db.servicEstimates.update({
        expectedWorkCompletedDate: serviceEstimate.expectedWorkCompletedDate
      }, {
        where: {
          id: vehicleDetails.service_estimate_id
        }
      })

      let formattedDate = null;
      if (serviceEstimate.expectedWorkCompletedDate) {
        formattedDate = moment(
          serviceEstimate.expectedWorkCompletedDate,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      console.log('formattedDate------------------------', formattedDate);

      if (serviceEstimate.Parent.VISIT_STATUS == "ESTIMATION_APPROVED") {
        updateDmsDetails = await JobCard.update({
          fit_status: "JC_TO_GENERATE",
          status: 1,
          service_advice: serviceEstimate.technicianRemarks,
          work_end_date_time: formattedDate
        }, { where: { id: serviceEstimate.VISIT_ID } })

        await sendNotificationDataToToken(saFcmToken.fcm_tocken,
          {
            title: "Estimation Approved",
            body: "Customer has approved the estimates for vehicle number " + vehicleDetails.reg_no,
            tab: "",
            visitID: vehicleDetails.id.toString()
          }
        )

      } else {
        updateDmsDetails = await JobCard.update({
          fit_status: "ESTIMATION_IN_PROGRESS",
          status: 1,
          service_advice: serviceEstimate.technicianRemarks,
          work_end_date_time: formattedDate
        }, { where: { id: serviceEstimate.VISIT_ID } })
      }

      const serviceEstimateUpdate = await db.servicEstimates.update({
        expectedWorkCompletedDate: formattedDate
      }, {
        where: {
          id: serviceEstimate.estimateId
        }
      })

      const visitAuditTrail = await utils.updateAuditTrail(
        serviceEstimate.VISIT_ID,
        serviceEstimate.Parent.VISIT_STATUS,
        serviceEstimate.userId,
        ""
      )

      console.log("saveApprovedEstimate", saveApprovedEstimate);
      if (saveApprovedEstimate.status == "success") {
        return { result: "success", insert: 'direct', message: "Job Card Saved Successfully!" };
      } else {
        return { result: "Error", insert: 'direct', message: "Job Card Saved Failed!" };
      }
    }
    // till here 

    let serviceEstimateExists =
      await ServiceEstimateDao.findOpenServiceEstimateByEstimateId(
        serviceEstimate.estimateId
      );

    console.log('update estimate', serviceEstimateExists);
    if (Array.isArray(serviceEstimateExists)) {
      serviceEstimateExists.forEach(async (element) => {
        const fieldsToMap = [
          { decryptedField: 'decryptedCustomerName', originalField: 'customerName' },
          { decryptedField: 'decryptedCustomerMobileNumber', originalField: 'customerMobileNumber' },
        ];

        fieldsToMap.forEach(field => {
          element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
          delete element.dataValues[field.decryptedField];
        });
      });
    } else if (serviceEstimateExists && typeof serviceEstimateExists === 'object') {
      const element = serviceEstimateExists;
      const fieldsToMap = [
        { decryptedField: 'decryptedCustomerName', originalField: 'customerName' },
        { decryptedField: 'decryptedCustomerMobileNumber', originalField: 'customerMobileNumber' },
      ];

      fieldsToMap.forEach(field => {
        element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
        delete element.dataValues[field.decryptedField];
      });
    } else {
      console.error("No data found");
    };

    if (serviceEstimateExists) {
      if (
        serviceEstimateExists.registrationNumber !=
        serviceEstimate.registrationNumber
      ) {
        message =
          message +
          ' registrationNumber changed from ' +
          serviceEstimateExists.registrationNumber +
          ' to ' +
          serviceEstimate.registrationNumber +
          ' ,';
      }
      if (serviceEstimateExists.customerName != serviceEstimate.customerName) {
        message =
          message +
          ' customerName changed from ' +
          serviceEstimateExists.customerName +
          ' to ' +
          serviceEstimate.customerName +
          ' ,';
      }
      if (serviceEstimateExists.status != serviceEstimate.status) {
        message =
          message +
          ' status changed from ' +
          serviceEstimateExists.status +
          ' to ' +
          serviceEstimate.status +
          ' ,';
      }
      if (serviceEstimateExists.odometer != serviceEstimate.odometer) {
        message =
          message +
          ' odometer changed from ' +
          serviceEstimateExists.odometer +
          ' to ' +
          serviceEstimate.odometer +
          ' ,';
      }
      if (
        serviceEstimateExists.customerMobileNumber !=
        serviceEstimate.customerMobileNumber
      ) {
        message =
          message +
          ' customerMobileNumber changed from ' +
          serviceEstimateExists.customerMobileNumber +
          ' to ' +
          serviceEstimate.customerMobileNumber +
          ' ,';
      }
      if (
        serviceEstimateExists.customerAddress != serviceEstimate.customerAddress
      ) {
        message =
          message +
          ' customerAddress changed from ' +
          serviceEstimateExists.customerAddress +
          ' to ' +
          serviceEstimate.customerAddress +
          ' ,';
      }
      if (
        serviceEstimateExists.customerState != serviceEstimate.customerState
      ) {
        message =
          message +
          ' customerState changed from ' +
          serviceEstimateExists.customerState +
          ' to ' +
          serviceEstimate.customerState +
          ' ,';
      }
      if (serviceEstimateExists.customerCity != serviceEstimate.customerCity) {
        message =
          message +
          ' customerCity changed from ' +
          serviceEstimateExists.customerCity +
          ' to ' +
          serviceEstimate.customerCity +
          ' ,';
      }
      if (
        serviceEstimateExists.customerStatus != serviceEstimate.customerStatus
      ) {
        message =
          message +
          ' customerStatus changed from ' +
          serviceEstimateExists.customerStatus +
          ' to ' +
          serviceEstimate.customerStatus +
          ' ,';
      }
      if (serviceEstimateExists.pincode != serviceEstimate.pincode) {
        message =
          message +
          ' pincode changed from ' +
          serviceEstimateExists.pincode +
          ' to ' +
          serviceEstimate.pincode +
          ' ,';
      }
      if (serviceEstimateExists.serviceType != serviceEstimate.serviceType) {
        message =
          message +
          ' serviceType changed from ' +
          serviceEstimateExists.serviceType +
          ' to ' +
          serviceEstimate.serviceType +
          ' ,';
      }
      // console.log('before update service estimate')
      message = message.slice(0, -1);
      let data = await ServiceEstimateDao.updateServiceEstimateMobile(
        serviceEstimate,
        user
      );
      // console.log('service after update service estimate',serviceEstimate);
      serviceEstimateDetail = serviceEstimate.estimateId;
      if (data) {
        const labourEstimateOld = serviceEstimateExists.labourEstimate;
        const labourEstimate = serviceEstimate.laborEstimate;

        // console.log('service line 600',labourEstimate)
        let labourData = {};
        if (labourEstimate) {

          let delLabor = labourEstimateOld.filter(del => !labourEstimate.some(newOne => newOne.id === del.id));

          if (delLabor.length > 0) {
            for (const del of delLabor) {
              await ServiceEstimateDao.deleteServiceLabourEstimateMobile(
                serviceEstimate.estimateId
              );
            }
          };
          for (let labourEstimateObj of labourEstimate) {
            labourEstimateObj['serviceEstimateId'] = serviceEstimate.estimateId;

            if (labourEstimateObj.id) {
              labourData = await ServiceEstimateDao.updateServiceLabourEstimateMobile(
                labourEstimateObj,
                user
              );
            } else {
              labourData = await ServiceEstimateDao.createServiceLabourEstimateMobile(
                labourEstimateObj,
                user
              );
            }

            if (labourEstimateObj.id) {
              laborEstimateDetails.push({
                id: labourEstimateObj.id.toString(),
                laborId: labourEstimateObj.laborId.toString(),
                fitId: labourEstimateObj.fitId.toString(),
              });
            } else {
              laborEstimateDetails.push({
                id: labourData.id.toString(),
                laborId: labourData.laborId.toString(),
                fitId: labourData.fitId.toString(),
              });
            }
          }
        };

        const oslLaborEstimateOld = serviceEstimateExists.oslLabourEstimate;
        const oslLaborEstimate = serviceEstimate.oslLaborSchedules;

        let oslLabourData = {};
        if (oslLaborEstimate) {
          let delOslLabor = oslLaborEstimateOld.filter(del => !oslLaborEstimate.some(newOne => newOne.id === del.id));

          if (oslLaborEstimate) {
            for (const del of delOslLabor) {
              await ServiceEstimateDao.deleteOslServiceLabourEstimateMobile(
                serviceEstimate.estimateId
              );
            }
          };

          for (let oslLabourEstimateObj of oslLaborEstimate) {
            oslLabourEstimateObj['serviceEstimateId'] = serviceEstimate.estimateId;
            if (oslLabourEstimateObj.id) {
              oslLabourData = await ServiceEstimateDao.updateServiceOslLabourEstimateMobile(
                oslLabourEstimateObj,
                user
              );
            } else {
              oslLabourData = await ServiceEstimateDao.createServiceOslLabourEstimateMobile(
                oslLabourEstimateObj,
                user
              );
            }

            if (oslLabourEstimateObj.id) {
              oslLaborSchedules.push({
                id: oslLabourEstimateObj.id.toString(),
                laborId: oslLabourEstimateObj.laborId.toString(),
                fitId: oslLabourEstimateObj.fitId.toString(),
              });
            } else {
              oslLaborSchedules.push({
                id: oslLabourData.id.toString(),
                laborId: oslLabourData.laborId.toString(),
                fitId: oslLabourData.fitId.toString(),
              });
            }

          }
        }

        const partEstimateOld = serviceEstimateExists.partEstimate;
        const partEstimate = serviceEstimate.partEstimate;


        let partsEstimate = {};
        if (partEstimate) {
          let delParts = partEstimateOld.filter(del => !partEstimate.some(newOne => newOne.id === del.id));

          if (partEstimate) {
            for (const del of delParts) {
              await ServiceEstimateDao.deleteServicePartsEstimateMobile(
                serviceEstimate.estimateId
              );
            }
          };
          for (let partEstimateObj of partEstimate) {
            partEstimateObj['serviceEstimateId'] = serviceEstimate.estimateId;
            if (partEstimateObj.id) {
              partsEstimate = await ServiceEstimateDao.updateServicePartsEstimateMobile(
                partEstimateObj,
                user
              );
            } else {
              partsEstimate = await ServiceEstimateDao.createServicePartsEstimateMobile(
                partEstimateObj,
                user
              );
            }

            if (partEstimateObj.id) {
              partEstimates.push({
                id: partEstimateObj.id.toString(),
                partId: partEstimateObj.partId.toString(),
                fitId: partEstimateObj.fitId.toString(),
              });
            } else {
              partEstimates.push({
                id: partsEstimate.id.toString(),
                partId: partsEstimate.partId.toString(),
                fitId: partsEstimate.fitId.toString(),
              });
            }
          }
        }
      };
      result = 'success';
    };

    if (message) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Service Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
    }
    result = 'success';

  } catch (err) {
    logger.error('Service Estimate Service  updateServiceEstimateMobile()', err);
  }

  return {
    result: 'success',
    serviceEstimateDetail: serviceEstimateDetail,
    laborEstimate: laborEstimateDetails,
    oslLaborSchedules: oslLaborSchedules,
    partEstimates: partEstimates
  };
};

const generateServiceEstimateNumber = async (jobType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  }
  else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentEstimateData =
    await ServiceEstimateDao.getRecentServiceEstimate(jobType, outletCode, currentYear);
  if (recentEstimateData) {
    const lastNumber = recentEstimateData.serviceEstimateNumber.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `${jobType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const listServiceEstimate = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await ServiceEstimateDao.listServiceEstimate(
      reqData,
      user
    );

    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('ServiceBooking service listServiceBookings', err);
    next(err);
  }
};

const getServiceEstimate = async (id, outlet) => {
  const resultList = [];
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const bookingObj = {};
  const labourObj = [];
  const items = [];
  try {
    const data = await ServiceEstimateDao.getServiceEstimate(id);
    if (!data) {
      throw new Error(`Service estimate ${id} was not found`);
    }
    const gstStatus = data.gstStatus === true || data.gstStatus === 1 || data.gstStatus === '1' || data.gstStatus === 'true';

    (outletObj['name'] = outlet.outletCode),
      (outletObj['address'] = outlet.address1),
      (outletObj['city'] = outlet.city),
      (outletObj['state'] = outlet.state),
      (outletObj['pincode'] = outlet.pincode),
      (outletObj['phone'] = outlet.phoneNumber),
      (outletObj['mobile'] = outlet.phoneNumber),
      (outletObj['email'] = outlet.email),
      (outletObj["outletName"] = outlet.outletName),
      (outletObj['dealerGstin'] = outlet.gstIn);

    const currentDate = new Date(data.createdAt);
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    (bookingObj['documentName'] = data.serviceEstimateNumber),
      (bookingObj['documentDate'] = formattedDate),
      (bookingObj['branch'] = outlet.outletCode),
      (bookingObj['outletName'] = outlet.outletName),
      (bookingObj['make'] = data.vehicle.make.makeName),
      (bookingObj['model'] = data.vehicle.model.modelName),
      (bookingObj['regNo'] = data.registrationNumber),
      (bookingObj['kmReading'] = data.odometer);

    (customerObj['name'] =
      data.customer.dataValues.decryptedFirstName + ' ' + data.customer.dataValues.decryptedLastName),
      (customerObj['gstin'] = data.customer.gstinNumber),
      (customerObj['branch'] = outlet.outletCode),
      (customerObj['address'] =
        data.customer.address1 +
        ', ' +
        data.customer.city +
        ', ' +
        data.customer.state +
        ', ' +
        data.customer.pinCode),
      (customerObj['insuranceCompany'] = data.vehicle?.insuranceName || ''),
      (customerObj['insuranceClaimNo'] = data.vehicle?.insuranceClaimNo || ''),
      (customerObj['insuranceExpiryDate'] = data.vehicle?.insuranceExpDate || ''),
      (customerObj['chassisNo'] = data.vehicle.chassisNumber),
      (customerObj['serviceType'] = data.serviceType);

    let sno = 1;
    const labours = [];
    let labourTotals = {
      qty: 0,
      rate: 0,
      discount: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      amount: 0,
    };

    let itemTotals = {
      qty: 0,
      rate: 0,
      discount: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      amount: 0,
    };

    let itemTotalAmount = 0;
    let laborTotalAmount = 0;
    data.labourEstimate.forEach((labor) => {
      // console.log('additional margin value if there', labor.additionalMargin);

      const baseAmount = parseFloat((labor.quantity * labor.rate).toFixed(2));
      const additionalMargin = parseFloat((labor.additionalMargin || 0).toFixed(2));
      const discountAmount = parseFloat((labor.discountAmount || 0).toFixed(2));

      const marginAmount = parseFloat(
        (baseAmount + additionalMargin - discountAmount).toFixed(2)
      );

      const igstAmount = gstStatus ? parseFloat(((Number(labor.igst || 0) / 100) * marginAmount).toFixed(2)) : 0;
      const cgstAmount = gstStatus ? parseFloat(((Number(labor.cgst || 0) / 100) * marginAmount).toFixed(2)) : 0;
      const sgstAmount = gstStatus ? parseFloat(((Number(labor.sgst || 0) / 100) * marginAmount).toFixed(2)) : 0;

      const amount = parseFloat(
        (marginAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
      );

      const rateWithMargin = parseFloat((baseAmount + additionalMargin).toFixed(2));

      const outletLabour = {
        name: labor.laborCode,
        description: labor.laborDescription,
        sacCode: labor.sacCode,
        qty: labor.quantity.toFixed(2),
        rate: rateWithMargin.toFixed(2),
        discount: discountAmount.toFixed(2),
        igst: igstAmount.toFixed(2),
        cgst: cgstAmount.toFixed(2),
        sgst: sgstAmount.toFixed(2),
        amount: amount.toFixed(2),
        sno: sno++,
      };

      labours.push(outletLabour);

      labourTotals.qty += labor.quantity;
      labourTotals.rate += rateWithMargin;
      labourTotals.discount += discountAmount;
      labourTotals.igst += igstAmount;
      labourTotals.cgst += cgstAmount;
      labourTotals.sgst += sgstAmount;
      labourTotals.amount += amount;

      laborTotalAmount += amount;
    });


    data.oslLabourEstimate.forEach((osl) => {
      const baseAmount = parseFloat((osl.quantity * osl.rate).toFixed(2));
      const additionalMargin = parseFloat((osl.additionalMargin || 0).toFixed(2));
      const discountAmount = parseFloat((osl.discountAmount || 0).toFixed(2));

      const marginAmount = parseFloat(
        (baseAmount + additionalMargin - discountAmount).toFixed(2)
      );



      const igstAmount = gstStatus ? parseFloat(((Number(osl.igst || 0) / 100) * marginAmount).toFixed(2)) : 0;
      const cgstAmount = gstStatus ? parseFloat(((Number(osl.cgst || 0) / 100) * marginAmount).toFixed(2)) : 0;
      const sgstAmount = gstStatus ? parseFloat(((Number(osl.sgst || 0) / 100) * marginAmount).toFixed(2)) : 0;

      const amount = parseFloat(
        (marginAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
      );

      const rateWithMargin = parseFloat((baseAmount + additionalMargin).toFixed(2));


      const oslLabour = {
        name: osl.laborCode,
        description: osl.laborDescription,
        sacCode: osl.sacCode,
        qty: osl.quantity.toFixed(2),
        rate: rateWithMargin.toFixed(2),
        discount: discountAmount.toFixed(2),
        igst: igstAmount.toFixed(2),
        cgst: cgstAmount.toFixed(2),
        sgst: sgstAmount.toFixed(2),
        amount: amount.toFixed(2),
        sno: sno++,
      };
      labours.push(oslLabour);

      labourTotals.qty += osl.quantity;
      labourTotals.rate += rateWithMargin;
      labourTotals.discount += discountAmount;
      labourTotals.igst += igstAmount;
      labourTotals.cgst += cgstAmount;
      labourTotals.sgst += sgstAmount;
      labourTotals.amount += amount;

      laborTotalAmount += amount;
    });



    let itemCount = 1;
    data.partEstimate.forEach((itm) => {
      const baseAmount = parseFloat((itm.requestedQuantity * itm.rate).toFixed(2));
      const additionalMargin = Number(itm.additionalMargin || 0);
      const discountAmount = Number(itm.discountAmount || 0);
      const taxableAmount = parseFloat((baseAmount + additionalMargin - discountAmount).toFixed(2));
      const igstAmount = gstStatus ? parseFloat(((Number(itm.igst || 0) / 100) * taxableAmount).toFixed(2)) : 0;
      const cgstAmount = gstStatus ? parseFloat(((Number(itm.cgst || 0) / 100) * taxableAmount).toFixed(2)) : 0;
      const sgstAmount = gstStatus ? parseFloat(((Number(itm.sgst || 0) / 100) * taxableAmount).toFixed(2)) : 0;
      const amount = parseFloat((taxableAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2));

      const estimateItem = {
        name: itm.partNo,
        description: itm.partDescription,
        hsnCode: itm.hsnCode,
        qty: itm.requestedQuantity.toFixed(2),
        rate: itm.rate.toFixed(2),
        discount: discountAmount.toFixed(2),
        igst: igstAmount.toFixed(2),
        cgst: cgstAmount.toFixed(2),
        sgst: sgstAmount.toFixed(2),
        amount: amount.toFixed(2),
        sno: itemCount++,
      };

      items.push(estimateItem);

      itemTotals.qty += itm.requestedQuantity;
      itemTotals.rate += itm.rate;
      itemTotals.discount += discountAmount;
      itemTotals.igst += igstAmount;
      itemTotals.cgst += cgstAmount;
      itemTotals.sgst += sgstAmount;
      itemTotals.amount += amount;

      itemTotalAmount += amount;
    });

    labourTotals.qty = labourTotals.qty.toFixed(2);
    labourTotals.rate = labourTotals.rate.toFixed(2);
    labourTotals.discount = labourTotals.discount.toFixed(2);
    labourTotals.igst = labourTotals.igst.toFixed(2);
    labourTotals.cgst = labourTotals.cgst.toFixed(2);
    labourTotals.sgst = labourTotals.sgst.toFixed(2);
    labourTotals.amount = labourTotals.amount.toFixed(2);

    itemTotals.qty = itemTotals.qty.toFixed(2);
    itemTotals.rate = itemTotals.rate.toFixed(2);
    itemTotals.discount = itemTotals.discount.toFixed(2);
    itemTotals.igst = itemTotals.igst.toFixed(2);
    itemTotals.cgst = itemTotals.cgst.toFixed(2);
    itemTotals.sgst = itemTotals.sgst.toFixed(2);
    itemTotals.amount = itemTotals.amount.toFixed(2);

    const totals = {};
    totals['labours'] = labourTotals;
    totals['items'] = itemTotals;
    totals['grandTotal'] = (itemTotalAmount + laborTotalAmount).toFixed(2);
    const taxTotal = parseFloat((
      Number(labourTotals.igst) + Number(labourTotals.cgst) + Number(labourTotals.sgst) +
      Number(itemTotals.igst) + Number(itemTotals.cgst) + Number(itemTotals.sgst)
    ).toFixed(2));
    totals['taxTotal'] = taxTotal.toFixed(2);
    totals['subTotal'] = (Number(totals.grandTotal) - taxTotal).toFixed(2);
    let amountInWords = numberToWords(Math.round(itemTotalAmount + laborTotalAmount));

    resObj['id'] = data.id;
    resObj['serviceEstimateNumber'] = data.serviceEstimateNumber;
    resObj['status'] = data.status;
    resObj['gstStatus'] = gstStatus;
    resObj['booking'] = bookingObj;
    resObj['branch'] = outletObj;
    resObj['customer'] = customerObj;
    resObj['labours'] = labours;
    resObj['items'] = items;
    resObj['totals'] = totals;
    resObj['amountInWords'] = amountInWords;
    resObj['customerVoice'] = data.customerVoice;
    resObj['estimateApproved'] = data.estimateApproved;
    resObj['estimateApprovedBy'] = data.estimateApprovedBy;
    resObj['estimateApprovedByName'] = data.estimateApprovedByName;
    resObj['estimateApprovedAt'] = data.estimateApprovedAt;
    // console.log('final data from before pdf ',resObj)
    //     return false;
    return resObj;
  } catch (err) {
    logger.error('ServiceEstimate service getServiceEstimate', err);
    throw err;
  }
};

const approveServiceEstimate = async (estimateId, user, approvedAt) => {
  return await ServiceEstimateDao.approveServiceEstimate(estimateId, user, approvedAt);
};

const getEstimateShareDetails = async (estimateId, outletId) => {
  return await ServiceEstimateDao.getEstimateShareDetails(estimateId, outletId);
};

function numberToWords(num) {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const g = ['', 'Thousand', 'Million', 'Billion'];

  let words = '';

  function toWords(n, idx) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ' + g[idx] + ' ';
    if (n < 100)
      return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ' + g[idx] + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100, idx);
  }

  if (num === 0) return 'Zero';
  let idx = 0;
  while (num > 0) {
    let rem = num % 1000;
    if (rem > 0) words = toWords(rem, idx) + words;
    num = Math.floor(num / 1000);
    idx++;
  }
  return words.trim() + ' Rupees Only';
}

const getOpenEstimates = async (user) => {
  const resultList = [];
  try {
    const data = await ServiceEstimateDao.getOpenEstimates(user);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['serviceEstimate'] =
        element.serviceEstimateNumber + ' / ' + element.registrationNumber;
      resObj['serviceEstimateNumber'] = element.serviceEstimateNumber;
      resObj['registrationNumber'] = element.registrationNumber;
      resObj['customerCode'] = element.customer.customerCode;
      resultList.push(resObj);
    });
    return resultList;
  } catch (err) {
    logger.error('ServiceEstimate Service getOpenEstimates Error:', err);
    next(err);
  }
};

const getServiceEstimateMobile = async (serviceId) => {
  const resultList = [];
  let estimateId = "";
  try {
    estimateId = await JobCard.findOne({
      where: {
        id: serviceId.VISIT_ID
      }
    })
    const data = await ServiceEstimateDao.getServiceEstimateMobile(estimateId.service_estimate_id);
    if (Array.isArray(data)) {
      data.forEach(async (element) => {
        const fieldsToMap = [
          { decryptedField: 'decryptedCustomerName', originalField: 'customerName' },
          { decryptedField: 'decryptedCustomerMobileNumber', originalField: 'customerMobileNumber' },
        ];

        fieldsToMap.forEach(field => {
          element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
          delete element.dataValues[field.decryptedField];
        });
      });
    } else if (data && typeof data === 'object') {
      const element = data;
      const fieldsToMap = [
        { decryptedField: 'decryptedCustomerName', originalField: 'customerName' },
        { decryptedField: 'decryptedCustomerMobileNumber', originalField: 'customerMobileNumber' },
      ];

      fieldsToMap.forEach(field => {
        element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
        delete element.dataValues[field.decryptedField];
      });
    } else {
      console.error("No data found");
    };

    let estimateResponse = [];

    const labourEstimate = [];
    let oslLabourEstimate = [];
    let partEstimate = [];

    if (data.length > 0) {
      estimateResponse = data[0].labourEstimate.map(item => ({
        id: "",
        ESTIMATE_ID: estimateId.service_estimate_id,
        ESTIMATION_APPROVAL_STATUS: item.approveStatus,
        ESTIMATION_TYPE: "LABOUR",
        ESTIMATION_OBJECT_ID: item.laborId,
        ESTIMATION_OBJECT: {
          id: item.id,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          rate: item.rate,
          laborId: item.laborId,
          laborCode: item.laborCode,
          approveStatus: "true",
          sacCode: item.sacCode,
          laborTotal: item.laborTotal,
          discountAmount: "",
          singleAmount: item.singleAmount,
          laborDescription: item.laborDescription,
          additionalMargin: item.additionalMargin,
          quantity: item.quantity,
          approvedatetime: item.approveDatetime,
          serviceRecommendation: false,
          repairTypeName: item.repairTypeName,
          repairTypeId: item.repairTypeId
        }
      }));
      // labourEstimate.forEach(item => {
      //   delete item.dataValues.sacCode;
      //   delete item.dataValues.serviceRecommendation;
      //   delete item.dataValues.osl;
      //   delete item.dataValues.vendorId;
      //   delete item.dataValues.marginPercentage;
      // });

      // for(let item of data[0].labourEstimate) {
      //   const approveDatetime = moment(item.approveDatetime).tz('Asia/kolkata').format('DD-MM-YYYY');

      //   let jsonLaborEstimate = {};
      //   jsonLaborEstimate['id'] = item.id.toString();
      //   jsonLaborEstimate['serviceEstimateId'] = item.serviceEstimateId.toString();
      //   jsonLaborEstimate['laborId'] = item.laborId.toString();
      //   jsonLaborEstimate['laborCode'] = item.laborCode.toString();
      //   jsonLaborEstimate['laborDescription'] = item.laborDescription.toString();
      //   jsonLaborEstimate['quantity'] = item.quantity.toString();
      //   jsonLaborEstimate['additionalMargin'] = item.additionalMargin.toString();
      //   jsonLaborEstimate['singleAmount'] = item.singleAmount.toString();
      //   jsonLaborEstimate['rate'] = item.rate.toString();
      //   jsonLaborEstimate['discountAmount'] = item.discountAmount.toString();
      //   jsonLaborEstimate['sgst'] = item.sgst.toString();
      //   jsonLaborEstimate['cgst'] = item.cgst.toString();
      //   jsonLaborEstimate['igst'] = item.igst.toString();
      //   jsonLaborEstimate['laborTotal'] = item.laborTotal.toString();
      //   jsonLaborEstimate['fitId'] = item.fitId.toString();
      //   jsonLaborEstimate['approveStatus'] = item.approveStatus.toString();
      //   jsonLaborEstimate['approveDatetime'] = approveDatetime;
      //   jsonLaborEstimate['repairTypeId'] = item.repairTypeId.toString();
      //   jsonLaborEstimate['fitId'] = item.repairTypeName.toString();

      //   labourEstimate.push(jsonLaborEstimate);
      // };
    };

    if (data.length > 0) {
      oslLabourEstimate = data[0].oslLabourEstimate.map(item => ({
        id: "",
        ESTIMATE_ID: estimateId.service_estimate_id,
        ESTIMATION_APPROVAL_STATUS: item.approveStatus,
        ESTIMATION_TYPE: "OSL",
        ESTIMATION_OBJECT_ID: item.laborId,
        ESTIMATION_OBJECT: {
          id: item.id,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          rate: item.rate,
          laborId: item.laborId,
          laborCode: item.laborCode,
          approveStatus: "true",
          sacCode: item.sacCode,
          laborTotal: item.laborTotal,
          discountAmount: "",
          singleAmount: item.singleAmount,
          laborDescription: item.laborDescription,
          additionalMargin: item.additionalMargin,
          quantity: item.quantity,
          vendorId: item.vendorId,
          approvedatetime: item.approveDatetime,
          serviceRecommendation: false
        }
      }));
      // oslLabourEstimate.forEach(item => {
      //   delete item.dataValues.sacCode;
      //   delete item.dataValues.serviceRecommendation;
      //   delete item.dataValues.osl;
      //   delete item.dataValues.marginPercentage;
      // });

      // for(let item of data[0].oslLabourEstimate) {
      //   const approveDatetime = moment(item.approveDatetime).tz('Asia/kolkata').format('DD-MM-YYYY');
      //   let jsonLaborEstimate = {};
      //   jsonLaborEstimate['id'] = item.id.toString();
      //   jsonLaborEstimate['serviceEstimateId'] = item.serviceEstimateId.toString();
      //   jsonLaborEstimate['laborId'] = item.laborId.toString();
      //   jsonLaborEstimate['laborCode'] = item.laborCode.toString();
      //   jsonLaborEstimate['laborDescription'] = item.laborDescription.toString();
      //   jsonLaborEstimate['quantity'] = item.quantity.toString();
      //   jsonLaborEstimate['additionalMargin'] = item.additionalMargin.toString();
      //   jsonLaborEstimate['singleAmount'] = item.singleAmount.toString();
      //   jsonLaborEstimate['rate'] = item.rate.toString();
      //   jsonLaborEstimate['discountAmount'] = item.discountAmount.toString();
      //   jsonLaborEstimate['sgst'] = item.sgst.toString();
      //   jsonLaborEstimate['cgst'] = item.cgst.toString();
      //   jsonLaborEstimate['igst'] = item.igst.toString();
      //   jsonLaborEstimate['laborTotal'] = item.laborTotal.toString();
      //   jsonLaborEstimate['fitId'] = item.fitId.toString();
      //   jsonLaborEstimate['approveStatus'] = item.approveStatus.toString();
      //   jsonLaborEstimate['vendorId'] = item.vendorId.toString();
      //   jsonLaborEstimate['approveDatetime'] = approveDatetime;

      //   oslLabourEstimate.push(jsonLaborEstimate);
      // }
    }

    if (data.length > 0) {
      partEstimate = data[0].partEstimate.map(item => ({
        id: "",
        ESTIMATE_ID: estimateId.service_estimate_id,
        ESTIMATION_APPROVAL_STATUS: item.approveStatus,
        ESTIMATION_TYPE: "PARTS",
        ESTIMATION_OBJECT_ID: item.partId,
        ESTIMATION_OBJECT: {
          id: item.id,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          rate: item.rate,
          partId: item.partId,
          partNo: item.partNo,
          approveStatus: "true",
          hsnCode: item.hsnCode,
          partTotal: item.partTotal,
          discountAmount: item.discountAmount,
          partDescription: item.partDescription,
          additionalMargin: item.additionalMargin,
          requestedQuantity: item.requestedQuantity,
          approvedatetime: item.approveDatetime,
          serviceRecommendation: false
        }
      }));
      // partEstimate.forEach(item => {
      //   delete item.dataValues.serviceRecommendation;
      // });

      // for(let item of data[0].partEstimate) {
      //   const approveDatetime = moment(item.approveDatetime).tz('Asia/kolkata').format('DD-MM-YYYY');
      //   let jsonLaborEstimate = {};
      //   jsonLaborEstimate['id'] = item.id.toString();
      //   jsonLaborEstimate['serviceEstimateId'] = item.serviceEstimateId.toString();
      //   jsonLaborEstimate['partId'] = item.partId.toString();
      //   jsonLaborEstimate['partNo'] = item.partNo.toString();
      //   jsonLaborEstimate['partDescription'] = item.partDescription.toString();
      //   jsonLaborEstimate['hsnCode'] = item.hsnCode.toString();
      //   jsonLaborEstimate['rate'] = item.rate.toString();
      //   jsonLaborEstimate['additionalMargin'] = item.additionalMargin.toString();
      //   jsonLaborEstimate['discountAmount'] = item.discountAmount.toString();
      //   jsonLaborEstimate['sgst'] = item.sgst.toString();
      //   jsonLaborEstimate['cgst'] = item.cgst.toString();
      //   jsonLaborEstimate['igst'] = item.igst.toString();
      //   jsonLaborEstimate['partTotal'] = item.partTotal.toString();
      //   jsonLaborEstimate['fitId'] = item.fitId.toString();
      //   jsonLaborEstimate['approveStatus'] = item.approveStatus.toString();
      //   jsonLaborEstimate['approveDatetime'] = approveDatetime;

      //   partEstimate.push(jsonLaborEstimate);
      // }
    };

    estimateResponse = [...estimateResponse, ...partEstimate, ...oslLabourEstimate];


    if (data.length > 0) {
      return {
        result: "success",
        estimateId: estimateId.service_estimate_id,
        Estimation: estimateResponse,
        message: "Yes"
      };
    } else {
      return {
        result: "success",
        message: "No"
      };
    }
  } catch (err) {
    logger.error('ServiceEstimate Service getServiceEstimateMobile Error:', err);
    next(err);
  }
};

const loadOpenEstimate = async (reqData) => {
  const resultList = [];
  try {
    const data = await ServiceEstimateDao.loadOpenEstimate(
      reqData.selectedServiceEstimate.id
    );
    const resObj = {};
    resObj['id'] = data.id;
    resObj['serviceEstimateNumber'] = data.serviceEstimateNumber;
    resObj['registrationNumber'] = data.registrationNumber;
    resObj['customerName'] = data.customerName;
    resObj['odometer'] = data.odometer;
    resObj['customerMobileNumber'] = data.customerMobileNumber;
    resObj['jobType'] = data.jobType;
    resObj['serviceType'] = data.serviceType;
    resObj['source'] = data.source;
    resObj['sourceType'] = data.sourceType;
    resObj['repairType'] = data.repairType;
    resObj['make'] = data.vehicle.make.makeName;
    resObj['model'] = data.vehicle.model.modelName;

    resObj['labourEstimate'] = data.labourEstimate;
    resObj['oslLabourEstimate'] = data.oslLabourEstimate;
    resObj['partEstimate'] = data.partEstimate;
    resObj['contract'] = data.vehicle?.vehicleContracts ?? [];

    return resObj;
  } catch (err) {
    logger.error('ServiceEstimate Service loadOpenEstimate Error:', err);
    next(err);
  }
};

const getVehicleWithRegNo = async (regNo) => {
  const vehicle = await ServiceEstimateDao.getVehicleWithRegNo(regNo);
  if (vehicle)
    return vehicle;
  else
    return {};
}

const getServiceEstimateMobileApproved = async (serviceId) => {
  const resultList = [];
  let estimateId = "";
  try {
    estimateId = await JobCard.findOne({
      where: {
        id: serviceId.VISIT_ID
      }
    })
    const data = await utils.getEstimation(serviceId.VISIT_ID, estimateId.service_estimate_id);

    if (data) {
      return {
        result: "success",
        estimateId: estimateId.service_estimate_id,
        Estimation: data.estimateResponse,
        message: "Yes"
      };
    } else {
      return {
        result: "success",
        message: "No"
      };
    }
  } catch (err) {
    logger.error('ServiceEstimate Service getServiceEstimateMobile Error:', err);
    next(err);
  }
};

const ServiceEstimateService = {
  createServiceEstimate,
  searchEstimateLineItems,
  getEstimateLineItemDetails,
  listServiceEstimate,
  getServiceEstimate,
  approveServiceEstimate,
  getEstimateShareDetails,
  updateServiceEstimate,
  getOpenEstimates,
  loadOpenEstimate,
  getVehicleWithRegNo,
  createServiceEstimateMobile,
  updateServiceEstimateMobile,
  getServiceEstimateMobile,
  getServiceEstimateMobileApproved
};

export default ServiceEstimateService;
