import logger from '../../config/logger.js';
import dao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import numberToWords from 'number-to-words';
import moment from 'moment-timezone';

const getVehicleForScheme = async (reqData, user) => {

    try {
        let data = await dao.getVehicleForScheme(reqData, user);
        return data;
    } catch (err) {
        logger.error('VehicleContract service getVehicleForScheme', err);
    }
}

const getSchemeDetails = async (reqData, user) => {

    try {
        let data = await dao.getSchemeDetails(reqData, user);
        return data;
    } catch (err) {
        logger.error('VehicleContract service getSchemeDetails', err);
    }
}

const listVehicleContract = async (reqData, user) => {
    try {
        const data = await dao.listVehicleContract(reqData, user);
        return data;
    } catch (error) {
        logger.error('VehicleContract service listVehicleContract', err);
    }
}

const createVehicleContract = async (reqData, user) => {
    let result = 'failed';
    try {
        const isDuplicate = await dao.checkVehicleContract(reqData.vehicleId, reqData.schemeId)
        if (isDuplicate) {
            return 'duplicate';
        }
        const vehicleContractNo = await generateVehicleContractNo(user.outlet.outletCode);
        reqData["docNo"] = vehicleContractNo;
        let data = await dao.createVehicleContract(reqData, user);
        if (data) {
            let schemeData = await dao.getSchemeLabourParts(reqData.schemeId);
            for (const labor of schemeData.labours) {
                labor['itemType'] = 1;
                await dao.createVehicleContractScheme(data, labor);
            }
            for (const part of schemeData.parts) {
                part['itemType'] = 2;
                await dao.createVehicleContractScheme(data, part);
            }
            result = 'success';
        }
    } catch (err) {
        logger.error('VehicleContract service createVehicleContract', err);
    }
    return result;
}

const editVehicleContract = async (reqData, user) => {
    try {
        let data = await dao.editVehicleContract(reqData, user);
        return data;
    } catch (err) {
        logger.error('VehicleContract service createVehicleContract', err);
    }
}

const generateVehicleContractNo = async (outletCode) => {
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
    const recentVehicleContractData = await dao.getRecentVehicleContract(outletCode, currentYear);
    if (recentVehicleContractData && recentVehicleContractData != "") {
        const lastNumber = recentVehicleContractData.doc_no.split("-")[2];
        seqNo = parseInt(lastNumber, 10) + 1;
    } else {
        seqNo = 1;
    }

    const formattedSequenceNumber = seqNo.toString().padStart(6, "0");

    return `CSD-${outletCode}${currentYear}-${formattedSequenceNumber}`;
}

const getVehicleContract = async (id, outlet) => {
    
    const resObj = {};
    const outletObj = {};
    const customerObj = {};
    const schemeObj = {};
    const schemeLaborParts = [];
    try {
        const data = await dao.getVehicleContract(id);

        outletObj['name'] = data.outlet.outletCode;
        outletObj['address'] = data.outlet.address1;
        outletObj['city'] = data.outlet.city;
        outletObj['state'] = data.outlet.state;
        outletObj['pincode'] = data.outlet.pincode;
        outletObj['phone'] = data.outlet.phoneNumber;
        outletObj['mobile'] = data.outlet.phoneNumber;
        outletObj['email'] = data.outlet.email;
        outletObj["outletName"] = data.outlet.outletName
        outletObj['dealerGstin'] = data.outlet.gstIn;

        schemeObj['documentName'] = data.doc_no;
        schemeObj['documentDate'] = data.start_date.toString().substring(4, 16);
        schemeObj['branch'] = data.outlet.outletCode;
        schemeObj['outletName'] = data.outlet.outletName;
        schemeObj['makeModel'] = data.vehicle.make.makeName + ' / ' + data.vehicle.model.modelName;
        schemeObj['regNo'] = data.vehicle_number;
        schemeObj['startDate'] = data.start_date.toString().substring(4, 16);
        schemeObj['endDate'] = data.end_date.toString().substring(4, 16);
        schemeObj['hsn'] = data.scheme.hsnCode;
        schemeObj['cgst'] = data.cgst;
        schemeObj['sgst'] = data.sgst;
        schemeObj['igst'] = data.igst;
        schemeObj['cgstAmount'] = parseFloat(data.cgst * data.amount) / 100;
        schemeObj['sgstAmount'] = parseFloat(data.sgst * data.amount) / 100;
        schemeObj['igstAmount'] = parseFloat(data.igst * data.amount) / 100;
        schemeObj['amount'] = data.amount;
        schemeObj['amountWithTax'] = data.total_amount;

        customerObj['name'] = data.customer.dataValues.decryptedFirstName + ' ' + data.customer.dataValues.decryptedLastName;
        customerObj['code'] = data.customer_code;
        customerObj['gstin'] = data.customer.gstinNumber;
        customerObj['branch'] = data.outlet.outletCode;
        customerObj['address'] =
            data.customer.address1 +
            ', ' +
            data.customer.city +
            ', ' +
            data.customer.state +
            ', ' +
            data.customer.pinCode;

        let sno = 1;

        data.vehicleContractSchemes.forEach((partlabor) => {
            const partlaborData = {
                sno: sno++,
                laborPartCode: partlabor.scheme_labor_parts_code,
                count: partlabor.count
            }
            schemeLaborParts.push(partlaborData);
        })

        let amountInWords = numberToWords.toWords(Math.round(data.total_amount)).toUpperCase() + " RUPEES ONLY";

        resObj['scheme'] = schemeObj;
        resObj['branch'] = outletObj;
        resObj['customer'] = customerObj;
        resObj['schemeLaborParts'] = schemeLaborParts;
        resObj['amountInWords'] = amountInWords;

        return resObj;
    } catch (err) {
        logger.error('VehicleContract service getVehicleContract', err);
    }
}

const getVehicleContractData = async (reqData, user) => {
    try {
        const data = await dao.getVehicleContractData(reqData, user);

        // for(const item of data) {
        let dataWithCustomHeaders = data.map((item, index) => {
            const startDate = moment(item.dataValues.start_date).tz('Asia/kolkata').format('DD-MM-YYYY');
            const endDate = moment(item.dataValues.end_date).tz('Asia/kolkata').format('DD-MM-YYYY');
            const createdAt = moment(item.dataValues.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY');
        console.log(item.outlet)
        
        let firstName = item.customer.dataValues.decryptedFirstName;
        let lastName = item.customer.dataValues.decryptedLastName ? item.customer.dataValues.decryptedLastName : '';

        return {
            autoId: index + 1,
            outletId: item?.outlet?.id ?? '',
            outletCode: item?.outlet?.outletCode ?? '',
            doc_no: item.doc_no ?? '',
            doc_date: createdAt ?? '',
            repair_type: item.scheme.repair_type_name ?? '',
            scheme_name: item.scheme.scheme_name ?? '',
            start_date: startDate ?? '',
            end_date: endDate ?? '',
            customer_code: item.customer.customerCode ?? '',
            customer_name: firstName + " " + lastName,
            address: item.customer.address1 ?? '',
            mobileNo: item.customer.dataValues.decryptedMobileNumber ?? '',
            vehicle_number: item.vehicle_number ?? '',
            amount: item.amount ?? '',
            cgst: item.cgst ?? '',
            sgst: item.sgst ?? '',
            igst: item.igst ?? '',
            cgstA: item.cgst * item.amount / 100 ?? '',
            sgstA: item.sgst * item.amount / 100 ?? '',
            igstA: item.igst * item.amount / 100 ?? '',
            total_amount: item.total_amount ?? '',
            createdBy: item.created_by ?? '',
            registrationDate: item?.vehicle?.dateOfRegistration ?? '',
            mfgDate:item?.vehicle?.dateOfSale ?? '',
            itemMake:item?.vehicle?.make?.makeName ?? '',
            itemModel:item?.vehicle?.make?.makeName ?? '',
        };
    });
        // };

    let count = dataWithCustomHeaders.length;

    if (reqData.offset && reqData.offset > 0) {
        dataWithCustomHeaders = dataWithCustomHeaders.slice(reqData.offset);
    };
    
    if(dataWithCustomHeaders.length > reqData.limit) {
        dataWithCustomHeaders = dataWithCustomHeaders.slice(0, reqData.limit);
    };

    return {totalItems: count, data: dataWithCustomHeaders};
    
    } catch (err) {
        logger.error('VehicleContract service getVehicleContractData', err);
    };
};

const service = {
    getVehicleForScheme,
    getSchemeDetails,
    listVehicleContract,
    createVehicleContract,
    editVehicleContract,
    getVehicleContract,
    getVehicleContractData
}

export default service;