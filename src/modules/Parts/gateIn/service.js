import db from '../../index.js';
import logger from '../../../config/logger.js';

import {Op} from "sequelize"
const Grn=db.grns
const GrnParts=db.grnparts
const vendor=db.vendors
const GateIn=db.gateIn
const GateInParts=db.gateInParts
const GateinBinLocation=db.gateinbinlocation
const generateGateinNo = async (documentType,outletCode,outletid) => {
  const prefix = documentType.split('(')[0].trim();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  // Get the last GRN with the same document type
  const lastGrn = await GateIn.findOne({
    where: { gatein_no:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`},
      outlet_id: outletid },
    order: [['createdAt', 'DESC']],
  });

  let newGrnNo = 1;
  console.log(lastGrn, 'lastgrn');
  if (lastGrn) {
    const lastGrnNo = lastGrn?.dataValues?.gatein_no?.split('-')[2];
    newGrnNo = parseInt(lastGrnNo, 10) + 1;
  }

  const paddedGrnNo = String(newGrnNo).padStart(6, '0');
  return `${prefix}-${outletCode}${financialYear}-${paddedGrnNo}`;
};
const CreateGatein = async (body, user) => {
  const document_type = body.document_type;
  const gatein_no = await generateGateinNo(
    document_type,
    user.outlet.outletCode,
    user.outlet.id
  );
  console.log(gatein_no, 'gateinno');
  body.createdBy = user.id;
  body.modifiedBy=user.id
  body.outlet_id = user.outlet.id;
  body.gatein_no = gatein_no;
  let data = {};
  try {
    data = GateIn.create(body);
  } catch (err) {
    logger.error('New Grn error', err);
  }

  return data;
};

const CreateGateinParts = async (body, gatein,oracle_id,erp_id,user) => {

  let data = {};
  
  let gateinpart=[]
  for(let item of body){
   let reqobj={
    ...item,
    gatein_id: gatein['dataValues']['id'],
   }
   if(oracle_id){
       
    let finditem=await db.items.findOne({where:{[Op.or]:[{itemCode:item.item_code}]}})
    if(finditem && finditem?.id){
      reqobj.item_id=finditem.id
    }
    else{
      let findhsn
       findhsn= await db.hsns.findOne({where:{hsnCode:item.hsnCode}})
      if(!findhsn){
         findhsn=await db.hsns.create({
          hsnCode:item.hsnCode,
          tax:item.cgst+item.sgst+item.igst,
          createdBy:user.id,
          updatedBy:user.id,
        })
      }
      const newitem=await db.items.create({
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
   if(erp_id){
       console.log('item-------------------------------',item)
    let finditem=await db.items.findOne({where:{[Op.or]:[{itemCode:item.item_code}]}})
    if(finditem && finditem?.id){
      reqobj.item_id=finditem.id
    }
    else{
      let findhsn
       findhsn= await db.hsns.findOne({where:{hsnCode:item.hsnCode}})
      if(!findhsn){
         findhsn=await db.hsns.create({
          hsnCode:item.hsnCode,
          tax:item.cgst+item.sgst+item.igst,
          createdBy:user.id,
          updatedBy:user.id,
        })
      }
      const newitem=await db.items.create({
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

   gateinpart.push(reqobj)
  }
  try {
    data = await GateInParts.bulkCreate(gateinpart);
  } catch (err) {
    logger.error('New Grn Parts error', err);
  }

  return data;
};


const getGateIn = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { gatein_no: { [Op.like]: `%${searchKey}%` } },
          { invoice_number: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      const userCondition = {outlet_id:user.outlet.id};
     

      const grnDetails = await GateIn.findAll({
        where: { ...searchCondition, ...userCondition },
        
          attributes: [
              'id',
              'gatein_no',
              'invoice_number',
              'invoice_date',
              'vendor_code',
              'vendor_id',
              'status',
          ],
          
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
let count=await GateIn.count({where:{outlet_id:user.outlet.id}})
    return {grnDetails,count};
  } catch (err) {
    logger.error(' Grn fetching error', err);
  }
};


const getGateinforGrn = async (body, user) => {
  try {
    let PODetails = await GateIn.findAll({
      where: { id: body.id },
      attributes: [
        "id",
        'vendor_code',
        'vendor_id',
        "document_type",
        "gatein_date_time",
        "grand_total",
        "invoice_number",
        "invoice_date",
        "invoice_amount",
        "po_id",
        "vendor_id",
        "vendor_code",
        "e_sugam_no",
        "lr_number",
        "lr_date",
        "transport_name",
        "frieght_charges",
        "mis_charges",
        "status",
        "oracle_stocktransfer_id",
        "erp_stock_transfer_id",
        ],
        include: [
          {
            model: GateInParts,
            attributes: [
              "id",
              "poparts_id",
              "item_id",
              'item_code',
              'item_description',
              'quantity',
              'rate',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "cost",
              "mrp",
              "total",
              "oracle_stocktransferparts_id",
              "erp_stocktransferparts_id",
            ],
            as: 'gateinparts',
           
          },

        
      ],
      group: ['gatein.id', 'gateinparts.id'],
      
    });

    return PODetails;
  } catch (err) {
    logger.error('Gate in For Grn fetching error', err);
  }
};

const updateGatein=async (id,gateindata,user)=>{
  try {
   
    await GateIn.update({...gateindata,modifiedBy:user.id},{where:{id:id}})
    let data=await GateIn.findOne({where:{id:id}})
    return data;
  }
  catch(err){
    logger.error('Gatein status update error', err);
  }
}

const CreateGateeinBinLocation = async (body) => {
 console.log(body,"bin")
 
  let data = {};
  try {
    data = GateinBinLocation.bulkCreate(body);
  } catch (err) {
    logger.error('New Grn error', err);
  }

  return data;
};
const UpdateGateinBinLocation = async (body) => {
  
   let data = [];
   try {
    for (const element of body) {
      await GateinBinLocation.update({grn_parts_id:element.id},{where:{gatein_parts_id:element.gateinparts_id}})
      //find and push it to data
      let binlocation=await GateinBinLocation.findOne({where:{gatein_parts_id:element.gateinparts_id}})
      console.log(binlocation,"binlocation")
      data.push(binlocation.dataValues)
    };
   } catch (err) {
     logger.error('New Grn error', err);
   }
 
   return data;
 };

 const getGateinReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;

    // Build base query
    let query = `
      SELECT gateins.gatein_no, gateins.invoice_number,gateins.invoice_date, gateins.gatein_date_time,gateins.vendor_code,gateins.status,
             gateinparts.item_code, gateinparts.item_description, gateinparts.rate,gateinparts.cost,
             gateinparts.mrp,gateinparts.quantity,gateinparts.discount,gateinparts.cgst,gateinparts.sgst,gateinparts.igst,
             vendors.vendorName,vendors.gstin,vendors.city,items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
      FROM gateins AS gateins
      LEFT JOIN gateinparts AS gateinparts ON gateinparts.gatein_id = gateins.id
      LEFT JOIN vendors As vendors ON vendors.id=gateins.vendor_id
      LEFT JOIN items as items ON gateinparts.item_id=items.id
      LEFT JOIN uom as uom ON items.uomId=uom.id
      LEFT JOIN itemcategories as itemcategories ON items.itemcategoryId=itemcategories.id
      LEFT JOIN aggregates as aggregates ON items.aggregateId=aggregates.id
      LEFT JOIN subaggregates as subaggregates ON items.subaggregateId=subaggregates.id
      LEFT JOIN makes as makes ON items.makeId=makes.id
      LEFT JOIN models as models ON items.modelId=models.id

    
      WHERE gateins.outlet_id = :outlet_id
    `;

    // Append date condition if both fromDate and toDate are provided
    if (fromDate && toDate) {
      query += `
        AND gateins.createdAt BETWEEN :fromDate AND :toDate
      `;
    }



    // Add the order by clause
    query += `
      ORDER BY gateins.createdAt DESC
    `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
        outlet_id: user.outlet.id,
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

const GateinService={
    CreateGatein,CreateGateinParts,getGateIn,getGateinforGrn,updateGatein,
    CreateGateeinBinLocation,UpdateGateinBinLocation,getGateinReport
}
  export default GateinService;
