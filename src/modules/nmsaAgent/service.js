import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import NmsaAgentDao from './dao.js';


const addNmsaAgent = async (nmsaAgent, user) => {
  try {
    const agent = await NmsaAgentDao.addNmsaAgentWithFollowup(
      nmsaAgent,
      user.id
    );

    return {
      result: 'success',
      data: agent,
    };
  } catch (err) {
    logger.error('NmsaAgent service addNmsaAgent Error:', err);
    return {
      result: 'failed',
      data: null,
    };
  }
};


const addNmsaAgentMobile = async (nmsaAgent, user) => {
  try {
    const agent = await NmsaAgentDao.addNmsaAgentMobileWithFollowup(
      nmsaAgent,
      user.id
    );

    return {
      result: 'success',
      data: agent,
    };
  } catch (err) {
    logger.error('NmsaAgent service addNmsaAgentMobile Error:', err);
    return {
      result: 'failed',
      data: null,
    };
  }
};

const getAllNmsaDropdown = async () => {
  try {
    const data = await NmsaAgentDao.getAllNmsaDropdown();
    return data;
  } catch (err) {
    logger.error('NmsaAgent service getAllNmsaDropdown Error:', err);
    next(err);
  }
};
export const listNmsaAgents = async (reqData, user) => {
  try {
    return await NmsaAgentDao.listNmsaAgents(reqData, user);
  } catch (err) {
    logger.error('NmsaAgent service listNmsaAgents Error:', err);
    throw err;
  }
};

export const listNmsaAgentsByPlanId = async (reqData, user) => {
  try {
    return await NmsaAgentDao.listNmsaAgentsByPlanId(reqData, user);
  } catch (err) {
    logger.error('NmsaAgent service listNmsaAgentsByPlanId Error:', err);
    throw err;
  }
};

const getOneNmsaAgent = async (id) => {
  try {
    const nmsaAgent = await NmsaAgentDao.getOneNmsaAgent(id);
    return nmsaAgent;
  } catch (err) {
    logger.error('NmsaAgent service addNmsaAgent Error:', err);
    next(err);
  }
};

const updateNmsaAgent = async (id, nmsaAgent, user) => {
  let result = '';
  let message = '';

  try {
    const NmsaAgentExists = await NmsaAgentDao.getOneNmsaAgent(id);

    if (!NmsaAgentExists) {
      return { result: 'failed', message: 'NmsaAgent not found' };
    }

    const fieldsToCompare = [
      'nmsaName',
      'address1',
      'city',
      'pincode',
      'state',
      'mobileNumber',
      'fbmId',
      'having_car_workshop',
      'zone',
      'workshopCategoryId',
      'having_land',
      'landType',
      'landSize',
      'invest25',
      'buildWorkshop',
      'supportBankLoan',
      'planId',
      'currentLocation',
      'from_mobile',
    ];

    fieldsToCompare.forEach((field) => {
      if (NmsaAgentExists[field] != nmsaAgent[field]) {
        message += ` ${field} changed from ${NmsaAgentExists[field]} to ${nmsaAgent[field]} ,`;
      }
    });

    message = message.endsWith(',') ? message.slice(0, -1) : message;

    const updatedAgent = await NmsaAgentDao.updateNmsaAgent(id, nmsaAgent, user.id);
    if (updatedAgent) {
      result = 'success';
    }

    return { result, message };
  } catch (err) {
    result = 'failed';
    logger.error('NmsaAgent service updateNmsaAgent Error:', err);
    throw err;
  }
};

export const getDashboard = async (reqData, user) => {
  try {
    return await NmsaAgentDao.getDashboard(reqData, user);
  } catch (err) {
    logger.error('NmsaAgent service getDashboard Error:', err);
    throw err;
  }
};

const updateNmsaAgentMobile = async (id, nmsaAgent, user) => {
  let result = '';
  let message = '';

  try {
    const NmsaAgentExists = await NmsaAgentDao.getOneNmsaAgentMobile(id);

    if (!NmsaAgentExists) {
      return { result: 'failed', message: 'NmsaAgent not found' };
    }

    const fieldsToCompare = [
      'nmsaName',
      'address1',
      'city',
      'pincode',
      'state',
      'mobileNumber',
      'fbmId',
      'having_car_workshop',
      'zone',
      'workshopCategoryId',
      'having_land',
      'landType',
      'landSize',
      'invest25',
      'buildWorkshop',
      'supportBankLoan',
      'planId',
      'currentLocation',
      'from_mobile',
      'contactedTypeId',
      'contactedPersonName',
      'visitDate',
      'visitTypeId',
      'workshopTypeId',
      'leadTypeId',
      'leadSourceId',
      'availableToolsId',
      'newToolsInterested',
    ];

    fieldsToCompare.forEach((field) => {
      if (NmsaAgentExists.agent && NmsaAgentExists.agent[field] != nmsaAgent[field]) {
        message += ` ${field} changed from ${NmsaAgentExists.agent[field]} to ${nmsaAgent[field]} ,`;
      }
    });

    message = message.endsWith(',') ? message.slice(0, -1) : message;

    const updatedAgent = await NmsaAgentDao.updateNmsaAgentMobile(id, nmsaAgent, user.id);
    if (updatedAgent) {
      result = 'success';
    }

    return { result, message };
  } catch (err) {
    result = 'failed';
    logger.error('NmsaAgent service updateNmsaAgentMobile Error:', err);
    throw err;
  }
};

export const listNmsaAgentsMobile = async (reqData, user) => {
  try {
    return await NmsaAgentDao.listNmsaAgentsMobile(reqData, user);
  } catch (err) {
    logger.error('NmsaAgent service listNmsaAgentsMobile Error:', err);
    throw err;
  }
};

const getOneNmsaAgentMobile = async (id) => {
  try {
    const nmsaAgent = await NmsaAgentDao.getOneNmsaAgentMobile(id);
    return nmsaAgent;
  } catch (err) {
    logger.error('NmsaAgent service getOneNmsaAgentMobile Error:', err);
    throw err;
  }
};

export const listNmsaAgentsByPlanIdMobile = async (reqData, user) => {
  try {
    return await NmsaAgentDao.listNmsaAgentsByPlanIdMobile(reqData, user);
  } catch (err) {
    logger.error('NmsaAgent service listNmsaAgentsByPlanIdMobile Error:', err);
    throw err;
  }
};

const NmsaAgentService = {
  addNmsaAgent,
  addNmsaAgentMobile,
  getAllNmsaDropdown,
  listNmsaAgents,
  getOneNmsaAgent,
  updateNmsaAgent,
  updateNmsaAgentMobile,
  listNmsaAgentsByPlanId,
  getDashboard,
  listNmsaAgentsMobile,
  getOneNmsaAgentMobile,
  listNmsaAgentsByPlanIdMobile,
};

export default NmsaAgentService;
