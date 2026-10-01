import logger from '../../config/logger.js';
import ServiceBookingDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import dao from '../jobCard/dao.js';
import { getRemoteToken } from '../../shared/mobileApiUtility.js';
import { EXTERNAL_API } from '../../config/externalUrl.js';
import axios from 'axios';
import MobileApiTrackService from '../mobileApis/service.js';
import {
  normalizeServiceBookingStatus,
  normalizeServiceBookingActivityStatus,
} from './status.js';
import ServiceEstimateService from '../serviceEstimate/service.js';
import CustomerService from '../customer/service.js';
import CustomerDao from '../customer/dao.js';

const getVehicleDetails = async (registrationNumber) => {
  const resultList = [];
  const resObj = {};
  try {
    const data = await ServiceBookingDao.getVehicleDetails(registrationNumber);
    if (data) {
      let firstName = data.dataValues.decryptedFirstName;
      let lastName = data.dataValues.decryptedLastName ? data.dataValues.decryptedLastName : '';
      resObj['registrationNumber'] = data.registrationNumber;
      resObj['vehicleId'] = data.id;
      resObj['makeId'] = data.makeId;
      resObj['modelId'] = data.modelId;
      resObj['modelSegment'] = data.model.segment;
      resObj['customeId'] = data.customer.id;
      resObj['customerName'] = firstName + ' ' + lastName;
      resObj['customerMobileNumber'] = data.dataValues.decryptedMobileNumber;
      resObj['customerAddress'] = data.customer.address1;
      resObj['customerState'] = data.customer.state;
      resObj['customerCity'] = data.customer.city;
      resObj['pincode'] = data.customer.pinCode;
      resObj['customerStatus'] = 2;
      resObj['message'] = 'Existing customer';
      resObj['stageNorms'] = data.stageNorms;
      resObj['axle'] = data.axle;
      resObj['application'] = data.application;
      resObj['nextDueDateFC'] = data.nextDueDateFC;
      resObj['engineOilCapacity'] = data.engineOilCapacity;
    } else {
      resObj['customerStatus'] = 1;
      resObj['message'] = 'New customer';
    }
    resultList.push(resObj);
  } catch (err) {
    logger.error('ServiceBooking service getVehicleDetails', err);
    next(err);
  }
  return resultList;
};

const addServiceBooking = async (serviceBooking, user) => { 
  let result = '';
  let recentActivityData = {};
  try {

     logger.info(
      'ServiceBooking:' +
        JSON.stringify(user)
    );
    console.log(user.employeeId + ' employeeId');
    const employee = await ServiceBookingDao.findByemployeeById(
      user.employeeId
    );
    console.log(employee.id + ' id');
    console.log(employee.outletId + ' outletId');
    console.log(employee.outlet.outletCode + ' outletCode');
    const trackApiLogId = await MobileApiTrackService.bookingApiTrack(serviceBooking, 'POST', 'Bridge_API', 'External_API', user);;

  
    const bookingPayload = { ...serviceBooking };
    const bookingMobile = bookingPayload.customerMobileNumber || bookingPayload.mobileNumber;
    const bookingName = bookingPayload.customerName || bookingPayload.name;
    const registrationNumber = bookingPayload.registrationNumber;

    if (bookingName && bookingMobile && registrationNumber) {
      const existingVehicle = await ServiceBookingDao.getVehicleDetails(registrationNumber);
      if (existingVehicle) {
        const linkedCustomerId = existingVehicle.customer?.id || existingVehicle.customerId;
        if (!linkedCustomerId) {
          const error = new Error('Vehicle is not linked to a customer');
          error.status = 409;
          throw error;
        }
        bookingPayload.vehicleId = existingVehicle.id;
        bookingPayload.customeId = linkedCustomerId;
      } else {
        const existingCustomer = await CustomerDao.findByMobileNumber(String(bookingMobile).trim());
        const quickAddUser = {
          ...user,
          id: user.id || user.employeeId,
          outlet: user.outlet || employee.outlet,
        };
        const vehicleDetails = {
          registrationNumber,
          makeId: bookingPayload.makeId,
          modelId: bookingPayload.modelId,
          fuelType: bookingPayload.fuelType,
        };

        if (!vehicleDetails.makeId || !vehicleDetails.modelId || !vehicleDetails.fuelType) {
          const error = new Error('makeId, modelId, and fuelType are required to create a vehicle for this booking');
          error.status = 400;
          throw error;
        }

        if (existingCustomer) {
          const linked = await CustomerService.quickAddVehicleForCustomer({
            ...vehicleDetails,
            customerId: existingCustomer.id,
          }, quickAddUser);
          bookingPayload.customeId = linked.customerId;
          bookingPayload.vehicleId = linked.vehicleId;
        } else {
          const pinCode = bookingPayload.pinCode || bookingPayload.pincode;
          const address1 = bookingPayload.address1 || bookingPayload.customerAddress;
          if (!pinCode || !address1) {
            const error = new Error('pinCode and address1 are required to create a customer for this booking');
            error.status = 400;
            throw error;
          }
          const linked = await CustomerService.quickAddCustomer({
            name: bookingName,
            mobileNumber: String(bookingMobile).trim(),
            pinCode,
            address1,
            ...vehicleDetails,
          }, quickAddUser);
          bookingPayload.customeId = linked.customerId;
          bookingPayload.customerId = linked.customerId;
          bookingPayload.vehicleId = linked.vehicleId;
        }
      }
    }

    let data = await ServiceBookingDao.addServiceBooking(
      bookingPayload,
      user,
      employee
    );
    if (data.id != '') {
      if (trackApiLogId) {
      await MobileApiTrackService.updateMobileApiRes(trackApiLogId, data);
    }
      // TVSFIT push removed — both systems now share a single DB
      // const pushing_to_tvsfit = await pushBooking(data.id);
      //
      // console.log('pushBooking saveRes', pushing_to_tvsfit);
      //
      // if (!pushing_to_tvsfit || pushing_to_tvsfit.requestSuccessful == false) {
      //     recentActivityData['activity_type'] = 'pushing_to_tvsfit';
      //     recentActivityData['menu_name'] = 'service_booking';
      //     recentActivityData['createdBy'] = user.id;
      //     recentActivityData['username'] = user.employeeCode;
      //     recentActivityData['message'] =
      //       data.serviceBookingNumber + ' booking data Failed to push tvsfit ';
      //     const recent =
      //       await RecentAcivityService.addTransactionRecentActivity(
      //         recentActivityData
      //       );
      //     result = 'Failed';
      //   return {
      //     requestSuccessful: false,
      //     errorDescription: "Failed to push booking to TVSFIT",
      //   };
      // }
      //
      //   if (pushing_to_tvsfit.requestSuccessful = true) {
      //     recentActivityData['activity_type'] = 'pushing_to_tvsfit';
      //     recentActivityData['menu_name'] = 'service_booking';
      //     recentActivityData['createdBy'] = user.id;
      //     recentActivityData['username'] = user.employeeCode;
      //     recentActivityData['message'] =
      //       data.serviceBookingNumber + ' booking data push to tvsfit ';
      //     const recent =
      //       await RecentAcivityService.addTransactionRecentActivity(
      //         recentActivityData
      //       );
      //     result = 'success';
      //   }

    }
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'ServiceBooking';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        data.serviceBookingNumber + ' ServiceBooking is created ';
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
        // result = 'success';
      result = {
        status: 'success',
        bookingDetails: {
          id: data.id.toString(),
          BookingNumber: data.serviceBookingNumber,
          gobumprBookingId: serviceBooking.bookingId ? serviceBooking.bookingId.toString() : null,
        },
      };
    }
  } catch (err) {
    result = 'failed';
    logger.error('ServiceBooking service addServiceBooking', err);
    // next(err);
    throw err;
  }
  return result;
};


const addPolicyBazzarServiceBooking = async (req, user) => {
  try {
    const body = req || {};
    let userDetails = {};
    userDetails.id = 1;
    userDetails.roleid = 1;

    const trackLogId = await MobileApiTrackService.bookingApiTrack(body, 'POST', 'PolicyBazaar_API', 'External_API', userDetails);


    //  Validate JSON
    if (!body || typeof body !== "object") {
      return {
        requestSuccessful: false,
        code: "400",
        message: "JSON is Not Valid",
      };
    }

    //  Authentication
    const { userId, password, outletName, mobileNumber, customerCity, make, model } = body;
    let auth = false;

    if (userId == "tvs_new" && password == "tvs%$876") {
      auth = true;
    }

    if (!auth) {
      return {
        requestSuccessful: false,
        errorDescription: "Authentication Error",
      };
    }

    //  Find Outlet Branch
    const branch = await ServiceBookingDao.getOutletDetailsbyName(outletName);
    if (!branch) {
      return {
        requestSuccessful: false,
        errorDescription: "Outlet Name Not Match",
      };
    }

    const outletCompanyId = branch.companyId;

    //  Check duplicate booking
    const existingBooking = await ServiceBookingDao.getOpenBookingbyMobileNumber(mobileNumber);


    if (existingBooking) {
      const { serviceBookingNumber } = existingBooking.dataValues;

      return {
        requestSuccessful: false,
        errorDescription:
          "Already Booking Initiated Booking Number is : " + serviceBookingNumber,
        serviceBookingNo: serviceBookingNumber,
      };
    }
    //  Find customer
    // const customer = await ServiceBookingDao.getCustomerByMobileNumber(mobileNumber);

    // const customeDetails = customer.dataValues;
    // const customerId = customeDetails?.id || null;

    // Find Make
    const findMake = await ServiceBookingDao.findMakeName(make, outletCompanyId);

    const makeDetails = findMake.dataValues;

    //  Find Model
    const findModel = await ServiceBookingDao.findModelName(model, outletCompanyId);
    const modelDetails = findModel.dataValues;

    // let number = 1;
    // const fy = getCurrentFinancialYear();

    // if (lastBooking) {
    //   const parts = lastBooking.service_booking_no.split(/[-_]/);
    //   const existingFy = parts[1].replace(branch.branch, "");

    //   if (existingFy === fy) {
    //     number = Number(parts[2]) + 1;
    //   }
    // }

    // const formattedNo = String(number).padStart(6, "0");
    // const bookingNo = `SBK-${branch.branch}${fy}-${formattedNo}`;

    // Build ServiceBooking payload

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    const bookingPayload = {
      appointmentDate: formattedDate,
      booking_validity_date: new Date(Date.now() + 30 * 86400 * 1000),
      job_type: "SBK",
      source: 28,
      source_type: 354,
      status: "Inprogress",
      statusFlag: "2",
      appointment_status: "2",
      customer_type: "1",
      customerName: body.customerName,
      customerAddress: body.customerAddress,
      customerMobileNumber: body.mobileNumber,
      pincode: body.pinCode,
      customerState: body.customerState,
      customerStatus: "2",
      customerCity: body.customerCity,
      makeId: makeDetails.id,
      modelId: modelDetails.id,
      make: makeDetails.makeName,
      model: modelDetails.modelName,
      odometer: body.odometer ? body.odometer : 0,
      b2bBookingId: body.b2bBookingId,
      booking_id: 0,
      // shop_id: body.shopId,
      // shop_name: "policybazaar_booking",
      service_track: "policybazaar_booking",
      registrationNumber: body.registrationNumber || null,
    };
    let user = {};
    user.id = 1;
    let employee = {};
    employee.outlet = {};
    employee.outlet.outletCode = branch.outletCode;
    employee.outletId = branch.id;
    // 14. Save booking
    const saved = await ServiceBookingDao.addServiceBooking(bookingPayload, user, employee);
    // console.log('saved```````````````````',saved);
    if (!saved) {
      return {
        requestSuccessful: false,
        errorDescription: "Failed to save booking",
      };
    }
    if (trackLogId) {
      await MobileApiTrackService.updateMobileApiRes(trackLogId, saved);
    }
    // TVSFIT push removed — both systems now share a single DB
    // const pushtToTVSFIT = await pushBooking(saved.id);
    //
    // console.log('pushBooking saveRes', pushtToTVSFIT);
    //
    // if (!pushtToTVSFIT || pushtToTVSFIT.requestSuccessful == false) {
    //   return {
    //     requestSuccessful: false,
    //     errorDescription: "Failed to push booking to TVSFIT",
    //   };
    // }

    return {
      requestSuccessful: true,
      message: "Booking Saved Successfully",
      BookingDetails: {
        id: saved.id,
        BookingNumber: saved.serviceBookingNumber,
      },
    };
  } catch (err) {
    logger.error("PolicyBazaar API Error:", err);
    return {
      requestSuccessful: false,
      errorDescription: "Internal Server Error",
    };
  }
};

const pushBooking = async (bookingId) => {
  try {
    const serviceBookings = await ServiceBookingDao.findByServiceBookingId(bookingId, true)

    if (!serviceBookings) return;
    const serviceBooking = serviceBookings.get({ plain: true });
   
    const tvsfitAuth = await getRemoteToken();
    const loginData = tvsfitAuth;

    if (!loginData.token || loginData.userId == '') {
      logger.error('login error in tvsfit login api', loginData);
      return;
    }

    const outletDetails = await ServiceBookingDao.getOutletDetails(serviceBooking.outletId);
    // 6. MAP STATUS
    const statusMap = {
      1: "OPEN",
      2: "PROG",
      3: "COMP",
      4: "CNCL",
    };
    const status = statusMap[serviceBooking.statusFlag];
    let dispositionDetails = {};
    const remarks = serviceBooking.phoneCallNotes;

    const nextDate = serviceBooking.nextFollowupDate;
    const appointDate = serviceBooking.appointmentDate;
    let dispositionCode = null
    if (serviceBooking.dispositionId != null) {
      const disPOsitionDetails = await ServiceBookingDao.getDispositionDetails(serviceBooking.dispositionId);
      if (disPOsitionDetails.disPositionCode == 'BOOK') {
        dispositionDetails = {
          appointmentDate: appointDate,
          serviceType: serviceBooking.bu_type ?? 8, // not present at dms
          remarks,
        };
      } else if (['RSCH', 'NOCO', 'FOLL', 'HUNG', 'OTHR'].includes(disPOsitionDetails.disPositionCode)) {
        dispositionDetails = {
          nextFollowUpDate: nextDate,
          remarks,
        };
      } else {
        dispositionDetails = { remarks };
      }

      dispositionCode = disPOsitionDetails.disPositionCode
    }
    

    const toStringOrNull = (value) => 
    value == null ? null : String(value);

    // Helper function to format date
    const formatDateTime = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().slice(0, 19).replace("T", " ");
      } catch (error) {
        console.error('Date formatting error:', error, 'for date:', date);
        return null;
      }
    };


    // 9. PREPARE PAYLOAD
    const payload = {
      userId: loginData.userId,
      authenticationToken: loginData.token,
      branch: outletDetails.outletCode,
      serviceBookingId: toStringOrNull(serviceBooking.id),
      serviceBookingNumber: serviceBooking.serviceBookingNumber,
      status: status,
      // serviceBookingDate: toStringOrNull(appointDate),
      serviceBookingDate: formatDateTime(appointDate),
      registrationNumber: serviceBooking.registrationNumber,
      vehicleId: toStringOrNull(serviceBooking.vehicleId),
      vehicleMake: toStringOrNull(serviceBooking.vehicleMakeId),
      vehicleModel: toStringOrNull(serviceBooking.vehicleModelId),
      odometer: toStringOrNull(serviceBooking.odometer),

      customerName: serviceBooking.descryptCustomerName,

      customerMobileNumber: serviceBooking.decryptedMobile,

      customerAddress: serviceBooking.customerAddress,

      //  customerState: serviceBooking.pincodeDetails.cv_stateId?toStringOrNull(serviceBooking.pincodeDetails.cv_stateId):null, 
      customerState: serviceBooking.pincodeDetails?.cv_stateId?toStringOrNull(serviceBooking.pincodeDetails.cv_stateId):null,

      // customerCity: serviceBooking.pincodeDetails.cv_cityId?toStringOrNull(serviceBooking.pincodeDetails.cv_cityId):null,
      customerCity: serviceBooking.pincodeDetails?.cv_cityId?toStringOrNull(serviceBooking.pincodeDetails.cv_cityId):null,

      customerPincode: serviceBooking.pincode?serviceBooking.pincode:null,
      shopId: serviceBooking.shop_id ? toStringOrNull(serviceBooking.shop_id) : null,
      shopName: serviceBooking.shop_name ? toStringOrNull(serviceBooking.shop_name) : null,
      bookingId: serviceBooking.bookingId ? toStringOrNull(serviceBooking.bookingId) : null,
      b2bBookingId: serviceBooking.b2bBookingId ? toStringOrNull(serviceBooking.b2bBookingId) : null,
      source: toStringOrNull(serviceBooking.source),
      DmsSource: toStringOrNull(serviceBooking.dmsSourceId), 
      DmsSourceType: toStringOrNull(serviceBooking.dmsSourceTypeId),
      paymentId: toStringOrNull(serviceBooking.payment_id) ?? null,
      txnId: toStringOrNull(serviceBooking.txnid) ?? null,
      amount: toStringOrNull(serviceBooking.advance_amount) ?? null,
      paymentResponse: toStringOrNull(serviceBooking.payment_response) ?? null,
      paymentDate: toStringOrNull(serviceBooking.payment_date) ?? null,
      paymentRemarks: toStringOrNull(serviceBooking.payment_remarks) ?? null,
      // pickUpDriverId: driver.id?driver.id:"",
      pickUpDriverId: null,
      pickUpDriverName: " ", // future will implement driver master concept
      pickUpDriverMobileNumber: null,
      pickUpAddress: serviceBooking.pick_up_address ?? null,
      // pickUpDateandTime: serviceBooking.pickup_date ? toStringOrNull(serviceBooking.pickup_date) : null,
      pickUpDateandTime: formatDateTime(serviceBooking.pickup_date),
      disposition: dispositionCode,
      dispositionDetails,
    };

    let userDetails = {};
    userDetails.id = 1;
    userDetails.roleid = 1;
    const trackLogId = await MobileApiTrackService.bookingApiTrack(payload, 'POST', 'Push_To_TVSFIT', 'External_API', userDetails);
    const saveRes = await axios.post(
      EXTERNAL_API.SAVE_APT_FROM_DMS,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true
      }
    );

    if (trackLogId) {
      await MobileApiTrackService.updateMobileApiRes(trackLogId, {
        status: saveRes.status,
        data: saveRes.data
      });
    }

    

    if (saveRes.status < 200 || saveRes.status > 299) {
      return {
        requestSuccessful: false,
        status: saveRes.status,
        message: "Failed to push booking to TVSFIT",
        error: saveRes.data
      };
    }
    return {
      requestSuccessful: true,
      status: saveRes.status,
      data: saveRes.data
    };


  } catch (err) {
    console.error("pushBooking Error:", err);
  }
}


const addServiceBookingMobile = async (serviceBooking, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    console.log(user.employeeId + ' employeeId');
    const employee = await ServiceBookingDao.findByemployeeById(
      user.employeeId
    );
    console.log(employee.id + ' id');
    console.log(employee.outletId + ' outletId');
    console.log(employee.outlet.outletCode + ' outletCode');
    let data = await ServiceBookingDao.addServiceBookingMobile(
      serviceBooking,
      user,
      employee
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'ServiceBooking';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        data.serviceBookingNumber + ' ServiceBooking mobile is created ';
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
      result = { success: true, bookingId: data };
    }
  } catch (err) {
    result = 'failed';
    logger.error('ServiceBooking service addServiceBooking', err);
    next(err);
  }

  return result;
};

const pad = (num) => String(num).padStart(2, '0');

const formatDateTime = (date) => {
  if (!date) return '';

  const d = new Date(date);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1); // Month is 0-based
  const day = pad(d.getDate());

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const listServiceBookings = async (reqData, user) => {

  const resultList = [];
  try {
    const { totalItems, data } = await ServiceBookingDao.listServiceBookings(
      reqData,
      user
    );
    const activityRows = await ServiceBookingDao.getServiceBookingActivityHistoryByIds(
      data.map(element => element.id)
    );
    const activityHistoryByBooking = activityRows.reduce((historyByBooking, activity) => {
      if (!historyByBooking.has(activity.serviceBookingId)) {
        historyByBooking.set(activity.serviceBookingId, []);
      }
      historyByBooking.get(activity.serviceBookingId).push(activity);
      return historyByBooking;
    }, new Map());
    data.forEach(async (element) => {
      const resObj = {};
      const activityHistory = activityHistoryByBooking.get(element.id) || [];
      const latestActivity = activityHistory[activityHistory.length - 1];
      resObj['id'] = element.id;
      resObj['serviceBookingNumber'] = element.serviceBookingNumber;
      resObj['customerId'] = element.customeId ?? element.customerId ?? null;
      resObj['vehicleId'] = element.vehicleId ?? null;
      resObj['registrationNumber'] = element.registrationNumber;
      resObj['customerName'] = element.customerName;
      resObj['customerMobileNumber'] = element.customerMobileNumber;
      resObj['status'] = latestActivity?.status || element.status;
      resObj['bookingStatus'] = element.status;
      resObj['latestActivityStatus'] = latestActivity?.status || null;
      resObj['customerAddress'] = element.customerAddress;
      resObj['phoneCallNotes'] = element.phoneCallNotes;
      resObj['source'] = element.source;
      resObj['odometer'] = element.odometer;
      resObj['pincode'] = element.pincode;
      resObj['customerCity'] = element.customerCity;
      resObj['customerState'] = element.customerState;
      resObj['dmsSourceId'] = element.dmsSourceId;
      resObj['dmsSourceTypeId'] = element.dmsSourceTypeId;
      resObj['serviceType'] = element.serviceType;
      resObj['scheduledStartDate'] = formatDateTime(element.scheduledStartDate);
      resObj['scheduledEndDate'] = formatDateTime(element.scheduledEndDate);
      resObj['appointmentDate'] = formatDateTime(element.appointmentDate);
      resObj['nextFollowupDate'] = formatDateTime(element.nextFollowupDate);
      resObj['disposition'] = element.disposition?.title || '';
      resObj['make'] = element.make?.makeName || '';
      resObj['model'] = element.model?.modelName || '';
      resObj['pickup_status'] = element.pickup_status;
      resObj['dropoff_status'] = element.dropoff_status;
      resObj['driver_status'] = element.driver_status;
      resObj['pickup_driver_id'] = element.pickup_driver_id;
      resObj['pick_up_address'] = element.pick_up_address;
      resObj['pickup_date'] = formatDateTime(element.pickup_date);
      resObj['dropoff_driver_id'] = element.dropoff_driver_id;
      resObj['drop_off_address'] = element.drop_off_address;
      resObj['drop_off_date'] = formatDateTime(element.drop_off_date);
      resObj['pickupStatus'] = element.pickup_status == null ? null : Number(element.pickup_status) === 1;
      resObj['pickupDateTime'] = formatDateTime(element.pickup_date || element.pick_up_date);
      resObj['pickupAddress'] = element.pick_up_address;
      resObj['pickupDriverId'] = element.pickup_driver_id;
      resObj['dropoffStatus'] = element.dropoff_status == null ? null : Number(element.dropoff_status) === 1;
      resObj['dropOffDateTime'] = formatDateTime(element.drop_off_date);
      resObj['dropOffAddress'] = element.drop_off_address;
      resObj['dropoffDriverId'] = element.dropoff_driver_id;
      resObj['followupDate'] = latestActivity?.followupDate ?? null;
      resObj['activityHistory'] = activityHistory;

      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('ServiceBooking service listServiceBookings', err);
    throw err;
  }
};

const listAppointments = async (filters, user) => {
  try {
    const rows = await ServiceBookingDao.listAppointments(filters, user);
    const activityRows = await ServiceBookingDao.getServiceBookingActivityHistoryByIds(
      rows.map(row => row.id)
    );
    const activityHistoryByBooking = activityRows.reduce((historyByBooking, activity) => {
      if (!historyByBooking.has(activity.serviceBookingId)) {
        historyByBooking.set(activity.serviceBookingId, []);
      }
      historyByBooking.get(activity.serviceBookingId).push(activity);
      return historyByBooking;
    }, new Map());
    const statusColors = {
      Open: 'yellow',
      Pending: 'yellow',
      Confirmed: 'yellow',
      'Move to Estimate': 'purple',
      Inprogress: 'blue',
      Completed: 'green',
      Cancelled: 'red',
      'Appointment Rescheduled': 'orange',
      'Not Contactable': 'gray',
      'Call Back/Under Follow Up': 'orange',
      'Hung Up/Refuse to Speak': 'gray',
      'Service Done from Outside': 'green',
      'Service Not required': 'gray',
      'Vehicle Sold': 'gray',
      'Wrong Number': 'gray',
      'Appointment Cancelled': 'red',
      'Proceed to Jobcard': 'blue',
      Others: 'gray',
    };
    const getDate = (value) => value ? String(value).slice(0, 10) : null;
    const getTime = (value) => {
      if (!value) return null;
      const match = String(value).match(/(?:T|\s)?(\d{2}:\d{2})/);
      return match ? match[1] : null;
    };

    return rows.map((row) => {
      const activityHistory = activityHistoryByBooking.get(row.id) || [];
      const latestActivity = activityHistory[activityHistory.length - 1];
      return ({
      id: row.id,
      bookingNumber: row.bookingNumber,
      customerId: row.customerId,
      customerName: row.customerName,
      customerMobileNumber: row.customerMobileNumber,
      vehicleId: row.vehicleId,
      registrationNumber: row.registrationNumber,
      serviceType: row.serviceType,
      advisorId: row.advisorId,
      advisorName: row.advisorName,
      appointmentDate: getDate(row.appointmentDate),
      startTime: getTime(row.scheduledStartDate),
      endTime: getTime(row.scheduledEndDate),
      status: row.status,
      bookingStatus: row.bookingStatus || row.status,
      latestActivityStatus: latestActivity?.status || null,
      color: statusColors[row.status] || 'gray',
      pickupStatus: row.pickupStatus === null || row.pickupStatus === undefined
        ? null
        : Number(row.pickupStatus) === 1,
      pickupDateTime: row.pickupDateTime,
      pickupAddress: row.pickupAddress,
      pickupDriverId: row.pickupDriverId,
      dropoffStatus: row.dropoffStatus === null || row.dropoffStatus === undefined
        ? null
        : Number(row.dropoffStatus) === 1,
      dropOffDateTime: row.dropOffDateTime,
      dropOffAddress: row.dropOffAddress,
      dropoffDriverId: row.dropoffDriverId,
      followupDate: latestActivity?.followupDate ?? null,
      activityHistory,
    });
    });
  } catch (err) {
    logger.error('ServiceBooking service listAppointments', err);
    throw err;
  }
};

const updateServiceBooking = async (id, serviceBooking, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const serviceBookingExists = await ServiceBookingDao.findByServiceBookingId(id);
    if (!serviceBookingExists) return result;

    const activityStatus = normalizeServiceBookingActivityStatus(serviceBooking.status);
    const existing = serviceBookingExists.get({ plain: true });
    const existingName = existing.descryptCustomerName || existing.customerName;
    const existingMobile = existing.decryptedMobile || existing.customerMobileNumber;
    const mergedBooking = {
      ...existing,
      ...serviceBooking,
      bookingNumber: serviceBooking.bookingNumber ?? existing.serviceBookingNumber,
      customerName: serviceBooking.customerName ?? existingName,
      customerMobileNumber: serviceBooking.customerMobileNumber ?? existingMobile,
      customeId: serviceBooking.customeId ?? serviceBooking.customerId ?? existing.customeId,
      makeId: serviceBooking.makeId ?? existing.vehicleMakeId,
      modelId: serviceBooking.modelId ?? existing.vehicleModelId,
      pincode: serviceBooking.pincode ?? existing.pincode,
      pickupStatus: serviceBooking.pickupStatus ?? existing.pickup_status ?? (
        existing.pickup_driver_id || existing.pickup_date || existing.pick_up_date || existing.pick_up_address ? 1 : null
      ),
      pickupDateTime: serviceBooking.pickupDateTime ?? serviceBooking.pickup_date ?? existing.pickup_date ?? existing.pick_up_date,
      pickupAddress: serviceBooking.pickupAddress ?? existing.pick_up_address,
      pickupDriverId: serviceBooking.pickupDriverId ?? existing.pickup_driver_id,
      dropoffStatus: serviceBooking.dropoffStatus ?? existing.dropoff_status ?? (
        existing.dropoff_driver_id || existing.drop_off_date || existing.drop_off_address ? 1 : 0
      ),
      dropOffDateTime: serviceBooking.dropOffDateTime ?? existing.drop_off_date,
      dropOffAddress: serviceBooking.dropOffAddress ?? existing.drop_off_address,
      dropoffDriverId: serviceBooking.dropoffDriverId ?? existing.dropoff_driver_id,
      pickup_date: serviceBooking.pickup_date ?? existing.pickup_date,
      pickup_time: serviceBooking.pickup_time ?? existing.pickup_time,
      service_description: serviceBooking.service_description ?? existing.service_description,
      bookingId: serviceBooking.bookingId ?? existing.bookingId,
      b2bBookingId: serviceBooking.b2bBookingId ?? existing.b2bBookingId,
      status: activityStatus ? existing.status : (serviceBooking.status ?? existing.status),
      statusFlag: activityStatus ? existing.statusFlag : (serviceBooking.statusFlag ?? existing.statusFlag),
    };
    let activityData = activityStatus ? {
      status: activityStatus,
      reason: serviceBooking.reason || null,
      remarks: serviceBooking.remarks || null,
      followupDate: serviceBooking.followupDate || null,
      serviceProvider: serviceBooking.serviceProvider || null,
      saleDetails: serviceBooking.saleDetails || null,
      correctContactNumber: serviceBooking.correctContactNumber || null,
      createEstimate: serviceBooking.createEstimate ?? null,
    } : null;

    if (activityStatus === 'Appointment Rescheduled') {
      const followupDate = serviceBooking.followupDate;
      const moveTimeToDate = (value) => {
        if (!value) return value;
        const time = String(value).match(/(?:T|\s)(\d{2}:\d{2}(?::\d{2})?)/)?.[1];
        return time ? `${followupDate} ${time}` : followupDate;
      };
      mergedBooking.appointmentDate = followupDate;
      mergedBooking.scheduledStartDate = moveTimeToDate(existing.scheduledStartDate);
      mergedBooking.scheduledEndDate = moveTimeToDate(existing.scheduledEndDate);
    } else if (activityStatus === 'Call Back/Under Follow Up') {
      mergedBooking.nextFollowupDate = serviceBooking.followupDate;
    } else if (activityStatus === 'Appointment Cancelled') {
      mergedBooking.status = 'Cancelled';
      mergedBooking.statusFlag = 4;
    }

    let createdEstimateId = null;
    let jobCardCreationStatus = null;
    if (activityStatus === 'Proceed to Jobcard' && serviceBooking.createEstimate === true) {
      let linkedVehicle = null;
      let customerId = serviceBooking.customerId ?? serviceBooking.customeId ?? existing.customeId ?? existing.customerId;
      let vehicleId = serviceBooking.vehicleId ?? existing.vehicleId;
      if (!customerId || !vehicleId) {
        linkedVehicle = await ServiceBookingDao.getVehicleDetails(existing.registrationNumber);
        customerId = customerId ?? linkedVehicle?.customer?.id ?? linkedVehicle?.customerId;
        vehicleId = vehicleId ?? linkedVehicle?.id;
      }
      const linkedCustomer = linkedVehicle?.customer;
      const estimateCustomerName = serviceBooking.customerName
        || existingName
        || [linkedVehicle?.dataValues?.decryptedFirstName, linkedVehicle?.dataValues?.decryptedLastName].filter(Boolean).join(' ');
      const estimateMobileNumber = serviceBooking.customerMobileNumber
        || serviceBooking.mobileNumber
        || existingMobile
        || linkedVehicle?.dataValues?.decryptedMobileNumber;
      if (!customerId || !vehicleId || !estimateCustomerName || !estimateMobileNumber) {
        throw new Error('Booking conversion requires linked customer and vehicle details; include customerId and vehicleId in the edit request or ensure the registration number is linked to a customer');
      }
      const estimateRequest = {
        ...existing,
        ...serviceBooking,
        status: 1,
        serviceBookingId: Number(id),
        serviceBookingNo: existing.serviceBookingNumber,
        customerId,
        vehicleId,
        registrationNumber: serviceBooking.registrationNumber || existing.registrationNumber,
        name: estimateCustomerName,
        customerName: estimateCustomerName,
        mobileNumber: estimateMobileNumber,
        customerMobileNumber: estimateMobileNumber,
        customerAddress: serviceBooking.customerAddress || existing.customerAddress || linkedCustomer?.address1,
        customerState: serviceBooking.customerState || existing.customerState || linkedCustomer?.state,
        customerCity: serviceBooking.customerCity || existing.customerCity || linkedCustomer?.city,
        pincode: serviceBooking.pincode || existing.pincode || linkedCustomer?.pinCode,
        pinCode: serviceBooking.pincode || existing.pincode || linkedCustomer?.pinCode,
        makeId: serviceBooking.makeId || existing.vehicleMakeId || linkedVehicle?.makeId,
        modelId: serviceBooking.modelId || existing.vehicleModelId || linkedVehicle?.modelId,
        odometer: existing.odometer,
        sourceId: existing.dmsSourceId,
        sourceTypeId: existing.dmsSourceTypeId,
        serviceTypeId: serviceBooking.serviceTypeId || existing.serviceTypeId || existing.serviceType || null,
        jobType: existing.jobType || 'SQRT',
        laborEstimate: [],
        oslLaborEstimate: [],
        partsEstimate: [],
      };
      const estimateResult = await ServiceEstimateService.createServiceEstimate(
        estimateRequest,
        user,
        {
          internalCall: true,
          source: 'serviceBooking',
          serviceBookingId: Number(id),
        }
      );
      if (!estimateResult || estimateResult.result !== 'success') {
        throw new Error('Service estimate could not be created');
      }
      createdEstimateId = estimateResult.estimateId;
      activityData.estimateId = createdEstimateId;
    } else if (activityStatus === 'Proceed to Jobcard') {
      // Job-card details are submitted through the dedicated
      // /api/jobCard/createJobCardFromServiceBooking endpoint.
      jobCardCreationStatus = 'PENDING_JOB_CARD_CREATION';
    }

    const appointmentDate = mergedBooking.appointmentDate;
    const toScheduledDateTime = (scheduledDateTime, time) => {
      if (scheduledDateTime || !time) return scheduledDateTime;
      const timeValue = String(time).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(timeValue)) return timeValue;
      const normalizedTime = /^\d{2}:\d{2}$/.test(timeValue)
        ? `${timeValue}:00`
        : timeValue;
      return appointmentDate ? `${appointmentDate} ${normalizedTime}` : normalizedTime;
    };

    serviceBooking = {
      ...mergedBooking,
      scheduledStartDate: toScheduledDateTime(
        mergedBooking.scheduledStartDate,
        mergedBooking.startTime
      ),
      scheduledEndDate: toScheduledDateTime(
        mergedBooking.scheduledEndDate,
        mergedBooking.endTime
      ),
    };

    if (!activityStatus && serviceBooking.status !== undefined && serviceBooking.status !== null) {
      const statusDetails = normalizeServiceBookingStatus(serviceBooking.status);
      if (!statusDetails) {
        throw new Error('Unsupported service booking status');
      }
      serviceBooking.status = statusDetails.status;
      serviceBooking.statusFlag = statusDetails.statusFlag;
      if (serviceBooking.status !== existing.status) {
        activityData = {
          status: serviceBooking.status,
          reason: serviceBooking.reason || null,
          remarks: serviceBooking.remarks || null,
          followupDate: serviceBooking.followupDate || null,
          serviceProvider: serviceBooking.serviceProvider || null,
          saleDetails: serviceBooking.saleDetails || null,
          correctContactNumber: serviceBooking.correctContactNumber || null,
          createEstimate: serviceBooking.createEstimate ?? null,
        };
      }
    }

    if (serviceBookingExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'ServiceBooking';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (
        serviceBookingExists.registrationNumber !=
        serviceBooking.registrationNumber
      ) {
        message =
          message +
          ' registrationNumber changed from ' +
          serviceBookingExists.registrationNumber +
          ' to ' +
          serviceBooking.registrationNumber +
          ' ,';
      }
      if (serviceBookingExists.customerName != serviceBooking.customerName) {
        message =
          message +
          ' customerName changed from ' +
          serviceBookingExists.customerName +
          ' to ' +
          serviceBooking.customerName +
          ' ,';
      }
      if (serviceBookingExists.status != serviceBooking.status) {
        message =
          message +
          ' status changed from ' +
          serviceBookingExists.status +
          ' to ' +
          serviceBooking.status +
          ' ,';
      }
      if (serviceBookingExists.odometer != serviceBooking.odometer) {
        message =
          message +
          ' odometer changed from ' +
          serviceBookingExists.odometer +
          ' to ' +
          serviceBooking.odometer +
          ' ,';
      }
      if (
        serviceBookingExists.customerMobileNumber !=
        serviceBooking.customerMobileNumber
      ) {
        message =
          message +
          ' customerMobileNumber changed from ' +
          serviceBookingExists.customerMobileNumber +
          ' to ' +
          serviceBooking.customerMobileNumber +
          ' ,';
      }
      if (
        serviceBookingExists.customerAddress != serviceBooking.customerAddress
      ) {
        message =
          message +
          ' customerAddress changed from ' +
          serviceBookingExists.customerAddress +
          ' to ' +
          serviceBooking.customerAddress +
          ' ,';
      }
      if (serviceBookingExists.customerState != serviceBooking.customerState) {
        message =
          message +
          ' customerState changed from ' +
          serviceBookingExists.customerState +
          ' to ' +
          serviceBooking.customerState +
          ' ,';
      }
      if (serviceBookingExists.customerCity != serviceBooking.customerCity) {
        message =
          message +
          ' customerCity changed from ' +
          serviceBookingExists.customerCity +
          ' to ' +
          serviceBooking.customerCity +
          ' ,';
      }
      if (
        serviceBookingExists.customerStatus != serviceBooking.customerStatus
      ) {
        message =
          message +
          ' customerStatus changed from ' +
          serviceBookingExists.customerStatus +
          ' to ' +
          serviceBooking.customerStatus +
          ' ,';
      }
      if (serviceBookingExists.pincode != serviceBooking.pincode) {
        message =
          message +
          ' pincode changed from ' +
          serviceBookingExists.pincode +
          ' to ' +
          serviceBooking.pincode +
          ' ,';
      }
      if (serviceBookingExists.serviceType != serviceBooking.serviceType) {
        message =
          message +
          ' serviceType changed from ' +
          serviceBookingExists.serviceType +
          ' to ' +
          serviceBooking.serviceType +
          ' ,';
      }
      if (
        serviceBookingExists.phoneCallNotes != serviceBooking.phoneCallNotes
      ) {
        message =
          message +
          ' phoneCallNotes changed from ' +
          serviceBookingExists.phoneCallNotes +
          ' to ' +
          serviceBooking.phoneCallNotes +
          ' ,';
      }
      if (
        serviceBookingExists.appointmentDate != serviceBooking.appointmentDate
      ) {
        message =
          message +
          ' appointmentDate changed from ' +
          serviceBookingExists.appointmentDate +
          ' to ' +
          serviceBooking.appointmentDate +
          ' ,';
      }
      if (
        serviceBookingExists.nextFollowupDate != serviceBooking.nextFollowupDate
      ) {
        message =
          message +
          ' nextFollowupDate changed from ' +
          serviceBookingExists.nextFollowupDate +
          ' to ' +
          serviceBooking.nextFollowupDate +
          ' ,';
      }

      message = message.slice(0, -1);
      // Preserve existing statusFlag when the edit payload didn't resolve one
      // (servicebookings.statusFlag is NOT NULL — avoids notNull violation on edit).
      serviceBooking.statusFlag =
        serviceBooking.statusFlag ?? serviceBookingExists.statusFlag;
      let data = await ServiceBookingDao.updateServiceBooking(
        id,
        serviceBooking,
        user.id,
        activityData
      );
      if (data) {
        const activityHistory = await ServiceBookingDao.getServiceBookingActivityHistoryByIds([Number(id)]);
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addTransactionRecentActivity(
              recentActivityData
            );
        }
        result = activityData
          ? {
              status: 'success',
              activityStatus,
              followupDate: serviceBooking.followupDate || null,
              activityHistory,
              estimateId: createdEstimateId,
              jobCardCreationStatus,
            }
          : 'success';
      }
    }
  } catch (err) {
    logger.error('ServiceBooking service updateServiceBooking', err);
    throw err;
  }
  return result;
};

const exportServiceBookings = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, rows } = await dao.getServiceBookingReport(reqData, user);
    const activityRows = await ServiceBookingDao.getServiceBookingActivityHistoryByIds(
      rows.map((booking) => booking.id)
    );
    const latestStatusByBooking = new Map();
    for (const activity of activityRows) {
      latestStatusByBooking.set(activity.serviceBookingId, activity.status);
    }

    // data.forEach(async (element) => {
    for (const element of rows) {
      element.customerName = element.dataValues.decryptedCustomerName;
      element.customerMobileNumber = element.dataValues.decryptedCustomerMobileNumber;
      delete element.dataValues.decryptedCustomerName;
      delete element.dataValues.decryptedCustomerMobileNumber;

      const resObj = {};
      resObj['id'] = element.id ? element.id : "";
      resObj['serviceBookingNumber'] = element.serviceBookingNumber ? element.serviceBookingNumber : "";
      resObj['registrationNumber'] = element.registrationNumber ? element.registrationNumber : "";
      resObj['status'] = latestStatusByBooking.get(element.id) || element.status || "";
      resObj['bookingStatus'] = element.status || "";
      resObj['customerMobileNumber'] = element.customerMobileNumber ? element.customerMobileNumber : "";
      resObj['customerName'] = element.customerName ? element.customerName : "";
      resObj['phoneCallNotes'] = element.phoneCallNotes ? element.phoneCallNotes : "";

      resObj['createdAt'] = element.createdAt ? element.createdAt : "";
      resObj['scheduledStartDate'] = element.scheduledStartDate;
      resObj['scheduledEndDate'] = element.scheduledEndDate ? element.scheduledEndDate : "";
      resObj['title'] = element.disposition ? element.disposition.title : "";
      resObj['makeName'] = element.make ? element.make.makeName : "";
      resObj['modelName'] = element.model ? element.model.modelName : "";
      resObj['documentDate'] = element.createdAt ? element.createdAt : "";
      resObj['chassisNo'] = element.vehicle ? element.vehicle.chassisNumber : "";
      resObj['engineNo'] = element.vehicle ? element.vehicle.engineNumber : "";
      resObj['sourceType'] = element.sourcetype ? element.sourcetype.sourceTypeName : "";
      resObj['pickupDriverName'] = element.serviceEstimate?.driverName || "";
      resObj['pickupDriverMobile'] = element.serviceEstimate?.driverMobileNumber || "";
      resObj['pickupAddress'] = element.pick_up_address ? element.pick_up_address : "";
      resObj['pickupDate'] = element.pickup_date ? element.pickup_date : "";
      resultList.push(resObj);
    }
    // );
    let count = resultList.length;

    if (reqData.offset && reqData.offset > 0) {
      resultList = resultList.slice(reqData.offset);
    };

    if (resultList.length > reqData.limit) {
      resultList = resultList.slice(0, reqData.limit);
    };

    return {
      totalItems: count, data: resultList
    };

  } catch (err) {
    logger.error('ServiceBooking Service exportServiceBookings Error:', err);
    throw err;
  }
};

const getOpenBookings = async (user) => {
  try {
    const data = await ServiceBookingDao.getOpenBookings(user);
    const activityRows = await ServiceBookingDao.getServiceBookingActivityHistoryByIds(
      data.map((booking) => booking.id)
    );
    const activitiesByBooking = activityRows.reduce((result, activity) => {
      if (!result.has(activity.serviceBookingId)) result.set(activity.serviceBookingId, []);
      result.get(activity.serviceBookingId).push(activity);
      return result;
    }, new Map());
    return data.map((booking) => {
      const bookingData = booking.get({ plain: true });
      const activityHistory = activitiesByBooking.get(booking.id) || [];
      const latestActivity = activityHistory[activityHistory.length - 1];
      bookingData.bookingStatus = bookingData.status;
      bookingData.latestActivityStatus = latestActivity?.status || null;
      bookingData.status = latestActivity?.status || bookingData.status;
      bookingData.activityHistory = activityHistory;
      return bookingData;
    });
  } catch (err) {
    logger.error('ServiceBooking Service getOpenBookings Error:', err);
    next(err);
  }
};

const getServiceBookingData = async (reqData) => {
  try {
    const data = await ServiceBookingDao.getServiceBookingData(
      reqData.selectedServiceBooking.id
    );
    if (!data) return data;
    const bookingData = data.get({ plain: true });
    const activityHistory = await ServiceBookingDao.getServiceBookingActivityHistoryByIds([
      Number(bookingData.id),
    ]);
    const latestActivity = activityHistory[activityHistory.length - 1];
    bookingData.bookingStatus = bookingData.status;
    bookingData.latestActivityStatus = latestActivity?.status || null;
    bookingData.status = latestActivity?.status || bookingData.status;
    bookingData.activityHistory = activityHistory;
    return bookingData;
  } catch (err) {
    logger.error('ServiceBooking Service getServiceBookingData Error:', err);
    next(err);
  }
};

const ServiceBookingService = {
  getVehicleDetails,
  addServiceBooking,
  listServiceBookings,
  listAppointments,
  updateServiceBooking,
  exportServiceBookings,
  getOpenBookings,
  getServiceBookingData,
  addPolicyBazzarServiceBooking,
  addServiceBookingMobile
};

export default ServiceBookingService;
