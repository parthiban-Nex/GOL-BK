import FinancePurchaseService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const createPurchase = async (req, res, next) => {
  try {
    logger.info('FinancePurchase Controller createPurchase requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_ADD,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await FinancePurchaseService.createPurchase(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Purchase created successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Purchase created successfully',
        data: result.data,
      });
    } else {
      auditData.message = 'Purchase not created';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to create Purchase',
      });
    }
  } catch (err) {
    logger.error('FinancePurchase Controller createPurchase Error:', err);
    next(err);
  }
};

const editPurchase = async (req, res, next) => {
  try {
    logger.info('FinancePurchase Controller editPurchase requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await FinancePurchaseService.editPurchase(req.body, req.user, file);

    if (result && result.status === 'success') {
      auditData.message = 'Purchase updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Purchase updated successfully',
        data: result.data,
      });
    } else if (result && result.status === 'not_found') {
      auditData.message = 'Purchase not found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Purchase not found',
      });
    } else {
      auditData.message = 'Purchase not updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to update Purchase',
      });
    }
  } catch (err) {
    logger.error('FinancePurchase Controller editPurchase Error:', err);
    next(err);
  }
};

const listPurchases = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Purchase data',
    };

    const data = await FinancePurchaseService.listPurchases(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Purchases retrieved successfully',
      purchaseData: data?.rows || data,
      totalItems: data?.totalItems ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data?.totalPages ?? 1,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 10,
      totals: data?.totals || { inclGst: 0, paid: 0, pending: 0 },
    });
  } catch (err) {
    logger.error('FinancePurchase Controller listPurchases Error:', err);
    next(err);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.purchaseId;
    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Purchase ID is required',
      });
    }

    const result = await FinancePurchaseService.getPurchaseById(id, req.user);

    if (result && result.status === 'success') {
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Purchase retrieved successfully',
        data: result.data,
      });
    } else {
      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Purchase not found',
      });
    }
  } catch (err) {
    logger.error('FinancePurchase Controller getPurchase Error:', err);
    next(err);
  }
};

const addPayment = async (req, res, next) => {
  try {
    logger.info('FinancePurchase Controller addPayment requestData:' + JSON.stringify(req.body));
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const result = await FinancePurchaseService.addPayment(req.body, req.user);

    if (result && result.status === 'success') {
      auditData.message = 'Payment recorded successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Payment recorded successfully',
        data: result.data,
      });
    } else if (result && result.status === 'not_found') {
      auditData.message = 'Purchase not found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Purchase not found',
      });
    } else {
      auditData.message = 'Payment not recorded';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to record payment',
      });
    }
  } catch (err) {
    logger.error('FinancePurchase Controller addPayment Error:', err);
    next(err);
  }
};

const getPurchasePayments = async (req, res, next) => {
  try {
    const purchaseId = req.body.purchaseId || req.body.id;
    if (!purchaseId) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Purchase ID is required',
      });
    }

    const result = await FinancePurchaseService.getPurchasePayments(purchaseId, req.user);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Purchase payments retrieved successfully',
      data: result.data,
    });
  } catch (err) {
    logger.error('FinancePurchase Controller getPurchasePayments Error:', err);
    next(err);
  }
};

const uploadPurchaseDocument = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const id = req.body.id;

    if (!id) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Purchase ID is required',
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
      submenu_name: 'Purchase',
      action: ACTION_UPDATE,
      access: 'Portal',
    };

    const result = await FinancePurchaseService.uploadPurchaseDocument(id, file, req.user);

    if (result && result.status === 'success') {
      auditData.message = 'Purchase document uploaded successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Purchase document uploaded successfully',
        data: result.data,
      });
    } else if (result && result.status === 'not_found') {
      auditData.message = 'Purchase not found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: result.message || 'Purchase not found',
      });
    } else {
      auditData.message = 'Purchase document not uploaded';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to upload Purchase document',
      });
    }
  } catch (err) {
    logger.error('FinancePurchase Controller uploadPurchaseDocument Error:', err);
    next(err);
  }
};

export default {
  createPurchase,
  editPurchase,
  listPurchases,
  getPurchase,
  addPayment,
  getPurchasePayments,
  uploadPurchaseDocument,
};
