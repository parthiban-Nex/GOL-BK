import logger from '../../config/logger.js';
import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
const RecentAcivity = db.recentActivity;
const TransactionRecentActivity = db.transactionRecentActivity;
const FitMasterRecentActivity = db.fitMasterRecentActivity;

const addRecentActivity = async (recentActivityData) => {
  let data = {};
  try {
    data = await RecentAcivity.create({
      activity_type: recentActivityData.activity_type,
      message: recentActivityData.message,
      menu_name: recentActivityData.menu_name,
      createdBy: recentActivityData.createdBy,
      username: recentActivityData.username,
    });
  } catch (error) {
    logger.error('Recent Activity Service addRecentActivity', error);
    next(error);
  }
};

const addTransactionRecentActivity = async (recentActivityData) => {
  let data = {};
  try {
    data = await TransactionRecentActivity.create({
      activity_type: recentActivityData.activity_type,
      message: recentActivityData.message,
      menu_name: recentActivityData.menu_name,
      createdBy: recentActivityData.createdBy,
      username: recentActivityData.username,
    });
  } catch (error) {
    logger.error('Recent Activity Service addTransactionRecentActivity', error);
    next(error);
  }
};

const addFitMasterRecentActivity = async (recentActivityData) => {
  let data = {};
  try {
    data = await FitMasterRecentActivity.create({
      activity_type: recentActivityData.activity_type,
      message: recentActivityData.message,
      menu_name: recentActivityData.menu_name,
      createdBy: recentActivityData.createdBy,
      username: recentActivityData.username,
    });
  } catch (error) {
    logger.error('Recent Activity Service addFitMasterRecentActivity', error);
    next(error);
  }
};

const RecentAcivityService = {
  addRecentActivity,
  addTransactionRecentActivity,
  addFitMasterRecentActivity,
};

export default RecentAcivityService;
