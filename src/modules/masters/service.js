import logger from "../../config/logger.js";
import MastersDao from "./dao.js";

const getMastersData = async (reqData) => {
    let mastersData = {}
    let result = {};

    try {
        mastersData = await MastersDao.getMastersData(reqData.userId, reqData);
        // console.log(mastersData)
        if (mastersData) {
            mastersData.requestSuccessful = true;
            result.requestSuccessful = true;
            result.make = [];
            result.model = {};
            result.repairType = [];
            result.serviceType = [];
            result.variant = [];
            result.sources = [];
            result.sourceType = {};
            result.employee = [];
            result.customerCategory = [];
            result.state = [];
            result.city = {};
            result.jobTypes = mastersData.jobTypes;
            result.fuel = [];
            result.documentType = mastersData.DocumentType;
            result.jobCardStatus = mastersData.JobCardStatus;
            result.vendor = [];
            result.insurance = [];
            result.photoCategory = [];
            result.BackendConfiguration = {};
            let InventoryData = {};
            let inventoryVersion = ''
            result.InventoryCheckList = {};
            let InspectionCheckListData = {};
            result.InspectionChecklist = {};
            let inspectionVersion = '';
            result.subsystemMap = [];
            result.leadDisposition = {};
            result.PDCChecklist = {}
            let PDCchecklistData = {};
            result.pickupType = [];
            result.ChecklistTypes = {}
            result.BatteryOEM = {};
            result.TyreOEM = {};
            result.TyreSize = {};
            result.pincode = [];

            for (const makeData of mastersData.make) {
                let make = {};
                make.makeId = makeData.id.toString();
                make.makeName = makeData.makeName;
                let companyString = "";
                for (let i = 0; i < makeData.makecompanymaps.length; i++) {
                    if (makeData.makecompanymaps.length - 1 !== i) {
                        companyString += makeData.makecompanymaps[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += makeData.makecompanymaps[i].companyId.toString();
                    }
                }
                make.companyId = companyString;

                result.make.push(make);
            }

            for (const pincodeData of mastersData.pincode) {

                let pincodeObj = {};
                pincodeObj = {
                    id: pincodeData.id,
                    pincode: pincodeData.Pincode,
                    stateName: pincodeData.StateName,
                    cityName: pincodeData.District
                };

                result.pincode.push(pincodeObj);
            };

            for (const modelData of mastersData.model) {
                let model = {};
                model.modelId = modelData.id.toString();
                model.modelName = modelData.modelName;
                model.segmentName = modelData.segment;
                model.modelStatus = modelData.status === true ? "1" : "0";

                let companyString = "";
                for (let i = 0; i < modelData.modelcompanymaps.length; i++) {
                    if (modelData.modelcompanymaps.length - 1 !== i) {
                        companyString += modelData.modelcompanymaps[i].companyId.toString() + ',';
                    } else {
                        companyString += modelData.modelcompanymaps[i].companyId.toString();
                    }
                }
                model.companyId = companyString;

                if (!result.model[modelData.makeId]) {
                    result.model[modelData.makeId] = [];
                }

                let modelObj = {};
                modelObj[model.modelId] = {
                    modelName: model.modelName,
                    segmentName: model.segmentName,
                    companyId: model.companyId
                };

                result.model[modelData.makeId].push(modelObj);
            };

            for (const batterydata of mastersData.batteryOem) {
                result.BatteryOEM[batterydata.id] = batterydata.OEM_NAME;
            }

            for (const tyredata of mastersData.tyreOem) {
                result.TyreOEM[tyredata.id] = tyredata.OEM_NAME;
            }

            for (const tyreSizedata of mastersData.tyreSize) {
                result.TyreSize[tyreSizedata.id] = tyreSizedata.TYRE_SIZE;
            }

            for (const repairTypeData of mastersData.repairType) {
                let repairType = {};
                repairType.repairTypeId = repairTypeData.id.toString();
                repairType.repairTypeName = repairTypeData.repairTypeName;
                let companyString = "";
                for (let i = 0; i < repairTypeData.repairtypecompanymap.length; i++) {
                    if (repairTypeData.repairtypecompanymap.length - 1 !== i) {
                        companyString += repairTypeData.repairtypecompanymap[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += repairTypeData.repairtypecompanymap[i].companyId.toString();
                    }
                }
                repairType.companyId = companyString;

                result.repairType.push(repairType);
            }

            for (const serviceTypeData of mastersData.serviceType) {
                let serviceType = {};
                serviceType.serviceTypeId = serviceTypeData.id.toString();
                serviceType.serviceTypeName = serviceTypeData.serviceTypeName;
                // serviceType.everestStatus = serviceTypeData.status;
                let companyString = "";
                for (let i = 0; i < serviceTypeData.servicetypecompanymap.length; i++) {
                    if (serviceTypeData.servicetypecompanymap.length - 1 !== i) {
                        companyString += serviceTypeData.servicetypecompanymap[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += serviceTypeData.servicetypecompanymap[i].companyId.toString();
                    }
                }
                serviceType.companyId = companyString;

                result.serviceType.push(serviceType);
            }

            const staticVariants = [
                { id: 1, name: "Hatch back" },
                { id: 2, name: "Sedan" },
                { id: 3, name: "SUV" },
                { id: 4, name: "MUV" },
                { id: 5, name: "X7" }
            ];

            for (const varientData of staticVariants) {
                let variant = {};
                variant.variantId = varientData.id.toString();
                variant.variantName = varientData.name;

                result.variant.push(variant);
            }

            for (const sourceData of mastersData.sources) {
                let source = {};
                source.sourceId = sourceData.id.toString();
                source.source = sourceData.sourceName;
                let companyString = "";
                for (let i = 0; i < sourceData.sourcecompanymap.length; i++) {
                    if (sourceData.sourcecompanymap.length - 1 !== i) {
                        companyString += sourceData.sourcecompanymap[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += sourceData.sourcecompanymap[i].companyId.toString();
                    }
                }
                source.companyId = companyString;

                result.sources.push(source);
            }

            for (const sourceTypeData of mastersData.sourcetypes) {
                let sourceType = {};
                sourceType.sourceTypeId = sourceTypeData.id.toString();
                sourceType.sourceType = sourceTypeData.sourceTypeName;
                let companyString = "";
                for (let i = 0; i < sourceTypeData.sourcetypecompanymap.length; i++) {
                    if (sourceTypeData.sourcetypecompanymap.length - 1 !== i) {
                        companyString += sourceTypeData.sourcetypecompanymap[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += sourceTypeData.sourcetypecompanymap[i].companyId.toString();
                    }
                }
                sourceType.companyId = companyString;

                if (!result.sourceType[sourceTypeData.sourceId]) {
                    result.sourceType[sourceTypeData.sourceId] = [];
                }

                let sourceTypeObj = {};
                sourceTypeObj[sourceType.sourceTypeId] = {
                    sourceType: sourceType.sourceType,
                    companyId: sourceType.companyId
                };

                result.sourceType[sourceTypeData.sourceId].push(sourceTypeObj);
            }

            for (const employeeData of mastersData.employees) {
                let employee = {};
                let userRole = "";
                let userRoleType = '';
                // console.log('employeeData', employeeData)
                if (employeeData['userrolemaps.role_name'] == "manger") {
                    userRole = "ROLE_MGR"
                } else if (employeeData['userrolemaps.role_name'] == "Service Advisor") {
                    userRole = "ROLE_SA"
                    userRoleType = "Service Advisor";
                } else if (employeeData['userrolemaps.role_name'] == "Technician") {
                    userRole = "ROLE_TS"
                    userRoleType = "Techincian";
                } else if (employeeData['userrolemaps.role_name'] == "Security") {
                    userRole = "ROLE_SEC"
                } else if (employeeData['userrolemaps.role_name'] == "Floor Incharge") {
                    userRole = "ROLE_QI"
                } else if (employeeData['userrolemaps.role_name'] == "GateIN") {
                    userRole = "ROLE_GI"
                } else if (employeeData['userrolemaps.role_name'] == "Audit") {
                    userRole = "ROLE_MOVE_AUDIT"
                } else {
                    userRole = "";
                }
                if (userRole == "ROLE_SA" || userRole == "ROLE_TS") {
                    employee.employeeId = employeeData.id.toString();
                    employee.employeeCode = employeeData['employee.employeeCode'];
                    employee.employeeFirstName = employeeData['employee.employeeName'] + " - " + userRoleType;
                    employee.employeeLastName = "";
                    employee.role = userRole;
                    employee.employeeMobileNumber = employeeData['employee.mobileNumber'].toString;
                    result.employee.push(employee);
                }
            };

            // console.log("Backend",mastersData.BackendConfiguration);
            for (const settingType of mastersData.BackendConfiguration) {
                result.BackendConfiguration[settingType.SETTING_TYPE] = settingType.SETTING_VALUE;
            }

            for (const customerCategoryData of mastersData.customertype) {
                let customerType = {}
                customerType.customerCategoryId = customerCategoryData.id,
                    customerType.customerCategory = customerCategoryData.customerType,
                    result.customerCategory.push(customerType)
            }

            for (const inventoryTypeData of mastersData.InventoryCheckList) {
                InventoryData[inventoryTypeData.ID] = {
                    DESC: inventoryTypeData.INVENTORY_DESC,
                    TYPE: inventoryTypeData.INVENTORY_TYPE,
                    ICON: ""
                };
                inventoryVersion = inventoryTypeData.INVENTORY_VER;
            }
            if (InventoryData) {
                result.InventoryCheckList['Version'] = inventoryVersion;
                result.InventoryCheckList['Checklist'] = InventoryData;
            }

            for (const inspectionData of mastersData.InspectionCheckList) {
                if (!InspectionCheckListData[inspectionData.UNIQUE_PARAM_ID]) {
                    InspectionCheckListData[inspectionData.UNIQUE_PARAM_ID] = {
                        ChecklistType: inspectionData.CHECKLIST_TYPE_CODE,
                        ParamName: inspectionData.PARAM_NAME,
                        ParamID: inspectionData.UNIQUE_PARAM_ID,
                        Optional: inspectionData.OPTIONAL,
                        SubsystemId: inspectionData.SUB_SYSTEM_ID,
                        ValueRequired: inspectionData.VALUE_REQUIRED,
                        SecondaryDetails: {}
                    }
                }

                if (inspectionData["RatingReasons.RATING_REASON_CODE"] && inspectionData["RatingReasons.RATING_REASON_DESC"]) {
                    InspectionCheckListData[inspectionData.UNIQUE_PARAM_ID].SecondaryDetails[inspectionData["RatingReasons.UNIQUE_RATING_REASON_ID"]] =
                        inspectionData["RatingReasons.RATING_REASON_DESC"];
                }
                inspectionVersion = inspectionData.CHECKLIST_VERSION;
            }

            if (InspectionCheckListData) {
                result.InspectionChecklist['Version'] = inspectionVersion;
                result.InspectionChecklist['Checklist'] = InspectionCheckListData;
            }

            for (const subsystemMapData of mastersData.subsystemMap) {
                let subSystem = {};
                subSystem.SUBSYSTEM_ID = subsystemMapData.SUBSYSTEM_ID;
                subSystem.CHECK_LIST_TYPE_CODE = subsystemMapData.CHECK_LIST_TYPE_CODE;
                subSystem.SUBSYSTEM_CODE = subsystemMapData.SUBSYSTEM_CODE;
                subSystem.SUBSYSTEM_NAME = subsystemMapData.SUBSYSTEM_NAME;
                subSystem.ICON = subsystemMapData.ICON;

                result.subsystemMap.push(subSystem);
            }

            if (mastersData.checkListTypes) {
                let checklistType = {}
                for (const checklist of mastersData.checkListTypes) {
                    checklistType[checklist.CHECKLIST_TYPE_CODE] = {
                        LABEL: checklist.CHECKLIST_TYPE,
                        CATEGORY: checklist.CHECKLIST_TYPE_CATEGORY
                    }
                }
                result.ChecklistTypes = checklistType;
            }

            if (mastersData.leadDisposition) {
                let disPosition = {};
                for (const leadDisposition of mastersData.leadDisposition) {
                    disPosition[leadDisposition.disPositionCode] = leadDisposition.title
                }

                result.leadDisposition = disPosition;
            }

            for (const pickupTypes of mastersData.pickupTypes) {
                let pickupType = {};
                pickupType.pickupId = pickupTypes.PICKUP_ID;
                pickupType.pickupType = pickupTypes.PICKUP_TYPE

                result.pickupType.push(pickupType);
            }

            let PDCCHECKLISTVERSION = "";
            for (const PDCChecklist of mastersData.predeliveryCheckList) {
                PDCchecklistData[PDCChecklist.VEHICLE_PDC_CODE] = PDCChecklist.VEHICLE_PDC_DESC
                PDCCHECKLISTVERSION = PDCChecklist.VEHICLE_PDC_VER;
            }

            if (PDCchecklistData) {
                result.PDCChecklist['Version'] = PDCCHECKLISTVERSION;
                result.PDCChecklist['Checklist'] = PDCchecklistData;
            }

            for (const fuelData of mastersData.fuel) {
                let fuel = {};
                fuel.fuelTypeId = fuelData.id.toString();
                fuel.fuelType = fuelData.fuelTypeName;

                result.fuel.push(fuel);
            }

            // for (const pincodeData of mastersData.pincode) {
            //     let state = {};

            //     state.stateId = pincodeData.dataValues.cv_stateId;
            //     state.stateName = pincodeData.dataValues.StateName;

            //     result.state.push(state);
            // };

            const stateMap = new Map();

            for (const pincodeData of mastersData.pincode) {

                const stateId = pincodeData.dataValues.cv_stateId;
                const stateName = pincodeData.dataValues.StateName;
                if (!stateMap.has(stateId) && stateId !== 0) {
                    stateMap.set(stateId, {
                        stateId: stateId.toString(),
                        stateName
                    });
                }
            }
            //By state name
            // result.state = Array.from(stateMap.values()).sort((a, b) =>
            //     a.stateName.localeCompare(b.stateName)
            // );

            //By state id   
            // let filteredRec = stateMap.filter(item => item.stateId !== 0);
            result.state = Array.from(stateMap.values()).sort((a, b) => a.stateId - b.stateId);

            // for (const pincodeData of mastersData.pincode) {
            //     let city = {};
            //     city.cityName = pincodeData.dataValues.District;

            //     if (!result.city[pincodeData.dataValues.cv_stateId] && pincodeData.dataValues.cv_stateId !== 0) {
            //         result.city[pincodeData.dataValues.cv_stateId] = [];
            //     }

            //     let cityObj = {};
            //     cityObj[pincodeData.dataValues.cv_cityId] = {
            //         cityName: city.cityName,
            //     };

            //     // let cityArr = {};
            //     // cityArr[pincodeData.dataValues.cv_stateId] = {
            //     //     cityObj
            //     // };

            //     result.city[pincodeData.dataValues.cv_stateId].push(cityObj);
            // }

            // const cityMapByState = new Map();

            // for (const pincodeData of mastersData.pincode) {
            //     const stateId = pincodeData.dataValues.cv_stateId;
            //     const cityId = pincodeData.dataValues.cv_cityId;

            //     if (stateId === 0 || cityId === 0) {
            //         continue;
            //     }

            //     const cityName = pincodeData.dataValues.District;

            //     if (!cityMapByState.has(stateId)) {
            //         cityMapByState.set(stateId, new Map());
            //     }

            //     const cityMap = cityMapByState.get(stateId);

            //     if (!cityMap.has(cityId)) {
            //         cityMap.set(cityId, { cityName });
            //     }
            // }

            // result.city = {};
            // for (const [stateId, cityMap] of cityMapByState.entries()) {
            //     result.city[stateId] = [];

            //     for (const [cityId, cityData] of cityMap.entries()) {
            //         const cityObj = {};
            //         cityObj[cityId] = cityData;
            //         result.city[stateId].push(cityObj);
            //     }
            // }

            const cityMapByState = new Map();
            const cityToStateMap = new Map(); // Track correct state for each cityId

            for (const pincodeData of mastersData.pincode) {
                const stateId = pincodeData.dataValues.cv_stateId;
                const cityId = pincodeData.dataValues.cv_cityId;

                // Skip invalid values
                if (!stateId || !cityId) continue;

                const cityName = pincodeData.dataValues.District;

                // If this cityId was seen before with a different state, skip to prevent duplication
                if (cityToStateMap.has(cityId) && cityToStateMap.get(cityId) !== stateId) {
                    console.log(`Conflict for cityId ${cityId}: already linked to state ${cityToStateMap.get(cityId)}, but got ${stateId}`);
                    continue;
                }

                // Register cityId to stateId
                cityToStateMap.set(cityId, stateId);

                // Initialize state entry if not present
                if (!cityMapByState.has(stateId)) {
                    cityMapByState.set(stateId, new Map());
                }

                const cityMap = cityMapByState.get(stateId);

                // Add city if not already present under this state
                if (!cityMap.has(cityId)) {
                    cityMap.set(cityId, { cityName });
                }
            }

            // Transform into final result object
            result.city = {};
            for (const [stateId, cityMap] of cityMapByState.entries()) {
                result.city[stateId] = [];

                for (const [cityId, cityData] of cityMap.entries()) {
                    const cityObj = {};
                    cityObj[cityId] = cityData;
                    result.city[stateId].push(cityObj);
                }
            }


            for (const insuranceData of mastersData.insurance) {
                let insuranceObj = {};
                insuranceObj.insuranceProviderId = insuranceData.dataValues.id.toString();
                insuranceObj.insuranceProviderName = insuranceData.dataValues.insuranceName;

                for (const insuranceAddressData of insuranceData.dataValues.insuranceAddress) {
                    let insuranceAddressObj = {};
                    insuranceAddressObj.insuranceProviderAddress = insuranceAddressData.address;
                    insuranceAddressObj.insuranceProviderAddress2 = "";
                    insuranceAddressObj.insuranceProviderPincode = insuranceAddressData.pincode;
                    insuranceAddressObj.insuranceProviderState = insuranceAddressData.state;
                    insuranceAddressObj.insuranceProviderCity = insuranceAddressData.city;
                    insuranceAddressObj.insuranceProviderGSTIN = insuranceAddressData.gstin;
                    insuranceAddressObj.companyId = '1,2,3,4,5,6,7,8,9';

                    result.insurance.push({ ...insuranceObj, ...insuranceAddressObj });
                }
            }

            for (const inventoryCategory of mastersData.inventoryPhotoCategory) {
                let inventoryPhotoCat = {};
                inventoryPhotoCat.categoryId = inventoryCategory.CATEGORY_ID;
                inventoryPhotoCat.vehicleType = inventoryCategory.VEHICLE_TYPE;
                inventoryPhotoCat.icon = inventoryCategory.ICON_LINK;
                inventoryPhotoCat.categoryName = inventoryCategory.CATEGORY_NAME;
                inventoryPhotoCat.isMandatory = inventoryCategory.IS_MANDATORY == 1 ? 1 : 0;
                inventoryPhotoCat.minCount = inventoryCategory.MIN_COUNT;
                inventoryPhotoCat.maxCount = inventoryCategory.MAX_COUNT;
                inventoryPhotoCat.sortOrder = inventoryCategory.SORT_ORDER;
                inventoryPhotoCat.isActive = inventoryCategory.ACTIVE;
                inventoryPhotoCat.count = "";

                result.photoCategory.push({ ...inventoryPhotoCat, });
            }

            for (const vendorData of mastersData.vendors) {
                let vendorObj = {};
                vendorObj.vendorId = vendorData.id.toString();
                vendorObj.vendorName = vendorData.vendorName;
                vendorObj.vendorMarginPercentage = vendorData.marginPercentage.toString();

                let companyString = "";
                for (let i = 0; i < vendorData.vendorcompanymap.length; i++) {
                    if (vendorData.vendorcompanymap.length - 1 !== i) {
                        companyString += vendorData.vendorcompanymap[i].companyId.toString() + ',';
                    }
                    else {
                        companyString += vendorData.vendorcompanymap[i].companyId.toString();
                    }
                }
                vendorObj.companyId = companyString;

                result.vendor.push(vendorObj);
            }

        }
    } catch (err) {
        logger.error('masters service getMastersData error: ', err)
    }
    return result;
}

const pincodeMaster = async (reqData) => {
    let mastersData = {}
    let result = {};

    try {
        mastersData = await MastersDao.getMastersData(reqData.userId, reqData);
        // console.log(mastersData)
        if (mastersData) {
            mastersData.requestSuccessful = true;
            result.requestSuccessful = true;
            // result.make = [];
            // result.model = {};
            // result.repairType = [];
            // result.serviceType = [];
            // result.variant = [];
            // result.sources = [];
            // result.sourceType = {};
            // result.employee = [];
            // result.customerCategory = [];
            result.state = [];
            result.city = {};
            // result.jobTypes = mastersData.jobTypes;
            // result.fuel = [];
            // result.documentType = mastersData.DocumentType;
            // result.jobCardStatus = mastersData.JobCardStatus;
            // result.vendor = [];
            // result.insurance = [];


            // for (const makeData of mastersData.make) {
            //     let make = {};
            //     make.makeId = makeData.id.toString();
            //     make.makeName = makeData.makeName;
            //     let companyString = "";
            //     for (let i = 0; i < makeData.makecompanymaps.length; i++) {
            //         if (makeData.makecompanymaps.length - 1 !== i) {
            //             companyString += makeData.makecompanymaps[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += makeData.makecompanymaps[i].companyId.toString();
            //         }
            //     }
            //     make.companyId = companyString;

            //     result.make.push(make);
            // }

            // for (const modelData of mastersData.model) {
            //     let model = {};
            //     model.modelId = modelData.id.toString();
            //     model.modelName = modelData.modelName;
            //     model.segmentName = modelData.segment;
            //     model.modelStatus = modelData.status === true ? "1" : "0";

            //     let companyString = "";
            //     for (let i = 0; i < modelData.modelcompanymaps.length; i++) {
            //         if (modelData.modelcompanymaps.length - 1 !== i) {
            //             companyString += modelData.modelcompanymaps[i].companyId.toString() + ',';
            //         } else {
            //             companyString += modelData.modelcompanymaps[i].companyId.toString();
            //         }
            //     }
            //     model.companyId = companyString;

            //     if (!result.model[modelData.makeId]) {
            //         result.model[modelData.makeId] = [];
            //     }

            //     let modelObj = {};
            //     modelObj[model.modelId] = {
            //         modelName: model.modelName,
            //         segmentName: model.segmentName,
            //         companyId: model.companyId
            //     };

            //     result.model[modelData.makeId].push(modelObj);
            // };

            // for (const repairTypeData of mastersData.repairType) {
            //     let repairType = {};
            //     repairType.repairTypeId = repairTypeData.id.toString();
            //     repairType.repairTypeName = repairTypeData.repairTypeName;
            //     let companyString = "";
            //     for (let i = 0; i < repairTypeData.repairtypecompanymap.length; i++) {
            //         if (repairTypeData.repairtypecompanymap.length - 1 !== i) {
            //             companyString += repairTypeData.repairtypecompanymap[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += repairTypeData.repairtypecompanymap[i].companyId.toString();
            //         }
            //     }
            //     repairType.companyId = companyString;

            //     result.repairType.push(repairType);
            // }

            // for (const serviceTypeData of mastersData.serviceType) {
            //     let serviceType = {};
            //     serviceType.serviceTypeId = serviceTypeData.id.toString();
            //     serviceType.serviceTypeName = serviceTypeData.serviceTypeName;
            //     // serviceType.everestStatus = serviceTypeData.status;
            //     let companyString = "";
            //     for (let i = 0; i < serviceTypeData.servicetypecompanymap.length; i++) {
            //         if (serviceTypeData.servicetypecompanymap.length - 1 !== i) {
            //             companyString += serviceTypeData.servicetypecompanymap[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += serviceTypeData.servicetypecompanymap[i].companyId.toString();
            //         }
            //     }
            //     serviceType.companyId = companyString;

            //     result.serviceType.push(serviceType);
            // }

            // for (const varientData of mastersData.variant) {
            //     let variant = {};
            //     variant.variantId = varientData.id.toString();
            //     variant.variantName = varientData.varientName;

            //     result.variant.push(variant);
            // }

            // for (const sourceData of mastersData.sources) {
            //     let source = {};
            //     source.sourceId = sourceData.id.toString();
            //     source.source = sourceData.sourceName;
            //     let companyString = "";
            //     for (let i = 0; i < sourceData.sourcecompanymap.length; i++) {
            //         if (sourceData.sourcecompanymap.length - 1 !== i) {
            //             companyString += sourceData.sourcecompanymap[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += sourceData.sourcecompanymap[i].companyId.toString();
            //         }
            //     }
            //     source.companyId = companyString;

            //     result.sources.push(source);
            // }

            // for (const sourceTypeData of mastersData.sourcetypes) {
            //     let sourceType = {};
            //     sourceType.sourceTypeId = sourceTypeData.id.toString();
            //     sourceType.sourceType = sourceTypeData.sourceTypeName;
            //     let companyString = "";
            //     for (let i = 0; i < sourceTypeData.sourcetypecompanymap.length; i++) {
            //         if (sourceTypeData.sourcetypecompanymap.length - 1 !== i) {
            //             companyString += sourceTypeData.sourcetypecompanymap[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += sourceTypeData.sourcetypecompanymap[i].companyId.toString();
            //         }
            //     }
            //     sourceType.companyId = companyString;

            //     if (!result.sourceType[sourceTypeData.sourceId]) {
            //         result.sourceType[sourceTypeData.sourceId] = [];
            //     }

            //     let sourceTypeObj = {};
            //     sourceTypeObj[sourceType.sourceTypeId] = {
            //         sourceType: sourceType.sourceType,
            //         companyId: sourceType.companyId
            //     };

            //     result.sourceType[sourceTypeData.sourceId].push(sourceTypeObj);
            // }

            // for (const employeeData of mastersData.employees) {
            //     let employee = {};
            //     employee.employeeId = employeeData.id.toString();
            //     employee.employeeCode = employeeData.employeeCode;
            //     employee.employeeFirstName = employeeData.employeeName;
            //      employee.employeeLastName = "";
            //     employee.employeeMobileNumber = employeeData.mobileNumber.toString();

            //     result.employee.push(employee);
            // };

            // for (const customerCategoryData of mastersData.customertype){
            //     let customerType ={}
            //     customerType.customerCategoryId = customerCategoryData.id,
            //     customerType.customerCategory = customerCategoryData.customerType,
            //     result.customerCategory.push(customerType)
            // }

            // for (const fuelData of mastersData.fuel) {
            //     let fuel = {};
            //     fuel.fuelTypeId = fuelData.id.toString();
            //     fuel.fuelType = fuelData.fuelTypeName;

            //     result.fuel.push(fuel);
            // }

            // for (const pincodeData of mastersData.pincode) {
            //     let state = {};

            //     state.stateId = pincodeData.dataValues.cv_stateId;
            //     state.stateName = pincodeData.dataValues.StateName;

            //     result.state.push(state);
            // };

            const stateMap = new Map();

            for (const pincodeData of mastersData.pincode) {

                const stateId = pincodeData.dataValues.cv_stateId;
                const stateName = pincodeData.dataValues.StateName;
                if (!stateMap.has(stateId) && stateId !== 0) {
                    stateMap.set(stateId, {
                        stateId: stateId.toString(),
                        stateName
                    });
                }
            }
            //By state name
            // result.state = Array.from(stateMap.values()).sort((a, b) =>
            //     a.stateName.localeCompare(b.stateName)
            // );

            //By state id   
            // let filteredRec = stateMap.filter(item => item.stateId !== 0);
            result.state = Array.from(stateMap.values()).sort((a, b) => a.stateId - b.stateId);

            // for (const pincodeData of mastersData.pincode) {
            //     let city = {};
            //     city.cityName = pincodeData.dataValues.District;

            //     if (!result.city[pincodeData.dataValues.cv_stateId] && pincodeData.dataValues.cv_stateId !== 0) {
            //         result.city[pincodeData.dataValues.cv_stateId] = [];
            //     }

            //     let cityObj = {};
            //     cityObj[pincodeData.dataValues.cv_cityId] = {
            //         cityName: city.cityName,
            //     };

            //     // let cityArr = {};
            //     // cityArr[pincodeData.dataValues.cv_stateId] = {
            //     //     cityObj
            //     // };

            //     result.city[pincodeData.dataValues.cv_stateId].push(cityObj);
            // }

            // const cityMapByState = new Map();

            // for (const pincodeData of mastersData.pincode) {
            //     const stateId = pincodeData.dataValues.cv_stateId;
            //     const cityId = pincodeData.dataValues.cv_cityId;

            //     if (stateId === 0 || cityId === 0) {
            //         continue;
            //     }

            //     const cityName = pincodeData.dataValues.District;

            //     if (!cityMapByState.has(stateId)) {
            //         cityMapByState.set(stateId, new Map());
            //     }

            //     const cityMap = cityMapByState.get(stateId);

            //     if (!cityMap.has(cityId)) {
            //         cityMap.set(cityId, { cityName });
            //     }
            // }

            // result.city = {};
            // for (const [stateId, cityMap] of cityMapByState.entries()) {
            //     result.city[stateId] = [];

            //     for (const [cityId, cityData] of cityMap.entries()) {
            //         const cityObj = {};
            //         cityObj[cityId] = cityData;
            //         result.city[stateId].push(cityObj);
            //     }
            // }

            const cityMapByState = new Map();
            const cityToStateMap = new Map(); // Track correct state for each cityId

            for (const pincodeData of mastersData.pincode) {
                const stateId = pincodeData.dataValues.cv_stateId;
                const cityId = pincodeData.dataValues.cv_cityId;

                // Skip invalid values
                if (!stateId || !cityId) continue;

                const cityName = pincodeData.dataValues.District;

                // If this cityId was seen before with a different state, skip to prevent duplication
                if (cityToStateMap.has(cityId) && cityToStateMap.get(cityId) !== stateId) {
                    console.log(`Conflict for cityId ${cityId}: already linked to state ${cityToStateMap.get(cityId)}, but got ${stateId}`);
                    continue;
                }

                // Register cityId to stateId
                cityToStateMap.set(cityId, stateId);

                // Initialize state entry if not present
                if (!cityMapByState.has(stateId)) {
                    cityMapByState.set(stateId, new Map());
                }

                const cityMap = cityMapByState.get(stateId);

                // Add city if not already present under this state
                if (!cityMap.has(cityId)) {
                    cityMap.set(cityId, { cityName });
                }
            }

            // Transform into final result object
            result.city = {};
            for (const [stateId, cityMap] of cityMapByState.entries()) {
                result.city[stateId] = [];

                for (const [cityId, cityData] of cityMap.entries()) {
                    const cityObj = {};
                    cityObj[cityId] = cityData;
                    result.city[stateId].push(cityObj);
                }
            }


            // for (const insuranceData of mastersData.insurance) {
            //     let insuranceObj = {};
            //     insuranceObj.insuranceProviderId = insuranceData.dataValues.id.toString();
            //     insuranceObj.insuranceProviderName = insuranceData.dataValues.insuranceName;

            //     for (const insuranceAddressData of insuranceData.dataValues.insuranceAddress) {
            //         let insuranceAddressObj = {};
            //         insuranceAddressObj.insuranceProviderAddress = insuranceAddressData.address;
            //         insuranceAddressObj.insuranceProviderAddress2 = "";
            //         insuranceAddressObj.insuranceProviderPincode = insuranceAddressData.pincode;
            //         insuranceAddressObj.insuranceProviderState = insuranceAddressData.state;
            //         insuranceAddressObj.insuranceProviderCity = insuranceAddressData.city;
            //         insuranceAddressObj.insuranceProviderGSTIN = insuranceAddressData.gstin;
            //         insuranceAddressObj.companyId = '1,2,3,4,5,6,7,8,9';

            //         result.insurance.push({ ...insuranceObj, ...insuranceAddressObj });
            //     }
            // }

            // for (const vendorData of mastersData.vendors) {
            //     let vendorObj = {};
            //     vendorObj.vendorId = vendorData.id.toString();
            //     vendorObj.vendorName = vendorData.vendorName;
            //     vendorObj.vendorMarginPercentage = vendorData.marginPercentage.toString();

            //     let companyString = "";
            //     for (let i = 0; i < vendorData.vendorcompanymap.length; i++) {
            //         if (vendorData.vendorcompanymap.length - 1 !== i) {
            //             companyString += vendorData.vendorcompanymap[i].companyId.toString() + ',';
            //         }
            //         else {
            //             companyString += vendorData.vendorcompanymap[i].companyId.toString();
            //         }
            //     }
            //     vendorObj.companyId = companyString;

            //     result.vendor.push(vendorObj);
            // }

        }
    } catch (err) {
        logger.error('masters service pincodeMasters error: ', err)
    }
    return result;
}

const checkAppVersion = async (req) => {
    const AppVersion = await MastersDao.checkAppVersion(req);

    if (AppVersion.status) {
        return {
            status: true,
            "Version": AppVersion.Version,
            "MessageForUser": AppVersion.MessageForUser,
            "BlockForMessage": AppVersion.BlockForMessage,
            "RefreshRequired": AppVersion.RefreshRequired,
            "MaxLabourDiscountPercentage": AppVersion.MaxLabourDiscountPercentage,
            "MaxPartDiscountPercentage": AppVersion.MaxPartDiscountPercentage,
            "carpmscanRequired": AppVersion.carpmscanRequired,
            "agentCodeRequired": AppVersion.agentCodeRequired
        };
    } else if (AppVersion.RefreshRequired) {
        return {
            status: false,
            "ErrorDescription": AppVersion.ErrorDescription,
            "MessageForUser": AppVersion.MessageForUser,
            "BlockForMessage": AppVersion.BlockForMessage,
            "RefreshRequired": AppVersion.RefreshRequired
        };
    } else {
        return {
            status: false,
            "ErrorDescription": AppVersion.ErrorDescription
        };
    }

}

const announcements = async (req) => {
    try {
        const announcements = await MastersDao.announcements(req)

        if (announcements.status) {
            return {
                status: true,
                announcements: announcements.announcementsData
            }
        } else {
            return {
                status: false,
                message: "Annoucement list empty"
            }

        }
    } catch (err) {
        logger.error('masters service getMastersData error: ', err)
    }
}

const updateuserdetails = async (req) => {
    try {
        const updateuserdetails = await MastersDao.updateuserdetails(req);

        if (updateuserdetails.status) {
            return {
                status: true
            }
        } else {
            return {
                status: false
            }
        }
    } catch (err) {
        logger.error('masters service getMastersData error: ', err)
    }
}


const MastersService = {
    getMastersData,
    pincodeMaster,
    checkAppVersion,
    announcements,
    updateuserdetails
};

export default MastersService;