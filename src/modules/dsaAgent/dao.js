import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const DsaAgent = db.dsaagents;
const Dsaagentcompanymap = db.dsaagentcompanymaps;
const Bank = db.banks;

const addDsaAgent = async (dsaAgent, userId) => {
  let data = {};
  try {
    data = await DsaAgent.create({
      dsaCode: dsaAgent.dsaCode,
      dsaName: dsaAgent.dsaName,
      address1: dsaAgent.address1,
      address2: dsaAgent.address2,
      pincode: dsaAgent.pincode,
      whatsapp: dsaAgent.whatsapp,
      state: dsaAgent.state,
      city: dsaAgent.city,
      email: dsaAgent.email,
      mobileNumber: dsaAgent.mobileNumber,
      alternativeMobileNumber: dsaAgent.alternativeMobileNumber,
      panNo: dsaAgent.panNo,
      bankName: dsaAgent.bankName,
      branchName: dsaAgent.branchName,
      ifscCode: dsaAgent.ifscCode,
      bankCity: dsaAgent.bankCity,
      accountNumber: dsaAgent.accountNumber,
      dsaManagedBy: dsaAgent.dsaManagedBy,
      sourceOfTheDSA: dsaAgent.sourceOfTheDSA,
      status: dsaAgent.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('DsaAgent dao addDsaAgent Error:', err);
    next(err);
  }
  return data;
};

const addDsaagentCompanyMap = async (companyId, dsaagentId) => {
  let data = {};
  try {
    data = await companyId.forEach((value) => {
      const reqObj = {
        companyId: value.id,
        dsaId: dsaagentId,
        name: value.name,
      };
      Dsaagentcompanymap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('DsaAgent dao addDsaagentCompanyMap Error:', err);
    next(err);
  }
  return data;
};

const updateDsaAgent = async (id, dsaAgent, userId) => {
  let data = {};
  try {
    data = await DsaAgent.update(
      {
        dsaCode: dsaAgent.dsaCode,
        dsaName: dsaAgent.dsaName,
        address1: dsaAgent.address1,
        address2: dsaAgent.address2,
        pincode: dsaAgent.pincode,
        whatsapp: dsaAgent.whatsapp,
        state: dsaAgent.state,
        city: dsaAgent.city,
        email: dsaAgent.email,
        mobileNumber: dsaAgent.mobileNumber,
        alternativeMobileNumber: dsaAgent.alternativeMobileNumber,
        panNo: dsaAgent.panNo,
        bankName: dsaAgent.bankName,
        branchName: dsaAgent.branchName,
        ifscCode: dsaAgent.ifscCode,
        bankCity: dsaAgent.bankCity,
        accountNumber: dsaAgent.accountNumber,
        dsaManagedBy: dsaAgent.dsaManagedBy,
        sourceOfTheDSA: dsaAgent.sourceOfTheDSA,
        status: dsaAgent.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('DsaAgent dao updateDsaAgent Error:', err);
    next(err);
  }
  return data;
};

const getDsaAgent = async (id) => {
  try {
    const dsaAgent = await DsaAgent.findOne({
      where: { id: id },
      include: [{ model: Dsaagentcompanymap, as: 'dsaagentcompanymap' }],
    });
    if (!dsaAgent) {
      throw new notFoundException();
    }
    return dsaAgent;
  } catch (err) {
    logger.error('DsaAgent dao getDsaAgent Error:', err);
    next(err);
  }
};

const removeDsaagentCompanyMap = async (id) => {
  let data = {};
  try {
    data = await Dsaagentcompanymap.destroy({ where: { dsaId: id } });
  } catch (err) {
    logger.error('DsaAgent dao removeDsaagentCompanyMap Error:', err);
    next(err);
  }
  return data;
};

const listDsaAgents = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { dsaCode: { [Op.like]: `%${searchKey}%` } },
            { dsaName: { [Op.like]: `%${searchKey}%` } },
            { mobileNumber: { [Op.like]: `%${searchKey}%` } },
            { panNo: { [Op.like]: `%${searchKey}%` } },
            { accountNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const count = await DsaAgent.count({
      where: searchCondition,
    });
    const rows = await DsaAgent.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'dsaCode',
        'dsaName',
        'address1',
        'address2',
        'city',
        'pincode',
        'state',
        'email',
        'whatsapp',
        'mobileNumber',
        'alternativeMobileNumber',
        'panNo',
        'bankName',
        'branchName',
        'accountNumber',
        'ifscCode',
        'bankCity',
        'dsaManagedBy',
        'sourceOfTheDSA',
        'status',
      ],
      include: [{ model: Dsaagentcompanymap, as: 'dsaagentcompanymap' }],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('DsaAgent dao listDsaAgents Error:', err);
    console.log(err);
  }
};

const getAllBanks = async () => {
  try {
    const data = await Bank.findAll({
      attributes: ['id', 'bankName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('DsaAgent dao getAllBanks Error:', err);
    next(err);
  }
};

const findByCode = async (dsaCode) => {
  try {
    return await DsaAgent.findOne({ where: { dsaCode: dsaCode } });
  } catch (err) {
    logger.error('DsaAgent dao findByCode Error:', err);
    next(err);
  }
};

const findByEmail = async (email) => {
  try {
    return await DsaAgent.findOne({ where: { email: email } });
  } catch (err) {
    logger.error('DsaAgent dao findByEmail Error:', err);
    next(err);
  }
};

const findByPincode = async (pincode) => {
  try {
    return await DsaAgent.findOne({ where: { pincode: pincode } });
  } catch (err) {
    logger.error('DsaAgent dao findByPincode Error:', err);
    next(err);
  }
};

const findByPhone = async (mobileNumber) => {
  try {
    return await DsaAgent.findOne({ where: { mobileNumber: mobileNumber } });
  } catch (err) {
    logger.error('DsaAgent dao findByPhone Error:', err);
    next(err);
  }
};

const findByIfscCode = async (ifscCode) => {
  try {
    return await DsaAgent.findOne({ where: { ifscCode: ifscCode } });
  } catch (err) {
    logger.error('DsaAgent dao findByIfscCode Error:', err);
    next(err);
  }
};

const findByPan = async (panNo) => {
  try {
    return await DsaAgent.findOne({ where: { panNo: panNo } });
  } catch (err) {
    logger.error('DsaAgent dao findByPan Error:', err);
    next(err);
  }
};

const findByBankAccount = async (accountNumber) => {
  try {
    return await DsaAgent.findOne({ where: { accountNumber: accountNumber } });
  } catch (err) {
    logger.error('DsaAgent dao findByBankAccount Error:', err);
    next(err);
  }
};

const deleteDsaAgent = async (id) => {
  try {
    const data = await DsaAgent.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('DsaAgent dao deleteDsaAgent Error:', err);
    next(err);
  }
};
const getAllDsaAgent = async () => {
  try {
    const data = await DsaAgent.findAll({
      include: [{ model: Dsaagentcompanymap, as: 'dsaagentcompanymap' }],
    });
    return data;
  } catch (err) {
    logger.error('DsaAgent dao getAllDsaAgent Error:', err);
    next(err);
  }
};

const checkUnique = async (dsaCode, id) => {
  let data = '';
  try {
    data = await DsaAgent.findOne({
      where: {
        dsaCode: dsaCode,
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
    data = await DsaAgent.findOne({
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

const checkUniqueForEmail = async (email, id) => {
  let data = '';
  try {
    data = await DsaAgent.findOne({
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

const checkUniqueForBankAccount = async (accountNumber, id) => {
  let data = '';
  try {
    data = await DsaAgent.findOne({
      where: {
        accountNumber: accountNumber,
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

const checkUniqueForPan = async (panNo, id) => {
  let data = '';
  try {
    data = await DsaAgent.findOne({
      where: {
        panNo: panNo,
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

const getAllDsaAgentsOld = async () => {
  try {
    const data = await DsaAgent.findAll({
      attributes: ['id', 'dsaCode', 'dsaName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('DsaAgent dao getAllDsaAgents Error:', err);
    next(err);
  }
};

const getAllDsaAgents = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'dsaCode', 'dsaName', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: Dsaagentcompanymap,
          as: 'dsaagentcompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await DsaAgent.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('DsaAgent dao getAllDsaAgents Error:', err);
    next(err);
  }
};

const dao = {
  addDsaAgent,
  addDsaagentCompanyMap,
  updateDsaAgent,
  getDsaAgent,
  removeDsaagentCompanyMap,
  listDsaAgents,
  getAllBanks,
  findByCode,
  findByEmail,
  findByPincode,
  findByPhone,
  findByIfscCode,
  findByPan,
  findByBankAccount,
  deleteDsaAgent,
  getAllDsaAgent,
  checkUnique,
  checkUniqueForMobile,
  checkUniqueForEmail,
  checkUniqueForBankAccount,
  checkUniqueForPan,
  getAllDsaAgents,
};

export default dao;
