import logger from '../../config/logger.js';
import FinancePurchaseVendorDao from './dao.js';
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
    const originalName = file.originalname || 'vendor_doc';
    const cleanName = originalName.replace(/\s+/g, '_');
    const newName = `${date.getTime().toString()}${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
    const destinationPath = `DMS/${newName}`;
    const blob = bucket.file(destinationPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve) => {
      blobStream.on('error', (err) => {
        logger.error('GCS Upload Error for Purchase Vendor document:', err);
        resolve(null);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    logger.error('Purchase Vendor service uploadFileToGCS Error:', err);
    return null;
  }
};

const createFinancePurchaseVendor = async (payload, user, file = null) => {
  try {
    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for purchase vendor bypassed:', uploadErr);
        documentLink = null;
      }
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await FinancePurchaseVendorDao.createFinancePurchaseVendor(
      payload,
      userId,
      outletId,
      companyId,
      documentLink
    );

    if (data && RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Create',
          menu_name: 'Finance',
          submenu_name: 'Purchase',
          createdBy: userId,
          username: user?.employeeCode || user?.name || 'User',
          message: `Purchase Vendor created: ${payload.vendorName}`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Purchase Vendor:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('FinancePurchaseVendor service createFinancePurchaseVendor Error:', err);
    throw err;
  }
};

const listFinancePurchaseVendors = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;
    const query = body.query || body.search || '';
    const page = body.page || null;
    const pageSize = body.pageSize || body.limit || null;

    const data = await FinancePurchaseVendorDao.listFinancePurchaseVendors({
      outletId,
      companyId,
      query,
      page,
      pageSize,
    });

    return data;
  } catch (err) {
    logger.error('FinancePurchaseVendor service listFinancePurchaseVendors Error:', err);
    throw err;
  }
};

export default {
  createFinancePurchaseVendor,
  listFinancePurchaseVendors,
};
