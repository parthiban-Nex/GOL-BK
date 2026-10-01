// import db from '../modules/index.js';
// const CommonLogs = db.commonlogs;
import numberToWords from 'number-to-words';
import encryptConfig from '../config/encrypt.js';
import crypto from 'crypto';

function isValidPincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

function getPagenationQuery(query) {
  let pageNumber = parseInt(query.pageNumber) || 0;
  let Offset = parseInt(query.pageSize) || 12;

  if (pageNumber == 0) {
    query.offset = 0;
    query.limit = Offset;
    return query;
  }
  query.offset = pageNumber * Offset - Offset;
  query.limit = Offset;
  return query;
}

// function createCommonLog(req, res) {
//     let requireJson = {
//         response: res.body,
//         request: req.body,
//         method: req.method,
//         header: req.headers,
//         url: req.originalUrl,
//         action: res.action,
//         createdBy: req.user.id || null
//     };
//     return CommonLogs.create(requireJson);
// }

const getCurrentMonthTableName = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `auditlog_${month}_${year}`;
};

const getPreviousMonthTableName = () => {
  const date = new Date();
  let month = `${date.getMonth()}`.padStart(2, '0');
  let year = date.getFullYear();
  if (date.getMonth() === 0) {
    month = '12'
    year = year - 1;
  }
  return `auditlog_${month}_${year}`;
}

const get2ndPreviousMonthTableName = () => {
  const date = new Date();
  let month = `${date.getMonth() - 1}`.padStart(2, '0');
  let year = date.getFullYear();
  if (date.getMonth() === 0) {
    month = '11'
    year = year - 1;
  }
  else if (date.getMonth() === 1) {
    month = '12'
    year = year - 1;
  }
  return `auditlog_${month}_${year}`;
}

const calculateTotalInvoiceAmount = (item) => {
  const totalTaxableAmount = (item.rate * item.quantity) - item.discount;
  const cgstAmount = (totalTaxableAmount * item.cgst) / 100;
  const sgstAmount = (totalTaxableAmount * item.sgst) / 100;
  const igstAmount = (totalTaxableAmount * item.igst) / 100;
  return totalTaxableAmount + cgstAmount + sgstAmount + igstAmount;
};

const calcSchedules = ( labors, docType = "RJC" ) => {
  const resObj = {};
  const finalLabor = [];
  if (Array.isArray(labors)){

    let sno = 1;
    
    let totallabQty = 0;
    let totallabDiscount = 0;
    let totallabSGst = 0;
    let totallabCGst = 0;
    let totallabiGst = 0;
    let totalabAmount = 0;
    let totallabbeforetax = 0;

    let totalInsuranceLabQty = 0;
    let totalInsuranceLabDiscount = 0;
    let totalInsuranceLabSGst = 0;
    let totalInsuranceLabCGst = 0;
    let totalInsuranceLabiGst = 0;
    let totalInsuranceLabAmount = 0;
    let totalInsuranceLabbeforetax = 0;

    let totalCustomerLabQty = 0;
    let totalCustomerLabDiscount = 0;
    let totalCustomerLabSGst = 0;
    let totalCustomerLabCGst = 0;
    let totalCustomerLabiGst = 0;
    let totalCustomerLabAmount = 0;
    let totalCustomerLabbeforetax = 0;

    for (const labor of labors){
      const laborObj = {};
      let baseAmount = 0;
      let baseInsuranceAmount = 0;
      let baseCustomerAmount = 0;

      let igstAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;

      let igstInsuranceAmount = 0;
      let cgstInsuranceAmount = 0;
      let sgstInsuranceAmount = 0;

      let igstCustomerAmount = 0;
      let cgstCustomerAmount = 0;
      let sgstCustomerAmount = 0;

      if (docType === "AJC") {

        let customerDiscount = labor.discount_percentage * labor.depreciation_per/100;
        let insuranceDiscount = labor.discount_percentage *(1 - labor.depreciation_per/100);

        let customerMargin = labor.additionalMargin * labor.depreciation_per/100;
        let insuranceMargin = labor.additionalMargin *(1 - labor.depreciation_per/100);

        baseInsuranceAmount = parseFloat(( labor.insurance_amount - insuranceDiscount + insuranceMargin).toFixed(2));
        igstInsuranceAmount = parseFloat(((labor.igst / 100) * baseInsuranceAmount).toFixed(2));
        cgstInsuranceAmount = parseFloat(((labor.cgst / 100) * baseInsuranceAmount).toFixed(2));
        sgstInsuranceAmount = parseFloat(((labor.sgst / 100) * baseInsuranceAmount).toFixed(2));

        laborObj['cgstInsuranceAmount'] = cgstInsuranceAmount.toFixed(2);
        laborObj['sgstInsuranceAmount'] = sgstInsuranceAmount.toFixed(2);
        laborObj['igstInsuranceAmount'] = igstInsuranceAmount.toFixed(2);
        const totalGstInsurance = igstInsuranceAmount == 0 ? cgstInsuranceAmount + sgstInsuranceAmount : igstInsuranceAmount;
        laborObj['totalInsuranceamtwithTx'] = (baseInsuranceAmount + totalGstInsurance).toFixed(2);
        laborObj['totalInsuranceamt'] = baseInsuranceAmount.toFixed(2);
        laborObj['totalInsuranceAmtrate'] = parseFloat(labor.amount - ((labor.depreciation_per / 100) * labor.amount).toFixed(2));

        totalInsuranceLabbeforetax += (baseInsuranceAmount);
        totalInsuranceLabQty = totalInsuranceLabQty + labor.quantity;
        totalInsuranceLabDiscount = totalInsuranceLabDiscount + insuranceDiscount;
        totalInsuranceLabSGst = totalInsuranceLabSGst + sgstInsuranceAmount;
        totalInsuranceLabCGst = totalInsuranceLabCGst + cgstInsuranceAmount;
        totalInsuranceLabiGst = totalInsuranceLabiGst + igstInsuranceAmount;
        totalInsuranceLabAmount = totalInsuranceLabAmount + baseInsuranceAmount;

        baseCustomerAmount = parseFloat(( labor.customer_amount - customerDiscount + customerMargin).toFixed(2));
        igstCustomerAmount = parseFloat(((labor.igst / 100) * baseCustomerAmount).toFixed(2));
        cgstCustomerAmount = parseFloat(((labor.cgst / 100) * baseCustomerAmount).toFixed(2));
        sgstCustomerAmount = parseFloat(((labor.sgst / 100) * baseCustomerAmount).toFixed(2));

        laborObj['cgstCustomerAmount'] = labor.repairTypeId==2 ? 0 : cgstCustomerAmount.toFixed(2);
        laborObj['sgstCustomerAmount'] = labor.repairTypeId==2 ? 0 : sgstCustomerAmount.toFixed(2);
        laborObj['igstCustomerAmount'] = labor.repairTypeId==2 ? 0 : igstCustomerAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount - customerDiscount).toFixed(2);
        const totalGst = igstCustomerAmount == 0 ? cgstCustomerAmount + sgstCustomerAmount : igstCustomerAmount;
        laborObj['totalCustomeramt'] = (baseCustomerAmount).toFixed(2);
        laborObj['totalCustomeramtwithTx'] = (baseCustomerAmount + totalGst).toFixed(2);
        laborObj['totalCustomeramrate'] = parseFloat(((labor.depreciation_per / 100) * labor.amount).toFixed(2));

        totalCustomerLabbeforetax += (baseCustomerAmount);
        totalCustomerLabQty = totalCustomerLabQty + labor.quantity;
        totalCustomerLabDiscount = totalCustomerLabDiscount + customerDiscount;
        totalCustomerLabSGst = totalCustomerLabSGst + sgstCustomerAmount;
        totalCustomerLabCGst = totalCustomerLabCGst + cgstCustomerAmount;
        totalCustomerLabiGst = totalCustomerLabiGst + igstCustomerAmount;
        totalCustomerLabAmount = totalCustomerLabAmount + baseCustomerAmount;

      } else {

        baseAmount = parseFloat(( labor.amount - labor.discount_percentage + labor.additionalMargin).toFixed(2));
        igstAmount = parseFloat(((labor.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((labor.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((labor.sgst / 100) * baseAmount).toFixed(2));
        let tax = igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount;
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount).toFixed(2);
        laborObj['totalamtBeforeTax'] = ( baseAmount ).toFixed(2);

        totallabbeforetax += labor.repairTypeId==2 ? 0 : baseAmount;
        totallabDiscount = totallabDiscount + labor.discount_percentage;
        totallabSGst = labor.repairTypeId==2 ? totallabSGst : totallabSGst + sgstAmount;
        totallabCGst = labor.repairTypeId==2 ? totallabCGst : totallabCGst + cgstAmount;
        totallabiGst = labor.repairTypeId==2 ? totallabiGst : totallabiGst + igstAmount;
        totalabAmount = totalabAmount + labor.laborTotal;

      }

      let newBaseAmount = (labor.quantity * labor.amount - labor.discount_percentage + labor.additionalMargin).toFixed(2);
      baseAmount = parseFloat((labor.quantity * labor.amount - labor.discount_percentage + labor.additionalMargin).toFixed(2));
      igstAmount = parseFloat(((labor.igst / 100) * baseAmount).toFixed(2));
      cgstAmount = parseFloat(((labor.cgst / 100) * baseAmount).toFixed(2));
      sgstAmount = parseFloat(((labor.sgst / 100) * baseAmount).toFixed(2));
      laborObj['cgstamt'] = labor.repairTypeId==2 ? 0 : cgstAmount.toFixed(2);
      laborObj['sgstamt'] = labor.repairTypeId==2 ? 0 : sgstAmount.toFixed(2);
      laborObj['igstamt'] = labor.repairTypeId==2 ? 0 : igstAmount.toFixed(2);
      laborObj['sno'] = sno++;
      laborObj['rot_id'] = labor.rot_id;
      laborObj['repairTypeName'] = labor.repairTypeName;
      laborObj['rot_code'] = labor.rot_code;
      laborObj['description'] = labor.description;
      laborObj['quantity'] = labor.quantity.toFixed(2);
      laborObj['rate'] = labor.amount.toFixed(2);
      laborObj['rateWithdisc'] = (labor.amount + (labor.additionalMargin - labor.discount_percentage)/labor.quantity).toFixed(2)
      laborObj['totalval'] = newBaseAmount;
      laborObj['totalTax'] = igstAmount > 0 ? igstAmount.toFixed(2) : (cgstAmount + sgstAmount).toFixed(2)
      laborObj['additionalMargin'] = labor.additionalMargin.toFixed(2);
      laborObj['discount'] = labor.discount_percentage.toFixed(2);
      laborObj['cgst'] = labor.cgst;
      laborObj['sgst'] = labor.sgst;
      laborObj['igst'] = labor.igst;
      laborObj['hsn'] = labor?.labourschedules?.sacCode;
      laborObj['totalamt'] = labor.repairTypeId==2 ? labor.amount.toFixed(2) : labor.laborTotal.toFixed(2);
      totallabQty = totallabQty + labor.quantity;
      laborObj["repairType"] = labor.repairTypeName;
      finalLabor.push(laborObj);
    }

    if( docType === "AJC" ) {

      resObj['totalInsureanceLaborDiscount'] = totalInsuranceLabDiscount.toFixed(2);
      resObj['totalInsureanceLaborSGst'] = totalInsuranceLabSGst.toFixed(2);
      resObj['totalInsureanceLaborCGst'] = totalInsuranceLabCGst.toFixed(2);
      resObj['totalInsureanceLaborIGst'] = totalInsuranceLabiGst.toFixed(2);
      
      const totalInsureanceGstOnLabor = totalInsuranceLabiGst == 0 ? (totalInsuranceLabSGst + totalInsuranceLabCGst).toFixed(2) : totalInsuranceLabiGst.toFixed(2);
      resObj['totalInsureanceLaborAmount'] = (parseFloat(totalInsuranceLabAmount)+parseFloat(totalInsureanceGstOnLabor)).toFixed(2);
      resObj['totalInsureanceGstOnLabor'] = totalInsureanceGstOnLabor;
      resObj['labInsuranceBeforeTaxAmt'] = totalInsuranceLabbeforetax.toFixed(2);
      let roundtotalInsuranceLabAmount = Math.round(totalInsuranceLabAmount+parseFloat(totalInsureanceGstOnLabor));
      resObj['labInsuranceAmtRound'] = roundtotalInsuranceLabAmount.toFixed(2);
      resObj['labInsuranceRound'] = (totalInsuranceLabDiscount - roundtotalInsuranceLabAmount).toFixed(2);
      resObj['totalLabInsuranceAmountWords'] = numberToWords.toWords(roundtotalInsuranceLabAmount);
  
  
      resObj['totalCustomerLaborDiscount'] = totalCustomerLabDiscount.toFixed(2);
      resObj['totalCustomerLaborSGst'] = totalCustomerLabSGst.toFixed(2);
      resObj['totalCustomerLaborCGst'] = totalCustomerLabCGst.toFixed(2);
      resObj['totalCustomerLaborIGst'] = totalCustomerLabiGst.toFixed(2);
      const totalCustomerGstOnLabor=  totalCustomerLabiGst == 0 ? (totalCustomerLabSGst + totalCustomerLabCGst).toFixed(2) : totalCustomerLabiGst.toFixed(2);
      resObj['totalCustomerLaborAmount'] =  (parseFloat(totalCustomerLabAmount) +  parseFloat(totalCustomerGstOnLabor)).toFixed(2);
      resObj['totalCustomerGstOnLabor'] = totalCustomerGstOnLabor
      resObj['labCustomerBeforeTaxAmt'] = totalCustomerLabbeforetax.toFixed(2);
      let roundtotalCustomerLabAmount = Math.round(totalCustomerLabAmount + parseFloat(totalCustomerGstOnLabor));
      resObj['labCustomerAmtRound'] = roundtotalCustomerLabAmount.toFixed(2);
      resObj['labCustomerRound'] = (totalCustomerLabDiscount - roundtotalCustomerLabAmount).toFixed(2);
      resObj['totalLabCustomerAmountWords'] = numberToWords.toWords(roundtotalCustomerLabAmount);
  
      resObj['totalRoundLabAmountAJC'] = Math.round(parseFloat(totalInsuranceLabAmount)+parseFloat(totalInsureanceGstOnLabor) + parseFloat(totalCustomerLabAmount) +  parseFloat(totalCustomerGstOnLabor)).toFixed(2);

    } else {
      resObj['totalLaborDiscount'] = totallabDiscount.toFixed(2);
      resObj['totalLaborSGst'] = totallabSGst.toFixed(2);
      resObj['totalLaborCGst'] = totallabCGst.toFixed(2);
      resObj['totalLaborIGst'] = totallabiGst.toFixed(2);
      //totalabAmount = totalabAmount + (totallabiGst == 0 ? (totallabSGst + totallabCGst) : totallabiGst);
      resObj['totalLaborAmount'] = totalabAmount.toFixed(2);
      resObj['totalGstOnLabor'] = totallabiGst == 0 ? (totallabSGst + totallabCGst).toFixed(2) : totallabiGst.toFixed(2);
      resObj['labBeforeTaxAmt'] = totallabbeforetax.toFixed(2);
      let roundtotalLabAmount = Math.round(resObj['totalLaborAmount']);
      resObj['labAmtRound'] = roundtotalLabAmount.toFixed(2);
      resObj['labRound'] = (roundtotalLabAmount - resObj['totalLaborAmount']).toFixed(2);
      resObj['totalLabAmountWords'] = numberToWords.toWords(roundtotalLabAmount);
    }

    resObj['labour'] = finalLabor;
  }
  return resObj;
}

const calcOslSchedules = ( labors, docType = "RJC" ) => {
  const resObj = {};
  const finalLabor = [];
  if (Array.isArray(labors)){

    let sno = 1;

    let totallabQty = 0;
    let totallabDiscount = 0;
    let totallabSGst = 0;
    let totallabCGst = 0;
    let totallabiGst = 0;
    let totalabAmount = 0;
    let totallabbeforetax = 0;

    let totalInsuranceLabQty = 0;
    let totalInsuranceLabDiscount = 0;
    let totalInsuranceLabSGst = 0;
    let totalInsuranceLabCGst = 0;
    let totalInsuranceLabiGst = 0;
    let totalInsuranceLabAmount = 0;
    let totalInsuranceLabbeforetax = 0;

    let totalCustomerLabQty = 0;
    let totalCustomerLabDiscount = 0;
    let totalCustomerLabSGst = 0;
    let totalCustomerLabCGst = 0;
    let totalCustomerLabiGst = 0;
    let totalCustomerLabAmount = 0;
    let totalCustomerLabbeforetax = 0;

    for (const labor of labors){
      const laborObj = {};
      let baseAmount = 0;
      let baseInsuranceAmount = 0;
      let baseCustomerAmount = 0;

      let igstAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;

      let igstInsuranceAmount = 0;
      let cgstInsuranceAmount = 0;
      let sgstInsuranceAmount = 0;

      let igstCustomerAmount = 0;
      let cgstCustomerAmount = 0;
      let sgstCustomerAmount = 0;

      let margin = labor.marginPercentage/100;

      if (docType === "AJC") {

        let customerDiscount = labor.discount_percentage * labor.depreciation_per/100;
        let insuranceDiscount = labor.discount_percentage *(1 - labor.depreciation_per/100);

        let customerMargin = labor.additionalMargin * labor.depreciation_per/100;
        let insuranceMargin = labor.additionalMargin *(1 - labor.depreciation_per/100);

        baseInsuranceAmount = parseFloat(((labor.quantity * labor.insurance_amount - insuranceDiscount)/(1 - margin) + insuranceMargin).toFixed(2));
        igstInsuranceAmount = parseFloat(((labor.igst / 100) * baseInsuranceAmount).toFixed(2));
        cgstInsuranceAmount = parseFloat(((labor.cgst / 100) * baseInsuranceAmount).toFixed(2));
        sgstInsuranceAmount = parseFloat(((labor.sgst / 100) * baseInsuranceAmount).toFixed(2));

        laborObj['cgstInsuranceAmount'] = cgstInsuranceAmount.toFixed(2);
        laborObj['sgstInsuranceAmount'] = sgstInsuranceAmount.toFixed(2);
        laborObj['igstInsuranceAmount'] = igstInsuranceAmount.toFixed(2);
        //laborObj['valdisc'] = (baseInsuranceAmount - labor.discount_percentage).toFixed(2);
        const totalGstInsurance = igstInsuranceAmount == 0 ? cgstInsuranceAmount + sgstInsuranceAmount : igstInsuranceAmount;
        laborObj['totalInsuranceamtwithTx'] = (baseInsuranceAmount + totalGstInsurance).toFixed(2);
        laborObj['totalInsuranceamt'] = baseInsuranceAmount.toFixed(2);
        laborObj['totalInsuranceAmtrate'] = parseFloat(labor.amount - ((labor.depreciation_per / 100) * labor.amount).toFixed(2));

        totalInsuranceLabbeforetax += (baseInsuranceAmount);
        totalInsuranceLabQty = totalInsuranceLabQty + labor.quantity;
        totalInsuranceLabDiscount = totalInsuranceLabDiscount + insuranceDiscount;
        totalInsuranceLabSGst = totalInsuranceLabSGst + sgstInsuranceAmount;
        totalInsuranceLabCGst = totalInsuranceLabCGst + cgstInsuranceAmount;
        totalInsuranceLabiGst = totalInsuranceLabiGst + igstInsuranceAmount;
        totalInsuranceLabAmount = totalInsuranceLabAmount + baseInsuranceAmount;


        baseCustomerAmount = parseFloat(((labor.quantity * labor.customer_amount - customerDiscount)/(1 - margin) + customerMargin).toFixed(2));
        igstCustomerAmount = parseFloat(((labor.igst / 100) * baseCustomerAmount).toFixed(2));
        cgstCustomerAmount = parseFloat(((labor.cgst / 100) * baseCustomerAmount).toFixed(2));
        sgstCustomerAmount = parseFloat(((labor.sgst / 100) * baseCustomerAmount).toFixed(2));

        laborObj['cgstCustomerAmount'] = cgstCustomerAmount.toFixed(2);
        laborObj['sgstCustomerAmount'] = sgstCustomerAmount.toFixed(2);
        laborObj['igstCustomerAmount'] = igstCustomerAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount - labor.discount_percentage).toFixed(2);
        const totalGst = igstCustomerAmount == 0 ? cgstCustomerAmount + sgstCustomerAmount : igstCustomerAmount;
        laborObj['totalCustomeramt'] = (baseCustomerAmount).toFixed(2);
        laborObj['totalCustomeramtwithTx'] = (baseCustomerAmount + totalGst).toFixed(2);
        laborObj['totalCustomeramrate'] = parseFloat(((labor.depreciation_per / 100) * labor.amount).toFixed(2));

        totalCustomerLabbeforetax += (baseCustomerAmount);
        totalCustomerLabQty = totalCustomerLabQty + labor.quantity;
        totalCustomerLabDiscount = totalCustomerLabDiscount + customerDiscount;
        totalCustomerLabSGst = totalCustomerLabSGst + sgstCustomerAmount;
        totalCustomerLabCGst = totalCustomerLabCGst + cgstCustomerAmount;
        totalCustomerLabiGst = totalCustomerLabiGst + igstCustomerAmount;
        totalCustomerLabAmount = totalCustomerLabAmount + baseCustomerAmount;

      } else {

        baseAmount = parseFloat(((labor.quantity * labor.amount - labor.discount_percentage)/(1-margin) + labor.additionalMargin ).toFixed(2));
        igstAmount = parseFloat(((labor.igst / 100) * baseAmount).toFixed(2));
        cgstAmount = parseFloat(((labor.cgst / 100) * baseAmount).toFixed(2));
        sgstAmount = parseFloat(((labor.sgst / 100) * baseAmount).toFixed(2));
        let tax = igstAmount > 0 ? igstAmount : sgstAmount + cgstAmount;
        laborObj['cgstamt'] = cgstAmount.toFixed(2);
        laborObj['sgstamt'] = sgstAmount.toFixed(2);
        laborObj['igstamt'] = igstAmount.toFixed(2);
        laborObj['valdisc'] = (baseAmount).toFixed(2);
        laborObj['totalamtBeforeTax'] = (baseAmount).toFixed(2);
        laborObj['totalamt'] = (baseAmount + tax).toFixed(2);
        totallabbeforetax += (baseAmount);
        //totallabQty = totallabQty + labor.quantity;
        totallabDiscount = totallabDiscount + labor.discount_percentage;
        totallabSGst = totallabSGst + sgstAmount;
        totallabCGst = totallabCGst + cgstAmount;
        totallabiGst = totallabiGst + igstAmount;
        totalabAmount = totalabAmount + baseAmount + tax;

      }

      let newBaseAmount = ((labor.quantity * labor.amount - labor.discount_percentage)/(1-margin) + labor.additionalMargin ).toFixed(2);
      baseAmount = parseFloat(((labor.quantity * labor.amount - labor.discount_percentage)/(1-margin) + labor.additionalMargin ).toFixed(2));
      igstAmount = parseFloat(((labor.igst / 100) * baseAmount).toFixed(2));
      cgstAmount = parseFloat(((labor.cgst / 100) * baseAmount).toFixed(2));
      sgstAmount = parseFloat(((labor.sgst / 100) * baseAmount).toFixed(2));
      let tax = igstAmount > 0 ? igstAmount : sgstAmount + cgstAmount;
      laborObj['cgstamt'] = cgstAmount.toFixed(2);
      laborObj['sgstamt'] = sgstAmount.toFixed(2);
      laborObj['igstamt'] = igstAmount.toFixed(2);
      laborObj['totalTax'] = igstAmount > 0 ? igstAmount.toFixed(2) : (sgstAmount + cgstAmount).toFixed(2);
      laborObj['totalamt'] = (baseAmount + tax).toFixed(2);
      laborObj['sno'] = sno++;
      laborObj['rot_id'] = labor.rot_id;
      laborObj['rot_code'] = labor.rot_code;
      laborObj['description'] = labor.description;
      laborObj['quantity'] = labor.quantity.toFixed(2);
      laborObj['rate'] = labor.amount.toFixed(2);
      laborObj['additionalMargin'] = labor.additionalMargin.toFixed(2);
      laborObj['marginPercentage'] = labor.marginPercentage;
      laborObj['totalval'] = newBaseAmount;
      laborObj['rateWithdisc'] = (labor.amount + (labor.additionalMargin - labor.discount_percentage)/labor.quantity).toFixed(2);
      laborObj['discount'] = labor.discount_percentage.toFixed(2);
      laborObj['cgst'] = labor.cgst;
      laborObj['sgst'] = labor.sgst;
      laborObj['igst'] = labor.igst;
      laborObj['hsn'] = labor?.labourschedules?.sacCode;
      totallabQty = totallabQty + labor.quantity;

      finalLabor.push(laborObj);
    }

    if( docType === "AJC" ) {

      resObj['totalInsureanceLaborDiscount'] = totalInsuranceLabDiscount.toFixed(2);
      resObj['totalInsureanceLaborSGst'] = totalInsuranceLabSGst.toFixed(2);
      resObj['totalInsureanceLaborCGst'] = totalInsuranceLabCGst.toFixed(2);
      resObj['totalInsureanceLaborIGst'] = totalInsuranceLabiGst.toFixed(2);
      
      const totalInsureanceGstOnLabor = totalInsuranceLabiGst == 0 ? (totalInsuranceLabSGst + totalInsuranceLabCGst).toFixed(2) : totalInsuranceLabiGst.toFixed(2);
      resObj['totalInsureanceLaborAmount'] = (parseFloat(totalInsuranceLabAmount)+parseFloat(totalInsureanceGstOnLabor)).toFixed(2);
      resObj['totalInsureanceGstOnLabor'] = totalInsureanceGstOnLabor;
      resObj['labInsuranceBeforeTaxAmt'] = totalInsuranceLabbeforetax.toFixed(2);
      let roundtotalInsuranceLabAmount = Math.round(totalInsuranceLabAmount+parseFloat(totalInsureanceGstOnLabor));
      resObj['labInsuranceAmtRound'] = roundtotalInsuranceLabAmount.toFixed(2);
      resObj['labInsuranceRound'] = (totalInsuranceLabDiscount - roundtotalInsuranceLabAmount).toFixed(2);
      resObj['totalLabInsuranceAmountWords'] = numberToWords.toWords(roundtotalInsuranceLabAmount);
  
  
      resObj['totalCustomerLaborDiscount'] = totalCustomerLabDiscount.toFixed(2);
      resObj['totalCustomerLaborSGst'] = totalCustomerLabSGst.toFixed(2);
      resObj['totalCustomerLaborCGst'] = totalCustomerLabCGst.toFixed(2);
      resObj['totalCustomerLaborIGst'] = totalCustomerLabiGst.toFixed(2);
      const totalCustomerGstOnLabor=  totalCustomerLabiGst == 0 ? (totalCustomerLabSGst + totalCustomerLabCGst).toFixed(2) : totalCustomerLabiGst.toFixed(2);
      resObj['totalCustomerLaborAmount'] =  (parseFloat(totalCustomerLabAmount) +  parseFloat(totalCustomerGstOnLabor)).toFixed(2);
      resObj['totalCustomerGstOnLabor'] = totalCustomerGstOnLabor
      resObj['labCustomerBeforeTaxAmt'] = totalCustomerLabbeforetax.toFixed(2);
      let roundtotalCustomerLabAmount = Math.round(totalCustomerLabAmount + parseFloat(totalCustomerGstOnLabor));
      resObj['labCustomerAmtRound'] = roundtotalCustomerLabAmount.toFixed(2);
      resObj['labCustomerRound'] = (totalCustomerLabDiscount - roundtotalCustomerLabAmount).toFixed(2);
      resObj['totalLabCustomerAmountWords'] = numberToWords.toWords(roundtotalCustomerLabAmount);
  
      resObj['totalRoundLabAmountAJC'] = Math.round(parseFloat(totalInsuranceLabAmount)+parseFloat(totalInsureanceGstOnLabor) + parseFloat(totalCustomerLabAmount) +  parseFloat(totalCustomerGstOnLabor)).toFixed(2);

    } else {
      resObj['totalLaborDiscount'] = totallabDiscount.toFixed(2);
      resObj['totalLaborSGst'] = totallabSGst.toFixed(2);
      resObj['totalLaborCGst'] = totallabCGst.toFixed(2);
      resObj['totalLaborIGst'] = totallabiGst.toFixed(2);
      //totalabAmount = totalabAmount + (totallabiGst == 0 ? (totallabSGst + totallabCGst) : totallabiGst);
      resObj['totalLaborAmount'] = totalabAmount.toFixed(2);
      resObj['totalGstOnLabor'] = totallabiGst == 0 ? (totallabSGst + totallabCGst).toFixed(2) : totallabiGst.toFixed(2);
      resObj['labBeforeTaxAmt'] = totallabbeforetax.toFixed(2);
      let roundtotalLabAmount = Math.round(resObj['totalLaborAmount']);
      resObj['labAmtRound'] = roundtotalLabAmount.toFixed(2);
      resObj['labRound'] = (roundtotalLabAmount - resObj['totalLaborAmount']).toFixed(2);
      resObj['totalLabAmountWords'] = numberToWords.toWords(roundtotalLabAmount);
    }

    resObj['labour'] = finalLabor;
  }
  return resObj;
}

const calcPartsIssue = ( parts ) => {
  const resObj = {};
  const finalParts = [];
  if( Array.isArray(parts) ) {
    let totalpartQty = 0;
    let totalpartDiscount = 0;
    let totalpartSGst = 0;
    let totalpartCGst = 0;
    let totalpartiGst = 0;
    let totapartAmount = 0;
    let totalpartRate = 0;
    let psno = 0;

    for ( const itm of parts ) {
      const partObj = {};
      const baseAmount = parseFloat(
        (itm.quantity * itm.rate).toFixed(2)
      );
      const igstAmount = parseFloat(((itm.igst / 100) * baseAmount).toFixed(2));
      const cgstAmount = parseFloat(((itm.cgst / 100) * baseAmount).toFixed(2));
      const sgstAmount = parseFloat(((itm.sgst / 100) * baseAmount).toFixed(2));

      const amount = parseFloat(
        (
          baseAmount + (igstAmount > 0 ? igstAmount : cgstAmount + sgstAmount)
        ).toFixed(2)
      );

      partObj['sno'] = psno++;
      partObj['code'] = itm.item_code;
      partObj['description'] = itm.item_name;
      partObj['hsn'] = itm?.items?.hsnCode || "87081090";
      partObj['quantity'] = itm.quantity.toFixed(2);
      partObj['rate'] = itm.rate.toFixed(2);
      partObj['totalval'] = amount.toFixed(2);
      // partObj['discount']=osl.discount_percentage;
      partObj['cgst'] = itm.cgst;
      partObj['sgst'] = itm.sgst;
      partObj['igst'] = itm.igst;
      partObj['totalamt'] = amount.toFixed(2);

      partObj['cgstamt'] = cgstAmount.toFixed(2);
      partObj['sgstamt'] = sgstAmount.toFixed(2);
      partObj['igstamt'] = igstAmount.toFixed(2);

      totalpartQty = totalpartQty + itm.quantity;
      //totalpartDiscount=totalpartDiscount+osl.discount_percentage;
      totalpartSGst = itm.repair_type===2 ? totalpartSGst : totalpartSGst + sgstAmount;
      totalpartCGst = itm.repair_type===2 ? totalpartCGst : totalpartCGst + cgstAmount;
      totalpartiGst = itm.repair_type===2 ? totalpartiGst : totalpartiGst + igstAmount;
      totapartAmount = itm.repair_type===2 ? totapartAmount : totapartAmount + amount;
      totalpartRate = itm.repair_type===2 ? totalpartRate : totalpartRate + baseAmount;

      finalParts.push({...partObj, ...itm.dataValues});
    }

    resObj['totalPartsQuantity'] = totalpartQty.toFixed(2);
    //resObj['totalPartsDiscount']=totallabDiscount;
    resObj['totalPartsSGst'] = totalpartSGst.toFixed(2);
    resObj['totalPartsCGst'] = totalpartCGst.toFixed(2);
    resObj['totalPartsIGst'] = totalpartiGst.toFixed(2);
    resObj['totalPartsAmount'] = totapartAmount.toFixed(2);
    resObj['totalPartsRate'] = totalpartRate.toFixed(2);
    resObj['totalGstOnParts'] = totalpartiGst == 0 ? (totalpartSGst + totalpartCGst).toFixed(2) : totalpartiGst.toFixed(2);

    let roundtotalPartsAmount = Math.round(totapartAmount);
    resObj['partAmtRound'] = roundtotalPartsAmount.toFixed(2);
    resObj['partRound'] = (roundtotalPartsAmount - totapartAmount).toFixed(2);
    resObj['totalPartsAmountWords'] = numberToWords.toWords(roundtotalPartsAmount);

    resObj['parts'] = finalParts;

    return resObj;
  }
}

function encrypt(text) {
  if (!text) return '';
  const cipher = crypto.createCipheriv(encryptConfig.algorithm, encryptConfig.code.padEnd(16, '*'), null);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decryption function
function decrypt(text) {
  if (!text) return '';
  const decipher = crypto.createDecipheriv(encryptConfig.algorithm, encryptConfig.code.padEnd(16, '*'), null);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const commonLogic = {
  getPagenationQuery,
  isValidPincode,
  // createCommonLog,
  getCurrentMonthTableName,
  getPreviousMonthTableName,
  get2ndPreviousMonthTableName,
  calculateTotalInvoiceAmount,
  calcSchedules,
  calcOslSchedules,
  calcPartsIssue,
  encrypt,
  decrypt
};
export default commonLogic;
