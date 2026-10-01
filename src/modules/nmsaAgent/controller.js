import db from '../index.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import NmsaAgentService from './service.js';
import { Storage } from '@google-cloud/storage';

const NmsaAgent = db.nmsaAgents;
    const storage = new Storage({
      projectId: "prj-stag-gobumpr-service-6567",
      keyFilename: "prj-stag-gobumpr-service-6567.json",
    });

    const bucketName = "bkt-dearo-prod";
    const bucket = storage.bucket(bucketName);

const uploadToBucket = async (file, folder = 'NMSA/Images') => {
  const date = Date.now();
  const fileName =
    `${date}_${Math.random().toString(36).slice(2, 7)}_${file.originalname.replace(/\s/g, '_')}`;

  const filePath = `${folder}/${fileName}`;
  const blob = bucket.file(filePath);

  await new Promise((resolve, reject) => {
    const stream = blob.createWriteStream({ resumable: false });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(file.buffer);
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

  const [signedUrl] = await blob.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  return {
    url: publicUrl,
    signedUrl,
  };
};

const addNmsaAgent = async (req, res, next) => {
  try {
    const auditData = {};
    auditData.menu_name = 'NMSA Lead Management';
    auditData.action = ACTION_ADD;
        if (req.files) {
      if (req.files.image1?.[0]) {
        const uploaded = await uploadToBucket(req.files.image1[0]);
        req.body.image1 = uploaded.url;
        req.body.image1_signed_url = uploaded.signedUrl;
      }

      if (req.files.image2?.[0]) {
        const uploaded = await uploadToBucket(req.files.image2[0]);
        req.body.image2 = uploaded.url;
        req.body.image2_signed_url = uploaded.signedUrl;
      }
    }
    const response = await NmsaAgentService.addNmsaAgent(
      req.body,
      req.user
    );

    if (response.result === 'success') {
      auditData.message = 'NMSA agent added successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: true,
        message: 'Data Saved successfully',
        data: response.data, 
      });
    }

    auditData.message = 'NMSA agent not added';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(500).send({
      success: false,
      message: 'Data not Saved',
    });
  } catch (err) {
    logger.error('Nmsa Agent Controller addNmsaAgent Error:', err);
    next(err);
  }
};


const addNmsaAgentMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData.menu_name = 'NMSA Lead Management';
    auditData.action = ACTION_ADD;
    if (req.files) {
      if (req.files.image1?.[0]) {
        const uploaded = await uploadToBucket(req.files.image1[0]);
        req.body.image1 = uploaded.url;
        req.body.image1_signed_url = uploaded.signedUrl;
      }

      if (req.files.image2?.[0]) {
        const uploaded = await uploadToBucket(req.files.image2[0]);
        req.body.image2 = uploaded.url;
        req.body.image2_signed_url = uploaded.signedUrl;
      }
    }
    const response = await NmsaAgentService.addNmsaAgentMobile(
      req.body,
      req.user
    );

    if (response.result === 'success') {
      auditData.message = 'NMSA agent (mobile) added successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: true,
        message: 'Data Saved successfully',
        data: response.data,
      });
    }

    auditData.message = 'NMSA agent (mobile) not added';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(500).send({
      success: false,
      message: 'Data not Saved',
    });
  } catch (err) {
    logger.error('Nmsa Agent Controller addNmsaAgentMobile Error:', err);
    next(err);
  }
};

const getAllNmsaDropdown = async (req, res, next) => {
  try {
    logger.info(
      'Nmsa Agent Controller getAllNmsaDropdown request'
    );

    const auditData = {};
    auditData['menu_name'] = 'NMSA Lead Management';
    auditData['action'] = ACTION_GET;

    const data = await NmsaAgentService.getAllNmsaDropdown();

    auditData['message'] = 'NMSA dropdown data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      nmsaDropdownData: data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'NMSA Lead Management';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch NMSA dropdown data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);
    res.status(500).send({
      success: false,
      nmsaDropdownData: null,
    });
    logger.error('Nmsa Agent controller getAllNmsaDropdown Error:', err);
    next(err);
  }
};


const listNmsaAgents = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get NmsaAgent data ';
    const data = await NmsaAgentService.listNmsaAgents(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        NmsaAgentsData: data,
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
    logger.error('NmsaAgent Controller listNmsaAgents Error:', err);
    next(err);
  }
};

const listNmsaAgentsByPlanId = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get NmsaAgent data By Plan Id';
    const data = await NmsaAgentService.listNmsaAgentsByPlanId(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        NmsaAgentsData: data,
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
    logger.error('NmsaAgent Controller listNmsaAgentsByPlanId Error:', err);
    next(err);
  }
};

const getOneNmsaAgent = async (req, res, next) => {
  const auditData = {};
  try {
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = `Get NmsaAgent data for ID: ${req.params.id}`;

    const nmsaAgent = await NmsaAgentService.getOneNmsaAgent(req.params.id);

    if (nmsaAgent) {
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);

      res.status(200).send({
        requestSuccessful: true,
        data: nmsaAgent,
      });
    } else {
      auditData['result'] = 'failed';
      auditLog.createAuditLog(req, auditData);

      res.status(404).send({
        requestSuccessful: false,
        message: 'NmsaAgent not found',
      });
    }
  } catch (err) {
    auditData['result'] = 'error';
    auditData['error_message'] = err.message;
    auditLog.createAuditLog(req, auditData);

    logger.error('NmsaAgent Controller getOneNmsaAgent Error:', err);
    next(err);
  }
};

// const updateNmsaAgent = async (req, res, next) => {
//   try {
//     const auditData = {};
//     auditData['menu_name'] = 'Nmsa Lead Management';
//     auditData['action'] = ACTION_UPDATE;
//     const id = req.body.id;
//     const response = await NmsaAgentService.updateNmsaAgent(id, req.body, req.user);
//     if (response.result === 'success') {
//       auditData['message'] = 'NmsaAgent Updated successfully ';
//       auditData['result'] = 'success';
//       auditLog.createAuditLog(req, auditData);
//       res.status(200).send({
//         requestSuccessful: true,
//         message: 'Data updated successfully',
//       });
//     } else {
//       auditData['message'] = 'NmsaAgent not Updated';
//       auditData['result'] = 'failed ';
//       auditLog.createAuditLog(req, auditData);
//       return res.status(200).send({
//         requestSuccessful: false,
//         message: 'NmsaAgent not Updated',
//       });
//     }
//   } catch (err) {
//     logger.error('NmsaAgent Controller updateNmsaAgent Error:', err);
//     next(err);
//   }
// };

const updateNmsaAgent = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Nmsa Lead Management',
      action: ACTION_UPDATE,
    };
    const id = req.body.id;

    if (req.files) {
      if (req.files.image1?.[0]) {
        const uploaded = await uploadToBucket(req.files.image1[0]);
        req.body.image1 = uploaded.url;
        req.body.image1_signed_url = uploaded.signedUrl;
      }
      if (req.files.image2?.[0]) {
        const uploaded = await uploadToBucket(req.files.image2[0]);
        req.body.image2 = uploaded.url;
        req.body.image2_signed_url = uploaded.signedUrl;
      }
    }

    const response = await NmsaAgentService.updateNmsaAgent(id, req.body, req.user);

    if (response.result === 'success') {
      auditData.message = 'NmsaAgent Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'NmsaAgent not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'NmsaAgent not Updated',
      });
    }
  } catch (err) {
    logger.error('NmsaAgent Controller updateNmsaAgent Error:', err);
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get dashboard data ';
    const data = await NmsaAgentService.getDashboard(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        NmsaAgentsData: data,
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
    logger.error('NmsaAgent Controller getDashboard Error:', err);
    next(err);
  }
};


const updateNmsaAgentMobile = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Nmsa Lead Management',
      action: ACTION_UPDATE,
    };
    const id = req.body.id;

    if (req.files) {
      if (req.files.image1?.[0]) {
        const uploaded = await uploadToBucket(req.files.image1[0]);
        req.body.image1 = uploaded.url;
        req.body.image1_signed_url = uploaded.signedUrl;
      }
      if (req.files.image2?.[0]) {
        const uploaded = await uploadToBucket(req.files.image2[0]);
        req.body.image2 = uploaded.url;
        req.body.image2_signed_url = uploaded.signedUrl;
      }
    }

    const response = await NmsaAgentService.updateNmsaAgentMobile(id, req.body, req.user);

    if (response.result === 'success') {
      auditData.message = 'NmsaAgent (mobile) Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'NmsaAgent (mobile) not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'NmsaAgent not Updated',
      });
    }
  } catch (err) {
    logger.error('NmsaAgent Controller updateNmsaAgentMobile Error:', err);
    next(err);
  }
};

const listNmsaAgentsMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';
    auditData['message'] = 'Get NmsaAgent data (mobile)';
    const data = await NmsaAgentService.listNmsaAgentsMobile(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        NmsaAgentsData: data,
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
    logger.error('NmsaAgent Controller listNmsaAgentsMobile Error:', err);
    next(err);
  }
};

const getOneNmsaAgentMobile = async (req, res, next) => {
  const auditData = {};
  try {
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';
    auditData['message'] = `Get NmsaAgent data (mobile) for ID: ${req.params.id}`;

    const nmsaAgent = await NmsaAgentService.getOneNmsaAgentMobile(req.params.id);

    if (nmsaAgent) {
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);

      res.status(200).send({
        requestSuccessful: true,
        data: nmsaAgent,
      });
    } else {
      auditData['result'] = 'failed';
      auditLog.createAuditLog(req, auditData);

      res.status(404).send({
        requestSuccessful: false,
        message: 'NmsaAgent not found',
      });
    }
  } catch (err) {
    auditData['result'] = 'error';
    auditData['error_message'] = err.message;
    auditLog.createAuditLog(req, auditData);

    logger.error('NmsaAgent Controller getOneNmsaAgentMobile Error:', err);
    next(err);
  }
};

const listNmsaAgentsByPlanIdMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Nmsa';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';
    auditData['message'] = 'Get NmsaAgent data By Plan Id (mobile)';
    const data = await NmsaAgentService.listNmsaAgentsByPlanIdMobile(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        NmsaAgentsData: data,
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
    logger.error('NmsaAgent Controller listNmsaAgentsByPlanIdMobile Error:', err);
    next(err);
  }
};

const controller = {
  addNmsaAgent,
  addNmsaAgentMobile,
  getAllNmsaDropdown,
  listNmsaAgents,
  getOneNmsaAgent,
  updateNmsaAgent,
  updateNmsaAgentMobile,
  listNmsaAgentsByPlanId,
  getDashboard,
  listNmsaAgentsMobile,
  getOneNmsaAgentMobile,
  listNmsaAgentsByPlanIdMobile,
};

export default controller;
