import ExpenseService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const createExpense = async (req, res, next) => {
  try {
    logger.info('Expense Controller createExpense requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense',
      action: ACTION_ADD,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await ExpenseService.createExpense(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Expense created successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Expense created successfully',
        data: result.data,
      });
    } else {
      auditData.message = 'Expense not created';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to create Expense',
      });
    }
  } catch (err) {
    logger.error('Expense Controller createExpense Error:', err);
    next(err);
  }
};

const editExpense = async (req, res, next) => {
  try {
    logger.info('Expense Controller editExpense requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await ExpenseService.editExpense(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Expense updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Expense updated successfully',
        data: result.data,
      });
    } else if (result && result.status === 'not_found') {
      auditData.message = 'Expense not found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Expense not found',
      });
    } else {
      auditData.message = 'Expense not updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to update Expense',
      });
    }
  } catch (err) {
    logger.error('Expense Controller editExpense Error:', err);
    next(err);
  }
};

const listExpenses = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Expense data',
    };

    const data = await ExpenseService.listExpenses(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Expenses retrieved successfully',
      expenseData: data?.rows || data,
      totalItems: data?.totalItems ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data?.totalPages ?? 1,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 10,
      totals: data?.totals || { inclGst: 0, paid: 0, pending: 0 },
    });
  } catch (err) {
    logger.error('Expense Controller listExpenses Error:', err);
    next(err);
  }
};

const uploadExpenseDocument = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const id = req.body.id;

    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Expense ID is required',
      });
    }

    if (!file) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Document file is required',
      });
    }

    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Expense',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const result = await ExpenseService.uploadExpenseDocument(id, file, req.user);

    if (result && result.status === 'success') {
      auditData.message = 'Expense document uploaded successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Expense document uploaded successfully',
        data: result.data,
      });
    } else if (result && result.status === 'not_found') {
      auditData.message = 'Expense not found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Expense not found',
      });
    } else {
      auditData.message = 'Expense document not uploaded';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to upload Expense document',
      });
    }
  } catch (err) {
    logger.error('Expense Controller uploadExpenseDocument Error:', err);
    next(err);
  }
};

export default {
  createExpense,
  editExpense,
  listExpenses,
  uploadExpenseDocument,
};
