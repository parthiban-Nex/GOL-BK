import BankDepositService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
  ACTION_DELETE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const createBankDeposit = async (req, res, next) => {
  try {
    logger.info('BankDeposit Controller createBankDeposit requestData: ' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_ADD,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await BankDepositService.createBankDeposit(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Bank deposit created successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Bank deposit created successfully',
        data: result.data,
      });
    }

    auditData.message = 'Bank deposit not created';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(400).json({
      requestSuccessful: false,
      message: 'Failed to create Bank deposit',
    });
  } catch (err) {
    logger.error('BankDeposit Controller createBankDeposit Error:', err);
    next(err);
  }
};

const editBankDeposit = async (req, res, next) => {
  try {
    logger.info('BankDeposit Controller editBankDeposit requestData: ' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await BankDepositService.editBankDeposit(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Bank deposit updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Bank deposit updated successfully',
        data: result.data,
      });
    }

    auditData.message = result?.message || 'Bank deposit update failed';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(result?.status === 'not_found' ? 404 : 400).json({
      requestSuccessful: false,
      message: result?.message || 'Failed to update Bank deposit',
    });
  } catch (err) {
    logger.error('BankDeposit Controller editBankDeposit Error:', err);
    next(err);
  }
};

const listBankDeposits = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Bank Deposit data',
    };

    const data = await BankDepositService.listBankDeposits(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Bank deposits retrieved successfully',
      depositData: data?.rows || data,
      totalItems: data?.totalItems ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data?.totalPages ?? 1,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 10,
      stats: data?.stats || {
        today: { amount: 0, count: 0 },
        week: { amount: 0, count: 0 },
        month: { amount: 0, count: 0 },
        pending: { amount: 0, count: 0 },
      },
    });
  } catch (err) {
    logger.error('BankDeposit Controller listBankDeposits Error:', err);
    next(err);
  }
};

const getBankDeposit = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.depositId;
    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Bank deposit ID is required',
      });
    }

    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_GET,
      access: 'Portal',
      message: `Get Bank Deposit: ${id}`,
    };

    const result = await BankDepositService.getBankDepositById(id, req.user);

    if (result && result.status === 'success') {
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Bank deposit details retrieved',
        data: result.data,
      });
    }

    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(404).json({
      requestSuccessful: false,
      message: 'Bank deposit not found',
    });
  } catch (err) {
    logger.error('BankDeposit Controller getBankDeposit Error:', err);
    next(err);
  }
};

const deleteBankDeposit = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.depositId;
    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Bank deposit ID is required for deletion',
      });
    }

    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_DELETE || ACTION_UPDATE,
      access: 'Portal',
      message: `Delete Bank Deposit Record`,
    };

    const result = await BankDepositService.softDeleteBankDeposit(id, req.user);

    if (result && result.status === 'success') {
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Bank deposit deleted successfully',
      });
    }

    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(404).json({
      requestSuccessful: false,
      message: result?.message || 'Bank deposit not found',
    });
  } catch (err) {
    logger.error('BankDeposit Controller deleteBankDeposit Error:', err);
    next(err);
  }
};

const uploadDepositSlip = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.depositId;
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Bank deposit ID is required',
      });
    }
    if (!file) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Slip document file is required',
      });
    }

    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_UPDATE,
      access: 'Portal',
      message: `Upload Slip for Bank Deposit: ${id}`,
    };

    const result = await BankDepositService.uploadDepositSlip(id, file, req.user);

    if (result && result.status === 'success') {
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Deposit slip uploaded successfully',
        data: result.data,
      });
    }

    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(400).json({
      requestSuccessful: false,
      message: result?.message || 'Failed to upload deposit slip',
    });
  } catch (err) {
    logger.error('BankDeposit Controller uploadDepositSlip Error:', err);
    next(err);
  }
};

const getBankDepositStats = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_GET,
      access: 'Portal',
      message: 'Get Bank Deposit stats',
    };

    const result = await BankDepositService.getBankDepositStats(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Bank deposit stats retrieved successfully',
      stats: result.stats,
    });
  } catch (err) {
    logger.error('BankDeposit Controller getBankDepositStats Error:', err);
    next(err);
  }
};

const listEditHistories = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Bank Deposit',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Bank Deposit edit history',
    };

    const data = await BankDepositService.listEditHistories(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Bank deposit edit histories retrieved successfully',
      historyData: data || [],
    });
  } catch (err) {
    logger.error('BankDeposit Controller listEditHistories Error:', err);
    next(err);
  }
};

export default {
  createBankDeposit,
  editBankDeposit,
  listBankDeposits,
  getBankDeposit,
  deleteBankDeposit,
  uploadDepositSlip,
  getBankDepositStats,
  listEditHistories,
};
