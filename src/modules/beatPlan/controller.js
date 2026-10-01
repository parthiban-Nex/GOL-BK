import db from '../index.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import BeatPlanService from './service.js';
import { Storage } from '@google-cloud/storage';

const ActivityPlan = db.activityPlan;
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

const addBeatPlan = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Beat Plan',
      action: ACTION_ADD,
    };

    const data = await BeatPlanService.addBeatPlan(req.body, req.user);

    auditData.message = 'Beat Plan added successfully';
    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(201).json({
      success: true,
      message: 'Beat Plan created successfully',
      data,
    });
  } catch (err) {
    logger.error('Beat Plan Controller addBeatPlan Error:', err);

    auditLog.createAuditLog(req, {
      menu_name: 'Beat Plan',
      action: ACTION_ADD,
      message: 'Beat Plan not added',
      result: 'failed',
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to create Beat Plan',
    });
  }
};


const getAllActivityPlans = async (req, res, next) => {
  try {

    const auditData = {};
    auditData['menu_name'] = 'Activity Plan';
    auditData['action'] = ACTION_GET;

    const data = await BeatPlanService.getAllActivityPlans();

    auditData['message'] = 'Activity Plan data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'Activity Plan';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch Activity Plan data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);

    logger.error('Activity Plan controller getAllActivityPlans Error:', err);
    next(err);
  }
};

const getAllBeatPlans = async (req, res, next) => {
  try {

    const auditData = {};
    auditData['menu_name'] = 'Beat Plan';
    auditData['action'] = ACTION_GET;

    const data = await BeatPlanService.getAllBeatPlans(req.user);

    auditData['message'] = 'Beat Plan data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'Beat Plan';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch Beat Plan data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);

    logger.error('Beat Plan controller getAllBeatPlans Error:', err);
    next(err);
  }
};

const getBeatPlanById = async (req, res, next) => {
  try {

    const auditData = {};
    auditData['menu_name'] = 'Beat Plan';
    auditData['action'] = ACTION_GET;

    const data = await BeatPlanService.getBeatPlanById(req.params.id, req.user);

    auditData['message'] = 'Beat Plan data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'Beat Plan';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch Beat Plan data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);

    logger.error('Beat Plan controller getBeatPlanById Error:', err);
    next(err);
  }
};


// const listNmsaAgents = async (req, res, next) => {
//   try {
//     const auditData = {};
//     auditData['menu_name'] = 'Nmsa';
//     auditData['action'] = ACTION_GET;
//     auditData['access'] = 'Portal';
//     auditData['message'] = 'Get NmsaAgent data ';
//     const data = await NmsaAgentService.listNmsaAgents(req.body);
//     if (data) {
//       auditData['result'] = 'success ';
//       auditLog.createAuditLog(req, auditData);
//       res.status(200).send({
//         requestSuccessful: true,
//         NmsaAgentsData: data,
//       });
//     } else {
//       auditData['result'] = 'failed ';
//       auditLog.createAuditLog(req, auditData);
//       res.status(200).send({
//         requestSuccessful: true,
//         ItemGroupData: data,
//       });
//     }
//   } catch (err) {
//     logger.error('NmsaAgent Controller listNmsaAgents Error:', err);
//     next(err);
//   }
// };

// const getOneNmsaAgent = async (req, res, next) => {
//   const auditData = {};
//   try {
//     auditData['menu_name'] = 'Nmsa';
//     auditData['action'] = ACTION_GET;
//     auditData['access'] = 'Portal';
//     auditData['message'] = `Get NmsaAgent data for ID: ${req.params.id}`;

//     const nmsaAgent = await NmsaAgentService.getOneNmsaAgent(req.params.id);

//     if (nmsaAgent) {
//       auditData['result'] = 'success';
//       auditLog.createAuditLog(req, auditData);

//       res.status(200).send({
//         requestSuccessful: true,
//         data: nmsaAgent,
//       });
//     } else {
//       auditData['result'] = 'failed';
//       auditLog.createAuditLog(req, auditData);

//       res.status(404).send({
//         requestSuccessful: false,
//         message: 'NmsaAgent not found',
//       });
//     }
//   } catch (err) {
//     auditData['result'] = 'error';
//     auditData['error_message'] = err.message;
//     auditLog.createAuditLog(req, auditData);

//     logger.error('NmsaAgent Controller getOneNmsaAgent Error:', err);
//     next(err);
//   }
// };

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

const addBeatPlanFranchiseUpdate = async (req, res, next) => {
  try {
    const auditData = {};
    auditData.menu_name = 'Beat Plan Franchise Update';
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
    const response = await BeatPlanService.addBeatPlanFranchiseUpdate(
      req.body,
      req.user
    );

    if (response.result === 'success') {
      auditData.message = 'Beat Plan Franchise Update added successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: true,
        message: 'Data Saved successfully',
        data: response.data,
      });
    }

    auditData.message = 'Beat Plan Franchise Update not added';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(500).send({
      success: false,
      message: 'Data not Saved',
    });
  } catch (err) {
    logger.error('Beat Plan Controller addBeatPlanFranchiseUpdate Error:', err);
    next(err);
  }
};

const getOneBeatPlanFranchiseUpdateById = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Beat Plan Franchise Update';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Beat Plan Franchise Update data By Id';
    const data = await BeatPlanService.getOneBeatPlanFranchiseUpdateById(req.body, req.user);
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
    logger.error('Beat Plan Controller getOneBeatPlanFranchiseUpdateById Error:', err);
    next(err);
  }
};


const controller = {
  getAllActivityPlans,
  addBeatPlan,
  getAllBeatPlans,
  getBeatPlanById,
  addBeatPlanFranchiseUpdate,
  getOneBeatPlanFranchiseUpdateById,
};

export default controller;
