import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, fn, col } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import moment from "moment";

const ServiceEstimate = db.servicEstimates;
const LabourEstimate = db.labourEstimates;
const OslLabourEstimate = db.oslLabourEstimate;
const PartsEstimate = db.partsEstimates;

const Model = db.models;
const Make = db.makes;
const Vehicle = db.vehicles;
const Customer = db.customers;
const ServiceType = db.servicetypes;
const ServiceBooking = db.servicebookings;
const Source = db.sources;
const SourceType = db.sourcetypes;
const RepairType = db.repairtypes;
const vehicleContract = db.vehicleContract;
const vehicleContractScheme = db.vehicleContractScheme;
const Scheme = db.scheme;
const Schedules = db.schedules;
const oslLaborSchedules = db.oslSchedules;
const partsIndent = db.partsIndent
const JobCard = db.jobCard;

const createServiceEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  console.log(currentDate);
  try {
    const customerName = db.sequelize.fn('HEX', db.sequelize.fn('AES_ENCRYPT', estimateData.customerName, encryptConfig.code));
    const customerMobileNumber = db.sequelize.fn('HEX', db.sequelize.fn('AES_ENCRYPT', estimateData.customerMobileNumber, encryptConfig.code));

    data = await ServiceEstimate.create({
      outletId: user.outlet.id,
      serviceEstimateNumber: estimateData.serviceEstimateNumber,
      status: estimateData.status ? estimateData.status : 1,
      gstStatus: estimateData.gstStatus ?? false,
      vehicleId: estimateData.vehicleId,
      registrationNumber: estimateData.registrationNumber,
      vehicleMakeId: estimateData.makeId,
      vehicleModelId: estimateData.modelId,
      customerId: estimateData.customerId,
      customerName: customerName,
      customerMobileNumber: customerMobileNumber,
      customerAddress: estimateData.customerAddress,
      customerState: estimateData.customerState,
      customerCity: estimateData.customerCity,
      customerPincode: estimateData.pincode,
      customerVoice: estimateData.customerVoice,
      serviceEngineerRemarks: estimateData.serviceEngineerRemarks,
      source: estimateData.sourceId,
      sourceType: estimateData.sourceTypeId,
      odometer: estimateData.odometer,
      driverMobileNumber: estimateData.driverMobileNumber,
      driverName: estimateData.driverName,
      jobType: estimateData.jobType,
      serviceType: estimateData.serviceTypeId,
      repairType: estimateData.repairTypeId,
      expectedWorkCompletedDate: estimateData.expectedWorkCompletedDate
        ? estimateData.expectedWorkCompletedDate
        : '2024-07-23',
      serviceBookingId: estimateData.serviceBookingId
        ? estimateData.serviceBookingId
        : null,
      serviceBookingNo: estimateData.serviceBookingNo
        ? estimateData.serviceBookingNo
        : null,
      inventoryReportLink:
        'https://tvsfit.mytvs.in/reporting/vrm/landingpages/estimates/v9/#!/inventory/852561',
      createdby: user.id,
      modifiedBy: user.id,
    });
  } catch (err) {
    console.log(err);
    logger.error('Model Dao addModel', err);
    throw err;
  }

  return data;
};

const createServiceEstimateMobile = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  // Convert expectedWorkCompletedDate into MySQL DATETIME format
  let formattedDate = null;
  if (estimateData.expectedWorkCompletedDate) {

    formattedDate = moment(
      estimateData.expectedWorkCompletedDate,
      ["YYYY-MM-DD hh:mm A", "YYYY-MM-DD hh A"]
    ).format("YYYY-MM-DD HH:mm:ss");
  }
  const vehicleData = await Vehicle.findAll({
    where: { id: estimateData.vehicleId }
  });
  // console.log('eeeeeeeee',vehicleData)
  if (!vehicleData) {
    throw new Error(`Vehicle with id ${estimateData.vehicleId} not found`);
  }
  const customerData = await Customer.findAll({
    where: { id: vehicleData[0].customerId }
  });
  if (!customerData) {
    throw new Error(`customerData with id ${vehicleData[0].customerId} not found`);
  }
  // console.log('ffffffffffff',customerData)
  const sourceData = await Source.findAll({
    where: { id: estimateData.source }
  });
  if (!sourceData) {
    throw new Error(`sourceData with id ${estimateData.source} not found`);
  }
  // console.log('check for sourceTypeData',sourceData)
  const sourceTypeData = await SourceType.findAll({
    where: { id: estimateData.sourceType }
  });
  if (!sourceTypeData) {
    throw new Error(`sourceTypeData with id ${estimateData.sourceType} not found`);
  }
  // console.log('check for sourceTypeData',sourceTypeData)
  const serviceTypeData = await ServiceType.findAll({
    where: { id: estimateData.serviceType }
  });
  if (!serviceTypeData) {
    throw new Error(`serviceTypeData with id ${estimateData.serviceType} not found`);
  }
  // console.log('check for serviceTypeData',serviceTypeData)
  const RepairTypeData = await RepairType.findAll({
    where: { id: estimateData.repairType }
  });
  if (!RepairTypeData) {
    throw new Error(`RepairTypeData with id ${estimateData.repairType} not found`);
  }
  // console.log('check for rapirTypeData',RepairTypeData)
  try {

    const jobCard = await JobCard.findOne({
      where: {
        id: estimateData.VISIT_ID
      }
    })

    data = await ServiceEstimate.create({
      outletId: user.outlet.id,
      serviceEstimateNumber: estimateData.serviceEstimateNumber,
      status: estimateData.status ? estimateData.status : 1,
      vehicleId: estimateData.vehicleId,
      registrationNumber: vehicleData[0].registrationNumber,
      vehicleMakeId: vehicleData[0].makeId,
      vehicleModelId: vehicleData[0].modelId,
      customerId: vehicleData[0].customerId,
      customerName: customerData[0].firstName ?? null,
      customerMobileNumber: customerData[0].mobileNumber ?? null,
      customerAddress: customerData[0].address1 ?? null,
      customerState: customerData[0].state ?? null,
      customerCity: customerData[0].city ?? null,
      customerPincode: customerData[0].pinCode ?? null,
      customerVoice: estimateData.customerVoice,
      serviceEngineerRemarks: estimateData.technicianRemarks,
      source: sourceData[0].sourceName,
      sourceType: sourceTypeData[0].sourceTypeName,
      odometer: estimateData.odometer,
      driverMobileNumber: estimateData.driverMobileNumber ?? null,
      driverName: estimateData.driverName ?? null,
      jobType: estimateData.jobType,
      serviceType: serviceTypeData[0].serviceTypeName,
      repairType: RepairTypeData[0].repairTypeName,
      expectedWorkCompletedDate: estimateData.expectedWorkCompletedDate
        ? formattedDate
        : null,
      serviceBookingId: jobCard.service_booking_id ? jobCard.service_booking_id : "",
      serviceBookingNo: estimateData.serviceBookingNo
        ? estimateData.serviceBookingNo
        : null,
      inventoryReportLink: estimateData.inventoryReportLink ? estimateData.inventoryReportLink :
        'https://tvsfit.mytvs.in/reporting/vrm/landingpages/estimates/v9/#!/inventory/852561',
      createdby: user.id,
      modifiedBy: user.id,
    });
  } catch (err) {
    console.log(err);
    logger.error('service estimate dao createServiceEstimateMobile', err);
  }

  return data;
};

const updateServiceEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  console.log(currentDate);
  try {
    const updateValues = {
      outletId: user.outlet.id,
      inventoryReportLink: 'https://tvsfit.mytvs.in/reporting/vrm/landingpages/estimates/v9/#!/inventory/852561',
      modifiedBy: user.id,
      estimateApproved: false,
      estimateApprovedBy: null,
      estimateApprovedByName: null,
      estimateApprovedAt: null,
    };
    const fieldMap = {
      serviceEstimateNumber: 'serviceEstimateNumber',
      status: 'status',
      vehicleId: 'vehicleId',
      registrationNumber: 'registrationNumber',
      makeId: 'vehicleMakeId',
      modelId: 'vehicleModelId',
      customerId: 'customerId',
      customerAddress: 'customerAddress',
      customerState: 'customerState',
      customerVoice: 'customerVoice',
      serviceEngineerRemarks: 'serviceEngineerRemarks',
      sourceId: 'source',
      sourceTypeId: 'sourceType',
      odometer: 'odometer',
      driverMobileNumber: 'driverMobileNumber',
      driverName: 'driverName',
      jobType: 'jobType',
      serviceTypeId: 'serviceType',
      repairTypeId: 'repairType',
      expectedWorkCompletedDate: 'expectedWorkCompletedDate',
      serviceBookingId: 'serviceBookingId',
      serviceBookingNo: 'serviceBookingNo',
      gstStatus: 'gstStatus',
    };
    for (const [requestField, modelField] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(estimateData, requestField)) {
        updateValues[modelField] = estimateData[requestField];
      }
    }
    if (Object.prototype.hasOwnProperty.call(estimateData, 'customerName')) {
      updateValues.customerName = db.sequelize.fn('HEX', db.sequelize.fn('AES_ENCRYPT', estimateData.customerName, encryptConfig.code));
    }
    if (Object.prototype.hasOwnProperty.call(estimateData, 'customerMobileNumber')) {
      updateValues.customerMobileNumber = db.sequelize.fn('HEX', db.sequelize.fn('AES_ENCRYPT', estimateData.customerMobileNumber, encryptConfig.code));
    }
    if (Object.prototype.hasOwnProperty.call(estimateData, 'pincode')) {
      updateValues.customerPincode = estimateData.pincode;
    }
    if (Object.prototype.hasOwnProperty.call(estimateData, 'customerCity')) {
      updateValues.customerCity = estimateData.customerCity;
    }
    data = await ServiceEstimate.update(updateValues, { where: { id: estimateData.id } });
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceEstimate', err);
  }

  return data;
};

const approveServiceEstimate = async (estimateId, user, approvedAt) => {
  try {
    const [updatedCount] = await ServiceEstimate.update(
      {
        estimateApproved: true,
        estimateApprovedBy: user.id,
        estimateApprovedByName: user.employeeName || user.employeeCode || null,
        estimateApprovedAt: approvedAt,
        modifiedBy: user.id,
      },
      { where: { id: estimateId, outletId: user.outlet.id } }
    );
    return updatedCount;
  } catch (err) {
    logger.error('ServiceEstimate dao approveServiceEstimate', err);
    throw err;
  }
};

const getEstimateShareDetails = async (estimateId, outletId) => {
  try {
    const estimate = await ServiceEstimate.findOne({
      where: { id: estimateId, outletId },
      attributes: [
        'id',
        'registrationNumber',
        [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`),
          'decryptedCustomerMobileNumber',
        ],
      ],
      include: [{
        model: Customer,
        as: 'customer',
        attributes: [
          'id',
          [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`),
            'decryptedMobileNumber',
          ],
        ],
        required: false,
      }],
    });
    return estimate ? estimate.get({ plain: true }) : null;
  } catch (err) {
    logger.error('ServiceEstimate dao getEstimateShareDetails', err);
    throw err;
  }
};

const updateServiceEstimateMobile = async (estimateData, user) => {
  console.log('service estimate dao ', estimateData);
  let data = {};
  const currentDate = new Date();

  // Convert expectedWorkCompletedDate into MySQL DATETIME format
  let formattedDate = null;
  if (estimateData.expectedWorkCompletedDate) {

    formattedDate = moment(
      estimateData.expectedWorkCompletedDate,
      ["YYYY-MM-DD hh:mm A", "YYYY-MM-DD hh A"]
    ).format("YYYY-MM-DD HH:mm:ss");
  }

  let vehicleData;
  let customerData;
  let sourceData;
  let sourceTypeData;
  let serviceTypeData;
  let RepairTypeData;

  if (estimateData.vehicleId) {
    vehicleData = await Vehicle.findAll({
      where: { id: estimateData.vehicleId }
    });

    customerData = await Customer.findAll({
      where: { id: vehicleData[0].customerId }
    });
  };

  if (estimateData.source) {
    sourceData = await Source.findAll({
      where: { id: estimateData.source }
    });
  };

  if (estimateData.sourceType) {
    sourceTypeData = await SourceType.findAll({
      where: { id: estimateData.sourceType }
    });
  };

  if (estimateData.serviceType) {
    serviceTypeData = await ServiceType.findAll({
      where: { id: estimateData.serviceType }
    });
  };

  if (estimateData.repairType) {
    RepairTypeData = await RepairType.findAll({
      where: { id: estimateData.repairType }
    });
  };
  console.log('before service estimate', estimateData.estimateId);

  const getServiceEstimate = await getServiceEstimateMobile(estimateData.estimateId);
  console.log('-----------------', getServiceEstimate)
  try {
    data = await ServiceEstimate.update(
      {
        outletId: user.outlet.id,
        serviceEstimateNumber: estimateData.serviceEstimateNumber ? estimateData.serviceEstimateNumber : getServiceEstimate.serviceEstimateNumber,
        status: estimateData.status ? estimateData.status : 1,
        vehicleId: estimateData.vehicleId,
        registrationNumber: vehicleData ? vehicleData[0].registrationNumber : getServiceEstimate.registrationNumber,
        vehicleMakeId: vehicleData ? vehicleData[0].makeId : getServiceEstimate.vehicleMakeId,
        vehicleModelId: vehicleData ? vehicleData[0].modelId : getServiceEstimate.vehicleModelId,
        customerId: vehicleData ? vehicleData[0].customerId : getServiceEstimate.customerId,
        customerName: customerData ? customerData[0].firstName : getServiceEstimate.customerName,
        customerMobileNumber: customerData ? customerData[0].customerMobileNumber : getServiceEstimate.customerMobileNumber,
        customerAddress: customerData ? customerData[0].address1 : getServiceEstimate.customerAddress,
        customerState: customerData ? customerData[0].state : getServiceEstimate.customerState,
        customerCity: customerData ? customerData[0].city : getServiceEstimate.customerCity,
        customerPincode: customerData ? customerData[0].pinCode : getServiceEstimate.customerPincode,
        customerVoice: customerData ? customerData[0].customerVoice : getServiceEstimate.customerVoice,

        serviceEngineerRemarks: estimateData.serviceEngineerRemarks ? estimateData.serviceEngineerRemarks : getServiceEstimate.serviceEngineerRemarks,
        source: sourceData ? sourceData[0].sourceName : getServiceEstimate.source,
        sourceType: sourceTypeData ? sourceTypeData[0].sourceTypeName : getServiceEstimate.sourceType,
        odometer: estimateData.odometer ? estimateData.odometer : getServiceEstimate.odometer,
        driverMobileNumber: estimateData.driverMobileNumber ? estimateData.driverMobileNumber : getServiceEstimate.driverMobileNumber,
        driverName: estimateData.driverName ? estimateData.driverName : getServiceEstimate.driverName,
        serviceType: serviceTypeData ? [0].serviceTypeName : getServiceEstimate.serviceType,
        repairType: RepairTypeData ? RepairTypeData[0].repairTypeName : getServiceEstimate.repairType,
        expectedWorkCompletedDate: estimateData.expectedWorkCompletedDate
          ? formattedDate
          : null,
        serviceBookingId: estimateData.serviceBookingId
          ? estimateData.serviceBookingId
          : null,
        serviceBookingNo: estimateData.serviceBookingNo
          ? estimateData.serviceBookingNo
          : null,
        inventoryReportLink:
          'https://tvsfit.mytvs.in/reporting/vrm/landingpages/estimates/v9/#!/inventory/852561',

        modifiedBy: user.id,
      },
      { where: { id: estimateData.estimateId } }
    );
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceEstimate', err);
  }

  return data;
};

// const createServiceLabourEstimate = async (estimateData, user) => {
//   let data = {};
//   const currentDate = new Date();
//   try {
//     if(estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
//       data = await LabourEstimate.create({
//         serviceEstimateId: estimateData.serviceEstimateId,
//         laborId: estimateData.laborId,
//         laborCode: estimateData.laborCode,
//         laborDescription: estimateData.laborDescription,
//         sacCode: estimateData.sacCode,
//         quantity: estimateData.quantity,
//         additionalMargin: estimateData.additionalMargin
//           ? estimateData.additionalMargin
//           : 0,
//         singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',
//         rate: estimateData.rate,
//         discountAmount: estimateData.discountAmount
//           ? estimateData.discountAmount
//           : 0,
//         sgst: estimateData.sgst?estimateData.sgst:'0',
//         cgst: estimateData.cgst? estimateData.cgst:'0',
//         igst: estimateData.igst? estimateData.igst :'0',
//         laborTotal: estimateData.laborTotal,
//         serviceRecommendation: estimateData.serviceRecommendation
//           ? estimateData.serviceRecommendation
//           : 0,
//         fitId: estimateData.fitId ? estimateData.fitId : '0',
//         approveStatus: estimateData.approveStatus
//           ? estimateData.approveStatus
//           : 0,
//         osl: estimateData.osl ? estimateData.osl : '0',
//         vendorId: estimateData.vendorId ? estimateData.vendorId : '0',
//         marginPercentage: estimateData.marginPercentage
//           ? estimateData.marginPercentage
//           : '0',
//         approveDatetime: estimateData.approveDatetime
//           ? estimateData.approveDatetime
//           : currentDate,
//         repairTypeId: estimateData.repairType.id,
//         repairTypeName: estimateData.repairType.repairTypeName,
//       });
//       console.log('createServiceLabourEstimate data', data.id);
//       return data.id;
//     };
//   } catch (err) {
//     console.log(err);
//     logger.error('Service Estimate Dao createServiceLabourEstimate', err);
//   }

//   return data;
// };


const createServiceLabourEstimate = async (estimateData, user) => {
  const currentDate = new Date();
  try {
    if (estimateData.laborId) {
      const data = await LabourEstimate.create({
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode,
        quantity: estimateData.quantity,
        additionalMargin: estimateData.additionalMargin ?? 0,
        singleAmount: estimateData.singleAmount ?? '0',
        rate: estimateData.rate,
        discountAmount: estimateData.discountAmount ?? 0,
        sgst: estimateData.sgst ?? '0',
        cgst: estimateData.cgst ?? '0',
        igst: estimateData.igst ?? '0',
        laborTotal: estimateData.laborTotal,
        serviceRecommendation: estimateData.serviceRecommendation ?? 0,
        fitId: estimateData.fitId ?? '0',
        approveStatus: estimateData.approveStatus ?? 0,
        osl: estimateData.osl ?? '0',
        vendorId: estimateData.vendorId ?? '0',
        marginPercentage: estimateData.marginPercentage ?? '0',
        approveDatetime: estimateData.approveDatetime ?? currentDate,
        repairTypeId: estimateData.repairType?.id,
        repairTypeName: estimateData.repairType?.repairTypeName,
      });
      // console.log('createServiceLabourEstimate data', data.id);
      return data;
    }
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServiceLabourEstimate', err);
  }

  return null;
};

const createServiceLabourEstimateMobile = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
      let formattedDate = null;
      if (estimateData.approvedatetime) {
        formattedDate = moment(
          estimateData.approvedatetime,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      data = await LabourEstimate.create({
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode ? estimateData.sacCode : null,
        quantity: estimateData.quantity,
        singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',
        rate: estimateData.rate,
        additionalMargin: estimateData.additionalMargin
          ? estimateData.additionalMargin
          : 0,
        discountAmount: estimateData.discountAmount
          ? estimateData.discountAmount
          : 0,
        sgst: estimateData.sgst ? estimateData.sgst : '0',
        cgst: estimateData.cgst ? estimateData.cgst : '0',
        igst: estimateData.igst ? estimateData.igst : '0',
        laborTotal: estimateData.laborTotal,
        // serviceRecommendation: estimateData.serviceRecommendation
        //   ? estimateData.serviceRecommendation
        //   : 0,
        fitId: estimateData.fitId ? estimateData.fitId : '0',
        approveStatus: estimateData.approveStatus
          ? estimateData.approveStatus
          : 0,
        // osl: estimateData.osl ? estimateData.osl : '0',
        // vendorId: estimateData.vendorId ? estimateData.vendorId : '0',
        // marginPercentage: estimateData.marginPercentage
        //   ? estimateData.marginPercentage
        //   : '0',
        approveDatetime: formattedDate,
        repairTypeId: estimateData.repairTypeId ? estimateData.repairTypeId : '1',
        repairTypeName: estimateData.repairTypeName ? estimateData.repairTypeName : 'Paid Service',
      });
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServiceLabourEstimate', err);
  }

  return data;
};

const updateServiceLabourEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {

      const existingLabour = await LabourEstimate.findOne({ where: { id: estimateData.id } });

      if (!existingLabour) return null;

      const mergedData = {
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode,
        quantity: estimateData.quantity,
        additionalMargin: estimateData.additionalMargin,
        singleAmount: estimateData.singleAmount ?? existingLabour.singleAmount ?? '0',
        rate: estimateData.rate,
        discountAmount: estimateData.discountAmount,
        sgst: estimateData.sgst ?? existingLabour.sgst ?? '0',
        cgst: estimateData.cgst ?? existingLabour.cgst ?? '0',
        igst: estimateData.igst ?? existingLabour.igst ?? '0',
        laborTotal: estimateData.laborTotal,
        serviceRecommendation: estimateData.serviceRecommendation ?? existingLabour.serviceRecommendation ?? 0,
        fitId: estimateData.fitId ?? existingLabour.fitId ?? '0',
        approveStatus: estimateData.approveStatus ?? existingLabour.approveStatus ?? 0,
        osl: estimateData.osl ?? existingLabour.osl ?? '0',
        vendorId: estimateData.vendorId ?? existingLabour.vendorId ?? '0',
        marginPercentage: estimateData.marginPercentage ?? existingLabour.marginPercentage ?? '0',
        repairTypeId: estimateData.repairType?.id ?? existingLabour.repairTypeId,
        repairTypeName: estimateData.repairType?.repairTypeName ?? existingLabour.repairTypeName,
      };


      // data = await LabourEstimate.update(
      //   {
      //     serviceEstimateId: estimateData.serviceEstimateId,
      //     laborId: estimateData.laborId,
      //     laborCode: estimateData.laborCode,
      //     laborDescription: estimateData.laborDescription,
      //     sacCode: estimateData.sacCode,
      //     quantity: estimateData.quantity,
      //     additionalMargin: estimateData.additionalMargin,
      //     singleAmount: estimateData.singleAmount
      //       ? estimateData.singleAmount
      //       : '0',
      //     rate: estimateData.rate,
      //     discountAmount: estimateData.discountAmount,
      //     sgst: estimateData.sgst?estimateData.sgst:'0',
      //     cgst: estimateData.cgst?estimateData.cgst:'0',
      //     igst: estimateData.igst?estimateData.igst:'0',
      //     laborTotal: estimateData.laborTotal,
      //     serviceRecommendation: estimateData.serviceRecommendation
      //       ? estimateData.serviceRecommendation
      //       : 0,
      //     fitId: estimateData.fitId ? estimateData.fitId : '0',
      //     approveStatus: estimateData.approveStatus
      //       ? estimateData.approveStatus
      //       : 0,
      //     osl: estimateData.osl ? estimateData.osl : '0',
      //     vendorId: estimateData.vendorId ? estimateData.vendorId : '0',
      //     marginPercentage: estimateData.marginPercentage
      //       ? estimateData.marginPercentage
      //       : '0',
      //     // approveDatetime: estimateData.approveDatetime
      //     //   ? estimateData.approveDatetime
      //     //   : '2024-07-24',
      //     repairTypeId: estimateData.repairType.id,
      //     repairTypeName: estimateData.repairType.repairTypeName,
      //   },
      //   { where: { id: estimateData.id } }
      // );
      await LabourEstimate.update(mergedData, { where: { id: estimateData.id } });

      const updatedRecord = await LabourEstimate.findOne({ where: { id: estimateData.id } });
      console.log('labour estimat ', updatedRecord.id);
      return updatedRecord;
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceLabourEstimate', err);
  }
  return data;
};

const updateServiceLabourEstimateMobile = async (estimateData, user) => {
  console.log('update service estimate labour', estimateData);
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
      let formattedDate = null;
      if (estimateData.approvedatetime) {
        formattedDate = moment(
          estimateData.approvedatetime,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      data = await LabourEstimate.update(
        {
          serviceEstimateId: estimateData.serviceEstimateId,
          laborId: estimateData.laborId,
          laborCode: estimateData.laborCode,
          laborDescription: estimateData.laborDescription,
          sacCode: estimateData.sacCode,
          quantity: estimateData.quantity,
          additionalMargin: estimateData.additionalMargin ? estimateData.additionalMargin : 0,
          singleAmount: estimateData.singleAmount
            ? estimateData.singleAmount
            : 0,
          rate: estimateData.rate,
          discountAmount: estimateData.discountAmount ? estimateData.discountAmount : 0,
          sgst: estimateData.sgst ? estimateData.sgst : '0',
          cgst: estimateData.cgst ? estimateData.cgst : '0',
          igst: estimateData.igst ? estimateData.igst : '0',
          laborTotal: estimateData.laborTotal,
          serviceRecommendation: estimateData.serviceRecommendation
            ? estimateData.serviceRecommendation
            : 0,
          fitId: estimateData.fitId ? estimateData.fitId : '0',
          approveStatus: estimateData.approveStatus
            ? estimateData.approveStatus
            : 0,
          osl: estimateData.osl ? estimateData.osl : '0',
          vendorId: estimateData.vendorId ? estimateData.vendorId : '0',
          marginPercentage: estimateData.marginPercentage
            ? estimateData.marginPercentage
            : '0',
          approveDatetime: formattedDate,
          repairTypeId: estimateData.repairTypeId ? estimateData.repairTypeId : '1',
          repairTypeName: estimateData.repairTypeName ? estimateData.repairTypeName : 'Paid Service',
        },
        { where: { id: estimateData.id } }
      );
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceLabourEstimateMobile', err);
  }
  return data;
};

const createServiceEstimateApproved = async (reqData, estimateId) => {

  let laborData = "";
  if ("laborEstimate" in reqData) {
    laborData = reqData.laborEstimate;
  }
  let labourInsert = 1;

  let oslData = "";
  if ('oslLaborSchedules' in reqData) {
    oslData = reqData.oslLaborSchedules;
  }
  let oslLabourInsert = 1;

  let partsData = "";
  if ('partEstimate' in reqData) {
    partsData = reqData.partEstimate;
  }
  let partsInsert = 1;

  const transactionId = await JobCard.findOne({
    where: { id: reqData.VISIT_ID }
  })

  // Insert or Update in DB of Labour:
  for (const labor of laborData) {
    const existing = await Schedules.findOne({
      where: {
        transaction_id: transactionId.id,
        id: labor.id // rot_code
      }
    });

    let formattedDate = null;
    if (labor.approvedatetime) {
      formattedDate = moment(
        labor.approvedatetime,
        ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
      ).format("YYYY-MM-DD HH:mm:ss");
    }

    console.log("existing", existing);
    const payload = {
      rot_id: labor.laborId, // <-- FIX 
      rot_code: labor.laborCode, // <-- FIX 
      description: labor.laborDescription,
      quantity: labor.quantity,
      additionalMargin: labor.additionalMargin ? labor.additionalMargin : 0,
      singleAmount: labor.singleAmount,
      amount: labor.rate,
      discount_percentage: labor.discountAmount ? labor.discountAmount : 0,
      sgst: labor.sgst ? labor.sgst : 0,
      cgst: labor.cgst ? labor.cgst : 0,
      igst: labor.igst ? labor.igst : 0,
      laborTotal: labor.laborTotal,
      status: labor.approveStatus,
      created_by: reqData.userId,
      updated_by: reqData.userId,
      approveDatetime: formattedDate,
      transaction_id: transactionId.id,
      repairTypeId: labor.repairTypeId ? labor.repairTypeId : '1',
      repairTypeName: labor.repairTypeName ? labor.repairTypeName : 'Paid Service',
    };
    if (existing) {
      labourInsert = await Schedules.update(payload,
        { where: { transaction_id: transactionId.id, id: labor.id } });
    } else {
      console.log("payload", payload)
      labourInsert = await Schedules.create(payload);
    }
    console.log("labourInsert", labourInsert[0])
    console.log("labourInsert", labourInsert)
  }
  // Insert or Update in DB of OSL Labour:
  for (const osl of oslData) {
    const existing = await oslLaborSchedules.findOne({
      where: {
        transaction_id: transactionId.id,
        id: osl.id // rot_code
      }
    });

    let formattedDate = null;
    if (osl.approvedatetime) {
      formattedDate = moment(
        osl.approvedatetime,
        ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
      ).format("YYYY-MM-DD HH:mm:ss");
    }

    console.log("existing", existing);
    const payload = {
      rot_id: osl.laborId, // <-- FIX 
      rot_code: osl.laborCode, // <-- FIX 
      description: osl.laborDescription,
      quantity: osl.quantity,
      additionalMargin: osl.additionalMargin ? osl.additionalMargin : 0,
      singleAmount: osl.rate,
      discount_percentage: osl.discountAmount ? osl.discountAmount : 0,
      sgst: osl.sgst ? osl.sgst : 0,
      cgst: osl.cgst ? osl.cgst : 0,
      igst: osl.igst ? osl.igst : 0,
      amount: osl.rate,
      laborTotal: osl.laborTotal,
      vendorId: osl.vendorId,
      status: osl.approveStatus,
      created_by: reqData.userId,
      updated_by: reqData.userId,
      approveDatetime: formattedDate,
      transaction_id: transactionId.id
    };
    if (existing) {
      oslLabourInsert = await oslLaborSchedules.update(payload,
        { where: { transaction_id: transactionId.id, id: osl.id } });
    } else {
      console.log("payload", payload)
      oslLabourInsert = await oslLaborSchedules.create(payload);
    }
  }

  // Insert or Update in DB of Parts Labour:
  for (const parts of partsData) {
    const existing = await partsIndent.findOne({
      where: {
        transaction_id: transactionId.id,
        id: parts.id // rot_code
      }
    });
    let formattedDate = null;
    if (parts.approvedatetime) {
      formattedDate = moment(
        parts.approvedatetime,
        ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
      ).format("YYYY-MM-DD HH:mm:ss");
    }

    console.log("existing", existing);
    const payload = {
      item_id: parts.partId, // <-- FIX 
      item_code: parts.partNo, // <-- FIX 
      item_name: parts.partDescription,
      request_quantity: parts.requestedQuantity,
      additionalMargin: parts.additionalMargin ? parts.additionalMargin : 0,
      amount: parts.rate,
      hsn_code: parts.hsnCode,
      sgst: parts.sgst ? parts.sgst : 0,
      cgst: parts.cgst ? parts.cgst : 0,
      igst: parts.igst ? parts.igst : 0,
      part_total: parts.partTotal,
      status: parts.approveStatus,
      created_by: reqData.userId,
      updated_by: reqData.userId,
      approveDatetime: formattedDate,
      transaction_id: transactionId.id
    };
    if (existing) {
      partsInsert = await partsIndent.update(payload,
        { where: { transaction_id: transactionId.id, id: parts.id } });
    } else {
      console.log("payload", payload)
      partsInsert = await partsIndent.create(payload);
    }
    console.log("PartsInsert", partsInsert[0])
    console.log("PartsInsert", partsInsert)
  }

  console.log("oslLabourInsert", oslLabourInsert[0])
  console.log("oslLabourInsert", oslLabourInsert)
  return {
    status: labourInsert && oslLabourInsert && partsInsert ? "success" : "failure"
  };
}

const deleteServiceLabourEstimate = async (serviceEstimateId) => {
  let data = {};
  try {
    data = await LabourEstimate.destroy({
      where: {
        id: serviceEstimateId,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao deleteServiceLabourEstimate', err);
  }

  return data;
};

const deleteServiceLabourEstimateMobile = async (serviceEstimateId) => {
  let data = {};
  try {
    data = await LabourEstimate.destroy({
      where: {
        serviceEstimateId: serviceEstimateId,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao deleteServiceLabourEstimateMobile', err);
  }

  return data;
};

const deleteOslServiceLabourEstimate = async (serviceEstimateId) => {
  let data = {};
  const currentDate = new Date();
  try {
    data = await OslLabourEstimate.destroy({
      where: {
        id: serviceEstimateId,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao deleteOslServiceLabourEstimateMobile', err);
  }

  return data;
};

const deleteOslServiceLabourEstimateMobile = async (serviceEstimateId) => {
  let data = {};
  const currentDate = new Date();
  try {
    data = await OslLabourEstimate.destroy({
      where: {
        serviceEstimateId: serviceEstimateId,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao deleteOslServiceLabourEstimateMobile', err);
  }

  return data;
};

const updateLaborFitId = async (localId, fitId) => {
  try {
    const result = await LabourEstimate.update(
      { fitId: fitId },
      { where: { id: localId } }
    );
    return result[0] === 1; // returns true if updated
  } catch (err) {
    logger.error('Error in updateLaborFitId', err);
    throw err;
  }
};


const updateOslLaborFitId = async (localId, fitId) => {

  try {
    const result = await OslLabourEstimate.update(
      { fitId: fitId },
      { where: { id: localId } }
    );
    return result[0] === 1;
  } catch (err) {
    logger.error('Error in updateOslLaborFitId', err);
    throw err;
  }
};
const updatePartFitId = async (localId, fitId) => {
  try {
    const result = await PartEstimate.update(
      { fitId: fitId },
      { where: { id: localId } }
    );
    return result[0] === 1;
  } catch (err) {
    logger.error('Error in updatePartFitId', err);
    throw err;
  }
};




const createServiceOslLabourEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
      data = await OslLabourEstimate.create({
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode,
        quantity: estimateData.quantity,
        additionalMargin: estimateData.additionalMargin
          ? estimateData.additionalMargin
          : 0,
        singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',
        rate: estimateData.rate ? estimateData.rate : 0,
        discountAmount: estimateData.discountAmount
          ? estimateData.discountAmount
          : 0,
        sgst: estimateData.sgst ? estimateData.sgst : '0',
        cgst: estimateData.cgst ? estimateData.cgst : '0',
        igst: estimateData.igst ? estimateData.igst : '0',
        laborTotal: estimateData.laborTotal,
        serviceRecommendation: estimateData.serviceRecommendation
          ? estimateData.serviceRecommendation
          : 0,
        fitId: estimateData.fitId ? estimateData.fitId : '0',
        approveStatus: estimateData.approveStatus
          ? estimateData.approveStatus
          : 0,
        osl: estimateData.osl ? estimateData.osl : '1',
        vendorId: estimateData.supplierCode.id,
        marginPercentage: estimateData.supplierCode.marginPercentage,
        approveDatetime: estimateData.approveDatetime
          ? estimateData.approveDatetime
          : currentDate,
      });
      console.log('createServiceOslLabourEstimate data', data.id);
      return data;
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServiceOslLabourEstimate', err);
  }

  return data;
};

const createServiceOslLabourEstimateMobile = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
      let formattedDate = null;
      if (estimateData.approvedatetime) {
        formattedDate = moment(
          estimateData.approvedatetime,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      data = await OslLabourEstimate.create({
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode ?? null,
        quantity: estimateData.quantity,
        rate: estimateData.rate ? estimateData.rate : 0,
        discountAmount: estimateData.discountAmount
          ? estimateData.discountAmount
          : 0,
        additionalMargin: estimateData.additionalMargin
          ? estimateData.additionalMargin
          : 0,
        // singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',

        sgst: estimateData.sgst ? estimateData.sgst : '0',
        cgst: estimateData.cgst ? estimateData.cgst : '0',
        igst: estimateData.igst ? estimateData.igst : '0',
        laborTotal: estimateData.laborTotal,
        vendorId: estimateData.vendorId,
        fitId: estimateData.fitId ? estimateData.fitId : '0',
        approveStatus: estimateData.approveStatus
          ? estimateData.approveStatus
          : 0,
        approveDatetime: formattedDate

        // serviceRecommendation: estimateData.serviceRecommendation
        //   ? estimateData.serviceRecommendation
        //   : 0,
        // osl: estimateData.osl ? estimateData.osl : '1',
        // marginPercentage: estimateData.supplierCode.marginPercentage,

      });
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServiceOslLabourEstimate', err);
  }

  return data;
};

// const updateServiceOslLabourEstimate = async (estimateData, user) => {
//   let data = {};
//   const currentDate = new Date();
//   try {
//     if(estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
//       data = await OslLabourEstimate.update({
//         serviceEstimateId: estimateData.serviceEstimateId,
//         laborId: estimateData.laborId,
//         laborCode: estimateData.laborCode,
//         laborDescription: estimateData.laborDescription,
//         sacCode: estimateData.sacCode ?? null,
//         quantity: estimateData.quantity,
//         rate: estimateData.rate ? estimateData.rate : 0,
//         discountAmount: estimateData.discountAmount
//           ? estimateData.discountAmount
//           : 0,
//         additionalMargin: estimateData.additionalMargin
//           ? estimateData.additionalMargin
//           : 0,
//         // singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',

//         sgst: estimateData.sgst?estimateData.sgst:'0',
//         cgst: estimateData.cgst?estimateData.cgst:'0',
//         igst: estimateData.igst?estimateData.igst:'0',
//         laborTotal: estimateData.laborTotal,
//         vendorId: estimateData.supplierCode?.id,
//         fitId: estimateData.fitId ? estimateData.fitId : '0',
//         approveStatus: estimateData.approveStatus
//           ? estimateData.approveStatus
//           : 0,
//         // approveDatetime: estimateData.approvedatetime //approveDatetime
//         //   ? estimateData.approvedatetime
//         //   : currentDate,

//         // serviceRecommendation: estimateData.serviceRecommendation
//         //   ? estimateData.serviceRecommendation
//         //   : 0,
//         // osl: estimateData.osl ? estimateData.osl : '1',
//         // marginPercentage: estimateData.supplierCode.marginPercentage,

//       }, { where: { id: estimateData.id } });
//       console.log('updateServiceOslLabourEstimate data', estimateData.id);
//       return estimateData.id;
//     };
//   } catch (err) {
//     console.log(err);
//     logger.error('Service Estimate Dao updateServiceOslLabourEstimateMobile', err);
//   }

//   return data;
// };


const updateServiceOslLabourEstimate = async (estimateData, user) => {
  let updatedData = {};
  const currentDate = new Date();

  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {

      const existingOsl = await OslLabourEstimate.findOne({ where: { id: estimateData.id } });
      if (!existingOsl) return null;

      const mergedData = {
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode ?? existingOsl.sacCode ?? null,
        quantity: estimateData.quantity ?? existingOsl.quantity,
        rate: estimateData.rate ?? existingOsl.rate ?? 0,
        discountAmount: estimateData.discountAmount ?? existingOsl.discountAmount ?? 0,
        additionalMargin: estimateData.additionalMargin ?? existingOsl.additionalMargin ?? 0,
        sgst: estimateData.sgst ?? existingOsl.sgst ?? '0',
        cgst: estimateData.cgst ?? existingOsl.cgst ?? '0',
        igst: estimateData.igst ?? existingOsl.igst ?? '0',
        laborTotal: estimateData.laborTotal ?? existingOsl.laborTotal,
        vendorId: estimateData.supplierCode?.id ?? existingOsl.vendorId ?? '0',
        fitId: estimateData.fitId ?? existingOsl.fitId ?? '0',
        approveStatus: estimateData.approveStatus ?? existingOsl.approveStatus ?? 0,
        approveDatetime: estimateData.approvedatetime
          ? estimateData.approvedatetime
          : currentDate,
      };

      await OslLabourEstimate.update(mergedData, { where: { id: estimateData.id } });


      updatedData = await OslLabourEstimate.findOne({ where: { id: estimateData.id } });

      return updatedData?.dataValues;
    }
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceOslLabourEstimateMobile', err);
  }

  return updatedData;
};

const updateServiceOslLabourEstimateMobile = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {
      let formattedDate = null;
      if (estimateData.approvedatetime) {
        formattedDate = moment(
          estimateData.approvedatetime,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      data = await OslLabourEstimate.update({
        serviceEstimateId: estimateData.serviceEstimateId,
        laborId: estimateData.laborId,
        laborCode: estimateData.laborCode,
        laborDescription: estimateData.laborDescription,
        sacCode: estimateData.sacCode ?? null,
        quantity: estimateData.quantity,
        rate: estimateData.rate ? estimateData.rate : 0,
        discountAmount: estimateData.discountAmount
          ? estimateData.discountAmount
          : 0,
        additionalMargin: estimateData.additionalMargin
          ? estimateData.additionalMargin
          : 0,
        // singleAmount: estimateData.singleAmount ? estimateData.singleAmount : '0',

        sgst: estimateData.sgst ? estimateData.sgst : '0',
        cgst: estimateData.cgst ? estimateData.cgst : '0',
        igst: estimateData.igst ? estimateData.igst : '0',
        laborTotal: estimateData.laborTotal,
        vendorId: estimateData.vendorId,
        fitId: estimateData.fitId ? estimateData.fitId : '0',
        approveStatus: estimateData.approveStatus
          ? estimateData.approveStatus
          : 0,
        approveDatetime: formattedDate

        // serviceRecommendation: estimateData.serviceRecommendation
        //   ? estimateData.serviceRecommendation
        //   : 0,
        // osl: estimateData.osl ? estimateData.osl : '1',
        // marginPercentage: estimateData.supplierCode.marginPercentage,

      }, { where: { id: estimateData.id } });
    };
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServiceOslLabourEstimateMobile', err);
  }

  return data;
};

const createServicePartsEstimate = async (partData, user) => {
  console.log('parts req payload in dao'.partData);
  let data = {};
  const currentDate = new Date();
  try {
    if (partData.partId !== "" && partData.partId !== undefined && partData.partId !== null) {
      data = await PartsEstimate.create({
        serviceEstimateId: partData.serviceEstimateId,
        partId: partData.partId,
        partNo: partData.partNo,
        partDescription: partData.partDescription,
        hsnCode: partData.hsnCode,
        requestedQuantity: partData.quantity,
        rate: partData.rate,
        additionalMargin: partData.additionalMargin
          ? partData.additionalMargin
          : 0,
        discountAmount: partData.discountAmount ? partData.discountAmount : 0,
        sgst: partData.sgst ? partData.sgst : '0',
        cgst: partData.cgst ? partData.cgst : '0',
        igst: partData.igst ? partData.igst : '0',
        partTotal: partData.partTotal,
        serviceRecommendation: partData.serviceRecommendation
          ? partData.serviceRecommendation
          : '0',
        fitId: partData.fitId ? partData.fitId : '0',
        approveStatus: partData.approveStatus ? partData.approveStatus : '0',
        approveDatetime: partData.approveDatetime
          ? partData.approveDatetime
          : currentDate,
      });
    } else if (partData.partDescription != "") {
      data = await PartsEstimate.create({
        serviceEstimateId: partData.serviceEstimateId,
        partId: null,
        partNo: null,
        partDescription: partData.partDescription,
        hsnCode: null,
        requestedQuantity: partData.quantity ? partData.quantity : 0,
        rate: 0,
        additionalMargin: partData.additionalMargin
          ? partData.additionalMargin
          : 0,
        discountAmount: partData.discountAmount ? partData.discountAmount : 0,
        sgst: 0,
        cgst: 0,
        igst: 0,
        partTotal: 0,
        serviceRecommendation: partData.serviceRecommendation
          ? partData.serviceRecommendation
          : '0',
        fitId: partData.fitId ? partData.fitId : '0',
        approveStatus: partData.approveStatus ? partData.approveStatus : '0',
        approveDatetime: partData.approveDatetime
          ? partData.approveDatetime
          : currentDate,
      });
      console.log('createServicePartsEstimate data', data.id);
      return data;
    }
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServicePartsEstimate', err);
  }
  return data;
};

const createServicePartsEstimateMobile = async (partData, user) => {
  console.log('Mobile parts req payload in dao'.partData);
  let data = {};
  const currentDate = new Date();
  try {

    let formattedDate = null;
    if (partData.approvedatetime) {
      formattedDate = moment(
        partData.approvedatetime,
        ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
      ).format("YYYY-MM-DD HH:mm:ss");
    }

    data = await PartsEstimate.create({
      serviceEstimateId: partData.serviceEstimateId,
      partId: partData.partId,
      partNo: partData.partNo,
      partDescription: partData.partDescription,
      hsnCode: partData.hsnCode ?? null,
      requestedQuantity: partData.requestedQuantity,
      rate: partData.rate,
      additionalMargin: partData.additionalMargin
        ? partData.additionalMargin
        : 0,
      discountAmount: partData.discountAmount ? partData.discountAmount : 0,
      sgst: partData.sgst ? partData.sgst : '0',
      cgst: partData.cgst ? partData.cgst : '0',
      igst: partData.igst ? partData.igst : '0',
      partTotal: partData.partTotal,
      // serviceRecommendation: partData.serviceRecommendation
      //   ? partData.serviceRecommendation
      //   : '0',
      fitId: partData.fitId ? partData.fitId : '0',
      approveStatus: partData.approveStatus ? partData.approveStatus : '0',
      approveDatetime: formattedDate
    });

  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServicePartsEstimate', err);
  }
  return data;
};

// const updateServicePartsEstimate = async (partData, user) => {
//   let data = {};
//   const currentDate = new Date();
//   try {
//     if(partData.partId !== "" && partData.partId !== undefined && partData.partId !== null) {
//       data = await PartsEstimate.update({
//         serviceEstimateId: partData.serviceEstimateId,
//         partId: partData.partId,
//         partNo: partData.partNo,
//         partDescription: partData.partDescription,
//         hsnCode: partData.hsnCode ?? null,
//         requestedQuantity: partData.quantity,
//         rate: partData.rate,
//         additionalMargin: partData.additionalMargin
//           ? partData.additionalMargin
//           : 0,
//         discountAmount: partData.discountAmount ? partData.discountAmount : 0,
//         sgst: partData.sgst?partData.sgst:'0',
//         cgst: partData.cgst?partData.cgst:'0',
//         igst: partData.igst?partData.igst:'0',
//         partTotal: partData.partTotal,
//         fitId: partData.fitId ? partData.fitId : '0',
//         approveStatus: partData.approveStatus ? partData.approveStatus : '0',
//         // approveDatetime: partData.approvedatetime
//         //   ? partData.approvedatetime
//         //   : '2024-07-24',
//       }, { where: { id: partData.id } });
//       console.log('updateServicePartsEstimate data', partData.id);
//       return partData.id;
//     }
//   } catch (err) {
//     console.log(err);
//     logger.error('Service Estimate Dao createServicePartsEstimate', err);
//   }
//   return data;
// };
const updateServicePartsEstimate = async (partData, user) => {
  console.log('service estimate parts payload', partData);
  let updatedPart = null;
  try {
    if (partData.partId !== "" && partData.partId !== undefined && partData.partId !== null) {
      const existingPart = await PartsEstimate.findOne({ where: { id: partData.id } });
      if (!existingPart) return null;

      const mergedData = {
        serviceEstimateId: partData.serviceEstimateId,
        partId: partData.partId,
        partNo: partData.partNo,
        partDescription: partData.partDescription,
        hsnCode: partData.hsnCode ?? existingPart.hsnCode ?? null,
        requestedQuantity: partData.quantity ?? existingPart.requestedQuantity,
        rate: partData.rate ?? existingPart.rate ?? 0,
        additionalMargin: partData.additionalMargin ?? existingPart.additionalMargin ?? 0,
        discountAmount: partData.discountAmount ?? existingPart.discountAmount ?? 0,
        sgst: partData.sgst ?? existingPart.sgst ?? '0',
        cgst: partData.cgst ?? existingPart.cgst ?? '0',
        igst: partData.igst ?? existingPart.igst ?? '0',
        partTotal: partData.partTotal ?? existingPart.partTotal ?? 0,
        fitId: partData.fitId ?? existingPart.fitId ?? '0',
        approveStatus: partData.approveStatus ?? existingPart.approveStatus ?? '0',
      };

      await PartsEstimate.update(mergedData, { where: { id: partData.id } });
      updatedPart = await PartsEstimate.findOne({ where: { id: partData.id } });
      console.log('Updated Part Record:', updatedPart.id);
      return updatedPart;
    }
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao updateServicePartsEstimate', err);
  }
  return updatedPart;
};

const updateServicePartsEstimateMobile = async (partData, user) => {
  console.log('Mobile service estimate parts payload', partData);
  let data = {};
  const currentDate = new Date();
  try {
    if (partData.partId !== "" && partData.partId !== undefined && partData.partId !== null) {
      let formattedDate = null;
      if (partData.approvedatetime) {
        formattedDate = moment(
          partData.approvedatetime,
          ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
        ).format("YYYY-MM-DD HH:mm:ss");
      }
      data = await PartsEstimate.update({
        serviceEstimateId: partData.serviceEstimateId,
        partId: partData.partId,
        partNo: partData.partNo,
        partDescription: partData.partDescription,
        hsnCode: partData.hsnCode ?? null,
        requestedQuantity: partData.requestedQuantity,
        rate: partData.rate,
        additionalMargin: partData.additionalMargin
          ? partData.additionalMargin
          : 0,
        discountAmount: partData.discountAmount ? partData.discountAmount : 0,
        sgst: partData.sgst ? partData.sgst : '0',
        cgst: partData.cgst ? partData.cgst : '0',
        igst: partData.igst ? partData.igst : '0',
        partTotal: partData.partTotal,
        // serviceRecommendation: partData.serviceRecommendation
        //   ? partData.serviceRecommendation
        //   : '0',
        fitId: partData.fitId ? partData.fitId : '0',
        approveStatus: partData.approveStatus ? partData.approveStatus : '0',
        approveDatetime: formattedDate,
      }, { where: { id: partData.id } });
    }
  } catch (err) {
    console.log(err);
    logger.error('Service Estimate Dao createServicePartsEstimate', err);
  }
  return data;
};

const deleteServicePartsEstimate = async (serviceEstimateId) => {
  let data = {};
  try {
    data = await PartsEstimate.destroy({
      where: {
        id: serviceEstimateId,
      },
    });
  } catch (err) {
    logger.error('Service Estimate Dao deleteServicePartsEstimate', err);
  }

  return data;
};

const deleteServicePartsEstimateMobile = async (serviceEstimateId) => {
  let data = {};
  try {
    data = await PartsEstimate.destroy({
      where: {
        serviceEstimateId: serviceEstimateId,
      },
    });
  } catch (err) {
    logger.error('Service Estimate Dao deleteServicePartsEstimate', err);
  }

  return data;
};

const getRecentServiceEstimate = async (documentType, outletCode, year) => {
  const recentEstimate = ServiceEstimate.findOne({
    where: {
      serviceEstimateNumber: {
        [Op.like]: `${documentType}-${outletCode}${year}%`,
      },
    },
    order: [['id', 'DESC']],
  });

  return recentEstimate;
};

const listServiceEstimate = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { serviceEstimateNumber: { [Op.like]: `%${searchKey}%` } },
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          ),
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          ),
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(driverName), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          ),
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(driverMobileNumber), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          )
        ],
      }
      : {};
    const userCondition = { createdby: user.id, outletId: user.outlet.id };
    const count = await ServiceEstimate.count({
      where: { ...searchCondition, ...userCondition },
    });
    let rows = await ServiceEstimate.findAll({
      where: { ...searchCondition, ...userCondition },
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: LabourEstimate, as: 'labourEstimate' },
        { model: OslLabourEstimate, as: 'oslLabourEstimate' },
        { model: PartsEstimate, as: 'partEstimate' },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['chassisNumber'],
          include: [
            { model: Model, as: 'model', attributes: ['modelName'] },
            { model: Make, as: 'make', attributes: ['makeName'] },
          ],
        },
      ],
      attributes: {
        include: [[
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`),
          'decryptedCustomerName'
        ], [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`),
          'decryptedCustomerMobileNumber'
        ], [
          fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'createdAtFormat'
        ]]
      }
    });

    rows = rows.map(row => {
      row.dataValues.customerName = row.dataValues.decryptedCustomerName;
      row.dataValues.customerMobileNumber = row.dataValues.decryptedCustomerMobileNumber;

      delete row.dataValues.decryptedCustomerName;
      delete row.dataValues.decryptedCustomerMobileNumber;

      return row;
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('ServiceEstimate dao listServiceEstimates', err);
    console.log(err);
  }
};

const findOpenServiceEstimate = async (registrationNumber) => {
  try {
    const rows = await ServiceEstimate.findOne({
      where: { registrationNumber: registrationNumber, status: 1 },
    });
    return rows;
  } catch (err) {
    logger.error('ServiceEstimate dao findOpenServiceEstimate', err);
    console.log(err);
  }
};

const findServiceEstimateByBookingId = async (serviceBookingId) => {
  try {
    return await ServiceEstimate.findOne({
      where: { serviceBookingId },
      order: [['id', 'DESC']],
    });
  } catch (err) {
    logger.error('ServiceEstimate dao findServiceEstimateByBookingId', err);
    throw err;
  }
};

const findActiveServiceBookingForEstimate = async (registrationNumber, customerMobileNumber) => {
  const normalizedRegistrationNumber = String(registrationNumber || '').trim();
  const normalizedMobileNumber = String(customerMobileNumber || '').trim();
  if (!normalizedRegistrationNumber || !normalizedMobileNumber) {
    throw new Error('registrationNumber and customerMobileNumber are required to check active service bookings');
  }

  try {
    const [rows] = await db.sequelize.query(
      `SELECT id, serviceBookingNumber, status, statusFlag
      FROM servicebookings
      WHERE registrationNumber = :registrationNumber
        AND customerMobileNumber = HEX(AES_ENCRYPT(:customerMobileNumber, :encryptKey))
        AND statusFlag IN (1, 2)
      LIMIT 1`,
      {
        replacements: {
          registrationNumber: normalizedRegistrationNumber,
          customerMobileNumber: normalizedMobileNumber,
          encryptKey: encryptConfig.code,
        },
      }
    );

    return rows[0] || null;
  } catch (err) {
    logger.error('ServiceEstimate dao findActiveServiceBookingForEstimate', err);
    throw err;
  }
};

const findOpenServiceEstimateByEstimateId = async (serviceEstimateId) => {
  const fieldsToDecrypt = [
    { field: 'customerName', alias: 'decryptedCustomerName' },
    { field: 'customerMobileNumber', alias: 'decryptedCustomerMobileNumber' }
  ];

  const decryptedAttributes = fieldsToDecrypt.map(item => [
    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
    item.alias
  ]);

  try {
    const rows = await ServiceEstimate.findOne({
      include: [
        { model: LabourEstimate, as: 'labourEstimate' },
        { model: OslLabourEstimate, as: 'oslLabourEstimate' },
        { model: PartsEstimate, as: 'partEstimate' },
      ],
      where: { id: serviceEstimateId, status: 1 },
      attributes: {
        include: decryptedAttributes
      }
    });
    return rows;
  } catch (err) {
    logger.error(
      'ServiceEstimate dao findOpenServiceEstimateByEstimateId',
      err
    );
    console.log(err);
  }
};

const getServiceEstimateMobile = async (serviceEstimateId) => {
  const fieldsToDecrypt = [
    { field: 'customerName', alias: 'decryptedCustomerName' },
    { field: 'customerMobileNumber', alias: 'decryptedCustomerMobileNumber' }
  ];

  const decryptedAttributes = fieldsToDecrypt.map(item => [
    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
    item.alias
  ]);

  try {
    // const userid = { createdby: userId };
    const searchC = { id: serviceEstimateId };
    const rows = await ServiceEstimate.findAll({
      include: [
        { model: LabourEstimate, as: 'labourEstimate' },
        { model: OslLabourEstimate, as: 'oslLabourEstimate' },
        { model: PartsEstimate, as: 'partEstimate' },
      ],
      where: { ...searchC }, // status: 1
      attributes: {
        include: decryptedAttributes
      }
    });
    return rows;
  } catch (err) {
    logger.error(
      'ServiceEstimate dao findOpenServiceEstimateByEstimateId',
      err
    );
    console.log(err);
  }
};

const getServiceEstimate = async (id) => {
  try {
    const data = await ServiceEstimate.findOne({
      where: { id: id },
      include: [
        { model: LabourEstimate, as: 'labourEstimate' },
        { model: OslLabourEstimate, as: 'oslLabourEstimate' },
        { model: PartsEstimate, as: 'partEstimate' },
        {
          model: Customer,
          as: 'customer',
          attributes: {
            include: [[
              db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
              'decryptedFirstName'
            ], [
              db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
              'decryptedLastName'
            ]]
          }
        },
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: Model, as: 'model' },
            { model: Make, as: 'make' },
          ],
        },
      ],
    });
    return data;
  } catch (err) {
    logger.error('ServiceEstimate dao getServiceEstimate', err);
    console.log(err);
  }
};

const getOpenEstimates = async (user) => {
  try {
    const data = await ServiceEstimate.findAll({
      where: {
        status: 1,
        createdby: user.id,
        outletId: user.outlet.id,
      },
      order: [['id', 'DESC']],
      attributes: ['id', 'serviceEstimateNumber', 'registrationNumber'],
      include: [{ model: Customer, as: 'customer' }],
    });
    return data;
  } catch (err) {
    logger.error('ServiceEstimate dao getOpenEstimates Error:', err);
    next(err);
  }
};
const loadOpenEstimate = async (id) => {
  try {
    const data = await ServiceEstimate.findOne({
      where: { id: id },
      include: [
        { model: LabourEstimate, as: 'labourEstimate' },
        { model: OslLabourEstimate, as: 'oslLabourEstimate' },
        { model: PartsEstimate, as: 'partEstimate' },
        { model: Customer, as: 'customer' },
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: Model, as: 'model' },
            { model: Make, as: 'make' },
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
        { model: ServiceType, as: 'servicetype' },
      ],
    });
    return data;
  } catch (err) {
    logger.error('ServiceEstimate dao loadOpenEstimate', err);
    console.log(err);
  }
};

const updateServiceBookingStatus = async (serviceBookingNumber) => {
  let data = {};
  try {
    data = await ServiceBooking.update(
      {
        status: 'Completed',
        statusFlag: 3,
      },
      { where: { serviceBookingNumber: serviceBookingNumber } }
    );
  } catch (err) {
    logger.error('ServiceEstimate dao updateServiceBookingStatus Error:', err);
    next(err);
  }

  return data;
};

const updateServiceBookingStatusMobile = async (serviceBookingNumber) => {
  let data = {};
  try {
    data = await ServiceBooking.update(
      {
        status: 'Completed',
        statusFlag: 3,
      },
      { where: { serviceBookingNumber: serviceBookingNumber } }
    );
  } catch (err) {
    logger.error('ServiceEstimate dao updateServiceBookingStatus Error:', err);
    next(err);
  }

  return data;
};

const getVehicleWithRegNo = async (regNo) => {
  let data = '';
  try {
    data = await Vehicle.findOne({
      where: {
        registrationNumber: {
          [Op.like]: `%${regNo}`,
        },
      },
      include: {
        model: Customer, as: 'customer'
      },
      order: [['id', 'DESC']],
    });
  } catch (err) {
    console.log(err);
  }
  return data;
}

const ServiceEstimateDao = {
  createServiceEstimate,
  createServiceLabourEstimate,
  createServiceOslLabourEstimate,
  createServicePartsEstimate,
  getRecentServiceEstimate,
  listServiceEstimate,
  findOpenServiceEstimate,
  findServiceEstimateByBookingId,
  findActiveServiceBookingForEstimate,
  getServiceEstimate,
  updateServiceEstimate,
  approveServiceEstimate,
  getEstimateShareDetails,
  findOpenServiceEstimateByEstimateId,
  deleteServiceLabourEstimate,
  deleteOslServiceLabourEstimate,
  deleteServicePartsEstimate,
  getOpenEstimates,
  loadOpenEstimate,
  updateServiceBookingStatus,
  getVehicleWithRegNo,
  createServiceEstimateMobile,
  createServicePartsEstimateMobile,
  createServiceOslLabourEstimateMobile,
  createServiceLabourEstimateMobile,
  updateServiceBookingStatusMobile,
  updateServiceEstimateMobile,
  updateServiceLabourEstimate,
  deleteServiceLabourEstimateMobile,
  deleteOslServiceLabourEstimateMobile,
  deleteServicePartsEstimateMobile,
  getServiceEstimateMobile,
  updateServiceLabourEstimateMobile,
  updateServiceOslLabourEstimateMobile,
  updateServicePartsEstimateMobile,
  updateServiceOslLabourEstimate,
  updateServicePartsEstimate,
  updateLaborFitId,
  updateOslLaborFitId,
  updatePartFitId,
  createServiceEstimateApproved
};

export default ServiceEstimateDao;
