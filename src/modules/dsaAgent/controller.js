import db from '../index.js';
import DsaAgentService from './service.js';
import commonLogics from '../../shared/commonLogics.js';
import excel from 'exceljs';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';

const DsaAgent = db.dsaagents;

const addDsaAgent = async (req, res, next) => {
  try {
    logger.info(
      'DsaAgent Controller addDsaAgent requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DsaAgent';
    auditData['action'] = ACTION_ADD;
    let result = await DsaAgentService.addDsaAgent(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'DsaAgent added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'DsaAgent not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('DsaAgent Controller addDsaAgent Error:', err);
    next(err);
  }
};

const getAllDsaAgent = async (req, res, next) => {
  try {
    commonLogics.getPagenationQuery(req.query);
    const { offset, limit } = req.query;
    const data = await DsaAgent.findAndCountAll({
      where: {},
      offset,
      limit,
    });
    const resObj = {
      body: data,
      action: 'DsaAgent getall',
    };
    commonLogics.createCommonLog(req, resObj);
    if (data.count > 0) {
      return res.status(200).send({
        requestSuccessful: true,
        DsaagentData: data,
      });
    } else {
      return res.status(401).send({ message: 'data not exists' });
    }
  } catch (err) {
    logger.error('DsaAgent Controller getAllDsaAgent Error:', err);
    next(err);
  }
};

const getOneDsaAgent = async (req, res, next) => {
  try {
    const dsaAgent = await DsaAgentService.getDsaAgent(req.params.id);
    const resObj = {
      body: dsaAgent,
      action: 'DsaAgent getone',
    };
    commonLogics.createCommonLog(req, resObj);
    res.status(200).send({
      requestSuccessful: true,
      data: dsaAgent,
    });
  } catch (err) {
    logger.error('DsaAgent Controller getOneDsaAgent Error:', err);
    next(err);
  }
};

const updateDsaAgent = async (req, res, next) => {
  try {
    logger.info(
      'DsaAgent Controller updateDsaAgent requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DsaAgent';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await DsaAgentService.updateDsaAgent(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'DsaAgent Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'DsaAgent not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'DsaAgent not Updated',
      });
    }
  } catch (err) {
    logger.error('DsaAgent Controller updateDsaAgent Error:', err);
    next(err);
  }
};

const deleteDsaAgent = async (req, res, next) => {
  try {
    const id = req.params.id;

    const DsaAgentExists = await DsaAgentService.getDsaAgent(id);

    if (DsaAgentExists) {
      let data = await DsaAgentService.deleteDsaAgent(id);
      const resObj = {
        body: data,
        action: 'DsaAgent delete',
      };
      commonLogics.createCommonLog(req, resObj);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('DsaAgent Controller addDsaAgent Error:', err);
    next(err);
  }
};

const bulkImportOnCsvFilesDSAAgent = async (req, res) => {
  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        throw new Error(err);
      }

      const csvFilePath = files.uploadFile.filepath;
      const jsonData = await csv().fromFile(csvFilePath);

      const insertData = jsonData.map((dsaAgent) => ({
        DsaCode: dsaAgent.DsaCode,
        DSAName: dsaAgent.DSAName,
        address1: dsaAgent.address1,
        address2: dsaAgent.address2,
        pincode: dsaAgent.pincode,
        whatsapp: dsaAgent.whatsapp,
        state: dsaAgent.state,
        city: dsaAgent.city,
        email: dsaAgent.email,
        mobileNumber: dsaAgent.mobileNumber,
        alternativeMobileNumber: dsaAgent.alternativeMobileNumber,
        panNo: dsaAgent.panNo,
        bankName: dsaAgent.bankName,
        branchName: dsaAgent.branchName,
        ifscCode: dsaAgent.ifscCode,
        accountNumber: dsaAgent.accountNumber,
        dsaManagedBy: dsaAgent.dsaManagedBy,
        sourceOfTheDSA: dsaAgent.sourceOfTheDSA,
        status: dsaAgent.status ? dsaAgent.status : 1,
        createdBy: dsaAgent.createdBy ? dsaAgent.createdBy : 1,
      }));

      await DsaAgent.bulkCreate(insertData);
      res.status(200).send({ message: 'Imported successfully' });
    });
  } catch (err) {
    logger.error('DsaAgent Controller addDsaAgent Error:', err);
    res.status(500).send({ message: 'Error importing', error: err });
  }
};

const downloadXlsxFile = async (req, res, next) => {
  try {
    const dsaAgents = await DsaAgentService.getAllDsaAgent();

    const rows = dsaAgents.map((agent) => ({
      DsaCode: agent.dataValues.DsaCode,
      DSAName: agent.dataValues.DSAName,
      address1: agent.dataValues.address1,
      address2: agent.dataValues.address2,
      whatsapp: agent.dataValues.whatsapp,
      pincode: agent.dataValues.pincode,
      state: agent.dataValues.state,
      city: agent.dataValues.city,
      email: agent.dataValues.email,
      mobileNumber: agent.dataValues.mobileNumber,
      alternativeMobileNumber: agent.dataValues.alternativeMobileNumber,
      panNo: agent.dataValues.panNo,
      bankName: agent.dataValues.bankName,
      branchName: agent.dataValues.branchName,
      ifscCode: agent.dataValues.ifscCode,
      accountNumber: agent.dataValues.accountNumber,
      dsaManagedBy: agent.dataValues.dsaManagedBy,
      sourceOfTheDSA: agent.dataValues.sourceOfTheDSA,
      status: agent.dataValues.status,
    }));

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet('DsaAgents');

    worksheet.columns = [
      { header: 'DsaCode', key: 'DsaCode', width: 20 },
      { header: 'DSAName', key: 'DSAName', width: 20 },
      { header: 'Address1', key: 'address1', width: 35 },
      { header: 'Address2', key: 'address2', width: 20 },
      { header: 'Whatsapp', key: 'whatsapp', width: 20 },
      { header: 'Pincode', key: 'pincode', width: 20 },
      { header: 'State', key: 'state', width: 25 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'MobileNumber', key: 'mobileNumber', width: 20 },
      {
        header: 'AlternativeMobileNumber',
        key: 'alternativeMobileNumber',
        width: 25,
      },
      { header: 'panNo', key: 'panNo', width: 20 },
      { header: 'BankName', key: 'bankName', width: 20 },
      { header: 'BranchName', key: 'branchName', width: 20 },
      { header: 'ifscCode', key: 'ifscCode', width: 30 },
      { header: 'AccountNumber', key: 'accountNumber', width: 20 },
      { header: 'DsaManagedBy', key: 'dsaManagedBy', width: 30 },
      { header: 'SourceOfTheDSA', key: 'sourceOfTheDSA', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    worksheet.addRows(rows);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'dsaagents.xlsx'
    );

    return workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const listDsaAgents = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DsaAgent';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get DsaAgent data ';
    const data = await DsaAgentService.listDsaAgents(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        DsaAgentsData: data,
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
    logger.error('DsaAgent Controller listDsaAgents Error:', err);
    next(err);
  }
};

const getAllBanks = async (req, res, next) => {
  try {
    const data = await DsaAgentService.getAllBanks();
    res.status(200).send({
      requestSuccessful: true,
      BankData: data,
    });
  } catch (err) {
    logger.error('DsaAgent Controller getAllBanks Error:', err);
    next(err);
  }
};

const getAllDsaAgents = async (req, res, next) => {
  try {
    const data = await DsaAgentService.getAllDsaAgents(
      req.user.outlet.companyId,
      req.user.roleid
    );
    res.status(200).send({
      requestSuccessful: true,
      DsaAgentsData: data,
    });
  } catch (err) {
    logger.error('DsaAgent Controller getAllDsaAgents Error:', err);
    next(err);
  }
};

const controller = {
  addDsaAgent,
  getAllDsaAgent,
  getOneDsaAgent,
  updateDsaAgent,
  deleteDsaAgent,
  bulkImportOnCsvFilesDSAAgent,
  downloadXlsxFile,
  listDsaAgents,
  getAllBanks,
  getAllDsaAgents,
};

export default controller;
