import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Expense = db.expenses;

const generateExpenseCode = async () => {
  try {
    const lastRecord = await Expense.findOne({
      order: [['id', 'DESC']],
      attributes: ['id', 'expenseCode'],
    });

    const nextId = lastRecord ? lastRecord.id + 1 : 1;
    return `EXP${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    logger.error('Expense DAO generateExpenseCode Error:', err);
    return `EXP${Date.now().toString().slice(-4)}`;
  }
};

const createExpense = async (payload, userId, outletId, companyId, documentLink = null, userName = null) => {
  try {
    const expenseCode = payload.expenseCode || (await generateExpenseCode());

    const exclGst = Number(payload.exclGst) || 0;
    const gst = Number(payload.gst) || 0;
    const inclGst = Number(payload.inclGst) || (exclGst + gst);
    const paid = Number(payload.paid) || 0;
    const pending = Math.max(0, inclGst - paid);
    const status = payload.status || (paid >= inclGst && inclGst > 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Pending'));

    const created = await Expense.create({
      expenseCode,
      head: payload.head,
      type: payload.type,
      vendorId: payload.vendorId || null,
      vendor: payload.vendor,
      invoiceNo: payload.invoiceNo,
      date: payload.date || null,
      paymentMode: payload.paymentMode || null,
      exclGst,
      gst,
      inclGst,
      paid,
      pending,
      status,
      notes: payload.notes || null,
      documentLink: documentLink || payload.documentLink || null,
      outletId: outletId || null,
      companyId: companyId || null,
      createdBy: userId || null,
    });

    // If an initial payment was recorded at the time of creation, log it in expense_payments
    if (paid > 0 && db.expensePayments) {
      try {
        await db.expensePayments.create({
          expenseId: created.id,
          paymentDate: payload.paymentDate || payload.date || new Date().toISOString().split('T')[0],
          amount: paid,
          paymentMode: payload.paymentMode || 'Cash',
          referenceNo: payload.referenceNo || null,
          notes: payload.paymentNotes || payload.notes || 'Initial payment',
          outletId: outletId || null,
          companyId: companyId || null,
          createdBy: userId || null,
          createdByName: userName || null,
        });
      } catch (paymentErr) {
        logger.error('Failed to create initial ExpensePayment record:', paymentErr);
      }
    }

    return await getExpenseById(created.id, outletId);
  } catch (err) {
    logger.error('Expense DAO createExpense Error:', err);
    throw err;
  }
};

const getExpenseById = async (id, outletId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    const includeOptions = [];
    if (db.expensePayments) {
      includeOptions.push({
        model: db.expensePayments,
        as: 'payments',
      });
    }

    return await Expense.findOne({
      where: whereConditions,
      include: includeOptions,
      order: db.expensePayments ? [[{ model: db.expensePayments, as: 'payments' }, 'id', 'DESC']] : undefined,
    });
  } catch (err) {
    logger.error('Expense DAO getExpenseById Error:', err);
    throw err;
  }
};

const listExpenses = async ({
  outletId,
  companyId,
  query,
  dateFrom,
  dateTo,
  page,
  pageSize,
}) => {
  try {
    const whereConditions = {};

    if (outletId) {
      whereConditions.outletId = outletId;
    }

    if (companyId) {
      whereConditions.companyId = companyId;
    }

    if (dateFrom && dateTo) {
      whereConditions.date = {
        [Op.between]: [dateFrom, dateTo],
      };
    } else if (dateFrom) {
      whereConditions.date = {
        [Op.gte]: dateFrom,
      };
    } else if (dateTo) {
      whereConditions.date = {
        [Op.lte]: dateTo,
      };
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      whereConditions[Op.or] = [
        { expenseCode: { [Op.like]: q } },
        { head: { [Op.like]: q } },
        { type: { [Op.like]: q } },
        { vendor: { [Op.like]: q } },
        { invoiceNo: { [Op.like]: q } },
        { paymentMode: { [Op.like]: q } },
        { notes: { [Op.like]: q } },
      ];
    }

    // Compute aggregate summary totals (Total Incl GST, Total Paid, Total Pending)
    const totalsAgg = await Expense.findOne({
      where: whereConditions,
      attributes: [
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('inclGst')), 0), 'totalInclGst'],
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('paid')), 0), 'totalPaid'],
        [db.Sequelize.fn('COALESCE', db.Sequelize.fn('SUM', db.Sequelize.col('pending')), 0), 'totalPending'],
      ],
      raw: true,
    });

    const totals = {
      inclGst: Number(totalsAgg?.totalInclGst) || 0,
      paid: Number(totalsAgg?.totalPaid) || 0,
      pending: Number(totalsAgg?.totalPending) || 0,
    };

    const includeOptions = [];
    if (db.expensePayments) {
      includeOptions.push({
        model: db.expensePayments,
        as: 'payments',
      });
    }

    // If pagination params are provided
    if (page && pageSize) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(pageSize, 10) || 10);
      const offsetNum = (pageNum - 1) * limitNum;

      const { count, rows } = await Expense.findAndCountAll({
        where: whereConditions,
        include: includeOptions,
        distinct: true,
        order: [['id', 'DESC']],
        limit: limitNum,
        offset: offsetNum,
      });

      return {
        rows,
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        page: pageNum,
        pageSize: limitNum,
        totals,
      };
    }

    // If no pagination params, return all matching
    const data = await Expense.findAll({
      where: whereConditions,
      include: includeOptions,
      order: [['id', 'DESC']],
    });

    return {
      rows: data,
      totalItems: data.length,
      totalPages: 1,
      page: 1,
      pageSize: data.length,
      totals,
    };
  } catch (err) {
    logger.error('Expense DAO listExpenses Error:', err);
    throw err;
  }
};

const addPayment = async (payload, userId, userName = null, outletId = null, companyId = null) => {
  const t = await db.sequelize.transaction();
  try {
    const expenseId = payload.expenseId;
    const amount = Number(payload.amount);
    if (!expenseId) {
      throw new Error('Expense ID is required');
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Valid payment amount greater than 0 is required');
    }

    const whereConditions = { id: expenseId };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const expense = await Expense.findOne({ where: whereConditions, transaction: t, lock: true });
    if (!expense) {
      await t.rollback();
      return { notFound: true };
    }

    const currentPending = Number(expense.pending) || 0;
    if (currentPending <= 0) {
      await t.rollback();
      throw new Error('This expense is already fully paid');
    }

    if (amount > currentPending + 0.01) {
      await t.rollback();
      throw new Error(`Payment amount (₹${amount}) cannot exceed remaining balance of ₹${currentPending.toFixed(2)}`);
    }

    const payment = await db.expensePayments.create(
      {
        expenseId,
        amount,
        paymentMode: payload.paymentMode || 'Cash',
        referenceNo: payload.referenceNo || null,
        paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
        notes: payload.notes || null,
        outletId: outletId || expense.outletId || null,
        companyId: companyId || expense.companyId || null,
        createdBy: userId || null,
        createdByName: userName || null,
      },
      { transaction: t }
    );

    const newPaid = Number(expense.paid || 0) + amount;
    const inclGst = Number(expense.inclGst || 0);
    const newPending = Math.max(0, inclGst - newPaid);
    const newStatus = newPending <= 0 ? 'Paid' : 'Partially Paid';

    await expense.update(
      {
        paid: newPaid,
        pending: newPending,
        status: newStatus,
        paymentMode: payload.paymentMode || expense.paymentMode,
        updatedBy: userId || null,
      },
      { transaction: t }
    );

    await t.commit();

    const updatedExpense = await getExpenseById(expenseId, outletId);
    return { payment, expense: updatedExpense };
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    logger.error('Expense DAO addPayment Error:', err);
    throw err;
  }
};

const getExpensePayments = async (expenseId, outletId = null) => {
  try {
    const whereConditions = { expenseId };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    return await db.expensePayments.findAll({
      where: whereConditions,
      order: [['paymentDate', 'DESC'], ['id', 'DESC']],
    });
  } catch (err) {
    logger.error('Expense DAO getExpensePayments Error:', err);
    throw err;
  }
};

const updateExpense = async (id, payload, userId, outletId = null, companyId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const existing = await Expense.findOne({ where: whereConditions });
    if (!existing) {
      return null;
    }

    const exclGst = payload.exclGst !== undefined ? Number(payload.exclGst) || 0 : Number(existing.exclGst) || 0;
    const gst = payload.gst !== undefined ? Number(payload.gst) || 0 : Number(existing.gst) || 0;
    const inclGst = payload.inclGst !== undefined ? Number(payload.inclGst) || 0 : (exclGst + gst);
    const paid = payload.paid !== undefined ? Number(payload.paid) || 0 : Number(existing.paid) || 0;
    const pending = Math.max(0, inclGst - paid);
    const status = payload.status || (paid >= inclGst && inclGst > 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Pending'));

    const updateFields = {
      head: payload.head || existing.head,
      type: payload.type || existing.type,
      vendorId: payload.vendorId !== undefined ? payload.vendorId : existing.vendorId,
      vendor: payload.vendor || existing.vendor,
      invoiceNo: payload.invoiceNo || existing.invoiceNo,
      date: payload.date || existing.date,
      paymentMode: payload.paymentMode !== undefined ? payload.paymentMode : existing.paymentMode,
      exclGst,
      gst,
      inclGst,
      paid,
      pending,
      status,
      notes: payload.notes !== undefined ? payload.notes : existing.notes,
      updatedBy: userId || null,
    };

    if (payload.documentLink) {
      updateFields.documentLink = payload.documentLink;
    }

    await existing.update(updateFields);
    return await getExpenseById(id, outletId);
  } catch (err) {
    logger.error('Expense DAO updateExpense Error:', err);
    throw err;
  }
};

const updateExpenseDocument = async (id, documentLink, userId, outletId = null, companyId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const existing = await Expense.findOne({ where: whereConditions });
    if (!existing) {
      return null;
    }

    await existing.update({
      documentLink,
      updatedBy: userId || null,
    });
    return await getExpenseById(id, outletId);
  } catch (err) {
    logger.error('Expense DAO updateExpenseDocument Error:', err);
    throw err;
  }
};

export default {
  createExpense,
  getExpenseById,
  updateExpense,
  updateExpenseDocument,
  listExpenses,
  generateExpenseCode,
  addPayment,
  getExpensePayments,
};
