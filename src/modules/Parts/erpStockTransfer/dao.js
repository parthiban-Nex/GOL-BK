import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op } from 'sequelize';
import moment from "moment";
import { raw } from 'mysql2';

const ErpStockTransfer = db.erpstocktransfer;
const ErpStockTransferPart = db.erpstocktransferparts;
const outlets = db.outlets;

const CreateErpStockTransfer = async (data) => {

  const dmsOutletCodeErp = data.branchName;
  const [dmsOutletCodeRaw] = dmsOutletCodeErp.split("_");
  const dmsOutletCode = dmsOutletCodeRaw;

const despatchDate = data.despatchDate
  ? moment(data.despatchDate, "DD-MM-YYYY").format("YYYY-MM-DD")
  : null;

const deliveryDate = data.deliveryDate
  ? moment(data.deliveryDate, "DD-MM-YYYY").format("YYYY-MM-DD")
  : null;

const toShippedDate = data.toShippedDate
  ? moment(data.toShippedDate, "DD-MM-YYYY").format("YYYY-MM-DD")
  : null;

const invoiceDate = data.invoiceDate
  ? moment(data.invoiceDate, "DD-MM-YYYY").format("YYYY-MM-DD")
  : null;

  const query = `
    SELECT users.id 
    FROM outlets 
    LEFT JOIN employees ON employees.outletId = outlets.id
    LEFT JOIN users ON employees.id = users.employeeId
    INNER JOIN userrolemaps 
      ON userrolemaps.userId = users.id 
      AND roleId = 4
    WHERE outletCode = :OutletCode
  `;

  const spareUser = await db.sequelize.query(query, {
    replacements: { OutletCode: dmsOutletCode },
    type: db.Sequelize.QueryTypes.SELECT,
  });

  if (!spareUser || spareUser.length === 0) {
    throw new Error("DMS Outlet Not Match");
  }
  console.log('Spare User:', spareUser);

  const stockTransfer = await ErpStockTransfer.create({
    branchId: spareUser[0].id,
    branchName: data.branchName,
    invoiceNumber: data.invoiceNumber,
    invoiceDate: invoiceDate,
    invoiceAmount: data.invoiceAmount,
    customerName: data.customerName,
    customerCode: data.customerCode,
    mobileNumber: data.mobileNumber,
    orderNumber: data.orderNumber,
    despatchDate: despatchDate,
    deliveryDate: deliveryDate,
    shipmentNumber: data.shipmentNumber,
    toShippedDate: toShippedDate,
    inward_status: 1,
  });

  const parts = data.itemDetails || [];

  for (const item of parts) {

    await ErpStockTransferPart.create({
      erp_stock_transfer_id: stockTransfer.id,
      partsCode: item.partsCode,
      description: item.description,
      supInvQty: item.supInvQty,
      receivedQty: item.receivedQty,
      hsnCode: item.hsnCode,
      mrp: item.mrp,
      rate: item.rate,
      cost: item.cost,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      totalAmount: item.totalAmount,
    });

  }

  return stockTransfer;

};

const GetErpStockTransfer = async (reqData, user) => {
  try {
console.log('user in dao', user);
    const { searchKey, offset = 0, limit = 10 } = reqData;

    // STEP 1: get ERP customer code from outlet
    const outlet = await outlets.findOne({
      where: { id: user.outlet.id },
      attributes: ["mytvs_erp_cust_code"],
      raw: true,
    });

const erpCode = outlet?.mytvs_erp_cust_code?.replace(/\s/g, "");
    // STEP 2: search filter
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { shipmentNumber: { [Op.like]: `%${searchKey}%` } },
            { invoiceNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    // STEP 3: customerCode match
const userCondition = {
  customerCode: {
    [Op.like]: `%${erpCode}%`,
  },
};

    const grnDetails = await ErpStockTransfer.findAll({
      where: {
        ...searchCondition,
        ...userCondition,
      },
      attributes: [
        "id",
        "shipmentNumber",
        "invoiceNumber",
        "createdAt",
        "inward_status",
        "customerCode",
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const count = await ErpStockTransfer.count({
      where: userCondition,
    });

    return { grnDetails, count };

  } catch (err) {
    logger.error("Erp Stock Transfer DAO fetching error", err);
    throw err;
  }
};

const erpStockTransferDao = {
    CreateErpStockTransfer,GetErpStockTransfer
};

export default erpStockTransferDao;