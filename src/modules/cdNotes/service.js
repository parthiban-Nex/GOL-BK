import logger from "../../config/logger.js";
import RecentAcivityService from "../recentActivity/service.js";
import creditDao from "./dao.js";
import numberToWords from 'number-to-words';
import outletDao from '../outlet/dao.js';

const getJobCardNumber = async (reqData, user) => {
    const resultList = [];
    try {
        const data = await creditDao.getJobCardNumber(reqData, user);
        return data;
    } catch (err) {
        logger.error('Credit service getJobCardNumber Error:', err);
        next(err);
    };
};

const generateDocNumber = async (documentType, outletCode) => {
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
    const recentOutPass = await creditDao.getRecentDocNumber(documentType, outletCode, currentYear);
    if (recentOutPass) {
      const lastNumber = recentOutPass.doc_no.split("-")[2];
      seqNo = parseInt(lastNumber, 10) + 1;
    } else {
      seqNo = 1;
    }
  
    const formattedSequenceNumber = seqNo.toString().padStart(4, "0");
  
    return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
  };

const addCreditNotes = async (creditNotes, user) => {
    let result = '';
    let recentActivityData = {};
    let data = null ;
    try {
        console.log(creditNotes,"creditnotes");
        let documentType=creditNotes?.purpose=="DebitNote" ? "DN" :"CN";
        const outletData = await outletDao.getOutlet(creditNotes.jobCardOutlet);
        let docNumber = await generateDocNumber(documentType, outletData.outletCode);
         data = await creditDao.addCreditNotes(docNumber, creditNotes, user);

        // console.log('D:dms_node_user_backendsrcmodulescdNotesservice.js -----',data)
        if(data){
            recentActivityData['activity_type'] = 'Create',
            recentActivityData['menu_name'] = 'Credit/Debit Notes',
            recentActivityData['createdBy'] = user.id,
            recentActivityData['username'] = user.employeeCode,
            recentActivityData['message'] = 'Created';
            const recent = await RecentAcivityService.addTransactionRecentActivity(recentActivityData);
            result = 'success';
        }
    } catch (err) {
        result = 'failed';
        logger.error('CreditNotes service addCreditNotes', err);
       
    }

    return data;
};



const oldDmsaddCreditNotes = async (creditNotes, user) => {
   
    let recentActivityData = {};
 
    try {
       
        let documentType=creditNotes?.purpose=="DebitNote" ? "DN" :"CN";
        // const outletData = await outletDao.getOutlet(creditNotes.jobCardOutlet);
        let docNumber = await generateDocNumber(documentType, creditNotes.outletCode);
         const result = await creditDao.oldDmsaddCreditNotes(docNumber, creditNotes, user);

      
        if(result.success){
            recentActivityData['activity_type'] = 'Create',
            recentActivityData['menu_name'] = ' Old Dms Credit/Debit Notes',
            recentActivityData['createdBy'] = user.id,
            recentActivityData['username'] = user.employeeCode,
            recentActivityData['message'] = 'Created';
            const recent = await RecentAcivityService.addTransactionRecentActivity(recentActivityData);
            return result;
            
        }else{
            return result;
        }
    } catch (err) {
        // data = data ? data : {};
        logger.error('Old Dms CreditNotes service addCreditNotes', err);
       return {
            success: false,
            message: result.message,
            error: err.message
        };
    }
};

const lisrCreditNotes = async (reqData, user) => {
    try {
        const data = await creditDao.listCreditNotes(reqData, user);
        for (const item of data.data){
            let firstName = item.customers.dataValues.decryptedFirstName;
            let lastName = item.customers.dataValues.decryptedLastName ? item.customers.dataValues.decryptedLastName : '';
            
            item.dataValues["customer_name"] = firstName + " " + lastName;

            delete item.customers;
            delete item.dataValues.customers;
        };

        return data;
    } catch (err) {
        logger.error('Credit Notes listCreditNotes:', err);
        next(err);
    }
};


const listOldDmsCreditNotes = async (reqData, user) => {
    try {
        const data = await creditDao.listOldDmsCreditNotes(reqData, user);
        for (const item of data.data){
            // console.log(item,"item-----------------------------")
            let firstName = item.customers.dataValues.decryptedFirstName;
            let lastName = item.customers.dataValues.decryptedLastName ? item.customers.dataValues.decryptedLastName : '';
            
            item.dataValues["customer_name"] = firstName + " " + lastName;

            delete item.customers;
            delete item.dataValues.customers;
        };

        return data;
    } catch (err) {
        logger.error(' Old Dms Credit Notes listCreditNotes:', err);
        next(err);
    }
};


const downloadCreditDebitNotes = async (id, outlet) => {
    const resObj = {};
    try {
        const data = await creditDao.downloadCreditDebitNotes(id);
        // Populate outlet details
        outlet["code"] = data.outlet.outletCode;
        outlet["address"] = data.outlet.address1;
        outlet["city"] = data.outlet.city;
        outlet["state"] = data.outlet.state;
        outlet["pincode"] = data.outlet.pincode;
        outlet["phone"] = data.outlet.phoneNumber;
        outlet["mobile"] = data.outlet.phoneNumber;
        outlet["email"] = data.outlet.email;
        outlet["gstin"] = data.outlet.gstIn;
        outlet["outletName"]=data.outlet.outletName
    
        // Extract required data from dataValues
        const { 
            createdAt,
            reg_no, 
            doc_no,
            customer_code,
            customer_gstin,
            amount,
            narration,
            purpose
        } = data?.dataValues || {};

        const { 
            decryptedCustomerName,
            address1
        } = data?.dataValues?.customers?.dataValues || {};

        
        const amountInWords = numberToWords.toWords(amount).toUpperCase();;

        const formattedCreatedAt = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(createdAt));

        // Populate creditDebit
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
            purpose
        };

        resObj["outlet"] = outlet;
        resObj["creditDebit"] = creditDebit;

        return resObj;
    } catch (err) {
        logger.error("Credit/Debit notes service getGatePassData", err);
        next(err);
    }
};

const getCdByTransaction = async (reqData) => {
    try {
        const data = await creditDao.getCdByTransaction(reqData.id);
        return data;
    } catch (err) {
        logger.error('Credit Notes listCreditNotes:', err);
        next(err);
    }
}

const oldDmsGetCdByTransaction = async (reqData) => {
    try {
        const data = await creditDao.oldDmsGetCdByTransaction(reqData.id);
        return data;
    } catch (err) {
        logger.error(' Old Dms Credit Notes listCreditNotes:', err);
        next(err);
    }
}

const creditService = {
    getJobCardNumber, addCreditNotes,oldDmsaddCreditNotes, lisrCreditNotes,downloadCreditDebitNotes,
    getCdByTransaction,oldDmsGetCdByTransaction,listOldDmsCreditNotes
};

export default creditService;
