import xlsx from 'xlsx';
import dao from './dao.js';
import logger from '../../config/logger.js';

const BRANCH_COLUMN_INDEX = 8; // Column I
const ORACLE_CUSTOMER_CODE_INDEX = 9; // Column J
const SITE_NUMBER_INDEX = 20; // Column U

const parseUploadRows = (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
};

const updateOracleDetailsFromUpload = async (user, file) => {
  if (!file || !file.buffer) {
    return {
      requestSuccessful: false,
      message: 'File is required.',
      processed: 0,
      updated: 0,
      skipped: 0,
      notFound: 0,
      errors: [{ row: 0, message: 'Missing upload file' }],
    };
  }

  const rows = parseUploadRows(file.buffer);
  if (rows.length <= 1) {
    return {
      requestSuccessful: false,
      message: 'No data rows found in the upload.',
      processed: 0,
      updated: 0,
      skipped: 0,
      notFound: 0,
      errors: [{ row: 0, message: 'Empty sheet or missing data rows' }],
    };
  }

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const errors = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const branch = String(row[BRANCH_COLUMN_INDEX] || '').trim();
    const oracleCustomerCode = String(row[ORACLE_CUSTOMER_CODE_INDEX] || '').trim();
    const siteNumber = String(row[SITE_NUMBER_INDEX] || '').trim();

    if (!branch) {
      skipped += 1;
      continue;
    }

    processed += 1;

    try {
      const outlet = await dao.findOutletByBranchOrCode(branch);
      if (!outlet) {
        notFound += 1;
        errors.push({
          row: rowIndex + 1,
          branch,
          message: 'Outlet not found for branch code',
        });
        continue;
      }

      const payload = {
        oracleCashCustomerCode: oracleCustomerCode,
        oracleSiteCode: siteNumber,
      };

      if (user?.id) {
        payload.updatedBy = user.id;
      }

      const [affected] = await dao.updateOutletOracleDetails(outlet.id, payload);
      if (affected > 0) {
        updated += 1;
      } else {
        errors.push({
          row: rowIndex + 1,
          branch,
          message: 'No rows updated',
        });
      }
    } catch (err) {
      logger.error('Franchise upload row update failed:', err);
      errors.push({
        row: rowIndex + 1,
        branch,
        message: 'Update failed',
      });
    }
  }

  return {
    requestSuccessful: true,
    message: 'Upload processed.',
    processed,
    updated,
    skipped,
    notFound,
    errors,
  };
};

const validateOracleDetailsFromUpload = async (user, file) => {
  let result = 'failed';
  const exceptionData = [];
  let successData = 0;

  if (!file || !file.buffer) {
    return { result, exceptionData, successData, message: 'File is required.' };
  }

  const rows = parseUploadRows(file.buffer);
  if (rows.length <= 1) {
    return { result, exceptionData, successData, message: 'No data rows found in the upload.' };
  }

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const branch = String(row[BRANCH_COLUMN_INDEX] || '').trim();
    const oracleCustomerCode = String(row[ORACLE_CUSTOMER_CODE_INDEX] || '').trim();
    const siteNumber = String(row[SITE_NUMBER_INDEX] || '').trim();

    let message = '';
    if (!branch) {
      message = 'Branch is empty or invalid.';
    }

    if (!message) {
      try {
        const outlet = await dao.findOutletByBranchOrCode(branch);
        if (!outlet) {
          message = 'Outlet not found for branch code.';
        }
      } catch (err) {
        logger.error('Franchise upload validation failed:', err);
        message = 'Validation failed.';
      }
    }

    if (message) {
      exceptionData.push({
        Branch: branch,
        'Oracle Customer Code': oracleCustomerCode,
        'Site Number': siteNumber,
        Message: `Row ${rowIndex + 1}: ${message}`,
      });
    } else {
      successData += 1;
    }
  }

  result = 'success';
  return { result, exceptionData, successData };
};

export default {
  updateOracleDetailsFromUpload,
  validateOracleDetailsFromUpload,
};
