import logger from '../../config/logger.js';
import LeadDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';

const listLeads = async (reqData, user) => {
    try {
        const { totalItems, data } = await LeadDao.listLeads(reqData, user);
        return {
            totalItems: totalItems,
            data: data
        }
    } catch (err) {
        logger.error('Lead service listLeads', err);
    }
};

const createLead = async (reqData, user) => {
    let result = '';
    let recentActivityData = {};
    let leadNo = '';
    try {
        leadNo = await generateLeadNo(user.outlet.outletCode);
        reqData['leadNo'] = leadNo;
        let data = await LeadDao.createLead(reqData, user);
        if (data) {
            recentActivityData['activity_type'] = 'Create';
            recentActivityData['menu_name'] = 'Lead';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;
            recentActivityData['message'] =
            reqData.registrationNumber + ' Lead is created ';
            await RecentAcivityService.addRecentActivity(recentActivityData);
            result = { success: true, data: data };
        }
    } catch (err) {
        result = 'failed';
        logger.error('Lead service createLead', err);
    }
    return result;
};

const updateLead = async (reqData, user) => {
    let result = '';
    let recentActivityData = {};
    try {
        const LeadExists = await LeadDao.findLeadById(reqData.id);
        if (LeadExists) {
            recentActivityData['activity_type'] = 'Update';
            recentActivityData['menu_name'] = 'Lead';
            recentActivityData['createdBy'] = user.id;
            recentActivityData['username'] = user.employeeCode;

            let data = await LeadDao.editLead(reqData, user.id);
            if (data) {
                recentActivityData['message'] = 'Lead updated for ' + reqData.registrationNumber;
                const recent = await RecentAcivityService.addRecentActivity(recentActivityData);
                result = 'success';
            }
        }
    } catch (err) {
        logger.error('Lead service updateLead', err);
    }
    return result;
}

const generateLeadNo = async (outletCode) => {
    let seqNo = 0;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let fyYear;
    if(currentDate.getMonth() >= 3){
        fyYear = year + 1;
    }
    else {
        fyYear = year;
    }
    const currentYear = fyYear.toString().slice(-2);
    const recentLeadData = await LeadDao.getRecentLead(outletCode, currentYear);
    if (recentLeadData) {
        const lastNumber = recentLeadData.leadNo.split("-")[2];
        seqNo = parseInt(lastNumber, 10) + 1;
    }
    else {
        seqNo = 1;
    }

    const formattedSequenceNumber = seqNo.toString().padStart(6, "0");

    return `LEAD-${outletCode}${currentYear}-${formattedSequenceNumber}`;

}

const LeadService = {
    listLeads,
    createLead,
    updateLead
};

export default LeadService;