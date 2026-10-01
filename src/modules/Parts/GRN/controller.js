import GrnService from './service.js';
import POService from '../PurchaseOrder/service.js';
import StockTransferService from '../stockTransfer/service.js';
import logger from '../../../config/logger.js';
import excel from 'exceljs';
import GateinService from '../gateIn/service.js';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import commonLogic from '../../../shared/commonLogics.js';
import OracleAutoGrnService from '../stockTransferOracle/service.js';
import PdfUtility from '../../../shared/pdfUtility.js';
import axios from 'axios';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';
const finishedPromise = promisify(finished);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const logoPath = path.join(__dirname, '..', '..','..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..','..' ,'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');
// Helper functions to format data..
//  later will store this functions into separated file to reduce line of codes here
const formatSalesData = (salesData) => {
  return salesData.map((item) => ({
    "Branch": item.outletCode,
    "Invoice No": item.bill_no,
    "Invoice Date": formatDate(item.createdAt),
    "Job Card No": item.jobcard_no,
    "Job Card Date": formatDate(item.customer_arrived_date),
    "Job Card Status": item.status_value,
    "Customer Code": item.customer_code,
    "Customer Name": item.customer_name,
    "GSTIN": item.customer_gstin,
    "Insurance GSTIN": ' ',
    "Bill Type": ' ',
    "Vehicle Number": item.reg_no,
    "Make": item.makeName,
    "Model": item.modelName,
    "Part Code": item.item_code,
    "Part Name": item.item_name,
    "HSN": item.hsnCode,
    "Parts Category": item.itemCategorie,
    "Parts Aggregate": item.aggregateName,
    "Sub Aggregate": item.subAggregateName,
    "Spare Qty": item.quantity,
    "Unit Sale Rate": item.rate,
    "Total Sale Amount": item.rate * item.quantity,
    "Discount Given": item.discount,
    "Nett Sale Amount": (item.rate * item.quantity) - item.discount,
    "CGST%": item.cgst,
    "CGST": (((item.rate * item.quantity) - item.discount) * item.cgst) / 100,
    "SGST%": item.sgst,
    "SGST": (((item.rate * item.quantity) - item.discount) * item.sgst) / 100,
    "IGST%": item.igst,
    "IGST": (((item.rate * item.quantity) - item.discount) * item.igst) / 100,
    "Total Tax": ((((item.rate * item.quantity) - item.discount) * item.cgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.sgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.igst) / 100),
    "Invoice Amount": commonLogic.calculateTotalInvoiceAmount(item),
    "IRN Number": ' ',
    "InvoiceAckNo Number": ' ',
    "InvoiceAck Date": ' ',
    "Remarks": ' ',
    "Ref No": ' ',
    "Email":item.customer_email
  }));
};

const formatCounterSalesData = (counterSalesData) => {
  return counterSalesData.map((item) => ({
    "Branch": item.outletCode,
    "Invoice No": item.invoice_number,
    "Invoice Date": formatDate(item.createdAt),
    "Job Card No": ' ',
    "Job Card Date": ' ',
    "Job Card Status": 'Counter Sale',
    "Customer Code": item.customer_code,
    "Customer Name": item.customer_name,
    "GSTIN": item.customer_gstin,
    "Insurance GSTIN": ' ',
    "Bill Type": ' ',
    "Vehicle Number": " ",
    "Make": item.makeName,
    "Model": item.modelName,
    "Part Code": item.itemCode,
    "Part Name": item.itemName,
    "HSN": item.hsnCode,
    "Parts Category": item.itemCategorie,
    "Parts Aggregate": item.aggregateName,
    "Sub Aggregate": item.subAggregateName,
    "Spare Qty": item.quantity,
    "Unit Sale Rate": item.rate,
    "Total Sale Amount": item.rate * item.quantity,
    "Discount Given": item.discount,
    "Nett Sale Amount": (item.rate * item.quantity) - item.discount,
    "CGST%": item.cgst,
    "CGST": (((item.rate * item.quantity) - item.discount) * item.cgst) / 100,
    "SGST%": item.sgst,
    "SGST": (((item.rate * item.quantity) - item.discount) * item.sgst) / 100,
    "IGST%": item.igst,
    "IGST": (((item.rate * item.quantity) - item.discount) * item.igst) / 100,
    "Total Tax": ((((item.rate * item.quantity) - item.discount) * item.cgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.sgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.igst) / 100),
    "Invoice Amount": commonLogic.calculateTotalInvoiceAmount(item),
    "IRN Number": ' ',
    "InvoiceAckNo Number": ' ',
    "InvoiceAck Date": ' ',
    "Remarks": ' ',
    "Ref No": ' '
  }));
};

const formatCounterSalesReturnData = (counterSalesReturnData) => {
  return counterSalesReturnData.map((item) => ({
    "Branch": item.outletCode,
    "Invoice No": item.invoice_number,
    "Invoice Date": formatDate(item.createdAt),
    "Job Card No": ' ',
    "Job Card Date": ' ',
    "Job Card Status": 'Return Counter Sale',
    "Customer Code": item.customerCode,
    "Customer Name": `${item.firstName} ${item.lastName}`,
    "GSTIN": item.gstinNumber,
    "Insurance GSTIN": ' ',
    "Bill Type": ' ',
    "Vehicle Number": " ",
    "Make": item.makeName,
    "Model": item.modelName,
    "Part Code": item.itemCode,
    "Part Name": item.itemName,
    "HSN": item.hsnCode,
    "Parts Category": item.itemCategorie,
    "Parts Aggregate": item.aggregateName,
    "Sub Aggregate": item.subAggregateName,
    "Spare Qty": item.quantity,
    "Unit Sale Rate": Number(`-${item.rate}`),
    "Total Sale Amount": Number(`-${item.rate * item.quantity}`),
    "Discount Given": item.discount,
    "Nett Sale Amount": Number(`-${(item.rate * item.quantity) - item.discount}`),
    "CGST%": item.cgst,
    "CGST": Number(`-${(((item.rate * item.quantity) - item.discount) * item.cgst) / 100}`),
    "SGST%": item.sgst,
    "SGST": Number(`-${(((item.rate * item.quantity) - item.discount) * item.sgst) / 100}`),
    "IGST%": item.igst,
    "IGST": Number(`-${(((item.rate * item.quantity) - item.discount) * item.igst) / 100}`),
    "Total Tax": Number(`-${((((item.rate * item.quantity) - item.discount) * item.cgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.sgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.igst) / 100)}`),
    "Invoice Amount": Number(`-${commonLogic.calculateTotalInvoiceAmount(item)}`),
    "IRN Number": ' ',
    "InvoiceAckNo Number": ' ',
    "InvoiceAck Date": ' ',
    "Remarks": ' ',
    "Ref No": ' ',


  }));
};

// Utility functions
const formatDate = (date) => {
  const d = new Date(date).toISOString();
  return `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`;
};

const CreateGrn = async (req, res, next) => {
  const body = req.body;
  // console.log(body, "body")
  let GRN_data = {};
  let GRN_Parts_data = {};
  let GRN_Stocks_data;
  let GateIn_data = {};
  let stock_transfer_data = {};
  let stockadjustmentdata={}
  let stockadjustmentpartdata={}
  let Bindata={}
  let poData={}
  let poPartsData={} 
  try {
    GRN_data = await GrnService.CreateGrn(body.grndata, req.user);
    GRN_Parts_data = await GrnService.CreateGrnParts(body.grnparts, GRN_data,body.type,req.user);
   
    
    if(body.type==="DirectGrn" || body.type==="FocusGrn"){
      GRN_Stocks_data = await GrnService.CreateGrnStocksForDirectGrn(
      GRN_data,
      GRN_Parts_data,
      req.user,
      body.bindata
    );
      
    }
    else if(body.type === 'GateinGrn'){
 GRN_Stocks_data = await GrnService.CreateGrnStocksFOrGatein(
      body.grnparts,
      GRN_data,
      GRN_Parts_data,
      req.user
    );
    let gateindata = { status: 5 }
      let gateinid = req.body.grndata.gatein_id
      GateIn_data = await GateinService.updateGatein(gateinid, gateindata, req.user);
    }
    else{
      GRN_Stocks_data = await GrnService.CreateGrnStocks(
      body.grnparts,
      GRN_data,
      GRN_Parts_data,
      req.user
    );
    }
    if (body.type === 'StockTransferGRN') {
      stock_transfer_data = await StockTransferService.UpdateStockTransferStatus(body.id);
    }

   if(body.type === 'adj'){
    stockadjustmentdata = await GrnService.CreateStockAdjustment(GRN_data,body.grand_total,req.user);
    stockadjustmentpartdata=await GrnService.CreateStockAdjustmentParts(GRN_Parts_data,stockadjustmentdata)
   }
if(body.grndata.po_id){
    poPartsData = await POService.updatePOPartsStatus(body.grnparts, req.user);
      poData = await POService.updatePOStatus(body.grndata.po_id, req.user);
    }

console.log(poPartsData,poData,"po data")
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn Created Successfully',
      // data: {
      //   GRNData: GRN_data,
      //   GRNPartsData: GRN_Parts_data,
      //   GRNStocksData: GRN_Stocks_data,
      //   GateIn_data,
      //   StockTransferData: stock_transfer_data,
      //   stockadjustmentdata,
      //   stockadjustmentpartdata,
      //   Bindata
      // },
    });
  } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};

const CreateOracleStockTransferGrn = async (req, res, next) => {
  const body = req.body;
  // console.log(body, "body")
  let GRN_data = {};
  let GRN_Parts_data = {};
  let GRN_Stocks_data;
  let GateIn_data = {};
  let OracleStockTransfer_data = {};
  let OracleStockTransferParts_data = {};
  let Bindata={}
  let OracleAcknowledgrment_data = {};
  try {
    GRN_data = await GrnService.CreateGrn(body.grndata, req.user);
    GRN_Parts_data = await GrnService.CreateOracleGrnParts(body.grnparts, GRN_data,body.type);
    GRN_Stocks_data = await GrnService.CreateOracleGrnStocks(
      body.grnparts,
      GRN_data,
      GRN_Parts_data,
      req.user
    );
      let gateindata = { status: 5 }
      let gateinid = req.body.grndata.gatein_id
      GateIn_data = await GateinService.updateGatein(gateinid, gateindata, req.user);
      Bindata=await GateinService.UpdateGateinBinLocation(GRN_Parts_data)
      OracleStockTransfer_data = await OracleAutoGrnService.updateOracleStockTransfer(body.oracle_stocktransfer_id, GRN_data.id);
      OracleStockTransferParts_data = await OracleAutoGrnService.updateOracleStockTransferParts(GRN_Parts_data);
      OracleAcknowledgrment_data = await OracleAutoGrnService.acknowledgeOracle(body.oracle_stocktransfer_id, GRN_data);
      return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn Created Successfully',
      // data: {
      //   GRNData: GRN_data,
      //   GRNPartsData: GRN_Parts_data,
      //   GRNStocksData: GRN_Stocks_data,
      //   GateIn_data,
      //   Bindata,
      //   OracleStockTransfer_data,
      //   OracleStockTransferParts_data
      // },
    });
  } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};

const CreateGrnDocument = async (req, res, next) => {
  let data = {};
  try {
    data = await GrnService.CreateGrnDocument(req);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn document Created Successfully',
      data: data,
    });
  } catch (err) {
    logger.error('Grn document Contrller Error:', err);
    next(err);
  }
};

const GetGrnDocuments = async (req, res, next) => {
  let data = {};
  try {
    data = await GrnService.GetGrnDocuments(req);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn Documents data Fetched Successfully ',
      data: data,
    });
  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
};

const GetGrns = async (req, res, next) => {
  try {
    let { grnDetails: data, count } = await GrnService.getGrnDetailsWithGrandTotal(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const date = new Date(item.dataValues.invoice_date).toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      return ({
        ...item.dataValues, invoice_date: dateformat
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Grn Documents data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GenerateGrnPdf = async (req, res, next) => {
  let data = {}
  let grnDetails = {}
  let user = req.user
  try {
    data = await GrnService.generategrnpdf(req.body,);
    console.log(data, "data")
    grnDetails["outlet_name"] = user.outlet.outletName
        grnDetails["outlet_address1"] = user.outlet.address1
    // grnDetails["address"] = user.outlet.address1
    grnDetails["outlet_address2"] = user.outlet.address2
    grnDetails["outlet_city"] = user.outlet.city + "," + user.outlet.state + "," + user.outlet.pincode
    // grnDetails["city"] = user.outlet.city + "," + user.outlet.state + "," + user.outlet.pincode
    // grnDetails["mobile"]=user.outlet.phoneNumber
    grnDetails["outlet_gst"] = user.outlet.gstIn
    grnDetails["branch"] = user.outlet.outletCode
   
//     const firstGrn = JSON.parse(JSON.stringify(data[0] || {}));
//        function numberToWordsIndian(num) {
//     if (num === 0) return 'zero';

//     const belowTwenty = [
//         'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
//         'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
//     ];
//     const tens = [
//         'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
//     ];
//     const scales = [
//         '', 'thousand', 'lakh', 'crore'
//     ];

//     function helper(n) {
//         if (n === 0) return '';
//         if (n < 20) return belowTwenty[n - 1] + ' ';
//         if (n < 100) return tens[Math.floor(n / 10) - 2] + ' ' + helper(n % 10);
//         if (n < 1000) return belowTwenty[Math.floor(n / 100) - 1] + ' hundred ' + (n % 100 !== 0 ? 'and ' : '') + helper(n % 100);
//     }

//     function convertWholeNumber(n) {
//         let word = '';
//         let scaleIndex = 0;

//         while (n > 0) {
//             let chunk;
//             if (scaleIndex === 0) {
//                 // First segment (thousands), handle 3 digits
//                 chunk = n % 1000;
//                 n = Math.floor(n / 1000);
//             } else {
//                 // Lakhs and Crores, handle 2 digits
//                 chunk = n % 100;
//                 n = Math.floor(n / 100);
//             }

//             if (chunk !== 0) {
//                 word = helper(chunk) + scales[scaleIndex] + ' ' + word;
//             }

//             scaleIndex++;
//         }

//         return word.trim();
//     }

//     // Separate the rupees and paisa
//     const rupees = Math.floor(num);
//     const paisa = Math.round((num - rupees) * 100);

//     let result = '';
//     if (rupees > 0) {
//         result += convertWholeNumber(rupees) + ' rupees ';
//     }

//     if (paisa > 0) {
//         result += 'and ' + convertWholeNumber(paisa) + ' paisa';
//     }

//     return result.trim();
// }


// const amountInWords = numberToWordsIndian(firstGrn.pdf_total+firstGrn.frieght_charges+firstGrn.mis_charges);
// const templateData = {
//   firstGrn:firstGrn,
//   nettotal:firstGrn.pdf_total+firstGrn.frieght_charges+firstGrn.mis_charges,
//   // optionally:
//   grnvendormap: firstGrn.grnvendormap,
//   grnparts: firstGrn.grnparts,
//   outlet:grnDetails,
//   podetails:firstGrn.pogrnmap,
//   'base64Logo' : base64Logo,
//   'kiBase64Logo': kiBase64Logo,
//   amountInWords
//   // add other necessary nested fields
// };
// console.log(templateData,"tempdatta")
//       const pdfBuffer = await PdfUtility.generatePDF('grn', templateData);
//         if (pdfBuffer) {
//             // auditData.result = "success";

//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', 'attachment; filename="casualGatePass.pdf"');
//             res.send(pdfBuffer);
//         } else {
//             // auditData.result = "failed";
//             res.status(500).send('Failed to generate PDF');
//         }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Grn pdf data Fetched Successfully ",
      data: data,
      outlet_details: grnDetails
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetGrnDataForReturn = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getGrnDetailsForReturn(req.body, req.user);
    console.log(data[0].grnparts, "data")
    const stockdata = data[0]?.grnparts.map((item) => {
      const stockmapdata=item.grnpartsstocksmap[0]

      return({
      'id': stockmapdata.id,
      'Parts Code': stockmapdata.item_code,
      'Description': stockmapdata.item_description,
      'Available Qty': stockmapdata.quantity,
      "Rate":Number(stockmapdata?.rate.toFixed(2)),
      "MRP":stockmapdata.mrp,
      'Cost': Number(stockmapdata?.cost.toFixed(2)),
      'CGST': stockmapdata.cgst,
      'SGST': stockmapdata.sgst,
      'IGST': stockmapdata.igst,
      "item_id":stockmapdata.item_id,
      "grn_parts_id":stockmapdata.grn_parts_id,
      "Discount":item.discount
    })})
    const vendor_name = data[0].grnvendormap.vendorName
    const vendor_id=data[0].grnvendormap.id
    const grnid = data[0].dataValues.id
    return res.status(200).json({
      requestSuccessful: true,
      message: "Grn return data Fetched Successfully ",
      vendorName: vendor_name,
      vendor_id,
      grnid,
      data: stockdata
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const CreatePurchaseReturn = async (req, res, next) => {
  const body = req.body;
  let PurchaseReturnData = {};
  let PurchaseReturnPartsData = {};
  let Stocks_data;
  try {
    PurchaseReturnData = await GrnService.CreatePurchaseReturn(body.purchaseReturnData, req.user);
    PurchaseReturnPartsData = await GrnService.CreatePurchaseReturnParts(body.purchaseReturnPartsData, PurchaseReturnData);
    Stocks_data = await GrnService.Updatestock(
      body.purchaseReturnPartsData,
    );
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Purchase Return Created Successfully',
      // data: {
      //   PurchaseReturnData: PurchaseReturnData,
      //   PurchaseReturnPartsData: PurchaseReturnPartsData,
      //   StocksData: Stocks_data,
      // },
    });
  } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};

const GetPurchaseReturn = async (req, res, next) => {
  try {
    let { purchaseReturnDetails: data, count } = await GrnService.getPurchaseReturnDetailsWithGrandTotal(req.body, req.user);
    console.log(data, "data")
    return res.status(200).json({
      requestSuccessful: true,
      message: "purchase return data Fetched Successfully ",
      data: data,
      count
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetQuickItemSearch = async (req, res, next) => {
  let formattedData = []
  try {
    let { result: data, count } = await GrnService.getQuickitemSearch(req.body, req.user);
    console.log(data, "data")
    formattedData = await data?.map(part => ({
      grn_no: part.grn_no,
      invoice_number: part.invoice_number,
      invoice_date: part.invoice_date,
      item_code: part.item_code,
      item_description: part.item_description,
      rate: part.rate,
      cost: part.cost,
      mrp: part.mrp,
      quantity: part.quantity || 0,
      value: Number((part.cost * (part.quantity || 0)).toFixed(2))
    })
    );
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: formattedData,
      count
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}
const getPartsForCounterSale = async (req, res, next) => {
  const resultList = [];
  try {
    let data = await GrnService.getPartsForCounterSale(req.body, req.user);
    console.log(data, "data")
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['itemCode'] = element.itemCode;
      resObj['itemName'] = element.itemName;
      resObj['itemDescription'] = element.itemDescription;
      resObj['hsnCode'] = element.hsnCode;
      resObj['quantity'] = element.quantity
      resObj['rate'] = element.rate;
      resObj['mrp'] = element.mrp;
      resObj['cost'] = element.cost;
      if (
        req.body.customerState.toLowerCase() === req.user.outlet.state.toLowerCase()
      ) {
        resObj['sgst'] = element.taxPercentage / 2;
        resObj['cgst'] = element.taxPercentage / 2;
        resObj['igst'] = 0;
      } else {
        resObj['sgst'] = 0;
        resObj['cgst'] = 0;
        resObj['igst'] = element.taxPercentage;
      }

      resultList.push(resObj);
    }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: resultList
    });

  } catch (err) {
    logger.error('items Contrller Error:', err);
    next(err);
  }
}
const GetPurchaseReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getPurchaseReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = data.map((item) => {
      const date = new Date(item.invoice_date).toISOString()
      const createdDate = (item.createdAt).toISOString()

      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue =Number(((item.cost * item.quantity) - item.discount).toFixed(2))
      const cgst = Number(((totaltaxablevalue * item.cgst) / 100).toFixed(2))
      const sgst = Number(((totaltaxablevalue * item.sgst) / 100).toFixed(2))
      const igst = Number(((totaltaxablevalue * item.igst) / 100).toFixed(2))
      const totaltax = cgst + sgst + igst
      return (
        {
          "Branch": req.user.outlet.outletCode,
          "GRN Date": createddateformat,
          "GRN Number": item.grn_no,
          "Supplier Code": item.vendor_code,
          "Supplier Name": item.vendorName,
          "GSTIN": item.gstin,
          "Supplier City": item.city,
          "Supplier Inv No": item.invoice_number,
          "Supplier Inv Date": dateformat,
          "Item Code": item.item_code,
          "Item Name": item.item_description,
          "HSN Code": item.hsnCode,
          "UOM": item.uomType,
          "Qty": item.quantity,
          "Unit Cost[Before Disc]": item.cost,
          "Unit Sale Rate": item.rate,
          "MRP": item.mrp,
          "Discount": item.discount,
          "Total Taxable Value": totaltaxablevalue,
          "Unit Cost [After Disc]": item.cost - (item.discount / item.quantity),
          "CGST %": item.cgst,
          "CGST": cgst,
          "SGST %": item.sgst,
          "SGST": sgst,
          "IGST %": item.igst,
          "IGST": igst,
          "Total Tax": totaltax,
          "Total Amount": totaltaxablevalue + totaltax,
          "Parts Category": item.itemCategorie,
          "Parts Aggregate": item.aggregateName,
          "Sub Aggregate": item.subAggregateName,
          "Make": item.makeName,
          "Model": item.modelName
        }
      )
    })

    const filepath = path.join(__dirname, "PurchaseReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Purchase Report");


    const headers = ["SL NO", ...Object.keys(responsedata[0])]

    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = responsedata.reduce((max, row) => {
        const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
        return Math.max(max, cellValue.length);
      }, header.length); // Start with the header length

      return {
        header,
        key: header.toLowerCase(),
        width: maxLength + 5, // Add some padding for better appearance
      };
    });

    //  Get the first row and apply styles 
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      headerRow.commit();
    }

    for (let i = 0; i < responsedata.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding

    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PurchaseReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });



  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}
const GetPurchaseAxaptaReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getPurchaseAxaptaReport(req.body, req.user);

    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = data.map((item) => {
      const date = new Date(item.invoice_date).toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createdDate = (item.createdAt).toISOString()
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
      let poCreateddateformat = "";
      if (item.po_createdAt) {
        const poDocDate = new Date(item.po_createdAt).toISOString();
        poCreateddateformat =poDocDate.slice(8, 10) + "-" +poDocDate.slice(5, 7) + "-" +poDocDate.slice(0, 4);
      }
      return (
        {
          "Branch": req.user.outlet.outletCode,
          "Doc Date": createddateformat,
          "Document Name": item.grn_no,
          "Supplier Code": item.vendor_code,
          "Supplier Name": item.vendorName,
          "GSTIN": item.gstin,
          "Supplier Inv No": item.invoice_number,
          "Supplier Inv Date": dateformat,
          "Total Purchase Value (cost*quantity)": item.total_purchase_value,
          "Frieght Charges": item.frieght_charges,
          "Misc. Charges": item.mis_charges,
          "CGST": item.cgst,
          "SGST": item.sgst,
          "IGST": item.igst,
          "Total Tax": item.total_tax,
          "Total Amount": item.total_amount,
          "Po Doc Name":item.po_number,
          "Po Doc Date":poCreateddateformat,
        }
      )
    })


    const filepath = path.join(__dirname, "PurchaseAxaptaReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Purchase Axapta Report");
    const headers = ["SL NO", ...Object.keys(responsedata[0])]

    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = responsedata.reduce((max, row) => {
        const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
        return Math.max(max, cellValue.length);
      }, header.length); // Start with the header length

      return {
        header,
        key: header.toLowerCase(),
        width: maxLength + 5, // Add some padding for better appearance
      };
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "11164b" },
      };
      cell.alignment = { horizontal: "center" };
    });

    for (let i = 0; i < responsedata.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding


    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SpareSalesAxapta.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetSpareSalesAxapta = async (req, res, next) => {

  let data = {}
  try {
    data = await GrnService.getSpareSalesAxapta(req.body, req.user);
    // console.log(data, "data");
    // console.log('length of data-----------', data.length)
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
  
    const responsedata = data.map((item) => { 
      const afterDiscAmount = item.total_spare_amount - item.total_discount_amount;
      // const totalCgst = afterDiscAmount * (item.total_cgst / 100); 
      // const totalSgst = afterDiscAmount * (item.total_sgst / 100); 
      // const totalIgst = afterDiscAmount * (item.total_igst / 100); 
      const totalTax = item.total_cgst + item.total_sgst + item.total_igst; 
      const totalInvoiceAmount = afterDiscAmount + totalTax; 
    
      return {  
        "Branch": item.outletName,
        "Invoice Date": item.billingDate,
        "Invoice No": item.bill_no,
        "Job Card No": item.job_card_no, 
        "Job Card Date": item.createdAt,
        "Customer Code": item.customer_code,
        "Customer Name": item.customer_name,
        "GSTIN": item.customer_gstin,
        "Spare Amount Gross": item.total_spare_amount,
        "Cash Discount": item.total_discount_amount,
        "Spare Amount (-Disc)": afterDiscAmount,
        "Taxable CGST": item.total_cgst.toFixed(2), 
        "Taxable SGST": item.total_sgst.toFixed(2), 
        "Taxable IGST": item.total_igst.toFixed(2), 
        "Total Tax": totalTax.toFixed(2),  
        "Invoice Amount": totalInvoiceAmount.toFixed(2),  
        "Foc Invoice Number": 'test',
        "Foc Invoice Amount": 'test',
        "Source": item.sourceName,
        "Service Type": item.serviceTypeName
      };
    });


    const filepath = path.join(__dirname, "SpareSalesAxapta.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Purchase Axapta Report");
    const headers = ["SL NO", ...Object.keys(responsedata[0])]

    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = responsedata.reduce((max, row) => {
        const cellValue = row[colIndex] ? row[colIndex] : ""; // Ensure value is string
        return Math.max(max, cellValue.length);
      }, header.length); 

      return {
        header,
        key: header.toLowerCase(),
        width: maxLength + 8,
      };
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "11164b" },
      };
      cell.alignment = { horizontal: "center" };
    });

    for (let i = 0; i < responsedata.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding


    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SpareSalesAxapta.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file..");
        fs.unlinkSync(filepath);
      });


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetStockTransferInwardReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getStockTransferInwardReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = data.map((item) => {
      const date = new Date(item.invoice_date).toISOString()
      const createdDate = (item.createdAt).toISOString()

      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.cost * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      return (
        {
          "Branch": req.user.outlet.outletCode,
          "GRN Date": createddateformat,
          "GRN Number": item.grn_no,
          "Supplier Code": item.vendor_code,
          "Supplier Name": item.vendorName,
          "GSTIN": item.gstin,
          "Supplier City": item.city,
          "Supplier Inv No": item.invoice_number,
          "Supplier Inv Date": dateformat,
          "Item Code": item.item_code,
          "Item Name": item.item_description,
          "HSN Code": item.hsnCode,
          "UOM": item.uomType,
          "Qty": item.quantity,
          "Unit Cost[Before Disc]": item.cost,
          "Unit Sale Rate": item.rate,
          "MRP": item.mrp,
          "Discount": item.discount,
          "Total Taxable Value": totaltaxablevalue,
          "Unit Cost [After Disc]": item.cost - (item.discount / item.quantity),
          "CGST %": item.cgst,
          "CGST": cgst,
          "SGST %": item.sgst,
          "SGST": sgst,
          "IGST %": item.igst,
          "IGST": igst,
          "Total Tax": totaltax,
          "Total Amount": totaltaxablevalue + totaltax,
          "Parts Category": item.itemCategorie,
          "Parts Aggregate": item.aggregateName,
          "Sub Aggregate": item.subAggregateName,
          "Make": item.makeName,
          "Model": item.modelName,
          "Po Doc Name":item.po_number,
          "Po Doc Date":item.po_createdAt
        }
      )
    })



    const filepath = path.join(__dirname, "StockTransferInwardReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Stock TransferInward Report");
    const headers = ["SL NO", ...Object.keys(responsedata[0])]

    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = responsedata.reduce((max, row) => {
        const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
        return Math.max(max, cellValue.length);
      }, header.length); // Start with the header length

      return {
        header,
        key: header.toLowerCase(),
        width: maxLength + 5, // Add some padding for better appearance
      };
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "11164b" },
      };
      cell.alignment = { horizontal: "center" };
    });

    for (let i = 0; i < responsedata.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding


    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=StockTransferInwardReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetPurchaseReturnReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getPurchaseReturnReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata =[]
    for(let item of data){
      
      const createdDate = (item.createdAt).toISOString()
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
      const invdate= item?.invoice_date?.slice(8, 10) + "-" + item?.invoice_date?.slice(5, 7) + "-" + item?.invoice_date?.slice(0, 4)
      const totaltaxablevalue = (item.cost * item.quantity)
      // - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
    let resobj= {
          "Branch": req.user.outlet.outletCode,
          "DOC Date": createddateformat,
          "GRN Number": item.grn_no,
          "DOC NUMBER": item.purchase_return_invoice_number,
          "Supplier Code": item.vendor_code,
          "Supplier Name": item.vendor_name,
          // "GSTIN": item.gstin,
          // "Supplier City": item.city,
          "Supplier Inv No": item.invoice_number,
          "Supplier Inv Date": invdate,
          "Item Code": item.item_code,
          "Item Name": item.item_description,
          // "HSN Code": item.hsnCode,
          // "UOM": item.uomType,
          "Return Qty": item.quantity,
          "Cost": item.cost,
          // "Unit Sale Rate": item.rate,
          // "MRP": item.mrp,
          // "Discount": item.discount,
          // "Total Taxable Value": totaltaxablevalue,
          // "Unit Cost [After Disc]": item.cost - (item.discount / item.quantity),
          "CGST %": item.cgst,
          "CGST": cgst,
          "SGST %": item.sgst,
          "SGST": sgst,
          "IGST %": item.igst,
          "IGST": igst,
          "Total Tax": totaltax,
          "Total Amount": totaltaxablevalue + totaltax,
          "Discount":item.discount
          // "Parts Category": item.itemCategorie,
          // "Parts Aggregate": item.aggregateName,
          // "Sub Aggregate": item.subAggregateName,
          // "Make": item.makeName,
          // "Model": item.modelName
        }
      responsedata.push(resobj)
    }

    const filepath = path.join(__dirname, "PurchaseReturnReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Purchase Return Report");
    const headers = ["SL NO", ...Object.keys(responsedata[0])]


    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = responsedata.reduce((max, row) => {
        const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
        return Math.max(max, cellValue.length);
      }, header.length); // Start with the header length

      return {
        header,
        key: header.toLowerCase(),
        width: maxLength + 5, // Add some padding for better appearance
      };
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "11164b" },
      };
      cell.alignment = { horizontal: "center" };
    });
    for (let i = 0; i < responsedata.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding

    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PurchaseReturnReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetSalesReport = async (req, res, next) => {
  let salesData = [];
  let counterSalesData = [];
  let counterSalesReturnData = [];

  try {
    salesData = await GrnService.getSalesReport(req.body, req.user);
    counterSalesData = await GrnService.getCounterSalesReport(req.body, req.user);
    counterSalesReturnData = await GrnService.getCounterSaleReturnData(req.body, req.user);

    // console.log(" SQL data fetched from backend...");

    if (!salesData.length && !counterSalesData.length && !counterSalesReturnData.length) {
      return res.status(404).json({ message: "No records found for given date range" });
    }

    const mergedData = [
      ...formatSalesData(salesData),
      ...formatCounterSalesData(counterSalesData),
      ...formatCounterSalesReturnData(counterSalesReturnData)
    ];

    if (mergedData.length === 0) {
      return res.status(404).json({ message: "No data available for export" });
    }

    const filepath = path.join(__dirname, "Sales_Report.xlsx");
    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Sales Report");

    // Define header row (without adding it twice)
    const headers = ["SL NO", ...Object.keys(mergedData[0])];

    worksheet.columns = headers.map((header) => {
      const maxLength = mergedData.reduce((max, row) => {
        const cellValue = row[header] ? row[header].toString() : "";
        return Math.max(max, cellValue.length);
      }, header.length);

      return { header, key: header.toLowerCase(), width: maxLength + 5 };
    });

    //  Get the first row and apply styles (instead of adding a new row)
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      headerRow.commit();
    }


    for (let i = 0; i < mergedData.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(mergedData[i])]).commit();
    }

    await workbook.commit(); //  Ensure the file is fully written before proceeding

    res.setHeader("Content-Disposition", "attachment; filename=sales_Report.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });

  } catch (err) {
    console.error(" Error generating sales report:", err);
    res.status(500).json({ message: "Error generating report" });
  }
};
const GetStockAdjustmentSearch = async (req, res, next) => {
  let formattedData = []
  try {
    let { result: data } = await GrnService.stockadjustmentsearch(req.body, req.user);
    console.log(data,"result")
    formattedData = data.map(part => ({
      grn_no:part.grn_no,
      item_id:part.item_id,
     grnid:part.grnid,
     grnpartsid:part.grnpartsid,
      itemCode: part.itemCode,
      'itemName': part.item_description,
      'Rate': part.rate,
      'Cost': part.cost,
      'MRP': part.mrp,
    'CGST':part.cgst,
      "SGST":part.sgst,
      "IGST":part.igst,
      "Available Quantity": part.quantity,
      displayText:part.itemCode+"|"+part.item_description
    })
    );
    console.log(formattedData, "data")

    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: formattedData,
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}



const CreateNegStockAdjustment = async (req, res, next) => {
  const body = req.body;
  let adjustmentData = {};
  let adjustmentPartData = {};
  let Stocks_data;
  let Stock_log_data;
  try {
    adjustmentData = await GrnService.CreateNegStockAdjustment(body.adjdata, req.user);
    adjustmentPartData = await GrnService.CreateNegStockAdjustmentParts(body.adjpartsdata,adjustmentData);
    Stocks_data = await GrnService.NegAdjUpdatestock(adjustmentPartData);
    Stock_log_data = await GrnService.CreateNegStockAdjLog(Stocks_data);
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Negative Stock Adjustment Created Successfully',
      // data: {
      //   adjustmentData,
      //   adjustmentPartData,
      //   StocksData: Stocks_data,
      // },
    });
  } catch (error) {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    
  }
};

const GetStockAdjustment = async (req, res , next) => {   
  try{ 
   let {stockAdjDetails:data,count}= await GrnService.GetStockAdjustment(req.body,req.user);
   console.log(data,"data")
   const responsedata=data.map((item)=>{
    const date=new Date(item.dataValues.createdAt).toISOString()
    const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
    return(
      {invoiceNumber:item.dataValues.invoice_number,invoiceDate:dateformat,
        grandTotal:item.dataValues.grand_total
    }
  )
   })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Stock Adjustment data Fetched Successfully ",
      data:responsedata,
      count
  });
   
   } catch (err) {
       logger.error('Stock ADjustment Contrller Error:', err);
   next(err);
   }
   }

   const GetStockPositionReport = async (req, res, next) => {
    let data = {}
    try {
      data = await GrnService.getStockPositionReport(req.body, req.user);
      console.log(data, "data")
      if (!data || data.length === 0) {
        res.status(500).json({ message: "No records found for the given criteria." });
        return;
      }
      const responsedata = data.map((item) => {
        const date = new Date(item.invoice_date).toISOString()
        const createdDate = (item.createdAt).toISOString()
  
        const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
        const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
  
        const totaltaxablevalue = (item.cost * item.quantity) - item.discount
        const cgst = (totaltaxablevalue * item.cgst) / 100
        const sgst = (totaltaxablevalue * item.sgst) / 100
        const igst = (totaltaxablevalue * item.igst) / 100
        const totaltax = cgst + sgst + igst
        return (
          {
            "Branch": req.user.outlet.outletCode,
            "GRN Date": item?.old_supplier_date || createddateformat,
            "GRN Number": item.grn_no,
            "Supplier Code": item.vendor_code,
            "Supplier Name": item.vendorName,
            "GSTIN": item.gstin,
            "Supplier City": item.city,
            "Supplier Inv No": item.invoice_number,
            "Supplier Inv Date": dateformat,
            "Item Code": item.item_code,
            "Item Name": item.item_description,
            "HSN Code": item.hsnCode,
            "binLocation":item.binLocation,
            "Qty": item.quantity,
            "UOM": item.uomType,
            "Unit Cost[Before Disc]": item.cost,
            "Unit Sale Rate": item.rate,
            "MRP": item.mrp,
            "Discount": item.discount,
            "Total Taxable Value": totaltaxablevalue,
            "Unit Cost [After Disc]": item.cost - (item.discount / item.quantity),
            "CGST %": item.cgst,
            "CGST": cgst,
            "SGST %": item.sgst,
            "SGST": sgst,
            "IGST %": item.igst,
            "IGST": igst,
            "Total Tax": totaltax,
            "Total Amount": totaltaxablevalue + totaltax,
            "Parts Category": item.itemCategorie,
            "Parts Aggregate": item.aggregateName,
            "Sub Aggregate": item.subAggregateName,
            "Make": item.makeName,
            "Model": item.modelName,
            "Outlet Name":item.outlet_name,
            "Outlet State":item.outlet_state,
            "Outlet City":item.outlet_city
          }
        )
      })
  
      const filepath = path.join(__dirname, "PurchaseReport.xlsx");
  
      const workbook = new excel.stream.xlsx.WorkbookWriter({
        filename: filepath,
        useStyles: true,
        useSharedStrings: true,
      });
  
      const worksheet = workbook.addWorksheet("Purchase Report");
  
  
      const headers = ["SL NO", ...Object.keys(responsedata[0])]
  
      // Dynamically calculate and set column widths
      worksheet.columns = headers.map((header, colIndex) => {
        const maxLength = responsedata.reduce((max, row) => {
          const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
          return Math.max(max, cellValue.length);
        }, header.length); // Start with the header length
  
        return {
          header,
          key: header.toLowerCase(),
          width: maxLength + 5, // Add some padding for better appearance
        };
      });
  
      //  Get the first row and apply styles 
      const headerRow = worksheet.lastRow;
      if (headerRow) {
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
        headerRow.commit();
      }
  
      for (let i = 0; i < responsedata.length; i++) {
        await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
      }
      await workbook.commit(); //  Ensure the file is fully written before proceeding
  
      // Send File as Response
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=PurchaseReport.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      //  Wait until the file is completely written before reading
      fs.createReadStream(filepath)
        .pipe(res)
        .on("finish", () => {
          console.log(" File streamed successfulsly, deleting temporary file...");
          fs.unlinkSync(filepath);
        });
  
  
  
    } catch (err) {
      logger.error('Grn Contrller Error:', err);
      next(err);
    }
  }


  function autoParseNumericFields(part) {
    const parsed = {};
  
    for (const key in part) {
      const value = part[key];
      const num = parseFloat(value);
  
      parsed[key] = !isNaN(num) && value !== null ? num : value;
    }
  
    return parsed;
  }
  
  const mergeItemsBy_HSN_SameTaxPurhcaseReturn = async(parts)=> {
    const groupedItems = {};
  
    parts.forEach(part => {
      const hsnCode = part.hsnCode;
  
      if (!groupedItems[hsnCode]) {
        groupedItems[hsnCode] = [];
      }
  
      groupedItems[hsnCode].push(part);
    });
  
    return groupedItems;
  }
  

  const mergeItemsByHSNSameTax = async (parts) => {

    const items_by_hsn = {};
  
    parts.forEach(part => {
      const hsnCode = part?.items?.hsnCode;
  
      if (hsnCode) {
        if (items_by_hsn[hsnCode]) {
          items_by_hsn[hsnCode].push(part);
        } else {
         
          part.hsn_code = hsnCode;
          items_by_hsn[hsnCode] = [part];
        }
      }
    });
  
    return items_by_hsn;
 
    
  }

  const GetAPReport = async (req, res, next) => {

 
    let data = {};
    try {
      // Fetching the GRNs data from the service
      data = await GrnService.getAPreport(req.body, req.user);
      
      if (!data || data.length === 0) {
        res.status(500).json({ message: "No records found for the given criteria." });
        return;
      }

      // If no data or not an array, initialize as empty array to safely skip loop
      if (!Array.isArray(data) || data.length === 0) {
        data = []; // so the next loop doesn't crash
      }

      let POReturnData = {};
      const responsedata = [];
      POReturnData = await GrnService.getPOReturn(req.body, req.user);

      if (!Array.isArray(POReturnData) || POReturnData.length === 0) {
        POReturnData = []; // so the next loop doesn't crash
      }
     

      for (const item of data) {
        const accountingDate=item?.createdAt?.toISOString().slice(0,10)
        // Get branch details
        const cocofocobranch = await GrnService.getCocofocoBranch(item.outlet_id);
        const cocofocobranchUser = cocofocobranch?.get();
        // Get vendor details
        const vendor = await GrnService.getVendor(item.vendor_id);
        const vendorUser = vendor?.get();
        // Set LOB based on company ID
        let LOb = '';
        switch (cocofocobranchUser?.companyId) {
          case 2:
            LOb = '2041';
            break;
          case 5:
            LOb = '2042';
            break;
          case 4:
            LOb = '2062';
            break;
            case 7:
              LOb = '2062';
              break;
          default:
            LOb = '0000';
        }
  
        const suppliercode = vendorUser?.oracle_vendor_number || '';
        const supplierno = vendorUser?.vendor_site_code || '';
        const Location = cocofocobranchUser?.oracleLocation || '';
        // Split GRN number to extract branch name
        const getBranchNamePreg = item?.grn_no?.split('-');
        let branchName = '';

        if (getBranchNamePreg?.length === 3) {
          branchName = getBranchNamePreg[1].slice(0, -2); // Remove last 2 chars
        } else if (getBranchNamePreg?.length === 4) {
          branchName = getBranchNamePreg[2].slice(0, -2); // Remove last 2 chars
        }

        // Determine the entity based on company_id
        let entity = '';
       
        const companyId = cocofocobranchUser?.companyId;

        if (companyId === 2) {
          entity = 'COCO';
        } else if (companyId === 5) {
          entity = 'FOCO';
        } else if (companyId === 4) {
          entity = 'SMPL';
        }
        // Combine into description 
        const description = `${item.grn_no}:${item.invoice_number}:${branchName}:${entity}`;
        const grnParts = await GrnService.getGrnPartsByGrnId(item.id);
        console.log(grnParts,'test grn parts');    
        const poDetails = await GrnService.getPODetails(grnParts[0]?.dataValues.po_id);
        console.log(poDetails,"podetails")
        let formattedPoDate =null
        let poNumber=null
        if(Array.isArray(poDetails)&&poDetails.length>0){
        const po = poDetails[0];

          // Format date as dd-mm-yyyy
          formattedPoDate = po.createdAt?.toISOString().slice(0,10)
          poNumber=po.po_number
          console.log('PO Number:', po.po_number);
          console.log('PO Date:', formattedPoDate);
        }
        // Format created dates
        let purchaseValue = 0;
        let totsdss = 0;
        
        // this loop used for total amount of multi grnsparts or single 
        for (const grnPart of grnParts) {
          let discountAmount = 0;
          const {
            quantity = 0,
            cost = 0,
            discount = 0,          
            cgst = 0,
            sgst = 0,
            igst = 0,
            
          } = grnPart;
        
          // Calculate discount         
            discountAmount = discount;
          const taxableValue = (cost * quantity) - discountAmount;      
          const cgtax = (cgst * taxableValue) / 100;
          const sgtax = (sgst * taxableValue) / 100;
          const igtax = (igst * taxableValue) / 100;       
          const totalTax = cgtax + sgtax + igtax;       
          totsdss += totalTax;
          purchaseValue += taxableValue;

        }

        // Add freight and mis charges from main GRN object
        const freightCharges = item.frieght_charges || 0;
        const misCharges = item.mis_charges || 0;
        
        const grandTotals = purchaseValue + totsdss + freightCharges + misCharges;
     
        const grandTotal = Math.round(grandTotals);
     
        const roundoffTotal = grandTotal
        
        const plainGrnParts = grnParts.map(part => part.get({ plain: true }));
   
        const grnPartsGrouped = await mergeItemsByHSNSameTax(plainGrnParts);
       
        const Grn = {};
        Grn.partsByhsn = grnPartsGrouped;
        let invoiceType = 'GRN';
        let singleTaxAmountRound =0;
        let singleSpareAmountRound =0;
        let doubleTaxAmountRound = 0;
        let doubleSpareAmountRound = 0;
        let totalwithfrieght = '';
        let totalwithmis = '';
        let roundoffQty = '';
        let getRoundOffValueDouble = [];
     
        for (const [hsnCode, GrnParts] of Object.entries(Grn.partsByhsn)) {
              
          const hsnIssuecount = GrnParts.length; 
      
          if(hsnIssuecount == 1){
       
              const part = GrnParts[0];
              if (!part) continue;
         
                const hsnCode = part?.items?.hsnCode;
                const { cgst = 0, sgst = 0, igst = 0, quantity = 0, cost = 0, discount = 0 } = part;
        
                const discounts =  discount;
                const base = quantity * cost - discounts;
        
                const cgtax = (cgst * base) / 100;
                const sgtax = (sgst * base) / 100;
                const igtax = (igst * base) / 100;
                const purchaseValue = base;
                const TotalPurchaseValue = purchaseValue + cgtax + sgtax + igtax;
                
                const spareDetails = {
                  hsnCode: hsnCode,
                  spareAmount: purchaseValue.toFixed(2),
                  spareDiscount: discount.toFixed(2),
                  spareCgst: cgtax.toFixed(2),
                  spareSgst: sgtax.toFixed(2),
                  spareIgst: igtax.toFixed(2),
                  spareTotaltax: (cgtax + sgtax + igtax).toFixed(2),
                  spareTotalAmount: TotalPurchaseValue.toFixed(2),
                };
        
                let GSTTaxClassificationP = '';
                let singleLOB = '151010';
                
        
                if (igtax > 0) {
                  GSTTaxClassificationP = `IGST REC ${igst}`;
                  if (item.document_type === 'SCRI') {
                    singleLOB = '151004';
                    invoiceType = 'Stock transfer inter state';
                  } else if (item.document_type === 'ADJ') {
                    invoiceType = 'Positive Adjustment';
                  }
                } else if (cgtax > 0) {
                  const gstTaxPercP = cgst + sgst;
                  GSTTaxClassificationP = `CGST+SGST REC ${gstTaxPercP}`;
                  if (item.document_type === 'SCRI') {
                    invoiceType = 'Stock transfer intra state';
                  } else if (item.document_type === 'ADJ') {
                    invoiceType = 'Positive Adjustment';
                  }
                }
                invoiceType = 'Standard';
                singleTaxAmountRound += parseFloat(spareDetails.spareTotaltax);
                singleSpareAmountRound += parseFloat(spareDetails.spareAmount);
  
                responsedata.push({
                  "Business Unit": 'Ki Mobility Solutions Services',
                  "Invoice Source": 'DMS',
                  "Supplier Invoice Number": item.invoice_number,
                  "Invoice Amount":Number(grandTotal),
                  "Invoice Date": item.invoice_date,
                  "Supplier Number": suppliercode,
                  "Supplier Site": supplierno,
                  "Invoice Type": invoiceType,
                  "Accounting Date": accountingDate,
                  "Description": description,
                  "Remit To Supplier": '',
                  "Address Name": '',
                  "Payment Method": '',
                  "Bank Account": '',
                  "DMS GRN NO": item.grn_no,
                  "Outlet": Location,
                  "Chassis Number": '',
                  "Engine Number": '',
                  "Model": '',
                  "Model Code": '',
                  "Document Type": item.document_type,
                  "PO Number": poNumber,
                  "PO Date": formattedPoDate,
                  "Line Type": '',
                  "Amount": Number(spareDetails.spareAmount),
                  "Line Description": description,
                  "Tax Classification": GSTTaxClassificationP,
                  "CGST":  Number(spareDetails.spareCgst),
                  "SGST": Number(spareDetails.spareSgst),
                  "IGST": Number(spareDetails.spareIgst),
                  "TCS": '',
                  "CESS": '',
                  "UGST": '',
                  "HSN Code": hsnCode,
                  "Tax Amount": Number(spareDetails.spareTotaltax),
                  "Product Group": '',
                  "Accounting Class": '',
                  "Company": '201',
                  "LOB": LOb,
                  "Location": Location,
                  "Department": '919',
                  "Natural Account": singleLOB,
                  "Product Segment": '',
                  "Customer Segment": '',
                  "Inter company": '',
                });
  
            
          }else{
              // Case: Multiple GRN parts with same HSN
              let totalQuantity = 0;
              let totalDiscount = 0;
              let totalBase = 0;
              let totalCgst = 0;
              let totalSgst = 0;
              let totalIgst = 0;
              let totalPurchaseValue = 0;
              let lastPart;
              for (const part of GrnParts) {
                lastPart = part;
                const {
                  cgst = 0,
                  sgst = 0,
                  igst = 0,
                  quantity = 0,
                  cost = 0,
                  discount = 0,
                  
                } = part;
            
                const discountAmount = discount;
            
                const base = quantity * cost - discountAmount;
                const cgtax = (cgst * base) / 100;
                const sgtax = (sgst * base) / 100;
                const igtax = (igst * base) / 100;
                const totalValue = base + cgtax + sgtax + igtax;
            
                totalQuantity += quantity;
                totalDiscount += discountAmount;
                totalBase += base;
                totalCgst += cgtax;
                totalSgst += sgtax;
                totalIgst += igtax;
                totalPurchaseValue += totalValue;
              }

              console.log('total base amount',totalBase);
            
              const totalTax = totalCgst + totalSgst + totalIgst;
              const hsnCode = GrnParts[0]?.hsn_code || '';

              const spareDetailsDouble = {
                hsnCode,
                totalQuantity,
                spareAmount: totalBase.toFixed(2),
                spareDiscount: totalDiscount.toFixed(2),
                spareCgst: totalCgst.toFixed(2),
                spareSgst: totalSgst.toFixed(2),
                spareIgst: totalIgst.toFixed(2),
                spareTotaltax: totalTax.toFixed(2),
                spareTotalAmount: totalPurchaseValue.toFixed(2),
              };

              getRoundOffValueDouble.push(spareDetailsDouble);
              let GSTTaxClassificationP = '';
              let invoiceType = 'Standard';
              let singleLOB = '151010'; 
              let doubLOB = '151010';   
            
              if (totalIgst > 0) {
                const gstTaxPercP = lastPart.igst;
                GSTTaxClassificationP = `IGST REC ${gstTaxPercP.toFixed(2)}`;
                if (item.document_type === 'SCRI') {
                  singleLOB = '151010';
                  invoiceType = 'Stock transfer inter state';
                } else if (item.document_type === 'ADJ') {
                  invoiceType = 'Positive Adjustment';
                } else {
                  doubLOB = '151010';
                  invoiceType = 'GRN';
                }
              } else if (totalCgst > 0) {
                const gstTaxPercP = (lastPart.cgst || 0) + (lastPart.sgst || 0);
                GSTTaxClassificationP = `CGST+SGST REC ${gstTaxPercP.toFixed(2)}`;
                if (item.document_type === 'SCRI') {
                  doubLOB = '151004';
                  invoiceType = 'Stock transfer inter state';
                } else if (item.document_type === 'ADJ') {
                  singleLOB = '151010';
                  invoiceType = 'Positive Adjustment';
                }else {
                  doubLOB = '151010';
                  invoiceType = 'GRN';
                }
              }else{
                GSTTaxClassificationP = '';

                if (item.document_type === 'SCRI') {
                  doubLOB = '151010';
                  invoiceType = 'Stock transfer intra state';
                } else if (item.document_type === 'ADJ') {
                  singleLOB = '151010';
                  invoiceType = 'Positive Adjustment';
                } else {
                  doubLOB = '151010';
                  invoiceType = 'GRN';
                }
              }
              invoiceType = 'Standard'
 
              responsedata.push({
                "Business Unit": 'Ki Mobility Solutions Services',
                "Invoice Source": 'DMS',
                "Supplier Invoice Number": item.invoice_number,
                "Invoice Amount":Number(grandTotal),
                "Invoice Date": item.invoice_date,
                "Supplier Number": suppliercode,
                "Supplier Site": supplierno,
                "Invoice Type": invoiceType,
                "Accounting Date": accountingDate,
                "Description": description,
                "Remit To Supplier": '',
                "Address Name": '',
                "Payment Method": '',
                "Bank Account": '',
                "DMS GRN NO": item.grn_no,
                "Outlet": Location,
                "Chassis Number": '',
                "Engine Number": '',
                "Model": '',
                "Model Code": '',
                "Document Type": item.document_type,
                "PO Number": poNumber,
                "PO Date": formattedPoDate,
                "Line Type": '',
                "Amount": Number(spareDetailsDouble.spareAmount),
                "Line Description": description,
                "Tax Classification": GSTTaxClassificationP,
                "CGST":  Number(spareDetailsDouble.spareCgst),
                "SGST": Number(spareDetailsDouble.spareSgst),
                "IGST": Number(spareDetailsDouble.spareIgst),
                "TCS": '',
                "CESS": '',
                "UGST": '',
                "HSN Code": hsnCode,
                "Tax Amount": Number(spareDetailsDouble.spareTotaltax),
                "Product Group": '',
                "Accounting Class": '',
                "Company": '201',
                "LOB": LOb,
                "Location": Location,
                "Department": '919',
                "Natural Account": doubLOB,
                "Product Segment": '',
                "Customer Segment": '',
                "Inter company": '',
              });


              doubleTaxAmountRound += parseFloat(spareDetailsDouble.spareTotaltax);
              doubleSpareAmountRound += parseFloat(spareDetailsDouble.spareAmount);
          }
        
        }
        
        if(freightCharges){
           totalwithfrieght = grandTotal + freightCharges;
          responsedata.push({
            "Business Unit": 'Ki Mobility Solutions Services',
            "Invoice Source": 'DMS',
            "Supplier Invoice Number": item.invoice_number,
            "Invoice Amount":Number(grandTotal),
            "Invoice Date": item.invoice_date,
            "Supplier Number": suppliercode,
            "Supplier Site": supplierno,
            "Invoice Type": invoiceType,
            "Accounting Date": accountingDate,
            "Description": description,
            "Remit To Supplier": '',
            "Address Name": '',
            "Payment Method": '',
            "Bank Account": '',
            "DMS GRN NO": item.grn_no,
            "Outlet": Location,
            "Chassis Number": '',
            "Engine Number": '',
            "Model": '',
            "Model Code": '',
            "Document Type": item.document_type,
            "PO Number": poNumber,
            "PO Date": formattedPoDate,
            "Line Type": '',
            "Amount": Number(freightCharges),
            "Line Description": description,
            "Tax Classification": '',
            "CGST":''  ,
            "SGST":'' ,
            "IGST":'' ,
            "TCS": '',
            "CESS": '',
            "UGST": '',
            "HSN Code":'' ,
            "Tax Amount": '',
            "Product Group": '',
            "Accounting Class": '',
            "Company": '201',
            "LOB": LOb,
            "Location": Location,
            "Department": '919',
            "Natural Account": '570126',
            "Product Segment": '',
            "Customer Segment": '',
            "Inter company": '',
          });
        }
    
        if(misCharges){
           totalwithmis = grandTotal + misCharges;
          responsedata.push({
            "Business Unit": 'Ki Mobility Solutions Services ',
            "Invoice Source": 'DMS',
            "Supplier Invoice Number": item.invoice_number,
            "Invoice Amount":Number(grandTotal),
            "Invoice Date": item.invoice_date,
            "Supplier Number": suppliercode,
            "Supplier Site": supplierno,
            "Invoice Type": invoiceType,
            "Accounting Date": accountingDate,
            "Description": description,
            "Remit To Supplier": '',
            "Address Name": '',
            "Payment Method": '',
            "Bank Account": '',
            "DMS GRN NO": item.grn_no,
            "Outlet": Location,
            "Chassis Number": '',
            "Engine Number": '',
            "Model": '',
            "Model Code": '',
            "Document Type": item.document_type,
            "PO Number": 'here need to po num came',
            "PO Date": 'po date need to come',
            "Line Type": '',
            "Amount":Number( misCharges),
            "Line Description": description,
            "Tax Classification": '',
            "CGST":''  ,
            "SGST":'' ,
            "IGST":'' ,
            "TCS": '',
            "CESS": '',
            "UGST": '',
            "HSN Code":'' ,
            "Tax Amount": '',
            "Product Group": '',
            "Accounting Class": '',
            "Company": '201',
            "LOB": LOb,
            "Location": Location,
            "Department": '919',
            "Natural Account": '570772',
            "Product Segment": '',
            "Customer Segment": '',
            "Inter company": '',
          });

        }
        const safesingleTaxAmountRound = parseFloat(singleTaxAmountRound) || 0;
        const safesingleSpareAmountRound = parseFloat(singleSpareAmountRound) || 0;
        const safeDoubleTaxAmountRound = parseFloat(doubleTaxAmountRound) || 0;
        const safeDoubleSpareAmountRound = parseFloat(doubleSpareAmountRound) || 0;       
        const beforeRoundoff = 
        safesingleTaxAmountRound + 
        safesingleSpareAmountRound + 
          safeDoubleTaxAmountRound + 
          safeDoubleSpareAmountRound;
          const grndtotls = beforeRoundoff + freightCharges + misCharges;
          const getRoundOffValue = parseFloat((roundoffTotal - grndtotls).toFixed(2));
         

       if(getRoundOffValue){
        responsedata.push({
          "Business Unit": 'Ki Mobility Solutions Services',
          "Invoice Source": 'DMS',
          "Supplier Invoice Number": item.invoice_number,
          "Invoice Amount":Number(grandTotal),
          "Invoice Date": item.invoice_date,
          "Supplier Number": suppliercode,
          "Supplier Site": supplierno,
          "Invoice Type": invoiceType,
          "Accounting Date": accountingDate,
          "Description": description,
          "Remit To Supplier": '',
          "Address Name": '',
          "Payment Method": '',
          "Bank Account": '',
          "DMS GRN NO": item.grn_no,
          "Outlet": Location,
          "Chassis Number": '',
          "Engine Number": '',
          "Model": '',
          "Model Code": '',
          "Document Type": item.document_type,
          "PO Number": poNumber,
          "PO Date": formattedPoDate,
          "Line Type": '',
          "Amount": Number(getRoundOffValue),
          "Line Description": description,
          "Tax Classification": '',
          "CGST":''  ,
          "SGST":'' ,
          "IGST":'' ,
          "TCS": '',
          "CESS": '',
          "UGST": '',
          "HSN Code":'' ,
          "Tax Amount": '',
          "Product Group": '',
          "Accounting Class": '',
          "Company": '201',
          "LOB": LOb,
          "Location": Location,
          "Department": '919',
          "Natural Account": '432070',
          "Product Segment": '',
          "Customer Segment": '',
          "Inter company": '',
        });
       }

      }

      for (const item of POReturnData) {
        // console.log('inside po return ',item);
        // Get branch details
        const accountingDate=item?.createdAt?.toISOString().slice(0,10)
        const cocofocobranch = await GrnService.getCocofocoBranch(item.outlet_id);
        const cocofocobranchUser = cocofocobranch?.get();
  
        // Get vendor details
        const vendor = await GrnService.getVendor(item.vendor_id);
        const vendorUser = vendor?.get();
 
        // Set LOB based on company ID
        let LOb = '';
        switch (cocofocobranchUser?.companyId) {
          case 2:
            LOb = '2041';
            break;
          case 5:
            LOb = '2042';
            break;
          case 4:
            LOb = '2062';
            break;
            case 6:
              LOb = '3201';
              break;
          default:
            LOb = '0000';
        }
  
        const suppliercode = vendorUser?.oracle_vendor_number || '';
        const supplierno = vendorUser?.vendor_site_code || '';
        const Location = cocofocobranchUser?.oracleLocation || '';
        // Split GRN number to extract branch name
        const getBranchNamePreg = item?.purchase_return_invoice_number?.split('-');
        let branchName = '';

        if (getBranchNamePreg?.length == 3) {
          branchName = getBranchNamePreg[1].slice(0, -2); 
        } else if (getBranchNamePreg?.length == 4) {
          branchName = getBranchNamePreg[2].slice(0, -2); 
        }

        // Determine the entity based on company_id
        let entity = '';
        const companyId = cocofocobranchUser?.companyId;

        if (companyId == 2) {
          entity = 'COCO';
        } else if (companyId == 5) {
          entity = 'FOCO';
        } else if (companyId == 4) {
          entity = 'SMPL';
        }
        else if (companyId == 6) {
          entity = 'TVSFC3';
        }
        
        // Combine into description if needed
        const description = `${item.purchase_return_invoice_number}:${item.GRN_INVOICE}:${branchName}:${entity}`;


        const po_return_parts = await GrnService.getPOReturnDetails(item.id);
        console.log(po_return_parts,"po_returnparts")
        // const poDetails = await GrnService.getPoDetailsById(grnParts.dataValues.poparts_id);

        let returnPurchaseValue = 0;
        let rtTotalTax = 0;
        // let poReturn = {};
        let invoiceType = '';
        let singleReturnTaxAmountRound ='';
        let singleSpareReturnAmountRound ='';
        let doubleReturnTaxAmountRound = '';
        let doubleReturnSpareAmountRound = '';
        let getRoundOffValueDouble = [];
        let totalwithfrieght = '';
        // this loop used for total amount of multi grnsparts or single 
        for (const PORPart of po_return_parts) {
          let discountAmount = 0;
          const parsed = autoParseNumericFields(PORPart);
          const {
            quantity = 0,
            cost = 0,
            discount = 0,          
            cgst = 0,
            sgst = 0,
            igst = 0,
            
          } = parsed;
        
          // Calculate discount         
            discountAmount = discount;
          const taxableValue = (cost * quantity) - discountAmount;
        
          const cgtax = (cgst * taxableValue) / 100;
          const sgtax = (sgst * taxableValue) / 100;
          const igtax = (igst * taxableValue) / 100;
        
          const totalTax = cgtax + sgtax + igtax;
        
          rtTotalTax += totalTax;
          returnPurchaseValue += taxableValue;
        }      
        const grandTotalsReturn = returnPurchaseValue + rtTotalTax;
        const grandTotalpartsReturn = Math.round(grandTotalsReturn);
        const roundoffTotalReturn = grandTotalpartsReturn
        let poReturn = {};
      
        const poReturnPartsGrouped = await mergeItemsBy_HSN_SameTaxPurhcaseReturn(po_return_parts);
               
        poReturn.partsByhsn = poReturnPartsGrouped;
         
        for (const [hsnCode, poReturnHsn] of Object.entries(poReturn.partsByhsn)) {
          // console.log('poReturnHsn   inside loop     -----------------:', poReturnHsn);
        
          const hsnIssuecount = poReturnHsn.length; 

          if(hsnIssuecount == 1){

              // console.log(GrnPart, "GrnPart--------------");
              const part = poReturnHsn[0];
              const parsed = autoParseNumericFields(part);
              if (!part) continue;
                // console.log(part, "part------------");
                const hsnCode = parsed?.hsnCode;
                const { cgst = 0, sgst = 0, igst = 0, quantity = 0, cost = 0, discount = 0 } = parsed;
        
                const discounts =  discount;
                const base = quantity * cost - discounts;
        
                const cgtax = (cgst * base) / 100;
                const sgtax = (sgst * base) / 100;
                const igtax = (igst * base) / 100;
                const returnPurchaseValue = base;
                const TotalPurchaseValue = returnPurchaseValue + cgtax + sgtax + igtax;
                
                const spareDetails = {
                  hsnCode: hsnCode,
                  spareAmount: returnPurchaseValue.toFixed(2),
                  spareDiscount: discount.toFixed(2),
                  spareCgst: cgtax.toFixed(2),
                  spareSgst: sgtax.toFixed(2),
                  spareIgst: igtax.toFixed(2),
                  spareTotaltax: (cgtax + sgtax + igtax).toFixed(2),
                  spareTotalAmount: TotalPurchaseValue.toFixed(2),
                };
        
                let GSTTaxClassificationP = '';
                let singleLOB = '151010';
                let invoiceType = 'Credit memo';
        
                if (igtax > 0) {
                  GSTTaxClassificationP = `IGST REC ${igst}`;
                  
                    singleLOB = '151004';
                    invoiceType = 'Credit memo';
               
                } else if (cgtax > 0) {
                  const gstTaxPercP = cgst + sgst;
                  GSTTaxClassificationP = `CGST+SGST REC ${gstTaxPercP}`;
                  singleLOB = '151010';
                    invoiceType = 'Credit memo';
                
                }

                responsedata.push({
                  "Business Unit": 'TVS PMS',
                  "Invoice Source": 'Ki DMS',
                  "Supplier Invoice Number": item.purchase_return_invoice_number,
                  "Invoice Amount": - Number(grandTotalpartsReturn),
                  "Invoice Date": item.purchase_return_date,
                  "Supplier Number": suppliercode,
                  "Supplier Site": supplierno,
                  "Invoice Type": invoiceType,
                  "Accounting Date": accountingDate,
                  "Description": description,
                  "Remit To Supplier": '',
                  "Address Name": '',
                  "Payment Method": '',
                  "Bank Account": '',
                  "DMS GRN NO": item.purchase_return_invoice_number,
                  "Outlet": Location,
                  "Chassis Number": '',
                  "Engine Number": '',
                  "Model": '',
                  "Model Code": '',
                  "Document Type": item.document_type,
                  "PO Number":'' ,
                  "PO Date": '',
                  "Line Type": '',
                  "Amount": - Number(spareDetails.spareAmount) ,
                  "Line Description": description,
                  "Tax Classification": GSTTaxClassificationP,
                  "CGST":- Number(spareDetails.spareCgst) ,
                  "SGST": - Number(spareDetails.spareSgst),
                  "IGST": - Number(spareDetails.spareIgst),
                  "TCS": '',
                  "CESS": '',
                  "UGST": '',
                  "HSN Code": hsnCode,
                  "Tax Amount": - Number(spareDetails.spareTotaltax) ,
                  "Product Group": '',
                  "Accounting Class": '',
                  "Company": '201',
                  "LOB": LOb,
                  "Location": Location,
                  "Department": '919',
                  "Natural Account": singleLOB,
                  "Product Segment": '',
                  "Customer Segment": '',
                  "Inter company": '',
                });
                singleReturnTaxAmountRound += parseFloat(spareDetails.spareTotaltax);
                singleSpareReturnAmountRound += parseFloat(spareDetails.spareAmount);
            
          }else{

            // console.log('inside else conditon',poReturnHsn)

              // Case: Multiple POR parts 
              let totalQuantity = 0;
              let totalDiscount = 0;
              let totalBase = 0;
              let totalCgst = 0;
              let totalSgst = 0;
              let totalIgst = 0;
              let totalPurchaseValue = 0;
              let lastPart;
              invoiceType = 'Credit memo';
              for (const part of poReturnHsn) {

                lastPart = part;
                const parsed = autoParseNumericFields(part);
                const {
                  cgst = 0,
                  sgst = 0,
                  igst = 0,
                  quantity = 0,
                  cost = 0,
                  discount = 0,
                  discount_calc = 0,
                } = parsed;
            
                const discountAmount =
                  discount_calc == 1 ? (quantity * cost * discount) / 100 : discount;
            
                const base = quantity * cost - discountAmount;
                const cgtax = (cgst * base) / 100;
                const sgtax = (sgst * base) / 100;
                const igtax = (igst * base) / 100;
                const totalValue = base + cgtax + sgtax + igtax;
            
                totalQuantity += quantity;
                totalDiscount += discountAmount;
                totalBase += base;
                totalCgst += cgtax;
                totalSgst += sgtax;
                totalIgst += igtax;
                totalPurchaseValue += totalValue;
              }
            
              const totalTax = totalCgst + totalSgst + totalIgst;
              const hsnCode = poReturnHsn[0]?.hsnCode || '';
              const spareDetailsDouble = {
                hsnCode,
                totalQuantity,
                spareAmount: totalBase.toFixed(2),
                spareDiscount: totalDiscount.toFixed(2),
                spareCgst: totalCgst.toFixed(2),
                spareSgst: totalSgst.toFixed(2),
                spareIgst: totalIgst.toFixed(2),
                spareTotaltax: totalTax.toFixed(2),
                spareTotalAmount: totalPurchaseValue.toFixed(2),
              };
              getRoundOffValueDouble.push(spareDetailsDouble);
            
              let doubleReturnTaxAmountRound = '';
              let doubleReturnSpareAmountRound = '';
              let GSTTaxClassificationP = '';
             
              let singleLOB = '151010'; // Default
              let doubLOB = '151010';   // Used if neededS
            
              if (totalIgst > 0) {
                const gstTaxPercP = lastPart.igst;
                GSTTaxClassificationP = `IGST REC ${gstTaxPercP.toFixed(2)}`;
               
                
                  doubLOB = '122171';
                  invoiceType = 'Credit memo';
               
              } else if (totalCgst > 0) {
                const gstTaxPercP = (lastPart.cgst || 0) + (lastPart.sgst || 0);
                GSTTaxClassificationP = `CGST+SGST REC ${gstTaxPercP.toFixed(2)}`;
                
                  doubLOB = '122172';
                  invoiceType = 'Credit memo';
                
              }else{
                GSTTaxClassificationP = '';               
                  doubLOB = '122171';
                  invoiceType = 'Credit memo';
               
              }
             
     

              responsedata.push({
                "Business Unit": 'TVS PMS',
                "Invoice Source": 'Ki DMS',
                "Supplier Invoice Number": item.purchase_return_invoice_number  ,
                "Invoice Amount": -Number(grandTotalpartsReturn),
                "Invoice Date": item.purchase_return_date,
                "Supplier Number": suppliercode,
                "Supplier Site": supplierno,
                "Invoice Type": invoiceType,
                "Accounting Date": accountingDate,
                "Description": description,
                "Remit To Supplier": '',
                "Address Name": '',
                "Payment Method": '',
                "Bank Account": '',
                "DMS GRN NO": item.purchase_return_invoice_number,
                "Outlet": Location,
                "Chassis Number": '',
                "Engine Number": '',
                "Model": '',
                "Model Code": '',
                "Document Type": item.document_type,
                "PO Number":'' ,
                "PO Date": '',
                "Line Type": '',
                "Amount": -Number(spareDetailsDouble.spareAmount) ,
                "Line Description": description,
                "Tax Classification": GSTTaxClassificationP,
                "CGST": -Number(spareDetailsDouble.spareCgst) ,
                "SGST": -Number(spareDetailsDouble.spareSgst),
                "IGST": -Number(spareDetailsDouble.spareIgst),
                "TCS": '',
                "CESS": '',
                "UGST": '',
                "HSN Code": hsnCode,
                "Tax Amount": -Number(spareDetailsDouble.spareTotaltax) ,
                "Product Group": '',
                "Accounting Class": '',
                "Company": '201',
                "LOB": LOb,
                "Location": Location,
                "Department": '919',
                "Natural Account": doubLOB,
                "Product Segment": '',
                "Customer Segment": '',
                "Inter company": '',
              });
              doubleReturnTaxAmountRound += parseFloat(spareDetailsDouble.spareTotaltax);
              doubleReturnSpareAmountRound += parseFloat(spareDetailsDouble.spareAmount);
            

          }
        
        }
  
        const beforeRoundoffReturn = 
            singleReturnTaxAmountRound + 
            singleSpareReturnAmountRound + 
            doubleReturnTaxAmountRound + 
            doubleReturnSpareAmountRound;


      // const grndtotls = beforeRoundoff + freightChargesAmount + misChargesAmount;
 
     const roundoffTotalReturns = parseFloat(( grandTotalsReturn  - roundoffTotalReturn).toFixed(2)) ;
      

       if(roundoffTotalReturns){

        responsedata.push({
          "Business Unit": 'TVS PMS',
          "Invoice Source":  'Ki DMS',
          "Supplier Invoice Number": item.purchase_return_invoice_number  ,
          "Invoice Amount":-Number(grandTotalpartsReturn),
          "Invoice Date": item.purchase_return_date,
          "Supplier Number": suppliercode,
          "Supplier Site": supplierno,
          "Invoice Type": invoiceType,
          "Accounting Date": accountingDate,
          "Description": description,
          "Remit To Supplier": '',
          "Address Name": '',
          "Payment Method": '',
          "Bank Account": '',
          "DMS GRN NO": item.purchase_return_invoice_number,
          "Outlet": Location,
          "Chassis Number": '',
          "Engine Number": '',
          "Model": '',
          "Model Code": '',
          "Document Type": item.document_type,
          "PO Number":'' ,
          "PO Date": '',
          "Line Type": '',
          "Amount":  -Number(roundoffTotalReturns) ,
          "Line Description": description,
          "Tax Classification": '',
          "CGST": '' ,
          "SGST":' ',
          "IGST":' ',
          "TCS": '',
          "CESS": '',
          "UGST": '',
          "HSN Code": '',
          "Tax Amount":'  ',
          "Product Group": '',
          "Accounting Class": '',
          "Company": '201',
          "LOB": LOb,
          "Location": Location,
          "Department": '919',
          "Natural Account": '432070',
          "Product Segment": '',
          "Customer Segment": '',
          "Inter company": '',
        });
       }

      }
      res.setHeader("Content-Disposition", "attachment; filename=APReport.csv");
      res.setHeader("Content-Type", "text/csv");
      
      res.write(Object.keys(responsedata[0]).join(",") + "\n");
      
      // Stream each row
      for (const row of responsedata) {
        const values = Object.values(row).map(v => v ?? "").join(",");
        res.write(values + "\n");
      }
      
      // End the response
      res.end();

      // const filepath = path.join(__dirname, "PurchaseReport.xlsx");
      // const workbook = new excel.stream.xlsx.WorkbookWriter({
      //   filename: filepath,
      //   useStyles: true,
      //   useSharedStrings: true,
      // });
  
      // const worksheet = workbook.addWorksheet("AP Report");
  
      // const headers = ["SL NO", ...Object.keys(responsedata[0])];
  
      // // Dynamically calculate and set column widths
      // worksheet.columns = headers.map((header, colIndex) => {
      //   const maxLength = responsedata.reduce((max, row) => {
      //     const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
      //     return Math.max(max, cellValue.length);
      //   }, header.length); // Start with the header length
  
      //   return {
      //     header,
      //     key: header.toLowerCase(),
      //     width: maxLength + 5, // Add some padding for better appearance
      //   };
      // });
  
      // // Get the first row and apply styles
      // const headerRow = worksheet.lastRow;
      // if (headerRow) {
      //   headerRow.eachCell((cell) => {
      //     cell.font = { bold: true, color: { argb: "FFFFFF" } };
      //     cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
      //     cell.alignment = { horizontal: "center", vertical: "middle" };
      //   });
      //   headerRow.commit();
      // }
  
      // for (let i = 0; i < responsedata.length; i++) {
      //   await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
      // }
  
      // await workbook.commit(); // Ensure the file is fully written before proceeding
  
      // Send File as Response
      // res.setHeader(
      //   "Content-Disposition",
      //   "attachment; filename=PurchaseReport.xlsx"
      // );
      // res.setHeader(
      //   "Content-Type",
      //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      // );
  
      // // Wait until the file is completely written before reading
      // fs.createReadStream(filepath)
      //   .pipe(res)
      //   .on("finish", () => {
      //     console.log("File streamed successfully, deleting temporary file...");
      //     fs.unlinkSync(filepath);
      //   });
    } catch (err) {
      logger.error('AP Report Error:', err);
      next(err);
    }
  };

    
  
  const GetReceiptReport = async (req, res, next) => { 

 
    let data = {};
    try {
      // Fetching the GRNs data from the service
      data = await GrnService.getReceiptreport(req.body, req.user);
      
      console.log('from database ',data);
   
      if (!data || data.length === 0) {
        res.status(500).json({ message: "No records found for the given criteria." });
        return;
      }

      // If no data or not an array, initialize as empty array to safely skip loop
      if (!Array.isArray(data) || data.length === 0) {
        data = []; // so the next loop doesn't crash
      }
  const paymentMethodMap = {
  'Cash': 'KI Cash Receipts',
  'Cheque': 'KI Cheque Receipts',
  'CreditCard': 'KI Credit Card',
  'Neft': 'Ki Electronic Receipts - NEFT',
  'Razor Pay': 'KI Razorpay',
  'RazorPay': 'KI Razorpay',
  'Upi': 'Ki Electronic Receipts - UPI',
  'IMPS': 'Ki Electronic Receipts - IMPS',
  'MOB': 'Ki Electronic Receipts - MOB',
  'RTGS': 'Ki Electronic Receipts - RTGS'
};
     const responsedata= data.map((item) => {
     const formatReceiptDate = item.receipt_date.toISOString().slice(0, 10);
     const formatBillDate = item?.bill_date?.toISOString().slice(0, 10);
      return (
        { 
          "Receipt Source":"DMS",
          "BusinessUnit":"Ki Mobility Solutions Services",
          "Oracle Customer Number":item.oracleCashCustomerCode,
          "Customer Site Name":item.oracleSiteCode,
          "Receipt Methods": paymentMethodMap[item.mode_of_payment] || "KI Cash Receipts",
          "Receipt Number":item.doc_no,
          "Receipt Date": formatReceiptDate,
          "AccountingDate": formatBillDate,
          "Receipt Amount": item.amount,
          "LOB":item.companyId === 2 ? '2041' : item.companyId === 5 ? '2042' : "",
          "Location":item.oracleLocation,
          "UTR Number": item.doc_no+"-"+item?.ref_no?.slice(0,12),
          "UTR Date": item.ref_date,
          "UTR Bank Name":item.utr_bank_name,
          "ORDER Ref":item.bill_no || "",
          "Remittance Bank Account":  item.mode_of_payment === 'CreditCard'  ? '0987654321' : 
          (item.mode_of_payment === 'Razor Pay' || item.mode_of_payment === 'RazorPay') ? '1234567890'  : '921030033785782',
          "CostCentre":"919"
        }
      )
    })

    res.setHeader("Content-Disposition", "attachment; filename=ReceiptReport.csv");
      res.setHeader("Content-Type", "text/csv");
      
      res.write(Object.keys(responsedata[0]).join(",") + "\n");
      
      // Stream each row
      for (const row of responsedata) {
        const values = Object.values(row).map(v => v ?? "").join(",");
        res.write(values + "\n");
      }
      
      // End the response
      res.end();
    
      // const filepath = path.join(__dirname, "PurchaseReport.xlsx");
      // const workbook = new excel.stream.xlsx.WorkbookWriter({
      //   filename: filepath,
      //   useStyles: true,
      //   useSharedStrings: true,
      // });
  
      // const worksheet = workbook.addWorksheet("Receipt Report");
  
      // const headers = ["SL NO", ...Object.keys(responsedata[0])];
  
      // // Dynamically calculate and set column widths
      // worksheet.columns = headers.map((header, colIndex) => {
      //   const maxLength = responsedata.reduce((max, row) => {
      //     const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
      //     return Math.max(max, cellValue.length);
      //   }, header.length); // Start with the header length
  
      //   return {
      //     header,
      //     key: header.toLowerCase(),
      //     width: maxLength + 5, // Add some padding for better appearance
      //   };
      // });
  
      // // Get the first row and apply styles
      // const headerRow = worksheet.lastRow;
      // if (headerRow) {
      //   headerRow.eachCell((cell) => {
      //     cell.font = { bold: true, color: { argb: "FFFFFF" } };
      //     cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
      //     cell.alignment = { horizontal: "center", vertical: "middle" };
      //   });
      //   headerRow.commit();
      // }
  
      // for (let i = 0; i < responsedata.length; i++) {
      //   await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
      // }
  
      // await workbook.commit(); // Ensure the file is fully written before proceeding
  
      // // Send File as Response
      // res.setHeader(
      //   "Content-Disposition",
      //   "attachment; filename=PurchaseReport.xlsx"
      // );
      // res.setHeader(
      //   "Content-Type",
      //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      // );
  
      // // Wait until the file is completely written before reading
      // fs.createReadStream(filepath)
      //   .pipe(res)
      //   .on("finish", () => {
      //     console.log("File streamed successfully, deleting temporary file...");
      //     fs.unlinkSync(filepath);
      //   });
    } catch (err) {
      logger.error('Receipt Controller Error:', err);
      next(err);
    }
  };
  

  const GetStockAdjustmentReport = async (req, res, next) => {
    let data = {}
    try {
      data = await GrnService.getStockAdjustmentReport(req.body, req.user);
      console.log(data, "data")
      if (!data || data.length === 0) {
        res.status(500).json({ message: "No records found for the given criteria." });
        return;
      }
      const responsedata = data.map((item) => {
        const createdDate = (item.createdAt).toISOString()
  
        const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
  
        
        return (
          {
            "Branch": req.user.outlet.outletCode,
            "Doc Number": item.invoice_number,
            "Doc Date": createddateformat,
            "Item Code": item.item_code,
            "Item Name": item.item_description,
            "HSN Code": item.hsnCode,
            "UOM": item.uomType,
            "InCreased Qty": item.document_type=="ADJ" ? item.quantity:"",
            "Decreased Qty": item.document_type=="NADJ" ? item.quantity:"",
            "Unit Cost": item.cost,
            "Unit Sale Rate": item.rate,
            "MRP": item.mrp,
            "Total Amount":item.total,
            "Parts Category": item.itemCategorie,
            "Parts Aggregate": item.aggregateName,
            "Sub Aggregate": item.subAggregateName,
            "Make": item.makeName,
            "Model": item.modelName
          }
        )
      })
  
      const filepath = path.join(__dirname, "PurchaseReport.xlsx");
  
      const workbook = new excel.stream.xlsx.WorkbookWriter({
        filename: filepath,
        useStyles: true,
        useSharedStrings: true,
      });
  
      const worksheet = workbook.addWorksheet("Purchase Report");
  
  
      const headers = ["SL NO", ...Object.keys(responsedata[0])]
  
      // Dynamically calculate and set column widths
      worksheet.columns = headers.map((header, colIndex) => {
        const maxLength = responsedata.reduce((max, row) => {
          const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
          return Math.max(max, cellValue.length);
        }, header.length); // Start with the header length
  
        return {
          header,
          key: header.toLowerCase(),
          width: maxLength + 5, // Add some padding for better appearance
        };
      });
  
      //  Get the first row and apply styles 
      const headerRow = worksheet.lastRow;
      if (headerRow) {
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
        headerRow.commit();
      }
  
      for (let i = 0; i < responsedata.length; i++) {
        await worksheet.addRow([i + 1, ...Object.values(responsedata[i])]).commit();
      }
      await workbook.commit(); //  Ensure the file is fully written before proceeding
  
      // Send File as Response
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=PurchaseReport.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      //  Wait until the file is completely written before reading
      fs.createReadStream(filepath)
        .pipe(res)
        .on("finish", () => {
          console.log(" File streamed successfulsly, deleting temporary file...");
          fs.unlinkSync(filepath);
        });
  
  
  
    } catch (err) {
      logger.error('Grn Contrller Error:', err);
      next(err);
    }
  }

const GetAutoFocusGrn= async (req, res, next) => {
  try {
    // const auth_token =await axios.post('https://pmapi.mytvspartsmart.in/B2BApi/authenticate')
    // console.log('auth_token',auth_token)
    // const data = await axios.post("https://pmapi.mytvspartsmart.in/B2BApi/api/invoice/details",req.body, {
    //   headers: {
    //     'Authorization': `Bearer ${auth_token?.data?.token}`,
    //     'Content-Type': 'application/json'
    //   }
    // }
    // );
    let auth_token;
    let data;

    auth_token = await axios.post(
      'https://pmapi.mytvspartsmart.in/B2BApi/authenticate'
    );

    data = await axios.post(
      'https://pmapi.mytvspartsmart.in/B2BApi/api/invoice/details',
      req.body,
      {
        headers: {
          Authorization: `Bearer ${auth_token.data.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!data?.data?.invoiceNumber) {
      console.log('No data in Pmapi so coming to Hmapi');
      auth_token = await axios.post(
        'https://hmapi.mytvspartsmart.in/B2BApi/authenticate'
      );

      data = await axios.post(
        'https://hmapi.mytvspartsmart.in/B2BApi/api/invoice/details',
        req.body,
        {
          headers: {
            Authorization: `Bearer ${auth_token.data.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    const formateddata=[]
    const resdata=data?.data?.itemDetails
    for(const item in resdata){
      const mrp = Number(resdata[item].invoice_mrp);
      const taxRate = Number(resdata[item].tax_rate);

    const rate = Number(
      (mrp * 100 / (100 + taxRate)).toFixed(2)
    );
      let obj={
    'id':Number(item)+1,
    'Parts Code': resdata[item].partnumber,
    'Description': resdata[item].itemDescription,
    'Sup. inv qty':resdata[item].invoice_quantity,
    'Received Qty':resdata[item].invoice_quantity,
    'Rate':rate,
    'Cost':resdata[item].invoice_cost,
    'MRP':resdata[item].invoice_mrp,
    // 'Discount Amount',
    'Select Bin Location':"",
    'CGST':resdata[item].cgst_rate,
    'SGST':resdata[item].sgst_rate,
    'IGST':resdata[item].igst_rate,
    'Total Amount':Number((resdata[item].taxable_amount+resdata[item].cgst_amount+resdata[item].sgst_amount+resdata[item].igst_amount).toFixed(2)),
    "HSN Code":resdata[item].hsncode,
      }
      formateddata.push(obj)
    }
    const {itemDetails,...rest}=data?.data

    res.status(200).json({ success: true, data:{...rest,itemDetails:formateddata} });
  }
  catch (err) {
    logger.error('Grn Controller Error:', err);
    next(err);
  }
};

const GetItemFinder = async (req, res, next) => {
  let formattedData = []
  try {
    let data = await GrnService.getItemFinder(req.body, req.user);
    console.log(data, "data")
    formattedData = {
      id:data.id,
      item_code: data.itemCode,
      item_description: data.itemDescription,
      purchaseQuantity:data.purchasequantity,
      saleQuantity:Number(data.partissueqty)+Number(Number(data.csqty)-Number(data.csretrqty)),
      availableQuantity: data.stockquantity,
    }
  
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: formattedData
    });

  } catch (err) {
    logger.error('Item Contrller Error:', err);
    next(err);
  }
}
const GetPurchaseDetails = async (req, res, next) => {
  let formattedData = []
  try {
    let data = await GrnService.getPurchaseDetails(req.body, req.user);
    console.log(data, "data")
    formattedData = await data?.map(part => {
       const date = new Date(part.invoice_date).toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      // const createddate=(part.createdAt).toISOString()
      // const createddateformat = (createddate).slice(8, 10) + "-" + (createddate).slice(5, 7) + "-" + (createddate).slice(0, 4)

      return( 
        {
      ...part,
      invoice_date:dateformat,
      // createdAt:createddateformat
    }
  )
}
    );
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: formattedData,
    });

  } catch (err) {
    logger.error('Item Contrller Error:', err);
    next(err);
  }
}
const GetSaleDetails = async (req, res, next) => {
  let formattedData = []
  try {
    let {result:data} = await GrnService.getSalesDetails(req.body, req.user);
    console.log(data, "saledata")
    formattedData = await data?.map(part => {
      //  const date = new Date(part.invoice_date).toISOString()
      // const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createddate=(part.createdAt).toISOString()
      const createddateformat = (createddate).slice(8, 10) + "-" + (createddate).slice(5, 7) + "-" + (createddate).slice(0, 4)

      return( 
        {
      ...part,
      customer_name:part.type=="jc" && part.customer_name ? commonLogic.decrypt(part.customer_name) : part.customer_name,
      // invoice_date:dateformat,
      createdAt:createddateformat
    }
  )
}
    );
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: formattedData,
    });

  } catch (err) {
    logger.error('Item Contrller Error:', err);
    next(err);
  }
}

const GetStockTransferParts = async (req, res, next) => {
  const resultList = [];
  try {
    let data = await GrnService.getStockTransferParts(req.body, req.user);
    console.log(data, "data")
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['itemCode'] = element.itemCode;
      resObj['itemName'] = element.itemName;
      resObj['itemDescription'] = element.itemDescription;
      resObj['hsnCode'] = element.hsnCode;
      resObj['quantity'] = element.quantity
      resObj['rate'] = element.rate;
      resObj['mrp'] = element.mrp;
      resObj['cost'] = element.cost;
      if (
        req.body.customerState.toLowerCase() === req.user.outlet.state.toLowerCase()
      ) {
        resObj['sgst'] = element.taxPercentage / 2;
        resObj['cgst'] = element.taxPercentage / 2;
        resObj['igst'] = 0;
      } else {
        resObj['sgst'] = 0;
        resObj['cgst'] = 0;
        resObj['igst'] = element.taxPercentage;
      }

      resultList.push(resObj);
    }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Item data Fetched Successfully ",
      data: resultList
    });

  } catch (err) {
    logger.error('items Contrller Error:', err);
    next(err);
  }
}

const GetInventoryStockForGMS = async (req, res, next) => {
  try {
    let data = await GrnService.GetInventoryStockForGMS(req.user);
    console.log(data, "data")
   
    return res.status(200).json({
      requestSuccessful: true,
      message: "inventory data Fetched Successfully ",
      data,
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

// const dashboardPurchaseFromMytvsFGapFilled = async (body,user) => {
 
//   try {
//     const data = await GrnService.dashboardPurchaseFromMytvs(body,user);
// if (body.option === "monthly") {
//   const today = new Date(); 

//   const year = today.getFullYear();
//   const month = today.getMonth(); // 0-based
//   const totalDays = today.getDate(); // till today

//   const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 

//   // Build labels: "1 Mon", "2 Tue", ...
//   const labels = Array.from({ length: totalDays }, (_, i) => {
//     const date = new Date(year, month, i + 1);
//     return `${i + 1} ${dayNames[date.getDay()]}`;
//   });

//   // Normalize API data
//   const map = Object.fromEntries(
//     data.map(d => [d.period.trim(), d.amount])
//   );

//   return labels.map(label => ({
//     period: label,
//     amount: map[label.split(" ")[0]] || 0
//   }));
// }


// else if (body.option === "yearly") {
//   const FY_MONTHS = [
//     "Apr","May","Jun","Jul","Aug","Sep",
//     "Oct","Nov","Dec","Jan","Feb","Mar"
//   ];

//   // Normalize API data
//   const map = Object.fromEntries(
//     data.map(d => [d.period.trim().toLowerCase(), d.amount])
//   );

//   return FY_MONTHS.map(month => ({
//     period: month,
//     amount: map[month.toLowerCase()] || 0
//   }));
// }
 
// return data

//   } catch (err) {
//     logger.error("Grn service dashboardPurchaseFromMytvs", err);
//     next(err);
//   }
// };

const dashboardPurchaseFromMytvsFGapFilled = async (body,user) => { 
 
  try {
    const outletCode = user.outlet.outletCode;
    const [data, oldData] = await Promise.all([
      GrnService.dashboardPurchaseFromMytvs(body, user),

      GrnService.oldDmsDashboardPurcasheFromMytvs({
        outletCode,
        option: body.option,
      }),
    ]);
    console.log('New API data:', data);
    console.log('Old API data:', oldData);
  const MONTH_NUMBER_TO_NAME = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};
   
const formattedNewRows =
  body.option === "monthly"
    ? data
    : data.map(item => ({
        period:
          MONTH_NUMBER_TO_NAME[
            item.period
          ],
        amount:
          Number(
            item.amount || 0
          ),
      }));

    const combinedRows = [...formattedNewRows, ...oldData];
        const mergedMap = {};

    combinedRows.forEach((item) => {
      const key =
        body.option === 'monthly'
          ? item.period.toString().trim()
          : item.period.toString().trim().toLowerCase();

      if (!mergedMap[key]) {
        mergedMap[key] = 0;
      }

      mergedMap[key] += Number(item.amount || 0);
    });


const option = body.option || "monthly";

if (option === "monthly") {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDays = today.getDate();

  const dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const labels = Array.from(
    { length: totalDays },
    (_, i) => {
      const date = new Date(
        year,
        month,
        i + 1
      );

      return `${i + 1} ${dayNames[date.getDay()]}`;
    }
  );

  return labels.map((label) => ({
    period: label,
    amount:
      mergedMap[
        label.split(" ")[0]
      ] || 0,
  }));
}

/* ==========================================
   MONTH BASED OPTIONS
========================================== */

let monthsToRender = [];

if (option === "q1") {
  monthsToRender = [
    "Apr",
    "May",
    "Jun",
  ];
}

else if (option === "q2") {
  monthsToRender = [
    "Jul",
    "Aug",
    "Sep",
  ];
}

else if (option === "q3") {
  monthsToRender = [
    "Oct",
    "Nov",
    "Dec",
  ];
}

else if (option === "q4") {
  monthsToRender = [
    "Jan",
    "Feb",
    "Mar",
  ];
}

else if (option === "halfyearly") {
  monthsToRender = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
  ];
}

else if (
  option === "yearly" ||
  option === "preyear"
) {
  monthsToRender = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
}

return monthsToRender.map(
  (month) => ({
    period: month,
    amount:
      mergedMap[
        month.toLowerCase()
      ] || 0,
  })
);


 
return data

  } catch (err) {
    logger.error("Grn service dashboardPurchaseFromMytvs", err);
    next(err);
  }
};

const dashboardPurchaseFromMytvs = async (req, res) => { 
    try {
        const data = await dashboardPurchaseFromMytvsFGapFilled(req.body,req.user);
        console.log('Final merged data for dashboard purchasefrommytvs:', data);
        if (data) {
            res.status(200).send({
                requestSuccessful: true,
                data
            });
        } else {
            res.status(400).send({
                requestSuccessful: false,
                 data,
            });
        }
    } catch (err) {
        logger.error("JobCard controller dashboard", err);
        next(err);
    }
};

const GetZohoBillReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getZohoBillReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = []
   for(const item of data){
      const date = new Date(item.invoice_date).toISOString()

      const dateformat = date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4)

          function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  value = value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
      responsedata.push(
        {
          "Bill Date": dateformat,
          "Transaction Posting Date":"",
          "Due Date":"",
          "Bill ID":item.invoice_number,
          "Vendor Name":item.vendorName,
          "Entity Discount Percent":"",
          "Payment Terms" : "",
          "Payment Terms Label" :"",
          "Bill Number":item.invoice_number,	
          "PurchaseOrder":"",
          "Currency Code":"INR",
          "Exchange Rate":"",
          "SubTotal":item.sub_total,
          "Total":item.total,
          "Balance": "",
          "TCS Amount" : "",	
          "Vendor Notes": "",	
          "Terms & Conditions": "",
          "Adjustment": "",
          "Adjustment Description": "",
          "Is Inclusive Tax": "FALSE",
          "Submitted By": "",
          "Approved By": "",
          "Submitted Date": "",
          "Approved Date": "",
          "Bill Status": "",
          "Created By": "",	
          "Product ID": "",	
          "Item Name": item.item_code,
          "Account": "",
          "Account Code": "",
          "Description": escapeCSV(item.item_description),
          "Quantity": item.quantity,
          "Usage unit": "",
          "Tax Amount":item.cgst_amount+item.sgst_amount+item.igst_amount,
          "Item Total":item.item_total,
          "Is Billable": "",
          "Reference Invoice Type":"",	
          "Source of Supply":	item.city,
          "Destination of Supply":"",	
          "GST Treatment":"business_gst",	
          "GST Identification Number (GSTIN)":"",
          "TDS Calculation Type":"",
          "TDS TaxID":"",
          "TDS Name":"",
          "TDS Percentage":"",
          "TDS Section Code":"",
          "TDS Section":"",
          "TDS Amount":"",	
          "TCS Tax Name":"",
          "TCS Percentage":"",
          "Nature Of Collection":"",
          "SKU":"P-"+item.grnparts_id,
          "Rate":item.rate,
          "Discount Type":"",
          "Is Discount Before Tax":"TRUE",
          "Discount": item.discount_percentage,
          "Discount Amount": item.discount,
          "HSN/SAC": item.hsnCode,
          "Purchase Order Number": "",
          "Tax ID": "",
          "Tax Name": item.igst > 0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),	
          "Tax Percentage": item.cgst+item.sgst+item.igst,
          "Tax Type":item.igst>0 ? "ItemAmount" :"Tax Group",
          "Item TDS Name":"",	
          "Item TDS Percentage":"",	
          "Item TDS Amount":"",	
          "Item TDS Section Code":"",	
          "Item TDS Section":"",	
          "Item Exemption Code":"",	
          "Item Type":"goods",
          "Reverse Charge Tax Name":"",
          "Reverse Charge Tax Rate":"",
          "Reverse Charge Tax Type":"",
          "Supply Type":"",
          "ITC Eligibility":"",
          "Entity Discount Amount":"",
          "Discount Account": "",
          "Discount Account Code": "",
          "Is Landed Cost": "",
          "Customer Name": "",
          "Project Name": "",
          "CGST Rate %": item.cgst,
          "SGST Rate %": item.sgst,
          "IGST Rate %": item.igst,
          "CESS Rate %": "",
          "CGST(FCY)": "",
          "SGST(FCY)": "",
          "IGST(FCY)": "",
          "CESS(FCY)": "",
          "CGST":item.cgst_amount,
          "SGST":item.sgst_amount,	
          "IGST":item.igst_amount,	
          "CESS":"",	
          "CF.GRN NO": "",	
          "CF.CUSTOMER NAME": "",	
          "CF.VEHICLE NUMBER": "",	
          "CF.MEMBERSHIP NUMBER": "",	
          "CF.PO Number": ""
        }
      )
   }

   // Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=ZohoBillReport.csv");
res.setHeader("Content-Type", "text/csv");

res.write(Object.keys(responsedata[0]).join(",") + "\n");

// Stream each row
for (const row of responsedata) {
  const values = Object.values(row).map(v => v ?? "").join(",");
  res.write(values + "\n");
}

// End the response
res.end();


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetKitaraApReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.getKitaraAPReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  value = value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
    const responsedata = []
   for(const item of data){
      const date = new Date(item.invoice_date).toISOString()

      const dateformat = date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4)

      
      responsedata.push(
        {
          "Bill Date": dateformat,
          "Bill Number":item.invoice_number,	
          "PurchaseOrder":"",
          "Bill Status": "",
          "Source of Supply":	"",  //needed
          "Destination of Supply":"", //needed
          "GST Treatment":"business_gst",	
          "GST Identification Number (GSTIN)":item.gstin,
          "Is Inclusive Tax": "FALSE",
          "TDS Percentage":"",
          "TDS Amount":"",	
          "TDS Section Code":"",
          "TDS Name":"",
          "Vendor Name":item.vendorName,
          "Due Date":"",
          "Currency Code":"INR",
          "Exchange Rate":"",
          "Attachment ID": item.grn_no,
          "Attachment Preview ID" : "",
          "Attachment Name": "",
          "Attachment Type": item.document_type,
          "Attachment Size": "",
          "Item Name": escapeCSV(item.item_description),
          "SKU": item.item_code,
          "Item Description": escapeCSV(item.item_description),
          "Account": "Purchase - Parts",
          "Usage unit": "",
          "Quantity": item.quantity,
          "Rate":item.rate,
          "Adjustment": "",
          "Item Type":"goods",
          "Tax Name": item.igst > 0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),	
          "Tax Percentage": item.cgst+item.sgst+item.igst,
          "Tax Amount":item.cgst_amount+item.sgst_amount+item.igst_amount,
          "Tax Type":item.igst>0 ? "ItemAmount" :"Tax Group",
          "Item Exemption Code":"",	
          "Reverse Charge Tax Name":"",
          "Reverse Charge Tax Rate":"",
          "Reverse Charge Tax Type":"",
          "Item Total":item.item_total,
          "SubTotal":item.sub_total,
          "Total":item.total,
          "Balance": "",
          "Vendor Notes": "",	
          "Terms & Conditions": "",
          "Payment Terms" : "",
          "Payment Terms Label" :"",
          "Is Billable": "FALSE",
          "Customer Name": "",
          "Project Name": "",
          "Purchase Order Number": "",
          "Is Discount Before Tax":"TRUE",
          "Entity Discount Amount":"0",
          "Discount Amount": item.discount,
          "Is Landed Cost": "",
          "Warehouse Name" : "",
          "Branch Name" : item.outletCode,
          "CF.Transporte_Name": "",
          "TCS Tax Name":"",
          "TCS Percentage":"",
          "Nature Of Collection":"",
          "TCS Amount" : "",	
          "HSN/SAC": item.hsnCode,
          "Supply Type":"",
          "ITC Eligibility":"",          
        }
      )
   }

   // Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=ZohoBillReport.csv");
res.setHeader("Content-Type", "text/csv");

res.write(Object.keys(responsedata[0]).join(",") + "\n");

// Stream each row
for (const row of responsedata) {
  const values = Object.values(row).map(v => v ?? "").join(",");
  res.write(values + "\n");
}

// End the response
res.end();


  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const CreateOldDmsGrn = async (req, res, next) => {
  const body = req.body;
  let GRN_data = {};
  let GRN_Parts_data = {};
 
  let stockadjustmentdata={}
  let stockadjustmentpartdata={}
  
  try {
    GRN_data = await GrnService.CreateGrn(body.grndata, req.user);
    GRN_Parts_data = await GrnService.CreateGrnStocksForOldDms(
      body.grnparts,
      GRN_data,
      req.user
    );

    stockadjustmentdata = await GrnService.CreateStockAdjustment(GRN_data,body.grand_total,req.user);
    stockadjustmentpartdata=await GrnService.CreateStockAdjustmentParts(GRN_Parts_data,stockadjustmentdata)


    return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn Created Successfully',
      // data: {
      //   GRNData: GRN_data,
      //   GRNPartsData: GRN_Parts_data,
      //   GRNStocksData: GRN_Stocks_data,
      //   GateIn_data,
      //   StockTransferData: stock_transfer_data,
      //   stockadjustmentdata,
      //   stockadjustmentpartdata,
      //   Bindata
      // },
    });
  } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};

const GetZohoApReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GrnService.GetZohoApReport(req.body, req.user);
    console.log(data, "data")

    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }

    function escapeCSV(value) {
      if (value === null || value === undefined) return "";
      value = value.toString();
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }
    const responsedata = []
   for(const item of data){
      const date = new Date(item.invoice_date).toISOString()

      const dateformat = date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4)

      responsedata.push(
        {
          "Bill Date": dateformat,
          "Bill Number":item.invoice_number,	
          "PurchaseOrder":"",
          "Bill Status": "",
          "Source of Supply":	"", 
          "Destination of Supply":"",
          "GST Treatment":item.gst_treatment,	
          "GST Identification Number (GSTIN)":item.gstin,
          "Is Inclusive Tax": "FALSE",
          "TDS Percentage":"",
          "TDS Amount":"",	
          "TDS Section Code":"",
          "TDS Name":"",
          "Vendor Name":item.vendorName,
          "Due Date":"",
          "Currency Code":"INR",
          "Exchange Rate":"",
          "Attachment ID": item.grn_no,
          "Attachment Preview ID" : "",
          "Attachment Name": "",
          "Attachment Type": item.document_type,
          "Attachment Size": "",
          "Item Name": escapeCSV(item.item_description),
          "SKU": item.item_code,
          "Item Description": escapeCSV(item.item_description),
          "Account": "Purchase - Parts",
          "Usage unit": "",
          "Quantity": item.quantity,
          "Rate":item.rate,
          "Adjustment": "",
          "Item Type":"",
          "Tax Name": item.igst > 0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),	
          "Tax Percentage": item.cgst+item.sgst+item.igst,
          "Tax Amount":item.cgst_amount+item.sgst_amount+item.igst_amount,
          "Tax Type":item.igst>0 ? "ItemAmount" :"Tax Group",
          "Item Exemption Code":"",	
          "Reverse Charge Tax Name":"",
          "Reverse Charge Tax Rate":"",
          "Reverse Charge Tax Type":"",
          "Item Total":item.line_total,
          "SubTotal":item.item_total,
          "Total":item.total,
          "Balance": "",
          "Vendor Notes": "",	
          "Terms & Conditions": "",
          "Payment Terms" : "",
          "Payment Terms Label" :"",
          "Is Billable": "FALSE",
          "Customer Name": "",
          "Project Name": "",
          "Purchase Order Number": item.po_number ? item.po_number : "",
          "Is Discount Before Tax":"TRUE",
          "Entity Discount Amount":"0",
          "Discount Amount": item.discount,
          "Is Landed Cost": "",
          "Warehouse Name" : "",
          "Branch Name" : item.outletCode,
          "CF.Transporte_Name": "",
          "TCS Tax Name":"",
          "TCS Percentage":"",
          "Nature Of Collection":"",
          "TCS Amount" : "",	
          "HSN/SAC": item.hsnCode,
          "Supply Type":"",
          "ITC Eligibility":"",          
        }
      )
   }

      res.setHeader("Content-Disposition", "attachment; filename=Zoho Ap Report.csv");
      res.setHeader("Content-Type", "text/csv");

      res.write(Object.keys(responsedata[0]).join(",") + "\n");

      for (const row of responsedata) {
        const values = Object.values(row).map(v => v ?? "").join(",");
        res.write(values + "\n");
      }

      res.end();


    } catch (err) {
      logger.error('Grn Contrller Error:', err);
      next(err);
    }
}

const CreatePOGrn = async (req, res, next) => {
  // console.log(body, "body")
  const grnpayload=JSON.parse(req.body.grndata)
  const grnpartspayload=JSON.parse(req.body.grnparts)
  const bindatapayload=JSON.parse(req.body.bindata)
  let GRN_data = {};
  let GRN_Parts_data = {};
  let GRN_Stocks_data;
 
  let Bindata={}
  let poData={}
  let poPartsData={} 
  let link=""
  try {
    if(req.file){
               const storage = new Storage({
                        projectId: 'prj-stag-gobumpr-service-6567',
                        keyFilename: 'prj-stag-gobumpr-service-6567.json',
                      });
              
                      const bucketName = 'bkt-dearo-prod'; // The name of your Cloud Storage bucket
                      const bucket = storage.bucket(bucketName);
              
                      const image = req.file; // The file you want to upload
                      const date = new Date();
              
                        const buffer = image.buffer;
                        let newName =
                          date.getTime().toString() +
                          Math.random().toString(36).slice(2, 7) +
                          image.originalname.replace(/\ /g, '_');
                        const blob = bucket.file(`PurchaseInvoice/${newName}`);
                        const blobStream = blob.createWriteStream({
                          resumable: false,
                        });
              
                        
                        blobStream.on('error', (err) => {
                          return "failed"
                        });
              
                        blobStream.on('finish', () => {
                          // console.log(
                          //   'file------------',
                          //   `https://storage.googleapis.com/${bucketName}/PurchaseInvoice/${newName}`
                          // );
                         
                            link= `https://storage.googleapis.com/${bucketName}/PurchaseInvoice/${newName}`
                          grnpayload.invoice_pdf_url=link
                        });
              
                        // Upload the file to Google Cloud Storage
                        blobStream.end(buffer);
              
                        await finishedPromise(blobStream);
            }
    GRN_data = await GrnService.CreateGrn(grnpayload, req.user);
    GRN_Parts_data = await GrnService.CreateGrnParts(grnpartspayload, GRN_data,"DirectGrn",req.user);
   
    
      GRN_Stocks_data = await GrnService.CreateGrnStocksForDirectGrn(
      GRN_data,
      GRN_Parts_data,
      req.user,
      bindatapayload
    );
      
    
   
    
    poPartsData = await POService.updatePOPartsStatus(grnpartspayload, req.user);
    poData = await POService.updatePOStatus(grnpayload.po_id, req.user);

console.log(poPartsData,poData,"po data")
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Grn Created Successfully',
      // data: {
      //   GRNData: GRN_data,
      //   GRNPartsData: GRN_Parts_data,
      //   GRNStocksData: GRN_Stocks_data,
      //   GateIn_data,
      //   StockTransferData: stock_transfer_data,
      //   stockadjustmentdata,
      //   stockadjustmentpartdata,
      //   Bindata
      // },
    });
  } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};
   const GetOldBinLocations = async (req, res, next) => {
    let data = {}
    try {
      data = await GrnService.getOldBinLocations(req.body, req.user);
      console.log(data, "data")
      if (!data || data.length === 0) {
        res.status(500).json({requestSuccessful:true, message: "No records found for the given criteria." ,data:[]});
        return;
      }
      const responsedata = data.map((item,index) => {
      
        return (
          {
            "GRN Number": item.grn_no,
            "Item Code": item.item_code,
            "Item Name": item.item_description,
            "Old BinLocation":item.binLocations,
            "Qty": item.quantity,
            "stock_id":item.stock_id,
            "binlocation_id":item.binlocation_id,
            "item_id":item.item_id,
            "id":index+1
          }
        )
      })
      return res.status(200).json({
        requestSuccessful: true,
        message: "Stock Position Report Fetched Successfully ",
        data: responsedata,
      });
    } catch (err) {
      logger.error('Grn Contrller Error:', err);
      next(err);
    }
  }
  const UpdateOldBinLocations = async (req, res, next) => {
    let data = {}
    try {
      data = await GrnService.UpdateBinLocations(req.body, req.user);
      console.log(data, "data")
      return res.status(200).json({
        requestSuccessful: true,
        message: "Bin Locations Updated Successfully ",
        data: data,
      });
    }
    catch (err) {
      logger.error('Grn Contrller Error:', err);
      next(err);
    }
  }
const controller = {
  CreateGrn, CreateGrnDocument, GetGrnDocuments, GetGrns, GenerateGrnPdf, GetGrnDataForReturn,
  CreatePurchaseReturn, GetPurchaseReturn,GetAPReport, GetQuickItemSearch, getPartsForCounterSale,GetSpareSalesAxapta, GetPurchaseReport, GetPurchaseAxaptaReport,
  GetStockTransferInwardReport,GetPurchaseReturnReport,GetReceiptReport, GetSalesReport,GetStockAdjustmentSearch,CreateNegStockAdjustment,
  GetStockAdjustment,GetStockPositionReport,GetStockAdjustmentReport,CreateOracleStockTransferGrn,GetAutoFocusGrn,GetItemFinder,
  GetPurchaseDetails,GetSaleDetails,GetStockTransferParts,GetInventoryStockForGMS,dashboardPurchaseFromMytvs,GetZohoBillReport,GetKitaraApReport,GetZohoApReport,
  CreatePOGrn,GetOldBinLocations,UpdateOldBinLocations
}

export default controller;
