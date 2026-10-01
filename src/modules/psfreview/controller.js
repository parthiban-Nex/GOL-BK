import PsfReviewService from './service.js';

import logger from './../../config/logger.js';
import commonLogic from '../../shared/commonLogics.js';
import excel from 'exceljs';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { Storage } from '@google-cloud/storage';
import db from '../index.js';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedPromise = promisify(finished);
const Outlet=db.outlets
const Transactions=db.jobCard
const CreatePsfReview= async (req, res, next) => {
  try {
    let psfreviewdata={}
    let psfreviewlogdata={}
    let customercomplaintdata={}
    let customerfeedbackdata={}
    psfreviewdata = await PsfReviewService.CreatePsfReview(req.body.psfreviewdata,req.user);
    psfreviewlogdata = await PsfReviewService.CreatePsfReviewLog(req.body.psfreviewdata,req.user,psfreviewdata);

    customerfeedbackdata = await PsfReviewService.CreateCustomerFeedback(req.body.customer_feedback,psfreviewdata,psfreviewlogdata);
   if(req?.body?.customer_complaint){
    customercomplaintdata = await PsfReviewService.CreateCustomerComplaint(req.body.customer_complaint,req.user);
   }
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Psf Review Posted Successfully ",
      // psfreviewdata,
      // psfreviewlogdata,
      // customerfeedbackdata,
      // customercomplaintdata
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}

const GetPsfReviewLog= async (req, res, next) => {
  try {
    let psfreviewlogdata={}
    psfreviewlogdata = await PsfReviewService.GetPsfReviewLog(req.body,req.user);

   let resdata= psfreviewlogdata.map((item)=>{
    const date = (item.createdAt).toISOString()
      const dateformat = date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4)+
      '  '+date.slice(11,19)
      return({...item,createdAt:dateformat})
    })
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Psf Review log data fetched Successfully ",
      psfreviewlogdata:resdata
      
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}

const GetPsfReport = async (req, res, next) => {
  let data = {}
  try {
    data = await PsfReviewService.getPsfReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    let responsedata=[]
    const allQuestions = new Set();

data.forEach(item => {
  item?.feedbacks?.forEach(f => {
    if (f?.question) {
      allQuestions.add(f.question);
    }
  });
});
    for(let item of data) {
      console.log(item?.feedbacks,"item")
      const date = (item.Doc_Date).toISOString()
      const createdDate = (item.job_card_date).toISOString()

      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
           let resobj={
          "Branch": item.outlet_code,
          "Delivery Date":item.delivery_date,
          "Invoice Date": dateformat,
          "Invoice Number": item.bill_no,
          "Job Card Number":item.Doc_Number,
          "Job Card Date": createddateformat,
          "Customer Code":item.customer_code,
          "Customer Name": item.customer_name? commonLogic.decrypt(item.customer_name):"",
          "Customer Mobile Number": item.Cus_mobile? commonLogic.decrypt(item.Cus_mobile):"",
          "Vehicle Reg No":item.reg_no,
          "Make":item.Make,
          "model":item.Model,
          "SA Name":item.sa_name,
          "PSF Status":item.psf_status==1 ? "Updated" :item.psf_status==2 ?   "Pending" : item.psf_status==3 ? "Completed" : "Not Updated",
          "Customer Satisfaction": item.customer_satification =="1" ? "Yes" :item.customer_satification=="2" ? "No" :"Others",
          "Phone Call Notes":item.phone_call_notes,
          "Customer Complain Text":item.customer_complaint_text,
          "Disposition": item.dispositionTitle,
          "Sub Disposition":item.subDisPositionTitle,
          "Follow Up Date":item.followup_date,
          "Psf Agent Name":item.psf_agent_name
        }  


  for (const q of allQuestions) {
    if(q){
  resobj[q] = "";
    }
}

  item?.feedbacks?.forEach(feedback => {
  if (feedback?.question) {
    resobj[feedback.question] = feedback.rating ?? "";
  }
});
       
      responsedata.push(resobj)
    }

const filepath = path.join(__dirname, `ComplaintReport_${Date.now()}.xlsx`);
    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Complaint Report");


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
      "attachment; filename=PsfReport.xlsx"
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
const GetCustomerComplaintSource= async (req, res, next) => {
  try {
    let customerComplaintSource={}
    customerComplaintSource = await PsfReviewService.GetCustomerComplaintSource(req.user);

    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Complaint Source fetched Successfully ",
      data:customerComplaintSource
      
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}
const GetCustomerComplaint = async (req, res, next) => {
  try {
    let { complaints: data, count } = await PsfReviewService.getCustomerComplaint(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const outletcode=item?.complaint_no?.split("-")[1]?.slice(0,4)
      return ({
        Branch: outletcode,
        ...item.dataValues,status:item.status==1 ? "Open" : item.status==2 ? "Wip" : item.status==3 ? "Closed"
         : item.status==4 ?"Completed" : "Cancelled" 
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Complaint data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('customer complaint Contrller Error:', err);
    next(err);
  }
}
const GetClosedCustomerComplaint = async (req, res, next) => {
  try {
    let { complaints: data, count } = await PsfReviewService.getClosedCustomerComplaint(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const outletcode=item?.complaint_no?.split("-")[1]?.slice(0,4)
      return ({
        Branch: outletcode,
        ...item.dataValues,status:item.status==1 ? "Open" : item.status==2 ? "Wip" : item.status==3 ? "Closed"
         : item.status==4 ? "Completed" : "Cancelled" 
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Closed Complaint data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('customer complaint Contrller Error:', err);
    next(err);
  }
}
const CreateCustomerCompliant= async (req, res, next) => {
  try {
    
    let customercomplaintdata={}
    let link;
    const reqdata={...req.body}
    const outletCode=reqdata.Outlet
    const outletdata=await Outlet.findOne({
      where: {  
        outletCode: outletCode
      }
    })
    if(!outletdata){
      return res.status(400).json({
        requestSuccessful: false,
        message: "Invalid Outlet Code"
      });
    }
    const jobCardData=await Transactions.findOne({
      where: {
        job_card_no: reqdata.complaint_against_job_card_no,
      }
    })  
    if(!jobCardData){
      return res.status(400).json({
        requestSuccessful: false,
        message: "Invalid Job Card Number"
      });
    }
    reqdata.branch_id=outletdata.id
    reqdata.complaint_against_job_card_id=jobCardData.id
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
                  reqdata.complaint_upload=link
                });
      
                // Upload the file to Google Cloud Storage
                blobStream.end(buffer);
      
                await finishedPromise(blobStream);
    }
  
    customercomplaintdata = await PsfReviewService.CreateCustomerComplaint(reqdata,req.user);
   
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Complaint Created Successfully ",
      customercomplaintdata
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}

const GetComplaintReport = async (req, res, next) => {
  let data = {}
  try {
    data = await PsfReviewService.getComplaintReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    let responsedata=[]
    for(let item of data) {
      console.log(item,"item")
      const createdDate = (item.createdAt).toISOString()

      const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)
           let resobj={
          "Branch": item.outletCode,
          "Complaint Number":item.complaint_no,
          "Complaint Date":createddateformat,
          "Job Card Number":item.complaint_against_job_card_no,
          "Vechicle Reg No":item.vehicle_reg_no,
          "Make":item.make,
          "Model":item.model,
          "Customer Code":item.customer_code,
          "Customer Name": item.customer_name,
          "Customer Mobile Number": item.customer_mobile,
          "Status":item.status==1 ? "Open" : item.status==2 ? "Wip" : item.status==3 ? "Closed" : item.status==5 ? "Cancelled" : "",
          "Disposition": item.disposition_name,
          "Reason":item.reason,
          "Next Follow Up":item.next_follow_up,
          "Complaint Rescheduled Date":item.complaint_rescheduled_date,
          "Phone Call Notes":item.phone_call_notes,
          "Source Of Complaint":item.complaint_source
          // "Psf Agent Name":item.psf_agent_name
        }  
     
      responsedata.push(resobj)
    }

    const filepath = path.join(__dirname, "ComplaintReport.xlsx");

    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Complaint Report");


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
      "attachment; filename=ComplaintReport.xlsx"
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
    logger.error('Complaint Contrller Error:', err);
    next(err);
  }
}

const UpdateCustomerCompliant= async (req, res, next) => {
  try {
    
    let customercomplaintdata={}
    customercomplaintdata = await PsfReviewService.UpdateCustomerComplaint(req.body,req.user);
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Complaint Updated Successfully ",
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}

const GetCustomerComplaintForSa = async (req, res, next) => {
  try {
    let { complaints: data, count } = await PsfReviewService.getCustomerComplaintForSa(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
      const outletcode=item?.complaint_no?.split("-")[1]?.slice(0,4)
      return ({
        Branch: outletcode,
        ...item.dataValues,status:item.status==1 ? "Open" : item.status==2 ? "Wip" : item.status==3 ? "Closed"
         : item.status==4 ? "Completed" : "Cancelled" 
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Closed Complaint data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('customer complaint Contrller Error:', err);
    next(err);
  }
}

const UpdateCustomerComplaintForSa= async (req, res, next) => {
  try {
    
    let customercomplaintdata={}
    let link;
    const reqdata={...req.body}
    
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
                  reqdata.complaint_upload=link
                });
      
                // Upload the file to Google Cloud Storage
                blobStream.end(buffer);
      
                await finishedPromise(blobStream);
    }
  
    customercomplaintdata = await PsfReviewService.UpdateCustomerComplaintForSa(reqdata,req.user);
   
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Customer Complaint Created Successfully ",
      customercomplaintdata
    });

  } catch (err) {
    logger.error('Psf Review Contrller Error:', err);
    next(err);
  }
}
const controller = {
  CreatePsfReview,GetPsfReviewLog,GetPsfReport,GetCustomerComplaintSource,GetCustomerComplaint,
  GetClosedCustomerComplaint,CreateCustomerCompliant,GetComplaintReport,UpdateCustomerCompliant,
  GetCustomerComplaintForSa,UpdateCustomerComplaintForSa
}




export default controller;
