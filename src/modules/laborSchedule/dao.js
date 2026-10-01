import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const LaborSchedule = db.laborschedules;
const LaborCompanyMap = db.laborcompanymaps;
const Schedules = db.schedules;
const OslSchedules = db.oslSchedules;
const Vehicles = db.vehicles;
const Models = db.models;

const addLaborSchedule = async (laborSchedule, userId) => {
  let data = {};
  try {
    data = await LaborSchedule.create({
      laborCode: laborSchedule.laborCode,
      laborDescription: laborSchedule.laborDescription,
      sacCode: laborSchedule.sacCode,
      taxPercentage: laborSchedule.taxPercentage,
      osl: laborSchedule.osl,
      stdhrsA: laborSchedule.stdhrsA,
      stdhrsB: laborSchedule.stdhrsB,
      stdhrsC: laborSchedule.stdhrsC,
      stdhrsD: laborSchedule.stdhrsD,
      stdhrsE: laborSchedule.stdhrsE,
      citySegmentA: laborSchedule.citySegmentA,
      citySegmentB: laborSchedule.citySegmentB,
      citySegmentC: laborSchedule.citySegmentC,
      citySegmentD: laborSchedule.citySegmentD,
      status: laborSchedule.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('LaborSchedule dao addLaborSchedule', err);
    next(err);
  }
  return data;
};

const addLaborCompanyMap = async (companyId, laborId) => {
  let data = {};
  try {
    data = companyId.forEach((value) => {
      const reqObj = {
        companyId: value.id,
        laborId: laborId,
        name: value.name,
      };
      LaborCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('LaborSchedule dao addLaborCompanyMap', err);
    next(err);
  }
  return data;
};

const updateLaborSchedule = async (id, laborSchedule, userId) => {
  let data = {};
  try {
    data = await LaborSchedule.update(
      {
        laborCode: laborSchedule.laborCode,
        laborDescription: laborSchedule.laborDescription,
        sacCode: laborSchedule.sacCode,
        taxPercentage: laborSchedule.taxPercentage,
        osl: laborSchedule.osl,
        stdhrsA: laborSchedule.stdhrsA,
        stdhrsB: laborSchedule.stdhrsB,
        stdhrsC: laborSchedule.stdhrsC,
        stdhrsD: laborSchedule.stdhrsD,
        stdhrsE: laborSchedule.stdhrsE,
        citySegmentA: laborSchedule.citySegmentA,
        citySegmentB: laborSchedule.citySegmentB,
        citySegmentC: laborSchedule.citySegmentC,
        citySegmentD: laborSchedule.citySegmentD,
        status: laborSchedule.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('LaborSchedule dao updateLaborSchedule', err);
    next(err);
  }
  return data;
};

const removeLaborCompanyMap = async (id) => {
  try {
    return await LaborCompanyMap.destroy({ where: { laborId: id } });
  } catch (err) {
    logger.error('LaborSchedule dao removeLaborCompanyMap', err);
    next(err);
  }
};

const getOne = async (id) => {
  try {
    const laborSchedule = await LaborSchedule.findOne({
      where: { id: id },
      include: [{ model: LaborCompanyMap, as: 'laborcompanymap' }],
    });
    if (!laborSchedule) {
      throw new notFoundException();
    }
    return laborSchedule;
  } catch (err) {
    logger.error('LaborSchedule dao getOne', err);
    next(err);
  }
};

const listLaborSchedule = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { laborCode: { [Op.like]: `%${searchKey}%` } },
            { laborDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await LaborSchedule.count({
      where: searchCondition,
    });
    const rows = await LaborSchedule.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'laborCode',
        'laborDescription',
        'sacCode',
        'taxPercentage',
        'osl',
        'stdhrsA',
        'stdhrsB', 
        'stdhrsC',
        'stdhrsD',
        'stdhrsE',
        'citySegmentA',
        'citySegmentB',
        'citySegmentC',
        'citySegmentD',
        'status',
      ],
      include: [{ model: LaborCompanyMap, as: 'laborcompanymap' }],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('LaborSchedule dao listLaborSchedule', err);
    console.log(err);
  }
};

const findLaborCode = async (laborCode) => {
  try {
    return await LaborSchedule.findOne({ where: { laborCode: laborCode } });
  } catch (err) {
    logger.error('LaborSchedule dao findLaborCode', err);
    console.log(err);
  }
};

const getLabourDetails = async (reqData) => { 
  try {
    const laborCode = reqData.laborCode;
    console.log('laborCode ' + laborCode);
    const rows = await LaborSchedule.findAll({
      where: reqData.id ? { id: reqData.id } : { laborCode: laborCode },
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'laborCode',
        'laborDescription',
        'sacCode',
        'taxPercentage',
        'osl',
        'stdhrsA',
        'stdhrsB',
        'stdhrsC',
        'stdhrsD',
        'stdhrsE',
        'citySegmentA',
        'citySegmentB',
        'citySegmentC',
        'citySegmentD',
        'aa',
        'ab',
        'ac',
        'ad',
        'ae',
        'ba',
        'bb',
        'bc',
        'bd',
        'be',
        'ca',
        'cb',
        'cc',
        'cd',
        'ce',
        'da',
        'db',
        'dc',
        'dd',
        'de',
        'status',
      ],
    });
    return rows;
  } catch (err) {
    logger.error('LaborSchedule dao getLabourDetails', err);
    console.log(err);
  }
};

const getOslLabourDetails = async (reqData) => {
  try {
    const laborCode = reqData.laborCode;
    const rows = await LaborSchedule.findAll({
      where: reqData.id ? { id: reqData.id } : { laborCode: laborCode },
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'laborCode',
        'laborDescription',
        'sacCode',
        'taxPercentage',
        'osl',
        'stdhrsA',
        'stdhrsB',
        'stdhrsC',
        'stdhrsD',
        'stdhrsE',
        'citySegmentA',
        'citySegmentB',
        'citySegmentC',
        'citySegmentD',
        'status',
      ],
    });
    return rows;
  } catch (err) {
    logger.error('LaborSchedule dao getOslLabourDetails', err);
    console.log(err);
  }
};

const searchLabourDetails = async (reqData, companyId) => {
  try {
    const searchKey = reqData.laborCode;
    console.log('searchKey ' + searchKey);
    const whereCondition = {
      osl: false,
      ...(searchKey && searchKey.length >= 3
        ? {
            [Op.or]: [
              { laborCode: { [Op.like]: `%${searchKey}%` } },
              { laborDescription: { [Op.like]: `%${searchKey}%` } },
            ],
          }
        : {}),
    };
    const rows = await LaborSchedule.findAll({
      where: whereCondition,
      include: [
        {
          model: LaborCompanyMap,
          as: 'laborcompanymap',
          where: {
            companyId: companyId,
          },
          attributes: [],
        },
      ],
      order: [['id', 'DESC']],
      attributes: ['id', 'laborCode', 'laborDescription'],
    });
    return rows;
  } catch (err) {
    logger.error('LaborSchedule dao getOslLabourDetails', err);
    console.log(err);
  }
};

const searchOslLabourDetails = async (reqData, companyId) => {
  try {
    const searchKey = reqData.laborCode;
    console.log('searchKey ' + searchKey);
    const whereCondition = {
      osl: true,
      ...(searchKey && searchKey.length >= 3
        ? {
            [Op.or]: [
              { laborCode: { [Op.like]: `%${searchKey}%` } },
              { laborDescription: { [Op.like]: `%${searchKey}%` } },
            ],
          }
        : {}),
    };
    const rows = await LaborSchedule.findAll({
      where: whereCondition,
      include: [
        {
          model: LaborCompanyMap,
          as: 'laborcompanymap',
          where: {
            companyId: companyId,
          },
          attributes: [],
        },
      ],
      order: [['id', 'DESC']],
      attributes: ['id', 'laborCode', 'laborDescription'],
    });
    return rows;
  } catch (err) {
    logger.error('LaborSchedule dao getOslLabourDetails', err);
    console.log(err);
  }
};

const checkUnique = async (laborCode, id) => {
  let data = '';
  try {
    data = await LaborSchedule.findOne({
      where: {
        laborCode: laborCode,
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

const labourDetailsMobile = async (searchData, user) => {
  try {
    const searchCondition = searchData ? {
      [Op.or]: [
        {laborCode: { [Op.like]: `%${searchData}%`}},
        {laborDescription: { [Op.like]: `%${searchData}%`}},
      ]
    } : {};
    const data = await LaborSchedule.findAll({
      where: searchCondition,
      include: [
        { 
          model: LaborCompanyMap, 
          as: 'laborcompanymap',
          where: {
            companyId: user.companyId,
          },
          attributes: [],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return data;
  } catch (err) {
    logger.error('LaborSchedule dao labourDetailsMobile', err);
    console.log(err);
  }
}

const searchAllLabourDetails = async (reqData, companyId) => {
  try {
    const searchKey = reqData.laborCode;
    console.log('searchKey ' + searchKey);
    const whereCondition = {
      ...(searchKey && searchKey.length >= 3
        ? {
            [Op.or]: [
              { laborCode: { [Op.like]: `%${searchKey}%` } },
              { laborDescription: { [Op.like]: `%${searchKey}%` } },
            ],
          }
        : {}),
    };
    const rows = await LaborSchedule.findAll({
      where: whereCondition,
      include: [
        {
          model: LaborCompanyMap,
          as: 'laborcompanymap',
          where: {
            companyId: companyId,
          },
          attributes: [],
        },
      ],
      order: [['id', 'DESC']],
      attributes: ['id', 'laborCode', 'laborDescription'],
    });
    return rows;
  } catch (err) {
    logger.error('LaborSchedule dao getOslLabourDetails', err);
    console.log(err);
  }
};

const getModelDetailsByVehNo = async (vehNo) => {
  try {
    const data = await Vehicles.findOne({
      where: {
        registrationNumber: vehNo
      },
      include: [
        { model: Models, as: 'model', attributes: [ 'id', 'modelName', 'segment' ]}
      ],
      attributes: [
        'id', 'registrationNumber'
      ]
    })
    return data;
  } catch (err) {
    logger.error('LaborSchedule dao getModelDetailsByVehNo', err);
    console.log(err);
  }
}

const dao = {
  addLaborSchedule,
  addLaborCompanyMap,
  updateLaborSchedule,
  removeLaborCompanyMap,
  getOne,
  listLaborSchedule,
  findLaborCode,
  getLabourDetails,
  getOslLabourDetails,
  searchLabourDetails,
  searchOslLabourDetails,
  checkUnique,
  labourDetailsMobile,
  searchAllLabourDetails,
  getModelDetailsByVehNo
};

export default dao;
