import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op } from 'sequelize';
import axios from 'axios';
const StockTransferOracle = db.stocktransferoracle;
const StockTransferOraclePart = db.stocktransferoracleparts;
const StockTransferApiLog = db.stocktransferapilogs;
const GetOracleStockTransfer = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { 
                shipmentNumber: { [Op.like]: `%${searchKey}%` },
                oracleTONo: { [Op.like]: `%${searchKey}%` },
         },
          ]
        } : {};
        const userCondition = {DMSOutlet:{[Op.like]:`${user.outlet.outletCode}%`}};


        const grnDetails = await StockTransferOracle.findAll({
          where: { ...searchCondition, ...userCondition },
          
            attributes: [
                'id',
                'shipmentNumber',
                'oracleTONo',
                'fromKiWarehouse',
                'created',
                'inward_status',

            ],
            order: [[db.Sequelize.col('created'), 'DESC']], // Correct order clause
            limit,
          offset,
  
        // Group by the GRN to calculate sum correctly for each GRN
      });
      let count=await StockTransferOracle.count({where:userCondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error('Oracle Stock Transfer fetching error', err);
    }
  };

  const getOracleStockTransferforGrn = async (body, user) => {
  try {
    let OracleStockTransferDetails = await StockTransferOracle.findAll({
      where: { id: body.id },
      attributes: [
        'fromKiWarehouse',
        'shipmentNumber',
        ],
        include: [
          {
            model: StockTransferOraclePart,
            attributes: [
              "id",
              'itemNumber',
              'itemDescription',
              'transactionQty',
              'listPrice',
              'cgst',
              'sgst',
              'igst',
              "unitCost",
              "mrp",
            ],
            as: 'stocktransferoracleparts',
           include: [
              {
                model: db.items,
                attributes: ['id'],
                as: 'oracleitem',
          },
            ],
          },
      ],
      group: ['stock_transfer_oracles.id', 'stocktransferoracleparts.id'],

    });

    return OracleStockTransferDetails;
  } catch (err) {
    logger.error('Oracle Stock Transfer fetching error', err);
  }
};

const updateOracleStockTransferStatus=async (id,user)=>{
  try {
    
    await StockTransferOracle.update({inward_status:2},{where:{id:id}})
    let data=await StockTransferOracle.findOne({where:{id:id}})
    return data;
  }
  catch(err){
    logger.error('Oracle Stock Transfer status update error', err);
  }
}

const updateOracleStockTransfer=async (oracleid,grnid)=>{
  try {
    console.log(oracleid,grnid, 'oracleid');
    await StockTransferOracle.update({grn_id:grnid},{where:{id:oracleid}})
    let data=await StockTransferOracle.findOne({where:{id:oracleid}})
    return data;
  }
  catch(err){
    logger.error('oracle stock transfer status update error', err);
  }
}

const updateOracleStockTransferParts=async (parts)=>{
  try {
    let data=[]
    console.log(parts, 'oracleparts');
    for (const item of parts) {
   
      await StockTransferOraclePart.update({grn_parts_id:item.id},{where:{id:item.oracle_stocktransferparts_id}});
      let res=await StockTransferOracle.findOne({where:{id:item.oracle_stocktransferparts_id}})
      data.push(res)
    }
    return data;
  }
  catch(err){
    logger.error('Oracle Parts update error', err);
  }
}

const acknowledgeOracle=async (oracleid,grn)=>{
 try {
    // Fetch StockTransferOracle details
    const stockTransferOracle = await StockTransferOracle.findOne({
      where: { id: oracleid },
    });

    if (!stockTransferOracle) throw new Error("StockTransferOracle not found");

    // Fetch related GRN
      
// date format YYYY-MM-DD
  let formattedDate = grn.createdAt.toISOString();
  let date = formattedDate.slice(0,10)
    // Construct payload
    const payload = {
      GRNNumber: grn.grn_no,
      SaleOrderNUmber: stockTransferOracle.stnOrderRefNumber1,
      StockNote: stockTransferOracle.dmsStnNumber,
      GRNCreationDate: date,
      GRNCreatedBy: 'DMS_User',
      TransferOrderNumber: stockTransferOracle.oracleTONo,
      BusinessUnit: 'Ki Mobility Solutions Services',
      OracleShipmentNumber: stockTransferOracle.shipmentNumber,
    };
  console.log(payload, "grn");

    // // Oracle integration config
    const url = 'https://tasl-prod-oic-nrykozbvnktn-bo.integration.ocp.oraclecloud.com:443/ic/api/integration/v1/flows/rest/INT36_DMS_CREATE_GRN/1.0/createGRN';
    const auth = {
      username: 'OICProdAdmin',
      password: '0!CpR0D@dm!n',
    };

    // // Make request to Oracle
    const response = await axios.post(url, payload, {
      auth,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
   console.log(response.data, "response");
    // Save log
    await StockTransferApiLog.create({
      reg_no: stockTransferOracle.shipmentNumber,
      data: JSON.stringify(payload),
      created_by: 'dms',
      type: 'update_dms_oracle',
      response: JSON.stringify(response.data),
    });

    console.log("Oracle GRN acknowledged successfully.");

  } catch (error) {
    console.error('Error acknowledging Oracle GRN:', error);
    logger.error('Oracle Acknowledgement error', err);
    // optionally log error to DB
  }
}
const OracleAutoGrnService = {
  GetOracleStockTransfer,getOracleStockTransferforGrn,updateOracleStockTransferStatus,
  updateOracleStockTransfer,updateOracleStockTransferParts,acknowledgeOracle
}
export default OracleAutoGrnService;