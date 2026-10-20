import CampaignDAO from './dao.js';
import { SERVICES } from './models/campaignMessage.js';

export { SERVICES };

export const ALLOWED_PLACEHOLDERS = ['service_name'];

export const LIMITS = {
  title: 100,
  content: 1024,
  footer: 60,
};


export function getCampaignConstants() {
  return {
    SERVICES,
    services: Object.entries(SERVICES).map(([id, title]) => ({ id, title })),
    ALLOWED_PLACEHOLDERS,
    LIMITS,
  };
}

function validateId(id, fieldName = 'ID') {
  if (id === null || id === undefined) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  const str = String(id).trim();
  if (!/^\d+$/.test(str) || Number(str) <= 0) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return Number(str);
}

function validatePlaceholders(text, fieldName) {
  if (!text || typeof text !== 'string') return;
  const tokenRegex = /\{\{([^{}]*)\}\}/g;
  let match;
  const invalid = [];
  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[1].trim();
    if (!ALLOWED_PLACEHOLDERS.includes(token)) {
      invalid.push(`{{${token || 'empty'}}}`);
    }
  }
  const openBraces = (text.match(/\{\{/g) || []).length;
  const closeBraces = (text.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    const err = new Error(`Malformed placeholder braces in ${fieldName}`);
    err.status = 400;
    throw err;
  }
  if (invalid.length > 0) {
    const err = new Error(
      `Unsupported placeholder(s) in ${fieldName}: ${invalid.join(', ')}. Only {{service_name}} is supported.`
    );
    err.status = 400;
    throw err;
  }
}

function validateTemplateInput(body, isPartial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const err = new Error('Invalid request body. Expected a JSON object.');
    err.status = 400;
    throw err;
  }

  const { title, content, footer } = body;

  if (isPartial) {
    if (title === undefined && content === undefined && footer === undefined) {
      const err = new Error('At least one field (title, content, or footer) must be provided to update.');
      err.status = 400;
      throw err;
    }
  }

  if (!isPartial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      const err = new Error('Title is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }
    if (title.trim().length > LIMITS.title) {
      const err = new Error(`Title must not exceed ${LIMITS.title} characters`);
      err.status = 400;
      throw err;
    }
    validatePlaceholders(title.trim(), 'title');
  }

  if (!isPartial || content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) {
      const err = new Error('Content is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }
    if (content.trim().length > LIMITS.content) {
      const err = new Error(`Content must not exceed ${LIMITS.content} characters`);
      err.status = 400;
      throw err;
    }
    validatePlaceholders(content.trim(), 'content');
  }

  if (footer !== undefined && footer !== null) {
    if (typeof footer !== 'string') {
      const err = new Error('Footer must be a string');
      err.status = 400;
      throw err;
    }
    if (footer.trim().length > LIMITS.footer) {
      const err = new Error(`Footer must not exceed ${LIMITS.footer} characters`);
      err.status = 400;
      throw err;
    }
    validatePlaceholders(footer.trim(), 'footer');
  }
}

export function renderTemplate(template, serviceType) {
  const serviceName = SERVICES[serviceType] || '';
  const replace = (text) => (text || '').replace(/\{\{\s*service_name\s*\}\}/g, serviceName);

  const title = replace(template?.title).trim();
  const content = replace(template?.content).trim();
  const footer = replace(template?.footer).trim();

  return { title, content, footer, message: [title, content, footer].filter(Boolean).join('\n\n'),};
}

const listTemplates = async ({ page = 1, limit = 3 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 3));
  const offset = (pageNum - 1) * limitNum;
  const { count, rows } = await CampaignDAO.listTemplates({ limit: limitNum, offset });
  const totalPages = Math.ceil(count / limitNum) || 1;

  return {
    data: rows.map((r) => r.toJSON()),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};

const getTemplateById = async (id) => {
  const templateId = validateId(id, 'Template ID');
  const template = await CampaignDAO.getTemplateById(templateId);
  if (!template) {
    const err = new Error('Template not found');
    err.status = 404;
    throw err;
  }
  return template.toJSON();
};

const createTemplate = async (body) => {
  validateTemplateInput(body, false);
  const data = {
    title: body.title.trim(),
    content: body.content.trim(),
    footer: body.footer ? body.footer.trim() : null,
  };
  const created = await CampaignDAO.createTemplate(data);
  return created.toJSON();
};

const updateTemplate = async (id, body) => {
  const templateId = validateId(id, 'Template ID');
  validateTemplateInput(body, true);

  const data = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.content !== undefined) data.content = body.content.trim();
  if (body.footer !== undefined) data.footer = body.footer ? body.footer.trim() : null;

  const updated = await CampaignDAO.updateTemplate(templateId, data);
  if (!updated) {
    const err = new Error('Template not found');
    err.status = 404;
    throw err;
  }
  return updated.toJSON();
};

const deleteTemplate = async (id) => {
  const templateId = validateId(id, 'Template ID');
  const deleted = await CampaignDAO.deleteTemplate(templateId);
  if (!deleted) {
    const err = new Error('Template not found');
    err.status = 404;
    throw err;
  }
  return true;
};

const previewTemplate = async (id, body = {}) => {
  const templateId = validateId(id, 'Template ID');
  const template = await getTemplateById(templateId);

  if (!body || typeof body !== 'object') {
    const err = new Error('Invalid preview request body');
    err.status = 400;
    throw err;
  }

  const { serviceType, customerId } = body;

  if (!serviceType || !SERVICES[serviceType]) {
    const err = new Error(`Invalid service type. Must be one of: ${Object.keys(SERVICES).join(', ')}`);
    err.status = 400;
    throw err;
  }

  let customer = null;
  let customerName = '';
  if (customerId) {
    const cId = validateId(customerId, 'Customer ID');
    customer = await CampaignDAO.getCustomerById(cId);
    if (!customer) {
      const err = new Error('Customer not found');
      err.status = 404;
      throw err;
    }
    customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
  }

  const rendered = renderTemplate(template, serviceType);
  return {
    ...rendered,
    customerName,
    mobileNumber: customer?.mobileNumber || '',
  };
};

const sendCampaign = async (body = {}) => {
  if (!body || typeof body !== 'object') {
    const err = new Error('Invalid request body. Expected a JSON object.');
    err.status = 400;
    throw err;
  }

  const { customerId, templateId, serviceType } = body;
  const cId = validateId(customerId, 'Customer ID');
  const tId = validateId(templateId, 'Template ID');

  if (!serviceType || !SERVICES[serviceType]) {
    const err = new Error(`Invalid service type. Must be one of: ${Object.keys(SERVICES).join(', ')}`);
    err.status = 400;
    throw err;
  }

  const customer = await CampaignDAO.getCustomerById(cId);
  if (!customer) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const cleanMobile = (customer.mobileNumber || '').replace(/[^\d]/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    const err = new Error('Customer does not have a valid mobile number for campaign dispatch');
    err.status = 400;
    throw err;
  }

  const template = await getTemplateById(tId);

  const duplicate = await CampaignDAO.findRecentDuplicateMessage({
    customerId: cId,
    templateId: tId,
    serviceType,
    windowSeconds: 5,
  });

  if (duplicate) {
    const err = new Error('A duplicate campaign message was recently sent for this customer and template.');
    err.status = 409;
    throw err;
  }

  const rendered = renderTemplate(template, serviceType);

  const messageRecord = await CampaignDAO.createCampaignMessage({
    customer_id: cId,
    mobile_number: customer.mobileNumber || null,
    template_id: tId,
    service_type: serviceType,
    message: rendered.message,
    status: 'PENDING',
  });

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();

  return {
    ...messageRecord.toJSON(),
    mobileNumber: customer.mobileNumber,
    customerName,
    status: 'PENDING',
  };
};

const getCustomers = async (query = {}, user = null) => {
  const pageNum = Math.max(1, parseInt(query?.page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(query?.limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;
  const search = typeof query?.search === 'string' ? query.search.trim().slice(0, 100) : '';
  const outletId = user?.outlet?.id || user?.outletId || null;

  const { total, rows } = await CampaignDAO.getCustomers({
    limit: limitNum,
    offset,
    search,
    outletId,
  });

  const totalPages = Math.ceil(total / limitNum) || 1;

  const formattedRows = rows.map((r) => {
    const customerName = [r.firstName, r.lastName].filter(Boolean).join(' ').trim();
    return {
      id: r.id,
      customerId: r.id,
      name: customerName,
      customerName,
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      mobileNumber: r.mobileNumber || '',
      customerCode: r.customerCode || '',
      outletId: r.outletId || null,
      vehicleNo: null,
      regNo: null,
      last_service_date: null,
      next_service_date: null,
      productType: null,
      recommended: null,
    };
  });

  return {
    data: formattedRows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};


const CampaignService = { getCampaignConstants, listTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, previewTemplate, sendCampaign, getCustomers, renderTemplate,};
export default CampaignService;
