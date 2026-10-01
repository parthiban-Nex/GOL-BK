import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import cndDAO from './dao.js';
import moment from 'moment-timezone';
import numberToWords from 'number-to-words';
import cdNotesService from '../cdNotes/service.js';
import PartReturnService from '../Parts/partsreturn/service.js';
import axios from 'axios';
import cdNote from '../cdNotes/dao.js';
import db from '../index.js';
import { Op } from 'sequelize';
import OutletDao from '../outlet/dao.js';
import GrnService from '../Parts/GRN/service.js';
const LbsInsCode = db.lbsInsuranceCode;
const LbsDebitNote = db.lbsDebitNotes;
const constructBDOJson = async (
  sellerDetails,
  buyerDetails,
  invoiceNo,
  jcParts,
  invoiceDate
) => {
  // console.log("inside constructBDOJson",req);
  // fetch buyer and seller details
  // console.log("sellerDetails",sellerDetails);
  // console.log("buyerDetails",buyerDetails);

  // console.log("invoiceNo",invoiceNo);
  //  console.log("jcParts",jcParts);
  //  console.log("invoiceDate",invoiceDate);

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

  TranDtls.TaxSch = 'GST';
  TranDtls.SupTyp = 'B2B';
  TranDtls.RegRev = 'N';
  TranDtls.EcmGstin = '';
  TranDtls.IgstonIntra = '';
  TranDtls.supplydir = null;

  DocDtls.Typ = 'CRN';
  DocDtls.No = invoiceNo;
  // const date = new Date();
  // date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 330); // Convert to IST

  const day = String(invoiceDate.getDate()).padStart(2, '0');
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  const year = invoiceDate.getFullYear();

  DocDtls.Dt = `${day}-${month}-${year}`;

  // SellerDtls.Gstin = "33AAGCM0329K1ZM";
  // SellerDtls.LglNm = "ki Mobility Solutions Private Limited";
  // SellerDtls.TrdNm = "ki Mobility Solutions Private Limited";
  // SellerDtls.Addr1 = "22D/1, Samaya Nallur Road, Opp. Fathima College";
  // SellerDtls.Addr2 = "Alavai Nagar";
  // SellerDtls.Loc =  "Vadalur";
  // SellerDtls.Pin = 607303;
  // SellerDtls.Stcd =   "33";
  // SellerDtls.Ph = "9600047693";
  // SellerDtls.Em ="mytvscvservice.vadalur@tvs.in";

  // BuyerDtls.Gstin = "33AQEPK6104F1ZC";
  // BuyerDtls.LglNm = "Roushan Singh";
  // BuyerDtls.TrdNm = "Roushan Singh";
  // BuyerDtls.Pos =  "33";
  // BuyerDtls.Addr1 = "Chennai";
  // BuyerDtls.Addr2 ="Navalur";
  // BuyerDtls.Loc = "CHENNAI";
  // BuyerDtls.Pin = 600119;
  // BuyerDtls.Stcd = "33";
  // BuyerDtls.Ph = "9865284004";
  // BuyerDtls.Em = "";

  // DispDtls.Nm ="ki Mobility Solutions Private Limited";
  // DispDtls.Addr1 = "22D/1, Samaya Nallur Road, Opp. Fathima College";
  // DispDtls.Addr2 = "Alavai Nagar";
  // DispDtls.Loc = "Vadalur";
  // DispDtls.Pin = 607303;
  // DispDtls.Stcd = "33";

  // Fetch Seller Details
  SellerDtls.Gstin = sellerDetails?.gstIn || '';
  SellerDtls.LglNm = sellerDetails?.outletName || '';
  SellerDtls.TrdNm = sellerDetails?.outletName || '';
  SellerDtls.Addr1 = sellerDetails?.address1 || '';
  SellerDtls.Addr2 = sellerDetails?.address2 || '';
  SellerDtls.Loc = sellerDetails?.city || '';
  SellerDtls.Pin = parseInt(sellerDetails?.pinCode || '0');
  SellerDtls.Stcd = sellerDetails?.gstIn
    ? sellerDetails.gstIn.toString().substring(0, 2)
    : '';
  SellerDtls.Ph = sellerDetails?.phoneNumber || '';
  SellerDtls.Em = sellerDetails?.email || '';

  BuyerDtls.Gstin = buyerDetails?.gstinNumber || '';
  BuyerDtls.LglNm = buyerDetails?.firstName || '';
  BuyerDtls.TrdNm = buyerDetails?.firstName || '';
  BuyerDtls.Pos = buyerDetails.gstinNumber.toString().substring(0, 2);
  BuyerDtls.Addr1 = buyerDetails?.address1 || '';
  BuyerDtls.Addr2 = buyerDetails?.address2 || '';
  BuyerDtls.Loc = buyerDetails?.city || '';
  BuyerDtls.Pin = parseInt(buyerDetails?.pinCode || '0');
  BuyerDtls.Stcd = buyerDetails?.gstinNumber
    ? buyerDetails.gstinNumber.toString().substring(0, 2)
    : '';
  BuyerDtls.Ph = buyerDetails?.mobileNumber || '';
  BuyerDtls.Em = '';

  // Dispatch Details
  DispDtls.Nm = sellerDetails?.phoneNumber || '';
  DispDtls.Addr1 = sellerDetails?.address1 || '';
  DispDtls.Addr2 = sellerDetails?.address1 || '';
  DispDtls.Loc = sellerDetails?.city || '';
  DispDtls.Pin = parseInt(sellerDetails?.pinCode || '0');
  DispDtls.Stcd = sellerDetails?.gstIn
    ? sellerDetails.gstIn.toString().substring(0, 2)
    : '';

  ShipDtls.Gstin = null;
  ShipDtls.LglNm = null;
  ShipDtls.TrdNm = null;
  ShipDtls.Addr1 = null;
  ShipDtls.Addr2 = null;
  ShipDtls.Loc = null;
  ShipDtls.Pin = null;
  ShipDtls.Stcd = null;

  // Processing Item List
  let Items = [];
  let totalInvoiceAmount = 0;
  let AssVal = 0;
  let CgstVal = 0;
  let SgstVal = 0;
  let IgstVal = 0;
  let discount = 0;
  let cessVal = 0;

  let sn = 1;
  let orderLine = 1;

  jcParts.forEach((part) => {
    if (part.part_code && part.part_code.trim() !== '') {
      const item = {};

      item.SlNo = String(sn);
      item.PrdDesc = part.part_description.replace(/[^\w\s\-]/g, ''); // Simulate RemoveSpecialChar
      item.IsServc = 'Y';
      item.HsnCd = part.hsn_code || '';

      item.BchDtls = {
        Nm:
          part.part_code.length <= 20
            ? part.part_code.replace(/[^\w\s\-]/g, '')
            : '',
        Expdt: '',
        wrDt: '',
      };

      item.Barcde = '';
      item.Qty = parseInt(part.quantity);
      item.FreeQty = 0;
      item.Unit = 'NOS';

      const rate = parseFloat(part.rate);
      const unitPrice = parseFloat(rate.toFixed(2));
      const itemPrice = parseFloat((rate * part.quantity).toFixed(2));

      item.UnitPrice = unitPrice;
      item.TotAmt = itemPrice;

      const discountAmount = parseFloat(part.dicount_amount || 0);
      item.Discount = parseFloat(discountAmount.toFixed(2));

      const partAmountAfterDiscount = parseFloat(
        part.rateafterDiscount || rate
      );
      item.AssAmt = parseFloat(partAmountAfterDiscount.toFixed(2));
      item.PreTaxVal = 0;

      const cgstRate = parseFloat(part.cgst || 0);
      const sgstRate = parseFloat(part.sgst || 0);
      const igstRate = parseFloat(part.igst || 0);

      const cgstAmt = parseFloat(
        ((partAmountAfterDiscount * cgstRate) / 100).toFixed(2)
      );
      const sgstAmt = parseFloat(
        ((partAmountAfterDiscount * sgstRate) / 100).toFixed(2)
      );
      const igstAmt = parseFloat(
        ((partAmountAfterDiscount * igstRate) / 100).toFixed(2)
      );

      item.CgstRt = cgstRate;
      item.CgstAmt = cgstAmt;
      item.SgstRt = sgstRate;
      item.SgstAmt = sgstAmt;
      item.IgstRt = igstRate;
      item.IgstAmt = igstAmt;

      item.CesRt = 0;
      item.CesAmt = 0;
      item.CesNonAdvlAmt = 0;
      item.StateCesRt = 0;
      item.StateCesAmt = 0;
      item.StateCesNonAdvlAmt = 0;
      item.OthChrg = 0;

      const itemTotalAmount = parseFloat(
        (partAmountAfterDiscount + cgstAmt + sgstAmt + igstAmt).toFixed(2)
      );
      item.TotItemVal = itemTotalAmount;

      item.OrdLineRef = String(orderLine);
      item.OrgCntry = 'IN';
      item.PrdSlNo = '';

      item.AttribDtls = [
        {
          Nm: '',
          Val: '',
        },
      ];

      item.EGST = {
        nilrated_amt: '0',
        exempted_amt: '0',
        non_gst_amt: '0',
        reason: '',
        debit_gl_id: '0',
        debit_gl_name: '',
        credit_gl_id: '0',
        credit_gl_name: '',
        sublocation: '',
      };

      Items.push(item);

      // Totals
      totalInvoiceAmount += itemTotalAmount;
      AssVal += partAmountAfterDiscount;
      CgstVal += cgstAmt;
      SgstVal += sgstAmt;
      IgstVal += igstAmt;
      discount += discountAmount;

      sn++;
      orderLine++;
    }
  });

  // console.log( '22222222222222222222222',Items)
  ItemList.Item = Items;

  if (typeof AssVal === 'number' && !isNaN(AssVal)) {
    ValDtls.AssVal = parseFloat(AssVal.toFixed(2));
  } else {
    ValDtls.AssVal = parseFloat(AssVal);
  }

  ValDtls.CgstVal = CgstVal;
  ValDtls.SgstVal = SgstVal;

  if (typeof IgstVal === 'number' && !isNaN(IgstVal)) {
    ValDtls.IgstVal = parseFloat(IgstVal.toFixed(2));
  } else {
    ValDtls.IgstVal = parseFloat(IgstVal);
  }

  if (typeof discount === 'number' && !isNaN(discount)) {
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

  if (typeof totalInvoiceAmount === 'number' && !isNaN(totalInvoiceAmount)) {
    ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
  } else {
    ValDtls.TotInvVal = parseFloat(totalRoundOff.toFixed(2));
  }

  ValDtls.Discount = 0;
  ValDtls.TotInvValFc = null;

  PayDtls.Nm = '';
  PayDtls.Accdet = '';
  PayDtls.Mode = '';
  PayDtls.Fininsbr = '';
  PayDtls.Payterm = '';
  PayDtls.Payinstr = '';
  PayDtls.Crtrn = '';
  PayDtls.Dirdr = '';
  PayDtls.Crday = 0;
  PayDtls.Paidamt = 0;
  PayDtls.Paymtdue = 0;

  RefDtls.InvRm = '';
  DocPerdDtls.InvStDt = null;
  DocPerdDtls.InvEndDt = null;
  RefDtls.DocPerdDtls = DocPerdDtls;

  let PrecDocDtls = [];
  let PrecDocDtlsObj = {
    InvNo: null,
    InvDt: null,
    OthRefNo: '',
  };
  PrecDocDtls.push(PrecDocDtlsObj);
  RefDtls.PrecDocDtls = PrecDocDtls;

  let ContrDtls = [];
  let ContrDtlsObj = {
    RecAdvRefr: '',
    RecAdvDt: '',
    Tendrefr: '',
    Contrrefr: '',
    Extrefr: '',
    Projrefr: '',
    Porefr: '',
    PoRefDt: '',
  };
  ContrDtls.push(ContrDtlsObj);
  RefDtls.ContrDtls = ContrDtls;

  let AddlDocDtls = [];
  let AddlDocDtlsObj = {
    Url: '',
    Docs: '',
    Info: '',
  };
  AddlDocDtls.push(AddlDocDtlsObj);

  let ExpDtls = {
    ShipBNo: null,
    ShipBDt: null,
    Port: null,
    RefClm: null,
    ForCur: null,
    CntCode: null,
    ExpDuty: null,
  };

  let EwbDtls = {
    Transid: '',
    Transname: '',
    Distance: '',
    Transdocno: null,
    TransdocDt: null,
    Vehno: '',
    Vehtype: '',
    TransMode: '',
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
  // console.log('BDO JSON Payload :', BDOobj);
  return BDOobj;
  // s
};
const addCreditNotesDetails = async (creditNotesDetails, user, res) => {
  let result = '';
  let recentActivityData = {};
  let totalAmt = 0;
  for (const labour of creditNotesDetails.LabourSchedule) {
    totalAmt += labour.laborTotal;
  }
  for (const oslLabour of creditNotesDetails.oslLabourSchedule) {
    totalAmt += oslLabour.laborTotal;
  }
  for (const parts of creditNotesDetails.PartsIssuse) {
    totalAmt += parts.total;
  }

  console.log('Total Amount for Credit Note:', creditNotesDetails);
  // return false;

  try {
    let creditNotesPayload = {
      purpose: creditNotesDetails.purpose,
      jobCard: creditNotesDetails.jobCard,
      customerCode: creditNotesDetails.customerCode,
      customerAddress: creditNotesDetails.customerAddress,
      customerGstIn: creditNotesDetails.customerGstIn,
      jobCardNumber: creditNotesDetails.jobCardNumber,
      customerVehicle: creditNotesDetails.customerVehicle,
      amount: totalAmt.toString(),
      narration: creditNotesDetails.narration,
      vehicleId: creditNotesDetails.vehicleId,
      customerId: creditNotesDetails.customerId,
      jobCardOutlet: creditNotesDetails.jobCardOutlet,
    };
    // oulet is seller
    let companyAndOutlet = await cndDAO.getOutletandCompanyDetails(
      creditNotesDetails.jobCardOutlet
    );
    // customer is buyyer
    let customerDetails = await cndDAO.getCustomerDetails(
      creditNotesDetails.customerId
    );
    const customerDetailsData = customerDetails[0].dataValues;
    const resOutletCompanyDetails = companyAndOutlet.get({ plain: true });
    //  console.log('outlet details with comapny details',resOutletCompanyDetails)

    // console.log("creditNotesPayload--------",creditNotesPayload);
    let cndata = await cdNotesService.addCreditNotes(creditNotesPayload, user);

    const cnData = cndata.get();

    if (creditNotesDetails.purpose == 'SaleReturn') {
      if (
        cnData.customer_gstin &&
        resOutletCompanyDetails?.company?.enable_einvoice === 1
      ) {
        const labourArr = [];
        let labourQuantitys = 0;
        let labourAmountAfterDiscounts = 0;
        let labourCgstAmounts = 0;
        let labourSgstAmounts = 0;
        let labourIgstAmounts = 0;
        let labourLineTotals = 0;

        creditNotesDetails.LabourSchedule.forEach((schedule, index) => {
          const rot = schedule.rot_code;
          const labourQuantity = schedule.quantity;
          const labourRate = schedule.amount;
          const labourMargin = schedule.additionalMargin;
          let labourDiscount =
            (labourRate + labourMargin) * (schedule.discount_percentage / 100);
          const labourDepreciations = schedule.depreciation_per || 0;

          let laboAmount = labourRate + labourMargin;
          let labourAmountAfterDis = laboAmount - labourDiscount;

          let labourDepreciation = labourDepreciations;

          let labourCgst, labourSgst, labourIgst;

          labourCgst = schedule.cgst;
          labourSgst = schedule.sgst;
          labourIgst = schedule.igst;

          const labourCgstAmount = (labourAmountAfterDis * labourCgst) / 100;
          const labourSgstAmount = (labourAmountAfterDis * labourSgst) / 100;
          const labourIgstAmount = (labourAmountAfterDis * labourIgst) / 100;
          const labourTotalTax =
            labourCgstAmount + labourSgstAmount + labourIgstAmount;
          const labourLineTotal = labourAmountAfterDis + labourTotalTax;

          labourQuantitys += labourQuantity;
          labourAmountAfterDiscounts += labourAmountAfterDis;
          labourCgstAmounts += labourCgstAmount;
          labourSgstAmounts += labourSgstAmount;
          labourIgstAmounts += labourIgstAmount;
          labourLineTotals += labourLineTotal;

          if (rot) {
            const labour = {
              part_description: schedule.description,
              part_code: schedule.rot_code,
              hsn_code: '998729',
              quantity: labourQuantity,
              rate: (laboAmount / labourQuantity).toFixed(2),
              rateafterDiscount: labourAmountAfterDis.toFixed(2),
              dicount_amount: labourDiscount.toFixed(2),
              cgst: 0,
              sgst: 0,
              igst: 0,
              cgstAmount: labourCgstAmount.toFixed(2),
              sgstAmount: labourSgstAmount.toFixed(2),
              igstAmount: labourIgstAmount.toFixed(2),
              total: labourLineTotal.toFixed(2),
              taxamount: labourTotalTax.toFixed(2),
            };

            // outlet.state_code === customer.state_code
            if (true) {
              labour.cgst = labourCgst;
              labour.sgst = labourSgst;
              labour.igst = 0;
            } else {
              labour.cgst = 0;
              labour.sgst = 0;
              labour.igst = labourIgst;
            }

            // special rule for FU01A
            // if (labour.igst === 0 && labour.cgst === 0 && labour.sgst === 0) {
            //   if (schedule.rot_code === "FU01A") {
            //     labour.cgst = 0;
            //     labour.sgst = 0;
            //     labour.igst = 0;
            //   } else {
            //     labour.igst = 18;
            //   }
            // }

            labourArr.push(labour);
          }
        });

        const oslLabourArr = [];
        let oslLabourQuantitys = 0;
        let oslLabourAmountAfterDiscounts = 0;
        let oslLabourCgstAmounts = 0;
        let oslLabourSgstAmounts = 0;
        let oslLabourIgstAmounts = 0;
        let oslLabourLineTotals = 0;

        creditNotesDetails.oslLabourSchedule.forEach((osl_labour, i) => {
          const oslrot_code = osl_labour.rot_code;
          const oslrot_description = osl_labour.description;
          const oslsaccode = '998729';
          const oslLabourQuantity = osl_labour.quantity;
          const oslLabourRate = osl_labour.amount;
          const oslLabour_discount = 0;
          const oslLaboAmount = oslLabourQuantity * oslLabourRate;
          const oslsuppliermargin = osl_labour.marginPercentage;
          const oslAdditionalMargin = osl_labour.additionalMargin;
          const oslLabourAmount = oslLaboAmount - oslLabour_discount;

          const dec = oslsuppliermargin / 100;
          const oslmarginAmount =
            oslLabourAmount / (1 - dec) + oslAdditionalMargin;
          const oslLabourAmountAfterDis = oslmarginAmount;
          const oslLabourAmountbeforedis = oslmarginAmount;

          let oslLabourDepreciation;
          let oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
          let oslLabour_discount_final = oslLabour_discount;
          oslLabourDepreciation = osl_labour.depreciation_per;
          oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
          oslLabour_discount_final = oslLabour_discount;
          let oslLabourCgst, oslLabourSgst, oslLabourIgst;
          oslLabourCgst = osl_labour.cgst;
          oslLabourSgst = osl_labour.sgst;
          oslLabourIgst = osl_labour.igst;
          const oslLabourCgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourCgst / 100);
          const oslLabourSgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourSgst / 100);
          const oslLabourIgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourIgst / 100);

          const oslLabourtotalTax =
            oslLabourCgstAmount + oslLabourSgstAmount + oslLabourIgstAmount;
          const oslLabourLineTotal =
            oslLabourAmountAfterDiscount + oslLabourtotalTax;

          if (oslrot_code) {
            // const isSameState = outlet.State.Code === customer.State.Code;
            const isSameState = true;
            const cgst = isSameState ? oslLabourCgst : 0;
            const sgst = isSameState ? oslLabourSgst : 0;
            const igst = isSameState ? 0 : oslLabourIgst;

            oslLabourArr[i] = {
              part_description: oslrot_description,
              part_code: oslrot_code,
              hsn_code: oslsaccode,
              quantity: oslLabourQuantity,
              rate: (oslLabourAmountbeforedis / oslLabourQuantity).toFixed(2),
              rateafterDiscount: oslLabourAmountbeforedis.toFixed(2),
              dicount_amount: 0,
              cgst: cgst || oslLabourCgst,
              sgst: sgst || oslLabourSgst,
              igst: igst || oslLabourIgst,
              cgstAmount: oslLabourCgstAmount.toFixed(2),
              sgstAmount: oslLabourSgstAmount.toFixed(2),
              igstAmount: oslLabourIgstAmount.toFixed(2),
              total: oslLabourLineTotal.toFixed(2),
              taxamount: oslLabourtotalTax.toFixed(2),
            };
          }

          oslLabourQuantitys += oslLabourQuantity;
          oslLabourAmountAfterDiscounts += oslLabourAmountAfterDiscount;
          oslLabourCgstAmounts += oslLabourCgstAmount;
          oslLabourSgstAmounts += oslLabourSgstAmount;
          oslLabourIgstAmounts += oslLabourIgstAmount;
          oslLabourLineTotals += oslLabourLineTotal;
        });

        const partsArr = [];
        creditNotesDetails.PartsIssuse.forEach((part) => {
          // Skip repair_type == 2
          //   if (part.repair_type === 2) return;
          const quantity = part.quantity;
          const rate = part.rate;
          const discount = part.discount;
          const amount = quantity * rate;
          const amountAfterDiscount = amount - discount;
          const cgst = part.cgst;
          const sgst = part.sgst;
          const igst = part.igst;
          const cgstAmount = (amountAfterDiscount * cgst) / 100;
          const sgstAmount = (amountAfterDiscount * sgst) / 100;
          const igstAmount = (amountAfterDiscount * igst) / 100;
          const totalTax = cgstAmount + sgstAmount + igstAmount;
          const lineTotal = amountAfterDiscount + totalTax;
          partsArr.push({
            part_description: part.item_name,
            part_code: part.item_code,
            hsn_code: part.items?.hsnCode,
            quantity: quantity,
            rate: rate,
            rateafterDiscount: amountAfterDiscount,
            dicount_amount: discount,
            cgst: cgst,
            sgst: sgst,
            igst: igst,
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            igstAmount: igstAmount,
            total: lineTotal,
            taxamount: totalTax,
          });
        });

        let jcParts = [];
        if (
          (partsArr && partsArr.length > 0) ||
          (labourArr && labourArr.length > 0) ||
          (oslLabourArr && oslLabourArr.length > 0)
        ) {
          jcParts = [
            ...(partsArr || []),
            ...(labourArr || []),
            ...(oslLabourArr || []),
          ];
        }
        const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } =
          await constructBDOJson(
            resOutletCompanyDetails,
            customerDetailsData,
            cnData.doc_no,
            jcParts,
            cnData.createdAt
          );

        const credit_note_updates = {
          transaction_id: creditNotesDetails.jobCard,
          invoice_number: cnData.doc_no,
          credit_note_id: cnData.id,
          grand_total: invoiceTotalAmt,
          pass_args: BDOJsonStr,
          created_by: user.id,
        };

        const creditNoteaUpdateResult =
          await cndDAO.createCreditUpdate(credit_note_updates);

        //   console.log('creditNoteaUpdateResult',creditNoteaUpdateResult);
        if (!creditNoteaUpdateResult?.success) {
          throw new Error(creditNoteaUpdateResult?.error);
        }

        const CreditNoteUpdateLastID =
          creditNoteaUpdateResult.data.dataValues.id;

        // API Request to Submit Invoice
        const payload = {
          BDOData: BDOJsonStr,
          application_name: 'TVSFIT',
          process_name: 'Credit Note',
          process_id: creditNotesDetails.jobCard,
          created_at: new Date().toISOString(),
        };

        console.log('Sending Invoice Payload...');
        // const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
        //   headers: { 'Content-Type': 'application/json' },
        // });
       
        let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';

        if (resOutletCompanyDetails?.company?.id === 6) {
          apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
        } else if (resOutletCompanyDetails?.company?.id === 8) {
          apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
        }

        const apiResponse = await axios.post(apiUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('API Response From BDO Portal:', apiResponse.data);
        const IRNResponseData = apiResponse.data.data;

        // Handle API Response
        if (apiResponse.data.message == 'Success') {
          if (IRNResponseData.irnStatus == 0) {
            let cndata = await cdNote.deleteCounterSale(cnData.id);
            await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
              bdo_status: '2',
              response_arg: JSON.stringify(IRNResponseData.data.Error),
              created_by: user.id,
            });
          } else {
            await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
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
          let cndata = await cdNote.deleteCounterSale(cnData.id);
          await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
            bdo_status: '2',
            response_arg: JSON.stringify(apiResponse.data.Error),
            created_by: user.id,
          });
        }

        if (apiResponse.data.status_code === 2) {
          return res
            .status(500)
            .json({
              requestSuccessful: true,
              status_code: 2,
              message: apiResponse.data.Error,
            });
        }
      }
    }

    let cnId = await cndDAO.getCnId(creditNotesDetails.jobCard);

    let data = await cndDAO.addCreditNotesDetails(
      creditNotesDetails,
      user,
      cnId.id
    );
    if (data) {
      (recentActivityData['activity_type'] = 'Create'),
        (recentActivityData['menu_name'] = 'Credit?Debit Notes'),
        (recentActivityData['createdBy'] = user.id),
        (recentActivityData['username'] = user.employeeCode),
        (recentActivityData['message'] = 'Created');
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
      if (creditNotesDetails?.PartsIssuse.length > 0) {
        const body = [];
        for (let item of creditNotesDetails.PartsIssuse) {
          const {
            createdBy,
            createdAt,
            updatedAt,
            items,
            discount,
            repair_type,
            outlet_id,
            id,
            ...remainval
          } = item;
          body.push({ ...remainval, part_issue_id: id });
        }

        let Part_return_data = await PartReturnService.CreatePartReturn(
          body,
          user
        );
        let Stock_data = await PartReturnService.Updatestock(Part_return_data);
        let Stock_return_log_data =
          await PartReturnService.CreateStockReturnlog(Stock_data);
        // let part_indent_data = await PartReturnService.UpdatePartIntent(body);
        // let partissuedata = await PartReturnService.UpdatePartIssue(body);
      }
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Credit Notes Details addCreditNotesDetails:', err);
    // next(err);
  }

  return result;
};

const addOldDmsCreditNotesDetails = async (creditNotesDetails, user, res) => {
  let result = '';
  let recentActivityData = {};
  let totalAmt = 0;
      let transaction = await db.sequelize.transaction();

  for (const labour of creditNotesDetails.LabourSchedule) {
    totalAmt += labour.laborTotal;
  }
  for (const oslLabour of creditNotesDetails.oslLabourSchedule) {
    totalAmt += oslLabour.laborTotal;
  }
  for (const parts of creditNotesDetails.PartsIssuse) {
    totalAmt += parts.total;
  }

  console.log('Total Amount for Credit Note:', creditNotesDetails);

  try {
    let creditNotesPayload = {
      purpose: creditNotesDetails.purpose,
      oldDmsTransactionId : creditNotesDetails.jobCard,
      jobCard: creditNotesDetails.jobCard,
      customerCode: creditNotesDetails.customerCode,
      customerAddress: creditNotesDetails.customerAddress,
      customerGstIn: creditNotesDetails.customerGstIn,
      jobCardNumber: creditNotesDetails.jobCardNumber,
      customerVehicle: creditNotesDetails.customerVehicle,
      amount: totalAmt.toString(),
      narration: creditNotesDetails.narration,
      vehicleId: creditNotesDetails.vehicleId,
      customerId: creditNotesDetails.customerId,
      jobCardOutlet: creditNotesDetails.jobCardOutlet,
      outletCode: creditNotesDetails.outletCode,
    };
    // oulet is seller
    const outletDetails = await cndDAO.getOutletDetailsByCode(
      creditNotesDetails.outletCode
    );
    // console.log('Outlet Details:', outletDetails);
    if (!outletDetails.success) {
      logger.error('Outlet not found for code:', creditNotesDetails.outletCode);
      result = 'failed';
        throw new Error(`Outlet not found for code: ${creditNotesDetails.outletCode}`);

    }
    const customerDetailsByCode = await cndDAO.getCustomerDetailsByCode(
      creditNotesDetails.customerCode
    );
    // console.log('Customer Details by Code:', customerDetailsByCode);
    if (!customerDetailsByCode.success) {
      logger.error(
        'Customer not found for code:',
        creditNotesDetails.customerCode
      );
      result = 'failed';
        throw new Error('Customer not found for code:' +
        creditNotesDetails.customerCode
      );

    }
    // return false;
    let companyAndOutlet = await cndDAO.getOutletandCompanyDetails(
      outletDetails.data.id
    );
    // customer is buyyer
    let customerDetails = await cndDAO.getCustomerDetails(
      customerDetailsByCode.data.id
    );
    const customerDetailsData = customerDetails[0].dataValues;
    console.log(companyAndOutlet,"companyandoutlet")
    const resOutletCompanyDetails = companyAndOutlet.get({ plain: true });
      // console.log('outlet details with comapny details',resOutletCompanyDetails)

    //  console.log("creditNotesPayload--------",creditNotesPayload);
    let cndata = await cdNotesService.oldDmsaddCreditNotes(
      creditNotesPayload,
      user
    );

  

     const cnData = cndata.data.get();
  // console.log('Credit Note Creation Result:-----------', cnData);
    if (creditNotesDetails.purpose == 'SaleReturn') {
      if (
        cnData.customer_gstin &&
        resOutletCompanyDetails?.company?.enable_einvoice === 1
      ) {
        console.log('Constructing BDO JSON Payload for Invoice Generation...');
        const labourArr = [];
        let labourQuantitys = 0;
        let labourAmountAfterDiscounts = 0;
        let labourCgstAmounts = 0;
        let labourSgstAmounts = 0;
        let labourIgstAmounts = 0;
        let labourLineTotals = 0;

        creditNotesDetails.LabourSchedule.forEach((schedule, index) => {
          const rot = schedule.rot_code;
          const labourQuantity = schedule.quantity;
          const labourRate = schedule.amount;
          const labourMargin = schedule.additionalMargin;
          let labourDiscount =
            (labourRate + labourMargin) * (schedule.discount_percentage / 100);
          const labourDepreciations = schedule.depreciation_per || 0;

          let laboAmount = labourRate + labourMargin;
          let labourAmountAfterDis = laboAmount - labourDiscount;

          let labourDepreciation = labourDepreciations;

          let labourCgst, labourSgst, labourIgst;

          labourCgst = schedule.cgst;
          labourSgst = schedule.sgst;
          labourIgst = schedule.igst;

          const labourCgstAmount = (labourAmountAfterDis * labourCgst) / 100;
          const labourSgstAmount = (labourAmountAfterDis * labourSgst) / 100;
          const labourIgstAmount = (labourAmountAfterDis * labourIgst) / 100;
          const labourTotalTax =
            labourCgstAmount + labourSgstAmount + labourIgstAmount;
          const labourLineTotal = labourAmountAfterDis + labourTotalTax;

          labourQuantitys += labourQuantity;
          labourAmountAfterDiscounts += labourAmountAfterDis;
          labourCgstAmounts += labourCgstAmount;
          labourSgstAmounts += labourSgstAmount;
          labourIgstAmounts += labourIgstAmount;
          labourLineTotals += labourLineTotal;

          if (rot) {
            const labour = {
              part_description: schedule.description,
              part_code: schedule.rot_code,
              hsn_code: '998729',
              quantity: labourQuantity,
              rate: (laboAmount / labourQuantity).toFixed(2),
              rateafterDiscount: labourAmountAfterDis.toFixed(2),
              dicount_amount: labourDiscount.toFixed(2),
              cgst: 0,
              sgst: 0,
              igst: 0,
              cgstAmount: labourCgstAmount.toFixed(2),
              sgstAmount: labourSgstAmount.toFixed(2),
              igstAmount: labourIgstAmount.toFixed(2),
              total: labourLineTotal.toFixed(2),
              taxamount: labourTotalTax.toFixed(2),
            };

            // outlet.state_code === customer.state_code
            if (true) {
              labour.cgst = labourCgst;
              labour.sgst = labourSgst;
              labour.igst = 0;
            } else {
              labour.cgst = 0;
              labour.sgst = 0;
              labour.igst = labourIgst;
            }

            // special rule for FU01A
            // if (labour.igst === 0 && labour.cgst === 0 && labour.sgst === 0) {
            //   if (schedule.rot_code === "FU01A") {
            //     labour.cgst = 0;
            //     labour.sgst = 0;
            //     labour.igst = 0;
            //   } else {
            //     labour.igst = 18;
            //   }
            // }

            labourArr.push(labour);
          }
        });

        const oslLabourArr = [];
        let oslLabourQuantitys = 0;
        let oslLabourAmountAfterDiscounts = 0;
        let oslLabourCgstAmounts = 0;
        let oslLabourSgstAmounts = 0;
        let oslLabourIgstAmounts = 0;
        let oslLabourLineTotals = 0;

        creditNotesDetails.oslLabourSchedule.forEach((osl_labour, i) => {
          const oslrot_code = osl_labour.rot_code;
          const oslrot_description = osl_labour.description;
          const oslsaccode = '998729';
          const oslLabourQuantity = osl_labour.quantity;
          const oslLabourRate = osl_labour.amount;
          const oslLabour_discount = 0;
          const oslLaboAmount = oslLabourQuantity * oslLabourRate;
          const oslsuppliermargin = osl_labour.marginPercentage;
          const oslAdditionalMargin = osl_labour.additionalMargin;
          const oslLabourAmount = oslLaboAmount - oslLabour_discount;

          const dec = oslsuppliermargin / 100;
          const oslmarginAmount =
            oslLabourAmount / (1 - dec) + oslAdditionalMargin;
          const oslLabourAmountAfterDis = oslmarginAmount;
          const oslLabourAmountbeforedis = oslmarginAmount;

          let oslLabourDepreciation;
          let oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
          let oslLabour_discount_final = oslLabour_discount;
          oslLabourDepreciation = osl_labour.depreciation_per;
          oslLabourAmountAfterDiscount = oslLabourAmountAfterDis;
          oslLabour_discount_final = oslLabour_discount;
          let oslLabourCgst, oslLabourSgst, oslLabourIgst;
          oslLabourCgst = osl_labour.cgst;
          oslLabourSgst = osl_labour.sgst;
          oslLabourIgst = osl_labour.igst;
          const oslLabourCgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourCgst / 100);
          const oslLabourSgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourSgst / 100);
          const oslLabourIgstAmount =
            oslLabourAmountAfterDiscount * (oslLabourIgst / 100);

          const oslLabourtotalTax =
            oslLabourCgstAmount + oslLabourSgstAmount + oslLabourIgstAmount;
          const oslLabourLineTotal =
            oslLabourAmountAfterDiscount + oslLabourtotalTax;

          if (oslrot_code) {
            // const isSameState = outlet.State.Code === customer.State.Code;
            const isSameState = true;
            const cgst = isSameState ? oslLabourCgst : 0;
            const sgst = isSameState ? oslLabourSgst : 0;
            const igst = isSameState ? 0 : oslLabourIgst;

            oslLabourArr[i] = {
              part_description: oslrot_description,
              part_code: oslrot_code,
              hsn_code: oslsaccode,
              quantity: oslLabourQuantity,
              rate: (oslLabourAmountbeforedis / oslLabourQuantity).toFixed(2),
              rateafterDiscount: oslLabourAmountbeforedis.toFixed(2),
              dicount_amount: 0,
              cgst: cgst || oslLabourCgst,
              sgst: sgst || oslLabourSgst,
              igst: igst || oslLabourIgst,
              cgstAmount: oslLabourCgstAmount.toFixed(2),
              sgstAmount: oslLabourSgstAmount.toFixed(2),
              igstAmount: oslLabourIgstAmount.toFixed(2),
              total: oslLabourLineTotal.toFixed(2),
              taxamount: oslLabourtotalTax.toFixed(2),
            };
          }

          oslLabourQuantitys += oslLabourQuantity;
          oslLabourAmountAfterDiscounts += oslLabourAmountAfterDiscount;
          oslLabourCgstAmounts += oslLabourCgstAmount;
          oslLabourSgstAmounts += oslLabourSgstAmount;
          oslLabourIgstAmounts += oslLabourIgstAmount;
          oslLabourLineTotals += oslLabourLineTotal;
        });

        const partsArr = [];
        creditNotesDetails.PartsIssuse.forEach((part) => {
          // Skip repair_type == 2
          //   if (part.repair_type === 2) return;
          const quantity = part.quantity;
          const rate = part.rate;
          const discount = part.discount;
          const amount = quantity * rate;
          const amountAfterDiscount = amount - discount;
          const cgst = part.cgst;
          const sgst = part.sgst;
          const igst = part.igst;
          const cgstAmount = (amountAfterDiscount * cgst) / 100;
          const sgstAmount = (amountAfterDiscount * sgst) / 100;
          const igstAmount = (amountAfterDiscount * igst) / 100;
          const totalTax = cgstAmount + sgstAmount + igstAmount;
          const lineTotal = amountAfterDiscount + totalTax;
          partsArr.push({
            part_description: part.item_name,
            part_code: part.item_code,
            hsn_code: part.items?.hsnCode,
            quantity: quantity,
            rate: rate,
            rateafterDiscount: amountAfterDiscount,
            dicount_amount: discount,
            cgst: cgst,
            sgst: sgst,
            igst: igst,
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            igstAmount: igstAmount,
            total: lineTotal,
            taxamount: totalTax,
          });
        });

        let jcParts = [];
        if (
          (partsArr && partsArr.length > 0) ||
          (labourArr && labourArr.length > 0) ||
          (oslLabourArr && oslLabourArr.length > 0)
        ) {
          jcParts = [
            ...(partsArr || []),
            ...(labourArr || []),
            ...(oslLabourArr || []),
          ];
        }
        const { data: BDOJsonStr, grandTotal: invoiceTotalAmt } =
          await constructBDOJson(
            resOutletCompanyDetails,
            customerDetailsData,
            cnData.doc_no,
            jcParts,
            cnData.createdAt
          );

        const credit_note_updates = {
          transaction_id: creditNotesDetails.jobCard,
          invoice_number: cnData.doc_no,
          credit_note_id: cnData.id,
          grand_total: invoiceTotalAmt,
          pass_args: BDOJsonStr,
          created_by: user.id,
        };

        // console.log('Credit Note Update Payload:', credit_note_updates);
        // return false;

        const creditNoteaUpdateResult =
          await cndDAO.createCreditUpdate(credit_note_updates);

        //   console.log('creditNoteaUpdateResult',creditNoteaUpdateResult);
        if (!creditNoteaUpdateResult?.success) {
          throw new Error(creditNoteaUpdateResult?.error);
        }

        const CreditNoteUpdateLastID =
          creditNoteaUpdateResult.data.dataValues.id;

        // API Request to Submit Invoice
        const payload = {
          BDOData: BDOJsonStr,
          application_name: 'TVSFIT',
          process_name: 'Credit Note',
          process_id: creditNotesDetails.jobCard,
          created_at: new Date().toISOString(),
        };

        console.log('Sending Invoice Payload...');
        // const apiResponse = await axios.post('http://localhost:5000/api/einvoice_ki/bdoapis/submitgrn', payload, {
        //   headers: { 'Content-Type': 'application/json' },
        // });
               
        let apiUrl = 'https://fitdms.mytvs.in/tasl_einvoice/api/einvoice_ki/bdoapis/submitgrn';

        if (resOutletCompanyDetails?.company?.id === 6) {
          apiUrl = 'https://fitdms.mytvs.in/pms_einvoice/api/einvoice_ki/bdoapis/submitgrn';
        } else if (resOutletCompanyDetails?.company?.id === 8) {
          apiUrl = 'https://fitdms.mytvs.in/kitara_einvoice/api/einvoice_ki/bdoapis/submitgrn';
        }

        const apiResponse = await axios.post(apiUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        });


        console.log('API Response From BDO Portal:', apiResponse.data);
        const IRNResponseData = apiResponse.data.data;

        // Handle API Response
        if (apiResponse.data.message == 'Success') {
          if (IRNResponseData.irnStatus == 0) {
            let cndata = await cdNote.deleteCounterSale(cnData.id);
            await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
              bdo_status: '2',
              response_arg: JSON.stringify(IRNResponseData.data.Error),
              created_by: user.id,
            });
          } else {
            await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
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
          let cndata = await cdNote.deleteCounterSale(cnData.id);
          await cndDAO.UpdateCreditNoteUpdateRes(CreditNoteUpdateLastID, {
            bdo_status: '2',
            response_arg: JSON.stringify(apiResponse.data.Error),
            created_by: user.id,
          });
        }

        if (apiResponse.data.status_code === 2) {
          return res
            .status(500)
            .json({
              requestSuccessful: true,
              status_code: 2,
              message: apiResponse.data.Error,
            });
        }
      }
    }

    let cnId = await cndDAO.getOldDmsCnId(creditNotesDetails.oldDmsTransactionId);

    let data = await cndDAO.oldDmsAddCreditNotesDetails(
      creditNotesDetails,
      user,
      cnId.id
    );
    // return 'success';

    if (data) {
      (recentActivityData['activity_type'] = 'Create'),
        (recentActivityData['menu_name'] = 'Credit?Debit Notes'),
        (recentActivityData['createdBy'] = user.id),
        (recentActivityData['username'] = user.employeeCode),
        (recentActivityData['message'] = 'Created');
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
      if (creditNotesDetails?.PartsIssuse.length > 0) {
        const grnparts = [];
        let FindOutletId = await OutletDao.findByCode(creditNotesDetails.outletCode);
      for(let part of creditNotesDetails.PartsIssuse)   {
          // Skip repair_type == 2
          //   if (part.repair_type === 2) return;
          const quantity = part.quantity;
          const rate = part.rate;
          const discount = part.discount;
          const amount = quantity * rate;
          const amountAfterDiscount = amount - discount;
          const cgst = part.cgst;
          const sgst = part.sgst;
          const igst = part.igst;
          const cgstAmount = (amountAfterDiscount * cgst) / 100;
          const sgstAmount = (amountAfterDiscount * sgst) / 100;
          const igstAmount = (amountAfterDiscount * igst) / 100;
          const totalTax = cgstAmount + sgstAmount + igstAmount;
          const lineTotal = amountAfterDiscount + totalTax;
          grnparts.push({
            item_description: part.item_name,
            item_code: part.item_code,
            hsn_code: part.items?.hsnCode,
            quantity: quantity,
            sup_invoice_quantity: quantity,
            rate: rate,
            cost: part?.cost || 0,
            mrp: part?.mrp || 0,
            discount: discount || 0,
            cgst: cgst,
            sgst: sgst,
            igst: igst,
            total: lineTotal,
            binlocation:0,
            bin_locations:part?.bin_locations,
            outlet_id: FindOutletId.dataValues.id,
          });
        };
        let grandTotal=grnparts.reduce((acc, part) => acc + part.total, 0);

      let grndata ={
        document_type:"ADJ",
        vendor_code:"0",
        invoice_date:creditNotesDetails?.job_card_created_date ? creditNotesDetails?.job_card_created_date?.slice(0,10) : new Date().toISOString().slice(0,10),
        status:2,
        frieght_charges :0,
        mis_charges:0,
        outlet_id: FindOutletId.dataValues.id,
        outlet_code:creditNotesDetails.outletCode,
        invoice_number: creditNotesDetails.jobCardNumber
      }
     
      
    let grnres = await GrnService.CreateGrnForOldDms(grndata,user,transaction)
     let grnpartsres = await GrnService.CreateGrnStocksForOldDms(
      grnparts,
      grnres,
      user,
      transaction
    );

  let  stockadjustmentdata = await GrnService.CreateStockAdjustmentForOlddms(grnres,grandTotal,FindOutletId.dataValues.id,creditNotesDetails.outletCode,transaction);
  let  stockadjustmentpartdata=await GrnService.CreateStockAdjustmentPartsForOlddms(grnpartsres,stockadjustmentdata,transaction)
        transaction.commit();
      }
      result = 'success';
    }
  } catch (err) {
    await transaction.rollback();
    result = 'failed';
    logger.error('old dms Credit Notes Details addCreditNotesDetails:', err);
    // next(err);
    throw err
  }

  return result;
};
const creditDebitNotesPdf = async (id, outlet) => {
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const labour = [];
  const parts = [];
  try {
    const data = await cndDAO.creditDebitNotesPdf(id);
    // console.log('direct from service.js-------',data.get({plain:true}))
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    (outletObj['name'] = data.outlet.outletCode),
      (outletObj['address'] = data.outlet.address1),
      (outletObj['city'] = data.outlet.city),
      (outletObj['state'] = data.outlet.state),
      (outletObj['pincode'] = data.outlet.pincode),
      (outletObj['phone'] = data.outlet.phoneNumber),
      (outletObj['mobile'] = data.outlet.phoneNumber),
      (outletObj['email'] = data.outlet.email),
      (outletObj['outletName'] = data.outlet.outletName),
      (outletObj['dealerGstin'] = data.outlet.gstIn);
    resObj['outlet'] = outletObj;

    (customerObj['name'] = data.jobCard.customer_name),
      (customerObj['customer_code'] = data.jobCard.customer_code),
      (customerObj['document_type'] = data.jobCard.document_type);
    (customerObj['gstin'] = data.jobCard.customer_gstin),
      (customerObj['address'] = data.jobCard.customer_address),
      (customerObj['chassisNo'] = data.jobCard.vehicle.chassisNumber),
      (customerObj['customerVoice'] = data.jobCard.customer_voice),
      (customerObj['serviceEngineerRemarks'] =
        data.jobCard.service_engineer_remarks),
      (customerObj['city'] = data.jobCard.customer_city),
      (customerObj['state'] = data.jobCard.customer_state),
      (customerObj['pincode'] = data.jobCard.customer_pincode),
      (customerObj['engNo'] = data.jobCard.vehicle.engineNumber);
    customerObj['documentName'] = data.jobCard.job_card_no;
    customerObj['documentDate'] = formattedDate;
    customerObj['model'] = data.jobCard.vehicle.model.modelName;
    customerObj['regNo'] = data.jobCard.reg_no;
    customerObj['kmReading'] = data.jobCard.odometer;
    // customerObj["checkinTime"] = data.jobCard.customer_arrived_date.toString().substring(0, 25);
    customerObj['checkinTime'] = moment(data.jobCard.customer_arrived_date)
      .tz('Asia/Kolkata')
      .format('DD-MM-YYYY HH:mm:ss');
    // customerObj["expectedTime"] = data.jobCard.work_end_date_time.toString().substring(0, 25);
    customerObj['expectedTime'] = moment(data.jobCard.work_end_date_time)
      .tz('Asia/Kolkata')
      .format('DD-MM-YYYY HH:mm:ss');
    customerObj['repairType'] = data.jobCard.repairtype.repairTypeName;
    customerObj['serviceType'] = data.jobCard.servicetype.serviceTypeName;
    customerObj['InvoiceNumber'] = data.jobCard.billing
      ? data.jobCard.billing.bill_no
      : '';
    customerObj['InvoiceType'] = data.jobCard.billing
      ? data.jobCard.billing.bill_type === 'cash'
        ? 'Cash bill'
        : 'Credit bill'
      : '';
    resObj['customer'] = customerObj;

    const {
      createdAt,
      reg_no,
      doc_no,
      customer_code,
      customer_gstin,
      amount,
      narration,
      purpose,
    } = data?.dataValues || {};

    const decryptedCustomerName = data.jobCard.customer_name;
    const address1 = data.jobCard.customer_address;

    const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      // hour: '2-digit',
      // minute: '2-digit',
      // hour12: true,
    }).format(new Date(createdAt));

    const amountInWords = numberToWords.toWords(amount).toUpperCase();

    const creditDebit = {
      createdAt: formattedCreatedAt,
      reg_no,
      doc_no,
      customer_gstin,
      customer_code,
      amount,
      amountInWords,
      address1,
      decryptedCustomerName,
      narration,
      purpose,
    };

    let sno = 1;
    let totallabQty = 0;
    let totallabDiscount = 0;
    let totallabSGst = 0;
    let totallabCGst = 0;
    let totallabiGst = 0;
    let totalabAmount = 0;
    let totallabbeforetax = 0;

    let psno = 1;
    let totalpartQty = 0;
    let totalpartDiscount = 0;
    let totalpartSGst = 0;
    let totalpartCGst = 0;
    let totalpartiGst = 0;
    let totapartAmount = 0;

    resObj['showLabour'] = false;
    resObj['showSpares'] = false;
    resObj['hasDBO'] = false;

    data.creditNotesDetails.forEach((osl) => {
      if (osl.itemType === 1) {
        resObj['showLabour'] = true;
        const laborObj = {};
        let baseAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        baseAmount = parseFloat(
          (
            osl.quantity * osl.amount -
            osl.discount_percentage +
            osl.additional_margin
          ).toFixed(2)
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = osl.total.toFixed(2);
        totallabDiscount = totallabDiscount + osl.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + osl.total;
        totallabbeforetax += osl.amount;

        laborObj['sno'] = sno++;
        laborObj['rot_code'] = osl.rot_code;
        laborObj['description'] = osl.rot_description;
        laborObj['quantity'] = osl.quantity.toFixed(2);
        laborObj['rate'] = osl.amount.toFixed(2);
        laborObj['totalval'] = osl.amount.toFixed(2);
        laborObj['discount'] = osl.discount_percentage.toFixed(2);
        laborObj['cgst'] = osl.cgst;
        laborObj['sgst'] = osl.sgst;
        laborObj['igst'] = osl.igst;
        laborObj['hsn'] = osl.hsn;
        totallabQty = totallabQty + osl.quantity;

        labour.push(laborObj);
      } else if (osl.itemType === 2) {
        resObj['showLabour'] = true;
        const laborObj = {};
        let baseAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let margin = osl.marginPercentage / 100;
        baseAmount = parseFloat(
          (
            (osl.quantity * osl.amount - osl.discount_percentage) /
              (1 - margin) +
            osl.additional_margin
          ).toFixed(2)
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        let tax = igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
        let totalAmount = baseAmount + tax;
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = totalAmount.toFixed(2);
        totallabDiscount = totallabDiscount + osl.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + totalAmount;
        totallabbeforetax += baseAmount;

        laborObj['sno'] = sno++;
        laborObj['rot_code'] = osl.rot_code;
        laborObj['description'] = osl.rot_description;
        laborObj['quantity'] = osl.quantity.toFixed(2);
        laborObj['rate'] = osl.amount.toFixed(2);
        laborObj['totalval'] = osl.amount.toFixed(2);
        laborObj['discount'] = osl.discount_percentage.toFixed(2);
        laborObj['cgst'] = osl.cgst;
        laborObj['sgst'] = osl.sgst;
        laborObj['igst'] = osl.igst;
        laborObj['hsn'] = osl.hsn;
        totallabQty = totallabQty + osl.quantity;

        labour.push(laborObj);
      } else {
        resObj['showSpares'] = true;
        const partObj = {};
        const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));
        const igstAmount = parseFloat(
          ((osl.igst / 100) * baseAmount).toFixed(2)
        );
        const cgstAmount = parseFloat(
          ((osl.cgst / 100) * baseAmount).toFixed(2)
        );
        const sgstAmount = parseFloat(
          ((osl.sgst / 100) * baseAmount).toFixed(2)
        );

        const amount = parseFloat(
          (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
        );

        partObj['sno'] = psno++;
        partObj['code'] = osl.rot_code;
        partObj['description'] = osl.rot_description;
        partObj['hsn'] = osl.hsn;
        partObj['quantity'] = osl.quantity.toFixed(2);
        partObj['rate'] = osl.amount.toFixed(2);
        partObj['totalval'] = amount.toFixed(2);
        // partObj['discount']=osl.discount_percentage;
        partObj['cgst'] = osl.cgst;
        partObj['sgst'] = osl.sgst;
        partObj['igst'] = osl.igst;
        partObj['totalamt'] = amount.toFixed(2);

        partObj['cgstamt'] = cgstAmount.toFixed(2);
        partObj['sgstamt'] = sgstAmount.toFixed(2);
        partObj['igstamt'] = igstAmount.toFixed(2);

        totalpartQty = totalpartQty + osl.quantity;
        //totalpartDiscount=totalpartDiscount+osl.discount_percentage;
        totalpartSGst = totalpartSGst + sgstAmount;
        totalpartCGst = totalpartCGst + cgstAmount;
        totalpartiGst = totalpartiGst + igstAmount;
        totapartAmount = totapartAmount + amount;

        parts.push(partObj);
      }
    });

    // if(totallabQty > 0){

    // }
    // if(totalpartQty>0){

    // }

    resObj['totalLaborDiscount'] = totallabDiscount.toFixed(2);
    resObj['totalLaborSGst'] = totallabSGst.toFixed(2);
    resObj['totalLaborCGst'] = totallabCGst.toFixed(2);
    resObj['totalLaborIGst'] = totallabiGst.toFixed(2);
    //totalabAmount = totalabAmount + (totallabiGst == 0 ? (totallabSGst + totallabCGst) : totallabiGst);
    resObj['totalLaborAmount'] = totalabAmount.toFixed(2);
    resObj['totalGstOnLabor'] =
      totallabiGst == 0
        ? (totallabSGst + totallabCGst).toFixed(2)
        : totallabiGst.toFixed(2);
    resObj['labBeforeTaxAmt'] = totallabbeforetax.toFixed(2);
    let roundtotalLabAmount = Math.round(resObj['totalLaborAmount']);
    resObj['labAmtRound'] = roundtotalLabAmount.toFixed(2);
    resObj['labRound'] = (
      roundtotalLabAmount - resObj['totalLaborAmount']
    ).toFixed(2);
    resObj['totalLabAmountWords'] = numberToWords.toWords(roundtotalLabAmount);

    resObj['totalLaborQuantity'] = totallabQty.toFixed(2);
    resObj['labours'] = labour;

    resObj['totalPartsQuantity'] = totalpartQty.toFixed(2);
    //resObj['totalPartsDiscount']=totallabDiscount;
    resObj['totalPartsSGst'] = totalpartSGst.toFixed(2);
    resObj['totalPartsCGst'] = totalpartCGst.toFixed(2);
    resObj['totalPartsIGst'] = totalpartiGst.toFixed(2);
    resObj['totalPartsAmount'] = totapartAmount.toFixed(2);
    resObj['totalGstOnParts'] =
      totalpartiGst == 0
        ? (totalpartSGst + totalpartCGst).toFixed(2)
        : totalpartiGst.toFixed(2);

    let roundtotalPartsAmount = Math.round(totapartAmount);
    resObj['partAmtRound'] = roundtotalPartsAmount.toFixed(2);
    resObj['partRound'] = (roundtotalPartsAmount - totapartAmount).toFixed(2);
    resObj['totalPartsAmountWords'] = numberToWords.toWords(
      roundtotalPartsAmount
    );

    resObj['totalLaborPartsAmount'] = (totapartAmount + totalabAmount).toFixed(
      2
    );
    resObj['totalLaborPartsAmountRnd'] = Math.round(
      totapartAmount + totalabAmount
    ).toFixed(2);
    resObj['totalLaborPartsAmountWords'] = numberToWords
      .toWords(Math.round(totapartAmount + totalabAmount))
      .toUpperCase();
    resObj['document_type'] = data.document_type;
    resObj['parts'] = parts;
    resObj['creditDebit'] = creditDebit;

    resObj['creditNotesUpdateMap'] = data.creditNotesUpdateMap.map((item) => ({
      ...item,
      invoice_bdoack_date: item.invoice_bdoack_date
        ? item.invoice_bdoack_date.toISOString()
        : '',
      irn_no: item.irn_no,
      signed_qr_code: item.signed_qr_code,
    }));
    if (resObj['creditNotesUpdateMap']?.length > 0) {
      resObj['hasDBO'] = true;
    }

    return resObj;
  } catch (err) {
    console.log(err);
    logger.error('CreditNotes service creditDebitNotesPdf', err);
  }
};



const oldDmscreditDebitNotesPdf = async (id, outlet) => {
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const labour = [];
  const parts = [];
  try {
    const data = await cndDAO.creditDebitNotesPdf(id);
    // console.log('direct from service.js-------',data.get({plain:true}))
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    (outletObj['name'] = data.outlet.outletCode),
      (outletObj['address'] = data.outlet.address1),
      (outletObj['city'] = data.outlet.city),
      (outletObj['state'] = data.outlet.state),
      (outletObj['pincode'] = data.outlet.pincode),
      (outletObj['phone'] = data.outlet.phoneNumber),
      (outletObj['mobile'] = data.outlet.phoneNumber),
      (outletObj['email'] = data.outlet.email),
      (outletObj['outletName'] = data.outlet.outletName),
      (outletObj['dealerGstin'] = data.outlet.gstIn);
    resObj['outlet'] = outletObj;

    // (customerObj['name'] = data.jobCard.customer_name),
      // (customerObj['customer_code'] = data.jobCard.customer_code),
      // (customerObj['document_type'] = data.jobCard.document_type);
    // (customerObj['gstin'] = data.jobCard.customer_gstin),
      // (customerObj['address'] = data.jobCard.customer_address),
      // (customerObj['chassisNo'] = data.jobCard.vehicle.chassisNumber),
      // (customerObj['customerVoice'] = data.jobCard.customer_voice),
      // (customerObj['serviceEngineerRemarks'] =
      //   data.jobCard.service_engineer_remarks),
      // (customerObj['city'] = data.jobCard.customer_city),
      // (customerObj['state'] = data.jobCard.customer_state),
      // (customerObj['pincode'] = data.jobCard.customer_pincode),
      // (customerObj['engNo'] = data.jobCard.vehicle.engineNumber);
    // customerObj['documentName'] = data.jobCard.job_card_no;
    customerObj['documentDate'] = formattedDate;
    // customerObj['model'] = data.jobCard.vehicle.model.modelName;
    // customerObj['regNo'] = data.jobCard.reg_no;
    // customerObj['kmReading'] = data.jobCard.odometer;
    // customerObj["checkinTime"] = data.jobCard.customer_arrived_date.toString().substring(0, 25);
    // customerObj['checkinTime'] = moment(data.jobCard.customer_arrived_date)
    //   .tz('Asia/Kolkata')
    //   .format('DD-MM-YYYY HH:mm:ss');
    // customerObj["expectedTime"] = data.jobCard.work_end_date_time.toString().substring(0, 25);
    // customerObj['expectedTime'] = moment(data.jobCard.work_end_date_time)
    //   .tz('Asia/Kolkata')
    //   .format('DD-MM-YYYY HH:mm:ss');
    // customerObj['repairType'] = data.jobCard.repairtype.repairTypeName;
    // customerObj['serviceType'] = data.jobCard.servicetype.serviceTypeName;
    // customerObj['InvoiceNumber'] = data.jobCard.billing
    //   ? data.jobCard.billing.bill_no
    //   : '';
    // customerObj['InvoiceType'] = data.jobCard.billing
    //   ? data.jobCard.billing.bill_type === 'cash'
    //     ? 'Cash bill'
    //     : 'Credit bill'
    //   : '';
    resObj['customer'] = customerObj;

    const {
      createdAt,
      reg_no,
      doc_no,
      customer_code,
      customer_gstin,
      amount,
      narration,
      purpose,
    } = data?.dataValues || {};

    const decryptedCustomerName = ' ';
    const address1 = '  ';

    const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      // hour: '2-digit',
      // minute: '2-digit',
      // hour12: true,
    }).format(new Date(createdAt));

    const amountInWords = numberToWords.toWords(amount).toUpperCase();

    const creditDebit = {
      createdAt: formattedCreatedAt,
      reg_no,
      doc_no,
      customer_gstin,
      customer_code,
      amount,
      amountInWords,
      address1,
      decryptedCustomerName,
      narration,
      purpose,
    };

    let sno = 1;
    let totallabQty = 0;
    let totallabDiscount = 0;
    let totallabSGst = 0;
    let totallabCGst = 0;
    let totallabiGst = 0;
    let totalabAmount = 0;
    let totallabbeforetax = 0;

    let psno = 1;
    let totalpartQty = 0;
    let totalpartDiscount = 0;
    let totalpartSGst = 0;
    let totalpartCGst = 0;
    let totalpartiGst = 0;
    let totapartAmount = 0;

    resObj['showLabour'] = false;
    resObj['showSpares'] = false;
    resObj['hasDBO'] = false;

    data.creditNotesDetails.forEach((osl) => {
      if (osl.itemType === 1) {
        resObj['showLabour'] = true;
        const laborObj = {};
        let baseAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        baseAmount = parseFloat(
          (
            osl.quantity * osl.amount -
            osl.discount_percentage +
            osl.additional_margin
          ).toFixed(2)
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = osl.total.toFixed(2);
        totallabDiscount = totallabDiscount + osl.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + osl.total;
        totallabbeforetax += osl.amount;

        laborObj['sno'] = sno++;
        laborObj['rot_code'] = osl.rot_code;
        laborObj['description'] = osl.rot_description;
        laborObj['quantity'] = osl.quantity.toFixed(2);
        laborObj['rate'] = osl.amount.toFixed(2);
        laborObj['totalval'] = osl.amount.toFixed(2);
        laborObj['discount'] = osl.discount_percentage.toFixed(2);
        laborObj['cgst'] = osl.cgst;
        laborObj['sgst'] = osl.sgst;
        laborObj['igst'] = osl.igst;
        laborObj['hsn'] = osl.hsn;
        totallabQty = totallabQty + osl.quantity;

        labour.push(laborObj);
      } else if (osl.itemType === 2) {
        resObj['showLabour'] = true;
        const laborObj = {};
        let baseAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let margin = osl.marginPercentage / 100;
        baseAmount = parseFloat(
          (
            (osl.quantity * osl.amount - osl.discount_percentage) /
              (1 - margin) +
            osl.additional_margin
          ).toFixed(2)
        );
        igstAmount = parseFloat(((osl.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((osl.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((osl.sgst / 100) * baseAmount).toFixed(2));
        let tax = igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
        let totalAmount = baseAmount + tax;
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = baseAmount.toFixed(2);
        laborObj['totalamt'] = totalAmount.toFixed(2);
        totallabDiscount = totallabDiscount + osl.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + totalAmount;
        totallabbeforetax += baseAmount;

        laborObj['sno'] = sno++;
        laborObj['rot_code'] = osl.rot_code;
        laborObj['description'] = osl.rot_description;
        laborObj['quantity'] = osl.quantity.toFixed(2);
        laborObj['rate'] = osl.amount.toFixed(2);
        laborObj['totalval'] = osl.amount.toFixed(2);
        laborObj['discount'] = osl.discount_percentage.toFixed(2);
        laborObj['cgst'] = osl.cgst;
        laborObj['sgst'] = osl.sgst;
        laborObj['igst'] = osl.igst;
        laborObj['hsn'] = osl.hsn;
        totallabQty = totallabQty + osl.quantity;

        labour.push(laborObj);
      } else {
        resObj['showSpares'] = true;
        const partObj = {};
        const baseAmount = parseFloat((osl.quantity * osl.amount).toFixed(2));
        const igstAmount = parseFloat(
          ((osl.igst / 100) * baseAmount).toFixed(2)
        );
        const cgstAmount = parseFloat(
          ((osl.cgst / 100) * baseAmount).toFixed(2)
        );
        const sgstAmount = parseFloat(
          ((osl.sgst / 100) * baseAmount).toFixed(2)
        );

        const amount = parseFloat(
          (baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2)
        );

        partObj['sno'] = psno++;
        partObj['code'] = osl.rot_code;
        partObj['description'] = osl.rot_description;
        partObj['hsn'] = osl.hsn;
        partObj['quantity'] = osl.quantity.toFixed(2);
        partObj['rate'] = osl.amount.toFixed(2);
        partObj['totalval'] = amount.toFixed(2);
        // partObj['discount']=osl.discount_percentage;
        partObj['cgst'] = osl.cgst;
        partObj['sgst'] = osl.sgst;
        partObj['igst'] = osl.igst;
        partObj['totalamt'] = amount.toFixed(2);

        partObj['cgstamt'] = cgstAmount.toFixed(2);
        partObj['sgstamt'] = sgstAmount.toFixed(2);
        partObj['igstamt'] = igstAmount.toFixed(2);

        totalpartQty = totalpartQty + osl.quantity;
        //totalpartDiscount=totalpartDiscount+osl.discount_percentage;
        totalpartSGst = totalpartSGst + sgstAmount;
        totalpartCGst = totalpartCGst + cgstAmount;
        totalpartiGst = totalpartiGst + igstAmount;
        totapartAmount = totapartAmount + amount;

        parts.push(partObj);
      }
    });

    // if(totallabQty > 0){

    // }
    // if(totalpartQty>0){

    // }

    resObj['totalLaborDiscount'] = totallabDiscount.toFixed(2);
    resObj['totalLaborSGst'] = totallabSGst.toFixed(2);
    resObj['totalLaborCGst'] = totallabCGst.toFixed(2);
    resObj['totalLaborIGst'] = totallabiGst.toFixed(2);
    //totalabAmount = totalabAmount + (totallabiGst == 0 ? (totallabSGst + totallabCGst) : totallabiGst);
    resObj['totalLaborAmount'] = totalabAmount.toFixed(2);
    resObj['totalGstOnLabor'] =
      totallabiGst == 0
        ? (totallabSGst + totallabCGst).toFixed(2)
        : totallabiGst.toFixed(2);
    resObj['labBeforeTaxAmt'] = totallabbeforetax.toFixed(2);
    let roundtotalLabAmount = Math.round(resObj['totalLaborAmount']);
    resObj['labAmtRound'] = roundtotalLabAmount.toFixed(2);
    resObj['labRound'] = (
      roundtotalLabAmount - resObj['totalLaborAmount']
    ).toFixed(2);
    resObj['totalLabAmountWords'] = numberToWords.toWords(roundtotalLabAmount);

    resObj['totalLaborQuantity'] = totallabQty.toFixed(2);
    resObj['labours'] = labour;

    resObj['totalPartsQuantity'] = totalpartQty.toFixed(2);
    //resObj['totalPartsDiscount']=totallabDiscount;
    resObj['totalPartsSGst'] = totalpartSGst.toFixed(2);
    resObj['totalPartsCGst'] = totalpartCGst.toFixed(2);
    resObj['totalPartsIGst'] = totalpartiGst.toFixed(2);
    resObj['totalPartsAmount'] = totapartAmount.toFixed(2);
    resObj['totalGstOnParts'] =
      totalpartiGst == 0
        ? (totalpartSGst + totalpartCGst).toFixed(2)
        : totalpartiGst.toFixed(2);

    let roundtotalPartsAmount = Math.round(totapartAmount);
    resObj['partAmtRound'] = roundtotalPartsAmount.toFixed(2);
    resObj['partRound'] = (roundtotalPartsAmount - totapartAmount).toFixed(2);
    resObj['totalPartsAmountWords'] = numberToWords.toWords(
      roundtotalPartsAmount
    );

    resObj['totalLaborPartsAmount'] = (totapartAmount + totalabAmount).toFixed(
      2
    );
    resObj['totalLaborPartsAmountRnd'] = Math.round(
      totapartAmount + totalabAmount
    ).toFixed(2);
    resObj['totalLaborPartsAmountWords'] = numberToWords
      .toWords(Math.round(totapartAmount + totalabAmount))
      .toUpperCase();
    resObj['document_type'] = data.document_type;
    resObj['parts'] = parts;
    resObj['creditDebit'] = creditDebit;

    resObj['creditNotesUpdateMap'] = data.creditNotesUpdateMap.map((item) => ({
      ...item,
      invoice_bdoack_date: item.invoice_bdoack_date
        ? item.invoice_bdoack_date.toISOString()
        : '',
      irn_no: item.irn_no,
      signed_qr_code: item.signed_qr_code,
    }));
    if (resObj['creditNotesUpdateMap']?.length > 0) {
      resObj['hasDBO'] = true;
    }

    return resObj;
  } catch (err) {
    console.log(err);
    logger.error('CreditNotes service creditDebitNotesPdf', err);
  }
};

const getCreditDebitData = async (reqData, user) => {
  let resultArray = [];
  try {
    const data = await cndDAO.getCreditDebitDataNew(reqData, user);
    let index = 1;
    for (const item of data) {
      const invoiceDate = item.jobCard.billing?.dataValues?.createdAt
        ? moment(item.jobCard.billing?.dataValues?.createdAt)
            .tz('Asia/Kolkata')
            .format('DD-MM-YYYY HH:mm:ss')
        : '';
      let firstName = item?.customers.dataValues?.decryptedFirstName;
      let lastName = item?.customers.dataValues?.decryptedLastName
        ? item?.customers.dataValues?.decryptedLastName
        : '';

      if (item?.dataValues?.purpose === 'SaleReturn') {
        for (const saleReturnItem of item?.creditNotesDetails) {
          resultArray.push({
            autoId: index++,
            cn_id: item?.dataValues?.id,
            outlet_id: item?.dataValues?.outlet_id ?? '',
            outlet_code: item?.outlet?.outletCode,
            transaction_id: item?.dataValues?.transaction_id,
            rot_id: saleReturnItem.dataValues?.rot_id,
            schedule_id: saleReturnItem?.dataValues?.schedule_id ?? '',
            rot_code: saleReturnItem?.dataValues?.rot_code ?? '',
            rot_description: saleReturnItem?.dataValues?.rot_description ?? '',
            hsn: saleReturnItem?.dataValues?.hsn,
            quantity: saleReturnItem?.dataValues?.quantity ?? '',
            amount: saleReturnItem?.dataValues?.amount ?? '',
            discount_percentage:
              saleReturnItem?.dataValues?.discount_percentage ?? '',
            sgstPer: saleReturnItem?.dataValues?.sgst,
            cgstPer: saleReturnItem?.dataValues?.cgst,
            igstPer: saleReturnItem?.dataValues?.igst,
            depreciation_per: saleReturnItem?.dataValues?.depreciation_per,
            marginPercentage: saleReturnItem?.dataValues?.marginPercentage,
            total: saleReturnItem?.dataValues?.total,
            repairType: saleReturnItem?.dataValues?.repairType,
            created_by: item?.dataValues?.created_by,
            createdAt: item?.dataValues?.createdAt ?? '',
            // creditNotes: item.creditNotes.dataValues,
            doc_no: item?.dataValues?.doc_no,
            jc_number: item?.dataValues?.jc_number,
            reg_no: item?.dataValues?.reg_no,
            customer_code: item?.dataValues?.customer_code,
            customerName: firstName + ' ' + lastName,
            narration: '',
            doc_type: item?.dataValues?.purpose,
            // customers: item.creditNotes.customers.dataValues,
            invoiceNumber: item.jobCard.billing?.dataValues?.bill_no,
            invoiceDate: invoiceDate,
            credit: '',
            discountAmount: saleReturnItem?.dataValues?.discount_percentage,
            cgst:
              (saleReturnItem?.dataValues?.cgst *
                saleReturnItem?.dataValues?.amount) /
                100 ?? 0,
            sgst:
              (saleReturnItem?.dataValues?.sgst *
                saleReturnItem?.dataValues?.amount) /
                100 ?? 0,
            igst:
              (saleReturnItem?.dataValues?.igst *
                saleReturnItem?.dataValues?.amount) /
                100 ?? 0,
            laborAmount:
              saleReturnItem?.dataValues?.itemType === 1 ||
              saleReturnItem?.dataValues?.itemType === 2
                ? saleReturnItem?.dataValues?.total
                : '',
            partsAmount:
              saleReturnItem?.dataValues?.itemType === 3
                ? saleReturnItem?.dataValues?.total
                : '',
            others: 0,
            costOfSales:
              saleReturnItem?.dataValues?.itemType === 3
                ? saleReturnItem?.dataValues?.total
                : '-',
            source: item.jobCard.sources?.dataValues?.sourceName,
            sourceType: item.jobCard.sourcetype?.dataValues?.sourceTypeName,
            transactions: item.jobCard?.dataValues,
          });
        }
      } else {
        resultArray.push({
          autoId: index++,
          cn_id: item?.dataValues?.id,
          outlet_id: item?.dataValues?.outlet_id ?? '',
          outlet_code: item?.outlet?.outletCode,
          transaction_id: item?.dataValues?.transaction_id,
          rot_id: '',
          schedule_id: '',
          rot_code: '',
          rot_description: '',
          hsn: '',
          quantity: '',
          amount: '',
          discount_percentage: '',
          sgst: '',
          cgst: '',
          igst: '',
          depreciation_per: '',
          marginPercentage: '',
          total: '',
          repairType: '',
          created_by: item?.dataValues?.created_by,
          createdAt: item?.dataValues?.createdAt ?? '',
          // creditNotes: item.creditNotes.dataValues,
          doc_no: item?.dataValues?.doc_no,
          jc_number: item?.dataValues?.jc_number,
          reg_no: item?.dataValues?.reg_no,
          customer_code: item?.dataValues?.customer_code,
          customerName: firstName + ' ' + lastName,
          narration: '',
          doc_type: item?.dataValues?.purpose,
          // customers: item.creditNotes.customers.dataValues,
          invoiceNumber: item.jobCard.billing?.dataValues?.bill_no,
          invoiceDate: invoiceDate,
          credit: '',
          discountAmount: '',
          cgst: 0,
          sgst: 0,
          igst: 0,
          laborAmount: '',
          partsAmount: '',
          others: 0,
          costOfSales: '-',
          source: item.jobCard.sources?.dataValues?.sourceName,
          sourceType: item.jobCard.sourcetype?.dataValues?.sourceTypeName,
          transactions: item.jobCard?.dataValues,
        });
      }
    }

    let count = resultArray.length;
    if (reqData.offset && reqData.offset > 0) {
      resultArray = resultArray.slice(reqData.offset);
    }

    if (reqData.limit && resultArray.length > reqData.limit) {
      resultArray = resultArray.slice(0, reqData.limit);
    }

    return {
      data: resultArray,
      totalItems: count,
    };
  } catch (err) {
    logger.error('Credit Notes Details service getCreditDebitData', err);
    next(err);
  }
};

const listLbsInsurance = async (reqData) => {
  try {
    const { searchKey } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { insCode: { [Op.like]: `%${searchKey}%` } },
            { insName: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
    const data = await LbsInsCode.findAll({
      where: searchCondition,

      order: [['id', 'DESC']],
      attributes: ['id', 'insCode', 'insName'],
    });
    return data;
  } catch (err) {
    logger.error('ItemGroupDao listItemGroup():', err);
    throw err;
  }
};

const generateDocNumber = async (documentType, outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  } else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentOutPass = await cndDAO.getRecentDocNumber(
    documentType,
    outletCode,
    currentYear
  );
  if (recentOutPass) {
    const lastNumber = recentOutPass.doc_no.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(4, '0');

  return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};
const addLbsDebitNotes = async (creditNotes, user) => {
  let result = '';
  let recentActivityData = {};
  let data = null;
  try {
    console.log(creditNotes, 'creditnotes');
    let docNumber = await generateDocNumber('LBS', creditNotes.outlet_code);
    data = await cndDAO.addLbsDebitNotes(docNumber, creditNotes, user);

    // console.log('D:dms_node_user_backendsrcmodulescdNotesservice.js -----',data)
    if (data) {
      (recentActivityData['activity_type'] = 'Create'),
        (recentActivityData['menu_name'] = 'Lbs Debit Notes'),
        (recentActivityData['createdBy'] = user.id),
        (recentActivityData['username'] = user.employeeCode),
        (recentActivityData['message'] = 'Created');
      const recent =
        await RecentAcivityService.addTransactionRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('CreditNotes service addCreditNotes', err);
  }

  return result;
};

const listLbsDebitNotes = async (reqData, user) => {
  try {
    const data = await cndDAO.listLbsDebitNotes(reqData, user);
    console.log(data, 'data');
    for (const item of data.data) {
      let firstName = item.lbsCustomerMapping.dataValues.decryptedFirstName;
      let lastName = item.lbsCustomerMapping.dataValues.decryptedLastName
        ? item.lbsCustomerMapping.dataValues.decryptedLastName
        : '';

      item.dataValues['customer_name'] = firstName + ' ' + lastName;

      delete item.lbsCustomerMapping;
      delete item.dataValues.lbsCustomerMapping;
    }

    return data;
  } catch (err) {
    logger.error('Lbs Debit Notes listLbsDebitNotes:', err);
    next(err);
  }
};
const updateLbsDebitNotesStatus = async (id, user) => {
  let result = '';
  try {
    await LbsDebitNote.update(
      { status: 2, modifiedBy: user.id },
      { where: { id: id } }
    );
    result = 'success';
  } catch (err) {
    logger.error('Lbs Debit Notes status update error', err);
    result = 'failed';
  }
  return result;
};
const cndService = {
  addCreditNotesDetails,
  creditDebitNotesPdf,
  getCreditDebitData,
  listLbsInsurance,
  addLbsDebitNotes,
  listLbsDebitNotes,
  oldDmscreditDebitNotesPdf,
  addOldDmsCreditNotesDetails,
  updateLbsDebitNotesStatus,
};

export default cndService;
