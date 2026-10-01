import CounterSaleService from './service.js';
import logger from '../../../config/logger.js';
import axios from 'axios';


const constructBDOJsonObjDongle = async (invoiceNo, req_user_details, counter_sale_and_parts_data,finalDate) => {  
  // Extracting data
  const { countersale, countersalepart } = counter_sale_and_parts_data;
  // console.log('ddddddddddddddddddddddd',req_user_details.outlet.id);


  //  console below to know Structure the var
  //  console.log('Counter Sale:', countersale);
  //  console.log('Counter Sale Parts:', countersalepart);
  //  console.log('customer data :', req_user_details); 
  // Fetch Buyer Details
  const Customers = await CounterSaleService.getCustomerDetails(countersale.customer_id);
  const customerData = Customers[0].dataValues;

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
  const outletDetails = await CounterSaleService.getOutletDetails(req_user_details.outlet.id);
  // console.log('outlet details',outletDetails);
  let outlet = outletDetails.dataValues;

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


  BuyerDtls.Gstin = customerData?.gstinNumber || "";
  BuyerDtls.LglNm = countersale?.customer_name || "";
  BuyerDtls.TrdNm = countersale?.customer_name || "";
  BuyerDtls.Pos =  customerData.gstinNumber.toString().substring(0, 2); 
  BuyerDtls.Addr1 = customerData?.address1 || "";
  BuyerDtls.Addr2 = customerData?.address2 || "";
  BuyerDtls.Loc = customerData?.city || "";
  BuyerDtls.Pin = parseInt(customerData?.pinCode || "0");
  BuyerDtls.Stcd = customerData?.gstinNumber? customerData.gstinNumber.toString().substring(0, 2) : ""; 
  BuyerDtls.Ph = customerData?.mobileNumber || "";
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

  for (const part of countersalepart) {
    const partData = part;
    const item = {};
    let AttribDtls = [];
    let AttribDtlsObj = {};
    const EGST = {};
    item.SlNo = sn.toString();
    item.PrdDesc = partData.item_description || "";
    item.IsServc = "N"; // Not a service
    item.HsnCd = partData.hsn_code || "40112010"; // no hsn value from counter sale parts value 

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

    const cessRate = parseFloat(countersale.cess || "0"); // there is no cess in counter sale part value
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

  let roundOffAmt = totalRoundOff - totalInvoiceAmount;
  roundOffAmt = parseFloat(roundOffAmt.toFixed(2));
  ValDtls.RndOffAmt = roundOffAmt;

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

const constructBDOJsonObjDongleReturn = async (invoiceNo, ouletandSellerDetails, body,finalDate) => {  
  // console.log('invoiceNo-------------s', invoiceNo);

const { counterSale, counterSalePart } = body;
const date = new Date(finalDate);  

const dd = String(date.getDate()).padStart(2, '0');
const mm = String(date.getMonth() + 1).padStart(2, '0'); // months are 0‑indexed!
const yyyy = date.getFullYear();

const formattedDate = `${dd}-${mm}-${yyyy}`;
// Fetch Buyer Details
const Customers = await CounterSaleService.getCustomerDetails(counterSale.customer_id);
const customerData = Customers[0].dataValues;

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
const DocPerdDtls = {};


TranDtls.TaxSch = "GST";
TranDtls.SupTyp = "B2B";
TranDtls.RegRev = "N";
TranDtls.EcmGstin = "";
TranDtls.IgstonIntra = "";
TranDtls.supplydir = null;

DocDtls.Typ = "CRN";
DocDtls.No = invoiceNo;
// DocDtls.No = 'CSC-KMDU26-1115';



DocDtls.Dt = formattedDate;

// Fetch Seller Details

// console.log('outlet details',outletDetails);
let outlet = ouletandSellerDetails;

SellerDtls.Gstin = outlet?.gstIn || "";
SellerDtls.LglNm = outlet?.outletName || "";
SellerDtls.TrdNm = outlet?.outletName || "";
SellerDtls.Addr1 = outlet?.address1 || "";
SellerDtls.Addr2 = outlet?.address2 || "";
SellerDtls.Loc = outlet?.city || "";
SellerDtls.Pin = parseInt(outlet?.pinCode || "0");
SellerDtls.Stcd =  outlet?.gstIn ? outlet.gstIn.toString().substring(0, 2) : ""; 
SellerDtls.Ph = outlet?.phoneNumber || "";
SellerDtls.Em = outlet?.email || "";


BuyerDtls.Gstin = customerData?.gstinNumber || "";
BuyerDtls.LglNm = `${customerData.firstName} ${customerData.lastName}` || "";
BuyerDtls.TrdNm = `${customerData.firstName} ${customerData.lastName}` || "";
BuyerDtls.Pos =  customerData.gstinNumber.toString().substring(0, 2); 
BuyerDtls.Addr1 = customerData?.address1 || "";
BuyerDtls.Addr2 = customerData?.address2 || "";
BuyerDtls.Loc = customerData?.city || "";
BuyerDtls.Pin = parseInt(customerData?.pinCode || "0");
BuyerDtls.Stcd = customerData?.gstinNumber? customerData.gstinNumber.toString().substring(0, 2) : ""; 
BuyerDtls.Ph = customerData?.mobileNumber || "";
BuyerDtls.Em = "";

// Dispatch Details
DispDtls.Nm = outlet?.outletName || "";
DispDtls.Addr1 = outlet?.address1 || "";
DispDtls.Addr2 = outlet?.address2 || "";
DispDtls.Loc = outlet?.city || "";
DispDtls.Pin = parseInt(outlet?.pinCode || "0");
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

for (const part of counterSalePart) {
  const partData = part;
  const item = {};
  let AttribDtls = [];
  let AttribDtlsObj = {};
  const EGST = {};
  item.SlNo = sn.toString();
  item.PrdDesc = partData.item_description || "";
  item.IsServc = "N"; // Not a service
  item.HsnCd = partData.hsn_code ; // no hsn value from counter sale parts value 

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

  const discountType = partData.discount_type || 0; // no value in counter sale
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

  const cessRate = parseFloat(counterSale.cess || "0"); // there is no cess in counter sale part value
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

let roundOffAmt = totalRoundOff - totalInvoiceAmount;
roundOffAmt = parseFloat(roundOffAmt.toFixed(2));
ValDtls.RndOffAmt = roundOffAmt;

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
return BDOobj;
};


const CreateCounterSale = async (req, res, next) => {
  const { body } = req;
  const { user } = req;
  let Counter_Sale_Data = {};
  let Counter_Sale_Part_Data
  let Stock_data = {};
  let Stock_log_data;
  let CounterSaleRequestData
  let CounterSaleRequestPartData
  let apiResponse;
  let IRNResponseData;
  
  try {

    // console.log('CreateCounterSale Request:', body);
    // console.log('User:', user.id);
  
    // Fetch company & customer details
    const [companyDetails, customerDetails] = await Promise.all([
      CounterSaleService.getCompanyDetails(user.outlet.companyId),
      CounterSaleService.getCustomerDetails(body.countersale.customer_id),
    ]);

 
    const enableEinvoice = companyDetails?.[0]?.dataValues?.enable_einvoice ?? 'Not Available';
    const customerCategory = customerDetails?.[0]?.dataValues?.customerCategory ?? 'Not B2B';

    // Create Counter Sale invoice_number
    Counter_Sale_Data = await CounterSaleService.CreateCounterSale(body.countersale, user);
    const counterSaleCreatedId = Counter_Sale_Data?.dataValues?.id;
    const counterSaleInvoiceNo = Counter_Sale_Data?.dataValues?.invoice_number;
    const counterSaleCreatedAt = Counter_Sale_Data?.dataValues?.createdAt;


    const dateObj = new Date(counterSaleCreatedAt);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // month is 0-indexed
    const year = dateObj.getFullYear();

    const finalDate = `${day}-${month}-${year}`;

        // console.log('Counter Sale Created ID:', counterSaleCreatedId);

    // If E-invoicing is enabled for B2B customers, process invoice
    if (enableEinvoice == 1 && customerCategory === 'B2B') {
      try {
        const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJsonObjDongle(
          counterSaleInvoiceNo,
          user,
          body,
          finalDate
        );

        const counterSaleUpdateData = {
          counter_sale_id: counterSaleCreatedId,
          invoice_number: counterSaleInvoiceNo,
          grand_total: invoiceTotalAmt,
          pass_args: BDOJsonStr,
          created_by : user.id
        };

        const counterSaleUpdateRes = await CounterSaleService.createCounterSaleUpdate(counterSaleUpdateData);

        if (!counterSaleUpdateRes?.success) {
          throw new Error(counterSaleUpdateRes?.error);
        }

        const counterSaleUpdateId = counterSaleUpdateRes.data.dataValues.id;
       ;

        // API Request to Submit Invoice
        const payload = {
          BDOData: BDOJsonStr,
          application_name: 'TVSFIT',
          process_name: 'Dongle Counter Sale',
          process_id: counterSaleCreatedId,
          created_at: new Date().toISOString(),
        };

        console.log('Sending Invoice Payload...');
        try {

             let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (user.outlet.companyId == 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (user.outlet.companyId === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });

          // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, { 
          //   headers: { 'Content-Type': 'application/json' }, 
          // });
          //  apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, { 
          //   headers: { 'Content-Type': 'application/json' },
          // });
  
          console.log('API Response:', apiResponse.data);
           IRNResponseData = apiResponse.data.data;
  
        }catch (error) {
          console.error('Server unreachable:', error);
          await CounterSaleService.deleteCounterSale(counterSaleCreatedId);
          await CounterSaleService.UpdateCounterSaleUpdateRes(counterSaleUpdateId, {
            bdo_status: '2',
            response_arg: JSON.stringify(error) ,
          });
          return res.status(500).json({ requestSuccessful: false, message: 'Server unreachable', error: error.message });
        }

        // Handle API Response
        if (apiResponse.data.message == 'Success') {
          if (IRNResponseData.irnStatus == 0) {
            await CounterSaleService.deleteCounterSale(counterSaleCreatedId);
            await CounterSaleService.UpdateCounterSaleUpdateRes(counterSaleUpdateId, {
              bdo_status: '2',
              response_arg: JSON.stringify(IRNResponseData),
              created_by : user.id
            });
          } else {
            await CounterSaleService.UpdateCounterSaleUpdateRes(counterSaleUpdateId, {
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
          }
        } else {
          await CounterSaleService.deleteCounterSale(counterSaleCreatedId);
          await CounterSaleService.UpdateCounterSaleUpdateRes(counterSaleUpdateId, {
            bdo_status: '2',
            response_arg: JSON.stringify(IRNResponseData),
          });
        }

        if (apiResponse.data.status_code === 2) {
          await CounterSaleService.deleteCounterSale(counterSaleCreatedId);
            await CounterSaleService.UpdateCounterSaleUpdateRes(counterSaleUpdateId, {
              bdo_status: '2',
              response_arg: JSON.stringify(apiResponse.data),
              created_by : user.id
            });
          return res.status(500).json({ status_code: 2, message: 'Something Went Wrong' });
        }

             // Process Counter Sale Parts and Stock Updates
             Counter_Sale_Part_Data = await CounterSaleService.CreateCounterSalePart(body.countersalepart, req.user, counterSaleCreatedId);
             Stock_data = await CounterSaleService.Updatestock(Counter_Sale_Part_Data,req.user);
             Stock_log_data = await CounterSaleService.CreateStocklog(Stock_data);
             if(body.type=="CSReq"){
              console.log("jkkk")
              // CounterSaleRequestPartData=await CounterSaleService.updateCSReqPartsStatus(body.CSReqPart,req.user)
              CounterSaleRequestData=await CounterSaleService.updateCSReqStatus(body.CSReqId,req.user)
        
            }
       

        return res.status(200).json({
          requestSuccessful: true,
          message: 'E-Invoice Processed & Sent Successfully',
          data: { BDOJsonStr, invoiceTotalAmt, apiResponse: apiResponse.data },
        });
      } catch (error) {
        console.error('E-Invoice Error:', error);
        await CounterSaleService.deleteCounterSale(counterSaleCreatedId);
        return res.status(500).json({ requestSuccessful: false, message: 'E-Invoice Processing Failed', error: error.message });
      }
    }else{
     // Process Counter Sale Parts and Stock Updates
     Counter_Sale_Part_Data = await CounterSaleService.CreateCounterSalePart(body.countersalepart, req.user, counterSaleCreatedId);
     Stock_data = await CounterSaleService.Updatestock(Counter_Sale_Part_Data,req.user);
     Stock_log_data = await CounterSaleService.CreateStocklog(Stock_data);
     if(body.type=="CSReq"){
      console.log("jkkk")
      // CounterSaleRequestPartData=await CounterSaleService.updateCSReqPartsStatus(body.CSReqPart,req.user)
      CounterSaleRequestData=await CounterSaleService.updateCSReqStatus(body.CSReqId,req.user)

    }
    }


    return res.status(200).json({
      requestSuccessful: true,
      message: 'Counter Sale Issued Successfully',
      // data: { 
      //   Counter_Sale_Data: Counter_Sale_Data,
      //   Counter_Sale_Part_Data:Counter_Sale_Part_Data,
      //   StockData: Stock_data,
      //   StockLogData: Stock_log_data,
      //   CounterSaleRequestData,
      //   CounterSaleRequestPartData
      //  },
    });

  } catch (error) {
    console.error('CreateCounterSale Error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        requestSuccessful: false,
        message: `The ${error.errors[0].path} '${error.errors[0].value}' is already taken. Please use a different one.`,
      });
    }

    return res.status(500).json({ requestSuccessful: false, message: error.message });
  }
};


const GetCounterSale = async (req, res , next) => {   
    try{ 
     let {grnDetails:data,count}= await CounterSaleService.getCounterSale(req.body,req.user);
     console.log(data,"data")
     const responsedata=data.map((item)=>{
      const date=new Date(item.dataValues.createdAt).toISOString()
      const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
      const status=item.dataValues.status==1?"Retured":"Issued"
      const Branch=item.dataValues.invoice_number.split("-")[1] 
      return({Branch,...item.dataValues,status,createdAt:dateformat
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "CounterSale data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('countersale Contrller Error:', err);
    next(err);
  }
}

const getCounterSaleSearchData = async (req, res, next) => {
    try { 
        const data = await CounterSaleService.getCounterSaleSearchData(req.body.jobCardNo, req.user);
        res.status(200).send({
            requestSuccessful: true,
            data: data
        });
    } catch (err) {
        logger.error('Counter Sale controller getCounterSaleSearchData Error:', err);
        next(err);
    }
}

     const GenerateCounterSalePdf = async (req, res , next) => {   
      let data={}
      let outletDetails={}
      let user=req.user
      try{ 
        data= await CounterSaleService.generateCounterSalepdf(req.body,);
       console.log(data,"data")
       outletDetails["outlet_name"]=user.outlet.outletName
outletDetails["outlet_address1"]=user.outlet.address1
outletDetails["outlet_address2"]=user.outlet.address2
outletDetails["outlet_city"]=user.outlet.city+","+user.outlet.state+","+user.outlet.pincode
outletDetails["outlet_gst"]=user.outlet.gstIn
outletDetails["branch"]=user.outlet.outletCode
        return res.status(200).json({
          requestSuccessful: true,
          message: "Counter Sale pdf data Fetched Successfully ",
          data:data,
          outlet_details:outletDetails
      });
       
       } catch (err) {
           logger.error('Countersale Contrller Error:', err);
       next(err);
       }
       }
       const GenerateCounterSaleReturnPdf = async (req, res , next) => { 
        // console.log("generate counter sale return pdf",req.body)  ;
        let data={}
        let outletDetails={}
        let user=req.user
        try{ 
          data= await CounterSaleService.generateCounterSaleReturnpdf(req.body,);
        //  console.log(data,"data")
         outletDetails["outlet_name"]=user.outlet.outletName
          outletDetails["outlet_address1"]=user.outlet.address1
          outletDetails["outlet_address2"]=user.outlet.address2
          outletDetails["outlet_city"]=user.outlet.city+","+user.outlet.state+","+user.outlet.pincode
          outletDetails["outlet_gst"]=user.outlet.gstIn
          outletDetails["branch"]=user.outlet.outletCode
          return res.status(200).json({
            requestSuccessful: true,
            message: "Counter Sale Return pdf data Fetched Successfully ",
            data:data,
            outlet_details:outletDetails
        });
         
         } catch (err) {
             logger.error('Countersale Contrller Error:', err);
         next(err);
         }
         }

       const GetCounterSaleForReturn = async (req, res , next) => {   
        let data={}
        try{ 
          data= await CounterSaleService.getCounterSaleForReturn(req.body,req.user);
         console.log(data,"data")
         const mappedParts = data[0]?.countersale_parts?.map(part => {
          return {
            'id':part.id,
            "item_id":part.item_id,
            'Parts Code': part.item_code,
            "Description":part.item_description,
            "Issued Qty": part.quantity,
            "Rate":part.rate,
            "Cost":part.cost,
            "MRP":part.mrp,
            "Discount Amount":part.discount,
            "CGST":part.cgst,
            "SGST":part.sgst,
            "IGST":part.igst,
            "Back Track Qty":part.quantity-parseInt(part.return_quantity||0),
            "hsn_code":part.hsn_code
          };
        });
        const {countersale_parts,...csdata}=data[0]?.dataValues
          return res.status(200).json({
            requestSuccessful: true,
            message: "CounterSale data Fetched Successfully ",
            data:csdata,
            parts:mappedParts
        });
         
         } catch (err) {
             logger.error('countersale Contrller Error:', err);
         next(err);
         }
         }
        const CreateCounterSaleReturn = async (req, res , next) => {  
      
           
        const body=req.body
        // console.log("create counter sale return---------",req.body.counterSale)
        let CounterSale_return_data={}
        let Stock_data={}
        let Stock_return_log_data
        let countersalepartdata
        let CounterSale_return_part_data
        let CounterSaleData
        let apiResponse
        let IRNResponseData
        let counterSaleReturnUpdateId
        try{ 
        // console.log("create counter sale return",req.body)
        // console.log("user",req.user)
        const getOutletandCompanyDetails = await CounterSaleService.getOutletandCompanyDetails(req.body.counterSale.outlet_id);
        const resOutletCompanyDetails   =getOutletandCompanyDetails.get({plain:true});
        // console.log("resOutletCompanyDetails",resOutletCompanyDetails)
        CounterSale_return_data= await CounterSaleService.CreateCounterSaleReturn(body.counterSale,req.user);
        const resCounterSale_return_data=CounterSale_return_data.get();
        // console.log("resCounterSale_return_data",resCounterSale_return_data);
     
        if(  resOutletCompanyDetails?.company?.enable_einvoice === 1 &&
          (req.body?.counterSale?.customer_gstNumber || '').trim() !== '')
        {

            // console.log("inside if ------------------------------")
          const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } = await constructBDOJsonObjDongleReturn(
            resCounterSale_return_data.invoice_number,
            resOutletCompanyDetails,
            body,
            resCounterSale_return_data.createdAt
          );

          const counterSaleReturnUpdateData = {
            counter_sale_return_id: resCounterSale_return_data.id,
            invoice_number: resCounterSale_return_data.invoice_number,
            grand_total: invoiceTotalAmt,
            pass_args: BDOJsonStr,
            created_by : req.user.id
          };
          const counterSaleReturnUpdateRes = await CounterSaleService.createCounterSaleReturnUpdate(counterSaleReturnUpdateData);
           counterSaleReturnUpdateId = counterSaleReturnUpdateRes.data.dataValues.id;
           
        
          // Handle API Response
          if (!counterSaleReturnUpdateRes?.success) {
            throw new Error(counterSaleReturnUpdateRes?.error);
          }

        // API Request to Submit Invoice
          const payload = {
            BDOData: BDOJsonStr,
            application_name: 'TVSFIT',
            process_name: 'Dongle Counter Sale Return',
            process_id: CounterSale_return_data.id,
            created_at: new Date().toISOString(),
          };

           console.log('Sending Invoice Payload...');
           
            try{

                 let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                            
                                    if (resOutletCompanyDetails?.company?.id === 6) {
                                      apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    } else if (resOutletCompanyDetails?.company?.id === 8) {
                                      apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
                                    }
                            
                                    const apiResponse = await axios.post(apiUrl, payload, {
                                      headers: { 'Content-Type': 'application/json' },
                                    });
            // const apiResponse = await axios.post('https://uateinvoice.mytvs.in/api/einvoice_ki/bdoapis/submitgrn', payload, { 
            //   headers: { 'Content-Type': 'application/json' },
            // }); 
              // apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, { 
              //   headers: { 'Content-Type': 'application/json' },
              // });
  
              console.log('API Response:', apiResponse.data);
              IRNResponseData = apiResponse.data.data;
                        //  Handle API Response
          if (apiResponse.data.message == 'Success') {
          if (IRNResponseData.irnStatus == 0) {           
          await CounterSaleService.deleteCounterSaleReturn(resCounterSale_return_data.id);
          await CounterSaleService.UpdateCounterSaleReturnRes(counterSaleReturnUpdateId, {
          bdo_status: '2',
          response_arg: JSON.stringify(IRNResponseData),
          created_by : req.user.id
          });
          } else {
          await CounterSaleService.UpdateCounterSaleReturnRes(counterSaleReturnUpdateId, {
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
          }
          } else {
          
          await CounterSaleService.deleteCounterSaleReturn(resCounterSale_return_data.id);
          await CounterSaleService.UpdateCounterSaleReturnRes(counterSaleReturnUpdateId, {
          bdo_status: '2',
          response_arg: JSON.stringify(apiResponse.data),
          created_by : req.user.id
          });
          }

            }catch (error) {
              console.error('Server unreachable:', error);
              await CounterSaleService.deleteCounterSaleReturn(resCounterSale_return_data.id);
              await CounterSaleService.UpdateCounterSaleReturnRes(counterSaleReturnUpdateId, {
              bdo_status: '2',
              response_arg: JSON.stringify(error),
              created_by : req.user.id
              });
            }

        if (apiResponse.data.status_code === 2) {
          
        return res.status(500).json({ status_code: 2, message: 'Something Went Wrong' });
        }

        }
        CounterSale_return_part_data= await CounterSaleService.CreateCounterSaleReturnParts(body.counterSalePart,req.user,CounterSale_return_data);
        Stock_data=await CounterSaleService.UpdatestockAfterReturn(CounterSale_return_part_data)
        Stock_return_log_data=await CounterSaleService.CreateStockReturnlog(Stock_data)
        countersalepartdata=await CounterSaleService.UpdateCounterSalePart(body.counterSalePart)
        CounterSaleData=await CounterSaleService.updateCounterSaleStatus(body.counterSale.counter_sale_id)
        return res.status(200).json({
          requestSuccessful: true,
          message: "Countersale Returned Successfully",
          // data:{
          //   CounterSale_return_data:CounterSale_return_data,
          //   CounterSale_return_part_data:CounterSale_return_part_data,
          //   StockData:Stock_data,
          //   StockReturnLogData:Stock_return_log_data,
          //   countersalepartdata:countersalepartdata,
          //   CounterSaleData
          // }
        });

        } catch (error) {
         logger.error('counter sale return  controller Error:', error);
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
             const GetCounterSaleReturn = async (req, res , next) => {   
              try{ 
                let {grnDetails:data,count}= await CounterSaleService.getCounterSalereturn(req.body,req.user);
               console.log(data,"data")
               const responsedata=data.map((item)=>{
                const date=new Date(item.dataValues.createdAt).toISOString()
                const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
                return({...item.dataValues,createdAt:dateformat
                })
               })
                return res.status(200).json({
                  requestSuccessful: true,
                  message: "CounterSaleReturn data Fetched Successfully ",
                  data:responsedata,
                  count
              });
               
               } catch (err) {
                   logger.error('countersale Contrller Error:', err);
               next(err);
               }
               }

               const CreateCounterSaleRequest = async (req, res, next) => {
                const body = req.body;
                let Counter_Sale_Request_Data = {};
                let Counter_Sale_Request_Part_Data
                try {
                  Counter_Sale_Request_Data = await CounterSaleService.CreateCounterSaleRequest(body.countersale, req.user);
                  Counter_Sale_Request_Part_Data = await CounterSaleService.CreateCounterSaleRequestPart(body.countersalepart, req.user,Counter_Sale_Request_Data.id);
                  return res.status(200).json({
                    requestSuccessful: true,
                    message: 'Couner Sale Request Created Successfully',
                    // data: {
                    //   Counter_Sale_Request_Data,
                    //   Counter_Sale_Request_Part_Data
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
              
              const GetCounterSaleRequest = async (req, res , next) => {   
                try{ 
                 let {countersaleReqDetails:data,count}= await CounterSaleService.getCounterSaleRequest(req.body,req.user);
                 console.log(data,"data")
                 const responsedata=data.map((item)=>{
                  const Branch=item.dataValues.invoice_number.split("-")[1]
                  

                  const date=new Date(item.dataValues.createdAt).toISOString()
                  const dateformat=date.slice(8,10)+"-"+date.slice(5,7)+"-"+date.slice(0,4)
                  const status=item.dataValues.status==1?"Approved":item.dataValues.status==2 ?"Open" :"Created"
                  return({Branch:Branch,...item.dataValues,
                    createdAt:dateformat,status,
                    
                  })
                 })
                  return res.status(200).json({
                    requestSuccessful: true,
                    message: "CounterSale Req data Fetched Successfully ",
                    data:responsedata,
                    count
                });
                 
                 } catch (err) {
                     logger.error('countersale Req Contrller Error:', err);
                 next(err);
                 }
                 }
                 const GetCounterSaleReqForApprove = async (req, res , next) => {   
                  let data={}
                  try{ 
                    data= await CounterSaleService.getCounterSaleReqForApprove(req.body,req.user);
                   console.log(data,"data")
                   const mappedParts = data[0]?.countersale_request_parts?.map(part => {
                    //rate and cost diff is margin
                    console.log(part,"part")
                    const marginPercent=Number((((part.rate-part.cost)/part.cost)*100).toFixed(2))
                    return {
                      'id':part.id,
                      "item_id":part.item_id,
                      'Parts Code': part.item_code,
                      "Description":part.item_description,
                      "Issued Qty": part.quantity,
                      "Rate":part.rate,
                      "Cost":part.cost,
                      "MRP":part.mrp,
                      "Discount Amount":part.discount||"",
                      "CGST":part.cgst,
                      "SGST":part.sgst,
                      "IGST":part.igst,
                      'Total Amount':part.total,
                      "Margin %":marginPercent,
                      "status":part.status
                    };
                  });
                    return res.status(200).json({
                      requestSuccessful: true,
                      message: "CounterSale data Fetched Successfully ",
                      data:data,
                      parts:mappedParts
                  });
                   
                   } catch (err) {
                       logger.error('countersale Contrller Error:', err);
                   next(err);
                   }
                   }
                   const GetCounterSaleReqForCreateCS = async (req, res, next) => {
                    try {
                      // Fetch data from service
                      let data = await CounterSaleService.getCounterSaleReqForCreateCS(req.body, req.user);
                      console.log(data, "Fetched Data");
                  
                      // Transform data to group by counter sale request ID
                      let groupedData = {};
                  
                      data.forEach(row => {
                        if (!groupedData[row.id]) {
                          // Initialize the request structure
                          groupedData[row.id] = {
                            id: row.id,
                            document_type: row.document_type,
                            customer_code: row.customer_code,
                            source: row.source,
                            source_type: row.source_type,
                            customer_type: row.customer_type,
                            customer_name: row.customer_name,
                            customer_city: row.customer_city,
                            customer_state: row.customer_state,
                            customer_gstin: row.customer_gstin,
                            customer_address: row.customer_address,
                            shipping_address: row.shipping_address,
                            customer_id: row.customer_id,
                            invoice_number: row.invoice_number,
                            countersale_request_parts: [] // Initialize empty array for parts
                          };
                        }
                  
                        // Push parts data into the request
                        groupedData[row.id].countersale_request_parts.push({
                          id: row.part_id,
                          item_id: row.item_id,
                          item_code: row.item_code,
                          item_description: row.item_description,
                          quantity: row.quantity,
                          discount: row.discount||"0",
                          rate: row.rate,
                          cost: row.cost,
                          mrp: row.mrp,
                          cgst: row.cgst,
                          sgst: row.sgst,
                          igst: row.igst,
                          total: row.total,
                          status: row.status,
                          available_stock: row.available_stock,
                          hsn_code: row.hsn_code,
                        });
                      });
                  
                      // Convert grouped data to array
                      const responseData = Object.values(groupedData);
                  
                      // Map parts with required structure
                      const mappedParts = responseData[0]?.countersale_request_parts?.map(part => {
                        // Calculate margin percentage
                        const marginPercent = Number((((part.rate - part.cost) / part.cost) * 100).toFixed(2));
                  
                        return {
                          'id': part.id,
                          "item_id": part.item_id,
                          'Parts Code': part.item_code,
                          "Description": part.item_description,
                          "Issued Qty": part.quantity,
                          "Rate": part.rate,
                          "Cost": part.cost,
                          "MRP": part.mrp,
                          "Discount Amount": part.discount || "",
                          "CGST": part.cgst,
                          "SGST": part.sgst,
                          "IGST": part.igst,
                          'Total Amount': part.total,
                          "Margin %": marginPercent,
                          "status": part.status,
                          "Available Qty":part.available_stock,
                          'hsn_code': part.hsn_code,
                        };
                      });
                  
                      // Send response
                      return res.status(200).json({
                        requestSuccessful: true,
                        message: "Counter Sale Data Fetched Successfully",
                        data: responseData,
                        parts: mappedParts
                      });
                  
                    } catch (err) {
                      console.error('CounterSale Controller Error:', err);
                      next(err);
                    }
                  };
                  
                   const ApproveCounterSale = async (req, res, next) => {
                    const body = req.body;
                    
                    let CounterSaleRequestData
                    let CounterSaleRequestPartData
                    try {
                      
                        CounterSaleRequestPartData=await CounterSaleService.updateCSReqPartsStatus(body.CSReqPart,req.user)
                        CounterSaleRequestData=await CounterSaleService.updateCSReqStatus(body.CSReqId,req.user)
                  
                      
                      return res.status(200).json({
                        requestSuccessful: true,
                        message: 'Counter Sale Approved Successfully',
                        data: {
                          CounterSaleRequestData,
                          CounterSaleRequestPartData
                        },
                      });
                    } catch (error) {
                      
                        res.status(500).json({
                          requestSuccessful: false,
                          message: error.message,
                        });
                      
                    }
                  };

                  const CreateCounterSaleGatePass = async (req, res, next) => {
                    const body = req.body;
                    let Counter_Sale_Data = {};
                    
                    try {
                      Counter_Sale_Data = await CounterSaleService.createCounterSaleGatePass(body, req.user);
                     
                     
                      return res.status(200).json({
                        requestSuccessful: true,
                        message: 'Counter Sale Gate Pass Created Successfully',
                        // data: {
                        //   Counter_Sale_Data: Counter_Sale_Data,
                          
                        // },
                      });
                    } catch (err) {
                           logger.error('Grn Contrller Error:', err);
                       next(err);
                    }
                  };

                  const GenerateCounterSaleGatePassPdf = async (req, res , next) => {   
                    let data={}
                    let outletDetails={}
                    let user=req.user
                    try{ 
                      data= await CounterSaleService.generateCSGatePassPdf(req.body,);
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
                        message: "Counter Sale pdf data Fetched Successfully ",
                        data:data,
                        outlet_details:outletDetails
                    });
                     
                     } catch (err) {
                         logger.error('Countersale Contrller Error:', err);
                     next(err);
                     }
                     }
              
const controller = {
  CreateCounterSale,GetCounterSale,getCounterSaleSearchData,GenerateCounterSalePdf,GenerateCounterSaleReturnPdf,GetCounterSaleForReturn,CreateCounterSaleReturn,
  GetCounterSaleReturn,CreateCounterSaleRequest,GetCounterSaleRequest,GetCounterSaleReqForApprove,ApproveCounterSale,
  GetCounterSaleReqForCreateCS,CreateCounterSaleGatePass,GenerateCounterSaleGatePassPdf
};

export default controller;
