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
  getDirectEnquiryOrderListService,
  getDirectEnquiryOrderStatusService,
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
 * 1. Place Order (Direct Enquiry Create)
 */
export const createDirectEnquiryOrder = async (req, res, next) => {
  try {
    const clientAuthHeader =
      req.headers['x-dearo-token'] ||
      req.headers['dearo-token'] ||
      req.headers.authorization;
    const userId = req.user?.id;

    const workshopId =
      req.body.workshopId ||
      req.body.workshop_id ||
      req.query.workshopId ||
      req.user?.outlet_code ||
      req.user?.outletCode ||
      req.user?.outlet?.outletCode ||
      req.user?.workshopId ||
      req.user?.customer_account_id ||
      '';

    const customerCode =
      req.body.customer_code ||
      req.body.customerCode ||
      req.query.customer_code ||
      req.query.customerCode ||
      req.user?.customer_code ||
      req.user?.customerCode ||
      req.user?.customer_account_id ||
      '';

    const rawParts = Array.isArray(req.body.parts) ? req.body.parts : [];
    const parts = rawParts
      .filter((p) => p && (p.part_no || p.partNo || p.partNumber))
      .map((p) => ({
        part_no: String(p.part_no || p.partNo || p.partNumber).trim(),
        qty: Number(p.qty || p.quantity || 1),
      }));

    if (!customerCode || parts.length === 0) {
      return res.status(400).json({
        error: {
          statusCode: 400,
          name: 'Error',
          message: 'parts must contain at least one part, customer_code is required',
        },
      });
    }

    const payload = {
      workshopId: String(workshopId).trim(),
      customer_code: String(customerCode).trim(),
      source: req.body.source || 'GOL',
      channel: req.body.channel || 'B2B-API',
      reference_no: req.body.reference_no || req.body.referenceNo || '',
      vehicle_no: req.body.vehicle_no || req.body.vehicleNo || '',
      parts,
      dearo_token: req.body.dearo_token || req.headers['x-dearo-token'] || req.headers['dearo-token'] || null,
    };

    const response = await createDirectEnquiryOrderService(payload, userId, clientAuthHeader);

    if (response?.error) {
      return res.status(response.error.statusCode || 400).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller createDirectEnquiryOrder Error:', error.message);
    next(error);
  }
};

/**
 * 2. Order List (Direct Enquiry List)
 */
export const getDirectEnquiryOrderList = async (req, res, next) => {
  try {
    const clientAuthHeader =
      req.headers['x-dearo-token'] ||
      req.headers['dearo-token'] ||
      req.headers.authorization;
    const userId = req.user?.id;

    const workshopId =
      req.query.workshopId ||
      req.body.workshopId ||
      req.user?.outlet_code ||
      req.user?.outletCode ||
      req.user?.outlet?.outletCode ||
      req.user?.workshopId ||
      req.user?.customer_account_id ||
      '';

    const response = await getDirectEnquiryOrderListService(workshopId, clientAuthHeader, userId);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Catelog Controller getDirectEnquiryOrderList Error:', error.message);
    next(error);
  }
};

/**
 * 3. Order Status (Real-time Enquiry Tracking)
 */
export const getDirectEnquiryOrderStatus = async (req, res, next) => {
  try {
    const clientAuthHeader =
      req.headers['x-dearo-token'] ||
      req.headers['dearo-token'] ||
      req.headers.authorization;
    const enquiryNo = req.body.enquiry_no || req.body.enquiryNo;
    const referenceNo = req.body.reference_no || req.body.referenceNo;
    const source = req.body.source || 'GOL';

    if (!enquiryNo && !referenceNo) {
      return res.status(400).json({
        error: {
          statusCode: 400,
          name: 'Error',
          message: 'enquiry_no or reference_no is required',
        },
      });
    }

    const payload = {
      enquiry_no: enquiryNo,
      reference_no: referenceNo,
      source,
      dearo_token: req.body.dearo_token || req.headers['x-dearo-token'] || req.headers['dearo-token'] || null,
    };

    const response = await getDirectEnquiryOrderStatusService(payload, clientAuthHeader);

    if (response?.error) {
      return res.status(response.error.statusCode || 400).json(response);
    }

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

      const isProd = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
      const primaryDearoUrl = isProd
        ? `https://api.dearo.in/api/jobCards/partsmart/image?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`
        : `https://uatws.dearo.in/api/jobCards/partsmart/image?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`;

      const secondaryDearoUrl = isProd
        ? `https://uatws.dearo.in/api/jobCards/partsmart/image?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`
        : `https://api.dearo.in/api/jobCards/partsmart/image?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`;

      try {
        const fallbackResponse = await axios.get(primaryDearoUrl, { responseType: 'stream', timeout: 10000 });
        if (fallbackResponse.headers['content-type']) {
          res.setHeader('Content-Type', fallbackResponse.headers['content-type']);
        }
        return fallbackResponse.data.pipe(res);
      } catch (fallbackErr1) {
        logger.warn('Primary Dearo image proxy fallback failed, trying secondary Dearo URL:', fallbackErr1.message);
        const fallbackResponse2 = await axios.get(secondaryDearoUrl, { responseType: 'stream', timeout: 10000 });
        if (fallbackResponse2.headers['content-type']) {
          res.setHeader('Content-Type', fallbackResponse2.headers['content-type']);
        }
        return fallbackResponse2.data.pipe(res);
      }
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
    const file = req.file || (Array.isArray(req.files) && req.files.length > 0 ? req.files[0] : null);
    if (!file) {
      return res.status(400).json({ error: 'File is required. Upload a .csv or .xlsx file using form-data.' });
    }

    const userId = req.user?.id;
    const result = await uploadLubesProductsService(file.buffer, file.originalname, userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Catelog Controller uploadLubesProducts Error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to upload Lubes Products file' });
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
  getDirectEnquiryOrderList,
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




