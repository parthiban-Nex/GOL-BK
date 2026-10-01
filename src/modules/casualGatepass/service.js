import casualGatePassDao from "./dao.js";
import logger from "../../config/logger.js";
import RecentAcivityService from '../recentActivity/service.js';

const createCasualGatePass = async (reqData, user) => {
    let result = '';
    let recentActivityData = {};
    try {
        let docNumber =  await generateDocNumber(reqData, user.outlet.outletCode);
        let data = await casualGatePassDao.createCasualGatePass(docNumber, reqData, user);

        if (data) {
            recentActivityData['activity_type'] = 'Create';
            recentActivityData['menu_name'] = 'Transaction';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;
            recentActivityData['message'] =
                user.employeeName + ' Employee is created ';
            const recent =
                await RecentAcivityService.addRecentActivity(recentActivityData);
            result = 'success';
        }
    } catch (err) {
        result = 'failed';
        logger.error('Casual_Gate_Pass service createCasualGatePass', err);
        next(err);
    };

    return result;
};

const listCasualGatePass = async (reqData, user) => {
    try {
        const data = await casualGatePassDao.listCasualGatePass(reqData,user);
        return data;
    } catch (err) {
        logger.error('Casual Gate Pass service listCasualGatePass', err);
        next(err);
    }
};

const getTechnician = async (reqData, user) => {
    try {
        const data = await casualGatePassDao.getTechnician(user.outlet.id, user.employeeId);
        return data;
    } catch (err) {
        logger.error("Casual Gate Pass service listJobCards", err);
        next(err);
    }
};


const downloadCasualGatePass = async (registrationNo, outlet) => {
    const resObj = {};
    try {
        const data = await casualGatePassDao.downloadCasualGatePass(registrationNo);
        
        // Populate outlet details
        outlet["code"] = outlet.outletCode;
        outlet["address"] = outlet.address1;
        outlet["city"] = outlet.city;
        outlet["state"] = outlet.state;
        outlet["pincode"] = outlet.pincode;
        outlet["phone"] = outlet.phoneNumber;
        outlet["mobile"] = outlet.phoneNumber;
        outlet["email"] = outlet.email;
        outlet["gstin"] = outlet.gstIn;
        outlet["outletName"]=outlet.outletName
    
        // Extract required data from dataValues
        const { 
            customerName, 
            customerMobileNumber, 
            reg_no, 
            reason, 
            remarks, 
            gateInTime ,
            createdAt,
            documentName,
            document_no
        } = data?.dataValues || {};

        const { 
            modelName
        } = data?.dataValues?.models?.dataValues || {};

        // Format gateInTime
        const formattedGateInTime = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(gateInTime));

        const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(createdAt));

        
        const formattedDate = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(createdAt));

        // Populate casualGatePass
        const casualGatePass = {
            customerName,
            customerMobileNumber,
            reg_no,
            reason,
            remarks,
            gateInTime: formattedGateInTime, 
            createdAt: formattedCreatedAt, 
            date:formattedDate,
            documentName,
            document_no: document_no,
            modelName
        };

        resObj["outlet"] = outlet;
        resObj["casualGatePass"] = casualGatePass;

        return resObj;
    } catch (err) {
        logger.error("Casual Gate Pass service getGatePassData", err);
        next(err); // Pass the error to the next middleware
    }
};

const generateDocNumber = async (documentType, outletCode) => {
    let seqNo = 0;
    const currentDate = new Date();
    let year;
    if(currentDate.getMonth() >= 3) {
        year = currentDate.getFullYear() + 1;
    }
    else {
        year = currentDate.getFullYear();
    }
    const currentYear = year.toString().slice(-2);
    const recentOutPass =
      await casualGatePassDao.getRecentDocNumber("CGP", outletCode, currentYear);
    if (recentOutPass) {
      const lastNumber = recentOutPass.document_no.split("-")[2];
      seqNo = parseInt(lastNumber, 10) + 1;
    } else {
      seqNo = 1;
    }
  
    const formattedSequenceNumber = seqNo.toString().padStart(6, "0");
  
    return `CGP-${outletCode}${currentYear}-${formattedSequenceNumber}`;
  };
  
  const CasualGatePassReport = async (reqData, user) => {
    try {
        const data = await casualGatePassDao.CasualGatePassReport(reqData, user);
        return data;
    } catch (err) {
        logger.error('Casual Gate Pass service CasualGatePassReport', err);
        next(err);
    }
};
const casualGatePassService = {
    createCasualGatePass, downloadCasualGatePass, getTechnician, listCasualGatePass, CasualGatePassReport };

export default casualGatePassService;
