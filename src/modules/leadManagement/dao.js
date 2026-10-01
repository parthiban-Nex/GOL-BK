import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Lead = db.leads;

const listLeads = async (reqData, user) => {
  let count = 0;
  let rows = {};
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { regNo: { [Op.like]: `%${searchKey}%` } },
          { customerName: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};
    const userCondition = { createdBy: user.id };
    count = await Lead.count({
      where: { ...searchCondition, ...userCondition },
    });
    rows = await Lead.findAll({
      where: { ...searchCondition, ...userCondition },
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Leads dao listLeads', err);
  }
};

const createLead = async (leadData, user) => {
  let data = {};
  try {
    data = await Lead.create({
      regNo: leadData.registrationNumber,
      leadNo: leadData.leadNo,
      vehicle_id: leadData.vehicleId,
      customerName: leadData.customerName,
      pincode: leadData.pincode,
      city: leadData.city,
      state: leadData.state,
      transportName: leadData.transportName,
      properitor: leadData.properitor,
      email: leadData.email,
      managerName: leadData.managerName,
      mobileNo: leadData.customerMobileNumber,
      customerAddress: leadData.customerAddress,
      aadhaarNo: leadData.aadhaarNo,
      panNo: leadData.panNo,
      gstNo: leadData.gstNo === ""? null: leadData.gstNo,
      makeId: leadData.makeId,
      modelId: leadData.modelId,
      mfgYear: leadData.mfgYear,
      application: leadData.application,
      stageNorm: leadData.stageNorm,
      insurance: leadData.insurance,
      insuranceExpDate: leadData.insuranceExpDate,
      insuranceFcDate: leadData.insuranceFcDate,
      engineNo: leadData.engineNumber === "" ? null: leadData.engineNumber,
      hp: leadData.hp,
      avgKmpm: leadData.avgKmpm,
      avgHourspm: leadData.avgHourspm,
      outletId: user.outlet.id,
      createdBy: user.id,
    });

  } catch (err) {
    console.log(err);
    logger.error('Lead dao createLead', err);
  }

  return data;
}

const editLead = async (leadData, userId) => {
  let data = {};
  try {
    data = await Lead.update({
      regNo: leadData.registrationNumber,
      customerName: leadData.customerName,
      pincode: leadData.pincode,
      city: leadData.city,
      state: leadData.state,
      transportName: leadData.transportName,
      properitor: leadData.properitor,
      email: leadData.email,
      managerName: leadData.managerName,
      mobileNo: leadData.customerMobileNumber,
      customerAddress: leadData.customerAddress,
      aadhaarNo: leadData.aadhaarNo,
      panNo: leadData.panNo,
      gstNo: leadData.gstNo === ""? null: leadData.gstNo,
      makeId: leadData.makeId,
      modelId: leadData.modelId,
      mfgYear: leadData.mfgYear,
      application: leadData.application,
      stageNorm: leadData.stageNorm,
      insurance: leadData.insurance,
      insuranceExpDate: leadData.insuranceExpDate,
      insuranceFcDate: leadData.insuranceFcDate,
      engineNo: leadData.engineNumber === "" ? null: leadData.engineNumber,
      hp: leadData.hp,
      avgKmpm: leadData.avgKmpm,
      avgHourspm: leadData.avgHourspm,
      updatedBy: userId,
    }, { where: { id: leadData.id }});
  } catch (err) {
    console.log(err);
    logger.error('Lead dao createLead', err);
  }

  return data;
}

const findLeadById = async (id) => {
  try {
    return await Lead.findOne({
      where: {id: id}
    });
  } catch (err) {
    logger.error('Lead dao findLeadById', err);
  }
}

const findByRegistrationNumber = async (registrationNumber) => {
  try {
    return await Lead.findOne({
      where: { regNo: registrationNumber },
    });
  } catch (err) {
    logger.error('Lead dao findByRegistrationNumber', err);
    next(err);
  }
};

const findByEngineNumber = async (engineNumber) => {
  try {
    return await Lead.findOne({ where: { engineNo: engineNumber } });
  } catch (err) {
    logger.error('Lead dao findByEngineNumber', err);
    next(err);
  }
};


const checkUnique = async (registrationNumber, id) => {
  let data = '';
  try {
    data = await Lead.findOne({
      where: {
        regNo: registrationNumber,
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

const checkUniqueForEngineNumber = async (engineNumber, id) => {
  let data = '';
  try {
    data = await Lead.findOne({
      where: {
        engineNo: engineNumber,
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



const getRecentLead = async(outletCode, year) => {
  const recentLead = Lead.findOne({
    where: {
      leadNo: {
        [Op.like]: `LEAD-${outletCode}${year}%`
      }
    },
    order: [['createdAt', 'DESC']]
  });

  return recentLead;
}

const dao = {
  listLeads,
  createLead,
  editLead,
  findLeadById,
  findByRegistrationNumber,
  findByEngineNumber,
  checkUnique,
  checkUniqueForEngineNumber,
  getRecentLead
};

export default dao;