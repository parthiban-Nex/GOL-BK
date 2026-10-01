import logger from '../../config/logger.js';
import ReceiptDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import numberToWords from 'number-to-words';
import db from '../index.js';


const Company = db.companies;

const createReceipt = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    const docNo = await generatReceiptNumber('CSRT', user.outlet.outletCode);
    data = await ReceiptDao.createReceipt(reqData, user, docNo);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Receipt';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = ' Receipt created ';
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Receipt service createReceipt Error:', err);
    next(err);
  }
  return result;
};

const createOldDmsReceipt = async (reqData, user) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    const docNo = await generatReceiptNumber('CSRT', user.outlet.outletCode);
    data = await ReceiptDao.createOldDmsReceipt(reqData, user, docNo);
    if (data) {
      // recentActivityData['activity_type'] = 'Create';
      // recentActivityData['menu_name'] = 'Receipt';
      // recentActivityData['createdBy'] = user.id;
      // recentActivityData['username'] = user.employeeCode;
      // recentActivityData['message'] = ' Receipt created ';
      // const recent =
      //   await RecentAcivityService.addTransactionRecentActivity(
      //     recentActivityData
      //   );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Receipt service createReceipt Error:', err);
    next(err);
  }
  return result;
};

const generatReceiptNumber = async (documentType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if(currentDate.getMonth()>=3){
      fyYear = year + 1;
  }
  else {
      fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentReceipt = await ReceiptDao.getRecentReceipt(
    documentType,
    outletCode,
    currentYear
  );
  if (recentReceipt) {
    const lastNumber = recentReceipt.doc_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const listReceipts = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await ReceiptDao.listReceipts(reqData, user);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Receipt service listReceipts', err);
    next(err);
  }
};

const listOldDmsReceipts = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await ReceiptDao.listOldDmsReceipts(reqData, user);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Receipt service listReceipts', err);
    next(err);
  }
};

const getReceipt = async (id, user) => {
  const resultList = [];
  try {
    const data = await ReceiptDao.getReceipt(id, user);
    return data;
  } catch (err) {
    logger.error('Receipt service getReceipt', err);
    next(err);
  }
};

const getReceiptPdf = async (id, outlet) => {
  const resObj = {};
  const outletObj = {};
  const receiptObj = {}; 
  try {
    const data = await ReceiptDao.getReceiptPdf(id);


    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    let firstName = data.customer?.dataValues?.decryptedFirstName;
    let lastName = data.customer?.dataValues?.decryptedLastName ? data.customer?.dataValues?.decryptedLastName: '';

    (outletObj['name'] = outlet.outletCode),
      (outletObj['address'] = outlet.address1),
      (outletObj['city'] = outlet.city),
      (outletObj['state'] = outlet.state),
      (outletObj['pincode'] = outlet.pincode),
      (outletObj['phone'] = outlet.phoneNumber),
      (outletObj['mobile'] = outlet.phoneNumber),
      (outletObj['email'] = outlet.email),
      (outletObj["outletName"] = outlet.outletName),
      (outletObj['dealerGstin'] = outlet.gstIn);

    const companyId = outlet.companyId;
    let companyName = '';

    if (companyId) {
      const companyData = await Company.findOne({
        where: { id: companyId },
        attributes: ['name']
      });
      if (companyData) {
        companyName = companyData.name;
      }
    }

   (outletObj['companyName'] = companyName);

    resObj['branch'] = outletObj;

    receiptObj['bisUnit'] = outlet.outletCode;
    receiptObj['receiptNo'] = data.doc_no;
    receiptObj['customerCode'] = data.customer_code;
    receiptObj['customerName'] = firstName + ' ' + lastName;
    receiptObj['recivedFrom'] =
      data.customer?.address1 +
      ',' +
      data.customer?.address2 +
      ',' +
      data.customer?.city +
      ',' +
      data.customer?.state +
      ',' +
      data.customer?.pinCode;
    receiptObj['receiptDate'] = formattedDate;
    receiptObj['mode'] = data.mode_of_payment;
    receiptObj['amount'] = data.amount;
    receiptObj['amountInWords'] = numberToWords
      .toWords(data.amount)
      .toUpperCase();

    if (data.mode_of_payment === 'Cash') {
      receiptObj['invoiceNo'] = '-';
      receiptObj['cheque_draft_number'] = '-';
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = '-';
      receiptObj['cheque_draft_date'] = '-';
    } else if (data.mode_of_payment === 'Cheque') {
      receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
      receiptObj['cheque_draft_number'] = data.cheque_draft_number;
      receiptObj['drawnOn'] = data.drawn_on;
      receiptObj['bankName'] = data.utr_bank_name;
      receiptObj['cheque_draft_date'] = data.cheque_draft_date;
    } else if (data.mode_of_payment === 'Upi' || data.mode_of_payment === 'NEFT' || data.mode_of_payment === 'Razor Pay') {
      receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
      receiptObj['cheque_draft_number'] = data.transaction_number;
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = data.utr_bank_name;
      receiptObj['cheque_draft_date'] = '-';
    } else if (data.mode_of_payment === 'Credit Card') {
      receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
      receiptObj['cheque_draft_number'] = data.cardNumber ? data.cardNumber : null;
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = data.utr_bank_name;
      receiptObj['cheque_draft_date'] = '-';
    }else {
      receiptObj['invoiceNo'] = '-';
      receiptObj['cheque_draft_number'] = data.transaction_number;
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = '-';
      receiptObj['cheque_draft_date'] = '-';
    }
    resObj['receipt'] = receiptObj;
    return resObj;
  } catch (err) {
    logger.error('Receipt service getReceiptPdf', err);
    next(err);
  }
};

// const getOldDmsReceiptPdf = async (id, outlet) => {
//   const resObj = {};
//   const outletObj = {};
//   const receiptObj = {}; 
//   try {
//     const data = await ReceiptDao.getOldDmsReceiptPdf(id);
// console.log("getOldDmsReceiptPdf data", data);

//     const currentDate = new Date();
//     const day = String(currentDate.getDate()).padStart(2, '0');
//     const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
//     const year = currentDate.getFullYear();
//     const formattedDate = `${day}/${month}/${year}`;

//     let firstName = data.customer?.dataValues?.decryptedFirstName;
//     let lastName = data.customer?.dataValues?.decryptedLastName ? data.customer?.dataValues?.decryptedLastName: '';

//     (outletObj['name'] = outlet.outletCode),
//       (outletObj['address'] = outlet.address1),
//       (outletObj['city'] = outlet.city),
//       (outletObj['state'] = outlet.state),
//       (outletObj['pincode'] = outlet.pincode),
//       (outletObj['phone'] = outlet.phoneNumber),
//       (outletObj['mobile'] = outlet.phoneNumber),
//       (outletObj['email'] = outlet.email),
//       (outletObj["outletName"] = outlet.outletName),
//       (outletObj['dealerGstin'] = outlet.gstIn);

//     resObj['branch'] = outletObj;

//     receiptObj['bisUnit'] = outlet.outletCode;
//     receiptObj['receiptNo'] = data.doc_no;
//     receiptObj['customerCode'] = data.customer_code;
//     receiptObj['customerName'] = firstName + ' ' + lastName;
//     receiptObj['recivedFrom'] =
//       data.customer?.address1 +
//       ',' +
//       data.customer?.address2 +
//       ',' +
//       data.customer?.city +
//       ',' +
//       data.customer?.state +
//       ',' +
//       data.customer?.pinCode;
//     receiptObj['receiptDate'] = formattedDate;
//     receiptObj['mode'] = data.mode_of_payment;
//     receiptObj['amount'] = data.amount;
//     receiptObj['amountInWords'] = numberToWords
//       .toWords(data.amount)
//       .toUpperCase();

//     if (data.mode_of_payment === 'Cash') {
//       receiptObj['invoiceNo'] = '-';
//       receiptObj['cheque_draft_number'] = '-';
//       receiptObj['drawnOn'] = '-';
//       receiptObj['bankName'] = '-';
//       receiptObj['cheque_draft_date'] = '-';
//     } else if (data.mode_of_payment === 'Cheque') {
//       receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
//       receiptObj['cheque_draft_number'] = data.cheque_draft_number;
//       receiptObj['drawnOn'] = data.drawn_on;
//       receiptObj['bankName'] = '-';
//       receiptObj['cheque_draft_date'] = data.cheque_draft_date;
//     } else {
//       receiptObj['invoiceNo'] = '-';
//       receiptObj['cheque_draft_number'] = data.transaction_number;
//       receiptObj['drawnOn'] = '-';
//       receiptObj['bankName'] = '-';
//       receiptObj['cheque_draft_date'] = '-';
//     }
//     resObj['receipt'] = receiptObj;

//     return resObj;
//   } catch (err) {
//     logger.error('Receipt service getReceiptPdf', err);
//     next(err);
//   }
// };


const getOldDmsReceiptPdf = async (id) => {
  const resObj = {};
  const outletObj = {};
  const receiptObj = {};

  try {
    const data = await ReceiptDao.getOldDmsReceiptPdf(id);

    // console.log("getOldDmsReceiptPdf data", data);

    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // customer details
    const firstName = data["customerwithcode.decryptedFirstName"] || "";
    const lastName = data["customerwithcode.decryptedLastName"] || "";

    // outlet details
    outletObj.name = data["outletdetails.outletCode"] || "";
    outletObj.address = data["outletdetails.address1"] || "";
    outletObj.city = data["outletdetails.city"] || "";
    outletObj.state = data["outletdetails.state"] || "";
    outletObj.pincode = data["outletdetails.pincode"] || "";
    outletObj.phone = data["outletdetails.phoneNumber"] || "";
    outletObj.mobile = data["outletdetails.phoneNumber"] || "";
    outletObj.email = data["outletdetails.email"] || "";
    outletObj.outletName = data["outletdetails.outletName"] || "";
    outletObj.dealerGstin = data["outletdetails.gstIn"] || "";

    const companyId = data["outletdetails.companyId"];
    let companyName = '';

    if (companyId) {
      const companyData = await Company.findOne({
        where: { id: companyId },
        attributes: ['name']
      });
      if (companyData) {
        companyName = companyData.name;
      }
    }

   (outletObj['companyName'] = companyName);


    resObj.branch = outletObj;

    // receipt details
    receiptObj.bisUnit = data["outletdetails.outletCode"] || "";
    receiptObj.receiptNo = data.doc_no;
    receiptObj.customerCode = data.customer_code;
    receiptObj.customerName = `${firstName} ${lastName}`.trim();

    receiptObj.recivedFrom =
      (data["customerwithcode.address1"] || "") +
      "," +
      (data["customerwithcode.address2"] || "") +
      "," +
      (data["customerwithcode.city"] || "") +
      "," +
      (data["customerwithcode.state"] || "") +
      "," +
      (data["customerwithcode.pinCode"] || "");

    receiptObj.receiptDate = formattedDate;
    receiptObj.mode = data.mode_of_payment;
    receiptObj.amount = data.amount;
    receiptObj.amountInWords = numberToWords.toWords(data.amount).toUpperCase();

    // payment conditions
    if (data.mode_of_payment === "Cash") {
      receiptObj.invoiceNo = "-";
      receiptObj.cheque_draft_number = "-";
      receiptObj.drawnOn = "-";
      receiptObj.bankName = "-";
      receiptObj.cheque_draft_date = "-";
    } else if (data.mode_of_payment === "Cheque") {
      receiptObj.invoiceNo = `${data.jc_number}/${data.ref_no || "-"}`;
      receiptObj.cheque_draft_number = data.cheque_draft_number;
      receiptObj.drawnOn = data.drawn_on;
      receiptObj.bankName = data.utr_bank_name || "-";
      receiptObj.cheque_draft_date = data.cheque_draft_date;
    } else if (data.mode_of_payment === 'Upi' || data.mode_of_payment === 'NEFT' || data.mode_of_payment === 'Razor Pay') {
      receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
      receiptObj['cheque_draft_number'] = data.transaction_number;
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = data.utr_bank_name;
      receiptObj['cheque_draft_date'] = '-';
    } else if (data.mode_of_payment === 'Credit Card') {
      receiptObj['invoiceNo'] = data.jc_number + '/' + data.ref_no;
      receiptObj['cheque_draft_number'] = data.cardNumber ? data.cardNumber : null;
      receiptObj['drawnOn'] = '-';
      receiptObj['bankName'] = data.utr_bank_name;
      receiptObj['cheque_draft_date'] = '-';
    }else {
      receiptObj.invoiceNo = "-";
      receiptObj.cheque_draft_number = data.transaction_number;
      receiptObj.drawnOn = "-";
      receiptObj.bankName = data.utr_bank_name || "-";
      receiptObj.cheque_draft_date = "-";
    }

    resObj.receipt = receiptObj;

    return resObj;
  } catch (err) {
    logger.error("Receipt service getReceiptPdf", err);
    throw err;
  }
};
const ReceiptService = {
  createReceipt,
  listReceipts,
  getReceipt,
  getOldDmsReceiptPdf,
  createOldDmsReceipt,
  listOldDmsReceipts,
  getReceiptPdf,
};

export default ReceiptService;
