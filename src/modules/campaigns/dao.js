import db from '../index.js';
import { Op } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';

const listTemplates = async ({ limit, offset }) => {
  return await db.templates.findAndCountAll({
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });
};

const getTemplateById = async (id) => {
  return await db.templates.findOne({ where: { id } });
};

const createTemplate = async (data) => {
  return await db.templates.create(data);
};

const updateTemplate = async (id, data) => {
  const template = await db.templates.findOne({ where: { id } });
  if (!template) return null;
  await template.update(data);
  return template;
};

const deleteTemplate = async (id) => {
  const template = await db.templates.findOne({ where: { id } });
  if (!template) return false;
  await template.destroy();
  return true;
};

const findRecentDuplicateMessage = async ({ customerId, templateId, serviceType, windowSeconds = 5 }) => {
  const cutoff = new Date(Date.now() - windowSeconds * 1000);
  return await db.campaignMessages.findOne({
    where: {
      customer_id: customerId,
      template_id: templateId,
      service_type: serviceType,
      createdAt: { [Op.gte]: cutoff },
    },
  });
};

const createCampaignMessage = async (data) => {
  return await db.campaignMessages.create(data);
};

const getCustomerById = async (id) => {
  const sql = `
    SELECT 
      c.id,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}'), c.firstName) USING utf8mb4) AS firstName,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}'), c.lastName) USING utf8mb4) AS lastName,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.mobileNumber), '${encryptConfig.code}'), c.mobileNumber) USING utf8mb4) AS mobileNumber,
      c.customerCode,
      c.outletId
    FROM customers AS c
    WHERE c.id = :id
    LIMIT 1
  `;
  const [rows] = await db.sequelize.query(sql, { replacements: { id } });
  return rows && rows[0] ? rows[0] : null;
};

const getCustomers = async ({ limit, offset, search = '', outletId = null }) => {
  const replacements = {
    limit,
    offset,
    outletId: outletId || null,
  };

  let searchCondition = '';
  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/([%_\\])/g, '\\$1');
    replacements.searchPattern = `%${escapedSearch}%`;
    const firstNameExpr = `CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}'), c.firstName) USING utf8mb4)`;
    const lastNameExpr = `CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}'), c.lastName) USING utf8mb4)`;
    const mobileExpr = `CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.mobileNumber), '${encryptConfig.code}'), c.mobileNumber) USING utf8mb4)`;

    searchCondition = `
      AND (
        c.customerCode LIKE :searchPattern OR
        ${firstNameExpr} LIKE :searchPattern OR
        ${lastNameExpr} LIKE :searchPattern OR
        CONCAT_WS(' ', ${firstNameExpr}, ${lastNameExpr}) LIKE :searchPattern OR
        ${mobileExpr} LIKE :searchPattern
      )
    `;
  }

  const whereClause = `
    WHERE (:outletId IS NULL OR c.outletId = :outletId)
    ${searchCondition}
  `;

  const countQuery = `
    SELECT COUNT(c.id) AS total
    FROM customers AS c
    ${whereClause}
  `;

  const dataQuery = `
    SELECT 
      c.id,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}'), c.firstName) USING utf8mb4) AS firstName,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}'), c.lastName) USING utf8mb4) AS lastName,
      CONVERT(COALESCE(AES_DECRYPT(UNHEX(c.mobileNumber), '${encryptConfig.code}'), c.mobileNumber) USING utf8mb4) AS mobileNumber,
      c.customerCode,
      c.outletId
    FROM customers AS c
    ${whereClause}
    ORDER BY c.id DESC
    LIMIT :limit OFFSET :offset
  `;

  const [countResult] = await db.sequelize.query(countQuery, { replacements });
  const [dataResult] = await db.sequelize.query(dataQuery, { replacements });

  return {
    total: countResult?.[0]?.total || 0,
    rows: dataResult || [],
  };
};



const CampaignDAO = { listTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, findRecentDuplicateMessage, createCampaignMessage, getCustomerById, getCustomers,};
export default CampaignDAO;
