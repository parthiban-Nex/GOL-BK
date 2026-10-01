import StockTransferService from './service.js';
import logger from '../../../config/logger.js';
import excel from 'exceljs';
import fs from 'fs';
import path from 'path'; // ✅ Import path
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import comapnyDetails from '../../../shared/validateCompanyMap.js'
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const constructBDOJsonObjDongle = async (invoiceNo, req_user_details, modifiedBody,finalDate) => {
  // Extracting data
  const { primaryDetails, partsDetails } = modifiedBody;
  // console.log('primaryDetails:', primaryDetails);
  // console.log('partsDetails:', partsDetails);
  const SelleroutletDetails = await StockTransferService.getOutletDetails(req_user_details.outlet.id);
  let outlet = SelleroutletDetails.dataValues;

  const BuyerOutlet = await StockTransferService.getOutletDetails(primaryDetails.to_outlet_id);
  let BuyerOutletDetails = BuyerOutlet.dataValues;

  const BDOJsonObj = {};
  const TranDtls = {};
  const DocDtls = {};
  const SellerDtls = {};
  const BuyerDtls = {};
  const DispDtls = {};
  const ShipDtls = {};
  const ValDtls = {};
  const PayDtls = {};
  const RefDtls = {};
  const ItemList = {};
  // const AddlDocDtls = {};
  // const ExpDtls = {};
  // const EwbDtls = {};
  const DocPerdDtls = {};


  TranDtls.TaxSch = "GST";
  TranDtls.SupTyp = "B2B";
  TranDtls.RegRev = "N";
  TranDtls.EcmGstin = "";
  TranDtls.IgstonIntra = "";
  TranDtls.supplydir = null;

  DocDtls.Typ = "INV";
  DocDtls.No = invoiceNo;
 

  DocDtls.Dt = finalDate;

  // Fetch Seller Details
  SellerDtls.Gstin = outlet?.gstIn || "";
  SellerDtls.LglNm = outlet?.outletName || "";
  SellerDtls.TrdNm = outlet?.outletName || "";
  SellerDtls.Addr1 = outlet?.address1 || "";
  SellerDtls.Addr2 = outlet?.address2 || "";
  SellerDtls.Loc = outlet?.city || "";
  SellerDtls.Pin = parseInt(outlet?.pincode || "0");
  SellerDtls.Stcd =  outlet?.gstIn ? outlet.gstIn.toString().substring(0, 2) : ""; 
  SellerDtls.Ph = outlet?.contactPhoneNumber || "";
  SellerDtls.Em = outlet?.contactEmail || "";



  BuyerDtls.Gstin = BuyerOutletDetails?.gstIn || "";
  BuyerDtls.LglNm = BuyerOutletDetails?.outletName || "";
  BuyerDtls.TrdNm = BuyerOutletDetails?.outletName || "";
  BuyerDtls.Pos =  BuyerOutletDetails.gstIn.toString().substring(0, 2); 
  BuyerDtls.Addr1 = BuyerOutletDetails?.address1 || "";
  BuyerDtls.Addr2 = BuyerOutletDetails?.address2 || "";
  BuyerDtls.Loc = BuyerOutletDetails?.city || "";
  BuyerDtls.Pin = parseInt(BuyerOutletDetails?.pincode || "0");
  BuyerDtls.Stcd = BuyerOutletDetails?.gstIn? BuyerOutletDetails.gstIn.toString().substring(0, 2) : ""; 
  BuyerDtls.Ph = BuyerOutletDetails?.contactPhoneNumber || "";
  BuyerDtls.Em = "";

  // Dispatch Details
  DispDtls.Nm = outlet?.outletName || "";
  DispDtls.Addr1 = outlet?.address1 || "";
  DispDtls.Addr2 = outlet?.address2 || "";
  DispDtls.Loc = outlet?.city || "";
  DispDtls.Pin = parseInt(outlet?.pincode || "0");
  DispDtls.Stcd = outlet?.gstIn ? outlet.gstIn.toString().substring(0, 2) : ""; 

  ShipDtls.Gstin = null;
  ShipDtls.LglNm = null;
  ShipDtls.TrdNm = null;
  ShipDtls.Addr1 = null;
  ShipDtls.Addr2 = null;
  ShipDtls.Loc = null;
  ShipDtls.Pin = null;
  ShipDtls.Stcd = null;

  // Processing Item List
  let sn = 1;
  let orderLine = 0;
  const Items = [];
  let totalInvoiceAmount = 0;
  let AssVal = 0;
  let CgstVal = 0;
  let SgstVal = 0;
  let IgstVal = 0;
  let cessVal = 0;
  let discount = 0;

  for (const part of partsDetails) {
    const partData = part;
    const item = {};
    let AttribDtls = [];
    let AttribDtlsObj = {};
    const EGST = {};
    item.SlNo = sn.toString();
    item.PrdDesc = partData.item_description || "";
    item.IsServc = "N"; // Not a service
    item.HsnCd = partData.hsn_code || ""; // no hsn value from counter sale parts value 

    const BchDtls = {
      // Nm: partData.item_code || "",
      Nm:  "",
      Expdt: "",
      wrDt: ""
    };

    item.BchDtls = BchDtls;
    item.Barcde = "";
    item.Qty = parseInt(partData.quantity || "0");
    item.FreeQty = 0;
    item.Unit = "NOS";
    const rate = parseFloat(partData.rate || "0");
    const itemPrice = parseFloat((rate * partData.quantity).toFixed(2));
    const unitPrice = parseFloat(rate.toFixed(2));

    item.UnitPrice = unitPrice;
    item.TotAmt = itemPrice;

    const discountType = partData.discount_type; // no value in counter sale
    const partDiscount = parseFloat(partData.dicount_percentage || "0");

    let discountAmount = 0;
    if (partDiscount) {
      discountAmount = parseFloat(partDiscount.toFixed(2));
    }

    const partAmountAfterDiscount = parseFloat((itemPrice - discountAmount).toFixed(2));

    // Calculate Taxes
    const cgstRate = parseFloat(partData.cgst || "0");
    const cgstAmt = parseFloat(((partAmountAfterDiscount * cgstRate) / 100).toFixed(2));

    const sgstRate = parseFloat(partData.sgst || "0");
    const sgstAmt = parseFloat(((partAmountAfterDiscount * sgstRate) / 100).toFixed(2));

    const igstRate = parseFloat(partData.igst || "0");
    const igstAmt = parseFloat(((partAmountAfterDiscount * igstRate) / 100).toFixed(2));

    const cessRate = parseFloat(primaryDetails.cess || "0"); // there is no cess in counter sale part value
    const cessAmount = parseFloat(((partAmountAfterDiscount * cessRate) / 100).toFixed(2));

    // Assign tax values
    item.Discount = discountAmount;
    item.PreTaxVal = 0; // Need to check
    item.AssAmt = partAmountAfterDiscount;
    item.IgstRt = igstRate;
    item.IgstAmt = igstAmt;
    item.CgstRt = cgstRate;
    item.CgstAmt = cgstAmt;
    item.SgstRt = sgstRate;
    item.SgstAmt = sgstAmt;
    item.CesRt = cessRate;
    item.CesAmt = cessAmount;
    item.CesNonAdvlAmt = 0;
    item.StateCesRt = 0;
    item.StateCesAmt = 0;
    item.StateCesNonAdvlAmt = 0;
    item.OthChrg = 0; // Need to check
    item.TotItemVal = parseFloat((partAmountAfterDiscount + igstAmt + cgstAmt + sgstAmt).toFixed(2));
    item.OrdLineRef = orderLine;
    item.PrdSlNo = "";
    item.OrgCntry = 'IN' //need to get this from database
    AttribDtlsObj.Nm = "";
    AttribDtlsObj.Val = "";
    AttribDtls.push(AttribDtlsObj);
    item.AttribDtls = AttribDtls;
    let itemtotalAmount = parseFloat((partAmountAfterDiscount + igstAmt + cgstAmt + sgstAmt).toFixed(2));

    EGST.nilrated_amt = "0";
    EGST.exempted_amt = "0";
    EGST.non_gst_amt = "0";
    EGST.reason = "";
    EGST.debit_gl_id = "0";
    EGST.debit_gl_name = "";
    EGST.credit_gl_id = "0";
    EGST.credit_gl_name = "";
    EGST.sublocation = "";
    item.EGST = EGST;
    Items.push(item);

    totalInvoiceAmount += itemtotalAmount;
    AssVal += partAmountAfterDiscount;
    CgstVal += cgstAmt;
    SgstVal += sgstAmt;
    IgstVal += igstAmt;
    cessVal += cessAmount;
    discount += discountAmount;

    sn++;
    orderLine++;

  }
  ItemList.Item = Items;

  if (typeof AssVal === "number" && !isNaN(AssVal)) {
    ValDtls.AssVal = parseFloat(AssVal.toFixed(2));
  } else {
    ValDtls.AssVal = parseFloat(AssVal);
  }

  ValDtls.CgstVal = CgstVal;
  ValDtls.SgstVal = SgstVal;

  if (typeof IgstVal === "number" && !isNaN(IgstVal)) {
    ValDtls.IgstVal = parseFloat(IgstVal.toFixed(2));
  } else {
    ValDtls.IgstVal = parseFloat(IgstVal);
  }

  if (typeof discount === "number" && !isNaN(discount)) {
    ValDtls.Discount = parseFloat(discount.toFixed(2));
  } else {
    ValDtls.Discount = parseFloat(discount);
  }

  ValDtls.CesVal = cessVal;
  ValDtls.StCesVal = 0;
  ValDtls.OthChrg = 0;
  ValDtls.RndOffAmt = 0;

  let totalRoundOff = Math.round(totalInvoiceAmount);

  // let roundOffAmt = totalRoundOff - totalInvoiceAmount;
  // roundOffAmt = parseFloat(roundOffAmt.toFixed(2));
  // ValDtls.RndOffAmt = roundOffAmt;

  if (typeof totalInvoiceAmount === "number" && !isNaN(totalInvoiceAmount)) {
    ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
  } else {
    ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
  }

  ValDtls.Discount = 0;
  ValDtls.TotInvValFc = null;

  PayDtls.Nm = "";
  PayDtls.Accdet = "";
  PayDtls.Mode = "";
  PayDtls.Fininsbr = "";
  PayDtls.Payterm = "";
  PayDtls.Payinstr = "";
  PayDtls.Crtrn = "";
  PayDtls.Dirdr = "";
  PayDtls.Crday = 0;
  PayDtls.Paidamt = 0;
  PayDtls.Paymtdue = 0;

  RefDtls.InvRm = "";
  DocPerdDtls.InvStDt = null;
  DocPerdDtls.InvEndDt = null;
  RefDtls.DocPerdDtls = DocPerdDtls;

  let PrecDocDtls = [];
  let PrecDocDtlsObj = {
    InvNo: null,
    InvDt: null,
    OthRefNo: ""
  };
  PrecDocDtls.push(PrecDocDtlsObj);
  RefDtls.PrecDocDtls = PrecDocDtls;

  let ContrDtls = [];
  let ContrDtlsObj = {
    RecAdvRefr: "",
    RecAdvDt: "",
    Tendrefr: "",
    Contrrefr: "",
    Extrefr: "",
    Projrefr: "",
    Porefr: "",
    PoRefDt: ""
  };
  ContrDtls.push(ContrDtlsObj);
  RefDtls.ContrDtls = ContrDtls;

  let AddlDocDtls = [];
  let AddlDocDtlsObj = {
    Url: "",
    Docs: "",
    Info: ""
  };
  AddlDocDtls.push(AddlDocDtlsObj);

  let ExpDtls = {
    ShipBNo: null,
    ShipBDt: null,
    Port: null,
    RefClm: null,
    ForCur: null,
    CntCode: null,
    ExpDuty: null
  };

  let EwbDtls = {
    Transid: "",
    Transname: "",
    Distance: "",
    Transdocno: null,
    TransdocDt: null,
    Vehno: "",
    Vehtype: "",
    TransMode: ""
  };

  BDOJsonObj.TranDtls = TranDtls;
  BDOJsonObj.DocDtls = DocDtls;
  BDOJsonObj.SellerDtls = SellerDtls;
  BDOJsonObj.BuyerDtls = BuyerDtls;
  BDOJsonObj.DispDtls = DispDtls;
  BDOJsonObj.ShipDtls = ShipDtls;
  BDOJsonObj.ItemList = ItemList;
  BDOJsonObj.ValDtls = ValDtls;
  BDOJsonObj.PayDtls = PayDtls;
  BDOJsonObj.RefDtls = RefDtls;
  BDOJsonObj.AddlDocDtls = AddlDocDtls;
  BDOJsonObj.ExpDtls = ExpDtls;
  BDOJsonObj.EwbDtls = EwbDtls;

  const BDOobj = {};
  BDOobj.grandTotal = totalInvoiceAmount;
  BDOobj.data = JSON.stringify(BDOJsonObj);
  // console.log('BDO JSON:', BDOobj);
  return BDOobj;
};


const CreateStockTransfer = async (req, res, next) => {
  const { user, body } = req;
  const outletCompanyId = user.outlet.companyId;

  try {
    // Step 1: Get company details
    const [companyDetails] = await Promise.all([
      comapnyDetails.findByCompanyId(outletCompanyId),
    ]);
    const enableEinvoice = companyDetails?.[0]?.dataValues?.enable_einvoice ?? 'Not Available';

    // Step 2: Create Stock Transfer (Primary)
    const stockTransferData = await StockTransferService.CreateStockTransfer(body.stocktransfer, user);
    const stockTransID = stockTransferData?.id;
    const stockTransInvoiceNO = stockTransferData?.invoice_number;

    const STDate = stockTransferData?.createdAt; 
    const dateObj = new Date(STDate);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); 
    const year = dateObj.getFullYear();

    const finalDate = `${day}-${month}-${year}`;
   

    // Step 3: Check if e-invoicing needs to be handled
    if (enableEinvoice == 1 && body.stocktransfer.document_type === 'ISTO') {
      const modifiedBody = {
        ...body,
        primaryDetails: body.stocktransfer,
        partsDetails: body.stocktransferpart,
      };

      try {
        const {
          data: BDOJsonStr,
          grandTotal: invoiceTotalAmt,
        } = await constructBDOJsonObjDongle(stockTransInvoiceNO, user, modifiedBody,finalDate);

        const stockTransferUpdateData = {
          stock_transfer_id: stockTransID,
          invoice_number: stockTransInvoiceNO,
          grand_total: invoiceTotalAmt,
          pass_args: BDOJsonStr,
          created_by: user.id,
        };

        const stockTransferUpdateRes = await StockTransferService.createStockTransferUpdate(stockTransferUpdateData);
        if (!stockTransferUpdateRes?.success) throw new Error(stockTransferUpdateRes?.error);

        const StockTransferUpdateId = stockTransferUpdateRes.data.dataValues.id;

        const payload = {
          BDOData: BDOJsonStr,
          application_name: 'TVSFIT',
          process_name: 'Dongle Counter Sale',
          process_id: stockTransID,
          created_at: new Date().toISOString(),
        };

        // const apiResponse = await axios.post(
        //   'http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn',
        //   payload,
        //   { headers: { 'Content-Type': 'application/json' } }
        // );
           let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (outletCompanyId === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (outletCompanyId === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });
        // const apiResponse = await axios.post(
        //   'https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn',
        //   payload, 
        //   { headers: { 'Content-Type': 'application/json' } }
        // );

        

        const IRNResponseData = apiResponse?.data?.data;
        console.log('response from Bdo Portal',apiResponse);

        if (apiResponse.data.message === 'Success') {
          console.log('IRN Response Data:', IRNResponseData);
          if (IRNResponseData.irnStatus === 0) {
            await StockTransferService.deletedStockTransfer(stockTransID);
            await StockTransferService.StockTransferUpdateRes(StockTransferUpdateId, {
              bdo_status: '2',
              response_arg: JSON.stringify(apiResponse.data),
              created_by: user.id,
            });
          //  console.log('IRN Status 0:', IRNResponseData);
          } else {
            await StockTransferService.StockTransferUpdateRes(StockTransferUpdateId, {
              bdo_id: IRNResponseData.AckNo,
              invoice_bdoack_no: IRNResponseData.AckNo,
              invoice_bdoack_date: IRNResponseData.AckDt,
              irn_no: IRNResponseData.Irn,
              bdo_status: '1',
              qr_code: IRNResponseData.QRCode,
              signed_qr_code: IRNResponseData.SignedQRCode,
              process_status: '1',
              response_arg: JSON.stringify(IRNResponseData),
            });
            // console.log('IRN Status 1:', IRNResponseData);
          }
        } else {
          await StockTransferService.deletedStockTransfer(stockTransID);
          await StockTransferService.StockTransferUpdateRes(StockTransferUpdateId, {
            bdo_status: '2',
            response_arg: JSON.stringify(apiResponse.data),
            created_by: user.id,
          });

          // console.log('Error in BDO API:', apiResponse.data.Error);

        }
        // console.log('data from bdo', JSON.stringify(apiResponse.data) );
        if (apiResponse.data.status_code == 2) {
          // console.log('Error in BDO API:', apiResponse.data.status_code);
          return res.status(500).json({
            status_code: 2,
            message: JSON.stringify(apiResponse.data.Error),
          });
        }
      } catch (einvoiceErr) {
        return res.status(500).json({
          requestSuccessful: false,
          message: 'E-Invoice process failed',
          error: einvoiceErr.message,
        });
      }
    }

    // Step 4: Handle Parts, Stock and Log
    const stockTransferPartData = await StockTransferService.CreateStockTransferPart(
      body.stocktransferpart, user, stockTransferData.id
    );
    const Stock_data = await StockTransferService.Updatestock(stockTransferPartData, user);
    const Stock_log_data = await StockTransferService.CreateStocklog(Stock_data);
    if(req.body.type=="streq"){
    const updateStockTransferStatus = await StockTransferService.UpdateStockTransferReqStatus(req.body.id);
    }
    // console.log('Stock Transfer Data:', stockTransferData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Stock Transferred Successfully',
      // data: {
      //   stockTransferData,
      //   stockTransferPartData,
      //   StockData: Stock_data,
      //   StockLogData: Stock_log_data,
      // },
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      const value = error.errors?.[0]?.value;
      return res.status(400).json({
        requestSuccessful: false,
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
      });
    }

    return res.status(500).json({
      requestSuccessful: false,
      message: error.message || 'Something went wrong.',
    });
  }
};

const GetStockTransfer = async (req, res , next) => {   
    try{ 
     let {grnDetails:data,count}= await StockTransferService.GetStockTransfer(req.body,req.user);
     console.log(data,"data")
     const responsedata=data.map((item)=>{
      const date=new Date(item.dataValues.createdAt).toISOString()
      const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
      return({...item.dataValues,createdAt:dateformat
      })
     })
      return res.status(200).json({
        requestSuccessful: true,
        message: "Stock Transfer data Fetched Successfully ",
        data:responsedata,
        count
    });
     
     } catch (err) {
         logger.error('stocktransfer Contrller Error:', err);
     next(err);
     }
     }

     const GetInwardStockTransfer = async (req, res , next) => {   
      try{ 
       let {grnDetails:data,count}= await StockTransferService.GetInwardStockTransfer(req.body,req.user);
       console.log(data,"data")
       const responsedata=data.map((item)=>{
        const date=new Date(item.dataValues.createdAt).toISOString()
        const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
        return({...item.dataValues,createdAt:dateformat
        })
       })
        return res.status(200).json({
          requestSuccessful: true,
          message: " Inward Stock Transfer data Fetched Successfully ",
          data:responsedata,
          count
      });
       
       } catch (err) {
           logger.error('stocktransfer Contrller Error:', err);
       next(err);
       }
       }

     const GenerateStockTransferPdf = async (req, res , next) => {    
      let data={}
      let outletDetails={}
      let user=req.user
      try{ 
        data= await StockTransferService.generateStockTransferpdf(req.body);      
       outletDetails["outlet_name"]=user.outlet.outletName
outletDetails["outlet_address1"]=user.outlet.address1
outletDetails["outlet_address2"]=user.outlet.address2
outletDetails["outlet_city"]=user.outlet.city+","+user.outlet.state+","+user.outlet.pincode
outletDetails["outlet_gst"]=user.outlet.gstIn
outletDetails["branch"]=user.outlet.outletCode
        return res.status(200).json({
          requestSuccessful: true,
          message: "Stock Transfer pdf data Fetched Successfully ",
          data:data,
          outlet_details:outletDetails
      });
       
       } catch (err) {
           logger.error('Stock Transfer Contrller Error:', err);
       next(err);
       }
       }

       const GetStockTransferForInward = async (req, res , next) => {   
        let data={}
        try{ 
          data= await StockTransferService.getStockTransferForInward(req.body,req.user);
         console.log(data,"checkibhgg")
         const date=new Date(data[0].dataValues.createdAt).toISOString()
         const dateformat= date.slice(0,4)+"-"+date.slice(5,7)+"-"+date.slice(8,10)
         const newdata={
          'id':data[0].dataValues.id,
           'outlet_code':data[0].dataValues.outlet_code,
            'invoice_number':data[0].dataValues.invoice_number,
            'grand_total':data[0].dataValues.grand_total
          ,"invoice Date":dateformat}
         const mappedParts = data[0]?.stocktransferparts?.map(part => {
          return {
            'id':part.id,
            "item_id":part.item_id,
            'Parts Code': part.item_code,
            "Description":part.item_description,
            "Issued Qty": part.quantity,
            "Rate":part.rate,
            "Cost":part.cost,
            "MRP":part.mrp,
            "IGST":part.igst,
            "Total Amount":part.total
          };
        });
          return res.status(200).json({
            requestSuccessful: true,
            message: "Stock Transfer data Fetched Successfully ",
            data:newdata,
            parts:mappedParts
        });
         
         } catch (err) {
             logger.error('Stock Transfer Contrller Error:', err);
         next(err);
         }
         }

         


const GetStockTransferReport = async (req, res , next) => {    
  let data={}
  try{ 
    data= await StockTransferService.getStockTransferReport(req.body,req.user);
   console.log(data,"data")
   if (!data || data.length === 0) {
    res.status(500).json({ message: "No records found for the given criteria." });
    return;
  }
   const responsedata=data.map((item)=>{
    const createdDate=(item.createdAt).toISOString()

    const createddateformat=createdDate.slice(8,10)+"-"+createdDate.slice(5,7)+"-"+createdDate.slice(0,4)

    const totaltaxablevalue=(item.cost*item.quantity)
    // const cgst=(totaltaxablevalue*item.cgst)/100
    // const sgst=(totaltaxablevalue*item.sgst)/100
    const igst=(totaltaxablevalue*item.igst)/100
    const totaltax=igst
    return(
      {
      "Branch":req.user.outlet.outletCode,
      "Doc Date":createddateformat,
      "Doc Number":item.invoice_number,
      "Reference Branch":item.to_outlet_code,
      "Item Code":item.item_code,
      "Item Name":item.item_description,
      "HSN Code":item.hsnCode,
      "UOM":item.uomType,
      "Qty":item.quantity,
      "Unit Sale Rate":item.rate,
      "Base Unit Cost":item.cost,
      // "MRP":item.mrp,
      "Total Cost": totaltaxablevalue,
      "IGST %":item.igst,
      "IGST":igst,
      "Total Sale Amount":totaltaxablevalue+totaltax,
      "Parts Category":item.itemCategorie,
      "Parts Aggregate":item.aggregateName,
      "Sub Aggregate":item.subAggregateName,
      "Make":item.makeName,
      "Model":item.modelName,
      "IRN Number":item.irn_no,
      "Invoice Ack No":item.invoice_bdoack_no,
      "Invoice Ack Date":item.invoice_bdoack_date
    }
  )
   })

        const filepath = path.join(__dirname, "StockTransferReport.xlsx");
   
           const workbook = new excel.stream.xlsx.WorkbookWriter({
             filename: filepath,
             useStyles: true,
             useSharedStrings: true,
           });
   
           const worksheet = workbook.addWorksheet("Stock Transfer Report");
   
      
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
       logger.error('Stock Transfer Contrller Error:', err);
   next(err);
   }
   }

   const CreateStockTransferGatePass = async (req, res, next) => {
    const body = req.body;
    let Counter_Sale_Data = {};
    
    try {
      Counter_Sale_Data = await StockTransferService.createStockTransferGatePass(body, req.user);
     
     
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Stock Transfer Gate Pass Created Successfully',
        // data: {
        //   Counter_Sale_Data: Counter_Sale_Data,
          
        // },
      });
    } catch (err) {
           logger.error('Grn Contrller Error:', err);
       next(err);
    }
  };

  const GenerateStockTransferGatePassPdf = async (req, res , next) => {   
    let data={}
    let outletDetails={}
    let user=req.user
    try{ 
      data= await StockTransferService.generateStockTransferGatePassPdf(req.body,);
     console.log(data,"data")
     outletDetails["outlet_name"]=user.outlet.outletName
outletDetails["outlet_address1"]=user.outlet.address1
outletDetails["outlet_address2"]=user.outlet.address2
outletDetails["outlet_city"]=user.outlet.city+","+user.outlet.state+","+user.outlet.pincode
outletDetails["outlet_gst"]=user.outlet.gstIn
outletDetails["branch"]=user.outlet.outletCode
outletDetails["service_advisor"]=user.employeeName

      return res.status(200).json({
        requestSuccessful: true,
        message: "Stock Transfer pdf data Fetched Successfully ",
        data:data,
        outlet_details:outletDetails
    });
     
     } catch (err) {
         logger.error('Stock transfer Contrller Error:', err);
     next(err);
     }
     }
  
const CreateStockTransferReq = async (req, res, next) => {
  const { user, body } = req;

  try {
  
    const stockTransferReqData = await StockTransferService.CreateStockTransferReq(body.stocktransfer, user);

    const stockTransferPartData = await StockTransferService.CreateStockTransferReqPart(
      body.stocktransferpart, user, stockTransferReqData.id
    );
  

    // console.log('Stock Transfer Data:', stockTransferData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Stock Transfer Req Created Successfully',
      data: {
        stockTransferReqData,
        stockTransferPartData,
      },
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      const value = error.errors?.[0]?.value;
      return res.status(400).json({
        requestSuccessful: false,
        message: `The ${field} '${value}' is already taken. Please use a different one.`,
      });
    }

    return res.status(500).json({
      requestSuccessful: false,
      message: error.message || 'Something went wrong.',
    });
  }
};

const GetStockTransferReq = async (req, res , next) => {   
    try{ 
     let {grnDetails:data,count}= await StockTransferService.GetStockTransferReq(req.body,req.user);
     console.log(data,"data")
     const responsedata=data.map((item)=>{
      const date=new Date(item.dataValues.createdAt).toISOString()
      const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
      return({...item.dataValues,createdAt:dateformat
      })
     })
      return res.status(200).json({
        requestSuccessful: true,
        message: "Stock Transfer Req data Fetched Successfully ",
        data:responsedata,
        count
    });
     
     } catch (err) {
         logger.error('stocktransfer Req Contrller Error:', err);
     next(err);
     }
     }

     const GetStockTransferReqFrom = async (req, res , next) => {   
    try{ 
     let {grnDetails:data,count}= await StockTransferService.GetStockTransferReqFrom(req.body,req.user);
     console.log(data,"data")
     const responsedata=data.map((item)=>{
      const date=new Date(item.dataValues.createdAt).toISOString()
      const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
      const status=item.dataValues.status==1 ? "Approved" : "Open"
      return({...item.dataValues,createdAt:dateformat,status:status
      })
     })
      return res.status(200).json({
        requestSuccessful: true,
        message: "Stock Transfer Req data Fetched Successfully ",
        data:responsedata,
        count
    });
     
     } catch (err) {
         logger.error('stocktransfer Req Contrller Error:', err);
     next(err);
     }
     }

 const GetStockTransferReqForApprove = async (req, res , next) => {   
                  let data={}
                  try{ 
                    data= await StockTransferService.getStockTransferReqForApprove(req.body,req.user);
                   console.log(data,"data")
                   if(!data || data.length===0){
                    res.status(500).json({message:"No records found for the given criteria."});
                    return;
                   }
                   const mappedParts = data?.map(part => {
                    //rate and cost diff is margin
                    console.log(part,"part")
                    const marginPercent=Number((((part.rate-part.cost)/part.cost)*100).toFixed(2))
                    return {
                      'id':part.part_id,
                      "item_id":part.item_id,
                      'Parts Code': part.item_code,
                      "Description":part.item_description,
                      "Issued Qty": part.quantity,
                      "Rate":part.rate,
                      "Cost":part.cost,
                      "MRP":part.mrp,
                      // "CGST":part.cgst,
                      // "SGST":part.sgst,
                      "IGST":part.igst,
                      'Total Amount':part.total,
                      "Margin %":marginPercent,
                      // "status":part.status,
                      "Available Qty":part.available_stock,
                      "hsn_code":part.hsn_code
                    };
                  });
                  const {to_outlet_id, to_outlet_code, document_type,outlet_id,outlet_code}=data[0]
                    return res.status(200).json({
                      requestSuccessful: true,
                      message: "Stock Transfer data Fetched Successfully ",
                      data:{to_outlet_id, to_outlet_code, document_type,outlet_id,outlet_code},
                      parts:mappedParts
                  });
                   
                   } catch (err) {
                       logger.error('Stock Transfer Controller Error:', err);
                   next(err);
                   }
                   } 

        

const controller = {
  CreateStockTransfer,GenerateStockTransferPdf,GetStockTransfer,GetInwardStockTransfer,
  GetStockTransferForInward,GetStockTransferReport,CreateStockTransferGatePass,
  GenerateStockTransferGatePassPdf,CreateStockTransferReq,GetStockTransferReq,
  GetStockTransferReqForApprove,GetStockTransferReqFrom
};

export default controller;
