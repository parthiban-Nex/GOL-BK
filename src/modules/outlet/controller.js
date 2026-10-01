import OutletService from './service.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PdfUtility from '../../shared/pdfUtility.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');


const addOutlet = async (req, res, next) => {
  try {
    logger.info(
      'Model Controller addOutlet requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Outlet';
    auditData['action'] = ACTION_ADD;
    const result = await OutletService.addOutlet(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Outlet added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Outlet not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Outlet Controller addOutlet Error:', err);
    next(err);
  }
};

const addReturnable = async (req, res) => {
  try {
    logger.info(
      ' Controller Returnable requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'transaction';
    auditData['submenu_name'] = 'Returnables';
    auditData['action'] = ACTION_ADD;
    const result = await OutletService.addReturnable(req.body, req.user,req.user.outlet);
    if (result == 'success') {
      auditData['message'] = 'Returnable Added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Returnable not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Outlet Controller addOutlet Error:', err);
    next(err);
  }
};

const listReturnable = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Transaction';
    auditData['submenu_name'] = 'Returnable';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Returnable data ';
    const data = await OutletService.listReturnable(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ReturnableData: data,
        state:req?.user?.outlet?.state,
        outletId:req?.user?.outlet?.id
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('Returnable Controller Error:', err);
    next(err);
  }
};

const returnablePDF = async (req, res, next) => {
 
    try {
        const auditData = {
            menu_name: 'Returnable ',
            submenu_name: 'Returnable PDF',
            action: ACTION_GET,
            access: 'Portal',
            message: 'GeneratePDF',
        };

        logger.info(
            'Returnable Controller generatePDF requestData:' + req.query.id
        );

        const data = await OutletService.returnablePDF(req.query.id, req.user.outlet,req.user);
        data['base64Logo'] = base64Logo;
        data['kiBase64Logo'] = kiBase64Logo;

        const pdfBuffer = await PdfUtility.generatePDF('returnableDetails', data);

        if (pdfBuffer) {
            auditData.result = 'success';
            auditLog.createAuditLog(req, auditData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="vehicleContract.pdf"'
            );
            res.send(pdfBuffer);
        } else {
            auditData.result = 'failed';
            auditLog.createAuditLog(req, auditData);
            res.status(500).send('Failed to generate PDF');
        }

    } catch (err) {
        logger.error('Vehicle controller vehicleContractPDF', err);
        next(err);
    }
}

const getAllOutlets = async (req, res, next) => {
  try {
    const data = await OutletService.getAllOutlets();
    res.status(200).send({
      requestSuccessful: true,
      OutletData: data,
    });
  } catch (err) {
    logger.error('Outlet Controller getAllOutlets Error:', err);
    next(err);
  }
};

const getOneOutlet = async (req, res, next) => {
  try {
    const outlet = await OutletService.getOutlet(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: outlet,
    });
  } catch (err) {
    logger.error('Outlet Controller getOneOutlet Error:', err);
    next(err);
  }
};

const updateOutlet = async (req, res, next) => {
  try {
    logger.info(
      'Model Controller updateOutlet requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Outlet';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await OutletService.updateOutlet(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Outlet Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Outlet not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Outlet not Updated',
      });
    }
  } catch (err) {
    logger.error('Outlet Controller updateOutlet Error:', err);
    next(err);
  }
};

const deleteOutlet = async (req, res, next) => {
  try {
    const id = req.params.id;

    const OutletExists = await OutletService.getOutlet(id);

    if (OutletExists) {
      let data = await OutletService.deleteOutlet(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Outlet Controller deleteOutlet Error:', err);
    next(err);
  }
};

const listOutlets = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Outlet';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Outlet data ';
    const data = await OutletService.listOutlets(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        OutletData: data,
        state:req?.user?.outlet?.state,
        outletId:req?.user?.outlet?.id
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('Outlet Controller listOutlets Error:', err);
    next(err);
  }
};

const listOutletsandWarehouse = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Outlet';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Outlet data ';
    const data = await OutletService.listOutletsandwarehouse(req.body,req.user.outlet.id);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        OutletData: data,
        state:req?.user?.outlet?.state,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('Outlet Controller listOutlets Error:', err);
    next(err);
  }
};

const listOutletsforstocktransferreq = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Outlet';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Outlet data ';
    const data = await OutletService.listOutletsforstocktransferreq(req.body,req.user.outlet.id);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        OutletData: data,
        state:req?.user?.outlet?.state,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ItemGroupData: data,
      });
    }
  } catch (err) {
    logger.error('Outlet Controller listOutlets Error:', err);
    next(err);
  }
};
const controller = {
  addOutlet,
  addReturnable,
  returnablePDF,
  listReturnable,
  getAllOutlets,
  getOneOutlet,
  updateOutlet,
  deleteOutlet,
  listOutlets,
  listOutletsandWarehouse,
  listOutletsforstocktransferreq
};

export default controller;
