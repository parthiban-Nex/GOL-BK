import MastersService from "./service.js";
import auditLog from "../../shared/auditLog.js";
import logger from '../../config/logger.js';
import { ACTION_GET } from "../../shared/applicationConstants.js";

const getMastersData = async (req, res, next) => {
    try {
        logger.info(
            'Masters Controller getMastersData requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData["menu_name"] = "Masters";
        auditData["submenu_name"] = "Masters";
        auditData["access"] = "Mobile";
        let result = await MastersService.getMastersData(req.body);
        let usId = req.user.id.toString();
        if (usId === req.body.userId) {
            if (result.requestSuccessful) {
                auditData["message"] =
                    "Get Masters Data";
                auditData["result"] = "success ";
                auditData["action"] = ACTION_GET;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    make: result.make,
                    model: result.model,
                    variant: result.variant,
                    jobTypes: result.jobTypes,
                    fuel: result.fuel,
                    pincode : result.pincode,
                    state: result.state,
                    city: result.city,
                    repairType: result.repairType,
                    serviceType: result.serviceType,
                    source: result.sources,
                    sourceType: result.sourceType,
                    employee: result.employee,
                    vendor: result.vendor,
                    documentType: result.documentType,
                    jobCardStatus: result.jobCardStatus,
                    customerCategory: result.customerCategory,
                    insuranceMaster: result.insurance,
                    BackendConfiguration: result.BackendConfiguration,
                    InventoryChecklist: result.InventoryCheckList,
                    InspectionChecklist: result.InspectionChecklist,
                    ChecklistTypes: result.ChecklistTypes,
                    SubsystemMap: result.subsystemMap,
                    leadDisposition: result.leadDisposition,
                    PDCChecklist: result.PDCChecklist,
                    pickupType: result.pickupType,
                    photoCategory : result.photoCategory,
                    BatteryOEM : result.BatteryOEM,
                    TyreOEM : result.TyreOEM,
                    TyreSize : result.TyreSize
                });
            }
            else {
                auditData["message"] = "Get Masters Data";
                auditData["result"] = "failed ";
                auditData["action"] = ACTION_GET;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: false
                });
            }
        }
        else {
            auditData["message"] = "Get Masters Data";
            auditData["result"] = "failed ";
            auditData["action"] = ACTION_GET;
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
                requestSuccessful: true,
                message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error('Masters Controller getMastersData Error:', err);
        next(err);
    }
}

const pincodeMaster = async (req, res, next) => {
    try {
        logger.info(
            'Masters Controller pincodeMaster requestData:' + JSON.stringify(req.body)
        );
        const auditData = {};
        auditData["menu_name"] = "Masters";
        auditData["submenu_name"] = "Masters";
        auditData["access"] = "Mobile";
        let result = await MastersService.pincodeMaster(req.body);
        let usId = req.user.id.toString();
        if(usId === req.body.userId){
            if (result.requestSuccessful){
                auditData["message"] =
                    "Get Masters Data";
                auditData["result"] = "success ";
                auditData["action"] = ACTION_GET;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: true,
                    make: result.make,
                    model: result.model,
                    variant: result.variant,
                    jobTypes: result.jobTypes,
                    fuel: result.fuel,
                    state: result.state,
                    city: result.city,
                    repairType: result.repairType,
                    serviceType: result.serviceType,
                    source: result.sources,
                    sourceType: result.sourceType,
                    employee: result.employee,
                    vendor: result.vendor,  
                    documentType: result.documentType,
                    jobCardStatus: result.jobCardStatus,
                    customerCategory:result.customerCategory,
                    insuranceMaster: result.insurance, 
                });
            }
            else {
                auditData["message"] = "Get Masters Data";
                auditData["result"] = "failed ";
                auditData["action"] = ACTION_GET;
                auditLog.createAuditLog(req, auditData);
                return res.status(200).send({
                    requestSuccessful: false
                });
            }
        }
        else {
            auditData["message"] = "Get Masters Data";
            auditData["result"] = "failed ";
            auditData["action"] = ACTION_GET;
            auditLog.createAuditLog(req, auditData);
            res.status(200).send({
              requestSuccessful: true,
              message: "User Id is mis-matched"
            });
        }
    } catch (err) {
        logger.error('Masters Controller pincodeMaster Error:', err);
        next(err);
    }
}

const checkAppVersion = async (req, res, next) => {
    const AppVersion = await MastersService.checkAppVersion(req);

    if (AppVersion.status) {
        return res.status(200).send({
            status: true,
            "Version": AppVersion.Version,
            "MessageForUser": AppVersion.MessageForUser,
            "BlockForMessage": AppVersion.BlockForMessage,
            "RefreshRequired": AppVersion.RefreshRequired,
            "MaxLabourDiscount": AppVersion.MaxLabourDiscountPercentage,
            "MaxPartDiscount": AppVersion.MaxPartDiscountPercentage,
            "carpmScanRequired": AppVersion.carpmscanRequired,
            "agentCodeRequired": AppVersion.agentCodeRequired,
            "inspectionPhotosRequired": false // TODO : NEED TO CHANGE IN DAO AND CHECK IN OUTLET SETTINGS 
        });
    } else if (AppVersion.RefreshRequired) {
        return res.status(400).send({
            status: false,
            "ErrorDescription": AppVersion.ErrorDescription,
            "MessageForUser": AppVersion.MessageForUser,
            "BlockForMessage": AppVersion.BlockForMessage,
            "RefreshRequired": AppVersion.RefreshRequired
        });
    } else {
        return res.status(400).send({
            status: false,
            "ErrorDescription": AppVersion.ErrorDescription
        });
    }
    // const OutletCustomerId = await User.findOne({ 
    //     where: { id: req.body.userId },
    //     attributes: ["id","employeeId","referesh_required","fcm_tocken"],
    //     include : [
    //         {
    //             model : Employee,
    //             as: "employee",
    //             attributes : ['outletId'],
    //             include : [
    //                 {
    //                     model : Outlet,
    //                     as: "outlet",
    //                     attributes : ['companyId','maxPartDiscountPercentage','maxLabourDiscountPercentage']
    //                 },
    //                 {
    //                     model : OutletSettings,
    //                     as : "outletSettingMany",
    //                     attributes : ["CONFIG","VALUE"],
    //                     where : {
    //                         CONFIG : {
    //                             [Op.in] : ["CARPM SCANNING","DSA_AGENT_DETAILS_MANDATORY"]
    //                         },
    //                         VALUE : "true" 
    //                     },
    //                     required: false
    //                 }
    //             ]
    //         }
    //     ],
    //     raw: false
    // });

    // if(OutletCustomerId != null ){
    //     const customerAccountId = OutletCustomerId.employee.outlet.companyId;
    //     const refreshReq = OutletCustomerId.referesh_required;
    //     const fcmToken = OutletCustomerId.fcm_tocken;
    //     const OutletId = OutletCustomerId.employee.outletId;
    //     const maxLabourDiscountPercentage = OutletCustomerId.employee.outlet.maxLabourDiscountPercentage;
    //     const maxPartDiscountPercentage = OutletCustomerId.employee.outlet.maxPartDiscountPercentage;
    //     const OutletConfig = OutletCustomerId.employee?.outletSettingMany;
    //     let carpmscanRequired = false;
    //     let agentCodeRequired = false;
    //     let version = "";
    //     let messageForUser = "";
    //     let blockForMessage = "";


    //     console.log("OutletConfig",OutletConfig);
    //     OutletConfig.forEach(item => {
    //         if(item.CONFIG === "CARPM SCANNING") {
    //             if(item.VALUE === "true"){
    //                 carpmscanRequired = true;
    //             }
    //         }
    //         if(item.CONFIG === "DSA_AGENT_DETAILS_MANDATORY") {
    //             if(item.VALUE === "true"){
    //                 agentCodeRequired = true;
    //             }
    //         }
    //     });

    //     const settings = await CustomerAccountSettings.findAll({
    //             attributes: ["SETTING_TYPE", "SETTING_VALUE"],
    //             where: {
    //                     SETTING_TYPE: {
    //                     [Op.in]: [
    //                                 "MIN_REQUIRED_APP_VERSION",
    //                                 "MESSAGE_FOR_USER",
    //                                 "BLOCK_FOR_MESSAGE",
    //                             ],
    //                         },
    //                     [Op.or]: [
    //                         // case 1: customer-specific settings
    //                         { CUSTOMER_ACCOUNT_ID: customerAccountId },

    //                         // case 2: global settings not overridden by the customer
    //                         {
    //                             [Op.and]: [
    //                                 { CUSTOMER_ACCOUNT_ID: 0 },
    //                                 {
    //                                     SETTING_TYPE: {
    //                                     [Op.notIn]: Sequelize.literal(`(
    //                                         SELECT C.SETTING_TYPE
    //                                         FROM vrm_master_customer_account_settings AS C
    //                                         WHERE C.CUSTOMER_ACCOUNT_ID = ${customerAccountId}
    //                                     )`),
    //                                     },
    //                                 },
    //                             ],
    //                         },
    //                     ],
    //                 },
    //             raw:true
    //         });


    //     if(settings != null){
    //         settings.forEach(item => {
    //             if(item.SETTING_TYPE == "MIN_REQUIRED_APP_VERSION") {
    //                 version = item.SETTING_VALUE;
    //             }
    //             if(item.SETTING_TYPE == "MESSAGE_FOR_USER") {
    //                 messageForUser = item.SETTING_VALUE;
    //             }
    //             if(item.SETTING_TYPE == "BLOCK_FOR_MESSAGE") {
    //                 blockForMessage = item.SETTING_VALUE;
    //             }
    //         });

    //         if(req.body.AppVersion < version){
    //             return res.status(400).send({
    //                 "ErrorDescription" : "You are using an unsupported version of the app. Please contact support to update it.",
    //                 "MessageForUser" : messageForUser,
    //                 "BlockForMessage" : blockForMessage,
    //                 "RefreshRequired" : refreshReq,
    //             });
    //         } else {
    //             if(req.body.FCMToken && fcmToken.toLowerCase() !== req.body.FCMToken.toLowerCase()){
    //                 const userFcmTokenUpdate = await User.update({ 
    //                     fcm_tocken: req.body.FCMToken,
    //                     appversion : req.body.AppVersion
    //                     }, 
    //                     { where: { id: req.body.userId } });

    //                 if(!userFcmTokenUpdate){
    //                     return res.status(400).send({
    //                         "ErrorDescription" : "FCM Token not updated",
    //                         "MessageForUser" : messageForUser,
    //                         "BlockForMessage" : blockForMessage,
    //                         "RefreshRequired" : refreshReq,
    //                     });
    //                 } 
    //             }

    //             return res.status(200).send({
    //                 "Version" : version,
    //                 "MessageForUser" : messageForUser,
    //                 "BlockForMessage" : blockForMessage,
    //                 "RefreshRequired" : refreshReq,
    //                 "MaxLabourDiscountPercentage" : maxLabourDiscountPercentage,
    //                 "MaxPartDiscountPercentage" : maxPartDiscountPercentage,
    //                 "carpmscanRequired" : carpmscanRequired,
    //                 "agentCodeRequired" : agentCodeRequired,
    //                 "Status" : "Success"
    //             })

    //         }
    //     } else {
    //         return res.status(400).send({
    //             "ErrorDescription" : "App version not available for user"
    //         });
    //     }
    // } else {
    //     return res.status(400).send({
    //         "ErrorDescription" : "Invalid Username"
    //     });
    // }
}

const announcements = async (req, res, next) => {
    try {
        const Announcements = await MastersService.announcements(req);

        if (Announcements.status) {
            res.status(200).send({
                announcementList: "Need to Check with Harman Sir"
            })

        } else {
            res.status(400).send({
                Error: 400,
                ErrorDescription: "Annoucement list empty"
            })
        }
    } catch (err) {
        logger.error('Masters Controller getMastersData Error:', err);
        next(err);
    }
}


const updateuserdetails = async (req, res, next) => {
    try {
        const updateuserdetails = await MastersService.updateuserdetails(req);

        if (updateuserdetails.status) {
            res.status(200).send({
                status: 'success'
            })
        } else {
            res.status(400).send({
                Error: 400,
                ErrorDescription: 'Update for User failed!'
            })
        }
    } catch (err) {
        logger.error('Masters Controller getMastersData Error:', err);
        next(err);
    }
}

const MastersController = {
    getMastersData,
    pincodeMaster,
    checkAppVersion,
    announcements,
    updateuserdetails
}

export default MastersController;