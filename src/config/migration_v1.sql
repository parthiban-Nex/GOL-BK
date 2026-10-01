-- 19/11/2025 : Added new columns in vehicle master (PV)
ALTER TABLE vehicles
ADD COLUMN membership_number VARCHAR(100) DEFAULT NULL,
ADD COLUMN rsa_start_date DATE DEFAULT NULL,
ADD COLUMN rsa_end_date DATE DEFAULT NULL,
ADD COLUMN certificate_url TEXT,
ADD COLUMN rsa_flag TEXT,
ADD COLUMN rsa_transaction_id INT DEFAULT NULL;

-- 25-11-2025 : Added new columns in service bookings (PV)

ALTER TABLE dms_pv.servicebookings
  ADD COLUMN payment_id varchar(255) DEFAULT NULL,
  ADD COLUMN txnid varchar(255) DEFAULT NULL,
  ADD COLUMN advance_amount double DEFAULT NULL,
  ADD COLUMN payment_response varchar(10) DEFAULT NULL,
  ADD COLUMN payment_date datetime DEFAULT NULL,
  ADD COLUMN payment_remarks varchar(255) DEFAULT NULL,
  ADD COLUMN product text,
  ADD COLUMN verified_status int(11) DEFAULT NULL,
  ADD COLUMN goBumpr_id int(11) DEFAULT NULL,
  ADD COLUMN pickup_driver_id int(11) DEFAULT NULL,
  ADD COLUMN dropoff_driver_id int(11) DEFAULT NULL,
  ADD COLUMN  pick_up_date datetime DEFAULT NULL,
  ADD COLUMN  drop_off_date datetime DEFAULT NULL,
  ADD COLUMN  booking_track varchar(255) DEFAULT NULL;

  -- 01-12-2025 : Added new columns in labour_schedules (PV)

  ALTER TABLE laborschedules
    ADD COLUMN aa DOUBLE NULL DEFAULT NULL AFTER taxPercentage,
    ADD COLUMN ab DOUBLE NULL DEFAULT NULL AFTER aa,
    ADD COLUMN ac DOUBLE NULL DEFAULT NULL AFTER ab,
    ADD COLUMN ad DOUBLE NULL DEFAULT NULL AFTER ac,
    ADD COLUMN ae DOUBLE NULL DEFAULT NULL AFTER ad,
    ADD COLUMN ba DOUBLE NULL DEFAULT NULL AFTER ae,
    ADD COLUMN bb DOUBLE NULL DEFAULT NULL AFTER ba,
    ADD COLUMN bc DOUBLE NULL DEFAULT NULL AFTER bb,
    ADD COLUMN bd DOUBLE NULL DEFAULT NULL AFTER bc,
    ADD COLUMN be DOUBLE NULL DEFAULT NULL AFTER bd,
    ADD COLUMN ca DOUBLE NULL DEFAULT NULL AFTER be,
    ADD COLUMN cb DOUBLE NULL DEFAULT NULL AFTER ca,
    ADD COLUMN cc DOUBLE NULL DEFAULT NULL AFTER cb,
    ADD COLUMN cd DOUBLE NULL DEFAULT NULL AFTER cc,
    ADD COLUMN ce DOUBLE NULL DEFAULT NULL AFTER cd,
    ADD COLUMN da DOUBLE NULL DEFAULT NULL AFTER ce,
    ADD COLUMN db DOUBLE NULL DEFAULT NULL AFTER da,
    ADD COLUMN dc DOUBLE NULL DEFAULT NULL AFTER db,
    ADD COLUMN dd DOUBLE NULL DEFAULT NULL AFTER dc,
    ADD COLUMN de DOUBLE NULL DEFAULT NULL AFTER dd,
    ADD COLUMN category_id INT NULL DEFAULT NULL AFTER de,
    ADD COLUMN subcategory_id INT NULL DEFAULT NULL AFTER category_id,
    ADD COLUMN parts_mapping INT NULL DEFAULT NULL AFTER subcategory_id;

// 03-12-2025 : Added new columns in parts_schedules (PV)
  ALTER TABLE laborschedules
     ADD COLUMN standard_man_hrs varchar(25) NULL DEFAULT NULL AFTER taxPercentage;

  -- new jobcard  menu

INSERT INTO dms_pv.submenu_list(title,path,createdAt,updatedAt) VALUES('JobCard','/jobcard',NOW(),NOW());

--add this submenu to role_menu_settings and role_submenu_settings

-- 09-12-2025 : Added new columns in service bookings (PV)
ALTER TABLE servicebookings
ADD COLUMN coupon_code VARCHAR(50) NULL,
ADD COLUMN coupon_flag INT NULL,
ADD COLUMN coupon_desc LONGTEXT NULL,
ADD COLUMN coupon_amount VARCHAR(10) NULL;
ADD COLUMN utm_source VARCHAR(10) NULL;
ADD COLUMN payment_response VARCHAR(10) NULL;
ADD COLUMN validity_till DATE NULL;
ADD COLUMN pick_up_address LONGTEXT NULL;


-- 22-12-2025 : Added new columns in part indent (PV)

alter table dms_pv.parts_indent add column `enquiry_id` int DEFAULT NULL;

-- 30-01-2026 : Added new columns in workshop_categories (PV)

ALTER TABLE workshop_categories
ADD COLUMN cat1_sqft VARCHAR(255) DEFAULT NULL AFTER title,
ADD COLUMN cat2_sqft VARCHAR(255) DEFAULT NULL AFTER cat1_sqft;

-- 11-02-2026 : Added new columns in beatactivitymaps (PV)

alter table beatactivitymaps add column franchiseId int default null after activityPlanId;

-- 12-02-2026 : Added new columns in beatactivitymaps (PV)

alter table beatactivitymaps add column beatPlanUpdateFranchiseId int default null after franchiseId;


-- 12-02-2026 : Added new columns in user table 


ALTER TABLE users
ADD COLUMN is_first_login INT NOT NULL DEFAULT 0,
ADD COLUMN password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN user_pin_hash VARCHAR(255) DEFAULT NULL,
ADD COLUMN user_type INT DEFAULT 0 NOT NULL

-- 16-02-2026 : Added new Menu and submenu for zoho reports
--menu
INSERT INTO `dms_pv`.`menu_list` (`id`, `title`, `icon`, `activeIcon`, `createdAt`, `updatedAt`) VALUES ('30', 'Zoho Report', 'Report', 'ReportActive', '2025-05-29 17:21:09', '2025-05-29 17:21:09');
--submenu
INSERT INTO `dms_pv`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES ('115 ', 'Zoho Bill Report', '/zohoBillReport', '2025-12-02 15:51:58', '2025-12-02 15:51:58');
INSERT INTO `dms_pv`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES ('116', 'Zoho Inoice Report', '/zohoInvoiceReport', '2025-12-02 15:51:58', '2025-12-02 15:51:58');
--role menu setting
INSERT INTO `dms_pv`.`role_menu_settings` (`id`, `roleId`, `menuId`, `subMenuIds`, `status`, `createdAt`, `updatedAt`, `menu_operation`) VALUES ('157', '5', '30', '115,116', 'Active', '2024-10-24 07:12:19', '2024-10-24 07:12:19', '1,2,3,4');
--role submenu settings
INSERT INTO `dms_pv`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES ('152', '5', '115', '1,2,3,4');
INSERT INTO `dms_pv`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES ('153', '5', '116', '1,2,3,4');


--17-02-2026 : Added new new Menu and submenu for SOA reports
--submenu
INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES ('103', 'SOA Report', '/soaReport', '2026-02-17 00:00:00', '2026-02-17 00:00:00');
--role menu setting
UPDATE `dms`.`role_menu_settings` SET `subMenuIds` = '61,46,74,77,78,49,51,52,100,101,102,103' WHERE `role_menu_settings`.`id` = 50;
--role submenu setting
INSERT INTO `dms`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES ('138', '5', '103', '1,2,3,4');

-- 19-02-2026 : new column added in users table

ALTER TABLE users ADD COLUMN mobile_password VARCHAR(255) NOT NULL AFTER password;

-- 25-02-2026 :new columns added in stocks table 
ALTER TABLE dms_pv.stocks ADD COLUMN discount double  NULL

ALTER TABLE dms_pv.stocks 
ADD COLUMN (old_stocks_id int null,old_supplier_name varchar(100) null,old_supplier_date varchar(50) null)

-- 09-03-2026 : new column added in users table
alter table users add column part_gpt_token text default null after user_type;

-- 12-03-2026 : altered columns in outlets table

ALTER TABLE outlets DROP INDEX email;
ALTER TABLE outlets DROP INDEX phoneNumber;
ALTER TABLE outlets modify oracleSiteCode varchar(45) default null;
ALTER TABLE outlets modify oracleCashCustomerCode varchar(45) default null;
ALTER TABLE outlets modify oracleLocation varchar(45) default null;
ALTER TABLE outlets modify companyName varchar(45) default null;
ALTER TABLE outlets modify contactPhoneNumber varchar(20) default null;
ALTER TABLE outlets ADD column mytvs_erp_cust_code varchar(35) default null;

-- 12-03-2026 : new column added in gateins table

alter table gateins add column erp_stock_transfer_id int(11) default null after oracle_stocktransfer_id;

-- 12-03-2026 : new column added in gateinparts table

alter table gateinparts add column erp_stocktransferparts_id int(11) default null after oracle_stocktransferparts_id;

-- 17-03-2026 : new column added in customers table

ALTER TABLE customers ADD COLUMN is_b2b INT DEFAULT NULL AFTER discountOptions;

-- 17-03-2026 : new record added in items table for consumables.

INSERT INTO items (id,itemCode,itemName,itemDescription,hsnId,hsnCode,`list`,mrp,cost,taxPercentage,status,createdBy,createdAt,updatedAt) VALUES (181155,'Consumables','Consumables','Consumables',8,'85122010',10,33,33,18,1,1,'2026-03-18 12:43:20','2026-03-18 12:43:20');




-- 12-03-2026 : new column added in gateins table

alter table gateins add column erp_stock_transfer_id int(11) default null after oracle_stocktransfer_id;

-- 12-03-2026 : new column added in gateinparts table

alter table gateinparts add column erp_stocktransferparts_id int(11) default null after oracle_stocktransferparts_id;

-- 13-03-2026 : new column added in Submenu_list table
INSERT INTO `submenu_list` (`title`, `path`, `createdAt`, `updatedAt`) VALUES ('Old Dms Receipts ', '/oldDmsReceipts', '2026-03-13 15:51:58', '2026-03-13 15:51:58');
ALTER TABLE receipts ADD COLUMN old_dms_transaction_id int default null after transaction_id;
ALTER TABLE receipts
DROP FOREIGN KEY receipts_ibfk_2;


INSERT INTO `submenu_list` ( `title`, `path`, `createdAt`, `updatedAt`) VALUES ('Old Dms Credit/Debit Notes', '/oldDmdCreditDebitNotes', '2026-03-13 15:51:58', '2026-03-13 15:51:58');

ALTER TABLE credit_debit_notes ADD column old_dms_transaction_id int default null after transaction_id;

ALTER TABLE credit_debit_notes
DROP FOREIGN KEY credit_debit_notes_ibfk_3; 

Alter Table dms_pv.customers Drop Index emailId_UNIQUE;
 ALTER TABLE transaction_insurance ADD column idv_value int default null AFTER claim_no;


-- 12.03.26 -Changes for Vendor bulkupload
ALTER TABLE vendors
      MODIFY COLUMN address2 TEXT NULL,
      MODIFY COLUMN city VARCHAR(25) NULL,
      MODIFY COLUMN pincode INT NULL,      
      MODIFY COLUMN contactPerson VARCHAR(25) NULL,      
      MODIFY COLUMN marginPercentage DOUBLE NULL,
      MODIFY COLUMN vendorCode VARCHAR(50) NOT NULL,
      MODIFY COLUMN vendorName VARCHAR(100) NOT NULL,
      MODIFY COLUMN mobileNumber VARCHAR(25) NULL,    
      MODIFY COLUMN contactPersonMobileNo VARCHAR(25) NULL,
      MODIFY COLUMN oracle_vendor_number VARCHAR(50) NULL;

-- 14.03.26 AJC insurance
ALTER TABLE transaction_insurance ADD COLUMN insurance_area_name VARCHAR(100) NULL AFTER insurance_address;

-- 19.03.26 New columns added in vehicles table.

ALTER TABLE vehicles 
ADD COLUMN vehicle_used_by VARCHAR(50) DEFAULT NULL,
ADD COLUMN contact_number VARCHAR(15) DEFAULT NULL,
ADD COLUMN city VARCHAR(50) DEFAULT NULL,
ADD COLUMN pincode INT(11) DEFAULT NULL,
ADD COLUMN last_service_date DATE DEFAULT NULL,
ADD COLUMN last_service_km INT DEFAULT NULL,
ADD COLUMN motor_number VARCHAR(50) DEFAULT NULL,
ADD COLUMN mcu VARCHAR(50) DEFAULT NULL,
ADD COLUMN battery_no_1 VARCHAR(50) DEFAULT NULL,
ADD COLUMN battery_no_2 VARCHAR(50) DEFAULT NULL,
ADD COLUMN charger_no VARCHAR(50) DEFAULT NULL,
ADD COLUMN imei VARCHAR(50) DEFAULT NULL,
ADD COLUMN colour_code VARCHAR(50) DEFAULT NULL,
ADD COLUMN insurance_policy_no VARCHAR(50) DEFAULT NULL;


-- 18.03.26 Technician bulk upload
ALTER TABLE `employees` MODIFY COLUMN `email` VARCHAR(255) NULL;
ALTER TABLE `employees` MODIFY COLUMN `mobileNumber` BIGINT NULL;
ALTER TABLE `employees` DROP INDEX `employeeCode`
ALTER TABLE `employees` DROP INDEX `mobileNumber`

-- 24-03-2026 : Added new columns in servicebookings table
ALTER TABLE servicebookings
ADD COLUMN total_amount DOUBLE DEFAULT NULL,
ADD COLUMN final_amount DOUBLE DEFAULT NULL,
ADD COLUMN mytvs_coin DOUBLE DEFAULT NULL,
ADD COLUMN agent_discount DOUBLE DEFAULT NULL;


-- 24-03-2026 : new column added in transactions table
alter table transactions add column gatepassApprove int(11) default null; 

-- 26.03.26  : nmsa lead for mobile
 ALTER TABLE nmsa_agents
       ADD COLUMN contactedTypeId VARCHAR(255) NULL,
       ADD COLUMN contactedPersonName VARCHAR(100) NULL,
       ADD COLUMN visitDate DATETIME NULL,
       ADD COLUMN visitTypeId INT NULL,
       ADD COLUMN workshopTypeId INT NULL,
       ADD COLUMN leadTypeId INT NULL,
       ADD COLUMN leadSourceId INT NULL,
       ADD COLUMN availableToolsId VARCHAR(255) NULL,
       ADD COLUMN newToolsInterested TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Yes, 0 = No';

  -- added new table nmsa_dropdown_masters
  


-- 02-03-2026 : new column added in users table ( Sudarshan ) DONE 

ALTER TABLE users ADD COLUMN version_code VARCHAR(45) NULL AFTER sdkVersion; // done
ALTER TABLE users ADD COLUMN `customer_account_id` VARCHAR(45) NULL AFTER `appversion`; // done

Created vrm_master_customer_account TABLE
Created vrm_master_outlet_settings TABLE

-- 04-03-2026 : Added New Table ( Sudarshan ) Done

Create a table vrm_master_customer_account_settings added in Master Module 

-- 05-03-2026 : Sudarshan Done

1. Added New Table Security Gate in and Gate Out 
2. Added Carpm Webhooks, Status, Records
3. ALTER TABLE `dms_pv`.`transactions`  ADD COLUMN `fit_status` VARCHAR(100) NULL AFTER `odometer`; //done
4. ALTER TABLE `dms_pv`.`transactions` 
ADD COLUMN `assigned_tech_id` VARCHAR(45) NULL AFTER `status_value`,
ADD COLUMN `assigned_sa_id` VARCHAR(45) NULL AFTER `assigned_tech_id`; // done
5. Added Fla Data Table

-- 05 - 03 - 2026 - Sudarshan Pending 

1. ALTER TABLE `dms_pv`.`transactions` 
ADD COLUMN `vehicle_monthly_usage` VARCHAR(45) NULL AFTER `insuranceExpDate`; // done
2. Added Tables 
 - VehicleGateInVehicles
 - Gate In inventory 
 - inventory
 - visit Audit Trail
 - check list Type 
 - Dent and Scratch 
 - Gi Dent and Scratch 
 - Driver Pick or drop 


-- 09-03-26 

 ALTER TABLE `dms_pv`.`servicebookings` 
ADD COLUMN `assigned_pickup_id` VARCHAR(45) NULL DEFAULT NULL AFTER `updatedAt`,
ADD COLUMN `visit_id` VARCHAR(45) NULL DEFAULT NULL AFTER `assigned_pickup_id`,
ADD COLUMN `fit_status` VARCHAR(45) NULL DEFAULT NULL AFTER `visit_id`; // done

ALTER TABLE `dms_pv`.`servicebookings`
MODIFY COLUMN service_description TEXT;


-- 17-03-26
Table added userAttendance, Driver Location 
File Added fit_fcm_service_account

-- 18-03-26 

Alter table jobcard added fuel level 

-- 20 
alter tabled jobcard clickin_inspection_id

--23 
added clickins module 
added image count table 
added otherCredentials table 

 -- 28-03-2026 : Alter Transcation Table ( Sudarshan )
ALTER TABLE `dms_pv`.`transactions` ADD COLUMN `service_booking_id` VARCHAR(45) NULL AFTER `odometer`
ALTER TABLE `dms_pv`.`vehicles` ADD COLUMN `manufacturingYear` VARCHAR(45) 



-- 30.03.2026 vendor bulkupload
 ALTER TABLE itemgroups MODIFY itemGroupCode VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;  
  ALTER TABLE vendors DROP INDEX `mobileNumber`;
  ALTER TABLE vendors DROP INDEX `contactPersonMobileNo`;

  --01 - 01-2026 : Added new column in receipts table
  alter table receipts add column cardNumber varchar(255) default null after utr_bank_name;

-- 31.03.2026 oracle code update

-- add col in customers table
  ALTER TABLE customers ADD COLUMN oracleCustomerCode VARCHAR(100) NULL;
 ALTER TABLE customers ADD COLUMN siteNumber VARCHAR(100) NULL;

--  add records in submenu_list
INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'Oracle Code Update', '/oracleCodeUpdate', '2026-03-17 05:39:33', '2026-03-17 05:39:33');
-- id 106 in local

--  update records in role_menu_settings
UPDATE `dms`.`role_menu_settings`
SET `subMenuIds` = '45,43,42,41,40,39,38,37,36,35,34,33,32,31,30,29,106'
WHERE `role_menu_settings`.`roleId` = 1
AND `role_menu_settings`.`menuId` = 11;

--  add records in role_submenu_settings
INSERT INTO `dms`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '1', '106', '1,2,3,4');

-- 01.04.2026 Sudarshan 
ALTER TABLE `dms_pv`.`companies` 
ADD COLUMN `customer_account_type` VARCHAR(45) NULL AFTER `enable_einvoice`;


CREATE TABLE `vrm_trans_pre_moev_checklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `VISIT_ID` varchar(100) NOT NULL,
  `CHECKLIST_ID` varchar(100) DEFAULT NULL,
  `CONTENTS` varchar(100) DEFAULT NULL,
  `CREATED_BY` varchar(100) DEFAULT NULL,
  `UPDATED_BY` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`,`VISIT_ID`),
  UNIQUE KEY `uniq_visitid_checklistid` (`VISIT_ID`,`CHECKLIST_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=981 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `vrm_trans_post_moev_checklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `VISIT_ID` varchar(100) NOT NULL,
  `CHECKLIST_ID` varchar(100) DEFAULT NULL,
  `CONTENTS` varchar(100) DEFAULT NULL,
  `CREATED_BY` varchar(100) DEFAULT NULL,
  `UPDATED_BY` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`,`VISIT_ID`),
  UNIQUE KEY `uniq_visitid_checklistid` (`VISIT_ID`,`CHECKLIST_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=981 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 07.04.26 - datatype has been changed
ALTER TABLE `beat_plans` MODIFY COLUMN `area` VARCHAR(200);
ALTER TABLE `binlocations` MODIFY COLUMN `binLocationDescription` VARCHAR(200);
ALTER TABLE `vrm_master_customer_account_type` MODIFY COLUMN `CUSTOMER_ACCOUNT_TYPE_DES` TEXT;
ALTER TABLE `vrm_master_clickin_part_names` MODIFY COLUMN `CLICKINS_NAME` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_master_clickin_part_names` MODIFY COLUMN `PANEL_NAME` VARCHAR(200) NOT NULL;
-- model: defined as customer
ALTER TABLE `customers` MODIFY COLUMN `address1` TEXT;
ALTER TABLE `customers` MODIFY COLUMN `address2` TEXT;
ALTER TABLE `customers` MODIFY COLUMN `transportName` VARCHAR(200);
ALTER TABLE `customers` MODIFY COLUMN `organization` VARCHAR(200);
-- model: defined as disposition
ALTER TABLE `dispositions` MODIFY COLUMN `title` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_master_dock_abuse_field` MODIFY COLUMN `LABEL` VARCHAR(200);
ALTER TABLE `vrm_master_dock_fields` MODIFY COLUMN `LABEL` VARCHAR(200);
-- model: defined as dsaagent
ALTER TABLE `dsaagents` MODIFY COLUMN `dsaName` VARCHAR(200) NOT NULL;

ALTER TABLE `dsaagents` MODIFY COLUMN `address1` TEXT NOT NULL;
ALTER TABLE `dsaagents` MODIFY COLUMN `address2` TEXT NOT NULL;

ALTER TABLE `franchise_onboardings` MODIFY COLUMN `franchise_name` VARCHAR(200);
ALTER TABLE `franchise_onboardings` MODIFY COLUMN `landmark` TEXT;
ALTER TABLE `franchise_onboardings` MODIFY COLUMN `bank_branch` VARCHAR(200);
ALTER TABLE `franchise_onboardings` MODIFY COLUMN `tasl_bank_branch` VARCHAR(200);
ALTER TABLE `vrm_master_gatein_vehicle_inventory` MODIFY COLUMN `NAME` VARCHAR(200);
ALTER TABLE `vrm_master_gatein_vehicle_inventory` MODIFY COLUMN `CONTENT` VARCHAR(200);
ALTER TABLE `vrm_master_inspection_subsystem_map` MODIFY COLUMN `SUBSYSTEM_NAME` VARCHAR(100) NOT NULL;
-- model: defined as insurance
ALTER TABLE `insurances` MODIFY COLUMN `insuranceName` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_master_inventory_checklist` MODIFY COLUMN `INVENTORY_DESC` VARCHAR(200);
-- model: defined as item
ALTER TABLE `items` MODIFY COLUMN `itemName` VARCHAR(200) NOT NULL;
ALTER TABLE `items` MODIFY COLUMN `itemDescription` VARCHAR(200) NOT NULL;
-- model: defined as itemcategorie
ALTER TABLE `itemcategories` MODIFY COLUMN `itemCategorie` VARCHAR(200) NOT NULL;
ALTER TABLE `itemcategories` MODIFY COLUMN `itemCategorieDescription` VARCHAR(200) NOT NULL;
-- model: defined as itemgroup
ALTER TABLE `itemgroups` MODIFY COLUMN `itemGroupDescription` VARCHAR(200) NOT NULL;
ALTER TABLE `insurance_addresses` MODIFY COLUMN `address` TEXT;
ALTER TABLE `transactions` MODIFY COLUMN `credit_approve_reason` TEXT;
ALTER TABLE `transactions` MODIFY COLUMN `otd_reason` TEXT;
ALTER TABLE `transactions` MODIFY COLUMN `sub_status_reason` TEXT;
-- model: defined as otdfailurereason
ALTER TABLE `otdfailurereasons` MODIFY COLUMN `reason` TEXT NOT NULL;
ALTER TABLE `parts_indent` MODIFY COLUMN `item_name` VARCHAR(250) NOT NULL;
ALTER TABLE `parts_indent` MODIFY COLUMN `remarks` TEXT;
ALTER TABLE `schedules` MODIFY COLUMN `repairTypeName` VARCHAR(200);
ALTER TABLE `transaction_insurance` MODIFY COLUMN `insurance_address` TEXT;
ALTER TABLE `transaction_insurance` MODIFY COLUMN `insurance_area_name` TEXT;
ALTER TABLE `transaction_insurance` MODIFY COLUMN `surveyor_name` VARCHAR(200);
-- model: defined as laborschedule
ALTER TABLE `laborschedules` MODIFY COLUMN `laborDescription` TEXT NOT NULL;
-- model: defined as labor_sub_category
ALTER TABLE `labor_sub_categories` MODIFY COLUMN `subCategoryName` VARCHAR(200) NOT NULL;
ALTER TABLE `leads` MODIFY COLUMN `customerName` VARCHAR(200) NOT NULL;
ALTER TABLE `leads` MODIFY COLUMN `transportName` VARCHAR(200);
ALTER TABLE `leads` MODIFY COLUMN `properitor` VARCHAR(150);
ALTER TABLE `leads` MODIFY COLUMN `email` VARCHAR(100) NOT NULL;
ALTER TABLE `leads` MODIFY COLUMN `managerName` VARCHAR(100);
ALTER TABLE `leads` MODIFY COLUMN `customerAddress` TEXT NOT NULL;
ALTER TABLE `makes` MODIFY COLUMN `makeDescription` TEXT NOT NULL;
ALTER TABLE `models` MODIFY COLUMN `modelName` VARCHAR(100) NOT NULL;
ALTER TABLE `models` MODIFY COLUMN `modelDescription` VARCHAR(250);
ALTER TABLE `nmsa_agents` MODIFY COLUMN `nmsaName` VARCHAR(250) NOT NULL;
ALTER TABLE `nmsa_agents` MODIFY COLUMN `address1` TEXT NOT NULL;
ALTER TABLE `nmsa_agents` MODIFY COLUMN `area` TEXT;
ALTER TABLE `nmsa_agents` MODIFY COLUMN `contactedPersonName` VARCHAR(150);
-- model: defined as outlet
ALTER TABLE `outlets` MODIFY COLUMN `outletName` VARCHAR(200) NOT NULL;
ALTER TABLE `outlets` MODIFY COLUMN `address1` TEXT NOT NULL;
ALTER TABLE `outlets` MODIFY COLUMN `address2` TEXT NOT NULL;
ALTER TABLE `outlets` MODIFY COLUMN `contactPerson` VARCHAR(150);
ALTER TABLE `outlets` MODIFY COLUMN `bankName` VARCHAR(100) NOT NULL;
ALTER TABLE `returnables` MODIFY COLUMN `make_name` VARCHAR(100) NOT NULL;
ALTER TABLE `returnables` MODIFY COLUMN `model_name` VARCHAR(100) NOT NULL;
ALTER TABLE `returnables` MODIFY COLUMN `customer_name` VARCHAR(150) NOT NULL;
ALTER TABLE `returnables` MODIFY COLUMN `vendor_name` VARCHAR(150) NOT NULL;
ALTER TABLE `returnables` MODIFY COLUMN `reason` TEXT NOT NULL;
-- model: defined as countersale
ALTER TABLE `countersales` MODIFY COLUMN `customer_name` VARCHAR(150) NOT NULL;
ALTER TABLE `countersales` MODIFY COLUMN `customer_address` TEXT NOT NULL;
ALTER TABLE `countersales` MODIFY COLUMN `shipping_address` TEXT NOT NULL;
ALTER TABLE `countersale_parts` MODIFY COLUMN `item_description` VARCHAR(250) NOT NULL;
-- model: defined as countersale_request
ALTER TABLE `countersale_requests` MODIFY COLUMN `customer_name` VARCHAR(150) NOT NULL;
ALTER TABLE `countersale_requests` MODIFY COLUMN `customer_address` TEXT NOT NULL;
ALTER TABLE `countersale_requests` MODIFY COLUMN `shipping_address` TEXT NOT NULL;
ALTER TABLE `countersale_request_parts` MODIFY COLUMN `item_description` TEXT NOT NULL;
ALTER TABLE `countersale_return_parts` MODIFY COLUMN `item_description` TEXT NOT NULL;
ALTER TABLE `psf_review_logs` MODIFY COLUMN `phone_call_notes` TEXT;
-- model: defined as receipt
ALTER TABLE `receipts` MODIFY COLUMN `remarks` TEXT;
ALTER TABLE `fit_master_recent_activity` MODIFY COLUMN `message` TEXT NOT NULL;
ALTER TABLE `master_recent_activity` MODIFY COLUMN `message` TEXT NOT NULL;
ALTER TABLE `transactions_recent_activity` MODIFY COLUMN `message` TEXT NOT NULL;
ALTER TABLE `servicebookings` MODIFY COLUMN `phoneCallNotes` TEXT;
ALTER TABLE `servicebookings` MODIFY COLUMN `service_description` TEXT;
ALTER TABLE `servicebookings` MODIFY COLUMN `payment_remarks` TEXT;
ALTER TABLE `labor_estimate` MODIFY COLUMN `laborDescription` TEXT NOT NULL;
ALTER TABLE `osl_labor_estimate` MODIFY COLUMN `laborDescription` TEXT NOT NULL;
ALTER TABLE `parts_estimate` MODIFY COLUMN `partDescription` TEXT;
ALTER TABLE `service_estimate` MODIFY COLUMN `customerAddress` TEXT;
ALTER TABLE `service_estimate` MODIFY COLUMN `serviceEngineerRemarks` TEXT;
ALTER TABLE `uom` MODIFY COLUMN `uomDescription` VARCHAR(250);
ALTER TABLE `varients` MODIFY COLUMN `varientName` VARCHAR(100) NOT NULL;
ALTER TABLE `varients` MODIFY COLUMN `varientDescription` TEXT NOT NULL;
-- model: defined as vehicle
ALTER TABLE `vehicles` MODIFY COLUMN `driverName` VARCHAR(150);
ALTER TABLE `vrm_master_vehicle_predelivery_checklist` MODIFY COLUMN `VEHICLE_PDC_DESC` TEXT;
-- model: defined as pincode
ALTER TABLE `pincodes` MODIFY COLUMN `OfficeName` VARCHAR(250) NOT NULL;
-- model: defined as vendor
ALTER TABLE `vendors` MODIFY COLUMN `vendorName` VARCHAR(250) NOT NULL;
ALTER TABLE `vendors` MODIFY COLUMN `areaName` VARCHAR(250);
ALTER TABLE `vendors` MODIFY COLUMN `contactPerson` VARCHAR(150);



-- Table does not exits
ALTER TABLE `vrm_trans_carpm_records` MODIFY COLUMN `IS_SUCCESS` TEXT;
ALTER TABLE `vrm_trans_carpm_status` MODIFY COLUMN `status` VARCHAR(200);
ALTER TABLE `vrm_trans_clickins_parts_sendto_dms` MODIFY COLUMN `REPAIRS` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_trans_clickins_status` MODIFY COLUMN `CLICK_INS_STATUS` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_trans_customer_visit_gi_inv_checklist` MODIFY COLUMN `remarks` TEXT NOT NULL;
ALTER TABLE `vrm_trans_inventory_gatein_vehicles` MODIFY COLUMN `NAME` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_trans_inventory_gatein_vehicles` MODIFY COLUMN `CONTENT` VARCHAR(200) NOT NULL;
ALTER TABLE `vrm_trans_customer_visit_inv_checklist` MODIFY COLUMN `inventory_condition` VARCHAR(200);
ALTER TABLE `vrm_trans_customer_visit_inv_checklist` MODIFY COLUMN `remarks` TEXT;
ALTER TABLE `vrm_trans_post_2w_sun_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_post_3w_sun_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_post_major_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_post_minor_checklist` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_post_moev_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_2w_sun_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_3w_sun_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_major_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_minor_checklist` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_moev_checklists` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `vrm_trans_pre_inspection_reasons` MODIFY COLUMN `CONTENTS` TEXT;
ALTER TABLE `labor_rough_estimate` MODIFY COLUMN `laborDescription` VARCHAR(250);
ALTER TABLE `parts_rough_estimate` MODIFY COLUMN `partDescription` VARCHAR(250);
ALTER TABLE `rough_estimate` MODIFY COLUMN `customerAddress` TEXT;
ALTER TABLE `vrm_master_customer_account` MODIFY COLUMN `CUSTOMER_NAME` VARCHAR(150);
ALTER TABLE `vrm_master_customer_account` MODIFY COLUMN `CUSTOMER_ADDRESS` TEXT;
ALTER TABLE `vrm_trans_user_attendance` MODIFY COLUMN `ADDRESS` TEXT;



--06/04/2026
alter table dms_pv.purchaseorders add column invoice_pdf_url varchar(255) null
alter table dms_pv.purchaseorders add column invoice_pdf_signin_url varchar(255) null

--06/04/2026
alter table dms_pv.receipts add column tdsEntry varchar(100) default null after cardNumber;

--07/04/2026

alter table dms_pv.purchaseorders modify column invoice_pdf_signin_url text null

--20/04/2026
alter table dms_pv.franchise_onboardings modify column dent_puller int default null;
alter table dms_pv.franchise_onboardings modify column paint_booth int default null;
alter table dms_pv.franchise_onboardings add column signup_fee_total_amount decimal(10,2) default null;
alter table dms_pv.franchise_onboardings add column signup_fee_paid_amount decimal(10,2) default null;
alter table dms_pv.franchise_onboardings add column signup_fee_payment_mode varchar(50) default null;
alter table dms_pv.franchise_onboardings add column signup_fee_reference_number varchar(250) default null;
alter table dms_pv.franchise_onboardings add column signup_fee_payment_date date default null;
alter table dms_pv.franchise_onboardings add column signup_fee_doc text default null;
alter table dms_pv.franchise_onboardings add column signup_fee_doc_signed_url text default null;
alter table dms_pv.franchise_onboarding_fees add column payment_doc text default null;
alter table dms_pv.franchise_onboarding_fees add column payment_doc_signed_url text default null;
alter table dms_pv.franchise_onboarding_fees add column fee_approve tinyint default 0 comment '0=Pending,1=Approved,2=Rejected';
alter table dms_pv.franchise_onboarding_fees add column fee_rejection_remarks text default null;
alter table dms_pv.franchise_onboardings add column nm_approval int default 0;
alter table dms_pv.franchise_onboardings add column zm_approval int default 0;
alter table dms_pv.franchise_onboardings add column nm_rejection_remarks text default null;
alter table dms_pv.franchise_onboardings add column zm_rejection_remarks text default null;
ALTER TABLE dms_pv.franchise_onboardings MODIFY COLUMN status varchar(20) DEFAULT 0;
alter table dms_pv.franchise_onboardings add column statusText varchar(255) default null;
alter table dms_pv.franchise_onboardings add column handover_reject_remarks text default null;
alter table dms_pv.franchise_onboardings modify column wheel_balancer_machine int default null;
alter table dms_pv.franchise_onboardings modify column wheel_alignment_machine int default null;
alter table dms_pv.franchise_onboardings modify column mig_welder int default null;
alter table dms_pv.franchise_onboardings modify column compressor int default null;
alter table dms_pv.franchise_onboardings modify column paint_mixing int default null;





-- 06.05.26 GST tax code wise report
ALTER TABLE billings ADD cess DECIMAL(10,2) NULL, ADD cess_old TINYINT(1) DEFAULT 0

--  add records in submenu_list
INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'GST Code wise Report', '/eliteStatement', '2026-05-06 00:00:00', '2026-05-06 00:00:00');

--  update records in role_menu_settings
UPDATE `dms`.`role_menu_settings`
SET `subMenuIds` = '77,78,74,61,53,52,51,49,46,83,81,82,90,107'
WHERE `role_menu_settings`.`roleId` = 3
AND `role_menu_settings`.`menuId` = 8;

--  add records in role_submenu_settings
INSERT INTO `dms`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '3', '107', '1,2,3,4');


-- 12.05..2026
--  add records in submenu_list
INSERT INTO `dms_pv`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'Technician', '/technician', '2026-05-06 00:00:00', '2026-05-06 00:00:00');

--  update records in role_menu_settings
UPDATE `dms_pv`.`role_menu_settings`
SET `subMenuIds` = '44,25,22,21,20,19,18,17,16,15,12,9,8,7,5,4,3,2,1,127'
WHERE `role_menu_settings`.`roleId` = 1
AND `role_menu_settings`.`menuId` = 9;

--  add records in role_submenu_settings
INSERT INTO `dms_pv`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '1', '127', '1,2,3,4');

-- new column in billings table 

alter table billings add column ins_invoice_no varchar(255) default null after bill_no;



-- 19.05.2026 
-- skip these below 3 , if path is already set
INSERT INTO menu_list (title, icon, activeIcon, path, createdAt, updatedAt)
  VALUES ('Account Statement', NULL, NULL, '/accountStatement', NOW(), NOW());  --local id 28


INSERT INTO role_menu_settings (roleId, menuId, subMenuIds, status, menu_operation, createdAt, updatedAt)
  VALUES ('8', 28, NULL, 'Active', '', NOW(), NOW());
INSERT INTO role_menu_settings (roleId, menuId, subMenuIds, status, menu_operation, createdAt, updatedAt)
  VALUES ('9', 28, NULL, 'Active', '', NOW(), NOW());

--02-06-2026
-- Submenu for job Card Bill Summary It Return
INSERT INTO `dms_pv`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES ('126', 'Job Card Bill Summary IT Return', '/jobCardBillSummaryITReturn', '2026-03-19 15:51:58', '2026-03-19 15:51:58');

--02.06.26
 ALTER TABLE parts_indent ADD COLUMN discount DOUBLE(20,2) NOT NULL DEFAULT 0;

 -- 03.06.2026 
 --  add records in submenu_list
INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'JobCard Bill Summary Split Up', '/JobCardBillSummarySplitUp', '2026-05-06 00:00:00', '2026-05-06 00:00:00');

--  update records in role_menu_settings
UPDATE `dms_pv`.`role_menu_settings`
SET `subMenuIds` = '77,78,74,61,53,52,51,49,46,83,81,82,90,107,110'
WHERE `role_menu_settings`.`roleId` = 3
AND `role_menu_settings`.`menuId` = 8;

--  add records in role_submenu_settings
INSERT INTO `dms_pv`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '1', '127', '1,2,3,4');






-- 05.06.2026
INSERT INTO `dms`.`menu_list` (`id`, `title`, `icon`, `activeIcon`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'Pickup/Dropoff', NULL, NULL, NULL, '2026-06-05 00:00:00', '2026-06-05 00:00:00');

INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'Pickup', '/pickupList', '2026-06-05 00:00:00', '2026-06-05 00:00:00');
INSERT INTO `dms`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'Dropoff', '/dropoffList', '2026-06-05 00:00:00', '2026-06-05 00:00:00');

INSERT INTO `dms`.`role_menu_settings` (`id`, `roleId`, `menuId`, `subMenuIds`, `status`, `createdAt`, `updatedAt`, `menu_operation`) VALUES (NULL, '8', '29', '112,114', 'active', '2026-06-05 00:00:00', '2026-06-05 00:00:00', '');

INSERT INTO `dms`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '8', '112', '1,2,3,4'), (NULL, '8', '114', '1,2,3,4');

-- 05.06.2026 : Service Booking Pick Up / Drop Off module tables (PV)
ALTER TABLE `dms_pv`.`servicebookings`
  ADD COLUMN `driver_status`    tinyint(4) DEFAULT NULL,
  ADD COLUMN `drop_off_address` text       DEFAULT NULL;

-- transactions (Job Card) : needed for the finance_jc_dropoff variant
ALTER TABLE `dms_pv`.`transactions`
  ADD COLUMN `dropoff_status` tinyint(4) DEFAULT NULL,
  ADD COLUMN `driver_status`  tinyint(4) DEFAULT NULL;


-- 12.0.26
ALTER TABLE `dms_pv`.`servicebookings`
  ADD COLUMN `pickup_driver_id` INT(11) NULL DEFAULT NULL,
  ADD COLUMN `dropoff_driver_id` INT(11) NULL DEFAULT NULL,
  ADD COLUMN `drop_off_date` DATETIME NULL DEFAULT NULL;

INSERT INTO driver_masters (outlet_id, ecode, first_name, last_name, mobile_number, status, createdAt, updatedAt) VALUES (1, 'DRV002', 'Ramesh', 'Kumar', '9000000001', 1, NOW(), NOW()), (1, 'DRV003', 'Suresh', 'Babu', '9000000002', 1, NOW(), NOW()), (2, 'DRV004', 'Mahesh', 'Raj', '9000000003', 1, NOW(), NOW())


  -- 09-06-2026 add column in casual gatepass
alter table dms_pv.casual_gate_passes add column outlet_id int not null

-- 17-06-2026 : Gate IN-Gate OUT report source columns (PV)
ALTER TABLE `dms_pv`.`servicebookings`
  ADD COLUMN `fit_driver_pickup_start_date`  DATETIME NULL DEFAULT NULL,
  ADD COLUMN `fit_driver_pickup_date`        DATETIME NULL DEFAULT NULL,
  ADD COLUMN `fit_driver_pcikup_outlet_date` DATETIME NULL DEFAULT NULL,
  ADD COLUMN `fit_driver_dropoff_cus_date`   DATETIME NULL DEFAULT NULL;

ALTER TABLE `dms_pv`.`service_estimate`
  ADD COLUMN `gatein_date_time` DATETIME NULL DEFAULT NULL;


  
-- 10-06-2026 add column in cart and order history
alter table dms_pv.carts add column outletCode varchar(255) default null;
alter table dms_pv.order_histories add column outletCode varchar(255) default null;
alter table dms_pv.carts modify column user_id int default null;
alter table dms_pv.order_histories modify column user_id int default null;


-- 18.06.2026 
 --  add records in submenu_list
INSERT INTO `dms_pv`.`submenu_list` (`id`, `title`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'GateIn GateOut Report', '/GateInGateOutReport', '2026-06-05 00:00:00', '2026-06-05 00:00:00');

--  update records in role_menu_settings
UPDATE `dms_pv`.`role_menu_settings`
SET `subMenuIds` = '61,46,74,77,78,49,51,52,100,101,102,103,115'
WHERE `role_menu_settings`.`roleId` = 5
AND `role_menu_settings`.`menuId` = 8;

--  add records in role_submenu_settings
INSERT INTO `dms_pv`.`role_submenu_settings` (`id`, `roleId`, `submenuId`, `button_operation`) VALUES (NULL, '5', '115', '1,2,3,4');

-- added new columns in servicebookings table - 30-06-2026
alter table servicebookings add column accident_location text default null;
alter table servicebookings add column policy_number varchar(255) default null;
alter table servicebookings add column insurance_company varchar(255) default null;
alter table servicebookings add column policy_type varchar(255) default null;
alter table servicebookings add column accident_date date default null;
alter table servicebookings add column accident_time TIME default null;
alter table servicebookings add column accident_location_details text default null;

alter table dms_pv.receipts add column countersale_number varchar(45) default null after jc_number;
-- 09.07.2026 - LeaderBoard menu (direct link to /leaderboard) for Report Users
 --  add record in menu_list
INSERT INTO `dms_pv`.`menu_list` (`id`, `title`, `icon`, `activeIcon`, `path`, `createdAt`, `updatedAt`) VALUES (NULL, 'LeaderBoard', NULL, NULL, '/leaderboard', '2026-07-09 00:00:00', '2026-07-09 00:00:00');

--  add record in role_menu_settings (direct-link menu, no submenus)
INSERT INTO `dms_pv`.`role_menu_settings` (`id`, `roleId`, `menuId`, `subMenuIds`, `status`, `createdAt`, `updatedAt`, `menu_operation`) VALUES (NULL, '5', '30', '', 'Active', '2026-07-09 00:00:00', '2026-07-09 00:00:00', '1,2,3,4');

-- modified items tables datatype 08-07-2026

ALTER TABLE `items` MODIFY COLUMN `itemName` TEXT NOT NULL;
ALTER TABLE `items` MODIFY COLUMN `itemDescription` TEXT NOT NULL;
ALTER TABLE `items` MODIFY COLUMN `list` DOUBLE NULL;
ALTER TABLE `items` MODIFY COLUMN `mrp` DOUBLE NULL;
ALTER TABLE `items` MODIFY COLUMN `cost` DOUBLE NULL;

-- 30-09-2026 - Store independent job-card line approval and estimate provenance
ALTER TABLE `dms_pv`.`schedules`
  ADD COLUMN `approval_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `source_type` VARCHAR(20) NOT NULL DEFAULT 'JOB_CARD',
  ADD COLUMN `source_estimate_item_id` INT NULL;

ALTER TABLE `dms_pv`.`osl_schedules`
  ADD COLUMN `approval_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `source_type` VARCHAR(20) NOT NULL DEFAULT 'JOB_CARD',
  ADD COLUMN `source_estimate_item_id` INT NULL;

ALTER TABLE `dms_pv`.`parts_indent`
  ADD COLUMN `approval_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `source_type` VARCHAR(20) NOT NULL DEFAULT 'JOB_CARD',
  ADD COLUMN `source_estimate_item_id` INT NULL;

-- 01-10-2026 - Store portal JobCard Screen 2 fuel level as a numeric percentage
ALTER TABLE `dms_pv`.`transactions`
  ADD COLUMN `fuel_level_percentage` TINYINT UNSIGNED NULL DEFAULT NULL;

-- 01-10-2026 - Store JobCard Screen 2 customer complaints and service advice
CREATE TABLE `dms_pv`.`jobcard_customer_complaint_advice` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `transaction_id` INT NOT NULL,
  `customer_complaint` TEXT NOT NULL,
  `service_advice` TEXT NULL,
  `attended` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_jobcard_complaint_advice_transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
