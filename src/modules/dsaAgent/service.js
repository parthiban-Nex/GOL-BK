import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import DsaAgentDao from './dao.js';

const addDsaAgent = async (dsaAgent, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await DsaAgentDao.addDsaAgent(dsaAgent, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'DsaAgent';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        dsaAgent.dsaCode + ' DsaAgent is created ';
      await DsaAgentDao.addDsaagentCompanyMap(dsaAgent.companyId, data.id);
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
  return result;
};

const findByCode = async (dsaCode) => {
  try {
    return await DsaAgentDao.findByCode(dsaCode);
  } catch (err) {
    let result = 'failed';
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByEmail = async (email) => {
  try {
    return await DsaAgentDao.findByEmail(email);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByPincode = async (pincode) => {
  try {
    return await DsaAgentDao.findByPincode(pincode);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByPhone = async (mobileNumber) => {
  try {
    return await DsaAgentDao.findByPhone(mobileNumber);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByIfscCode = async (ifscCode) => {
  try {
    return await DsaAgentDao.findByIfscCode(ifscCode);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByPan = async (panNo) => {
  try {
    return await DsaAgentDao.findByPan(panNo);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const findByBankAccount = async (accountNumber) => {
  try {
    return await DsaAgentDao.findByBankAccount(accountNumber);
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const getAllDsaAgent = async () => {
  try {
    const data = await DsaAgentDao.getAllDsaAgent();
    return data;
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const getDsaAgent = async (id) => {
  try {
    const dsaAgent = await DsaAgentDao.getDsaAgent(id);
    return dsaAgent;
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const updateDsaAgent = async (id, dsaAgent, user) => {
  let result = '';
  let recentActivityData = {};
  let message = '';
  try {
    const DsaAgentExists = await DsaAgentDao.getDsaAgent(id);
    if (DsaAgentExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'DsaAgent';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      if (DsaAgentExists.dsaCode != dsaAgent.dsaCode) {
        message =
          message +
          ' dsaCode changed from ' +
          DsaAgentExists.dsaCode +
          ' to ' +
          dsaAgent.dsaCode +
          ' ,';
      }
      if (DsaAgentExists.dsaName != dsaAgent.dsaName) {
        message =
          message +
          ' dsaName changed from ' +
          DsaAgentExists.dsaName +
          ' to ' +
          dsaAgent.dsaName +
          ' ,';
      }
      if (DsaAgentExists.address1 != dsaAgent.address1) {
        message =
          message +
          ' address1 changed from ' +
          DsaAgentExists.address1 +
          ' to ' +
          dsaAgent.address1 +
          ' ,';
      }
      if (DsaAgentExists.address2 != dsaAgent.address2) {
        message =
          message +
          ' address2 changed from ' +
          DsaAgentExists.address2 +
          ' to ' +
          dsaAgent.address2 +
          ' ,';
      }
      if (DsaAgentExists.city != dsaAgent.city) {
        message =
          message +
          ' city changed from ' +
          DsaAgentExists.city +
          ' to ' +
          dsaAgent.city +
          ' ,';
      }
      if (DsaAgentExists.pincode != dsaAgent.pincode) {
        message =
          message +
          ' pincode changed from ' +
          DsaAgentExists.pincode +
          ' to ' +
          dsaAgent.pincode +
          ' ,';
      }
      if (DsaAgentExists.state != dsaAgent.state) {
        message =
          message +
          ' state changed from ' +
          DsaAgentExists.state +
          ' to ' +
          dsaAgent.state +
          ' ,';
      }
      if (DsaAgentExists.email != dsaAgent.email) {
        message =
          message +
          ' email changed from ' +
          DsaAgentExists.email +
          ' to ' +
          dsaAgent.email +
          ' ,';
      }
      if (DsaAgentExists.whatsapp != dsaAgent.whatsapp) {
        message =
          message +
          ' whatsapp changed from ' +
          DsaAgentExists.whatsapp +
          ' to ' +
          dsaAgent.whatsapp +
          ' ,';
      }
      if (DsaAgentExists.mobileNumber != dsaAgent.mobileNumber) {
        message =
          message +
          ' mobileNumber changed from ' +
          DsaAgentExists.mobileNumber +
          ' to ' +
          dsaAgent.mobileNumber +
          ' ,';
      }
      if (
        DsaAgentExists.alternativeMobileNumber !=
        dsaAgent.alternativeMobileNumber
      ) {
        message =
          message +
          ' alternativeMobileNumber changed from ' +
          DsaAgentExists.alternativeMobileNumber +
          ' to ' +
          dsaAgent.alternativeMobileNumber +
          ' ,';
      }
      if (DsaAgentExists.panNo != dsaAgent.panNo) {
        message =
          message +
          ' panNo changed from ' +
          DsaAgentExists.panNo +
          ' to ' +
          dsaAgent.panNo +
          ' ,';
      }
      if (DsaAgentExists.bankName != dsaAgent.bankName) {
        message =
          message +
          ' bankName changed from ' +
          DsaAgentExists.bankName +
          ' to ' +
          dsaAgent.bankName +
          ' ,';
      }
      if (DsaAgentExists.branchName != dsaAgent.branchName) {
        message =
          message +
          ' branchName changed from ' +
          DsaAgentExists.branchName +
          ' to ' +
          dsaAgent.branchName +
          ' ,';
      }
      if (DsaAgentExists.accountNumber != dsaAgent.accountNumber) {
        message =
          message +
          ' accountNumber changed from ' +
          DsaAgentExists.accountNumber +
          ' to ' +
          dsaAgent.accountNumber +
          ' ,';
      }
      if (DsaAgentExists.ifscCode != dsaAgent.ifscCode) {
        message =
          message +
          ' ifscCode changed from ' +
          DsaAgentExists.ifscCode +
          ' to ' +
          dsaAgent.ifscCode +
          ' ,';
      }
      if (DsaAgentExists.bankCity != dsaAgent.bankCity) {
        message =
          message +
          ' bankCity changed from ' +
          DsaAgentExists.bankCity +
          ' to ' +
          dsaAgent.bankCity +
          ' ,';
      }
      if (DsaAgentExists.dsaManagedBy != dsaAgent.dsaManagedBy) {
        message =
          message +
          ' dsaManagedBy changed from ' +
          DsaAgentExists.dsaManagedBy +
          ' to ' +
          dsaAgent.dsaManagedBy +
          ' ,';
      }
      if (DsaAgentExists.sourceOfTheDSA != dsaAgent.sourceOfTheDSA) {
        message =
          message +
          ' sourceOfTheDSA changed from ' +
          DsaAgentExists.sourceOfTheDSA +
          ' to ' +
          dsaAgent.sourceOfTheDSA +
          ' ,';
      }
      if (DsaAgentExists.status != dsaAgent.status) {
        message =
          message +
          ' status changed from ' +
          DsaAgentExists.status +
          ' to ' +
          dsaAgent.status +
          ' ,';
      }
      message = message.slice(0, -1);

      let data = await DsaAgentDao.updateDsaAgent(id, dsaAgent, user.id);
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        await DsaAgentDao.removeDsaagentCompanyMap(id);
        await DsaAgentDao.addDsaagentCompanyMap(dsaAgent.companyId, id);
        result = 'success';
      }
    }
  } catch (err) {
    result = 'failed';
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
  return result;
};

const deleteDsaAgent = async (id) => {
  const data = await DsaAgentDao.deleteDsaAgent(id);
  return data;
};

const listDsaAgents = async (reqData) => {
  const resultList = [];
  try {
    const { totalItems, data } = await DsaAgentDao.listDsaAgents(reqData);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['dsaCode'] = element.dsaCode;
      resObj['dsaName'] = element.dsaName;
      resObj['address2'] = element.address2;
      resObj['address1'] = element.address1;
      resObj['city'] = element.city;
      resObj['pincode'] = element.pincode;
      resObj['state'] = element.state;
      resObj['email'] = element.email;
      resObj['whatsapp'] = element.whatsapp;
      resObj['mobileNumber'] = element.mobileNumber;
      resObj['alternativeMobileNumber'] = element.alternativeMobileNumber;
      resObj['panNo'] = element.panNo;
      resObj['bankName'] = element.bankName;
      resObj['branchName'] = element.branchName;
      resObj['accountNumber'] = element.accountNumber;
      resObj['ifscCode'] = element.ifscCode;
      resObj['bankCity'] = element.bankCity;
      resObj['dsaManagedBy'] = element.dsaManagedBy;
      resObj['sourceOfTheDSA'] = element.sourceOfTheDSA;
      resObj['status'] = element.status;
      const companyMaps = element.dsaagentcompanymap;
      let companyname = '';
      companyMaps.forEach(async (companyId) => {
        companyname = companyname + companyId.name + ',';
      });
      resObj['companies'] = companyname.slice(0, -1);
      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('DsaAgent service addDsaAgent Error:', err);
    next(err);
  }
};

const getAllBanks = async () => {
  try {
    const data = await DsaAgentDao.getAllBanks();
    return data;
  } catch (err) {
    logger.error('DsaAgent service getAllBanks Error:', err);
    next(err);
  }
};

const getAllDsaAgents = async (companyId, roleId) => {
  try {
    const data = await DsaAgentDao.getAllDsaAgents(companyId, roleId);
    return data;
  } catch (err) {
    logger.error('DsaAgent service getAllDsaAgents Error:', err);
    next(err);
  }
};

const DsaAgentService = {
  addDsaAgent,
  findByCode,
  findByEmail,
  findByPhone,
  getAllDsaAgent,
  getDsaAgent,
  updateDsaAgent,
  deleteDsaAgent,
  findByPincode,
  findByBankAccount,
  findByIfscCode,
  findByPan,
  listDsaAgents,
  getAllBanks,
  getAllDsaAgents,
};

export default DsaAgentService;
