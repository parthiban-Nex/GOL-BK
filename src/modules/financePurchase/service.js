import logger from '../../config/logger.js';
import FinancePurchaseDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Storage } from '@google-cloud/storage';

const uploadFileToGCS = async (file) => {
  if (!file || !file.buffer) return null;

  try {
    const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';
    const bucket = storage.bucket(bucketName);
    const date = new Date();
    const originalName = file.originalname || 'purchase_doc';
    const cleanName = originalName.replace(/\s+/g, '_');
    const newName = `${date.getTime().toString()}${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
    const destinationPath = `DMS/${newName}`;
    const blob = bucket.file(destinationPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve) => {
      blobStream.on('error', (err) => {
        logger.error('GCS Upload Error for Purchase document:', err);
        resolve(null);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    logger.error('Purchase service uploadFileToGCS Error:', err);
    return null;
  }
};

const createPurchase = async (payload, user, file = null) => {
  try {
    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for purchase document bypassed:', uploadErr);
        documentLink = null;
      }
    }

    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await FinancePurchaseDao.createPurchase(
      payload,
      userId,
      outletId,
      companyId,
      documentLink,
      userName
    );

    if (data && RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Create',
          menu_name: 'Finance',
          submenu_name: 'Purchase',
          createdBy: userId,
          username: userName,
          message: `Purchase invoice recorded for ${payload.vendor || 'Vendor'} (${data.purchaseCode || data.id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Purchase:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchase service createPurchase Error:', err);
    throw err;
  }
};

const listPurchases = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;
    const query = body.query || body.search || '';
    const dateFrom = body.dateFrom || null;
    const dateTo = body.dateTo || null;
    const page = body.page || null;
    const pageSize = body.pageSize || body.limit || null;

    const data = await FinancePurchaseDao.listPurchases({
      outletId,
      companyId,
      query,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });

    return data;
  } catch (err) {
    logger.error('FinancePurchase service listPurchases Error:', err);
    throw err;
  }
};

const getPurchaseById = async (id, user) => {
  try {
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const data = await FinancePurchaseDao.getPurchaseById(id, outletId);
    if (!data) {
      return {
        status: 'not_found',
        message: 'Purchase invoice not found',
      };
    }
    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchase service getPurchaseById Error:', err);
    throw err;
  }
};

const editPurchase = async (payload, user, file = null) => {
  try {
    const id = payload.id;
    if (!id) {
      throw new Error('Purchase ID is required');
    }

    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for edited purchase document bypassed:', uploadErr);
        documentLink = null;
      }
    }

    if (documentLink) {
      payload.documentLink = documentLink;
    }

    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await FinancePurchaseDao.updatePurchase(
      id,
      payload,
      userId,
      outletId,
      companyId
    );

    if (!data) {
      return {
        status: 'not_found',
        message: 'Purchase record not found',
      };
    }

    if (RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Update',
          menu_name: 'Finance',
          submenu_name: 'Purchase',
          createdBy: userId,
          username: userName,
          message: `Purchase bill updated (${data.purchaseCode || id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Edit Purchase:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchase service editPurchase Error:', err);
    throw err;
  }
};

const addPayment = async (payload, user) => {
  try {
    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const result = await FinancePurchaseDao.addPayment(
      payload,
      userId,
      userName,
      outletId,
      companyId
    );

    if (result && result.notFound) {
      return {
        status: 'not_found',
        message: 'Purchase record not found',
      };
    }

    if (result && RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Update',
          menu_name: 'Finance',
          submenu_name: 'Purchase',
          createdBy: userId,
          username: userName,
          message: `Payment of ₹${payload.amount} recorded for purchase (${result.purchase?.purchaseCode || payload.purchaseId}) via ${payload.paymentMode || 'Payment'}`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Purchase Payment:', activityErr);
      }
    }

    return {
      status: 'success',
      data: result,
    };
  } catch (err) {
    logger.error('FinancePurchase service addPayment Error:', err);
    throw err;
  }
};

const getPurchasePayments = async (purchaseId, user) => {
  try {
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const data = await FinancePurchaseDao.getPurchasePayments(purchaseId, outletId);
    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchase service getPurchasePayments Error:', err);
    throw err;
  }
};

const uploadPurchaseDocument = async (id, file, user) => {
  try {
    if (!id) {
      throw new Error('Purchase ID is required');
    }

    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for purchase document bypassed:', uploadErr);
        documentLink = null;
      }

      if (!documentLink) {
        const cleanName = (file.originalname || 'document').replace(/\s+/g, '_');
        documentLink = `uploads/purchases/${Date.now()}_${cleanName}`;
      }
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await FinancePurchaseDao.updatePurchaseDocument(
      id,
      documentLink,
      userId,
      outletId,
      companyId
    );

    if (!data) {
      return {
        status: 'not_found',
        message: 'Purchase record not found',
      };
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchase service uploadPurchaseDocument Error:', err);
    throw err;
  }
};

export default {
  createPurchase,
  editPurchase,
  listPurchases,
  getPurchaseById,
  addPayment,
  getPurchasePayments,
  uploadPurchaseDocument,
};
