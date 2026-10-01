import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op } from 'sequelize';
const StockTransfer = db.stocktransfer;
const StockTrasferParts=db.stocktransferparts
const Stocks = db.stocks;
const Stocklog = db.stocktransferlog;
const Outlet=db.outlets
const StockTransferUpdate = db.stockTransferUpdate;
const StockTransferReq = db.stocktransferrequest;
const StockTransferReqParts = db.stocktransferrequestparts;
// inital ST update table
const createStockTransferUpdate = async (data) => {
  try {
      const newRecord = await StockTransferUpdate.create({
        stock_transfer_id: data.stock_transfer_id,
        invoice_number: data.invoice_number,
        grand_total: data.grand_total,
        pass_args: data.pass_args,
        created_by: data.created_by
      });

      return { success: true, data: newRecord };
  } catch (error) {
      return { success: false, error: error.message };
  }
};
// after res ST update table

const StockTransferUpdateRes = async (stockTransferID, updateData) => {
  try {
      const updatedRecord = await StockTransferUpdate.update(updateData, {
          where: { id: stockTransferID },
      });

      return { success: true, data: updatedRecord };
  } catch (error) {
      return { success: false, error: error.message };
  }
};

// delete ST record
const deletedStockTransfer = async (id) => {
  try {
      const deletedStockTransfer = await StockTransfer.destroy({
          where: { id: id }
      });

      if (deletedStockTransfer == 0) {
          return { success: false, message: "Stock Transfer not found" };
      }

      return { success: true, message: "Stock Transfer ID deleted successfully" };
  } catch (error) {
      console.error("Error deleting Stock Transfer:", error);
      return { success: false, error: error.message };
  }
};

const getOutletDetails = async (outletId)=>{
  try {
return await db.outlets.findOne({
  where:{id:outletId}
});

  } catch(err){
    logger.error('Error fetching outlet details:', err);
    throw err;
  }
}
const generateInvoiceNo = async (documentType,outletCode,outletid) => {
    const prefix = documentType.split('(')[0].trim();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
    // Get the last GRN with the same document type
    const lastno = await StockTransfer.findOne({
      where: { invoice_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`},
         outlet_id: outletid },
      order: [['createdAt', 'DESC']],
    });
  
    let newNo = 1;
    console.log(lastno, 'lastgrn');
    if (lastno) {
      const latestno = lastno?.dataValues?.invoice_number?.split('-')[2];
      newNo = parseInt(latestno, 10) + 1;
    }
  
    const paddedNo = String(newNo).padStart(4, '0');
    return `${prefix}-${outletCode}${financialYear}-${paddedNo}`;
  };

const generateInvoiceNoForReq = async (documentType,outletCode,outletid) => {
    const prefix = documentType.split('(')[0].trim();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
    // Get the last GRN with the same document type
    const lastno = await StockTransferReq.findOne({
      where: { invoice_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`},
         outlet_id: outletid },
      order: [['createdAt', 'DESC']],
    });
  
    let newNo = 1;
    console.log(lastno, 'lastgrn');
    if (lastno) {
      const latestno = lastno?.dataValues?.invoice_number?.split('-')[2];
      newNo = parseInt(latestno, 10) + 1;
    }
  
    const paddedNo = String(newNo).padStart(4, '0');
    return `${prefix}-${outletCode}${financialYear}-${paddedNo}`;
  };
const CreateStockTransfer = async (body, user) => {
    const document_type = body.document_type;
    const invoice_number = await generateInvoiceNo(
      document_type,
      user.outlet.outletCode,
      user.outlet.id
    );
  const bodydata = {
    ...body,
    outlet_id: user.outlet.id,
    outlet_code:user.outlet.outletCode,
    createdBy: user.id,
    invoice_number:invoice_number
  };

  let data = {};
  try {
    data = StockTransfer.create(bodydata);
  } catch (err) {
    logger.error('New StockTransfer error', err);
  }

  return data;
};

const CreateStockTransferPart = async (body, user,id) => {
    const bodydata = body.map((item) => ({
      ...item,
      outlet_id: user.outlet.id,
      createdBy: user.id,
      stock_transfer_id:id
    }));
  
    let data = {};
    try {
      data = StockTrasferParts.bulkCreate(bodydata);
    } catch (err) {
      logger.error('New Countersale error', err);
    }
  
    return data;
  };
  

const Updatestock = async (items,user) => {
  try {
    const results = [];

    // Iterate through the array of items
    for (const item of items) {
      let remainingQty = item.quantity;
      const itemId = item.item_id;

      // Fetch stocks related to the item_id
      const stocks = await Stocks.findAll({
        where: { item_id: itemId,outlet_id: user.outlet.id, },
      });

      for (const stock of stocks) {
        if (remainingQty <= 0) break;

        const stockQty = stock.quantity;
        let reducedQty = 0;

        // Check if stock quantity is sufficient
        if (stockQty >= remainingQty) {
          reducedQty = remainingQty;
          await stock.update({ quantity: stockQty - remainingQty });
          remainingQty = 0;
        } else {
          reducedQty = stockQty;
          await stock.update({ quantity: 0 });
          remainingQty -= stockQty;
        }

        // Push the stock_id and reduced quantity to the results array
        if (reducedQty > 0) {
          results.push({
            stock_id: stock.id,
            quantity: reducedQty,
            stocktransfer_part_id: item.id,
          });
        }
      }

      // If there's still remaining quantity that couldn't be fulfilled
      if (remainingQty > 0) {
        throw new Error(`Insufficient stock for item_id: ${itemId}`);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error reducing stock quantity:', error);
  }
};

const CreateStocklog = async (body) => {
  let data = {};
  //   const addgrnid=body.map((item)=>({...item,grn_id:grn["dataValues"]["id"]}))
  try {
    data = Stocklog.bulkCreate(body);
  } catch (err) {
    logger.error('New Stocklog error', err);
  }

  return data;
};

const GetStockTransfer = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { invoice_number: { [Op.like]: `%${searchKey}%` } },
          ]
        } : {};
        const userCondition = {outlet_id:user.outlet.id};
       
  
        const grnDetails = await StockTransfer.findAll({
          where: { ...searchCondition, ...userCondition },
          
            attributes: [
              'invoice_number',
                'createdAt',
                'id',
                "to_outlet_code",
                "to_warehouse_code",
                'grand_total',
                'gatepass_status'
            ],
            order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
            limit,
          offset,
  
        // Group by the GRN to calculate sum correctly for each GRN
      });
      let count=await StockTransfer.count({where:userCondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error(' Stock Transfer fetching error', err);
    }
  };

  const GetInwardStockTransfer = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { invoice_number: { [Op.like]: `%${searchKey}%` } },
          ]
        } : {};
        const userCondition = {to_outlet_id:user.outlet.id,status:2};
       
  
        const grnDetails = await StockTransfer.findAll({
          where: { ...searchCondition, ...userCondition },
          
            attributes: [
              'invoice_number',
                'createdAt',
                'id',
                "outlet_code",
                'grand_total'
            ],
            order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
            limit,
          offset,
  
        // Group by the GRN to calculate sum correctly for each GRN
      });
      let count=await StockTransfer.count({where:userCondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error(' Stock Transfer fetching error', err);
    }
  };

  const generateStockTransferpdf = async (body, user) => {
    try {
      const query = `
        SELECT 
          stocktransfers.id,
          stocktransfers.invoice_number,
          stocktransfers.createdAt,
          (
            SELECT ROUND(SUM(stocktransferparts.quantity), 2)
            FROM stocktransferparts
            WHERE stocktransferparts.stock_transfer_id = stocktransfers.id
          ) AS total_quantity,
          (
            SELECT ROUND(SUM(stocktransferparts.rate), 2)
            FROM stocktransferparts
            WHERE stocktransferparts.stock_transfer_id = stocktransfers.id
          ) AS total_rate,
          (
            SELECT ROUND(SUM(((stocktransferparts.rate) * (stocktransferparts.igst)) / 100), 2)
            FROM stocktransferparts
            WHERE stocktransferparts.stock_transfer_id = stocktransfers.id
          ) AS total_igst,
          (
            SELECT ROUND(SUM(stocktransferparts.total), 2)
            FROM stocktransferparts
            WHERE stocktransferparts.stock_transfer_id = stocktransfers.id
          ) AS pdf_total,
  
          stocktransferparts.id AS stocktransferparts_id,
          stocktransferparts.item_code,
          stocktransferparts.item_description,
          stocktransferparts.quantity,
          stocktransferparts.rate,
          stocktransferparts.igst,
          stocktransferparts.total,
          ROUND((stocktransferparts.rate * stocktransferparts.igst) / 100, 2) AS igst_amount,
  
          stocktransferoutlet.id AS stocktransferoutlet_id,
          stocktransferoutlet.outletName AS stocktransferoutlet_outletName,
          stocktransferoutlet.address1 AS stocktransferoutlet_address1,
          stocktransferoutlet.address2 AS stocktransferoutlet_address2,
          stocktransferoutlet.city AS stocktransferoutlet_city,
          stocktransferoutlet.state AS stocktransferoutlet_state,
          stocktransferoutlet.pincode AS stocktransferoutlet_pincode,
          stocktransferoutlet.gstIn AS stocktransferoutlet_gstIn,
  
          stocktransfervendor.id AS stocktransfervendor_id,
          stocktransfervendor.vendorName AS stocktransfervendor_vendorName,
          stocktransfervendor.address1 AS stocktransfervendor_address1,
          stocktransfervendor.address2 AS stocktransfervendor_address2,
          stocktransfervendor.city AS stocktransfervendor_city,
          stocktransfervendor.state AS stocktransfervendor_state,
          stocktransfervendor.pincode AS stocktransfervendor_pincode,
          stocktransfervendor.gstIn AS stocktransfervendor_gstIn,
          stockTransferBDO.invoice_bdoack_no,
          stockTransferBDO.irn_no,
          stockTransferBDO.signed_qr_code,
          stockTransferBDO.invoice_bdoack_date
  
        FROM stocktransfers
        LEFT JOIN stocktransferparts 
          ON stocktransfers.id = stocktransferparts.stock_transfer_id
        LEFT JOIN outlets AS stocktransferoutlet 
          ON stocktransfers.to_outlet_id = stocktransferoutlet.id
        LEFT JOIN stock_transfer_updates AS stockTransferBDO
        ON stocktransfers.id = stockTransferBDO.stock_transfer_id
        LEFT JOIN vendors AS stocktransfervendor 
          ON stocktransfers.to_warehouse_id = stocktransfervendor.id
        WHERE stocktransfers.id = :id
        GROUP BY stocktransfers.id, stocktransferparts.id, stocktransferoutlet.id, stocktransfervendor.id,stockTransferBDO.id;
      `;
  
      const stocktransferdetails = await db.sequelize.query(query, {
        replacements: { id: body.id },
        type: db.Sequelize.QueryTypes.SELECT,
      });
  
      return stocktransferdetails;
    } catch (err) {
      logger.error('Stocktransfers fetching error', err);
    }
  };
   

 
  const getStockTransferForInward = async (reqData,user) => {
    try {
        const stocktransferdetails = await StockTransfer.findAll({
          where: { id:reqData.id },
          
            attributes: [
                'id',
                'outlet_code',
                'invoice_number',
                'createdAt',
                'grand_total'
            ],
          include:[
            {
              model:StockTrasferParts,
              as:"stocktransferparts",
              attributes:["id","item_id","item_code","item_description","quantity","rate","cost","mrp","igst","total"],
          }
        ]
  
      });
  
      return stocktransferdetails;
    } catch (err) {
      logger.error(' CounterSale fetching error', err);
    }
  };

  const UpdateStockTransferStatus = async (id) => {
    let updatedPart = {};
    try {
        const [affectedCount] = await StockTransfer.update(
          { status: 1 },
          {
            where: {
              id: id,
            },
          }
        );
        if (affectedCount > 0) {
           updatedPart = await StockTransfer.findByPk(id);
        }
      
    } catch (err) {
      logger.error('New Stock Transfer error', err);
    }
  
    return updatedPart;
  };

  const getStockTransferReport = async (reqData, user) => {
    try {
      const {  fromDate, toDate } = reqData;

 let outletCondition = "stocktransfers.outlet_id = :outlet_id";
    let replacements = { fromDate: fromDate || null, toDate: toDate ? `${toDate} 23:59:59` : null };

    if (user.reportAccess == 1) {
      // Fetch outlet_id dynamically
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        outletCondition = `stocktransfers.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
  
      // Build base query
      let query = `
        SELECT stocktransfers.to_outlet_code, stocktransfers.invoice_number, stocktransfers.document_type,stocktransfers.createdAt, 
          stocktransferparts.item_code, stocktransferparts.item_description, stocktransferparts.rate,stocktransferparts.cost,
          stocktransferparts.mrp,stocktransferparts.quantity,stocktransferparts.igst,
          stock_transfer_updates.irn_no,
          stock_transfer_updates.invoice_bdoack_no,
          stock_transfer_updates.invoice_bdoack_date,
          items.hsnCode,uom.uomType,itemcategories.itemCategorie,
               aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
        FROM stocktransfers AS stocktransfers
        LEFT JOIN stocktransferparts AS stocktransferparts ON stocktransferparts.stock_transfer_id = stocktransfers.id
        LEFT JOIN items as items ON stocktransferparts.item_id=items.id
        LEFT JOIN uom as uom ON items.uomId=uom.id
        LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
        LEFT JOIN aggregates as aggregates ON items.aggregateId=aggregates.id
        LEFT JOIN subaggregates as subaggregates ON items.subaggregateId=subaggregates.id
        LEFT JOIN makes as makes ON items.makeId=makes.id
        LEFT JOIN models as models ON items.modelId=models.id
        LEFT JOIN stock_transfer_updates as stock_transfer_updates ON stock_transfer_updates.stock_transfer_id = stocktransfers.id
  
      
        WHERE ${outletCondition}
      `;
  
      // Append date condition if both fromDate and toDate are provided
      if (fromDate && toDate) {
        query += `
          AND stocktransfers.createdAt BETWEEN :fromDate AND :toDate
        `;
      }
  
     
  
      // Add the order by clause
      query += `
        ORDER BY stocktransfers.createdAt DESC
      `;
  
      // Execute the query
      const result = await db.sequelize.query(query, {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT,
      });
  
      if (!result || result.length === 0) {
        return []; // Return an empty array or a message indicating no data found
      }
      return result;
    } catch (err) {
      logger.error('Item Search fetching error', err);
    }
  };
const generateStockTransferGatePassNo = async (outletCode,outletid) => {
  const prefix = "SOUT";
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  const lastno = await StockTransfer.findOne({
    where: { 
      outlet_id: outletid,
      gatepass_invoice_no: {
        [Op.like]: `${prefix}-${outletCode}${financialYear}-%` // Match the current financial year
      }
     },
    order: [['createdAt', 'DESC']],
  });

  let newNo = 1;
  console.log(lastno, 'lastgrn');
  if (lastno) {
    const latestno = lastno?.dataValues?.gatepass_invoice_no?.split('-')[2];
    newNo = parseInt(latestno, 10) + 1;
  }

  const paddedNo = String(newNo).padStart(6, '0');
  return `${prefix}-${outletCode}${financialYear}-${paddedNo}`;
};
  const createStockTransferGatePass=async (body,user)=>{
    try {
      let data={}
      const {id,currentDateTime} =body
      const gatePassNo=await generateStockTransferGatePassNo(user.outlet.outletCode,
        user.outlet.id)
        console.log(gatePassNo,"gatepassno")
        await StockTransfer.update({gatepass_invoice_no:gatePassNo,gatepass_status:1,gatepass_checkout_time:currentDateTime
          // modifiedBy:user.id
        },{where:{id:id}})
      
      data=await StockTransfer.findOne({where:{id:id}})
      return data
    }
    catch(err){
      logger.error('Stock Transfer Gate Pass update error', err);
    }
  }
  
  const generateStockTransferGatePassPdf = async (body, user) => {
    try {
      const query = `
        SELECT 
          stocktransfers.id,
          stocktransfers.invoice_number,
          stocktransfers.createdAt,
          stocktransfers.grand_total,
          stocktransfers.gatepass_invoice_no,
          stocktransfers.gatepass_checkout_time,
          stocktransferoutlet.id AS stocktransferoutlet_id,
          stocktransferoutlet.outletName AS stocktransferoutlet_outletName,
          stocktransferoutlet.address1 AS stocktransferoutlet_address1,
          stocktransferoutlet.address2 AS stocktransferoutlet_address2,
          stocktransferoutlet.city AS stocktransferoutlet_city,
          stocktransferoutlet.state AS stocktransferoutlet_state,
          stocktransferoutlet.pincode AS stocktransferoutlet_pincode,
          stocktransferoutlet.gstIn AS stocktransferoutlet_gstIn,
  
          stocktransfervendor.id AS stocktransfervendor_id,
          stocktransfervendor.vendorName AS stocktransfervendor_vendorName,
          stocktransfervendor.address1 AS stocktransfervendor_address1,
          stocktransfervendor.address2 AS stocktransfervendor_address2,
          stocktransfervendor.city AS stocktransfervendor_city,
          stocktransfervendor.state AS stocktransfervendor_state,
          stocktransfervendor.pincode AS stocktransfervendor_pincode,
          stocktransfervendor.gstIn AS stocktransfervendor_gstIn
  
        FROM stocktransfers
        LEFT JOIN outlets AS stocktransferoutlet 
          ON stocktransfers.to_outlet_id = stocktransferoutlet.id
        LEFT JOIN vendors AS stocktransfervendor 
          ON stocktransfers.to_warehouse_id = stocktransfervendor.id
        WHERE stocktransfers.id = :id
        GROUP BY stocktransfers.id, stocktransferoutlet.id, stocktransfervendor.id;
      `;
  
      const stocktransferdetails = await db.sequelize.query(query, {
        replacements: { id: body.id },
        type: db.Sequelize.QueryTypes.SELECT,
      });
  
      return stocktransferdetails;
    } catch (err) {
      logger.error('Stocktransfers fetching error', err);
    }
  };

const CreateStockTransferReq = async (body, user) => {
    const document_type = body.document_type;
    const invoice_number = await generateInvoiceNoForReq(
      document_type+"REQ",
      user.outlet.outletCode,
      user.outlet.id
    );
  const bodydata = {
    ...body,
    outlet_id: user.outlet.id,
    outlet_code:user.outlet.outletCode,
    createdBy: user.id,
    invoice_number:invoice_number
  };

  let data = {};
  try {
    data = StockTransferReq.create(bodydata);
  } catch (err) {
    logger.error('New StockTransfer error', err);
  }

  return data;
};

const CreateStockTransferReqPart = async (body, user,id) => {
    const bodydata = body.map((item) => ({
      ...item,
      outlet_id: user.outlet.id,
      createdBy: user.id,
      stock_transfer_req_id:id
    }));
  
    let data = {};
    try {
      data = StockTransferReqParts.bulkCreate(bodydata);
    } catch (err) {
      logger.error('New Countersale error', err);
    }
  
    return data;
  };

  const GetStockTransferReq = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { invoice_number: { [Op.like]: `%${searchKey}%` } },
          ]
        } : {};

         let combinedCondition = {};
      // if (user.reportAccess == 1){ 
      //             combinedCondition = {
      //                 ...searchCondition, outlet_id: {
      //                     [Op.in]: db.sequelize.literal(
      //                         `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
      //                     )
      //                 },
      //                 status:2
                     
      //             };
      //         }
      //         else {
                  combinedCondition = {
                      ...searchCondition, 
                      to_outlet_id: user.outlet.id,
                      status:2
                      
                  // };
              }
       
  
        const grnDetails = await StockTransferReq.findAll({
          where: combinedCondition,
          
            attributes: [
              'invoice_number',
                'createdAt',
                'id',
                // 'to_outlet_id',
                ["outlet_code","to_outlet_code"],
                // "to_warehouse_code",
                'grand_total',
                // 'gatepass_status'
            ],
            order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
            limit,
          offset,
  
      });

         let countcondition={}
  //   if (user.reportAccess == 1){ 
  //     countcondition = {
  //          outlet_id: {
  //             [Op.in]: db.sequelize.literal(
  //                 `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
  //             )
  //         },
  //         status:2
  //     };
  // }
  // else {
      countcondition = {
          to_outlet_id: user.outlet.id,
          status:2
    
      };
  // }
      let count=await StockTransferReq.count({where:countcondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error(' Stock Transfer Req fetching error', err);
    }
  };

    const GetStockTransferReqFrom = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { invoice_number: { [Op.like]: `%${searchKey}%` } },
          ]
        } : {};

         let combinedCondition = {};
      // if (user.reportAccess == 1){ 
      //             combinedCondition = {
      //                 ...searchCondition, outlet_id: {
      //                     [Op.in]: db.sequelize.literal(
      //                         `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
      //                     )
      //                 },
      //                 status:2
                     
      //             };
      //         }
      //         else {
                  combinedCondition = {
                      ...searchCondition, 
                      outlet_id: user.outlet.id,
                      // status:2
                      
                  // };
              }
       
  
        const grnDetails = await StockTransferReq.findAll({
          where: combinedCondition,
          
            attributes: [
              'invoice_number',
                'createdAt',
                'id',
                // 'to_outlet_id',
                "to_outlet_code",
                // "to_warehouse_code",
                'grand_total',
                'status'
                // 'gatepass_status'
            ],
            order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
            limit,
          offset,
  
      });

         let countcondition={}
  //   if (user.reportAccess == 1){ 
  //     countcondition = {
  //          outlet_id: {
  //             [Op.in]: db.sequelize.literal(
  //                 `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
  //             )
  //         },
  //         status:2
  //     };
  // }
  // else {
      countcondition = {
          outlet_id: user.outlet.id,
          // status:2
    
      };
  // }
      let count=await StockTransferReq.count({where:countcondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error(' Stock Transfer Req fetching error', err);
    }
  };

const getStockTransferReqForApprove = async (reqData, user) => {
  try {
    const result = await db.sequelize.query(
      `
      SELECT 
          str.id AS stock_transfer_req_id,
          str.to_outlet_id,
          str.to_outlet_code,
          str.document_type,
          str.outlet_id,
          str.outlet_code,


          strp.id AS part_id,
          strp.item_id,
          strp.item_code,
          strp.item_description,
          strp.quantity,
          strp.rate,
          strp.cost,
          strp.mrp,
          strp.igst,
          strp.total,
          strp.hsn_code,
          COALESCE(SUM(st.quantity), 0) AS available_stock
      FROM stocktransferrequests AS str
      JOIN stocktransferreqparts AS strp 
          ON strp.stock_transfer_req_id = str.id
      LEFT JOIN stocks AS st 
          ON st.item_id = strp.item_id 
          AND st.outlet_id = :outlet_id
      WHERE str.id = :id
      GROUP BY strp.id
      `,
      {
        replacements: { id: reqData.id, outlet_id: user.outlet.id },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    return result;
  } catch (err) {
    logger.error('Stock Transfer fetching error', err);
    throw err;
  }
};


const UpdateStockTransferReqStatus = async (id) => {
  let updatedPart = {};
  try {
      const [affectedCount] = await StockTransferReq.update(
        { status: 1 },
        {
          where: {
            id: id,
          },
        }
      );
      if (affectedCount > 0) {
          updatedPart = await StockTransferReq.findByPk(id);
      }
  } catch (err) {
    logger.error('New Stock Transfer Req error', err);
  }
  return updatedPart;
};

const StockTransferService = {
  CreateStockTransfer,CreateStockTransferPart,
  Updatestock,createStockTransferUpdate,getOutletDetails,deletedStockTransfer,StockTransferUpdateRes,
  CreateStocklog,GetStockTransfer,generateStockTransferpdf,GetInwardStockTransfer,
  getStockTransferForInward,UpdateStockTransferStatus,getStockTransferReport,
  createStockTransferGatePass,generateStockTransferGatePassPdf,
  CreateStockTransferReq,CreateStockTransferReqPart,GetStockTransferReq,
  getStockTransferReqForApprove,UpdateStockTransferReqStatus,GetStockTransferReqFrom
};
export default StockTransferService;
