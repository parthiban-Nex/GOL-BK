import {dbConfig} from '../config/dbConfig.js';
import { Sequelize, DataTypes, Model } from 'sequelize';
// import ('dotenv').config();
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: true,
  timezone: '+05:30',
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

//Convert Current Time to IST (+5:30) before storing in DB
// const getCurrentISTTime = () => {
//   const nowUTC = new Date();
//   // return new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000); 
//   return new Date(nowUTC.getTime());
// };

//  Hook: Before Create → Store `createdAt` & `updatedAt` in IST
// sequelize.addHook("beforeCreate", (instance) => {
//   const istNow = getCurrentISTTime();
//   if (instance instanceof Model) {
//     instance.setDataValue("createdAt", istNow);
//     instance.setDataValue("updatedAt", istNow);

//    // Only set approveDatetime if the model has this field
//     if ('approveDatetime' in instance) {
//       instance.setDataValue("approveDatetime", istNow);
//     }
//   }
// });

// const originalUpdate = Model.update;

// Model.update = async function(values, options) {
//   const finalOptions = {
//     ...options,
//     individualHooks: true, // This ensures beforeUpdate runs
//   };

//   return originalUpdate.call(this, values, finalOptions);
// };

// Hook: Before Update → Store `updatedAt` in IST
// sequelize.addHook("beforeUpdate", (instance) => {
//   const istNow = getCurrentISTTime();
//   if (instance instanceof Model) {
//     instance.setDataValue("updatedAt", istNow);

//     // Only set these fields if they exist in the model
//     if ('approveDatetime' in instance) {
//       instance.setDataValue("approveDatetime", istNow);
//     }
//     if ('delivery_date' in instance) {
//       instance.setDataValue("delivery_date", istNow);
//     }
//   }
// });

// Hook: Before Bulk Create → Store timestamps in IST
// sequelize.addHook("beforeBulkCreate", (instances) => {
//   const istNow = getCurrentISTTime();
//   instances.forEach((instance) => {
//     if (instance instanceof Model) {
//       instance.setDataValue("createdAt", istNow);
//       instance.setDataValue("updatedAt", istNow);

//       // Only set approveDatetime if the model has this field
//       if ('approveDatetime' in instance) {
//         instance.setDataValue("approveDatetime", istNow);
//       }
//     }
//   });
// });
// Disable Sequelize Auto-Conversion
// Model.prototype.toJSON = function () {
//   const values = Object.assign({}, this.get());
//   return values;
// };

sequelize
  .authenticate()
  .then(() => {
    console.log('connected..');
  })
  .catch((err) => {
    console.log('Error' + err);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

import userdatas from './user/models/user.js';
import commonlogdatas from './logApi/models/logApi.js';
import auditlogdatas from './logApi/models/auditLog.js';
import commonLogic from '../shared/commonLogics.js';
import userrolemapDatas from './user/models/userRoleMapping.js';
import itemdatas from './item/models/item.js';
import itemcompanymapdatas from './item/models/itemCompanyMapping.js';

import menudatas from './user/models/menuList.js';
import referencedatas from './user/models/reference.js';
import subMenudatas from './user/models/subMenulist.js';
import rolesettingsdatas from './user/models/roleSettings.js';
import roleSubmenuButtondatas from './user/models/roleSubMenuButton.js';
import itemgroupdatas from './itemGroup/models/itemgroup.js';
import itemcategoriedatas from './itemCategory/models/itemcategorie.js';
import hsndatas from './hsn/models/hsn.js';
import companydatas from './company/models/company.js';
import uomdatas from './uom/models/uom.js';
import aggregatedatas from './aggregate/models/aggregate.js';
import subaggregateDatas from './subaggregate/models/subAggregate.js';
import makedatas from './make/models/make.js';
import returnabledatas from './outlet/models/returnable.js';
import returnablePartsData from './outlet/models/returnableParts.js';
import makecompanymapdatas from './make/models/makeCompanyMapping.js';
import varientdatas from './varient/models/varient.js';
import servicetypedatas from './serviceType/models/serviceType.js';
import servicetypecompanymapdatas from './serviceType/models/serviceTypeCompanyMapping.js';
import modeldatas from './model/models/model.js';
import modelcompanymapdatas from './model/models/modelCompanyMapping.js';
import modelvarientmapdatas from './model/models/modelVarientMapping.js';
import repairtypedatas from './repairType/models/repairType.js';
import repairtypecompanymapdatas from './repairType/models/repairTypeCompanyMapping.js';
import sourcedatas from './source/models/source.js';
import sourcecompanymapdatas from './source/models/sourceCompanyMapping.js';
import sourcetypedatas from './sourceType/models/sourceType.js';
import sourcetypecompanymapdatas from './sourceType/models/sourceTypeCompanyMapping.js';
import recentActivityDatas from './recentActivity/models/recentActivity.js';
import vendordatas from './vendor/models/vendor.js';
import vendorcompanymapdatas from './vendor/models/vendorCompanyMapping.js';
import vendoritemgroupmapdatas from './vendor/models/vendorItemGroupMapping.js';
import pincodedatas from './vendor/models/pincode.js';
import userlogdatas from './user/models/userLog.js';
import dispositiondatas from './disPosition/models/disPosition.js';
import dispositioncompanymapdatas from './disPosition/models/disPositionCompanyMapping.js';
import subdispositiondatas from './subDisPosition/models/subDisPosition.js';
import laborScheduledatas from './laborSchedule/models/laborSchedule.js';
import laborcompanymapdatas from './laborSchedule/models/laborCompanyMapping.js';
import laborCategorydatas from './laborSchedule/models/laborCategory.js';
import laborSubCategoryDatas from './laborSchedule/models/laborSubCategory.js'
import dsaagentdatas from './dsaAgent/models/dsaAgent.js';
import dsaagentcompanymapdatas from './dsaAgent/models/dsaagentcompanymap.js';
import bankdatas from './dsaAgent/models/bank.js';
import fueltypedatas from './varient/models/fuelType.js';
import outletdatas from './outlet/models/outlet.js';
import OutletSettings from './masters/models/outletSettings.js';
import binLocationDatas from './binLocation/models/binLocation.js';
import employeeroledatas from './employeeRole/models/employeeRole.js';
import employeedatas from './employee/models/employee.js';
import customerDatas from './customer/models/customer.js';
import customerTypeDatas from './customer/models/customertype.js';
import customerCategoryDatas from './customer/models/customercategory.js';
import billTypeDatas from './customer/models/billtype.js';
import vehicleDatas from './vehicle/models/vehicle.js';
import vehiclecolordatas from './vehicle/models/vehicleColor.js';
import insurancedatas from './insurance/models/insurance.js';
import serviceBookingDatas from './serviceBooking/models/serviceBooking.js';
import serviceBookingActivityDatas from './serviceBooking/models/serviceBookingActivity.js';
import transactionRecentActivityDatas from './recentActivity/models/transactionRecentActivity';
import servicEstimateDatas from './serviceEstimate/models/serviceEstimate.js';
import pickupDropoffLogData from './pickupDropoff/models/pickupDropoffLog.js';
import driverMasterData from './pickupDropoff/models/driverMaster.js';
import bookingApiLogData from './pickupDropoff/models/bookingApiLog.js';

import CreditNoteUpdate from './creditNotesDetails/creditNoteUpdates.js';
import labourEstimateDatas from './serviceEstimate/models/laborEstimate.js';
import oslLabourEstimateDatas from './serviceEstimate/models/oslLaborEstimate.js';
import partsEstimatedatas from './serviceEstimate/models/partsEstimate.js';
import tyreOemDatas from './tyreOEM/models/tyreOEM.js';
import fitMasterRecentActivityDatas from './recentActivity/models/fitMasterRececentActivity.js';
import tyreSizeDatas from './tyreSize/models/tyreSize.js';
import batteryOemDatas from './batteryOem/models/batteryOem.js';
import clickInPartNameDatas from './clickInParts/models/clickInPartNames.js';
import CheckListDatas from './vehiclePredeliveryChecklist/models/vehiclePredeliveryCheckList.js';

import pickupTypeDatas from './pickupType/models/pickupType.js';
import dockFieldDatas from './dockFields/models/dockFileds.js';
import inputTypeDatas from './dockFields/models/inputType.js';
import customerAccountTypeDatas from './checkListType/models/customerAccountType.js';
import checkListTypeDatas from './checkListType/models/checkListTypes.js';
import inspectionSubsystemMapDatas from './inspectionSubsystemMap/models/inspectionSubsystemMap.js';
import inspectionCheckListDatas from './inspectionCheckList/models/inspectionCheckList.js';
import inspectionRatingReasonDatas from './inspectionRatingReason/models/inspectionRatingReason.js';
import dockAbuseFieldDatas from './dockAbuseFields/models/dockAbuseFileds.js';
import gateinVehicleInventoryDatas from './gateInVehicleInventory/models/gateinVehicleInventory.js';
import VehicleInventoryCheckListDatas from './inventoryCheckList/models/InventoryCheckList.js';
import VehicleTypeDatas from './inventoryCheckList/models/vehicleType.js';
import transactionSubstatusdatas from './jobCard/models/transactionsubstatus.js';
import otdfailurereasondatas from './jobCard/models/otdfailurereason.js';
import paramAlertScheduleDatas from './paramAlertSchedule/models/paramAlertSchedule.js';
import roledatas from './user/models/roles.js';
import inventoryPhotoCategoryDatas from './inventoryPhotoCategory/models/inventoryPhotoCategory.js';
import JobCarddatas from './jobCard/models/jobCard.js';
import jobCardComplaintAdviceData from './jobCard/models/jobCardComplaintAdvice.js';
import scheduledatas from './jobCard/models/schedules.js';
import oslScheduledatas from './jobCard/models/oslSchedules.js';
import partsIndentdatas from './jobCard/models/partsIndent.js';
import scheduleMechanicMappingdatas from './jobCard/models/scheduleMechanicMapping.js';
import BillingsData from './jobCard/models/billings.js';

import partsIssuedatas from './Parts/partsissue/models/partsissue.js';
import Stocklogdatas from './Parts/partsissue/models/stockslog.js';
import Grns from './Parts/GRN/models/Grn.js';
import GrnDocuments from './Parts/GRN/models/GrnDocument.js';
import GrnParts from './Parts/GRN/models/GrnParts.js';
import Stocks from './Parts/GRN/models/Stocks.js';
import insuranceAddressdatas from './jobCard/models/insuranceAddress.js';
import transactionInsurancedatas from './jobCard/models/transactionInsurance.js';
import roleMenuTabSettingsDatas from './menuSettings/models/roleMenuTabSettings.js';
import receiptdatas from './receipts/models/receipt.js';
import partsReturndatas from "./Parts/partsreturn/models/partsreturn.js";
import StockReturnlogdatas from "./Parts/partsreturn/models/stocksreturnlog.js";
import PurchaseReturnsData from './Parts/GRN/models/PurchaseReturn.js';
import PurchaseReturnParts from './Parts/GRN/models/PurchaseReturnParts.js';
import Countersales from './Parts/counterSale/models/countersale.js';
import Countersalepartdatas from './Parts/counterSale/models/countersaleparts.js';
import CountersaleStocklogdatas from './Parts/counterSale/models/countersalestocklog.js';
import employeeoutletmapdatas from './employee/models/employeeOutletMapping.js'
import CounterSaleReturnlogdatas from './Parts/counterSale/models/countersalereturnlog.js';
import Countersalereturnpartdatas from './Parts/counterSale/models/countersalereturnpart.js';
import Countersalesreturndata from './Parts/counterSale/models/countersalereturn.js';
import counterSaleReturnUpdates from './Parts/counterSale/models/counterSaleReturnUpdates.js';
import stocktransferdata from './Parts/stockTransfer/models/stocktransfer.js';
import Stocktransferpartsdatas from './Parts/stockTransfer/models/stocktransferparts.js';
import StocktransferlogDatas from './Parts/stockTransfer/models/stocktransferlog.js';
import casualGatePass from './casualGatepass/casual.js';
import creditNotes from './cdNotes/creditNotes.js';
import creditNotesDetails from './creditNotesDetails/creditNoteDetails.js';
import PurchaseOrderData from './Parts/PurchaseOrder/models/PurchaseOrder.js';
import PurchaseOrderPartsData from './Parts/PurchaseOrder/models/PurchaseOrderParts.js';
import serviceReminder from './ServiceReminder/ServiceReminder.js';
import serviceReminderAlert from './ServiceReminder/ServiceReminderAlert.js';
import Gateindata from './Parts/gateIn/models/Gatein.js';
import GateinPartsdata from './Parts/gateIn/models/GateinParts.js';
import GateinPartsBinlocationsData from './Parts/gateIn/models/GateinPartsBinLocations.js';
import LeadsDatas from './leadManagement/models/lead.js';
import schemeDatas from './scheme/Scheme.js';
import schemeLaborDatas from './scheme/SchemeLabor.js';
import schemePartDatas from './scheme/SchemeParts.js';
import vehicleContractDatas from './vehicleContract/models/vehicleContract.js';
import vehicleContractSchemeDatas from './vehicleContract/models/vehicleContractScheme.js';
import Stockadjustment from './Parts/GRN/models/StockAdjustment.js';
import StockAdjustmentParts from './Parts/GRN/models/StockAdjustmentPart.js';
import NegAdjStocklogdatas from './Parts/GRN/models/NedadjStocklog.js';
import CountersaleRequestData from './Parts/counterSale/models/countersalerequest.js';
import CounterSaleRequestPartDatas from './Parts/counterSale/models/countersalerequestparts.js';
import counterSaleUpdates from './Parts/counterSale/models/counterSaleUpdates.js';
import TransactionUpdate from './jobCard/models/transactionUpdates.js'
import stockTransferUpdate from './Parts/stockTransfer/models/stockTransferUpdate.js';
import feedbackdatas from './feedbackQuestions/feedbackQuestion.js';
import psfreviewdatas from './psfreview/models/psfreview.js';
import psfreviewlogsdatas from './psfreview/models/psfreviewlog.js';
import customerfeedbackdatas from './psfreview/models/customerfeedback.js';
import stocktransferoracledata from './Parts/stockTransferOracle/models/stocktransferoracle.js';
import stocktransferoraclepartdata from './Parts/stockTransferOracle/models/stockTransferOracleParts.js';
import stocktransferapilogdata from './Parts/stockTransferOracle/models/stockTransferApilogs.js';
import MobileApiTrackData from './mobileApis/models/mobileReqResDetails.js';
import customercomplaintsourcedatas from './psfreview/models/customercomplaintsource.js';
import customercomplaintdatas from './psfreview/models/customercomplaint.js';
import cartdatas from './Parts/partsCatalogue/models/cart.js';
import OutletSequenceNumData from './jobCard/models/outletSequenceNum.js';
import orderhistorydatas from './Parts/partsCatalogue/models/orderhistory.js';
import stocktransferreqdata from './Parts/stockTransfer/models/stocktransferrequest.js';
import Stocktransferreqpartsdatas from './Parts/stockTransfer/models/stocktransferreqparts.js';
import lbsInsuranceCodeDatas from './creditNotesDetails/lbsInsuranceCode.js';
import lbsDebitNotesData from './creditNotesDetails/lbsdebitnotes.js';
import TransUploadDetailsDatas from './jobCard/models/transactionUpload.js';
import EnquiryDatas from './Parts/enquiry/models/enquiry.js';
import MonthlyTargetData from './outlet/models/montlyTarget.js';
import EnquiryChatDatas from './Parts/enquiry/models/enquiry_chats.js';
import EnquiryTokenDatas from './Parts/enquiry/models/enquiry_token.js';
import EnquiryIndentDatas from './Parts/enquiry/models/enquiry_indent.js';
import nmsaagentdatas from './nmsaAgent/models/nmsaAgent.js';
import nmsafollowuplogdatas from './nmsaAgent/models/nmsaFollowupLog.js';
import workshopcategorydatas from './workshopCategories/models/workshopCategory.js';
import gmsTokendatas from './user/models/GmsToken.js';
import activityplandatas from './activityPlan/models/activityPlan.js';
import beatplandatas from './beatPlan/models/beatPlan.js';
import beatactivitydatas from './beatPlan/models/beatActivityPlanMapping.js';
import franchiseonboardingdatas from './franchiseOnboarding/models/franchiseOnboarding.js';
import franchiseonboardingfeedatas from './franchiseOnboarding/models/franchiseOnboardingFee.js';
import franchiseonboardingfeesmasterdatas from './franchiseOnboarding/models/franchiseOnboardingFeesMaster.js';
import franchiseinsurancedatas from './franchiseOnboarding/models/franchiseInsurance.js';
import onboardinginsurancedetaildatas from './franchiseOnboarding/models/onboardingInsuranceDetail.js';
import businesscategorydatas from './franchiseOnboarding/models/businessCategory.js';
import passwordhistorydatas from './user/models/passwordLog.js';
import beatplanfranchiseupdatedatas from './beatPlan/models/beatPlanFranchiseUpdate.js';
import accountStatementDatas from './accountStatement/models/accountStatement.js';
import accountStatementChatDatas from './accountStatement/models/accountStatementChat.js';
import laborCategoryMappingdatas from './laborSchedule/models/laborCatogoryMapping.js';
import erpstocktransferdata from './Parts/erpStockTransfer/models/erpStockTransfer.js';
import erpstocktransferpartdata from './Parts/erpStockTransfer/models/erpStockTransferParts.js';
import erpstocktransferapilogdata from './Parts/erpStockTransfer/models/erpStockTransferApilogs.js';
import MasterCustomerAccount from './user/models/customerAccountId.js';
import CustomerAccountSettings from './masters/models/customerAccountSettings';
import securityGateOut from './vehicle/models/SecurityGateOut.js'
import securityGateIn from './vehicle/models/SecurityGateIn.js'
import FlaData from './vehicle/models/FlaData.js';
import VehicleGatein from './gateInVehicleInventory/models/VehicleGateInVehicles.js';
import SaveInventoryCheckListDatas from './inventoryCheckList/models/saveInventoryCheckList.js'
import InventoryGIChecklist from './gateInVehicleInventory/models/gateInInventoryDetails.js'
import SaveDentAndScratchDatas from './vehicle/models/DentandScratch.js';
import SaveGIDentAndScratchDatas from './vehicle/models/GiDentAndScratch.js';
import DriverPickUpDrop from './vehicle/models/DriverPickUpDrop.js';
import SaveCheckListTypeDatas from './vehicle/models/CheckListType.js';
import VisitAuditTrail from './jobCard/models/visitAuditTrail.js';
import CarpmRecords from './carpm/models/carpm.js';
import carpmstatusdata from './carpm/models/carpmStatus.js';
import preMinorCheckList from './mobilechecklists/models/preMinorChecklist.js';
import preMajorCheckList from './mobilechecklists/models/preMajorChecklist.js';
import preMoevCheckList from './mobilechecklists/models/preMoevChecklist.js';
import postMoevCheckList from './mobilechecklists/models/postMoevChecklist.js';
import pre2wSunChecklist from './mobilechecklists/models/pre2wSunChecklist.js';
import post2wSunChecklist from './mobilechecklists/models/post2wSunChecklist.js';
import pre3wSunCheckList from './mobilechecklists/models/pre3wSunChecklist.js';
import post3wSunCheckList from './mobilechecklists/models/pre3wSunChecklist.js';
import postMinorCheckList from './mobilechecklists/models/postMinorChecklist.js';
import postMajorCheckList from './mobilechecklists/models/postMajorChecklist.js';
import PreReasons from './mobilechecklists/models/preReason.js';
import BatteryDetails from './mobilechecklists/models/batteryDetails.js';
import SavePDCDentAndScratchDatas from './vehicle/models/PDCDentandScratch.js';
import SavePDCChecklist from './vehicle/models/PDCChecklist.js';
import InspectionTime from './mobilechecklists/models/InspectionTime.js';
import mobileImages from './images/modules/mobileImages.js';
import SaveDriverLocation from './vehicle/models/DriverLocation.js';
import userAttendance from './user/models/userAttendance.js';
import CustomerImageCount from './images/modules/imageCount.js';
import OtherCredentialsSettings from './masters/models/otherCredentials.js';
import ClickinStatus from './clickins/models/clickinstatus.js';
import ClickinsCallback from './clickins/models/clickinCallBack.js';
import ClickinsPartsSendToDMS from './clickins/models/clickinPartstoDMS.js';
import ClicksEstimateFromDMS from './clickins/models/clickinsEstimateFromDMS.js';

import nmsadropdownmasterdatas from './nmsaAgent/models/nmsaDropdownMaster.js';
import fitAppLogs from './Utils/model/fitAppLogs.js';
import roughEstimateDatas from './roughEstimate/models/roughEstimate.js';
import labourRoughEstimateDatas from './roughEstimate/models/laborRoughEstimate.js';
import partsRoughEstimatedatas from './roughEstimate/models/partsRoughEstimate.js';
import Etalogdatas from './Parts/partsissue/models/etalogs.js';
import catalogueUserDatas from './Parts/partsCatalogue/models/catalogueuser.js';
import dmsTokendatas from './user/models/DmsToken.js';
import attendancedatas from './attendance/models/attendance.js';
import regularisationdatas from './attendance/models/regularisation.js';

db.users = userdatas(sequelize, DataTypes);
db.MasterCustomerAccount = MasterCustomerAccount(sequelize, DataTypes);
db.customerAccountSettings = CustomerAccountSettings(sequelize, DataTypes);
db.stockTransferUpdate = stockTransferUpdate(sequelize, DataTypes);
db.transactionupdates = TransactionUpdate(sequelize, DataTypes);
db.role = roledatas(sequelize, DataTypes);
db.userlog = userlogdatas(sequelize, DataTypes);
db.passwordHistory = passwordhistorydatas(sequelize, DataTypes);
db.monthlyTarget = MonthlyTargetData(sequelize, DataTypes);
db.userrolemaps = userrolemapDatas(sequelize, DataTypes);
db.menudatas = menudatas(sequelize, DataTypes);
db.outletSequenceNums = OutletSequenceNumData(sequelize, DataTypes);
db.reference = referencedatas(sequelize, DataTypes);
db.subMenudatas = subMenudatas(sequelize, DataTypes);
db.rolesettingsdatas = rolesettingsdatas(sequelize, DataTypes);
db.roleSubmenuButtons = roleSubmenuButtondatas(sequelize, DataTypes);
db.items = itemdatas(sequelize, DataTypes);
db.itemcompanymaps = itemcompanymapdatas(sequelize, DataTypes);
db.itemgroups = itemgroupdatas(sequelize, DataTypes);
db.itemcategories = itemcategoriedatas(sequelize, DataTypes);
db.creditnoteupdate = CreditNoteUpdate(sequelize, DataTypes);
db.laborCategory = laborCategorydatas(sequelize, DataTypes);
db.laborSubCategory = laborSubCategoryDatas(sequelize, DataTypes);
db.hsns = hsndatas(sequelize, DataTypes);
db.companies = companydatas(sequelize, DataTypes);
db.uom = uomdatas(sequelize, DataTypes);
db.aggregates = aggregatedatas(sequelize, DataTypes);
db.subaggregates = subaggregateDatas(sequelize, DataTypes);
db.makes = makedatas(sequelize, DataTypes);
db.makecompanymaps = makecompanymapdatas(sequelize, DataTypes);
db.varients = varientdatas(sequelize, DataTypes);
db.servicetypes = servicetypedatas(sequelize, DataTypes);
db.servicetypecompanymaps = servicetypecompanymapdatas(sequelize, DataTypes);
db.repairtypes = repairtypedatas(sequelize, DataTypes);
db.repairtypecompanymaps = repairtypecompanymapdatas(sequelize, DataTypes);

db.recentActivity = recentActivityDatas(sequelize, DataTypes);

db.models = modeldatas(sequelize, DataTypes);
db.modelcompanymaps = modelcompanymapdatas(sequelize, DataTypes);
db.modelvarientmaps = modelvarientmapdatas(sequelize, DataTypes);
db.sources = sourcedatas(sequelize, DataTypes);
db.sourcecompanymaps = sourcecompanymapdatas(sequelize, DataTypes);
db.sourcetypes = sourcetypedatas(sequelize, DataTypes);
db.sourcetypecompanymaps = sourcetypecompanymapdatas(sequelize, DataTypes);

db.vendors = vendordatas(sequelize, DataTypes);
db.returable = returnabledatas(sequelize, DataTypes);
db.returablePart = returnablePartsData(sequelize, DataTypes);
db.vendorcompanymaps = vendorcompanymapdatas(sequelize, DataTypes);
db.vendoritemgroupmaps = vendoritemgroupmapdatas(sequelize, DataTypes);
db.pincodes = pincodedatas(sequelize, DataTypes);
db.dispositions = dispositiondatas(sequelize, DataTypes);
db.dispositioncompanymaps = dispositioncompanymapdatas(sequelize, DataTypes);
db.subdispositions = subdispositiondatas(sequelize, DataTypes);
db.laborschedules = laborScheduledatas(sequelize, DataTypes);
db.laborcompanymaps = laborcompanymapdatas(sequelize, DataTypes);
db.dsaagents = dsaagentdatas(sequelize, DataTypes);
db.dsaagentcompanymaps = dsaagentcompanymapdatas(sequelize, DataTypes);
db.banks = bankdatas(sequelize, DataTypes);
db.fueltypes = fueltypedatas(sequelize, DataTypes);
db.outlets = outletdatas(sequelize, DataTypes);
db.outletSettings = OutletSettings(sequelize, DataTypes);
db.binLocations = binLocationDatas(sequelize, DataTypes);
db.employeeroles = employeeroledatas(sequelize, DataTypes);
db.employees = employeedatas(sequelize, DataTypes);
db.employeeoutletmap = employeeoutletmapdatas(sequelize, DataTypes);
db.customers = customerDatas(sequelize, DataTypes);
db.customertypes = customerTypeDatas(sequelize, DataTypes);
db.customercategory = customerCategoryDatas(sequelize, DataTypes);
db.billtypes = billTypeDatas(sequelize, DataTypes);
db.vehicles = vehicleDatas(sequelize, DataTypes);
db.VehicleGatein = VehicleGatein(sequelize, DataTypes);
db.saveInventoryCheckList = SaveInventoryCheckListDatas(sequelize, DataTypes);
db.InventoryGIChecklist = InventoryGIChecklist(sequelize, DataTypes);
db.saveDentAndScratch = SaveDentAndScratchDatas(sequelize, DataTypes);
db.saveGIDentAndScratch = SaveGIDentAndScratchDatas(sequelize, DataTypes);
db.DriverPickUpDrop = DriverPickUpDrop(sequelize, DataTypes);
db.saveCheckListType = SaveCheckListTypeDatas(sequelize, DataTypes);
db.flaData = FlaData(sequelize, DataTypes);
db.visitAuditTrail = VisitAuditTrail(sequelize, DataTypes);
db.vehiclecolors = vehiclecolordatas(sequelize, DataTypes);
db.insurances = insurancedatas(sequelize, DataTypes);
db.servicebookings = serviceBookingDatas(sequelize, DataTypes);
db.servicebookingactivities = serviceBookingActivityDatas(sequelize, DataTypes);
db.transactionRecentActivity = transactionRecentActivityDatas(
  sequelize,
  DataTypes
);
db.servicEstimates = servicEstimateDatas(sequelize, DataTypes);
db.pickupDropoffLogs = pickupDropoffLogData(sequelize, DataTypes);
db.driverMaster = driverMasterData(sequelize, DataTypes);
db.bookingApiLogs = bookingApiLogData(sequelize, DataTypes);
db.pickupTypes = pickupTypeDatas(sequelize, DataTypes);
db.dockFields = dockFieldDatas(sequelize, DataTypes);
db.dockAbuseFields = dockAbuseFieldDatas(sequelize, DataTypes);
db.gateinVehicleInventory = gateinVehicleInventoryDatas(sequelize, DataTypes);
db.vehicleInventoryCheckList = VehicleInventoryCheckListDatas(
  sequelize,
  DataTypes
);
db.paramAlertSchedules = paramAlertScheduleDatas(sequelize, DataTypes);

db.VehicleTypes = VehicleTypeDatas(sequelize, DataTypes);
db.inputTypes = inputTypeDatas(sequelize, DataTypes);
db.labourEstimates = labourEstimateDatas(sequelize, DataTypes);
db.oslLabourEstimate = oslLabourEstimateDatas(sequelize, DataTypes);
db.partsEstimates = partsEstimatedatas(sequelize, DataTypes);
db.tyreOem = tyreOemDatas(sequelize, DataTypes);
db.fitMasterRecentActivity = fitMasterRecentActivityDatas(sequelize, DataTypes);
db.tyreSize = tyreSizeDatas(sequelize, DataTypes);
db.batteryOem = batteryOemDatas(sequelize, DataTypes);
db.clickInPart = clickInPartNameDatas(sequelize, DataTypes);
db.predeliveryCheckList = CheckListDatas(sequelize, DataTypes);
db.tyreOem = tyreOemDatas(sequelize, DataTypes);
db.fitMasterRecentActivity = fitMasterRecentActivityDatas(sequelize, DataTypes);
db.tyreSize = tyreSizeDatas(sequelize, DataTypes);
db.customerAccountType = customerAccountTypeDatas(sequelize, DataTypes);
db.checkListTypes = checkListTypeDatas(sequelize, DataTypes);
db.inspectionSubsystemMap = inspectionSubsystemMapDatas(sequelize, DataTypes);
db.inspectionChekList = inspectionCheckListDatas(sequelize, DataTypes);
db.inspectionRatingReason = inspectionRatingReasonDatas(sequelize, DataTypes);
db.transactionsubstatuses = transactionSubstatusdatas(sequelize, DataTypes);
db.otdfailurereason = otdfailurereasondatas(sequelize, DataTypes);
db.inventoryPhotoCategory = inventoryPhotoCategoryDatas(sequelize, DataTypes);
db.jobCard = JobCarddatas(sequelize, DataTypes);
db.jobCardComplaintAdvice = jobCardComplaintAdviceData(sequelize, DataTypes);
db.schedules = scheduledatas(sequelize, DataTypes);
db.oslSchedules = oslScheduledatas(sequelize, DataTypes);
db.partsIndent = partsIndentdatas(sequelize, DataTypes);
db.mechaniceMapping = scheduleMechanicMappingdatas(sequelize, DataTypes);
db.billings = BillingsData(sequelize, DataTypes);

db.grns = Grns(sequelize, DataTypes)
db.grndocuments = GrnDocuments(sequelize, DataTypes)
db.grnparts = GrnParts(sequelize, DataTypes)
db.stocks = Stocks(sequelize, DataTypes)
db.partsIssue = partsIssuedatas(sequelize, DataTypes)
db.stockLog = Stocklogdatas(sequelize, DataTypes)
db.partsReturn = partsReturndatas(sequelize, DataTypes)
db.stockReturnLog = StockReturnlogdatas(sequelize, DataTypes)
db.purchasereturn = PurchaseReturnsData(sequelize, DataTypes)
db.purchasereturnpart = PurchaseReturnParts(sequelize, DataTypes)
db.countersale = Countersales(sequelize, DataTypes)
db.countersalepart = Countersalepartdatas(sequelize, DataTypes)
db.counterSaleUpdate = counterSaleUpdates(sequelize, DataTypes);
db.stocktransfer = stocktransferdata(sequelize, DataTypes)
db.stocktransferparts = Stocktransferpartsdatas(sequelize, DataTypes)
db.stocktransferlog = StocktransferlogDatas(sequelize, DataTypes)
db.casualGatePass = casualGatePass(sequelize, DataTypes);
db.creditNotes = creditNotes(sequelize, DataTypes);
db.creditNotesDetails = creditNotesDetails(sequelize, DataTypes);
db.purchaseOrder = PurchaseOrderData(sequelize, DataTypes);
db.purchaseOrderParts = PurchaseOrderPartsData(sequelize, DataTypes);
db.serviceReminder = serviceReminder(sequelize, DataTypes);
db.serviceReminderAlert = serviceReminderAlert(sequelize, DataTypes);
db.leads = LeadsDatas(sequelize, DataTypes);
db.scheme = schemeDatas(sequelize, DataTypes);
db.schemeLabor = schemeLaborDatas(sequelize, DataTypes);
db.schemePart = schemePartDatas(sequelize, DataTypes);
db.vehicleContract = vehicleContractDatas(sequelize, DataTypes);
db.vehicleContractScheme = vehicleContractSchemeDatas(sequelize, DataTypes);
db.insuranceAddress = insuranceAddressdatas(sequelize, DataTypes);
db.transactionInsurance = transactionInsurancedatas(sequelize, DataTypes);
db.roleMentuTabSettings = roleMenuTabSettingsDatas(sequelize, DataTypes);
db.receipt = receiptdatas(sequelize, DataTypes);
db.coutersalelog = CountersaleStocklogdatas(sequelize, DataTypes)
db.countersalereturnpart = Countersalereturnpartdatas(sequelize, DataTypes)
db.Countersalereturnlog = CounterSaleReturnlogdatas(sequelize, DataTypes)
db.countersalereturn = Countersalesreturndata(sequelize, DataTypes)
db.countersalereturnupdates = counterSaleReturnUpdates(sequelize, DataTypes)
db.securityGateIn = securityGateIn(sequelize, DataTypes);
db.securityGateOut = securityGateOut(sequelize, DataTypes);
db.gateIn = Gateindata(sequelize, DataTypes)
db.gateInParts = GateinPartsdata(sequelize, DataTypes)
db.gateinbinlocation = GateinPartsBinlocationsData(sequelize, DataTypes)
db.stockadjustment = Stockadjustment(sequelize, DataTypes)
db.stockadjustmentparts = StockAdjustmentParts(sequelize, DataTypes)
db.Negadjstocklog = NegAdjStocklogdatas(sequelize, DataTypes)
db.countersaleRequest = CountersaleRequestData(sequelize, DataTypes)
db.countersaleRequestParts = CounterSaleRequestPartDatas(sequelize, DataTypes)
db.feedback_questions = feedbackdatas(sequelize, DataTypes)
db.psfreviews = psfreviewdatas(sequelize, DataTypes)
db.psfreviewlogs = psfreviewlogsdatas(sequelize, DataTypes)
db.customerfeedback = customerfeedbackdatas(sequelize, DataTypes)
db.stocktransferoracle = stocktransferoracledata(sequelize, DataTypes)
db.stocktransferoracleparts = stocktransferoraclepartdata(sequelize, DataTypes)
db.stocktransferapilogs = stocktransferapilogdata(sequelize, DataTypes)
db.MobileApiTrackData = MobileApiTrackData(sequelize, DataTypes)
db.customercomplaintsource = customercomplaintsourcedatas(sequelize, DataTypes)
db.customercomplaint = customercomplaintdatas(sequelize, DataTypes)
db.carts = cartdatas(sequelize, DataTypes);
db.order_histories = orderhistorydatas(sequelize, DataTypes);
db.stocktransferrequest = stocktransferreqdata(sequelize, DataTypes)
db.stocktransferrequestparts = Stocktransferreqpartsdatas(sequelize, DataTypes)
db.lbsInsuranceCode = lbsInsuranceCodeDatas(sequelize, DataTypes)
db.lbsDebitNotes = lbsDebitNotesData(sequelize, DataTypes)
db.transUploadDetails = TransUploadDetailsDatas(sequelize, DataTypes)
db.enquiry = EnquiryDatas(sequelize, DataTypes)
db.enquiryChat = EnquiryChatDatas(sequelize, DataTypes)
db.enquiryToken = EnquiryTokenDatas(sequelize, DataTypes)
db.enquiryIndent = EnquiryIndentDatas(sequelize, DataTypes)
db.nmsaAgents = nmsaagentdatas(sequelize, DataTypes)
db.nmsaFollowupLog = nmsafollowuplogdatas(sequelize, DataTypes)
db.workshopCategory = workshopcategorydatas(sequelize, DataTypes)

db.gmsToken = gmsTokendatas(sequelize, DataTypes);
db.dmsToken = dmsTokendatas(sequelize, DataTypes);
db.activityPlan = activityplandatas(sequelize, DataTypes);
db.beatPlan = beatplandatas(sequelize, DataTypes);
db.beatActivity = beatactivitydatas(sequelize, DataTypes);
db.franchiseOnboarding = franchiseonboardingdatas(sequelize, DataTypes);
db.franchiseOnboardingFee = franchiseonboardingfeedatas(sequelize, DataTypes);
db.franchiseOnboardingFeesMaster = franchiseonboardingfeesmasterdatas(sequelize, DataTypes);
db.franchiseInsurance = franchiseinsurancedatas(sequelize, DataTypes);
db.onboardingInsuranceDetail = onboardinginsurancedetaildatas(sequelize, DataTypes);
db.businessCategory = businesscategorydatas(sequelize, DataTypes);
db.beatPlanFranchiseUpdate = beatplanfranchiseupdatedatas(sequelize, DataTypes);
db.accountStatements = accountStatementDatas(sequelize, DataTypes);
db.accountStatementChats = accountStatementChatDatas(sequelize, DataTypes);
db.carpmRecords = CarpmRecords(sequelize, DataTypes);
db.carpmstatusdata = carpmstatusdata(sequelize, DataTypes);
db.preMinorCheckList = preMinorCheckList(sequelize, DataTypes);
db.preMajorCheckList = preMajorCheckList(sequelize, DataTypes);
db.preMoevCheckList = preMoevCheckList(sequelize, DataTypes);
db.postMoevCheckList = postMoevCheckList(sequelize, DataTypes);
db.pre2wSunChecklist = pre2wSunChecklist(sequelize, DataTypes);
db.post2wSunChecklist = post2wSunChecklist(sequelize, DataTypes);
db.pre3wSunChecklist = pre3wSunCheckList(sequelize, DataTypes);
db.post3wSunCheckList = post3wSunCheckList(sequelize, DataTypes);
db.postMinorCheckList = postMinorCheckList(sequelize, DataTypes);
db.postMajorCheckList = postMajorCheckList(sequelize, DataTypes);
db.preReasons = PreReasons(sequelize, DataTypes);
db.batteryDetails = BatteryDetails(sequelize, DataTypes);
db.savePDCDentAndScratch = SavePDCDentAndScratchDatas(sequelize, DataTypes);
db.savePDCChecklist = SavePDCChecklist(sequelize, DataTypes);
db.InspectionTime = InspectionTime(sequelize, DataTypes);
db.mobileImages = mobileImages(sequelize, DataTypes);
db.saveDriverLocation = SaveDriverLocation(sequelize, DataTypes);
db.saveuserAttendance = userAttendance(sequelize, DataTypes);
db.imageCount = CustomerImageCount(sequelize, DataTypes);
db.otherCredentialsSettings = OtherCredentialsSettings(sequelize, DataTypes);
db.clickinStatus = ClickinStatus(sequelize, DataTypes);
db.clickinsCallback = ClickinsCallback(sequelize, DataTypes);
db.ClickinsPartsSendToDMS = ClickinsPartsSendToDMS(sequelize, DataTypes);
db.ClicksEstimateFromDMS = ClicksEstimateFromDMS(sequelize, DataTypes);
db.laborCategoryMapping = laborCategoryMappingdatas(sequelize, DataTypes);
db.erpstocktransfer = erpstocktransferdata(sequelize, DataTypes);
db.erpstocktransferparts = erpstocktransferpartdata(sequelize, DataTypes);
db.erpstocktransferapilogs = erpstocktransferapilogdata(sequelize, DataTypes);
db.nmsaDropdownMasters = nmsadropdownmasterdatas(sequelize, DataTypes);
db.fitAppLogs = fitAppLogs(sequelize, DataTypes);
db.roughEstimate = roughEstimateDatas(sequelize, DataTypes);
db.laborRoughEstimate = labourRoughEstimateDatas(sequelize, DataTypes);
db.partsRoughEstimate = partsRoughEstimatedatas(sequelize, DataTypes);
db.etalogs = Etalogdatas(sequelize, DataTypes);
db.catalogueusers = catalogueUserDatas(sequelize, DataTypes);
db.attendance = attendancedatas(sequelize, DataTypes);
db.attendanceRegularisations = regularisationdatas(sequelize, DataTypes);
sequelize.sync({ force: false })  // force: true drops the table and recreates it, false ensures it's created only if it doesn't exist
  .then(() => {
    console.log('Tables have been created');
  })
  .catch((error) => {
    console.error('Error creating table:', error);
  });


// One-to-Many Relationship
db.grns.hasMany(db.grnparts, { foreignKey: 'grn_id', as: 'grnparts' });
db.grnparts.belongsTo(db.grns, { foreignKey: 'grn_id', as: 'grn' });
db.grns.hasMany(db.stocks, { foreignKey: 'grn_id', as: 'grnstocks' });
db.grnparts.hasMany(db.stocks, { foreignKey: "grn_parts_id", as: 'grnpartsstocksmap' })
db.vendors.hasMany(db.grns, { foreignKey: 'vendor_id', as: 'vendorgrnmap' });
db.grns.belongsTo(db.vendors, { foreignKey: "vendor_id", as: "grnvendormap" })
db.partsIndent.hasMany(db.partsIssue, { foreignKey: 'indent_id', as: 'partissuemap' })
db.purchasereturn.hasMany(db.purchasereturnpart, { foreignKey: 'purchase_return_id', as: 'purchasereturnparts' });
db.purchasereturnpart.belongsTo(db.purchasereturn, { foreignKey: 'purchase_return_id', as: 'purchasereturn' });
db.countersale.hasMany(db.countersalepart, { foreignKey: 'counter_sale_id', as: "countersale_parts" });

db.countersale.hasMany(db.countersalereturn, { foreignKey: 'counter_sale_id', as: 'returns' });

db.passwordHistory.belongsTo(db.users, { foreignKey: 'user_id', as: 'user' });
db.users.hasMany(db.passwordHistory, { foreignKey: 'user_id', as: 'passwordHistories' });



db.countersalereturn.belongsTo(db.countersale, { foreignKey: 'counter_sale_id' });

db.countersalereturn.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet'
});

db.outletSequenceNums.belongsTo(db.outlets,{
foreignKey : 'outlet_code',
targetKey: 'outletCode', 
as: 'outletSequenceNum' 
});

db.monthlyTarget.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outletDetails'
});

db.outlets.hasMany(db.monthlyTarget, {
  foreignKey: 'outlet_id',
  as: 'monthlyTargets'
});


db.outlets.hasMany(db.countersalereturn, {
  foreignKey: 'outlet_id',
  as: 'countersaleReturns'
});

db.countersalereturn.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'customerDetails'
});

db.customers.hasMany(db.countersalereturn, {
  foreignKey: 'customer_id',
  as: 'countersaleReturnsCustomer'
});


// One Category has many SubCategories
db.laborCategory.hasMany(db.laborSubCategory, {
  foreignKey: 'categoryId',
  as: 'subCategories',
});

// Each SubCategory belongs to one Category
db.laborSubCategory.belongsTo(db.laborCategory, {
  foreignKey: 'categoryId',
  as: 'categoryDetails',
});


db.countersalereturn.hasMany(db.countersalereturnpart, { foreignKey: 'countersale_return_id', as: "countersale_return_parts" });
db.countersale.hasMany(db.counterSaleUpdate, { foreignKey: 'counter_sale_id', as: "CSupdates" });
db.jobCard.hasMany(db.transactionupdates, { foreignKey: 'transaction_id', as: 'transactionupdates' });
db.countersalereturn.hasMany(db.countersalereturnupdates, { foreignKey: 'counter_sale_return_id', as: "CSRupdates" });
db.countersalepart.belongsTo(db.countersale, { foreignKey: 'counter_sale_id', as: 'countersales' });
db.stocktransfer.hasMany(db.stocktransferparts, { foreignKey: 'stock_transfer_id', as: 'stocktransferparts' })
db.stocktransferparts.belongsTo(db.stocktransfer, { foreignKey: 'stock_transfer_id', as: 'stocktransfer' })
db.stocktransfer.belongsTo(db.outlets, { foreignKey: 'outlet_id', as: 'stocktransferoutlet' })
db.purchaseOrder.hasMany(db.purchaseOrderParts, { foreignKey: 'po_id', as: 'po_parts' })
db.purchaseOrderParts.belongsTo(db.purchaseOrder, { foreignKey: 'po_id', as: 'purchaseorder' })
db.purchaseOrder.belongsTo(db.vendors, { foreignKey: "vendor_id", as: "povendormap" })
db.purchaseOrderParts.belongsTo(db.makes, { foreignKey: "make_id", as: "pomakemap" })
db.purchaseOrderParts.belongsTo(db.models, { foreignKey: "model_id", as: "pomodelmap" })
db.purchaseOrderParts.belongsTo(db.itemcategories, { foreignKey: "part_category_id", as: "poitemcategorymap" })
db.grns.belongsTo(db.purchaseOrder, { foreignKey: "po_id", as: "pogrnmap" })
db.countersaleRequest.hasMany(db.countersaleRequestParts, { foreignKey: 'counter_sale_req_id', as: 'countersale_request_parts' })
db.countersale.belongsTo(db.outlets, { foreignKey: "outlet_id", as: "csoutletmap" })
db.psfreviewlogs.belongsTo(db.dispositions, { foreignKey: "psf_disposition", as: "dispositionmap" })
db.psfreviewlogs.belongsTo(db.subdispositions, { foreignKey: "psf_sub_disposition", as: "subdispositionmap" })
db.psfreviews.hasMany(db.customerfeedback, { foreignKey: "psf_review_id", as: "customerfeedback" })
db.psfreviews.hasMany(db.psfreviewlogs, { foreignKey: "psf_review_id", as: "psfreviewlog" })
db.stocktransferoracle.hasMany(db.stocktransferoracleparts, { foreignKey: 'stock_transfer_oracle_id', as: 'stocktransferoracleparts' })
db.stocktransferoracleparts.belongsTo(db.items, { foreignKey: 'itemNumber', targetKey: 'itemCode', as: 'oracleitem' })
db.customercomplaint.belongsTo(db.customercomplaintsource, { foreignKey: 'source_of_complaint', as: 'ccsource' })
db.stocktransferrequest.hasMany(db.stocktransferrequestparts, { foreignKey: 'stock_transfer_req_id', as: 'stock_transfer_req_parts' })
db.stocktransferrequestparts.hasMany(db.stocks, { foreignKey: 'item_id', targetKey: 'item_id', as: 'stocktransfer_req_part_stocks' })
db.jobCard.hasOne(db.enquiry, { foreignKey: 'transaction_id', as: 'enquiries' })
db.jobCard.hasMany(db.schedules, {
  foreignKey: 'transaction_id',
  as: 'schedules',
});
db.schedules.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'schedulesMapping',
});

// One-to-Many Relationship
db.jobCard.hasMany(db.oslSchedules, {
  foreignKey: 'transaction_id',
  as: 'oslSchedules',
});
db.oslSchedules.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'oslschedulesMapping',
});

// One-to-Many Relationship
db.jobCard.hasMany(db.partsIndent, {
  foreignKey: 'transaction_id',
  as: 'partsIndent',
});
db.partsIndent.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'partsIndentMapping',
});

// One-to-Many Relationship
db.jobCard.hasMany(db.partsIssue, {
  foreignKey: 'transaction_id',
  as: 'partsIssue',
});
db.partsIssue.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'partsIssueMapping',
});

// One-to-Many Relationship between Service Estimate and labourEstimates
db.servicEstimates.hasMany(db.oslLabourEstimate, {
  foreignKey: 'serviceEstimateId',
  as: 'oslLabourEstimate',
});
db.oslLabourEstimate.belongsTo(db.servicEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'serviceOslLabourMapping',
});

// One-to-Many Relationship between Service Estimate and labourEstimates
db.servicEstimates.hasMany(db.labourEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'serviceLabour',
});
// One-to-Many Relationship between Service Estimate and labourEstimates
db.servicEstimates.hasMany(db.labourEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'labourEstimate',
});
db.labourEstimates.belongsTo(db.servicEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'serviceLabourMapping',
});

// One-to-Many Relationship between Service Estimate and labourEstimates
db.servicEstimates.hasMany(db.partsEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'partEstimate',
});
db.partsEstimates.belongsTo(db.servicEstimates, {
  foreignKey: 'serviceEstimateId',
  as: 'servicePartMapping',
});

//  1 to Many Relation
// /* Aggregate Sub Aggregate Mapping Start */
db.aggregates.hasMany(db.subaggregates, {
  foreignKey: 'aggregateId',
  as: 'subaggregate',
});

db.subaggregates.belongsTo(db.aggregates, {
  foreignKey: 'aggregateId',
  as: 'aggregate',
});
// /* Aggregate Sub Aggregate Mapping End */

// // /* Make Company Mapping Start */
//  db.rolesettingsdatas.hasMany(db.menudatas, { foreignKey: 'id', as: 'menurolemaps' })
//  db.menudatas.belongsTo(db.rolesettingsdatas, { foreignKey: 'id', as: 'menus' })

db.menudatas.hasMany(db.rolesettingsdatas, {
  foreignKey: 'menuId',
  as: 'menurolemaps',
});
db.rolesettingsdatas.belongsTo(db.menudatas, {
  foreignKey: 'menuId',
  as: 'menus',
});

//  db.roleSubmenuButtons.hasMany(db.subMenudatas, { foreignKey: 'submenuId', as: 'submenuButtonsMap' })
//  db.subMenudatas.belongsTo(db.roleSubmenuButtons, { foreignKey: 'submenuId', as: 'submenuButtons' })

db.subMenudatas.hasMany(db.roleSubmenuButtons, {
  foreignKey: 'submenuId',
  as: 'submenuButtonsMap',
});
db.roleSubmenuButtons.belongsTo(db.subMenudatas, {
  foreignKey: 'submenuId',
  as: 'submenuButtons',
});

// /* Make Company Mapping Start */
db.makes.hasMany(db.makecompanymaps, {
  foreignKey: 'makeId',
  as: 'makecompanymaps',
});
db.makecompanymaps.belongsTo(db.makes, { foreignKey: 'makeId', as: 'makes' });

db.users.hasMany(db.userrolemaps, {
  foreignKey: 'userId',
  as: 'userrolemaps',
});
db.userrolemaps.belongsTo(db.users, { foreignKey: 'userId', as: 'users' });

db.userrolemaps.belongsTo(db.role, { foreignKey: 'roleId', as: 'rolemap' });

db.companies.hasMany(db.makecompanymaps, {
  foreignKey: 'companyId',
  as: 'makecompanymaps',
});
db.makecompanymaps.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'companies',
});
// /* Make Company Mapping End */

// /* Employee outlet Map */
db.employees.hasMany(db.employeeoutletmap, {
  foreignKey: 'emp_id',
  as: 'employee_outlet_map'
});
db.employeeoutletmap.belongsTo(db.employees, { foreignKey: 'emp_id', as: 'employee_outlet_map' });


db.employees.belongsTo(db.outlets, {
  foreignKey: 'outletId',
  as: 'outlets'
});
db.outlets.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'company'
});
db.outlets.hasMany(db.employees, { foreignKey: 'outletId', as: 'employee' });

// /* Service Type Company Mapping Start */
db.servicetypes.hasMany(db.servicetypecompanymaps, {
  foreignKey: 'serviceTypeId',
  as: 'servicetypecompanymap',
});
db.servicetypecompanymaps.belongsTo(db.servicetypes, {
  foreignKey: 'serviceTypeId',
  as: 'servicetypecompanymap',
});

// db.companies.hasMany(db.servicetypecompanymaps, { foreignKey: 'companyId', as: 'servicetypecompanymaps' })
// db.servicetypecompanymaps.belongsTo(db.companies, { foreignKey: 'companyId', as: 'companies' })
// /* Service Type Company Mapping Emd */

// /* Repair Type Company Mapping Start */
db.repairtypes.hasMany(db.repairtypecompanymaps, {
  foreignKey: 'repairTypeId',
  as: 'repairtypecompanymap',
});
db.repairtypecompanymaps.belongsTo(db.repairtypes, {
  foreignKey: 'repairTypeId',
  as: 'repairtype',
});

db.companies.hasMany(db.repairtypecompanymaps, {
  foreignKey: 'companyId',
  as: 'repairtypecompanymap',
});
db.repairtypecompanymaps.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'companies',
});
// /* Repair Type Company Mapping End */

// // CommonLogs
db.commonlogs = commonlogdatas(sequelize, DataTypes);

db.auditlogs = auditlogdatas(
  sequelize,
  DataTypes,
  commonLogic.getCurrentMonthTableName()
);
// /* Role Access Module Mapping End */

// /* Model Company Mapping Start */
db.models.hasMany(db.modelcompanymaps, {
  foreignKey: 'modelId',
  as: 'modelcompanymaps',
});
db.modelcompanymaps.belongsTo(db.models, {
  foreignKey: 'modelId',
  as: 'models',
});


db.models.belongsTo(db.varients, {
  foreignKey: 'varientId',
  as: 'primaryVarient',
});


db.models.belongsToMany(db.varients, {
  through: db.modelvarientmaps,
  foreignKey: 'modelId',
  otherKey: 'varientId',
  as: 'multipleVarients',
});

// Varient side
db.varients.belongsToMany(db.models, {
  through: db.modelvarientmaps,
  foreignKey: 'varientId',
  otherKey: 'modelId',
  as: 'models',
});


db.companies.hasMany(db.modelcompanymaps, {
  foreignKey: 'companyId',
  as: 'modelcompanymaps',
});
db.modelcompanymaps.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'companies',
});
// /* Model Company Mapping End */

// /* Model Make Company Mapping Start */
// One-to-Many Relationship between makes and models
db.makes.hasMany(db.models, { foreignKey: 'makeId', as: 'models' });
db.models.belongsTo(db.makes, { foreignKey: 'makeId', as: 'make' });

db.varients.hasMany(db.models, {
  foreignKey: 'varientId',
  as: 'modelvarientmaps',
});
db.models.belongsTo(db.varients, { foreignKey: 'varientId', as: 'varients' });
// /* Soruce Company Mapping Start */
db.sources.hasMany(db.sourcecompanymaps, {
  foreignKey: 'sourceId',
  as: 'sourcecompanymap',
});
db.sourcecompanymaps.belongsTo(db.sources, {
  foreignKey: 'sourceId',
  as: 'source',
});
// /* Source Company Mapping End */

// /* Soruce and Source Type  Mapping Start */
db.sources.hasMany(db.sourcetypes, {
  foreignKey: 'sourceId',
  as: 'sourcetypes',
});
db.sourcetypes.belongsTo(db.sources, { foreignKey: 'sourceId', as: 'sources' });
// /* Soruce and Source Type  Mapping End */

// /* Soruce Type Company Mapping Start */
db.sourcetypes.hasMany(db.sourcetypecompanymaps, {
  foreignKey: 'sourceTypeId',
  as: 'sourcetypecompanymap',
});
db.sourcetypecompanymaps.belongsTo(db.sourcetypes, {
  foreignKey: 'sourceTypeId',
  as: 'sourcetype',
});
// /* Soruce and Source Type  Mapping End */

db.companies.hasMany(db.modelcompanymaps, {
  foreignKey: 'companyId',
  as: 'modeltocompanymaps',
});
db.modelcompanymaps.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'companiesmodel',
});

db.items.hasMany(db.itemcompanymaps, {
  foreignKey: 'itemId',
  as: 'itemcompanymap',
});
db.itemcompanymaps.belongsTo(db.items, { foreignKey: 'itemId', as: 'item' });
// modelvarientmaps associations
db.modelvarientmaps.belongsTo(db.varients, {
  foreignKey: 'varientId',
  as: 'varient',
});
db.companies.hasMany(db.itemcompanymaps, {
  foreignKey: 'companyId',
  as: 'itemcompanymap',
});
db.itemcompanymaps.belongsTo(db.companies, {
  foreignKey: 'companyId',
  as: 'companies',
});

db.returable.hasMany(db.returablePart, {
  foreignKey: "returnable_id",
  as: "parts",
})

db.returablePart.belongsTo(db.returable, {
  foreignKey: "returnable_id",
  as: "returnable",
})
// /* vendor related mapping start */
db.vendors.hasMany(db.vendorcompanymaps, {
  foreignKey: 'vendorId',
  as: 'vendorcompanymap',
});
db.vendorcompanymaps.belongsTo(db.vendors, {
  foreignKey: 'vendorId',
  as: 'vendor',
});

db.vendors.hasMany(db.vendoritemgroupmaps, {
  foreignKey: 'vendorId',
  as: 'vendoritemgroupmap',
});
db.vendoritemgroupmaps.belongsTo(db.vendors, {
  foreignKey: 'vendorId',
  as: 'vendor',
});
// /* vendor related mapping end */

// DisPosition Mapping
db.dispositions.hasMany(db.dispositioncompanymaps, {
  foreignKey: 'dispositionId',
  as: 'dispositioncompanymap',
});
db.dispositioncompanymaps.belongsTo(db.dispositions, {
  foreignKey: 'dispositionId',
  as: 'dispositions',
});

db.dispositions.hasMany(db.subdispositions, {
  foreignKey: 'disPositionId',
  as: 'subDispositions',
});
db.subdispositions.belongsTo(db.dispositions, {
  foreignKey: 'disPositionId',
  as: 'dispositions',
});

// /* labour company mapping */
db.laborschedules.hasMany(db.laborcompanymaps, {
  foreignKey: 'laborId',
  as: 'laborcompanymap',
});
db.laborcompanymaps.belongsTo(db.laborschedules, {
  foreignKey: 'laborId',
  as: 'laborschedule',
});
db.laborschedules.hasMany(db.schedules, {
  foreignKey: 'rot_id',
  as: 'schedules',
});
db.laborschedules.hasMany(db.oslSchedules, {
  foreignKey: 'rot_id',
  as: 'oslSchedules',
});

// Define the relationship from Employees to Users
db.employees.hasOne(db.users, {
  foreignKey: 'employeeId', // The foreign key in the Users table
  as: 'user', // Alias for the associated User
});

// Define the relationship from Users to Employees
db.users.belongsTo(db.employees, {
  foreignKey: 'employeeId', // The foreign key in the Users table
  as: 'employee', // Alias for the associated Employee
});

// /* Dsa company mapping */
db.dsaagents.hasMany(db.dsaagentcompanymaps, {
  foreignKey: 'dsaId',
  as: 'dsaagentcompanymap',
});
db.dsaagentcompanymaps.belongsTo(db.dsaagents, {
  foreignKey: 'dsaId',
  as: 'dsaagent',
});

db.employees.belongsTo(db.employeeroles, {
  foreignKey: 'employeeRoleId',
  as: 'employeerole',
});


// db.employees.belongsTo(db.employeeoutletmap, {
//   foreignKey: 'emp_id',
//   as: 'employeeoutlet',
// });


db.employees.hasMany(db.employeeoutletmap, {
  foreignKey: 'emp_id',
  as: 'employeeoutlet',
});


db.employeeoutletmap.belongsTo(db.employees, {
  foreignKey: 'emp_id',
  as: 'employeeoutlets',
});

db.employeeoutletmap.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet',
});

db.outlets.hasMany(db.employeeoutletmap, {
  foreignKey: 'outlet_id',
  as: 'employeeOutletMaps',
});

db.employees.belongsTo(db.outlets, {
  foreignKey: 'outletId',
  as: 'outlet',
});

db.employees.hasMany(db.outletSettings, {
  foreignKey: "OUTLET_ID",   // OutletSettings.outletId
  sourceKey: "outletId",    // Employee.outletId
  as: "outletSettingMany"       // alias used in queries
});


db.customers.belongsTo(db.sources, {
  foreignKey: 'sourceId',
  as: 'source',
});

db.customers.belongsTo(db.sourcetypes, {
  foreignKey: 'sourceTypeId',
  as: 'sourceType',
});

db.customers.belongsTo(db.outlets, {
  foreignKey: 'outletId',
  as: 'outlet',
});

db.vehicles.belongsTo(db.customers, {
  foreignKey: 'customerId',
  as: 'customer',
});

db.vehicles.belongsTo(db.makes, {
  foreignKey: 'makeId',
  as: 'make',
});

db.vehicles.belongsTo(db.models, {
  foreignKey: 'modelId',
  as: 'model',
});

db.vehicles.belongsTo(db.varients, {
  foreignKey: 'variantId',
  as: 'variant',
});
db.vehicles.hasOne(db.fueltypes, {
  sourceKey: 'fuelType',
  foreignKey: 'fuelTypeName',
  as: 'fuelTypeDetails',
});

db.vehicles.hasOne(db.insurances, {
  sourceKey: 'insuranceName',
  foreignKey: 'insuranceName',
  as: 'insuranceNameDetails',
});

db.customers.hasOne(db.pincodes, {
  sourceKey: 'pinCode',
  foreignKey: 'Pincode',
  as: 'pincodeDetails',
});

db.pincodes.belongsTo(db.customers, {
  targetKey: 'pinCode',
  foreignKey: 'Pincode',
  as: 'customer',
});

db.servicebookings.belongsTo(db.pincodes, {
  foreignKey: 'pincode',    // serviceBooking.pincode
  targetKey: 'Pincode',     // pincodes.Pincode
  as: 'pincodeDetails'
});

db.pincodes.hasMany(db.servicebookings, {
  foreignKey: 'pincode',
  sourceKey: 'Pincode',
});

db.outlets.hasMany(db.pincodes, {
  sourceKey: 'pincode',
  foreignKey: 'Pincode',
  as: 'pincodeDetailsOutlets',
});

db.servicebookings.belongsTo(db.outlets, {
  foreignKey: 'outletId',
  as: 'outlet',
});

db.servicebookings.belongsTo(db.dispositions, {
  foreignKey: 'dispositionId',
  as: 'disposition',
});

db.servicebookings.belongsTo(db.makes, {
  foreignKey: 'vehicleMakeId',
  as: 'make',
});

db.servicebookings.belongsTo(db.models, {
  foreignKey: 'vehicleModelId',
  as: 'model',
});

db.servicebookings.belongsTo(db.sourcetypes, {
  foreignKey: 'dmsSourceTypeId',
  as: 'sourcetype',
});

db.servicebookings.belongsTo(db.sources, {
  foreignKey: 'dmsSourceId',
  as: 'dmsSource',
});

db.servicEstimates.belongsTo(db.vehicles, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
db.servicEstimates.belongsTo(db.customers, {
  foreignKey: 'customerId',
  as: 'customer',
});
db.servicEstimates.belongsTo(db.servicetypes, {
  foreignKey: 'serviceType',
  as: 'servicetype',
});

db.jobCard.belongsTo(db.vehicles, {
  foreignKey: 'vehicle_id',
  as: 'vehicle',
});

db.oslSchedules.belongsTo(db.laborschedules, {
  foreignKey: 'rot_id',
  as: 'labourschedules',
});

db.schedules.belongsTo(db.laborschedules, {
  foreignKey: 'rot_id',
  as: 'labourschedules',
});

db.partsIndent.belongsTo(db.items, {
  foreignKey: 'item_id',
  as: 'items',
});

db.partsIssue.belongsTo(db.items, {
  foreignKey: 'item_id',
  as: 'items',
});

db.items.hasMany(db.stocks, {
  foreignKey: 'item_id',
  as: 'stocks',
});
db.items.hasMany(db.grnparts, {
  foreignKey: 'item_id',
  as: 'grnParts'
});
db.grnparts.belongsTo(db.items, {
  foreignKey: 'item_id',
  as: 'items',
});

db.stocks.belongsTo(db.items, { as: 'stockItems', foreignKey: 'item_id' });
db.transactionInsurance.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobcard',
});

db.jobCard.hasOne(db.transactionInsurance, {
  foreignKey: 'transaction_id',
  as: 'insurance',
});

db.billings.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobcard',
});

db.jobCard.belongsTo(db.dsaagents, {
  foreignKey: 'dsa_agent_id',
  as: 'dsaagent',
});

db.jobCard.belongsTo(db.sources, {
  foreignKey: 'source',
  as: 'sources',
});

db.jobCard.belongsTo(db.sourcetypes, {
  foreignKey: 'source_type',
  as: 'sourcetype',
});

db.jobCard.belongsTo(db.servicetypes, {
  foreignKey: 'service_type',
  as: 'servicetype',
});

db.jobCard.belongsTo(db.repairtypes, {
  foreignKey: 'repair_type',
  as: 'repairtype',
});

// db.jobCard.hasOne(db.transactionInsurance, {
//   foreignKey: 'transaction_id',
//   as: 'insurance',
// });

db.jobCard.hasOne(db.billings, {
  foreignKey: 'transaction_id',
  as: 'billing',
});

db.oslSchedules.belongsTo(db.vendors, {
  foreignKey: 'vendorId',
  as: 'vendor',
});

db.jobCard.belongsTo(db.users, {
  foreignKey: 'created_by',
  as: 'user',
});

db.receipt.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// db.receipt.belongsTo(db.customers, {
//   foreignKey: 'customer_code',
//   as: 'customerwithcode',
// });

db.receipt.belongsTo(db.customers, {
  foreignKey: 'customer_code',
  targetKey: 'customerCode',
  as: 'customerwithcode'
});

db.receipt.belongsTo(db.outlets, {
  foreignKey: 'customer_code',
  targetKey: 'outletCode',
  as: 'outletdetails',
  constraints: false
});

db.receipt.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobcard',
});

//casual gate pass

db.casualGatePass.belongsTo(db.makes, {
  foreignKey: 'makeId',
  as: 'makes'
});

db.casualGatePass.belongsTo(db.models, {
  foreignKey: 'modelId',
  as: 'models'
});

db.casualGatePass.belongsTo(db.employees, {
  foreignKey: 'technicianId',
  as: 'employees'
});

db.creditNotes.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'customers'
});

db.creditNotes.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet'
});

db.creditNotesDetails.belongsTo(db.creditNotes, {
  foreignKey: 'cn_id',
  as: 'creditNotes'
});

db.creditNotes.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobCard'
});

db.creditnoteupdate.belongsTo(db.creditNotes, {
  foreignKey: 'credit_note_id',
  as: 'creditNoteMap'
});

db.creditNotes.hasMany(db.creditnoteupdate, {
  foreignKey: "credit_note_id",
  as: "creditNotesUpdateMap"
})

db.creditNotes.hasMany(db.creditNotesDetails, {
  foreignKey: 'cn_id',
  as: 'creditNotesDetails'
})

db.jobCard.hasMany(db.creditNotes, {
  foreignKey: 'transaction_id',
  as: 'creditNotes'
});

db.serviceReminderAlert.hasMany(db.serviceReminder, {
  foreignKey: 'scheduleCode',
  sourceKey: 'schedule_code',
  as: 'serviceReminder',
});

db.gateIn.hasMany(db.gateInParts, {
  foreignKey: 'gatein_id',
  as: 'gateinparts'
});

db.gateInParts.belongsTo(db.gateIn, {
  foreignKey: 'gatein_id',
  as: 'gatein'
});
db.serviceReminderAlert.belongsTo(db.jobCard, {
  foreignKey: 'jc_id',
  as: 'jobcard',
});
db.jobCard.belongsTo(db.servicEstimates, {
  foreignKey: 'service_estimate_id',
  as: 'serviceEstimate',
});

db.mechaniceMapping.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobcard',
});

db.mechaniceMapping.belongsTo(db.employees, {
  foreignKey: 'mechanic_id',
  as: 'employee',
});

db.serviceReminderAlert.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet',
});

db.serviceReminderAlert.belongsTo(db.leads, {
  foreignKey: 'lead_id',
  as: 'lead',
});

db.leads.belongsTo(db.vehicles, {
  foreignKey: "vehicle_id",
  as: "vehicle"
});

db.schemeLabor.belongsTo(db.scheme, {
  foreignKey: "scheme_id",
  as: "scheme"
});

db.scheme.hasMany(db.schemeLabor, {
  foreignKey: "scheme_id",
  as: "labours"
});

db.schemePart.belongsTo(db.scheme, {
  foreignKey: "scheme_id",
  as: "scheme"
});

db.scheme.hasMany(db.schemePart, {
  foreignKey: "scheme_id",
  as: "parts"
});

db.vehicleContractScheme.belongsTo(db.vehicleContract, {
  foreignKey: 'vehicle_contract_id',
  as: 'vehicleContracts'
});

db.vehicleContract.hasMany(db.vehicleContractScheme, {
  foreignKey: 'vehicle_contract_id',
  as: 'vehicleContractSchemes'
});

db.vehicleContract.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'customer'
});

db.customers.hasMany(db.vehicleContract, {
  foreignKey: 'customer_id',
  as: 'vehicleContracts'
});

db.vehicleContract.belongsTo(db.vehicles, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

db.vehicles.hasMany(db.vehicleContract, {
  foreignKey: 'vehicle_id',
  as: 'vehicleContracts'
});

db.vehicleContract.belongsTo(db.scheme, {
  foreignKey: 'scheme_id',
  as: 'scheme'
});

db.scheme.hasMany(db.vehicleContract, {
  foreignKey: 'scheme_id',
  as: 'vehicleContracts'
});

db.scheme.belongsTo(db.makes, {
  foreignKey: 'makeId',
  as: 'make'
});

db.scheme.belongsTo(db.models, {
  foreignKey: 'modelId',
  as: 'model'
});

db.insuranceAddress.belongsTo(db.insurances, {
  foreignKey: 'insuranceProviderId',
  as: 'insurance'
})

db.insurances.hasMany(db.insuranceAddress, {
  foreignKey: 'insuranceProviderId',
  as: 'insuranceAddress'
})

db.jobCard.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet',
});

db.vehicleContract.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet',
});

// db.billings.belongsTo(db.mechaniceMapping, {
//   foreignKey: 'transaction_id',
//   as: 'mechanicMap'
// });


db.billings.belongsTo(db.mechaniceMapping, {
  foreignKey: 'transaction_id',
  targetKey: 'transaction_id',
  as: 'mechanicMap'
});

// db.mechaniceMapping.belongsTo(db.schedules, {
//   foreignKey: 'schedule_id',
//   targetKey: 'id',
//   as: 'scheduleMech'
// });

db.mechaniceMapping.belongsTo(db.schedules, {
  foreignKey: 'schedule_id',
  as: 'scheduleMech'
});

db.lbsDebitNotes.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'lbsCustomerMapping'
});

db.jobCard.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'jcCustomerMapping'
});

db.customers.hasMany(db.vehicles, {
  foreignKey: 'customerId',
  as: "cusvehicles"
})

db.customers.hasMany(db.jobCard, {
  foreignKey: 'customer_id',
  as: 'cusjobcards'
})

// ================= FRANCHISE ONBOARDING ↔ FEES =================
db.franchiseOnboarding.hasMany(db.franchiseOnboardingFee, {
  foreignKey: 'franchise_onboarding_id',
  as: 'fees'
});

db.franchiseOnboardingFee.belongsTo(db.franchiseOnboarding, {
  foreignKey: 'franchise_onboarding_id',
  as: 'franchiseOnboarding'
});


// ================= FRANCHISE ONBOARDING ↔ INSURANCE DETAILS =================
db.franchiseOnboarding.hasMany(db.onboardingInsuranceDetail, {
  foreignKey: 'franchise_onboarding_id',
  as: 'insuranceDetails'
});

db.onboardingInsuranceDetail.belongsTo(db.franchiseOnboarding, {
  foreignKey: 'franchise_onboarding_id',
  as: 'franchiseOnboarding'
});


// ================= INSURANCE DETAIL ↔ INSURANCE MASTER =================
db.onboardingInsuranceDetail.belongsTo(db.franchiseInsurance, {
  foreignKey: 'insurance_id',
  as: 'insurance'
});


// ================= FRANCHISE ONBOARDING ↔ WORKSHOP CATEGORY =================
db.franchiseOnboarding.belongsTo(db.workshopCategory, {
  foreignKey: 'workshop_category',
  as: 'workshopCategory'
});


// ================= FRANCHISE ONBOARDING ↔ BUSINESS CATEGORY =================
db.franchiseOnboarding.belongsTo(db.businessCategory, {
  foreignKey: 'business_category',
  as: 'businessCategory'
});
db.franchiseOnboardingFee.belongsTo(db.franchiseOnboardingFeesMaster, {
  foreignKey: 'fee_id',
  as: 'feeMaster'
});

// Account Statement associations
db.accountStatements.belongsTo(db.outlets, {
  foreignKey: 'outlet_id',
  as: 'outlet'
});

db.outlets.hasMany(db.accountStatements, {
  foreignKey: 'outlet_id',
  as: 'accountStatements'
});

db.accountStatements.hasMany(db.accountStatementChats, {
  foreignKey: 'statement_id',
  as: 'chats'
});

db.accountStatementChats.belongsTo(db.accountStatements, {
  foreignKey: 'statement_id',
  as: 'statement'
});
db.erpstocktransfer.hasMany(db.erpstocktransferparts, { foreignKey: 'erp_stock_transfer_id', as: 'stocktransfererpparts' })
db.erpstocktransferparts.belongsTo(db.items, { foreignKey: 'partsCode', targetKey: 'itemCode', as: 'erpitem' })

db.servicEstimates.belongsTo(db.servicebookings, {
  foreignKey: 'serviceBookingId',
  as: 'serviceBooking'
});

db.jobCard.hasMany(db.receipt, {
  foreignKey: 'transaction_id',
  as: 'receipts',
});

db.servicebookings.hasOne(db.servicEstimates, {
  foreignKey: 'serviceBookingId',
  as: 'serviceEstimate',
});

db.servicebookings.belongsTo(db.vehicles, {
  foreignKey: 'vehicleId',
  as: 'vehicle'
});

db.lbsDebitNotes.belongsTo(db.jobCard, {
  foreignKey: 'transaction_id',
  as: 'jobCard'
});

db.jobCard.hasMany(db.lbsDebitNotes, {
  foreignKey: "transaction_id",
  as: "lbsDebitNotes"
});

db.inspectionChekList.hasMany(db.inspectionRatingReason, {
  foreignKey: "CHECKLIST_TYPE_CODE",
  sourceKey: "CHECKLIST_TYPE_CODE",
  as: "RatingReasons"
});

db.securityGateIn.belongsTo(db.users, {
  foreignKey: "created_by",
  as: "securityId",
})

db.securityGateOut.belongsTo(db.jobCard, {
  foreignKey: "visit_id",
  targetKey: "id",
  as: "securityGateOutId",
})

db.securityGateOut.belongsTo(db.users, {
  foreignKey: "created_by",
  targetKey: "id",
  as: "securityGateOutUserId",
})

// Employee model
db.employees.belongsTo(db.outletSettings, {
  foreignKey: "outletId",
  targetKey: "OUTLET_ID",
  as: "outletSetting"   // 👈 alias must be here
});

db.customers.belongsTo(db.customercategory, {
  targetKey: 'customerCategory',
  foreignKey: 'customerCategory',
  as: 'Category',
});

// Get Estiamtion for FIT 
db.jobCard.belongsTo(db.servicEstimates, {
  foreignKey: "reg_no",
  targetKey: "registrationNumber",
  as: "serviceEstimateDetails"
})

// Carpm CheckList 
db.users.hasMany(db.jobCard, {
  foreignKey: "assigned_sa_id",
  sourceKey: "id",
  as: "jobCard"
});

// Job card id = checklist type visitId
db.jobCard.belongsTo(db.saveCheckListType, {
  foreignKey: "id",
  targetKey: "VISIT_ID",
  as: "checklistType"
});

// Job card id = Vehicle Id
db.jobCard.belongsTo(db.vehicles, {
  foreignKey: "vehicle_id",
  targetKey: "id",
  as: "vehicleDetails"
});

// Vehicle id = Make Id
db.vehicles.belongsTo(db.makes, {
  foreignKey: "makeId",
  targetKey: "id",
  as: "makeDetails"
});
// Mapping.....
db.preMinorCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.preMinorCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.preMoevCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.preMoevCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.postMoevCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.postMoevCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.pre2wSunChecklist.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.pre2wSunChecklist.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.post2wSunChecklist.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.post2wSunChecklist.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.pre3wSunChecklist.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.pre3wSunChecklist.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.post3wSunCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.post3wSunCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});


// Mapping.....
db.preMajorCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.preMajorCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

// Mapping.....
db.postMinorCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.postMinorCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

// Mapping.....
db.postMajorCheckList.hasMany(db.preReasons, {
  as: 'RatingReasons',
  foreignKey: 'PARAM_CHECKLIST_ID',
  sourceKey: 'CHECKLIST_ID'
});

db.postMajorCheckList.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_ID",
  targetKey: "UNIQUE_PARAM_ID",
  as: "MasterChecklist"
});

db.preReasons.belongsTo(db.inspectionRatingReason, {
  foreignKey: "RATING_CHECKLIST_ID",
  sourceKey: "UNIQUE_PARAM_ID",
  as: "MasterRatingReasons"
})

db.inspectionRatingReason.belongsTo(db.inspectionChekList, {
  foreignKey: "CHECKLIST_TYPE_CODE",
  targetKey: "CHECKLIST_TYPE_CODE",
  as: "Checklist"
});

// Job card id = inventory type visitId
db.jobCard.hasMany(db.saveInventoryCheckList, {
  foreignKey: "visit_id", // saveinventory id 
  targetKey: "id", // job card id 
  as: "inventory"
});

db.saveInventoryCheckList.belongsTo(db.vehicleInventoryCheckList, {
  foreignKey: "inventory_code", // saveinventoryId
  targetKey: "ID", // master id 
  as: "masterInventoryCode"
})


db.servicebookings.hasMany(db.pincodes, {
  sourceKey: 'pincode',
  foreignKey: 'Pincode',
  as: 'pincodeDetailsServiceBooking',
});

db.servicebookings.belongsTo(db.users, {
  foreignKey: 'assigned_pickup_id',
  as: 'serviceBookingUsers',
});


db.customers.hasMany(db.pincodes, {
  sourceKey: 'pinCode',
  foreignKey: 'Pincode',
  as: 'pincodeDetailsMany',
});


db.customers.belongsTo(db.customertypes, {
  foreignKey: 'customerType',
  targetKey: 'customerType',
  as: 'customerTypeDetails'
});

db.jobCard.belongsTo(db.users, {
  foreignKey: 'assigned_tech_id',
  targetKey: 'id',
  as: 'user_tech',
});


db.jobCard.hasMany(db.pincodes, {
  sourceKey: 'customer_pincode',
  foreignKey: 'Pincode',
  as: 'pincodeDetailsJoCard',
});

db.jobCard.belongsTo(db.users, {
  foreignKey: 'assigned_sa_id',
  as: 'user_sa',
});

db.jobCard.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'jobcardcustomer',
});

db.roughEstimate.hasMany(db.laborRoughEstimate, {
  foreignKey: 'roughEstimateId',
  as: 'laborRoughEstimate',
});
db.laborRoughEstimate.belongsTo(db.roughEstimate, {
  foreignKey: 'roughEstimateId',
  as: 'roughEstimate',
});

db.roughEstimate.hasMany(db.partsRoughEstimate, {
  foreignKey: 'roughEstimateId',
  as: 'partsRoughEstimate',
});
db.partsRoughEstimate.belongsTo(db.roughEstimate, {
  foreignKey: 'roughEstimateId',
  as: 'roughEstimate',
});
db.roughEstimate.belongsTo(db.vehicles, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});
db.roughEstimate.belongsTo(db.customers, {
  foreignKey: 'customerId',
  as: 'customer',
});
db.roughEstimate.belongsTo(db.makes, {
  foreignKey: 'vehicleMakeId',
  as: 'make',
});
db.roughEstimate.belongsTo(db.models, {
  foreignKey: 'vehicleModelId',
  as: 'model',
});
db.customers.belongsTo(db.outlets, {
  foreignKey: 'outletId',
  as: 'outlets'
});


export default db;
