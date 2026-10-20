import CampaignService from './service.js';
import logger from '../../config/logger.js';

const getConstants = async (req, res, next) => {
  try {
    const data = CampaignService.getCampaignConstants();
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller getConstants error:', err);
    next(err);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const data = await CampaignService.getCustomers(req.query, req.user);
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller getCustomers error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const data = await CampaignService.createTemplate(req.body);
    return res.status(201).json(data);
  } catch (err) {
    logger.error('Campaign Controller createTemplate error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const listTemplates = async (req, res, next) => {
  try {
    const data = await CampaignService.listTemplates(req.query);
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller listTemplates error:', err);
    next(err);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const data = await CampaignService.getTemplateById(req.params.id);
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller getTemplateById error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const data = await CampaignService.updateTemplate(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller updateTemplate error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await CampaignService.deleteTemplate(req.params.id);
    return res.status(204).send();
  } catch (err) {
    logger.error('Campaign Controller deleteTemplate error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const previewTemplate = async (req, res, next) => {
  try {
    const data = await CampaignService.previewTemplate(req.params.id, req.body || {});
    return res.status(200).json(data);
  } catch (err) {
    logger.error('Campaign Controller previewTemplate error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const sendCampaign = async (req, res, next) => {
  try {
    const data = await CampaignService.sendCampaign(req.body || {});
    return res.status(201).json(data);
  } catch (err) {
    logger.error('Campaign Controller sendCampaign error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const CampaignController = { getConstants, getCustomers, createTemplate, listTemplates, getTemplateById, updateTemplate, deleteTemplate, previewTemplate, sendCampaign, };
export default CampaignController;
