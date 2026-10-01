import logger from "../../config/logger.js";
import RecentAcivityService from "../recentActivity/service.js";
import schemeDao from "./dao.js";

const createScheme = async (reqData, user) => {
    let recentActivityData = {};
    let data = {};
    let result = '';

    try {
        data = await schemeDao.createScheme(reqData, user);
        if (data) {
            recentActivityData['activity_type'] = 'Create';
            recentActivityData['menu_name'] = 'Rep[air Type';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;
            recentActivityData['message'] = reqData.repairTypeName;
            await RecentAcivityService.addRecentActivity(recentActivityData);

            result = 'success';
        }
    } catch (err) {
        logger.error('Scheme Service createScheme', err);
    };
    return result;
};

const getSchemeData = async (reqData) => {
    try {
        const { totalScheme, data } = await schemeDao.getSchemeData(reqData);

        return { totalScheme, data };
        
    } catch (err) {
        logger.error('Scheme Service getSchemeData', err);
    };
};

const createSchemeLabor = async (reqData, user) => {
    let recentActivityData = {};
    let data = {};
    let result = '';

    try {
        if(reqData.length > 0){
            await schemeDao.deleteLaborPart(reqData[0].schemeId);
        }
        data = await schemeDao.createSchemeLabor(reqData, user);
        if (data) {
            recentActivityData['activity_type'] = 'Create';
            recentActivityData['menu_name'] = 'Repair Type';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;
            recentActivityData['message'] = "added labour scheme";
            await RecentAcivityService.addRecentActivity(recentActivityData);

            result = 'success';
        }
    } catch (err) {
        logger.error('Scheme Service createSchemeLabor', err);
    };
    return result;
};

const getSchemeLaborData = async (reqData, user) => {
    try {
      const data = await schemeDao.getSchemeLaborData(reqData);
      
      return data;
    } catch (err) {
      logger.error('Scheme service getSchemeLaborData', err);
      throw err;
    }
  };

const createSchemePart = async (reqData, user) => {
    let recentActivityData = {};
    let data = {};
    let result = '';

    try {
        if(reqData.length > 0){
            await schemeDao.deleteSchemePart(reqData[0].schemeId);
        }
        data = await schemeDao.createSchemePart(reqData, user);
        if (data) {
            recentActivityData['activity_type'] = 'Create';
            recentActivityData['menu_name'] = 'Repair Type';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;
            recentActivityData['message'] = "added part scheme";
            await RecentAcivityService.addRecentActivity(recentActivityData);

            result = 'success';
        }
    } catch (err) {
        logger.error('Scheme Service createSchemePart', err);
    };
    return result;
};

const getSchemePartData = async (reqData, user) => {
    try {
      const data = await schemeDao.getSchemePartData(reqData);
      
      return data;
    } catch (err) {
      logger.error('Scheme service getSchemePartData', err);
      throw err;
    }
  };

const schemeService = {
    createScheme,
    getSchemeData,
    createSchemeLabor,
    getSchemeLaborData,
    createSchemePart,
    getSchemePartData
};

export default schemeService;
