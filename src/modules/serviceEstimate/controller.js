import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import ServiceEstimate from './service.js';
import MobileApiTrackService from '../mobileApis/service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import PdfUtility from '../../shared/pdfUtility.js';
import db from '../index.js'
import { Storage } from '@google-cloud/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JobCard = db.jobCard;
const serviceEstimateModel = db.servicEstimates;

const createServiceEstimate = async (req, res, next) => {
  try {
    let result = await ServiceEstimate.createServiceEstimate(
      req.body,
      req.user
    );
    const auditData = {};

    auditData['menu_name'] = 'Transaction';
    auditData['submenu_name'] = 'Service Estimate';
    if (result?.result === 'success' || result === 'success') {
      auditData['message'] =
        'Service Estimate added for ' +
        req.body.registrationNumber +
        ' successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
        estimateId: result.estimateId,
        serviceEstimateNumber: result.serviceEstimateNumber,
        customerId: req.body.customerId,
        vehicleId: req.body.vehicleId,
      });
    } else {
      auditData['message'] = 'Service Estimate not updated';
      auditData['result'] = 'failed ';
      auditData['action'] = 'Add';
      auditLog.createAuditLog(req, auditData);
      return res.status(500).send({
        requestSuccessful: false,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('Service Estimate Controller createServiceEstimate:', err);
    next(err);
  }
};

const searchEstimateLineItems = async (req, res, next) => {
  try {
    const results = await ServiceEstimate.searchEstimateLineItems(
      req.body.searchQuery,
      req.user
    );
    return res.status(200).json({
      requestSuccessful: true,
      searchQuery: req.body.searchQuery,
      results,
    });
  } catch (err) {
    logger.error('Service Estimate Controller searchEstimateLineItems:', err);
    next(err);
  }
};

const getEstimateLineItemDetails = async (req, res, next) => {
  try {
    const result = await ServiceEstimate.getEstimateLineItemDetails(req.body, req.user);
    return res.status(200).json({
      requestSuccessful: true,
      ...result,
    });
  } catch (err) {
    logger.error('Service Estimate Controller getEstimateLineItemDetails:', err);
    next(err);
  }
};

const createServiceEstimateMobile = async (req, res, next) => {
  try {
    const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Service Estimate Mobile Create';
    auditData['action'] = ACTION_ADD;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if (usId === req.body.userId) {
      let data = await ServiceEstimate.createServiceEstimateMobile(
        req.body,
        req.user
      );

      if (trackLogId) {
        await MobileApiTrackService.updateMobileApiRes(trackLogId, data);
      }

      if (data.result === "success") {
        auditData['message'] = 'From Mobile_API Service Estimate added successfully';
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);

        return res.status(200).send({
          requestSuccessful: true,
          message: 'Service Estimate Saved Sucessfully',
          serviceEstimateDetail: data.serviceEstimateDetail.toString(),
          serviceEstimateNumber: data.serviceEstimateNumber,
          laborEstimate: data.laborEstimate,
          oslLaborSchedules: data.oslLaborSchedules,
          partEstimates: data.partEstimates
        });
      } else if (data.result === "Error") {
        return res.status(500).send({
          requestSuccessful: false,
          message: data.message,
        });
      } else {
        auditData['message'] = 'From Mobile_API Service Estimate not added';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        if (trackLogId) {
          await MobileApiTrackService.updateMobileApiRes(trackLogId, data);
        }

        return res.status(500).send({
          requestSuccessful: false,
          message: 'Data not updated ',
        });
      }
    } else {
      auditData['message'] = 'From Mobile_API Service Estimate not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Service Estimate Controller createServiceEstimate:', err);
    next(err);
  }
};


const updateServiceEstimate = async (req, res, next) => {


  try {
    logger.info(
      'Service Estimate Controller updateServiceEstimate requestData: ' +
      JSON.stringify(req.body)
    );
    let result = await ServiceEstimate.updateServiceEstimate(
      req.body,
      req.user
    );
    // console.log(result)
    //   return false;
    const auditData = {};
    auditData['menu_name'] = 'Transaction';
    auditData['submenu_name'] = 'Service Estimate';
    if (result == 'success' || result?.result === 'success') {
      auditData['message'] =
        'Service Estimate updated for ' +
        req.body.registrationNumber +
        ' successfully ';
      auditData['result'] = 'success ';
      auditData['action'] = 'Update';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
        ...(result?.estimateData ? { estimateData: result.estimateData } : {}),
      });
    } else {
      auditData['message'] = 'Service Estimate not updated';
      auditData['result'] = 'failed ';
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('Service Estimate Controller updateServiceEstimate:', err);
    next(err);
  }
};

const updateServiceEstimateMobile = async (req, res, next) => {
  try {
    const auditData = {};
    const trackLogId = await MobileApiTrackService.createMobileApiReq(req, req.user);
    logger.info(
      'Service Estimate Controller updateServiceEstimateMobile requestData: ' +
      JSON.stringify(req.body)
    );
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Service Estimate Mobile Update';
    auditData['action'] = ACTION_UPDATE;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if (usId === req.body.userId) {
      let data = await ServiceEstimate.updateServiceEstimateMobile(
        req.body,
        req.user
      );

      if (trackLogId) {
        await MobileApiTrackService.updateMobileApiRes(trackLogId, data);
      }

      if (data.result === "success") {
        auditData['message'] = 'From Mobile_API Service Estimate updated successfully';
        auditData['result'] = 'success';
        auditLog.createAuditLog(req, auditData);

        if (data.insert) {
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Service Estimate Updated Sucessfully',
          });
        } else {
          return res.status(200).send({
            requestSuccessful: true,
            message: 'Service Estimate Updated Sucessfully',
            estimateId: data.serviceEstimateDetail.toString(),
            laborEstimate: data.laborEstimate,
            oslLaborSchedules: data.oslLaborSchedules,
            partEstimates: data.partEstimates
          });
        }

      } else {
        auditData['message'] = 'From Mobile_API Service Estimate not updated';
        auditData['result'] = 'failed';
        auditLog.createAuditLog(req, auditData);

        return res.status(500).send({
          requestSuccessful: true,
          message: 'Data not updated ',
        });
      }
    } else {
      auditData['message'] = 'From Mobile_API Service Estimate not updated';
      auditData['result'] = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Service Estimate Controller updateServiceEstimateMobile:', err);
    next(err);
  };
};

const listServiceEstimate = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Transactions';
    auditData['submenu_name'] = 'ServiceEstimate';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get ServiceEstimate data ';
    const data = await ServiceEstimate.listServiceEstimate(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ServiceEstimateData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ServiceEstimateData: data,
      });
    }
  } catch (err) {
    logger.error('ServiceBooking controller listServiceBookings', err);
    next(err);
  }
};

const getServiceEstimate = async (req, res, next) => {
  try {
    const data = await ServiceEstimate.getServiceEstimate(
      req.query.id,
      req.user.outlet
    );
    res.status(200).send({
      requestSuccessful: true,
      data: data,
    });
  } catch (err) {
    logger.error('ServiceEstimate Controller getServiceEstimate Error:', err);
    next(err);
  }
};

const logoPath = path.join(__dirname, '..', '..', 'shared', 'mytvslogo.png');
const base64Logo = fs.readFileSync(logoPath).toString('base64');
const kiLogoPath = path.join(__dirname, '..', '..', 'shared', 'Ki_Logo.png');
const kiBase64Logo = fs.readFileSync(kiLogoPath).toString('base64');

const uploadEstimatePdfToGcs = async (estimateId, outletId, pdfBuffer) => {
  const projectId = 'prj-stag-gobumpr-service-6567';
  const bucketName = 'bkt-dearo-prod';
  const storageOptions = { projectId };
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    storageOptions.keyFilename = path.resolve(
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
  }
  const storage = new Storage(storageOptions);
  const objectName = `gol/ServiceEstimate/${outletId}/${estimateId}/estimate.pdf`;
  const file = storage.bucket(bucketName).file(objectName);

  console.log('[Estimate PDF] GCS upload started', { estimateId, outletId, objectName });
  await new Promise((resolve, reject) => {
    const uploadStream = file.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'no-cache, max-age=0',
      },
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    uploadStream.end(pdfBuffer);
  });
  console.log('[Estimate PDF] GCS upload completed', { estimateId, objectName });

  console.log('[Estimate PDF] Signed URL generation started', { estimateId, objectName });
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  console.log('[Estimate PDF] Signed URL generated', { estimateId, expiresInDays: 7 });

  return { objectName, signedUrl };
};

const generateAndUploadEstimatePdf = async (estimateId, outlet) => {
  console.log('[Estimate PDF] Loading estimate data', { estimateId });
  const data = await ServiceEstimate.getServiceEstimate(estimateId, outlet);
  console.log('[Estimate PDF] Estimate data loaded', { estimateId });
  data.base64Logo = base64Logo;
  data.kiBase64Logo = kiBase64Logo;
  console.log('[Estimate PDF] Rendering PDF', { estimateId });
  const pdfBuffer = await PdfUtility.generatePDF('estimate', data);
  if (!pdfBuffer) {
    throw new Error('Failed to generate PDF');
  }
  console.log('[Estimate PDF] PDF rendered', { estimateId, sizeBytes: pdfBuffer.length });

  const storedPdf = await uploadEstimatePdfToGcs(estimateId, outlet.id, pdfBuffer);
  console.log('[Estimate PDF] Generation and upload completed', { estimateId, objectName: storedPdf.objectName });
  return { pdfBuffer, storedPdf };
};

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
      'ServiceEstimate Controller generatePDF requestData:' + req.query.id
    );
    const { pdfBuffer, storedPdf } = await generateAndUploadEstimatePdf(
      req.query.id,
      req.user.outlet
    );

    if (pdfBuffer) {
      auditData.result = 'success';
      auditLog.createAuditLog(req, auditData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="estimate.pdf"'
      );
      res.setHeader('X-Estimate-Pdf-Url', storedPdf.signedUrl);
      res.setHeader('X-Estimate-Pdf-Object', storedPdf.objectName);
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Estimate-Pdf-Url, X-Estimate-Pdf-Object'
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

const shareEstimateOnWhatsApp = async (req, res, next) => {
  try {
    const estimateId = Number(req.body.estimateId);
    const estimate = await ServiceEstimate.getEstimateShareDetails(
      estimateId,
      req.user.outlet.id
    );
    if (!estimate) {
      return res.status(404).json({
        requestSuccessful: false,
        message: 'Service estimate not found',
      });
    }

    const mobile = String(
      estimate.decryptedCustomerMobileNumber || estimate.customer?.decryptedMobileNumber || ''
    ).replace(/\D/g, '');
    if (!mobile) {
      return res.status(400).json({
        requestSuccessful: false,
        message: 'Customer mobile number is not available for this estimate',
      });
    }

    const { storedPdf } = await generateAndUploadEstimatePdf(estimateId, req.user.outlet);
    const whatsappMobile = mobile.startsWith('91') && mobile.length === 12
      ? mobile
      : `91${mobile}`;
    const message = `Hi, Please find the estimate for your vehicle (Vehicle No: ${estimate.registrationNumber}) in the link below for your reference: ${storedPdf.signedUrl}`;
    const whatsappUrl = `https://wa.me/${whatsappMobile}?text=${encodeURIComponent(message)}`;

    return res.status(200).json({
      requestSuccessful: true,
      estimateId,
      pdfUrl: storedPdf.signedUrl,
      whatsappUrl,
      message,
    });
  } catch (err) {
    logger.error('ServiceEstimate Controller shareEstimateOnWhatsApp Error:', err);
    next(err);
  }
};

const approveServiceEstimate = async (req, res, next) => {
  try {
    const approvedAt = new Date();
    const updatedCount = await ServiceEstimate.approveServiceEstimate(
      Number(req.body.estimateId),
      req.user,
      approvedAt
    );
    if (!updatedCount) {
      return res.status(404).json({
        requestSuccessful: false,
        message: 'Service estimate not found',
      });
    }

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Service estimate approved successfully',
      estimateId: Number(req.body.estimateId),
      estimateApproved: true,
      estimateApprovedBy: req.user.id,
      estimateApprovedByName: req.user.employeeName || req.user.employeeCode || null,
      estimateApprovedAt: approvedAt.toISOString(),
    });
  } catch (err) {
    logger.error('ServiceEstimate Controller approveServiceEstimate Error:', err);
    next(err);
  }
};

const getOpenEstimates = async (req, res, next) => {
  try {
    const data = await ServiceEstimate.getOpenEstimates(req.user);
    res.status(200).send({
      requestSuccessful: true,
      OpenEstimatesData: data,
    });
  } catch (err) {
    logger.error('ServiceEstimate Controller getOpenEstimates Error:', err);
    next(err);
  }
};

const getServiceEstimateMobile = async (req, res, next) => {
  try {
    const auditData = {};
    let data;
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Service Estimate Mobile Get';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if (usId === req.body.userId) {
      const serviceEstimteId = await JobCard.findOne({
        where: { id: req.body.VISIT_ID },
        attributes: ['service_estimate_id', 'id', 'fit_status'],
        include: [{
          model: serviceEstimateModel,
          as: "serviceEstimateDetails",
          attributes: ['expectedWorkCompletedDate','id'],
        }],
        raw: true,
        nest: true
      });

      if (serviceEstimteId) {
        req.body.estimateId = serviceEstimteId.service_estimate_id;
      } else if (req.body.estimateId) {
        req.body.estimateId = req.body.estimateId;
      } else {
        res.status(400).send({
          requestSuccessful: false,
          message: "Service Estimate Id is not found"
        });
      }

      if (serviceEstimteId.fit_status == "INITIAL_ESTIMATE_PENDING" ||
        serviceEstimteId.fit_status == "INITIAL_ESTIMATION_IN_PROGRESS" ||
        serviceEstimteId.fit_status == "INITIAL_ESTIMATION_PROVIDED") {
        data = await ServiceEstimate.getServiceEstimateMobile(req.body);
      } else {
        data = await ServiceEstimate.getServiceEstimateMobileApproved(req.body);
      }
      if (data.result === "success" && data.message === "Yes") {
        auditData['message'] = 'From Mobile_API Service Estimate fetched successfully';
        auditData['result'] = 'success';
        auditLog.createAuditLog(req, auditData);

        res.status(200).send({
          requestSuccessful: true,
          expectedCompletionDate: serviceEstimteId.serviceEstimateDetails.expectedWorkCompletedDate,
          estimateId: serviceEstimteId.serviceEstimateDetails.id,
          Estimation: data.Estimation,
        });
      } else if (data.result === "success" && data.message === "No") {
        auditData['message'] = 'From Mobile_API Service Estimate fetched successfully';
        auditData['result'] = 'success';
        auditLog.createAuditLog(req, auditData);

        res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "No Estimates Found"
        });
      }
    } else {
      auditData['message'] = 'From Mobile_API Service Estimate fetch';
      auditData['result'] = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('ServiceEstimate Controller getOpenEstimates Error:', err);
    next(err);
  }
};

const loadOpenEstimate = async (req, res, next) => {
  try {
    const data = await ServiceEstimate.loadOpenEstimate(req.body);
    res.status(200).send({
      requestSuccessful: true,
      EstimateData: data,
    });
  } catch (err) {
    logger.error('ServiceEstimate Controller loadOpenEstimate Error:', err);
    next(err);
  }
};

const createManyEstimate = async (req, res, next) => {
  let result = 'failed';
  try {
    const count = req.body.count;
    for (let i = 0; i < count; i++) {
      const regNo = (1000 + i).toString();
      console.log("data--------------", regNo);
      const vehicle = await ServiceEstimate.getVehicleWithRegNo(regNo);
      const serviceData = {
        registrationNumber: vehicle.registrationNumber,
        laborEstimate: [
          {
            laborCode: "tvs01",
            laborDescription: "tvs01",
            quantity: 1,
            rate: 18,
            additionalMargin: "",
            discountAmount: "",
            sgst: 6,
            cgst: 6,
            igst: 0,
            laborTotal: 20.16,
            repairType: {
              id: 1,
              repairTypeName: "Paids",
              scheme: true,
              status: true
            },
            singleAmount: 18,
            taxPercentage: 12,
            sacCode: "852323",
            laborId: 20
          }
        ],
        oslLaborEstimate: [
          {
            supplierCode: {
              id: 4,
              vendorCode: "datatest",
              vendorName: "data",
              gstin: "zxc34dzcz",
              panNumber: "zxc4wd",
              address1: "zxc",
              address2: "zxc",
              state: "TAMIL NADU",
              city: "THIRUVALLUR",
              areaName: "Shanmugapuram SO",
              pincode: 600019,
              mobileNumber: 9891091272,
              contactPerson: "xcvxcv",
              contactPersonMobileNo: 9891091272,
              vendorType: "OSL",
              marginPercentage: 1,
              status: true,
              createdBy: 11,
              updatedBy: 11,
              createdAt: "2024-06-28T10:27:18.000Z",
              updatedAt: "2024-06-28T10:27:39.000Z"
            },
            laborCode: "nesh01",
            laborDescription: "nesh01",
            quantity: 1,
            additionalMargin: "",
            discountAmount: "",
            sgst: 55.5,
            cgst: 55.5,
            igst: 0,
            laborTotal: 211,
            rate: "100",
            sacCode: "12312",
            taxPercentage: 111,
            laborId: 22
          }
        ],
        partsEstimate: [
          {
            partNo: "test0090sss",
            partDescription: "test",
            hsnCode: 821344,
            quantity: 1,
            rate: "50",
            additionalMargin: "",
            discountAmount: "",
            sgst: 9,
            cgst: 9,
            igst: 0,
            partTotal: 59,
            taxPercentage: 18,
            partId: 6
          }
        ],
        odometer: vehicle.odometer,
        customerName: vehicle.customer.firstName + " " + vehicle.customer.lastName,
        customerAddress: "test",
        customerMobileNumber: vehicle.customer.mobileNumber,
        pincode: "600001",
        customerVoice: "",
        serviceEngineerRemarks: "",
        driverName: "",
        driverMobileNumber: "",
        jobType: "SQRT",
        makeId: 6,
        modelId: 6,
        serviceTypeId: "test",
        repairTypeId: "Paids",
        sourceId: "test",
        sourceTypeId: "testdata",
        customerId: vehicle.customer.id,
        vehicleId: vehicle.customer.id,
        customerStatus: 2,
        customerState: "TAMIL NADU",
        customerCity: "CHENNAI",
        serviceBookingId: 0
      };
      result = await ServiceEstimate.createServiceEstimate(serviceData, req.user);
    }
    if (result === 'success') {
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not updated ',
      });
    }
  } catch (err) {
    logger.error('ServiceEstimate Controller createManyEstimate Error:', err);
    next(err);
  }
}

const controller = {
  createServiceEstimate,
  searchEstimateLineItems,
  getEstimateLineItemDetails,
  listServiceEstimate,
  generatePDF,
  shareEstimateOnWhatsApp,
  approveServiceEstimate,
  getServiceEstimate,
  updateServiceEstimate,
  getOpenEstimates,
  loadOpenEstimate,
  createManyEstimate,
  createServiceEstimateMobile,
  updateServiceEstimateMobile,
  getServiceEstimateMobile
};

export default controller;
