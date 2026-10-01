import LeaderboardService from './service.js';
import logger from '../../config/logger.js';

const serviceAdvisor = async (req, res, next) => {
  try {
    const data = await LeaderboardService.serviceAdvisor(req.body);
    res.status(200).send({ requestSuccessful: true, serviceAdvisorLeaderboard: data });
  } catch (err) {
    logger.error('leaderboard controller serviceAdvisor', err);
    next(err);
  }
};

const technician = async (req, res, next) => {
  try {
    const data = await LeaderboardService.technician(req.body);
    res.status(200).send({ requestSuccessful: true, technicianLeaderboard: data });
  } catch (err) {
    logger.error('leaderboard controller technician', err);
    next(err);
  }
};

const partsIncharge = async (req, res, next) => {
  try {
    const data = await LeaderboardService.partsIncharge(req.body);
    res.status(200).send({ requestSuccessful: true, partsInchargeLeaderboard: data });
  } catch (err) {
    logger.error('leaderboard controller partsIncharge', err);
    next(err);
  }
};

const filters = async (req, res, next) => {
  try {
    const data = await LeaderboardService.filters();
    res.status(200).send({ requestSuccessful: true, filters: data });
  } catch (err) {
    logger.error('leaderboard controller filters', err);
    next(err);
  }
};

const controller = { serviceAdvisor, technician, partsIncharge, filters };
export default controller;
