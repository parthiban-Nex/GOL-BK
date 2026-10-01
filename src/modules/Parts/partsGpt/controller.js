import logger from "../../../config/logger.js";
import GptService from "./service.js";

export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: "'q' is required" });
    }

    const response = await GptService.getSuggestions({ userId, q, limit });

    res.status(200).json({ success: true, data: response });
  } catch (error) {

    // console.log("PartsGPT ERROR RESPONSE:", error.response?.data);
    // console.log("PartsGPT ERROR MESSAGE:", error.message);
    // console.log("PartsGPT ERROR CODE:", error.code);

    logger.error("PartsGPT Controller Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  };
}

export const searchParts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit, sources, search_type, vehicle, parts } = req.body;

    if (!query && (!parts || parts.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "'query' or 'parts' is required"
      });
    }

    const response = await GptService.searchParts({ userId, query, limit, sources, search_type, vehicle, parts });

    res.status(200).json({ success: true, data: response });
  } catch (error) {


    logger.error("PartsGPT Controller Search Parts Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  };
}

export const searchPartsWithImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit, sources, search_type, vehicle, parts } = req.body;

    const images = req.files || [];

    const response = await GptService.searchPartsWithImage({
      userId,
      query,
      limit,
      sources,
      search_type,
      vehicle,
      parts,
      images
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error("Search Parts Image Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
// export const searchParts = async (req, res) => {
//   try {
//     const userId = req.user.id;  
//     const { query,limit,sources,search_type,vehicle,parts } = req.body;

//     if (!query && (!parts || parts.length === 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "'query' or 'parts' is required"
//       });
//     }

//     const response = await GptService.searchParts({ userId, query, limit, sources, search_type,vehicle,parts });

//     res.status(200).json({ success: true, data: response });
//    } catch (error) {


//   logger.error("PartsGPT Controller Search Parts Error:", error);

//   res.status(500).json({
//     success: false,
//     message: "Internal server error"
//   });
// };
// }

export const searchVehicleSpecifications = async (req, res) => {
  try {

    const userId = req.user.id;
    const { make, model, variant } = req.body;

    const vehicle = {};

    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (variant) vehicle.variant = variant;

    const response = await GptService.searchVehicleSpecifications({
      userId,
      vehicle
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {

    logger.error(
      "PartsGPT Controller Search Vehicle Specifications Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const controller = {
  getSuggestions,
  searchParts,
  searchPartsWithImage,
  searchVehicleSpecifications
};

export default controller;
