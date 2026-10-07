import ExpenseVendorService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const createExpenseVendor = async (req, res, next) => {
  try {
    logger.info('ExpenseVendor Controller createExpenseVendor requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense Vendor',
      action: ACTION_ADD,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await ExpenseVendorService.createExpenseVendor(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Expense Vendor added successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Expense Vendor created successfully',
        data: result.data,
      });
    } else {
      auditData.message = 'Expense Vendor not added';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to create Expense Vendor',
      });
    }
  } catch (err) {
    logger.error('ExpenseVendor Controller createExpenseVendor Error:', err);
    next(err);
  }
};

const listExpenseVendors = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense Vendor',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Expense Vendor data',
    };

    const data = await ExpenseVendorService.listExpenseVendors(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Expense Vendors retrieved successfully',
      vendorData: data,
    });
  } catch (err) {
    logger.error('ExpenseVendor Controller listExpenseVendors Error:', err);
    next(err);
  }
};

export default {
  createExpenseVendor,
  listExpenseVendors,
};
