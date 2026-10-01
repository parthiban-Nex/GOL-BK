
import PartReturnService from "./service.js";
import logger from '../../../config/logger.js';
import excel from 'exceljs';
const GetPartIssue = async (req, res , next) => {   
  let data={}
  try{ 
    data= await PartReturnService.GetPartIssue(req.body);
    // console.log(data[0].partissuemap[0],"data")
    let formattedData=[]
   
for(const item of data){
  if(item.partissuemap && item.partissuemap.length > 0) {
      let resobj={
      id:item.partissuemap[0].id,
      "item_id":item.partissuemap[0].item_id,
      indent_id:item.partissuemap[0].indent_id,
      "Parts Code":item.partissuemap[0].item_code,
      "Description":item.partissuemap[0].item_name,
      "Issued Qty":item.partissuemap[0].quantity,
      "Rate":item.partissuemap[0].rate,
      "Cost":item.partissuemap[0].cost,
      "MRP":item.partissuemap[0].mrp,
      "CGST":item.partissuemap[0].cgst,
      "SGST":item.partissuemap[0].sgst,
      "IGST":item.partissuemap[0].igst,
      "Discount Amount":item.partissuemap[0].discount
    }
    formattedData.push(resobj)
  }
  }
    return res.status(200).json({
      requestSuccessful: true,
      message: "Part issue data Fetched Successfully ",
      data:formattedData
  });
   
   } catch (err) {
       logger.error('Part issue Contrller Error:', err);
   next(err);
   }
   }

const CreatePartReturn = async (req, res , next) => {   
  const body=req.body
    let Part_return_data={}
    let Stock_data={}
    let Stock_return_log_data
    let part_indent_data
    let partissuedata
    try{ 
      Part_return_data= await PartReturnService.CreatePartReturn(body,req.user);
      Stock_data=await PartReturnService.Updatestock(Part_return_data)
      Stock_return_log_data=await PartReturnService.CreateStockReturnlog(Stock_data)
      part_indent_data=await PartReturnService.UpdatePartIntent(body)
      partissuedata=await PartReturnService.UpdatePartIssue(body)
      return res.status(200).json({
        requestSuccessful: true,
        message: "Part Returned Successfully",
        // data:{
        //   PartReturnData:Part_return_data,
        //   StockData:Stock_data,
        //   StockReturnLogData:Stock_return_log_data,
        //   partIndentData:part_indent_data,
        //   partissuedata:partissuedata
        // }
    });
     
     } catch (error) {
    //      logger.error('Grn Contrller Error:', err);
    //  next(err);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path; // Field that caused the unique constraint violation
      const value = error.errors[0].value; // Value that violated the constraint
      res.status(400).json({
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
        requestSuccessful:false,
      });
    }
    else{
      res.status(500).json({
        requestSuccessful:false,
        message:error.message
      })
    }
    
     }
     }

     const GetSalesReturnReport = async (req, res, next) => {
      try {
        let data = await PartReturnService.getSaleReturnReport(req.body, req.user);
    
        if (!data || data.length === 0) {
          return res.status(404).json({ message: "No records found for the given criteria." });
        }
        let responsedata=[]
          for(const item of data){
          const totaltaxablevalue = item.rate * item.quantity - item.discount;
          const cgst = (totaltaxablevalue * item.cgst) / 100;
          const sgst = (totaltaxablevalue * item.sgst) / 100;
          const igst = (totaltaxablevalue * item.igst) / 100;
          const totaltax = cgst + sgst + igst;
    
          responsedata.push({ 
            "Branch": req.user.outlet.outletCode,
            "Job Card No": item.job_card_no,
            "Job Card Date": item.jobCard_date || "",
            "Customer Code": item.customer_code,
            "Customer Name": item.customer_name,
            "Customer Group": item.customer_type,
            "Customer GSTIN": item.customer_gstin,
            "Item Code": item.item_code,
            "Item Name": item.item_name,
            "HSN Code": item.hsnCode,
            "Sale Doc Name": item.bill_no,
            "Sale Doc Date": item.billing_date,
            "Return Quantity": item.quantity,
            "Sale Rate": item.rate * item.quantity - item.discount,
            "Cost": item.cost * item.quantity,
            "Unit Rate": item.rate,
            "Unit Cost": item.cost,
            "Total Discount": item.discount,
            "MRP": item.mrp,
            "CGST %": item.cgst,
            "SGST %": item.sgst,
            "IGST %": item.igst,
            "Total Tax": totaltax,
            "Total Amount": (totaltaxablevalue + totaltax).toFixed(2),
            "Make": item.makeName,
            "Model": item.modelName,
            "Parts Category": item.itemCategorie,
            "Parts Aggregate": item.aggregateName,
            "Sub Aggregate": item.subAggregateName,
          })
        };
        console.log(responsedata, "responsedata");

        if (responsedata.length === 0) {
          return res.status(404).json({ message: "No data available for report." });
        }
    
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet("Sales Return Report");
    
        const headers = ["SL NO", ...Object.keys(responsedata[0])];
        worksheet.addRow(headers);
    
        responsedata.forEach((item, index) => {
          worksheet.addRow([index + 1, ...Object.values(item)]);
        });
    
        worksheet.columns = headers.map((header) => ({
          header,
          key: header.toLowerCase(),
          width: header.length + 5,
        }));
    
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "11164b" } };
          cell.alignment = { horizontal: "center" };
        });
    
        res.setHeader("Content-Disposition", "attachment; filename=SalesReturnReport.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
        await workbook.xlsx.write(res);
        res.end();
      } catch (err) {
        next(err);
      }
    };
    


     const controller={
        CreatePartReturn,GetPartIssue,GetSalesReturnReport
     }

     export default controller