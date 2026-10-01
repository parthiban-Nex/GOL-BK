import db from '../../index.js'
import logger from '../../../config/logger.js';
import { Op, where,fn,col,literal } from 'sequelize';
import encryptConfig from '../../../config/encrypt.js';


const PartsReturn=db.partsReturn
const Stocks=db.stocks
const Stockslog=db.stockLog
const StockReturnlog=db.stockReturnLog
const PartIntent=db.partsIndent
const PartIssue=db.partsIssue


const GetPartIssue = async (body) => {
  let data={};
  try{
    data=await PartIntent.findAll({

       where:{
        transaction_id:body.id,
        received_quantity: {
        [Op.ne]: null, // Not null
        [Op.gt]: 0 
       }
      },
        include: [
        {
            model: PartIssue, as: "partissuemap",
            order: [['createdAt', 'DESC']], // Assuming 'createdAt' is the timestamp column
          limit: 1
            
        }],
        attributes:['id'],
      
      })
  }catch(err){
      logger.error("New part issue error",err)
  }
   console.log(data,"databbb")
  return data;
}

  const CreatePartReturn = async (body,user) => {
   const bodydata=body.map((item)=>(
    {...item,outlet_id:user.outlet.id,createdBy:user.id}
  ))
   
    let data={};
    try{
      data= PartsReturn.bulkCreate(bodydata)
    }catch(err){
        logger.error("New partreturn error",err)
    }
     
    return data;
}

const Updatestock = async (items) => {
  try {
    const results = [];
console.log(items,"items")
    // Iterate through the array of items
    for (const item of items) {
      const itemId = item.part_issue_id;

      // Fetch stocks related to the item_id
      const stocks = await Stockslog.findOne({
        where: { issue_id: itemId },
      });


          const [affectedCount]=await Stocks.update(
            {
              quantity: db.Sequelize.literal(`quantity + ${item.quantity}`),
            },      {
              where: {
                id: stocks.stock_id,
              },
            })
    
       
          const updatedData = {
          stock_id: stocks.stock_id,
          quantity: item.quantity,
          issue_id:item.part_issue_id
          }
          results.push(updatedData);
        
      
    }

    return results;
  } catch (error) {
    logger.error('Error reducing stock quantity:', error);
  }
  }

const CreateStockReturnlog = async (body) => {

  let data={};
//   const addgrnid=body.map((item)=>({...item,grn_id:grn["dataValues"]["id"]}))
  try{
    data= StockReturnlog.bulkCreate(body)
  }catch(err){
      logger.error("New stock return log error",err)
  }
   
  return data;
}

const UpdatePartIntent = async (body) => {
  let data=[];
//   const addgrnid=body.map((item)=>({...item,grn_id:grn["dataValues"]["id"]}))
  try{
    for (const item of body) {

    const [affectedCount]=await PartIntent.update(
      {
        received_quantity: db.Sequelize.literal(`received_quantity - ${item.quantity}`),
        return_quantity: item.quantity,
      },      {
        where: {
          id: item.indent_id,
        },
      })
      if (affectedCount > 0) {
        const updatedPart = await PartIntent.findByPk(item.indent_id);
        data.push(updatedPart);
      }
    }
  }catch(err){
      logger.error("New partintent error",err)
  }
   
  return data;

}

const UpdatePartIssue = async (body) => {
  let data=[];
  try{
    for (const item of body) {

      const [affectedCountforpartissue]=await PartIssue.update(
        {
          quantity: db.Sequelize.literal(`quantity - ${item.quantity}`),
        },      {
          where: {
            id: item.part_issue_id,
          },
        })

      
      if(affectedCountforpartissue>0){
        const updatedPart = await PartIssue.findOne({where:{id:item.part_issue_id}});
        data.push(updatedPart);
      }

    }
  }catch(err){
      logger.error("New part issue error",err)
  }
return data
}

const getSaleReturnReport = async (reqData, user) => {
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
             parts_returns.item_code, parts_returns.item_name, parts_returns.rate,parts_returns.cost,parts_returns.mrp,
             parts_returns.quantity,parts_returns.discount,parts_returns.cgst,parts_returns.sgst,parts_returns.igst,
             items.hsnCode,uom.uomType,itemcategories.itemCategorie,
             aggregates.aggregateName,subaggregates.subAggregateName,makes.makeName,models.modelName
      FROM billings AS billings
      LEFT JOIN transactions AS transactions ON billings.transaction_id = transactions.id
      INNER JOIN parts_returns AS parts_returns ON parts_returns.transaction_id = transactions.id 
      LEFT JOIN items as items ON parts_returns.item_id=items.id
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

const PartIssueService={
   GetPartIssue,CreatePartReturn,Updatestock,CreateStockReturnlog,UpdatePartIntent,UpdatePartIssue,getSaleReturnReport
}
  export default PartIssueService;