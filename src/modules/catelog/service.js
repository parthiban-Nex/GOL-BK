import axios from 'axios';
import ExcelJS from 'exceljs';
import logger from '../../config/logger.js';
import db from '../index.js';
import { prepareCartResponse } from './cartCalculator.js';

// Partsmart Catalog Config
const API_BASE_URL = 'https://websprint.mytvspartsmart.in/catalog/api/v1/external/';
const API_USERNAME = 'Z5Qnpqcd6D4LpfXNjmum';
const API_PASSWORD = 'cFkH4BJh5gtvCt5mKPN4CLc74QNv4MmTXZ7RArJr3iwP4NpWLBHUQbAyfJxH';

const DEARO_API_BASE_URL = 'https://api.dearo.in/api/jobCards/partsmart/';
const UAT_DEARO_API_BASE_URL = 'https://uatws.dearo.in/api/jobCards/partsmart/';

// Partsmart Direct Order Service Config
const ORDER_BASE_URL = 'https://uat-websprint.mytvspartsmart.in/backend/api/v1';
const ORDER_USERNAME = '8508094402';
const ORDER_PASSWORD = 'Tvs@123';

// In-Memory Order Token Cache
let cachedOrderToken = null;
let cachedTokenExpiresAt = null;

const getPublicApiBaseUrl = () => {
  if (process.env.PUBLIC_API_BASE_URL) {
    return process.env.PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  return '/api';
};

const getBasicAuthHeader = () => {
  return 'Basic ' + Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
};

const decodeJwtExpiry = (token) => {
  try {
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) return null;
    const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch (err) {
    return null;
  }
};

const formatArrayField = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) {
    const filtered = val.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
    return filtered.length > 0 ? filtered : null;
  }
  return String(val).trim() !== '' ? [val] : null;
};

const enrichMasterListResponse = (responseData, payload) => {
  if (!responseData) return responseData;

  if (payload?.masterType === 'vehicleGeneration' && Array.isArray(responseData?.data)) {
    const publicBaseUrl = getPublicApiBaseUrl();

    responseData.data = responseData.data.map((item) => {
      const masterName = item && item.masterName ? String(item.masterName).trim() : '';

      // Normalize filename: replace slashes / with hyphens - and append .png
      const imageName = masterName ? masterName.replace(/\//g, '-') + '.png' : '';

      // Generate proxy image URL supporting both UAT and Production environments dynamically via GOL Backend proxy
      let imageUrl = null;
      if (item?.url && typeof item.url === 'string') {
        imageUrl = item.url.replace(/^https?:\/\/(api|uatws)\.dearo\.in\/api/i, publicBaseUrl);
      } else if (imageName) {
        imageUrl = `${publicBaseUrl}/jobCards/partsmart/image?type=Variant&name=${encodeURIComponent(imageName)}`;
      }

      return {
        masterName,
        url: imageUrl,
      };
    });
    responseData.count = responseData.data.length;
  }

  return responseData;
};

/**
 * Call Partsmart / Dearo External Master List API
 */
export const getMasterListService = async (payload, clientAuthHeader = null) => {
  const rawGeneration =
    payload?.vehicleGeneration ||
    payload?.generation ||
    payload?.generations ||
    payload?.vehicleGenerations ||
    payload?.vehicle_generation;

  const initialCustomerCode = payload?.customerCode || '050';
  const alternateCustomerCode = initialCustomerCode === '050' ? '0046' : '050';

  const basePayload = {
    customerCode: formatArrayField(payload?.customerCode || payload?.customerCodes || payload?.customerCodes),
    aggregate: formatArrayField(payload?.aggregate || payload?.category || payload?.categories || payload?.aggregates),
    brand: formatArrayField(payload?.brand || payload?.brands || payload?.brandName || payload?.brandsName),
    fuelType: formatArrayField(payload?.fuelType),
    limit: payload?.limit !== undefined ? payload.limit : 0,
    make: formatArrayField(payload?.make || payload?.makes || payload?.makeName || payload?.makesName),
    masterType: payload?.masterType || 'make',
    model: formatArrayField(payload?.model || payload?.models || payload?.modelName || payload?.modelsName),
    offset: payload?.offset !== undefined ? payload.offset : 0,
    partNumber: payload?.partNumber ? String(payload.partNumber).trim() : null,
    primary: payload?.primary !== undefined ? payload.primary : false,
    sortOrder: payload?.sortOrder || 'ASC',
    subAggregate: formatArrayField(payload?.subAggregate || payload?.subCategory || payload?.subCategories || payload?.subAggregates),
    variant: formatArrayField(payload?.variant),
    year: formatArrayField(payload?.year),
  };

  const genArray = formatArrayField(rawGeneration);
  const genString = rawGeneration
    ? String(Array.isArray(rawGeneration) ? rawGeneration[0] : rawGeneration).trim()
    : null;

  // Build generation candidate representations: array, string, and null (fallback to maintain previous working flow)
  const candidateGenerations = [];
  if (genArray) {
    candidateGenerations.push({ val: genArray, isFallback: false });
    candidateGenerations.push({ val: genString, isFallback: false });
    // Safety fallback to model variants so the UI is never broken if external API lacks generation-partitioned variants
    candidateGenerations.push({ val: null, isFallback: true });
  } else {
    candidateGenerations.push({ val: null, isFallback: false });
  }

  const customerCodes = [initialCustomerCode, alternateCustomerCode];

  // Try 1: External Partsmart API with Basic Auth
  for (const genCandidate of candidateGenerations) {
    for (const cCode of customerCodes) {
      const requestPayload = {
        ...basePayload,
        customerCode: cCode,
        vehicleGeneration: genCandidate.val,
      };

      try {
        const response = await axios.post(
          `${API_BASE_URL}getMasterList`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: getBasicAuthHeader(),
            },
            timeout: 15000,
          }
        );

        if (response.data && response.data.success !== false) {
          const list = Array.isArray(response.data.data) ? response.data.data : [];
          if (list.length > 0) {
            // If this was a fallback without generation, attempt to filter matching variants by generation name if present
            if (genCandidate.isFallback && genString && basePayload.masterType === 'variant') {
              const searchUpper = genString.toUpperCase();
              const matched = list.filter((item) => {
                const name = String(item?.masterName || '').toUpperCase();
                const itemGen = String(item?.vehicleGeneration || item?.generation || '').toUpperCase();
                return itemGen === searchUpper || (searchUpper && name.includes(searchUpper));
              });
              if (matched.length > 0) {
                response.data.data = matched;
                response.data.count = matched.length;
              }
            }
            return enrichMasterListResponse(response.data, requestPayload);
          }
        }
      } catch (err) {
        // Try next candidate
      }
    }
  }

  const finalFallbackPayload = {
    ...basePayload,
    customerCode: initialCustomerCode,
    vehicleGeneration: genString || (genArray ? genArray[0] : null),
  };

  // Try 2: Live Dearo Endpoint with client Authorization header
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (clientAuthHeader) headers['Authorization'] = clientAuthHeader;

    const response = await axios.post(
      `${DEARO_API_BASE_URL}getMasterList`,
      finalFallbackPayload,
      { headers, timeout: 15000 }
    );
    if (response.data && response.data.success !== false) {
      return enrichMasterListResponse(response.data, finalFallbackPayload);
    }
  } catch (err) {
    logger.warn('Dearo Catalog API getMasterList error:', err.response?.data?.message || err.message);
  }

  // Try 3: UAT Dearo Endpoint
  try {
    const response = await axios.post(
      `${UAT_DEARO_API_BASE_URL}getMasterList`,
      finalFallbackPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) {
      return enrichMasterListResponse(response.data, finalFallbackPayload);
    }
  } catch (err) {
    logger.warn('UAT Dearo Catalog API getMasterList error:', err.response?.data?.message || err.message);
  }

  return {
    success: false,
    message: 'Failed to fetch catalog master list from external API',
    count: 0,
    data: [],
  };
};

/**
 * Call Partsmart / Dearo External Parts List API
 */
export const getPartsListService = async (payload, clientAuthHeader = null) => {
  const rawGeneration =
    payload?.vehicleGeneration ||
    payload?.generation ||
    payload?.generations ||
    payload?.vehicleGenerations ||
    payload?.vehicle_generation;

  const initialCustomerCode = payload?.customerCode || '050';
  const alternateCustomerCode = initialCustomerCode === '050' ? '0046' : '050';

  const basePayload = {
    customerCode: formatArrayField(payload?.customerCode || payload?.customerCodes || payload?.customerCodes),
    aggregate: formatArrayField(payload?.aggregate || payload?.category || payload?.categories || payload?.aggregates),
    brand: formatArrayField(payload?.brand || payload?.brands || payload?.brandName || payload?.brandsName),
    fieldOrder: payload?.fieldOrder || null,
    fuelType: formatArrayField(payload?.fuelType),
    limit: payload?.limit !== undefined && payload?.limit !== null ? Number(payload.limit) : 0,
    make: formatArrayField(payload?.make || payload?.makes || payload?.makeName || payload?.makesName),
    model: formatArrayField(payload?.model || payload?.models || payload?.modelName || payload?.modelsName),
    offset: payload?.offset !== undefined && payload?.offset !== null ? Number(payload.offset) : 0,
    partNumber: payload?.partNumber ? String(payload.partNumber).trim() : null,
    primary: payload?.primary !== undefined ? payload.primary : false,
    sortOrder: payload?.sortOrder || 'ASC',
    subAggregate: formatArrayField(payload?.subAggregate || payload?.subCategory || payload?.subCategories || payload?.subAggregates),
    variant: formatArrayField(payload?.variant),
    year: formatArrayField(payload?.year),
  };

  const genArray = formatArrayField(rawGeneration);
  const genString = rawGeneration
    ? String(Array.isArray(rawGeneration) ? rawGeneration[0] : rawGeneration).trim()
    : null;

  const candidateGenerations = [];
  if (genArray) {
    candidateGenerations.push(genArray);
    candidateGenerations.push(genString);
    candidateGenerations.push(null);
  } else {
    candidateGenerations.push(null);
  }

  const customerCodes = [initialCustomerCode, alternateCustomerCode];

  // Try 1: External Partsmart API with Basic Auth
  for (const genVal of candidateGenerations) {
    for (const cCode of customerCodes) {
      const requestPayload = {
        ...basePayload,
        customerCode: cCode,
        vehicleGeneration: genVal,
      };

      try {
        const response = await axios.post(
          `${API_BASE_URL}getPartsList`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: getBasicAuthHeader(),
            },
            timeout: 15000,
          }
        );
        if (response.data && response.data.success !== false) {
          const list = Array.isArray(response.data.data) ? response.data.data : [];
          if (list.length > 0) return response.data;
        }
      } catch (err) {
        // Try next candidate
      }
    }
  }

  const finalFallbackPayload = {
    ...basePayload,
    customerCode: initialCustomerCode,
    vehicleGeneration: genString || (genArray ? genArray[0] : null),
  };

  // Try 2: Live Dearo Endpoint with client Authorization header
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (clientAuthHeader) headers['Authorization'] = clientAuthHeader;

    const response = await axios.post(
      `${DEARO_API_BASE_URL}getPartsList`,
      finalFallbackPayload,
      { headers, timeout: 15000 }
    );
    if (response.data && response.data.success !== false) return response.data;
  } catch (err) {
    logger.warn('Dearo getPartsList error:', err.response?.data?.message || err.message);
  }

  // Try 3: UAT Dearo Endpoint
  try {
    const response = await axios.post(
      `${UAT_DEARO_API_BASE_URL}getPartsList`,
      finalFallbackPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) return response.data;
  } catch (err) {
    logger.warn('UAT Dearo getPartsList error:', err.response?.data?.message || err.message);
  }

  return {
    success: false,
    message: 'Failed to fetch parts list from external API',
    count: 0,
    data: [],
  };
};

/**
 * Get Cart Items from database for specific workshopId
 */
export const getCartService = async (workshopId, userId = null) => {
  try {
    const PartCart = db.partCarts;
    const Cart = db.carts;
    const wId = workshopId ? String(workshopId).trim() : '';

    let selectedParts = [];
    let compareParts = [];
    let partsList = [];

    // 1. First check part_carts (JSON structure)
    let cartRecord = null;
    if (PartCart && PartCart.findOne) {
      const whereCondition = { status: 'ACTIVE' };
      if (wId) {
        whereCondition[db.Sequelize.Op.or] = [{ workshopId: wId }, { userId: String(userId || '') }];
      } else if (userId) {
        whereCondition.userId = String(userId);
      }
      cartRecord = await PartCart.findOne({ where: whereCondition, order: [['updatedAt', 'DESC']] });
    }

    if (cartRecord && cartRecord.cart) {
      selectedParts = Array.isArray(cartRecord.cart.selected) ? cartRecord.cart.selected : [];
      compareParts = Array.isArray(cartRecord.cart.compare) ? cartRecord.cart.compare : [];
      partsList = Array.isArray(cartRecord.cart.parts) ? cartRecord.cart.parts : [];
    }

    // 2. Fallback: check carts table (relational rows) and convert to live format
    if (selectedParts.length === 0 && Cart && Cart.findAll) {
      const whereCondition = { status: 1 };
      if (wId) {
        whereCondition[db.Sequelize.Op.or] = [{ outletCode: wId }, { user_id: userId }];
      } else if (userId) {
        whereCondition.user_id = userId;
      }
      const cartRows = await Cart.findAll({ where: whereCondition, order: [['createdAt', 'DESC']] });

      selectedParts = cartRows.map((row) => ({
        customerCode: '0046',
        quantity: Number(row.qty || 1),
        brandName: row.product_brand || '',
        itemDescription: row.part_desc || '',
        partNumber: row.part_number,
        mrp: Number(row.part_mrp || 0),
        saleRate: Number(row.list_price || row.part_mrp || 0),
        listPrice: Number(row.list_price || row.part_mrp || 0),
        taxpercent: Number(row.tax || 18),
        aggregate: '',
        subAggregate: '',
      }));
    }

    const rawCart = { selected: selectedParts, compare: compareParts, parts: partsList };
    const calculatedCart = prepareCartResponse(rawCart);

    return {
      success: true,
      type: 'WORKSHOP',
      workshopId: wId || String(userId || ''),
      cart: calculatedCart,
    };
  } catch (error) {
    logger.error('Error in getCartService:', error);
    const wId = workshopId ? String(workshopId).trim() : '';
    return {
      success: true,
      type: 'WORKSHOP',
      workshopId: wId || String(userId || ''),
      cart: prepareCartResponse({ selected: [], compare: [], parts: [] }),
    };
  }
};

/**
 * Add / Update Cart for specific workshopId
 */
export const addCartService = async (payload, userId = null) => {
  try {
    const PartCart = db.partCarts || db.carts;
    const wId = payload.workshopId
      ? String(payload.workshopId).trim()
      : payload.workshop_id
      ? String(payload.workshop_id).trim()
      : '';

    let incomingCart = payload.cart || {};
    if (!incomingCart.selected && Array.isArray(payload.selected)) {
      incomingCart.selected = payload.selected;
      incomingCart.compare = payload.compare || [];
      incomingCart.parts = payload.parts || [];
    }

    let cartRecord = null;
    if (PartCart && PartCart.findOne) {
      cartRecord = await PartCart.findOne({
        where: { workshopId: wId, status: 'ACTIVE' },
      });
    }

    let updatedCartObj;
    if (cartRecord) {
      updatedCartObj = {
        selected: Array.isArray(incomingCart.selected) ? incomingCart.selected : cartRecord.cart?.selected || [],
        compare: Array.isArray(incomingCart.compare) ? incomingCart.compare : cartRecord.cart?.compare || [],
        parts: Array.isArray(incomingCart.parts) ? incomingCart.parts : cartRecord.cart?.parts || [],
      };
      cartRecord.cart = updatedCartObj;
      if (userId) cartRecord.updatedBy = String(userId);
      await cartRecord.save();
    } else if (PartCart && PartCart.create) {
      updatedCartObj = {
        selected: Array.isArray(incomingCart.selected) ? incomingCart.selected : [],
        compare: Array.isArray(incomingCart.compare) ? incomingCart.compare : [],
        parts: Array.isArray(incomingCart.parts) ? incomingCart.parts : [],
      };
      cartRecord = await PartCart.create({
        workshopId: wId,
        userId: userId ? String(userId) : '',
        cart: updatedCartObj,
        status: 'ACTIVE',
        createdBy: userId ? String(userId) : '',
        updatedBy: userId ? String(userId) : '',
      });
    } else {
      updatedCartObj = {
        selected: Array.isArray(incomingCart.selected) ? incomingCart.selected : [],
        compare: Array.isArray(incomingCart.compare) ? incomingCart.compare : [],
        parts: Array.isArray(incomingCart.parts) ? incomingCart.parts : [],
      };
    }

    return {
      message: 'Cart updated successfully',
      cart: {
        selected: updatedCartObj.selected,
        compare: updatedCartObj.compare,
      },
    };
  } catch (error) {
    logger.error('Error in addCartService:', error);
    throw error;
  }
};

/**
 * Top 20 Cars Services (Fetches makes dynamically via getMasterList)
 */
export const getTop20CarsService = async (clientAuthHeader = null) => {
  const result = await getMasterListService({ masterType: 'make', customerCode: '050' }, clientAuthHeader);
  return result?.data || [];
};

export const createTop20CarService = async (data) => {
  return data;
};

/**
 * Direct Order Enquiry JWT Token Authentication with In-Memory Caching (Partsmart B2B)
 */
export const getOrderToken = async (forceLogin = false) => {
  const now = new Date();
  const isTokenValid =
    cachedOrderToken &&
    cachedTokenExpiresAt &&
    cachedTokenExpiresAt.getTime() > now.getTime() + 60000;

  if (!forceLogin && isTokenValid) {
    return cachedOrderToken;
  }

  const response = await axios.post(
    `${ORDER_BASE_URL}/auth/login`,
    {
      username: ORDER_USERNAME,
      password: ORDER_PASSWORD,
    },
    {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  const token =
    response.data?.data?.token ||
    response.data?.token ||
    response.data?.access_token ||
    response.data?.data?.access_token;

  if (!token) throw new Error('Partsmart order token not found in response');

  cachedOrderToken = token;
  cachedTokenExpiresAt = decodeJwtExpiry(token) || new Date(Date.now() + 30 * 60 * 1000);

  return cachedOrderToken;
};

export const callPartsmartDirectOrderApi = async (endpoint, payload, method = 'post') => {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  const executeRequest = async (token) => {
    const options = {
      method: method.toLowerCase(),
      url: `${ORDER_BASE_URL}${formattedEndpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };

    if (options.method === 'get') options.params = payload || {};
    else options.data = payload || {};

    return axios(options);
  };

  try {
    const token = await getOrderToken(false);
    const res = await executeRequest(token);
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      cachedOrderToken = null;
      cachedTokenExpiresAt = null;
      const newToken = await getOrderToken(true);
      const retryRes = await executeRequest(newToken);
      return retryRes.data;
    }
    throw err;
  }
};

/**
 * DearO Direct Enquiry API Integration
 *
 * Environment Endpoints:
 * - Live: https://api.dearo.in/api/jobCards/partsmart/order/direct-enquiry/...
 * - UAT:  https://uatws.dearo.in/api/jobCards/partsmart/order/direct-enquiry/...
 */
const normalizeDearoBase = (url, fallback) => {
  if (!url) return fallback;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  return trimmed.replace(/\/jobCards\/partsmart\/?$/, '');
};

const LIVE_DEARO_BASE = normalizeDearoBase(
  process.env.DEARO_API_URL || process.env.DEARO_API_BASE_URL,
  'https://api.dearo.in/api'
);
const UAT_DEARO_BASE = normalizeDearoBase(
  process.env.UAT_DEARO_API_URL || process.env.UAT_DEARO_API_BASE_URL,
  'https://uatws.dearo.in/api'
);

export const callDearoDirectEnquiryApi = async (
  endpoint,
  payload = {},
  method = 'POST',
  clientAuthHeader = null,
  dearoTokenOverride = null
) => {
  let cleanEndpoint = String(endpoint || '').trim();
  if (!cleanEndpoint.startsWith('/')) cleanEndpoint = `/${cleanEndpoint}`;
  if (!cleanEndpoint.startsWith('/jobCards/partsmart')) {
    cleanEndpoint = `/jobCards/partsmart${cleanEndpoint}`;
  }

  // Determine DearO token:
  // 1. Explicit override passed in
  // 2. process.env.DEARO_ACCESS_TOKEN
  // 3. Client auth header if it is an opaque DearO token (not starting with 'Bearer ey')
  let dearoToken =
    dearoTokenOverride ||
    process.env.DEARO_ACCESS_TOKEN ||
    process.env.DEARO_TOKEN ||
    null;

  if (!dearoToken && clientAuthHeader) {
    const trimmed = String(clientAuthHeader).trim();
    if (!trimmed.startsWith('Bearer ey') && !trimmed.startsWith('ey')) {
      dearoToken = trimmed.replace(/^Bearer\s+/i, '');
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  if (dearoToken) {
    headers['Authorization'] = dearoToken;
  }

  const isLive = process.env.NODE_ENV === 'production' || process.env.USE_LIVE_DEARO === 'true';
  const primaryBase = isLive ? LIVE_DEARO_BASE : UAT_DEARO_BASE;
  const secondaryBase = isLive ? UAT_DEARO_BASE : LIVE_DEARO_BASE;

  const tryRequest = async (baseUrl) => {
    const url = `${baseUrl}${cleanEndpoint}`;
    const options = {
      method: method.toUpperCase(),
      url,
      headers: { ...headers },
      timeout: 30000,
    };

    if (options.method === 'GET') {
      options.params = { ...(payload || {}) };
    } else {
      options.data = payload;
      options.params = {};
    }

    if (dearoToken && !options.params.access_token) {
      options.params.access_token = dearoToken;
    }

    const response = await axios(options);
    return response.data;
  };

  const formatErr = (err) => {
    const status = err.response?.status || 'NO_STATUS';
    const data = err.response?.data;
    const msg = data?.error?.message || data?.message || err.message;
    return `Status ${status} - ${msg} | Details: ${JSON.stringify(data || {})}`;
  };

  try {
    return await tryRequest(primaryBase);
  } catch (primaryErr) {
    logger.warn(
      `DearO Direct Enquiry Primary API (${primaryBase}${cleanEndpoint}) error: ${formatErr(primaryErr)} | Payload: ${JSON.stringify(payload)}`
    );

    try {
      return await tryRequest(secondaryBase);
    } catch (secondaryErr) {
      logger.warn(
        `DearO Direct Enquiry Secondary API (${secondaryBase}${cleanEndpoint}) error: ${formatErr(secondaryErr)} | Payload: ${JSON.stringify(payload)}`
      );

      throw secondaryErr;
    }
  }
};

/**
 * 1. Place Order (Direct Enquiry Create)
 */
export const createDirectEnquiryOrderService = async (payload, userId = null, clientAuthHeader = null) => {
  let workshopId = String(payload.workshopId || payload.workshop_id || '').trim();
  let customerCode = String(payload.customer_code || payload.customerCode || '').trim();

  // If workshopId or customerCode is missing, lookup from database user profile
    if (!customerCode || customerCode === '050' || customerCode === '0046') {
    if (userId) {
      try {
        const userRecord = await db.users.findOne({ where: { id: userId } });
        if (userRecord?.customer_account_id && userRecord.customer_account_id !== 'KAHD') {
          customerCode = String(userRecord.customer_account_id).trim();
        }
      } catch (uErr) {
        logger.warn(`Direct Enquiry user lookup error: ${uErr.message}`);
      }
    }
    if (!customerCode || customerCode === '050' || customerCode === '0046') {
      customerCode = 'NMSA0786';
    }
  }

  if (!customerCode) {
    return {
      error: {
        statusCode: 400,
        name: 'Error',
        message: 'customer_code is required',
      },
    };
  }

  const rawParts = Array.isArray(payload.parts) ? payload.parts : [];
  const parts = rawParts
    .filter((p) => p && (p.part_no || p.partNo || p.partNumber))
    .map((p) => ({
      part_no: String(p.part_no || p.partNo || p.partNumber).trim(),
      qty: Number(p.qty || p.quantity || 1),
    }));

  if (parts.length === 0) {
    return {
      error: {
        statusCode: 400,
        name: 'Error',
        message: 'parts must contain at least one part, customer_code is required',
      },
    };
  }

  const requestPayload = {
    workshopId,
    customer_code: customerCode,
    source: payload.source || 'GOL',
    channel: payload.channel || 'B2B-API',
    reference_no: payload.reference_no || payload.referenceNo || '',
    vehicle_no: payload.vehicle_no || payload.vehicleNo || '',
    parts,
  };

  let response = null;

  // 1. First attempt: DearO Direct Enquiry endpoint
  try {
    response = await callDearoDirectEnquiryApi(
      '/jobCards/partsmart/order/direct-enquiry/create',
      requestPayload,
      'POST',
      clientAuthHeader,
      payload.dearo_token || payload.dearoToken
    );
  } catch (dearoErr) {
    logger.warn('DearO API call failed, falling back to Partsmart Direct Order API:', dearoErr.message);
  }

  // 2. Second attempt: Fallback to upstream Partsmart Direct Order API
  if (!response?.success || !response?.enquiry_no) {
    try {
      logger.info('Calling Partsmart Direct Order API directly (/psm/direct-enquiry-order/create)...');
      const psmResponse = await callPartsmartDirectOrderApi(
        '/psm/direct-enquiry-order/create',
        requestPayload,
        'POST'
      );
      if (psmResponse?.success && (psmResponse?.enquiry_no || psmResponse?.data?.enquiry_no)) {
        response = {
          success: true,
          enquiry_no: psmResponse?.enquiry_no || psmResponse?.data?.enquiry_no,
          stored: true,
          workshopId,
          orderCreationDate: new Date().toISOString(),
          ...psmResponse,
        };
      } else if (psmResponse) {
        response = psmResponse;
      }
    } catch (psmErr) {
      logger.error('Partsmart Direct Order API error:', psmErr.response?.data || psmErr.message);
      if (!response) {
        return {
          error: {
            statusCode: psmErr.response?.status || 500,
            name: 'Error',
            message: psmErr.response?.data?.message || psmErr.message || 'Failed to create order enquiry',
          },
        };
      }
    }
  }

  const enquiryNo = response?.enquiry_no || response?.enquiryNo || response?.data?.enquiry_no;
  if (response?.success && enquiryNo && db.partsmartOrderEnquiries) {
    try {
      await db.partsmartOrderEnquiries.create({
        enquiryNo,
        workshopId,
        customerCode,
        referenceNo: requestPayload.reference_no,
        source: requestPayload.source,
        channel: requestPayload.channel,
        vehicleNo: requestPayload.vehicle_no,
        parts,
        status: 'PROCESSING',
        message: 'Order enquiry accepted and processing',
        createResponse: response,
        createdBy: userId ? String(userId) : '',
      });
    } catch (dbErr) {
      logger.warn('Failed to store direct enquiry order in local db:', dbErr.message);
    }
  }

  return response;
};

/**
 * 2. Order List (Direct Enquiry List)
 */
export const getDirectEnquiryOrderListService = async (workshopId, clientAuthHeader = null, userId = null) => {
  const wId = workshopId ? String(workshopId).trim() : '';
  const queryParams = wId ? { workshopId: wId } : {};

  let upstreamResponse = null;
  try {
    upstreamResponse = await callDearoDirectEnquiryApi(
      '/jobCards/partsmart/order/direct-enquiry/list',
      queryParams,
      'GET',
      clientAuthHeader
    );
  } catch (err) {
    logger.warn('Direct enquiry list API error, falling back to local database:', err.message);
  }

  if (upstreamResponse?.success && Array.isArray(upstreamResponse?.data) && upstreamResponse.data.length > 0) {
    return upstreamResponse;
  }

  // Fallback to local DB records
  if (db.partsmartOrderEnquiries) {
    const whereClause = {};
    if (wId) whereClause.workshopId = wId;
    else if (userId) whereClause.createdBy = String(userId);

    const localRecords = await db.partsmartOrderEnquiries.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    const formattedData = localRecords.map((r) => ({
      id: r.id,
      enquiryNo: r.enquiryNo,
      workshopId: r.workshopId,
      customerCode: r.customerCode,
      referenceNo: r.referenceNo,
      source: r.source || 'GOL',
      channel: r.channel || 'B2B-API',
      vehicleNo: r.vehicleNo,
      parts: r.parts || [],
      status: r.status || 'PROCESSING',
      message: r.message || 'Order enquiry accepted and processing',
      orderNos: r.orderNos || [],
      partnerOrders: [],
      createResponse: r.createResponse || { success: true, enquiry_no: r.enquiryNo },
      orderCreationDate: r.createdAt,
      createdBy: r.createdBy,
      createdOn: r.createdAt,
      updatedOn: r.updatedAt,
    }));

    return {
      success: true,
      type: 'WORKSHOP',
      count: formattedData.length,
      workshopId: wId,
      data: formattedData,
    };
  }

  return upstreamResponse || {
    success: true,
    type: 'WORKSHOP',
    count: 0,
    workshopId: wId,
    data: [],
  };
};

/**
 * 3. Order Status (Real-time Enquiry Tracking)
 */
export const getDirectEnquiryOrderStatusService = async (payload, clientAuthHeader = null) => {
  const enquiryNo = payload.enquiry_no || payload.enquiryNo;
  const referenceNo = payload.reference_no || payload.referenceNo;
  const source = payload.source || 'GOL';

  if (!enquiryNo && !referenceNo) {
    return {
      error: {
        statusCode: 400,
        name: 'Error',
        message: 'enquiry_no or reference_no is required',
      },
    };
  }

  const requestPayload = {};
  if (enquiryNo) requestPayload.enquiry_no = enquiryNo;
  if (referenceNo) {
    requestPayload.reference_no = referenceNo;
    requestPayload.source = source;
  }

  let response = null;
  try {
    response = await callDearoDirectEnquiryApi(
      '/jobCards/partsmart/order/direct-enquiry/status',
      requestPayload,
      'POST',
      clientAuthHeader,
      payload.dearo_token || payload.dearoToken
    );
  } catch (dearoErr) {
    logger.warn('DearO status API failed, falling back to Partsmart Direct Order Status API:', dearoErr.message);
  }

  if (!response?.success) {
    try {
      response = await callPartsmartDirectOrderApi(
        '/psm/direct-enquiry-order/status',
        requestPayload,
        'POST'
      );
    } catch (psmErr) {
      logger.error('Partsmart Direct Order status error:', psmErr.response?.data || psmErr.message);
    }
  }

  // Update status in local database if present
  if (response?.success && response?.enquiry_no && db.partsmartOrderEnquiries) {
    try {
      await db.partsmartOrderEnquiries.update(
        {
          status: response.status || 'PROCESSING',
          message: response.message || null,
          orderNos: response.order_nos || response.orderNos || [],
        },
        {
          where: { enquiryNo: response.enquiry_no },
        }
      );
    } catch (dbErr) {
      logger.warn('Failed to update direct enquiry order status in local db:', dbErr.message);
    }
  }

  return response;
};

export const getOrdersService = async (workshopId, userId) => {
  return await getDirectEnquiryOrderListService(workshopId, null, userId);
};

export const callOrderApi = async (endpoint, payload, method = 'post') => {
  return await callPartsmartDirectOrderApi(endpoint, payload, method);
};

/**
 * Partsmart Vehicle Resolve / Vahan Lookup for Catalog Filters
 */
export const resolveVehicleService = async (registrationNumber) => {
  const regNo = String(registrationNumber || '').trim().toUpperCase();
  if (!regNo) {
    return {
      success: false,
      message: 'Registration number is required',
      data: [],
    };
  }

  // 1. Try Partsmart /external/vehicleResolve API with Basic Auth
  try {
    const response = await axios.post(
      `${API_BASE_URL}vehicleResolve`,
      { vehicleNumber: regNo },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: getBasicAuthHeader(),
        },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) {
      return response.data;
    }
  } catch (err) {
    logger.warn('Partsmart vehicleResolve error:', err.response?.data || err.message);
  }

  // 2. Try Live Dearo Endpoint
  try {
    const response = await axios.post(
      `${DEARO_API_BASE_URL}vehicleResolve`,
      { vehicleNumber: regNo, registrationNumber: regNo },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) {
      return response.data;
    }
  } catch (err) {
    logger.warn('Dearo vehicleResolve error:', err.response?.data || err.message);
  }

  // 3. Fallback: MyTVS Valuation API
  try {
    const valResponse = await axios.post(
      'https://valuation.mytvs.in/api/v1/common/vehicle-validate-number',
      { vehicleNumber: regNo },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (valResponse.data && valResponse.data.result) {
      const result = valResponse.data.result;
      return {
        success: true,
        message: 'Vehicle resolved successfully',
        data: [
          {
            make: result.manufacturer || result.make || '',
            model: result.manufacturer_model || result.model || '',
            variant: result.variant || '',
            fuelType: result.fuel_type || result.fuelType || '',
            year: result.registration_date ? new Date(result.registration_date).getFullYear() : '',
            vehicleGeneration: result.vehicle_generation || null,
          },
        ],
      };
    }
  } catch (err) {
    logger.warn('MyTVS Valuation vehicle-validate-number error:', err.response?.data || err.message);
  }

  return {
    success: false,
    message: 'Failed to resolve vehicle details for registration number',
    data: [],
  };
};

/**
 * Full MyTVS Valuation Vahan Lookup (RTO Data)
 */
export const getVahanDetailsService = async (registrationNumber, clientAuthHeader = null) => {
  const regNo = String(registrationNumber || '').trim().toUpperCase();
  if (!regNo) {
    return {
      success: false,
      message: 'Registration number is required',
      data: null,
    };
  }

  // 1. Try Live Dearo VahanDetails Endpoint
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (clientAuthHeader) headers['Authorization'] = clientAuthHeader;

    const response = await axios.get(
      'https://api.dearo.in/api/VahanDetails/getVahanDetails',
      {
        params: { registrationNumber: regNo },
        headers,
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) {
      return response.data;
    }
  } catch (err) {
    logger.warn('Dearo VahanDetails API error:', err.response?.data || err.message);
  }

  // 2. Try MyTVS Valuation API
  try {
    const apiResponse = await axios.post(
      'https://valuation.mytvs.in/api/v1/common/vehicle-validate-number',
      { vehicleNumber: regNo },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Origin': 'https://ws.dearo.in',
          'Referer': 'https://ws.dearo.in/',
        },
        timeout: 20000,
      }
    );

    if (apiResponse.data && (apiResponse.data.success || apiResponse.data.result)) {
      return apiResponse.data;
    }
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;
    logger.error('MyTVS Valuation Vahan API Error:', typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
  }

  return {
    success: false,
    message: 'Failed to fetch Vahan details',
    data: null,
  };
};

/**
 * Normalizes Lube Product Types
 */
const normalizeLubeType = (rawType) => {
  if (!rawType) return 'LUBRICANTS';
  const val = rawType.toString().trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
  if (['LUBRICANT', 'LUBRICANTS', 'LUBES', 'ENGINE_OIL'].includes(val)) return 'LUBRICANTS';
  if (['BRAKE_FLUID', 'BRAKEFLUID', 'BREAK_FLUID', 'BREAKFLUID'].includes(val)) return 'BRAKE_FLUID';
  if (['COOLANT', 'COOLANTS', 'COOLEND'].includes(val)) return 'COOLANT';
  return val;
};

/**
 * Service to fetch Lubes Products (Lubricants, Brake Fluid, Coolant) directly from local database
 */
export const getLubesProductsService = async (queryParams = {}, clientAuthHeader = null) => {
  const rawType = queryParams.type || queryParams.categoryType || 'LUBRICANTS';
  const normalizedType = normalizeLubeType(rawType);

  const limit = Math.max(1, Math.min(parseInt(queryParams.limit || queryParams.pageSize || 50, 10), 500));
  
  let skip = 0;
  if (queryParams.skip !== undefined && queryParams.skip !== null) {
    skip = Math.max(0, parseInt(queryParams.skip, 10) || 0);
  } else if (queryParams.offset !== undefined && queryParams.offset !== null) {
    skip = Math.max(0, parseInt(queryParams.offset, 10) || 0);
  } else if (queryParams.page !== undefined && queryParams.page !== null) {
    const pageNum = Math.max(1, parseInt(queryParams.page, 10) || 1);
    skip = (pageNum - 1) * limit;
  }

  const page = Math.floor(skip / limit) + 1;
  const search = queryParams.search ? String(queryParams.search).trim() : '';

  try {
    if (db.lubesProducts) {
      const whereCondition = {
        type: normalizedType,
        status: 'ACTIVE',
      };
      if (search) {
        whereCondition[db.Sequelize.Op.or] = [
          { partNumber: { [db.Sequelize.Op.like]: `%${search}%` } },
          { description: { [db.Sequelize.Op.like]: `%${search}%` } },
          { category: { [db.Sequelize.Op.like]: `%${search}%` } },
          { grade: { [db.Sequelize.Op.like]: `%${search}%` } },
          { colour: { [db.Sequelize.Op.like]: `%${search}%` } },
          { pack: { [db.Sequelize.Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await db.lubesProducts.findAndCountAll({
        where: whereCondition,
        order: [['id', 'ASC']],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit) || 1;

      return {
        success: true,
        type: normalizedType,
        search,
        skip,
        limit,
        page,
        totalPages,
        count: count,
        total: count,
        result: rows,
        data: rows,
      };
    }
  } catch (dbErr) {
    logger.error('Local LubesProducts DB query error:', dbErr);
  }

  return {
    success: true,
    type: normalizedType,
    search,
    skip,
    limit,
    page: 1,
    totalPages: 0,
    count: 0,
    total: 0,
    result: [],
    data: [],
  };
};

/**
 * Service for Bulk CSV Upload of Lubes Products
 */
export const uploadLubesProductsService = async (fileBuffer, fileName = '', userId = null) => {
  if (!fileBuffer) {
    throw new Error('File buffer is required');
  }

  const rowsData = [];
  const lowerFileName = String(fileName || '').toLowerCase();
  const isExcel = lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls') || (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b);

  if (isExcel) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];
    if (worksheet) {
      const headers = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim();
          });
        } else {
          const rowObj = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              let val = cell.value;
              if (val && typeof val === 'object' && val.text) val = val.text;
              if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
              rowObj[header] = val !== null && val !== undefined ? String(val).trim() : '';
            }
          });
          rowsData.push({ rowNumber, rowObj });
        }
      });
    }
  } else {
    const fileContent = fileBuffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length > 0) {
      const parseCsvLine = (text) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (c === '"') {
            inQuotes = !inQuotes;
          } else if (c === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^"|"$/g, ''));
            cur = '';
          } else {
            cur += c;
          }
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const rawHeaders = parseCsvLine(lines[0]);
      const headers = rawHeaders.map((h) => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] !== undefined ? values[idx] : '';
        });
        rowsData.push({ rowNumber: i + 1, rowObj });
      }
    }
  }

  if (rowsData.length === 0) {
    return { fileName, totalRows: 0, processed: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };
  }

  let inserted = 0, updated = 0, skipped = 0;
  const errors = [];
  const typeWiseCount = {};

  for (const item of rowsData) {
    const { rowNumber, rowObj } = item;

    const getVal = (...keys) => {
      for (const k of keys) {
        for (const hKey of Object.keys(rowObj)) {
          if (hKey.toLowerCase() === k.toLowerCase()) return rowObj[hKey];
        }
      }
      return '';
    };

    const rawType = getVal('type', 'productType', 'product type', 'categoryType', 'category type');
    const partNumber = getVal('partNumber', 'part number', 'TVS Part Number', 'TVSPartNumber', 'tvs part no', 'partNo').trim();

    const type = normalizeLubeType(rawType);

    if (!type || !partNumber) {
      skipped++;
      errors.push({ row: rowNumber, type: rawType || '', partNumber: partNumber || '', message: 'type and partNumber are required' });
      continue;
    }

    const productData = {
      type,
      partNumber: partNumber.slice(0, 100),
      category: String(getVal('category', 'product category') || '').trim().slice(0, 100),
      grade: String(getVal('grade', 'oil grade') || '').trim().slice(0, 100),
      colour: String(getVal('colour', 'color') || '').trim().slice(0, 50),
      pack: String(getVal('pack', 'pack size', 'packSize', 'packing') || '').trim().slice(0, 50),
      ratio: String(getVal('ratio', 'mixing ratio') || '').trim().slice(0, 50),
      description: String(getVal('description', 'product description', 'productDescription', 'part description') || '').trim().slice(0, 255),
      mrp: Number(getVal('mrp', 'maximum retail price') || 0),
      sellingPriceWithGst: Number(getVal('sellingPriceWithGst', 'selling price with gst', 'selling with gst', 'sellingPriceIncludingGst') || 0),
      sellingPriceWithoutGst: Number(getVal('sellingPriceWithoutGst', 'selling price without gst', 'selling w/o gst', 'selling excluding gst') || 0),
      bronzePoints: Number(getVal('bronzePoints', 'bronze points', 'bronze') || 0),
      silverPoints: Number(getVal('silverPoints', 'silver points', 'silver') || 0),
      goldPoints: Number(getVal('goldPoints', 'gold points', 'gold') || 0),
      platinumPoints: Number(getVal('platinumPoints', 'platinum points', 'platinum') || 0),
      status: 'ACTIVE',
      updatedBy: userId ? String(userId) : null,
    };

    try {
      if (db.sequelize) {
        await db.sequelize.query('ALTER TABLE lubes_products MODIFY COLUMN ratio VARCHAR(100) NULL;').catch(() => {});
      }
      const existing = await db.lubesProducts.findOne({ where: { type, partNumber } });
      if (existing) {
        await existing.update(productData);
        updated++;
      } else {
        await db.lubesProducts.create({ ...productData, createdBy: userId ? String(userId) : null });
        inserted++;
      }
      typeWiseCount[type] = (typeWiseCount[type] || 0) + 1;
    } catch (err) {
      skipped++;
      errors.push({ row: rowNumber, type, partNumber, message: err.message });
    }
  }

  return {
    fileName,
    totalRows: rowsData.length,
    processed: inserted + updated,
    inserted,
    updated,
    skipped,
    typeWiseCount,
    errors,
  };
};

/**
 * Service to Bulk Seed Lubes Products from JSON
 */
export const seedLubesProductsService = async (items = [], userId = null) => {
  const itemList = Array.isArray(items) ? items : items.items || [];
  let inserted = 0, updated = 0, skipped = 0;
  const errors = [];
  const typeWiseCount = {};

  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i];
    const type = normalizeLubeType(item.type);
    const partNumber = String(item.partNumber || '').trim();

    if (!type || !partNumber) {
      skipped++;
      errors.push({ index: i, message: 'type and partNumber are required' });
      continue;
    }

    const productData = {
      type,
      partNumber: partNumber.slice(0, 100),
      category: String(item.category || '').trim().slice(0, 100),
      grade: String(item.grade || '').trim().slice(0, 100),
      colour: String(item.colour || item.color || '').trim().slice(0, 50),
      pack: String(item.pack || item.packSize || '').trim().slice(0, 50),
      ratio: String(item.ratio || '').trim().slice(0, 50),
      description: String(item.description || '').trim().slice(0, 255),
      mrp: Number(item.mrp || 0),
      sellingPriceWithGst: Number(item.sellingPriceWithGst || 0),
      sellingPriceWithoutGst: Number(item.sellingPriceWithoutGst || 0),
      bronzePoints: Number(item.bronzePoints || 0),
      silverPoints: Number(item.silverPoints || 0),
      goldPoints: Number(item.goldPoints || 0),
      platinumPoints: Number(item.platinumPoints || 0),
      status: item.status || 'ACTIVE',
      updatedBy: userId ? String(userId) : null,
    };

    try {
      const existing = await db.lubesProducts.findOne({ where: { type, partNumber } });
      if (existing) {
        await existing.update(productData);
        updated++;
      } else {
        await db.lubesProducts.create({ ...productData, createdBy: userId ? String(userId) : null });
        inserted++;
      }
      typeWiseCount[type] = (typeWiseCount[type] || 0) + 1;
    } catch (err) {
      skipped++;
      errors.push({ index: i, type, partNumber, message: err.message });
    }
  }

  return {
    totalRows: itemList.length,
    processed: inserted + updated,
    inserted,
    updated,
    skipped,
    typeWiseCount,
    errors,
  };
};

/**
 * Service to update single Lubes Product
 */
export const updateLubesProductService = async (payload, userId = null) => {
  const { id, ...updateFields } = payload || {};
  if (!id) {
    const err = new Error('id is required');
    err.statusCode = 400;
    throw err;
  }

  const product = await db.lubesProducts.findByPk(id);
  if (!product) {
    const err = new Error('Lubes Product not found');
    err.statusCode = 404;
    throw err;
  }

  const numericFields = ['mrp', 'sellingPriceWithGst', 'sellingPriceWithoutGst', 'bronzePoints', 'silverPoints', 'goldPoints', 'platinumPoints'];
  for (const field of numericFields) {
    if (updateFields[field] !== undefined && Number(updateFields[field]) < 0) {
      const err = new Error(`${field} must be a non-negative number`);
      err.statusCode = 400;
      throw err;
    }
  }

  const newType = updateFields.type ? normalizeLubeType(updateFields.type) : product.type;
  const newPartNumber = updateFields.partNumber !== undefined ? String(updateFields.partNumber).trim() : product.partNumber;

  if (!newPartNumber) {
    const err = new Error('partNumber cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  if (newType !== product.type || newPartNumber !== product.partNumber) {
    const duplicate = await db.lubesProducts.findOne({
      where: {
        type: newType,
        partNumber: newPartNumber,
        id: { [db.Sequelize.Op.ne]: id },
      },
    });
    if (duplicate) {
      const err = new Error(`Product with type '${newType}' and partNumber '${newPartNumber}' already exists`);
      err.statusCode = 400;
      throw err;
    }
  }

  updateFields.type = newType;
  updateFields.partNumber = newPartNumber;
  if (userId) updateFields.updatedBy = String(userId);

  await product.update(updateFields);

  return {
    message: 'Lubes Product updated successfully',
    result: product,
  };
};

/**
 * Service to insert a single Lubes Product directly into database
 */
export const createLubesProductService = async (payload, userId = null) => {
  const type = normalizeLubeType(payload.type);
  const partNumber = String(payload.partNumber || '').trim();

  if (!type || !partNumber) {
    const err = new Error('type and partNumber are required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.lubesProducts.findOne({ where: { type, partNumber } });
  if (existing) {
    const err = new Error(`Product with type '${type}' and partNumber '${partNumber}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  const productData = {
    type,
    partNumber,
    category: payload.category || '',
    grade: payload.grade || '',
    colour: payload.colour || payload.color || '',
    pack: payload.pack || payload.packSize || '',
    ratio: payload.ratio || '',
    description: payload.description || '',
    mrp: Number(payload.mrp || 0),
    sellingPriceWithGst: Number(payload.sellingPriceWithGst || 0),
    sellingPriceWithoutGst: Number(payload.sellingPriceWithoutGst || 0),
    bronzePoints: Number(payload.bronzePoints || 0),
    silverPoints: Number(payload.silverPoints || 0),
    goldPoints: Number(payload.goldPoints || 0),
    platinumPoints: Number(payload.platinumPoints || 0),
    status: payload.status || 'ACTIVE',
    createdBy: userId ? String(userId) : null,
    updatedBy: userId ? String(userId) : null,
  };

  const newProduct = await db.lubesProducts.create(productData);
  return {
    message: 'Lubes Product created successfully',
    result: newProduct,
  };
};

export default {
  getMasterListService,
  getPartsListService,
  getCartService,
  addCartService,
  getTop20CarsService,
  createTop20CarService,
  createDirectEnquiryOrderService,
  getDirectEnquiryOrderListService,
  getDirectEnquiryOrderStatusService,
  callDearoDirectEnquiryApi,
  getOrdersService,
  callOrderApi,
  resolveVehicleService,
  getVahanDetailsService,
  getLubesProductsService,
  uploadLubesProductsService,
  seedLubesProductsService,
  updateLubesProductService,
  createLubesProductService,
};




