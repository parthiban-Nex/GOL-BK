import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, where, literal, fn, col } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
// import { raw } from 'express';

const CreditNotesDetails = db.creditNotesDetails;
const CreditNotes = db.creditNotes;
const Customer = db.customers;
const JobCard = db.jobCard;
const Vehicle = db.vehicles;
const Model = db.models;
const Make = db.makes;
const Servicetypes = db.servicetypes;
const RepairType = db.repairtypes;
const Billings = db.billings;
const Customers = db.customers;
const Vehicles = db.vehicles;
const Outlets = db.outlets;
const Sources = db.sources;
const CreditNoteUpdate = db.creditnoteupdate;
const Sourcetypes = db.sourcetypes;
const LbsDebitNote=db.lbsDebitNotes
const addCreditNotesDetails = async (creditNotesDetails, user, cnId) => {
    // console.log('Adding Credit Notes Details for CN ID:', cnId);
    // console.log('Credit Notes Details Payload:', creditNotesDetails);
    // console.log('User Info:', user);

    let data = [];
    try {
        for (const labour of creditNotesDetails.LabourSchedule) {
            let baseAmount = parseFloat((labour.quantity * labour.amount - labour.discount_percentage+ labour.additionalMargin).toFixed(2));
            const labourData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: labour.transaction_id,
                rot_id: labour.rot_id,
                schedule_id: labour.id,
                rot_code: labour.rot_code,
                rot_description: labour.description,
                hsn: labour.rot_id,
                quantity: labour.quantity,
                amount: baseAmount,
                discount_percentage: labour.discount_percentage,
                sgst: labour.sgst,
                cgst: labour.cgst,
                igst: labour.igst,
                depreciation_per: labour.depreciation_per,
                marginPercentage: labour.marginPercentage ? labour.marginPercentage : null,
                additional_margin: labour.additionalMargin,
                total: labour.laborTotal,
                repairType: labour.repairTypeId,
                itemType: 1,
                created_by: user.id
            });
            data.push(labourData);
        };

        for (const oslLabour of creditNotesDetails.oslLabourSchedule) {
            let margin = oslLabour.marginPercentage ? oslLabour.marginPercentage/100 : 0;
            let baseAmount = parseFloat(((oslLabour.quantity * oslLabour.amount - oslLabour.discount_percentage)/(1 - margin) + oslLabour.additionalMargin).toFixed(2));
            let tax = oslLabour.igst > 0 ? oslLabour.igst : oslLabour.sgst + oslLabour.cgst;
            let totalAmount = parseFloat((baseAmount*(100 + tax)/100).toFixed(2));
            const oslLabourData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: oslLabour.transaction_id,
                rot_id: oslLabour.rot_id,
                schedule_id: oslLabour.id,
                rot_code: oslLabour.rot_code,
                rot_description: oslLabour.description,
                hsn: oslLabour.rot_id,
                quantity: oslLabour.quantity,
                amount: baseAmount,
                discount_percentage: oslLabour.discount_percentage,
                sgst: oslLabour.sgst,
                cgst: oslLabour.cgst,
                igst: oslLabour.igst,
                depreciation_per: oslLabour.depreciation_per,
                marginPercentage: oslLabour.marginPercentage ? oslLabour.marginPercentage : null,
                additional_margin: oslLabour.additionalMargin,
                total: totalAmount,
                repairType: oslLabour.repairTypeId ? oslLabour.repairTypeId : null,
                itemType: 2,
                created_by: user.id
            });
            data.push(oslLabourData);
        };

        for (const parts of creditNotesDetails.PartsIssuse) {
            const partsData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: parts.transaction_id,
                rot_id: parts.item_id,
                schedule_id: parts.id,
                rot_code: parts.item_code,
                rot_description: parts.item_name,
                hsn: parts?.items?.hsnCode,
                quantity: parts.quantity,
                amount: parts.rate,
                discount_percentage: parts.discount,
                sgst: parts.sgst,
                cgst: parts.cgst,
                igst: parts.igst,
                depreciation_per: 0,
                marginPercentage: parts.marginPercentage ? parts.marginPercentage : null,
                additional_margin: 0,
                total: parts.total,
                repairType: parts.repair_type,
                itemType: 3,
                created_by: user.id
            });
            data.push(partsData);
        };
        // const updateData = await CreditNotes.update(
        //   { purpose: "SaleReturn"},
        //   {
        //     where: {
        //       id: creditNotesDetails.cnId
        //     }
        //   }
        // )
        // data.push(updateData);
    } catch (err) {
        logger.error('Credit Notes Details addCreditNotesDetails:', err);
        next(err);
    }

    return data;
};

const creditDebitNotesPdf = async (id) => {
    try {
        const data = await CreditNotes.findOne({ 
            where: {id: id},
            include: [
                {
                    model: CreditNotesDetails, as: "creditNotesDetails",
                },
                {
                 model: CreditNoteUpdate, as : 'creditNotesUpdateMap',
                },
                {
                    model: JobCard, as: "jobCard",
                    include: [
                        {
                            model: Vehicle, as: "vehicle",
                            include: [
                                { model: Model, as: 'model' },
                                { model: Make, as: 'make' },
                            ]
                        },
                        {
                            model: Servicetypes, as: "servicetype",
                            attributes: ['serviceTypeName'],
                        },
                        {
                            model: RepairType, as: 'repairtype',
                            attributes: ['repairTypeName']
                        },
                        {
                            model: Billings, as: "billing",
                        }
                    ]
                },
                {
                    model: Outlets, as: 'outlet'
                }
            ]
        })
        
        return data;
    } catch (err) {
        
    }
}

const getCreditDebitData = async (reqData, user) => {
  let creditData;
  let debitData;
    try {
      const startDate = reqData.startDate + ' 00:00:00';
      const endDate = reqData.endDate + ' 23:59:59';
  
      let queryOptions = {};
  
      if (user.reportAccess === 1) {
        if (reqData.purpose === 'CD') {
            creditData = "CreditNote";
            debitData = "DebitNote";
            queryOptions = {
                where: {
                    outlet_id:
                    {
                        [Op.in]: literal(
                          `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                      }, // { [Op.or] : [2, 3]},
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotes,
                        as: "creditNotes",
                        where: reqData.purpose === 'CD' ?
                        { [Op.or]: [{ purpose: creditData }, { purpose: debitData }] } : { purpose: reqData.purpose },
                        include: [
                            {
                                model: Customers,
                                as: "customers"
                            },
                            {
                                model: JobCard,
                                as: "jobCard",
                                include: [
                                    {
                                        model: Billings,
                                        as: "billing"
                                    }
                                ]
                            }
                        ],
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    }
                ]
            };
    
            if (reqData.limit && reqData.offset !== undefined) {
                queryOptions.limit = reqData.limit;
                queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { '$creditNotes.doc_no$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.jc_number$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.reg_no$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.customer_code$': { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }
    
            const rows = await CreditNotesDetails.findAll(queryOptions);
            return rows;
        } else {
            queryOptions = {
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotes,
                        as: "creditNotes",
                        include: [
                            {
                                model: Customers,
                                as: "customers"
                            },
                            {
                                model: JobCard,
                                as: "jobCard",
                                include: [
                                    {
                                        model: Billings,
                                        as: "billing"
                                    }
                                ]
                            }
                        ],
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    }
                ]
            };
    
            if (reqData.limit && reqData.offset !== undefined) {
                queryOptions.limit = reqData.limit;
                queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { '$creditNotes.doc_no$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.jc_number$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.reg_no$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNotes.customer_code$': { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }
    
            const rows = await CreditNotesDetails.findAll(queryOptions);
            return rows;
        }
      } else {
        
        if (reqData.purpose === 'CD') {
            creditData = "CreditNote";
            debitData = "DebitNote";
            queryOptions = {
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotes,
                        as: "creditNotes",
                        where: reqData.purpose === 'CD' ?
                        { [Op.or]: [{ purpose: creditData }, { purpose: debitData }] } : { purpose: reqData.purpose },
                        include: [
                            {
                                model: Customers,
                                as: "customers"
                            },
                            {
                                model: JobCard,
                                as: "jobCard",
                                include: [
                                    {
                                        model: Billings,
                                        as: "billing"
                                    }
                                ]
                            }
                        ],
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    }
                ]
            };
    
            if (reqData.limit && reqData.offset !== undefined) {
                queryOptions.limit = reqData.limit;
                queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { '$creditNoteDetails.rot_code$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNoteDetails.rot_description$': { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }
    
            const rows = await CreditNotesDetails.findAll(queryOptions);
            return rows;
        } else {
            queryOptions = {
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotes,
                        as: "creditNotes",
                        include: [
                            {
                                model: Customers,
                                as: "customers"
                            },
                            {
                                model: JobCard,
                                as: "jobCard",
                                include: [
                                    {
                                        model: Billings,
                                        as: "billing"
                                    }
                                ]
                            }
                        ],
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    }
                ]
            };
    
            if (reqData.limit && reqData.offset !== undefined) {
                queryOptions.limit = reqData.limit;
                queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { '$creditNoteDetails.rot_code$': { [Op.like]: `%${searchKey}%` } },
                        { '$creditNoteDetails.rot_description$': { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }
    
            const rows = await CreditNotesDetails.findAll(queryOptions);
            return rows;
        }
    }
    
    } catch (err) {
      logger.error("Credit Notes Details dao getCreditDebitData", err);
      console.log(err);
    }
};

const getCnId = async (jcNo) => {
    try {
        const id = await CreditNotes.findOne({
        where: {transaction_id: jcNo}
        })
        return id;
    } catch (err) {
        logger.error("Credit Notes Details dao getCnId", err);
        console.log(err);
    }
}

const getOldDmsCnId = async (jcNo) => {
    try {
        const id = await CreditNotes.findOne({
        where: {old_dms_transaction_id: jcNo}
        })
        return id;
    } catch (err) {
        logger.error("Credit Notes Details dao getOldDmsCnId", err);
        console.log(err);
    }
}

 const getOutletandCompanyDetails = async (outletID) => {
    try{
      const getOutletDetails = await Outlets.findOne({
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

  const getOutletDetailsByCode = async (outletCode) => {
    try{
      const getOutletDetails = await Outlets.findOne({
        where: { outletCode: outletCode },
        attributes: ['id', 'outletCode', 'outletName','gstIn','email','phoneNumber','address1','address2','city','state','pinCode'],    
        raw: true
      });
      if (!getOutletDetails) {
        return {
            success: false,
            message: 'Outlet not found'
        }
    }else{
        return {
                success
                : true,
                data: getOutletDetails
            }
        }
     
    }catch(err){
      logger.error('getOutletDetailsByCode fetching error', err);
    }
    }

    const getCustomerDetailsByCode = async (customerCode) => {
        try {
            const customerDetails = await Customers.findOne({
                where: { customerCode: customerCode },
                attributes: ['id', 'customerCode', 'gstinNumber', 'address1', 'address2', 'city', 'state', 'pinCode', 'customerCategory',],
                raw: true
            });
            if (customerDetails) {
            return {
                success: true,
                data: customerDetails
            }
        } else {
            return {
                success: false,
                message: 'Customer not found'
            };
        }
        } catch (err) { 
            logger.error('getCustomerDetailsByCode fetching error', err);
        }
    };
            

      

  const getCustomerDetails = async (customerId) => {
  try {
    return await Customers.findAll({ 
      where: { id: customerId },
      attributes: [
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
          ),
          'mobileNumber',
        ],
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
          ),
          'emailId',
        ],
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
          ),
          'firstName',
        ],
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`
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

const createCreditUpdate = async (data) => {
    try {
     
        const newRecord = await CreditNoteUpdate.create({
          transaction_id: data.transaction_id,
          credit_note_id: data.credit_note_id,
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


   const UpdateCreditNoteUpdateRes = async (id, updateData) => {
      try {
          const updatedRecord = await CreditNoteUpdate.update(updateData, {
              where: { id: id },
          });
    
          return { success: true, data: updatedRecord };
      } catch (error) {
          return { success: false, error: error.message };
      }
    };

const getCreditDebitDataNew = async (reqData, user) => {
    
    let creditData;
    let debitData;
        try {
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';
    
        let queryOptions = {};
        let count = 0;
    
        if (user.reportAccess === 1) {
            queryOptions = {
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotesDetails,
                        as: "creditNotesDetails",
                    },
                    {
                        model: Customers,
                        as: "customers",
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    },
                    {
                        model: JobCard,
                        as: "jobCard",
                        include: [
                            {
                                model: Billings,
                                as: "billing"
                            },
                            {
                                model: Sourcetypes, as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Sources, as: 'sources',
                                attributes: ['sourceName']
                            }
                        ]
                    },
                    {
                        model: Outlets,
                        as: "outlet"
                    }
                ],
            }
            if (reqData.purpose === 'CD') {
                creditData = "CreditNote";
                debitData = "DebitNote";
                queryOptions.where = {
                    outlet_id:
                    {
                        [Op.in]: literal(
                        `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    }, // { [Op.or] : [2, 3]},
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    purpose: {
                        [Op.or]: [creditData , debitData]
                    }
                }
        
            } else {
                queryOptions.where = queryOptions.where = {
                    outlet_id:
                    {
                        [Op.in]: literal(
                        `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    }, // { [Op.or] : [2, 3]},
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    purpose: "SaleReturn"
                    
                }
            }
            
            if (reqData.limit && reqData.offset !== undefined) {
                // queryOptions.limit = reqData.limit;
                // queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { doc_no: { [Op.like]: `%${searchKey}%` } },
                        { jc_number: { [Op.like]: `%${searchKey}%` } },
                        { reg_no: { [Op.like]: `%${searchKey}%` } },
                        { customer_code: { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }

            const rows = await CreditNotes.findAll(queryOptions);
    
            // if(reqData.purpose === 'CD'){
            //     count = await CreditNotes.count({where: queryOptions.where});
            // }
            // else{
            //     let countSearch = await CreditNotes.findAll({
            //         attributes: [
            //             "id",
            //             [fn("COUNT", col("creditNotesDetails.id")), "countVal"],
            //         ],
            //         where: queryOptions.where,
            //         include: [
            //             {
            //                 model: CreditNotesDetails,
            //                 as: "creditNotesDetails",
            //                 attributes: []
            //             },
            //         ],
            //         group: ["credit_debit_notes.id"],
            //     })
            //     for (const countObj of countSearch){
            //         console.log(countObj.dataValues.countVal);
            //         count+= parseInt(countObj?.dataValues?.countVal);
            //     }
            // }
            // const resObj = {
            //     rows: rows,
            //     count: count
            // }
    
            return rows;
            
        } else {
            queryOptions = {
                order: [["id", "DESC"]],
                include: [
                    {
                        model: CreditNotesDetails,
                        as: "creditNotesDetails",
                    },
                    {
                        model: Customers,
                        as: "customers",
                        attributes: {
                            include: [
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedFirstName'
                                ],
                                [
                                    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                                    'decryptedLastName'
                                ]
                            ]
                        }
                    },
                    {
                        model: JobCard,
                        as: "jobCard",
                        include: [
                            {
                                model: Billings,
                                as: "billing"
                            },
                            {
                                model: Sourcetypes, as: 'sourcetype',
                                attributes: ['sourceTypeName']
                            },
                            {
                                model: Sources, as: 'sources',
                                attributes: ['sourceName']
                            }
                        ]
                    },
                    {
                        model: Outlets,
                        as: "outlet"
                    }
                ],
            }
            if (reqData.purpose === 'CD') {
                creditData = "CreditNote";
                debitData = "DebitNote";
                queryOptions.where = {
                    outlet_id: user.outlet.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    purpose: {
                        [Op.or]: [creditData , debitData]
                    }
                }
        
            } else {
                queryOptions.where = queryOptions.where = {
                    outlet_id: user.outlet.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    purpose: "SaleReturn"
                    
                }
            }
            
            if (reqData.limit && reqData.offset !== undefined) {
                // queryOptions.limit = reqData.limit;
                // queryOptions.offset = reqData.offset;
    
                if (reqData.searchKey) {
                    const searchKey = reqData.searchKey.trim();
                    queryOptions.where[Op.or] = [
                        { doc_no: { [Op.like]: `%${searchKey}%` } },
                        { jc_number: { [Op.like]: `%${searchKey}%` } },
                        { reg_no: { [Op.like]: `%${searchKey}%` } },
                        { customer_code: { [Op.like]: `%${searchKey}%` } }
                    ];
                }
            }

            const rows = await CreditNotes.findAll(queryOptions);
    
            // if(reqData.purpose === 'CD'){
            //     count = await CreditNotes.count({where: queryOptions.where});
            // }
            // else{
            //     let countSearch = await CreditNotes.findAll({
            //         attributes: [
            //             "id",
            //             [fn("COUNT", col("creditNotesDetails.id")), "countVal"],
            //         ],
            //         where: queryOptions.where,
            //         include: [
            //             {
            //                 model: CreditNotesDetails,
            //                 as: "creditNotesDetails",
            //                 attributes: []
            //             },
            //         ],
            //         group: ["credit_debit_notes.id"],
            //     })
            //     for (const countObj of countSearch){
            //         console.log(countObj.dataValues.countVal);
            //         count+= parseInt(countObj?.dataValues?.countVal);
            //     }
            // }
            // const resObj = {
            //     rows: rows,
            //     count: count
            // }
    
            return rows;
        }
    } catch (err) {
        logger.error("Credit Notes Details dao getCreditDebitData", err);
        console.log(err);
    }
};
const getRecentDocNumber = async (documentType, ouletCode, year) => {
    const documentNumber = LbsDebitNote.findOne({
        where: {
            doc_no: {
                [Op.like]: `${documentType}-${ouletCode}${year}%`
            }
        },
        order: [["createdAt", "DESC"]]
    });

    return documentNumber;
};  
const addLbsDebitNotes = async (docNumber, creditNotes, user) => {
    let data = {};
    try {
        data = await LbsDebitNote.create({
            outlet_id: creditNotes.jobCardOutlet,
            doc_no: docNumber,
            transaction_id: creditNotes.jobCard,
            jc_number: creditNotes.jobCardNumber,
            customer_id: creditNotes.customerId,
            customer_code: creditNotes.customerCode,
            customer_gstin: creditNotes.customerGstIn,
            // job_card_insurance: "",
            vehicle_id: creditNotes.vehicleId,
            reg_no: creditNotes.customerVehicle,
            purpose: creditNotes.purpose,
            narration: creditNotes.narration,
            amount: creditNotes.amount,
            status: 1,
            lbs_ins_id:creditNotes.lbsInsuranceId,
            lbs_ins_code:creditNotes.lbsInsuranceCode,
            created_by: user.id,
        });
    } catch (err) {
        logger.error('Lbs Debit Notes addDebitNotes', err);
        next(err);
    };

    return data;
};

const listLbsDebitNotes = async (reqData, user) => {
    try {
        const {searchKey, offset, limit} = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { reg_no: { [Op.like]: `%${searchKey}%`}},
                { doc_no: { [Op.like]: `%${searchKey}%`}},
                { customer_code: { [Op.like]: `%${searchKey}%`}}
            ],
        } : {};

        let queryOptions = {}
    
        if ( user.reportAccess === 1 ) {
            queryOptions = {
                outlet_id:
                {
                [Op.in]: literal(
                    `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                )
                },
                status: 1
            }
        }
        else {
            queryOptions = {
                outlet_id: user.outlet.id
            }
        }
        const count = await LbsDebitNote.count({where: { ...searchCondition, ...queryOptions}});
        let rows = await LbsDebitNote.findAll({
            where: { ...searchCondition, ...queryOptions},
            limit,
            offset,
            include: [{ model: Customer, as: 'lbsCustomerMapping',
                attributes: [
                      [db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                      'decryptedFirstName']
                    ,[db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
                        'decryptedLastName']
                    ]
            }],
            order: [['id', 'DESC']],
        });

        return {
            totalItems: count, data: rows
        }
    } catch (err) {
        logger.error('LBS Debit Notes dao', err);
        console.log(err);
    };
};

const oldDmsAddCreditNotesDetails = async (creditNotesDetails, user, cnId) => {
    // console.log('Adding Credit Notes Details for CN ID:', cnId);
    // console.log('Credit Notes Details Payload:', creditNotesDetails);
    // console.log('User Info:', user);

    let data = [];
    try {
        for (const labour of creditNotesDetails.LabourSchedule) {
            let baseAmount = parseFloat((labour.quantity * labour.amount - labour.discount_percentage+ labour.additionalMargin).toFixed(2));
            const labourData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: labour.transaction_id,
                rot_id: labour.rot_id,
                schedule_id: labour.id,
                rot_code: labour.rot_code,
                rot_description: labour.description,
                hsn: labour.rot_id,
                quantity: labour.quantity,
                amount: baseAmount,
                discount_percentage: labour.discount_percentage,
                sgst: labour.sgst,
                cgst: labour.cgst,
                igst: labour.igst,
                depreciation_per: labour.depreciation_per,
                marginPercentage: labour.marginPercentage ? labour.marginPercentage : null,
                additional_margin: labour.additionalMargin,
                total: labour.laborTotal,
                repairType: labour.repairTypeId,
                itemType: 1,
                created_by: user.id
            });
            data.push(labourData);
        };

        for (const oslLabour of creditNotesDetails.oslLabourSchedule) {
            let margin = oslLabour.marginPercentage ? oslLabour.marginPercentage/100 : 0;
            let baseAmount = parseFloat(((oslLabour.quantity * oslLabour.amount - oslLabour.discount_percentage)/(1 - margin) + oslLabour.additionalMargin).toFixed(2));
            let tax = oslLabour.igst > 0 ? oslLabour.igst : oslLabour.sgst + oslLabour.cgst;
            let totalAmount = parseFloat((baseAmount*(100 + tax)/100).toFixed(2));
            const oslLabourData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: oslLabour.transaction_id,
                rot_id: oslLabour.rot_id,
                schedule_id: oslLabour.id,
                rot_code: oslLabour.rot_code,
                rot_description: oslLabour.description,
                hsn: oslLabour.rot_id,
                quantity: oslLabour.quantity,
                amount: baseAmount,
                discount_percentage: oslLabour.discount_percentage,
                sgst: oslLabour.sgst,
                cgst: oslLabour.cgst,
                igst: oslLabour.igst,
                depreciation_per: oslLabour.depreciation_per,
                marginPercentage: oslLabour.marginPercentage ? oslLabour.marginPercentage : null,
                additional_margin: oslLabour.additionalMargin,
                total: totalAmount,
                repairType: oslLabour.repairTypeId ? oslLabour.repairTypeId : null,
                itemType: 2,
                created_by: user.id
            });
            data.push(oslLabourData);
        };

        for (const parts of creditNotesDetails.PartsIssuse) {
            const partsData = await CreditNotesDetails.create({
                cn_id: cnId,
                outlet_id: user.outlet.id,
                transaction_id: parts.transaction_id,
                rot_id: parts.id,
                schedule_id: parts.id,
                rot_code: parts.item_code,
                rot_description: parts.item_name,
                hsn: parts?.items?.hsnCode,
                quantity: parts.quantity,
                amount: parts.rate,
                discount_percentage: parts?.discount || 0,
                sgst: parts.sgst,
                cgst: parts.cgst,
                igst: parts.igst,
                depreciation_per: 0,
                marginPercentage: parts.marginPercentage ? parts.marginPercentage : null,
                additional_margin: 0,
                total: parts.total,
                repairType: parts.repair_type,
                itemType: 3,
                created_by: user.id
            });
            data.push(partsData);
        };
        // const updateData = await CreditNotes.update(
        //   { purpose: "SaleReturn"},
        //   {
        //     where: {
        //       id: creditNotesDetails.cnId
        //     }
        //   }
        // )
        // data.push(updateData);
    } catch (err) {
        logger.error('Credit Notes Details addCreditNotesDetails:', err);
        next(err);
    }

    return data;
};

const cndDAO = {
    addCreditNotesDetails,
    creditDebitNotesPdf,getCreditDebitData,
    getCnId,
    getOutletandCompanyDetails,
    getCustomerDetails,
    UpdateCreditNoteUpdateRes,
    createCreditUpdate,
    getCreditDebitDataNew,
    getOutletDetailsByCode,
    addLbsDebitNotes,getRecentDocNumber,
    listLbsDebitNotes,
    getOldDmsCnId,
    getCustomerDetailsByCode,
    oldDmsAddCreditNotesDetails
};

export default cndDAO;
