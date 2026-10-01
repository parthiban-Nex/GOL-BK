import OutletDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import db from '../index.js';
import moment from "moment";

const Outlet = db.outlets;

const addOutlet = async (outlet, user) => {
  let result = '';
  let recentActivityData = {};
  let data = {};
  try {
    data = await OutletDao.addOutlet(outlet, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Outlet';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = outlet.outletCode + ' Outlet is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Outlet Service addOutlet Error:', err);
    next(err);
  }
  return result;
};

const addReturnable = async (returnable, user,outlet) => {
  let result = '';
  let recentActivityData = {};
  let data = {};
  try {
    data = await OutletDao.addReturnable(returnable, user,outlet);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Returnable/Non Returnable';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =`vehicle number : ${returnable.vehicleNumber}, ${returnable.returnType} is created `;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Returnable Service addReturnable Error:', err);
    next(err);
  }
  return result;
};

const findByCode = async (outletCode) => {
  try {
    return await OutletDao.findByCode(outletCode);
  } catch (err) {
    logger.error('Outlet Service findByCode Error:', err);
    next(err);
  }
};

const findByEmail = async (email) => {
  try {
    return await OutletDao.findByEmail(email);
  } catch (err) {
    logger.error('Outlet Service findByEmail Error:', err);
    next(err);
  }
};

const findByPhone = async (phoneNumber) => {
  try {
    return await OutletDao.findByPhone(phoneNumber);
  } catch (err) {
    logger.error('Outlet Service findByPhone Error:', err);
    next(err);
  }
};

const getOutlet = async (id) => {
  try {
    const outlet = await OutletDao.getOutlet(id);
    return outlet;
  } catch (err) {
    logger.error('Outlet Service getOutlet Error:', err);
    next(err);
  }
};

const updateOutlet = async (id, outlet, user) => {
  let result = '';
  let recentActivityData = {};
  let message = '';
  try {
    const OutletExists = await OutletDao.getOutlet(id);
    if (OutletExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Outlet';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      if (OutletExists.outletCode != outlet.outletCode) {
        message =
          message +
          ' outletCode changed from ' +
          OutletExists.outletCode +
          ' to ' +
          outlet.outletCode +
          ' ,';
      }
      if (OutletExists.outletName != outlet.outletName) {
        message =
          message +
          ' outletName changed from ' +
          OutletExists.outletName +
          ' to ' +
          outlet.outletName +
          ' ,';
      }
      if (OutletExists.oracleSiteCode != outlet.oracleSiteCode) {
        message =
          message +
          ' oracleSiteCode changed from ' +
          OutletExists.oracleSiteCode +
          ' to ' +
          outlet.oracleSiteCode +
          ' ,';
      }
      if (
        OutletExists.oracleCashCustomerCode != outlet.oracleCashCustomerCode
      ) {
        message =
          message +
          ' oracleCashCustomerCode changed from ' +
          OutletExists.oracleCashCustomerCode +
          ' to ' +
          outlet.oracleCashCustomerCode +
          ' ,';
      }
      if (OutletExists.oracleLocation != outlet.oracleLocation) {
        message =
          message +
          ' oracleLocation changed from ' +
          OutletExists.oracleLocation +
          ' to ' +
          outlet.oracleLocation +
          ' ,';
      }
      if (OutletExists.gstIn != outlet.gstIn) {
        message =
          message +
          ' gstIn changed from ' +
          OutletExists.gstIn +
          ' to ' +
          outlet.gstIn +
          ' ,';
      }
      if (OutletExists.outletSegment != outlet.outletSegment) {
        message =
          message +
          ' outletSegment changed from ' +
          OutletExists.outletSegment +
          ' to ' +
          outlet.outletSegment +
          ' ,';
      }
      if (OutletExists.email != outlet.email) {
        message =
          message +
          ' email changed from ' +
          OutletExists.email +
          ' to ' +
          outlet.email +
          ' ,';
      }
      if (OutletExists.phoneNumber != outlet.phoneNumber) {
        message =
          message +
          ' phoneNumber changed from ' +
          OutletExists.phoneNumber +
          ' to ' +
          outlet.phoneNumber +
          ' ,';
      }
      if (OutletExists.address1 != outlet.address1) {
        message =
          message +
          ' address1 changed from ' +
          OutletExists.address1 +
          ' to ' +
          outlet.address1 +
          ' ,';
      }
      if (OutletExists.address2 != outlet.address2) {
        message =
          message +
          ' address2 changed from ' +
          OutletExists.address2 +
          ' to ' +
          outlet.address2 +
          ' ,';
      }
      if (OutletExists.pincode != outlet.pincode) {
        message =
          message +
          ' pincode changed from ' +
          OutletExists.pincode +
          ' to ' +
          outlet.pincode +
          ' ,';
      }
      if (OutletExists.state != outlet.state) {
        message =
          message +
          ' state changed from ' +
          OutletExists.state +
          ' to ' +
          outlet.state +
          ' ,';
      }
      if (OutletExists.city != outlet.city) {
        message =
          message +
          ' city changed from ' +
          OutletExists.city +
          ' to ' +
          outlet.city +
          ' ,';
      }
      if (OutletExists.contactPerson != outlet.contactPerson) {
        message =
          message +
          ' contactPerson changed from ' +
          OutletExists.contactPerson +
          ' to ' +
          outlet.contactPerson +
          ' ,';
      }
      if (OutletExists.contactEmail != outlet.contactEmail) {
        message =
          message +
          ' contactEmail changed from ' +
          OutletExists.contactEmail +
          ' to ' +
          outlet.contactEmail +
          ' ,';
      }
      if (OutletExists.contactPhoneNumber != outlet.contactPhoneNumber) {
        message =
          message +
          ' contactPhoneNumber changed from ' +
          OutletExists.contactPhoneNumber +
          ' to ' +
          outlet.contactPhoneNumber +
          ' ,';
      }
      if (OutletExists.latitude != outlet.latitude) {
        message =
          message +
          ' latitude changed from ' +
          OutletExists.latitude +
          ' to ' +
          outlet.latitude +
          ' ,';
      }
      if (OutletExists.longitude != outlet.longitude) {
        message =
          message +
          ' longitude changed from ' +
          OutletExists.longitude +
          ' to ' +
          outlet.longitude +
          ' ,';
      }
      if (OutletExists.bridgeId != outlet.bridgeId) {
        message =
          message +
          ' bridgeId changed from ' +
          OutletExists.bridgeId +
          ' to ' +
          outlet.bridgeId +
          ' ,';
      }
      if (OutletExists.googleRatingLink != outlet.googleRatingLink) {
        message =
          message +
          ' googleRatingLink changed from ' +
          OutletExists.googleRatingLink +
          ' to ' +
          outlet.googleRatingLink +
          ' ,';
      }
      if (OutletExists.bankName != outlet.bankName) {
        message =
          message +
          ' bankName changed from ' +
          OutletExists.bankName +
          ' to ' +
          outlet.bankName +
          ' ,';
      }
      if (OutletExists.bankAccount != outlet.bankAccount) {
        message =
          message +
          ' bankAccount changed from ' +
          OutletExists.bankAccount +
          ' to ' +
          outlet.bankAccount +
          ' ,';
      }
      if (OutletExists.typeofAccount != outlet.typeofAccount) {
        message =
          message +
          ' typeofAccount changed from ' +
          OutletExists.typeofAccount +
          ' to ' +
          outlet.typeofAccount +
          ' ,';
      }
      if (OutletExists.branch != outlet.branch) {
        message =
          message +
          ' branch changed from ' +
          OutletExists.branch +
          ' to ' +
          outlet.branch +
          ' ,';
      }
      if (OutletExists.micrCode != outlet.micrCode) {
        message =
          message +
          ' micrCode changed from ' +
          OutletExists.micrCode +
          ' to ' +
          outlet.micrCode +
          ' ,';
      }
      if (OutletExists.ifscCode != outlet.ifscCode) {
        message =
          message +
          ' ifscCode changed from ' +
          OutletExists.ifscCode +
          ' to ' +
          outlet.ifscCode +
          ' ,';
      }
      if (OutletExists.status != outlet.status) {
        message =
          message +
          ' status changed from ' +
          OutletExists.status +
          ' to ' +
          outlet.status +
          ' ,';
      }
      message = message.slice(0, -1);
      let data = await OutletDao.updateOutlet(id, outlet, user.id);
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        result = 'success';
      }
    }
  } catch (err) {
    result = 'failed';
    logger.error('Outlet Service updateOutlet Error:', err);
    next(err);
  }
  return result;
};

const deleteOutlet = async (id) => {
  try {
    const data = await OutletDao.deleteOutlet(id);
    return data;
  } catch (err) {
    logger.error('Outlet Service deleteOutlet Error:', err);
    next(err);
  }
};

const listOutlets = async (reqBody) => {
  try {
    const { totalItems, data } = await OutletDao.listOutlets(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Outlet Service listOutlets Error:', err);
    next(err);
  }
};

const listReturnable = async (reqBody) => {
  try {
    const { totalItems, data } = await OutletDao.listReturnable(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Returnable Service listReturnable Error:', err);
    next(err);
  }
};

const returnablePDF = async (id, outlet,user) => {

    const resObj = {};
    const returnable = {};
    const outletObj ={};
    const returnableParts = [];
    try {
        const data = await OutletDao.returnablePDF(id);

        outletObj['name'] = outlet.outletName;
        outletObj['address1'] = outlet.address1;
        outletObj['address2'] = outlet.address2;
        outletObj['city'] = outlet.city;
        outletObj['state'] = outlet.state;
        outletObj['pincode'] = outlet.pincode;
        outletObj['phone'] = outlet.phoneNumber;
        outletObj['mobile'] = outlet.phoneNumber;
        outletObj['email'] = outlet.email;
        outletObj['dealerGstin'] = outlet.gstIn;
        outletObj["outletName"] = outlet.outletName
        outletObj['createdBy'] = user.employeeName;


        const pdfData = data.dataValues;
        let formattedDate = null;
        if (pdfData.created_at) {
            formattedDate = moment(
                pdfData.created_at,
                ["DD-MM-YYYY hh:mm a", "DD-MM-YYYY HH:mm"]
            ).format("YYYY-MM-DD HH:mm:ss");
        } else {
            formattedDate = moment().format("YYYY-MM-DD HH:mm:ss"); 
        }

        returnable['return_type'] = pdfData.return_type;
        returnable['ret_number'] = pdfData.ret_number;
        returnable['doc_date'] = formattedDate;
        returnable['cus_name'] = pdfData.customer_name;
        returnable['reg_num'] = pdfData.vehicle_num;
        returnable['makeName'] = pdfData.make_name;
        returnable['modelName'] = pdfData.model_name;
       returnable['vendorName'] = pdfData.vendor_name;
       returnable['remarks'] = pdfData.remarks;
         returnable['reasons'] = pdfData.reason;
      //  returnable['modelName'] = pdfData.model_name;
      //  returnable['modelName'] = pdfData.model_name

        let sno = 1;

        pdfData.parts.forEach((partsvalue) => {
            const partsArr = {
                sno: sno++,
                partsDescription: partsvalue.description,
                quantity: partsvalue.quantity
            }
            returnableParts.push(partsArr);
        })


        resObj['returnable'] = returnable;
        resObj['partsValue'] = returnableParts;
        resObj['outletData']= outletObj;
  

        return resObj;
    } catch (err) {
        logger.error('Returnable service getReturnable', err);
    }
}



const getAllOutlets = async () => {
  try {
    const data = await OutletDao.getAllOutlets();
    return data;
  } catch (err) {
    logger.error('Outlet Service getAllOutlets Error:', err);
    next(err);
  }
};

const findById = async (id) => {
  return await Outlet.findOne({ where: { id: id } });
};

const listOutletsandwarehouse = async (reqBody,outletid) => {
  try {
    const { data } = await OutletDao.listOutletsandwarehouse(reqBody,outletid);
    return data;
  } catch (err) {
    logger.error('Outlet Service listOutlets Error:', err);
    next(err);
  }
};

const listOutletsforstocktransferreq = async (reqBody,outletid) => {
  try {
    const { data } = await OutletDao.listOutletsforstocktransferreq(reqBody,outletid);
    return data;
  } catch (err) {
    logger.error('Outlet Service listOutlets Error:', err);
    next(err);
  }
};

const OutletService = {
  addOutlet,
  addReturnable,
  findByCode,
  findByEmail,
  findByPhone,
  getOutlet,
  updateOutlet,
  deleteOutlet,
  listOutlets,
  getAllOutlets,
  findById,
  listReturnable,
  returnablePDF,
  listOutletsandwarehouse,
  listOutletsforstocktransferreq,
};

export default OutletService;
