import axios from 'axios';
import db from '../../index.js';
import logger from '../../../config/logger.js';
import OracleAutoGrnService from './service.js';
const StockTransferOracle = db.stocktransferoracle;
const StockTransferOraclePart = db.stocktransferoracleparts;
const Outlet=db.outlets
const StockTransferApiLog = db.stocktransferapilogs;
const CreateOracleStockTransfer = async (req, res, next) => {
  const data = req.body;
  const apiLog = await StockTransferApiLog.create({
    data: JSON.stringify(data),
    reg_no: data.shipmentNumber,
    created_by: 'StockTransferOracleToDMS',
    type: 'StockTransferOracleToDMS',

  });
  let response = {};
  let stockTransfer = {};
  let parts = [];
  const logId = apiLog.id;

  try {
    const { userName, password } = data;

    if (userName !== 'DMSSTO' || password !== 'Tv$@0987') {
            response = { requestSuccessful: false, errorDescription: 'Authentication Error' };
    return res.status(401).json({
      requestSuccessful: false,
      message: 'Unauthorized User',
    })
}

    const dmsOutletCodeOracle = data.DMSOutlet;
    const [dmsOutletCodeRaw, dmsOutletCodeSuffix] = dmsOutletCodeOracle.split('_');
    let dmsOutletCode = dmsOutletCodeRaw;

    if (dmsOutletCode === 'NMF') dmsOutletCode = 'FNMF';
    if (dmsOutletCode === 'VMF') dmsOutletCode = 'FVMF';

    // if (dmsOutletCodeSuffix === 'CV') {
    //   const forwarded = await axios.post(
    //     'https://tvsconnect.in/tvsfit_cv/stock_transfer_oracles/stock_transfer_data',
    //     data,
    //     { headers: { 'Content-Type': 'application/json' } }
    //   );

    //   response = forwarded.data;
    // }
    // else {
      

      let query = `
         SELECT users.id FROM dms.outlets 
left join dms.employees on employees.outletId = outlets.id
left join dms.users on employees.id = users.employeeId
inner join dms.userrolemaps on userrolemaps.userId = users.id and roleId=4
where outletCode= :OutletCode
      `;
      
          // Execute the query
          const spareUser = await db.sequelize.query(query, {
            replacements: {
                OutletCode: dmsOutletCode,
            },
            type: db.Sequelize.QueryTypes.SELECT,
          });

      console.log('Spare User:', spareUser);
      if(!spareUser || spareUser.length === 0) {
        response = { requestSuccessful: false, errorDescription: 'Dms Outlet Not Match' };
        return res.status(404).json({
          requestSuccessful: false,
          message: 'No Spare User found for the given DMS Outlet Code',
        });
        }

       stockTransfer = await StockTransferOracle.create({
        branch_id: spareUser[0].id,
        dmsStnNumber: data.dmsStnNumber,
        stnOrderRefNumber: data.stnOrderRefNumber,
        stnOrderRefNumber1: data.stnOrderRefNumber1,
        toCreationDate: data.toCreationDate,
        toCreatedBy: data.toCreatedBy,
        oracleTONo: data.oracleTONo,
        fromKiWarehouse: data.fromKiWarehouse,
        DMSWarehouse: data.DMSWarehouse,
        DMSOutlet: data.DMSOutlet,
        toShippedDate: data.toShippedDate,
        shipmentNumber: data.shipmentNumber,
        shipmentStatus: data.shipmentStatus,
        inward_status: 1,
      });

       parts = data.itemDetails || [];
      for (const item of parts) {
        await StockTransferOraclePart.create({
          stock_transfer_oracle_id: stockTransfer.id,
          itemNumber: item.itemNumber,
          itemDescription: item.itemDescription,
          transactionUOM: item.transactionUOM,
          transactionQty: item.transactionQty,
          lotNumber: item.lotNumber,
          lotDate: item.lotDate,
          hsnCode: item.hsnCode,
          mrp: item.mrp,
          listPrice: item.listPrice || item.unitCost,
          unitCost: item.unitCost,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          totalValue: item.totalValue,
        });
      }

       response = { requestSuccessful: true, message: 'Data Saved Successfully' };

              // }
  } catch (error) {
    response = {
      requestSuccessful: false,
      errorDescription: 'Internal Server Error',
      details: error.message,
    };
    logger.error('Stock Transfer Oracle Controller Error:', error);
    next(error)
  }
   finally {
    await StockTransferApiLog.update(
      { response: JSON.stringify(response) },
      { where: { id: logId } }
    );
    res.status(200).json(response);
  }
};

const GetOracleStockTransfer = async (req, res , next) => {   
    try{ 
     let {grnDetails:data,count}= await OracleAutoGrnService.GetOracleStockTransfer(req.body,req.user);
     console.log(data,"data")
     const responsedata=data.map((item)=>{
      const {createdAt,...rest}=item.dataValues
      const date=createdAt.toISOString()
      const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)

      return({...rest,createdDate:dateformat,inward_status:item.dataValues.inward_status===1?"Open":"Completed",
      })
     })
      return res.status(200).json({
        requestSuccessful: true,
        message: "Oracle Stock Transfer data Fetched Successfully ",
        data:responsedata,
        count
    });
     
     } catch (err) {
         logger.error('stocktransfer Contrller Error:', err);
     next(err);
     }
     }

     const GetOracleStockTransferForGRN = async (req, res, next) => {
  try {
    const data = await OracleAutoGrnService.getOracleStockTransferforGrn(req.body, req.user);
    const datavalue = data[0]?.dataValues;
    if (!datavalue) {
      return res.status(404).json({
        requestSuccessful: false,
        message: "No Oracle Stock Transfer data found",
      });
    }

    const { stocktransferoracleparts, ...stocktransferdata } = datavalue;
    console.log(stocktransferoracleparts, "datavalue");

    const partmap = stocktransferoracleparts?.map((item) => {
      const val = item?.dataValues || {};
      // const margin = (((val.listPrice - val.unitCost) / val.listPrice) * 100).toFixed(2);

      return {
        id: val.id,
        item_id:val?.oracleitem?.id,
        "Parts Code": val.itemNumber,
        Description: val.itemDescription,
        "Sup. inv qty": val.transactionQty,
        Rate: val.listPrice,
        Cost: val.unitCost,
        // "Margin %": margin,
        MRP: val.mrp,
        "Discount Amount": val.discount ?? 0,
        CGST: val.cgst ?? 0,
        SGST: val.sgst ?? 0,
        IGST: val.igst ?? 0,
        "Total Amount": "",
      };
    });

    return res.status(200).json({
      requestSuccessful: true,
      message: "oracle stock transfer data for GRN data fetched successfully",
      partdata: partmap,
      stocktransferdata: stocktransferdata,
    });

  } catch (err) {
    logger.error('Oracle Stock Transfer Controller Error:', err);
    next(err);
  }
};

const controller = {
  CreateOracleStockTransfer,GetOracleStockTransfer,GetOracleStockTransferForGRN
};

export default controller;