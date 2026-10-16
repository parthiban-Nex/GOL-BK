import FinancePurchaseVendorService from './service.js';
import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';

const createFinancePurchaseVendor = async (req, res, next) => {
  try {
    logger.info(
      'FinancePurchaseVendor Controller createFinancePurchaseVendor requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_ADD,
      access: 'Portal',
    };

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    const result = await FinancePurchaseVendorService.createFinancePurchaseVendor(
      req.body,
      req.user,
      file
    );

    if (result && result.status === 'success') {
      auditData.message = 'Purchase Vendor created successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Purchase Vendor created successfully',
        data: result.data,
      });
    } else {
      auditData.message = 'Purchase Vendor not created';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).json({
        requestSuccessful: false,
        message: 'Failed to create Purchase Vendor',
      });
    }
  } catch (err) {
    logger.error('FinancePurchaseVendor Controller createFinancePurchaseVendor Error:', err);
    next(err);
  }
};

const listFinancePurchaseVendors = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Finance',
      submenu_name: 'Purchase',
      action: ACTION_GET,
      access: 'Portal',
      message: 'List Purchase Vendor data',
    };

    const data = await FinancePurchaseVendorService.listFinancePurchaseVendors(
      req.body,
      req.user
    );

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Purchase Vendors retrieved successfully',
      vendorData: data?.rows || data,
      totalItems: data?.totalItems ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data?.totalPages ?? 1,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 10,
    });
  } catch (err) {
    logger.error('FinancePurchaseVendor Controller listFinancePurchaseVendors Error:', err);
    next(err);
  }
};

export default {
  createFinancePurchaseVendor,
  listFinancePurchaseVendors,
};
