import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, Sequelize, literal } from 'sequelize';
import JobCarddatas from '../jobCard/models/jobCard.js';
import axios from 'axios';
import utils from '../Utils/Utils.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";


const MasterTable = db.inspectionChekList;
const RatingReason = db.preReasons;
const masterInspectionReason = db.inspectionRatingReason
const carpmModel = db.carpmRecords;

const PreMinorCheckList = db.preMinorCheckList;
const PreMajorCheckList = db.preMajorCheckList;
const PreMoevCheckList = db.preMoevCheckList;
const PreSunMobChecklist = db.pre2wSunChecklist;
const PreSun3WChecklist = db.pre3wSunChecklist;
const PostSunMobChecklist = db.post2wSunChecklist;
const PostSun3WChecklist = db.post3wSunCheckList;
const PostMinorCheckList = db.postMinorCheckList;
const PostMajorCheckList = db.postMajorCheckList;
const PostMoevCheckList = db.postMoevCheckList;
const BatteryDetails = db.batteryDetails;
const PreReasonsModel = db.preReasons;
const CheckListTypeData = db.saveCheckListType;
const JobCard = db.jobCard;
const SavePDCDentAndScratch = db.savePDCDentAndScratch;
const SavePDCChecklist = db.savePDCChecklist;
const InspectionTime = db.InspectionTime;
const User = db.users;

const getCheckListData = async (req) => {
    let data = {};
    let checkListType = "";
    let checkListValue = "";
    let results;
    let visitId = req.body.VISIT_ID
    try {

        // carpm 
        const carpmResponse = await carpmModel.findOne({
            attributes: ['REPORT_DATA'],
            where: { VISIT_ID: visitId },
            order: [['createdAt', 'DESC']],
            raw: true
        })


        if (carpmResponse) {
            data.carpm = JSON.parse(carpmResponse.REPORT_DATA);
        } else {
            data.carpm = [];
        }

        checkListType = await CheckListTypeData.findOne({
            where: { VISIT_ID: visitId }
        })


        if (checkListType.CHECKLIST_TYPE_CODE == "CHK_LIST_MAJOR") {
            if (req.body.INSPECTION_MODE == "PRE_INSPECTION") {
                results = await getCheckListFromTable(PreMajorCheckList, visitId);
            } else if (req.body.INSPECTION_MODE == "POST_INSPECTION") {
                results = await getCheckListFromTable(PostMajorCheckList, visitId);
            }
            checkListValue = "MajorChecklist";
        } else if (checkListType.CHECKLIST_TYPE_CODE == "CHK_LIST_MINOR") {
            if (req.body.INSPECTION_MODE == "PRE_INSPECTION") {
                results = await getCheckListFromTable(PreMinorCheckList, visitId);
            } else if (req.body.INSPECTION_MODE == "POST_INSPECTION") {
                results = await getCheckListFromTable(PostMinorCheckList, visitId);
            }
            checkListValue = "MinorCheckList";
        } else if (checkListType.CHECKLIST_TYPE_CODE == "CHK_LIST_MOEV") {
            if (req.body.INSPECTION_MODE == "PRE_INSPECTION") {
                results = await getCheckListFromTable(PreMoevCheckList, visitId);
            } else if (req.body.INSPECTION_MODE == "POST_INSPECTION") {
                results = await getCheckListFromTable(PostMoevCheckList, visitId);
            }
            checkListValue = "MoevCheklist";
        } else if (checkListType.CHECKLIST_TYPE_CODE == "CHK_LIST_SUNMOB") {
            if (req.body.INSPECTION_MODE == "PRE_INSPECTION") {
                results = await getCheckListFromTable(PreSunMobChecklist, visitId);
            } else if (req.body.INSPECTION_MODE == "POST_INSPECTION") {
                results = await getCheckListFromTable(PostSunMobChecklist, visitId);
            }
            checkListValue = "SunMobChecklist";
        } else if (checkListType.CHECKLIST_TYPE_CODE == "CHK_LIST_SUN_3W") {
            if (req.body.INSPECTION_MODE == "PRE_INSPECTION") {
                results = await getCheckListFromTable(PreSun3WChecklist, visitId);
            } else if (req.body.INSPECTION_MODE == "POST_INSPECTION") {
                results = await getCheckListFromTable(PostSun3WChecklist, visitId);
            }
            checkListValue = "Sun3WChecklist";
        } else {
            return {
                status: false,
                message: "Not able to find check list type"
            }
        }

        // console.log("results",results);
        let plainResults = results.map(r => r.get({ plain: true }));

        plainResults = plainResults.filter(plain => {
            const code = plain.CHECKLIST_ID || "";
            return code !== "CHECKLIST_VERSION" && !code.endsWith("_RATING");
        });

        // console.log("plainResults", plainResults);
        data.Checklist = plainResults.map(plain => {
            console.log("plain.RatingReasons", plain.RatingReasons);
            const ratingArray = (plain.RatingReasons || []).map(rr => ({
                RATING_CHECKLIST_ID: rr.RATING_CHECKLIST_ID || "",
                RATING_REASON_REMARKS: rr.RATING_REASON_REMARKS || "",
                MEASUREMENT_READING: rr.MEASUREMENT_READING || "",
                RATING_REASON_VALUE: (rr.MasterRatingReasons && rr.MasterRatingReasons.RATING_REASON_DESC) || ""
            }));

            console.log("ratingArray", ratingArray);

            // pick the last rating reason for the top-level fields
            const lastRating = ratingArray[ratingArray.length - 1] || {};
            return {
                VISIT_ID: plain.VISIT_ID,
                PARAM_CODE: plain.CHECKLIST_ID || "",
                PARAM_RATING: plain.CONTENTS,
                PARAM_VALUE: plain.MasterChecklist.PARAM_NAME,              // map CONTENTS → PARAM_RATING
                PARAM_NAME: plain.MasterChecklist.PARAM_CODE,
                RATING: ratingArray,                           // array of all rating reasons
                RATING_REASON_CODE: lastRating.RATING_REASON_CODE || "",
                RATING_REASON_REMARKS: lastRating.RATING_REASON_REMARKS || "",
                MEASUREMENT_READING: lastRating.MEASUREMENT_READING || ""
            };
        });

        console.log('data.Checklist', data.Checklist);

        data.checkListValue = checkListValue;
        data.status = true

        return data;
    } catch (err) {
        logger.error('getCheckList error: ', err);
    }
}

const getCheckListFromTable = async (checklistType, visitId) => {
    const mainAlias = checklistType.name;
    const reasonAlias = "RatingReasons";
    const results = await checklistType.findAll({
        where: { VISIT_ID: visitId },
        include: [
            {
                model: RatingReason,
                as: 'RatingReasons',
                attributes: ['PARAM_CHECKLIST_ID', 'RATING_CHECKLIST_ID', 'RATING_REASON_REMARKS', 'MEASUREMENT_READING'],
                where: { VISIT_ID: visitId },
                required: false,
                include: [{
                    model: masterInspectionReason,
                    as: 'MasterRatingReasons'
                }],
                // 🔥 IMPORTANT: Join only when checklistType.CONTENTS is 1 or 2
                on: literal(`
                    ${reasonAlias}.PARAM_CHECKLIST_ID = ${mainAlias}.CHECKLIST_ID
                    AND ${mainAlias}.CONTENTS IN (1, 2)`)
            },
            {
                model: MasterTable,
                as: 'MasterChecklist',
                attributes: [
                    'PARAM_NAME',
                    [
                        literal(`
                        REPLACE(
                        REPLACE(MasterChecklist.PARAM_CODE, 'MAJORCHK_', ''),
                        'MINORCHK_', ''
                        )
                    `),
                        'PARAM_CODE'
                    ]
                ]
            }
        ],
        logging: console.log
    });


    return results;
}

const saveCheckList = async (req, res) => {
    try {

        const createdBy = req.body.userId; // your constant
        const vehicleDetails = await JobCard.findOne({
            where: {
                id: req.body.VISIT_ID
            }
        });

        const saFcmToken = await User.findOne({
            where: {
                id: vehicleDetails.assigned_sa_id
            }
        })



        if (req.body.PreMinorChecklist && req.body.PreMinorChecklist.length >= 1) {
            const checklistObj = req.body.PreMinorChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PreMinorCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PreMajorChecklist && req.body.PreMajorChecklist.length >= 1) {
            const checklistObj = req.body.PreMajorChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PreMajorCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PreMoevChecklist && req.body.PreMoevChecklist.length >= 1) {
            const checklistObj = req.body.PreMoevChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PreMoevCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PreSun3WChecklist && req.body.PreSun3WChecklist.length >= 1) {
            const checklistObj = req.body.PreSun3WChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PreSun3WChecklist);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PreSunMobChecklist && req.body.PreSunMobChecklist.length >= 1) {
            const checklistObj = req.body.PreSunMobChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PreSunMobChecklist);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PostMinorChecklist && req.body.PostMinorChecklist.length >= 1) {
            const checklistObj = req.body.PostMinorChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PostMinorCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Post Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " post inspection Compeleted. Ready for Billing",
                    tab: "",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PostMajorChecklist && req.body.PostMajorChecklist.length >= 1) {
            const checklistObj = req.body.PostMajorChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PostMajorCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Post Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " post inspection Compeleted. Ready for Billing",
                    tab: "",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PostMoevChecklist && req.body.PostMoevChecklist.length >= 1) {
            const checklistObj = req.body.PostMoevChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PostMoevCheckList);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Post Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " post inspection Compeleted. Ready for Billing",
                    tab: "",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PostSun3WChecklist && req.body.PostSun3WChecklist.length >= 1) {
            const checklistObj = req.body.PostSun3WChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PostSun3WChecklist);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else if (req.body.PostSunMobChecklist && req.body.PostSunMobChecklist.length >= 1) {
            const checklistObj = req.body.PostSunMobChecklist[0];
            const createdDate = new Date();
            const rowsToInsert = await createRowInsertObject(createdBy, createdDate, checklistObj);
            createOrUpdateCheckList(rowsToInsert, PostSunMobChecklist);
            await sendNotificationDataToToken(saFcmToken.fcm_tocken,
                {
                    title: "Inspection Completed",
                    body: "Vehicle Number" + vehicleDetails.reg_no + " inspection Compeleted",
                    tab: "CGE",
                    visitID: vehicleDetails.id.toString()
                }
            )
        } else {
            return {
                status: false,
                message: "Checklist Save Failed"
            }
        }

        if ('PreReason' in req.body) {
            if (req.body.PreReason.length >= 1) {
                const preReasons = req.body.PreReason;
                const rowsToInsert = preReasons.map(item => ({
                    VISIT_ID: item.VISIT_ID,
                    INSPECTION_TYPE: item.INSPECTION_TYPE,
                    CHECKLIST_TYPE_CODE: item.CHECKLIST_TYPE_CODE,
                    PARAM_CHECKLIST_ID: item.PARAM_CODE,
                    RATING_CHECKLIST_ID: item.RATING_REASON_CODE,
                    RATING_REASON_REMARKS: item.RATING_REASON_REMARKS || null,
                    MEASUREMENT_READING: item.MEASUREMENT_READING || 0,
                    CREATED_BY: createdBy,
                    UPDATED_BY: createdBy,
                    CREATED_DATE: new Date(),
                    UPDATED_DATE: new Date()
                }));

                // To destroy old one and add new one 
                await PreReasonsModel.destroy({
                    where: { VISIT_ID: req.body.VISIT_ID }
                });
                const preReasonsSaved = await PreReasonsModel.bulkCreate(rowsToInsert, {
                    updateOnDuplicate: [
                        "RATING_REASON_REMARKS",
                        "MEASUREMENT_READING",
                        "updatedAt"
                    ]
                });

                if (preReasonsSaved[0] === 0) {
                    return {
                        status: false,
                        message: "PreReason Save Failed!"
                    }
                }
            }
        }

        if ('PDCDentScratch' in req.body) {
            if (req.body.PDCDentScratch.length >= 1) {
                const dentAndScratch = req.body.PDCDentScratch;
                const rowsToInsert = dentAndScratch.map(item => ({
                    VISIT_ID: item.VISIT_ID,
                    X_POINT: item.X_POINT,
                    Y_POINT: item.Y_POINT,
                    TYPE: item.TYPE,
                    COLOR_HEX: item.COLOR_HEX,
                    CREATED_DATE: new Date()
                }));

                // To destroy old one and add new one 
                await SavePDCDentAndScratch.destroy({
                    where: { VISIT_ID: req.body.VISIT_ID }
                });

                const dentAndScratchSaved = await SavePDCDentAndScratch.bulkCreate(rowsToInsert);

                if (dentAndScratchSaved[0] === 0) {
                    return { status: "false", message: "PDC Dent And Scratch Saved Failed!" };
                }
            }
        }

        if ('PDChecklist' in req.body) {
            if (req.body.PDChecklist.length >= 1) {
                const PDCChecklist = req.body.PDChecklist;
                const rowsToInsert = PDCChecklist.map(item => ({
                    VISIT_ID: item.VISIT_ID,
                    VEHICLE_PDC_VER: item.VEHICLE_PDC_VER,
                    VEHICLE_PDC_CODE: item.VEHICLE_PDC_CODE,
                    VEHICLE_PDC_REMARKS: item.VEHICLE_PDC_REMARKS,
                    AVAILABLE: item.AVAILABLE
                }));

                // To destroy old one and add new one 
                await SavePDCChecklist.destroy({
                    where: { VISIT_ID: req.body.VISIT_ID }
                });

                const PDCChecklistSaved = await SavePDCChecklist.bulkCreate(rowsToInsert);

                if (PDCChecklistSaved[0] === 0) {
                    return { status: "false", message: "PDC CheckList Save Failed!" };
                }
            }
        }

        if ('timeSpentArray' in req.body) {
            if (req.body.timeSpentArray.length >= 1) {
                const timeSpentArray = req.body.timeSpentArray;
                const rowsToInsert = timeSpentArray.map(item => ({
                    VISIT_ID: item.VISIT_ID,
                    START_TIME: item.START_TIME,
                    END_TIME: item.END_TIME,
                    TIME_SPENT: item.TIME_SPENT,
                    ACTIVITY_NAME: item.ACTIVITY_NAME
                }));

                // To destroy old one and add new one 
                await InspectionTime.destroy({
                    where: { VISIT_ID: req.body.VISIT_ID }
                });

                const timeSpentArraySaved = await InspectionTime.bulkCreate(rowsToInsert);

                if (timeSpentArraySaved[0] === 0) {
                    return { status: "false", message: "Time Spent Save Failed!" };
                }
            }
        }


        if ('PreMinorChecklist' in req.body || 'PreMajorChecklist' in req.body) {
            const visitAuditTrailINSPECTION_COMPLETED = await utils.updateAuditTrail(
                req.body.VISIT_ID,
                "INSPECTION_COMPLETED",
                req.body.userId,
                ""
            )
        }

        const visitAuditTrail = await utils.updateAuditTrail(
            req.body.VISIT_ID,
            req.body.Parent.VISIT_STATUS,
            req.body.userId,
            ""
        )

        if ('batteryTyre' in req.body) {
            if (req.body.batteryTyre.length >= 1) {
                const checklistObj = req.body.batteryTyre[0];
                const batteryData = {
                    BATTERY_MAKE: checklistObj.BATTERY_MAKE,
                    BATTERY_VOLTAGE: checklistObj.BATTERY_VOLTAGE,
                    TYRE_MAKE: checklistObj.TYRE_MAKE,
                    TYRE_SIZE: checklistObj.TYRE_SIZE,
                    FL_TREAD: checklistObj.FL_TREAD,
                    FR_TREAD: checklistObj.FR_TREAD,
                    RL_TREAD: checklistObj.RL_TREAD,
                    RR_TREAD: checklistObj.RR_TREAD,
                    VISIT_ID: checklistObj.VISIT_ID,
                    CREATED_BY: createdBy,
                    UPDATED_BY: createdBy,
                };
                const saveBatteryDetails = await BatteryDetails.upsert(batteryData);
                if (saveBatteryDetails[0] === 0) {
                    return {
                        status: false,
                        message: "Battery Save Failed!"
                    }
                }
            }
            if (req.body.technicianRemarks) {
                const saveTechnicanRemarks = await JobCard.update(
                    {
                        service_engineer_remarks: req.body.technicianRemarks,
                        fit_status: req.body.Parent.VISIT_STATUS
                    },
                    {
                        where: {
                            id: req.body.VISIT_ID
                        }
                    })
                if (saveTechnicanRemarks[0] === 0) {
                    return {
                        status: false,
                        message: "Save techinican Reamarks Save Failed!"
                    }
                } else {
                    return {
                        status: true,
                        message: "Save checklist Succesfull"
                    }
                }
            }
        } else {

            let saveTechnicanRemarks = "";


            if (req.body.technicianRemarks) {
                saveTechnicanRemarks = await JobCard.update(
                    {
                        service_engineer_remarks: req.body.technicianRemarks,
                        fit_status: req.body.Parent.VISIT_STATUS
                    },
                    {
                        where: {
                            id: req.body.VISIT_ID
                        }
                    })
            } else {
                saveTechnicanRemarks = await JobCard.update(
                    {
                        fit_status: req.body.Parent.VISIT_STATUS
                    },
                    {
                        where: {
                            id: req.body.VISIT_ID
                        }
                    })
            }
            if (saveTechnicanRemarks[0] === 0) {
                return {
                    status: false,
                    message: "Save techinican Reamarks Save Failed!"
                }
            } else {
                return {
                    status: true,
                    message: "Save checklist Succesfull"
                }
            }
        }


        return {
            status: true,
        }
    } catch (error) {
        logger.error('User Controller: Error in Checklists save', error);
        return {
            status: false,
            message: "Checklist Save Failed!"
        }
    }
}

async function createOrUpdateCheckList(data, checkListType) {
    try {

        // Upsert: create if doesn't exist, update if exists
        const ChecklistSaved = await checkListType.bulkCreate(data, {
            updateOnDuplicate: ["CONTENTS", "UPDATED_BY", "updatedAt"],
        });
        if (ChecklistSaved[0] === 0) {
            logger.error('User Controller: Error in Checklists save', error);
            return res.status(500).json({
                resultCode: 1,
                resultText: "failed",
                message: "Checklist Save Failed!"
            });
        }
    } catch (error) {
        return res.status(500).json({
            resultCode: 1,
            resultText: "failed",
            message: "Checklist Save Failed!"
        });
    }
}

async function createRowInsertObject(createdBy, createdDate, checklistObj) {
    const rowsToInsert = Object.entries(checklistObj)
        .filter(([key]) => !["VISIT_ID", "INSPECTION_TYPE", "INSPECTOR_ID", "INSPECTION_PERFORMED_TIME"].includes(key))
        .map(([key, value]) => ({
            VISIT_ID: checklistObj.VISIT_ID,
            CHECKLIST_ID: key,
            CONTENTS: value,
            CREATED_BY: createdBy,
            CREATED_DATE: createdDate,
            UPDATED_BY: createdBy,
            UPDATED_DATE: createdDate
        }));

    return rowsToInsert;
}


const CheckListDao = {
    getCheckListData,
    saveCheckList
};

export default CheckListDao;