import logger from '../../config/logger.js';
import ExpenseDao from './dao.js';
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
    const originalName = file.originalname || 'expense_doc';
    const cleanName = originalName.replace(/\s+/g, '_');
    const newName = `${date.getTime().toString()}${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
    const destinationPath = `DMS/${newName}`;
    const blob = bucket.file(destinationPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve) => {
      blobStream.on('error', (err) => {
        logger.error('GCS Upload Error for Expense document:', err);
        resolve(null); // fail gracefully
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    logger.error('Expense service uploadFileToGCS Error:', err);
    return null;
  }
};

const createExpense = async (payload, user, file = null) => {
  try {
    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for expense document bypassed:', uploadErr);
        documentLink = null;
      }
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await ExpenseDao.createExpense(
      payload,
      userId,
      outletId,
      companyId,
      documentLink
    );

    if (data && RecentAcivityService?.addRecentActivity) {
      try {
        const head = payload.head || 'Expense';
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Create',
          menu_name: 'Finance',
          submenu_name: 'Expense',
          createdBy: userId,
          username: user?.employeeCode || user?.name || 'User',
          message: `${head} expense recorded for ${payload.vendor || 'Vendor'}`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Expense:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('Expense service createExpense Error:', err);
    throw err;
  }
};

const listExpenses = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;
    const query = body.query || body.search || '';
    const dateFrom = body.dateFrom || null;
    const dateTo = body.dateTo || null;
    const page = body.page || null;
    const pageSize = body.pageSize || body.limit || null;

    const data = await ExpenseDao.listExpenses({
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
    logger.error('Expense service listExpenses Error:', err);
    throw err;
  }
};

const editExpense = async (payload, user, file = null) => {
  try {
    const id = payload.id;
    if (!id) {
      throw new Error('Expense ID is required');
    }

    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for edited expense document bypassed:', uploadErr);
        documentLink = null;
      }
    }

    if (documentLink) {
      payload.documentLink = documentLink;
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await ExpenseDao.updateExpense(
      id,
      payload,
      userId,
      outletId,
      companyId
    );

    if (!data) {
      return {
        status: 'not_found',
        message: 'Expense record not found',
      };
    }

    if (RecentAcivityService?.addRecentActivity) {
      try {
        const head = payload.head || data.head || 'Expense';
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Update',
          menu_name: 'Finance',
          submenu_name: 'Expense',
          createdBy: userId,
          username: user?.employeeCode || user?.name || 'User',
          message: `${head} expense updated (${data.expenseCode || id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Edit Expense:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('Expense service editExpense Error:', err);
    throw err;
  }
};

const uploadExpenseDocument = async (id, file, user) => {
  try {
    if (!id) {
      throw new Error('Expense ID is required');
    }

    let documentLink = null;
    if (file) {
      try {
        documentLink = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for expense document bypassed:', uploadErr);
        documentLink = null;
      }

      // Fallback placeholder/document path if GCS is temporarily unavailable
      if (!documentLink) {
        const cleanName = (file.originalname || 'document').replace(/\s+/g, '_');
        documentLink = `uploads/expenses/${Date.now()}_${cleanName}`;
      }
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await ExpenseDao.updateExpenseDocument(
      id,
      documentLink,
      userId,
      outletId,
      companyId
    );

    if (!data) {
      return {
        status: 'not_found',
        message: 'Expense record not found',
      };
    }

    if (RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Update',
          menu_name: 'Finance',
          submenu_name: 'Expense',
          createdBy: userId,
          username: user?.employeeCode || user?.name || 'User',
          message: `Document attached to expense (${data.expenseCode || id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Expense Document upload:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('Expense service uploadExpenseDocument Error:', err);
    throw err;
  }
};

export default {
  createExpense,
  editExpense,
  listExpenses,
  uploadExpenseDocument,
};
