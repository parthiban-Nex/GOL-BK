import db from '../index.js';
import axios from 'axios';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";
import preMoevCheckList from '../mobilechecklists/models/preMoevChecklist.js';
import postMoevCheckList from '../mobilechecklists/models/postMoevChecklist.js';

const Vehicle = db.vehicles;
const Vehiclecolor = db.vehiclecolors;
const Customer = db.customers;
const Make = db.makes;
const Varient = db.varients;
const Model = db.models;
const Insurances = db.insurances;
const Pincodes = db.pincodes;
const SecurityGateIn = db.securityGateIn;
const SecurityGateOut = db.securityGateOut;
const SaveInventoryCheckList = db.saveInventoryCheckList;
const SaveDentAndScratch = db.saveDentAndScratch;
const JobCard = db.jobCard;
const SaveCheckListType = db.saveCheckListType;
const User = db.users;
const Employee = db.employees;
const EmployeeRole = db.employeeroles;
const Outlet = db.outlets;
const FlaData = db.flaData;
const PartsIndent = db.partsIndent;
const Schedules = db.schedules;
const OslSchedules = db.oslSchedules;
const checkListTypeMobile = db.saveCheckListType;
const TransactionSubstatus = db.transactionsubstatuses;
const Otdfailurereason = db.otdfailurereason;
const LabourSchedules = db.laborschedules;
const Company = db.companies;
const transactionUpdate = db.transactionupdates;

const PartsIssue = db.partsIssue;
const MechanicMapping = db.mechaniceMapping;
const sequelize = db.sequelize
const ServiceEstimate = db.servicEstimates;
const Billings = db.billings;
const Items = db.items;
const Stocks = db.stocks
const InsuranceAddress = db.insuranceAddress;
const TransactionInsurance = db.transactionInsurance;

const RepairType = db.repairtypes;
const DsaAgent = db.dsaagents;
const source = db.sources;
const Sourcetypes = db.sourcetypes;
const Servicetypes = db.servicetypes;
const Vendor = db.vendors;
const Users = db.users;
const Employees = db.employees;
const Receipt = db.receipt;
const employeeOutletMap = db.employeeoutletmap
const DisPosition = db.dispositions;
const ServiceBooking = db.servicebookings;
const LabourEstimate = db.labourEstimates;
const OslLabourEstimate = db.oslLabourEstimate;
const PartsEstimate = db.partsEstimates;
const ServiceReminderAlert = db.serviceReminderAlert;
const Outlets = db.outlets;
const CreditNotes = db.creditNotes;
const creditNoteDetails = db.creditNotesDetails;
const vehicleContract = db.vehicleContract;
const vehicleContractScheme = db.vehicleContractScheme;
const Scheme = db.scheme;

const inventoryData = db.saveInventoryCheckList;
const masterInventory = db.vehicleInventoryCheckList;
const masterCheckList = db.inspectionChekList;
const preMinorCheckList = db.preMinorCheckList;
const preMajorCheckList = db.preMajorCheckList;
const preMoveCheckList = db.preMoevCheckList;
const postMoveCheckList = db.postMoevCheckList;
const postMinorCheckList = db.postMinorCheckList;
const postMajorCheckList = db.postMajorCheckList;
const PreSunMobChecklist = db.pre2wSunChecklist;
const PreSun3WChecklist = db.pre3wSunChecklist;
const PostSunMobChecklist = db.post2wSunChecklist;
const PostSun3WChecklist = db.post3wSunCheckList;
const Reasons = db.preReasons;
const Images = db.mobileImages;
const carpmRecordsModel = db.carpmRecords;
const dentAndScratchModel = db.saveDentAndScratch;
const serviceBookings = db.servicebookings;
const dispositionModel = db.dispositions;
const securityGateInModel = db.securityGateIn;
const fuelType = db.fueltypes
const PincodeData = db.pincodes;
const customerCategoryData = db.customercategory;
const visitAuditTrailData = db.visitAuditTrail;
const FitAppLogs = db.fitAppLogs;

const getInventory = async (visitId) => {
    // if you have one jobcard with many inventory or data in different table with same id then use findOne 
    // if you have many jobcard with the same search and other remains same user findAll
    const vehicleInventory = await JobCard.findOne({
        where: { id: visitId },
        include: [{
            model: inventoryData,
            as: "inventory",
            attributes: ['inventory_code', 'inventory_condition', 'remarks'],
            include: [{
                model: masterInventory,
                as: "masterInventoryCode",
                attributes: ['INVENTORY_DESC', 'INVENTORY_TYPE']
            }]
        }],
        raw: false
    })

    let inventoryResponse = [];

    if (vehicleInventory && vehicleInventory.inventory) {
        inventoryResponse = vehicleInventory.inventory.map(item => ({
            INVENTORY_TYPE: item.masterInventoryCode?.INVENTORY_TYPE || null,
            INVENTORY_DESC: item.masterInventoryCode?.INVENTORY_DESC || null,
            INVENTORY_CONDITION: item.inventory_condition || null, // if you have this in inventoryData
            REMARKS: item.remarks || "" // if you have this in inventoryData
        }));
    }

    return inventoryResponse;
}

const getInspection = async (visitId, checkListType, INSPECTION_MODE) => {

    let modelToUse = "";

    if (checkListType == "MajorChecklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = preMajorCheckList
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = postMajorCheckList
        }
    } else if (checkListType == "MinorChecklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = preMinorCheckList
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = postMinorCheckList
        }
    } else if (checkListType == "MoevCheklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = preMoveCheckList
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = postMoveCheckList
        }
    } else if (checkListType == "MoevCheklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = preMoveCheckList
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = postMoveCheckList
        }
    } else if (checkListType == "SunMobChecklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = PreSunMobChecklist
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = PostSunMobChecklist
        }
    } else if (checkListType == "Sun3WChecklist") {
        if (INSPECTION_MODE == "PRE_INSPECTION") {
            modelToUse = PreSun3WChecklist
        } else if (INSPECTION_MODE == "POST_INSPECTION") {
            modelToUse = PostSun3WChecklist
        }
    }


    const results = await modelToUse.findAll({
        where: { VISIT_ID: visitId },
        include: [
            {
                model: Reasons,
                as: 'RatingReasons',
                attributes: ['PARAM_CHECKLIST_ID', 'RATING_CHECKLIST_ID', 'RATING_REASON_REMARKS', 'MEASUREMENT_READING'],
                where: { VISIT_ID: visitId },
                required: false
            }
        ]
    });

    let inspectionResponse = [];

    inspectionResponse = results.map(r => {
        const plain = r.get({ plain: true });
        const ratingArray = (plain.RatingReasons || []).map(rr => ({
            RATING_CHECKLIST_ID: rr.RATING_CHECKLIST_ID || "",
            RATING_REASON_REMARKS: rr.RATING_REASON_REMARKS || "",
            MEASUREMENT_READING: rr.MEASUREMENT_READING || ""
        }));

        // pick the last rating reason for the top-level fields
        const lastRating = ratingArray[ratingArray.length - 1] || {};
        return {
            VISIT_ID: plain.VISIT_ID,
            PARAM_CODE: plain.CHECKLIST_ID || "",
            PARAM_RATING: plain.CONTENTS,                // map CONTENTS → PARAM_RATING
            RATING: ratingArray,                           // array of all rating reasons
            RATING_REASON_CODE: lastRating.RATING_REASON_CODE || "",
            RATING_REASON_REMARKS: lastRating.RATING_REASON_REMARKS || "",
            MEASUREMENT_READING: lastRating.MEASUREMENT_READING || ""
        };
    });

    return inspectionResponse;
}

const getCheckListTypeMobile = async (req) => {
    const checkListType = await checkListTypeMobile.findOne({
        attributes: ['CHECKLIST_TYPE_CODE'],
        where: { VISIT_ID: req.VISIT_ID },
        raw: true
    });

    if (checkListType) {
        return {
            status: true,
            checkListType: checkListType
        }
    }
}

const getDentAndScrarch = async (visitId) => {
    let dentScratch = [];

    const dentScratchResponse = await dentAndScratchModel.findAll({
        where: { VISIT_ID: visitId },
        order: [['CREATED_DATE', 'DESC']],
    });

    if (dentScratchResponse) {
        dentScratch = dentScratchResponse.map(item => ({
            xPoint: item.X_POINT,
            yPoint: item.Y_POINT,
            type: item.TYPE
        }))
    }

    return dentScratch;
}

const getCarpmRecords = async (visitId) => {
    let carpmRecords = [];

    const carpmResponse = await carpmRecordsModel.findOne({
        where: { VISIT_ID: visitId },
        order: [['createdAt', 'DESC']],
    })

    if (carpmResponse) {
        carpmRecords = carpmResponse.REPORT_DATA;
    }

    return carpmRecords;
}

const getImages = async (visitId) => {
    const pastImages = await Images.findAll({
        where: { visit_id: visitId }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => ({
            IMAGE_LINK: item.link,
            IMAGE_TYPE: item.type,
        }));
    }

    return images;

}

const getShortendImages = async (visitId) => {
    const pastImages = await Images.findAll({
        where: { visit_id: visitId }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => (
            item.link.split("tvs-fit-storage-account/")[1]
        ));
    }

    return images;

}

const getShortendImagesInventory = async (visitId) => {
    const pastImages = await Images.findAll({
        where: {
            visit_id: visitId,
            type: "inventory"
        }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => (
            item.link.split("tvs-fit-storage-account/")[1]
        ));
    }

    return images;

}

const getShortendImagesSignature = async (visitId) => {
    const pastImages = await Images.findAll({
        where: {
            visit_id: visitId,
            type: "signature"
        }
    })

    let images = [];

    if (pastImages) {
        images = pastImages.map(item => (
            item.link.split("tvs-fit-storage-account/")[1]
        ));
    }

    return images;

}

const updateParentTable = async (userName, visitId, data, tableName) => {
    let tableUpdated;
    let userId = '';

    let creatorId = await getUserId(userName);

    if (tableName == 'Parent') {
        userId = data['ASSIGNED_SA_USER_ID']
        console.log("userId", userId);
        if ("VISIT_STATUS" in data) {
            if (data['VISIT_STATUS'] == 'SA_ASSIGNED') {
                // userId = await User.findOne({
                //     where: {
                //         user_id: data['ASSIGNED_SA_USER_ID']
                //     },
                //     include: [
                //         {
                //             model: Employee,
                //             as: 'employee',
                //             include: [
                //                 {
                //                     model: EmployeeRole,
                //                     as: 'employeerole'
                //                 }
                //             ]
                //         }
                //     ],
                //     attributes: ['id', 'employeeId']
                // })

                const saFcmToken = await User.findOne({
                    where: {
                        id: userId
                    }
                })

                const regNo = await JobCard.findOne({
                    where: {
                        id: visitId
                    }
                })
                await sendNotificationDataToToken(
                    saFcmToken.fcm_tocken,
                    {
                        title: "Sa Assigned",
                        body: "Gate in for vehicle number " + regNo.reg_no + " is done. Please open the Job Card",
                        tab: "SAA",
                        visitID: visitId.toString()
                    }
                )

                if (creatorId.employee.employeerole.employeeRole == 'manger') {
                    // TODO : Send Notification to Service Advisor 
                }
            }
            if (data['VISIT_STATUS'] == 'SA_ASSIGNED') {
                tableUpdated = await JobCard.update({
                    assigned_sa_id: userId,
                    fit_status: data['VISIT_STATUS'],
                    updated_by: userName,
                    updatedAt: getDateTime()
                }, {
                    where: { id: visitId }
                })
            }
        } else {
            tableUpdated = await JobCard.update({
                assigned_sa_id: userId,
                updated_by: userName,
                updatedAt: getDateTime()
            }, {
                where: { id: visitId }
            })
        }
    } else if (tableName == 'Security Gate In') {
        userId = data.ASSIGNED_SA
        tableUpdated = await securityGateInModel.update({
            assigned_sa: userId,
            updated_by: userName,
            updatedAt: getDateTime()
        }, {
            where: {
                id: data.VisitId
            }
        })

        if (tableUpdated[0] == 1) {

            const saFcmToken = await User.findOne({
                where: {
                    id: userId
                }
            })

            await sendNotificationDataToToken(
                saFcmToken.fcm_tocken,
                {
                    title: "Sa Assigned",
                    body: "Security Gate in for vehicle number " + data['Vehicle'] + " is done. Please open the Job Card",
                    tab: "assigned",
                    visitID: ""
                }
            )
        }
    } else if (tableName == "Service Booking") {
        userId = data.leadDetails.assignedId
        tableUpdated = await ServiceBooking.update({
            assigned_pickup_id: userId
        }, {
            where: {
                id: data.leadDetails.serviceBookingId
            }
        })
    }

    if (tableUpdated[0] == 1) {
        return true;
    } else {
        return false;
    }

}

const getUserId = async (userName) => {

    const userId = await User.findOne({
        where: {
            employeeId: userName
        },
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [
                    {
                        model: EmployeeRole,
                        as: 'employeerole'
                    }
                ]
            }
        ],
        attributes: ['id', 'employeeId']
    })

    return userId;
}

function getDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

const getEstimation = async (visitId, serviceEstimateId) => {
    let estimateResponse = [];

    let labourEstimate = [];
    let oslLabourEstimate = [];
    let partEstimate = [];

    const searchC = { id: visitId };
    let data = await JobCard.findOne({
        include: [
            {
                model: Schedules, as: 'schedules', separate: true
            },
            {
                model: OslSchedules, as: 'oslSchedules', separate: true
            },
            {
                model: PartsIndent, as: 'partsIndent', separate: true
            },
        ],
        where: { ...searchC },
    });

    // data = JSON.stringify(data, null, 2);
    data = data.toJSON();
    // console.log('data',data.schedules);
    // console.log('data',data);
    if (data) {
        labourEstimate = data.schedules.map(item => ({
            id: item.id,
            ESTIMATE_ID: serviceEstimateId,
            ESTIMATION_APPROVAL_STATUS: item.status,
            ESTIMATION_TYPE: "LABOUR",
            ESTIMATION_OBJECT_ID: item.rot_id,
            ESTIMATION_OBJECT: {
                id: item.id,
                cgst: item.cgst,
                sgst: item.sgst,
                igst: item.igst,
                laborId: item.rot_id,
                laborCode: item.rot_code,
                approveStatus: item.status,
                singleAmount: item.singleAmount,
                laborTotal: item.laborTotal,
                discountAmount: item.discount_percentage,
                laborDescription: item.description,
                additionalMargin: item.additionalMargin,
                quantity: item.quantity,
                approvedatetime: item.approveDatetime,
                serviceRecommendation: false,
                repairTypeId: item.repairTypeId,
                repairTypeName: item.repairTypeName
            }
        }));

        oslLabourEstimate = data.oslSchedules.map(item => ({
            id: item.id,
            ESTIMATE_ID: serviceEstimateId,
            ESTIMATION_APPROVAL_STATUS: item.status,
            ESTIMATION_TYPE: "OSL",
            ESTIMATION_OBJECT_ID: item.rot_id,
            ESTIMATION_OBJECT: {
                id: item.id,
                cgst: item.cgst,
                sgst: item.sgst,
                igst: item.igst,
                laborId: item.rot_id,
                laborCode: item.rot_code,
                approveStatus: item.status,
                rate: item.singleAmount,
                laborTotal: item.laborTotal,
                discountAmount: item.discount_percentage,
                laborDescription: item.description,
                additionalMargin: item.additionalMargin,
                quantity: item.quantity,
                vendorId: item.vendorId,
                approvedatetime: item.approveDatetime,
                marginPercentage: item.marginPercentage,
                serviceRecommendation: false
            }
        }));

        partEstimate = data.partsIndent.map(item => ({
            id: item.id,
            ESTIMATE_ID: serviceEstimateId,
            ESTIMATION_APPROVAL_STATUS: item.status,
            ESTIMATION_TYPE: "PARTS",
            ESTIMATION_OBJECT_ID: item.item_code,
            ESTIMATION_OBJECT: {
                id: item.id,
                cgst: item.cgst,
                sgst: item.sgst,
                igst: item.igst,
                partId: item.item_id,
                partNo: item.item_code,
                rate: item.amount,
                approveStatus: item.status,
                hsnCode: item.hsn_code,
                partTotal: item.part_total,
                discountAmount: "",
                partDescription: item.item_name,
                additionalMargin: "",
                approvedatetime: item.approveDatetime,
                requestedQuantity: item.request_quantity,
                serviceRecommendation: false
            }
        }));
    }

    console.log("labourEstimate", labourEstimate);
    estimateResponse = [...labourEstimate, ...partEstimate, ...oslLabourEstimate];

    return {
        estimateResponse: estimateResponse
    }
}

function formatDate(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, '0') + "-" +
        String(date.getDate()).padStart(2, '0') + " " +
        String(date.getHours()).padStart(2, '0') + ":" +
        String(date.getMinutes()).padStart(2, '0') + ":" +
        String(date.getSeconds()).padStart(2, '0');
}

async function sendWhatsAppMessage(mobileNumber, message, parameters) {
    console.log("Check WhatsAppMessage");
    if (!mobileNumber || !message) {
        throw new Error('Mandatory parameters missing');
    }

    const parameterValues = {};
    parameters.parameterValues.forEach((val, index) => {
        parameterValues[index] = val;
    });

    const url = 'https://rcmapi.instaalerts.zone/services/rcm/sendMessage';

    const template = {
        templateId: parameters.templateId,
        parameterValues: parameterValues
    };
    const postData = {
        message: {
            channel: 'WABA',
            sender: {
                from: '919150066662'
            },
            recipient: {
                to: mobileNumber,
                recipient_type: 'individual'
            },
            content: {
                shorten_url: false,
                preview_url: false,
                type: 'TEMPLATE',
                template: template
            },
            preferences: {
                webHookDNId: '1001'
            }
        },
        metaData: {
            version: 'v1.0.9'
        }
    };

    console.log("postData", JSON.stringify(postData, null, 2));
    try {
        const rawBody = JSON.stringify(postData);
        const response = await axios({
            method: 'POST',
            url: url,
            data: rawBody,
            headers: {
                'Content-Type': 'application/json',
                'Authentication': 'Bearer NBAvgDvU0sBFom6ZvfLF9w=='
            },
        });

        console.log("response.data", response.data);
        return {
            success: true,
            output: response.data,
            postData
        };
    } catch (error) {
        console.error('WhatsApp Send Failed:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}



const updateAuditTrail = async (
    visitID,
    status,
    updatedBy,
    remark,
    thisTimestamp = null
) => {
    try {
        const timestamp =
            thisTimestamp || getDateTime();

        const currentTrailObject = {
            status,
            updatedBy,
            remark,
            timestamp
        };

        // fetch existing audit trail
        const existing = await visitAuditTrailData.findOne({
            where: { VISIT_ID: visitID }
        });

        console.log("existing", existing);
        // CREATE
        if (!existing) {
            const auditTrail = [currentTrailObject];

            await visitAuditTrailData.create({
                VISIT_ID: visitID,
                AUDIT_TRAIL: JSON.stringify(auditTrail)
            });

        }
        // UPDATE
        else {
            let auditTrail = [];

            if (existing.AUDIT_TRAIL) {
                auditTrail = JSON.parse(existing.AUDIT_TRAIL);
            }

            auditTrail.push(currentTrailObject);

            await visitAuditTrailData.update(
                { AUDIT_TRAIL: JSON.stringify(auditTrail) },
                { where: { VISIT_ID: visitID } }
            );
        }

        return true;
    } catch (error) {
        console.error(
            `Audit trail update failed | visit id ${visitID}`,
            error
        );
        return false;
    }
};

async function sendSms(
    mobileNumber,
    message,
    customerId,
    dltTemplateId,
    schedule = ''
) {
    let returnVal = false;

    try {
        if (!mobileNumber || !message) {
            console.error(
                `SendSms | Mandatory parameters missing | ${mobileNumber} | ${message} | ${schedule}`
            );
            return false;
        }

        // Authentication key
        const authKey = 'wuJySONIiA9mzrt02jbWCA==';

        // Sender ID
        let senderId = "";
        if (!senderId) {
            senderId = 'TVSONE';
        }

        const messageObject = {
            dest: [mobileNumber],
            text: message,
            send: senderId,
            type: 'PM',
            dlt_entity_id: '110100001404',
            dlt_template_id: dltTemplateId
        };

        const postData = {
            ver: '1.0',
            key: authKey,
            messages: [messageObject]
        };

        console.log('karix req', JSON.stringify(postData));

        const url = 'https://japi.instaalerts.zone/httpapi/JsonReceiver';

        const response = await axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Clean response similar to PHP logic
        let result = JSON.stringify(response.data);
        result = result.replace(/[\x00-\x1F\x80-\xFF]/g, '');

        console.log('karix resp', result);

        returnVal = true;
    } catch (error) {
        console.error(
            `SendSms | Send failed | ${error.message} | ${mobileNumber} | ${message} | ${schedule}`
        );
    }

    return returnVal;
}

const saveFitAppLogs = async (req, api, type , res = "") => {
    const saveLogs = await FitAppLogs.create({
        user_id: req.userId,
        api: api,
        type: type,
        payload: JSON.stringify(req),
        response: JSON.stringify(res),
        // as per harman sir instruction changes this code
        // created_by: getDateTime(),
        // created_date: req.userId
           created_by: req.userId,
        created_date: getDateTime()
    });
}

const utils = {
    getInspection,
    getInventory,
    getCheckListTypeMobile,
    getCarpmRecords,
    getDentAndScrarch,
    getImages,
    getShortendImages,
    getShortendImagesSignature,
    getShortendImagesInventory,
    updateParentTable,
    getDateTime,
    getEstimation,
    sendWhatsAppMessage,
    updateAuditTrail,
    sendSms,
    formatDate,
    saveFitAppLogs
}

export default utils;