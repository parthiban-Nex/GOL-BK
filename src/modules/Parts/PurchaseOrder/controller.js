import POservice from './service.js';
import logger from '../../../config/logger.js';
import excel from 'exceljs';
import fs from 'fs';
import path from 'path'; 
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';
const finishedPromise = promisify(finished);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CreatePO = async (req, res, next) => {
  let PO_data = {};
  let PO_Parts_data = {};
const podata = JSON.parse(req.body.podata);
const poparts = JSON.parse(req.body.poparts);
  try {
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
                      podata.invoice_pdf_url=link
                    });
          
                    // Upload the file to Google Cloud Storage
                    blobStream.end(buffer);
          
                    await finishedPromise(blobStream);
        }
        if(podata?.id){
          PO_data = await POservice.UpdatePO(podata, req.user);
          let deletedparts=await POservice.DeletePoParts(podata.id)
          PO_Parts_data= await POservice.CreatePOPartsForEditing(poparts);
        }
        else{
          PO_data = await POservice.CreatePO(podata, req.user);
    PO_Parts_data= await POservice.CreatePOParts(poparts, PO_data);
        }
   
    
    return res.status(200).json({
      requestSuccessful: true,
      message: 'PO Created Successfully',
      // data: {
      //   POData: PO_data,
      //   POPartsData: PO_Parts_data,
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



const GetPO = async (req, res, next) => {
  try {
    let { PODetails: data, count } = await POservice.getPO(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      
      return ({
        Branch: req.user.outlet.outletCode,...item.dataValues,status:item.status==1 ? "Open" : item.status==2 ? "Approved" : item.status==3 ? "Partially Approved"
         : item.status==4 ? "Cancelled" : item.status==5 ?"Grn Created" : item.status==6 ? "Partially Grn Created" : ""
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Po data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}

const GeneratePOPdf = async (req, res, next) => {
  let data = {}
  let outletDetails = {}
  let user = req.user
  try {
    data = await POservice.generatePOPdf(req.body,);
    console.log(data, "data")
    outletDetails["outlet_name"] = user.outlet.outletName
    outletDetails["outlet_address1"] = user.outlet.address1
    outletDetails["outlet_address2"] = user.outlet.address2
    outletDetails["outlet_city"] = user.outlet.city + "," + user.outlet.state + "," + user.outlet.pincode
    outletDetails["outlet_gst"] = user.outlet.gstIn
    outletDetails["branch"] = user.outlet.outletCode
    return res.status(200).json({
      requestSuccessful: true,
      message: "PO pdf data Fetched Successfully ",
      data: data,
      outlet_details: outletDetails
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}

const CreateAutoPO = async (req, res, next) => {
  const body = req.body;

  try {
    const groupedData = groupPOByVendor(body.podata, body.poparts);

    const response = [];

    for (const vendorId of Object.keys(groupedData)) {
      const vendorData = groupedData[vendorId];
      
      // Call CreatePO for each vendor's data
      const POData = await POservice.CreatePO(vendorData.podata, req.user);
      
      // Call CreatePOParts for each vendor's parts
      const POPartsData = await POservice.CreatePOParts(vendorData.poparts, POData);
      
      response.push({
        vendor_id: vendorId,
        POData,
        POPartsData,
      });
    }

    return res.status(200).json({
      requestSuccessful: true,
      message: 'PO Created Successfully for all vendors',
      data: response,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      return res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful: false,
      });
    } else {
      return res.status(500).json({
        requestSuccessful: false,
        message: error.message,
      });
    }
  }
};

// Helper function to group data by vendor_id
const groupPOByVendor = (podata, poparts) => {
  const grouped = {};

  poparts.forEach((part) => {
    const vendorId = part.vendor_id;
    const vendorCode = part.vendor_code;

    if (!grouped[vendorId]) {
      grouped[vendorId] = {
        podata: {
          ...podata,
          vendor_id: vendorId, // Attach the vendor_id to podata
          vendor_code:vendorCode ,
        },
        poparts: [],
      };
    }

    grouped[vendorId].poparts.push(part);
  });

  return grouped;
};

const GetPOReport = async (req, res, next) => {
  let data = {}
  try { 
    data = await POservice.getPOReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = data.map((item) => {
      const createdDate = (item.createdAt).toISOString()

      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
      let grnCreatedDateFormat = "";

      if (item.grn_date) {
        const grnCreatedDate = new Date(item.grn_date).toISOString();
        grnCreatedDateFormat =
          grnCreatedDate.slice(8, 10) + "-" +
          grnCreatedDate.slice(5, 7) + "-" +
          grnCreatedDate.slice(0, 4);
      }

      let grnInvoiceDateFormat = "";

      if (item.invoice_date) {
        const grnInvoiceDate = new Date(item.invoice_date).toISOString();
        grnInvoiceDateFormat =
          grnInvoiceDate.slice(8, 10) + "-" +
          grnInvoiceDate.slice(5, 7) + "-" +
          grnInvoiceDate.slice(0, 4);
      }
      const totaltaxablevalue = (item.cost * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      return (
        {
          "Branch": req.user.outlet.outletCode,
          "PO Number": item.po_number,
          "PO Date": createddateformat,
          "PO Status": item.status==1 ? "Open" : item.status==2 ? "Approved" : item.status==3 ? "Partially Approved" 
         : item.status==4 ? "Cancelled" : item.status==5 ?"Grn Created" : item.status==6 ? "Partially Grn Created" : "",
          "Vendor Code": item.vendor_code,
          "Vendor Name": item.vendorName,
          "Parts Code": item.item_code,
          "Parts Name": item.item_description,
          "Parts Category": item.itemCategorie,
          "Vin Number"  : item.vin_number,
          "Reg No": item.reg_no,
          "Quantity": item.quantity,
          "Rate": item.rate,
          "Cost": item.cost,
          "MRP": item.mrp,
          "Discount": item.discount,
          "CGST": item.cgst,
          "SGST": item.sgst,
          "IGST": item.igst,
          "Total": totaltaxablevalue + totaltax,
          "Parts Aggregate": item.aggregateName,
          "Sub Aggregate": item.subAggregateName,
          "Make": item.makeName,
          "Model": item.modelName,
          "Job Card Number": item.jc_no,
          "Grn Number":item.grn_no,
          "Grn Date":grnCreatedDateFormat,
          "Invoice Date":grnInvoiceDateFormat,
          "Back Order Quantity":item.back_order_quantity,
          "Stock Quantity":item.stock_quantity,
          // "GSTIN": item.gstin,
          // "Supplier City": item.city,
          // "Supplier Inv No": item.invoice_number,
          
          // "HSN Code": item.hsnCode,
          // "UOM": item.uomType,
          
          // "Unit Cost[Before Disc]": item.cost,
          // "Unit Sale Rate": item.rate,
          // "MRP": item.mrp,
          
          // "Total Taxable Value": totaltaxablevalue,
          // "Unit Cost [After Disc]": item.cost - (item.discount / item.quantity),
          
          // "Total Tax": totaltax,
          
          
        }
      )
    })


        const filepath = path.join(__dirname, "PurchaseOrderReport.xlsx");
    
        const workbook = new excel.stream.xlsx.WorkbookWriter({
          filename: filepath,
          useStyles: true,
          useSharedStrings: true,
        });
    
        const worksheet = workbook.addWorksheet("Purchase Order Report");

 
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
      "attachment; filename=PurchaseOrderReport.xlsx"
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

const GetPOForApporove = async (req, res, next) => {
  try {
    let { PODetails: data, count } = await POservice.getPOForApprove(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const ponumber=item.dataValues.po_number.split("-")[1]
      return ({
        Branch:ponumber.slice(0,ponumber.length-2) ,...item.dataValues,
        status:item.status==1 ? "Open" : item.status==2 ? "Approved" : item.status==3 ? "Partially Approved"
         : item.status==4 ? "Cancelled" : item.status==5 ? "GRN Created" :item.status==6 ? "Partially GRN Created" :  null
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Po data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}

const GetPODetailsForApprove = async (req, res, next) => {
  let data = []
  let outletDetails = {}
  let user = req.user
  let partmap=[]
  let podata={}
  let povendormap={}
  try {
    data = await POservice.getPoDetailForApprove(req.body,);
    const datavalue=data[0]?.dataValues
    console.log(data,"datavalue")
     let {po_parts,povendormap,...podata}=datavalue
    console.log(po_parts,povendormap,podata, "data")
    
    let partmap=po_parts.map((item)=>{

    const margin=(((item.dataValues.rate-item.dataValues.cost-item.dataValues.discount)/item.dataValues.cost)*100).toFixed(2)
    return  {
      'id':item.dataValues.id,
      'Parts Code':item.dataValues.item_code,
      'Description':item.dataValues.item_description,
    'HSN Code':item.dataValues.hsncode,
    "Make":item.dataValues.pomakemap.makeName,
    "Model":item.dataValues.pomodelmap.modelName,
    "Parts Category":item.dataValues.poitemcategorymap.itemCategorie,
    "Vin Number":item.dataValues.vin_number,
    "Reg No":item.dataValues.reg_no,
    'Quantity':item.dataValues.quantity,
    'Rate':item.dataValues.rate,
    'Cost':item.dataValues.cost,
    'Margin %':margin,
    'MRP':item.dataValues.mrp,
    'Discount Amount':item.dataValues.discount,
    'CGST':item.dataValues.cgst,
    'SGST':item.dataValues.sgst,
    'IGST':item.dataValues.igst,
    'Total Amount':item.dataValues.total,
    "Remarks":item.dataValues.remarks,
    "status":item.dataValues.status
    }
  })

    console.log(partmap,"partmap")

    outletDetails["outlet_name"] = user.outlet.outletName
    outletDetails["outlet_address1"] = user.outlet.address1
    outletDetails["outlet_address2"] = user.outlet.address2
    outletDetails["outlet_city"] = user.outlet.city + "," + user.outlet.state + "," + user.outlet.pincode
    outletDetails["outlet_gst"] = user.outlet.gstIn
    outletDetails["branch"] = user.outlet.outletCode
    return res.status(200).json({
      requestSuccessful: true,
      message: "PO pdf data Fetched Successfully ",
      partdata: partmap,
      podata:podata,
      vendordata:povendormap,
      outletdata: outletDetails
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}

const ApprovePO = async (req, res, next) => {
  const body = req.body;
  let PO_data = {};
  let PO_Parts_data = {};
  try {
    PO_data = await POservice.ApprovePO(body.podata, req.user);
     PO_Parts_data= await POservice.UpdatePOParts(body.poparts);
    
    return res.status(200).json({
      requestSuccessful: true,
      message: 'PO Updated Successfully',
      data: {
        POData: PO_data,
        POPartsData: PO_Parts_data,
      },
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

const GetPOForGRN = async (req, res, next) => {
  try {
    const data = await POservice.getPoforGrn(req.body);
    const datavalue = data[0]?.dataValues;

    if (!datavalue) {
      return res.status(404).json({
        requestSuccessful: false,
        message: "No PO data found",
      });
    }

    const { po_parts, ...poDetails } = datavalue;

    const partmap = po_parts.map((item) => {
      const val = item?.dataValues || {};
      const margin = (((val.rate - val.cost) / val.rate) * 100).toFixed(2);

      return {
        id: val.id,
        "Parts Code": val.item_code,
        Description: val.item_description,
        "HSN Code": val.hsncode,
        // Make: val.pomakemap?.makeName || "",
        // Model: val.pomodelmap?.modelName || "",
        // "Parts Category": val.poitemcategorymap?.itemCategorie || "",
        "Vin Number": val.vin_number,
        "Reg No": val.reg_no,
        "Sup. inv qty": val.quantity,
        "BackOrder Qty": val.back_order_quantity,
        Rate: val.rate,
        Cost: val.cost,
        "Margin %": margin,
        MRP: val.mrp,
        "Discount Amount": val.discount ?? 0,
        CGST: val.cgst,
        SGST: val.sgst,
        IGST: val.igst,
        Remarks: val.remarks,
        status: val.status,
        "Total Amount": "",
        item_id: val.item_id,
      };
    });

    return res.status(200).json({
      requestSuccessful: true,
      message: "PO for GRN data fetched successfully",
      partdata: partmap,
      podata: poDetails,
    });

  } catch (err) {
    logger.error('PO Controller Error:', err);
    next(err);
  }
};

const GetPOForEditing = async (req, res, next) => {
  try {
    let data = await POservice.getPoforEditing(req?.body?.id, req.user);
    console.log(data, "data")
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Po data Fetched Successfully ",
      data,
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}

const GetPOForView = async (req, res, next) => {
  try {
    let data = await POservice.getPoforView(req?.body?.id, req.user);
    console.log(data, "data")
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Po data Fetched Successfully ",
      data,
    });

  } catch (err) {
    logger.error('PO Contrller Error:', err);
    next(err);
  }
}
const controller = {
  CreatePO, GetPO, GeneratePOPdf,CreateAutoPO,GetPOReport,GetPOForApporove,GetPODetailsForApprove,ApprovePO,
  GetPOForGRN,GetPOForEditing,GetPOForView

}



export default controller;
