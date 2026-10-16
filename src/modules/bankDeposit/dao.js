import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const BankDeposit = () => db.bankDeposits;
const BankDepositHistory = () => db.bankDepositHistories;

const generateDepositCode = async (dateStr = null) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const prefix = `BD-${yy}${mm}${dd}`;

    const lastRecord = await BankDeposit().findOne({
      where: {
        depositCode: { [Op.like]: `${prefix}-%` },
      },
      order: [['id', 'DESC']],
      attributes: ['id', 'depositCode'],
    });

    let sequence = 1;
    if (lastRecord && lastRecord.depositCode) {
      const parts = lastRecord.depositCode.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  } catch (err) {
    logger.error('BankDeposit DAO generateDepositCode Error:', err);
    return `BD-${Date.now().toString().slice(-6)}`;
  }
};

const createBankDeposit = async (
  payload,
  userId,
  outletId,
  companyId,
  slipUrl = null,
  userName = null
) => {
  try {
    const rawDate = payload.depositDate || payload.date || (payload.dateTime ? payload.dateTime.split('T')[0] : null) || new Date().toISOString().split('T')[0];
    const rawTime = payload.depositTime || payload.time || (payload.dateTime && payload.dateTime.includes('T') ? payload.dateTime.split('T')[1].slice(0, 5) : null) || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const depositCode = payload.depositCode || (await generateDepositCode(rawDate));
    const amount = Number(payload.amount) || 0;

    let combinedDateTime = null;
    if (payload.dateTime) {
      combinedDateTime = new Date(payload.dateTime);
    } else if (rawDate) {
      combinedDateTime = new Date(`${rawDate}T${rawTime ? rawTime.replace(/(AM|PM|\s)/gi, '') : '00:00'}:00`);
    }

    const rawAcNo = payload.bankAccountNo || payload.accountNumber || payload.acNo || payload.accountNo;
    const bankAccountNo = rawAcNo ? String(rawAcNo).trim() : null;
    const rawBranch = payload.branch || payload.bankBranch || payload.branchName;
    const branch = rawBranch ? String(rawBranch).trim() : null;

    const created = await BankDeposit().create({
      depositCode,
      depositDate: rawDate,
      depositTime: rawTime,
      dateTime: combinedDateTime && !isNaN(combinedDateTime.getTime()) ? combinedDateTime : null,
      bankName: (payload.bankName || '').trim(),
      bankAccountNo,
      branch,
      bankId: payload.bankId ? parseInt(payload.bankId, 10) : null,
      depositMode: payload.depositMode || 'Cash',
      referenceNo: payload.referenceNo ? String(payload.referenceNo).trim() : null,
      amount,
      depositedBy: payload.depositedBy || userName || 'User',
      status: payload.status || 'Deposited',
      notes: payload.notes || null,
      slipUrl: slipUrl || payload.slipUrl || null,
      outletId: outletId || null,
      companyId: companyId || null,
      createdBy: userId || null,
      isDeleted: false,
    });

    return created;
  } catch (err) {
    logger.error('BankDeposit DAO createBankDeposit Error:', err);
    throw err;
  }
};

const getBankDepositById = async (id, outletId = null) => {
  try {
    const whereConditions = { id, isDeleted: false };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    return await BankDeposit().findOne({
      where: whereConditions,
      include: [
        {
          model: BankDepositHistory(),
          as: 'history',
          separate: true,
          order: [['editedAt', 'DESC']],
        },
      ],
    });
  } catch (err) {
    logger.error('BankDeposit DAO getBankDepositById Error:', err);
    throw err;
  }
};

const computeStats = async (baseWhere) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    const startOfWeekStr = monday.toISOString().split('T')[0];

    // Calculate start of current month
    const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Today's deposits
    const todayAgg = await BankDeposit().findOne({
      where: {
        ...baseWhere,
        depositDate: todayStr,
      },
      attributes: [
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 0), 'totalAmount'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCount'],
      ],
      raw: true,
    });

    // This week's deposits
    const weekAgg = await BankDeposit().findOne({
      where: {
        ...baseWhere,
        depositDate: { [Op.gte]: startOfWeekStr },
      },
      attributes: [
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 0), 'totalAmount'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCount'],
      ],
      raw: true,
    });

    // This month's deposits
    const monthAgg = await BankDeposit().findOne({
      where: {
        ...baseWhere,
        depositDate: { [Op.gte]: startOfMonthStr },
      },
      attributes: [
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 0), 'totalAmount'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCount'],
      ],
      raw: true,
    });

    // Pending deposits
    const pendingAgg = await BankDeposit().findOne({
      where: {
        ...baseWhere,
        status: 'Pending',
      },
      attributes: [
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 0), 'totalAmount'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCount'],
      ],
      raw: true,
    });

    return {
      today: {
        amount: Number(todayAgg?.totalAmount) || 0,
        count: Number(todayAgg?.totalCount) || 0,
      },
      week: {
        amount: Number(weekAgg?.totalAmount) || 0,
        count: Number(weekAgg?.totalCount) || 0,
      },
      month: {
        amount: Number(monthAgg?.totalAmount) || 0,
        count: Number(monthAgg?.totalCount) || 0,
      },
      pending: {
        amount: Number(pendingAgg?.totalAmount) || 0,
        count: Number(pendingAgg?.totalCount) || 0,
      },
    };
  } catch (err) {
    logger.error('BankDeposit DAO computeStats Error:', err);
    return {
      today: { amount: 0, count: 0 },
      week: { amount: 0, count: 0 },
      month: { amount: 0, count: 0 },
      pending: { amount: 0, count: 0 },
    };
  }
};

const listBankDeposits = async ({
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
}) => {
  try {
    const whereConditions = {
      isDeleted: false,
    };

    if (outletId) {
      whereConditions.outletId = outletId;
    }

    if (companyId) {
      whereConditions.companyId = companyId;
    }

    if (dateFrom && dateTo) {
      whereConditions.depositDate = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      whereConditions.depositDate = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      whereConditions.depositDate = { [Op.lte]: dateTo };
    }

    if (bankFilter && bankFilter.trim()) {
      const bFilter = bankFilter.split('·')[0].trim();
      whereConditions.bankName = { [Op.like]: `%${bFilter}%` };
    }

    if (modeFilter && modeFilter.trim()) {
      whereConditions.depositMode = modeFilter.trim();
    }

    if (statusFilter && statusFilter.trim()) {
      whereConditions.status = statusFilter.trim();
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      whereConditions[Op.or] = [
        { depositCode: { [Op.like]: q } },
        { bankName: { [Op.like]: q } },
        { bankAccountNo: { [Op.like]: q } },
        { branch: { [Op.like]: q } },
        { referenceNo: { [Op.like]: q } },
        { depositedBy: { [Op.like]: q } },
        { notes: { [Op.like]: q } },
        { depositMode: { [Op.like]: q } },
      ];
    }

    // Scoped base condition for stats (outlet/company level)
    const baseStatsWhere = { isDeleted: false };
    if (outletId) baseStatsWhere.outletId = outletId;
    if (companyId) baseStatsWhere.companyId = companyId;

    const stats = await computeStats(baseStatsWhere);

    const includeHistory = [
      {
        model: BankDepositHistory(),
        as: 'history',
        separate: true,
        order: [['editedAt', 'DESC']],
      },
    ];

    if (page && pageSize) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(pageSize, 10) || 10);
      const offsetNum = (pageNum - 1) * limitNum;

      const { count, rows } = await BankDeposit().findAndCountAll({
        where: whereConditions,
        include: includeHistory,
        distinct: true,
        order: [['depositDate', 'DESC'], ['id', 'DESC']],
        limit: limitNum,
        offset: offsetNum,
      });

      return {
        rows,
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        page: pageNum,
        pageSize: limitNum,
        stats,
      };
    }

    const data = await BankDeposit().findAll({
      where: whereConditions,
      include: includeHistory,
      order: [['depositDate', 'DESC'], ['id', 'DESC']],
    });

    return {
      rows: data,
      totalItems: data.length,
      totalPages: 1,
      page: 1,
      pageSize: data.length,
      stats,
    };
  } catch (err) {
    logger.error('BankDeposit DAO listBankDeposits Error:', err);
    throw err;
  }
};

const updateBankDeposit = async (
  payload,
  userId,
  outletId = null,
  companyId = null,
  slipUrl = null,
  userName = null
) => {
  try {
    const id = payload.id;
    if (!id) throw new Error('Bank deposit ID is required for update');

    const whereConditions = { id, isDeleted: false };
    if (outletId) whereConditions.outletId = outletId;

    const existing = await BankDeposit().findOne({ where: whereConditions });
    if (!existing) {
      return null;
    }

    const rawDate = payload.depositDate || payload.date || (payload.dateTime ? payload.dateTime.split('T')[0] : existing.depositDate);
    const rawTime = payload.depositTime || payload.time || (payload.dateTime && payload.dateTime.includes('T') ? payload.dateTime.split('T')[1].slice(0, 5) : existing.depositTime);

    let combinedDateTime = existing.dateTime;
    if (payload.dateTime) {
      combinedDateTime = new Date(payload.dateTime);
    } else if (rawDate) {
      combinedDateTime = new Date(`${rawDate}T${rawTime ? rawTime.replace(/(AM|PM|\s)/gi, '') : '00:00'}:00`);
    }

    const updateFields = {
      depositDate: rawDate,
      depositTime: rawTime,
      dateTime: combinedDateTime && !isNaN(combinedDateTime.getTime()) ? combinedDateTime : existing.dateTime,
      bankName: payload.bankName !== undefined ? payload.bankName : existing.bankName,
      bankAccountNo:
        payload.bankAccountNo !== undefined
          ? (payload.bankAccountNo ? String(payload.bankAccountNo).trim() : null)
          : payload.accountNumber !== undefined
          ? (payload.accountNumber ? String(payload.accountNumber).trim() : null)
          : payload.acNo !== undefined
          ? (payload.acNo ? String(payload.acNo).trim() : null)
          : existing.bankAccountNo,
      branch:
        payload.branch !== undefined
          ? (payload.branch ? String(payload.branch).trim() : null)
          : payload.bankBranch !== undefined
          ? (payload.bankBranch ? String(payload.bankBranch).trim() : null)
          : payload.branchName !== undefined
          ? (payload.branchName ? String(payload.branchName).trim() : null)
          : existing.branch,
      bankId: payload.bankId !== undefined ? payload.bankId : existing.bankId,
      depositMode: payload.depositMode !== undefined ? payload.depositMode : existing.depositMode,
      referenceNo: payload.referenceNo !== undefined ? payload.referenceNo : existing.referenceNo,
      amount: payload.amount !== undefined ? Number(payload.amount) : existing.amount,
      depositedBy: payload.depositedBy !== undefined ? payload.depositedBy : existing.depositedBy,
      status: payload.status !== undefined ? payload.status : existing.status,
      notes: payload.notes !== undefined ? payload.notes : existing.notes,
      updatedBy: userId || null,
    };

    if (slipUrl || payload.slipUrl) {
      updateFields.slipUrl = slipUrl || payload.slipUrl;
    }

    // Identify changed fields
    const changeList = [];
    if (updateFields.amount !== undefined && Number(updateFields.amount) !== Number(existing.amount)) {
      changeList.push(`Amount: ₹${Number(existing.amount || 0).toFixed(2)} → ₹${Number(updateFields.amount || 0).toFixed(2)}`);
    }
    if (updateFields.bankName !== undefined && updateFields.bankName !== existing.bankName) {
      changeList.push(`Bank: ${existing.bankName || 'None'} → ${updateFields.bankName}`);
    }
    if (updateFields.bankAccountNo !== undefined && updateFields.bankAccountNo !== existing.bankAccountNo) {
      changeList.push(`Account No: ${existing.bankAccountNo || 'None'} → ${updateFields.bankAccountNo || 'None'}`);
    }
    if (updateFields.branch !== undefined && updateFields.branch !== existing.branch) {
      changeList.push(`Branch: ${existing.branch || 'None'} → ${updateFields.branch || 'None'}`);
    }
    if (updateFields.depositDate !== undefined && updateFields.depositDate !== existing.depositDate) {
      changeList.push(`Date: ${existing.depositDate} → ${updateFields.depositDate}`);
    }
    if (updateFields.depositMode !== undefined && updateFields.depositMode !== existing.depositMode) {
      changeList.push(`Mode: ${existing.depositMode} → ${updateFields.depositMode}`);
    }
    if (updateFields.referenceNo !== undefined && updateFields.referenceNo !== existing.referenceNo) {
      changeList.push(`Ref No: ${existing.referenceNo || 'None'} → ${updateFields.referenceNo || 'None'}`);
    }
    if (updateFields.depositedBy !== undefined && updateFields.depositedBy !== existing.depositedBy) {
      changeList.push(`Deposited By: ${existing.depositedBy || 'None'} → ${updateFields.depositedBy || 'None'}`);
    }
    if (updateFields.status !== undefined && updateFields.status !== existing.status) {
      changeList.push(`Status: ${existing.status} → ${updateFields.status}`);
    }
    if (updateFields.notes !== undefined && updateFields.notes !== existing.notes) {
      changeList.push(`Notes updated`);
    }
    if (updateFields.slipUrl !== undefined && updateFields.slipUrl !== existing.slipUrl) {
      changeList.push('Deposit slip updated');
    }

    const changeSummary = changeList.length > 0 ? changeList.join('; ') : 'Record updated';

    // Persist revision changes into the separate bank_deposit_histories table
    if (changeList.length > 0) {
      try {
        await BankDepositHistory().create({
          depositId: existing.id,
          depositCode: existing.depositCode,
          companyId: existing.companyId || companyId || null,
          outletId: existing.outletId || outletId || null,
          editedBy: userId || null,
          editorName: userName || 'Staff',
          editedAt: new Date(),
          oldAmount: existing.amount,
          newAmount: updateFields.amount,
          oldBankName: existing.bankName,
          newBankName: updateFields.bankName,
          oldAccountNo: existing.bankAccountNo,
          newAccountNo: updateFields.bankAccountNo,
          oldBranch: existing.branch,
          newBranch: updateFields.branch,
          oldDepositDate: existing.depositDate,
          newDepositDate: updateFields.depositDate,
          oldDepositMode: existing.depositMode,
          newDepositMode: updateFields.depositMode,
          oldStatus: existing.status,
          newStatus: updateFields.status,
          oldReferenceNo: existing.referenceNo,
          newReferenceNo: updateFields.referenceNo,
          oldNotes: existing.notes,
          newNotes: updateFields.notes,
          changeSummary,
          previousData: JSON.stringify(existing.toJSON ? existing.toJSON() : existing),
          newData: JSON.stringify(updateFields),
        });
      } catch (histErr) {
        logger.error('Failed to record bank deposit edit history:', histErr);
      }
    }

    await existing.update(updateFields);

    // Reload with history
    return await BankDeposit().findOne({
      where: { id: existing.id },
      include: [
        {
          model: BankDepositHistory(),
          as: 'history',
          separate: true,
          order: [['editedAt', 'DESC']],
        },
      ],
    });
  } catch (err) {
    logger.error('BankDeposit DAO updateBankDeposit Error:', err);
    throw err;
  }
};

const listBankDepositHistories = async ({
  depositId,
  outletId,
  companyId,
  dateFrom,
  dateTo,
  query,
}) => {
  try {
    const whereConditions = {};
    if (depositId) whereConditions.depositId = depositId;
    if (outletId) whereConditions.outletId = outletId;
    if (companyId) whereConditions.companyId = companyId;

    if (dateFrom && dateTo) {
      whereConditions.editedAt = { [Op.between]: [new Date(`${dateFrom}T00:00:00`), new Date(`${dateTo}T23:59:59`)] };
    } else if (dateFrom) {
      whereConditions.editedAt = { [Op.gte]: new Date(`${dateFrom}T00:00:00`) };
    } else if (dateTo) {
      whereConditions.editedAt = { [Op.lte]: new Date(`${dateTo}T23:59:59`) };
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      whereConditions[Op.or] = [
        { depositCode: { [Op.like]: q } },
        { editorName: { [Op.like]: q } },
        { changeSummary: { [Op.like]: q } },
        { newBankName: { [Op.like]: q } },
      ];
    }

    return await BankDepositHistory().findAll({
      where: whereConditions,
      order: [['editedAt', 'DESC'], ['id', 'DESC']],
    });
  } catch (err) {
    logger.error('BankDeposit DAO listBankDepositHistories Error:', err);
    throw err;
  }
};

/**
 * Soft Delete - explicitly sets isDeleted to true and records deletedAt & deletedBy.
 * Never executes hard delete (destroy).
 */
const softDeleteBankDeposit = async (id, userId, outletId = null) => {
  try {
    const whereConditions = { id, isDeleted: false };
    if (outletId) whereConditions.outletId = outletId;

    const existing = await BankDeposit().findOne({ where: whereConditions });
    if (!existing) {
      return false;
    }

    await existing.update({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId || null,
    });

    return true;
  } catch (err) {
    logger.error('BankDeposit DAO softDeleteBankDeposit Error:', err);
    throw err;
  }
};

const uploadDepositSlip = async (id, slipUrl, userId, outletId = null) => {
  try {
    const whereConditions = { id, isDeleted: false };
    if (outletId) whereConditions.outletId = outletId;

    const existing = await BankDeposit().findOne({ where: whereConditions });
    if (!existing) {
      return null;
    }

    await existing.update({
      slipUrl,
      updatedBy: userId || null,
    });

    return existing;
  } catch (err) {
    logger.error('BankDeposit DAO uploadDepositSlip Error:', err);
    throw err;
  }
};

export default {
  generateDepositCode,
  createBankDeposit,
  getBankDepositById,
  computeStats,
  listBankDeposits,
  updateBankDeposit,
  softDeleteBankDeposit,
  uploadDepositSlip,
  listBankDepositHistories,
};
