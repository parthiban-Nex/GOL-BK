import logger from '../../config/logger.js';
import BeatPlanDao from './dao.js';

const getAllActivityPlans = async () => {
  try {
    return await BeatPlanDao.getAllActivityPlans();
  } catch (err) {
    logger.error('Activity Plan service getAllActivityPlans Error:', err);
    throw err;
  }
};


const addBeatPlan = async (beatPlan, user) => {
  try {
    return await BeatPlanDao.addBeatPlan(beatPlan, user.id);
  } catch (err) {
    logger.error('Beat Plan service addBeatPlan Error:', err);
    throw err;
  }
};

const getAllBeatPlans = async (user) => {
  try {
    return await BeatPlanDao.getAllBeatPlans(user.id);
  } catch (err) {
    logger.error('Beat Plan service getAllBeatPlans Error:', err);
    throw err;
  }
};

const getBeatPlanById = async (beatPlanId, user) => {
  try {
    return await BeatPlanDao.getBeatPlanById(beatPlanId, user.id);
  } catch (err) {
    logger.error('Beat Plan service getBeatPlanById Error:', err);
    throw err;
  }
};

const addBeatPlanFranchiseUpdate = async (beatPlan, user) => {
  try {
    const agent = await BeatPlanDao.addBeatPlanFranchiseUpdate(
      beatPlan,
      user.id
    );

    return {
      result: 'success',
      data: agent,
    };
  } catch (err) {
    logger.error('Beat Plan service addBeatPlanFranchiseUpdate Error:', err);
    return {
      result: 'failed',
      data: null,
    };
  }
};

export const getOneBeatPlanFranchiseUpdateById = async (reqData, user) => {
  try {
    return await BeatPlanDao.getOneBeatPlanFranchiseUpdateById(reqData, user);
  } catch (err) {
    logger.error('Beat Plan service getOneBeatPlanFranchiseUpdateById Error:', err);
    throw err;
  }
};
const BeatPlanService = {
  getAllActivityPlans,
  addBeatPlan,
  getAllBeatPlans,
  getBeatPlanById,
  addBeatPlanFranchiseUpdate,
  getOneBeatPlanFranchiseUpdateById,
};

export default BeatPlanService;