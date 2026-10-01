import db from '../../index.js';
import logger from '../../../config/logger.js';
import encryptConfig from '../../../config/encrypt.js';
import ItemDao from "../../item/dao.js"
import { Op, where } from "sequelize"
import { EXTERNAL_API } from '../../../config/externalUrl.js';
import axios from 'axios';
import BinlocationDao from '../../binLocation/dao.js';
// import axios from 'axios';
// import { EXTERNAL_API } from '../../../config/externalUrl.js';
const Grn = db.grns
const GrnDocument = db.grndocuments
const GrnParts = db.grnparts
const GrnStocks = db.stocks
const vendor = db.vendors
const PurchaseReturn = db.purchasereturn
const PurchaseReturnParts = db.purchasereturnpart
const Items = db.items
const Hsns=db.hsns
const purchaseorder=db.purchaseOrder
const StockAdjustment=db.stockadjustment
const StockAdjustmentPart=db.stockadjustmentparts
const negadjstocklog=db.Negadjstocklog
const GateinBinLocation=db.gateinbinlocation
const outletData = db.outlets
const purchaseOrderParts = db.purchaseOrderParts



const generateGrnNo = async (documentType, outletCode, outletId) => {
  const prefix = documentType.split('(')[0].trim();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const financialYear = month >= 3 ? `${year + 1}`.slice(2) : `${year}`.slice(2);
  const sequenceKey = `${prefix}-${outletCode}${financialYear}`;


  try {
    let newNumber = 1;

   
      const lastGrn = await Grn.findOne({
        where: {
          grn_no: { [Op.like]: `${sequenceKey}-%` },
          outlet_id: outletId,
        },
        order: [['id', 'DESC']],
      });

      if (lastGrn?.grn_no) {
        const parts = lastGrn.grn_no.split("-");
        const lastNum = parseInt(parts[2]);
        newNumber = lastNum + 1;
      }
    

    return `${sequenceKey}-${String(newNumber).padStart(6, '0')}`;
  }
  catch(err){
    console.error(err)
  }
};

const CreateGrn = async (body, user) => {
  const document_type = body.document_type;
  const grnNo = await generateGrnNo(
    document_type,
    user.outlet.outletCode,
    user.outlet.id
  );
  console.log(grnNo, 'grnno');
  body.createdBy = user.id;
  body.outlet_id = user.outlet.id;
  body.grn_no = grnNo;
  if(body.type=="adj"){
    body.invoice_number=grnNo
    delete body.grand_total
  }
  let data = {};
  try {
    data = await Grn.create(body);
  } catch (err) {
    logger.error('New Grn error', err);
    throw err
  }

  return data;
};

const BulkCreateGrn = async (body, user,t=null) => {
  const document_type = body.document_type;
  const grnNo = await generateGrnNo(
    document_type,
    body.outlet_code,
    body.outlet_id
  );
  console.log(grnNo, 'grnno');
  body.createdBy = user.id;
  body.grn_no = grnNo;
  body.invoice_number=grnNo
  
  let data = {};
  try {
    data = await Grn.create(body,t ? { transaction: t } : {});
  } catch (err) {
    logger.error('New Grn error', err);
  }

  return data;
};

const CreateGrnParts = async (body, grn,grntype,user,t=null) => {
  console.log(grn.dataValues, 'grn');

  let data = [];
  try {
    const grnid=grn['dataValues']['id']
    
  for(let item of body){
    let reqobj={...item,
    grn_id: grnid,
   }
     if(grntype=="FocusGrn"){
let finditem=await Items.findOne({where:{[Op.or]:[{itemCode:item.item_code}]}})
if(finditem && finditem?.id){
  reqobj.item_id=finditem.id
}
else{
  let findhsn
   findhsn= await Hsns.findOne({where:{hsnCode:item.hsnCode}})
  if(!findhsn){
     findhsn=await Hsns.create({
      hsnCode:item.hsnCode,
      tax:item.cgst+item.sgst+item.igst,
      createdBy:user.id,
      updatedBy:user.id,
    })
  }
  const newitem=await Items.create({
    itemCode:item.item_code,
    itemName:item.item_description,
    itemDescription:item.item_description,
    hsnId:findhsn.id,
    hsnCode:item.hsnCode,
    createdBy:user.id,
    updatedBy:user.id,
    list:item.mrp,
    mrp:item.mrp,
    cost:item.cost,
    taxPercentage:item.cgst+item.sgst+item.igst,
  })
  reqobj.item_id=newitem.id
}

   }
   console.log(reqobj,"reqobj")
  let currentdata= await GrnParts.create(reqobj,t ? { transaction: t } : {})
   let currentval={...currentdata.dataValues}
   if(grntype=="DirectGrn" || grntype=="FocusGrn"){
    currentval.binid=item.binid
   }
  
   data.push(currentval)
  };
    
  } catch (err) {
    logger.error('New Grn Parts error', err);
  }

  return data;
};

const CreateGrnStocks = async (body, grn, grnparts, user,t=null) => {
  let data = {};
  console.log(grnparts[0], 'updata');
  let addgrn=[]
  for(let i in body){
    const {discount,...remain}=body[i]
  
  let resobj={
    ...remain,
    discount:discount,
    grn_id: grn['dataValues']['id'],
    grn_parts_id: grnparts[i]['id'],
    outlet_id: user.outlet.id,
  }
  addgrn.push(resobj)
}

  try {
    data =await GrnStocks.bulkCreate(addgrn,t ? { transaction: t } : {});
  } catch (err) {
    logger.error('New Stcks error', err);
  }

  return data;
};
const BulkCreatePartsAndStocks = async (body, grn, user, t = null) => {
  try {
    const grnid = grn.dataValues.id;
    const outletid=grn.dataValues.outlet_id

    /* --------------------------------------------------
       STEP 1 — Prepare parts payload (NO binid stored)
    ---------------------------------------------------*/
    const partsPayload = body.map(item => ({
      ...item,
      grn_id: grnid
    }));


    /* --------------------------------------------------
       STEP 2 — Bulk insert GRN Parts
    ---------------------------------------------------*/
    const createdParts = await GrnParts.bulkCreate(partsPayload, {
      transaction: t,
      returning: true
    });

    /* --------------------------------------------------
       STEP 3 — Build binid → grn_parts_id map
    ---------------------------------------------------*/
    const partsMap = new Map();

// attach binid manually (safe mapping)
createdParts.forEach((row, index) => {
  const binid = body[index].binid;

  if (!binid) {
    throw new Error(`Missing binid at row ${index}`);
  }

  partsMap.set(binid, row.dataValues.id);
});


    /* --------------------------------------------------
       STEP 4 — Prepare stock payload
    ---------------------------------------------------*/
    const stockPayload = body.map(item => {
      const { discount, ...remain } = item;
       
      return {
        ...remain,
        discount:discount,
        grn_id: grnid,
        grn_parts_id: partsMap.get(item.binid),
        outlet_id:outletid
      };
    });

    console.log(stockPayload,"payload")

    /* --------------------------------------------------
       STEP 5 — Bulk insert GRN Stocks
    ---------------------------------------------------*/
  const createdStocks=  await GrnStocks.bulkCreate(stockPayload, {
      transaction: t,
      returning: true
    });

const partsWithBin = createdParts.map((row, index) => ({
  ...row.dataValues,
  binid: body[index].binid,
  stock_id: createdStocks[index]?.dataValues?.id || null
}));

return partsWithBin;
  } catch (err) {
    logger.error("Bulk Parts + Stocks error", err);
    throw err;
  }
};
const CreateOracleGrnParts = async (body, grn,grntype) => {
  console.log(grn.dataValues, 'grn');

  let data = [];
  try {
    const grnid=grn['dataValues']['id']
  for(let item of body){
  let currentdata= await GrnParts.create({...item,
    grn_id: grnid,
   })
   let currentval={...currentdata.dataValues}
    currentval.oracle_stocktransferparts_id=item.oracle_stocktransferparts_id
   
   data.push(currentval)
  };
    
  } catch (err) {
    logger.error('New Grn Parts error', err);
  }

  return data;
};

const CreateOracleGrnStocks = async (body, grn, grnparts, user) => {
  let data = {};
  console.log(grnparts[0], 'updata');

  const updatedData = body.map(({ discount, ...rest }) => rest);
  const addgrn = updatedData.map((item, i) => ({
    ...item,
    grn_id: grn['dataValues']['id'],
    grn_parts_id: grnparts[i]['id'],
    outlet_id: user.outlet.id,
  }));

  try {
    data =await GrnStocks.bulkCreate(addgrn);
  } catch (err) {
    logger.error('New Stcks error', err);
  }

  return data;
};
const CreateGrnDocument = async (req) => {
  let data = {};
  try {
    data = GrnDocument.create(req.body);
  } catch (err) {
    logger.error('New Grn Document error', err);
  }

  return data;
};
const GetGrnDocuments = async (req) => {
  let data = {};
  try {
    data = GrnDocument.findAll({});
  } catch (err) {
    logger.error('New Grn Document error', err);
  }

  return data;
};

const getGrnDetailsWithGrandTotal = async (reqData, user) => {
  try {
    // Fetch GRN details with grand total from related GrnParts
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey ? {
      [Op.or]: [
        { grn_no: { [Op.like]: `%${searchKey}%` } },
        { invoice_number: { [Op.like]: `%${searchKey}%` } },
      ]
    } : {};
    const userCondition = { outlet_id: user.outlet.id };


    const grnDetails = await Grn.findAll({
      where: { ...searchCondition, ...userCondition },

      attributes: [
        'id',
        'grn_no',
        'invoice_number',
        'invoice_date',
        'vendor_code',
        'createdAt',
        [
          db.Sequelize.literal(`(
                  SELECT ROUND(SUM(grnparts.total),2)
                  FROM grnparts
                  WHERE grnparts.grn_id = grn.id
                )`),
          'grand_total', // Calculate grand total using a subquery
        ],


      ],
      include: [
        {
          model: GrnParts,
          attributes: [],  // No need to fetch individual part details, just summing total
          as: "grnparts"
        }
      ],
      group: ['grn.id'],
      order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
      limit,
      offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
    let count = await Grn.count({ where: { outlet_id: user.outlet.id } })
    return { grnDetails, count };
  } catch (err) {
    logger.error(' Grn fetching error', err);
  }
};

const generategrnpdf = async (body, user) => {
  try {
    let grnDetails = await Grn.findAll({
      where: { id: body.id },
      attributes: [
        'grn_no',
        'invoice_number',
        'invoice_date',
        'vendor_code',
        'e_sugam_no',
        'lr_number',
        'lr_date',
        'transport_name',
        'frieght_charges',
        'mis_charges',
        'document_type',
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(grnparts.total), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'grand_total',
        ],
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(grnparts.quantity), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'total_quantity',
        ],
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(grnparts.cost), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'total_cost',
        ],
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(grnparts.discount), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'total_discount',
        ],
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(
                 (grnparts.total - ((grnparts.cost*grnparts.quantity)-grnparts.discount))
            ), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'total_tax',
        ],
        [
          db.Sequelize.literal(`(
            SELECT ROUND(SUM(
                 grnparts.total
            ), 2)
            FROM grnparts
            WHERE grnparts.grn_id = grn.id
          )`),
          'pdf_total',
        ],
      ],
      include: [
        {
          model: GrnParts,
          attributes: [
            'item_code',
            'item_description',
            'binlocation',
            'quantity',
            'cost',
            'discount',
            [
              db.Sequelize.literal(`(
                SELECT ROUND(
                 (grnparts.total - ((grnparts.cost*grnparts.quantity)-grnparts.discount))
                    
                ,2)
              )`),
              'tax',
            ],
            [
              db.Sequelize.literal(`(
                SELECT ROUND(
                     grnparts.total
                ,2)
              )`),
              'total',
            ],
          ],
          as: 'grnparts',
        },
        {
          model: vendor,
          attributes: [
            'address1',
            'address2',
            'city',
            'state',
            'pincode',
            'mobileNumber',
          ],
          as: 'grnvendormap',
        },
        {
          model: purchaseorder,
          attributes: [
            "po_number"
          ],
          as: 'pogrnmap',
        },
      ],
      group: ['grn.id', 'grnparts.id', 'grnvendormap.id'],
    });

    return grnDetails;
  } catch (err) {
    logger.error('Grn pdf fetching error', err);
  }
};


const getGrnDetailsForReturn = async (reqData, user) => {
  try {
    const grnDetails = await Grn.findAll({
      where: { id: reqData.id },

      attributes: [
        "id",
        'vendor_code'
      ],
      include: [
        {
          model:GrnParts,
          attributes:["discount"],
          as:"grnparts",
          include:[
            {
          model: GrnStocks,
          attributes: ["id","item_id","grn_parts_id" ,"item_code", "item_description","rate","mrp", "cost", "cgst", "sgst", "igst", "quantity"],
          as: "grnpartsstocksmap"
        }
      ],
        },
        {
          model: vendor,
          attributes: ["id","vendorName"],
          as: "grnvendormap"
        }

      ],
      group: ['grn.id', "grnparts.id", 'grnvendormap.id',"grnparts.grnpartsstocksmap.id"],

    });

    return grnDetails;
  } catch (err) {
    logger.error(' Grn purchase return fetching error', err);
  }
};

const generatePurchaseReturnNo = async (outletCode, outletid) => {
  const prefix="SRV"
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  // Get the last GRN with the same document type
  const lastReturn = await PurchaseReturn.findOne({
    where: { outlet_id: outletid,
      purchase_return_invoice_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`}
     },
    order: [['createdAt', 'DESC']],
  });

  let newPurchaseReturnNo = 1;
  console.log(lastReturn, 'lastgrn');
  if (lastReturn) {
    const lastReturnNo = lastReturn?.dataValues?.purchase_return_invoice_number?.split('-')[2];
    newPurchaseReturnNo = parseInt(lastReturnNo, 10) + 1;
  }

  const paddedReturnNo = String(newPurchaseReturnNo).padStart(6, '0');
  return `${prefix}-${outletCode}${financialYear}-${paddedReturnNo}`;
};
const CreatePurchaseReturn = async (body, user) => {
  const purchase_return_no = await generatePurchaseReturnNo(
    user.outlet.outletCode,
    user.outlet.id
  );
  console.log(purchase_return_no, 'purchasereturnno');
  body.createdBy = user.id;
  body.outlet_id = user.outlet.id;
  body.purchase_return_invoice_number = purchase_return_no;
  let data = {};
  try {
    data = PurchaseReturn.create(body);
  } catch (err) {
    logger.error('New Purchase return error', err);
  }

  return data;
};
const CreatePurchaseReturnParts = async (body, purchasereturn) => {
  let data = {};
  const addpurchasereturnid = body.map(({ id, ...rest }) => ({
    ...rest,
    purchase_return_id: purchasereturn['dataValues']['id'],
  }));
  console.log(addpurchasereturnid, "data")
  try {
    data = PurchaseReturnParts.bulkCreate(addpurchasereturnid);
  } catch (err) {
    logger.error('New Purchase Return parts error', err);
  }

  return data;
};

const Updatestock = async (items) => {
  try {
    const results = [];

    // Iterate through the array of items
    console.log(items, "items")
    for (const item of items) {
      const stockid = item.id;

      // Fetch stocks related to the item_id

      await GrnStocks.update({ quantity: db.Sequelize.literal(`quantity - ${item.quantity}`), }, {
        where: {
          id: stockid,
        },
      },
      );
      // Push the stock_id and reduced quantity to the results array
      results.push({
        stock_id: stockid,
        quantity: item.quantity,
      });

    }

    return results;
  } catch (error) {
    logger.error('Error reducing stock quantity:', error);
  }
};

const getPurchaseReturnDetailsWithGrandTotal = async (reqData, user) => {
  try {
    // Fetch GRN details with grand total from related GrnParts
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey ? {
      [Op.or]: [
        { grn_no: { [Op.like]: `%${searchKey}%` } },
        { purchase_return_invoice_number: { [Op.like]: `%${searchKey}%` } },
      ]
    } : {};
    const userCondition = { outlet_id: user.outlet.id };


    const purchaseReturnDetails = await PurchaseReturn.findAll({
      where: { ...searchCondition, ...userCondition },

      attributes: [
        'id',
        'grn_no',
        'purchase_return_invoice_number',
        'purchase_return_date',
        'vendor_code',
        [
          db.Sequelize.literal(`(
                  SELECT SUM(purchase_return_parts.total)
                  FROM purchase_return_parts
                  WHERE purchase_return_parts.purchase_return_id = purchase_return.id
                )`),
          'grand_total', // Calculate grand total using a subquery
        ],


      ],
      include: [
        {
          model: PurchaseReturnParts,
          attributes: [],  // No need to fetch individual part details, just summing total
          as: "purchasereturnparts"
        }
      ],
      group: ['purchase_return.id'],
      order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
      limit,
      offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
    let count = await PurchaseReturn.count({ where: userCondition })
    return { purchaseReturnDetails, count };
  } catch (err) {
    logger.error(' purchase return fetching error', err);
  }
};

const getQuickitemSearch = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const userCondition = { outlet_id: user.outlet.id };
    let result=[]
    // Build base query
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date, grnparts.id, 
             grnparts.item_code, grnparts.item_description, ROUND(grnparts.rate,2) as rate, 
             ROUND(grnparts.cost,2) as cost, ROUND(grnparts.mrp,2) as mrp, grnstocks.quantity
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      LEFT JOIN stocks AS grnstocks ON grnparts.id = grnstocks.grn_parts_id
      WHERE grn.outlet_id = :outlet_id
    `;

    // Append search filter if searchKey is provided
    if (searchKey) {
      query += `
        AND (grnparts.item_code %LIKE% :searchKey 
        OR grnparts.item_description %LIKE% :searchKey)
      `;
    }

    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
    `;

    // Add pagination (limit and offset)
    query += ` LIMIT :limit OFFSET :offset`;

    // Execute the query
     result = await db.sequelize.query(query, {
      replacements: {
        outlet_id: user.outlet.id,
        searchKey: `%${searchKey}%`, // If searchKey exists
        limit,
        offset,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result) {
      result= []; // Return an empty array or a message indicating no data found
    }
    let count = await GrnStocks.count({ where: userCondition })

    return { result, count };
  } catch (err) {
    logger.error('Item Search fetching error', err);
  }
};

const getPartsForCounterSale = async (reqData, user) => {
  try {
    const itemCode = reqData.itemCode;
     let rows= [];
     let query= `
      SELECT  items.id,
        items.itemCode,
        items.itemName,
        items.itemDescription,
        items.taxPercentage,
        items.hsnCode,
        COALESCE(SUM(stocks.quantity),0) as quantity,
        COALESCE(ROUND(AVG(stocks.rate),2),0) as rate,
        COALESCE(ROUND(MAX(stocks.cost),2),0) as cost,
        COALESCE(MAX(stocks.mrp),0) as mrp
        FROM items
        lEFT JOIN stocks ON items.id = stocks.item_id and stocks.outlet_id= :outletId
        WHERE itemCode = :itemCode
    `;
      rows = await db.sequelize.query(query, {
      replacements: {
        itemCode: itemCode, // If searchKey exists
        outletId: user.outlet.id
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(rows,"row")
    return rows;

  } catch (err) {
    logger.error(' counter sale items fetching error', err);
  }
};


const getPurchaseReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
 let outletCondition = "grn.outlet_id = :outlet_id";
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
        outletCondition = `grn.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code,grn.createdAt, 
             grnparts.item_code, grnparts.item_description, grnparts.rate,grnparts.cost,
             grnparts.mrp,grnparts.quantity,grnparts.discount,grnparts.cgst,grnparts.sgst,grnparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      LEFT JOIN vendors As vendors ON vendors.id=grn.vendor_id
      LEFT JOIN items as items ON grnparts.item_id=items.id
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
        AND grn.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
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

const getPurchaseAxaptaReport = async (body, user) => {
  try {
    const { fromDate, toDate } = body;
 let outletCondition = "g.outlet_id = :outlet_id";
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
        outletCondition = `g.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    const query = `
      SELECT
        g.id,
        g.grn_no,
        g.invoice_number,
        g.invoice_date,
        g.vendor_code,
        g.frieght_charges,
        g.mis_charges,
        g.createdAt,

        v.vendorName,
        v.gstin,

        MAX(po.po_number) AS po_number,
        MAX(po.createdAt) AS po_createdAt,

        ROUND(SUM(gp.total), 2) AS total_amount,
        ROUND(SUM(gp.cost * gp.quantity), 2) AS total_purchase_value,
        ROUND(SUM(
          (gp.total - ((gp.cost * gp.quantity) - gp.discount))
        ), 2) AS total_tax,
        ROUND(SUM(
          ((gp.cost * gp.quantity) - gp.discount) * (gp.sgst / 100)
        ), 2) AS sgst,
        ROUND(SUM(
          ((gp.cost * gp.quantity) - gp.discount) * (gp.cgst / 100)
        ), 2) AS cgst,
        ROUND(SUM(
          ((gp.cost * gp.quantity) - gp.discount) * (gp.igst / 100)
        ), 2) AS igst

      FROM grns g
      LEFT JOIN grnparts gp ON gp.grn_id = g.id
      LEFT JOIN vendors v ON v.id = g.vendor_id
      LEFT JOIN purchaseorders po ON po.id=gp.po_id

      WHERE
          ${outletCondition}
        AND g.createdAt BETWEEN :fromDate AND :toDate

      GROUP BY
        g.id
       

      ORDER BY g.createdAt DESC
    `;

    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT
    });

    return result;
  } catch (err) {
    logger.error('Grn Purchase Axapta Report fetching error', err);
    throw err;
  }
};


const getStockTransferInwardReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
 let outletCondition = "grn.outlet_id = :outlet_id";
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
        outletCondition = `grn.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code,grn.createdAt, 
             grnparts.item_code, grnparts.item_description, grnparts.rate,grnparts.cost,
             grnparts.mrp,grnparts.quantity,grnparts.discount,grnparts.cgst,grnparts.sgst,grnparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName,po.po_number,
             po.createdAt as po_createdAt
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      LEFT JOIN vendors As vendors ON vendors.id=grn.vendor_id
      LEFT JOIN purchaseorders AS po ON po.id=grn.po_id
      LEFT JOIN items as items ON grnparts.item_id=items.id
      LEFT JOIN uom as uom ON items.uomId=uom.id
      LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
      LEFT JOIN aggregates as aggregates ON items.aggregateId=aggregates.id
      LEFT JOIN subaggregates as subaggregates ON items.subaggregateId=subaggregates.id
      LEFT JOIN makes as makes ON items.makeId=makes.id
      LEFT JOIN models as models ON items.modelId=models.id

    
      WHERE ${outletCondition} AND grn.document_type='SCRI'
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND grn.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
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

const getPurchaseReturnReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
 let outletCondition = "purchase_returns.outlet_id = :outlet_id";
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
        outletCondition = `purchase_returns.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT purchase_returns.grn_no, purchase_returns.purchase_return_invoice_number, purchase_returns.purchase_return_date,
             purchase_returns.vendor_code,purchase_returns.vendor_name,purchase_returns.createdAt, grn.invoice_number,grn.invoice_date,
             purchase_return_parts.item_code, purchase_return_parts.item_description,purchase_return_parts.cost,
             purchase_return_parts.quantity,purchase_return_parts.cgst,purchase_return_parts.sgst,purchase_return_parts.igst,purchase_return_parts.discount
      FROM purchase_returns AS purchase_returns
      LEFT JOIN purchase_return_parts AS purchase_return_parts ON purchase_return_parts.purchase_return_id = purchase_returns.id
      LEFT JOIN grns AS grn ON grn.id = purchase_returns.grn_id

      WHERE ${outletCondition}
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND purchase_returns.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY purchase_returns.createdAt DESC
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

// the below code is part issue , counter sale and counter sale return services here

const getSalesReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
    let outletCondition = "bills.outlet_id = :outlet_id";
    let replacements = { fromDate: fromDate || null, toDate: toDate ? `${toDate} 23:59:59` : null };
    // if (user.roleid == 5) {
    if (user.reportAccess == 1) { 
      // Fetch outlet_id dynamically
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        outletCondition = `bills.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
// CAST(AES_DECRYPT(UNHEX(trans.customer_name), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS customer_name,
    let query = `
      SELECT 
        bills.bill_no, bills.createdAt, bills.jobcard_no, outlets.outletCode ,
        trans.customer_arrived_date, trans.customer_code, trans.status_value,trans.customer_email,
        items.hsnCode, trans.customer_gstin, 
        makes.makeName, models.modelName, 
        partsissues.item_code, partsissues.item_name, 
        itemcategories.itemCategorie, aggregates.aggregateName, subaggregates.subAggregateName,
        partsissues.quantity, partsissues.discount, 
        trans.reg_no, partsissues.rate, 
        partsissues.cgst, partsissues.sgst, partsissues.igst,
       CAST(AES_DECRYPT(UNHEX(trans.customer_name), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS customer_name,
      CAST(AES_DECRYPT(UNHEX(trans.customer_email), RPAD('${encryptConfig.code}', 16, '*')) AS CHAR) AS customer_email
      FROM billings AS bills
      LEFT JOIN transactions AS trans ON trans.id = bills.transaction_id
      LEFT JOIN parts_issues AS partsissues ON partsissues.transaction_id = bills.transaction_id
      LEFT JOIN items AS items ON items.id = partsissues.item_id
      LEFT JOIN makes AS makes ON makes.id = items.makeId
      LEFT JOIN models AS models ON models.id = items.modelId
      LEFT JOIN itemcategories AS itemcategories ON itemcategories.id = items.itemcategoryId
      LEFT JOIN aggregates AS aggregates ON aggregates.id = items.aggregateId
      LEFT JOIN subaggregates AS subaggregates ON subaggregates.id = items.subaggregateId
      LEFT JOIN outlets AS outlets ON outlets.id = bills.outlet_id
      WHERE ${outletCondition}
    `;

    // Append date filter condition
    if (fromDate && toDate) {
      query += ` AND DATE(bills.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY bills.createdAt DESC `;


    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });

    console.log('result of query',result)

    return result.length > 0 ? result : [];

  } catch (err) {
    logger.error('Error fetching sales report:', err);
    return { error: 'An error occurred while fetching the sales report' };
  }
};


const getSpareSalesAxapta = async (reqData, user) => {

  try {
    const { fromDate, toDate } = reqData;
    let whereConditions = [];
    let replacements = {};

    // Handle dynamic outlet filtering
    if (user.reportAccess === 1) {
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        whereConditions.push(`bills.outlet_id IN (:outlet_ids)`);
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`bills.outlet_id = :outlet_id`);
      replacements.outlet_id = user.outlet.id;
    }

    // Append Date Filter (if applicable)
    if (fromDate && toDate) {
      whereConditions.push(`DATE(bills.createdAt) BETWEEN :fromDate AND :toDate`);
      replacements.fromDate = fromDate;
      replacements.toDate = toDate ? `${toDate} 23:59:59` : null;
    }

    // Construct SQL query dynamically
    let query = `
     SELECT 
    outlets.outletCode AS outletName,
    bills.createdAt AS billingDate,
    bills.bill_no,
    trans.job_card_no,
    trans.createdAt,
    trans.customer_code,
    trans.customer_name,
    trans.customer_gstin,
    COALESCE(SUM(partsissues.rate * partsissues.quantity), 0) AS total_spare_amount,
    COALESCE(SUM(partsissues.discount), 0) AS total_discount_amount,
    COALESCE(SUM(((partsissues.rate * partsissues.quantity) - partsissues.discount) * (partsissues.sgst / 100)), 0) AS total_sgst,
    COALESCE(SUM(((partsissues.rate * partsissues.quantity) - partsissues.discount) * (partsissues.cgst / 100)), 0) AS total_cgst,
    COALESCE(SUM(((partsissues.rate * partsissues.quantity) - partsissues.discount) * (partsissues.igst / 100)), 0) AS total_igst,
    sources.sourceName,
    servicetypes.serviceTypeName
    FROM billings AS bills
    LEFT JOIN transactions AS trans ON trans.id = bills.transaction_id
    LEFT JOIN parts_issues AS partsissues ON partsissues.transaction_id = bills.transaction_id
    LEFT JOIN outlets AS outlets ON outlets.id = bills.outlet_id
    LEFT JOIN servicetypes ON trans.service_type = servicetypes.id
    LEFT JOIN sources ON trans.source = sources.id
    ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
    GROUP BY 
        outlets.outletCode,
        bills.createdAt,
        bills.bill_no,
        trans.job_card_no,
        trans.createdAt,
        trans.customer_code,
        trans.customer_name,
        trans.customer_gstin,
        sources.sourceName,
        servicetypes.serviceTypeName
    ORDER BY bills.createdAt DESC;
    `;

    // Execute query
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

const getCounterSalesReport = async (reqData, user) => {

  try {
    const { fromDate, toDate } = reqData;
    let outletCondition = "CA.outlet_id = :outlet_id";
    let replacements = { fromDate: fromDate || null, toDate: toDate ? `${toDate} 23:59:59` : null};
    if (user.reportAccess == 1) { 
      // Fetch outlet_id dynamically
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);
      if (outletIds.length > 0) {
        outletCondition = `CA.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }

    let query = `SELECT CA.invoice_number,CA.createdAt,CA.customer_code,CA.customer_name,CA.customer_gstin,outlets.outletCode,items.itemCode,items.itemName,items.hsnCode,makes.makeName,models.modelName,itemcategories.itemCategorie,aggregates.aggregateName,subaggregates.subAggregateName,CSP.quantity,COALESCE(CSP.return_quantity, 0) AS return_quantity,CSP.rate,CSP.discount,CSP.cgst,CSP.sgst,CSP.igst
    FROM countersales AS CA 
    LEFT JOIN countersale_parts AS CSP ON CSP.counter_sale_id = CA.id
    LEFT JOIN items AS items ON items.id = CSP.item_id
    LEFT JOIN makes AS makes ON makes.id = items.makeId
    LEFT JOIN models AS models ON models.id = items.modelId
    LEFT JOIN itemcategories AS itemcategories ON itemcategories.id = items.itemcategoryId
    LEFT JOIN aggregates AS aggregates ON aggregates.id = items.aggregateId
    LEFT JOIN subaggregates AS subaggregates ON subaggregates.id = items.subaggregateId
    LEFT JOIN outlets AS outlets ON outlets.id = CA.outlet_id
     WHERE ${outletCondition}
    `;

    if (fromDate && toDate) {
      query += ` AND Date(CA.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY CA.createdAt DESC `;

    const result = await db.sequelize.query(query, {
      replacements, type: db.Sequelize.QueryTypes.SELECT,
    });
    return result.length > 0 ? result : [];

  } catch (err) {
    logger.error('Error fetching sales report:', err);
    return { error: 'An error occurred while fetching the sales report' };
  }
}

const getCounterSaleReturnData = async (reqData, user) => {

  try {
    const { fromDate, toDate } = reqData;
    let outletCondition = "CSR.outlet_id = :outlet_id";
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
        outletCondition = `CSR.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
// CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)
    let query = `SELECT CSR.invoice_number,CSR.createdAt,cust.customerCode,
    CAST(AES_DECRYPT(UNHEX(cust.firstName), '${encryptConfig.code}') AS CHAR) AS firstName,
      CAST(AES_DECRYPT(UNHEX(cust.lastName), '${encryptConfig.code}') AS CHAR) AS lastName,
    cust.gstinNumber,items.itemCode,items.itemName,items.hsnCode,makes.makeName,models.modelName,itemcategories.itemCategorie,aggregates.aggregateName,subaggregates.subAggregateName,CSRP.quantity,CSRP.rate,CSRP.discount,CSRP.cgst,CSRP.sgst,CSRP.igst,
    outlets.outletCode
    FROM countersalereturns AS CSR 
    LEFT JOIN countersale_return_parts AS CSRP ON CSRP.countersale_return_id = CSR.id
    LEFT JOIN customers AS cust ON cust.id = CSR.customer_id
    LEFT JOIN items AS items ON items.id = CSRP.item_id
    LEFT JOIN makes AS makes ON makes.id = items.makeId
    LEFT JOIN models AS models ON models.id = items.modelId
    LEFT JOIN itemcategories AS itemcategories ON itemcategories.id = items.itemcategoryId
    LEFT JOIN aggregates AS aggregates ON aggregates.id = items.aggregateId
    LEFT JOIN subaggregates AS subaggregates ON subaggregates.id = items.subaggregateId
    LEFT JOIN outlets AS outlets ON outlets.id = CSR.outlet_id
    WHERE ${outletCondition}
    `;

    if (fromDate && toDate) {
      query += ` AND Date(CSR.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY CSR.createdAt DESC `;

    const result = await db.sequelize.query(query, {
      replacements, type: db.Sequelize.QueryTypes.SELECT,
    });
    return result.length > 0 ? result : [];

  } catch (err) {
    logger.error('Error fetching sales report:', err);
    return { error: 'An error occurred while fetching the sales report' };
  }
}
const stockadjustmentsearch = async (reqData, user) => {
  try {
    const { searchKey } = reqData;
    const userCondition = { outlet_id: user.outlet.id };

    // Build base query
    let query = `
      SELECT grn.grn_no, grn.id AS grnid, grnparts.id AS grnpartsid,grnparts.item_id, 
             grnparts.item_code AS itemCode, grnparts.item_description, grnparts.rate, 
             grnparts.cost, grnparts.mrp,grnparts.cgst,grnparts.sgst,grnparts.igst, grnstocks.quantity
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      INNER JOIN stocks AS grnstocks ON grnparts.id = grnstocks.grn_parts_id AND grnstocks.quantity>0
      WHERE grn.outlet_id = :outlet_id
    `;

    // Append search filter if searchKey is provided
    if (searchKey) {
      query += `
        AND (grnparts.item_code LIKE :searchKey 
        OR grnparts.item_description LIKE :searchKey)
      `;
    }

    // Add the order by clause
    query += `
      GROUP BY grnparts.item_id,grn.grn_no,grn.id,grnparts.id,grnstocks.quantity
      ORDER BY grn.createdAt DESC
    `;

  

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        outlet_id: user.outlet.id,
        searchKey: `%${searchKey}%`, // If searchKey exists
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return {result:[]}; // Return an empty array or a message indicating no data found
    }

    return { result };
  } catch (err) {
    logger.error('stock adjustment Search fetching error', err);
  }
};
// this requirement is not completed,jumping to other task.Too be continue later

const generateStockAdjNo= async (documentType, outletCode, outletid) => {
  const prefix = documentType.split('(')[0].trim();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  // Get the last GRN with the same document type
  const lastGrn = await StockAdjustment.findOne({
    where: { invoice_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`},
       outlet_id: outletid },
    order: [['createdAt', 'DESC']],
  });

  let newGrnNo = 1;
  console.log(lastGrn, 'lastgrn');
  if (lastGrn) {
    const lastGrnNo = lastGrn?.dataValues?.invoice_number?.split('-')[2];
    newGrnNo = parseInt(lastGrnNo, 10) + 1;
  }

  const paddedGrnNo = String(newGrnNo).padStart(6, '0');
  return `${prefix}-${outletCode}${financialYear}-${paddedGrnNo}`;
};

const CreateStockAdjustment = async (body,grand_total,user,t=null) => {
      const {id,...rem}=body.dataValues
      const invoice_number = await generateStockAdjNo(
        body.document_type,
        user.outlet.outletCode,
        user.outlet.id
      );
  const newobj={
    ...rem,
    grn_id:id,
    grand_total,
    invoice_number
  }
  
  let data = {};
  try {
    data = StockAdjustment.create(newobj,t ? {transaction:t} : {});
  } catch (err) {
    logger.error('New Stock Adjustment error', err);
  }

  return data;
};

const CreateStockAdjustmentParts = async (body,stockadjustmentdata,t=null) => {
  console.log(body, 'body');

  let data = {};
  let strdata=[]

  for(let item of body){
    const {id,...rem}=item
    const newobj={
      ...rem,
      grnparts_id:id,
      stock_adj_id:stockadjustmentdata.dataValues.id
    }
    strdata.push(newobj)
  }
 
  try {
    data = StockAdjustmentPart.bulkCreate(strdata,t ? {transaction:t} : {});
  } catch (err) {
    logger.error('New StockAdjustment  Parts error', err);
  }

  return data;
};

const CreateNegStockAdjustment = async (body,user) => {

let data = {};
const invoice_number = await generateStockAdjNo(
  body.document_type,
  user.outlet.outletCode,
  user.outlet.id
);
body.createdBy = user.id;
body.outlet_id = user.outlet.id;
body.invoice_number=invoice_number
try {
data = StockAdjustment.create(body);
} catch (err) {
logger.error('New Neg Stock Adjustment error', err);
}
return data;
};

const CreateNegStockAdjustmentParts = async (body,adj) => {
console.log(body, 'body');
console.log(adj,"adj")
let data = [];


try {
  for (const item of body) {
     //add adj id to the parts obj and remove id
     const {id,...rem}=item
    const addadjid = {
      ...rem,
      stock_adj_id: adj["dataValues"]["id"],
    };
   
     
    // Fetch stocks related to the item_id
    const stockadjustment_part= await StockAdjustmentPart.create(addadjid);
   
    // Push the stock_id and reduced quantity to the results array
    data.push({
      stock_id: id,
      quantity: item.quantity,
      stock_adj_part_id:stockadjustment_part["dataValues"]["id"]
    });

  }

} catch (err) {
logger.error('New Neg StockAdjustment  Parts error', err);
}
return data;
};

const NegAdjUpdatestock = async (items) => {
  try {
    const results = [];

    // Iterate through the array of items
    console.log(items, "items")
    for (const item of items) {
      const stockid = item.stock_id;

      // Fetch stocks related to the item_id

      await GrnStocks.update({ quantity: db.Sequelize.literal(`quantity - ${item.quantity}`), }, {
        where: {
          id: stockid,
        },
      },
      );
      // Push the stock_id and reduced quantity to the results array
      results.push({
        stock_id: stockid,
        quantity: item.quantity,
        stock_adj_part_id:item.stock_adj_part_id
      });

    }

    return results;
  } catch (error) {
    logger.error('Error reducing stock quantity:', error);
  }
};

const CreateNegStockAdjLog = async (body) => {
  let data = [];
  try {
    data = negadjstocklog.bulkCreate(body);
  } catch (err) {
    logger.error('New stocklog error', err);
  }

  return data;
};

const GetStockAdjustment = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { document_type: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      const userCondition = {outlet_id:user.outlet.id};
     

      const stockAdjDetails = await StockAdjustment.findAll({
        where: { ...searchCondition, ...userCondition },
        
          attributes: [
            'invoice_number',
              'id',
              // 'document_type',
              'grand_total',
              'createdAt',
          ],
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
    let count=await StockAdjustment.count({where:userCondition})
    return {stockAdjDetails,count};
  } catch (err) {
    logger.error(' Stock Adjustment fetching error', err);
  }
};

const getStockPositionReport = async (reqData, user) => {
  try {
 let outletCondition = "stocks.outlet_id = :outlet_id";
    let replacements={}

    if (user.reportAccess == 1) {
      // Fetch outlet_id dynamically
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        outletCondition = `stocks.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    let query = `
   SELECT
  grn.grn_no,
  grn.invoice_number,
  grn.invoice_date,
  grn.vendor_code,

  grnparts.item_code,
  grnparts.item_description,
  grnparts.rate,
  grnparts.cost,
  grnparts.mrp,
  grnparts.cgst,
  grnparts.sgst,
  grnparts.igst,
  grnparts.discount,
  stocks.quantity,
  stocks.createdAt,
  stocks.old_supplier_date,
  binlocations.binLocation,

  vendors.vendorName,
  vendors.gstin,
  vendors.city,

  outlets.state AS outlet_state,
  outlets.city AS outlet_city,
  outlets.outletName AS outlet_name,

  items.hsnCode,
  uom.uomType,
  itemcategories.itemCategorie,
  aggregates.aggregateName,
  subaggregates.subAggregateName,
  makes.makeName,
  models.modelName

FROM stocks

INNER JOIN grns grn
  ON grn.id = stocks.grn_id

LEFT JOIN grnparts
  ON grnparts.id = stocks.grn_parts_id

LEFT JOIN gateinpartsbinlocations binlocations
  ON binlocations.stocks_id = stocks.id

LEFT JOIN vendors
  ON vendors.id = grn.vendor_id

LEFT JOIN outlets 
  ON outlets.id = grn.outlet_id

LEFT JOIN items
  ON items.id = stocks.item_id

LEFT JOIN uom ON uom.id = items.uomId
LEFT JOIN itemcategories ON itemcategories.id = items.itemcategoryId
LEFT JOIN aggregates ON aggregates.id = items.aggregateId
LEFT JOIN subaggregates ON subaggregates.id = items.subaggregateId
LEFT JOIN makes ON makes.id = items.makeId
LEFT JOIN models ON models.id = items.modelId

WHERE ${outletCondition} AND stocks.quantity > 0

    `;

    // Append date condition if both fromDate and toDate are provided
    // if (fromDate && toDate) {
    //   query += `
    //     AND grn.createdAt BETWEEN :fromDate AND :toDate
    //   `;
    // }



    // Add the order by clause
    query += `
      ORDER BY stocks.createdAt DESC
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


// const getAPreport = async (reqData, user) => {
//   try {
//     const { fromDate, toDate } = reqData;
//     let outletCondition = "grns.outlet_id = :outlet_id";
//     let replacements = { fromDate: fromDate || null, toDate: toDate || null };

//     if (user.reportAccess == 1) {
//       // Fetch outlet_id dynamically
//       const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
//       const outletResult = await db.sequelize.query(outletQuery, {
//         replacements: { employeeId: user.employeeId },
//         type: db.Sequelize.QueryTypes.SELECT,
//       });

//       const outletIds = outletResult.map(row => row.outlet_id);

//       if (outletIds.length > 0) {
//         outletCondition = `grns.outlet_id IN (:outlet_ids)`;
//         replacements.outlet_ids = outletIds;
//       } else {
//         return { error: 'No outlets found for the user' }; // Return an error message
//       }
//     } else {
//       replacements.outlet_id = user.outlet.id;
//     }

//     let query = `
//       SELECT
//         grns.id, grns.outlet_id, grns.document_type, grns.grn_no, grns.invoice_number,
//         grns.invoice_date, grns.vendor_code, grns.e_sugam_no, grns.lr_number, grns.lr_date,
//         grns.transport_name, grns.frieght_charges, grns.mis_charges, grns.createdAt, grns.vendor_id
//       FROM grns
//       WHERE ${outletCondition}
//     `;

//     // Append date filter condition
//     if (fromDate && toDate) {
//       query += ` AND DATE(grns.createdAt) BETWEEN :fromDate AND :toDate `;
//     }

//     query += ` ORDER BY grns.createdAt DESC `;

//     // Execute the query
//     const result = await db.sequelize.query(query, {
//       replacements,
//       type: db.Sequelize.QueryTypes.SELECT,
//     });

//     return result.length > 0 ? result : { message: 'No records found' };
//   } catch (err) {
//     logger.error('Item Search fetching error', err);
//     throw new Error('Failed to fetch report');
//   }
// };

const getAPreport = async (reqData, user) => {
  try {
    const { fromDate, toDate, companyId } = reqData;

    if (!companyId) {
      return { error: 'Company ID is required.' };
    }

    // Step 1: Fetch outlet_ids from outlets table 
    const outletQuery = `
      SELECT id as outlet_id 
      FROM outlets 
      WHERE companyId = :companyId
    `;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { companyId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const outletIds = outletResult.map(row => row.outlet_id);

    if (outletIds.length === 0) {
      return { error: 'No outlets found for the selected company.' };
    }

    // Step 2: Build the GRN query
    const replacements = {
      outlet_ids: outletIds,
      fromDate: fromDate || null,
      toDate: toDate || null,
    };

    let query = `
      SELECT
        grns.id, grns.outlet_id, grns.document_type, grns.grn_no, grns.invoice_number,
        grns.invoice_date, grns.vendor_code, grns.e_sugam_no, grns.lr_number, grns.lr_date,
        grns.transport_name, grns.frieght_charges, grns.mis_charges, grns.createdAt, grns.vendor_id
      FROM grns
      WHERE grns.outlet_id IN (:outlet_ids)
    `;

    if (fromDate && toDate) {
      query += ` AND DATE(grns.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY grns.createdAt DESC `;

    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });
console.log('testing apReport',result);
    return result;
  } catch (err) {
    logger.error('AP Report fetching error', err);
    throw new Error('Failed to fetch report');
  }
};

const getReceiptreport = async (reqData, user) => { 
  try {
    const { fromDate, toDate, companyId } = reqData;

    if (!companyId) {
      return { error: 'Company ID is required.' };
    }

    // Step 1: Fetch outlet_ids from outlets table 
    const outletQuery = `
      SELECT id as outlet_id 
      FROM outlets 
      WHERE companyId = :companyId
    `;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { companyId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const outletIds = outletResult.map(row => row.outlet_id);

    if (outletIds.length === 0) {
      return { error: 'No outlets found for the selected company.' };
    }

    // Step 2: Build the receipt query
    const replacements = {
      outlet_ids: outletIds,
      fromDate: fromDate || null,
      toDate: toDate || null,
    };

    let query = `
      SELECT
        receipts.doc_no,receipts.receipt_type,receipts.bill_type,
        receipts.jc_number,
        receipts.amount,
        receipts.ref_no,
        receipts.ref_date,
        receipts.remarks,
        receipts.mode_of_payment,
        receipts.drawn_on,
        receipts.cheque_draft_date,
       receipts. cheque_draft_number,
        receipts.transaction_number,
        receipts.created_by,
        receipts.updated_by,
        receipts.createdAt as receipt_date,
        receipts.utr_bank_name,
        outlet.outletName,
        outlet.oracleSiteCode,
        outlet.oracleCashCustomerCode,
        outlet.oracleLocation,
        outlet.companyId,
        outlet.companyName,
        billings.bill_no,
        billings.createdAt as bill_date
      FROM receipts
      LEFT JOIN outlets as outlet on outlet.id = receipts.outlet_id
      LEFT JOIN transactions  on transactions.id = receipts.transaction_id
      LEFT JOIN billings on billings.transaction_id = transactions.id
      WHERE receipts.outlet_id IN (:outlet_ids)
    `;

    if (fromDate && toDate) {
      query += ` AND DATE(receipts.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY receipts.createdAt DESC `;

    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });
console.log('testing Report',result);
    return result;
  } catch (err) {
    logger.error('Receipt Report fetching error', err);
    throw new Error('Receipt Report fetching error');
  }
};


// const getPOReturn = async (reqData, user) => { 
//   // need to change this logic 
//   try {
//     const { fromDate, toDate } = reqData;
//     let outletCondition = "purchase_returns.outlet_id = :outlet_id";
//     let replacements = { fromDate: fromDate || null, toDate: toDate || null };

//     if (user.reportAccess == 1) {
//       // Fetch outlet_id dynamically
//       const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
//       const outletResult = await db.sequelize.query(outletQuery, {
//         replacements: { employeeId: user.employeeId },
//         type: db.Sequelize.QueryTypes.SELECT,
//       });

//       const outletIds = outletResult.map(row => row.outlet_id);

//       if (outletIds.length > 0) {
//         outletCondition = `purchase_returns.outlet_id IN (:outlet_ids)`;
//         replacements.outlet_ids = outletIds;
//       } else {
//         return { error: 'No outlets found for the user' }; // Return an error message
//       }
//     } else {
//       replacements.outlet_id = user.outlet.id;
//     }
 
//     let query = `
//       SELECT
//         purchase_returns.id, purchase_returns.outlet_id, purchase_returns.grn_no, purchase_returns.purchase_return_invoice_number,purchase_returns.purchase_return_date,
//         purchase_returns.vendor_code, purchase_returns.vendor_name,purchase_returns.vendor_id, purchase_returns.createdBy, purchase_returns.createdAt,
//         grns.id AS GRN_ID, grns.grn_no AS GRN_NUM, grns.invoice_number AS GRN_INVOICE, grns.invoice_date AS GRN_INVOICE_DATA, grns.createdAt AS GRN_CREATEDAT, grns.vendor_code AS GRN_VENDOR_CODE
//       FROM purchase_returns
//       LEFT JOIN grns  on grns.id = purchase_returns.grn_id
//       WHERE ${outletCondition}
//     `;

//     // Append date filter condition
//     if (fromDate && toDate) {
//       query += ` AND DATE(purchase_returns.createdAt) BETWEEN :fromDate AND :toDate `;
//     }

//     query += ` ORDER BY purchase_returns.createdAt DESC `;

//     // Execute the query
//     const result = await db.sequelize.query(query, {
//       replacements,
//       type: db.Sequelize.QueryTypes.SELECT,
//     });

//     return result.length > 0 ? result : { message: 'No records found' };
//   } catch (err) {
//     logger.error(' Po Return Item Search fetching error', err);
//     throw new Error('Failed to fetch report');
//   }
// };

const getPOReturn = async (reqData, user) => {
  try {
    const { fromDate, toDate, companyId } = reqData;

    if (!companyId) {
      return { error: 'Company ID is required.' };
    }

    // Step 1: Fetch outlet_ids from outlets table based on companyId
    const outletQuery = `
      SELECT id as outlet_id 
      FROM outlets 
      WHERE companyId = :companyId
    `;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { companyId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const outletIds = outletResult.map(row => row.outlet_id);

    if (outletIds.length === 0) {
      return { error: 'No outlets found for the selected company.' };
    }

    const replacements = {
      outlet_ids: outletIds,
      fromDate: fromDate || null,
      toDate: `${toDate} 23:59:59`  || null,
    };

    // Step 2: Build the query
    let query = `
      SELECT
        purchase_returns.id, purchase_returns.outlet_id, purchase_returns.grn_no,
        purchase_returns.purchase_return_invoice_number, purchase_returns.purchase_return_date,
        purchase_returns.vendor_code, purchase_returns.vendor_name, purchase_returns.vendor_id,
        purchase_returns.createdBy, purchase_returns.createdAt,
        grns.id AS GRN_ID, grns.grn_no AS GRN_NUM, grns.invoice_number AS GRN_INVOICE,
        grns.invoice_date AS GRN_INVOICE_DATA, grns.createdAt AS GRN_CREATEDAT,
        grns.vendor_code AS GRN_VENDOR_CODE
      FROM purchase_returns
      LEFT JOIN grns ON grns.id = purchase_returns.grn_id
      WHERE purchase_returns.outlet_id IN (:outlet_ids)
    `;

    // Step 3: Add optional date filter
    if (fromDate && toDate) {
      query += ` AND DATE(purchase_returns.createdAt) BETWEEN :fromDate AND :toDate `;
    }

    query += ` ORDER BY purchase_returns.createdAt DESC `;

    // Step 4: Execute the query
    const result = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return result.length > 0 ? result : { message: 'No records found' };
  } catch (err) {
    logger.error('PO Return Item Search fetching error', err);
    throw new Error('Failed to fetch report');
  }
};


const getCocofocoBranch = async (outlet_id) => {
  try {
    const branch = await outletData.findOne({
      where: { id: outlet_id },
      attributes: ['id', 'companyId', 'oracleLocation', 'outletCode'],
      order: [['branch', 'ASC']],
    });
    return branch;
  } catch (err) {
    console.error("Error fetching branch data:", err);
    throw new Error("Error fetching branch data");
  }
};

const getVendor = async (vendorId) => {
  try {
    const vendors = await vendor.findOne({
      where: { id: vendorId },
      attributes: ['id', 'oracle_vendor_number', 'vendor_site_code'],
    });
    return vendors;
  } catch (err) {
    console.error("Error fetching vendor data:", err);
    throw new Error("Error fetching vendor data");
  }
};

const getGrnPartsByGrnId = async (grnId) => {
  try {
    const grnParts = await GrnParts.findAll({
      where: {
        grn_id: grnId,
      },
      attributes: [
        'id', 'quantity', 'cost', 'discount', 'rate', 'poparts_id','po_id',
        'mrp', 'cgst', 'sgst', 'igst'
      ],
      include: [
        {
          model: Items,
          as: 'items',
          attributes: ['hsnCode'],
        }
      ]
    });

    return grnParts;
  } catch (error) {
    console.error('Error fetching GRN parts:', error);
    throw new Error('Failed to retrieve GRN parts');
  }
};

const getPoDetailsById = async (poPartId) => {
  try {
    const poDetails = await purchaseOrderParts.findOne({
      where: { id: poPartId },
      attributes: [], // No need to return PoPart fields
      include: [
        {
          model: purchaseorder,
          as: 'purchaseorder',
          attributes: ['po_number', 'createdAt'],
        },
      ],
    });

    if (!poDetails || !poDetails.PurchaseOrder) {
      return null;
    }

    return poDetails.PurchaseOrder;
  } catch (error) {
    console.error('Error fetching PO details:', error);
    throw new Error('Failed to fetch Purchase Order details');
  }
};


const getPOReturnDetails = async (purchase_return_id) => {
  try {
    // Build base query
    let query = `
      SELECT PRP.id, PRP.purchase_return_id, PRP.item_id,PRP.discount, PRP.item_code, PRP.item_description, PRP.quantity, PRP.cost, PRP.cgst, PRP.sgst, PRP.igst, PRP.total, PRP.createdAt, PRP.updatedAt, items.hsnCode
      FROM purchase_return_parts AS PRP
      LEFT JOIN items AS items ON items.id = PRP.item_id
      WHERE PRP.purchase_return_id = :purchase_return_id
    `;

    // Add the order by clause
    query += `
      ORDER BY PRP.createdAt DESC
    `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
         purchase_return_id,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    return  result.length > 0 ? result : [] ;
  } catch (err) {
    logger.error('po return parts search failed', err);
  }
};


const getPODetails = async (po_id) => {
  try {
    // Build base query
    let query = `
      SELECT PO.po_number,PO.createdAt
      FROM purchaseorders AS PO
      WHERE PO.id = :po_id
    `;

    // Add the order by clause
    query += `
      ORDER BY PO.createdAt DESC
    `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        po_id,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    return  result.length > 0 ? result : { message: 'No records found' } ;
  } catch (err) {
    logger.error('po return parts search failed', err);
  }
};

const getStockAdjustmentReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
 let outletCondition = "stockadjustments.outlet_id = :outlet_id";
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
        outletCondition = `stockadjustments.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT  stockadjustments.invoice_number, stockadjustments.document_type,stockadjustments.createdAt, 
             stockadjustment_parts.item_code, stockadjustment_parts.item_description, stockadjustment_parts.rate,stockadjustment_parts.cost,
             stockadjustment_parts.mrp,stockadjustment_parts.quantity,stockadjustment_parts.total,
             items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
      FROM stockadjustments AS stockadjustments
      LEFT JOIN stockadjustment_parts AS stockadjustment_parts ON stockadjustment_parts.stock_adj_id = stockadjustments.id
      LEFT JOIN items as items ON stockadjustment_parts.item_id=items.id
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
        AND stockadjustments.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY stockadjustments.createdAt DESC
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

const BulkCreateGateeinBinLocation = async (body,user,grnparts,t=null) => {
  
   let data = [];
   let bindata
   try {
const uniqueBinsMap = new Map();
    for(let item of body){
     let find_grnparts=grnparts.find(part=>part.binid==item.binid)
      console.log(find_grnparts,"id")
      let resobj={
        ...item,
        grn_parts_id:find_grnparts.id,
        item_id:find_grnparts.item_id,
        stocks_id: find_grnparts.stock_id
      }
      data.push(resobj)

      const key = `${item.binLocation}_${item.outlet_code}`;
  
  if (!uniqueBinsMap.has(key)) {
    uniqueBinsMap.set(key, {
      binLocation: item.binLocation,
      binLocationDescription: item.binLocation,
      outletCode: item.outlet_code,
      status: 1,
      createdBy: user.id
    });
  }


      
  }
  const uniqueBins = Array.from(uniqueBinsMap.values());
  const existingBins = await BinlocationDao.getAllBinLocationByBinlocaionAndOutletCode(uniqueBins);
  const existingSet = new Set(
  existingBins.map(b => `${b.binLocation}_${b.outletCode}`)
);

const newBins = uniqueBins.filter(
  b => !existingSet.has(`${b.binLocation}_${b.outletCode}`)
);
if (newBins.length > 0) {
  await BinlocationDao.bulkCreateBinLocation(newBins);
}
    bindata=await GateinBinLocation.bulkCreate(data,t ? {transaction:t} : {});

   }
    catch (err) {
     logger.error('New Grn error', err);
   }
 
   return bindata;
 };
const getItemFinder = async (reqData, user) => {
  try {
    const { id } = reqData;
    
    let result=[]
    // Build base query
    // ROUND(i.list,2) AS rate, 
    // ROUND(i.cost,2) AS cost, 
    // ROUND(i.mrp,2) AS mrp,
    let query = `
WITH stock_cte AS (
    SELECT item_id, SUM(COALESCE(quantity,0)) AS stockquantity
    FROM stocks
    WHERE outlet_id = :outlet_id
    GROUP BY item_id
),
purchase_cte AS (
    SELECT gp.item_id, SUM(gp.quantity) AS purchasequantity
    FROM grns grn
    JOIN grnparts gp ON gp.grn_id = grn.id
    WHERE grn.outlet_id = :outlet_id
    GROUP BY gp.item_id
),
partissue_cte AS (
    SELECT item_id, SUM(quantity) AS partissueqty
    FROM parts_issues
    WHERE outlet_id = :outlet_id
    GROUP BY item_id
),
countersale_cte AS (
    SELECT item_id, SUM(quantity) AS countersaleqty,
    SUM(COALESCE(return_quantity,0)) AS countersaleretnqty
    FROM countersale_parts
    WHERE outlet_id = :outlet_id
    GROUP BY item_id
)
SELECT 
    i.id, 
    i.itemCode, 
    i.itemDescription,
    COALESCE(s.stockquantity, 0) AS stockquantity,
    COALESCE(pu.purchasequantity, 0) AS purchasequantity,
    COALESCE(pi.partissueqty, 0) AS partissueqty,
    COALESCE(cs.countersaleqty, 0) AS csqty,
    COALESCE(cs.countersaleretnqty, 0) AS csretrqty
FROM items i
LEFT JOIN stock_cte s ON i.id = s.item_id
LEFT JOIN purchase_cte pu ON i.id = pu.item_id
LEFT JOIN partissue_cte pi ON i.id = pi.item_id
LEFT JOIN  countersale_cte cs ON i.id = cs.item_id

      WHERE id = :id
    `;

   

  

    // Execute the query
     result = await db.sequelize.query(query, {
      replacements: {
        outlet_id: user.outlet.id,
        id:id
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result) {
      result= {}; // Return an empty array or a message indicating no data found
    }

    return result[0]
  } catch (err) {
    logger.error('Item Search fetching error', err);
  }
};
const getPurchaseDetails = async (reqData, user) => {
  try {
    const { id } = reqData;
    let result=[]
    // Build base query
    //  grn.e_sugam_no,grn.lr_number,grn.lr_date,grn.transport_name,grn.frieght_charges,grn.mis_charges
    let query = `
      SELECT grn.document_type,grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code,
      grnparts.quantity
             
      FROM items

      LEFT JOIN stocks AS grnstocks ON items.id = grnstocks.item_id and grnstocks.outlet_id = :outlet_id
      LEFT JOIN grnparts AS grnparts ON grnstocks.grn_parts_id = grnparts.id
      LEFT JOIN grns  AS grn ON grnparts.grn_id = grn.id
      WHERE items.id = :id
    `;

    // Append search filter if searchKey is provided
  

    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
    `;



    // Execute the query
     result = await db.sequelize.query(query, {
      replacements: {
        id:id,
        outlet_id: user.outlet.id
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result) {
      result= []; // Return an empty array or a message indicating no data found
    }
    return  result
  } catch (err) {
    logger.error('Item Search fetching error', err);
  }
};
const getSalesDetails = async (reqData, user) => {
  try {
    const { id } = reqData;

    // Counter Sales query
    const SalesQuery = `
      SELECT 
        cs.document_type,
        cs.invoice_number,
        cs.customer_name,
        null as reg_no,
        (csp.quantity - COALESCE(csp.return_quantity, 0)) as quantity,
        cs.createdAt,
        "cs" as type
      FROM countersale_parts csp
      JOIN countersales cs ON csp.counter_sale_id = cs.id
      WHERE csp.item_id = :id and (csp.quantity - COALESCE(csp.return_quantity, 0))>0
      and csp.outlet_id = :outlet_id
      UNION ALL
      SELECT 
        tr.document_type,
        tr.job_card_no as invoice_number,
        tr.customer_name,
        tr.reg_no,
        pi.quantity,
        tr.createdAt,
        "jc" as type
      FROM parts_issues pi
      JOIN transactions tr ON tr.id = pi.transaction_id
      WHERE pi.item_id = :id and pi.quantity>0 and tr.outlet_id = :outlet_id
    `;

    // Execute both queries
    const Sales = await db.sequelize.query(SalesQuery, {
      replacements: { id,
        outlet_id: user.outlet.id
       },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    

    return {
      result: Sales || [],
    };

  } catch (err) {
    logger.error('Item sales fetching error', err);
    return { counterSales: [], jobcardSales: [] };
  }
};

const getStockTransferParts = async (reqData, user) => {
  try {
    const {itemCode,toOutletId} = reqData;
     let rows= [];
     let query= `
      SELECT  items.id,
        items.itemCode,
        items.itemName,
        items.itemDescription,
        items.taxPercentage,
        items.hsnCode,
        COALESCE(SUM(stocks.quantity),0) as quantity,
        COALESCE(ROUND(AVG(stocks.rate),2),0) as rate,
        COALESCE(ROUND(MAX(stocks.cost),2),0) as cost,
        COALESCE(MAX(stocks.mrp),0) as mrp
        FROM items
        lEFT JOIN stocks ON items.id = stocks.item_id and stocks.outlet_id= :toOutletId
        WHERE itemCode = :itemCode
    `;
      rows = await db.sequelize.query(query, {
      replacements: {
        itemCode: itemCode, // If searchKey exists
        toOutletId: toOutletId
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log(rows,"row")
    return rows;

  } catch (err) {
    logger.error('stock transfer items fetching error', err);
  }
};

const CreateGrnStocksForDirectGrn = async ( grn, grnparts, user,bindata,t=null) => {
  let data = {};
    try {
  console.log(grnparts[0], 'updata');
  for(let item of bindata){
    console.log(item,"itemsd")
  const i=grnparts.findIndex(part=>part.binid==item.binid)
  let totalbeforetax=((grnparts[i].cost*grnparts[i].quantity)-(grnparts[i].discount?grnparts[i].discount:0))
  let taxamount=((totalbeforetax*grnparts[i].cgst)/100)+((totalbeforetax*grnparts[i].sgst)/100)+((totalbeforetax*grnparts[i].igst)/100)
  let resobj={
    quantity: item.quantity,
    item_id: grnparts[i].item_id,
    item_code: grnparts[i].item_code,
    item_description: grnparts[i].item_description,
    rate: grnparts[i].rate,
    cost: grnparts[i].cost,
    mrp: grnparts[i].mrp,
    cgst: grnparts[i].cgst,
    sgst: grnparts[i].sgst,
    igst: grnparts[i].igst,
    total: totalbeforetax + taxamount,
    grn_id: grn['dataValues']['id'],
    grn_parts_id: grnparts[i]['id'],
    outlet_id: user.outlet.id,
    binlocation:0
  }
      data =await GrnStocks.create(resobj,t ? { transaction: t } : {});

        let binlocation=await GateinBinLocation.create({
          binLocation:item.binLocation,
          quantity:item.quantity,grn_parts_id:grnparts[i].id,
          item_id:grnparts[i].item_id,
          item_code:grnparts[i].item_code,
          stocks_id:data.id},t ? {transaction:t} : {});

}

  } catch (err) {
    logger.error('New Stcks error', err);
  }

  return data;
};

const CreateGrnStocksFOrGatein = async (body, grn, grnparts, user,t=null) => {
  let data = {};
    try {
  console.log(grnparts[0], 'gstein');
    let findbinlocation=await GateinBinLocation.findAll({where:{gatein_parts_id:body.map(item=>item.gateinparts_id)}})
  for(let item of findbinlocation){
    const {discount,id,...remain}=grnparts.find(b=>b.gateinparts_id===item.gatein_parts_id)
    let resobj={
      ...remain,
      quantity:item.quantity,
      grn_id: grn['dataValues']['id'],
      grn_parts_id: id,
      outlet_id: user.outlet.id,
    }
    console.log(resobj,"resobj")
      data =await GrnStocks.create(resobj,t ? { transaction: t } : {});

   let   binlocation=await GateinBinLocation.update({
        stocks_id:data.id,
        gatein_parts_id:item.gatein_parts_id,
        grn_parts_id:id
      },{
        where:{id:item.id}
      },t ? {transaction:t} : {});
      
  }
  } catch (err) {
    logger.error('New Stcks error', err);
  }

  return data;
};

const GetInventoryStockForGMS = async (user) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN age_days BETWEEN 0 AND 30 THEN '0 to 30 Days'
          WHEN age_days BETWEEN 31 AND 60 THEN '31 to 60 Days'
          WHEN age_days BETWEEN 61 AND 90 THEN '61 to 90 Days'
          WHEN age_days BETWEEN 91 AND 120 THEN '91 to 120 Days'
          WHEN age_days BETWEEN 121 AND 150 THEN '121 to 150 Days'
          WHEN age_days > 150 THEN 'Above 150 Days'
        END AS age_bucket,
        SUM(quantity) AS total_count,
        ROUND(SUM(quantity * cost), 0) AS total_price
      FROM (
        SELECT quantity, cost, DATEDIFF(CURDATE(), createdAt) AS age_days
        FROM stocks
        WHERE quantity > 0 AND outlet_id = :outlet_id
      ) t
      GROUP BY age_bucket;
    `;

    const results = await Promise.allSettled([
      db.sequelize.query(query, {
        replacements: { outlet_id: user.outlet.id },
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      axios.post(
        `${EXTERNAL_API.OLdDMS_BASE_URL}/jobcard/GetInventoryStockForGMS`,
        { outletCode: user.outlet.outletCode },
        {
          headers: {
            "Content-Type": "application/json",
            "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
          }
        }
      )
    ]);

    // Extract values from settled promises
    const [localResult, externalResult] = results;

    // Handle local DB query result
    let rows = [];
    if (localResult.status === 'fulfilled') {
      const result = localResult.value;
      // Handle different Sequelize return formats
      if (Array.isArray(result)) {
        // If it's [rows, metadata] format
        if (result.length > 0 && Array.isArray(result[0])) {
          rows = result[0];
        } else {
          rows = result;
        }
      }
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        rows = [];
      }
    } else {
      logger.error('Local DB query failed:', localResult.reason);
      rows = [];
    }

    // Handle external API result
    let externalAgeBuckets = [];
    if (externalResult.status === 'fulfilled') {
      const response = externalResult.value;
      console.log(response.data?.data, "response");
      
      // Extract data and ensure it's an array
      const data = response.data?.data;
      if (Array.isArray(data)) {
        externalAgeBuckets = data;
      } else {
        logger.warn('External API response data is not an array:', data);
        externalAgeBuckets = [];
      }
    } else {
      logger.error('External API call failed:', externalResult.reason);
      externalAgeBuckets = [];
    }

    // Log the data for debugging
    console.log('Local rows:', rows);
    console.log('External buckets:', externalAgeBuckets);

    const bucketOrder = [
      '0 to 30 Days',
      '31 to 60 Days',
      '61 to 90 Days',
      '91 to 120 Days',
      '121 to 150 Days',
      'Above 150 Days',
    ];

    // Create maps for lookup
    const externalBucketMap = {};
    if (Array.isArray(externalAgeBuckets)) {
      externalAgeBuckets.forEach(r => {
        if (r && r.age_bucket) {
          externalBucketMap[r.age_bucket] = r;
        }
      });
    }

    const localBucketMap = {};
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (r && r.age_bucket) {
          localBucketMap[r.age_bucket] = r;
        }
      });
    }

    // MERGED DATA
    const ageBuckets = bucketOrder.map(bucket => {
      const local = localBucketMap[bucket] || {};
      const external = externalBucketMap[bucket] || {};
      
      // Convert to numbers and handle potential decimal issues
      const localCount = Number(local.total_count) || 0;
      const externalCount = Number(external.total_count) || 0;
      const localPrice = Number(local.total_price) || 0;
      const externalPrice = Number(external.total_price) || 0;
      
      // Round total_count to 2 decimal places
      const totalCount = Number((localCount + externalCount).toFixed(2));
      const totalPrice = Math.round(localPrice + externalPrice);
      
      return {
        age_bucket: bucket,
        total_count: totalCount,
        total_price: totalPrice,
      };
    });

    // FINAL TOTALS
    const totals = ageBuckets.reduce(
      (acc, cur) => {
        acc.total_count += Number(cur.total_count);
        acc.total_price += Number(cur.total_price);
        return acc;
      },
      { total_count: 0, total_price: 0 }
    );

    totals.total_count = Number(totals.total_count.toFixed(2));
    totals.total_price = Math.round(totals.total_price);

    return { ageBuckets, totals };
  } catch (err) {
    logger.error('Inventory fetching error', err);
    throw err;
  }
};


// const dashboardPurchaseFromMytvs = async (body, user) => { 
//   try {
//     const option = body.option || 'monthly';
//     let formattedStartDate = '';
//     let formattedEndDate = '';

//     if(option !== 'monthly' && option !== 'yearly') {
//         throw new Error('Invalid option. Must be either "monthly" or "yearly".');
//     }
//     const currentDate = new Date();
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();

//     if (option === 'monthly') {
//         const startDate = new Date(year, month, 1);
//          formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')} 00:00:00`;
//         const endDate = new Date(year, month + 1, 0);
//          formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')} 23:59:59`;

//     } else if (option === 'yearly') {
//         let fyStartYear;
//         let fyEndYear;
//         if (month >= 3) {
//             fyStartYear = year;
//             fyEndYear = year + 1;
//         } else {
//             fyStartYear = year - 1;
//             fyEndYear = year;
//         }
//         formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
//         formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
//     }

//             const query = `  SELECT
//   CASE 
//     WHEN :option = 'monthly' THEN 
//       DAY(g.createdAt)
//     ELSE 
//       LOWER(LEFT(MONTHNAME(g.createdAt), 3))
//   END AS period,

//  ROUND (SUM((COALESCE(gp.cost, 0)*gp.quantity)-COALESCE(gp.discount, 0)), 0) AS amount

// FROM grns g
// LEFT JOIN grnparts gp ON gp.grn_id = g.id
// LEFT JOIN vendors v ON g.vendor_id =v.id
// WHERE
//   g.outlet_id = :outletId
//   AND g.createdAt BETWEEN :startDate AND :endDate
//   AND (v.vendorName LIKE '%tvs%' OR v.vendorName LIKE '%ki%')
// GROUP BY
//   CASE 
//     WHEN :option = 'monthly' THEN 
//       DAY(g.createdAt)
//     ELSE LOWER(LEFT(MONTHNAME(g.createdAt), 3))
//   END
// `;

        
//         const rows = await db.sequelize.query(query, {
//             replacements: { 
//                 option: option,
//                 outletId: user.outlet.id,
//                 startDate: formattedStartDate,
//                 endDate: formattedEndDate
//             },
//             type: db.Sequelize.QueryTypes.SELECT
//         });


//       console.log(rows,"rows")
//     return rows;
//   } catch (err) {
//     logger.error('dashboardPurchaseFromMytvs error', err);
//     throw err;
//   }
// };

const dashboardPurchaseFromMytvs = async (body, user) => {
  try {
    const option = body.option || 'monthly';

    const validOptions = [
      'monthly',
      'q1',
      'q2',
      'q3',
      'q4',
      'halfyearly',
      'yearly',
      'preyear',
    ];

    if (!validOptions.includes(option)) {
      throw new Error(
        `Invalid option. Must be one of: ${validOptions.join(', ')}`
      );
    }

    let formattedStartDate = '';
    let formattedEndDate = '';

    const currentDate = new Date();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let fyStartYear;
    let fyEndYear;

    // Financial Year => Apr to Mar
    if (currentMonth >= 4) {
      fyStartYear = currentYear;
      fyEndYear = currentYear + 1;
    } else {
      fyStartYear = currentYear - 1;
      fyEndYear = currentYear;
    }

    /* =========================================================
        MONTHLY
    ========================================================= */
    if (option === 'monthly') {
      const startDate = new Date(
        currentYear,
        currentMonth - 1,
        1
      );

      const endDate = new Date(
        currentYear,
        currentMonth,
        0
      );

      formattedStartDate =
        `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, '0')}-${String(
          startDate.getDate()
        ).padStart(2, '0')} 00:00:00`;

      formattedEndDate =
        `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, '0')}-${String(
          endDate.getDate()
        ).padStart(2, '0')} 23:59:59`;
    }

    /* =========================================================
        Q1 => Apr-Jun
    ========================================================= */
    if (option === 'q1') {
      formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
      formattedEndDate = `${fyStartYear}-06-30 23:59:59`;
    }

    /* =========================================================
        Q2 => Jul-Sep
    ========================================================= */
    if (option === 'q2') {
      formattedStartDate = `${fyStartYear}-07-01 00:00:00`;
      formattedEndDate = `${fyStartYear}-09-30 23:59:59`;
    }

    /* =========================================================
        Q3 => Oct-Dec
    ========================================================= */
    if (option === 'q3') {
      formattedStartDate = `${fyStartYear}-10-01 00:00:00`;
      formattedEndDate = `${fyStartYear}-12-31 23:59:59`;
    }

    /* =========================================================
        Q4 => Jan-Mar
    ========================================================= */
    if (option === 'q4') {
      formattedStartDate = `${fyEndYear}-01-01 00:00:00`;
      formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
    }

    /* =========================================================
        HALF YEARLY
    ========================================================= */
    if (option === 'halfyearly') {
      formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
      formattedEndDate = `${fyStartYear}-09-30 23:59:59`;
    }

    /* =========================================================
        YEARLY
    ========================================================= */
    if (option === 'yearly') {
      formattedStartDate = `${fyStartYear}-04-01 00:00:00`;
      formattedEndDate = `${fyEndYear}-03-31 23:59:59`;
    }

    /* =========================================================
        PREVIOUS YEAR
    ========================================================= */
    if (option === 'preyear') {
      formattedStartDate = `${fyStartYear - 1}-04-01 00:00:00`;
      formattedEndDate = `${fyEndYear - 1}-03-31 23:59:59`;
    }

    const query = `
      SELECT
        period,
        amount

      FROM (
        SELECT

          CASE 
            WHEN :option = 'monthly'
            THEN DAY(g.createdAt)

            ELSE MONTH(g.createdAt)

          END AS period,

          ROUND(
            SUM(
              (COALESCE(gp.cost, 0) * gp.quantity)
              - COALESCE(gp.discount, 0)
            ),
            0
          ) AS amount

        FROM grns g

        LEFT JOIN grnparts gp
          ON gp.grn_id = g.id

        LEFT JOIN vendors v
          ON g.vendor_id = v.id

        WHERE
          g.outlet_id = :outletId

          AND g.createdAt BETWEEN :startDate AND :endDate

          AND (
            v.vendorName LIKE '%tvs%'
            OR v.vendorName LIKE '%ki%'
          )

        GROUP BY
          CASE 
            WHEN :option = 'monthly'
            THEN DAY(g.createdAt)

            ELSE MONTH(g.createdAt)

          END

      ) grouped_data

      ORDER BY
        CASE
          WHEN :option = 'monthly'
          THEN period

          ELSE
            CASE
              WHEN period >= 4
              THEN period

              ELSE period + 12
            END
        END
    `;

    const rows = await db.sequelize.query(query, {
      replacements: {
        option,
        outletId: user.outlet.id,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },

      type: db.Sequelize.QueryTypes.SELECT,
    });

    console.log(
      'final result of purchase for mytvs',
      rows
    );

    return rows;

  } catch (err) {
    logger.error(
      'dashboardPurchaseFromMytvs error',
      err
    );

    throw err;
  }
};


const getZohoBillReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
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
        whereConditions.push(`grn.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`grn.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code, 
             grnparts.item_code, grnparts.item_description, grnparts.rate,grnparts.cost,
             grnparts.mrp,grnparts.quantity,grnparts.discount,grnparts.cgst,grnparts.sgst,grnparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,grnparts.id AS grnparts_id,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100,2) as cgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100,2) as sgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100,2) AS igst_amount,
            ROUND((grnparts.cost * grnparts.quantity) - grnparts.discount,2) as item_total,
            CASE WHEN grnparts.discount > 0 THEN ROUND((grnparts.discount / (grnparts.cost * grnparts.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
            ROUND(SUM((grnparts.cost * grnparts.quantity) - grnparts.discount) OVER (PARTITION BY grn.id),2) AS sub_total,
            ROUND(SUM(
    (grnparts.cost * grnparts.quantity - grnparts.discount)
    +((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100
    + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100
    + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100
  ) OVER (PARTITION BY grn.id),2) AS total
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      LEFT JOIN vendors As vendors ON vendors.id=grn.vendor_id
      LEFT JOIN items as items ON grnparts.item_id=items.id
    

    
      WHERE ${whereConditions}
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND grn.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
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
    logger.error('Item Search fetching error', err);
  }
};

const getKitaraAPReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
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
        whereConditions.push(`grn.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      whereConditions.push(`grn.outlet_id = :outlet_id`);
      outletreplacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code,grn.document_type,
             grnparts.item_code, grnparts.item_description, grnparts.rate,grnparts.cost,
             grnparts.mrp,grnparts.quantity,grnparts.discount,grnparts.cgst,grnparts.sgst,grnparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,grnparts.id AS grnparts_id,
             outlet.outletCode,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100,2) as cgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100,2) as sgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100,2) AS igst_amount,
            ROUND((grnparts.cost * grnparts.quantity) - grnparts.discount,2) as item_total,
            CASE WHEN grnparts.discount > 0 THEN ROUND((grnparts.discount / (grnparts.cost * grnparts.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
            ROUND(SUM((grnparts.cost * grnparts.quantity) - grnparts.discount) OVER (PARTITION BY grn.id),2) AS sub_total,
            ROUND(SUM(
    (grnparts.cost * grnparts.quantity - grnparts.discount)
    +((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100
    + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100
    + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100
  ) OVER (PARTITION BY grn.id),2) AS total
      FROM grns AS grn
      LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
      LEFT JOIN vendors As vendors ON vendors.id=grn.vendor_id
      LEFT JOIN outlets as outlet ON grn.outlet_id=outlet.id
      LEFT JOIN items as items ON grnparts.item_id=items.id

    
      WHERE ${whereConditions}
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND grn.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY grn.createdAt DESC
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
    logger.error('Item Search fetching error', err);
  }
};

const CreateGrnForOldDms = async (body, user,t) => {
  const document_type = body.document_type;
  const grnNo = await generateGrnNo(
    document_type,
    body.outlet_code,
    body.outlet_id
  );
  console.log(grnNo, 'grnno');
 
  let payload={
    ...body,
    createdBy : user.id,
  grn_no : grnNo
}
console.log(payload,"payload")
  let data = {};
  try {
    data = await Grn.create(payload,t ? { transaction: t } : {});
  } catch (err) {
    logger.error('New Grn error', err);
    throw err
  }

  return data;
};
const CreateGrnStocksForOldDms = async (body, grn, user,t=null) => {
  let data = [];
    try {
  for(let item of body){
    let finditem=await ItemDao.getItemDetails({itemCode:item.item_code})
    if(!finditem || finditem.length===0){
    
     throw new Error(`Item with code ${item.item_code} not found`);
    }
      let partres= await GrnParts.create({...item,grn_id: grn['dataValues']['id'],item_id: finditem[0]['dataValues']['id']},t ? { transaction: t } : {})

      let stockres =await GrnStocks.create({...item,grn_id: grn['dataValues']['id'],grn_parts_id: partres['dataValues']['id'],item_id: finditem[0]['dataValues']['id']},t ? { transaction: t } : {});
  if(item?.bin_locations && item.bin_locations.length>0){
   let   binlocation=await GateinBinLocation.create({
        stocks_id:stockres['dataValues']['id'],
        grn_parts_id:partres['dataValues']['id'],
        quantity:item.quantity,
        item_id:finditem[0]['dataValues']['id'],
        item_code:item.item_code,
        binLocation: item.bin_locations[0],
      },t ? {transaction:t} : {});
    }
      data.push(partres)
  }
  } catch (err) {
    logger.error('New Stcks error', err);
  }

  return data;
};
const CreateStockAdjustmentForOlddms = async (body,grand_total,outletId,outletCode,t=null) => {
      const {id,...rem}=body.dataValues
      const invoice_number = await generateStockAdjNo(
        body.document_type,
        outletCode,
        outletId
      );
  const newobj={
    ...rem,
    grn_id:id,
    grand_total,
    invoice_number
  }
  
  let data = {};
  try {
    data = StockAdjustment.create(newobj,t ? {transaction:t} : {});
  } catch (err) {
    logger.error('New Stock Adjustment error', err);
  }

  return data;
};
const CreateStockAdjustmentPartsForOlddms = async (body,stockadjustmentdata,t=null) => {
  console.log(body, 'body');

  let data = {};
  let strdata=[]

  for(let item of body){
          const {id,...rem}=item["dataValues"]
    const newobj={
      ...rem,
      grnparts_id:id,
      stock_adj_id:stockadjustmentdata.dataValues.id
    }
    strdata.push(newobj)
  }
 
  try {
    data = StockAdjustmentPart.bulkCreate(strdata,t ? {transaction:t} : {});
  } catch (err) {
    logger.error('New StockAdjustment  Parts error', err);
  }

  return data;
};

const GetZohoApReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;
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
        whereConditions.push(`grn.outlet_id IN (:outlet_ids)`);
        outletreplacements.outlet_ids = outletIds;
      } else {
        return []; 
      }
      } else {
        whereConditions.push(`grn.outlet_id = :outlet_id`);
        outletreplacements.outlet_id = user.outlet.id;
      }
      whereConditions.push(`grn.status = 1`);
    let query = `
      SELECT grn.grn_no, grn.invoice_number, grn.invoice_date,grn.vendor_code,grn.document_type,grn.status,
             grnparts.item_code, grnparts.item_description, grnparts.rate,grnparts.cost,
             grnparts.mrp,grnparts.quantity,grnparts.discount,grnparts.cgst,grnparts.sgst,grnparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,grnparts.id AS grnparts_id,
             outlet.outletCode,purchaseorders.po_number,
            CASE WHEN vendors.gstin IS NOT NULL AND vendors.gstin != '' THEN 'business_gst'ELSE 'business_none' END AS gst_treatment,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100,2) as cgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100,2) as sgst_amount,
            ROUND(((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100,2) AS igst_amount,
            ROUND((grnparts.cost * grnparts.quantity) - grnparts.discount,2) as item_total,
            CASE WHEN grnparts.discount > 0 THEN ROUND((grnparts.discount / (grnparts.cost * grnparts.quantity)),0) * 100 ELSE 0 END AS discount_percentage,
            ROUND(SUM((grnparts.cost * grnparts.quantity) - grnparts.discount) OVER (PARTITION BY grn.id),2) AS sub_total,
            ROUND(
              (grnparts.cost * grnparts.quantity - grnparts.discount)
              + ((grnparts.cost * grnparts.quantity - grnparts.discount)*grnparts.cgst)/100
              + ((grnparts.cost * grnparts.quantity - grnparts.discount)*grnparts.sgst)/100
              + ((grnparts.cost * grnparts.quantity - grnparts.discount)*grnparts.igst)/100, 2
            ) AS line_total,
            ROUND(SUM(
            (grnparts.cost * grnparts.quantity - grnparts.discount)
            +((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.cgst)/100
            + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.sgst)/100
            + ((grnparts.cost * grnparts.quantity - grnparts.discount)* grnparts.igst)/100
          ) OVER (PARTITION BY grn.id),2) AS total
              FROM grns AS grn
              LEFT JOIN grnparts AS grnparts ON grnparts.grn_id = grn.id
              LEFT JOIN vendors As vendors ON vendors.id=grn.vendor_id
              LEFT JOIN outlets as outlet ON grn.outlet_id=outlet.id
              LEFT JOIN items as items ON grnparts.item_id=items.id
              LEFT JOIN purchaseorders as purchaseorders ON grn.po_id=purchaseorders.id

    
      WHERE ${whereConditions.join(' AND ')}
    `;

    if (fromDate && toDate) {
      query += `
        AND grn.createdAt BETWEEN :fromDate AND :toDate
      `;
    }

    query += `
      ORDER BY grn.createdAt DESC
    `;

    const result = await db.sequelize.query(query, {
      replacements: {
        ...outletreplacements,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; 
    }
    return result;
  } catch (err) {
    logger.error('Item Search fetching error', err);
  }
};

const oldDmsDashboardPurcasheFromMytvs = async (reqData) => {
  try {
    const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/dashboardV1/getDashboardPurchaseFromMytvs`,
      {
        outletCode: reqData.outletCode,
        option: reqData.option,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
        }
      }
    );

    return response.data?.data || [];
  } catch (err) {
    console.log(err);
    logger.error("Old DMS Dashboard Customer Flow API Error", err);
    return [];
  }
};

const getOldBinLocations = async (reqData, user) => {
  try {
 let outletCondition = "stocks.outlet_id = :outlet_id";
    let replacements={}

    if (user.reportAccess == 1) {
      // Fetch outlet_id dynamically
      const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
      const outletResult = await db.sequelize.query(outletQuery, {
        replacements: { employeeId: user.employeeId },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const outletIds = outletResult.map(row => row.outlet_id);

      if (outletIds.length > 0) {
        outletCondition = `stocks.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    let query = `
  SELECT
    grn.grn_no,
    stocks.item_code,
    stocks.item_description,
    stocks.quantity,
    GROUP_CONCAT(DISTINCT binlocations.binLocation ORDER BY binlocations.binLocation SEPARATOR ', ') AS binLocations,
    stocks.id AS stock_id,
    stocks.item_id
FROM stocks
INNER JOIN grns grn
    ON grn.id = stocks.grn_id
LEFT JOIN gateinpartsbinlocations binlocations
    ON binlocations.stocks_id = stocks.id
WHERE ${outletCondition}
    AND stocks.quantity > 0
    AND stocks.item_id = :item_id
GROUP BY
    stocks.id,
    grn.grn_no,
    stocks.item_code,
    stocks.item_description,
    stocks.quantity,
    stocks.item_id
ORDER BY stocks.createdAt DESC;
    `;

   

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        ...replacements,
        item_id: reqData.id
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; // Return an empty array or a message indicating no data found
    }
    return result;
  } catch (err) {
    logger.error('old binlocations fetching error', err);
  }
};

const UpdateBinLocations= async (body, user) => {
  try {
    let data = [];
    let OldStockIds=[]
    console.log(body,"body")
    for (let item of body) {
     let dataobj={
      binLocation: item.binLocation,
      quantity: item.quantity,
      stocks_id: item.stock_id,
      item_id: item.item_id,
      item_code: item.item_code,
     }
     if(item.stock_id){
     OldStockIds.push(item.stock_id)
     }
    data.push(dataobj)
  }
  let deletedbin=  await GateinBinLocation.destroy({
      where: {
        stocks_id: {
          [Op.in]: OldStockIds
        }
      }
    });
  let result = await GateinBinLocation.bulkCreate(data);
return result
}
  catch (err) {
    logger.error('Update Bin Locations error', err);
  }
}

const GrnService = {
  CreateGrn, CreateGrnParts, CreateGrnStocks,CreateOracleGrnParts,CreateOracleGrnStocks, CreateGrnDocument, GetGrnDocuments, getGrnDetailsWithGrandTotal,
  generategrnpdf, getGrnDetailsForReturn, CreatePurchaseReturn, CreatePurchaseReturnParts, Updatestock,
  getPurchaseReturnDetailsWithGrandTotal, getQuickitemSearch, getPartsForCounterSale, getPurchaseReport, getPurchaseAxaptaReport,
  getStockTransferInwardReport, getSalesReport, getCounterSalesReport, getCounterSaleReturnData, getPurchaseReturnReport,stockadjustmentsearch,
  CreateStockAdjustment,CreateStockAdjustmentParts,getSpareSalesAxapta,CreateNegStockAdjustment,getAPreport,getReceiptreport,CreateNegStockAdjustmentParts,
  CreateNegStockAdjLog,NegAdjUpdatestock,getPODetails,GetStockAdjustment,getPOReturnDetails,getPoDetailsById,getVendor,getPOReturn,getGrnPartsByGrnId,getCocofocoBranch,getStockPositionReport,getStockAdjustmentReport,
  BulkCreateGateeinBinLocation,BulkCreateGrn,getItemFinder,getPurchaseDetails,getSalesDetails,getStockTransferParts,CreateGrnStocksForDirectGrn,
  CreateGrnStocksFOrGatein,GetInventoryStockForGMS,dashboardPurchaseFromMytvs,getZohoBillReport,getKitaraAPReport,BulkCreatePartsAndStocks,CreateGrnForOldDms,CreateGrnStocksForOldDms,
  CreateStockAdjustmentPartsForOlddms,CreateStockAdjustmentForOlddms,GetZohoApReport,oldDmsDashboardPurcasheFromMytvs,getOldBinLocations,UpdateBinLocations
}
export default GrnService;
