import db from '../index.js'
import axios from "axios";
import https from "https";
import logger from '../../config/logger.js';
import { stat } from 'fs';
import utils from './../Utils/Utils.js';
import { Op, Sequelize } from 'sequelize';
import ClickinsCallback from './models/clickinCallBack.js';

const otherCredentials = db.otherCredentialsSettings;
const clickinStaus = db.clickinStatus;
const jobCard = db.jobCard;
const clickinCallBack = db.clickinsCallback;
const users = db.users;
const employees = db.employees;
const outlet = db.outlets;
const masterPartsItem = db.clickInPart;
const ClickinsPartsSendToDMS = db.clickInPart;
const ClicksEstimateFromDMS = db.clickInPart;

const getInspectionLink = async (req) => {
    const inspectionLink = await otherCredentials.findOne({
        where: {
            TYPE: "CLICKINS"
        }
    });

    const url = "https://app.click-ins.com/?token=";

    if (inspectionLink) {
        let now = new Date();
        const expiryTime = inspectionLink.EXPIRE_TIME
        console.log("now", now);
        console.log("inspectionLink", inspectionLink.EXPIRE_TIME);
        console.log("inspectionLink", inspectionLink);
        console.log("expiryTime", expiryTime);

        if (expiryTime > now) {
            return {
                status: true,
                token: url + inspectionLink.AUTHTOKEN
            }
        } else {
            const token = await callClickins();
            if (token.status) {
                const seconds = Math.floor(Date.now() / 1000) + token.token.expires_in;
                const token_type = token.token.token_type;
                const expiryDate = new Date(seconds * 1000)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ");
                const formattedDate = new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ");

                const updateToken = await otherCredentials.update({
                    AUTHTOKEN: token.token.access_token,
                    TOKEN_TYPE: token_type,
                    EXPIRE_TIME: expiryDate,
                    UPDATED_BY: req.userId,
                    UPDATED_DATE: formattedDate
                }, {
                    where: {
                        TYPE: "CLICKINS"
                    }
                })

                if (updateToken[0] == 1) {
                    return {
                        status: true,
                        token: url + token.token.access_token
                    }
                }
            } else {
                return {
                    status: false,
                    ErrorDescription: token.message
                }
            }
        }
    } else {
        return {
            status: false
        };
    }
}

const callClickins = async () => {
    const token = await getAuthTokenAPI("POST", "rest/v2/oauth2/token");
    if (!token.status) {
        return {
            status: true,
            token: token
        };
    } else {
        return {
            status: false,
            message: token.Detail
        }
    }
}

const getAuthTokenAPI = async (method, url, data = {}) => {
    try {
        url = "https://api.click-ins.com/" + url;

        const payload = new URLSearchParams({
            grant_type: "client_credentials",
            client_secret: "393d0b94-95e4-4cf6-9f47-b081fc793cff",
            redirect_url: "https://tvsfit.mytvs.in/reporting/vrm/landingpages/dashboards/frontend/tvsaa/login",
            fail_url: "https://tvsfit.mytvs.in/reporting/vrm/landingpages/dashboards/frontend/v1/login/mytvs"
        });

        let response;

        if (method === "POST") {
            response = await axios.post(url, payload.toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false // equivalent to CURLOPT_SSL_VERIFYPEER false
                })
            });
        } else {
            // GET or others
            const fullUrl = `${url}?${payload.toString()}`;
            response = await axios.get(fullUrl, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        }

        let result = response.data;

        // Convert to string and clean like PHP
        if (typeof result !== "string") {
            result = JSON.stringify(result);
        }

        // Remove unwanted characters (same regex)
        result = result.replace(/[\x00-\x1F\x80-\xFF]/g, "");

        // Parse JSON
        result = JSON.parse(result);

        return result;

    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}

const clickinautosaveestimate = async (req) => {
    const updateJobCard = await jobCard.update({
        clickin_inspection_id: req.INSPECTION_ID
    }, {
        where: {
            id: req.VISIT_ID
        }
    })

    if (updateJobCard[0] == 1) {
        const updateStatus = await clickinStaus.upsert({
            CLICK_INS_STATUS: "COMPLETED",
            VISIT_ID: req.VISIT_ID,
            UPDATED_DATE: utils.getDateTime(),
            CREATED_DATE: utils.getDateTime()
        })
        return {
            status: true
        }
    } else {
        return {
            status: false,
            message: "Update JobCard Failed !"
        }
    }
}

const clickinpostcallback = async (req) => {
    const createCallBack = await clickinCallBack.create({
        VISIT_ID: req.VISIT_ID,
        INSPECTION_ID: req.inspection_case.inspection_case_id,
        CONTENT: JSON.stringify(req),
        CREATED_DATE: utils.getDateTime(),
        UPDATED_DATE: utils.getDateTime()
    })

    getLabourDetails(req);

    if (createCallBack[0] == 1) {
        return {
            status: true,
        }
    } else {
        return {
            status: false,
            message: "Insert failed!"
        }
    }
}

const getLabourDetails = async (reqData) => {

    const inspectionId = reqData.inspection_case.inspection_case_id;
    const visitId = reqData.VISIT_ID;

    const jobCardData = await jobCard.findOne({
        where: {
            id: reqData.VISIT_ID
        }
    })


    const getOutletId = await users.findOne({
        where: {
            id: jobCardData.assigned_sa_id
        },
        include: [{
            model: employees,
            as: 'employee',
            include: [{
                model: db.outlets,
                as: 'outlet'
            }]
        }]
    })

    const outletId = getOutletId.employee.outletId;
    const outletState = getOutletId.employee.outlet.state;

    const queryResult = await clickinCallBack.findAll({
        attributes: ["CONTENT"],
        where: {
            CONTENT: { [Op.ne]: null },
            [Op.and]: [
                Sequelize.literal("CONTENT != 'null'"),
                Sequelize.literal("JSON_VALID(CONTENT)"),
                Sequelize.where(
                    Sequelize.fn(
                        "JSON_UNQUOTE",
                        Sequelize.fn(
                            "JSON_EXTRACT",
                            Sequelize.col("CONTENT"),
                            "$.inspection_case.inspection_case_id"
                        )
                    ),
                    {
                        [Op.in]: Array.isArray(inspectionId)
                            ? inspectionId
                            : [inspectionId]
                    }
                )
            ]
        },
        raw: true
    });

    if (!queryResult.length) return { Estimation: [] };

    const inspection = JSON.parse(queryResult[0].CONTENT);

    // ✅ Process damage recognition
    Object.keys(inspection).forEach((key) => {
        if (key.toLowerCase() === "damage_recognition") {
            inspection[key].forEach((value2) => {
                const damage = value2.damage_severity * 100;
                const damageType = value2.damage_type;
                const partName = value2.part?.part_name;

                if (!partName) return;

                if (damage >= 40) {
                    panel[partName] = "Replace";
                } else if (damage > 1) {
                    switch (damageType) {
                        case 4: // Dent 
                        case 12: // Scratch
                        case 54: // Paint Peel 
                            panel[partName] = "Repair";
                            break;

                        case 51: // Rust 
                            panel[partName] = damage > 40 ? "Replace" : "Repair";
                            break;

                        case 6: // Crack 
                        case 52: // Broken Light 
                        case 53: // Detachemnt 
                            panel[partName] = "Replace";
                            break;
                    }
                }
            });
        }
    });

    let partsInsertData = [];
    let estimateInsertData = [];

    // ✅ Loop panels
    for (const [key, value] of Object.entries(panel)) {
        const partData = await masterPartsItem.findOne({
            attributes: ["PANEL_NAME"],
            where: {
                CLICKINS_NAME: key
            },
            raw: true
        });

        if (!partData) continue;

        // ✅ Insert Parts
        partsInsertData.push({
            VISIT_ID: visitId,
            REPAIR_TYPE: key,
            REPAIRS: partData.PANEL_NAME,
            CREATED_BY: userName,
            CREATED_DATE: new Date(),
            UPDATED_BY: userName,
            UPDATED_DATE: new Date()
        });

        // ✅ Call external DMS : TODO : NEED TO CHECK WITH DMS AND HARMAN SIR FOR THIS FROM HERE 
        const dmsResponse = await searchLaborDetails(
            outletId,
            jobCardData.reg_no,
            partData.PANEL_NAME,
            value
        );

        if (!dmsResponse?.laborSearchResult) continue;

        let count = 0;

        for (const value1 of dmsResponse.laborSearchResult) {
            if (!value1.osl && count === 0) {
                count++;

                const response = {
                    laborId: value1.id,
                    laborCode: value1.labourCode,
                    laborDescription: value1.labourDescription,
                    sacCode: value1.sacCode,
                    sgst: value1.sgst,
                    cgst: value1.cgst,
                    igst: value1.igst,
                    rate: value1.labourPrice,
                    singleAmount: value1.labourPrice,
                    discountAmount: "0",
                    additionalMargin: "0",
                    serviceRecommendation: false,
                    quantity: 1,
                    laborTotal: await getTotal(
                        value1.sgst,
                        value1.cgst,
                        value1.igst,
                        value1.labourPrice,
                        visitId,
                        outletState
                    )
                };

                const returnValue = {
                    VISIT_ID: visitId,
                    ESTIMATE_ID: "",
                    ESTIMATION_TYPE: "LABOUR",
                    ESTIMATION_APPROVAL_STATUS: 1,
                    ESTIMATION_OBJECT_ID: value1.id,
                    ESTIMATION_OBJECT: response
                };

                finalResponse.push(returnValue);

                // ✅ Insert Estimate
                estimateInsertData.push({
                    VISIT_ID: visitId,
                    ESTIMATE: JSON.stringify(response),
                    CREATED_BY: userName,
                    CREATED_DATE: new Date(),
                    UPDATED_BY: userName,
                    UPDATED_DATE: new Date()
                });
            }
        }

        // TILL HERE 

    }


    // ✅ Bulk Insert (equivalent to REPLACE INTO → use upsert/bulkCreate)
    if (partsInsertData.length) {
        await ClickinsPartsSendToDMS.bulkCreate(
            partsInsertData
        );
    }

    if (estimateInsertData.length) {
        await ClicksEstimateFromDMS.bulkCreate(
            estimateInsertData
        );
    }

    return {
        Estimation: finalResponse
    };

}

const getTotal = async (sgst, cgst, igst, rate, visitId, outletState) => {
    let newSgst = 0;
    let newCgst = 0;
    let newIgst = 0;
    let total = 0;

    if (sgst) newSgst = sgst;
    if (cgst) newCgst = cgst;
    if (igst) newIgst = igst;
    if (rate) total = rate;

    // assuming GetStateFromVisit is an async DB call using Sequelize
    const visitState = await GetStateFromVisit(visitId);

    if (visitState === outletState) {
        total =
            total +
            (total * newCgst) / 100 +
            (total * newSgst) / 100;
    } else {
        total = total + (total * newIgst) / 100;
    }

    return Math.round(total * 100) / 100; // round to 2 decimal places
};

const dao = {
    getInspectionLink,
    clickinautosaveestimate,
    clickinpostcallback
};

export default dao;