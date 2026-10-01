import db from '../index.js';
import logger from '../../config/logger.js';
import auditLog from '../../shared/auditLog.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import FranchiseOnboardingService from './service.js';
import { Storage } from '@google-cloud/storage';

const FranchiseOnboarding = db.franchiseOnboarding;
const storage = new Storage({
  projectId: "prj-stag-gobumpr-service-6567",
  keyFilename: "prj-stag-gobumpr-service-6567.json",
});

const bucketName = "bkt-dearo-prod";
const bucket = storage.bucket(bucketName);

// Upload file to Google Cloud Storage
const uploadToBucket = async (file, folder = 'Franchise/Onboarding') => {
  const date = Date.now();
  const fileName = `${date}_${Math.random().toString(36).slice(2, 7)}_${file.originalname.replace(/\s/g, '_')}`;
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
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    // expires: Date.now() + 30 * 1000
  });

  return {
    url: publicUrl,
    signedUrl,
  };
};

// Generate signed URL for existing file
const generateSignedUrl = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes(bucketName)) {
    return null;
  }

  const filePath = fileUrl.split(`${bucketName}/`)[1];
  if (!filePath) return null;

  const blob = bucket.file(filePath);

  try {
    const [exists] = await blob.exists();
    if (!exists) return null;

    const [signedUrl] = await blob.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    return signedUrl;
  } catch (err) {
    logger.error('Error generating signed URL:', err);
    return null;
  }
};

// Check and regenerate signed URLs if expired
const checkAndRegenerateSignedUrls = async (franchiseData) => {
  const fieldsToCheck = [
    'aadhar_card',
    'gst_doc',
    'factory_license',
    'pcb_license',
    'fire_license',
    'property_license',
    'cancel_cheque',
    'signup_fee_doc'
  ];

  for (const field of fieldsToCheck) {
    const urlField = field;
    const signedUrlField = `${field}_signed_url`;

    if (franchiseData[urlField] && !franchiseData[signedUrlField]) {
      // Generate new signed URL
      const signedUrl = await generateSignedUrl(franchiseData[urlField]);
      if (signedUrl) {
        franchiseData[signedUrlField] = signedUrl;
      }
    } else if (franchiseData[signedUrlField]) {
      // Check if expired
      const isExpired = (signedUrl) => {
        if (!signedUrl || !signedUrl.includes('Expires=')) return true;
        const ts = parseInt(signedUrl.split('Expires=')[1].split('&')[0]) * 1000;
        return Date.now() > ts;
      };

      if (isExpired(franchiseData[signedUrlField])) {
        const signedUrl = await generateSignedUrl(franchiseData[urlField]);
        if (signedUrl) {
          franchiseData[signedUrlField] = signedUrl;
        }
      }
    }
  }

  return franchiseData;
};

const upsertFranchiseOnboarding = async (req, res, next) => {
  try {
    const auditData = {};
    auditData.menu_name = 'Franchise Onboarding';
    auditData.action = req.body.id ? ACTION_UPDATE : ACTION_ADD;

    console.log('Uploaded files:', req.files);

    const fileFields = [
      { fieldName: 'aadhar_card', formField: 'aadhar_card' },
      { fieldName: 'gst_doc', formField: 'gst_doc' },
      { fieldName: 'factory_license', formField: 'factory_license' },
      { fieldName: 'pcb_license', formField: 'pcb_license' },
      { fieldName: 'fire_license', formField: 'fire_license' },
      { fieldName: 'property_license', formField: 'property_license' },
      { fieldName: 'cancel_cheque', formField: 'cancel_cheque' },
      { fieldName: 'signup_fee_doc', formField: 'signup_fee_doc' }
    ];

    for (const { fieldName, formField } of fileFields) {
      const file = req.files?.find(f => f.fieldname === formField);
      if (file) {
        console.log(`Processing ${formField}:`, file.originalname);
        const uploaded = await uploadToBucket(file, `Franchise/Onboarding/${formField}`);
        req.body[fieldName] = uploaded.url;
        req.body[`${fieldName}_signed_url`] = uploaded.signedUrl;
        console.log(`${formField} uploaded to:`, uploaded.url);
      } else {
        console.log(`No file found for ${formField}`);
      }
    }

    const insuranceFiles = req.files?.filter(f => f.fieldname.startsWith('insurance_pdf_'));
    console.log('Insurance files found:', insuranceFiles?.length || 0);

    if (insuranceFiles && insuranceFiles.length > 0) {
      for (const insuranceFile of insuranceFiles) {
        console.log('Processing insurance file:', insuranceFile.fieldname);
        const insuranceId = insuranceFile.fieldname.replace('insurance_pdf_', '');
        const uploaded = await uploadToBucket(insuranceFile, `Franchise/Onboarding/Insurance`);
        req.body[`insurance_pdf_${insuranceId}`] = uploaded.url;
        req.body[`insurance_pdf_signed_url_${insuranceId}`] = uploaded.signedUrl;
        console.log(`Insurance ${insuranceId} uploaded to:`, uploaded.url);
      }
    }

    const feeFiles = req.files?.filter(
  f => f.fieldname.includes('payment_doc')
);

console.log('Fee payment files found:', feeFiles?.length || 0);

if (feeFiles && feeFiles.length > 0) {
  for (const feeFile of feeFiles) {
    console.log('Processing fee payment file:', feeFile.fieldname);

    const match = feeFile.fieldname.match(/fees\[(\d+)\]\[payment_doc\]/);

    if (match) {
      const feeIndex = match[1];

      const uploaded = await uploadToBucket(
        feeFile,
        `Franchise/Onboarding/Fees`
      );

      req.body.fees = req.body.fees || [];

      if (!req.body.fees[feeIndex]) {
        req.body.fees[feeIndex] = {};
      }

      req.body.fees[feeIndex].payment_doc = uploaded.url;
      req.body.fees[feeIndex].payment_doc_signed_url =
        uploaded.signedUrl;

      console.log(
        `Fee ${feeIndex} payment doc uploaded to:`,
        uploaded.url
      );
    }
  }
}

    console.log('Request body after file processing:', JSON.stringify(req.body, null, 2));

    if (req.body.id) {
      const existingFranchise = await FranchiseOnboarding.findByPk(req.body.id);
      if (existingFranchise) {
        const existingData = existingFranchise.toJSON();
        req.body = { ...existingData, ...req.body };
        req.body = await checkAndRegenerateSignedUrls(req.body);
      }
    }

    if (req.user) {
      req.body.outlet_id = req.user.outlet_id || req.user.id;
      req.body.createdBy = req.user.id;
      req.body.updatedBy = req.user.id;
    }

    const response = await FranchiseOnboardingService.upsertFranchiseOnboarding(
      req.body,
      req.user
    );

    if (response.result === 'success') {
      auditData.message = response.message;
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);

      return res.status(200).send({
        success: true,
        message: response.message,
        data: response.data,
      });
    }

    auditData.message = response.message || 'Franchise onboarding operation failed';
    auditData.result = 'failed';
    auditLog.createAuditLog(req, auditData);

    return res.status(500).send({
      success: false,
      message: response.message || 'Failed to save franchise onboarding data',
    });
  } catch (err) {
    logger.error('FranchiseOnboarding Controller upsertFranchiseOnboarding Error:', err);
    console.error('Detailed error:', err);
    next(err);
  }
};


const listFranchiseOnboardings = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Franchise Onboarding',
      action: ACTION_GET,
      access: 'Portal',
      message: 'Get Franchise Onboarding data'
    };

    const data = await FranchiseOnboardingService.listFranchiseOnboardings(
      req.body,
      req.user
    );

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      requestSuccessful: true,
      FranchiseOnboardingData: data
    });
  } catch (err) {
    logger.error('FranchiseOnboarding Controller list Error:', err);
    next(err);
  }
};

const listCombinedOnboardings = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Franchise Onboarding',
      action: ACTION_GET,
      access: 'Portal',
      message: 'Get combined Franchise and NMSA data'
    };

    const data = await FranchiseOnboardingService.listCombinedOnboardings(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      requestSuccessful: true,
      combinedData: data
    });
  } catch (err) {
    logger.error('Franchise Onboarding Controller Error:', err);
    next(err);
  }
};
const listCombinedOnboardingsHeader = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Franchise Onboarding',
      action: ACTION_GET,
      access: 'Portal',
      message: 'Get combined Franchise and NMSA data Header'
    };

    const data = await FranchiseOnboardingService.listCombinedOnboardingsHeader(req.body, req.user);

    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      requestSuccessful: true,
      combinedData: data
    });
  } catch (err) {
    logger.error('Franchise Onboarding Controller Error:', err);
    next(err);
  }
};

const getSingleFranchiseOnboardingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const auditData = {
      menu_name: 'Franchise Onboarding',
      action: ACTION_GET,
      access: 'Portal'
    };

    const data =
      await FranchiseOnboardingService.getSingleFranchiseOnboardingById(id);

    if (!data) {
      return res.status(404).send({
        success: false,
        message: 'Franchise onboarding not found'
      });
    }

    auditData.result = 'success';
    auditData.message = 'Franchise onboarding fetched successfully';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      data
    });
  } catch (err) {
    logger.error('Controller getSingleFranchiseOnboardingById Error:', err);
    next(err);
  }
};

const getAllFranchiseOnboardingDropdown = async (req, res, next) => {
  try {

    const auditData = {};
    auditData['menu_name'] = 'Garage Management';
    auditData['action'] = ACTION_GET;

    const data = await FranchiseOnboardingService.getAllFranchiseOnboardingDropdown();

    auditData['message'] = 'Franchise Onboarding dropdown data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      franchiseOnboardingDropdownData: data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'Garage Management';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch Franchise Onboarding dropdown data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);
    res.status(500).send({
      success: false,
      franchiseOnboardingDropdownData: null,
    });
    logger.error('Franchise Onboarding controller getAllFranchiseOnboardingDropdown Error:', err);
    next(err);
  }
};

const updateHandover = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Garage Management Management',
      action: ACTION_UPDATE,
    };
    const id = req.body.id;
    console.log('Update Handover Request Body:', req.body);
    const response = await FranchiseOnboardingService.updateHandover(id, req.body, req.user);
    console.log('Update Handover Response:', response);
    if (response.result === 'success') {
      auditData.message = 'Franchise Onboarding Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'Franchise Onboarding not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'Franchise Onboarding not Updated',
      });
    }
  } catch (err) {
    logger.error('Franchise Onboarding Controller updateHandover Error:', err);
    next(err);
  }
};

const updateAcceptOrReject = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Garage Management',
      action: ACTION_UPDATE,
    };
    const id = req.body.id;
    const response = await FranchiseOnboardingService.updateAcceptOrReject(id, req.body, req.user);

    if (response.result === 'success') {
      auditData.message = 'Franchise Onboarding Status Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'Franchise Onboarding Status not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'Franchise Onboarding Status not Updated',
      });
    }
  } catch (err) {
    logger.error('Franchise Onboarding Controller updateAcceptOrReject Error:', err);
    next(err);
  }
};

const getAllExistingFranchise = async (req, res, next) => {
  try {

    const auditData = {};
    auditData['menu_name'] = 'Garage Management';
    auditData['action'] = ACTION_GET;

    const data = await FranchiseOnboardingService.getAllExistingFranchise();

    auditData['message'] = 'Existing Franchise data fetched successfully';
    auditData['result'] = 'success';
    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      success: true,
      data,
    });
  } catch (err) {
    const auditData = {};
    auditData['menu_name'] = 'Garage Management';
    auditData['action'] = ACTION_GET;
    auditData['message'] = 'Failed to fetch Existing Franchise data';
    auditData['result'] = 'failed';
    auditLog.createAuditLog(req, auditData);

    logger.error('Franchise Onboarding controller getAllExistingFranchise Error:', err);
    next(err);
  }
};

const updateFeeApprove = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Garage Management Management',
      action: ACTION_UPDATE,
    };
    let id = req.body.id;

    if (id && typeof id === "object") {
      id = id.id;
    }
    console.log('Update Fee Approve Request Body:', req.body);
    const response = await FranchiseOnboardingService.updateFeeApprove(id, req.body, req.user);
    console.log('Update Fee Approve Response:', response);
    if (response.result === 'success') {
      auditData.message = 'Franchise Onboarding Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'Franchise Onboarding not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'Franchise Onboarding not Updated',
      });
    }
  } catch (err) {
    logger.error('Franchise Onboarding Controller updateFeeApprove Error:', err);
    next(err);
  }
};

const handleApproval = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Garage Management',
      action: ACTION_UPDATE,
    };
    const id = req.body.id;
    const response = await FranchiseOnboardingService.handleApproval(id, req.body, req.user);

    if (response.result === 'success') {
      auditData.message = 'Franchise Onboarding approval Updated successfully';
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData.message = 'Franchise Onboarding approval not Updated';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: false,
        message: 'Franchise Onboarding approval not Updated',
      });
    }
  } catch (err) {
    logger.error('Franchise Onboarding Controller handleApproval Error:', err);
    next(err);
  }
};


export default {
  upsertFranchiseOnboarding,
  listFranchiseOnboardings,
  getSingleFranchiseOnboardingById,
  listCombinedOnboardings,
  getAllFranchiseOnboardingDropdown,
  listCombinedOnboardingsHeader,
  updateHandover,
  updateAcceptOrReject,
  getAllExistingFranchise,
  updateFeeApprove,
  handleApproval
};