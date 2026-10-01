import LabourScheduleDao from './dao.js';
import logger from '../../config/logger.js';
import RecentAcivityService from '../recentActivity/service.js';
import ServiceBookingDao from '../serviceBooking/dao.js';

const findLaborCode = async (laborCode) => {
  try {
    return await LabourScheduleDao.findLaborCode(laborCode);
  } catch (err) {
    logger.error('LaborSchedule service findLaborCode Error:', err);
    next(err);
  }
};

const addLaborSchedule = async (laborSchedule, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    const data = await LabourScheduleDao.addLaborSchedule(
      laborSchedule,
      user.id
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'LaborSchedule';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        laborSchedule.laborCode + ' LaborSchedule is created ';
      await LabourScheduleDao.addLaborCompanyMap(
        laborSchedule.companyId,
        data.id
      );
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('LaborSchedule service addLaborSchedule Error:', err);
    next(err);
  }
  return result;
};

const addLaborCompanyMap = async (companyId, laborId) => {
  try {
    return await LabourScheduleDao.addLaborCompanyMap(companyId, laborId);
  } catch (err) {
    logger.error('LaborSchedule service addLaborCompanyMap', err);
    next(err);
  }
};

const getOne = async (id) => {
  try {
    const laborSchedule = await LabourScheduleDao.getOne(id);
    return laborSchedule;
  } catch (err) {
    logger.error('LaborSchedule service getOne', err);
    next(err);
  }
};

const updateLaborSchedule = async (id, laborSchedule, user) => {
  let result = '';
  let recentActivityData = {};
  let message = '';
  try {
    const laborExists = await LabourScheduleDao.getOne(id);
    if (laborExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'LaborSchedule';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (laborExists.laborCode != laborSchedule.laborCode) {
        message =
          message +
          ' laborCode changed from ' +
          laborExists.laborCode +
          ' to ' +
          laborSchedule.laborCode +
          ' ,';
      }
      if (laborExists.laborDescription != laborSchedule.laborDescription) {
        message =
          message +
          ' laborDescription changed from ' +
          laborExists.laborDescription +
          ' to ' +
          laborSchedule.laborDescription +
          ' ,';
      }
      if (laborExists.sacCode != laborSchedule.sacCode) {
        message =
          message +
          ' sacCode changed from ' +
          laborExists.sacCode +
          ' to ' +
          laborSchedule.sacCode +
          ' ,';
      }
      if (laborExists.taxPercentage != laborSchedule.taxPercentage) {
        message =
          message +
          ' taxPercentage changed from ' +
          laborExists.taxPercentage +
          ' to ' +
          laborSchedule.taxPercentage +
          ' ,';
      }
      if (laborExists.osl != laborSchedule.osl) {
        message =
          message +
          ' osl changed from ' +
          laborExists.osl +
          ' to ' +
          laborSchedule.osl +
          ' ,';
      }
      if (laborExists.stdhrsA != laborSchedule.stdhrsA) {
        message =
          message +
          ' stdhrsA changed from ' +
          laborExists.stdhrsA +
          ' to ' +
          laborSchedule.stdhrsA +
          ' ,';
      }
      if (laborExists.stdhrsB != laborSchedule.stdhrsB) {
        message =
          message +
          ' stdhrsB changed from ' +
          laborExists.stdhrsB +
          ' to ' +
          laborSchedule.stdhrsB +
          ' ,';
      }
      if (laborExists.stdhrsC != laborSchedule.stdhrsC) {
        message =
          message +
          ' stdhrsC changed from ' +
          laborExists.stdhrsC +
          ' to ' +
          laborSchedule.stdhrsC +
          ' ,';
      }
      if (laborExists.stdhrsD != laborSchedule.stdhrsD) {
        message =
          message +
          ' stdhrsD changed from ' +
          laborExists.stdhrsD +
          ' to ' +
          laborSchedule.stdhrsD +
          ' ,';
      }
      if (laborExists.stdhrsE != laborSchedule.stdhrsE) {
        message =
          message +
          ' stdhrsE changed from ' +
          laborExists.stdhrsE +
          ' to ' +
          laborSchedule.stdhrsE +
          ' ,';
      }
      if (laborExists.citySegmentA != laborSchedule.citySegmentA) {
        message =
          message +
          ' citySegmentA changed from ' +
          laborExists.citySegmentA +
          ' to ' +
          laborSchedule.citySegmentA +
          ' ,';
      }
      if (laborExists.citySegmentB != laborSchedule.citySegmentB) {
        message =
          message +
          ' citySegmentB changed from ' +
          laborExists.citySegmentB +
          ' to ' +
          laborSchedule.citySegmentB +
          ' ,';
      }
      if (laborExists.citySegmentC != laborSchedule.citySegmentC) {
        message =
          message +
          ' citySegmentC changed from ' +
          laborExists.citySegmentC +
          ' to ' +
          laborSchedule.citySegmentC +
          ' ,';
      }
      if (laborExists.citySegmentD != laborSchedule.citySegmentD) {
        message =
          message +
          ' citySegmentD changed from ' +
          laborExists.citySegmentD +
          ' to ' +
          laborSchedule.citySegmentD +
          ' ,';
      }
      if (laborExists.status != laborSchedule.status) {
        message =
          message +
          ' status changed from ' +
          laborExists.status +
          ' to ' +
          laborSchedule.status +
          ' ,';
      }
      message = message.slice(0, -1);

      let data = await LabourScheduleDao.updateLaborSchedule(
        id,
        laborSchedule,
        user.id
      );
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        await LabourScheduleDao.removeLaborCompanyMap(id);
        await LabourScheduleDao.addLaborCompanyMap(laborSchedule.companyId, id);
        result = 'success';
      }
    }
  } catch (err) {
    result = 'failed';
    logger.error('LaborSchedule service updateLaborSchedule', err);
    next(err);
  }
  return result;
};

const removeLaborCompanyMap = async (id) => {
  try {
    return await LabourScheduleDao.removeLaborCompanyMap(id);
  } catch (err) {
    logger.error('LaborSchedule service removeLaborCompanyMap', err);
    next(err);
  }
};

const listLaborSchedule = async (reqData) => {
  const resultList = [];
  try {
    const { totalItems, data } =
      await LabourScheduleDao.listLaborSchedule(reqData);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['sacCode'] = element.sacCode;
      resObj['taxPercentage'] = element.taxPercentage;
      resObj['osl'] = element.osl;
      resObj['stdhrsA'] = element.stdhrsA;
      resObj['stdhrsB'] = element.stdhrsB;
      resObj['stdhrsC'] = element.stdhrsC;
      resObj['stdhrsD'] = element.stdhrsD;
      resObj['stdhrsE'] = element.stdhrsE;
      resObj['citySegmentA'] = element.citySegmentA;
      resObj['citySegmentB'] = element.citySegmentB;
      resObj['citySegmentC'] = element.citySegmentC;
      resObj['citySegmentD'] = element.citySegmentD;
      resObj['status'] = element.status;

      const companyMaps = element.laborcompanymap;
      let companyname = '';
      companyMaps.forEach(async (companyId) => {
        companyname = companyname + companyId.name + ',';
      });
      resObj['companies'] = companyname.slice(0, -1);
      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('LaborSchedule service listLaborSchedule', err);
    next(err);
  }
};

const getLabourDetails = async (reqData, user) => {
  // console.log('LaborSchedule service getLabourDetails reqData ',reqData);
  // console.log('LaborSchedule service getLabourDetails user ',user);
  const resultList = []; 
  try {
    const data = await LabourScheduleDao.getLabourDetails(reqData); 
    for (const element of data) { 

      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['sacCode'] = element.sacCode;
      resObj['taxPercentage'] = element.taxPercentage;

      const modelSegment = reqData.modelSegment.toUpperCase();
      const outletSegment = user.outlet.outletSegment.toUpperCase();
      // console.log('modelSegment ',modelSegment);
      // console.log('outletSegment ',outletSegment);
      // if (
      //   element[`${outletSegment}${modelSegment}`] !== undefined &&
      //   element[`${outletSegment}${modelSegment}`] !== null
      // ) {
      //   resObj['singleAmount'] =
      //     element[`${outletSegment}${modelSegment}`] ;
      // } else {
      //   resObj['singleAmount'] = 0;
      // }
      // console.log('stdhrs ',element[`stdhrs${modelSegment}`]);
      // console.log('citySegment ',element[`citySegment${outletSegment}`]);

      if (
        element[`stdhrs${modelSegment}`] !== undefined &&
        element[`citySegment${outletSegment}`] !== undefined
      ) {
        // console.log('stdhrs----- ',element[`stdhrs${modelSegment}`]);
        resObj['singleAmount'] =
          element[`stdhrs${modelSegment}`] *
          element[`citySegment${outletSegment}`];
      } else {
        resObj['singleAmount'] = 0;
      }

      // if (
      //   reqData.customerState.toLowerCase() === user.outlet.state.toLowerCase()
      // ) {
      //   resObj['sgst'] = element.taxPercentage / 2;
      //   resObj['cgst'] = element.taxPercentage / 2;
      //   resObj['igst'] = 0;
      // } else {
      //   resObj['sgst'] = 0;
      //   resObj['cgst'] = 0;
      //   resObj['igst'] = element.taxPercentage;
      // }


       if (
        reqData.customerState.toLowerCase() === user.outlet.state.toLowerCase()
      ) {

        resObj['sgst'] = element.taxPercentage / 2;
        resObj['cgst'] = element.taxPercentage / 2;
        resObj['igst'] = 0;

      } else {

        resObj['sgst'] = 0;
        resObj['cgst'] = 0;
        resObj['igst'] = element.taxPercentage;

      }
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service getLabourDetails', err);
    throw err;
  }
};

const getOslLabourDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await LabourScheduleDao.getOslLabourDetails(reqData);
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['sacCode'] = element.sacCode;
      resObj['taxPercentage'] = element.taxPercentage;
      if (
        reqData.customerState.toLowerCase() === user.outlet.state.toLowerCase()
      ) {
        resObj['sgst'] = element.taxPercentage / 2;
        resObj['cgst'] = element.taxPercentage / 2;
        resObj['igst'] = 0;
      } else {
        resObj['sgst'] = 0;
        resObj['cgst'] = 0;
        resObj['igst'] = element.taxPercentage;
      }
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service getLabourDetails', err);
    throw err;
  }
};

const searchLabourDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await LabourScheduleDao.searchLabourDetails(
      reqData,
      user.outlet.companyId
    );
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['displayText'] =
        `${element.laborCode} | ${element.laborDescription}`;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service searchLabourDetails', err);
    throw err;
  }
};

const searchOslLabourDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await LabourScheduleDao.searchOslLabourDetails(
      reqData,
      user.outlet.companyId
    );
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['displayText'] =
        `${element.laborCode} | ${element.laborDescription}`;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service searchOslLabourDetails', err);
    throw err;
  }
};

const labourDetailsMobile = async (reqData, user) => {
  const resultList = [];
  try {
    const vehicle = await LabourScheduleDao.getModelDetailsByVehNo(reqData.vehicleNumber);
    console.log(vehicle.model.segment);

    const data = await LabourScheduleDao.labourDetailsMobile(reqData.laborSearchValue, user.outlet);

    // for (const labour of data){
    //   let price = 0;

    //   let partsMappingTag = false;
    //   const resObj = {};
    //   if (labour.parts_mapping == 1) {
    //     partsMappingTag = true;
    //   }
    //   resObj['id'] = labour.id.toString();
    //   resObj['labourCode'] = labour.laborCode;
    //   resObj['labourDescription'] = labour.laborDescription;
    //   resObj['sacCode'] = labour.sacCode;
    //   resObj['standardManHrs'] = labour.standard_man_hrs;
    //   const segmentKey = `${user.outlet?.outletSegment?.toLowerCase() || ''}${vehicle.model?.segment?.toLowerCase() || ''}`;

    //   if (labour[segmentKey] != null) {
    //     price = labour[segmentKey];
    //   }else{
    //     price = 0;
    //   }
    //   resObj['price'] = price.toFixed(2);
    //   resObj['labourPrice'] = price.toFixed(2);
    //   resObj['osl'] = labour.osl;
    //   resObj['igst'] = labour.taxPercentage.toFixed(2);
    //   resObj['sgst'] = (labour.taxPercentage/2).toFixed(2);
    //   resObj['cgst'] = (labour.taxPercentage/2).toFixed(2);
    //   resObj['partsMapping'] = partsMappingTag;
    //   resultList.push(resObj);
    // }

     for (const labour of data){
       let price = 0;
      const resObj = {};
      let partsMappingTag = false;
      
      if (labour.parts_mapping == 1) {
        partsMappingTag = true;
      }
      let oslFlag = true;
      if(labour.osl != 1){
        oslFlag = false;
      }
      resObj['id'] = labour.id.toString();
      resObj['labourCode'] = labour.laborCode;
      resObj['labourDescription'] = labour.laborDescription;
      resObj['sacCode'] = labour.sacCode;
      // resObj['standardManHrs'] = labour.standard_man_hrs;
      resObj['standardManHrs'] = labour[`stdhrs${vehicle.model.segment}`];
      // const segmentKey = `${user.outlet?.outletSegment?.toLowerCase() || ''}${vehicle.model?.segment?.toLowerCase() || ''}`;

      // if (labour[segmentKey] != null) {
      //   price = labour[segmentKey];
      // }else{
      //   price = 0;
      // }
       if (labour[`stdhrs${vehicle.model.segment}`] && labour[`citySegment${user.outlet.outletSegment}`]){
        price = labour[`stdhrs${vehicle.model.segment}`] * labour[`citySegment${user.outlet.outletSegment}`];
      }
      // resObj['price'] = price.toFixed(2);
      // resObj['labourPrice'] = price.toFixed(2);
      // resObj['osl'] = labour.osl;
      // resObj['igst'] = labour.taxPercentage.toFixed(2);
      // resObj['sgst'] = (labour.taxPercentage/2).toFixed(2);
      // resObj['cgst'] = (labour.taxPercentage/2).toFixed(2);

      // resultList.push(resObj);
    
      resObj['price'] = price.toFixed(2);
      resObj['labourPrice'] = price.toFixed(2);
      resObj['osl'] = oslFlag;
      resObj['igst'] = labour.taxPercentage.toFixed(2);
      resObj['sgst'] = (labour.taxPercentage/2).toFixed(2);
      resObj['cgst'] = (labour.taxPercentage/2).toFixed(2);
      resObj['partsMapping'] = partsMappingTag;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service labourDetailsMobile', err);
    throw err;
  }
}

const searchAllLabourDetails = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await LabourScheduleDao.searchAllLabourDetails(
      reqData,
      user.outlet.companyId
    );
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['laborCode'] = element.laborCode;
      resObj['laborDescription'] = element.laborDescription;
      resObj['displayText'] =
        `${element.laborCode} | ${element.laborDescription}`;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('LaborSchedule service searchLabourDetails', err);
    throw err;
  }
};

const LaborScheduleService = {
  addLaborSchedule,
  findLaborCode,
  getOne,
  addLaborCompanyMap,
  updateLaborSchedule,
  removeLaborCompanyMap,
  listLaborSchedule,
  getLabourDetails,
  getOslLabourDetails,
  searchLabourDetails,
  searchOslLabourDetails,
  labourDetailsMobile,
  searchAllLabourDetails
};

export default LaborScheduleService;
