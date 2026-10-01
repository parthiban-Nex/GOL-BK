import dao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import { fn, col } from 'sequelize';
import moment from 'moment-timezone';

const createServiceReminder = async (req, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await dao.createServiceReminder(req, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Service Reminder Alert';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = 'Service Reminder Alert added';
      await RecentAcivityService.addRecentActivity(recentActivityData);
      result = { success: true, serviceAlert: data };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Service Reminder Alert addVehicle', err);
  }
  return result;
};

const listServiceReminderAlert = async (jcId) => {
  try {
    const serviceReminder = listServiceReminderAlert();

    return serviceReminder;
  } catch (err) {
    logger.error('Service Reminder Alert', err);
  };
};

const getServiceReminderAlert = async (jcId, leadId) => {
  try {
    let serviceReminder = await dao.listServiceReminderAlert();
    let data = await dao.getServiceReminderAlert(jcId, leadId);

    if (data && data.length > 0) {
      data.map(d => {
        d.dataValues.scheduleCode = d.dataValues.schedule_code;
        d.dataValues.scheduleDescription = d.dataValues.schedule_description;
        d.dataValues.scheduleId = d.dataValues.schedule_id;
        
        for (const code of serviceReminder) {
          if(code.scheduleCode === d.dataValues.schedule_code){
            d.dataValues.group_code = code.group_code
          }
        };
      
        delete d.dataValues.schedule_code;
        delete d.dataValues.schedule_description;
        delete d.dataValues.schedule_id;
      });
     
      serviceReminder = serviceReminder.map((item) => {
        const alertItem = data.find((alert) => alert.dataValues.scheduleCode === item.scheduleCode);

        if (alertItem) {
          return alertItem.dataValues;
        };

        return item;
      });
    }

    serviceReminder.map(d => {
      d.last_service_date = d.last_service_date ? moment(d.last_service_date).format('DD-MM-YYYY') : null;
      d.next_service_date = d.next_service_date ? moment(d.next_service_date).format('DD-MM-YYYY') : null;
      d.tvs_next_service_date = d.tvs_next_service_date ? moment(d.tvs_next_service_date).format('DD-MM-YYYY') : null;
    });
    
    return serviceReminder;
  } catch (err) {
    logger.error('Service Reminder Alert service getServiceReminderAlert', err);
  }
};

const getServiceReminderData = async (reqData, user) => {
  try {
    const data = await dao.getServiceReminderData(reqData, user);

    // for(const item of data) {
    let dataWithCustomHeaders = data.map((item, index) => {
      const lastServiceDate =item.dataValues.last_service_date? moment(item.dataValues.last_service_date).tz('Asia/Kolkata').format('DD-MM-YYYY'): '';
      const nextServiceDate = item.dataValues.next_service_date? moment(item.dataValues.next_service_date).tz('Asia/Kolkata').format('DD-MM-YYYY'): '';
      const tvsNextServiceDate = item.dataValues.tvs_next_service_date? moment(item.dataValues.tvs_next_service_date).tz('Asia/Kolkata').format('DD-MM-YYYY'): '';
      const createdAt = item.dataValues.createdAt? moment(item.dataValues.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY'): '';

      return {
        autoId: index + 1,
        outletId: item.outlet_id ?? '',
        outletCode: item.outlet.outletCode ?? '',
        jcId: item.jc_id ?? '',
        leadId: item.lead_id ?? '',
        jcNumber: item.jc_number ?? '',
        scheduleId: item.schedule_id ?? '',
        scheduleCode: item.schedule_code ?? '',
        scheduleDescription: item.schedule_description ?? '',
        customerId: item.customer_id ?? '',
        customerCode: item.customer_code ?? '',
        vehicleId: item.vehicle_id ?? '',
        vehicleRegNo: item.vehicle_reg_no ?? '',
        makeName: item.jobcard ? item.jobcard.vehicle.make.makeName : item.lead.vehicle.make.makeName ?? '',
        modelName: item.jobcard ? item.jobcard.vehicle.model.modelName : item.lead.vehicle.model.modelName ?? '',
        customerName: item.jobcard ? item.jobcard.customer_name : item.lead.customerName ?? '',
        customerMobileNumber: item.jobcard ? item.jobcard.customer_mobileNumber : item.lead.mobileNo ?? '',
        avgkmPerDay: item.avg_km_per_day ?? '',
        avgkmBtwService: item.avg_km_btw_service ?? '',
        lastServicekm: item.last_service_km ?? '',
        lastServiceDate: lastServiceDate ?? '',
        nextServiceDate: nextServiceDate ?? '',
        tvsNextServiceDate: tvsNextServiceDate ?? '',
        createdBy: item.created_by ?? '',
        createdAt: createdAt ?? '',
        leads: item.lead ?? '',
        jobcard: item.jobcard ?? '',
      };
    });
    // };

    for (const item of dataWithCustomHeaders){
      if(item.leads === ""){
        delete item.leads;
      } else if(item.jobcard === "") {
        delete item.jobcard;
      };
    };

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    };
    
    if(dataWithCustomHeaders.length > reqData.limit) {
      dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    };

   return {totalItems: count, data: dataWithCustomHeaders};
  } catch (err) {
    logger.error('Service Reminder Alert service getServiceReminderData', err);
  }
};


const service = {
  createServiceReminder,
  listServiceReminderAlert,
  getServiceReminderAlert,
  getServiceReminderData
};

export default service;
