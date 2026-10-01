import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';
const Sequelize = db.sequelize;

const Outlet = db.outlets;
const Vendor=db.vendors
const Returable =db.returable;
const ReturablePart = db.returablePart;

const addOutlet = async (outlet, userId) => {
  let data = {};
  try {
    data = await Outlet.create({
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      companyId: outlet.companyId.id,
      gstIn: outlet.gstIn,
      email: outlet.email,
      phoneNumber: outlet.phoneNumber,
      address1: outlet.address1,
      address2: outlet.address2,
      pincode: outlet.pincode,
      state: outlet.state,
      city: outlet.city,
      contactPerson: outlet.contactPerson,
      contactEmail: outlet.contactEmail,
      contactPhoneNumber: outlet.contactPhoneNumber,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      bridgeId: outlet.bridgeId,
      googleRatingLink: outlet.googleRatingLink,
      bankName: outlet.bankName,
      bankAccount: outlet.bankAccount,
      typeofAccount: outlet.typeofAccount,
      branch: outlet.branch,
      micrCode: outlet.micrCode,
      ifscCode: outlet.ifscCode,
      status: outlet.status,
      oracleSiteCode: outlet.oracleSiteCode,
      oracleCashCustomerCode: outlet.oracleCashCustomerCode,
      oracleLocation: outlet.oracleLocation,
      outletSegment: outlet.outletSegment,
      companyName: outlet.companyId.name,
      maxPartDiscountPercentage: outlet.maxPartDiscountPercentage,
      maxLabourDiscountPercentage: outlet.maxLabourDiscountPercentage,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Outlet dao addOutlet Error:', err);
    next(err);
  }
  return data;
};

const addReturnable = async (payload, user,outlet) => {
  const t = await Sequelize.transaction();
const returnableFormattedNum = await generateReturnableNumber(payload.returnType,outlet.outletCode)
  
  try { 
    const returnable = await Returable.create(
      {
        outletId: user.outlet.id,
        return_type: payload.returnType,
        ret_number: returnableFormattedNum?returnableFormattedNum:'errorCreation',
        vehicle_id: payload.vehicleId,
        vehicle_num: payload.vehicleNumber,
        make_id: payload.makeId,
        make_name: payload.makeName,
        model_id: payload.modelId,
        model_name: payload.modelName,
        type_category: payload.typeCategory,
        customer_name: payload.customerName,
        vendor_id: payload.vendorId,
        vendor_name: payload.vendorName,
        reason: payload.reason,
        remarks: payload.remarks,
        created_by: user.id,
      },
      { transaction: t }
    );

     // Save returnable parts (array)
    if (payload.returnableParts && payload.returnableParts.length > 0) {
      for (const part of payload.returnableParts) {
        await ReturablePart.create(
          {
            returnable_id: returnable.id,
            description: part.description,
            quantity: part.quantity,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    return returnable;
  } catch (err) {
    await t.rollback();
    logger.error("Returnable DAO Error:", err);
    throw err;
  }
};

const generateReturnableNumber = async (documentType, outletCode) => {
  let billType = "";
  if (documentType == 'Returnable') {
    billType = "RET";
  } else if (documentType == 'Non Returnable') {
    billType = "NRET";
  }
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
  const recentOutPass =
    await getRecentReturnableNumber(billType, outletCode, currentYear);
  if (recentOutPass) {
    const lastNumber = recentOutPass.ret_number.split("-")[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(5, "0");

  return `${billType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};
const listReturnable = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { ret_number: { [Op.like]: `%${searchKey}%` } },
            { vehicle_num: { [Op.like]: `%${searchKey}%` } },
            { return_type: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await Returable.count({
      where: searchCondition
    });
    const rows = await Returable.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [{ model:ReturablePart, as: 'parts'  }]
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Returnable dao  Error:', err);
    console.log(err);
  }
};

const getRecentReturnableNumber = async (documentType, outletCode, year) => {
    const recentReturnable = Returable.findOne({
        where: {
            ret_number: {
                [Op.like]: `${documentType}-${outletCode}${year}%`
            }
        },
        order: [["created_at", "DESC"]],
    });

    return recentReturnable;
};

const returnablePDF = async (id) => {
    try {

        const data = await Returable.findOne({
            where: { id: id },
            include: [{ model:ReturablePart, as: 'parts'  }]
        })
        return data;
    } catch (err) {
        logger.error('Returnable dao PDF downlaod', err);
    }
}

const listOutlets = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { outletCode: { [Op.like]: `%${searchKey}%` } },
            { outletName: { [Op.like]: `%${searchKey}%` } },
            { phoneNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await Outlet.count({
      where: searchCondition
    });
    const rows = await Outlet.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Outlet dao listOutlets Error:', err);
    console.log(err);
  }
};

const getOutlet = async (id) => {
  try {
    const outlet = await Outlet.findOne({ where: { id: id } });
    if (!outlet) {
      throw new notFoundException();
    }
    return outlet;
  } catch (err) {
    logger.error('Outlet dao getOutlet Error:', err);
    next(err);
  }
};

const updateOutlet = async (id, outlet, userId) => {
  let data = {};
  try {
    data = await Outlet.update(
      {
        outletCode: outlet.outletCode,
        outletName: outlet.outletName,
        companyId: outlet.companyId.id,
        gstIn: outlet.gstIn,
        email: outlet.email,
        phoneNumber: outlet.phoneNumber,
        address1: outlet.address1,
        address2: outlet.address2,
        pincode: outlet.pincode,
        state: outlet.state,
        city: outlet.city,
        contactPerson: outlet.contactPerson,
        contactEmail: outlet.contactEmail,
        contactPhoneNumber: outlet.contactPhoneNumber,
        latitude: outlet.latitude,
        longitude: outlet.longitude,
        bridgeId: outlet.bridgeId,
        googleRatingLink: outlet.googleRatingLink,
        bankName: outlet.bankName,
        bankAccount: outlet.bankAccount,
        typeofAccount: outlet.typeofAccount,
        branch: outlet.branch,
        micrCode: outlet.micrCode,
        ifscCode: outlet.ifscCode,
        status: outlet.status,
        oracleSiteCode: outlet.oracleSiteCode,
        oracleCashCustomerCode: outlet.oracleCashCustomerCode,
        oracleLocation: outlet.oracleLocation,
        outletSegment: outlet.outletSegment,
        companyName: outlet.companyId.name,
        maxPartDiscountPercentage: outlet.maxPartDiscountPercentage,
        maxLabourDiscountPercentage: outlet.maxLabourDiscountPercentage,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Outlet dao updateOutlet Error:', err);
    next(err);
  }
  return data;
};

const getAllOutlets = async () => {
  try {
    const data = await Outlet.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'outletCode', 'outletName',"companyId"],
    });
    return data;
  } catch (err) {
    logger.error('Outlet dao getAllOutlets Error:', err);
    console.log(err);
  }
};

const findByCode = async (outletCode) => {
  console.log('outletCode', outletCode);
  try {
    return await Outlet.findOne({ where: { outletCode: outletCode } });
  } catch (err) {
    logger.error('Outlet dao findByCode Error:', err);
    console.log(err);
  }
};

const findByEmail = async (email) => {
  try {
    return await Outlet.findOne({ where: { email: email } });
  } catch (err) {
    logger.error('Outlet dao findByEmail Error:', err);
    console.log(err);
  }
};

const findByPhone = async (phoneNumber) => {
  try {
    return await Outlet.findOne({ where: { phoneNumber: phoneNumber } });
  } catch (err) {
    logger.error('Outlet dao findByPhone Error:', err);
  }
};

const deleteOutlet = async (id) => {
  try {
    const data = await Outlet.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Outlet dao deleteOutlet Error:', err);
    console.log(err);
  }
};

const checkUnique = async (outletCode, id) => {
  let data = '';
  try {
    data = await Outlet.findOne({
      where: {
        outletCode: outletCode,
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

const checkUniqueForMobile = async (phoneNumber, id) => {
  let data = '';
  try {
    data = await Outlet.findOne({
      where: {
        phoneNumber: phoneNumber,
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

const checkUniqueForEmail = async (email, id) => {
  let data = '';
  try {
    data = await Outlet.findOne({
      where: {
        email: email,
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

const listOutletsandwarehouse = async (reqBody,outletid) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { outletCode: { [Op.like]: `%${searchKey}%` } },
            { outletName: { [Op.like]: `%${searchKey}%` } },
            { phoneNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

      const searchCondition2 = searchKey
      ? {
          [Op.or]: [
            { vendorCode: { [Op.like]: `%${searchKey}%` } },
            { vendorName: { [Op.like]: `%${searchKey}%` } },
            { mobileNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
  
    const rows = await Outlet.findAll({
      where: {...searchCondition,id: {[Op.ne]:outletid} },
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    const rows2 = await Vendor.findAll({
      where: {...searchCondition2,isWarehouse:1},
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return {
      data: [...rows,...rows2],
    };
  } catch (err) {
    logger.error('Outlet dao list Outlets and Warehouse Error:', err);
    console.log(err);
  }
};

const listOutletsforstocktransferreq = async (reqBody,outletid) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { outletCode: { [Op.like]: `%${searchKey}%` } },
            { outletName: { [Op.like]: `%${searchKey}%` } },
            { phoneNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

     
    const rows = await Outlet.findAll({
      where: {...searchCondition,id: {[Op.ne]:outletid} },
      limit,
      offset,
      order: [['id', 'DESC']],
    });

   

    return {
      data: rows,
    };
  } catch (err) {
    logger.error('Outlet dao list Outlets Error:', err);
    console.log(err);
  }
};
const dao = {
  addOutlet,
  listOutlets,
  getOutlet,
  updateOutlet,
  getAllOutlets,
  findByCode,
  findByEmail,
  findByPhone,
  deleteOutlet,
  checkUnique,
  checkUniqueForMobile,
  checkUniqueForEmail,
  listOutletsandwarehouse,
  listOutletsforstocktransferreq,
  addReturnable,
  listReturnable,
  returnablePDF
};

export default dao;
