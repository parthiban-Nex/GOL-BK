import ClickinDao from './dao.js'
import logger from '../../config/logger.js';


const getInspectionLink = async (req) => {
  try {
    const results = await ClickinDao.getInspectionLink(req);
    return results;
  } catch (err) {
    logger.error('Clickin service getInspectionLink', err);
  }
}

const clickinautosaveestimate = async (req) => {
  try {
    const results = await ClickinDao.clickinautosaveestimate(req);
    return results;
  } catch (err) {
    logger.error('Clickin service clickinautosaveestimate', err);
  }
}

const clickinpostcallback = async (req) => {
  try {
    const results = await ClickinDao.clickinpostcallback(req);
    return results;
  } catch (err) {
    logger.error('Clickin service clickinpostcallback', err);
  }
}

const Service = {
    getInspectionLink,
    clickinautosaveestimate,
    clickinpostcallback
};

export default Service;