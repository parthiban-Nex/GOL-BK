import ModelService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
const addModel = async (req, res, next) => {
  try { 
    logger.info(
      'Model Controller addModel requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    let result = await ModelService.addModel(req.body, req.user);

    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Model';
    if (result == 'success') {
      auditData['message'] = 'Model added successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Model not added';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Model controller addModel()', err);
    next(err);
  }
};

const updateModel = async (req, res, next) => { 
  try {
    logger.info(
      'Model Controller updateModel requestData:' + JSON.stringify(req.body)
    );
    let id = req.body.id;
    let userId = req.user.id;
    const auditData = {};
    let result = await ModelService.updateModel(id, req.body, req.user);

    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Model';
    if (result == 'success') {
      auditData['message'] = 'Model Updated successfully ';
      auditData['result'] = 'success';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Model Updated successfully ',
      });
    } else {
      auditData['message'] = 'Model not Updated';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Model not Updated',
      });
    }
  } catch (err) {
    logger.error('Model controller updateModel', err);
    next(err);
  }
};

const getAllModels = async (req, res, next) => {
  try {
    const data = await ModelService.getAllModels(
      req.user.outlet.companyId,
      req.user.roleid
    );
    res.status(200).send({
      requestSuccessful: true,
      ModelData: data,
    });
  } catch (err) {
    next(err);
  }
};

const getModelsByMake = async (req, res, next) => { 
  try {
    const data = await ModelService.getModelsByMake(req.body.makeId);
    res.status(200).send({
      requestSuccessful: true,
      ModelData: data,
    });
  } catch (err) {
    next(err);
  }
};

const getVarientByModel = async (req, res, next) => { 
  try {
    const data = await ModelService.getVarientByModel(req.body.modelId);
    res.status(200).send({
      requestSuccessful: true,
      VarientData: data,
    });
  } catch (err) {
    next(err);
  }
};

const getAllModelsList = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Item Submaster -> Models';

    const data = await ModelService.getAllModelList(req.body);

    if (data) {
      auditData['message'] = 'Get Models data ';
      auditData['result'] = 'success ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    } else {
      auditData['message'] = 'Get Models data';
      auditData['result'] = 'failed ';
      auditData['action'] = 'View';
      auditData['access'] = 'Portal';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('Model controller getAllModelsList ', err);
    next(err);
  }
};

const getOneModel = async (req, res, next) => {
  try {
    const make = await ModelService.getOneModel(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: make,
    });
  } catch (err) {
    next(err);
  }
};

const controller = {
  addModel,
  updateModel,
  getAllModels,
  getOneModel,
  getModelsByMake,
  getVarientByModel,
  getAllModelsList,
};

export default controller;
