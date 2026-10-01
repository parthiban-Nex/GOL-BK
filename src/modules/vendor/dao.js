import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const Vendor = db.vendors;
const VendorCompanyMap = db.vendorcompanymaps;
const VendorItemGroupMap = db.vendoritemgroupmaps;
const Pincode = db.pincodes;

const addVendor = async (vendor, userId,t=null) => {
  try {
    return await Vendor.create({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      gstin: vendor.gstin,
      panNumber: vendor.panNumber,
      address1: vendor.address1,
      address2: vendor.address2,
      state: vendor.state,
      city: vendor.city,
      areaName: vendor.areaName,
      pincode: vendor.pincode,
      mobileNumber: vendor.mobileNumber,
      contactPerson: vendor.contactPerson,
      contactPersonMobileNo: vendor.contactPersonMobileNo,
      vendorType: vendor.vendorType,
      marginPercentage: vendor.marginPercentage,
      vendor_site_code: vendor.vendor_site_code,
      oracle_vendor_number: vendor.oracle_vendor_number,
      isWarehouse: vendor.isWarehouse,
      status: vendor.status,
      createdBy: userId,
    },t ? { transaction: t } : {});
  } catch (err) {
    logger.error('Vendor dao addVendor Error:', err);
    throw err
    // next(err);
  }
};

const addVendorCompanyMap = async (companyId, vendorId,t=null) => {
  try {
    // return companyId.forEach((value) => {
    //   const reqObj = {
    //     companyId: value.id,
    //     vendorId: vendorId,
    //     name: value.name,
    //   };
    //   VendorCompanyMap.create(reqObj,t ? { transaction: t } : {}).then((res) => {
    //     return res;
    //   });
    // });
    return await Promise.all(companyId.map((value) => {
      const reqObj = {
        companyId: value.id,
        vendorId: vendorId,
        name: value.name,
      };
      return VendorCompanyMap.create(reqObj, t ? { transaction: t } : {});
    }));
  } catch (err) {
    logger.error('Vendor dao addVendorCompanyMap Error:', err);
    throw err;
  }
};

const addVendorItemGroupMap = async (itemGroupId, vendorId,t=null) => {
  try {
    // return itemGroupId.forEach((value) => {
    //   const reqObj = {
    //     itemGroupId: value.id,
    //     vendorId: vendorId,
    //     itemGroupCode: value.itemGroupCode,
    //   };
    //   VendorItemGroupMap.create(reqObj,t ? { transaction: t } : {}).then((res) => {
    //     return res;
    //   });
    // });
    return await Promise.all(itemGroupId.map((value) => {
      const reqObj = {
        itemGroupId: value.id,
        vendorId: vendorId,
        itemGroupCode: value.itemGroupCode,
      };
      return VendorItemGroupMap.create(reqObj, t ? { transaction: t } : {});
    }));
  } catch (err) {
    logger.error('Vendor dao addVendorItemGroupMap Error:', err);
    throw err;
  }
};

const findByCode = async (vendorCode) => {
  try {
    return await Vendor.findOne({ where: { vendorCode: vendorCode } });
  } catch (err) {
    logger.error('Vendor dao findByCode Error:', err);
    next(err);
  }
};

const findByMobileNo = async (mobileNumber) => {
  try {
    return await Vendor.findOne({ where: { mobileNumber: mobileNumber } });
  } catch (err) {
    logger.error('Vendor dao findByMobileNo Error:', err);
    next(err);
  }
};

const ContactPersonMobileNo = async (contactPersonMobileNo) => {
  try {
    return await Vendor.findOne({
      where: { contactPersonMobileNo: contactPersonMobileNo },
    });
  } catch (err) {
    logger.error('Vendor dao ContactPersonMobileNo Error:', err);
    next(err);
  }
};

const getAllVendorsOld = async () => {
  try {
    const data = await Vendor.findAll();
    return data;
  } catch (err) {
    logger.error('Vendor dao getAllVendors Error:', err);
    next(err);
  }
};

const getAllVendors = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
    };

    // if (roleId !== 1) {
    //   queryOptions.include = [
    //     {
    //       model: VendorCompanyMap,
    //       as: 'vendorcompanymap',
    //       where: { companyId: companyId },
    //       attributes: [],
    //     },
    //   ];
    // }

    const data = await Vendor.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Vendor dao getAllVendors Error:', err);
    next(err);
  }
};

const getAllVendorsByCompany = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
    };

      queryOptions.include = [
        {
          model: VendorCompanyMap,
          as: 'vendorcompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];

    const data = await Vendor.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Vendor dao getAllVendorsByCompany Error:', err);
    next(err);
  }
};

const getOneVendor = async (id) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: id },
      include: [
        { model: VendorCompanyMap, as: 'vendorcompanymap' },
        { model: VendorItemGroupMap, as: 'vendoritemgroupmap' },
      ],
    });
    if (!vendor) {
      throw new notFoundException();
    }
    return vendor;
  } catch (err) {
    logger.error('Vendor dao getOneVendor Error:', err);
    next(err);
  }
};

const updateVendor = async (vendor, userId) => {
  try {
    return await Vendor.update(
      {
        vendorCode: vendor.vendorCode,
        vendorName: vendor.vendorName,
        gstin: vendor.gstin,
        panNumber: vendor.panNumber,
        address1: vendor.address1,
        address2: vendor.address2,
        state: vendor.state,
        city: vendor.city,
        pincode: vendor.pincode,
        mobileNumber: vendor.mobileNumber,
        contactPerson: vendor.contactPerson,
        contactPersonMobileNo: vendor.contactPersonMobileNo,
        vendorType: vendor.vendorType,
        marginPercentage: vendor.marginPercentage,
        status: vendor.status,
        updatedBy: userId,
        areaName: vendor.areaName,
      },
      { where: { id: vendor.id } }
    );
  } catch (err) {
    logger.error('Vendor dao updateVendor Error:', err);
    next(err);
  }
};

const removeVendorCompanyMap = async (id) => {
  try {
    return await VendorCompanyMap.destroy({ where: { vendorId: id } });
  } catch (err) {
    logger.error('Vendor dao removeVendorCompanyMap Error:', err);
    next(err);
  }
};

const removeVendorItemGroupMap = async (id) => {
  try {
    return await VendorItemGroupMap.destroy({ where: { vendorId: id } });
  } catch (err) {
    logger.error('Vendor dao removeVendorCompanyMap Error:', err);
    next(err);
  }
};

const createVendorCompanyMap = async (companyId, vendorId) => {
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value,
        vendorId: vendorId,
      };
      VendorCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('Vendor dao createVendorCompanyMap Error:', err);
    next(err);
  }
};

const createVendorItemGroupMap = async (itemGroupId, vendorId) => {
  try {
    return itemGroupId.forEach((value) => {
      const reqObj = {
        itemGroupId: value,
        vendorId: vendorId,
      };
      VendorItemGroupMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('Vendor dao createVendorItemGroupMap Error:', err);
    next(err);
  }
};

const listVendors = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { vendorCode: { [Op.like]: `%${searchKey}%` } },
            { vendorName: { [Op.like]: `%${searchKey}%` } },
            { mobileNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await Vendor.count({
      where: searchCondition,
    });
    const rows = await Vendor.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'vendorCode',
        'vendorName',
        'gstin',
        'panNumber',
        'address1',
        'address2',
        'state',
        'city',
        'areaName',
        'pincode',
        'mobileNumber',
        'contactPerson',
        'contactPersonMobileNo',
        'vendorType',
        'marginPercentage',
        'status',
      ],
      include: [
        { model: VendorCompanyMap, as: 'vendorcompanymap' },
        { model: VendorItemGroupMap, as: 'vendoritemgroupmap' },
      ],
    });
    console.log('count' + count);
    const resultList = [];
    rows.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['vendorCode'] = element.vendorCode;
      resObj['vendorName'] = element.vendorName;
      resObj['gstin'] = element.gstin;
      resObj['panNumber'] = element.panNumber;
      resObj['address1'] = element.address1;
      resObj['address2'] = element.address2;
      resObj['state'] = element.state;
      resObj['city'] = element.city;
      resObj['areaName'] = element.areaName;
      resObj['pincode'] = element.pincode;
      resObj['mobileNumber'] = element.mobileNumber;
      resObj['contactPerson'] = element.contactPerson;
      resObj['contactPersonMobileNo'] = element.contactPersonMobileNo;
      resObj['vendorType'] = element.vendorType;
      resObj['marginPercentage'] = element.marginPercentage;
      resObj['status'] = element.status;

      const companyMaps = element.vendorcompanymap;
      const itemGropMaps = element.vendoritemgroupmap;
      let companyname = '';
      companyMaps.forEach(async (companyId) => {
        companyname = companyname + companyId.name + ',';
      });
      resObj['companies'] = companyname.slice(0, -1);
      let itemGroups = '';
      itemGropMaps.forEach(async (itemGroupId) => {
        itemGroups = itemGroups + itemGroupId.itemGroupCode + ',';
        resObj['itemgroupId'] = itemGroups.slice(0, -1);
      });
      resultList.push(resObj);
    });
    return {
      totalItems: count,
      data: resultList,
    };
  } catch (err) {
    logger.error('SourceType dao listSourceTypes Error:', err);
    next(err);
  }
};

const getPincodeData = async (reqBody) => {
  try {
    const pinCode = reqBody.pinCode;
    const data = await Pincode.findAll({
      attributes: ['id', 'Pincode', 'OfficeName', 'District', 'StateName'],
      where: {
        Pincode: pinCode,
      },
    });

    if (data.length === 0) {
      return {};
    }
    const result = {
      pinCode: data[0].Pincode,
      state: data[0].StateName,
      city: data[0].District,
      areaNames: data.map((entry) => ({ area: entry.OfficeName })),
    };
    return result;
  } catch (err) {
    logger.error('SourceType dao getPincodeData Error:', err);
    next(err);
  }
};

const searchAreaName = async (reqBody) => {
  try {
    const searchKey = reqBody.searchKey;
    const data = await Pincode.findAll({
      attributes: ['id', 'OfficeName', 'Pincode'],
      where: {
        OfficeName: {
          [Op.like]: `%${searchKey}%`,
        },
      },
      limit: 20,
    });
    return data;
  } catch (err) {
    logger.error('Vendor dao searchAreaName Error:', err);
    throw err;
  }
};

const checkUnique = async (vendorCode, id) => {
  let data = '';
  try {
    data = await Vendor.findOne({
      where: {
        vendorCode: vendorCode,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const checkUniqueForMobile = async (mobileNumber, id) => {
  let data = '';
  try {
    data = await Vendor.findOne({
      where: {
        mobileNumber: mobileNumber,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const checkUniqueForContact = async (contactPersonMobileNo, id) => {
  let data = '';
  try {
    data = await Vendor.findOne({
      where: {
        contactPersonMobileNo: contactPersonMobileNo,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const listVendorsForPo = async (reqBody, user) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { vendorCode: { [Op.like]: `%${searchKey}%` } },
            { vendorName: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
      
    const rows = await Vendor.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'vendorCode',
        'vendorName',
        'gstin',
        'panNumber',
        'address1',
        'address2',
        'state',
        'city',
        'areaName',
        'pincode',
        'mobileNumber',
        'contactPerson',
        'contactPersonMobileNo',
        'vendorType',
        'marginPercentage',
        'status',
        'vendor_site_code',
        'oracle_vendor_number',
      ],
       include: [
        { model: VendorCompanyMap, as: 'vendorcompanymap' },
        { model: VendorItemGroupMap, as: 'vendoritemgroupmap' ,required:false },
      ],
    });
    const resultList = [];
    rows.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['vendorCode'] = element.vendorCode;
      resObj['vendorName'] = element.vendorName;
      resObj['gstin'] = element.gstin;
      resObj['panNumber'] = element.panNumber;
      resObj['address1'] = element.address1;
      resObj['address2'] = element.address2;
      resObj['state'] = element.state;
      resObj['city'] = element.city;
      resObj['areaName'] = element.areaName;
      resObj['pincode'] = element.pincode;
      resObj['mobileNumber'] = element.mobileNumber;
      resObj['contactPerson'] = element.contactPerson;
      resObj['contactPersonMobileNo'] = element.contactPersonMobileNo;
      resObj['vendorType'] = element.vendorType;
      resObj['marginPercentage'] = element.marginPercentage;
      resObj['status'] = element.status;
      resObj['vendor_site_code'] = element.vendor_site_code;
      resObj['oracle_vendor_number'] = element.oracle_vendor_number;
      resObj['companyId'] =user.outlet.companyId;
           
      console.log('companyId',user.outlet.companyId);
      console.log('vendorcompanymap',element.vendorcompanymap);
      const itemGropMaps = element.vendoritemgroupmap || [];
        resObj['itemGroupCodes'] =  itemGropMaps.map( (itemGroup) =>itemGroup.itemGroupCode );

     const companyMaps = element.vendorcompanymap || [];
      const companyIds = companyMaps.map((company) => company.companyId);
      if(companyIds.includes(user.outlet.companyId)){
      resultList.push(resObj);
      }
      
    });
    return {
      data: resultList,
    };
  } catch (err) {
    logger.error('SourceType dao listSourceTypes Error:', err);
    next(err);
  }
};

const dao = {
  addVendor,
  addVendorCompanyMap,
  addVendorItemGroupMap,
  listVendors,
  getPincodeData,
  searchAreaName,
  findByCode,
  findByMobileNo,
  ContactPersonMobileNo,
  getAllVendors,
  getOneVendor,
  updateVendor,
  removeVendorCompanyMap,
  removeVendorItemGroupMap,
  createVendorCompanyMap,
  createVendorItemGroupMap,
  checkUnique,
  checkUniqueForMobile,
  checkUniqueForContact,
  listVendorsForPo,
  getAllVendorsByCompany
};

export default dao;
