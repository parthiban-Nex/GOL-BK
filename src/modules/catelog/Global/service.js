import axios from 'axios';
import logger from '../../../config/logger.js';

// Partsmart Catalog External Config
const API_BASE_URL = 'https://websprint.mytvspartsmart.in/catalog/api/v1/external/';
const API_USERNAME = 'Z5Qnpqcd6D4LpfXNjmum';
const API_PASSWORD = 'cFkH4BJh5gtvCt5mKPN4CLc74QNv4MmTXZ7RArJr3iwP4NpWLBHUQbAyfJxH';

const DEARO_API_BASE_URL = 'https://api.dearo.in/api/jobCards/partsmart/';
const UAT_DEARO_API_BASE_URL = 'https://uatws.dearo.in/api/jobCards/partsmart/';

const GLOBAL_CUSTOMER_CODE = '0046';

const getPublicApiBaseUrl = () => {
  if (process.env.PUBLIC_API_BASE_URL) {
    return process.env.PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  return '/api';
};

const getBasicAuthHeader = () => {
  return 'Basic ' + Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
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
      const imageName = masterName ? masterName.replace(/\//g, '-') + '.png' : '';
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
 * Global Catalog getMasterList Service using customerCode "0046"
 */
export const getGlobalMasterListService = async (payload = {}, clientAuthHeader = null) => {
  const rawGeneration =
    payload?.vehicleGeneration ||
    payload?.generation ||
    payload?.generations ||
    payload?.vehicleGenerations ||
    payload?.vehicle_generation;

  const initialCustomerCode = payload?.customerCode || GLOBAL_CUSTOMER_CODE;
  const alternateCustomerCode = initialCustomerCode === '0046' ? '050' : '0046';

  const basePayload = { 
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

  // 1. Try External Partsmart API with Basic Auth
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

  // 2. Try Live Dearo Endpoint with client Auth header
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
    logger.warn('Global Dearo getMasterList Error:', err.response?.data?.message || err.message);
  }

  // 3. Try UAT Dearo Endpoint
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
    logger.warn('Global UAT Dearo getMasterList Error:', err.response?.data?.message || err.message);
  }

  return {
    success: false,
    message: 'Failed to fetch global catalog master list',
    count: 0,
    data: [],
  };
};

/**
 * Global Catalog getPartsList Service using customerCode "0046"
 */
export const getGlobalPartsListService = async (payload = {}, clientAuthHeader = null) => {
  const rawGeneration =
    payload?.vehicleGeneration ||
    payload?.generation ||
    payload?.generations ||
    payload?.vehicleGenerations ||
    payload?.vehicle_generation;

  const initialCustomerCode = payload?.customerCode || GLOBAL_CUSTOMER_CODE;
  const alternateCustomerCode = initialCustomerCode === '0046' ? '050' : '0046';

  const basePayload = {
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

  // 1. Try External Partsmart API with Basic Auth
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

  // 2. Try Live Dearo Endpoint with client Auth header
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
    logger.warn('Global Dearo getPartsList Error:', err.response?.data?.message || err.message);
  }

  // 3. Try UAT Dearo Endpoint
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
    logger.warn('Global UAT Dearo getPartsList Error:', err.response?.data?.message || err.message);
  }

  return {
    success: false,
    message: 'Failed to fetch global parts list',
    count: 0,
    data: [],
  };
};

/**
 * Helper to call Partsmart Catalog API endpoints with fallback options
 */
export const callPartsmartCatalog = async (endpoint, payload = {}, clientAuthHeader = null) => {
  const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^external\//, '');

  // 1. Try External Partsmart API with Basic Auth
  try {
    const response = await axios.post(
      `${API_BASE_URL}${cleanEndpoint}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: getBasicAuthHeader(),
        },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) return response.data;
  } catch (err) {
    logger.warn(`Global Partsmart ${cleanEndpoint} Error:`, err.response?.data || err.message);
  }

  // 2. Try Live Dearo Endpoint with client Auth header
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (clientAuthHeader) headers['Authorization'] = clientAuthHeader;

    const response = await axios.post(
      `${DEARO_API_BASE_URL}${cleanEndpoint}`,
      payload,
      { headers, timeout: 15000 }
    );
    if (response.data && response.data.success !== false) return response.data;
  } catch (err) {
    logger.warn(`Global Dearo ${cleanEndpoint} Error:`, err.response?.data || err.message);
  }

  // 3. Try UAT Dearo Endpoint
  try {
    const response = await axios.post(
      `${UAT_DEARO_API_BASE_URL}${cleanEndpoint}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (response.data && response.data.success !== false) return response.data;
  } catch (err) {
    logger.warn(`Global UAT Dearo ${cleanEndpoint} Error:`, err.response?.data || err.message);
  }

  return { success: false, data: [] };
};

/**
 * Global Catalog Partsmart General Search Service
 * Implements two-step API execution pattern:
 * 1. Step 1: Call /external/generalSearch with search data
 * 2. Inspect candidate items (dataSource) for direct partNumber vs category/sub-category keyword search
 * 3. Smart payload branching (reset vehicle filters if direct part number, else aggregate unique categories)
 * 4. Step 2: Call getPartsList to fetch complete parts pricing and catalog details
 */
export const getGlobalGeneralSearchService = async (data = {}, clientAuthHeader = null) => {
  console.log('Input data:', data);

  // 1. First HTTP call to Partsmart generalSearch endpoint
  const test = await callPartsmartCatalog('generalSearch', data, clientAuthHeader);
  const dataSource = (test && test.data) ? test.data : [];

  // Find the first valid part number returned by generalSearch
  const partNumberItem = Array.isArray(dataSource)
    ? dataSource.find((item) => item && item.partNumber)
    : null;

  const partNumber = partNumberItem ? partNumberItem.partNumber : null;

  let payload = {};

  const brandFilter = formatArrayField(data?.brand || data?.brands || data?.brandName || data?.brandsName);
  const aggregateFilter = formatArrayField(data?.aggregate || data?.category || data?.categories || data?.aggregates);
  const subAggregateFilter = formatArrayField(data?.subAggregate || data?.subCategory || data?.subCategories || data?.subAggregates);

  // Smart payload branching
  if (partNumber) {
    payload = {
      customerCode: data.customerCode || GLOBAL_CUSTOMER_CODE,
      aggregate: aggregateFilter,
      subAggregate: subAggregateFilter,
      make: formatArrayField(data?.make || data?.makes || data?.makeName),
      model: formatArrayField(data?.model || data?.models || data?.modelName),
      variant: formatArrayField(data?.variant),
      fuelType: formatArrayField(data?.fuelType),
      year: formatArrayField(data?.year),
      brand: brandFilter,
      partNumber: partNumber,
      primary: false,
      limit: 0,
      offset: 0,
      sortOrder: null,
      fieldOrder: null,
    };
  } else {
    payload = {
      customerCode: data.customerCode || GLOBAL_CUSTOMER_CODE,
      aggregate: aggregateFilter || (Array.isArray(dataSource)
        ? Array.from(
            new Set(
              dataSource
                .map((item) => item?.aggregate)
                .filter(Boolean)
            )
          )
        : []),
      subAggregate: subAggregateFilter || (Array.isArray(dataSource)
        ? Array.from(
            new Set(
              dataSource
                .map((item) => item?.subAggregate)
                .filter(Boolean)
            )
          )
        : []),
      make: formatArrayField(data?.make || data?.makes || data?.makeName),
      model: formatArrayField(data?.model || data?.models || data?.modelName),
      variant: formatArrayField(data?.variant),
      fuelType: formatArrayField(data?.fuelType),
      year: formatArrayField(data?.year),
      brand: brandFilter,
      partNumber: null,
      primary: false,
      limit: 0,
      offset: 0,
      sortOrder: null,
      fieldOrder: null,
    };
  }

  // 2. Second HTTP call to Partsmart getPartsList endpoint
  const dataArr = await getGlobalPartsListService(payload, clientAuthHeader);
  return dataArr;
};

export default {
  getGlobalMasterListService,
  getGlobalPartsListService,
  callPartsmartCatalog,
  getGlobalGeneralSearchService,
};

