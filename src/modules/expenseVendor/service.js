import logger from '../../config/logger.js';
import ExpenseVendorDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedPromise = promisify(finished);

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
    const originalName = file.originalname || 'document';
    const cleanName = originalName.replace(/\s+/g, '_');
    const newName = `${date.getTime().toString()}${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
    const destinationPath = `DMS/${newName}`;
    const blob = bucket.file(destinationPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve) => {
      blobStream.on('error', (err) => {
        logger.error('GCS Upload Error for ExpenseVendor document:', err);
        resolve(null); // fail gracefully without throwing
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    logger.error('ExpenseVendor service uploadFileToGCS Error:', err);
    return null;
  }
};

const createExpenseVendor = async (payload, user, file = null) => {
  console.log('user data------------', user)
  try {
    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload bypassed due to permission/grant error:', uploadErr);
        documentLink = null;
      }
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await ExpenseVendorDao.createExpenseVendor(
      payload,
      userId,
      outletId,
      companyId,
      documentLink
    );

    if (data && RecentAcivityService?.addRecentActivity) {
      try {
        const vendorName = payload.vendorName || payload.name || 'Vendor';
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Create',
          menu_name: 'Finance',
          submenu_name: 'Expense Vendor',
          createdBy: userId,
          username: user?.employeeCode || user?.name || 'User',
          message: `${vendorName} Expense Vendor is created`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Expense Vendor:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('ExpenseVendor service createExpenseVendor Error:', err);
    throw err;
  }
};

const listExpenseVendors = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.companyId || user?.company?.id || user?.company || null;
    const query = body.query || body.search || '';
    const status = body.status || 'Active';

    const data = await ExpenseVendorDao.listExpenseVendors({
      outletId,
      companyId,
      query,
      status,
    });

    return data;
  } catch (err) {
    logger.error('ExpenseVendor service listExpenseVendors Error:', err);
    throw err;
  }
};

export default {
  createExpenseVendor,
  listExpenseVendors,
};
