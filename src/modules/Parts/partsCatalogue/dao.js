import db from '../../index.js';
import logger from '../../../config/logger.js';

const Cart = db.carts;
const OrderHistory = db.order_histories;
const CatalogueUsers = db.catalogueusers;

const findCartItem = async (userId, partNumber, outletCode=null) => {
  try {
    const where = {
      part_number: partNumber,
      status: 1
    };
    if (outletCode) {
      where.outletCode = outletCode;
    } else {
      where.user_id = userId;
    }
    return await Cart.findOne({
      where
    });

  } catch (err) {
    logger.error("CartDao findCartItem Error:", err);
    throw err;
  }
};

const createCartItem = async (data) => {
  try {
    return await Cart.create(data);
  } catch (err) {
    logger.error("CartDao createCartItem Error:", err);
    throw err;
  }
};

const updateCartItem = async (cartItem) => {
  try {
    return await cartItem.save();
  } catch (err) {
    logger.error("CartDao updateCartItem Error:", err);
    throw err;
  }
};
const findAllCartItems = async (userId, outletCode) => {
    try {
      console.log("Dao findAllCartItems called with userId ----", userId, "and outletCode ----", outletCode);
      const where = { status:1 };
      if(outletCode){
        where.outletCode =outletCode;
      }else{
        where.user_id = userId;
      }
      return await Cart.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });
    } catch (err) {
      logger.error("CartDao findAllCartItems Error:", err);
      throw err;
    }
  };
  
const saveOrderHistory = async (data) => {
  try {
    return await OrderHistory.create(data);
  } catch (err) {
    logger.error("OrderDao saveOrderHistory Error:", err);
    throw err;
  }
};

const updateCartStatus = async (userId, outletCode = null) => {
  try {
    console.log("Dao updateCartStatus called with userId ----", userId, "and outletCode ----", outletCode);
    const where = outletCode ? { outletCode: outletCode, status: 1 } : { user_id: userId, status: 1 };
    return await Cart.update(
      { status: 2 },
      { where }
    );
  } catch (err) {
    logger.error("OrderDao updateCartStatusForItems Error:", err);
    throw err;
  }
};

const findAllOrderHistories = async (userId, outletCode) => {
  try {
    console.log("Dao findAllOrderHistories called with userId ----", userId, "and outletCode ----", outletCode);
    const where = outletCode ? { outletCode: outletCode } : { user_id: userId };
    return await OrderHistory.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
  } catch (err) {
    logger.error("Dao findAllOrderHistories Error:", err);
    throw err;
  }
};

const getCatalogueUser = async (outletCode) => {
  try {
console.log("Dao getCatalogueUser called with outletCode ----", outletCode);
    return await CatalogueUsers.findOne({
      where: {
        outlet_code: outletCode
      }
    });
console.log("Dao getCatalogueUser response ----", user);
  } catch (err) {
    logger.error("Dao getCatalogueUser Error:", err);
    throw err;
  }
};

const saveCatalogueToken = async (payload) => {
  try {
console.log("Dao saveCatalogueToken called with payload ----", payload);
    const existingUser = await CatalogueUsers.findOne({
      where: {
        outlet_code: payload.outlet_code
      }
    });

    if (existingUser) {

      existingUser.token = payload.token;

      await existingUser.save();

      return existingUser;
    }
console.log("Dao saveCatalogueToken creating new record for outlet_code ----", payload.outlet_code);
    return await CatalogueUsers.create({
      outlet_code: payload.outlet_code,
      token: payload.token
    });

  } catch (err) {
    logger.error("Dao saveCatalogueToken Error:", err);
    throw err;
  }
};

const getOutletByCode = async (outletCode) => {
  try {
    return await db.outlets.findOne({
      where: {
        outletCode: outletCode,
      },
    });
  } catch (err) {
    logger.error("DAO getOutletByCode Error:", err);
    throw err;
  }
};

const findAllOrderHistoriesForGms = async (outletCode) => {
  try {
    
    return await OrderHistory.findAll({
      where: {
        customer_code: outletCode
      },
      order: [["createdAt", "DESC"]],
    });
  } catch (err) {
    logger.error("Dao findAllOrderHistoriesForGms Error:", err);
    throw err;
  }
};

export default {
  findCartItem,
  createCartItem,
  updateCartItem,
  findAllCartItems,
  saveOrderHistory,
  updateCartStatus,
  findAllOrderHistories,
  getCatalogueUser,
  saveCatalogueToken,
  getOutletByCode,
  findAllOrderHistoriesForGms
};
