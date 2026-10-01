import ModelDao from './dao.js';
import logger from '../../config/logger.js';
import CompanyService from '../company/service.js';
import MakeService from '../make/service.js';
import RecentAcivityService from '../recentActivity/service.js';

const addModel = async (model, user) => { 
  let result = 'failed';
  let recentActivityData = {};
  try {
    let data = await ModelDao.addModel(model, user);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Model';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = model.modelName + ' Model is created ';
      await ModelDao.addModelCompanyMap(model.companyId, data.id, user);
       await ModelDao.addModelVarientMap(model.varientId, data.id, user);
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('ModelService add model addModel()', err);
    next(err);
  }
  return result;
};

const updateModel = async (id, model, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    await ModelDao.removeModelCompanyMap(id);
    await ModelDao.removeModelvarientMap(id);
    let modelExists = await ModelDao.findOne(id);
    if (modelExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Model';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (modelExists.modelName != model.modelName) {
        message =
          message +
          ' modelName changed from ' +
          modelExists.modelName +
          ' to ' +
          model.modelName +
          ' ,';
      }
      if (modelExists.modelDescription != model.modelDescription) {
        message =
          message +
          ' itemCategorieDescription changed from ' +
          modelExists.modelDescription +
          ' to ' +
          model.modelDescription +
          ' ,';
      }
      if (modelExists.status != model.status) {
        message =
          message +
          ' status changed from ' +
          modelExists.status +
          ' to ' +
          model.status +
          ' ,';
      }
      if (modelExists.segment != model.segment) {
        message =
          message +
          ' segment changed from ' +
          modelExists.segment +
          ' to ' +
          model.segment +
          ' ,';
      }

      let data = await ModelDao.updateModel(id, model, user.id);

      if (message && data) {
        recentActivityData['message'] = message;
        const recent =
          await RecentAcivityService.addRecentActivity(recentActivityData);
      }
      if (data) {  
        await ModelDao.addModelCompanyMap(model.companyId, id, user.id);
        await ModelDao.addModelVarientMap(model.varientId,id,user.id);
        // await ModelDao.updateModelCompanyMap(model.companyId, id, user.id);
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('Model service updateModel', err);
    next(err);
  }
  return result;
};

const getAllModels = async (companyId, roleId) => {
  const data = await ModelDao.getAllModels(companyId, roleId);
  return data;
};

const getModelsByMake = async (makeId) => {
  const data = await ModelDao.getAllModelsByMake(makeId);
  return data;
};
const getVarientByModel = async (modelId) => {
  const data = await ModelDao.getAllVarientByModel(modelId);
  return data;
};

const getAllModelList = async (reqData) => {
  try {
    const { totalItems, data } = await ModelDao.getAllModelList(reqData);
    const resultList = [];
    data.forEach(async (element) => {    
      const resObj = {};
      resObj['id'] = element.id;
      resObj['makeId'] = element.makeId;
      resObj['makeName'] = element.make.makeName;
      resObj['modelName'] = element.modelName;
      resObj['modelDescription'] = element.modelDescription;
      resObj['segment'] = element.segment;
      resObj['varientId'] = element.varientId;

       
      // if (element.varients) {
      //   resObj['varientName'] = element.varients.varientName;
      // }

      // ✅ Handle multiple variants (many-to-many mapping)
      if (element.multipleVarients && element.multipleVarients.length > 0) {
        const varientNames = element.multipleVarients.map(v => v.varientName);
        resObj['varientNames'] = varientNames.join(', ');
      }
      
      // resObj['varientName'] =element.varients.varientName;
      resObj['status'] = element.status;
      const companyMaps = element?.modelcompanymaps;
      console.log(companyMaps,"companyMaps")
      let companyname = '';
      companyMaps.forEach(async (item) => {
        companyname = companyname + item.companies?.name + ',';
      });
      resObj['companies'] = companyname.slice(0, -1);
      resultList.push(resObj);
    });
    
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (error) {
    logger.error('Model service getAllModelList ', err);
    next(err);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ModelService = {
  addModel,
  updateModel,
  getAllModels,
  getModelsByMake,
  getVarientByModel,
  getAllModelList,
};

export default ModelService;
