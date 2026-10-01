import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, Sequelize, col, literal } from 'sequelize';

const Make = db.makes;
const Model = db.models;
const Customertype = db.customertypes;
const Varient = db.varients;
const RepairType = db.repairtypes;
const ServiceType = db.servicetypes;
const Source = db.sources;
const SourceType = db.sourcetypes;
const Employee = db.employees;
const Pincode = db.pincodes;
const MakeCompanyMap = db.makecompanymaps;
const ModelCompanyMap = db.modelcompanymaps;
const Fuel = db.fueltypes;
const RepairTypeCompanyMap = db.repairtypecompanymaps;
const ServiceTypeCompanyMap = db.servicetypecompanymaps;
const SourceCompanyMap = db.sourcecompanymaps;
const SourceTypeCompanyMap = db.sourcetypecompanymaps;
const Vendors = db.vendors;
const VendorCompanyMap = db.vendorcompanymaps;
const insurance = db.insurances;
const insuranceAddress = db.insuranceAddress;
const JobTypes = [{ jobType: "SQRT" }, { jobType: "ASQRT" }];
const DocumentType = [{ jobType: "RJC" }, { jobType: "AJC" }];
const UserRoleMaps = db.userrolemaps;
const User = db.users;
const Outlet = db.outlets;
const OutletSettings = db.outletSettings;
const CustomerAccountSettings = db.customerAccountSettings;
const InventoryCheckList = db.vehicleInventoryCheckList;
const InspectionCheckList = db.inspectionChekList;
const InspectionReason = db.inspectionRatingReason;
const checklistType = db.checkListTypes;
const subsystemMap = db.inspectionSubsystemMap
const predeliveryCheckList = db.predeliveryCheckList;
const leadDisposition = db.dispositions;
const pickupTypeData = db.pickupTypes;
const inventoryPhotoData = db.inventoryPhotoCategory;
const Battery = db.batteryOem;
const tyre = db.tyreOem;
const tyresize = db.tyreSize;

const JobCardStatus = [
    {
        jcStatusId: 1,
        jcStatus: "Open"
    },
    {
        jcStatusId: 2,
        jcStatus: "Work In Progress"
    },
    {
        jcStatusId: 3,
        jcStatus: "Ready For Billing"
    },
    {
        jcStatusId: 4,
        jcStatus: "Billing"
    },
    {
        jcStatusId: 5,
        jcStatus: "Delivered"
    }
];

const getMastersData = async (userId, reqData) => {
    let data = {};
    let requestCustomerType = '';
    const settingTypes = [
        'CHECKGAADI_BASE_URL',
        'DMS_BASE_URL',
        'DMS_TEST_BASE_URL',
        'DIAGNOSTICS_AUTOSENSE_BASE_URL',
        'DIAGNOSTICS_REDSUN_BASE_URL',
        'DIAGNOSTICS_TIMEOUT',
        'MAX_INVENTORY_PHOTO_COUNT',
        'LABOUR_PRICE_EDITABLE',
        'TECH_ASSIST_URL',
        'CHECKGAADI_BASE_URL_PHOTO',
        'MIN_INVENTORY_PHOTO_COUNT',
        'OSL_PRICE_EDITABLE',
        'PARTS_PRICE_EDITABLE',
        'MAX_LABOUR_QUANTITY',
        'MAX_OSL_QUANTITY',
        'MIN_INSPECTION_PHOTO_COUNT',
        'MAX_INSPECTION_PHOTO_COUNT',
        'SERVICE_RECOMMENDATION_OUTLET',
        'SHOW_COVID_CHECKLIST',
        'MIN_PDC_PHOTO_COUNT',
        'MAX_PDC_PHOTO_COUNT',
        'VISIT_REPEAT_THRESHOLD',
        'AGENT_DETAILS',
        'GATEIN THRESHOLD',
        'PHOTO_AUTH_TOKEN_CA'
    ];
    try {
        data.make = await Make.findAll({
            where: { status: 1 },
            include: [
                { model: MakeCompanyMap, as: 'makecompanymaps' }
            ]
        });
        data.model = await Model.findAll({
            where: { status: 1 },
            include: [
                { model: ModelCompanyMap, as: 'modelcompanymaps' }
            ]
        });
        data.variant = await Varient.findAll();
        data.repairType = await RepairType.findAll({
            include: [
                { model: RepairTypeCompanyMap, as: 'repairtypecompanymap' }
            ]
        });
        data.serviceType = await ServiceType.findAll({
            include: [
                { model: ServiceTypeCompanyMap, as: 'servicetypecompanymap' }
            ]
        });
        data.sources = await Source.findAll({
            include: [
                { model: SourceCompanyMap, as: 'sourcecompanymap' }
            ]
        });
        data.sourcetypes = await SourceType.findAll({
            include: [
                { model: SourceTypeCompanyMap, as: 'sourcetypecompanymap' }
            ]
        });
        const userOutlet = await User.findOne({
            where: {
                id: userId
            },
            include: [{
                model: Employee,
                as: 'employee'
            }]
        })
        data.employees = await User.findAll({
            include: [
                {
                    model: UserRoleMaps,
                    as: 'userrolemaps'
                }, {
                    model: Employee,
                    as: 'employee',
                    where: {
                        outletId: userOutlet.employee.outletId
                    }
                },
            ],
            raw: true
        })
        data.BackendConfiguration = await CustomerAccountSettings.findAll({
            attributes: ["SETTING_TYPE", "SETTING_VALUE"],
            where: {
                SETTING_TYPE: { [Op.in]: settingTypes }
            },
            raw: true
        });

        if (reqData.CustomerAccountType == "PV") {
            requestCustomerType = 'CAR_INSPECTION';
        } else if (reqData.CustomerAccountType == "MOEV") {
            requestCustomerType = 'MOEV_INSPECTION';
        } else if (reqData.CustomerAccountType == "3W_SUN") {
            requestCustomerType = 'SUN_3W_INSPECTION';
        } else if (reqData.CustomerAccountType == "2W_SUN") {
            requestCustomerType = 'SUN_MOB_INSPECTION';
        }
        data.InventoryCheckList = await InventoryCheckList.findAll({
            where: { VEHICLE_TYPE: requestCustomerType, ACTIVE: 1, INVENTORY_TYPE: "INV" },
            order: [['ID', 'DESC']],
            attributes: [
                'ID',
                'INVENTORY_CODE',
                'INVENTORY_DESC',
                'INVENTORY_VER',
                'INVENTORY_TYPE',
                'VEHICLE_TYPE',
                'SORT_ORDER',
                'ACTIVE',
            ],
            raw: true
        });

        if (reqData.CustomerAccountType == "PV") {
            requestCustomerType = 'CAR_INSPECTION';
        } else if (reqData.CustomerAccountType == "MOEV") {
            requestCustomerType = 'MOEV_INSPECTION';
        } else if (reqData.CustomerAccountType == "3W_SUN") {
            requestCustomerType = 'SUN_3W_INSPECTIO';
        } else if (reqData.CustomerAccountType == "2W_SUN") {
            requestCustomerType = 'SUNMOBINSPECTION';
        }
        data.InspectionCheckList = await InspectionCheckList.findAll({
            attributes: [
                "CHECKLIST_VERSION",
                "CHECKLIST_TYPE_CODE",
                "PARAM_CODE",
                "UNIQUE_PARAM_ID",
                "PARAM_NAME",
                "OPTIONAL",
                "SUB_SYSTEM_ID",
                "VALUE_REQUIRED"
            ],
            include: [
                {
                    model: InspectionReason,
                    as: "RatingReasons",
                    attributes: ["UNIQUE_RATING_REASON_ID", "RATING_REASON_CODE", "RATING_REASON_DESC"],
                    required: false, // LEFT JOIN
                    on: {
                        CHECKLIST_TYPE_CODE: { [Op.eq]: col("vrm_master_inspection_checklist.CHECKLIST_TYPE_CODE") },
                        CHECKLIST_VERSION: { [Op.eq]: col("vrm_master_inspection_checklist.CHECKLIST_VERSION") },
                        PARAM_CODE: { [Op.eq]: col("vrm_master_inspection_checklist.PARAM_CODE") }
                    }
                }
            ],
            where: {
                INSPECTION_TYPE: requestCustomerType,
                ACTIVE: 1,
                CHECKLIST_VERSION: literal(`(
                    SELECT MAX(C.CHECKLIST_VERSION) 
                    FROM vrm_master_inspection_checklist C 
                    WHERE C.ACTIVE = 1
                    )`)
            },
            order: [
                ["CHECKLIST_TYPE_CODE", "ASC"],
                ["SUB_SYSTEM_ID", "ASC"],
                ["SORT_ORDER", "ASC"]
            ],
            raw: true
        });
        data.subsystemMap = await subsystemMap.findAll({
            where: {
                ACTIVE: 1
            }
        });
        data.checkListTypes = await checklistType.findAll({
            where: {
                CUSTOMER_ACCOUNT_TYPE_ID: reqData.CustomerAccountType
            }
        })
        data.predeliveryCheckList = await predeliveryCheckList.findAll({
            where: {
                VEHICLE_TYPE: "PV"
            }
        });
        data.leadDisposition = await leadDisposition.findAll();
        data.pickupTypes = await pickupTypeData.findAll({
            where: {
                STATUS: 1
            }
        });
        data.customertype = await Customertype.findAll();
        data.pincode = await Pincode.findAll({
            // attributes: [
            //     [ Sequelize.fn('DISTINCT', Sequelize.col('District')), 'District'],
            // ]
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
                [Sequelize.fn('MIN', Sequelize.col('cv_stateId')), 'cv_stateId'],
                [Sequelize.fn('MIN', Sequelize.col('cv_cityId')), 'cv_cityId'],
                [Sequelize.fn('MIN', Sequelize.col('StateName')), 'StateName'],
                [Sequelize.fn('MIN', Sequelize.col('District')), 'District'], // Get the minimum ID for each StateName
                [Sequelize.col('Pincode'), 'Pincode'] // Select StateName directly
            ],
            group: ['Pincode']
        });
        data.vendors = await Vendors.findAll({
            include: [
                { model: VendorCompanyMap, as: 'vendorcompanymap' }
            ],
            where: {
                vendorType: "OSL"
            }
        });
        data.insurance = await insurance.findAll({
            include: [
                { model: insuranceAddress, as: 'insuranceAddress' }
            ]
        })

        if (reqData.CustomerAccountType == "PV") {
            requestCustomerType = 'PV';
        } else {
            requestCustomerType = 'SUNMOB';
        }

        data.inventoryPhotoCategory = await inventoryPhotoData.findAll({
            where: {
                VEHICLE_TYPE: requestCustomerType,
                ACTIVE: "1"
            }
        })
        data.jobTypes = JobTypes;
        data.DocumentType = DocumentType;
        data.JobCardStatus = JobCardStatus;
        data.fuel = await Fuel.findAll();
        data.batteryOem = await Battery.findAll();
        data.tyreOem = await tyre.findAll();
        data.tyreSize = await tyresize.findAll();

        return data;
    } catch (err) {
        logger.error('masters dao getMastersData error: ', err);
    }
};

const pincodeMaster = async (userId) => {
    let data = {};
    try {



        data.pincode = await Pincode.findAll({
            // attributes: [
            //     [ Sequelize.fn('DISTINCT', Sequelize.col('District')), 'District'],
            // ]
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
                [Sequelize.fn('MIN', Sequelize.col('cv_stateId')), 'cv_stateId'],
                [Sequelize.fn('MIN', Sequelize.col('cv_cityId')), 'cv_cityId'],
                [Sequelize.fn('MIN', Sequelize.col('StateName')), 'StateName'],
                [Sequelize.fn('MIN', Sequelize.col('District')), 'District'], // Get the minimum ID for each StateName
                [Sequelize.col('Pincode'), 'Pincode'] // Select StateName directly
            ],
            group: ['Pincode']
        });


        return data;
    } catch (err) {
        logger.error('masters dao pincodeMaster error: ', err);
    }
};


const checkAppVersion = async (req) => {
    const OutletCustomerId = await User.findOne({
        where: { id: req.body.userId },
        attributes: ["id", "employeeId", "referesh_required", "fcm_tocken"],
        include: [
            {
                model: Employee,
                as: "employee",
                attributes: ['outletId'],
                include: [
                    {
                        model: Outlet,
                        as: "outlet",
                        attributes: ['companyId', 'maxPartDiscountPercentage', 'maxLabourDiscountPercentage']
                    },
                    {
                        model: OutletSettings,
                        as: "outletSettingMany",
                        attributes: ["CONFIG", "VALUE"],
                        where: {
                            CONFIG: {
                                [Op.in]: ["CARPM SCANNING", "DSA_AGENT_DETAILS_MANDATORY"]
                            },
                            VALUE: "true"
                        },
                        required: false
                    }
                ]
            }
        ],
        raw: false
    });

    if (OutletCustomerId != null) {
        const customerAccountId = OutletCustomerId.employee.outlet.companyId;
        const refreshReq = OutletCustomerId.referesh_required;
        const fcmToken = OutletCustomerId.fcm_tocken;
        const OutletId = OutletCustomerId.employee.outletId;
        const maxLabourDiscountPercentage = OutletCustomerId.employee.outlet.maxLabourDiscountPercentage;
        const maxPartDiscountPercentage = OutletCustomerId.employee.outlet.maxPartDiscountPercentage;
        const OutletConfig = OutletCustomerId.employee?.outletSettingMany;
        let carpmscanRequired = false;
        let agentCodeRequired = false;
        let version = "";
        let messageForUser = "";
        let blockForMessage = "";


        console.log("OutletConfig", OutletConfig);
        OutletConfig.forEach(item => {
            if (item.CONFIG === "CARPM SCANNING") {
                if (item.VALUE === "true") {
                    carpmscanRequired = true;
                }
            }
            if (item.CONFIG === "DSA_AGENT_DETAILS_MANDATORY") {
                if (item.VALUE === "true") {
                    agentCodeRequired = true;
                }
            }
        });

        const settings = await CustomerAccountSettings.findAll({
            attributes: ["SETTING_TYPE", "SETTING_VALUE"],
            where: {
                SETTING_TYPE: {
                    [Op.in]: [
                        "MIN_REQUIRED_APP_VERSION",
                        "MESSAGE_FOR_USER",
                        "BLOCK_FOR_MESSAGE",
                    ],
                },
                [Op.or]: [
                    // case 1: customer-specific settings
                    { CUSTOMER_ACCOUNT_ID: customerAccountId },

                    // case 2: global settings not overridden by the customer
                    {
                        [Op.and]: [
                            { CUSTOMER_ACCOUNT_ID: 0 },
                            {
                                SETTING_TYPE: {
                                    [Op.notIn]: Sequelize.literal(`(
                                            SELECT C.SETTING_TYPE
                                            FROM vrm_master_customer_account_settings AS C
                                            WHERE C.CUSTOMER_ACCOUNT_ID = ${customerAccountId}
                                        )`),
                                },
                            },
                        ],
                    },
                ],
            },
            raw: true
        });


        if (settings != null) {
            settings.forEach(item => {
                if (item.SETTING_TYPE == "MIN_REQUIRED_APP_VERSION") {
                    version = item.SETTING_VALUE;
                }
                if (item.SETTING_TYPE == "MESSAGE_FOR_USER") {
                    messageForUser = item.SETTING_VALUE;
                }
                if (item.SETTING_TYPE == "BLOCK_FOR_MESSAGE") {
                    blockForMessage = item.SETTING_VALUE;
                }
            });

            if (req.body.AppVersion > version) {
                return {
                    status: false,
                    "ErrorDescription": "You are using an unsupported version of the app. Please contact support to update it.",
                    "MessageForUser": messageForUser,
                    "BlockForMessage": blockForMessage,
                    "RefreshRequired": refreshReq
                };
            } else {
                if (req.body.FCMToken && fcmToken.toLowerCase() !== req.body.FCMToken.toLowerCase()) {
                    const userFcmTokenUpdate = await User.update({
                        fcm_tocken: req.body.FCMToken,
                        appversion: req.body.AppVersion
                    },
                        { where: { id: req.body.userId } });

                    if (!userFcmTokenUpdate) {
                        return {
                            status: false,
                            "ErrorDescription": "FCM Token not updated",
                            "MessageForUser": messageForUser,
                            "BlockForMessage": blockForMessage,
                            "RefreshRequired": refreshReq,
                        };
                    }
                }

                return {
                    status: true,
                    "Version": version,
                    "MessageForUser": messageForUser,
                    "BlockForMessage": blockForMessage,
                    "RefreshRequired": refreshReq,
                    "MaxLabourDiscountPercentage": maxLabourDiscountPercentage,
                    "MaxPartDiscountPercentage": maxPartDiscountPercentage,
                    "carpmscanRequired": carpmscanRequired,
                    "agentCodeRequired": agentCodeRequired
                };
            }
        } else {
            return {
                status: false,
                "ErrorDescription": "App version not available for user"
            };
        }
    } else {
        return {
            status: false,
            "ErrorDescription": "Invalid Username"
        };
    }
}

const announcements = async (req) => {
    const users = await User.findOne({
        where: {
            id: req.body.userId
        }
    })

    if (users) {
        if (users.announcement == "1") {
            const announcementsData = await announcementsData.findOne({
                order: [['ID', 'DESC']]
            });

            return {
                status: true,
                announcementsData: announcementsData
            }
        } return {
            status: false
        }
    } else {
        return {
            status: false
        }
    }
}

const updateuserdetails = async (req) => {
    const updateuserdetails = await User.update({
        announcement: req.body.UserDetails.Announcement
    }, {
        where: {
            id: req.body.userId
        }
    })

    if (updateuserdetails[0] == 1) {
        return {
            status: true
        }
    } else {
        return {
            status: false
        }
    }
}

const MastersDao = {
    getMastersData,
    pincodeMaster,
    checkAppVersion,
    announcements,
    updateuserdetails
};

export default MastersDao;