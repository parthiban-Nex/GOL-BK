import axios from "axios";
import logger from "../../../config/logger.js";
import CartDao from './dao.js';
import jwt from "jsonwebtoken";
import { fuzzyMatchVehicle } from "./fuzzyMatcher.js";
const API_BASE_URL = "https://websprint.mytvspartsmart.in/catalog/api/v1/external/";
const API_USERNAME = "Z5Qnpqcd6D4LpfXNjmum";
const API_PASSWORD = "cFkH4BJh5gtvCt5mKPN4CLc74QNv4MmTXZ7RArJr3iwP4NpWLBHUQbAyfJxH";

const SALE_ORDER_URL = 'https://uat-websprint.mytvspartsmart.in/sale-order/create';
const ORDER_STATUS_URL = 'https://uat-websprint.mytvspartsmart.in/backend/api/v1/psm/getOrderDetails'
const SALE_APP_ID   = 'ADM4XA5KRJ8DJ6G14SYH';
const SALE_API_KEY  = '7QCFTBHH87X0APCGUSRE8BF6LNSJSDQFQHCZV7ME';

const LOGIN_URL = 'https://uat-websprint.mytvspartsmart.in/backend/api/v1/auth/login';
const ORDER_API_BASE_URL =
  "https://uat-websprint.mytvspartsmart.in/backend/api/v1";

const CREATE_ORDER_ENDPOINT = "/psm/createOrder";

const VEHICLE_URL =
  "https://valuation.mytvs.in/api/v1/common/vehicle-validate-number";

export const dearoCatalog = async (endpoint, payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(API_USERNAME + ":" + API_PASSWORD).toString("base64"),
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Dearo Catalog API Error:", error);
    logger.error("Error in dearoCatalog", error.response?.data || error.message);
    throw error;
  }
};
export const saleOrder = async (payload) => {
  try {
    const response = await axios.post(
      `${SALE_ORDER_URL}`,   
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "app-id": SALE_APP_ID,
          "api-key": SALE_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error("Error in saleOrder", error.response?.data || error.message);
    throw error;
  }
};

const addToCart = async (data, userId,outletCode = null) => {
  try {
    if (!data?.part_number) {
      throw new Error("Part number required");
    }

    let existing = await CartDao.findCartItem(userId, data.part_number, outletCode);

    if (existing) {
      existing.qty += 1;
      return await CartDao.updateCartItem(existing);
    } else {
      const newCart = {
        user_id: userId,
        product_brand: data.brand_name || null,
        part_number: data.part_number,
        part_desc: data.description || null,
        part_mrp: data.mrp || 0,
        list_price: data.list_price || 0,
        tax: data.tax || 0,
        qty: data.qty || 1,
        status: 1,
        outletCode: outletCode
      };
      return await CartDao.createCartItem(newCart);
    }
  } catch (err) {
    logger.error("CartService addToCart Error:", err);
    throw err;
  }
};

const getCartItems = async (userId,outletCode=null) => {
  try {
    console.log("CartService getCartItems called with userId ----", userId, "and outletCode ----", outletCode);
    return await CartDao.findAllCartItems(userId,outletCode);
  } catch (err) {
    logger.error("CartService getCartItems Error:", err);
    throw err;
  }
};

const updateQty = async (userId, partNumber, action, outletCode=null) => {
  try {
    let existing = await CartDao.findCartItem(userId, partNumber, outletCode);

    if (!existing) {
      throw new Error("Item not found in cart");
    }

    if (action === "increase") {
      existing.qty += 1;
    } else if (action === "decrease") {
      if (existing.qty > 1) {
        existing.qty -= 1;
      } else {
        existing.status = 2;
      }
    } else {
      throw new Error("Invalid action");
    }

    return await CartDao.updateCartItem(existing);
  } catch (err) {
    logger.error("CartService updateQty Error:", err);
    throw err;
  }
};

const deleteCartItem = async (userId, partNumber, outletCode=null) => {
  try {
    let existing = await CartDao.findCartItem(userId, partNumber, outletCode);

    if (!existing) {
      throw new Error("Item not found in cart");
    }

    existing.status = 2;

    return await CartDao.updateCartItem(existing);
  } catch (err) {
    logger.error("CartService deleteCartItem Error:", err);
    throw err;
  }
};
const placeOrder = async (payload, userId) => {
  try {
    if (!payload?.orders || !Array.isArray(payload.orders) || payload.orders.length === 0) {
      throw new Error("Invalid order payload");
    }

    const response = await saleOrder(payload);

    if (response?.success) {
      const order = payload.orders[0];
      const orderResponse = response.response?.[0] || {};
      console.log("orderResponse------------------------", orderResponse);
      await CartDao.saveOrderHistory({
        user_id: userId,
        order_number: orderResponse.order_number || null,
        customer_account: order.customer_account,
        customer_code: order.customer_code,
        no_of_lines: order.no_of_lines,
        online_payment: order.online_payment,
        order_created_date: new Date(),
        order_reference_number: order.order_reference_number,
        order_type: order.order_type,
        order_value: order.order_value,
        payment_reference_number: order.payment_reference_number,
        payment_type: order.payment_type,
        warranty_debit: order.warranty_debit,
        items: JSON.stringify(order.items),
      });

      await CartDao.updateCartStatus(userId);
      
      return { success: true, data: response };
    }

    return { success: false, message: response?.message || "Failed to place order" };
  } catch (err) {
    logger.error("OrderService placeOrder Error:", err);
    throw err;
  }
};

const getOrderHistory = async (userId, outletCode=null) => {
  try {
    return await CartDao.findAllOrderHistories(userId, outletCode);
  } catch (err) {
    logger.error("OrderService getOrderHistory  Error:", err);
    throw err;
  }
};

const catalogueLogin = async (payload) => {
  try {
console.log("catalogueLogin service called with payload ----", payload);
    const outlet =
      payload.outlet_code ||
      payload.outletCode;
    const existingUser =
      await CartDao.getCatalogueUser(
        outlet
      );

    // CHECK TOKEN
    if (existingUser?.token) {

      const decoded = jwt.decode(
        existingUser.token
      );

      // TOKEN VALID
      if (decoded?.exp * 1000 > Date.now()) {

        return {
          token: existingUser.token,
          fromCache: true
        };
      }
      console.log("Catalogue token expired for outletCode ----", outlet);
    }

    // LOGIN AGAIN
    const loginPayload = {
      username: "9886886645",
      password: "Tvs@123"
    };
console.log("Catalogue login payload ----", loginPayload);
    const response = await axios.post(
      LOGIN_URL,
      loginPayload,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
console.log("Catalogue login response ----", response.data);
    if (!response?.data?.success) {
      throw new Error("Login failed");
    }
    console.log("Catalogue login response ----", response.data);

    const userData = response.data.data;

    await CartDao.saveCatalogueToken({
      outlet_code: outlet,
      token: userData.token
    });
    console.log("Catalogue login successful for outletCode ----", outlet);

    return {
      token: userData.token,
      fromCache: false
    };

  } catch (err) {

    logger.error(
      "CartService catalogueLogin Error:",
      err.response?.data || err.message
    );

    throw err;
  }
};

const placeOrderNew = async (userId,outletCode,outlet_code = null) => {
  try {
    console.log("placeOrderNew service called with outletCode ----", outletCode);
    let auth;
    if(outlet_code){
      auth = await catalogueLogin({ outlet_code });
    }else{      
       auth = await catalogueLogin({ outletCode });
    }
    console.log("catalogueLogin response ----", auth);
    const token = auth?.token;
    if (!token) throw new Error("Catalogue auth failed");
    console.log("Catalogue token ----", token);
    /**
     * STEP 1: GET OUTLET
     */
    let outlet;
    if(outlet_code){
      outlet = await CartDao.getOutletByCode(outlet_code);
    }else{
       outlet = await CartDao.getOutletByCode(outletCode);
    }
    if (!outlet) throw new Error("Outlet not found");


    /**
     * STEP 2: GET CART
     */
    let cartItems;
    if(outlet_code){
      console.log("Getting cart items for outlet_code ----", outlet_code);
    cartItems = await CartDao.findAllCartItems(null, outlet_code);
    }else{
      console.log("Getting cart items for userId ----", userId);
    cartItems = await CartDao.findAllCartItems(userId, null);
    }
    if (!cartItems.length) throw new Error("Cart is empty");

const part_details = cartItems.map((item) => {
  const qty = Number(item.qty || 0);
  const mrp = Number(item.part_mrp || 0);
  const taxPercent = Number(item.tax || 0);

  const listPricePerUnit = mrp / (1 + taxPercent / 100);

  const sub_total = listPricePerUnit * qty;
  const total_price = mrp * qty;
  const tax_price = total_price - sub_total;

  // split tax (assuming 18% GST split 9% + 9%)
  const cgst = tax_price / 2;
  const sgst = tax_price / 2;
  const igst = 0;

  return {
    parts_no: item.part_number,
    parts_name: item.part_desc,
    quantity: String(qty),
    warehouse: "KMS_NKL",
    item_price: String(listPricePerUnit.toFixed(2)),
    brand_name: item.product_brand,

    sub_total: String(sub_total.toFixed(2)),
    tax_price: String(tax_price.toFixed(2)),
    total_price: String(total_price.toFixed(2)),

    cgst: String(cgst.toFixed(2)),
    sgst: String(sgst.toFixed(2)),
    igst: String(igst.toFixed(2)),

    mrp: String(mrp),
  };
});

    /**
     * STEP 5: CALCULATE TOTALS
     */
    const total_quantity = cartItems.reduce((s, i) => s + i.qty, 0);

    const total_price = cartItems.reduce(
      (s, i) => s + i.qty * i.part_mrp,
      0
    );

    /**
     * STEP 6: BUILD FINAL ORDER PAYLOAD
     */
    const payload = {
      validity_date: new Date().toISOString().split("T")[0],

      // customer_code: outlet.outletCode,
      customer_code: "PFR_000100",
      employee_code: null,
      purchase_order_no: null,
    purchase_order_date: null,

      mobile_number: String(outlet.phoneNumber),
ship_to_pincode: String(outlet.pincode),

      ship_to_location: outlet.city,

      latitude: "1",
      longitude: "1",

      transaction_track_id: Date.now().toString(),

total_price: String(total_price),
total_quantity: String(total_quantity),
      part_details,
    };
    console.log(JSON.stringify(payload));

    /**
     * STEP 7: CALL EXTERNAL API
     */
    const response = await axios.post(
      `${ORDER_API_BASE_URL}${CREATE_ORDER_ENDPOINT}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("External API response ----", response.data);
if (!response?.data?.order_number) {
  throw new Error(
    response?.data?.error || "Order API failed"
  );
}
    /**
     * STEP 8: SAVE ORDER HISTORY
     */
    // await CartDao.saveOrderHistory({
    //   user_id: userId,
    //   order_number: null,
    //   customer_account: null,
    //   customer_code: outlet.outletCode,
    //   order_created_date: new Date(),
    //   order_value: total_price,
    //   items: JSON.stringify(part_details),
    // });

    /**
     * STEP 9: CLEAR CART
     */
    // await CartDao.updateCartStatus(userId);

    // return {
    //   success: true,
    //   data: response.data,
    // };
    const isSuccess =
  response?.data?.order_number ||
  response?.data?.id;
    if (isSuccess) {
const orderReference =
  response?.data?.order_array?.[0]?.reference_number || null;
  await CartDao.saveOrderHistory({
    user_id: userId,
        order_number: response.data.order_number,  
        order_reference_number: orderReference, 
    customer_account: null,
    customer_code: outlet.outletCode,
    order_created_date: new Date(),
    order_value: total_price,
    items: JSON.stringify(part_details),
    outletCode: outlet_code
  });
  if(outlet_code){
    await CartDao.updateCartStatus(null, outlet_code);
  }else{
  await CartDao.updateCartStatus(userId,null);
  }

  return {
    success: true,
    data: response.data,
  };

} else {
  throw new Error(response?.data?.error || "Order failed");
}
  } catch (err) {
    logger.error("Service placeOrder Error:", err);
    throw err;
  }
};

export const orderStatus = async (payload) => {
  try {
      const { order_no, outlet_code, outletCode } = payload;
      const auth =
      outlet_code
        ? await catalogueLogin({ outlet_code })
        : await catalogueLogin({ outletCode });
    const token = auth?.token;

    // if multiple orders come
    const orders = Array.isArray(order_no) ? order_no : [order_no];

    const results = [];

    for (const order of orders) {
      const response = await axios.post(
        ORDER_STATUS_URL,
        { order_no: order },  
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      results.push(response.data);
    }

    return results;

  } catch (error) {
    logger.error("Error in orderStatus", error.response?.data || error.message);
    throw error;
  }
};

const vehicleFuzzyMatch = async (
  vehicleNumber
) => {

  // STEP 1
  const vehicleResponse =
    await axios.post(
      VEHICLE_URL,
      {
        vehicleNumber
      }
    );

  const vahanData =
    vehicleResponse.data.result;

  // STEP 2
const brandResponse = await dearoCatalog(
  "getMasterList",
  {
    partNumber: null,
    sortOrder: "ASC",
    customerCode: "0046",
    aggregate: null,
    brand: null,
    fuelType: null,
    limit: 0,
    make: null,
    masterType: "make",
    model: null,
    offset: 0,
    primary: false,
    subAggregate: null,
    variant: null,
    year: null
  }
);

  const makes =
    brandResponse.data.map(
      item => item.masterName
    );

  // STEP 3
  const brandMatch =
    fuzzyMatchVehicle(
      vahanData,
      {
        makes
      }
    );

  // STEP 4
const modelResponse = await dearoCatalog(
  "getMasterList",
  {
    partNumber: null,
    sortOrder: "ASC",
    customerCode: "0046",
    aggregate: null,
    brand: null,
    fuelType: null,
    limit: 0,
    make: brandMatch.make,
    masterType: "model",
    model: null,
    offset: 0,
    primary: false,
    subAggregate: null,
    variant: null,
    year: null
  }
);

  const models =
    modelResponse.data.map(
      item => item.masterName
    );

  const modelMatch =
    fuzzyMatchVehicle(
      vahanData,
      {
        models
      }
    );

  // STEP 5
const variantResponse = await dearoCatalog(
  "getMasterList",
  {
    partNumber: null,
    sortOrder: "ASC",
    customerCode: "0046",
    aggregate: null,
    brand: null,
    fuelType: null,
    limit: 0,
    make: brandMatch.make,
    masterType: "variant",
    model: modelMatch.model,
    offset: 0,
    primary: false,
    subAggregate: null,
    variant: null,
    year: null
  }
);
console.log("Variant Response ----", variantResponse);
  const variants =
    variantResponse.data.map(
      item => item.masterName
    );

  const variantMatch =
    fuzzyMatchVehicle(
      vahanData,
      {
        variants
      }
    );

  return {
    vehicleNumber,
    make: brandMatch.make,
    model: modelMatch.model,
    variant: variantMatch.variant,
    fuelType: vahanData.fuel_type,
    year: vahanData.y_manufacturing,
    vahanData
  };
};

const getOrderHistoryForGms = async (outletCode) => {
  try {
    return await CartDao.findAllOrderHistoriesForGms(outletCode);
  } catch (err) {
    logger.error("OrderService getOrderHistoryForGms  Error:", err);
    throw err;
  }
};


export default { addToCart, getCartItems, updateQty, deleteCartItem, placeOrder, getOrderHistory, orderStatus, catalogueLogin, placeOrderNew, vehicleFuzzyMatch,getOrderHistoryForGms };
