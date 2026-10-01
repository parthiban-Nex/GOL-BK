import AccountStatementService from './service.js';
import logger from '../../config/logger.js';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * Run the download statement cron job
 * This can be triggered via URL for testing
 */
const downloadStatement = async (req, res, next) => {
  try {
    logger.info('Starting download statement process...');
    const result = await AccountStatementService.downloadStatement();
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller downloadStatement Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to download statements',
      error: err.message,
    });
  }
};

/**
 * Get statements for an outlet with pagination
 */
const getStatementsByOutlet = async (req, res, next) => {
  try {
    const employeeCode = req.user?.employeeCode;
    const outletId = req.user?.outlet?.id;
    const employeeId = req.user?.employeeId;

    console.log('req.user:', req.user);
    console.log('employeeCode:', employeeCode, 'outletId:', outletId, 'employeeId:', employeeId);

    const { offset = 0, limit = 10, searchText = '' } = req.body;

    let statements;

    // View mode condition:
    // isOutletView = true  -> employeeCode is 'outlet_admin' (Outlet view)
    // isOutletView = false -> employeeCode is 'fbm_user' (FBM view)
    const isOutletView = employeeCode === 'outlet_admin';

    if (isOutletView) {
      // Outlet view: Filter by outlet_id
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'Outlet ID not found' });
      }
      statements = await AccountStatementService.getStatementsByOutlet(
        parseInt(outletId),
        parseInt(offset),
        parseInt(limit),
        searchText
      );
    } else {
      // FBM view (fbm_user): Filter by outlet_id IN (all mapped outlet IDs)
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required' });
      }
      statements = await AccountStatementService.getStatementsByMappedOutlets(
        parseInt(employeeId),
        parseInt(offset),
        parseInt(limit),
        searchText
      );
    }

    console.log('statements result:', statements);
    res.status(200).json({ success: true, data: statements, isOutletView });
  } catch (err) {
    logger.error('Controller getStatementsByOutlet Error:', err);
    next(err);
  }
};

/**
 * Approve or reject a statement
 */
const approveStatement = async (req, res, next) => {
  try {
    const { id, status, remark, query_type } = req.body;

    if (!id || ![1, 2].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (status === 2 && (!query_type || query_type.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Please select query type' });
    }

    const result = await AccountStatementService.approveStatement(id, status, remark, query_type);
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller approveStatement Error:', err);
    next(err);
  }
};


/**
 * Download statement file
 */
const downloadStatementFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Statement ID required' });
    }

    const result = await AccountStatementService.downloadStatementFile(id);
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller downloadStatementFile Error:', err);
    next(err);
  }
};

/**
 * Get all mapped outlets for the logged-in user
 */
const getMappedOutlets = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID not found' });
    }

    const outlets = await AccountStatementService.getMappedOutlets(parseInt(employeeId));
    res.status(200).json({ success: true, data: outlets });
  } catch (err) {
    logger.error('Controller getMappedOutlets Error:', err);
    next(err);
  }
};

/**
 * Send a chat message for a statement
 */
const sendStatementChat = async (req, res, next) => {
  try {
    const { statement_id, message, query_type } = req.body;
    const senderType = req.user?.employeeCode;
    const userId = req.user?.id;

    if (!statement_id || !message) {
      return res.status(400).json({ success: false, message: 'Statement ID and message are required' });
    }

    const result = await AccountStatementService.createStatementChat(
      parseInt(statement_id),
      message,
      senderType,
      userId,
      req.file || null,
      query_type || null
    );

    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller sendStatementChat Error:', err);
    next(err);
  }
};

/**
 * Get all chat messages for a statement
 */
const getStatementChats = async (req, res, next) => {
  try {
    const { statement_id } = req.body;

    if (!statement_id) {
      return res.status(400).json({ success: false, message: 'Statement ID is required' });
    }

    const result = await AccountStatementService.getStatementChats(parseInt(statement_id));
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller getStatementChats Error:', err);
    next(err);
  }
};

/**
 * Get notification count (detects user type: outlet_admin or fbm_user)
 */
const getNotificationCount = async (req, res, next) => {
  try {
    const employeeCode = req.user?.employeeCode;
    const isOutletView = employeeCode === 'outlet_admin';

    let result;
    if (isOutletView) {
      const outletId = req.user?.outlet?.id;
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'Outlet ID not found' });
      }
      result = await AccountStatementService.getNotificationCountOutlet(parseInt(outletId));
    } else {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID not found' });
      }
      result = await AccountStatementService.getNotificationCount(parseInt(employeeId));
    }

    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller getNotificationCount Error:', err);
    next(err);
  }
};

/**
 * Get notification list (detects user type: outlet_admin or fbm_user)
 */
const getNotifications = async (req, res, next) => {
  try {
    const employeeCode = req.user?.employeeCode;
    const isOutletView = employeeCode === 'outlet_admin';

    let result;
    if (isOutletView) {
      const outletId = req.user?.outlet?.id;
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'Outlet ID not found' });
      }
      result = await AccountStatementService.getNotificationsOutlet(parseInt(outletId));
    } else {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID not found' });
      }
      result = await AccountStatementService.getNotifications(parseInt(employeeId));
    }

    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller getNotifications Error:', err);
    next(err);
  }
};

/**
 * Mark FBM notification as read
 */
const markNotificationReadFbm = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Statement ID is required' });
    }

    const result = await AccountStatementService.markNotificationReadFbm(parseInt(id));
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller markNotificationReadFbm Error:', err);
    next(err);
  }
};

/**
 * Mark outlet notification as read
 */
const markNotificationReadOutlet = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Statement ID is required' });
    }

    const result = await AccountStatementService.markNotificationReadOutlet(parseInt(id));
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller markNotificationReadOutlet Error:', err);
    next(err);
  }
};

/**
 * Export FBM statements as Excel
 */
const exportFbmStatementsCsv = async (req, res, next) => {
  try {
    const { outletId, month } = req.body;

    if (!outletId || !month) {
      return res.status(400).json({ success: false, message: 'Outlet ID and Month are required' });
    }

    const result = await AccountStatementService.exportStatementsCsv(parseInt(outletId), month);
    const statements = result.statements || [];

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${m}/${year}`;
      } catch {
        return dateStr;
      }
    };

    const getStatusLabel = (status) => {
      if (status === 1 || status === '1') return 'Accepted';
      if (status === 2 || status === '2') return 'Rejected';
      return 'Pending';
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SOA Report');

    const headers = ['Outlet Code', 'Outlet Name', 'Outlet City', 'Outlet State', 'Statement of Month/Year', 'Created Date', 'Status', 'Franchise', 'FBM', 'Last Response Date'];
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const leftAlign = { horizontal: 'left', vertical: 'middle' };

    for (const s of statements) {
      const isRejected = s.approvalStatus === 2 || s.approvalStatus === '2';
      const isAccepted = s.approvalStatus === 1 || s.approvalStatus === '1';

      const lastResponseDate = isAccepted
        ? formatDate(s.approvalAt)
        : isRejected
          ? formatDate(s.lastChatDate)
          : '-';

      const row = worksheet.addRow([
        s.outlet?.outletCode || '-',
        s.outlet?.outletName || '-',
        s.outlet?.city || '-',
        s.outlet?.state || '-',
        `${s.statementOfMonth || ''} ${s.statementOfYear || ''}`,
        formatDate(s.created_at),
        getStatusLabel(s.approvalStatus),
        s.lastSenderType === 'outlet_admin' ? (s.lastMessage || '-') : '-',
        s.lastSenderType === 'fbm_user' ? (s.lastMessage || '-') : '-',
        lastResponseDate,
      ]);

      row.eachCell((cell) => {
        cell.alignment = leftAlign;
      });
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 4, 40);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SOAReport.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Controller exportFbmStatementsCsv Error:', err);
    next(err);
  }
};

const AccountStatementController = {
  downloadStatement,
  getMappedOutlets,
  getStatementsByOutlet,
  approveStatement,
  downloadStatementFile,
  sendStatementChat,
  getStatementChats,
  getNotificationCount,
  getNotifications,
  markNotificationReadFbm,
  markNotificationReadOutlet,
  exportFbmStatementsCsv,
};

export default AccountStatementController;
