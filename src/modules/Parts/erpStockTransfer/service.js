import db from '../../index.js';
import logger from '../../../config/logger.js';
import erpStockTransferDao from "./dao.js";

const ErpStockTransferApiLog = db.erpstocktransferapilogs;
const ErpStockTransfer = db.erpstocktransfer;
const ErpStockTransferPart = db.erpstocktransferparts;


const CreateErpStockTransfer = async (data) => {

  let apiLog;

  try {

    apiLog = await ErpStockTransferApiLog.create({
      data: JSON.stringify(data),
    });

    const result = await erpStockTransferDao.CreateErpStockTransfer(data);

    await ErpStockTransferApiLog.update(
      { response: JSON.stringify(result) },
      { where: { id: apiLog.id } }
    );

    return {
      result: "success",
      message: "Data Saved Successfully",
    };

  } catch (error) {

    logger.error("ERP Stock Transfer Service Error:", error);

    if (apiLog) {
      await ErpStockTransferApiLog.update(
        { response: JSON.stringify({ error: error.message }) },
        { where: { id: apiLog.id } }
      );
    }

    return {
      result: "failed",
      message: "Internal Server Error",
    };
  }
};

const GetErpStockTransfer = async (reqData, user) => {
  try {

    const { grnDetails, count } =
      await erpStockTransferDao.GetErpStockTransfer(reqData, user);

    return { grnDetails, count };

  } catch (error) {
    logger.error("ERP Stock Transfer Service Error:", error);
    throw error;
  }
};

const geterpStockTransferforGrn = async (body, user) => {
  try {
    let ErpStockTransferDetails = await ErpStockTransfer.findAll({
      where: { id: body.id },
      attributes: [
        'invoiceNumber',
        'shipmentNumber',
      ],
      include: [
        {
          model: ErpStockTransferPart,
          attributes: [
            "id",
            'partsCode',
            'description',
            'supInvQty',
            'rate',
            'cgst',
            'sgst',
            'igst',
            "cost",
            "mrp",
            'hsnCode',
          ],
          as: 'stocktransfererpparts',
          include: [
            {
              model: db.items,
              attributes: ['id'],
              as: 'erpitem',
            },
          ],
        },
      ],
      group: ['erp_stock_transfers.id', 'stocktransfererpparts.id'],

    });

    return ErpStockTransferDetails;
  } catch (err) {
    logger.error('ERP Stock Transfer fetching error', err);
  }
};

const updateErpStockTransferStatus = async (id, user) => {
  try {

    await ErpStockTransfer.update({ inward_status: 2 }, { where: { id: id } })
    let data = await ErpStockTransfer.findOne({ where: { id: id } })
    return data;
  }
  catch (err) {
    logger.error('ERP Stock Transfer status update error', err);
  }
}

const updateErpStockTransfer = async (erpid, grnid) => {
  try {
    await ErpStockTransfer.update({ grn_id: grnid }, { where: { id: erpid } })
    let data = await ErpStockTransfer.findOne({ where: { id: erpid } })
    return data;
  }
  catch (err) {
    logger.error('ERP Stock Transfer status update error', err);
  }
}

const updateErpStockTransferParts = async (parts) => {
  try {
    let data = []
    for (const item of parts) {

      await ErpStockTransferPart.update({ grn_parts_id: item.id }, { where: { id: item.erp_stocktransferparts_id } });
      let res = await ErpStockTransferPart.findOne({ where: { id: item.erp_stocktransferparts_id } })
      data.push(res)
    }
    return data;
  }
  catch (err) {
    logger.error('ERP Stock Transfer Parts update error', err);
  }
}



const erpStockTransferService = {
  CreateErpStockTransfer, GetErpStockTransfer, geterpStockTransferforGrn, updateErpStockTransferStatus, updateErpStockTransfer, updateErpStockTransferParts
};

export default erpStockTransferService;