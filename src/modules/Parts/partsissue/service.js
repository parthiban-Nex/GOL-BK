import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op } from 'sequelize';
import encryptConfig from '../../../config/encrypt.js';

const Partsissue = db.partsIssue;
const Stocks = db.stocks;
const Stocklog = db.stockLog;
const PartIntent = db.partsIndent;
const Etalogs = db.etalogs;
const CreatePartIssue = async (body, user) => {
  const bodydata = body.map((item) => ({
    ...item,
    outlet_id: user.outlet.id,
    createdBy: user.id,
  }));

  let data = [];
  try {
    data = await Partsissue.bulkCreate(bodydata);
  } catch (err) {
    logger.error('New Part issue error', err);
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
            issue_id: item.id,
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
    data = await Stocklog.bulkCreate(body);
  } catch (err) {
    logger.error('New stocklog error', err);
  }

  return data;
};

const UpdatePartIntent = async (body) => {
  let data = [];
  //   const addgrnid=body.map((item)=>({...item,grn_id:grn["dataValues"]["id"]}))
  try {
    for (const item of body) {
      const [affectedCount] = await PartIntent.update(
        { received_quantity: item.quantity,
          return_quantity: db.Sequelize.literal(`
            CASE 
              WHEN return_quantity - ${item.quantity} > 0 THEN return_quantity - ${item.quantity} 
              ELSE 0 
            END
          `),         },
        {
          where: {
            id: item.indent_id,
          },
        }
      );
      if (affectedCount > 0) {
        const updatedPart = await PartIntent.findByPk(item.indent_id);
        data.push(updatedPart);
      }
    }
  } catch (err) {
    logger.error('New partintent error', err);
  }

  return data;
};


const getIndentPartIssue = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
    let outletCondition = "trans.outlet_id = :outlet_id";
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
        outletCondition = `trans.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    let query = `
      SELECT 
      trans.outlet_code,indent.amount,indent.eta,indent.remarks,trans.job_card_no,trans.createdAt AS jobCard_date,items.itemgroupId,trans.reg_no,indent.createdAt As Req_date,indent.item_code AS Req_item_code,indent.item_name AS Req_item_name,vehicles.chassisNumber,vehicles.fuelType,makes.makeName,models.modelName,indent.request_quantity,indent.return_quantity,
      CAST(AES_DECRYPT(UNHEX(trans.customer_name), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS customer_name,
      trans.document_type,trans.status_value,COALESCE(partsIssue.quantity, 0 ) AS stock_issue,COALESCE(partsIssue.createdAt, NULL) AS issue_date,COALESCE(partsIssue.rate,0) AS rate,COALESCE(partsIssue.quantity,0) AS quantity,COALESCE(partsIssue.discount,0) AS discount ,COALESCE(partsIssue.sgst,0) AS sgst,COALESCE(partsIssue.cgst,0) AS cgst,COALESCE(partsIssue.igst,0) AS igst,COALESCE(partsIssue.item_code, ' ') AS Stock_code
      FROM transactions AS trans
      INNER JOIN parts_indent AS indent ON indent.transaction_id = trans.id
      LEFT JOIN vehicles As vehicles ON vehicles.id = trans.vehicle_id
      LEFT JOIN makes AS makes ON makes.id = vehicles.makeId
      LEFT JOIN items AS items ON items.id = indent.item_id
      LEFT JOIN models AS models ON models.id = vehicles.modelId
      LEFT JOIN parts_issues AS partsIssue ON partsIssue.indent_id = indent.id
      WHERE ${outletCondition}
    `; 

    // Append date filter condition
    if (fromDate && toDate) {
      query += ` AND DATE(trans.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY trans.createdAt DESC `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return result.length > 0 ? result : [];

  } catch (err) {
    logger.error('Error fetching sales report:', err);
    return { error: 'An error occurred while fetching the sales report' };
  }
};
const getSalesGrossMarginReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
    
 let outletCondition = "billings.outlet_id = :outlet_id";
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
        outletCondition = `billings.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }

    let query = `
      SELECT billings.bill_no, billings.createdAt AS billing_date,
CAST(AES_DECRYPT(UNHEX(transactions.customer_name), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS customer_name,
             
             transactions.customer_code, transactions.customer_type,
             transactions.customer_gstin,transactions.reg_no,transactions.job_card_no,transactions.createdAt as jobCard_date,
             parts_issues.item_code, parts_issues.item_name, parts_issues.rate,parts_issues.cost,parts_issues.mrp,
             parts_issues.quantity,parts_issues.discount,parts_issues.cgst,parts_issues.sgst,parts_issues.igst,
             service_estimate.source,service_estimate.sourceType,service_estimate.serviceType,
             items.hsnCode,uom.uomType,itemcategories.itemCategorie,vehicles.chassisNumber,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
      FROM billings AS billings
      LEFT JOIN transactions AS transactions ON billings.transaction_id = transactions.id
      INNER JOIN parts_issues AS parts_issues ON parts_issues.transaction_id = transactions.id and parts_issues.quantity > 0 
      LEFT JOIN service_estimate AS service_estimate ON transactions.service_estimate_id = service_estimate.id
      LEFT JOIN vehicles as vehicles ON transactions.vehicle_id=vehicles.id
      LEFT JOIN items as items ON parts_issues.item_id=items.id
      LEFT JOIN uom as uom ON items.uomId=uom.id
      LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
      LEFT JOIN aggregates as aggregates ON items.aggregateId=aggregates.id
      LEFT JOIN subaggregates as subaggregates ON items.subaggregateId=subaggregates.id
      LEFT JOIN makes as makes ON items.makeId=makes.id
      LEFT JOIN models as models ON items.modelId=models.id

    
      WHERE ${outletCondition}
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND billings.createdAt BETWEEN :fromDate AND :toDate
      `;
    }

   

    // Add the order by clause
    query += `
      ORDER BY billings.createdAt DESC
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
    logger.error('Sales Gross Margin Search fetching error', err);
  }
};

const getARJobcardReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate,companyId } = reqData;
    // vendors.vendorName,vendors.gstin,vendors.city,
    // Build base query
    //based on company id we will get the all outlet id in outlets table

    let query = `
  SELECT 
    billings.bill_no, billings.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    ROUND(parts_issues.rate,2) as rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    parts_issues.quantity, parts_issues.discount, ROUND(parts_issues.cgst,2) as cgst, ROUND(parts_issues.sgst,2) as sgst, ROUND(parts_issues.igst,2) as igst,
    items.hsnCode, uom.uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'PartsIssue' AS source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN parts_issues ON parts_issues.transaction_id = transactions.id AND parts_issues.quantity > 0 
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN items ON parts_issues.item_id = items.id
  LEFT JOIN uom ON items.uomId = uom.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, billings.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    ROUND(schedule.singleAmount,2) as rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    schedule.quantity, ROUND(schedule.discount_percentage,2) as discount, ROUND(schedule.cgst,2) as cgst, ROUND(schedule.sgst,2) as sgst, ROUND(schedule.igst,2) as igst,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'Schedule' AS source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN schedules as schedule ON schedule.transaction_id = transactions.id AND schedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, billings.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    ROUND(oslschedule.amount) as rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    oslschedule.quantity, ROUND(oslschedule.discount_percentage,2) as discount, ROUND(oslschedule.cgst,2)as cgst, ROUND(oslschedule.sgst,2) as sgst, ROUND(oslschedule.igst,2) as igst,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'OslSchedule' AS source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN osl_schedules as oslschedule ON oslschedule.transaction_id = transactions.id AND oslschedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  ORDER BY billing_date DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        companyId: companyId,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('AR Report Search fetching error', err);
  }
};

const getARCounterSaleReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate,companyId } = reqData;
    // vendors.vendorName,vendors.gstin,vendors.city,
    // Build base query
    //based on company id we will get the all outlet id in outlets table

    let query = `
    SELECT CA.invoice_number as bill_no,CA.createdAt as billing_date,CA.document_type as bill_type,
    outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    items.hsnCode,
    CSP.quantity,CSP.rate,CSP.discount,CSP.cgst,CSP.sgst,CSP.igst,uom.uomType,"countersale" as source
    FROM countersales AS CA 
    LEFT JOIN countersale_parts AS CSP ON CSP.counter_sale_id = CA.id
    LEFT JOIN items AS items ON items.id = CSP.item_id
    LEFT JOIN uom ON items.uomId = uom.id
    LEFT JOIN outlets AS outlets ON outlets.id = CA.outlet_id
  WHERE CA.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND CA.createdAt BETWEEN :fromDate AND :toDate` : ''}

  ORDER BY CA.createdAt DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        companyId: companyId,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('AR Report Search fetching error', err);
  }
};

const getDeliveryVehicles = async (reqData, user) => {
  try {
    const { fromDate, toDate, limit, offset } = reqData;

    let filterClause = `WHERE billings.delivery_date IS NOT NULL`;
    if (fromDate && toDate) {
      filterClause += ` AND billings.createdAt BETWEEN :fromDate AND :toDate`;
    }

    const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;

    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const outletIds = outletResult.map(row => row.outlet_id);

    if (outletIds.length > 0) {
      filterClause += ` AND billings.outlet_id IN (:outlet_ids)`;
    }
    // Base query filter
    
    // Main data query with limit & offset
    const dataQuery = `
      SELECT 
       transactions.outlet_code as Outlet,transactions.reg_no,
       transactions.id as transaction_id,models.modelName as Model,
       transactions.job_card_no As Doc_Number,billings.createdAt AS Doc_Date,
       transactions.customer_mobileNumber as Cus_mobile,psf_reviews.status as psf_status
      FROM billings
      LEFT JOIN transactions ON billings.transaction_id = transactions.id
      LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
      LEFT JOIN makes ON vehicles.makeId = makes.id
      LEFT JOIN models ON vehicles.modelId = models.id
      LEFT JOIN psf_reviews ON psf_reviews.transaction_id=transactions.id
      ${filterClause}
      LIMIT :limit OFFSET :offset
    `;

    // Count query without limit & offset
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM billings
      LEFT JOIN transactions ON billings.transaction_id = transactions.id
      LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
      LEFT JOIN makes ON vehicles.makeId = makes.id
      LEFT JOIN models ON vehicles.modelId = models.id
      LEFT JOIN psf_reviews ON psf_reviews.transaction_id=transactions.id
      ${filterClause}
    `;

    const replacements = {
      fromDate,
      toDate: `${toDate} 23:59:59`,
      limit,
      offset,
      outlet_ids: outletIds,
    };

    // Run both queries in parallel
    const [data, countResult] = await Promise.all([
      db.sequelize.query(dataQuery, {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(countQuery, {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT,
      }),
    ]);

    return {
      data,
      count: countResult[0]?.total || 0,
    };
  } catch (err) {
    logger.error('Delivery Vehicles Search fetching error', err);
    
  }
};

const getDeliveryVehicleDetails = async (reqData, user) => {
  try {
    const { id } = reqData;

    // Main delivery vehicle details (single record)
    const mainQuery = `
      SELECT 
        transactions.outlet_code as Outlet,
        outlets.id as outlet_id,
        transactions.reg_no,
        transactions.id as transaction_id,
        vehicles.id as vehicle_id,
        models.modelName as Model,
        makes.makeName as Make,
        transactions.job_card_no As Doc_Number,
        billings.createdAt AS Doc_Date,
        users.user_id as service_advisor,
        transactions.customer_mobileNumber as Cus_mobile,
        transactions.customer_name as Cus_name,
        transactions.customer_id as Cus_id,
        sources.sourceName as source,
        sourcetypes.sourceTypeName as sourceType,
        transactions.service_engineer_remarks,
        transactions.service_advice,
        transactions.odometer as km_reading
      FROM billings
      LEFT JOIN transactions ON billings.transaction_id = transactions.id
      LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
      LEFT JOIN makes ON vehicles.makeId = makes.id
      LEFT JOIN models ON vehicles.modelId = models.id
      LEFT JOIN users ON billings.created_by = users.id
      LEFT JOIN sources ON transactions.source = sources.id
      LEFT JOIN sourcetypes ON transactions.source_type = sourcetypes.id
      LEFT JOIN outlets ON transactions.outlet_code =outlets.outletCode
      WHERE billings.transaction_id = :id
      LIMIT 1
    `;

    // Separate query for schedules (can be many)
    const combinedItemsQuery = `
    SELECT  description,'L' as type, amount,(sgst+cgst+igst) as Tax,ROUND(((amount/100)*(sgst+cgst+igst)),2) as "Tax Amount",
    laborTotal as total
    FROM schedules
    WHERE transaction_id = :id
  
    UNION ALL
  
    SELECT  description,'L' as type, amount,(sgst+cgst+igst) as Tax,ROUND(((amount/100)*(sgst+cgst+igst)),2) as "Tax Amount",
    laborTotal as total
    FROM osl_schedules
    WHERE transaction_id = :id
  
    UNION ALL
  
    SELECT  item_name as description,'P' as type, rate as amount,(sgst+cgst+igst) as Tax, ROUND(((rate/100)*(sgst+cgst+igst)),2) as "Tax Amount",
    total
    FROM parts_issues
    WHERE transaction_id = :id
  `;

    const replacements = { id };

    const [mainResult, schedules] = await Promise.all([
      db.sequelize.query(mainQuery, {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(combinedItemsQuery, {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT,
      }),
    ]);

    if (mainResult.length === 0) return null;

    const vehicleDetails = mainResult[0];

    return {vehicleDetails,schedules};

  } catch (err) {
    logger.error('Delivery Vehicle Detail fetching error', err);
    throw err;
  }
};

const getCNReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate,companyId } = reqData;
    // vendors.vendorName,vendors.gstin,vendors.city,
    // Build base query
    //based on company id we will get the all outlet id in outlets table

    let query = `
  WITH combined AS (
SELECT 
    credit_debit_notes.doc_no, credit_debit_notes.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    parts_issues.rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    parts_issues.quantity, parts_issues.discount, parts_issues.cgst, parts_issues.sgst, parts_issues.igst,
    items.hsnCode, uom.uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'PartsIssue' AS raw_source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN parts_issues ON parts_issues.transaction_id = transactions.id AND parts_issues.quantity > 0 
  INNER JOIN credit_debit_notes ON credit_debit_notes.transaction_id = transactions.id AND credit_debit_notes.purpose="CreditNote"
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN items ON parts_issues.item_id = items.id
  LEFT JOIN uom ON items.uomId = uom.id
  LEFT JOIN makes ON items.makeId = makes.id
  LEFT JOIN models ON items.modelId = models.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND credit_debit_notes.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    credit_debit_notes.doc_no, credit_debit_notes.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    schedule.amount as rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    schedule.quantity, schedule.discount_percentage as discount, schedule.cgst, schedule.sgst, schedule.igst,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    NULL AS makeName, NULL AS modelName,
    'Schedule' AS raw_source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN schedules as schedule ON schedule.transaction_id = transactions.id AND schedule.quantity > 0
  INNER JOIN credit_debit_notes ON credit_debit_notes.transaction_id = transactions.id AND credit_debit_notes.purpose="CreditNote"
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND credit_debit_notes.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    credit_debit_notes.doc_no, credit_debit_notes.createdAt AS billing_date, billings.bill_type,
    transactions.reg_no, transactions.job_card_no,
    oslschedule.amount as rate, outlets.oracleCashCustomerCode, outlets.oracleSiteCode, outlets.oracleLocation,outlets.companyId,
    oslschedule.quantity, oslschedule.discount_percentage as discount, oslschedule.cgst, oslschedule.sgst, oslschedule.igst,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    NULL AS makeName, NULL AS modelName,
    'OslSchedule' AS raw_source
  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN outlets ON billings.outlet_id = outlets.id
  INNER JOIN osl_schedules as oslschedule ON oslschedule.transaction_id = transactions.id AND oslschedule.quantity > 0
  INNER JOIN credit_debit_notes ON credit_debit_notes.transaction_id = transactions.id AND credit_debit_notes.purpose="CreditNote"
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  WHERE billings.outlet_id IN (SELECT id FROM outlets WHERE companyId = :companyId)
  ${fromDate && toDate ? `AND credit_debit_notes.createdAt BETWEEN :fromDate AND :toDate` : ''})
SELECT 
  c.*,
  CASE 
    WHEN doc_source_count.cnt = 1 THEN 'Single'
    ELSE c.raw_source
  END AS source
FROM combined c
JOIN (
  SELECT doc_no, COUNT(DISTINCT raw_source) AS cnt
  FROM combined
  GROUP BY doc_no
) AS doc_source_count ON c.doc_no = doc_source_count.doc_no
  ORDER BY billing_date DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        companyId: companyId,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('AR Report Search fetching error', err);
  }
};

const UpdateEtaForIntent = async (body, user) => {
  let data = [];
  //   const addgrnid=body.map((item)=>({...item,grn_id:grn["dataValues"]["id"]}))
  try {
    for (const item of body) {
      const [affectedCount] = await PartIntent.update(
        {
           eta: item.ETA,
           remarks:item.remarks
        },
        {
          where: {
            id: item.id,
          },
        }
      );
      if (affectedCount > 0) {
        const craateEtaLog= await Etalogs.create({
          transaction_id:item.transaction_id,
          indent_id:item.id,
          eta:item.ETA,
          remarks:item.remarks,
          createdBy:user.id
        })

        const updatedPart = await PartIntent.findByPk(item.id);
        data.push(updatedPart);
      }
    }
  } catch (err) {
    logger.error('New partintent error', err);
  }

  return data;
};

const getZohoInvoiceJobcardReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
    
let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`billings.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`billings.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    SELECT 
    t.*,

    -- Sub Total Without Tax
    ROUND(
        SUM(t.taxable_amount) OVER (PARTITION BY t.bill_no)
    ,2) AS sub_total,

    -- Total With Tax
    ROUND(
        SUM(t.taxable_amount + t.tax_amount) 
        OVER (PARTITION BY t.bill_no)
    ,2) AS total

FROM (
     SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(parts_issues.rate,2) as rate, parts_issues.item_id as product_id,
    parts_issues.quantity, parts_issues.discount, ROUND(parts_issues.cgst,2) as cgst, ROUND(parts_issues.sgst,2) as sgst, ROUND(parts_issues.igst,2) as igst,
    parts_issues.item_name as item_description,parts_issues.item_code as item_code,
    
    CASE WHEN parts_issues.discount > 0 THEN ROUND((parts_issues.discount / (parts_issues.rate * parts_issues.quantity)),0) * 100 ELSE 0 END AS discount_percentage,

    items.hsnCode, uom.uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'PartsIssue' AS source,transactions.customer_code,transactions.customer_name,
    ROUND(
    (parts_issues.rate * parts_issues.quantity) 
    - parts_issues.discount
,2) AS taxable_amount,

ROUND(
    ((parts_issues.rate * parts_issues.quantity - parts_issues.discount) * parts_issues.cgst)/100
  + ((parts_issues.rate * parts_issues.quantity - parts_issues.discount) * parts_issues.sgst)/100
  + ((parts_issues.rate * parts_issues.quantity - parts_issues.discount) * parts_issues.igst)/100
,2) AS tax_amount

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
    LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN parts_issues ON parts_issues.transaction_id = transactions.id AND parts_issues.quantity > 0 
  LEFT JOIN items ON parts_issues.item_id = items.id
  LEFT JOIN uom ON items.uomId = uom.id
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(schedule.singleAmount,2) as rate, schedule.rot_id as product_id,
    schedule.quantity, ROUND(schedule.discount_percentage,2) as discount, ROUND(schedule.cgst,2) as cgst, ROUND(schedule.sgst,2) as sgst, ROUND(schedule.igst,2) as igst,
    schedule.description as item_description,schedule.rot_code as item_code,
    CASE WHEN schedule.discount_percentage > 0 THEN ROUND((schedule.discount_percentage / (schedule.singleAmount * schedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'Schedule' AS source,transactions.customer_code,transactions.customer_name,
    ROUND(
    (schedule.singleAmount * schedule.quantity)
    - ((schedule.singleAmount * schedule.quantity) * schedule.discount_percentage)/100
,2) AS taxable_amount,

ROUND(
    ((schedule.singleAmount * schedule.quantity) * schedule.cgst)/100
  + ((schedule.singleAmount * schedule.quantity) * schedule.sgst)/100
  + ((schedule.singleAmount * schedule.quantity) * schedule.igst)/100
,2) AS tax_amount

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN schedules as schedule ON schedule.transaction_id = transactions.id AND schedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(oslschedule.amount) as rate,oslschedule.rot_id as product_id,
    oslschedule.quantity, ROUND(oslschedule.discount_percentage,2) as discount, ROUND(oslschedule.cgst,2)as cgst, ROUND(oslschedule.sgst,2) as sgst, ROUND(oslschedule.igst,2) as igst,
    oslschedule.description as item_description,oslschedule.rot_code as item_code,
    CASE WHEN oslschedule.discount_percentage > 0 THEN ROUND((oslschedule.discount_percentage / (oslschedule.amount * oslschedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'OslSchedule' AS source,transactions.customer_code,transactions.customer_name,
    ROUND(
    (oslschedule.amount * oslschedule.quantity)
    - ((oslschedule.amount * oslschedule.quantity) * oslschedule.discount_percentage)/100
,2) AS taxable_amount,

ROUND(
    ((oslschedule.amount * oslschedule.quantity) * oslschedule.cgst)/100
  + ((oslschedule.amount * oslschedule.quantity) * oslschedule.sgst)/100
  + ((oslschedule.amount * oslschedule.quantity) * oslschedule.igst)/100
,2) AS tax_amount

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id

  INNER JOIN osl_schedules as oslschedule ON oslschedule.transaction_id = transactions.id AND oslschedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

) t

  ORDER BY billing_date DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho Invoice Report Search fetching error', err);
  }
};

const getZohoInvoiceCounterSaleReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
   let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`CA.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`CA.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    SELECT CA.invoice_number as bill_no,DATE_FORMAT(CA.createdAt, '%Y-%m-%d') AS billing_date,
    CA.customer_code,CA.customer_name,CA.customer_address as billing_address,CA.shipping_address,CA.customer_gstin,
    CA.source as sourceName,CA.status,
    CA.customer_city,CA.customer_state, REGEXP_SUBSTR(
    SUBSTRING_INDEX(customer_address, 'mobile:', 1),
    '[0-9]{6}'
  ) AS customer_pincode,items.hsnCode,
    CSP.item_code,CSP.item_description,CSP.item_id as product_id,
    CASE WHEN CSP.discount > 0 THEN ROUND((CSP.discount / (CSP.rate * CSP.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    CSP.quantity,CSP.rate,CSP.discount,CSP.cgst,CSP.sgst,CSP.igst,uom.uomType,"countersale" as source,
    ROUND(
    (CSP.rate * CSP.quantity) 
    - CSP.discount
,2) AS taxable_amount,

ROUND(
    ((CSP.rate * CSP.quantity - CSP.discount) * CSP.cgst)/100
  + ((CSP.rate * CSP.quantity - CSP.discount) * CSP.sgst)/100
  + ((CSP.rate * CSP.quantity - CSP.discount) * CSP.igst)/100
,2) AS tax_amount,
   
ROUND( SUM(
    (CSP.rate * CSP.quantity) 
    - CSP.discount
) OVER (PARTITION BY CA.id),2) AS sub_total,
  
ROUND(SUM(
((CSP.rate * CSP.quantity) - CSP.discount) + 
((CSP.rate * CSP.quantity - CSP.discount) * CSP.cgst)/100 + 
((CSP.rate * CSP.quantity - CSP.discount) * CSP.sgst)/100 + 
((CSP.rate * CSP.quantity - CSP.discount) * CSP.igst)/100
) OVER (PARTITION BY CA.id),2) AS total

    FROM countersales AS CA 
    LEFT JOIN countersale_parts AS CSP ON CSP.counter_sale_id = CA.id
    LEFT JOIN items AS items ON items.id = CSP.item_id
    LEFT JOIN uom ON items.uomId = uom.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND CA.createdAt BETWEEN :fromDate AND :toDate` : ''}

  ORDER BY CA.createdAt DESC
`;


    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho Invoice Report Search fetching error', err);
  }
};

const getKitaraArJobcardReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
    
let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`billings.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`billings.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    
     SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(parts_issues.rate,2) as rate, parts_issues.item_id as product_id,
    parts_issues.quantity, parts_issues.discount, ROUND(parts_issues.cgst,2) as cgst, ROUND(parts_issues.sgst,2) as sgst, ROUND(parts_issues.igst,2) as igst,
    parts_issues.item_name as item_description,parts_issues.item_code as item_code,
    
    CASE WHEN parts_issues.discount > 0 THEN ROUND((parts_issues.discount / (parts_issues.rate * parts_issues.quantity)),0) * 100 ELSE 0 END AS discount_percentage,

    items.hsnCode, uom.uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'PartsIssue' AS source,transactions.customer_code,transactions.customer_name

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
    LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN parts_issues ON parts_issues.transaction_id = transactions.id AND parts_issues.quantity > 0 
  LEFT JOIN items ON parts_issues.item_id = items.id
  LEFT JOIN uom ON items.uomId = uom.id
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(schedule.singleAmount,2) as rate, schedule.rot_id as product_id,
    schedule.quantity, ROUND(schedule.discount_percentage,2) as discount, ROUND(schedule.cgst,2) as cgst, ROUND(schedule.sgst,2) as sgst, ROUND(schedule.igst,2) as igst,
    schedule.description as item_description,schedule.rot_code as item_code,
    CASE WHEN schedule.discount_percentage > 0 THEN ROUND((schedule.discount_percentage / (schedule.singleAmount * schedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'Schedule' AS source,transactions.customer_code,transactions.customer_name
    

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN schedules as schedule ON schedule.transaction_id = transactions.id AND schedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND(oslschedule.amount) as rate,oslschedule.rot_id as product_id,
    oslschedule.quantity, ROUND(oslschedule.discount_percentage,2) as discount, ROUND(oslschedule.cgst,2)as cgst, ROUND(oslschedule.sgst,2) as sgst, ROUND(oslschedule.igst,2) as igst,
    oslschedule.description as item_description,oslschedule.rot_code as item_code,
    CASE WHEN oslschedule.discount_percentage > 0 THEN ROUND((oslschedule.discount_percentage / (oslschedule.amount * oslschedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'OslSchedule' AS source,transactions.customer_code,transactions.customer_name
    

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id

  INNER JOIN osl_schedules as oslschedule ON oslschedule.transaction_id = transactions.id AND oslschedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}
  ORDER BY billing_date DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho Invoice Report Search fetching error', err);
  }
};

const getKitaraArCounterSaleReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
   let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`CA.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`CA.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    SELECT CA.invoice_number as bill_no,DATE_FORMAT(CA.createdAt, '%Y-%m-%d') AS billing_date,outlet.outletCode AS outlet_code,
    CA.customer_code,CA.customer_name,CA.customer_address as billing_address,CA.shipping_address,CA.customer_gstin,
    CA.source as sourceName,CA.status,
    CA.customer_city,CA.customer_state, REGEXP_SUBSTR(
    SUBSTRING_INDEX(customer_address, 'mobile:', 1),
    '[0-9]{6}'
  ) AS customer_pincode,items.hsnCode,
    CSP.item_code,CSP.item_description,CSP.item_id as product_id,
    CASE WHEN CSP.discount > 0 THEN ROUND((CSP.discount / (CSP.rate * CSP.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    CSP.quantity,CSP.rate,CSP.discount,CSP.cgst,CSP.sgst,CSP.igst,uom.uomType,"countersale" as source
    FROM countersales AS CA 
    LEFT JOIN countersale_parts AS CSP ON CSP.counter_sale_id = CA.id
    LEFT JOIN outlets AS outlet ON outlet.id = CA.outlet_id
    LEFT JOIN items AS items ON items.id = CSP.item_id
    LEFT JOIN uom ON items.uomId = uom.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND CA.createdAt BETWEEN :fromDate AND :toDate` : ''}

  ORDER BY CA.createdAt DESC
`;


    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho Invoice Report Search fetching error', err);
  }
};

const getZohoArJobcardReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
    
let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`billings.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`billings.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    
     SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND((parts_issues.rate * parts_issues.quantity) - IFNULL(parts_issues.discount,0), 2) as rate, parts_issues.item_id as product_id,
    1 AS quantity, parts_issues.discount, ROUND(parts_issues.cgst,2) as cgst, ROUND(parts_issues.sgst,2) as sgst, ROUND(parts_issues.igst,2) as igst,
    parts_issues.item_name as item_description,parts_issues.item_code as item_code,
    
    CASE WHEN parts_issues.discount > 0 THEN ROUND((parts_issues.discount / (parts_issues.rate * parts_issues.quantity)),0) * 100 ELSE 0 END AS discount_percentage,

    items.hsnCode, uom.uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'PartsIssue' AS source,transactions.customer_code,transactions.customer_name

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
    LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN parts_issues ON parts_issues.transaction_id = transactions.id AND parts_issues.quantity > 0 
  LEFT JOIN items ON parts_issues.item_id = items.id
  LEFT JOIN uom ON items.uomId = uom.id
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
    ROUND((schedule.amount + schedule.additionalMargin) * (1 - IFNULL(schedule.discount_percentage,0)/100), 2) AS rate, schedule.rot_id as product_id,
    1 AS quantity, ROUND(schedule.discount_percentage,2) as discount, ROUND(schedule.cgst,2) as cgst, ROUND(schedule.sgst,2) as sgst, ROUND(schedule.igst,2) as igst,
    schedule.description as item_description,schedule.rot_code as item_code,
    CASE WHEN schedule.discount_percentage > 0 THEN ROUND((schedule.discount_percentage / (schedule.singleAmount * schedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'Schedule' AS source,transactions.customer_code,transactions.customer_name
    

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id
  INNER JOIN schedules as schedule ON schedule.transaction_id = transactions.id AND schedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}

  UNION ALL

  SELECT 
    billings.bill_no, DATE_FORMAT(billings.createdAt, '%Y-%m-%d') AS billing_date,transactions.outlet_code,
    transactions.reg_no, transactions.job_card_no,transactions.customer_pincode,transactions.customer_city,transactions.customer_state,
    transactions.customer_gstin,transactions.service_estimate_code,sources.sourceName,tr_ins.policy_no,tr_ins.claim_no,transactions.status,
     CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS billing_address,
    CONCAT(transactions.customer_address, ", ", transactions.customer_city, ", ", transactions.customer_state, ", ", transactions.customer_pincode) AS shipping_address,
ROUND(
    CASE 
        WHEN transactions.document_type = 'AJC' THEN
            (
                (
                    (
                        (oslschedule.amount * oslschedule.quantity)
                        * (
                            1 - IFNULL(oslschedule.discount_percentage,0) / 100
                        )
                    )
                    /
                    NULLIF(
                        1 - IFNULL(oslschedule.marginPercentage,0) / 100,
                        0
                    )
                    +
                    IFNULL(oslschedule.additionalMargin,0)
                )
                *
                (
                    CASE 
                        WHEN oslschedule.depreciation_per IS NULL
                             OR oslschedule.depreciation_per = 0
                        THEN 100
                        ELSE oslschedule.depreciation_per
                    END
                    / 100
                )
            )
        ELSE
            (
                (
                    (oslschedule.amount * oslschedule.quantity)
                    * (
                        1 - IFNULL(oslschedule.discount_percentage,0) / 100
                    )
                )
                /
                NULLIF(
                    1 - IFNULL(oslschedule.marginPercentage,0) / 100,
                    0
                )
                +
                IFNULL(oslschedule.additionalMargin,0)
            )
    END
, 2) AS rate,
oslschedule.rot_id as product_id,
    1 AS quantity, ROUND(oslschedule.discount_percentage,2) as discount, ROUND(oslschedule.cgst,2)as cgst, ROUND(oslschedule.sgst,2) as sgst, ROUND(oslschedule.igst,2) as igst,
    oslschedule.description as item_description,oslschedule.rot_code as item_code,
    CASE WHEN oslschedule.discount_percentage > 0 THEN ROUND((oslschedule.discount_percentage / (oslschedule.amount * oslschedule.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    "998729" AS hsnCode, NULL AS uomType, vehicles.chassisNumber, vehicles.engineNumber,
    makes.makeName, models.modelName,
    'OslSchedule' AS source,transactions.customer_code,transactions.customer_name
    

  FROM billings
  LEFT JOIN transactions ON billings.transaction_id = transactions.id
  LEFT JOIN sources ON transactions.source = sources.id
  LEFT JOIN transaction_insurance  tr_ins ON tr_ins.transaction_id=transactions.id

  INNER JOIN osl_schedules as oslschedule ON oslschedule.transaction_id = transactions.id AND oslschedule.quantity > 0
  LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
  LEFT JOIN makes ON vehicles.makeId = makes.id
  LEFT JOIN models ON vehicles.modelId = models.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND billings.createdAt BETWEEN :fromDate AND :toDate` : ''}
  ORDER BY billing_date DESC
`;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho AR Report Search fetching error', err);
  }
};

const getZohoArCounterSaleReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
   let whereConditions=[]
    let outletreplacements={}
if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`CA.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`CA.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    let query = `
    SELECT CA.invoice_number as bill_no,DATE_FORMAT(CA.createdAt, '%Y-%m-%d') AS billing_date,outlet.outletCode AS outlet_code,
    CA.customer_code,CA.customer_name,CA.customer_address as billing_address,CA.shipping_address,CA.customer_gstin,
    CA.source as sourceName,CA.status,
    CA.customer_city,CA.customer_state, REGEXP_SUBSTR(
    SUBSTRING_INDEX(customer_address, 'mobile:', 1),
    '[0-9]{6}'
  ) AS customer_pincode,items.hsnCode,
    CSP.item_code,CSP.item_description,CSP.item_id as product_id,
    ROUND((CSP.rate * CSP.quantity) - CSP.discount, 2) AS rate,
    CASE WHEN CSP.discount > 0 THEN ROUND((CSP.discount / (CSP.rate * CSP.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
    CSP.quantity,CSP.discount,CSP.cgst,CSP.sgst,CSP.igst,uom.uomType,"countersale" as source
    FROM countersales AS CA 
    LEFT JOIN countersale_parts AS CSP ON CSP.counter_sale_id = CA.id
    LEFT JOIN outlets AS outlet ON outlet.id = CA.outlet_id
    LEFT JOIN items AS items ON items.id = CSP.item_id
    LEFT JOIN uom ON items.uomId = uom.id
  WHERE ${whereConditions}
  ${fromDate && toDate ? `AND CA.createdAt BETWEEN :fromDate AND :toDate` : ''}

  ORDER BY CA.createdAt DESC
`;


    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`    
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('Zoho AR Report Search fetching error', err);
  }
};


const PartIssueService = {
  CreatePartIssue,getCNReport,
  Updatestock,CreateStocklog,
  UpdatePartIntent,getIndentPartIssue,
  getSalesGrossMarginReport,getARJobcardReport,
  getARCounterSaleReport,getDeliveryVehicles,
  getDeliveryVehicleDetails,UpdateEtaForIntent,
  getZohoInvoiceJobcardReport,
  getZohoInvoiceCounterSaleReport,
  getKitaraArCounterSaleReport,
  getKitaraArJobcardReport,
  getZohoArJobcardReport,
  getZohoArCounterSaleReport
};
export default PartIssueService;
