import logger from '../../config/logger.js';
import service from './service.js';
import auditLog from '../../shared/auditLog.js';
import { ACTION_ADD, ACTION_GET } from '../../shared/applicationConstants.js';

const adminOutletUpload = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Bulk Upload',
      submenu_name: 'Franchise Upload',
      action: ACTION_ADD,
    };
    const result = await service.updateOracleDetailsFromUpload(req.user, req.file);
    auditData.message = 'Bulk Upload Franchise master';
    auditData.result = result?.requestSuccessful ? 'success' : 'failed';
    auditLog.createAuditLog(req, auditData);
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Franchise admin outlet upload error:', err);
    return next(err);
  }
};

const validateFranchiseUpload = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Bulk Upload',
      submenu_name: 'Franchise Upload',
      action: ACTION_GET,
    };

    const { result, exceptionData, successData, message } =
      await service.validateOracleDetailsFromUpload(req.user, req.file);

    if (result === 'success') {
      auditData.message = 'validate Franchise upload';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successCount: successData,
        successData: successData,
        exceptionCount: exceptionData.length,
        exceptionData: exceptionData,
        message: 'Data Validated Successfully',
      });
    }

    auditData.message = 'Validation failed';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      exceptionData: exceptionData,
      successData: successData,
      message: message || 'Data not Saved',
    });
  } catch (err) {
    logger.error('Franchise validate upload error:', err);
    return next(err);
  }
};

export default {
  adminOutletUpload,
  validateFranchiseUpload,
};
