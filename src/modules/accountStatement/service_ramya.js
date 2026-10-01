import AccountStatementDao from './dao.js';
import logger from '../../config/logger.js';
import sendNotification from '../../shared/fbnotifications.js';
// import { Storage } from '@google-cloud/storage';
import Client from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';

// SFTP Configuration
const SFTP_CONFIG = {
  host: '140.238.245.27',
  username: 'tvs_oic',
  privateKey: null, // Will be loaded from file
  remoteFolder: '/home/users/si_dms/SOA - Test/Callback',
};

// // GCS Configuration (temporarily disabled - invalid JWT key)
// const GCS_BUCKET_NAME = 'bkt-dearo-prod';
// const GCS_KEY_PATH = path.resolve('prj-stag-gobumpr-service-6567.json');

// Local folder for file storage (replaces GCS temporarily)
const LOCAL_FOLDER = path.resolve('src/temp/account_statements');
const LOCAL_CHAT_FOLDER = path.resolve('src/temp/account_statement_chat');

// // Initialize Google Cloud Storage client (temporarily disabled)
// const getStorageClient = () => {
//   return new Storage({
//     keyFilename: GCS_KEY_PATH,
//   });
// };

/**
 * Save file locally instead of uploading to GCS
 */
const uploadToLocal = async (localFilePath, fileName) => {
  try {
    const monthYearSuffix = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '');
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const newFileName = `${timestamp}_${baseName}_${monthYearSuffix}${ext}`;

    const destFolder = path.resolve('src/uploads/accountStatement');
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const destPath = path.join(destFolder, newFileName);
    fs.copyFileSync(localFilePath, destPath);

    logger.info(`File saved locally: ${newFileName}`);
    return newFileName;
  } catch (err) {
    logger.error('Local Upload Error:', err);
    throw err;
  }
};

/**
 * Generate local file URL instead of GCS signed URL
 */
const generateLocalUrl = (fileName) => {
  return `/api/uploads/accountStatement/${fileName}`;
};

/**
 * Main function to download statements from SFTP and upload to GCS
 */
const downloadStatement = async () => {
  const sftp = new Client();
  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Ensure local folder exists
    if (!fs.existsSync(LOCAL_FOLDER)) {
      fs.mkdirSync(LOCAL_FOLDER, { recursive: true });
    }

    // Load RSA private key
    const privateKeyPath = path.resolve('src/config/oracle_key/id_rsa');
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(`Private key not found at: ${privateKeyPath}`);
    }
    SFTP_CONFIG.privateKey = fs.readFileSync(privateKeyPath);

    // Get all outlets with Oracle customer code
    const outlets = await AccountStatementDao.getAllOutletsWithOracleCode();
    if (!outlets || outlets.length === 0) {
      logger.info('No outlets found with Oracle customer code');
      return { message: 'No outlets found', results };
    }

    logger.info(`Found ${outlets.length} outlets with Oracle codes`);

    // Sort outlets by oracle code length (longest first) to match specific codes before generic ones
    // This prevents '0' from matching before '50818733'
    outlets.sort((a, b) => {
      const lenA = a.oracleCashCustomerCode?.length || 0;
      const lenB = b.oracleCashCustomerCode?.length || 0;
      return lenB - lenA;
    });

    // Connect to SFTP
    await sftp.connect({
      host: SFTP_CONFIG.host,
      username: SFTP_CONFIG.username,
      privateKey: SFTP_CONFIG.privateKey,
    });

    logger.info('SFTP connected successfully');

    // List files in remote folder
    const fileList = await sftp.list(SFTP_CONFIG.remoteFolder);
    if (!fileList || fileList.length === 0) {
      logger.info('No files found on SFTP server');
      await sftp.end();
      return { message: 'No files found on SFTP', results };
    }

    logger.info(`Found ${fileList.length} files on SFTP`);

    // Track which files have been processed to avoid duplicates (commented for testing)
    // const processedFiles = new Set();

    // Process each outlet
    for (const outlet of outlets) {
      const oracleCode = outlet.oracleCashCustomerCode?.trim();
      if (!oracleCode || oracleCode === '0') continue;

      // Find matching files for this outlet
      for (const fileInfo of fileList) {
        const fileName = fileInfo.name;
        if (fileName === '.' || fileName === '..') continue;

        // Skip if already processed (commented for testing)
        // if (processedFiles.has(fileName)) continue;

        // Check if file name contains the Oracle code (case-insensitive)
        // Match CakePHP logic: stripos($fileName, $oracleCode) !== false
        if (fileName.toLowerCase().includes(oracleCode.toLowerCase())) {
          results.processed++;

          try {
            // Check if already processed (disabled - same filename used every month)
            // const existing = await AccountStatementDao.findByOutletAndFileName(
            //   outlet.id,
            //   fileName
            // );
            // if (existing) {
            //   logger.info(`File already processed: ${fileName} for outlet ${outlet.id}`);
            //   continue;
            // }

            const remoteFile = `${SFTP_CONFIG.remoteFolder}/${fileName}`;
            const localFile = path.join(LOCAL_FOLDER, fileName);

            // Download file from SFTP
            await sftp.get(remoteFile, localFile);
            logger.info(`Downloaded: ${fileName}`);

            // Save file locally (GCS temporarily disabled)
            const objectName = await uploadToLocal(localFile, fileName);

            // Get current date for statement month/year
            const now = new Date();
            const statementMonth = now.toLocaleString('en-US', { month: 'short' });
            const statementYear = now.getFullYear().toString();

            // Save to database
            await AccountStatementDao.createAccountStatement({
              outletId: outlet.id,
              branch: outlet.outletCode,
              fileName: fileName,
              cloudLink: objectName,
              statementOfMonth: statementMonth,
              statementOfYear: statementYear,
              // roleId: 1,
              // outlet_id: 14,
            });

            logger.info(`Saved statement record for outlet ${outlet.id}: ${fileName}`);

            // Mark file as processed to prevent duplicate matching (commented for testing)
            // processedFiles.add(fileName);

            // Delete local file
            if (fs.existsSync(localFile)) {
              fs.unlinkSync(localFile);
            }

            results.success++;
          } catch (fileErr) {
            results.failed++;
            results.errors.push({
              outlet: outlet.id,
              file: fileName,
              error: fileErr.message,
            });
            logger.error(`Error processing file ${fileName}:`, fileErr);
          }
        }
      }
    }

    await sftp.end();
    logger.info('SFTP connection closed');

    return {
      message: 'Statement download completed',
      results,
    };
  } catch (err) {
    logger.error('Download Statement Error:', err);
    try {
      await sftp.end();
    } catch (e) {
      // Ignore close error
    }
    throw err;
  }
};

/**
 * Get statements by outlet ID with pagination
 */
/**
 * Enrich statements with last chat messages per sender type
 */
const enrichWithLastChat = async (result) => {
  const statementIds = result.statements.map(s => s.id);
  if (statementIds.length === 0) return result;

  const lastChats = await AccountStatementDao.getLastChatMessages(statementIds);

  result.statements = result.statements.map(s => {
    const plain = s.toJSON ? s.toJSON() : s;
    const chats = lastChats[plain.id] || {};
    plain.lastOutletMessage = chats['outlet_admin'] || null;
    plain.lastFbmMessage = chats['fbm_user'] || null;
    plain.lastChatDate = chats.lastChatDate || null;
    plain.lastSenderType = chats.lastSenderType || null;
    plain.lastMessage = chats.lastMessage || null;
    return plain;
  });

  return result;
};

const getStatementsByOutlet = async (outletId, offset, limit, searchText) => {
  try {
    const result = await AccountStatementDao.getStatementsByOutlet(outletId, offset, limit, searchText);
    return await enrichWithLastChat(result);
  } catch (err) {
    logger.error('Service getStatementsByOutlet Error:', err);
    throw err;
  }
};

/**
 * Get statements by mapped outlet IDs (FBM view)
 * First fetches mapped outlet IDs for the employee, then queries statements
 */
const getStatementsByMappedOutlets = async (employeeId, offset, limit, searchText) => {
  try {
    const mappedOutlets = await AccountStatementDao.getMappedOutletsByEmployeeId(employeeId);
    const outletIds = mappedOutlets.map(o => o.id);

    if (outletIds.length === 0) {
      return { statements: [], total: 0, offset, limit };
    }

    const result = await AccountStatementDao.getStatementsByMappedOutlets(outletIds, offset, limit, searchText);
    return await enrichWithLastChat(result);
  } catch (err) {
    logger.error('Service getStatementsByMappedOutlets Error:', err);
    throw err;
  }
};

/**
 * Get statements by branch (outletCode) with pagination
 * Used for outlet view
 */
const getStatementsByBranch = async (outletCode, offset, limit, searchText) => {
  try {
    const result = await AccountStatementDao.getStatementsByBranch(outletCode, offset, limit, searchText);
    return await enrichWithLastChat(result);
  } catch (err) {
    logger.error('Service getStatementsByBranch Error:', err);
    throw err;
  }
};

/**
 * Approve or reject a statement
 */
const approveStatement = async (id, status, remark, queryType) => {
  try {
    const statement = await AccountStatementDao.getStatementById(id);
    if (!statement) {
      return { success: false, message: 'Record not found' };
    }

    const currentCount = statement.approvalCount || 0;
    const isApproved = statement.approvalStatus;

    // Max approval limit check
    // if (currentCount >= 5) {
    //   return { success: false, message: 'You reached the maximum approval limit' };
    // }

    // Check if already approved
    if (isApproved === 1) {
      return { success: false, message: 'Already Approved' };
    }

    // Update statement
    await AccountStatementDao.updateStatement(id, {
      approvalStatus: status,
      approvalAt: status === 1 ? new Date() : null,
      // approvalCount: currentCount + 1,
      replyNotification: 0,
      financeNotification: status === 1 ? 1 : 2,
    });

    // Push notification to FBM user
    try {
      const fcmToken = await AccountStatementDao.getFcmTokenForRecipient('outlet_admin');
      if (fcmToken) {
        const statementName = statement.fileName ? statement.fileName.replace(/\.[^/.]+$/, '') : '';
        const title = 'Account Statement';
        const body = status === 1
          ? `${statementName} has been Accepted`
          : `Query raised on ${statementName}`;
        const targetUrl = status === 1
          ? `/accountStatement?markRead=${id}`
          : `/accountStatement?openChat=${id}`;
        await sendNotification(fcmToken, { title, body }, { target_url: targetUrl });
      }
    } catch (pushErr) {
      logger.error('Push notification error (approveStatement):', pushErr);
    }

    return {
      success: true,
      message: status === 1 ? 'Statement accepted successfully' : 'Statement rejected successfully',
    };
  } catch (err) {
    logger.error('Service approveStatement Error:', err);
    throw err;
  }
};


/**
 * Download statement file (generate signed URL)
 */
const downloadStatementFile = async (id) => {
  try {
    const statement = await AccountStatementDao.getStatementById(id);
    if (!statement) {
      return { success: false, message: 'File not found' };
    }

    const fileUrl = generateLocalUrl(statement.cloudLink);

    return {
      success: true,
      url: fileUrl,
      fileName: statement.fileName,
    };
  } catch (err) {
    logger.error('Service downloadStatementFile Error:', err);
    throw err;
  }
};

/**
 * Get all mapped outlets for an employee
 */
const getMappedOutlets = async (empId) => {
  try {
    return await AccountStatementDao.getMappedOutletsByEmployeeId(empId);
  } catch (err) {
    logger.error('Service getMappedOutlets Error:', err);
    throw err;
  }
};

/**
 * Save chat file locally using multer buffer (GCS temporarily disabled)
 */
const uploadChatFileToLocal = async (file) => {
  try {
    const destFolder = path.resolve('src/uploads/accountStatementChat');
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const newFileName = `${timestamp}_${baseName}${ext}`;
    const destPath = path.join(destFolder, newFileName);

    fs.writeFileSync(destPath, file.buffer);

    const fileUrl = `/api/uploads/accountStatementChat/${newFileName}`;
    logger.info(`Chat file saved locally: ${newFileName}`);
    return fileUrl;
  } catch (err) {
    logger.error('Local Chat File Upload Error:', err);
    throw err;
  }
};

/**
 * Create a chat message for a statement
 */
const createStatementChat = async (statementId, message, senderType, userId, file, queryType) => {
  try {
    let fileUrl = null;
    if (file) {
      fileUrl = await uploadChatFileToLocal(file);
    }

    const chat = await AccountStatementDao.createStatementChat({
      statement_id: statementId,
      query_type: queryType,
      message,
      file_url: fileUrl,
      sender_type: senderType,
      createdBy: userId,
    });

    // Get statement for push notification details
    const statement = await AccountStatementDao.getStatementById(statementId);
    const statementName = statement?.fileName ? statement.fileName.replace(/\.[^/.]+$/, '') : '';

    // If outlet_admin sends a chat, notify FBM user and clear own notification
    if (senderType === 'outlet_admin') {
      await AccountStatementDao.updateStatement(statementId, { financeNotification: 2, replyNotification: 0 });

      // Push notification to FBM user
      try {
        const fcmToken = await AccountStatementDao.getFcmTokenForRecipient('outlet_admin');
        if (fcmToken) {
          const title = 'Account Statement';
          const body = queryType
            ? `Query raised on ${statementName}\n${queryType}: ${message}`
            : `Query raised on ${statementName}:\n${message}`;
          await sendNotification(fcmToken, { title, body }, { target_url: `/accountStatement?openChat=${statementId}` });
        }
      } catch (pushErr) {
        logger.error('Push notification error (chat outlet→fbm):', pushErr);
      }
    }

    // If fbm_user sends a chat, notify outlet_admin and clear own notification
    if (senderType === 'fbm_user') {
      await AccountStatementDao.updateStatement(statementId, { replyNotification: 1, financeNotification: 0 });

      // Push notification to outlet admin
      try {
        const fcmToken = await AccountStatementDao.getFcmTokenForRecipient('fbm_user');
        if (fcmToken) {
          const title = 'Account Statement';
          const body = `Reply against ${statementName}:\n${message}`;
          await sendNotification(fcmToken, { title, body }, { target_url: `/accountStatement?openChat=${statementId}` });
        }
      } catch (pushErr) {
        logger.error('Push notification error (chat fbm→outlet):', pushErr);
      }
    }

    return { success: true, message: 'Message sent successfully', data: chat };
  } catch (err) {
    logger.error('Service createStatementChat Error:', err);
    throw err;
  }
};

/**
 * Get all chat messages for a statement
 */
const getStatementChats = async (statementId) => {
  try {
    const chats = await AccountStatementDao.getStatementChats(statementId);
    return { success: true, data: chats };
  } catch (err) {
    logger.error('Service getStatementChats Error:', err);
    throw err;
  }
};

/**
 * Get notification count for outlet user
 */
const getNotificationCountOutlet = async (outletId) => {
  try {
    const count = await AccountStatementDao.getNotificationCountForOutlet(outletId);
    return { success: true, count };
  } catch (err) {
    logger.error('Service getNotificationCountOutlet Error:', err);
    throw err;
  }
};

/**
 * Get notification list for outlet user
 */
const getNotificationsOutlet = async (outletId) => {
  try {
    const notifications = await AccountStatementDao.getNotificationsForOutlet(outletId);
    return { success: true, notifications };
  } catch (err) {
    logger.error('Service getNotificationsOutlet Error:', err);
    throw err;
  }
};

/**
 * Mark outlet notification as read
 */
const markNotificationReadOutlet = async (id) => {
  try {
    await AccountStatementDao.updateStatement(id, { replyNotification: 0 });
    return { success: true };
  } catch (err) {
    logger.error('Service markNotificationReadOutlet Error:', err);
    throw err;
  }
};

/**
 * Get notification count for FBM user
 */
const getNotificationCount = async (employeeId) => {
  try {
    const count = await AccountStatementDao.getNotificationCountForFinance(employeeId);
    return { success: true, count };
  } catch (err) {
    logger.error('Service getNotificationCount Error:', err);
    throw err;
  }
};

/**
 * Get notification list for FBM user
 */
const getNotifications = async (employeeId) => {
  try {
    const notifications = await AccountStatementDao.getNotificationsForFinance(employeeId);
    return { success: true, notifications };
  } catch (err) {
    logger.error('Service getNotifications Error:', err);
    throw err;
  }
};

/**
 * Mark FBM notification as read
 */
const markNotificationReadFbm = async (id) => {
  try {
    await AccountStatementDao.updateStatement(id, { financeNotification: 0 });
    return { success: true };
  } catch (err) {
    logger.error('Service markNotificationReadFbm Error:', err);
    throw err;
  }
};

/**
 * Export statements as CSV data for a specific outlet and month
 */
const exportStatementsCsv = async (outletId, month) => {
  try {
    const result = await AccountStatementDao.getStatementsByOutletAndMonth(outletId, month);
    return await enrichWithLastChat(result);
  } catch (err) {
    logger.error('Service exportStatementsCsv Error:', err);
    throw err;
  }
};

const AccountStatementService = {
  downloadStatement,
  getMappedOutlets,
  getStatementsByOutlet,
  getStatementsByBranch,
  getStatementsByMappedOutlets,
  approveStatement,
  downloadStatementFile,
  generateLocalUrl,
  createStatementChat,
  getStatementChats,
  getNotificationCountOutlet,
  getNotificationsOutlet,
  markNotificationReadOutlet,
  getNotificationCount,
  getNotifications,
  markNotificationReadFbm,
  exportStatementsCsv,
};

export default AccountStatementService;
