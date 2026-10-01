import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import RoughEstimate from './service.js';
import MobileApiTrackService from '../mobileApis/service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import PdfUtility from '../../shared/pdfUtility.js';
import db from '../index.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JobCard = db.jobCard;
const roughEstimateModel = db.roughEstimate;

const createRoughEstimate = async (req, res, next) => {
  try {
    let result = await RoughEstimate.createRoughEstimate(
      req.body,
      req.user
    );
    const auditData = {};

    auditData['menu_name'] = 'Transaction';
    auditData['submenu_name'] = 'Rough Estimate';
    if (result == 'success') {
      auditData['message'] =
        'Rough Estimate added for ' +
        req.body.registrationNumber +
        ' successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Rough Estimate not updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(500).send({
        requestSuccessful: false,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('Rough Estimate Controller createRoughEstimate:', err);
    next(err);
  }
};

const listRoughEstimate = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'Rough Estimate';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Rough Estimate data ';
    const data = await RoughEstimate.listRoughEstimate(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        RoughEstimateData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        RoughEstimateData: data,
      });
    }
  } catch (err) {
    logger.error('Rough Estimate controller listRoughEstimate', err);
    next(err);
  }
};

const updateRoughEstimate = async (req, res, next) => {


  try {
    logger.info(
      'Rough Estimate Controller updateRoughEstimate requestData: ' +
      JSON.stringify(req.body)
    );
    let result = await RoughEstimate.updateRoughEstimate(
      req.body,
      req.user
    );
    // console.log(result)
    //   return false;
    const auditData = {};
    auditData['menu_name'] = 'Transaction';
    auditData['submenu_name'] = 'Rough Estimate';
    if (result == 'success') {
      auditData['message'] =
        'Rough Estimate updated for ' +
        req.body.registrationNumber +
        ' successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Rough Estimate not updated';
      auditData['result'] = 'failed ';
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('Rough Estimate Controller updateRoughEstimate:', err);
    next(err);
  }
};

const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

const generatePDF = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Transactions',
      submenu_name: 'ServiceEstimate',
      action: ACTION_GET,
      access: 'Portal',
      message: 'GeneratePDF',
    };

    logger.info(
      'Rough Estimate Controller generatePDF requestData:' + req.query.id
    );
    const data = await RoughEstimate.getRoughEstimate(
      req.query.id,
      req.user.outlet
    );
    data['base64Logo'] = base64Logo;
    data['kiBase64Logo'] = kiBase64Logo;

    const pdfBuffer = await PdfUtility.generatePDF('roughestimate', data);

    if (pdfBuffer) {
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="estimate.pdf"'
      );
      res.send(pdfBuffer);
    } else {
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(500).send('Failed to generate PDF');
    }
  } catch (err) {
    logger.error('ServiceEstimate Controller generatePDF Error:', err);
    next(err);
  }
};

const controller = {
  createRoughEstimate,
  listRoughEstimate,
  updateRoughEstimate,
    generatePDF
};


export default controller;