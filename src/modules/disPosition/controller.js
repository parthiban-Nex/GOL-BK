import db from '../index.js';
import DisPositionService from './service.js';
import commonLogics from '../../shared/commonLogics.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import DispositionDao from "./dao.js"
const DisPosition = db.dispositions;
const Company = db.companies;

const addDisPosition = async (req, res, next) => {
  try {
    logger.info(
      'DisPosition Controller addDisPosition requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DisPosition';
    auditData['action'] = ACTION_ADD;
    let result = await DisPositionService.addDisPosition(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'DisPosition added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'DisPosition not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller addDisPosition Error:', err);
    next(err);
  }
};

const getAllDisPositions = async (req, res, next) => {
  try {
    const data = await DisPositionService.getAllDisPositions(
      req.user.outlet.companyId,
      req.user.roleid
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        DisPositionsData: data,
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller getAllDisPositions Error:', err);
    next(err);
  }
};

const getOneDisPosition = async (req, res, next) => {
  try {
    const disposition = await DisPositionService.getDisPosition(req.params.id);
    const resObj = {
      body: disposition,
      action: 'Disposition getone',
    };
    commonLogics.createCommonLog(req, resObj);
    res.status(200).send({
      requestSuccessful: true,
      data: disposition,
    });
  } catch (err) {
    logger.error('DisPosition Controller getOneDisPosition Error:', err);
    next(err);
  }
};

const updateDisPosition = async (req, res, next) => {
  try {
    logger.info(
      'DisPosition Controller updateDisPosition requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DisPosition';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await DisPositionService.updateDisPosition(
      id,
      req.body,
      req.user
    );
    if (result == 'success') {
      auditData['message'] = 'DisPosition Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'DisPosition not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'DisPosition not Updated',
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller updateDisPosition Error:', err);
    next(err);
  }
};

const listDisPositions = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'DisPosition';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get DisPosition data ';
    const data = await DisPositionService.listDisPositions(req.body);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        DisPositionsData: data,
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
    logger.error('DisPosition Controller listDisPositions Error:', err);
    next(err);
  }
};

const deleteDisPosition = async (req, res, next) => {
  try {
    const id = req.params.id;

    const disposition = await DisPositionService.getDisPosition(id);

    if (disposition) {
      let data = await DisPositionService.deleteDisPosition(id);
      const resObj = {
        body: data,
        action: 'Disposition delete',
      };
      commonLogics.createCommonLog(req, resObj);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller deleteDisPosition Error:', err);
    next(err);
  }
};

const bulkImportOnCsvFiles = async (req, res) => {
  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res
          .status(500)
          .send({ message: 'Error parsing form', error: err });
      }

      const csvFilePath = files.uploadFile.filepath;
      const jsonData = await csv().fromFile(csvFilePath);
      const inserts = jsonData.map(async (row) => {
        const company = await Company.findOne({ where: { code: row.code } });

        if (!company) {
          res
            .status(401)
            .send({ message: `${row.code} not found Please create a Company` });
        }
        if (row.disPositionCode) {
          DisPosition.findOne({
            where: { disPositionCode: row.disPositionCode },
          }).then(async (data) => {
            let reqBody = {
              title: row.title,
              disPositionCode: row.disPositionCode,
              disPositionType: row.disPositionType,
              status: row.status || 1,
              createdBy: req.user.id || 1,
            };
            await DisPositionService.addDisPosition(reqBody, req.user.id).then(
              async (dp) => {
                await DisPositionService.addDisPositionCompanyMap(
                  [company.id],
                  dp.id
                );
              }
            );
          });
        }
      });
      await Promise.all(inserts);
      res.status(200).send({ message: 'Import successful' });
    });
  } catch (err) {
    logger.error('DisPosition Controller bulkImportOnCsvFiles Error:', err);
    res.status(500).send({ message: 'Error importing', error: err });
  }
};

const getCustomerDisPositions = async (req, res, next) => {
  try {
    const data = await DispositionDao.getCustomerDisPositions(
      req.body
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        DisPositionsData: data,
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller getAllDisPositions Error:', err);
    next(err);
  }
};
const getDisPositionsByType = async (req, res, next) => {
  try {
    const data = await DispositionDao.getDisPositionsByType(
      req.body
    );
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        DisPositionsData: data,
      });
    }
  } catch (err) {
    logger.error('DisPosition Controller getDisPositionsByType Error:', err);
    next(err);
  }
};
const controller = {
  addDisPosition,
  getAllDisPositions,
  getOneDisPosition,
  updateDisPosition,
  deleteDisPosition,
  bulkImportOnCsvFiles,
  listDisPositions,
  getCustomerDisPositions,
  getDisPositionsByType
};

export default controller;
