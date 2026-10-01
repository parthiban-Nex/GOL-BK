import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const AccountStatement = db.accountStatements;
const AccountStatementChat = db.accountStatementChats;
const Outlet = db.outlets;
const EmployeeOutletMap = db.employeeoutletmap;
const User = db.users;

const getAllOutletsWithOracleCode = async () => {
  try {
    const outlets = await Outlet.findAll({
      where: {
        oracleCashCustomerCode: {
          [Op.ne]: null,
          [Op.ne]: '',
          [Op.ne]: '0', // Exclude '0' as it's not a valid oracle code
        },
      },
      attributes: ['id', 'outletCode', 'oracleCashCustomerCode', 'outletName'],
      raw: true,
    });
    return outlets;
  } catch (err) {
    logger.error('AccountStatement DAO getAllOutletsWithOracleCode Error:', err);
    throw err;
  }
};

const createAccountStatement = async (data) => {
  try {
    const statement = await AccountStatement.create(data);
    return statement;
  } catch (err) {
    logger.error('AccountStatement DAO createAccountStatement Error:', err);
    throw err;
  }
};

const findByOutletAndFileName = async (outletId, fileName) => {
  try {
    const statement = await AccountStatement.findOne({
      where: {
        outletId: outletId,
        fileName: fileName,
      },
    });
    return statement;
  } catch (err) {
    logger.error('AccountStatement DAO findByOutletAndFileName Error:', err);
    throw err;
  }
};

const getStatementsByOutlet = async (outletId, offset = 0, limit = 10, searchText = '') => {
  try {
    const whereClause = { outletId: outletId };

    // Add search filter if searchText is provided
    if (searchText && searchText.trim() !== '') {
      whereClause[Op.or] = [
        { fileName: { [Op.like]: `%${searchText}%` } },
        { statementOfMonth: { [Op.like]: `%${searchText}%` } },
        { statementOfYear: { [Op.like]: `%${searchText}%` } },
        { branch: { [Op.like]: `%${searchText}%` } },
      ];
    }

    const { count, rows } = await AccountStatement.findAndCountAll({
      where: whereClause,
      order: [['updated_at', 'DESC']],
      offset: offset,
      limit: limit,
    });

    return {
      statements: rows,
      total: count,
      offset: offset,
      limit: limit,
    };
  } catch (err) {
    logger.error('AccountStatement DAO getStatementsByOutlet Error:', err);
    throw err;
  }
};

/**
 * Get statements by branch (outletCode)
 * Used for outlet view - filters by branch field matching outletCode
 */
const getStatementsByBranch = async (outletCode, offset = 0, limit = 10, searchText = '') => {
  try {
    const whereClause = { branch: outletCode };

    // Add search filter if searchText is provided
    if (searchText && searchText.trim() !== '') {
      whereClause[Op.or] = [
        { fileName: { [Op.like]: `%${searchText}%` } },
        { statementOfMonth: { [Op.like]: `%${searchText}%` } },
        { statementOfYear: { [Op.like]: `%${searchText}%` } },
      ];
    }

    const { count, rows } = await AccountStatement.findAndCountAll({
      where: whereClause,
      order: [['updated_at', 'DESC']],
      offset: offset,
      limit: limit,
    });

    return {
      statements: rows,
      total: count,
      offset: offset,
      limit: limit,
    };
  } catch (err) {
    logger.error('AccountStatement DAO getStatementsByBranch Error:', err);
    throw err;
  }
};

/**
 * Get statements by mapped outlet IDs (FBM view)
 * Shows all statements where outlet_id IN (mapped outlet IDs)
 */
const getStatementsByMappedOutlets = async (outletIds, offset = 0, limit = 10, searchText = '') => {
  try {
    const whereClause = {
      outletId: { [Op.in]: outletIds },
    };

    if (searchText && searchText.trim() !== '') {
      whereClause[Op.or] = [
        { fileName: { [Op.like]: `%${searchText}%` } },
        { statementOfMonth: { [Op.like]: `%${searchText}%` } },
        { statementOfYear: { [Op.like]: `%${searchText}%` } },
        { branch: { [Op.like]: `%${searchText}%` } },
      ];
    }

    const { count, rows } = await AccountStatement.findAndCountAll({
      include: [
        {
          model: Outlet,
          as: 'outlet',
          attributes: ['id', 'outletCode', 'outletName', 'city', 'state'],
          required: false,
        }
      ],
      where: whereClause,
      order: [['updated_at', 'DESC']],
      offset: offset,
      limit: limit,
    });

    return {
      statements: rows,
      total: count,
      offset: offset,
      limit: limit,
    };
  } catch (err) {
    logger.error('AccountStatement DAO getStatementsByMappedOutlets Error:', err);
    throw err;
  }
};

const getStatementById = async (id) => {
  try {
    const statement = await AccountStatement.findByPk(id);
    return statement;
  } catch (err) {
    logger.error('AccountStatement DAO getStatementById Error:', err);
    throw err;
  }
};

const updateStatement = async (id, data) => {
  try {
    const result = await AccountStatement.update(data, {
      where: { id: id },
    });
    return result;
  } catch (err) {
    logger.error('AccountStatement DAO updateStatement Error:', err);
    throw err;
  }
};

/**
 * Get notification count for outlet user (by outlet_id)
 */
const getNotificationCountForOutlet = async (outletId) => {
  try {
    const count = await AccountStatement.count({
      where: {
        outletId: outletId,
        replyNotification: 1,
      },
    });
    return count;
  } catch (err) {
    logger.error('AccountStatement DAO getNotificationCountForOutlet Error:', err);
    throw err;
  }
};

/**
 * Get notification count for finance user (by mapped outlets)
 */
const getNotificationCountForFinance = async (employeeId) => {
  try {
    const mappedOutlets = await getMappedOutletsByEmployeeId(employeeId);
    const outletIds = mappedOutlets.map(o => o.id);

    if (outletIds.length === 0) return 0;

    const count = await AccountStatement.count({
      where: {
        outletId: { [Op.in]: outletIds },
        financeNotification: { [Op.gt]: 0 },
      },
    });
    return count;
  } catch (err) {
    logger.error('AccountStatement DAO getNotificationCountForFinance Error:', err);
    throw err;
  }
};

/**
 * Get notifications for outlet user (by outlet_id)
 */
const getNotificationsForOutlet = async (outletId) => {
  try {
    const statements = await AccountStatement.findAll({
      where: {
        outletId: outletId,
        replyNotification: 1,
      },
      order: [['updated_at', 'DESC']],
      attributes: ['id', 'fileName', 'statementOfMonth', 'statementOfYear'],
      raw: true,
    });

    if (statements.length === 0) return [];

    // Fetch latest fbm_user chat per statement
    const statementIds = statements.map(s => s.id);
    const chats = await AccountStatementChat.findAll({
      where: {
        statement_id: { [Op.in]: statementIds },
        sender_type: 'fbm_user',
      },
      order: [['id', 'DESC']],
      raw: true,
    });

    const chatMap = {};
    for (const chat of chats) {
      if (!chatMap[chat.statement_id]) {
        chatMap[chat.statement_id] = chat;
      }
    }

    return statements.map(row => {
      const statementBase = row.fileName ? row.fileName.replace(/\.[^/.]+$/, '') : '';
      const statementMonth = row.statementOfMonth || '';
      const statementYear = row.statementOfYear || '';
      const statement = `${statementBase}_${statementMonth}${statementYear}`.replace(/_+$/, '');

      const latestChat = chatMap[row.id];
      const chatMessage = latestChat?.message || '';
      const message = `Reply against ${statement}:\n${chatMessage}`;

      return {
        id: row.id,
        message,
      };
    });
  } catch (err) {
    logger.error('AccountStatement DAO getNotificationsForOutlet Error:', err);
    throw err;
  }
};

/**
 * Get notifications for finance user (by mapped outlets)
 */
const getNotificationsForFinance = async (employeeId) => {
  try {
    const mappedOutlets = await getMappedOutletsByEmployeeId(employeeId);
    const outletIds = mappedOutlets.map(o => o.id);

    if (outletIds.length === 0) return [];

    const statements = await AccountStatement.findAll({
      where: {
        outletId: { [Op.in]: outletIds },
        financeNotification: { [Op.gt]: 0 },
      },
      order: [['updated_at', 'DESC']],
      attributes: ['id', 'fileName', 'approvalStatus', 'statementOfMonth', 'statementOfYear', 'financeNotification'],
      raw: true,
    });

    // For type=2 (clickable), fetch latest outlet_admin chat per statement to get query_type and message
    const clickableIds = statements.filter(s => s.financeNotification === 2).map(s => s.id);
    let chatMap = {};

    if (clickableIds.length > 0) {
      const chats = await AccountStatementChat.findAll({
        where: {
          statement_id: { [Op.in]: clickableIds },
          sender_type: 'outlet_admin',
        },
        order: [['id', 'DESC']],
        raw: true,
      });

      // Get latest chat per statement
      for (const chat of chats) {
        if (!chatMap[chat.statement_id]) {
          chatMap[chat.statement_id] = chat;
        }
      }
    }

    return statements.map(row => {
      const statementBase = row.fileName ? row.fileName.replace(/\.[^/.]+$/, '') : '';
      const statementMonth = row.statementOfMonth || '';
      const statementYear = row.statementOfYear || '';
      const statement = `${statementBase}_${statementMonth}${statementYear}`.replace(/_+$/, '');

      let message = '';
      let clickable = false;

      if (row.financeNotification === 1) {
        // Accepted - non-clickable
        message = `${statement} has been Accepted`;
        clickable = false;
      } else if (row.financeNotification === 2) {
        // Rejected/chat - clickable
        clickable = true;
        const latestChat = chatMap[row.id];
        if (latestChat) {
          const queryType = latestChat.query_type || '';
          const chatMessage = latestChat.message || '';
          message = queryType
            ? `Query raised on ${statement}\n${queryType}: ${chatMessage}`
            : `Query raised on ${statement}:\n${chatMessage}`;
        } else {
          message = `${statement} has been Rejected`;
        }
      }

      return {
        id: row.id,
        message,
        clickable,
        financeNotification: row.financeNotification,
      };
    });
  } catch (err) {
    logger.error('AccountStatement DAO getNotificationsForFinance Error:', err);
    throw err;
  }
};

/**
 * Get all mapped outlets for an employee
 */
const getMappedOutletsByEmployeeId = async (empId) => {
  try {
    const mappings = await EmployeeOutletMap.findAll({
      where: { emp_id: empId },
      include: [
        {
          model: Outlet,
          as: 'outlet',
          attributes: ['id', 'outletCode', 'outletName', 'city', 'state'],
        }
      ],
      raw: false,
    });
    return mappings
      .filter(m => m.outlet)
      .map(m => m.outlet);
  } catch (err) {
    logger.error('AccountStatement DAO getMappedOutletsByEmployeeId Error:', err);
    throw err;
  }
};

/**
 * Create a chat message for a statement
 */
/**
 * Get last chat message per sender_type for given statement IDs
 */
const getLastChatMessages = async (statementIds) => {
  try {
    if (!statementIds || statementIds.length === 0) return {};

    const chats = await AccountStatementChat.findAll({
      where: { statement_id: { [Op.in]: statementIds } },
      order: [['id', 'DESC']],
    });

    // Group by statement_id, then get last message per sender_type and last chat date
    const result = {};
    for (const chat of chats) {
      const sid = chat.statement_id;
      if (!result[sid]) {
        result[sid] = { lastChatDate: chat.createdAt, lastSenderType: chat.sender_type, lastMessage: chat.message };
      }
      if (!result[sid][chat.sender_type]) {
        result[sid][chat.sender_type] = chat.message;
      }
    }
    return result;
  } catch (err) {
    logger.error('AccountStatement DAO getLastChatMessages Error:', err);
    throw err;
  }
};

const createStatementChat = async (data) => {
  try {
    const chat = await AccountStatementChat.create(data);
    return chat;
  } catch (err) {
    logger.error('AccountStatement DAO createStatementChat Error:', err);
    throw err;
  }
};

/**
 * Get all chat messages for a statement
 */
const getStatementChats = async (statementId) => {
  try {
    const chats = await AccountStatementChat.findAll({
      where: { statement_id: statementId },
      order: [['id', 'ASC']],
    });
    return chats;
  } catch (err) {
    logger.error('AccountStatement DAO getStatementChats Error:', err);
    throw err;
  }
};

/**
 * Get FCM token for the recipient (opposite of sender)
 * If sender is 'outlet_admin' → find user where user_id != 'outlet_admin' (FBM)
 * If sender is 'fbm_user' → find user where user_id = 'outlet_admin' (Outlet)
 */
const getFcmTokenForRecipient = async (senderType) => {
  try {
    const isOutletView = senderType === 'outlet_admin';
    let user;
    if (isOutletView) {
      // Sender is outlet_admin → find FBM user
      user = await User.findOne({
        where: { user_id: 'fbm_user' },
        attributes: ['id', 'fcm_tocken'],
        raw: true,
      });
    } else {
      // Sender is fbm_user → find outlet admin
      user = await User.findOne({
        where: { user_id: 'outlet_admin' },
        attributes: ['id', 'fcm_tocken'],
        raw: true,
      });
    }
    return user?.fcm_tocken || null;
  } catch (err) {
    logger.error('AccountStatement DAO getFcmTokenForRecipient Error:', err);
    return null;
  }
};

const getStatementsByOutletAndMonth = async (outletId, month) => {
  try {
    const whereClause = {
      outletId: outletId,
      statementOfMonth: month,
    };

    const rows = await AccountStatement.findAll({
      include: [
        {
          model: Outlet,
          as: 'outlet',
          attributes: ['id', 'outletCode', 'outletName', 'city', 'state'],
          required: false,
        }
      ],
      where: whereClause,
      order: [['updated_at', 'DESC']],
    });

    return {
      statements: rows,
      total: rows.length,
    };
  } catch (err) {
    logger.error('AccountStatement DAO getStatementsByOutletAndMonth Error:', err);
    throw err;
  }
};


const getStatementsByOutletForGms = async (outletId, offset, limit,employeeCode) => {
  try {
   

    const query = `
      SELECT soa.*,soac.query_type,soac.message,soac.file_url FROM account_statements soa
      LEFT JOIN account_statement_chats  soac ON soa.id= (
      SELECT id 
      FROM account_statement_chats as soac1
      WHERE soac1.statement_id = soa.id AND soac1.sender_type= :employeeCode
      ORDER BY soac1.createdAt DESC
      LIMIT 1
    )
      WHERE outlet_id = :outletId
      ORDER BY updated_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const rows = await db.sequelize.query(query, {
      replacements: { outletId, limit: limit, offset: offset,employeeCode },
      type: db.sequelize.QueryTypes.SELECT,
    });

    return rows
  } catch (err) {
    logger.error("AccountStatement DAO getStatementsByOutlet Error:", err);
    throw err;
  }
};

const dao = {
  getAllOutletsWithOracleCode,
  getMappedOutletsByEmployeeId,
  createAccountStatement,
  findByOutletAndFileName,
  getStatementsByOutlet,
  getStatementsByBranch,
  getStatementsByMappedOutlets,
  getStatementById,
  updateStatement,
  getNotificationCountForOutlet,
  getNotificationCountForFinance,
  getNotificationsForOutlet,
  getNotificationsForFinance,
  getLastChatMessages,
  createStatementChat,
  getStatementChats,
  getFcmTokenForRecipient,
  getStatementsByOutletAndMonth,
  getStatementsByOutletForGms
};

export default dao;
