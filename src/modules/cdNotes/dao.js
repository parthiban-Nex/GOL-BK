import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, literal } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import { EXTERNAL_API } from '../../config/externalUrl.js';
import axios from 'axios';

const JobCard = db.jobCard;
const CreditNotes = db.creditNotes;
const TransactionInsurance = db.transactionInsurance;
const Customer = db.customers;
const Schedules = db.schedules;
const OslSchedules = db.oslSchedules;
const PartsIssue = db.partsIssue;
const Outlets = db.outlets;
const Items = db.items;

const getJobCardNumber = async (searchKey, user) => {
    let data;
    try {
        const userCondition = {
            // created_by: user.id,
            outlet_id: user.outlet.id,   
        };
        const searchCondition = searchKey ? {
            [Op.or]: [
                { job_card_no: { [Op.like]: `%${searchKey.jobCard}%`}}
            ]
        } : {};

        if (user.reportAccess === 1) {
            data = await JobCard.findAll({
                where: { ...searchCondition, 
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                      },
                      status: [4,5],
                    },
                order: [['id', 'DESC']],
                include: [
                    { 
                        model: TransactionInsurance,
                        as: 'insurance',
                        attributes: ['id', 'transaction_id', 'insurance_provider_name', 'insurance_address']
                    },
                    { model: Schedules, as: 'schedules'},
                    { model: OslSchedules, as: 'oslSchedules'},
                    { 
                        model: PartsIssue, as: 'partsIssue', 
                        include: [
                            { model: Items, as: 'items'}
                        ]
                    },
                    { model: CreditNotes, as: 'creditNotes' }
                ],
            });
        } else {
            data = await JobCard.findAll({
                where: { ...searchCondition, ...userCondition, status: [4,5] },
                order: [['id', 'DESC']],
                include: [
                    { 
                        model: TransactionInsurance,
                        as: 'insurance',
                        attributes: ['id', 'transaction_id', 'insurance_provider_name', 'insurance_address']
                    },
                    { model: Schedules, as: 'schedules'},
                    { model: OslSchedules, as: 'oslSchedules'},
                    { 
                        model: PartsIssue, as: 'partsIssue', 
                        include: [
                            { model: Items, as: 'items'}
                        ]
                    },
                    { model: CreditNotes, as: 'creditNotes' }
                ],
            });
        };

        return data;
    } catch (err) {
        logger.error('Credit dao getJobCardNumber Error:', err);
        next(err);
    }
};

const getRecentDocNumber = async (documentType, ouletCode, year) => {
    const documentNumber = CreditNotes.findOne({
        where: {
            doc_no: {
                [Op.like]: `${documentType}-${ouletCode}${year}%`
            }
        },
        order: [["createdAt", "DESC"]]
    });

    return documentNumber;
};


    const deleteCounterSale = async (id) => {

      try {
          const deletedCount = await CreditNotes.destroy({
              where: { id: id }
          });
    
          if (deletedCount == 0) {
              return { success: false, message: "Create Note Id Not found" };
          }
    
          return { success: true, message: "Credit Note deleted successfully" };
      } catch (error) {
          console.error("Error deleting Credit Note:", error);
          return { success: false, error: error.message };
      }
    };


const addCreditNotes = async (docNumber, creditNotes, user) => {
    let data = {};
    try {
        data = await CreditNotes.create({
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
            cn_flag: 2,
            status: 1,
            created_by: user.id
        });
    } catch (err) {
        logger.error('Credit/Debit Notes addCreditNotes', err);
        next(err);
    };

    return data;
};


const oldDmsaddCreditNotes = async (docNumber, creditNotes, user) => {
let data = {};
    // console.log('D:dms_node_user_backendsrcmodulescdNotesservice.js -----',creditNotes)
        const customerData = await Customer.findOne({ where: { customerCode: creditNotes.customerCode},
        attributes: ['id', 'customerCode'],
        raw: true

        });
    if(!customerData) {
        logger.error('Customer not found for old DMS Credit Notes');
       return {
                success: false,
                message: 'Customer not found. Please create customer in New DMS'
            };
         }
         const outletData = await Outlets.findOne({ where: { outletCode: creditNotes.outletCode }
        
        ,attributes: ['id', 'outletCode'],
        raw: true
    });
    // console.log('D:dms_node_user_backendsrcmodulescdNotesservice.js -----outletData',outletData)
         if(!outletData) {
            logger.error('Outlet not found for old DMS Credit Notes');
          return {
                success: false,
                message: 'Outlet not found. Please create outlet in New DMS'
            };
         }
    try {
        data = await CreditNotes.create({
            // outlet_id: creditNotes.jobCardOutlet,
            outlet_id: outletData.id,
            doc_no: docNumber,
            transaction_id: null,
            old_dms_transaction_id: creditNotes.oldDmsTransactionId,
            jc_number: creditNotes.jobCardNumber,
            customer_id: customerData.id,
            customer_code: creditNotes.customerCode,
            customer_gstin: creditNotes.customerGstIn,
            // job_card_insurance: "",
            vehicle_id: null,
            reg_no: creditNotes.customerVehicle,
            purpose: creditNotes.purpose,
            narration: creditNotes.narration,
            amount: creditNotes.amount,
            cn_flag: 2,
            status: 1,
            created_by: user.id
        },);

        return {
            success: true,
            message: 'Credit/Debit note created successfully',
            data: data
        };
    } catch (err) {
        logger.error(' Old Dms Credit/Debit Notes addCreditNotes', err);
        // next(err);
    };

  
};



const listCreditNotes = async (reqData, user) => {
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
            }
        }
        else {
            queryOptions = {
                outlet_id: user.outlet.id
            }
        }
        const count = await CreditNotes.count({where: { ...searchCondition, ...queryOptions}});
        let rows = await CreditNotes.findAll({
            where: { ...searchCondition, ...queryOptions},
            limit,
            offset,
            include: [{ model: Customer, as: 'customers',
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
        logger.error('Credit Notes dao', err);
        console.log(err);
    };
};


const listOldDmsCreditNotes = async (reqData, user) => {
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
    
        // if ( user.reportAccess === 1 ) {
        //     queryOptions = {
        //         outlet_id:
        //         {
        //         [Op.in]: literal(
        //             `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
        //         )
        //         },
        //     }
        // }
     
            queryOptions = {
                created_by: user.id,
                transaction_id: null,
            }
      
        const count = await CreditNotes.count({where: { ...searchCondition, ...queryOptions}});
        let rows = await CreditNotes.findAll({
            where: { ...searchCondition, ...queryOptions},
            limit,
            offset,
            include: [{ model: Customer, as: 'customers',
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
        logger.error('Old Dms Credit Notes dao', err);
        console.log(err);
    };
};

const downloadCreditDebitNotes = async (id) => {
    try {
    const rows = await CreditNotes.findOne({
      where: { id: id},
      include: [
        { model: Customer, as: 'customers', 
            // attributes: ["firstName","address1"] },
            attributes: {
                include: [[
                  db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
                  'decryptedCustomerName'
                ],"address1",]
            },
        },
        {
            model: Outlets, as: 'outlet'
        }
      ],
    });

    return rows;
    } catch (err) {
        console.log(err);
        logger.error("Credit Notes dao downloadCreditDebitNotes", err);
    };
};

const getCdByTransaction = async (id) => {
    try {
        let data = {};
        data = await CreditNotes.findOne({ where: {transaction_id: id}});
      
        return data;
    } catch (err) {
        console.log(err);
        logger.error("Credit Notes dao getCdByTransaction", err);
    };
}

const oldDmsGetCdByTransaction = async (id) => {
    try {
        let data = {};
        data = await CreditNotes.findOne({ where: {old_dms_transaction_id: id}});
      
        return data;
    } catch (err) {
        console.log(err);
        logger.error("Old Dms Credit Notes dao getCdByTransaction", err);
    };
}

const oldDmsGetJobcardDetails = async (jcno) => {
    try {
       const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/jc_cn/getJobcardCreditNoteDetails`,
      {
       jcNumber: jcno
     },
      { headers: {
         "Content-Type": "application/json",
         "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
       } }
    );
    return response.data;

    } catch (err) {
        console.log(err);
        logger.error("Old Dms Credit Notes dao getCdByTransaction", err);
    };
}

const creditDao = {
    getJobCardNumber, addCreditNotes,
    oldDmsaddCreditNotes,oldDmsGetCdByTransaction,deleteCounterSale, getRecentDocNumber, listCreditNotes,downloadCreditDebitNotes,getCdByTransaction,listOldDmsCreditNotes,
    oldDmsGetJobcardDetails
};

export default creditDao;
