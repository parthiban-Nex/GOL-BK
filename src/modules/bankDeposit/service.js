import logger from '../../config/logger.js';
import BankDepositDao from './dao.js';
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
    const originalName = file.originalname || 'deposit_slip';
    const cleanName = originalName.replace(/\s+/g, '_');
    const newName = `${date.getTime().toString()}${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
    const destinationPath = `DMS/${newName}`;
    const blob = bucket.file(destinationPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise((resolve) => {
      blobStream.on('error', (err) => {
        logger.error('GCS Upload Error for Bank Deposit slip:', err);
        resolve(null);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (err) {
    logger.error('BankDeposit service uploadFileToGCS Error:', err);
    return null;
  }
};

const createBankDeposit = async (payload, user, file = null) => {
  try {
    let slipUrl = null;
    if (file) {
      try {
        slipUrl = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for bank deposit slip bypassed:', uploadErr);
        slipUrl = null;
      }
    }

    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await BankDepositDao.createBankDeposit(
      payload,
      userId,
      outletId,
      companyId,
      slipUrl,
      userName
    );

    if (data && RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Create',
          menu_name: 'Finance',
          submenu_name: 'Bank Deposit',
          createdBy: userId,
          username: userName,
          message: `Bank deposit recorded of ₹${data.amount} to ${data.bankName} (${data.depositCode || data.id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Bank Deposit:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('BankDeposit service createBankDeposit Error:', err);
    throw err;
  }
};

const editBankDeposit = async (payload, user, file = null) => {
  try {
    let slipUrl = null;
    if (file) {
      try {
        slipUrl = await uploadFileToGCS(file);
      } catch (uploadErr) {
        logger.warn('GCS upload for bank deposit slip bypassed:', uploadErr);
        slipUrl = null;
      }
    }

    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const data = await BankDepositDao.updateBankDeposit(
      payload,
      userId,
      outletId,
      companyId,
      slipUrl,
      userName
    );

    if (!data) {
      return {
        status: 'not_found',
        message: 'Bank deposit record not found',
      };
    }

    if (RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Update',
          menu_name: 'Finance',
          submenu_name: 'Bank Deposit',
          createdBy: userId,
          username: userName,
          message: `Bank deposit updated for ${data.bankName} (${data.depositCode || data.id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Bank Deposit:', activityErr);
      }
    }

    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('BankDeposit service editBankDeposit Error:', err);
    throw err;
  }
};

const listBankDeposits = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;
    const query = body.query || body.search || '';
    const dateFrom = body.dateFrom || body.fromDate || null;
    const dateTo = body.dateTo || body.toDate || null;
    const bankFilter = body.bankFilter || body.bankName || null;
    const modeFilter = body.modeFilter || body.depositMode || null;
    const statusFilter = body.statusFilter || body.status || null;
    const page = body.page || null;
    const pageSize = body.pageSize || body.limit || null;

    const data = await BankDepositDao.listBankDeposits({
      outletId,
      companyId,
      query,
      dateFrom,
      dateTo,
      bankFilter,
      modeFilter,
      statusFilter,
      page,
      pageSize,
    });

    return data;
  } catch (err) {
    logger.error('BankDeposit service listBankDeposits Error:', err);
    throw err;
  }
};

const getBankDepositById = async (id, user = {}) => {
  try {
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;
    const data = await BankDepositDao.getBankDepositById(id, outletId);
    if (!data) {
      return {
        status: 'not_found',
        message: 'Bank deposit record not found',
      };
    }
    return {
      status: 'success',
      data,
    };
  } catch (err) {
    logger.error('BankDeposit service getBankDepositById Error:', err);
    throw err;
  }
};

const softDeleteBankDeposit = async (id, user = {}) => {
  try {
    const userId = user?.id || null;
    const userName = user?.employeeCode || user?.name || 'User';
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;

    const success = await BankDepositDao.softDeleteBankDeposit(id, userId, outletId);
    if (!success) {
      return {
        status: 'not_found',
        message: 'Bank deposit record not found or already deleted',
      };
    }

    if (RecentAcivityService?.addRecentActivity) {
      try {
        await RecentAcivityService.addRecentActivity({
          activity_type: 'Delete',
          menu_name: 'Finance',
          submenu_name: 'Bank Deposit',
          createdBy: userId,
          username: userName,
          message: `Bank deposit record soft-deleted (ID: ${id})`,
        });
      } catch (activityErr) {
        logger.warn('Failed to log recent activity for Bank Deposit delete:', activityErr);
      }
    }

    return {
      status: 'success',
      message: 'Bank deposit soft-deleted successfully',
    };
  } catch (err) {
    logger.error('BankDeposit service softDeleteBankDeposit Error:', err);
    throw err;
  }
};

const uploadDepositSlip = async (id, file, user = {}) => {
  try {
    if (!file) {
      throw new Error('Please select a file to upload');
    }
    const slipUrl = await uploadFileToGCS(file);
    if (!slipUrl) {
      throw new Error('Failed to upload file to cloud storage');
    }

    const userId = user?.id || null;
    const outletId = user?.outlet?.id || user?.outletId || user?.outlet || null;

    const updated = await BankDepositDao.uploadDepositSlip(id, slipUrl, userId, outletId);
    if (!updated) {
      return {
        status: 'not_found',
        message: 'Bank deposit record not found',
      };
    }

    return {
      status: 'success',
      message: 'Deposit slip uploaded successfully',
      data: updated,
    };
  } catch (err) {
    logger.error('BankDeposit service uploadDepositSlip Error:', err);
    throw err;
  }
};

const getBankDepositStats = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;

    const baseWhere = { isDeleted: false };
    if (outletId) baseWhere.outletId = outletId;
    if (companyId) baseWhere.companyId = companyId;

    const stats = await BankDepositDao.computeStats(baseWhere);
    return {
      status: 'success',
      stats,
    };
  } catch (err) {
    logger.error('BankDeposit service getBankDepositStats Error:', err);
    throw err;
  }
};

const listEditHistories = async (body = {}, user = {}) => {
  try {
    const outletId = body.outletId || user?.outlet?.id || user?.outletId || user?.outlet || null;
    const companyId = body.companyId || user?.outlet?.company?.id || user?.company?.id || user?.company || null;
    return await BankDepositDao.listBankDepositHistories({
      depositId: body.depositId || null,
      outletId,
      companyId,
      dateFrom: body.dateFrom || body.fromDate || null,
      dateTo: body.dateTo || body.toDate || null,
      query: body.query || body.search || '',
    });
  } catch (err) {
    logger.error('BankDeposit service listEditHistories Error:', err);
    throw err;
  }
};

export default {
  createBankDeposit,
  editBankDeposit,
  listBankDeposits,
  getBankDepositById,
  softDeleteBankDeposit,
  uploadDepositSlip,
  getBankDepositStats,
  listEditHistories,
};
