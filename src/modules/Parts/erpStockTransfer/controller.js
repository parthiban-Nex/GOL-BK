import db from '../../index.js';
import logger from '../../../config/logger.js';
import erpStockTransferService from './service.js';
import auditLog from '../../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../../shared/applicationConstants.js';

const ErpStockTransfer = db.erpstocktransfer;
const ErpStockTransferPart = db.erpstocktransferparts;

const CreateErpStockTransfer = async (req, res, next) => {

  const auditData = {};
  auditData.menu_name = "ERP Stock Transfer";
  auditData.action = ACTION_ADD;

  try {

    const response = await erpStockTransferService.CreateErpStockTransfer(req.body);

    if (response.result === "success") {

      auditData.message = "ERP Stock Transfer created successfully";
      auditData.result = "success";
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: true,
        message: response.message,
      });

    } else {

      auditData.message = "ERP Stock Transfer creation failed";
      auditData.result = "failed";
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: false,
        message: response.message,
      });
    }

  } catch (error) {

    auditData.message = "ERP Stock Transfer error";
    auditData.result = "error";
    auditLog.createAuditLog(req, auditData);

    logger.error("ERP Stock Transfer Controller Error:", error);
    next(error);
  }
};

const GetErpStockTransfer = async (req, res, next) => {
  const auditData = {};
  auditData.menu_name = "ERP Stock Transfer";
  auditData.action = ACTION_GET;

  try {

    let { grnDetails: data, count } =
      await erpStockTransferService.GetErpStockTransfer(req.body, req.user);

    const responsedata = data.map((item) => {
      const { createdAt, ...rest } = item.dataValues;

      const date = createdAt.toISOString();
      const dateformat =
        date.slice(8, 10) + "-" +
        date.slice(5, 7) + "-" +
        date.slice(0, 4);

      return {
        ...rest,
        createdDate: dateformat,
        inward_status:
          item.dataValues.inward_status === 1 ? "Open" : "Completed",
      };
    });
    auditData.message = "ERP Stock Transfer data fetched";
    auditData.result = "success";
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: "Erp Stock Transfer data Fetched Successfully",
      data: responsedata,
      count,
    });

  } catch (err) {
    auditData.message = "ERP Stock Transfer fetch failed";
    auditData.result = "failed";
    auditLog.createAuditLog(req, auditData);

    logger.error("Erp Stock Transfer Controller Error:", err);
    next(err);
  }
};
const GetErpStockTransferForGRN = async (req, res, next) => {
  const auditData = {};
  auditData.menu_name = "ERP Stock Transfer";
  auditData.action = ACTION_GET;

  try {
    const data = await erpStockTransferService.geterpStockTransferforGrn(req.body, req.user);
    const datavalue = data[0]?.dataValues;
    // console.log(datavalue, "datavalue");
    if (!datavalue) {
      return res.status(404).json({
        requestSuccessful: false,
        message: "No Erp Stock Transfer data found",
      });
    }

    const { stocktransfererpparts, ...stocktransfererpdata } = datavalue;
    // console.log(stocktransfererpparts, "datavalue");

    const partmap = stocktransfererpparts?.map((item) => {
      const val = item?.dataValues || {};
      // const margin = (((val.listPrice - val.unitCost) / val.listPrice) * 100).toFixed(2);

      return {
        id: val.id,
        item_id: val?.erpitem?.id,
        "Parts Code": val.partsCode,
        Description: val.description,
        "Sup. inv qty": val.supInvQty,
        Rate: val.rate,
        Cost: val.cost,
        // "Margin %": margin,
        MRP: val.mrp,
        "Discount Amount": val.discount ?? 0,
        CGST: val.cgst ?? 0,
        SGST: val.sgst ?? 0,
        IGST: val.igst ?? 0,
        "Total Amount": "",
        hsnCode: val.hsnCode,
      };
    });
    auditData.message = "ERP Stock Transfer GRN data fetched";
    auditData.result = "success";
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: "Erp stock transfer data for GRN data fetched successfully",
      partdata: partmap,
      stocktransfererpdata: stocktransfererpdata,
    });

  } catch (err) {
    auditData.message = "ERP Stock Transfer GRN fetch failed";
    auditData.result = "failed";
    auditLog.createAuditLog(req, auditData);

    logger.error('Erp Stock Transfer Controller Error:', err);
    next(err);
  }
};


const controller = {
  CreateErpStockTransfer, GetErpStockTransfer, GetErpStockTransferForGRN
};

export default controller;