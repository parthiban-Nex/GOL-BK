import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, Sequelize, fn, col, where } from 'sequelize';
import axios from "axios";
import { Parser } from "xml2js";
import utils from '../Utils/Utils.js';

const User = db.users;
const Employee = db.employees;
const Model = db.models;
const Make = db.makes;
const JobCard = db.jobCard;
const OutletSettings = db.outletSettings;
const CustomerVisitChecklist = db.saveCheckListType; 
const Outlet = db.outlets;
const VehicleDetails = db.vehicles;
const FlaData = db.flaData;
const CarpmRecord = db.carpmRecords; 


const carpmScanRequired = async (req) => {

    const result = await User.findOne({
        where: { id: req.body.userId },
        attributes: ["id"],
        include: [
            {
                model: Employee,
                as: "employee",
                attributes: ["outletId"],
                include: [
                    {
                        model: OutletSettings,
                        attributes: ["OUTLET_ID", "CONFIG", "VALUE"],
                        as: "outletSetting",   // 👈 must match alias
                        required: true,  // 👈 ensures only rows with matching OutletSettings are returned
                        where: {
                            CONFIG: "CARPM SCANNING_MANDATORY",
                            VALUE: "true"
                        }
                    },
                ],
                required: true
            },
            {
                // Change the model to job card and check and get the jobcard id and match with visit id 
                // and in job card take with created by and match with user id
                model: JobCard,
                attributes: ['vehicle_id'],
                as: "jobCard",
                required: true,
                where: {
                    [db.Sequelize.Op.and]: [
                        {
                            [db.Sequelize.Op.or]: [
                                { assigned_sa_id: req.body.userId },
                                { assigned_tech_id: req.body.userId }
                            ]
                        },
                        { id: req.body.VISIT_ID } // exact match for visit_id
                    ]
                },
                include: [
                    {
                        model: CustomerVisitChecklist,
                        attributes: ["CHECKLIST_TYPE_CODE", "VISIT_ID"],
                        as: "checklistType",
                        required: true,
                        where: {
                            CHECKLIST_TYPE_CODE: "CHK_LIST_MAJOR",
                            VISIT_ID: req.body.VISIT_ID
                        },
                        required: true
                    },
                    {
                        model: VehicleDetails,
                        attributes: ["makeId", "fuelType"],
                        as: "vehicleDetails",
                        required: true,
                        where: {
                            fuelType: { [Op.ne]: "Electric" }
                        },
                        include: [
                            {
                                model: Make,
                                attributes: [],
                                as: "makeDetails",
                                required: true,
                                where: {
                                    makeName: { [Op.ne]: "Others" }
                                },
                                required: true
                            },
                        ]
                    },
                ]

            }
        ],
        raw: false
    });

    if (result == null) {
        return { status: "Error", message: "CARPM scanning is not enabled" };
    } else {
        return { status: "Success", message: "Carpm Scan required" };
    }
}

const carpmscanvalidcheck = async (req, res) => {
    try {

        if (req.body.VISIT_ID == null) {
            return { status: "Error", message: "Missing Parameter VISIT_ID" }
        } else {
            const chasisNumber = req.body.chasisNumber;
            const trimmedChasis = chasisNumber.startsWith("00") ? chasisNumber.slice(2) : chasisNumber;

            if (req.body.userId.includes("TEST") || !chasisNumber || chasisNumber === null || String(chasisNumber).toLowerCase() === "null") {
                isScanSuccess('true', req.body.VISIT_ID);
                return { status: "Success", message: "chasisNumber is matching" }
            } else {
                const vehicle = await JobCard.findOne({
                    where: {
                        id: req.body.VISIT_ID
                    },
                    include: [
                        {
                            model: VehicleDetails,
                            attributes: ['chassisNumber', 'registrationNumber'],
                            as: "vehicleDetails",
                            required: true,
                            where: {
                                [Op.or]: [
                                    // match first 17 chars to full input
                                    where(fn('SUBSTRING', col('chassisNumber'), 1, 17), chasisNumber),

                                    // match first 17 chars to trimmed input if it starts with "00"
                                    chasisNumber.startsWith("00")
                                        ? where(fn('SUBSTRING', col('chassisNumber'), 1, 17), trimmedChasis)
                                        : null
                                ].filter(Boolean) // remove nulls if input doesn't start with "00"
                            }
                        }
                    ]
                });

                if (vehicle !== null) {
                    isScanSuccess('true', req.body.VISIT_ID);
                    return { status: "Success", message: "chasisNumber is matching" }
                } else {

                    const vehicleNumber = await JobCard.findOne({
                        where: {
                            id: req.body.VISIT_ID
                        },
                        include: [
                            {
                                model: VehicleDetails,
                                attributes: ['chassisNumber', 'registrationNumber'],
                                as: "vehicleDetails",
                                required: true
                            }
                        ]
                    })
                    const flaData = await FlaData.findOne({
                        attributes: ['VEHICLE_CHASI_NO'],
                        where: {
                            VEHICLE_REGISTRATION_NUMBER: vehicleNumber.vehicleDetails.registrationNumber
                        }
                    })

                    if (flaData !== null) {
                        const dbChassis = flaData.VEHICLE_CHASI_NO;
                        if (dbChassis.substring(0, 17) === trimmedChasis) {
                            isScanSuccess('true', req.body.VISIT_ID);
                            return { status: "Success", message: "chasisNumber is matching" }
                        } else {
                            isScanSuccess('false', req.body.VISIT_ID);
                            return { status: "Success", message: "chasisNumber does not match, Plesae scan with exact vehicle" }
                        }
                    } else {
                        const flaApiResults = await callflaAPI("GET", "ka09p2362"); // replace with actual vehicle number

                        const flaVehicle = flaApiResults.results[0].vehicle;
                        const hypth = flaApiResults.results[0].hypth;
                        const insurance = flaApiResults.results[0].insurance;

                        const getValue = (obj, key) => obj?.[key] ?? '';


                        const vehicleFlaAdd = await FlaData.create({
                            ACCESS_TOKEN: "TVST410PROD",
                            VEHICLE_REGISTRATION_NUMBER: getValue(flaVehicle, 'regn_no'),
                            VEHICLE_STATE_CODE: getValue(flaVehicle, 'state_cd'),
                            VEHICLE_RTO_CODE: getValue(flaVehicle, 'rto_cd'),
                            VEHICLE_RTO_NAME: getValue(flaVehicle, 'rto_name'),
                            VEHICLE_CHASI_NO: getValue(flaVehicle, 'chasi_no'),
                            VEHICLE_ENGINE_NO: getValue(flaVehicle, 'eng_no'),
                            VEHICLE_REGISTERED_DATE: getValue(flaVehicle, 'regn_dt'),
                            VEHICLE_AGE: getValue(flaVehicle, 'vehicle_age'),
                            VEHICLE_PURCHASE_DATE: getValue(flaVehicle, 'purchase_dt'),
                            VEHICLE_CLASS_DESCRIPTION: getValue(flaVehicle, 'vh_class_desc'),
                            VEHICLE_OWNER_SR: getValue(flaVehicle, 'owner_sr'),
                            VEHICLE_PUCC_NO: getValue(flaVehicle, 'pucc_no'),
                            VEHICLE_PERMANENT_ADDRESS: getValue(flaVehicle, 'pAddress'),
                            VEHICLE_CURRENT_ADDRESS: getValue(flaVehicle, 'cAddress'),
                            VEHICLE_MAKE: getValue(flaVehicle, 'maker_desc'),
                            VEHICLE_MODEL: getValue(flaVehicle, 'maker_model'),
                            VEHICLE_COLOR: getValue(flaVehicle, 'color'),
                            VEHICLE_FUEL_TYPE: getValue(flaVehicle, 'fuel_type_desc'),
                            VEHICLE_CUBIC_CAPACITY: getValue(flaVehicle, 'cubic_cap'),
                            VEHICLE_MANUFACTURE_YEAR: getValue(flaVehicle, 'manu_yr'),
                            VEHICLE_SEAT_CAPACITY: getValue(flaVehicle, 'seat_cap'),
                            VEHICLE_FLA_RTO_GEO: getValue(flaVehicle, 'fla_rto_geo'),
                            VEHICLE_BLACKLIST_FLAG: getValue(flaVehicle, 'blacklist_flag'),
                            VEHICLE_BLACKLIST_STATUS: getValue(flaVehicle, 'blacklist_status'),
                            VEHICLE_FIT_UPTO: getValue(flaVehicle, 'fit_upto'),
                            VEHICLE_MANUFACTURE_MONTH_YEAR: getValue(flaVehicle, 'manu_month_yr'),
                            VEHICLE_NOC_DETAILS: getValue(flaVehicle, 'noc_details'),
                            VEHICLE_PERMIT_ISSUE_DATE: getValue(flaVehicle, 'permit_issue_dt'),
                            VEHICLE_PERMIT_NUMBER: getValue(flaVehicle, 'permit_no'),
                            VEHICLE_PERMIT_TYPE: getValue(flaVehicle, 'permit_type'),
                            VEHICLE_COMMERCIAL_FLAG: getValue(flaVehicle, 'commercial_flag'),
                            VEHICLE_PERMIT_VALID_FROM: getValue(flaVehicle, 'permit_valid_from'),
                            VEHICLE_PERMIT_VALID_UPTO: getValue(flaVehicle, 'permit_valid_upto'),
                            VEHICLE_PUCC_UPTO: getValue(flaVehicle, 'pucc_upto'),
                            VEHICLE_REGISTERED_AT: getValue(flaVehicle, 'registered_at'),
                            VEHICLE_TAX_UPTO: getValue(flaVehicle, 'tax_upto'),
                            VEHICLE_FATHER_NAME: getValue(flaVehicle, 'father_name'),
                            VEHICLE_OWNER_NAME: getValue(flaVehicle, 'owner_name'),
                            HYPTH_FNCR_NAME: getValue(hypth, 'fncr_name'),
                            HYPTH_PUCC_NO: getValue(hypth, 'pucc_no'),
                            INSURANCE_POLICY_NUMBER: getValue(insurance, 'insurance_policy_no'),
                            INSURANCE_ISEXPIRED: getValue(insurance, 'insurance_expired'),
                            INSURANCE_COMPANY: getValue(insurance, 'insurance_comp'),
                            INSURANCE_PUCC_NO: getValue(insurance, 'pucc_no'),
                            INSURANCE_EXPIRY_DATE: getValue(insurance, 'insurance_upto'),
                            CREATED_BY: req.body.userId,
                            UPDATED_BY: req.body.userId
                        });

                        if (vehicleFlaAdd) {
                            const flaNewData = await FlaData.findOne({
                                attributes: ['VEHICLE_CHASI_NO'],
                                where: {
                                    VEHICLE_REGISTRATION_NUMBER: vehicleNumber.vehicleDetails.registrationNumber
                                }
                            })

                            if (flaNewData !== null) {
                                const dbChassis = flaNewData.VEHICLE_CHASI_NO;
                                if (dbChassis.substring(0, 17) === trimmedChasis) {
                                    isScanSuccess('true', req.body.VISIT_ID);
                                    return { status: "Success", message: "chasisNumber is matching" }
                                } else {
                                    isScanSuccess('false', req.body.VISIT_ID);
                                    return { status: "Success", message: "chasisNumber does not match, Plesae scan with exact vehicle" }
                                }
                            } else {
                                isScanSuccess('false', req.body.VISIT_ID);
                                return { status: "Error", message: "Unable to Find Fla Data" }
                            }
                        } else {
                            isScanSuccess('false', req.body.VISIT_ID);
                            return { status: "Error", message: "Unable to Add Fla Data" }
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error("Callback error:", err.message);
        return { status: "Error", message: "Server error" };
    }
}

const savecarpmstatus = async (req) => {
    const savestaus = await db.carpmstatusdata.create({
        visit_id: req.visitId,
        type: req.scanType,
        status: req.status,
        created_by: req.userId,
        user_id: req.userId,
        created_at: utils.getDateTime()
    })

    if (savestaus) {
        return {
            status: 'Success'
        }
    } else {
        return {
            status: false
        }
    }
}

async function isScanSuccess(isSuccess, VisitId) {
    try {
        const record = await CarpmRecord.findOne({
            where: { VISIT_ID: VisitId },
            order: [['createdAt', 'DESC']]
        });

        if (record) {
            record.IS_SUCCESS = (isSuccess === 'true'); // convert string → boolean
            await record.save();
            console.log("Updated successfully");
            return true;
        }

        console.log("No record found for VisitId:", VisitId);
        return false;

    } catch (error) {
        console.error("Error updating:", error);
        return false;
    }
}

async function callflaAPI(method, vehicleNumber, data = null) {
    const baseurl = "https://web.fastlaneindia.com/vin/api/v1.3/vehicle?";
    const url = `${baseurl}regn_no=${vehicleNumber}`;


    const Username = "TVST410PROD";
    const Password = "T1V2S3@123!@#";

    try {
        const options = {
            method: method,
            url: url,
            headers: { "Content-Type": "application/json" },
            auth: {
                username: Username,
                password: Password,
            },
            data: data ? JSON.stringify(data) : null,
            validateStatus: () => true, // allow handling non-200
        };

        const response = await axios(options);

        const httpcode = response.status;
        let result = response.data;

        // API returns XML, convert to JSON
        if (typeof result === "string") {
            const parser = new xml2js.Parser({ explicitArray: false });
            result = await parser.parseStringPromise(result);
        }

        // add apiSuccess + error handling like PHP
        if (httpcode === 200) {
            result.apiSuccess = true;
        } else if (httpcode === 404) {
            result = { apiSuccess: false, message: "URL not found" };
        } else if (httpcode === 401) {
            result = { apiSuccess: false, message: "Authentication error" };
        } else {
            console.error("Response error:", result);
            result = { apiSuccess: false, message: "Unknown error" };
        }

        result.httpcode = httpcode;

        return result;
    } catch (err) {
        return { apiSuccess: false, message: err.message };
    }
}

const CarpmDao = {
    carpmScanRequired,
    carpmscanvalidcheck,
    callflaAPI,
    savecarpmstatus
};

export default CarpmDao;