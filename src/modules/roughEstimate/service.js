import logger from '../../config/logger.js';
import db from '../index.js';
import RoughEstimateDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import moment from 'moment-timezone';
import JobCardDao from './../jobCard/dao.js';
import { getRemoteToken, pushEstimateDataToRemote, createMobileApiRemoteReq } from '../../shared/mobileApiUtility.js';
import utils from '../Utils/Utils.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";
const JobCard = db.jobCard;
const User = db.users;
const Employee = db.employees;
const Outlet = db.outlets;

const createRoughEstimate = async (reqData, user) => {
  let result = 'failed';
  let recentActivityData = {};
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  try {
    const roughEstimateNo = await generateRoughEstimateNumber(
        'EST',
     user.outlet.outletCode
    );
    reqData['roughEstimateNumber'] = roughEstimateNo;
    let data = await RoughEstimateDao.createRoughEstimate(reqData, user);
    if (Object.keys(data).length > 0) {
      const labourEstimate = reqData.laborEstimate;
      const oslLabourEstimate = reqData.oslLaborEstimate;
      const partEstimate = reqData.partsEstimate;
      labourEstimate.forEach(async (labourEstimateObj) => {
        labourEstimateObj['roughEstimateId'] = data.id;
        await RoughEstimateDao.createRoughLabourEstimate(
          labourEstimateObj,
          user
        );
      });
      partEstimate.forEach(async (partEstimateObj) => {
        partEstimateObj['roughEstimateId'] = data.id;
        await RoughEstimateDao.createRoughPartsEstimate(
          partEstimateObj,
          user
        );
      });
      result = 'success';
    }
    if (Object.keys(data).length > 0) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Rough Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        'Rough Estimate created for ' + reqData.registrationNumber;
      const recent =
        RecentAcivityService.addTransactionRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    logger.error('Rough Estimate Service  createRoughEstimate()', err);
  }
  return result;
};

const generateRoughEstimateNumber = async (outletCode) => {
  let seqNo = 0;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  }
  else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const recentEstimateData =
    await RoughEstimateDao.getRecentRoughEstimate('EST', outletCode, currentYear);
  if (recentEstimateData) {
    const lastNumber = recentEstimateData.roughEstimateNumber.split('-')[2];
    seqNo = parseInt(lastNumber, 10) + 1;
  } else {
    seqNo = 1;
  }

  const formattedSequenceNumber = seqNo.toString().padStart(6, '0');

  return `EST-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const listRoughEstimate = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await RoughEstimateDao.listRoughEstimate(
      reqData,
      user
    );

    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error('Rough Estimate service listRoughEstimate', err);
    next(err);
  }
};
const updateRoughEstimate = async (roughEstimate, user) => {
    console.log(roughEstimate);
  let result = 'failed';
  let recentActivityData = {};
  const currentDate = new Date();
  const laborIdMap = new Map();
  const oslIdMap = new Map();
  const partIdMap = new Map();
  const updatedLaborList = [];
  const updatedOslRecords = [];
  const updatedPartsRecords = [];
  const year = currentDate.getFullYear();
  let message = '';

  try {
    let roughEstimateExists =
      await RoughEstimateDao.findOpenRoughEstimateByEstimateId(
        roughEstimate.id
      );
      console.log('---------------roughEstimateExists',roughEstimateExists);

    if (roughEstimateExists) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Rough Estimate';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (
        roughEstimateExists.registrationNumber !=
        roughEstimate.registrationNumber
      ) {
        message =
          message +
          ' registrationNumber changed from ' +
          roughEstimateExists.registrationNumber +
          ' to ' +
          roughEstimate.registrationNumber +
          ' ,';
      }
      if (roughEstimateExists.customerName != roughEstimate.customerName) {
        message =
          message +
          ' customerName changed from ' +
          roughEstimateExists.customerName +
          ' to ' +
          roughEstimate.customerName +
          ' ,';
      }
      if (
        roughEstimateExists.customerMobileNumber !=
        roughEstimate.customerMobileNumber
      ) {
        message =
          message +
          ' customerMobileNumber changed from ' +
          roughEstimateExists.customerMobileNumber +
          ' to ' +
          roughEstimate.customerMobileNumber +
          ' ,';
      }
      if (
        roughEstimateExists.customerAddress != roughEstimate.customerAddress
      ) {
        message =
          message +
          ' customerAddress changed from ' +
          roughEstimateExists.customerAddress +
          ' to ' +
          roughEstimate.customerAddress +
          ' ,';
      }
      if (
        roughEstimateExists.customerState != roughEstimate.customerState
      ) {
        message =
          message +
          ' customerState changed from ' +
          roughEstimateExists.customerState +
          ' to ' +
          roughEstimate.customerState +
          ' ,';
      }
      if (roughEstimateExists.customerCity != roughEstimate.customerCity) {
        message =
          message +
          ' customerCity changed from ' +
          roughEstimateExists.customerCity +
          ' to ' +
          roughEstimate.customerCity +
          ' ,';
      }
      if (
        roughEstimateExists.customerStatus != roughEstimate.customerStatus
      ) {
        message =
          message +
          ' customerStatus changed from ' +
          roughEstimateExists.customerStatus +
          ' to ' +
          roughEstimate.customerStatus +
          ' ,';
      }
      if (roughEstimateExists.pincode != roughEstimate.pincode) {
        message =
          message +
          ' pincode changed from ' +
          roughEstimateExists.pincode +
          ' to ' +
          roughEstimate.pincode +
          ' ,';
      }
      if (roughEstimateExists.serviceType != roughEstimate.serviceType) {
        message =
          message +
          ' serviceType changed from ' +
          roughEstimateExists.serviceType +
          ' to ' +
          roughEstimate.serviceType +
          ' ,';
      }

      message = message.slice(0, -1);

      let data = await RoughEstimateDao.updateRoughEstimate(
        roughEstimate,
        user
      );

      if (data) {
        const labourRoughEstimateOld = roughEstimateExists.laborRoughEstimate;
        const labourRoughEstimate = roughEstimate.laborEstimate;

        let delLabor = labourRoughEstimateOld.filter(del => !labourRoughEstimate.some(newOne => newOne.id === del.id));

        if (delLabor.length > 0) {
          for (const del of delLabor) {
            await RoughEstimateDao.deleteRoughLabourEstimate(
              del.id
            );
          }
        };

        if (labourRoughEstimate.length > 0) {
          for (const labourRoughEstimateObj of labourRoughEstimate) {
            labourRoughEstimateObj['roughEstimateId'] = roughEstimate.id;

            let updatedLaborRecord;
            if (labourRoughEstimateObj.id) {
              updatedLaborRecord = await RoughEstimateDao.updateRoughLabourEstimate(labourRoughEstimateObj, user);
            } else {
              updatedLaborRecord = await RoughEstimateDao.createRoughLabourEstimate(labourRoughEstimateObj, user);
            }

            if (updatedLaborRecord) {
              laborIdMap.set(updatedLaborRecord.id, updatedLaborRecord.id);
              updatedLaborList.push(updatedLaborRecord);
            }

          }
        }

        const partRoughEstimateOld = roughEstimateExists.partsRoughEstimate;
        const partRoughEstimate = roughEstimate.partsEstimate;

        let delParts = partRoughEstimateOld.filter(del => !partRoughEstimate.some(newOne => newOne.id === del.id));

        if (delParts.length > 0) {
          for (const del of delParts) {
            await RoughEstimateDao.deleteRoughPartsEstimate(
              del.id
            );
          }
        };


        if (partRoughEstimate.length > 0) {

          for (const partRoughEstimateObj of partRoughEstimate) {
            partRoughEstimateObj['roughEstimateId'] = roughEstimate.id;

            let lastPartsId;
            if (partRoughEstimateObj.id) {
              lastPartsId = await RoughEstimateDao.updateRoughPartsEstimate(partRoughEstimateObj, user);
            } else {
              lastPartsId = await RoughEstimateDao.createRoughPartsEstimate(partRoughEstimateObj, user);
            }

            if (lastPartsId) partIdMap.set(lastPartsId, lastPartsId);

            if (lastPartsId?.id) {
              partIdMap.set(lastPartsId.id, lastPartsId.id);
              updatedPartsRecords.push(lastPartsId);
            }
          }
        }
      }
      result = 'success';

    }
    // if (message) {
    //   recentActivityData['message'] = message;
    //   const recent =
    //     await RecentAcivityService.addTransactionRecentActivity(
    //       recentActivityData
    //     );
    // }
    result = 'success';
  } catch (err) {
    logger.error(' Rough Estimate Service  updateRoughEstimate()', err);
  }
  return result;
};

const getRoughEstimate = async (id, outlet) => {
  const resultList = [];
  const resObj = {};
  const outletObj = {};
  const customerObj = {};
  const bookingObj = {};
  const labourObj = [];
  const items = [];
  try {
    const data = await RoughEstimateDao.getRoughEstimate(id);
    console.log('service getRoughEstimate data', data);

    (outletObj['name'] = outlet.outletCode),
      (outletObj['address'] = outlet.address1),
      (outletObj['city'] = outlet.city),
      (outletObj['state'] = outlet.state),
      (outletObj['pincode'] = outlet.pincode),
      (outletObj['phone'] = outlet.phoneNumber),
      (outletObj['mobile'] = outlet.phoneNumber),
      (outletObj['email'] = outlet.email),
      (outletObj["outletName"] = outlet.outletName),
      (outletObj['dealerGstin'] = outlet.gstIn);

    const currentDate = new Date(data.createdAt);
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    (bookingObj['documentName'] = data.roughEstimateNumber),
      (bookingObj['documentDate'] = formattedDate),
      (bookingObj['branch'] = outlet.outletCode),
      (bookingObj['outletName'] = outlet.outletName),
      (bookingObj['make'] = data.make.makeName),
      (bookingObj['model'] = data.model.modelName),
      (bookingObj['regNo'] = data.registrationNumber),
      (bookingObj['kmReading'] = data.km);

    bookingObj['customerName'] = data.get('decryptedCustomerName'),
      (bookingObj['gstin'] = data.gstinNumber),
      (bookingObj['branch'] = outlet.outletCode),
      (bookingObj['address'] =
        data.customerAddress +
        ', ' +
        data.customerCity +
        ', ' +
        data.customerState +
        ', ' +
        data.customerPincode),
      (bookingObj['insuranceName'] = data.insuranceName),
      (bookingObj['chassisNo'] = data.chassisNumber);

    let sno1 = 1;
    let sno2 = 1;
    let sno3 = 1;
    let sno4 = 1;

    const removeRefit = [];
    const tinkering = [];
    const cutWelding = [];
    const painting = [];
    
    // Section totals
    let removeRefitTotal = 0;
    let tinkeringTotal = 0;
    let cutWeldingTotal = 0;
    let paintingTotal = 0;
    
    let labourTotals = {
      qty: 0,
      rate: 0,
      taxPercentage: 0,
      amount: 0,
    };

    let itemTotals = {
      qty: 0,
      rate: 0,
      taxPercentage: 0,
      amount: 0,
    };

    let itemTotalAmount = 0;
    let laborTotalAmount = 0;
    
    console.log('data.laborRoughEstimate', data.laborRoughEstimate);
    
    data.laborRoughEstimate.forEach((laborInstance) => {
      if (!laborInstance) return;

      const labor = laborInstance.dataValues;

      const outletLabour = {
        description: labor.laborDescription,
        qty: Number(labor.quantity || 0).toFixed(2),
        rate: Number(labor.rate || 0).toFixed(2),
        taxPercentage: Number(labor.tax || 0).toFixed(2),
        amount: Number(labor.laborTotal || 0).toFixed(2),
      };

      const showOrderNum = Number(labor.showOrder);
      const laborAmount = Number(labor.laborTotal || 0);

      switch (showOrderNum) {
        case 1:
          removeRefit.push({ ...outletLabour, sno: sno1++ });
          removeRefitTotal += laborAmount;
          break;
        case 2:
          tinkering.push({ ...outletLabour, sno: sno2++ });
          tinkeringTotal += laborAmount;
          break;
        case 3:
          cutWelding.push({ ...outletLabour, sno: sno3++ });
          cutWeldingTotal += laborAmount;
          break;
        case 4:
          painting.push({ ...outletLabour, sno: sno4++ });
          paintingTotal += laborAmount;
          break;
      }

      labourObj.push(outletLabour);
      labourTotals.qty += Number(labor.quantity || 0);
      labourTotals.rate += Number(labor.rate || 0);
      labourTotals.taxPercentage += Number(labor.tax || 0);
      laborTotalAmount += laborAmount;
    });
    
    let itemCount = 1;
    data.partsRoughEstimate.forEach((itmInstance) => {
      const itm = itmInstance.dataValues;
      const estimateItem = {
        description: itm.partDescription,
        qty: Number(itm.quantity || 0).toFixed(2),
        rate: Number(itm.rate || 0).toFixed(2),
        taxPercentage: Number(itm.tax || 0).toFixed(2),
        partTotal: Number(itm.partTotal || 0).toFixed(2),
        sno: itemCount++,
      };
      items.push(estimateItem);

      itemTotals.qty += Number(itm.quantity || 0);
      itemTotals.rate += Number(itm.rate || 0);
      itemTotals.amount += Number(itm.partTotal || 0);
      itemTotalAmount += Number(itm.partTotal || 0);
    });
    
    labourTotals.qty = labourTotals.qty.toFixed(2);
    labourTotals.rate = labourTotals.rate.toFixed(2);
    labourTotals.taxPercentage = labourTotals.taxPercentage.toFixed(2);
    labourTotals.amount = labourTotals.amount.toFixed(2);

    itemTotals.qty = itemTotals.qty.toFixed(2);
    itemTotals.rate = itemTotals.rate.toFixed(2);
    itemTotals.taxPercentage = itemTotals.taxPercentage.toFixed(2);
    itemTotals.amount = itemTotals.amount.toFixed(2);

    const totals = {};
    totals['labours'] = labourTotals;
    totals['items'] = itemTotals;
    totals['grandTotal'] = (itemTotalAmount + laborTotalAmount).toFixed(2);
    
    // Add section totals to totals object
    totals['removeRefitTotal'] = removeRefitTotal.toFixed(2);
    totals['tinkeringTotal'] = tinkeringTotal.toFixed(2);
    totals['cutWeldingTotal'] = cutWeldingTotal.toFixed(2);
    totals['paintingTotal'] = paintingTotal.toFixed(2);
    
    let amountInWords = numberToWords(Math.round(itemTotalAmount + laborTotalAmount));

    resObj['booking'] = bookingObj;
    resObj['branch'] = outletObj;
    resObj['customer'] = customerObj;
    resObj['removeRefit'] = removeRefit;
    resObj['tinkering'] = tinkering;
    resObj['cutWelding'] = cutWelding;
    resObj['painting'] = painting;
    resObj['items'] = items;
    resObj['totals'] = totals;
    resObj['amountInWords'] = amountInWords;
    
    console.log('service getRoughEstimate resObj', resObj);
    return resObj;
  } catch (err) {
    logger.error('Rough Estimate service getRoughEstimate', err);
    next(err);
  }
};
function numberToWords(num) {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const g = ['', 'Thousand', 'Million', 'Billion'];

  let words = '';

  function toWords(n, idx) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ' + g[idx] + ' ';
    if (n < 100)
      return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ' + g[idx] + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100, idx);
  }

  if (num === 0) return 'Zero';
  let idx = 0;
  while (num > 0) {
    let rem = num % 1000;
    if (rem > 0) words = toWords(rem, idx) + words;
    num = Math.floor(num / 1000);
    idx++;
  }
  return words.trim() + ' Rupees Only';
}
const RoughEstimateService = {
  createRoughEstimate,
  listRoughEstimate,
    updateRoughEstimate,
    getRoughEstimate,
};

export default RoughEstimateService;