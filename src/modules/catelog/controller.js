import axios from 'axios';
import logger from '../../config/logger.js';
import {
  getMasterListService,
  getPartsListService,
  getCartService,
  addCartService,
  getTop20CarsService,
  createTop20CarService,
  createDirectEnquiryOrderService,
  getOrdersService,
  callOrderApi,
  resolveVehicleService,
  getVahanDetailsService,
  getLubesProductsService,
  uploadLubesProductsService,
  seedLubesProductsService,
  updateLubesProductService,
  createLubesProductService,
} from './service.js';

/**
 * Handles master list queries for Make, Model, Generation, Variant, FuelType, Year, Categories, SubCategories
 */
export const getMasterList = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const clientAuthHeader = req.headers.authorization;

    const result = await getMasterListService(payload, clientAuthHeader);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller getMasterList Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch master list',
      count: 0,
      data: [],
    });
  }
};

/**
 * Handles fetching parts list based on vehicle and category selection
 */
export const getPartsList = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const clientAuthHeader = req.headers.authorization;

    const result = await getPartsListService(payload, clientAuthHeader);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller getPartsList Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch parts list',
      count: 0,
      data: [],
    });
  }
};

/**
 * Gets cart list of selected parts based on workshopId
 */
export const getCart = async (req, res, next) => {
  try {
    const workshopId =
      req.query.workshopId ||
      req.query.workshop_id ||
      req.body?.workshopId ||
      req.body?.workshop_id ||
      req.user?.workshopId ||
      req.user?.outlet_code ||
      req.user?.outlet?.outletCode ;

    const userId = req.user?.id;

    const response = await getCartService(workshopId, userId);

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller getCart Error:', error);
    next(error);
  }
};

/**
 * Adds / Updates parts in cart based on workshopId
 */
export const addCart = async (req, res, next) => {
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

    payload.workshopId = workshopId;
    const userId = req.user?.id;

    const response = await addCartService(payload, userId);

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller addCart Error:', error);
    next(error);
  }
};

/**
 * Gets direct enquiry orders / workshop orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const outletCode = req.user?.outlet_code || req.user?.outlet?.outletCode;

    const orders = await getOrdersService(outletCode, userId);

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      count: orders ? orders.length : 0,
      data: orders,
    });
  } catch (error) {
    logger.error('Catelog Controller getOrders Error:', error);
    next(error);
  }
};

/**
 * Creates a direct enquiry order
 */
export const createDirectEnquiryOrder = async (req, res, next) => {
  try {
    const { parts, customer_code, reference_no, vehicle_no } = req.body;

    if (!Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ success: false, message: 'parts array cannot be empty' });
    }

    const userId = req.user?.id;
    const workshopId = req.user?.outlet_code || req.user?.outlet?.outletCode;

    const payload = {
      customer_code: customer_code || '050',
      parts: parts.map((p) => ({ part_no: String(p.part_no).trim(), qty: Number(p.qty) })),
      source: 'dearo',
      channel: 'B2B-API',
      reference_no: reference_no || '',
      vehicle_no: vehicle_no || '',
    };

    const response = await createDirectEnquiryOrderService(payload, userId, workshopId);

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller createDirectEnquiryOrder Error:', error.message);
    next(error);
  }
};

/**
 * Direct Enquiry Order Status
 */
export const getDirectEnquiryOrderStatus = async (req, res, next) => {
  try {
    const { enquiry_no, reference_no } = req.body;

    if (!enquiry_no && !reference_no) {
      return res.status(400).json({ success: false, message: 'enquiry_no or reference_no is required' });
    }

    const payload = {
      enquiry_no,
      reference_no,
      source: 'dearo',
    };

    const response = await callOrderApi('/psm/direct-enquiry-order/status', payload);

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller getDirectEnquiryOrderStatus Error:', error.message);
    next(error);
  }
};

/**
 * Top 20 Cars endpoints
 */
export const getTop20Cars = async (req, res, next) => {
  try {
    const clientAuthHeader = req.headers.authorization;
    const cars = await getTop20CarsService(clientAuthHeader);
    return res.status(200).json({
      success: true,
      message: 'Top 20 Cars fetched successfully',
      count: cars ? cars.length : 0,
      data: cars,
    });
  } catch (error) {
    logger.error('Catelog Controller getTop20Cars Error:', error);
    next(error);
  }
};

export const createTop20Car = async (req, res, next) => {
  try {
    const newCar = await createTop20CarService(req.body);
    return res.status(201).json({
      success: true,
      message: 'Top 20 Car added successfully',
      data: newCar,
    });
  } catch (error) {
    logger.error('Catelog Controller createTop20Car Error:', error);
    next(error);
  }
};

/**
 * Image Proxy Controller
 */
export const proxyImage = async (req, res, next) => {
  try {
    const type = req.query.type || 'Variant';
    const name = req.query.name;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Image name parameter is required' });
    }

    const storagePath = `Partsmart/PartsmartImages/PV/${type}/${name}`;
    const storageReadUrl = 'https://websprint.mytvspartsmart.in/storage-service/api/v1/storage/oci/read';
    const authHeader = 'Basic ' + Buffer.from('NR9S7kZ9DYKgiCiE:WRdFtDXfp2BLeKoO7QX523cWtSacx04b').toString('base64');

    try {
      const response = await axios.get(storageReadUrl, {
        params: { name: storagePath },
        headers: { Authorization: authHeader },
        responseType: 'stream',
      });

      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      }

      return response.data.pipe(res);
    } catch (err) {
      logger.warn('Primary image storage failed, using fallback Dearo image proxy:', err.message);
      const dearoImageUrl = `https://uatws.dearo.in/api/jobCards/partsmart/image?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`;
      const fallbackResponse = await axios.get(dearoImageUrl, { responseType: 'stream' });

      if (fallbackResponse.headers['content-type']) {
        res.setHeader('Content-Type', fallbackResponse.headers['content-type']);
      }
      return fallbackResponse.data.pipe(res);
    }
  } catch (error) {
    logger.error('Catelog proxyImage Error:', error.message);
    return res.status(404).send('Image not found');
  }
};

export const resolveVehicle = async (req, res, next) => {
  try {
    const regNo = req.body.registrationNumber || req.body.vehicleNumber || req.query.registrationNumber || req.query.vehicleNumber;
    const result = await resolveVehicleService(regNo);
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller resolveVehicle Error:', error.message);
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
    logger.error('Catelog Controller getVahanDetails Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Vahan details',
      data: null,
    });
  }
};

/**
 * Handles fetching Lubes Products (Lubricants, Brake Fluid, Coolant)
 */
export const getLubesProducts = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const clientAuthHeader = req.headers.authorization;

    const result = await getLubesProductsService(queryParams, clientAuthHeader);

    if (result && result.count !== undefined) {
      res.setHeader('X-Total-Count', result.count);
    }

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller getLubesProducts Error:', error.message);
    next(error);
  }
};

/**
 * Bulk CSV Upload of Lubes Products
 */
export const uploadLubesProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required. Use form-data field name: file' });
    }

    const userId = req.user?.id;
    const result = await uploadLubesProductsService(req.file.buffer, req.file.originalname, userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller uploadLubesProducts Error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to upload Lubes Products CSV' });
  }
};

/**
 * Bulk JSON Seed of Lubes Products
 */
export const seedLubesProducts = async (req, res, next) => {
  try {
    const payload = req.body;
    const userId = req.user?.id;

    const result = await seedLubesProductsService(payload, userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller seedLubesProducts Error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to seed Lubes Products' });
  }
};

/**
 * Single Record Update of Lubes Product
 */
export const updateLubesProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body, ...req.params };
    const userId = req.user?.id;

    const result = await updateLubesProductService(payload, userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller updateLubesProduct Error:', error.message);
    return res.status(error.statusCode || 400).json({ error: error.message || 'Failed to update Lubes Product' });
  }
};

/**
 * Single Record Creation of Lubes Product
 */
export const createLubesProduct = async (req, res, next) => {
  try {
    const payload = req.body;
    const userId = req.user?.id;

    const result = await createLubesProductService(payload, userId);

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Catelog Controller createLubesProduct Error:', error.message);
    return res.status(error.statusCode || 400).json({ error: error.message || 'Failed to create Lubes Product' });
  }
};

export default {
  getMasterList,
  getPartsList,
  getCart,
  addCart,
  getOrders,
  createDirectEnquiryOrder,
  getDirectEnquiryOrderStatus,
  getTop20Cars,
  createTop20Car,
  proxyImage,
  resolveVehicle,
  getVahanDetails,
  getLubesProducts,
  uploadLubesProducts,
  seedLubesProducts,
  updateLubesProduct,
  createLubesProduct,
};




