import VendorDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';

const addVendor = async (vendor, user,t=null) => {
  let data = {};
  let recentActivityData = {};
  try {
    data = await VendorDao.addVendor(vendor, user.id,t);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Vendor';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = vendor.vendorName + ' Vendor is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Vendor service addVendor Error:', err);
    // next(err);
    throw err
  }
  return data;
};

const addVendorCompanyMap = async (companyId, vendorId,t=null) => {
  try {
    return await VendorDao.addVendorCompanyMap(companyId, vendorId,t);
  } catch (err) {
    logger.error('Vendor service addVendorCompanyMap Error:', err);
    next(err);
  }
};

const addVendorItemGroupMap = async (itemGroupId, vendorId,t=null) => {
  try {
    return await VendorDao.addVendorItemGroupMap(itemGroupId, vendorId,t);
  } catch (err) {
    logger.error('Vendor service addVendorItemGroupMap Error:', err);
    next(err);
  }
};

const findByCode = async (vendorCode) => {
  try {
    return await VendorDao.findByCode(vendorCode);
  } catch (err) {
    logger.error('Vendor service findByCode Error:', err);
    next(err);
  }
};

const findByMobileNo = async (mobileNumber) => {
  try {
    return await VendorDao.findByMobileNo(mobileNumber);
  } catch (err) {
    logger.error('Vendor service findByMobileNo Error:', err);
    next(err);
  }
};

const ContactPersonMobileNo = async (contactPersonMobileNo) => {
  try {
    return await VendorDao.ContactPersonMobileNo(contactPersonMobileNo);
  } catch (err) {
    logger.error('Vendor service ContactPersonMobileNo Error:', err);
    next(err);
  }
};

const getAllVendors = async (companyId, roleId) => {
  try {
    const data = await VendorDao.getAllVendors(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('Vendor service getAllVendors Error:', err);
    next(err);
  }
};

const getAllVendorsByCompany = async (companyId, roleId) => {
  try {
    const data = await VendorDao.getAllVendorsByCompany(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('Vendor service getAllVendorsByCompany  Error:', err);
    next(err);
  }
};

const getOneVendor = async (id) => {
  try {
    const vendor = await VendorDao.getOneVendor(id);
    return vendor;
  } catch (err) {
    logger.error('Vendor service getOneVendor Error:', err);
    next(err);
  }
};

const updateVendor = async (vendor, user, vendorExists) => {
  let message = '';
  let recentActivityData = {};
  let data = {};
  try {
    recentActivityData['activity_type'] = 'Update';
    recentActivityData['menu_name'] = 'Vendor';
    recentActivityData['createdBy'] = user.id;
    recentActivityData['username'] = user.employeeCode;
    if (vendorExists.vendorCode != vendor.vendorCode) {
      message =
        message +
        ' vendorCode changed from ' +
        vendorExists.vendorCode +
        ' to ' +
        vendor.vendorCode +
        ' ,';
    }
    if (vendorExists.status != vendor.status) {
      message =
        message +
        ' status changed from ' +
        vendorExists.status +
        ' to ' +
        vendor.status +
        ' ,';
    }
    if (vendorExists.vendorName != vendor.vendorName) {
      message =
        message +
        ' vendorName changed from ' +
        vendorExists.vendorName +
        ' to ' +
        vendor.vendorName +
        ' ,';
    }
    if (vendorExists.gstin != vendor.gstin) {
      message =
        message +
        ' gstin changed from ' +
        vendorExists.gstin +
        ' to ' +
        vendor.gstin +
        ' ,';
    }
    if (vendorExists.panNumber != vendor.panNumber) {
      message =
        message +
        ' panNumber changed from ' +
        vendorExists.panNumber +
        ' to ' +
        vendor.panNumber +
        ' ,';
    }
    if (vendorExists.address1 != vendor.address1) {
      message =
        message +
        ' address1 changed from ' +
        vendorExists.address1 +
        ' to ' +
        vendor.address1 +
        ' ,';
    }
    if (vendorExists.address2 != vendor.address2) {
      message =
        message +
        ' address2 changed from ' +
        vendorExists.address2 +
        ' to ' +
        vendor.address2 +
        ' ,';
    }
    if (vendorExists.state != vendor.state) {
      message =
        message +
        ' state changed from ' +
        vendorExists.state +
        ' to ' +
        vendor.state +
        ' ,';
    }
    if (vendorExists.city != vendor.city) {
      message =
        message +
        ' city changed from ' +
        vendorExists.city +
        ' to ' +
        vendor.city +
        ' ,';
    }
    if (vendorExists.areaName != vendor.areaName) {
      message =
        message +
        ' areaName changed from ' +
        vendorExists.areaName +
        ' to ' +
        vendor.areaName +
        ' ,';
    }
    if (vendorExists.pincode != vendor.pincode) {
      message =
        message +
        ' pincode changed from ' +
        vendorExists.pincode +
        ' to ' +
        vendor.pincode +
        ' ,';
    }
    if (vendorExists.mobileNumber != vendor.mobileNumber) {
      message =
        message +
        ' mobileNumber changed from ' +
        vendorExists.mobileNumber +
        ' to ' +
        vendor.mobileNumber +
        ' ,';
    }
    if (vendorExists.contactPerson != vendor.contactPerson) {
      message =
        message +
        ' contactPerson changed from ' +
        vendorExists.contactPerson +
        ' to ' +
        vendor.contactPerson +
        ' ,';
    }
    if (vendorExists.contactPersonMobileNo != vendor.contactPersonMobileNo) {
      message =
        message +
        ' contactPersonMobileNo changed from ' +
        vendorExists.contactPersonMobileNo +
        ' to ' +
        vendor.contactPersonMobileNo +
        ' ,';
    }
    if (vendorExists.vendorType != vendor.vendorType) {
      message =
        message +
        ' vendorType changed from ' +
        vendorExists.vendorType +
        ' to ' +
        vendor.vendorType +
        ' ,';
    }
    if (vendorExists.marginPercentage != vendor.marginPercentage) {
      message =
        message +
        ' marginPercentage changed from ' +
        vendorExists.marginPercentage +
        ' to ' +
        vendor.marginPercentage +
        ' ,';
    }
    message = message.slice(0, -1);
    data = await VendorDao.updateVendor(vendor, user.id);
    if (message && data) {
      recentActivityData['message'] = message;
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
    }
  } catch (err) {
    logger.error('Vendor service updateVendor Error:', err);
    next(err);
  }
  return data;
};

const removeVendorCompanyMap = async (id) => {
  try {
    return await VendorDao.removeVendorCompanyMap(id);
  } catch (err) {
    logger.error('Vendor service removeVendorCompanyMap Error:', err);
    next(err);
  }
};

const removeVendorItemGroupMap = async (id) => {
  try {
    return await VendorDao.removeVendorItemGroupMap(id);
  } catch (err) {
    logger.error('Vendor service removeVendorItemGroupMap Error:', err);
    next(err);
  }
};

const createVendorCompanyMap = async (companyId, vendorId) => {
  try {
    return await VendorDao.createVendorCompanyMap(companyId, vendorId);
  } catch (err) {
    logger.error('Vendor service createVendorCompanyMap Error:', err);
    next(err);
  }
};

const createVendorItemGroupMap = async (itemGroupId, vendorId) => {
  try {
    return await VendorDao.createVendorItemGroupMap(itemGroupId, vendorId);
  } catch (err) {
    logger.error('Vendor service createVendorItemGroupMap Error:', err);
    next(err);
  }
};

const getPincodeData = async (reqBody) => { 
  try {
    const data = await VendorDao.getPincodeData(reqBody);
    return data;
  } catch (err) {
    logger.error('Vendor Service getPincodeData Error:', err);
    next(err);
  }
};

const searchAreaName = async (reqBody) => {
  try {
    const data = await VendorDao.searchAreaName(reqBody);
    return data;
  } catch (err) {
    logger.error('Vendor Service searchAreaName Error:', err);
    throw err;
  }
};

const listVendors = async (reqBody) => {
  try {
    const data = await VendorDao.listVendors(reqBody);
    return data;
  } catch (err) {
    logger.error('Vendor Service listVendors Error:', err);
    next(err);
  }
};

const listVendorsForPo = async (reqBody, user) => {
  try {
    const data = await VendorDao.listVendorsForPo(reqBody,user);
    return data;
  } catch (err) {
    logger.error('Vendor Service listVendorsForPo Error:', err);
    next(err);
  }
};
const VendorService = {
  addVendor,
  addVendorCompanyMap,
  addVendorItemGroupMap,
  findByCode,
  findByMobileNo,
  ContactPersonMobileNo,
  getAllVendors,
  getOneVendor,
  updateVendor,
  removeVendorCompanyMap,
  createVendorCompanyMap,
  removeVendorItemGroupMap,
  createVendorItemGroupMap,
  getPincodeData,
  searchAreaName,
  listVendors,
  listVendorsForPo,
  getAllVendorsByCompany
};

export default VendorService;
