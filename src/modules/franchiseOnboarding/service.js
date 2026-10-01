import logger from '../../config/logger.js';
import FranchiseOnboardingDao from './dao.js';
import db from '../index.js';
import { Storage } from '@google-cloud/storage';


const sequelize = db.sequelize;
const OnboardingInsuranceDetail = db.onboardingInsuranceDetail;
const FranchiseOnboarding = db.franchiseOnboarding;
const FranchiseOnboardingFee = db.franchiseOnboardingFee;

const storage = new Storage({
  projectId: "prj-stag-gobumpr-service-6567",
  keyFilename: "prj-stag-gobumpr-service-6567.json",
});

const bucketName = "bkt-dearo-prod";
const bucket = storage.bucket(bucketName);

const generateSignedUrl = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes(bucketName)) return null;

  const filePath = fileUrl.split(`${bucketName}/`)[1];
  if (!filePath) return null;

  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  return signedUrl;
};

const upsertFranchiseOnboarding = async (franchiseData, user) => {
  const transaction = await sequelize.transaction();

  try {
    const franchise = await FranchiseOnboardingDao.upsertFranchiseOnboarding(
      franchiseData,
      user.id,
      transaction
    );

    await transaction.commit();

    return {
      result: 'success',
      data: franchise,
      message: franchiseData.id
        ? 'Franchise onboarding updated successfully'
        : 'Franchise onboarding created successfully'
    };
  } catch (err) {
    await transaction.rollback();
    logger.error('FranchiseOnboarding service upsertFranchiseOnboarding Error:', err);

    return {
      result: 'failed',
      data: null,
      message: err.message || 'Failed to save franchise onboarding data'
    };
  }
};

export const listFranchiseOnboardings = async (reqData, user) => {
  try {
    return await FranchiseOnboardingDao.listFranchiseOnboardings(reqData, user);
  } catch (err) {
    logger.error('FranchiseOnboarding service list Error:', err);
    throw err;
  }
};
export const listCombinedOnboardings = async (reqData, user) => {
  try {
    return await FranchiseOnboardingDao.listCombinedOnboardings(reqData, user);
  } catch (err) {
    logger.error('CombinedOnboarding service Error:', err);
    throw err;
  }
};
export const listCombinedOnboardingsHeader = async (reqData, user) => {
  try {
    return await FranchiseOnboardingDao.listCombinedOnboardingsHeader(reqData, user);
  } catch (err) {
    logger.error('CombinedOnboarding Header service Error:', err);
    throw err;
  }
};
export const getSingleFranchiseOnboardingById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const franchise =
      await FranchiseOnboardingDao.getSingleFranchiseOnboardingById(id, transaction);

    if (!franchise) {
      await transaction.rollback();
      return null;
    }

    const data = franchise.toJSON();

    const fileFields = [
      'aadhar_card',
      'gst_doc',
      'factory_license',
      'pcb_license',
      'fire_license',
      'property_license',
      'cancel_cheque',
      'signup_fee_doc'
    ];

    let shouldUpdate = false;

    for (const field of fileFields) {
      const signedField = `${field}_signed_url`;

      if (data[field] && (!data[signedField] || FranchiseOnboardingDao.isExpired(data[signedField]))) {
        const newSignedUrl = await generateSignedUrl(data[field]);
        if (newSignedUrl) {
          data[signedField] = newSignedUrl;
          shouldUpdate = true;
        }
      }
    }

    // Insurance PDFs
    if (data.insuranceDetails?.length) {
      for (const ins of data.insuranceDetails) {
        if (
          ins.insurance_pdf &&
          (!ins.insurance_pdf_signed_url ||
            FranchiseOnboardingDao.isExpired(ins.insurance_pdf_signed_url))
        ) {
          const newSignedUrl = await generateSignedUrl(ins.insurance_pdf);
          if (newSignedUrl) {
            ins.insurance_pdf_signed_url = newSignedUrl;

            await OnboardingInsuranceDetail.update(
              { insurance_pdf_signed_url: newSignedUrl },
              { where: { id: ins.id }, transaction }
            );
          }
        }
      }
    }
    // Franchise Fees Payment Docs
  if (data.fees?.length) {
    for (const fee of data.fees) {
      if (
        fee.payment_doc &&
        (
          !fee.payment_doc_signed_url ||
          FranchiseOnboardingDao.isExpired(fee.payment_doc_signed_url)
        )
      ) {
        const newSignedUrl = await generateSignedUrl(fee.payment_doc);

        if (newSignedUrl) {
          fee.payment_doc_signed_url = newSignedUrl;

          await FranchiseOnboardingFee.update(
            { payment_doc_signed_url: newSignedUrl },
            {
              where: { id: fee.id },
              transaction
            }
          );
        }
      }
    }
  }

    if (shouldUpdate) {
      await FranchiseOnboarding.update(
        data,
        { where: { id }, transaction }
      );
    }

    await transaction.commit();
    return data;

  } catch (err) {
    await transaction.rollback();
    logger.error('Service getSingleFranchiseOnboardingById Error:', err);
    throw err;
  }
};

const getAllFranchiseOnboardingDropdown = async () => {
  try {
    const data = await FranchiseOnboardingDao.getAllFranchiseOnboardingDropdown();
    return data;
  } catch (err) {
    logger.error('FranchiseOnboarding service getAllFranchiseOnboardingDropdown Error:', err);
    next(err);
  }
};

const updateHandover = async (id, FranchiseOnboarding, user) => {
  let result = '';
  let message = '';

  try {
    const FranchiseOnboardingExists = await FranchiseOnboardingDao.getSingleFranchiseOnboardingById(id);

    if (!FranchiseOnboardingExists) {
      return { result: 'failed', message: 'Franchise Onboarding not found' };
    }

    const updatedFranchiseOnboarding = await FranchiseOnboardingDao.updateHandover(id, FranchiseOnboarding, user.id);
    if (updatedFranchiseOnboarding) {
      result = 'success';
    }

    return { result, message };
  } catch (err) {
    result = 'failed';
    logger.error('FranchiseOnboarding service updateFranchiseOnboarding Error:', err);
    throw err;
  }
};

const updateAcceptOrReject = async (id, FranchiseOnboarding, user) => {
  let result = '';
  let message = '';

  try {
    const FranchiseOnboardingExists = await FranchiseOnboardingDao.getSingleFranchiseOnboardingById(id);

    if (!FranchiseOnboardingExists) {
      return { result: 'failed', message: 'Franchise Onboarding not found' };
    }

    const updatedFranchiseOnboarding = await FranchiseOnboardingDao.updateAcceptOrReject(id, FranchiseOnboarding, user.id);
    if (updatedFranchiseOnboarding) {
      result = 'success';
    }

    return { result, message };
  } catch (err) {
    result = 'failed';
    logger.error('FranchiseOnboarding service updateAcceptOrReject Error:', err);
    throw err;
  }
};

const getAllExistingFranchise = async () => {
  try {
    return await FranchiseOnboardingDao.getAllExistingFranchise();
  } catch (err) {
    logger.error('Franchise Onboarding service getAllExistingFranchise Error:', err);
    throw err;
  }
};

const updateFeeApprove = async (id, feeData, user) => {
  let result = '';
  let message = '';

  const transaction = await sequelize.transaction();

  try {
    const feeExists =
     await FranchiseOnboardingFee.findOne({
      where: {
        id: id
      }
    });

    if (!feeExists) {
      await transaction.rollback();
      return {
        result: 'failed',
        message: 'Fee record not found'
      };
    }

    const updated = await FranchiseOnboardingDao.updateFeeApprove(id,feeData,user.id,transaction);

    if (updated) {
      result = 'success';
      message = 'Fee status updated successfully';
    }

    await transaction.commit();

    return { result, message };

  } catch (err) {
    await transaction.rollback();
    result = 'failed';

    logger.error(
      'FranchiseOnboarding service updateFeeApprove Error:',
      err
    );

    throw err;
  }
};

const handleApproval = async (id, FranchiseOnboarding, user) => {
  let result = '';
  let message = '';

  try {
    const FranchiseOnboardingExists = await FranchiseOnboardingDao.getSingleFranchiseOnboardingById(id);

    if (!FranchiseOnboardingExists) {
      return { result: 'failed', message: 'Franchise Onboarding not found' };
    }

    const updatedFranchiseOnboarding = await FranchiseOnboardingDao.handleApproval(id, FranchiseOnboarding, user.id);
    if (updatedFranchiseOnboarding) {
      result = 'success';
    }

    return { result, message };
  } catch (err) {
    result = 'failed';
    logger.error('FranchiseOnboarding service handleApproval Error:', err);
    throw err;
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