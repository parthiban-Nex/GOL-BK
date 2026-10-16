import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const FinancePurchase = db.financePurchases;
const FinancePurchaseItem = db.financePurchaseItems;
const FinancePurchasePayment = db.financePurchasePayments;
const FinancePurchaseVendor = db.financePurchaseVendors;

const generatePurchaseCode = async () => {
  try {
    const lastRecord = await FinancePurchase.findOne({
      order: [['id', 'DESC']],
      attributes: ['id', 'purchaseCode'],
    });

    const nextId = lastRecord ? lastRecord.id + 1 : 1;
    return `PUR${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    logger.error('FinancePurchase DAO generatePurchaseCode Error:', err);
    return `PUR${Date.now().toString().slice(-4)}`;
  }
};

const createPurchase = async (
  payload,
  userId,
  outletId,
  companyId,
  documentLink = null,
  userName = null
) => {
  const t = await db.sequelize.transaction();
  try {
    const purchaseCode = payload.purchaseCode || (await generatePurchaseCode());

    let lineItems = [];
    if (payload.lineItems) {
      lineItems = typeof payload.lineItems === 'string'
        ? JSON.parse(payload.lineItems)
        : payload.lineItems;
    }

    let calculatedExcl = 0;
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      calculatedExcl = lineItems.reduce((acc, item) => {
        const itemQty = Number(item.qty) || 1;
        const itemRate = Number(item.rate) || 0;
        return acc + (Number(item.amount) || itemQty * itemRate);
      }, 0);
    }

    const exclGst = payload.exclGst !== undefined ? Number(payload.exclGst) : calculatedExcl;
    const gst = Number(payload.gst) || 0;
    const inclGst = payload.inclGst !== undefined ? Number(payload.inclGst) : exclGst + gst;
    const paid = Number(payload.paid) || 0;
    const pending = Math.max(0, inclGst - paid);
    const status =
      payload.status ||
      (paid >= inclGst && inclGst > 0
        ? 'Paid'
        : paid > 0
        ? 'Partial'
        : 'Pending');

    const created = await FinancePurchase.create(
      {
        purchaseCode,
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
      },
      { transaction: t }
    );

    // Insert line items
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      const itemsToCreate = lineItems
        .filter((li) => li && (li.name || '').trim())
        .map((li) => {
          const qty = Number(li.qty) || 1;
          const rate = Number(li.rate) || 0;
          const amount = Number(li.amount) || qty * rate;
          return {
            purchaseId: created.id,
            partId: li.partId || null,
            hsnCode: li.hsnCode || null,
            name: (li.name || '').trim(),
            qty,
            rate,
            amount,
          };
        });

      if (itemsToCreate.length > 0) {
        await FinancePurchaseItem.bulkCreate(itemsToCreate, { transaction: t });
      }
    }

    // Insert initial payment if paid > 0
    if (paid > 0 && FinancePurchasePayment) {
      await FinancePurchasePayment.create(
        {
          purchaseId: created.id,
          paymentDate:
            payload.paymentDate ||
            payload.date ||
            new Date().toISOString().split('T')[0],
          amount: paid,
          paymentMode: payload.paymentMode || 'Cash',
          referenceNo: payload.referenceNo || null,
          notes: payload.paymentNotes || payload.notes || 'Initial payment',
          outletId: outletId || null,
          companyId: companyId || null,
          createdBy: userId || null,
          createdByName: userName || null,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return await getPurchaseById(created.id, outletId);
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    logger.error('FinancePurchase DAO createPurchase Error:', err);
    throw err;
  }
};

const getPurchaseById = async (id, outletId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const includeOptions = [];
    if (FinancePurchaseItem) {
      includeOptions.push({
        model: FinancePurchaseItem,
        as: 'lineItems',
      });
    }
    if (FinancePurchasePayment) {
      includeOptions.push({
        model: FinancePurchasePayment,
        as: 'payments',
      });
    }
    if (FinancePurchaseVendor) {
      includeOptions.push({
        model: FinancePurchaseVendor,
        as: 'vendorDetails',
      });
    }

    return await FinancePurchase.findOne({
      where: whereConditions,
      include: includeOptions,
      order: FinancePurchasePayment
        ? [[{ model: FinancePurchasePayment, as: 'payments' }, 'id', 'DESC']]
        : undefined,
    });
  } catch (err) {
    logger.error('FinancePurchase DAO getPurchaseById Error:', err);
    throw err;
  }
};

const listPurchases = async ({
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
        { purchaseCode: { [Op.like]: q } },
        { vendor: { [Op.like]: q } },
        { invoiceNo: { [Op.like]: q } },
        { paymentMode: { [Op.like]: q } },
        { notes: { [Op.like]: q } },
      ];
    }

    const totalsAgg = await FinancePurchase.findOne({
      where: whereConditions,
      attributes: [
        [
          db.Sequelize.fn(
            'COALESCE',
            db.Sequelize.fn('SUM', db.Sequelize.col('inclGst')),
            0
          ),
          'totalInclGst',
        ],
        [
          db.Sequelize.fn(
            'COALESCE',
            db.Sequelize.fn('SUM', db.Sequelize.col('paid')),
            0
          ),
          'totalPaid',
        ],
        [
          db.Sequelize.fn(
            'COALESCE',
            db.Sequelize.fn('SUM', db.Sequelize.col('pending')),
            0
          ),
          'totalPending',
        ],
      ],
      raw: true,
    });

    const totals = {
      inclGst: Number(totalsAgg?.totalInclGst) || 0,
      paid: Number(totalsAgg?.totalPaid) || 0,
      pending: Number(totalsAgg?.totalPending) || 0,
    };

    const includeOptions = [];
    if (FinancePurchaseItem) {
      includeOptions.push({
        model: FinancePurchaseItem,
        as: 'lineItems',
      });
    }
    if (FinancePurchasePayment) {
      includeOptions.push({
        model: FinancePurchasePayment,
        as: 'payments',
      });
    }

    if (page && pageSize) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(pageSize, 10) || 10);
      const offsetNum = (pageNum - 1) * limitNum;

      const { count, rows } = await FinancePurchase.findAndCountAll({
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

    const data = await FinancePurchase.findAll({
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
    logger.error('FinancePurchase DAO listPurchases Error:', err);
    throw err;
  }
};

const updatePurchase = async (
  id,
  payload,
  userId,
  outletId = null,
  companyId = null
) => {
  const t = await db.sequelize.transaction();
  try {
    const rawId = Array.isArray(id)
      ? id[0]
      : typeof id === 'string' && id.includes(',')
      ? id.split(',')[0].trim()
      : id;
    const numericId = parseInt(rawId, 10);
    const whereConditions = {};
    if (!isNaN(numericId) && String(numericId) === String(rawId).trim()) {
      whereConditions.id = numericId;
    } else {
      whereConditions[Op.or] = [
        { id: isNaN(numericId) ? 0 : numericId },
        { purchaseCode: String(rawId).trim() },
      ];
    }

    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const existing = await FinancePurchase.findOne({
      where: whereConditions,
      transaction: t,
      lock: true,
    });

    if (!existing) {
      await t.rollback();
      return null;
    }

    const cleanPurchaseId = Number(existing.id);

    let lineItems = null;
    if (payload.lineItems !== undefined) {
      lineItems = typeof payload.lineItems === 'string'
        ? JSON.parse(payload.lineItems)
        : payload.lineItems;
    }

    let calculatedExcl = Number(existing.exclGst) || 0;
    if (Array.isArray(lineItems)) {
      calculatedExcl = lineItems.reduce((acc, item) => {
        const itemQty = Number(item.qty) || 1;
        const itemRate = Number(item.rate) || 0;
        return acc + (Number(item.amount) || itemQty * itemRate);
      }, 0);
    }

    const exclGst =
      payload.exclGst !== undefined
        ? Number(payload.exclGst) || 0
        : calculatedExcl;
    const gst =
      payload.gst !== undefined ? Number(payload.gst) || 0 : Number(existing.gst) || 0;
    const inclGst =
      payload.inclGst !== undefined
        ? Number(payload.inclGst) || 0
        : exclGst + gst;

    const paid =
      payload.paid !== undefined ? Number(payload.paid) || 0 : Number(existing.paid) || 0;
    const pending = Math.max(0, inclGst - paid);
    const status =
      payload.status ||
      (paid >= inclGst && inclGst > 0
        ? 'Paid'
        : paid > 0
        ? 'Partial'
        : 'Pending');

    const updateFields = {
      vendorId: payload.vendorId !== undefined ? payload.vendorId : existing.vendorId,
      vendor: payload.vendor || existing.vendor,
      invoiceNo: payload.invoiceNo || existing.invoiceNo,
      date: payload.date || existing.date,
      paymentMode:
        payload.paymentMode !== undefined ? payload.paymentMode : existing.paymentMode,
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

    await existing.update(updateFields, { transaction: t });

    // Sync line items if provided
    if (Array.isArray(lineItems)) {
      await FinancePurchaseItem.destroy({
        where: { purchaseId: cleanPurchaseId },
        transaction: t,
      });

      const itemsToCreate = lineItems
        .filter((li) => li && (li.name || '').trim())
        .map((li) => {
          const qty = Number(li.qty) || 1;
          const rate = Number(li.rate) || 0;
          const amount = Number(li.amount) || qty * rate;
          return {
            purchaseId: cleanPurchaseId,
            partId: li.partId || null,
            hsnCode: li.hsnCode || null,
            name: (li.name || '').trim(),
            qty,
            rate,
            amount,
          };
        });

      if (itemsToCreate.length > 0) {
        await FinancePurchaseItem.bulkCreate(itemsToCreate, { transaction: t });
      }
    }

    await t.commit();
    return await getPurchaseById(cleanPurchaseId, outletId);
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    logger.error('FinancePurchase DAO updatePurchase Error:', err);
    throw err;
  }
};

const addPayment = async (
  payload,
  userId,
  userName = null,
  outletId = null,
  companyId = null
) => {
  const t = await db.sequelize.transaction();
  try {
    const purchaseId = payload.purchaseId;
    const amount = Number(payload.amount);
    if (!purchaseId) {
      throw new Error('Purchase ID is required');
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Valid payment amount greater than 0 is required');
    }

    const whereConditions = { id: purchaseId };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const purchase = await FinancePurchase.findOne({
      where: whereConditions,
      transaction: t,
      lock: true,
    });

    if (!purchase) {
      await t.rollback();
      return { notFound: true };
    }

    const currentPending = Number(purchase.pending) || 0;
    if (currentPending <= 0) {
      await t.rollback();
      throw new Error('This purchase bill is already fully paid');
    }

    if (amount > currentPending + 0.01) {
      await t.rollback();
      throw new Error(
        `Payment amount (₹${amount}) cannot exceed remaining balance of ₹${currentPending.toFixed(2)}`
      );
    }

    const payment = await FinancePurchasePayment.create(
      {
        purchaseId: purchase.id,
        amount,
        paymentMode: payload.paymentMode || 'Cash',
        referenceNo: payload.referenceNo || null,
        paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
        notes: payload.notes || null,
        outletId: outletId || purchase.outletId || null,
        companyId: companyId || purchase.companyId || null,
        createdBy: userId || null,
        createdByName: userName || null,
      },
      { transaction: t }
    );

    const newPaid = Number(purchase.paid || 0) + amount;
    const inclGst = Number(purchase.inclGst || 0);
    const newPending = Math.max(0, inclGst - newPaid);
    const newStatus = newPending <= 0 ? 'Paid' : 'Partial';

    await purchase.update(
      {
        paid: newPaid,
        pending: newPending,
        status: newStatus,
        paymentMode: payload.paymentMode || purchase.paymentMode,
        updatedBy: userId || null,
      },
      { transaction: t }
    );

    await t.commit();

    const updatedPurchase = await getPurchaseById(purchase.id, outletId);
    return { payment, purchase: updatedPurchase };
  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    logger.error('FinancePurchase DAO addPayment Error:', err);
    throw err;
  }
};

const getPurchasePayments = async (purchaseId, outletId = null) => {
  try {
    const whereConditions = { purchaseId };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    return await FinancePurchasePayment.findAll({
      where: whereConditions,
      order: [['paymentDate', 'DESC'], ['id', 'DESC']],
    });
  } catch (err) {
    logger.error('FinancePurchase DAO getPurchasePayments Error:', err);
    throw err;
  }
};

const updatePurchaseDocument = async (
  id,
  documentLink,
  userId,
  outletId = null,
  companyId = null
) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const existing = await FinancePurchase.findOne({ where: whereConditions });
    if (!existing) {
      return null;
    }

    await existing.update({
      documentLink,
      updatedBy: userId || null,
    });
    return await getPurchaseById(id, outletId);
  } catch (err) {
    logger.error('FinancePurchase DAO updatePurchaseDocument Error:', err);
    throw err;
  }
};

export default {
  createPurchase,
  getPurchaseById,
  updatePurchase,
  updatePurchaseDocument,
  listPurchases,
  generatePurchaseCode,
  addPayment,
  getPurchasePayments,
};
