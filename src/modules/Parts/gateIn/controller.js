import GateinService from './service.js';
import POService from '../PurchaseOrder/service.js';
import OracleAutoGrnService from '../stockTransferOracle/service.js';
import logger from '../../../config/logger.js';
import excel from 'exceljs';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path'; // ✅ Import path
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { or } from 'sequelize';
import erpStockTransferService from '../erpStockTransfer/service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const finishedPromise = promisify(finished);
const CreateGateIn = async (req, res, next) => {
  const body = req.body;
  let GateInData = {};
  let GateInPartsData = {};
  let po_parts_data = {};
  let Po_data = {};
  let oraclestocktransferdata={};
  let erpstocktransferdata={};
 
  try {
    GateInData = await GateinService.CreateGatein(body.gateindata, req.user);
    GateInPartsData = await GateinService.CreateGateinParts(body.gateinparts, GateInData,body.oracle_id,body.erp_id,req.user);
    if(body.gateindata.po_id){
    po_parts_data = await POService.updatePOPartsStatus(body.gateinparts, req.user);
      Po_data = await POService.updatePOStatus(body.gateindata.po_id, req.user);
    }
    if(body.oracle_id){
      oraclestocktransferdata = await OracleAutoGrnService.updateOracleStockTransferStatus(body.oracle_id, req.user);
    }
    if(body.erp_id){
      erpstocktransferdata = await erpStockTransferService.updateErpStockTransferStatus(body.erp_id, req.user);
    }
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Gatein Created Successfully',
      // data: {
      //  GateInData, 
      //  GateInPartsData,
      //  po_parts_data,
      //  Po_data,
      //  oraclestocktransferdata
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





const GetGateIn = async (req, res, next) => {
  try {
    let { grnDetails: data, count } = await GateinService.getGateIn(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const date = new Date(item.dataValues.invoice_date).toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      return ({
        ...item.dataValues, 
        invoice_date: dateformat,
        "Gate In Status": item.dataValues.status === 1 ? "Gatein Time Captured" : item.dataValues.status===2 ? "Supplier Invoice Amount Tallied" : item.dataValues.status===3 ? "Bin location Updated" :
         item.dataValues.status===4 ? "Physically Binning" : item.dataValues.status===5 ? "Grn Created" : null
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Gate in data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('Grn Contrller Error:', err);
    next(err);
  }
}

const GetGateinForGRN = async (req, res, next) => {
  let data = []
  let user = req.user
  let partmap=[]
  let podata={}
  try {
    data = await GateinService.getGateinforGrn(req.body);
    const datavalue=data[0]?.dataValues
     let {gateinparts,...gateindata}=datavalue
    console.log(gateinparts, "data")
    
    let partmap=gateinparts.map((item)=>{

    return  {
      'id':item.dataValues.id,
      'poparts_id':item.dataValues.poparts_id,
      'Parts Code':item.dataValues.item_code,
      'Description':item.dataValues.item_description,
    // 'HSN Code':item.dataValues.hsncode,
    
    'Sup. inv qty':item.dataValues.quantity,
    'Received Qty':item.dataValues.quantity,
    'Rate':item.dataValues.rate,
    'Cost':item.dataValues.cost,
    'MRP':item.dataValues.mrp,
    'Discount Amount':item.dataValues.discount ||0,
    'CGST':item.dataValues.cgst,
    'SGST':item.dataValues.sgst,
    'IGST':item.dataValues.igst,
    "Remarks":item.dataValues.remarks,
    "status":item.dataValues.status,
    "Total Amount":item.dataValues.total,
    "item_id":item.dataValues.item_id,
    "oracle_stocktransferparts_id":item.dataValues.oracle_stocktransferparts_id,
    "erp_stocktransferparts_id":item.dataValues.erp_stocktransferparts_id,
    }
  })

    console.log(partmap,"partmap")

  
    return res.status(200).json({
      requestSuccessful: true,
      message: "Gatein for GRN data Fetched Successfully ",
      partdata: partmap,
      gateindata:gateindata,
    });

  } catch (err) {
    logger.error('Gatein Contrller Error:', err);
    next(err);
  }
}

const UpdateGateIn = async (req, res, next) => {
  try {
    let {id,bindata,...gateindata}=req.body
    console.log(bindata,"bindata")
    let link;
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
                  console.log(
                    'file------------',
                    `https://storage.googleapis.com/${bucketName}/PurchaseInvoice/${newName}`
                  );
                 
                    link= `https://storage.googleapis.com/${bucketName}/PurchaseInvoice/${newName}`
                  gateindata.invoice_pdf_url=link
                });
      
                // Upload the file to Google Cloud Storage
                blobStream.end(buffer);
      
                await finishedPromise(blobStream);
    }
    let data = await GateinService.updateGatein(id,gateindata, req.user);

    if (bindata) {
      // Ensure bindata is always an array
      if (!Array.isArray(bindata)) {
        bindata = [bindata]; // Convert single item to an array
      }

      // Parse each item since FormData sends objects as JSON strings
      bindata = bindata.map(item => JSON.parse(item));
    }
    let binResult;
    if(bindata&&bindata.length>0){
      binResult=await GateinService.CreateGateeinBinLocation(bindata)
    }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Gate in  Updated Successfully ",
      data,
      binResult
      
    });

  } catch (err) {
    logger.error('update Gate in Error:', err);
    next(err);
  }
}

const GetGateinReport = async (req, res, next) => {
  let data = {}
  try {
    data = await GateinService.getGateinReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    let responsedata=[]
      for(let item of data){
        let GateInStatus= item.status === 1 ? "Gatein Time Captured" : item.status===2 ? "Supplier Invoice Amount Tallied" : item.status===3 ? "Bin location Updated" :
         item.status===4 ? "Physically Binning" : item.status===5 ? "Grn Created" : null
      
      const date = new Date(item.invoice_date).toISOString()
      const createdDate = item.gatein_date_time

      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.cost * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      responsedata.push(
        {
          "Branch": req.user.outlet.outletCode,
          "Doc Date": createddateformat,
          "Document Number": item.gatein_no,
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
          "Gatein Status": GateInStatus
        }
      )
      
    }

    const filepath = path.join(__dirname, "GateinReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Gatein Report");


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
      "attachment; filename=GateinReport.xlsx"
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
    logger.error('Gate in Contrller Error:', err);
    next(err);
  }
}

const controller = {
  CreateGateIn,GetGateIn, GetGateinForGRN,UpdateGateIn,GetGateinReport
}




export default controller;
