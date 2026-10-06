import xlsx from 'xlsx';
import dao from './dao.js';
import db from '../index.js';
import logger from '../../config/logger.js';
import encryptConfig from '../../config/encrypt.js';
import { Op } from 'sequelize';

const Make = db.makes;
const Comapanies = db.companies;
const Model = db.models;
const Varient = db.varients;
const LaborSchedule = db.laborschedules;
const Aggregate = db.aggregates;
const SubAggregate = db.subaggregates;
const Item = db.items;
const ItemGroups = db.itemgroups;
const ItemCategories = db.itemcategories;
const HSN = db.hsns;
const Customers = db.customers;
const Vehicles = db.vehicles;
const Outlet = db.outlets;
const PinCode = db.pincodes;

const validateItemMaster = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;
  // {
  //   "Make Name": 0,
  //   "Company Name": 0,
  //   "Make": 0,
  //   "Model": 0,
  //   "Item Code": 0,
  //   "Item Groups": 0,
  //   "Item Categories": 0,
  //   "HSN": 0,
  //   "Aggregate": 0,
  //   "Subaggregate": 0
  // };

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const seenLabourCodes = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const makeName = element['Item Code'];

        if (typeof makeName === 'string') {
          const trimmedMakeName = makeName.trim().toLowerCase();

          if (seenLabourCodes.has(trimmedMakeName)) {
            element['Message'] = `Row ${index + 2}: Duplicate Model Name`;
            exceptionData.push(element);
            return false;
          } else {
            seenLabourCodes.add(trimmedMakeName);
            return true;
          }
        }

        return false;
      });

      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          // console.log('111111111111',element)

          // if (!element['Item Code'] || element['Item Code'] === '' || element['Item Code'] === "null" || element['Item Code'] === "undefined") {
          //   errorMessage += "Item Code is empty or invalid. ";
          //   hasError = true;
          // };

          if (!element['Company Name'] || element['Company Name'] === '' || element['Company Name'] === "null" || element['Company Name'] === "undefined") {
            errorMessage += "Company Name is empty or invalid. ";
            hasError = true;
          };

          // if (!element['Item Group Code'] || element['Item Group Code'] === '' || element['Item Group Code'] === "null" || element['Item Group Code'] === "undefined") {
          //   errorMessage += "Item Group Code is empty or invalid. ";
          //   hasError = true;
          // };

          // if (!element['Item Category Name'] || element['Item Category Name'] === '' || element['Item Category Name'] === "null" || element['Item Category Name'] === "undefined") {
          //   errorMessage += "Item Category Name is empty or invalid. ";
          //   hasError = true;
          // };

          if (!element['Hsn Code'] || element['Hsn Code'] === '' || element['Hsn Code'] === "null" || element['Hsn Code'] === "undefined") {
            errorMessage += "Hsn Code is empty or invalid. ";
            hasError = true;
          };

          // if (!element['Make Name'] || element['Make Name'] === '' || element['v'] === "null" || element['Make Name'] === "undefined") {
          //   errorMessage += "Make Name is empty or invalid. ";
          //   hasError = true;
          // };

          // if (!element['Model Name'] || element['Model Name'] === '' || element['Model Name'] === "null" || element['Model Name'] === "undefined") {
          //   errorMessage += "Model Name is empty or invalid. ";
          //   hasError = true;
          // };

          // if (!element['Aggregate Name'] || element['Aggregate Name'] === '' || element['Aggregate Name'] === "null" || element['Aggregate Name'] === "undefined") {
          //   errorMessage += "Aggregate Name is empty or invalid. ";
          //   hasError = true;
          // };

          // if (!element['Subaggregate Name'] || element['Subaggregate Name'] === '' || element['v'] === "null" || element['Subaggregate Name'] === "undefined") {
          //   errorMessage += "Subaggregate Name is empty or invalid. ";
          //   hasError = true;
          // };

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          };

          // const existingItems = await Item.findAll({
          //   where: { itemCode: element["Item Code"] },
          //   attributes: ['itemCode']
          // });

          // const existingItemGroups = await ItemGroups.findAll({
          //   where: { itemGroupCode: element["Item Group"] },
          //   attributes: ['itemGroupCode', 'id']
          // });

          // const existingItemCategories = await ItemCategories.findAll({
          //   where: { itemCategorie: element["Item Category"] },
          //   attributes: ['itemCategorie', 'id']
          // });

          // const existingHSN = await HSN.findAll({
          //   where: { hsnCode: element["Hsn Code"] },
          //   attributes: ['hsnCode', 'id', 'tax']
          // });

          // const existingMake = await Make.findAll({
          //   where: { makeName: element["Make"] },
          //   attributes: ['makeName']
          // });

          // const existingModel = await Model.findAll({
          //   where: { modelName: element["Model"] },
          //   attributes: ['modelName', 'id']
          // });

          // const existingAggregate = await Aggregate.findAll({
          //   where: { aggregateName: element["Aggregate"] },
          //   attributes: ['aggregateName', 'id']
          // });

          // const existingSubAggregate = await SubAggregate.findAll({
          //   where: { subAggregateName: element["Subaggregate"] },
          //   attributes: ['subAggregateName', 'id']
          // });

          // const existingCompany = await Comapanies.findAll({
          //   where: { name: element['Company Name'] },
          //   attributes: ['name', 'id']
          // });

          // if (existingMake.length === 0) {
          //   successData["Make"]++;
          // }
          // if (existingModel.length === 0) {
          //   successData["Model"]++;
          // }
          // if (existingItems.length === 0) {
          //   successData["Item Code"]++;
          // }
          // if (existingItemGroups.length === 0) {
          //   successData["Item Groups"]++;
          // }
          // if (existingItemCategories.length === 0) {
          //   successData["Item Categories"]++;
          // }
          // if (existingHSN.length === 0) {
          //   successData["HSN"]++;
          // }
          // if (existingAggregate.length === 0) {
          //   successData["Aggregate"]++;
          // }
          // if (existingSubAggregate.length === 0) {
          //   successData["Subaggregate"]++;
          // }

          // if (existingMake.length === 0 && existingCompany.length === 0) {
          //   successData["Make Name"]++;
          //   successData["Company Name"]++;
          // }

          // if (existingItems && existingItems.length > 0) {
          //   element['Message'] = `In Row ${index + 2}: Item Code already exists`;
          //   exceptionData.push(element);
          //   continue;
          // }

        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = 'success';
      successData = sheetData.length - exceptionData.length;
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  }

  return { result: result, exceptionData: exceptionData, successData: successData };
};

const validateGrnUploads = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;
  let actualHeaders = [];
  const requiredHeaders = [
    'SL No', 'Branch',
    // 'GRN No',
    'GRN Date', 'Supplier Name', 'Supplier Invoice Date', 'Item Code', 'Item Name',
    'UOM', 'Location', 'Qty', 'Unit Cost', 'MRP', 'Unit Sale Rate', 'Discount',
    // 'CGST', 'SGST', 'IGST',
    'Value',
    // 'Parts Category', 'Make', 'Model',
    // 'Parts Aggregate',
    // 'HSN'
  ];

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      // Validate Headers
      actualHeaders = Object.keys(sheetData[0] || {});
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          result: 'failed',
          exceptionData: [],
          successData: 0,
          actualHeaders,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        };
      }

      const isEmpty = val => val === undefined || val === null || val === '' || val === 'null' || val === 'undefined';

      const requiredFields = [
        'Branch', 'Item Code', 'Item Name', 'Qty', 'Unit Cost', 'MRP', 'Unit Sale Rate',
        'Value'
      ];

      const normalize = val => String(val).trim().toUpperCase();

      const itemCodes = [...new Set(
        sheetData
          .filter(row => !isEmpty(row['Item Code']))
          .map(i => normalize(i['Item Code']))
      )];

      const chunkSize = 1000;
      let items = [];

      for (let i = 0; i < itemCodes.length; i += chunkSize) {
        const chunk = itemCodes.slice(i, i + chunkSize);

        const chunkItems = await Item.findAll({
          where: { itemCode: { [Op.in]: chunk } },
          attributes: ['id', 'itemCode']
        });

        items.push(...chunkItems);
      }

      const itemCodeSet = new Set(items.map(item => normalize(item.itemCode)));

      const notfoundItems = itemCodes.filter(code => !itemCodeSet.has(code));
      if (notfoundItems.length > 0) {
        const itemCodeToRows = new Map();

        sheetData.forEach(row => {
          if (isEmpty(row['Item Code'])) return;
          const code = normalize(row['Item Code']);
          if (!itemCodeToRows.has(code)) {
            itemCodeToRows.set(code, []);
          }
          itemCodeToRows.get(code).push(row);
        });

        notfoundItems.forEach(code => {
          const rows = itemCodeToRows.get(code) || [];
          rows.forEach(row => {
            row['item error'] = `Item not found for Item Code: ${code}`;
            exceptionData.push(row);
          });
        });
      }

      // row-wise validations
      for (let index = 0; index < sheetData.length; index++) {
        const element = sheetData[index];
        try {
          let hasError = false;
          let errorMessage = '';

          for (const field of requiredFields) {
            if (isEmpty(element[field])) {
              errorMessage += `${field} is empty or invalid. `;
              hasError = true;
            }
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          }
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = exceptionData.length > 0 ? 'failed' : 'success';
      successData = sheetData.length - exceptionData.length;

    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateGrnUploads:', err);
  }

  return { result, exceptionData, successData, actualHeaders };
};

const validatePoUploads = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;
  let message = ""
  const requiredHeaders = [
    'SL No', 'Branch', 'Vendor Code', 'Item Code', 'Item Name', 'HSN', 'Make', 'Model', 'Parts Category', 'Vin Number', 'Reg No', 'Qty', 'Cost', 'MRP', 'Purchase Price',
    'CGST', 'SGST', 'IGST', 'Value'
  ];


  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      // Validate Headers
      const actualHeaders = Object.keys(sheetData[0] || {});
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          result: 'failed',
          exceptionData: [],
          successData: 0,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        };
      }

      //  Check for duplicate DMS ID

      const isEmpty = val => val === undefined || val === null || val === '' || val === 'null' || val === 'undefined';

      const requiredFields = [
        'Branch', 'Vendor Code', 'Item Code', 'Item Name', 'HSN', 'Make', 'Model', 'Parts Category', 'Vin Number', 'Reg No', 'Qty', 'Cost', 'MRP', 'Purchase Price',
        'CGST', 'SGST', 'IGST', 'Value'
      ];
      //  row-wise validations
      for (let index = 0; index < sheetData.length; index++) {
        const element = sheetData[index];
        try {
          let hasError = false;
          let errorMessage = '';



          for (const field of requiredFields) {
            if (isEmpty(element[field])) {
              errorMessage += `${field} is empty or invalid. `;
              hasError = true;
            }
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          }




        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = exceptionData.length > 0 ? 'failed' : 'success';
      successData = sheetData.length - exceptionData.length;
      message = exceptionData.length > 0 ? `Validation failed with ${exceptionData.length} errors.` : 'Validation successful.';
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateGrnUploads:', err);
  }

  return { result, exceptionData, successData, message };
};

const validateVendorUploads = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;
  let message = ""
  const requiredHeaders = [
    "SL No", "Vendor Code", "Vendor Name", "Gstin", "Pan Number", "Address 1", "Address 2", "Pin Code", "State", "City", "Area Name", "Mobile Number", "Contact Person", "Contact Person Mobile Number", "Vendor Type", "Margin Percentage", "Item Group", "Company", "VENDOR_SITE_CODE", "ORACLE_VENDOR_NUMBER", "isWarehouse"
  ];


  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      // Validate Headers
      const actualHeaders = Object.keys(sheetData[0] || {});
      // console.log(sheetData, "sheetdarta")
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          result: 'failed',
          exceptionData: [],
          successData: 0,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        };
      }

      //  Check for duplicate DMS ID

      const isEmpty = val => val === undefined || val === null || val === '' || val === 'null' || val === 'undefined';

      const requiredFields = [
        "Vendor Code", "Vendor Name", 
        // "Gstin", 
        // "Pan Number", 
        "Address 1", 
        // "Address 2", 
        // "Pin Code", 
        "State", 
        // "City",
        // "Area Name",
        // "Mobile Number", 
        // "Contact Person", 
        // "Contact Person Mobile Number", 
        "Vendor Type", 
        // "Margin Percentage", 
        // "Item Group", 
        // "Company"
      ];
      //  row-wise validations
      for (let index = 0; index < sheetData.length; index++) {
        const element = sheetData[index];
        try {
          let hasError = false;
          let errorMessage = '';



          for (const field of requiredFields) {
            if (isEmpty(element[field])) {
              errorMessage += `${field} is empty or invalid. `;
              hasError = true;
            }
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          }




        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = exceptionData.length > 0 ? 'failed' : 'success';
      successData = sheetData.length - exceptionData.length;
      message = exceptionData.length > 0 ? `Validation failed with ${exceptionData.length} errors.` : 'Validation successful.';
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateGrnUploads:', err);
  }

  return { result, exceptionData, successData, message };
};


const validateTechnicianUploads = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;
  let message = "";
  const requiredHeaders = [
    "SL No", "Outlet Code", "Technician Name", "Technician Code", "Mobile Number"
  ];

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      // Validate Headers
      const actualHeaders = Object.keys(sheetData[0] || {});
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          result: 'failed',
          exceptionData: [],
          successData: 0,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        };
      }

      // Check for duplicate Outlet Code + Technician Code combo within the file
      const seenOutletTechCombos = new Set();
      const isEmpty = val => val === undefined || val === null || val === '' || val === 'null' || val === 'undefined';

      const requiredFields = ["Outlet Code", "Technician Name", "Technician Code"];

      for (let index = 0; index < sheetData.length; index++) {
        const element = sheetData[index];
        try {
          let hasError = false;
          let errorMessage = '';

          for (const field of requiredFields) {
            if (isEmpty(element[field])) {
              errorMessage += `${field} is empty or invalid. `;
              hasError = true;
            }
          }

          // Check duplicate Outlet Code + Technician Code combo within file
          if (!isEmpty(element["Outlet Code"]) && !isEmpty(element["Technician Code"])) {
            const comboKey = `${element["Outlet Code"].toString().trim().toLowerCase()}_${element["Technician Code"].toString().trim().toLowerCase()}`;
            if (seenOutletTechCombos.has(comboKey)) {
              errorMessage += `Duplicate Outlet Code + Technician Code combo in file. `;
              hasError = true;
            } else {
              seenOutletTechCombos.add(comboKey);
            }
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          }

        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = exceptionData.length > 0 ? 'failed' : 'success';
      successData = sheetData.length - exceptionData.length;
      message = exceptionData.length > 0 ? `Validation failed with ${exceptionData.length} errors.` : 'Validation successful.';
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateTechnicianUploads:', err);
  }

  return { result, exceptionData, successData, message };
};

const processFileAndSaveToDB = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertItems(data, user.id);

  return { totalRows, insertedRows };
};

const validateLaborSchdeule = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const seenMakeNames = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const makeName = element['Labour Code'];

        if (typeof makeName === 'string') {
          const trimmedMakeName = makeName.trim().toLowerCase();

          if (seenMakeNames.has(trimmedMakeName)) {
            element['Message'] = `Row ${index + 2}: Duplicate Labour Code`;
            exceptionData.push(element);
            return false;
          } else {
            seenMakeNames.add(trimmedMakeName);
            return true;
          }
        }

        return false;
      });

      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['Labour Code'] || element['Labour Code'] === '' || element['Labour Code'] === "null" || element['Labour Code'] === "undefined") {
            errorMessage += "Labour Code is empty or invalid. ";
            hasError = true;
          }

          if (!element['Company Name'] || element['Company Name'] === '' || element['Company Name'] === "null" || element['Company Name'] === "undefined") {
            errorMessage += "Company Name is empty or invalid. ";
            hasError = true;
          }

          if (!element['aa'] || element['aa'] === '' || element['aa'] === "null" || element['aa'] === "undefined") {
            errorMessage += "aa is empty or invalid. ";
            hasError = true;
          }

          if (!element['ab'] || element['ab'] === '' || element['ab'] === "null" || element['ab'] === "undefined") {
            errorMessage += "ab is empty or invalid. ";
            hasError = true;
          }

          if (!element['ac'] || element['ac'] === '' || element['ac'] === "null" || element['ac'] === "undefined") {
            errorMessage += "ac is empty or invalid. ";
            hasError = true;
          }
          if (!element['ad'] || element['ad'] === '' || element['ad'] === "null" || element['ad'] === "undefined") {
            errorMessage += "ad is empty or invalid. ";
            hasError = true;
          }

          if (!element['ae'] || element['ae'] === '' || element['ae'] === "null" || element['ae'] === "undefined") {
            errorMessage += "ae is empty or invalid. ";
            hasError = true;
          }

          if (!element['ba'] || element['ba'] === '' || element['ba'] === "null" || element['ba'] === "undefined") {
            errorMessage += "ba is empty or invalid. ";
            hasError = true;
          }

          if (!element['bb'] || element['bb'] === '' || element['bb'] === "null" || element['bb'] === "undefined") {
            errorMessage += "bb is empty or invalid. ";
            hasError = true;
          }

          if (!element['bc'] || element['bc'] === '' || element['bc'] === "null" || element['bc'] === "undefined") {
            errorMessage += "bc is empty or invalid. ";
            hasError = true;
          }

          if (!element['bd'] || element['bd'] === '' || element['bd'] === "null" || element['bd'] === "undefined") {
            errorMessage += "bd is empty or invalid. ";
            hasError = true;
          }

          if (!element['be'] || element['be'] === '' || element['be'] === "null" || element['be'] === "undefined") {
            errorMessage += "be is empty or invalid. ";
            hasError = true;
          }

          if (!element['ca'] || element['ca'] === '' || element['ca'] === "null" || element['ca'] === "undefined") {
            errorMessage += "ca is empty or invalid. ";
            hasError = true;
          }

          if (!element['cb'] || element['cb'] === '' || element['cb'] === "null" || element['cb'] === "undefined") {
            errorMessage += "cb is empty or invalid. ";
            hasError = true;
          }

          if (!element['cc'] || element['cc'] === '' || element['cc'] === "null" || element['cc'] === "undefined") {
            errorMessage += "cc is empty or invalid. ";
            hasError = true;
          }

          if (!element['cd'] || element['cd'] === '' || element['cd'] === "null" || element['cd'] === "undefined") {
            errorMessage += "cd is empty or invalid. ";
            hasError = true;
          }

          if (!element['ce'] || element['ce'] === '' || element['ce'] === "null" || element['ce'] === "undefined") {
            errorMessage += "ce is empty or invalid. ";
            hasError = true;
          }

          if (!element['da'] || element['da'] === '' || element['da'] === "null" || element['da'] === "undefined") {
            errorMessage += "da is empty or invalid. ";
            hasError = true;
          }

          if (!element['db'] || element['db'] === '' || element['db'] === "null" || element['db'] === "undefined") {
            errorMessage += "db is empty or invalid. ";
            hasError = true;
          }

          if (!element['dc'] || element['dc'] === '' || element['dc'] === "null" || element['dc'] === "undefined") {
            errorMessage += "dc is empty or invalid. ";
            hasError = true;
          }

          if (!element['dd'] || element['dd'] === '' || element['dd'] === "null" || element['dd'] === "undefined") {
            errorMessage += "dd is empty or invalid. ";
            hasError = true;
          }

          if (!element['de'] || element['de'] === '' || element['de'] === "null" || element['de'] === "undefined") {
            errorMessage += "de is empty or invalid. ";
            hasError = true;
          }

          if (!element['standard_man_hrs'] || element['standard_man_hrs'] === '' || element['standard_man_hrs'] === "null" || element['standard_man_hrs'] === "undefined") {
            errorMessage += "standard_man_hrs is empty or invalid. ";
            hasError = true;
          }

          if (!element['parts_mapping'] || element['parts_mapping'] === '' || element['parts_mapping'] === "null" || element['parts_mapping'] === "undefined") {
            errorMessage += "parts_mapping is empty or invalid. ";
            hasError = true;
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
          }

          if (element["Labour Code"] && element["Labour Code"] !== "null" && element["Labour Code"] !== "undefined" && element["Labour Code"] !== '') {
            const existingLabour = await LaborSchedule.findAll({
              where: {
                laborCode: element["Labour Code"]
              },
              attributes: ['laborCode']
            });

            if (element["Company Name"] && element["Company Name"] !== "null" && element["Company Name"] !== "undefined" && element["Company Name"] !== '') {
              const existingCompany = await Comapanies.findAll({
                where: {
                  name: element['Company Name']
                },
                attributes: ['name', 'id']
              });

              if (existingLabour && existingLabour.length > 0) {
                element['Message'] = `In Row ${index + 2}: Labour Code already exists`;
                exceptionData.push(element);
                continue;
              };

              // if (existingLabour.length === 0) {
              //   successData["Labour Code"]++;
              // }
              // if (existingCompany.length === 0) {
              //   successData["Company Name"]++;
              // }
            }
          }
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = 'success';
      successData = sheetData.length - exceptionData.length;
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  };

  return { result: result, exceptionData: exceptionData, successData: successData };
};

const processFileAndSaveToDBLabor = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertLaborSchedule(data, user.id);

  return { totalRows, insertedRows };
};

const validateBulkMake = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const seenMakeNames = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const makeName = element['Make Name'];

        if (typeof makeName === 'string') {
          const trimmedMakeName = makeName.trim().toLowerCase();

          if (seenMakeNames.has(trimmedMakeName)) {
            element['Message'] = `Row ${index + 2}: Duplicate Make Name`;
            exceptionData.push(element);
            return false;
          } else {
            seenMakeNames.add(trimmedMakeName);
            return true;
          }
        }

        return false;
      });


      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['Make Name'] || element['Make Name'] === '' || element['Make Name'] === "null" || element['Make Name'] === "undefined") {
            errorMessage += "Make Name is empty or invalid. ";
            hasError = true;
          }

          if (!element['Company Name'] || element['Company Name'] === '' || element['Company Name'] === "null" || element['Company Name'] === "undefined") {
            errorMessage += "Company Name is empty or invalid. ";
            hasError = true;
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
          }

          if (element["Make Name"] && element["Make Name"] !== "null" && element["Make Name"] !== "undefined" && element["Make Name"] !== '') {
            const existingMake = await Make.findAll({
              where: {
                makeName: element["Make Name"]
              },
              attributes: ['makeName']
            });

            if (element["Company Name"] && element["Company Name"] !== "null" && element["Company Name"] !== "undefined" && element["Company Name"] !== '') {
              const existingCompany = await Comapanies.findAll({
                where: {
                  name: element['Company Name']
                },
                attributes: ['name', 'id']
              });

              if (existingMake && existingMake.length > 0) {
                element['Message'] = `In Row ${index + 2}: Make Name already exists`;
                exceptionData.push(element);
                continue;
              };

              // if (existingMake.length === 0) {
              //   successData++;
              // }
              // if (existingCompany.length === 0) {
              //   successData.push["Company Name"]++;
              // }
            }
          }
          result = 'success';
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      successData = sheetData.length - exceptionData.length;
      return { result: result, exceptionData: exceptionData, successData: successData };
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  }
  return { result, exceptionData, successData: finalResult };
};


const procesFileAndSaveToDBMake = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertMake(data, user.id);

  return { totalRows, insertedRows };
};

const validateBulkModel = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = [];

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const seenMakeNames = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const makeName = element['Model Name'];

        if (typeof makeName === 'string') {
          const trimmedMakeName = makeName.trim().toLowerCase();

          if (seenMakeNames.has(trimmedMakeName)) {
            element['Message'] = `Row ${index + 2}: Duplicate Model Name`;
            exceptionData.push(element);
            return false;
          } else {
            seenMakeNames.add(trimmedMakeName);
            return true;
          }
        }

        return false;
      });
      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['Make Name'] || element['Make Name'] === '' || element['Make Name'] === "null" || element['Make Name'] === "undefined") {
            errorMessage += "Make Name is empty or invalid. ";
            hasError = true;
          }

          if (!element['Model Name'] || element['Model Name'] === '' || element['Model Name'] === "null" || element['Model Name'] === "undefined") {
            errorMessage += "Model Name is empty or invalid. ";
            hasError = true;
          }

          if (!element['Company Name'] || element['Company Name'] === '' || element['Company Name'] === "null" || element['Company Name'] === "undefined") {
            errorMessage += "Company Name is empty or invalid. ";
            hasError = true;
          }

          // if (!element['Varient'] || element['Varient Name'] === '' || element['Varient Name'] === "null" || element['Varient Name'] === "undefined") {
          //   errorMessage += "Varient Name is empty or invalid. ";
          //   hasError = true;
          // }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
          }

          if (element["Make Name"] && element["Make Name"] !== "null" && element["Make Name"] !== "undefined"
            && element["Make Name"] !== '' && element["Make Name"] !== null && element["Make Name"] !== undefined) {
            const existingMake = await Make.findAll({
              where: {
                makeName: element["Make Name"]
              },
              attributes: ['makeName']
            });

            if (element["Model Name"] && element["Model Name"] !== "null" && element["Model Name"] !== "undefined" && element["Model Name"] !== '') {
              const existingModel = await Model.findAll({
                where: {
                  modelName: element["Model Name"]
                },
                attributes: ['modelName']
              });

              // if (!element['Varient Name'] || element['Varient Name'] === '' || element['Varient Name'] === "null" || element['Varient Name'] === "undefined") {
              //   const existingVarient = await Varient.findAll({
              //     where: {
              //       varientName: element["Varient"]
              //     },
              //     attributes: ['varientName', 'id']
              //   });

              //   if (element["Company Name"] && element["Company Name"] !== "null" && element["Company Name"] !== "undefined"
              //     && element["Company Name"] !== '') {
              //     const existingCompany = await Comapanies.findAll({
              //       where: {
              //         name: element['Company Name']
              //       },
              //       attributes: ['name', 'id']
              //     });

              //     // if (existingMake && existingMake.length > 0) {
              //     //   element['Message'] = `In Row ${index + 2}: Make Name already exists`;
              //     //   exceptionData.push(element);
              //     //   continue;
              //     // };

              //     if (existingModel && existingModel.length > 0) {
              //       element['Message'] = `In Row ${index + 2}: Model Name Already exists`;
              //       exceptionData.push(element);
              //     };

              //     // if (varientName && varientName.length > 0) {
              //     //   element['Message'] = `In Row ${index + 2}: Varient Name already exists`;
              //     //   exceptionData.push(element);
              //     //   continue;
              //     // };

              //     // if (existingMake.length === 0) {
              //     //   successData["Labour Code"]++;
              //     // }

              //     // if (existingModel.length === 0) {
              //     //   successData["Labour Code"]++;
              //     // }
              //     // if (existingVarient.length === 0) {
              //     //   successData["Labour Code"]++;
              //     // }
              //     // if (existingCompany.length === 0) {
              //     //   successData["Company Name"]++;
              //     // }

              //   }
              // }
            };
          };
          result = 'success';
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      };

      successData =sheetData.filter(item => !exceptionData.includes(item));
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

 

  return { result, exceptionData, successData };
};

const procesFileAndSaveToDBModel = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows, duplicateModels, invalidRecords } = await dao.insertModel(data, user.id);

  return { totalRows, insertedRows, duplicateModels, invalidRecords };
};


const validateBulkCustomer = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // const seenMakeNames = new Set();
      // const uniqueSheetData = sheetData.filter((element, index) => {
      //   const makeName = element['Customer Code'];

      //   if (typeof makeName === 'string') {
      //     const trimmedMakeName = makeName.trim().toLowerCase();

      //     if (seenMakeNames.has(trimmedMakeName)) {
      //       element['Message'] = `Row ${index + 2}: Duplicate Customer Name`;
      //       exceptionData.push(element);
      //       return false;
      //     } else {
      //       seenMakeNames.add(trimmedMakeName);
      //       return true;
      //     }
      //   }

      //   return false;
      // });
      const uniqueSheetData = sheetData;
      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];
        // const errorElement = {};

        if (!element['Message']) {
          element['Message'] = '';
        }

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['First Name'] || element['First Name'] === '' || element['First Name'] === "null" || element['First Name'] === "undefined") {
            errorMessage += "First Name is empty or invalid. ";
            hasError = true;
          }

          // if (!element['Last Name'] || element['Last Name'] === '' || element['Last Name'] === "null" || element['Last Name'] === "undefined") {
          //   errorMessage += "Last Name is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Address1'] || element['Address1'] === '' || element['Address1'] === "null" || element['Address1'] === "undefined") {
          //   errorMessage += "Address1 is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Pin Code'] || element['Pin Code'] === '' || element['Pin Code'] === "null" || element['Pin Code'] === "undefined") {
          //   errorMessage += "Pin Code is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Mobile Number'] || element['Mobile Number'] === '' || element['Mobile Number'] === "null" || element['Mobile Number'] === "undefined") {
          //   errorMessage += "Mobile Number is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Source'] || element['Source'] === '' || element['Source'] === "null" || element['Source'] === "undefined") {
          //   errorMessage += "Mobile Number is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Source Type'] || element['Source Type'] === '' || element['Source Type'] === "null" || element['Source Type'] === "undefined") {
          //   errorMessage += "Source Type is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Customer Category'] || element['Customer Category'] === '' || element['Customer Category'] === "null" || element['Customer Category'] === "undefined") {
          //   errorMessage += "Customer Category is empty or invalid. ";
          //   hasError = true;
          // }

          if (element['is_b2b'] !== '1' && element['is_b2b'] !== 1 && element['is_b2b'] !== '' && element['is_b2b'] != null) {
              errorMessage += "is_b2b must be 1 or empty. ";
              hasError = true;
          }

          // if (!element['Customer Type'] || element['Customer Type'] === '' || element['Customer Type'] === "null" || element['Customer Type'] === "undefined") {
          //   errorMessage += "Customer Type is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Bill Type'] || element['Bill Type'] === '' || element['Bill Type'] === "null" || element['Bill Type'] === "undefined") {
          //   errorMessage += "Bill Type is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Email Id'] || element['Email'] === '' || element['Email'] === "null" || element['Email'] === "undefined") {
          //   errorMessage += "Email is empty or invalid. ";
          //   hasError = true;
          // }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
          }

          // if (element["Mobile Number"] && element["Mobile Number"] !== "null" && element["Mobile Number"] !== "undefined" && element["Mobile Number"] !== '') {
          //   const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${element["Mobile Number"]}', '${encryptConfig.code}'))`);
          //   const existingNumber = await Customers.findAll({
          //     where: {
          //       mobileNumber: mobileNumberEncrypted
          //     },
          //     attributes: ['mobileNumber']
          //   });

          //   const emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${element["Email Id"]}', '${encryptConfig.code}'))`);
          //   const existingEmailId = await Customers.findAll({
          //     where: {
          //       emailId: emailIdEncrypted
          //     },
          //     attributes: ['emailId']
          //   });

          //   if (element['Gstin Number'] && element['Gstin Number'] !== '' && element['Gstin Number'] !== "null" && element['Gstin Number'] !== "undefined") {
          //     let existingGstin = await Customers.findAll({
          //       where: {
          //         gstinNumber: element['Gstin Number']
          //       },
          //       attributes: ['gstinNumber']
          //     });

          //     if (existingGstin && existingGstin.length > 0) {
          //       element['Message'] = `In Row ${index + 2}: Gstin Already exists. `;
          //       exceptionData.push(element);
          //     };
          //   }

          //   if (existingNumber && existingNumber.length > 0) {
          //     element['Message'] += `In Row ${index + 2}: Mobile Number Already exists. `;
          //   };

          //   if (existingEmailId && existingEmailId.length > 0) {
          //     element['Message'] += `In Row ${index + 2}: EmailId Already exists. `;
          //   };

          //   if (element['Message'].length > 0) {
          //     exceptionData.push(element);
          //   }
          // };
          result = 'success';
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      };

      successData = sheetData.length - exceptionData.length;
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  };

  return { result, exceptionData, successData: successData };
};

const procesFileAndSaveToDBCustomers = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows, duplicateCustomers, invalidRecords } = await dao.insertCustomers(data, user);

  return { totalRows, insertedRows, duplicateCustomers, invalidRecords };
};

const validateBulkVehicle = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const uniqueSheetData = sheetData;
      // const seenMakeNames = new Set();
      // const uniqueSheetData = sheetData.filter((element, index) => {
      //   const makeName = element['Customer Code'];

      //   if (typeof makeName === 'string') {
      //     const trimmedMakeName = makeName.trim().toLowerCase();

      //     if (seenMakeNames.has(trimmedMakeName)) {
      //       element['Message'] = `Row ${index + 2}: Duplicate Customer Name`;
      //       exceptionData.push(element);
      //       return false;
      //     } else {
      //       seenMakeNames.add(trimmedMakeName);
      //       return true;
      //     }
      //   }

      //   return false;
      // });
      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        if (!element['Message']) {
          element['Message'] = '';
        }

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['Registration Number'] || element['Registration Number'] === '' || element['Registration Number'] === "null" || element['Registration Number'] === "undefined") {
            errorMessage += "Registration Number is empty or invalid. ";
            hasError = true;
          }

          // if (!element['Make Name'] || element['Make Name'] === '' || element['Make Name'] === "null" || element['Make Name'] === "undefined") {
          //   errorMessage += "Make Name is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Model Name'] || element['Model Name'] === '' || element['Model Name'] === "null" || element['Model Name'] === "undefined") {
          //   errorMessage += "Model Name is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Varient Name'] || element['Varient Name'] === '' || element['Varient Name'] === "null" || element['Varient Name'] === "undefined") {
          //   errorMessage += "Varient Name is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Fuel Type'] || element['Fuel Type'] === '' || element['Fuel Type'] === "null" || element['Fuel Type'] === "undefined") {
          //   errorMessage += "Fuel Type is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Odometer'] || element['Odometer'] === '' || element['Odometer'] === "null" || element['Odometer'] === "undefined") {
          //   errorMessage += "Odometer is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Chassis Number'] || element['Chassis Number'] === '' || element['Chassis Number'] === "null" || element['Chassis Number'] === "undefined") {
          //   errorMessage += "Chassis Number is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Engine Number'] || element['Engine Number'] === '' || element['Engine Number'] === "null" || element['Engine Number'] === "undefined") {
          //   errorMessage += "Engine Number is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Color'] || element['Color'] === '' || element['Color'] === "null" || element['Color'] === "undefined") {
          //   errorMessage += "Color is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Insurance Name'] || element['Insurance Name'] === '' || element['Insurance Name'] === "null" || element['Insurance Name'] === "undefined") {
          //   errorMessage += "Insurance Name is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Insurance Exp Date'] || element['Insurance Exp Date'] === '' || element['Insurance Exp Date'] === "null" || element['Insurance Exp Date'] === "undefined") {
          //   errorMessage += "Insurance Exp Date is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Stage Norms'] || element['Stage Norms'] === '' || element['Stage Norms'] === "null" || element['Stage Norms'] === "undefined") {
          //   errorMessage += "Stage Norms is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Axle'] || element['Axle'] === '' || element['Axle'] === "null" || element['Axle'] === "undefined") {
          //   errorMessage += "Axle is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Application'] || element['Application'] === '' || element['Application'] === "null" || element['Application'] === "undefined") {
          //   errorMessage += "Application is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Next Due Date'] || element['Next Due Date'] === '' || element['Next Due Date'] === "null" || element['Next Due Date'] === "undefined") {
          //   errorMessage += "Next Due Date is empty or invalid. ";
          //   hasError = true;
          // }

          // if (!element['Engine Oil Capacity'] || element['Engine Oil Capacity'] === '' || element['Engine Oil Capacity'] === "null" || element['Engine Oil Capacity'] === "undefined") {
          //   errorMessage += "Engine Oil Capacity is empty or invalid. ";
          //   hasError = true;
          // }

          // if (hasError) {
          //   element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
          //   exceptionData.push(element);
          // }

          // if (
          //   element["Customer Code"] &&
          //   element["Customer Code"] !== '' &&
          //   element["Customer Code"] !== "null" &&
          //   element["Customer Code"] !== "undefined"
          // ) {
          //   const trimmedCode = element["Customer Code"].trim();

          //   const existingCustomer = await Customers.findAll({
          //     where: { customerCode: trimmedCode },
          //     attributes: ['customerCode']
          //   });

          //   const existingCustomerSet = new Set(existingCustomer.map(c => c.customerCode));

          //   if (!existingCustomerSet.has(trimmedCode)) {
          //     element['Message'] = (element['Message'] || '') + `In Row ${index + 2}: New Customer Code found. Please create customer first. `;
          //   }

            // if (element['Message'] && element['Message'].length > 0) {
            //   exceptionData.push(element);
            // }
          // }


          // if (element["Chassis Number"] && element["Chassis Number"] !== "null" && element["Chassis Number"] !== "undefined" && element["Chassis Number"] !== '') {
          //   const existingChassisNumber = await Vehicles.findAll({
          //     where: {
          //       chassisNumber: element["Chassis Number"]
          //     },
          //     attributes: ['chassisNumber']
          //   });

          //   const existingReg = await Vehicles.findAll({
          //     where: {
          //       registrationNumber: element["Registration Number"]
          //     },
          //     attributes: ['registrationNumber']
          //   });

          //   if (element['Engine Number'] && element['Engine Number'] !== '' && element['Engine Number'] !== "null" && element['Engine Number'] !== "undefined") {
          //     let existingEngine = await Vehicles.findAll({
          //       where: {
          //         engineNumber: element['Engine Number']
          //       },
          //       attributes: ['engineNumber']
          //     });

          //     if (existingEngine && existingEngine.length > 0) {
          //       element['Message'] += `In Row ${index + 2}: Engine Number Already exists. `;
          //     };
          //   }

          //   if (existingReg && existingReg.length > 0) {
          //     element['Message'] += `In Row ${index + 2}: Registartion Number Already exists. `;
          //   };

          //   if (existingChassisNumber && existingChassisNumber.length > 0) {
          //     element['Message'] += `In Row ${index + 2}: Chassis Number Already exists. `;
          //   };

          //   if (element['Message'].length > 0) {
          //     exceptionData.push(element);
          //   } else if (hasError) {
          //     element['Message'] += `Row ${index + 2}: ${errorMessage.trim()}`;
          //     exceptionData.push(element);
          //   }
          // };
          result = 'success';
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      };

      successData = sheetData.length - exceptionData.length;
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkMake:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  };

  return { result, exceptionData, successData: successData };
};

const procesFileAndSaveToDBVehicles = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows, duplicateModels, invalidRecords } = await dao.insertVehicles(data, user);

  return { totalRows, insertedRows, duplicateModels, invalidRecords };
};

const validateBulkPincode = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);


      for (let index = 0; index < sheetData.length; index++) {
        const element = sheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          if (!element['CircleName'] || element['CircleName'] === '' || element['CircleName'] === "null" || element['CircleName'] === "undefined") {
            errorMessage += "CircleName is empty or invalid. ";
            hasError = true;
          }
          if (!element['RegionName'] || element['RegionName'] === '' || element['RegionName'] === "null" || element['RegionName'] === "undefined") {
            errorMessage += "RegionName is empty or invalid. ";
            hasError = true;
          }
          if (!element['DivisionName'] || element['DivisionName'] === '' || element['DivisionName'] === "null" || element['DivisionName'] === "undefined") {
            errorMessage += "DivisionName is empty or invalid. ";
            hasError = true;
          }
          if (!element['OfficeName'] || element['OfficeName'] === '' || element['OfficeName'] === "null" || element['OfficeName'] === "undefined") {
            errorMessage += "OfficeName is empty or invalid. ";
            hasError = true;
          }
          if (!element['Pincode'] || element['Pincode'] === '' || element['Pincode'] === "null" || element['Pincode'] === "undefined") {
            errorMessage += "Pincode is empty or invalid. ";
            hasError = true;
          }
          if (!element['OfficeType'] || element['OfficeType'] === '' || element['OfficeType'] === "null" || element['OfficeType'] === "undefined") {
            errorMessage += "OfficeType is empty or invalid. ";
            hasError = true;
          }
          if (!element['Delivery'] || element['Delivery'] === '' || element['Delivery'] === "null" || element['Delivery'] === "undefined") {
            errorMessage += "Delivery is empty or invalid. ";
            hasError = true;
          }
          if (!element['District'] || element['District'] === '' || element['District'] === "null" || element['District'] === "undefined") {
            errorMessage += "District is empty or invalid. ";
            hasError = true;
          }
          if (!element['StateName'] || element['StateName'] === '' || element['StateName'] === "null" || element['StateName'] === "undefined") {
            errorMessage += "StateName is empty or invalid. ";
            hasError = true;
          }
          if (element['Latitude'] === undefined || element['Latitude'] === null || element['Latitude'] === '' || element['Latitude'] === "null" || element['Latitude'] === "undefined") {
            errorMessage += "Latitude is empty or invalid. ";
            hasError = true;
          }
          if (element['Longitude'] === undefined || element['Longitude'] === null || element['Longitude'] === '' || element['Longitude'] === "null" || element['Longitude'] === "undefined") {
            errorMessage += "Longitude is empty or invalid. ";
            hasError = true;
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
          }

          result = 'success';
        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      successData = sheetData.length - exceptionData.length;
      return { result: result, exceptionData: exceptionData, successData: successData };
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkPincode:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  }
  return { result, exceptionData, successData: finalResult };
};

const procesFileAndSaveToDBPincode = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertPincodes(data, user.id);

  return { totalRows, insertedRows };
}

const processAndSaveToDB = async (fileBuffer, user) => { 
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertOutlets(data, user.id);

  return { totalRows, insertedRows };
};

// const validateOutletMaster = async (req, user, files) => {

//   let result = '';
//   let exceptionData = [];
//   let successData = 0;

//   try {
//     if (req.file && req.file.buffer) {
//       const fileBuffer = req.file.buffer;
//       const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

//       const sheetName = workbook.SheetNames[0];
//       const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//       const seenLabourCodes = new Set();
//       const uniqueSheetData = sheetData.filter((element, index) => {
//         const outletName = element['Outlet Code'];

//         if (typeof outletName === 'string') {
//           const trimmedOutletName = outletName.trim().toLowerCase();

//           if (seenLabourCodes.has(trimmedOutletName)) {
//             element['Message'] = `Row ${index + 2}: Duplicate Outlet Name`;
//             exceptionData.push(element);
//             return false;
//           } else {
//             seenLabourCodes.add(trimmedOutletName);
//             return true;
//           }
//         }

//         return false;
//       });

//       for (let index = 0; index < uniqueSheetData.length; index++) {
//         const element = uniqueSheetData[index];

//         try {
//           let hasError = false;
//           let errorMessage = '';

//           // console.log('111111111111', element);

//           if (!element['Outlet Code'] || element['Outlet Code'] === '' || element['Outlet Code'] === "null" || element['Outlet Code'] === "undefined") {
//             errorMessage += "Outlet Code is empty or invalid. ";
//             hasError = true;
//           };

//           if (!element['Outlet Name'] || element['Outlet Name'] === '' || element['Outlet Name'] === "null" || element['Outlet Name'] === "undefined") {
//             errorMessage += "Outlet Name is empty or invalid. ";
//             hasError = true;
//           };

//           // if (!element['Bank Name'] || element['Bank Name'] === '' || element['Bank Name'] === "null" || element['Bank Name'] === "undefined") {
//           //   errorMessage += "Bank Name is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['Bank Account'] || element['Bank Account'] === '' || element['Bank Account'] === "null" || element['Bank Account'] === "undefined") {
//           //   errorMessage += "Bank Account is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['IFSC Code'] || element['IFSC Code'] === '' || element['IFSC Code'] === "null" || element['IFSC Code'] === "undefined") {
//           //   errorMessage += "IFSC Code is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['Company Name'] || element['Company Name'] === '' || element['Company Name'] === "null" || element['Company Name'] === "undefined") {
//           //   errorMessage += "Company Name is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['Model Name'] || element['Model Name'] === '' || element['Model Name'] === "null" || element['Model Name'] === "undefined") {
//           //   errorMessage += "Model Name is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['Aggregate Name'] || element['Aggregate Name'] === '' || element['Aggregate Name'] === "null" || element['Aggregate Name'] === "undefined") {
//           //   errorMessage += "Aggregate Name is empty or invalid. ";
//           //   hasError = true;
//           // };

//           // if (!element['Subaggregate Name'] || element['Subaggregate Name'] === '' || element['v'] === "null" || element['Subaggregate Name'] === "undefined") {
//           //   errorMessage += "Subaggregate Name is empty or invalid. ";
//           //   hasError = true;
//           // };

//           if (hasError) {
//             element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
//             exceptionData.push(element);
//             continue;
//           };

//           const existingOutlets = await Outlet.findAll({
//             where: { outletCode: element["Outlet Code"] },
//             attributes: ['outletCode']
//           });


//           if (existingOutlets && existingOutlets.length > 0) {
//             element['Message'] = `In Row ${index + 2}: Outlet Code already exists`;
//             exceptionData.push(element);
//             continue;
//           }

//         } catch (innerError) {
//           element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
//           exceptionData.push(element);
//         }
//       }

//       result = 'success';
//       successData = sheetData.length - exceptionData.length;
//     } else {
//       throw new Error('File not provided or invalid.');
//     }
//   } catch (err) {
//     result = 'failed';
//     logger.error('Error in validateBulkMake:', err);
//   }

//   let finalResult = {};
//   for (let key in successData) {
//     if (successData[key] > 0) {
//       finalResult[key] = `${successData[key]} new ${key}`;
//     }
//   }

//   return { result: result, exceptionData: exceptionData, successData: successData };
// };

const validateOutletMaster = async (req, user) => {
  let exceptionData = [];
  let successData = 0;

  if (!req.file || !req.file.buffer) {
    return { result: 'failed', exceptionData: [], successData: 0, message: 'File not provided or invalid.' };
  }

  const fileBuffer = req.file.buffer;
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const seenOutletCodes = new Set();
  const uniqueData = sheetData.filter((row, index) => {
    const outletCode = row['Outlet Code']?.toString().trim();
    if (!outletCode) return false;

    if (seenOutletCodes.has(outletCode.toLowerCase())) {
      row['Message'] = `Row ${index + 2}: Duplicate Outlet Code in file`;
      exceptionData.push(row);
      return false;
    }

    seenOutletCodes.add(outletCode.toLowerCase());
    return true;
  });

  const allCodes = uniqueData.map(r => r['Outlet Code'].toString().trim());
  const existingOutlets = await Outlet.findAll({
    where: { outletCode: allCodes },
    attributes: ['outletCode']
  });
  const existingCodes = existingOutlets.map(o => o.outletCode);

  const uniquePins = [...new Set(uniqueData.map(r => r['Pincode']?.toString().trim()).filter(Boolean))];
  const pinRecords = await PinCode.findAll({
    where: { Pincode: uniquePins },
    attributes: ["Pincode", "District", "StateName"]
  });
  const pinMap = {};
  pinRecords.forEach(p => pinMap[p.Pincode] = { state: p.StateName, city: p.District });

  for (let i = 0; i < uniqueData.length; i++) {
    const row = uniqueData[i];
    let hasError = false;
    let errorMessage = '';

    const outletCode = row['Outlet Code']?.toString().trim();
    const pincode = row['Pincode']?.toString().trim();

    if (!outletCode || outletCode === "undefined" || outletCode === "null") {
      errorMessage += "Outlet Code is empty or invalid. ";
      hasError = true;
    }
    if (!row['Outlet Name'] || row['Outlet Name'] === "undefined" || row['Outlet Name'] === "null") {
      errorMessage += "Outlet Name is empty or invalid. ";
      hasError = true;
    }
    if (!row['GstIn']) {
      errorMessage += "GSTIN is required. ";
      hasError = true;
    }
    if (!row['Outlet Segment']) {
      errorMessage += "Outlet Segment is required. ";
      hasError = true;
    }
    if (!row['Company Id']) {
      errorMessage += "Company Id is required. ";
      hasError = true;
    }
    if (!row['Email']) {
      errorMessage += "Email is required. ";
      hasError = true;
    }
    if (!row['Phone Number']) {
      errorMessage += "Phone Number is required. ";
      hasError = true;
    }
    if (!row['Address1']) {
      errorMessage += "Address1 is required. ";
      hasError = true;
    }
    if (!pincode) {
      errorMessage += "Pincode is required. ";
      hasError = true;
    }

    if (existingCodes.includes(outletCode)) {
      errorMessage += "Outlet Code already exists in DB. ";
      hasError = true;
    }

    const pinData = pinMap[pincode];
    if (!pinData) {
      errorMessage += "Pincode not found in master. ";
      hasError = true;
    }

    if (hasError) {
      row['Message'] = `Row ${i + 2}: ${errorMessage.trim()}`;
      exceptionData.push(row);
      continue;
    }

    // row['State'] = pinData.state;
    // row['City'] = pinData.city;

    successData++;
  }

  return { result: 'success', exceptionData, successData };
};

const validatelabourCatagoryMappingUploads = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  const requiredHeaders = [
    "Labour Code","Category Id","SubCategory Id"
  ];

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      // Validate Headers
      const actualHeaders = Object.keys(sheetData[0] || {});
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        return {
          result: 'failed',
          exceptionData: [],
          successData: 0,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        };
      }

      //  Check for duplicate labour code
      const labourcodeSet = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const labourCode = element['Labour Code'];

        if ( typeof labourCode === 'string') {
          const normalized = String(labourCode).trim();
          if (labourcodeSet.has(normalized)) {
            element['Message'] = `Row ${index + 2}: Duplicate Labour Code`;
            exceptionData.push(element);
            return false;
          } else {
            labourcodeSet.add(normalized);
            return true;
          }
        }

        return false;
      });

      if (exceptionData.length > 0) {
        return { result: 'failed', exceptionData, successData };
      }
      const isEmpty = val => val === undefined || val === null || val === '' || val === 'null' || val === 'undefined';

      const requiredFields = [
        "Labour Code","Category Id","SubCategory Id"
      ];
      //  row-wise validations
      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];
        try {
          let hasError = false;
          let errorMessage = '';



          for (const field of requiredFields) {
            if (isEmpty(element[field])) {
              errorMessage += `${field} is empty or invalid. `;
              hasError = true;
            }
          }

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          }




        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = exceptionData.length > 0 ? 'failed' : 'success';
      successData = sheetData.length - exceptionData.length;

    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateGrnUploads:', err);
  }

  return { result, exceptionData, successData };
};

const validateCashier = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = 0;

  try {
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const seenCashierId = new Set();
      const uniqueSheetData = sheetData.filter((element, index) => {
        const cashierId = element['Cashier ID'];

        if (typeof cashierId === 'string') {
          const trimmedCashierId = cashierId.trim().toLowerCase();

          if (seenCashierId.has(trimmedCashierId)) {
            element['Message'] = `Row ${index + 2}: Duplicate Cashier ID`;
            exceptionData.push(element);
            return false;
          } else {
            seenCashierId.add(trimmedCashierId);
            return true;
          }
        }

        return false;
      });

      for (let index = 0; index < uniqueSheetData.length; index++) {
        const element = uniqueSheetData[index];

        try {
          let hasError = false;
          let errorMessage = '';

          // console.log('111111111111',element)

          if (!element['Cashier ID'] || element['Cashier ID'] === '' || element['Cashier ID'] === "null" || element['Cashier ID'] === "undefined") {
            errorMessage += "Cashier ID is empty or invalid. ";
            hasError = true;
          };

          if (hasError) {
            element['Message'] = `Row ${index + 2}: ${errorMessage.trim()}`;
            exceptionData.push(element);
            continue;
          };


        } catch (innerError) {
          element['Message'] = `Error processing row ${index + 2}: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = 'success';
      successData = sheetData.length - exceptionData.length;
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateCashier:', err);
  }

  let finalResult = {};
  for (let key in successData) {
    if (successData[key] > 0) {
      finalResult[key] = `${successData[key]} new ${key}`;
    }
  }

  return { result: result, exceptionData: exceptionData, successData: successData };
};

const bulkCashier = async (fileBuffer, user) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const { totalRows, insertedRows } = await dao.insertBulkCashier(data, user.id);

  return { totalRows, insertedRows };
};

const service = {
  processFileAndSaveToDB,
  processFileAndSaveToDBLabor,
  validateBulkMake,
  procesFileAndSaveToDBMake,
  procesFileAndSaveToDBModel,
  validateBulkModel,
  validateItemMaster,
  validateLaborSchdeule,
  validateBulkCustomer,
  procesFileAndSaveToDBCustomers,
  validateBulkVehicle,
  procesFileAndSaveToDBVehicles,
  validateBulkPincode,
  procesFileAndSaveToDBPincode,
  validateGrnUploads,
  validatePoUploads,
  validateVendorUploads,
  validateTechnicianUploads,
  processAndSaveToDB,
  validateOutletMaster,
  validatelabourCatagoryMappingUploads,
  validateCashier,
  bulkCashier
};

export default service;