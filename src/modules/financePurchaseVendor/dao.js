import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const FinancePurchaseVendor = db.financePurchaseVendors;

const generateVendorCode = async () => {
  try {
    const lastRecord = await FinancePurchaseVendor.findOne({
      order: [['id', 'DESC']],
      attributes: ['id', 'vendorCode'],
    });

    const nextId = lastRecord ? lastRecord.id + 1 : 1;
    return `PV${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    logger.error('FinancePurchaseVendor DAO generateVendorCode Error:', err);
    return `PV${Date.now().toString().slice(-4)}`;
  }
};

const createFinancePurchaseVendor = async (
  payload,
  userId,
  outletId,
  companyId,
  documentLink = null
) => {
  try {
    const vendorCode = payload.vendorCode || (await generateVendorCode());

    const created = await FinancePurchaseVendor.create({
      vendorCode,
      vendorName: payload.vendorName,
      vendorType: payload.vendorType || null,
      paymentTerms: payload.paymentTerms || null,
      contactPerson: payload.contactPerson || null,
      phone: payload.phone || null,
      email: payload.email || null,
      gst: payload.gst || null,
      address: payload.address || null,
      documentLink: documentLink || payload.documentLink || null,
      outletId: outletId || null,
      companyId: companyId || null,
      createdBy: userId || null,
    });

    return created;
  } catch (err) {
    logger.error('FinancePurchaseVendor DAO createFinancePurchaseVendor Error:', err);
    throw err;
  }
};

const getFinancePurchaseVendorById = async (id, outletId = null) => {
  try {
    const whereConditions = { id };
    if (outletId) {
      whereConditions.outletId = outletId;
    }
    return await FinancePurchaseVendor.findOne({ where: whereConditions });
  } catch (err) {
    logger.error('FinancePurchaseVendor DAO getFinancePurchaseVendorById Error:', err);
    throw err;
  }
};

const listFinancePurchaseVendors = async ({
  outletId,
  companyId,
  query,
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

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      whereConditions[Op.or] = [
        { vendorCode: { [Op.like]: q } },
        { vendorName: { [Op.like]: q } },
        { contactPerson: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { gst: { [Op.like]: q } },
      ];
    }

    if (page && pageSize) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(pageSize, 10) || 10);
      const offsetNum = (pageNum - 1) * limitNum;

      const { count, rows } = await FinancePurchaseVendor.findAndCountAll({
        where: whereConditions,
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
      };
    }

    const data = await FinancePurchaseVendor.findAll({
      where: whereConditions,
      order: [['id', 'DESC']],
    });

    return {
      rows: data,
      totalItems: data.length,
      totalPages: 1,
      page: 1,
      pageSize: data.length,
    };
  } catch (err) {
    logger.error('FinancePurchaseVendor DAO listFinancePurchaseVendors Error:', err);
    throw err;
  }
};

export default {
  createFinancePurchaseVendor,
  getFinancePurchaseVendorById,
  listFinancePurchaseVendors,
  generateVendorCode,
};
