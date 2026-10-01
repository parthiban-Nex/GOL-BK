import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import encryptConfig from '../../config/encrypt.js'
import { EXTERNAL_API } from '../../config/externalUrl.js';
import axios from 'axios';

const Receipt = db.receipt;
const Customer = db.customers;
const Outlet = db.outlets;

const createReceipt = async (data, user, docNo) => {
  let counterSaleFlag = false;
  if(data.receiptFrom === 'Counter Sale'){
   counterSaleFlag = true;
  }
  try {
    return await Receipt.create({
      outlet_id: user.outlet.id,
      doc_no: docNo,
      receipt_type: data.receiptType,
      bill_type: data.billType,
      customer_id: data.customerId ? data.customerId :null,
      customer_code: data.customerCode ? data.customerCode :'',
      transaction_id: data.transactionId !== "" ? data.transactionId : null,
      jc_number: !counterSaleFlag ? data.jcNumber : null,
      countersale_number : counterSaleFlag ? data.jcNumber : null,
      amount: data.amount,
      ref_no: data.refNo,
      ref_date: data.refDate,
      remarks: data.remarks,
      tdsEntry: data.tdsEntry,
      mode_of_payment: data.modeOfPayment,
      drawn_on: data.drawnOn,
      cheque_draft_date: data.chequeDraftDate,
      cheque_draft_number: data.chequeDraftNumber,
      transaction_number: data.transactionNumber,
      utr_bank_name:data.utr_bank_name,
      cardNumber: data.cardNumber ? data.cardNumber : null,
      created_by: user.id,
      updated_by: user.id,
    });
  } catch (err) {
    logger.error('Receipt dao createReceipt Error:', err);
    next(err);
  }
};


const createOldDmsReceipt = async (data, user, docNo) => {
  try {
    return await Receipt.create({
      outlet_id: data.outletId,
      doc_no: docNo,
      receipt_type: data.receiptType,
      bill_type: data.billType,
      customer_id: null,
      customer_code: data.customerCode ? data.customerCode :'',
      transaction_id:  null,
      old_dms_transaction_id: data.oldDmsTransactionId !== "" ? data.oldDmsTransactionId : null,
      jc_number: data.jcNumber ? data.jcNumber : '',
      amount: data.amount,
      ref_no: data.refNo,
      ref_date: data.refDate,
      remarks: data.remarks,
      tdsEntry: data.tdsEntry,
      mode_of_payment: data.modeOfPayment,
      drawn_on: data.drawnOn,
      cheque_draft_date: data.chequeDraftDate,
      cheque_draft_number: data.chequeDraftNumber,
      transaction_number: data.transactionNumber,
      utr_bank_name:data.utr_bank_name,
      cardNumber: data.cardNumber ? data.cardNumber : null,
      created_by: user.id,
      updated_by: user.id,
    });
  } catch (err) {
    logger.error('Old Dms Receipt dao createReceipt Error:', err);
    next(err);
  }
};

const getRecentReceipt = async (documentType, outletCode, year) => {
  const recentReceipt = Receipt.findOne({
    where: {
      doc_no: {
        [Op.like]: `${documentType}-${outletCode}${year}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  return recentReceipt;
};

const findByReceiptRefNo = async (refNo) => {
  try {
    const receipt = await Receipt.findOne({ 
      where: { ref_no: refNo },
      });
    return receipt;
  } catch (err) {
    logger.error('Receipt dao findByReceiptRefNo Error:', err);
    console.log(err);
  }
};


const listReceipts1 = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { doc_no: { [Op.like]: `%${searchKey}%` } },
            { receipt_type: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const userCondition = {
      created_by: user.id,
      outlet_id: user.outlet.id,
    };
    const count = await Receipt.count({
      where: { ...searchCondition, ...userCondition },
    });
    const rows = await Receipt.findAll({
      where: { ...searchCondition, ...userCondition },
      limit,
      offset,
      order: [['id', 'DESC']],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Receipt Card dao listReceipts', err);
    console.log(err);
  }
};

const listReceipts = async (reqData, user) => {
  try {
    const { searchKey, offset, limit, billType, receiptType } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { doc_no: { [Op.like]: `%${searchKey}%` } },
            { customer_code: { [Op.like]: `%${searchKey}%` } },
            { jc_number: { [Op.like]: `%${searchKey}%` } }
          ],
        }
      : {};

    const receiptCondition = receiptType ? { receipt_type: receiptType } : {};
    const billCondition = billType ? { bill_type: billType } : {};

    const userCondition = {
      created_by: user.id,
      outlet_id: user.outlet.id,
    };

    const whereCondition = { ...searchCondition, ...receiptCondition, ...billCondition, ...userCondition };

    const count = await Receipt.count({
      where: whereCondition,
    });

    const rows = await Receipt.findAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Receipt Card dao listReceipts', err);
    console.log(err);
  }
};


const listOldDmsReceipts = async (reqData, user) => {
  try {
    const { searchKey, offset, limit, billType, receiptType } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { doc_no: { [Op.like]: `%${searchKey}%` } },
            { customer_code: { [Op.like]: `%${searchKey}%` } },
            { jc_number: { [Op.like]: `%${searchKey}%` } }
          ],
        }
      : {};

    const receiptCondition = receiptType ? { receipt_type: receiptType } : {};
    const billCondition = billType ? { bill_type: billType } : {};

    const userCondition = {
      old_dms_transaction_id : { [Op.ne]: null },
      created_by: user.id
    };

    const whereCondition = { ...searchCondition, ...receiptCondition, ...billCondition, ...userCondition };

    const count = await Receipt.count({
      where: whereCondition,
    });

    const rows = await Receipt.findAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Receipt Card dao listReceipts', err);
    console.log(err);
  }
};

const getReceipt = async (id) => {
  try {
    const rows = await Receipt.findOne({
      where: { id: id },
    });
    return rows;
  } catch (err) {
    logger.error('Receipt dao getReceipt', err);
    console.log(err);
  }
};

const getReceiptPdf = async (id) => {
  try {
    const fieldsToDecrypt = [
      { field: 'firstName', alias: 'decryptedFirstName' },
      { field: 'lastName', alias: 'decryptedLastName' },
    ];

    const decryptedAttributes = fieldsToDecrypt.map(item => [
      db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
      item.alias
    ]);

    const rows = await Receipt.findOne({
      where: { id: id },
      include: { 
        model: Customer, as: 'customer',
        attributes: {
          include: decryptedAttributes
        }
       },
    });
    return rows;
  } catch (err) {
    logger.error('Receipt dao getReceiptPdf', err);
    console.log(err);
  }
};


const getOldDmsReceiptPdf = async (id) => {
  try {
    const fieldsToDecrypt = [
      { field: 'firstName', alias: 'decryptedFirstName' },
      { field: 'lastName', alias: 'decryptedLastName' },
    ];

    const decryptedAttributes = fieldsToDecrypt.map(item => [
      db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
      item.alias
    ]);

    const rows = await Receipt.findOne({
      where: { id: id },
      include: 
      // { 
      //   model: Customer, as: 'customerwithcode',
      //   attributes: {
      //     include: decryptedAttributes
      //   }
      //  },
      [
    {
      model: Customer,
      as: 'customerwithcode',
      attributes: {
        include: decryptedAttributes
      }
    },
    {
      model: Outlet,
      as: 'outletdetails',
      required: false,
      on: db.sequelize.literal(`
        SUBSTRING_INDEX(receipt.customer_code, '-', 1) = outletdetails.outletCode
      `)
    }
  ],
    raw: true,
       
    });
    return rows;
  } catch (err) {
    logger.error('Receipt dao getReceiptPdf', err);
    console.log(err);
  }
};

const oldDmsGetJobcardDetailsForReceipt = async (jcno,outletCode) => {
    try {
       const response = await axios.post(
      `${EXTERNAL_API.OLdDMS_BASE_URL}/receipt/getJcDetailsForReceipt`,
      {
       jcNumber: jcno,
       outletCode: outletCode
     },
      { headers: {
         "Content-Type": "application/json",
         "API_KEY_INTERNAL": "P1uF7ez4xA+RYfBUwy6mCV1MZfNgPZgUbW2N33U4GOuN4OeU6NaoR142BTIPCLVa"
       } }
    );
    return response.data;

    } catch (err) {
        console.log(err);
        logger.error("Old Dms  Get Receipt ByTransaction", err);
    };
}

const dao = {
  createReceipt,
  getRecentReceipt,
  listReceipts,
  getReceipt,
  createOldDmsReceipt,
  getReceiptPdf,
  listOldDmsReceipts,
  findByReceiptRefNo,
  getOldDmsReceiptPdf,
  oldDmsGetJobcardDetailsForReceipt
};

export default dao;
