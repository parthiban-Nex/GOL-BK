import logger from "../../../config/logger.js";
import { callPartsGptApi } from "./utils/partsGptApi.js";

export const getSuggestions = async ({ userId, q, limit = 5 }) => {
    try {

    if (!q) throw new Error("Query 'q' is required");

    const endpoint = "/api/v1/search/suggestions"; 

    const params = { q, limit };


    const result = await callPartsGptApi({
      userId,
      endpoint,
      params,
      method: "GET",
    });

    return result;
      } catch (err) {
    logger.error("PartsGPT Service getSuggestions Error:", err);
    throw err;
  };
  }

export const searchParts = async ({
  userId,
  query,
  limit = 10,
  sources = ["tvs"],
  search_type = "text",
    vehicle = null,
    parts

}) => {
  try{

if (!query && (!parts || parts.length === 0)) {
  throw new Error("Either query or parts is required");
}
  const endpoint = "/api/v1/search/unified";

    const body = {
      search_type,
      sources,
      limit,
      ...(query && { query }),
      ...(parts && { parts }),
      ...(vehicle && { vehicle })
    };

  const result = await callPartsGptApi({
    userId,
    endpoint,
    data: body,   
    method: "POST"
  });

  return result;
} catch (err) {
    logger.error("PartsGPT Service searchParts Error:", err);
    throw err;
}
};


export const searchPartsWithImage = async ({
  userId,
  query,
  limit = 10,
  sources = ["tvs"],
  search_type = "image",
  vehicle = null,
  parts,
  images = []
}) => {

  const endpoint = "/api/v1/search/unified";

  const body = {
    search_type,
    sources,
    limit,
    ...(query && { query }),
    ...(parts && { parts }),
    ...(vehicle && { vehicle })
  };

  return await callPartsGptApi({
    userId,
    endpoint,
    data: body,
    images,
    method: "POST"
  });
};

export const searchVehicleSpecifications = async ({
  userId,
  vehicle = {}
}) => {

  try {

    const endpoint = "/api/v1/search/unified";

    const body = {
      search_type: "lookup",
      lookup_type: "vehicle",
      ...(Object.keys(vehicle).length && { vehicle })
    };

    const result = await callPartsGptApi({
      userId,
      endpoint,
      data: body,
      method: "POST"
    });

    return result;

  } catch (err) {

    logger.error(
      "PartsGPT Service searchVehicleSpecifications Error:",
      err
    );

    throw err;
  }
};

const GptService = {
    getSuggestions,
    searchParts,
    searchPartsWithImage,
    searchVehicleSpecifications
}

export default GptService;
