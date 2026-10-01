import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op,literal, where } from 'sequelize';
import configData from '../../../config/encrypt.js'
const Countersale = db.countersale;
const Countersalepart=db.countersalepart
const Stocks = db.stocks;
const customerDetails = db.customers;
const newCounterSaleUpdate = db.counterSaleUpdate
const CounterSaleReturnUpdate = db.countersalereturnupdates
const counterSaleUpdate = db.counterSaleUpdate
const Stocklog = db.coutersalelog;
const CountersaleReturnPart=db.countersalereturnpart
const CounterSalereturnlog=db.Countersalereturnlog
const CounterSaleReturn=db.countersalereturn
const CounterSaleRequest=db.countersaleRequest
const CounterSaleRequestPart=db.countersaleRequestParts
const outletDetails = db.outlets
const generateCSInvoiceNo = async (documentType,outletCode,outletid) => {
    const prefix = documentType.split('(')[0].trim();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
    // Get the last GRN with the same document type
    const lastno = await Countersale.findOne({
      where: { invoice_number:  {
        [Op.like]: `${prefix}-${outletCode}${financialYear}-%` // Match the current financial year
      }, outlet_id: outletid },
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

  const generateCounterSaleReturnInvoiceNo = async (outletCode,outletid) => {
  const prefix="CSRE"
    // Get the last GRN with the same document type
    const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
    const lastno = await CounterSaleReturn.findOne({
      where: { outlet_id: outletid,
        invoice_number: {
          [Op.like]: `${prefix}-${outletCode}${financialYear}-%` // Match the current financial year
        }
       },
      order: [['createdAt', 'DESC']],
    });
  
    let newNo = 1;
    console.log(lastno, 'lastno');
    if (lastno) {
      const latestno = lastno?.dataValues?.invoice_number?.split('-')[2];
      newNo = parseInt(latestno, 10) + 1;
    }
  
    const paddedNo = String(newNo).padStart(4, '0');
    return `${prefix}-${outletCode}${financialYear}-${paddedNo}`;
  };

const CreateCounterSale = async (body, user) => {
  console.log(body,"body")
    const document_type = body.document_type;
    const invoice_number = await generateCSInvoiceNo(
      document_type,
      user.outlet.outletCode,
      user.outlet.id
    );
  const bodydata = {
    ...body,
    outlet_id: user.outlet.id,
    createdBy: user.id,
    invoice_number:invoice_number
  };

  let data = {};
  try {
    data = Countersale.create(bodydata);
  } catch (err) {
    logger.error('New Countersale error', err);
  }

  return data;
};

const deleteCounterSale = async (id) => {
  try {
      const deletedCount = await Countersale.destroy({
          where: { id: id }
      });

      if (deletedCount == 0) {
          return { success: false, message: "Counter Sale not found" };
      }

      return { success: true, message: "Counter Sale deleted successfully" };
  } catch (error) {
      console.error("Error deleting Counter Sale:", error);
      return { success: false, error: error.message };
  }
};

const deleteCounterSaleReturn = async (id) => {
  try {
      const deletedCount = await CounterSaleReturn.destroy({
          where: { id: id }
      });

      if (deletedCount == 0) {
          return { success: false, message: "Counter Sale Return not found" };
      }

      return { success: true, message: "Counter Sale Return deleted successfully" };
  } catch (error) {
      console.error("Error deleting Counter Sale:", error);
      return { success: false, error: error.message };
  }
};

const CreateCounterSalePart = async (body, user,id) => {
    const bodydata = body.map((item) => ({
      ...item,
      outlet_id: user.outlet.id,
      createdBy: user.id,
      counter_sale_id:id
    }));
  
    let data = {};
    try {
      data = Countersalepart.bulkCreate(bodydata);
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
            countersale_part_id: item.id,
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

const getCounterSale = async (reqData,user) => {
    try {
        // Fetch GRN details with grand total from related GrnParts
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
          [Op.or]: [
            { invoice_number: { [Op.like]: `%${searchKey}%` } },
          ]
        } : {};
        let combinedCondition = {};
        if (user.reportAccess == 1){ 
          const empOutlets = await db.employeeoutletmap.findAll({
            where: { emp_id: user.employeeId },
            attributes: ['outlet_id']
          });
          const outletIds = empOutlets.map(o => o.outlet_id);
          
          combinedCondition = {
            ...searchCondition,
            outlet_id: { [Op.in]: outletIds },
            // status: { [Op.notIn]: [1] }
          };
          
                }
                else {
                    combinedCondition = {
                        ...searchCondition, 
                        outlet_id: user.outlet.id,
                        
                    };
                }
       
  
        const grnDetails = await Countersale.findAll({
          where: combinedCondition,
          
            attributes: [
                'id',
                'customer_code',
                'invoice_number',
                'createdAt',
                // 'customer_code',
                "status",
                "gatepass_status",
                'grand_total'
            ],
            include: [
                {
                  model: CounterSaleReturn,
                  as: 'returns',
                  attributes: ['id'], // Only return the id field
                }
              ],
            order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
            limit,
          offset,
  
        // Group by the GRN to calculate sum correctly for each GRN
      });
      let countcondition={}
    if (user.reportAccess == 1){ 
      countcondition = {
           outlet_id: {
              [Op.in]: literal(
                  `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
              )
          },
          status:{[Op.notIn]:[1]}
      };
  }
  else {
      countcondition = {
          outlet_id: user.outlet.id,
    
      };
  }

      let count=await Countersale.count({where:countcondition})
      return {grnDetails,count};
    } catch (err) {
      logger.error(' Countersale fetching error', err);
    }
  };

  const getCounterSaleSearchData = async (counterSaleNo, user) => { 
    console.log(counterSaleNo,"counterSaleNo")
  // try {
  //   // const data = await JobCardDao.getJobCardData(jobCardNo, user);


  //   return data;
  // } catch (err) {
  //   logger.error('JobCard service getJobCardData Error:', err);
  //   next(err);
  // }

   try {
        let rows = [];
        const searchKey = counterSaleNo;
        const whereCondition = {
            outlet_id: user.outlet.id,
            ...(searchKey && searchKey.length >= 5 ? {
                [Op.or]: [
                    { invoice_number: { [Op.like]: `%${searchKey}%` } }
                ]
            } : {})
        };

        console.log(whereCondition,"whereCondition")
        // if (searchKey.length >= 5) {
        //     rows = await Countersale.findAll({
        //         where: whereCondition,
        //         order: [['id', 'DESC']],
        //         // include: [
        //         //     { model: Billings, as: 'billing',attributes: ['total_amount'], required: false }
        //         //  ]
        //     });

        //     // for (const data of rows) {
        //     //     let billData = await Billings.findAll({
        //     //         where: { transaction_id: data.id }
        //     //     });

        //     //     if (billData.length > 0) {
        //     //         data.dataValues['total_amount'] = billData[0].total_amount ?
        //     //             billData[0].total_amount : "";
        //     //     };
        //     // };

        // } else {
        //     rows = await JobCard.findAll({
        //         where: whereCondition,
        //         order: [['id', 'DESC']]
        //     });
        // };

         rows = await Countersale.findAll({
                where: whereCondition,
                order: [['id', 'DESC']],
                // include: [
                //     { model: Billings, as: 'billing',attributes: ['total_amount'], required: false }
                //  ]
            });

            console.log(rows,"rows countersale data-----------------")
        return rows;
    } catch (err) {
        logger.error("Counter Sale dao getCounterSaleSearchData", err);
        console.log(err)
    }
};

  const generateCounterSalepdf = async (body, user) => {
    try {
      let countersaledetails = await Countersale.findAll({
        where: { id: body.id },
        attributes: [
          'invoice_number',
          'createdAt',
          'customer_code',
          'customer_name',
          'customer_gstin',
          'customer_address',
          'shipping_address',
          'document_type',
          'source',
          'source_type',
          'customer_type',
         
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_parts.quantity), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_quantity',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_parts.rate), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_rate',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_parts.discount), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_discount',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((countersale_parts.rate) * (countersale_parts.sgst)) / 100
                
              ), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_sgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((countersale_parts.rate) * (countersale_parts.cgst)) / 100
                
              ), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_cgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
              
                  ((countersale_parts.rate) * (countersale_parts.igst)) / 100
                
              ), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'total_igst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   countersale_parts.total
              ), 2)
              FROM countersale_parts
              WHERE countersale_parts.counter_sale_id = countersale.id
            )`),
            'pdf_total',
          ],
        ],
        include: [
          {
            model: Countersalepart,
            attributes: [
              'item_code',
              'item_description',
              'quantity',
              'rate',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "total",
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (countersale_parts.rate * countersale_parts.sgst) / 100
                    , 2
                  )
                )`),
                'sgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (countersale_parts.rate * countersale_parts.cgst) / 100
                    , 2
                  )
                )`),
                'cgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                     (countersale_parts.rate * countersale_parts.igst) / 100
                    , 2
                  )
                )`),
                'igst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                    
                       countersale_parts.quantity * (countersale_parts.rate-countersale_parts.discount) 
                    , 2
                  )
                )`),
                'totalafterdisc',
              ],
            ],
            as: 'countersale_parts',
          },
          {
            model:counterSaleUpdate,
            attributes:[
              'id',
              'counter_sale_id',
              'invoice_number',
              'grand_total',
              'bdo_id',
              'invoice_bdoack_no',
              'invoice_bdoack_date',
              'irn_no',
              'qr_code',
              'signed_qr_code'
            ],
            as:"CSupdates",
          }         
        ],
        group: ['countersale.id', 'countersale_parts.id','CSupdates.id'],
      });
  
      return countersaledetails;
    } catch (err) {
      logger.error('Countersale fetching error', err);
    }
  }; 

  const generateCounterSaleReturnpdf = async (body, user) => {
    console.log(body,"body server fetching")
    try {
      let countersaledetails = await CounterSaleReturn.findAll({
        where: { id: body.id },
        attributes: [
          'invoice_number',
          'createdAt',
          'customer_code',
          // 'customer_name',
          // 'customer_gstin', 
          // 'customer_address',
         
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_return_parts.quantity), 2)
              FROM countersale_return_parts
              WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_quantity',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_return_parts.rate), 2)
              FROM countersale_return_parts
              WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_rate',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(countersale_return_parts.discount), 2)
              FROM countersale_return_parts
             WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_discount',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((countersale_return_parts.rate) * (countersale_return_parts.sgst)) / 100
                
              ), 2)
              FROM countersale_return_parts
             WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_sgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   ((countersale_return_parts.rate) * (countersale_return_parts.cgst)) / 100
                
              ), 2)
              FROM countersale_return_parts
             WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_cgst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
              
                  ((countersale_return_parts.rate) * (countersale_return_parts.igst)) / 100
                
              ), 2)
              FROM countersale_return_parts
             WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'total_igst',
          ],
          [
            db.Sequelize.literal(`(
              SELECT ROUND(SUM(
                   countersale_return_parts.total
              ), 2)
              FROM countersale_return_parts
             WHERE countersale_return_parts.countersale_return_id = CounterSaleReturn.id
            )`),
            'pdf_total',
          ],
        ],
        include: [
          {
            model: CountersaleReturnPart,
            attributes: [
              'item_code',
              'item_description',
              'quantity',
              'rate',
              'discount',
              'cgst',
              'sgst',
              'igst',
              "total",
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (countersale_return_parts.rate * countersale_return_parts.sgst) / 100
                    , 2
                  )
                )`),
                'sgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                   
                       (countersale_return_parts.rate * countersale_return_parts.cgst) / 100
                    , 2
                  )
                )`),
                'cgst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                     (countersale_return_parts.rate * countersale_return_parts.igst) / 100
                    , 2
                  )
                )`),
                'igst_amount',
              ],
              [
                db.Sequelize.literal(`(
                  SELECT ROUND(
                    
                       countersale_return_parts.quantity * (countersale_return_parts.rate-countersale_return_parts.discount) 
                    , 2
                  )
                )`),
                'totalafterdisc',
              ],
            ],
            as: 'countersale_return_parts',
          },
          {
            model:CounterSaleReturnUpdate,
            attributes:[
              'id',
              'counter_sale_return_id',
              'invoice_number',
              'grand_total',
              'bdo_id',
              'invoice_bdoack_no',
              'invoice_bdoack_date',
              'irn_no',
              'qr_code',
              'signed_qr_code'
            ],
            as:"CSRupdates",
          }  ,
           {
            model:outletDetails,
            attributes:[
              'id',
              'outletCode',
              'outletName',
              'gstIn',
              'email',
              'phoneNumber',
              'address1',
              'address2',
              'city',
              'state',
              'pinCode'
            ],
            as:"outlet",
          } ,
          {
            model:customerDetails,
            attributes:[
              [
                db.Sequelize.literal(
                  `CAST(AES_DECRYPT(UNHEX(firstName), '${configData.code}') AS CHAR)`
                ),
                'firstName',
              ],
            'id', 
            'customerCode',
           
            'lastName',
            'gstinNumber',
            'address1',
            'address2',
            ],
            as:"customerDetails",
          } 

        ],
        group: ['CounterSaleReturn.id', 'countersale_return_parts.id','CSRupdates.id','outlet.id','customerDetails.id'],
      });
  
      return countersaledetails;
    } catch (err) {
      logger.error('Countersale fetching error', err);
    }
  };

  const getCounterSaleForReturn = async (reqData,user) => {
    try {
        const countersaledetails = await Countersale.findAll({
          where: { id:reqData.id },
          
            attributes: [
                'id',
                'document_type',
                'customer_code',
                 "source",
                 "source_type",
                'customer_type',
                'customer_code',
                'customer_gstin',
                'customer_address',
                'customer_id',
                'invoice_number',
                "outlet_id",
            ],
          include:[
            {
              model:Countersalepart,
              as:"countersale_parts",
              attributes:["id","item_id","item_code","item_description","quantity","rate",
                "cost","mrp","discount","cgst","sgst","igst","return_quantity","hsn_code"],
              // i need to get only where return_quantity is null or return_quantity is less than quantity
              where: {
                [Op.or]: [
                  { return_quantity: null },
                  { return_quantity: { [Op.lt]: db.Sequelize.col('quantity') } },
                ],
              },
          },
          {
            model:outletDetails,
            as:"csoutletmap",
            attributes:["outletCode"]
          }
        ]
  
      });
  
      return countersaledetails;
    } catch (err) {
      logger.error(' CounterSale fetching error', err);
    }
  };
  const getOutletandCompanyDetails = async (outletID) => {
    try{
      const getOutletDetails = await outletDetails.findOne({
        where: { id: outletID },
        attributes: ['id', 'outletCode', 'outletName','gstIn','email','phoneNumber','address1','address2','city','state','pinCode'],
       
        include:[
          {
            model:db.companies,
            as:"company",
            attributes: ['id', 'code', 'name','enable_einvoice'],
            where: {
              status: 1
            }
          }
        ],
       
      });

return getOutletDetails;
    }catch(err){
      logger.error('getOutletandCompanyDetails fetching error', err);

    }
  }
  const CreateCounterSaleReturn = async (counterSale,user) => {
    const invoice_number = await generateCounterSaleReturnInvoiceNo(
      counterSale.outletCode,
      counterSale.outlet_id
    );
    const bodydata={...counterSale,createdBy:user.id,invoice_number:invoice_number}
    console.log(bodydata,"body")
     let data={};
     try{
       data= CounterSaleReturn.create(bodydata)
     }catch(err){
         logger.error("New Countersale return error",err)
     }
      
     return data;
 }
   const CreateCounterSaleReturnParts = async (counterSalePart,user,countersalereturn) => {
   const bodydata=counterSalePart.map((item)=>(
    { ...item,
      outlet_id:countersalereturn["dataValues"]["outlet_id"],
      createdBy:user.id,
      countersale_return_id: countersalereturn['dataValues']['id'],
    }
  ))
    let data={};
    try{
      data= CountersaleReturnPart.bulkCreate(bodydata)
    }catch(err){
        logger.error("New Countersale return error",err)
    }
     
    return data;
}

const UpdatestockAfterReturn = async (items) => {
  try {
    const results = [];
console.log(items,"items")
    // Iterate through the array of items
    for (const item of items) {
      const itemId = item.countersale_part_id;

      // Fetch stocks related to the item_id
      const stocks = await Stocklog.findOne({
        where: { countersale_part_id: itemId },
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
          countersale_part_id:item.countersale_part_id
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
    data= CounterSalereturnlog.bulkCreate(body)
  }catch(err){
      logger.error("New Countersale Return error",err)
  }
   
  return data;
}
const UpdateCounterSalePart = async (body) => {
  let data=[];
  try{
    for (const item of body) {
console.log(item,"item")
//need to add return quantity with item.quantity if return quantity is null add item.quantity with 0 using coalesce
      const [affectedCountforpartissue]=await Countersalepart.update(
        {
          return_quantity: db.Sequelize.literal(`COALESCE(return_quantity,0) + ${item.quantity}`),

        },      {
          where: {
            id: item.countersale_part_id,
          },
        })

      
      if(affectedCountforpartissue>0){
        const updatedPart = await Countersalepart.findOne({where:{id:item.countersale_part_id}});
        data.push(updatedPart);
      }

    }
  }catch(err){
      logger.error("Update countersalepart error",err)
  }
return data
}

const updateCounterSaleStatus=async (id,user)=>{
  try {
    let data={}
    //find all poparts with the given po id and update the status to 5
    const CSParts=await Countersalepart.findAll({where:{counter_sale_id:id}})

    //if all poparts status is 2 then update the po status to 5 else 6
    let status=CSParts.every((item)=>item.return_quantity===item.quantity)
    console.log(status,"status")

    if(status){
      await Countersale.update({status:1,
        // modifiedBy:user.id
      },{where:{id:id}})
    }
    data=await Countersale.findOne({where:{id:id}})
    return data
  }
  catch(err){
    logger.error('Counter Sale status update error', err);
  }
}

const getCounterSalereturn = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { invoice_number: { [Op.like]: `%${searchKey}%` } },
          { counter_sale_invoice_number: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      const userCondition = {outlet_id:user.outlet.id};
     

      const grnDetails = await CounterSaleReturn.findAll({
        where: { ...searchCondition, ...userCondition },
        
          attributes: [
              'id',
              'customer_code',
              'invoice_number',
              'counter_sale_invoice_number',
              'createdAt',
              'grand_total',

          ],
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
    let count=await CounterSaleReturn.count({where:userCondition})
    return {grnDetails,count};
  } catch (err) {
    logger.error(' Countersale fetching error', err);
  }
};
const generateCSReqInvoiceNo = async (documentType,outletCode,outletid) => {
  const prefix = documentType.split('(')[0].trim();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  // Get the last GRN with the same document type
  const lastno = await CounterSaleRequest.findOne({
    where: {  outlet_id: outletid,
      invoice_number:{[Op.like]: `${prefix}-${outletCode}${financialYear}-%`}
     },
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
const CreateCounterSaleRequest = async (body, user) => {
  const document_type = "CSREQ"
  const invoice_number = await generateCSReqInvoiceNo(
    document_type,
    user.outlet.outletCode,
    user.outlet.id
  );
const bodydata = {
  ...body,
  outlet_id: user.outlet.id,
  createdBy: user.id,
  invoice_number:invoice_number
};

let data = {};
try {
  data = CounterSaleRequest.create(bodydata);
} catch (err) {
  logger.error('New Countersale error', err);
}

return data;
};

const CreateCounterSaleRequestPart = async (body, user,id) => {
  const bodydata = body.map((item) => ({
    ...item,
    outlet_id: user.outlet.id,
    createdBy: user.id,
    counter_sale_req_id:id
  }));

  let data = {};
  try {
    data = CounterSaleRequestPart.bulkCreate(bodydata);
  } catch (err) {
    logger.error('New Countersale error', err);
  }

  return data;
};

const getCounterSaleRequest = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { customer_code: { [Op.like]: `%${searchKey}%` } },
          { customer_name: { [Op.like]: `%${searchKey}%` } },
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
                      status:2
                     
                  };
              }
              else {
                  combinedCondition = {
                      ...searchCondition, 
                      outlet_id: user.outlet.id,
                      
                  };
              }


     

      const countersaleReqDetails = await CounterSaleRequest.findAll({
        where: { ...combinedCondition },
        
          attributes: [
              'id',
              'invoice_number',
              'customer_code',
              // "outlet_id",
              'customer_name',
              'grand_total',
              "status",
              'createdAt',
          ],
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });

    let countcondition={}
    if (user.reportAccess == 1){ 
      countcondition = {
           outlet_id: {
              [Op.in]: literal(
                  `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
              )
          },
          status:2
      };
  }
  else {
      countcondition = {
          outlet_id: user.outlet.id,
    
      };
  }
    let count=await CounterSaleRequest.count({where:countcondition})
    return {countersaleReqDetails,count};
  } catch (err) {
    logger.error(' Countersale fetching error', err);
  }
};

const getCounterSaleReqForApprove = async (reqData,user) => {
  try {
    
      const countersaledetails = await CounterSaleRequest.findAll({
        where: { id:reqData.id },
        
          attributes: [
              'id',
              'document_type',
              'customer_code',
               "source",
               "source_type",
              'customer_type',
              'customer_name',
              'customer_city',
              "customer_state",
              'customer_gstin',
              'customer_address',
              'shipping_address',
              'customer_id',
              'invoice_number'
          ],
        include:[
          {
            model:CounterSaleRequestPart,
            as:"countersale_request_parts",
            attributes:["id","item_id","item_code","item_description","quantity","discount",
              "rate","cost","mrp","cgst","sgst","igst","total","status"],
            where:{status:1},
        }
      ]

    });

    return countersaledetails;
  } catch (err) {
    logger.error(' CounterSale fetching error', err);
  }
};

const getCounterSaleReqForCreateCS = async (reqData, user) => {
  try {
    let status =  2;
    
    const query = `
      SELECT 
        csr.id, csr.document_type, csr.customer_code, csr.source, csr.source_type,
        csr.customer_type, csr.customer_name, csr.customer_city, csr.customer_state,
        csr.customer_gstin, csr.customer_address, csr.customer_id, csr.invoice_number,
        csr.shipping_address,

        csrp.id AS part_id, csrp.item_id, csrp.item_code, csrp.item_description,
        csrp.quantity, csrp.discount, csrp.rate, csrp.cost, csrp.mrp,csrp.hsn_code,
        csrp.cgst, csrp.sgst, csrp.igst, csrp.total, csrp.status,

        i.id AS itemid,

        (SELECT COALESCE(SUM(s.quantity), 0)
         FROM stocks AS s
         WHERE s.item_id = i.id 
         AND s.outlet_id = :outletId) AS available_stock

      FROM countersale_requests AS csr
      LEFT JOIN countersale_request_parts AS csrp 
        ON csr.id = csrp.counter_sale_req_id
      LEFT JOIN items AS i
        ON csrp.item_id = i.id
      WHERE csr.id = :requestId
      AND csrp.status = :status;
    `;

    const replacements = {
      requestId: reqData.id,
      outletId: user.outlet.id,
      status: status
    };

    const results = await db.sequelize.query(query, { 
      replacements, 
      type: db.sequelize.QueryTypes.SELECT 
    });

    return results;
  } catch (err) {
    console.error("CounterSale fetching error", err);
  }
};
const updateCSReqStatus=async (id,user)=>{
  try {
    let data={}
    //find all poparts with the given po id and update the status to 5
    const CSRParts=await CounterSaleRequestPart.findAll({where:{counter_sale_req_id:id}})

    //if all poparts status is 2 then update the po status to 5 else 6
    let status=CSRParts.every((item)=>item.status===2||item.status===3)
    console.log(status,"status")
    let csstatus;
    if (user.reportAccess == 1){ 
            csstatus=1
  }
  else {
      csstatus=3
  }
    if(status){
      await CounterSaleRequest.update({status:csstatus,
        // modifiedBy:user.id
      },{where:{id:id}})
    }
    data=await CounterSaleRequest.findOne({where:{id:id}})
    return data
  }
  catch(err){
    logger.error('CSReq status update error', err);
  }
}

const updateCSReqPartsStatus=async (CSReqPart,user)=>{
  try {
    let data=[]
    console.log(CSReqPart, 'csreqparts');
    for (const item of CSReqPart) {
      await CounterSaleRequestPart.update({status:item.status,discount:item.discount||0},{where:{id:item.id}});
      let res=await CounterSaleRequestPart.findOne({where:{id:item.id}})
      data.push(res)
    }
    return data;
  }
  catch(err){
    logger.error('CSReq parts status update error', err);
  }
}

const generateCSGatePassNo = async (outletCode,outletid) => {
  const prefix = "COUT";
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYear = currentMonth >= 3 ? `${currentYear + 1}`.slice(2) : `${currentYear}`.slice(2);
  const lastno = await Countersale.findOne({
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

  const paddedNo = String(newNo).padStart(4, '0');
  return `${prefix}-${outletCode}${financialYear}-${paddedNo}`;
};

const createCounterSaleGatePass=async (body,user)=>{
  try {
    let data={}
    const {id,currentDateTime} =body
    const gatePassNo=await generateCSGatePassNo(user.outlet.outletCode,
      user.outlet.id)
      console.log(gatePassNo,"gatepassno")
      await Countersale.update({gatepass_invoice_no:gatePassNo,gatepass_status:1,gatepass_checkout_time:currentDateTime
        // modifiedBy:user.id
      },{where:{id:id}})
    
    data=await Countersale.findOne({where:{id:id}})
    return data
  }
  catch(err){
    logger.error('Counter Sale status update error', err);
  }
}

const generateCSGatePassPdf = async (body, user) => {
  try {
    let countersaledetails = await Countersale.findAll({
      where: { id: body.id },
      attributes: [
        'invoice_number',
        'createdAt',
        'customer_code',
        'customer_name',
        'customer_gstin',
        'customer_address',
        'grand_total',
        'gatepass_invoice_no',
        'gatepass_checkout_time'
      ],
      
    });

    return countersaledetails;
  } catch (err) {
    logger.error('Countersale fetching error', err);
  }
}; 


const getCompanyDetails = async (companyId) => {
  try {
    return await db.companies.findAll({
      where: { id: companyId },
    });
  } catch (err) {
    logger.error('Error fetching company details:', err);
    throw err;
  }
};


const getCustomerDetails = async (customerId) => {
  try {
    return await db.customers.findAll({ 
      where: { id: customerId },
      attributes: [
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${configData.code}') AS CHAR)`
          ),
          'mobileNumber',
        ],
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(firstName), '${configData.code}') AS CHAR)`
          ),
          'firstName',
        ],
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(lastName), '${configData.code}') AS CHAR)`
          ),
          'lastName',
        ],
        'gstinNumber',
        'address1',
        'address2',
        'city',
        'state',
        'pinCode',
        'customerCategory'
      ],
    });
  } catch (err) {
    logger.error('Error fetching customer details:', err);
    throw err;
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

const createCounterSaleUpdate = async (data) => {
  try {
   
      const newRecord = await newCounterSaleUpdate.create({
        counter_sale_id: data.counter_sale_id,
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

const createCounterSaleReturnUpdate = async (data) => {

  try {
   
      const newRecord = await CounterSaleReturnUpdate.create({
        counter_sale_return_id: data.counter_sale_return_id,
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


const UpdateCounterSaleReturnRes = async (counterSaleReturnUpdateId, updateData) => {


  try {
      const updatedRecord = await CounterSaleReturnUpdate.update(updateData, {
          where: { id: counterSaleReturnUpdateId },
      });

      return { success: true, data: updatedRecord };
  } catch (error) {
      return { success: false, error: error.message };
  }
};

const UpdateCounterSaleUpdateRes = async (counterSaleId, updateData) => {
  try {
      const updatedRecord = await newCounterSaleUpdate.update(updateData, {
          where: { id: counterSaleId },
      });

      return { success: true, data: updatedRecord };
  } catch (error) {
      return { success: false, error: error.message };
  }
};




const PartIssueService = {
  CreateCounterSale,CreateCounterSalePart,
  Updatestock,getCounterSaleSearchData,
  getOutletandCompanyDetails,deleteCounterSaleReturn,UpdateCounterSaleReturnRes,generateCounterSaleReturnpdf,
  CreateStocklog,getCounterSale,createCounterSaleReturnUpdate,generateCounterSalepdf,getCounterSaleForReturn,CreateCounterSaleReturnParts,CreateStockReturnlog,UpdatestockAfterReturn,
  UpdateCounterSalePart,CreateCounterSaleReturn,getCounterSalereturn,CreateCounterSaleRequest,CreateCounterSaleRequestPart,
  getCounterSaleRequest,getCounterSaleReqForApprove,updateCSReqStatus,updateCSReqPartsStatus,updateCounterSaleStatus,getCounterSaleReqForCreateCS,
  createCounterSaleGatePass,generateCSGatePassPdf,getCompanyDetails,getCustomerDetails,getOutletDetails,createCounterSaleUpdate,UpdateCounterSaleUpdateRes,deleteCounterSale
};
export default PartIssueService;
