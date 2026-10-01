import PartIssueService from './service.js';
import excel from 'exceljs';
import fs from 'fs';
import path from 'path'; // ✅ Import path
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import commonLogic from '../../../shared/commonLogics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Utility functions
const formatDate = (date) => {

  if (!date || isNaN(new Date(date).getTime())) {
    return '';
  }

  const d = new Date(date).toISOString();
  return `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`;
};

const formatIndentData = (fetchData) => {
  return fetchData.map((item) => ({
    "Branch": item.outlet_code,
    "Job Card No": item.job_card_no,
    "Job Card Date": formatDate(item.jobCard_date),
    "Item Group": item.itemgroupId,
    "Vehicle Reg No": item.reg_no,
    "Requested Date": formatDate(item.Req_date),
    "Requested PartCode": item.Req_item_code,
    "Requested PartName": item.Req_item_name,
    "Issue Date": item.issue_date ? formatDate(item.issue_date) : '',
    "Part Code": item.Stock_code,
    "Part Description": item.reg_no,
    "VIN No": item.chassisNumber,
    "Make": item.makeName,
    "Model": item.modelName,
    "Requested Qty": item.request_quantity,
    "Issue Qty": item.stock_issue,
    "Pending Qty": (item.request_quantity - item.stock_issue),
    // "Returned Qty": item.return_quantity,
    "Customer Name": item.customer_name,
    "Rate": item.rate,
    "Tax": ((((item.rate * item.quantity) - item.discount) * item.cgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.sgst) / 100) + ((((item.rate * item.quantity) - item.discount) * item.igst) / 100),
    "Amount": commonLogic.calculateTotalInvoiceAmount(item),
    "Document Type": item.document_type,
    "Job Card Status": item.status_value,
    "Approve Status": '',
    "Approve Date": '',
    "ETA":item.eta,
    "Remarks":item.remarks,
    "Fuel Type":item.fuelType
  }));
};

const CreatePartIssue = async (req, res, next) => {
  const body = req.body;
  let Part_issue_data = {};
  let Stock_data = {};
  let Stock_log_data;
  let part_indent_data;
  try {
    Part_issue_data = await PartIssueService.CreatePartIssue(body, req.user);
    Stock_data = await PartIssueService.Updatestock(Part_issue_data,req.user);
    Stock_log_data = await PartIssueService.CreateStocklog(Stock_data);
    part_indent_data = await PartIssueService.UpdatePartIntent(body);
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Part Issued Successfully',
      // data: {
      //   PartIssuedata: Part_issue_data,
      //   StockData: Stock_data,
      //   StockLogData: Stock_log_data,
      //   partIndentData: part_indent_data,
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

const GetIndentPartIssueReport = async (req, res, next) => {
  let indentPartIssueData = [];
  try {
    indentPartIssueData = await PartIssueService.getIndentPartIssue(req.body, req.user);
    console.log(" from controller service ...", indentPartIssueData);
    // return false;
    if (!indentPartIssueData.length) {
      return res.status(404).json({ message: "No records found for given date range" });
    }
    const mergedData = [
      ...formatIndentData(indentPartIssueData)
    ];
    if (mergedData.length === 0) {
      return res.status(404).json({ message: "No data available for export" });
    }
    const filepath = path.join(__dirname, "IndentVsStockIssue.xlsx");
    const workbook = new excel.stream.xlsx.WorkbookWriter({
      filename: filepath,
      useStyles: true,
      useSharedStrings: true,
    });
    const worksheet = workbook.addWorksheet("Indent Vs Stock Report");

    const headers = ["SL NO", ...Object.keys(mergedData[0])];
    worksheet.columns = headers.map((header) => {
      const maxLength = mergedData.reduce((max, row) => {
        const cellValue = row[header] ? row[header].toString() : "";
        return Math.max(max, cellValue.length);
      }, header.length);
      return { header, key: header.toLowerCase(), width: maxLength + 5 };
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
    for (let i = 0; i < mergedData.length; i++) {
      await worksheet.addRow([i + 1, ...Object.values(mergedData[i])]).commit();
    }
    await workbook.commit(); //  Ensure the file is fully written before proceeding

    res.setHeader("Content-Disposition", "attachment; filename=indent_stock_issue.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    //  Wait until the file is completely written before reading
    fs.createReadStream(filepath)
      .pipe(res)
      .on("finish", () => {
        console.log(" File streamed successfully, deleting temporary file...");
        fs.unlinkSync(filepath);
      });

  } catch (err) {
    console.error(" Error generating report:", err);
    res.status(500).json({ message: "Error generating report" });
  }
};

const GetSalesGrossMarginReport = async (req, res, next) => {
  let data = {}
  try {
    data = await PartIssueService.getSalesGrossMarginReport(req.body, req.user);
    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    const responsedata = data.map((item) => {
      // const createdDate = (item.createdAt).toISOString()

      // const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.rate * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      return (
        {
          "Branch": req.user.outlet.outletCode,
          "Job Card No": item.job_card_no,
          "Job Card Date": item.jobCard_date,
          "Customer Code": item.customer_code,
          "Customer Name": item.customer_name,
          "Customer Group":item.customer_type,
          "customer GSTIN": item.customer_gstin,
          // "Vendor Code": item.vendor_code,
          // "Vendor Name": item.vendorName,
          "Item Code": item.item_code,
          "Item Name": item.item_name,
          "HSN Code": item.hsnCode,
          "Sale Doc Name":item.bill_no,
          "Sale Doc Date": item.billing_date,
          "Sale Quantity": item.quantity,
          "Sale Rate": item.rate*item.quantity-item.discount,
          "Cost": item.cost*item.quantity,
          "Margin": item.rate*item.quantity-item.discount-item.cost*item.quantity,
          "Margin %": (((item.rate*item.quantity-item.discount)-(item.cost*item.quantity))/(item.cost*item.quantity))*100,
          "Unit Rate": item.rate,
          "Unit Cost": item.cost,
          "Total Discount": item.discount,
          "MRP": item.mrp,
          "CGST %": item.cgst,
          "SGST %": item.sgst,
          "IGST %": item.igst,
          "CGST": cgst,
          "SGST": sgst,
          "IGST": igst,
          "Total Amount": totaltaxablevalue + totaltax,
          "Source":item.source,
          "Source Type":item.sourceType,
          "Vehicle Reg No": item.reg_no,
          "Chassis Number": item.chassisNumber,
          "Make": item.makeName,
          "Model": item.modelName,
          "Parts Category": item.itemCategorie,
          "Parts Aggregate": item.aggregateName,
          "Sub Aggregate": item.subAggregateName,
          "Service Type": item.serviceType
        }
      )
    })

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Sales Gross Margin Report");
    const headers = ["SL NO", ...Object.keys(responsedata[0])]
    const rowData = [headers, ...responsedata.map((item, index) => ([index + 1, ...Object.values(item)]))];
    rowData.forEach((row) => worksheet.addRow(row));

    // Dynamically calculate and set column widths
    worksheet.columns = headers.map((header, colIndex) => {
      const maxLength = rowData.reduce((max, row) => {
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

    // Send File as Response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PurchaseReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end()

  } catch (err) {
    next(err);
  }
}

const GetARReport = async (req, res, next) => {
  let data = {}
  try {
    data = await PartIssueService.getARJobcardReport(req.body, req.user);
   let csdata = await PartIssueService.getARCounterSaleReport(req.body, req.user);

    if ((!data || data.length === 0) && (!csdata || csdata.length === 0)) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
      
    }
            console.log(data, "data")

    function addRoundOffRows(data) {
      const grouped = {};
    
      // Step 1: Group by bill_no
      for (const row of data) {
        if (!grouped[row.bill_no]) grouped[row.bill_no] = [];
        grouped[row.bill_no].push(row);
      }
    
      const finalResult = [];
    
      for (const bill_no in grouped) {
        const rows = grouped[bill_no];
    
        // Step 2: Sum all (rate + tax) values
        let total = 0;
        for (const r of rows) {
          total += Number(r.rate || 0) + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0);
        }
    
        const roundedTotal = Math.round(total);
        const roundOff = Number((roundedTotal - total).toFixed(2)); // fix to 2 decimals
    
        finalResult.push(...rows); // Add original rows
    
        if (roundOff !== 0) {
          const sampleRow = rows[0]; // Copy from the first row
          finalResult.push({
            ...sampleRow,
            rate: roundOff,
            cgst: 0,
            sgst: 0,
            igst: 0,
            discount: 0,
            quantity: 1,
            hsnCode: null,
            uomType: null,
            makeName: null,
            modelName: null,
            source: 'RoundOff'
          });
        }
      }
    
      return finalResult;
    }
    const dataWithRoundOff = addRoundOffRows(data);
    const csdataWithRoundOff = addRoundOffRows(csdata);    

    function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  value = value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

    const jobcarddata = dataWithRoundOff.map((item) => {
      // const createdDate = (item.createdAt).toISOString()

      // const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.rate * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      const formatteddate=item.billing_date.toISOString().slice(0,10)
      return (
        {
          "BusinessUnit":"Ki Mobility Solutions Services",
          "TransactionClass":"Invoice",
          "BatchSourceName":"DMS",
          "TransactionType": item.bill_type=="cash" ? "KIS-CASH SALES" : "KIS-CREDIT SALES",
          "TransactionNumber": item.bill_no,
          "TransactionDate": formatteddate,
          "AccountingDate":  formatteddate,
          "CustomerAccount":item.oracleCashCustomerCode,
          "CustomerSiteNumber":item.oracleSiteCode,
          "JobCardNumber": item.job_card_no,
          "ChassisNumber": item.chassisNumber,
          "EngineNumber": item.engineNumber,
          "Model": escapeCSV(item.modelName),
          "ModelCode":"",
          "Outlet":item.oracleLocation,
          "VehicleNumber": item.reg_no,
          "Description":item.source=="PartsIssue" ? "Workshop parts Sales" : item.source=="Schedule" ? "Workshop Labor Sales" : item.source=="OslSchedule" ? "Workshop OSL Labor Sales" :"Round Off Value",
          "Quantity": item.quantity,
          "UOM": item.uomType,
          "UnitPrice": item.rate-(item.discount/item.quantity),
          "Amount": item.rate*item.quantity-item.discount,
          "GSTTaxClassification":item.source=="RoundOff" ? "": item.igst==0 ? `CGST+SGST REC ${item.cgst+item.sgst}` :`IGST REC ${item.igst}`,
          "CGST": cgst.toFixed(2),
          "SGST": sgst.toFixed(2),
          "IGST": igst.toFixed(2),
          "HSNCode": item.hsnCode,
          "Company":"201",
          "LOB": item.companyId=="2"  ? "2041" :item.companyId=="5" ? "2042" : item.companyId=="4" || item.companyId=="7" ? "2062" : "",
          "Location":item.oracleLocation,
          "CostCentre":"919",
          "NaturalAccount":item.source=="PartsIssue" ? "411110" : item.source=="RoundOff" ? "432070" : "413414",
        }
      )
    })
    const countersaledata = csdataWithRoundOff.map((item) => {
      // const createdDate = (item.createdAt).toISOString()

      // const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.rate * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
            const formatteddate=item.billing_date.toISOString().slice(0,10)

      return (
        {
          "BusinessUnit":"Ki Mobility Solutions Services",
          "TransactionClass":"Invoice",
          "BatchSourceName":"DMS",
          "TransactionType": item.bill_type=="CSC" ? "KIS-COUNTERSALE CASH" : "KIS-COUNTERSALE CRD",
          "TransactionNumber": item.bill_no,
          "TransactionDate": formatteddate,
          "AccountingDate": formatteddate,
          "CustomerAccount":item.oracleCashCustomerCode,
          "CustomerSiteNumber":item.oracleSiteCode,
          "JobCardNumber": "",
          "ChassisNumber":"",
          "EngineNumber": "",
          "Model": "",
          "ModelCode":"",
          "Outlet":item.oracleLocation,
          "VehicleNumber": "",
          "Description":item.source=="countersale" ? "Workshop Counter Sales" : "Round Off Value",
          "Quantity": item.quantity,
          "UOM": item.uomType,
          "UnitPrice": (item.rate-(item.discount/item.quantity)) || 0,
          "Amount": item.rate*item.quantity-item.discount,
          "GSTTaxClassification":item.source=="RoundOff" ? "": item.igst==0 ? `CGST+SGST REC ${item.cgst+item.sgst}` :`IGST REC ${item.igst}`,
          "CGST": cgst.toFixed(2),
          "SGST": sgst.toFixed(2),
          "IGST": igst.toFixed(2),
          "HSNCode": item.hsnCode,
          "Company":"201",
          "LOB":item.companyId=="2"  ? "2041" :item.companyId=="5" ? "2042" : "",
          "Location":item.oracleLocation,
          "CostCentre":"919",
          "NaturalAccount":item.source=="countersale" ? "411110" : "432070" ,
        }
      )
    })

    const responsedata = [
      ...jobcarddata,
      ...countersaledata
    ]


// Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=ARReport.csv");
res.setHeader("Content-Type", "text/csv");

res.write(Object.keys(responsedata[0]).join(",") + "\n");

// Stream each row
for (const row of responsedata) {
  const values = Object.values(row).map(v => v ?? "").join(",");
  res.write(values + "\n");
}

// End the response
res.end();

    // const workbook = new excel.Workbook();
    // const worksheet = workbook.addWorksheet("AR Report");
    // const headers = [ ...Object.keys(responsedata[0])]
    // const rowData = [headers, ...responsedata.map((item, index) => ([ ...Object.values(item)]))];
    // rowData.forEach((row) => worksheet.addRow(row));

    // // Dynamically calculate and set column widths
    // worksheet.columns = headers.map((header, colIndex) => {
    //   const maxLength = rowData.reduce((max, row) => {
    //     const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
    //     return Math.max(max, cellValue.length);
    //   }, header.length); // Start with the header length

    //   return {
    //     header,
    //     key: header.toLowerCase(),
    //     width: maxLength + 5, // Add some padding for better appearance
    //   };
    // });

    // // Style the header row
    // worksheet.getRow(1).eachCell((cell) => {
    //   cell.font = { bold: true, color: { argb: "FFFFFF" } };
    //   cell.fill = {
    //     type: "pattern",
    //     pattern: "solid",
    //     fgColor: { argb: "11164b" },
    //   };
    //   cell.alignment = { horizontal: "center" };
    // });

    // // Send File as Response
    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=ARReport.xlsx"
    // );
    // res.setHeader(
    //   "Content-Type",
    //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    // );

    // await workbook.xlsx.write(res);
    // res.end()

  } catch (err) {
    next(err);
  }
}


const GetDeliveryVehicles = async (req, res, next) => {
  try {
    let {data,count }= await PartIssueService.getDeliveryVehicles(req.body, req.user);
    console.log(data)
    const resdata = data?.map((item) => {
      let date=item.Doc_Date.toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
      return ({
        ...item, 
        Doc_Date: dateformat,
        Cus_mobile: item.Cus_mobile
        ? commonLogic.decrypt(item.Cus_mobile):"",
        psf_status: item.psf_status==1 ? "Updated" :item.psf_status==2 ?   "Pending" : item.psf_status==3 ? "Completed" : "Not Updated"
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Delivery Vehicles data Fetched Successfully ",
      data: resdata,
      count
    });

  } catch (err) {
    next(err);
  }
}

const GetDeliveryVehiclesDetails = async (req, res, next) => {
  try {
    let {vehicleDetails,schedules}= await PartIssueService.getDeliveryVehicleDetails(req.body, req.user);
    let date=vehicleDetails.Doc_Date.toISOString()
      const dateformat = date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4)
    const resdata =  {
        ...vehicleDetails, 
        Doc_Date: dateformat,
        Cus_mobile: vehicleDetails.Cus_mobile
        ? commonLogic.decrypt(vehicleDetails.Cus_mobile):"",
        Cus_name: vehicleDetails.Cus_name ? commonLogic.decrypt(vehicleDetails.Cus_name):"",      
    }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Delivery Vehicles data Fetched Successfully ",
      data: resdata,
      schedules
      
    });

  } catch (err) {
    next(err);
  }
}

const GetCNReport = async (req, res, next) => {
  let data = {}
  try {
    data = await PartIssueService.getCNReport(req.body, req.user);

    console.log(data, "data")
    if (!data || data.length === 0) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
    }
    function addRoundOffRows(data) {
      const grouped = {};
    
      // Step 1: Group by bill_no
      for (const row of data) {
        if (!grouped[row.bill_no]) grouped[row.bill_no] = [];
        grouped[row.bill_no].push(row);
      }
    
      const finalResult = [];
    
      for (const bill_no in grouped) {
        const rows = grouped[bill_no];
    
        // Step 2: Sum all (rate + tax) values
        let total = 0;
        for (const r of rows) {
          total += Number(r.rate || 0) + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0);
        }
    
        const roundedTotal = Math.round(total);
        const roundOff = Number((roundedTotal - total).toFixed(2)); // fix to 2 decimals
    
        finalResult.push(...rows); // Add original rows
    
        if (roundOff !== 0) {
          const sampleRow = rows[0]; // Copy from the first row
          finalResult.push({
            ...sampleRow,
            rate: roundOff,
            cgst: 0,
            sgst: 0,
            igst: 0,
            discount: 0,
            quantity: 1,
            hsnCode: null,
            uomType: null,
            makeName: null,
            modelName: null,
            source: 'RoundOff'
          });
        }
      }
    
      return finalResult;
    }
    const dataWithRoundOff = addRoundOffRows(data);
    const jobcarddata = dataWithRoundOff.map((item) => {
      const billingdate = item.billing_date.toISOString().slice(0,10)

      // const createddateformat = createdDate.slice(8, 10) + "-" + createdDate.slice(5, 7) + "-" + createdDate.slice(0, 4)

      const totaltaxablevalue = (item.rate * item.quantity) - item.discount
      const cgst = (totaltaxablevalue * item.cgst) / 100
      const sgst = (totaltaxablevalue * item.sgst) / 100
      const igst = (totaltaxablevalue * item.igst) / 100
      const totaltax = cgst + sgst + igst
      return (
        {
          "BusinessUnit":"Ki Mobility Solutions Services",
          "TransactionClass":"Credit memo",
          "BatchSourceName":"DMS",
          "TransactionType": "KIS-DMS PD CM",
          "TransactionNumber": item.doc_no,
          "TransactionDate": billingdate,
          "AccountingDate": billingdate,
          "CustomerAccount":item.oracleCashCustomerCode,
          "CustomerSiteNumber":item.oracleSiteCode,
          "JobCardNumber": item.job_card_no,
          "ChassisNumber": item.chassisNumber,
          "EngineNumber": item.engineNumber,
          "Model": item.modelName,
          "ModelCode":"",
          "Outlet":item.oracleLocation,
          "VehicleNumber": item.reg_no,
          "Description":item.source=="PartsIssue" ? "Credit Note Parts" : item.source=="Schedule" ? "Credit Note Labour" : item.source=="OslSchedule" ? "Credit Note Osl" : item.source=="Single" ? "Credit Note":"Round Off Value",
          "Quantity": item.quantity,
          "UOM": item.uomType,
          "UnitPrice": -(item.rate-(item.discount/item.quantity)),
          "Amount": -(item.rate*item.quantity-item.discount),
          "GSTTaxClassification":item.source=="RoundOff" ? "": item.igst==0 ? `CGST+SGST REC ${item.cgst+item.sgst}` :`IGST REC ${item.igst}`,
          "CGST": -cgst,
          "SGST": -sgst,
          "IGST": -igst,
          "HSNCode": item.hsnCode,
          "Company":"201",
          "LOB":item.companyId=="2"  ? "2041" :item.companyId=="5" ? "2042" : item.companyId=="4" || item.companyId=="7" ? "2062" : "",
          "Location":item.oracleLocation,
          "CostCentre":"000",
          "NaturalAccount":item.source=="PartsIssue" ? "411110" : item.source=="RoundOff" ? "432070" : "413414",
        }
      )
    })
  
    const responsedata = [
      ...jobcarddata,
    ]

    res.setHeader("Content-Disposition", "attachment; filename=CNReport.csv");
      res.setHeader("Content-Type", "text/csv");
      
      res.write(Object.keys(responsedata[0]).join(",") + "\n");
      
      // Stream each row
      for (const row of responsedata) {
        const values = Object.values(row).map(v => v ?? "").join(",");
        res.write(values + "\n");
      }
      
      // End the response
      res.end();

    // const workbook = new excel.Workbook();
    // const worksheet = workbook.addWorksheet("Sales Gross Margin Report");
    // const headers = ["SL NO", ...Object.keys(responsedata[0])]
    // const rowData = [headers, ...responsedata.map((item, index) => ([index + 1, ...Object.values(item)]))];
    // rowData.forEach((row) => worksheet.addRow(row));

    // // Dynamically calculate and set column widths
    // worksheet.columns = headers.map((header, colIndex) => {
    //   const maxLength = rowData.reduce((max, row) => {
    //     const cellValue = row[colIndex] ? row[colIndex].toString() : ""; // Ensure value is string
    //     return Math.max(max, cellValue.length);
    //   }, header.length); // Start with the header length

    //   return {
    //     header,
    //     key: header.toLowerCase(),
    //     width: maxLength + 5, // Add some padding for better appearance
    //   };
    // });

    // // Style the header row
    // worksheet.getRow(1).eachCell((cell) => {
    //   cell.font = { bold: true, color: { argb: "FFFFFF" } };
    //   cell.fill = {
    //     type: "pattern",
    //     pattern: "solid",
    //     fgColor: { argb: "11164b" },
    //   };
    //   cell.alignment = { horizontal: "center" };
    // });

    // // Send File as Response
    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=PurchaseReport.xlsx"
    // );
    // res.setHeader(
    //   "Content-Type",
    //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    // );

    // await workbook.xlsx.write(res);
    // res.end()

  } catch (err) {
    next(err);
  }
}
const UpdateEtaForIndent = async (req, res, next) => {
  const body = req.body;
  
  let part_indent_data;
  try {
  
    part_indent_data = await PartIssueService.UpdateEtaForIntent(body,req.user);
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Eta Updated Successfully',
      data: {
        partIndentData: part_indent_data,
      },
    });
  } catch (error) {
     logger.error('Part issue Contrller Error:', err);
     next(err);
  
  }
};

const GetZohoInvoiceReport = async (req, res, next) => {
  
  try {
    let data = await PartIssueService.getZohoInvoiceJobcardReport(req.body, req.user);
   let csdata = await PartIssueService.getZohoInvoiceCounterSaleReport(req.body, req.user);

    if ((!data || data.length === 0) && (!csdata || csdata.length === 0)) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
      
    }
            console.log(data.slice(0, 10), "data")
function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  value = value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

    let combineddata=[...data,...csdata]
    let responsedata=[]
    for( let item of combineddata){
      responsedata.push({
        "Invoice Date": item.billing_date,	
        "Invoice ID":"",
        "Invoice Number":item.bill_no,
        "Invoice Status":item.status==1 ? "open" : item.status==2 ? "pending": item.status==3 ? "approved"  : "closed",
        "Customer ID":item.customer_code,
        "Customer Name": item.source === "countersale" ? item.customer_name : commonLogic.decrypt(item.customer_name),	
        "Place of Supply": "",
        "Place of Supply(With State Code)" :"",	
        "GST Treatment": item.source =="countersale"	? "consumer" :"business_gst",
        "Is Inclusive Tax"	: "FALSE",
        "Due Date"	:"",
       "Purchase Order":"",
        "Currency Code":"INR",
        "Exchange Rate": "",	
        "Discount Type": "item_level",
        "Is Discount Before Tax": "TRUE",
        "Template Name": "Spreadsheet Template",	
        "Entity Discount Percent": "",	
        "TCS Tax Name" : "", 	
        "TCS Percentage" : "",
        "TDS Calculation Type" : "",
        "TDS Name" : "",
        "TDS Percentage" : "",
        "TDS Section Code" : "",
        "TDS Section" : "",
        "TDS Amount" : "",
        "SubTotal" : item.sub_total,
        "Total" : item.total,
        "Balance" : "",
        "Adjustment" : "",
        "Adjustment Description" : "",
        "Expected Payment Date" : "",
        "Last Payment Date" : "",
        "Payment Terms" : "",
        "Payment Terms Label" : "",
        "Notes"	:"",
        "Terms & Conditions" :"",
        "E-WayBill Number" : "",
        "E-WayBill Generated Time" : "",
        "E-WayBill Status" : "",
        "E-WayBill Cancelled Time" : "",
        "E-WayBill Expired Time" : "",
        "Transporter Name":"",
        "Transporter ID" : "",
        "TCS Amount" : "",
        "Invoice Type" : "Invoice",
        "Entity Discount Amount" : "",
        "Shipping Charge" : "",
        "Shipping Charge Tax ID" : "",
        "Shipping Charge Tax Amount" : "",
        "Shipping Charge Tax Name" : "",
        "Shipping Charge Tax %" : "",
        "Shipping Charge Tax Type" : "",
        "Shipping Charge Tax Exemption Code" : "",
        "Shipping Charge SAC Code" : "",
        "Item Name" : item.item_code,
        "Item Desc" : item.item_description,
        "Quantity" : item.quantity,
        "Discount" : item.discount_percentage,
        "Discount Amount":	item.discount,
        "Item Total": item.taxable_amount,	
        "Usage unit" :"nos",	
        "Item Price" : item.rate,
        "Product ID": item.source === "countersale" ? item.product_id+ "-P" : item.source === "PartsIssue" ? item.product_id+ "-P" : item.product_id+ "-L",
        "Sales Order Number"	:"",
        "Expense Reference ID":"",
        "Recurrence Name":"",
        "PayPal":"FALSE",
        "Authorize.Net":"FALSE",
        "Google Checkout": "FALSE",
        "Payflow Pro":"FALSE",
        "Stripe":"FALSE",
        "Paytm":"FALSE",
        "2Checkout":"FALSE",
        "Braintree":"FALSE",
        "Forte":"FALSE",
        "WorldPay":"FALSE",
        "Payments Pro":"FALSE",
        "Square":"FALSE",
        "WePay":"FALSE",
        "Razorpay":"FALSE",
        "ICICI EazyPay":"FALSE",
        "GoCardless":"FALSE",
        "Partial Payments":"",
        "Billing Attention":"",
        "Billing Address":escapeCSV(item.billing_address),
        "Billing Street2":"",
        "Billing City"	: item.customer_city,
        "Billing State": item.customer_state,
        "Billing Country": "INDIA",
        "Billing Code": item.customer_pincode,
        "Billing Phone": "",
        "Billing Fax": "",
        "Shipping Attention":"",	
        "Shipping Address":escapeCSV(item.shipping_address),
        "Shipping Street2":"",
        "Shipping City": item.customer_city,
        "Shipping State": item.customer_state,
        "Shipping Country": "INDIA",
        "Shipping Code": item.customer_pincode,
        "Shipping Fax": "",
        "Shipping Phone Number"	: "",
        "Supplier Org Name"	: "",
        "Supplier GST Registration Number"	: "",
        "Supplier Street Address"	: "",
        "Supplier City"	: "",
        "Supplier State"	: "",
        "Supplier Country"	: "",
        "Supplier ZipCode"  : "",	
        "Supplier Phone"	: "",
        "Supplier E-Mail"	: "",
        "CGST Rate %"	: item.cgst,
        "SGST Rate %"	: item.sgst,
        "IGST Rate %"	: item.igst,
        "CESS Rate %"	:"",
        "CGST(FCY)"	:"",
        "SGST(FCY)"	:"",
        "IGST(FCY)"	:"",
        "CESS(FCY)"	:"",
        "CGST"	: item.tax_amount > 0 ? (item.tax_amount/(item.cgst+item.sgst+item.igst))*item.cgst : 0,
        "SGST"  : item.tax_amount > 0 ? (item.tax_amount/(item.cgst+item.sgst+item.igst))*item.sgst : 0,
        "IGST"	: item.tax_amount > 0 ? (item.tax_amount/(item.cgst+item.sgst+item.igst))*item.igst : 0,
        "CESS"	:"",
        "Reverse Charge Tax Name"	:"",
        "Reverse Charge Tax Rate"	:"",
        "Reverse Charge Tax Type"	:"",
        "Item TDS Name"	:"",
        "Item TDS Percentage"	:"",
        "Item TDS Amount"	:"",
        "Item TDS Section Code"	:"",
        "Item TDS Section"	:"",
        "GST Identification Number (GSTIN)"	:item.customer_gstin,
        "Nature Of Collection"	:"",
        "SKU"	: item.source === "countersale" ? item.item_code+ "-P" : item.source === "PartsIssue" ? item.item_code+ "-P" : item.item_code+ "-L",
        "Project ID"	:"",
        "Project Name"	:"",
        "HSN/SAC"	:item.hsnCode,
        "Round Off"	:  Math.round(item.total) - item.total,
        "Sales person"	:"",
        "Subject"	:"",
        "Primary Contact EmailID"	:"",
        "Primary Contact Mobile"	:"",
        "Primary Contact Phone"	:"",
        "Estimate Number"	:item.service_estimate_code ? item.service_estimate_code : "",
        "Item Type"	:item.source=="countersale" ? "goods" : item.source=="PartsIssue" ? "goods" : item.source=="Schedule" ? "service" : item.source=="OslSchedule" ? "service" :"goods",
        "Custom Charges": "",
        "Shipping Bill#" : "",
        "Shipping Bill Date"	:"",
        "Shipping Bill Total"	:"",
        "PortCode"	:"",
        "Reference Invoice#"	:item.bill_no,
        "Reference Invoice Date"	:item.billing_date,
        "Reference Invoice Type"	:"",
        "GST Registration Number(Reference Invoice)"	:"",
        "Reason for issuing Debit Note"	:"",
        "E-Commerce Operator Name"	:"",
        "E-Commerce Operator GSTIN"	:"",
        "Account"	: item.source=="countersale" ? "Workshop Counter Sales" : item.source=="PartsIssue" ? "Workshop parts Sales" : item.source=="Schedule" ? "Workshop Labor Sales" :  "Workshop OSL Labor Sales",
        "Account Code"	:"",
        "Supply Type"	:"Taxable",
        "Tax ID"	:"",
        "Item Tax"	:item.igst>0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),
        "Item Tax %"	:item.igst>0 ? item.igst : item.cgst+item.sgst,
        "Item Tax Amount"	:item.tax_amount,
        "Item Tax Type"	: item.igst>0 ? "ItemAmount" : "Tax Group",
        "Item Tax Exemption Reason"	:"",
        "Kit Combo Item Name"	:"",
        "CF.VEHICLE NO"	: item.reg_no ? item.reg_no : "",
        "CF.Chassis No"	: item.chassisNumber ? item.chassisNumber : "",
        "CF.Make"	:item.makeName ? item.makeName : "",
        "CF.Model"	:item.modelName ? item.modelName : "",
        "CF.Job Card No"	: item.job_card_no ? item.job_card_no : "",
        "CF.SOURCE"	:item.sourceName ? item.sourceName : "",
        "CF.Insurance Policy Number"	:item.policy_no ? item.policy_no : "",
        "CF.Insurance Claim Number"	:item.claim_no ? item.claim_no : ""

      })
      
    }

    


// Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=ARReport.csv");
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
    next(err);
  }
}

const GetKitaraArReport = async (req, res, next) => {
  
  try {
    let data = await PartIssueService.getKitaraArJobcardReport(req.body, req.user);
   let csdata = await PartIssueService.getKitaraArCounterSaleReport(req.body, req.user);

    if ((!data || data.length === 0) && (!csdata || csdata.length === 0)) {
      res.status(500).json({ message: "No records found for the given criteria." });
      return;
      
    }
            console.log(data.slice(0, 10), "data")
function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  value = value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

    let combineddata=[...data,...csdata]
    let responsedata=[]
    for( let item of combineddata){
      responsedata.push({
        "Invoice Number":item.bill_no,
        "Invoice Date": item.billing_date,	
        "Invoice Status":item.status==1 ? "open" : item.status==2 ? "pending": item.status==3 ? "approved"  : "closed",
        "Customer ID":item.customer_code,
        "Customer Name": item.source === "countersale" ? item.customer_name : commonLogic.decrypt(item.customer_name),	
        "GST Treatment": item.customer_gstin ? "business_gst" : "business_none",
        "GST Identification Number (GSTIN)"	:item.customer_gstin,
        "Branch":item.outlet_code,
        "Place of Supply": "", //needed
        "Purchase Order":"",
        "Due Date"	:"",
        "Currency Code":"INR",
        "Exchange Rate": "",	
        "Account"	: item.source=="countersale" ? "Sales-Parts & Accessories" : item.source=="PartsIssue" ? "Sales-Parts & Accessories" :  "Sales-Labour",
        "Item Name" : item.item_description,
        "SKU"	: item.item_code,
        "Item Desc" : item.item_description,
        "Item Type"	:item.source=="countersale" ? "Goods" : item.source=="PartsIssue" ? "Goods" : item.source=="Schedule" ? "Service" : item.source=="OslSchedule" ? "Service" :"Goods",
        "HSN/SAC"	:item.hsnCode,
        "Quantity" : item.quantity,
        "Item Price" : item.rate,
        "Item Tax Exemption Reason"	:"",
        "Is Inclusive Tax"	: "FALSE",
        "Item Tax"	:item.igst>0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),
        "Item Tax Type"	: item.igst>0 ? "ItemAmount" : "Tax Group",
        "Item Tax %"	:item.igst>0 ? item.igst : item.cgst+item.sgst,
        "Supply Type"	:"Taxable",
        

      })
      
    }

    


// Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=ARReport.csv");
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
    next(err);
  }
}

const GetZohoArReport = async (req, res, next) => {
  
  try {
    let data = await PartIssueService.getZohoArJobcardReport(req.body, req.user);
   let csdata = await PartIssueService.getZohoArCounterSaleReport(req.body, req.user);

    if ((!data || data.length === 0) && (!csdata || csdata.length === 0)) {
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
      const getInvoiceStatus = (status) => {
        switch (status) {
          case 1:
            return "open";
          case 2:
            return "pending";
          case 3:
            return "approved";
          case 4:
          case 5:
            return "closed";
          case 6:
            return "void";
          default:
            return "unknown"; 
        }
      };

    let combineddata=[...data,...csdata]
    let responsedata=[]
    for( let item of combineddata){
      responsedata.push({
        "Invoice Number":item.bill_no,
        "Invoice Date": item.billing_date,	
        "Invoice Status": getInvoiceStatus(item.status),
        "Customer ID":item.customer_code,
        "Customer Name": item.source === "countersale" ? item.customer_name : commonLogic.decrypt(item.customer_name),	
        "GST Treatment": item.customer_gstin ? "business_gst" : "business_none",
        "GST Identification Number (GSTIN)"	:item.customer_gstin,
        "Branch":item.outlet_code,
        "Place of Supply": "", 
        "Purchase Order":"",
        "Due Date"	:"",
        "Currency Code":"INR",
        "Exchange Rate": "",	
        "Account"	: item.source=="countersale" ? "Sales-Parts & Accessories" : item.source=="PartsIssue" ? "Sales-Parts & Accessories" :  "Sales-Labour",
        "Item Name" : item.item_description,
        "SKU"	: item.item_code,
        "Item Desc" : item.item_description,
        "Item Type"	:item.source=="countersale" ? "Goods" : item.source=="PartsIssue" ? "Goods" : item.source=="Schedule" ? "Service" : item.source=="OslSchedule" ? "Service" :"Goods",
        "HSN/SAC"	:item.hsnCode,
        "Quantity" : item.quantity,
        "Item Price" : item.rate,
        "Item Tax Exemption Reason"	:"",
        "Is Inclusive Tax"	: "FALSE",
        "Item Tax"	:item.igst>0 ? "IGST"+item.igst : "GST"+(item.cgst+item.sgst),
        "Item Tax Type"	: item.igst>0 ? "ItemAmount" : "Tax Group",
        "Item Tax %"	:item.igst>0 ? item.igst : item.cgst+item.sgst,
        "Supply Type"	:"Taxable",
      })
      
    }

    


// Send CSV as download
res.setHeader("Content-Disposition", "attachment; filename=Zoho Ar Report.csv");
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
    next(err);
  }
}


const controller = {
  CreatePartIssue,GetCNReport,
  GetIndentPartIssueReport,GetSalesGrossMarginReport,GetARReport,
  GetDeliveryVehicles,GetDeliveryVehiclesDetails,
  UpdateEtaForIndent,GetZohoInvoiceReport,GetKitaraArReport,GetZohoArReport
};

export default controller;
