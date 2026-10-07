import logger from '../../../config/logger.js';
import { getGlobalMasterListService, getGlobalPartsListService, getGlobalGeneralSearchService } from './service.js';
import { resolveVehicleService, getVahanDetailsService, getCartService, addCartService } from '../service.js';

/**
 * Controller for Global search catalog getMasterList (Customer Code 0046)
 */
export const getGlobalMasterList = async (req, res, next) => {
  try {
    const payload = req.body || {};
    // Default customerCode to 0046 for Global Catalog if not provided
    if (!payload.customerCode) {
      payload.customerCode = '0046';
    }

    const clientAuthHeader = req.headers.authorization;
    const result = await getGlobalMasterListService(payload, clientAuthHeader);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Global Catelog Controller getMasterList Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch global master list',
      count: 0,
      data: [],
    });
  }
};

/**
 * Controller for Global search catalog getPartsList (Customer Code 0046)
 */
export const getGlobalPartsList = async (req, res, next) => {
  try {
    const payload = req.body || {};
    // Default customerCode to 0046 for Global Catalog if not provided
    if (!payload.customerCode) {
      payload.customerCode = '0046';
    }

    const clientAuthHeader = req.headers.authorization;
    const result = await getGlobalPartsListService(payload, clientAuthHeader);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Global Catelog Controller getPartsList Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch global parts list',
      count: 0,
      data: [],
    });
  }
};

export const resolveVehicle = async (req, res, next) => {
  try {
    const regNo = req.body.registrationNumber || req.body.vehicleNumber || req.query.registrationNumber || req.query.vehicleNumber;
    const result = await resolveVehicleService(regNo);
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Global Catelog Controller resolveVehicle Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to resolve vehicle details',
      data: [],
    });
  }
};

export const getVahanDetails = async (req, res, next) => {
  try {
    const regNo = req.query.registrationNumber || req.body.registrationNumber || req.body.vehicleNumber || req.query.vehicleNumber;
    const clientAuthHeader = req.headers.authorization;
    const result = await getVahanDetailsService(regNo, clientAuthHeader);
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Global Catelog Controller getVahanDetails Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Vahan details',
      data: null,
    });
  }
};

export const generalSearch = async (req, res, next) => {
  try {
    const payload = req.body || {};
    // Default customerCode to 0046 for Global Catalog if not provided
    if (!payload.customerCode) {
      payload.customerCode = '0046';
    }

    const clientAuthHeader = req.headers.authorization;
    const result = await getGlobalGeneralSearchService(payload, clientAuthHeader);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Global Catelog Controller generalSearch Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute general search',
      count: 0,
      data: [],
    });
  }
};

/**
 * Controller for Global search catalog getCart (Customer Code 0046 or 050)
 */
export const getGlobalCart = async (req, res, next) => {
  try {
    const workshopId =
      req.query.workshopId ||
      req.query.workshop_id ||
      req.body?.workshopId ||
      req.body?.workshop_id ||
      req.user?.workshopId ||
      req.user?.outlet_code ||
      req.user?.outlet?.outletCode ||
      '';

    const customerCode = req.query.customerCode || req.body?.customerCode || '0046';
    const userId = req.user?.id;

    const response = await getCartService(workshopId, userId, customerCode);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Global Catelog Controller getCart Error:', error.message);
    next(error);
  }
};

/**
 * Controller for Global search catalog addCart (Customer Code 0046 or 050)
 */
export const addGlobalCart = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const workshopId =
      payload.workshopId ||
      payload.workshop_id ||
      req.query.workshopId ||
      req.query.workshop_id ||
      req.user?.workshopId ||
      req.user?.outlet_code ||
      req.user?.outlet?.outletCode ||
      '';

    if (!payload.customerCode) {
      payload.customerCode = '0046';
    }
    payload.workshopId = workshopId;
    const userId = req.user?.id;

    const response = await addCartService(payload, userId);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Global Catelog Controller addCart Error:', error.message);
    next(error);
  }
};

export default {
  getGlobalMasterList,
  getGlobalPartsList,
  resolveVehicle,
  getVahanDetails,
  generalSearch,
  getGlobalCart,
  addGlobalCart,
};
