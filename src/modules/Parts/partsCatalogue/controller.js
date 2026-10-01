import logger from "../../../config/logger.js";
import { dearoCatalog } from "./service.js";
import db from '../../index.js';
import CartService from './service.js';
import axios from "axios";
import {
  getCategoryImagePath,
  getSubCategoryImagePath,
  getAuthHeader,
  getStorageReadUrl,
  initializeImageMaps
} from "./helpers/imageHelper.js";



const Cart = db.carts;

export const generalSearch = async (req, res, next) => {
    console.log("req body ----", req.body);
  try {
    const payload = req.body; 

    const response = await dearoCatalog("generalSearch", payload);

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    logger.error("Parts Catalogue Controller Error:", error);
    next(error);
  }
};

// export const getPartsList = async (req, res, next) => {
//   try {
//     const filters = req.body;

//     if (!filters) {
//       return res.status(400).json({ success: false, message: "Invalid request" });
//     }

//     const payload = {
//       brandPriority: [""],
//       limit: 500,
//       offset: 0,
//       sortOrder: "ASC",
//       fieldOrder: null,
//       customerCode: "0046",
//       partNumber: null,
//       model: null,
//       brand: null,
//       subAggregate: null,
//       aggregate: null,
//       make: null,
//       variant: null,
//       fuelType: null,
//       vehicle: null,
//       year: null,
//     };

//     ["aggregate", "subAggregate", "make", "variant", "model","fuelType", "year"].forEach((field) => {
//       if (filters[field]) {
//         payload[field] =
//           field === "aggregate" && !Array.isArray(filters[field])
//             ? [filters[field]]
//             : filters[field];
//       }
//     });

//     // const response = await dearoCatalog("getPartsList", filters);
//     const response = await dearoCatalog("getPartsList", payload);

//     return res.status(200).json({ success: true, data: response.data || response });
//   } catch (error) {
//     logger.error("Error in spareGetPartsList:", error.response?.data || error.message);
//     return next(error);
//   }
// };
export const getPartsList = async (req, res, next) => {
  try {
    const filters = req.body;

    if (!filters) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const payload = {
      brandPriority: [""],
      limit: 0,
      offset: 0,
      sortOrder: "ASC",
      fieldOrder: null,
      customerCode: "0046",
      partNumber: null,
      model: null,
      brand: null,
      subAggregate: null,
      aggregate: null,
      make: null,
      variant: null,
      fuelType: null,
      vehicle: null,
      year: null,
    };

    ["aggregate", "subAggregate", "make", "variant", "model","fuelType", "year"].forEach((field) => {
      if (filters[field]) {
        payload[field] =
          field === "aggregate" && !Array.isArray(filters[field])
            ? [filters[field]]
            : filters[field];
      }
    });

    // Add partNumber if it exists
if (filters.partNumber) {
  payload.partNumber = Array.isArray(filters.partNumber)
    ? filters.partNumber
    : String(filters.partNumber)
        .split(",")
        .map(i => i.trim())
        .filter(Boolean);
}
    // Add searchKey if it exists
    if (filters.searchKey) {
      payload.searchKey = filters.searchKey;
    }

    const response = await dearoCatalog("getPartsList", payload);

    return res.status(200).json({ success: true, data: response.data || response });
  } catch (error) {
    logger.error("Error in spareGetPartsList:", error.response?.data || error.message);
    return next(error);
  }
};

export const getVehicleCompatibility = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data?.partNumber) {
      return res.status(400).json({ success: false, message: "Part number required" });
    }

    const payload = {
      limit: 50,
      offset: 0,
      sortOrder: "ASC",
      customerCode: "0046",
      brand: data.brand || null,
      partNumber: data.partNumber,
      aggregate: data.aggregate || null,
      subAggregate: data.subAggregate || null,
      make: data.make || null,
      model: data.model || null,
      variant: data.variant || null,
      fuelType: data.fuelType || null,
      vehicle: data.vehicle || null,
      year: data.year || null,
    };

    const response = await dearoCatalog("getVehicleList", payload);

    return res.status(200).json({
      success: true,
      data: response.data || response,
    });
  } catch (error) {
    logger.error("Error in getVehicleCompatibility:", error.response?.data || error.message);
    return next(error);
  }
};
export const getStock = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data?.partNumber) {
      return res.status(400).json({ success: false, message: "Part number required" });
    }

    const payload = {
      limit: 10,
      offset: 0,
      sortOrder: "ASC",
      customerCode: "0046",
      partNumber: data.partNumber,
      fieldOrder: "lotAgeDate",
      inventoryName: null,
      entity: null,
      software: null,
    };

    const response = await dearoCatalog("getStockList", payload);

    return res.status(200).json({
      success: true,
      data: response.data || response,
    });
  } catch (error) {
    logger.error("Error in getStock:", error.response?.data || error.message);
    return next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const outletCode = req.user?.outlet_code;

    let cartItem;

    if (outletCode) {
      cartItem = await CartService.addToCart(data,null,outletCode);
    } else {
      cartItem =await CartService.addToCart(data,userId,null);
    }

    return res.status(200).json({
      success: true,
      message: cartItem?.id ? "Cart updated" : "Item added to cart",
      data: cartItem,
    });
  } catch (err) {
    logger.error("CartController addToCart Error:", err);
    next(err);
  }
};

export const getCartItems = async (req, res, next) => {
  try {
    let cartItems;
    const outletCode = req.user?.outlet_code;
    console.log("getCartItems called with outletCode ----", outletCode);
    if(outletCode){
      console.log("Getting cart items by outlet code ----", outletCode);
      cartItems = await CartService.getCartItems(null,outletCode);
    }else{
      const userId = req.user.id;
      cartItems = await CartService.getCartItems(userId,null);
    }
    return res.status(200).json({ success: true, data: cartItems });
  } catch (err) {
    logger.error("CartController getCartItems Error:", err);
    next(err);
  }
};

export const updateQty = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const outletCode = req.user?.outlet_code;
    const { part_number, action } = req.body;

    if (!part_number || !["increase", "decrease"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const updatedItem = await CartService.updateQty(outletCode? null: req.user.id,part_number,action,outletCode);

    return res.status(200).json({
      success: true,
      message: `Quantity ${action}d`,
      data: updatedItem,
    });
  } catch (err) {
    logger.error("CartController updateQty Error:", err);
    next(err);
  }
};

export const deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const outletCode = req.user?.outlet_code;
    const { part_number, action } = req.body;

    if (!part_number) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    await CartService.deleteCartItem(outletCode? null: userId, part_number, outletCode);
    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (err) {
    logger.error("CartController updateQty Error:", err);
    next(err);
  }
};
export const placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payload = req.body;

    const result = await CartService.placeOrder(payload, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    logger.error("CartController placeOrder Error:", err);
    next(err);
  }
};
export const getOrderHistories = async (req, res, next) => {
  try {
    let OrderHistories;
    const outletCode = req.user?.outlet_code;
    const userId = req.user.id;
    if (outletCode) {
      OrderHistories = await CartService.getOrderHistory(null, outletCode);
    } else {
      OrderHistories = await CartService.getOrderHistory(userId, null);
    }
    return res.status(200).json({ success: true, data: OrderHistories });
  } catch (err) {
    logger.error("Controller getOrderHistories Error:", err);
    next(err);
  }
};

export const getOrderStatus = async (req, res, next) => {
  console.log("req body ----", req.body);
  try {
    const outlet_code = req.user?.outlet_code;

    const { order_no } = req.body;
    const outletCode = req.user?.outlet?.outletCode;

    console.log("order_number----------", order_no);
    if (!order_no || !Array.isArray(order_no) || order_no.length === 0) {
      return res.status(400).json({ success: false, message: "Order numbers are required" });
    }
    const OrderStatus =
      await CartService.orderStatus(outlet_code? {order_no,outlet_code}: {order_no,outletCode}
      );

    return res.status(200).json({ success: true, order_details: OrderStatus });
  } catch (err) {
    logger.error("Controller getOrderStatus Error:", err);
    next(err);
  }
};

export const getMasterList = async (req, res, next) => {
    console.log("req body ----", req.body);
  try {
    const payload = req.body; 

    const response = await dearoCatalog("getMasterList", payload);

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    logger.error("Parts Catalogue Controller Error:", error);
    next(error);
  }
};

export const catalogueLogin = async (req, res, next) => {
  try {

    // const outletCode = req.user.outlet.outletCode;
        const outletCode = "8508094402";


    const response = await CartService.catalogueLogin({
      outletCode
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {

    logger.error(
      "Parts Catalogue Login Controller Error:",
      error
    );

    next(error);
  }
};

export const placeOrderNew = async (req, res, next) => {
  try {
    console.log("placeOrderNew req body ----", req.body);
    const userId = req.user?.id;
    const outletCode = req.user?.outlet?.outletCode;
    const outlet_code = req.user?.outlet_code;

    let result;
    if(outlet_code){
      result = await CartService.placeOrderNew(null,outlet_code,outlet_code);
    }else{      
      result = await CartService.placeOrderNew(userId,outletCode,null);
    }
    
    console.log("placeOrderNew result ----", result);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Controller placeOrderNew Error:", error);
    next(error);
  }
};

 const getPartsListForJc = async (req, res, next) => {
  try {
    const payload = req.body;

   

    const response = await dearoCatalog("getPartsList", payload);

    return res.status(200).json({ success: true, data: response.data || response });
  } catch (error) {
    logger.error("Error in spareGetPartsList:", error.response?.data || error.message);
    return next(error);
  }
};
export const getCategoryImage = async (req, res, next) => {
  try {
        await initializeImageMaps();

    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name required",
      });
    }

    const imagePath = getCategoryImagePath(name);
    console.log("getCategoryImage imagePath ----", imagePath);

    const response = await axios.get(
      getStorageReadUrl(),
      {
        params: {
          name: imagePath,
        },
        responseType: "stream",
        headers: {
          Authorization: getAuthHeader(),
        },
      }
    );
    console.log("getCategoryImage response ----", response.status, response.headers);

    res.setHeader(
      "Content-Type",
      response.headers["content-type"]
    );

    response.data.pipe(res);

  } catch (error) {
    console.error(error);

    next(error);
  }
};
export const getSubCategoryImage = async (req, res, next) => {
  try {
        await initializeImageMaps();

    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name required",
      });
    }

    const imagePath = getSubCategoryImagePath(name);

    const response = await axios.get(
      getStorageReadUrl(),
      {
        params: {
          name: imagePath,
        },
        responseType: "stream",
        headers: {
          Authorization: getAuthHeader(),
        },
      }
    );

    res.setHeader(
      "Content-Type",
      response.headers["content-type"]
    );

    response.data.pipe(res);

  } catch (error) {
    console.error(error);

    next(error);
  }
};
export const vehicleFuzzyMatch = async (
  req,
  res,
  next
) => {
  try {
console.log("BODY =", req.body);
    const { vehicleNumber } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "vehicleNumber required"
      });
    }

    const result =
      await CartService.vehicleFuzzyMatch(
        vehicleNumber
      );

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
};

export const vehicleResolve = async (req, res, next) => {
  console.log("req body ----", req.body);

  try {
    const payload = req.body;

    const response = await dearoCatalog("vehicleResolve", payload);

    console.log("vehicleResolve response ----", response);

    const data = response?.data || {};

    const user = data.userDetails || {};
    const mytvs = data.mytvsDetails || {};

    const useUserDetails =
      Object.values(user).some(v => v !== null);

    const source = useUserDetails ? user : mytvs;

    const result = {
      vehicleNumber: data.vehicleNumber,

      make: useUserDetails
        ? source.userMake
        : source.mytvsMake,

      model: useUserDetails
        ? source.userModel
        : source.mytvsModel,

      variant: useUserDetails
        ? source.userVariant
        : source.mytvsVariant,

      fuelType: useUserDetails
        ? source.userFuelType
        : source.mytvsFuelType,

      year: useUserDetails
        ? source.userYear
        : source.mytvsYear,

      responseData: data
    };

    console.log("vehicleResolve data ----", result);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error("Parts Catalogue Controller Error:", error);
    next(error);
  }
};

export const getOrderHistoriesForGms = async (req, res, next) => {
  try {
    let OrderHistories;
    const outletCode = req.user?.outlet.outletCode;

    if (outletCode) {
      OrderHistories = await CartService.getOrderHistoryForGms(outletCode);

      OrderHistories = OrderHistories.map(order => {
        let data = order.toJSON();
        data.items = data.items ? JSON.parse(data.items) : [];
        data.outletCode = data.customer_code;
        delete data.customer_code;

        return data;
      });
    }

    return res.status(200).json({
      success: true,
      data: OrderHistories
    });

  } catch (err) {
    logger.error("Controller getOrderHistories Error:", err);
    next(err);
  }
};
const controller = {
  generalSearch,getPartsList,getVehicleCompatibility, getStock, addToCart, getCartItems, updateQty, deleteCartItem, placeOrder, getOrderHistories, getOrderStatus,
  getMasterList,catalogueLogin,placeOrderNew,getPartsListForJc, getCategoryImage, getSubCategoryImage, vehicleFuzzyMatch, vehicleResolve,getOrderHistoriesForGms
};

export default controller;
