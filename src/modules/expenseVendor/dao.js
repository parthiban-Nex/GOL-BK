import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const ExpenseVendor = db.expenseVendors;

const generateExpenseVendorCode = async () => {
  try {
    const lastRecord = await ExpenseVendor.findOne({
      order: [['id', 'DESC']],
      attributes: ['id', 'vendorCode'],
    });

    const nextId = lastRecord ? lastRecord.id + 1 : 1;
    return `EV${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    logger.error('ExpenseVendor DAO generateExpenseVendorCode Error:', err);
    return `EV${Date.now().toString().slice(-4)}`;
  }
};

const createExpenseVendor = async (payload, userId, outletId, companyId, documentLink = null) => {
  try {
    const vendorCode = payload.vendorCode || (await generateExpenseVendorCode());

    const created = await ExpenseVendor.create({
      vendorCode,
      vendorName: payload.vendorName || payload.name,
      vendorType: payload.vendorType || payload.type || null,
      paymentTerms: payload.paymentTerms || null,
      contactPerson: payload.contactPerson || null,
      phone: payload.phone || payload.mobileNumber || null,
      email: payload.email || null,
      gst: payload.gst || payload.gstin || null,
      address: payload.address || null,
      documentLink: documentLink || payload.documentLink || null,
      outletId: outletId || null,
      companyId: companyId || null,
      createdBy: userId || null,
      status: payload.status || 'Active',
    });

    return created;
  } catch (err) {
    logger.error('ExpenseVendor DAO createExpenseVendor Error:', err);
    throw err;
  }
};

const listExpenseVendors = async ({ outletId, companyId, query, status = 'Active' }) => {
  try {
    const whereConditions = {};

    if (outletId) {
      whereConditions.outletId = outletId;
    }

    if (companyId) {
      whereConditions.companyId = companyId;
    }

    if (status && status !== 'All') {
      whereConditions.status = status;
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      whereConditions[Op.or] = [
        { vendorName: { [Op.like]: q } },
        { vendorCode: { [Op.like]: q } },
        { contactPerson: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { gst: { [Op.like]: q } },
      ];
    }

    const data = await ExpenseVendor.findAll({
      where: whereConditions,
      order: [['id', 'DESC']],
    });

    return data;
  } catch (err) {
    logger.error('ExpenseVendor DAO listExpenseVendors Error:', err);
    throw err;
  }
};

const getExpenseVendorById = async (id, outletId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    return await ExpenseVendor.findOne({ where: whereConditions });
  } catch (err) {
    logger.error('ExpenseVendor DAO getExpenseVendorById Error:', err);
    throw err;
  }
};

export default {
  createExpenseVendor,
  listExpenseVendors,
  getExpenseVendorById,
  generateExpenseVendorCode,
};
