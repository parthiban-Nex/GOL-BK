import db from '../../index.js';
import logger from '../../../config/logger.js';

import {Op,literal, where} from "sequelize"
import { raw } from 'mysql2';
import { Storage } from '@google-cloud/storage';

const PurchaseOrder=db.purchaseOrder;
const PurchaseOrderParts=db.purchaseOrderParts;
const vendor=db.vendors
const makes=db.makes
const models=db.models
const itemcategories=db.itemcategories
const generatePONo = async (outletCode,outletid) => {
   const prefix="ASP"
  // Get the last GRN with the same document type
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  console.log(financialYear, 'financialYear');
  const lastGrn = await PurchaseOrder.findOne({
    where: {  outlet_id: outletid ,
      po_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`}
    },
    order: [['id', 'DESC']],
  });

  let newGrnNo = 1;
  console.log(lastGrn, 'lastgrn');
  if (lastGrn) {
    const lastGrnNo = lastGrn?.dataValues?.po_number?.split('-')[2];
    newGrnNo = parseInt(lastGrnNo, 10) + 1;
  }

  const paddedGrnNo = String(newGrnNo).padStart(6, '0');
  //get financial year apr to march
  
  return `${prefix}-${outletCode}${financialYear}-${paddedGrnNo}`;
};
const CreatePO = async (body, user) => {
  console.log(body, 'body');
  const grnNo = await generatePONo(
    user.outlet.outletCode,
    user.outlet.id
  );
  console.log(grnNo, 'grnno');
  body.createdBy = user.id;
  body.modifiedBy = user.id;
  body.outlet_id = user.outlet.id;
  body.po_number = grnNo;
  let data = {};
  try {
    data = PurchaseOrder.create(body);
  } catch (err) {
    logger.error('New PO error', err);
  }

  return data;
};

const CreatePOParts = async (body, po) => {
  console.log(body, 'poparts');

  let data = {};
  const addpoid = body.map((item) => ({
    ...item,
    po_id: po['dataValues']['id'],
  }));
  try {
    data = PurchaseOrderParts.bulkCreate(addpoid);
  } catch (err) {
    logger.error('New PO Parts error', err);
  }

  return data;
};

const CreatePOPartsForEditing = async (body) => {
  console.log(body, 'poparts');

  let data = {};
  
  try {
    data = PurchaseOrderParts.bulkCreate(body);
  } catch (err) {
    logger.error('New PO Parts error', err);
  }

  return data;
};


const getPO = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { po_number: { [Op.like]: `%${searchKey}%` } },
          { vendor_code: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      const userCondition = {outlet_id:user.outlet.id};
     

      const PODetails = await PurchaseOrder.findAll({
        where: { ...searchCondition, ...userCondition },
        
          attributes: [
              'id',
              'po_number',
              'vendor_code',
              "valid_till_date",
              "status",
              // [
              //   db.Sequelize.literal(`(
              //     SELECT SUM(grnparts.total)
              //     FROM grnparts
              //     WHERE grnparts.grn_id = grn.id
              //   )`),
              //   'grand_total', // Calculate grand total using a subquery
              // ],
              

          ],
          // include: [
          //     {
          //         model: GrnParts,
          //         attributes: [],  // No need to fetch individual part details, just summing total
          //         as:"grnparts"
          //     }
          // ],
          // group: ['grn.id'],
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
let count=await PurchaseOrder.count({where:{outlet_id:user.outlet.id}})
    return {PODetails,count};
  } catch (err) {
    logger.error(' PO fetching error', err);
  }
};

const generatePOPdf = async (body, user) => {
  try {
    let PODetails = await PurchaseOrder.findAll({
      where: { id: body.id },
      attributes: [
        'po_number',
        'vendor_code',
        'createdAt',
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.quantity), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_quantity',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.cost), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_rate',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.discount), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_discount',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((po_parts.cost) * (po_parts.sgst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_sgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((po_parts.cost) * (po_parts.cgst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_cgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
              
                  ((po_parts.cost) * (po_parts.igst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_igst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   po_parts.total
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'pdf_total',
          ],
        ],
        include: [
          {
            model: PurchaseOrderParts,
            attributes: [
              'item_code',
              'item_description',
              "hsncode",
              "jc_no",
              'quantity',
              'cost',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "total",
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (po_parts.cost * po_parts.sgst) / 100
                    , 2
                  )
                )`),
                'sgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (po_parts.cost * po_parts.cgst) / 100
                    , 2
                  )
                )`),
                'cgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                     (po_parts.cost * po_parts.igst) / 100
                    , 2
                  )
                )`),
                'igst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                    
                       po_parts.quantity * (po_parts.cost-po_parts.discount) 
                    , 2
                  )
                )`),
                'totalafterdisc',
              ],
            ],
            as: 'po_parts',
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
            "gstin"
          ],
          as: 'povendormap',
        },
      ],
      group: ['purchaseorder.id', 'po_parts.id', 'povendormap.id'],
    });

    return PODetails;
  } catch (err) {
    logger.error('PO pdf fetching error', err);
  }
};

const getPOReport = async (reqData, user) => {
  try {
    const {  fromDate, toDate } = reqData;
 let outletCondition = "po.outlet_id = :outlet_id";
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
        outletCondition = `po.outlet_id IN (:outlet_ids)`;
        replacements.outlet_ids = outletIds;
      } else {
        return []; // No matching outlets found
      }
    } else {
      replacements.outlet_id = user.outlet.id;
    }
    // Build base query
    let query = `
      SELECT po.po_number, po.status,po.vendor_code,po.createdAt, 
             po_parts.item_code, po_parts.item_description, po_parts.rate,po_parts.cost,
             po_parts.mrp,po_parts.quantity,po_parts.discount,po_parts.cgst,po_parts.sgst,po_parts.igst,
             po_parts.vin_number,po_parts.reg_no,po_parts.jc_no,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName,
             grns.grn_no,grns.createdAt AS grn_date, grns.invoice_date,
             po_parts.quantity AS po_quantity,
            COALESCE(grn_sum.total_grn_qty, 0) AS grn_quantity,
            (
                po_parts.quantity 
                - COALESCE(grn_sum.total_grn_qty, 0)
            ) AS back_order_quantity,
             COALESCE(stocks.quantity, 0) AS stock_quantity
      FROM purchaseorders AS po
      LEFT JOIN po_parts AS po_parts ON po_parts.po_id = po.id
      LEFT JOIN vendors As vendors ON vendors.id=po.vendor_id
      LEFT JOIN items as items ON po_parts.item_id=items.id
      LEFT JOIN uom as uom ON items.uomId=uom.id
      LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
      LEFT JOIN aggregates as aggregates ON items.aggregateId=aggregates.id
      LEFT JOIN subaggregates as subaggregates ON items.subaggregateId=subaggregates.id
      LEFT JOIN makes as makes ON items.makeId=makes.id
      LEFT JOIN models as models ON items.modelId=models.id
      LEFT JOIN stocks AS stocks ON stocks.item_code = po_parts.item_code AND stocks.outlet_id = po.outlet_id
      LEFT JOIN grnparts AS grnparts ON grnparts.poparts_id = po_parts.id
      LEFT JOIN grns AS grns ON grns.id = grnparts.grn_id
      LEFT JOIN (
    SELECT 
        poparts_id,
        SUM(quantity) AS total_grn_qty
    FROM grnparts
    GROUP BY poparts_id
) AS grn_sum 
    ON grn_sum.poparts_id = po_parts.id

    
      WHERE ${outletCondition}
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND po.createdAt BETWEEN :fromDate AND :toDate
      `;
    }

   

    // Add the order by clause
    query += `
      ORDER BY po.createdAt DESC
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

const getPOForApprove = async (reqData,user) => { 
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { po_number: { [Op.like]: `%${searchKey}%` } },
          { vendor_code: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      let combinedCondition = {};
      if (user.reportAccess == 1){ 
                  combinedCondition = {
                      ...searchCondition, outlet_id: {
                          [Op.in]: literal(
                              `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                          )
                      },
                      status:{[Op.notIn]:[4,5,2]}
                     
                  };
              }
              else {
                  combinedCondition = {
                      ...searchCondition, 
                      outlet_id: user.outlet.id,
                      
                  };
              }
     
console.log(combinedCondition,"combinedCondition")
      const PODetails = await PurchaseOrder.findAll({
        where: combinedCondition ,
        
          attributes: [
              'id',
              'po_number',
              'vendor_code',
              "valid_till_date",
              "status",
          ],
          
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

    });
  let countcondition={}
    if (user.reportAccess == 1){ 
      countcondition = {
           outlet_id: {
              [Op.in]: literal(
                  `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
              )
          },
          status:{[Op.notIn]:[4,5,2]}
      };
  }
  else {
      countcondition = {
          outlet_id: user.outlet.id,
    
      };
  }
let count=await PurchaseOrder.count({where:countcondition})
    return {PODetails,count};
  } catch (err) {
    logger.error(' PO fetching error', err);
  }
};

const getPoDetailForApprove = async (body, user) => {
  try {
    let PODetails = await PurchaseOrder.findAll({
      where: { id: body.id },
      attributes: [
        'po_number',
        'vendor_code',
        'createdAt',
        "valid_till_date",
        "status",
        "invoice_pdf_url",
        "invoice_pdf_signin_url",
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.quantity), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_quantity',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.rate), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_rate',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(po_parts.discount), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_discount',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((po_parts.rate) * (po_parts.sgst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_sgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((po_parts.rate) * (po_parts.cgst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_cgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
              
                  ((po_parts.rate) * (po_parts.igst)) / 100
                
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'total_igst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   po_parts.total
              ), 2)
              FROM po_parts
              WHERE po_parts.po_id = purchaseorder.id
            )`),
            'pdf_total',
          ],
        ],
        include: [
          {
            model: PurchaseOrderParts,
            attributes: [
              "id",
              'item_code',
              'item_description',
              "hsncode",
              "jc_no",
              'quantity',
              'rate',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "total",
              "vin_number",
              "reg_no",
              "cost",
              "mrp",
              "remarks",
              "status",

              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (po_parts.rate * po_parts.sgst) / 100
                    , 2
                  )
                )`),
                'sgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (po_parts.rate * po_parts.cgst) / 100
                    , 2
                  )
                )`),
                'cgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                     (po_parts.rate * po_parts.igst) / 100
                    , 2
                  )
                )`),
                'igst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                    
                       po_parts.quantity * (po_parts.rate-po_parts.discount) 
                    , 2
                  )
                )`),
                'totalafterdisc',
              ],
            ],
            as: 'po_parts',
            // need only poparts where status not equal to 2
            where:{status:{
              [Op.or]: [
                { [Op.notIn]: [1,2] }, // Not equal to 'value'
                { [Op.is]: null },    // Or column is NULL
              ],
            }},
            include:[
              {
                model:makes,
                attributes:["makeName"],
                as:"pomakemap"
              },
              {
                model:models,
                attributes:["modelName"],
                as:"pomodelmap"
              },
              {
                model:itemcategories,
                attributes:["itemCategorie"],
                as:"poitemcategorymap"
              }

            ]
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
            "gstin",
            "vendorName"
          ],
          as: 'povendormap',
        },
      ],
      group: ['purchaseorder.id', 'po_parts.id', 'povendormap.id'],
      
    });
     console.log(PODetails,"po details")
     
     if(PODetails.length>0 && PODetails[0].invoice_pdf_url){
   const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
 const normalUrl = PODetails[0]?.invoice_pdf_url;
const signingUrl = PODetails[0]?.invoice_pdf_signin_url;
      // check if signed url already exists and not expired
      let isSignedUrlValid =
         signingUrl&&
        signingUrl.includes('Expires=');
      if (isSignedUrlValid) {
        const expiresPart = signingUrl.split('Expires=')[1];

        const expiresTimestamp = parseInt(expiresPart.split('&')[0]) * 1000; // Convert to milliseconds
        if (Date.now() < expiresTimestamp) {
          
        }
        else {
           const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL

              }
            
            }
            else{
               const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL
            }
          }

    return PODetails;
  } catch (err) {
    logger.error('PO pdf fetching error', err);
  }
};

const ApprovePO = async (body, user) => {
 
  
  let data = {};

  try {
    await PurchaseOrder.update({status:body.status,modifiedBy:user.id},{where:{id:body.id}});
    //find the updated row

    data=await PurchaseOrder.findOne({where:{id:body.id}})
  } catch (err) {
    logger.error('New PO error', err);
  }

  return data;
};

const UpdatePOParts = async (body) => {

  let data = [];
  
  try {
    //for of to update every row and pushed the updated row to data
    for (const item of body) {
      await PurchaseOrderParts.update({status:item.status},{where:{id:item.id}});
      //find the updated row
      let row=await PurchaseOrderParts.findOne({where:{id:item.id}})
      data.push(row)
    }
  } catch (err) {
    logger.error('New PO Parts error', err);
  }
  return data;
};

const getPoforGrn = async (body, user) => {
  try {
    let PODetails = await PurchaseOrder.findAll({
      where: { id: body.id },
      attributes: [
        'vendor_code',
        'vendor_id',
        'invoice_pdf_url',
        'invoice_pdf_signin_url',

        ],
        include: [
          {
            model: PurchaseOrderParts,
            attributes: [
              "id",
              "item_id",
              'item_code',
              'item_description',
              "hsncode",
              "jc_no",
              "back_order_quantity",
              'quantity',
              'rate',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "vin_number",
              "reg_no",
              "cost",
              "mrp",
              "remarks",
              "status",
            ],
            where:{status:1},
            as: 'po_parts',
            // include:[
            //   {
            //     model:makes,
            //     attributes:["makeName"],
            //     as:"pomakemap"
            //   },
            //   {
            //     model:models,
            //     attributes:["modelName"],
            //     as:"pomodelmap"
            //   },
            //   {
            //     model:itemcategories,
            //     attributes:["itemCategorie"],
            //     as:"poitemcategorymap"
            //   }

            // ]
          },

        
      ],
      group: ['purchaseorder.id', 'po_parts.id'],
      
    });

    return PODetails;
if(PODetails.length>0 && PODetails[0].invoice_pdf_url){
   const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
 const normalUrl = PODetails[0]?.invoice_pdf_url;
const signingUrl = PODetails[0]?.invoice_pdf_signin_url;
      // check if signed url already exists and not expired
      let isSignedUrlValid =
         signingUrl&&
        signingUrl.includes('Expires=');
      if (isSignedUrlValid) {
        const expiresPart = signingUrl.split('Expires=')[1];

        const expiresTimestamp = parseInt(expiresPart.split('&')[0]) * 1000; // Convert to milliseconds
        if (Date.now() < expiresTimestamp) {
          
        }
        else {
           const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL

              }
            
            }
            else{
               const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL
            }
          }

  } catch (err) {
    logger.error('PO Data fetching error', err);
  }
};

const updatePOStatus=async (id,user)=>{
  try {
    //find all poparts with the given po id and update the status to 5
    const poparts=await PurchaseOrderParts.findAll({where:{po_id:id}})
    //if all poparts status is 2 then update the po status to 5 else 6
    let status=poparts.every((item)=>item.status===2)?5:6
    await PurchaseOrder.update({status:status,modifiedBy:user.id},{where:{id:id}})
    let data=await PurchaseOrder.findOne({where:{id:id}})
    return data;
  }
  catch(err){
    logger.error('PO status update error', err);
  }
}

const updatePOPartsStatus=async (poparts,user)=>{
  try {
    let data=[]
    console.log(poparts, 'poparts');
    for (const item of poparts) {
      const status=item.back_order_quantity<=0 ? 2 :1
      const backorderquantiy=item.back_order_quantity
      await PurchaseOrderParts.update({status:status,back_order_quantity:backorderquantiy},{where:{id:item.poparts_id}});
      let res=await PurchaseOrderParts.findOne({where:{id:item.poparts_id}})
      data.push(res)
    }
    return data;
  }
  catch(err){
    logger.error('PO parts status update error', err);
  }
}

const getPoforEditing= async (id, user) => {
  try {
   let query=`SELECT 
  po.id,
  po.po_number,
  po.vendor_code,
  po.valid_till_date,
  po.vendor_id,
  po.createdAt,
  po.invoice_pdf_url,
  po.invoice_pdf_signin_url,

  vendors.vendorName,
  vendors.gstin,
  vendors.city,
  vendors.state,
  vendors.pincode,
  vendors.address1,
  vendors.address2,
(
    SELECT JSON_ARRAYAGG(vigm.itemGroupCode)
    FROM vendoritemgroupmaps vigm
    WHERE vigm.vendorId = vendors.id
  ) AS itemGroupCodes,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', po_parts.id,
      'itemid', po_parts.item_id,
      'Parts Code', po_parts.item_code,
      'Description', po_parts.item_description,
      'HSN Code', po_parts.hsncode,
      'Quantity', po_parts.quantity,
      'Rate', po_parts.rate,
      'Discount Amount', po_parts.discount,
      'CGST', po_parts.cgst,
      'SGST', po_parts.sgst,
      'IGST', po_parts.igst,
      'Cost', po_parts.cost,
      'MRP', po_parts.mrp,
      'remarks', po_parts.remarks,
      "Vin Number", po_parts.vin_number,
      "Reg No", po_parts.reg_no,
      "Total Amount" ,po_parts.total,
"Margin %",
CASE 
  WHEN po_parts.cost > 0 
  THEN ROUND(((po_parts.rate - po_parts.cost - po_parts.discount) / po_parts.cost) * 100, 2)
  ELSE 0 
END,
       "Make", makes.makeName,
    "Model", models.modelName,
    "Parts Category", itemcategories.itemCategorie,
    "Make_Id" ,makes.id,
    "Model_Id",models.id,
    "Parts_Category_Id",itemcategories.id
    )
  ) AS po_parts

FROM purchaseorders AS po
LEFT JOIN po_parts 
  ON po_parts.po_id = po.id
  AND (
    po_parts.status NOT IN (1, 2)
    OR po_parts.status IS NULL
  )
LEFT JOIN makes ON makes.id = po_parts.make_id
LEFT JOIN models ON models.id = po_parts.model_id
LEFT JOIN itemcategories ON itemcategories.id = po_parts.part_category_id
LEFT JOIN vendors ON vendors.id = po.vendor_id
WHERE po.id = :id

GROUP BY po.id`


    let PODetails = await db.sequelize.query(query, {
      replacements: { id },
      type: db.Sequelize.QueryTypes.SELECT,
    });
if(PODetails.length>0 && PODetails[0].invoice_pdf_url){
   const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
 const normalUrl = PODetails[0]?.invoice_pdf_url;
const signingUrl = PODetails[0]?.invoice_pdf_signin_url;
      // check if signed url already exists and not expired
      let isSignedUrlValid =
         signingUrl&&
        signingUrl.includes('Expires=');
      if (isSignedUrlValid) {
        const expiresPart = signingUrl.split('Expires=')[1];

        const expiresTimestamp = parseInt(expiresPart.split('&')[0]) * 1000; // Convert to milliseconds
        if (Date.now() < expiresTimestamp) {
          
        }
        else {
           const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL

              }
            
            }
            else{
               const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL
            }
          }

    return PODetails;
  } catch (err) {
    logger.error('PO Data fetching error', err);
  }
};

const UpdatePO = async (body, user) => {
  
  let data = {};
  try {
    data = PurchaseOrder.update(body, { where: { id: body.id } });
  } catch (err) {
    logger.error('New PO error', err);
  }

  return data;
};

const DeletePoParts=async (id)=>{
  try {
    await PurchaseOrderParts.destroy({where:{po_id:id,status:{
              [Op.or]: [
                { [Op.notIn]: [1,2] }, // Not equal to 'value'
                { [Op.is]: null },    // Or column is NULL
              ],
            }}})
  }
  catch(err){
    logger.error('PO parts deletion error', err);
  }
}

const getPoforView= async (id, user) => {
  try {
   let query=`SELECT 
  po.id,
  po.po_number,
  po.vendor_code,
  po.valid_till_date,
  po.vendor_id,
  po.createdAt,
  po.invoice_pdf_url,
  po.invoice_pdf_signin_url,

  vendors.vendorName,
  vendors.gstin,
  vendors.city,
  vendors.state,
  vendors.pincode,
  vendors.address1,
  vendors.address2,
(
    SELECT JSON_ARRAYAGG(vigm.itemGroupCode)
    FROM vendoritemgroupmaps vigm
    WHERE vigm.vendorId = vendors.id
  ) AS itemGroupCodes,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', po_parts.id,
      'itemid', po_parts.item_id,
      'Parts Code', po_parts.item_code,
      'Description', po_parts.item_description,
      'HSN Code', po_parts.hsncode,
      'Quantity', po_parts.quantity,
      'Rate', po_parts.rate,
      'Discount Amount', po_parts.discount,
      'CGST', po_parts.cgst,
      'SGST', po_parts.sgst,
      'IGST', po_parts.igst,
      'Cost', po_parts.cost,
      'MRP', po_parts.mrp,
      'remarks', po_parts.remarks,
      "Vin Number", po_parts.vin_number,
      "Reg No", po_parts.reg_no,
      "Total Amount" ,po_parts.total,
"Margin %",
CASE 
  WHEN po_parts.cost > 0 
  THEN ROUND(((po_parts.rate - po_parts.cost - po_parts.discount) / po_parts.cost) * 100, 2)
  ELSE 0 
END,
       "Make", makes.makeName,
    "Model", models.modelName,
    "Parts Category", itemcategories.itemCategorie,
    "Make_Id" ,makes.id,
    "Model_Id",models.id,
    "Parts_Category_Id",itemcategories.id
    )
  ) AS po_parts

FROM purchaseorders AS po
INNER JOIN po_parts ON po_parts.po_id = po.id
LEFT JOIN makes ON makes.id = po_parts.make_id
LEFT JOIN models ON models.id = po_parts.model_id
LEFT JOIN itemcategories ON itemcategories.id = po_parts.part_category_id
LEFT JOIN vendors ON vendors.id = po.vendor_id
WHERE po.id = :id

GROUP BY po.id`


    let PODetails = await db.sequelize.query(query, {
      replacements: { id },
      type: db.Sequelize.QueryTypes.SELECT,
    });
if(PODetails.length>0 && PODetails[0].invoice_pdf_url){
   const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
 const normalUrl = PODetails[0]?.invoice_pdf_url;
const signingUrl = PODetails[0]?.invoice_pdf_signin_url;
      // check if signed url already exists and not expired
      let isSignedUrlValid =
         signingUrl&&
        signingUrl.includes('Expires=');
      if (isSignedUrlValid) {
        const expiresPart = signingUrl.split('Expires=')[1];

        const expiresTimestamp = parseInt(expiresPart.split('&')[0]) * 1000; // Convert to milliseconds
        if (Date.now() < expiresTimestamp) {
          
        }
        else {
           const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL

              }
            
            }
            else{
               const filePath = normalUrl.split(`${bucketName}/`)[1];

      const file = bucket.file(filePath);
      // Generate signed URL for 1 year
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      // Update the signed URL in the database
      await PurchaseOrder.update({ invoice_pdf_signin_url: signedUrl }, { where: { id } });
      PODetails[0].invoice_pdf_signin_url = signedUrl; // Update the response with the new signed URL
            }
          }

    return PODetails;
  } catch (err) {
    logger.error('PO Data fetching error', err);
  }
};

const POService={
    CreatePO,CreatePOParts,getPO,
    generatePOPdf,getPOReport,getPOForApprove,getPoDetailForApprove,ApprovePO,UpdatePOParts,getPoforGrn,
    updatePOStatus,updatePOPartsStatus,getPoforEditing,UpdatePO,CreatePOPartsForEditing,DeletePoParts,
    getPoforView
}
  export default POService;
