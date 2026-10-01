import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import ServiceBookingService from './service.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import MobileApiTrackService from '../mobileApis/service.js';

const getVehicleDetails = async (req, res, next) => {
  // console.log('````````````````````````````````',req.user)
  try {
    const data = await ServiceBookingService.getVehicleDetails(
      req.body.registrationNumber
    );
    res.status(200).send({
      requestSuccessful: true,
      vehicleData: data,
    });
  } catch (err) {
    logger.error('ServiceBooking controller getVehicleDetails', err);
    next(err);
  }
};

const addServiceBooking = async (req, res, next) => { 
  try {
    logger.info(
      'ServiceBooking Controller addServiceBooking requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'ServiceBooking';
    auditData['action'] = ACTION_ADD;
  
    let result = await ServiceBookingService.addServiceBooking(
      req.body,
      req.user
    );
    // if (result == 'success') 
    if (result && result.status == 'success') {
      auditData['message'] = 'ServiceBooking added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Booking Saved Sucessfully',
        BookingDetails: result.bookingDetails,
      });
    } else {
      auditData['message'] = 'ServiceBooking not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('ServiceBooking controller addServiceBooking', err);
    next(err);
  }
};


const addPolicyBazzarServiceBooking = async (req, res, next) => {
  
  try {
    logger.info(
      ' Policy Bazzar ServiceBooking Controller requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'External Api';
    auditData['submenu_name'] = 'Policy Bazzar';
    auditData['action'] = ACTION_ADD;
    let result = await ServiceBookingService.addPolicyBazzarServiceBooking(
      req.body,
      req.user
    );
    console.log('Policy Bazzar ServiceBooking Controller result:', result);
    if (result.requestSuccessful == true) {

     
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
        BookingDetails:result.BookingDetails
      });
    } else {

      return res.status(200).send({
        requestSuccessful: false,
        errorDescription: result.errorDescription,
      });
    }
  } catch (err) {
    logger.error('ServiceBooking controller addServiceBooking ---', err);
   
  }
};

const addServiceBookingMobile = async (req, res, next) => {
  try {
    logger.info(
      'ServiceBooking Controller addServiceBooking requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'ServiceBooking';
    auditData['action'] = ACTION_ADD;
    auditData['access'] = 'Mobile';

    let result = await ServiceBookingService.addServiceBookingMobile(
      req.body,
      req.user
    );
    if (result.success) {
      auditData['message'] = 'From Mobile_API ServiceBooking added successfully';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
        serviceBookingId: result.bookingId.toString()
      });
    } else {
      auditData['message'] = 'From Mobile_API ServiceBooking not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      
      return res.status(500).send({
        requestSuccessful: false,
        message: 'Data not Saved ',
      });
    } 
  } catch (err) {
    logger.error('ServiceBooking controller addServiceBooking', err);
    next(err);
  }
};

const listServiceBookings = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'ServiceBooking';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get ServiceBooking data ';
    const data = await ServiceBookingService.listServiceBookings(
      req.body,
      req.user
    );
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ServiceBookingData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ServiceBookingData: data,
      });
    }
  } catch (err) {
    logger.error('ServiceBooking controller listServiceBookings', err);
    next(err);
  }
};

const listAppointments = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.body;
    if (!fromDate || !toDate) {
      return res.status(400).send({
        requestSuccessful: false,
        message: 'fromDate and toDate are required',
      });
    }

    const appointmentData = await ServiceBookingService.listAppointments(
      req.body,
      req.user
    );
    return res.status(200).send({
      requestSuccessful: true,
      appointmentData,
    });
  } catch (err) {
    logger.error('ServiceBooking controller listAppointments', err);
    next(err);
  }
};

const updateServiceBooking = async (req, res, next) => {
  try {
    logger.info(
      'ServiceBooking Controller updateServiceBooking requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'ServiceBooking';
    auditData['action'] = ACTION_UPDATE;

    const id = req.body.id;
    let result = await ServiceBookingService.updateServiceBooking(
      id,
      req.body,
      req.user
    );
    if (result == 'success' || result?.status === 'success') {
      auditData['message'] = 'ServiceBooking Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
        ...(result?.activityHistory ? {
          activityStatus: result.activityStatus || null,
          followupDate: result.followupDate,
          activityHistory: result.activityHistory,
          estimateId: result.estimateId,
          jobCardCreationStatus: result.jobCardCreationStatus,
        } : {}),
      });
    } else {
      auditData['message'] = 'ServiceBooking not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'ServiceBooking not Updated',
      });
    }
  } catch (err) {
    logger.error('ServiceBooking controller updateServiceBooking', err);
    next(err);
  }
};

const exportServiceBookings = async (req, res, next) => {
  const auditData = {
    menu_name: "Reports",
    submenu_name: "Service Booking",
    action: ACTION_GET,
    access: "Portal",
    message: "Service Booking Report Export"
  };
  try {
    const results = await ServiceBookingService.exportServiceBookings(
      req.body,
      req.user
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ServiceBooking');

    const headers = [
      { header: 'SL No', key: 'autoId', width: 10 },
      { header: 'Service Booking No', key: 'serviceBookingNumber', width: 20 },
      { header: 'Appointment Status', key: 'status', width: 20 },
      { header: 'Reg No', key: 'registrationNumber', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Mobile Number', key: 'customerMobileNumber', width: 20 },
      { header: 'Service Booking Date', key: 'createdAt', width: 25 },
      { header: 'Schedule Start Time', key: 'scheduledStartDate', width: 25 },
      { header: 'Schedule End Time', key: 'scheduledEndDate', width: 25 },
      { header: 'Disposition', key: 'title', width: 25 },
      { header: 'Make', key: 'makeName', width: 25 },
      { header: 'Model', key: 'modelName', width: 25 },
      { header: 'Document Date', key: 'documentDate', width: 25 },
      { header: 'Chassis No', key: 'chassisNo', width: 25 },
      { header: 'Engine No', key: 'engineNo', width: 25 },
      { header: 'Source Type', key: 'sourceType', width: 25 },
      { header: 'Cancellation Type', key: 'cancellationType', width: 25 },
      { header: 'Cancellation Date', key: 'cancellationDate', width: 25 },
      { header: 'Remarks', key: 'remarks', width: 25 },
      { header: 'Created By', key: 'createdBy', width: 25 },
      { header: 'Pickup Driver Name', key: 'pickupDriverName', width: 25 },
      { header: 'Pickup Driver Mobile', key: 'pickupDriverMobile', width: 25 },
      { header: 'Pickup Address', key: 'pickupAddress', width: 25 },
      { header: 'Pickup Date', key: 'pickupDate', width: 25 },
      { header: 'Phone Call Notes', key: 'phoneCallNotes', width: 25 },


    ];
    worksheet.columns = headers;

    const dataWithCustomHeaders = results.data.map((item, index) => ({
      autoId: index + 1,
      serviceBookingNumber: item.serviceBookingNumber,
      status: item.status,
      registrationNumber: item.registrationNumber,
      customerName: item.customerName,
      customerMobileNumber: item.customerMobileNumber,
      createdAt: item.createdAt,
      scheduledStartDate: item.scheduledStartDate,
      scheduledEndDate: item.scheduledEndDate,
      title: item.title,
      makeName: item.makeName,
      modelName: item.modelName,
      phoneCallNotes: item.phoneCallNotes,
      documentDate:item.documentDate,
      chassisNo:item.chassisNo,
      engineNo:item.engineNo,
      sourceType:item.sourceType,
      pickupDriverName:item.pickupDriverName,
      pickupDriverMobile:item.pickupDriverMobile,
      pickupAddress:item.pickupAddress,
      pickupDate:item.pickupDate
    }));

    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF204060' },
      };
    });

    worksheet.addRows(dataWithCustomHeaders);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="service_bookings.xlsx"'
    );

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

//testing
const loadServiceBookings = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: "Reports",
      submenu_name: "Service Booking",
      action: ACTION_GET,
      access: "Portal",
      message: "Service Booking Report"
    };
    const data = await ServiceBookingService.exportServiceBookings(
      req.body,
      req.user
    );

    console.log(`loadServiceBookings: Fetched ${data.length} records`);
    if (data) {
      auditData.result = "success";
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        serviceBooking: data,
      });
    } else {
      auditData.result = "failed";
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        serviceBooking: data,
      });
    }
  } catch (err) {
    logger.error('ServiceEstimate Controller getOpenEstimates Error:', err);
    next(err);
  }
};

const getOpenBookings = async (req, res, next) => {
  try {
    const data = await ServiceBookingService.getOpenBookings(req.user);
    res.status(200).send({
      requestSuccessful: true,
      ServiceBookingData: data,
    });
  } catch (err) {
    logger.error('ServiceBooking Controller getOpenBookings Error:', err);
    next(err);
  }
};

const getServiceBookingData = async (req, res, next) => {
  try {
    const data = await ServiceBookingService.getServiceBookingData(req.body);
    res.status(200).send({
      requestSuccessful: true,
      BookingData: data,
    });
  } catch (err) {
    logger.error('ServiceBooking Controller getServiceBookingData Error:', err);
    next(err);
  }
};
const controller = {
  getVehicleDetails,
  addServiceBooking,
  listServiceBookings,
  listAppointments,
  updateServiceBooking,
  exportServiceBookings,
  loadServiceBookings,
  getOpenBookings,
  getServiceBookingData,
  addPolicyBazzarServiceBooking,
  addServiceBookingMobile
};

export default controller;
