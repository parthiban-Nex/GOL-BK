import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { sign } from 'crypto';

const FranchiseOnboarding = db.franchiseOnboarding;
const FranchiseOnboardingFee = db.franchiseOnboardingFee;
const OnboardingInsuranceDetail = db.onboardingInsuranceDetail;
const FranchiseInsurance = db.franchiseInsurance;
const WorkshopCategory = db.workshopCategory;
const BusinessCategory = db.businessCategory;
const FranchiseOnboardingFeeMaster = db.franchiseOnboardingFeesMaster;
const NmsaAgent = db.nmsaAgents;
const NmsaFollowupLog = db.nmsaFollowupLog;
const disposition = db.dispositions;
const Employee = db.employees;
const User = db.users;

const sequelize = db.sequelize;

// Function to check if signed URL is expired
const isExpired = (signedUrl) => {
  if (!signedUrl || !signedUrl.includes('Expires=')) return true;
  const ts = parseInt(signedUrl.split('Expires=')[1].split('&')[0]) * 1000;
  return Date.now() > ts;
};

// Generate franchise code
const generateFranchiseCode = async (transaction) => {
  const year = new Date().getFullYear().toString().slice(-2);

  const lastFranchise = await FranchiseOnboarding.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction,
  });

  const nextId = lastFranchise ? lastFranchise.id + 1 : 1;
  return `FRN${year}-${nextId.toString().padStart(4, '0')}`;
};

const normalizeDate = (value) => {
  if (!value || value === 'null' || value === '' || value === 'undefined') {
    return null;
  }
  return value;
};

const parseDate = (dateValue) => {
  if (!dateValue) return null;

  if (typeof dateValue === 'object' && dateValue.year && dateValue.month && dateValue.day) {
    return `${dateValue.year}-${dateValue.month.padStart(2, '0')}-${dateValue.day.padStart(2, '0')}`;
  }

  if (typeof dateValue === 'string') {
    const formats = [
      'YYYY-MM-DD',
      'DD-MM-YYYY',
      'MM/DD/YYYY',
      'YYYY/MM/DD'
    ];

    for (const format of formats) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return null;
};
const parseTime = (value) => {
  if (!value) return null;

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return value;

  const date = new Date(value);
  if (isNaN(date)) return null;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const integerFields = [
  'area_size', 'bay_capacity', 'no_of_lifts', 'no_of_flatbed_vehicles',
  'no_of_recovery_crane', 'no_of_zero_degree_flatbed', 'towing', 'no_of_tow_vehicles',
  'wheel_balancer_machine', 'wheel_alignment_machine', 'car_scanner', 'dent_puller',
  'spot_welder', 'mig_welder', 'paint_booth', 'pick_drop', 'no_of_vehicles',
  'no_of_employees', 'no_of_trained_mechanics', 'no_of_service_advisors',
  'no_of_electricians', 'no_of_tinker', 'no_of_parts_executives', 'no_of_helpers',
  'no_of_driver', 'no_of_ac_mechanic', 'no_of_service_manager', 'no_of_supervisor',
  'frontoffice_count', 'technician_count', 'denter_count', 'painter_count',
  'pickup_radius', 'weekly_leads', 'weekly_counter', 'bank_acc_no',
  'bank_pincode', 'tasl_bank_acc_no',
  'tasl_bank_pincode', 'brand', 'min_sqft',
  'compressor', 'paint_mixing', 'customer_lounge', 'front_office', 'spare_parts_area',
  'washing_area', 'uniform', 'stationary', 'active', 'paid_amt', 'payment_reference_number','signup_fee_reference_number',
  'signup_fee_paid_amount', 'signup_fee_total_amount'
];

const STATUS = {
  OPEN: 1,

  SIGNUP_FEE_PENDING: 2,
  SIGNUP_FEE_PARTIAL: 3,
  SIGNUP_FEE_RECEIVED: 4,

  DOCUMENTS_PENDING: 5,
  DOCUMENTS_PARTIAL: 6,
  DOCUMENTS_RECEIVED: 7,

  FEE_PENDING: 8,
  FEE_PARTIAL: 9,
  FEE_COMPLETED: 10,

  NM_PENDING: 11,
  NM_APPROVED: 12,
  NM_REJECTED: 13,

  ZM_PENDING: 14,
  ZM_APPROVED: 15,
  ZM_REJECTED: 16,

  HANDOVER_PENDING: 17,
  HANDOVER_COMPLETED: 18,
  HANDOVER_REJECTED: 19,

  BACKOFFICE_PENDING: 20,
  BACKOFFICE_COMPLETED: 21,
  BACKOFFICE_REJECTED: 22,
};

const getDocumentStatus = (data) => {
  const documents = [
    data.aadhar_card,
    data.gst_doc,
    data.factory_license,
    data.pcb_license,
    data.fire_license,
    data.property_license
  ];

  const totalDocs = documents.length;

  const uploadedDocs = documents.filter(
    doc => doc !== null && doc !== undefined && doc !== ''
  ).length;

  if (uploadedDocs === 0) {
    return {
      status: STATUS.DOCUMENTS_PENDING,
      text: "Documents Pending"
    };
  }

  if (uploadedDocs > 0 && uploadedDocs < totalDocs) {
    return {
      status: STATUS.DOCUMENTS_PARTIAL,
      text: "Documents Partially Received"
    };
  }

  if (uploadedDocs === totalDocs) {
    return {
      status: STATUS.DOCUMENTS_RECEIVED,
      text: "Documents Received"
    };
  }
};
const getFeeStatus = async (franchiseOnboardingId, transaction) => {

  const fees = await FranchiseOnboardingFee.findAll({
    where: {
      franchise_onboarding_id: franchiseOnboardingId
    },
    transaction
  });

  // 1 — No entries
  if (!fees || fees.length === 0) {
    return {
      status: STATUS.FEE_PENDING,
      text: "Fees Pending"
    };
  }

  let totalAmount = 0;
  let paidAmount = 0;

  for (const fee of fees) {
    totalAmount += Number(fee.fees) || 0;
    paidAmount += Number(fee.paid_amt) || 0;
  }

  // 2 — Partial payment
  if (paidAmount < totalAmount) {
    return {
      status: STATUS.FEE_PARTIAL,
      text: "Fees Partially Paid"
    };
  }

  // 3 — Full payment
  return {
    status: STATUS.FEE_COMPLETED,
    text: "Fees Completed"
  };
};
const determineFranchiseStatus = async (
  data,
  franchiseOnboardingId,
  transaction
) => {

  const total = Number(data.signup_fee_total_amount) || 0;
  const paid = Number(data.signup_fee_paid_amount) || 0;

  // 1 — Signup Fee

  if (paid === 0) {
    return {
      status: STATUS.SIGNUP_FEE_PENDING,
      text: "Signup Fee Pending"
    };
  }

  if (paid > 0 && paid < total) {
    return {
      status: STATUS.SIGNUP_FEE_PARTIAL,
      text: "Signup Fee Partially Received"
    };
  }

  // 2 — Documents

  const documentStatus = getDocumentStatus(data);

  if (
    documentStatus.status === STATUS.DOCUMENTS_PENDING ||
    documentStatus.status === STATUS.DOCUMENTS_PARTIAL
  ) {
    return documentStatus;
  }

  // 3 — Fees

  if (franchiseOnboardingId) {

    const feeStatus = await getFeeStatus(
      franchiseOnboardingId,
      transaction
    );

    if (
      feeStatus.status === STATUS.FEE_PENDING ||
      feeStatus.status === STATUS.FEE_PARTIAL
    ) {
      return feeStatus;
    }

    return {
      status: STATUS.NM_PENDING,
      text: "NM Approval Pending"
    };

  }

  // Existing fallback
  if (documentStatus.status === STATUS.DOCUMENTS_RECEIVED) {
    return {
      status: STATUS.DOCUMENTS_RECEIVED,
      text: "Documents Received"
    };
  }

  // NEW — SAFETY NET (this is what the developer meant)

  return {
    status: STATUS.OPEN,
    text: "Open"
  };

};

const upsertFranchiseOnboarding = async (franchiseData, userId, transaction) => {
  try {
    const isUpdate = !!franchiseData.id;
    let franchiseOnboardingId;

    const franchisePayload = {
      outlet_id: franchiseData.outlet_id || null,
      franchise_name: franchiseData.franchise_name || franchiseData.name,
      nmsa_code: franchiseData.nmsa_code || null,
      company_id: franchiseData.company_id || null,
      vehicle_type: Array.isArray(franchiseData.vehicle_type)
        ? franchiseData.vehicle_type.join(',')
        : franchiseData.vehicle_type,
      address_line_1: franchiseData.address_line_1,
      address_line_2: franchiseData.address_line_2,
      landmark: franchiseData.landmark,
      franchise_pincode: franchiseData.franchise_pincode || franchiseData.zipcode,
      franchise_state: franchiseData.franchise_state || franchiseData.state,
      franchise_city: franchiseData.franchise_city || franchiseData.city,
      franchise_region: franchiseData.franchise_region,
      franchise_email: franchiseData.franchise_email || franchiseData.mail_id,
      alternate_franchise_mail: franchiseData.alternate_franchise_mail || franchiseData.alternate_mail_id,
      franchise_contact_no: franchiseData.franchise_contact_no || franchiseData.contact_number,
      alternate_franchise_contact_no: franchiseData.alternate_franchise_contact_no || franchiseData.alternate_contact_number,
      landline_number: franchiseData.landline_number,
      whatsapp_number: franchiseData.whatsapp_number,
      start_time: parseTime(franchiseData.start_time || franchiseData.working_hours_start_time),
      end_time: parseTime(franchiseData.end_time || franchiseData.working_hours_end_time),
      area_size: franchiseData.area_size,
      location_type: franchiseData.location_type,
      rental_start_date: parseDate(franchiseData.rental_start_date),
      rental_end_date: parseDate(franchiseData.rental_end_date),
      lease_start_date: parseDate(franchiseData.lease_start_date),
      lease_end_date: parseDate(franchiseData.lease_end_date),
      franchise_latitude: franchiseData.franchise_latitude || franchiseData.lat,
      franchise_longitude: franchiseData.franchise_longitude || franchiseData.lon,
      level1_user: franchiseData.level1_user,
      level1_user_name: franchiseData.level1_user_name,
      level1_user_mobile: franchiseData.level1_user_mobile,
      level1_user_mail: franchiseData.level1_user_mail,
      level2_user: franchiseData.level2_user,
      level2_user_name: franchiseData.level2_user_name,
      level2_user_mobile: franchiseData.level2_user_mobile,
      level2_user_mail: franchiseData.level2_user_mail,
      level3_user: franchiseData.level3_user,
      level3_user_name: franchiseData.level3_user_name,
      level3_user_mobile: franchiseData.level3_user_mobile,
      level3_user_mail: franchiseData.level3_user_mail,
      ownership_type: franchiseData.ownership_type,
      owner_saluation: franchiseData.owner_saluation,
      owner_first_name: franchiseData.owner_first_name,
      owner_last_name: franchiseData.owner_last_name,
      franchise_owner_mail: franchiseData.franchise_owner_mail,
      franchise_owner_contact_no: franchiseData.franchise_owner_contact_no || franchiseData.franchise_owner_contact,
      owner_aadhar_number: franchiseData.owner_aadhar_number || franchiseData.owner_aadhar_no,
      aadhar_card: franchiseData.aadhar_card,
      aadhar_card_signed_url: franchiseData.aadhar_card_signed_url,
      owner_pan: franchiseData.owner_pan || franchiseData.owner_pan_no,
      franchise_gst_no: franchiseData.franchise_gst_no,
      franchise_pan_no: franchiseData.franchise_pan_no,
      franchise_gst_reg_date: parseDate(franchiseData.franchise_gst_reg_date),
      gst_doc: franchiseData.gst_doc,
      gst_doc_signed_url: franchiseData.gst_doc_signed_url,
      franchise_tin: franchiseData.franchise_tin || franchiseData.franchise_tin_no,
      franchise_tan: franchiseData.franchise_tan || franchiseData.franchise_tan_no,
      factory_license: franchiseData.factory_license,
      factory_license_signed_url: franchiseData.factory_license_signed_url,
      pcb_license: franchiseData.pcb_license,
      pcb_license_signed_url: franchiseData.pcb_license_signed_url,
      fire_license: franchiseData.fire_license,
      fire_license_signed_url: franchiseData.fire_license_signed_url,
      property_license: franchiseData.property_license,
      property_license_signed_url: franchiseData.property_license_signed_url,
      bank_acc_no: franchiseData.bank_acc_no || franchiseData.bank_account_number,
      bank_acc_type: franchiseData.bank_acc_type || franchiseData.bank_account_type,
      bank_ifsc: franchiseData.bank_ifsc || franchiseData.bank_ifsc_code,
      bank_micr: franchiseData.bank_micr || franchiseData.bank_micr_code,
      bank_branch: franchiseData.bank_branch || franchiseData.bank_branch_name,
      bank_pincode: franchiseData.bank_pincode || franchiseData.bank_zipcode,
      bank_state: franchiseData.bank_state,
      bank_city: franchiseData.bank_city,
      bank_address_1: franchiseData.bank_address_1,
      bank_address_2: franchiseData.bank_address_2,
      cancel_cheque: franchiseData.cancel_cheque,
      cancel_cheque_signed_url: franchiseData.cancel_cheque_signed_url,
      bay_capacity: franchiseData.bay_capacity,
      no_of_lifts: franchiseData.no_of_lifts,
      no_of_flatbed_vehicles: franchiseData.no_of_flatbed_vehicles,
      no_of_recovery_crane: franchiseData.no_of_recovery_crane,
      no_of_zero_degree_flatbed: franchiseData.no_of_zero_degree_flatbed,
      towing: franchiseData.towing === 'true' || franchiseData.towing === true || franchiseData.towing === '1',
      no_of_tow_vehicles: franchiseData.no_of_tow_vehicles,
      wheel_balancer_machine: franchiseData.wheel_balancer_machine,
      wheel_alignment_machine: franchiseData.wheel_alignment_machine,
      car_scanner: franchiseData.car_scanner === 'true' || franchiseData.car_scanner === true || franchiseData.car_scanner === '1',
      car_scanner_name: franchiseData.car_scanner_name,
      dent_puller: franchiseData.dent_puller,
      spot_welder: franchiseData.spot_welder === 'true' || franchiseData.spot_welder === true || franchiseData.spot_welder === '1',
      mig_welder: franchiseData.mig_welder,
      paint_booth: franchiseData.paint_booth,
      pick_drop: franchiseData.pick_drop === 'true' || franchiseData.pick_drop === true || franchiseData.pick_drop === '1',
      manager_name: franchiseData.manager_name || franchiseData.franchise_manager_name,
      manager_mail: franchiseData.manager_mail || franchiseData.franchise_manager_mail,
      manager_contact_no: franchiseData.manager_contact_no || franchiseData.franchise_manager_contact,
      no_of_vehicles: franchiseData.no_of_vehicles,
      no_of_employees: franchiseData.no_of_employees,
      no_of_trained_mechanics: franchiseData.no_of_trained_mechanics,
      no_of_service_advisors: franchiseData.no_of_service_advisors,
      no_of_electricians: franchiseData.no_of_electricians,
      no_of_tinker: franchiseData.no_of_tinker,
      no_of_parts_executives: franchiseData.no_of_parts_executives,
      no_of_helpers: franchiseData.no_of_helpers,
      no_of_driver: franchiseData.no_of_driver,
      no_of_ac_mechanic: franchiseData.no_of_ac_mechanic,
      no_of_service_manager: franchiseData.no_of_service_manager,
      no_of_supervisor: franchiseData.no_of_supervisor,
      weekly_off: franchiseData.weekly_off,
      uniform: franchiseData.uniform === 'true' || franchiseData.uniform === true || franchiseData.uniform === '1',
      stationary: franchiseData.stationary === 'true' || franchiseData.stationary === true || franchiseData.stationary === '1',
      spoc1_name: franchiseData.spoc1_name,
      spoc1_mail: franchiseData.spoc1_mail,
      spoc1_contact_no: franchiseData.spoc1_contact_no || franchiseData.spoc1_contact,
      spoc2_name: franchiseData.spoc2_name,
      spoc2_mail: franchiseData.spoc2_mail,
      spoc2_contact_no: franchiseData.spoc2_contact_no || franchiseData.spoc2_contact,
      pickup_radius: franchiseData.pickup_radius,
      brand: franchiseData.brand,
      service_pincode: franchiseData.service_pincode,
      weekly_leads: franchiseData.weekly_leads,
      weekly_counter: franchiseData.weekly_counter,
      remark_1: franchiseData.remark_1,
      remark_2: franchiseData.remark_2,
      rejection_remarks: franchiseData.rejection_remarks,
      active: franchiseData.active === 'true' || franchiseData.active === true || franchiseData.active === '1' || true,
      // status: franchiseData.status || 1,
      contract_terms: franchiseData.contract_terms,
      workshop_category: franchiseData.workshop_category,
      business_category: franchiseData.business_category,
      min_sqft: franchiseData.min_sqft,
      compressor: franchiseData.compressor,
      paint_mixing: franchiseData.paint_mixing,
      customer_lounge: franchiseData.customer_lounge === 'true' || franchiseData.customer_lounge === true || franchiseData.customer_lounge === '1' || true,
      front_office: franchiseData.front_office === 'true' || franchiseData.front_office === true || franchiseData.front_office === '1' || true,
      spare_parts_area: franchiseData.spare_parts_area === 'true' || franchiseData.spare_parts_area === true || franchiseData.spare_parts_area === '1' || true,
      washing_area: franchiseData.washing_area === 'true' || franchiseData.washing_area === true || franchiseData.washing_area === '1' || true,
      frontoffice_count: franchiseData.frontoffice_count,
      technician_count: franchiseData.technician_count,
      denter_count: franchiseData.denter_count,
      painter_count: franchiseData.painter_count,
      tasl_bank_acc_no: franchiseData.tasl_bank_acc_no || franchiseData.tasl_bank_account_number,
      tasl_bank_acc_type: franchiseData.tasl_bank_acc_type || franchiseData.tasl_bank_account_type,
      tasl_bank_ifsc: franchiseData.tasl_bank_ifsc || franchiseData.tasl_bank_ifsc_code,
      tasl_bank_micr: franchiseData.tasl_bank_micr || franchiseData.tasl_bank_micr_code,
      tasl_bank_branch: franchiseData.tasl_bank_branch || franchiseData.tasl_bank_branch_name,
      tasl_bank_pincode: franchiseData.tasl_bank_pincode || franchiseData.tasl_bank_zipcode,
      tasl_bank_state: franchiseData.tasl_bank_state,
      tasl_bank_city: franchiseData.tasl_bank_city,
      tasl_bank_address_1: franchiseData.tasl_bank_address_1,
      tasl_bank_address_2: franchiseData.tasl_bank_address_2,
      signup_fee_total_amount: franchiseData.signup_fee_total_amount,
      signup_fee_paid_amount: franchiseData.signup_fee_paid_amount,
      signup_fee_payment_mode: franchiseData.signup_fee_payment_mode,
      signup_fee_reference_number: franchiseData.signup_fee_reference_number,
      signup_fee_payment_date: parseDate(franchiseData.signup_fee_payment_date),
      signup_fee_doc: franchiseData.signup_fee_doc,
      signup_fee_doc_signed_url: franchiseData.signup_fee_doc_signed_url,


      updatedBy: userId,
    };
    integerFields.forEach((field) => {
      if (franchisePayload[field] === '' || franchisePayload[field] === undefined) {
        franchisePayload[field] = null; 
      } else {
        franchisePayload[field] = Number(franchisePayload[field]);
      }
    });

    if (!isUpdate) {
      franchisePayload.createdBy = userId;
      franchisePayload.franchise_code = await generateFranchiseCode(transaction);
      franchisePayload.status = STATUS.OPEN;
franchisePayload.statusText = "Open";
    }

    let franchiseRecord;
    if (isUpdate) {
      await FranchiseOnboarding.update(franchisePayload, {
        where: { id: franchiseData.id },
        transaction
      });

      franchiseRecord = await FranchiseOnboarding.findByPk(franchiseData.id, { transaction });
      franchiseOnboardingId = franchiseData.id;
    } else {
      franchiseRecord = await FranchiseOnboarding.create(franchisePayload, { transaction });
      franchiseOnboardingId = franchiseRecord.id;
    }

      const fees = Array.isArray(franchiseData.fees)
        ? franchiseData.fees
        : [];

      const submittedFeeIds = fees.map(
        f => `${f.category_id}_${f.fee_id}`
      );


      const existingFees = await FranchiseOnboardingFee.findAll({
        where: {
          franchise_onboarding_id: franchiseOnboardingId
        },
        transaction
      });

      for (const dbFee of existingFees) {
        const key = `${dbFee.category_id}_${dbFee.fee_id}`;

        if (!submittedFeeIds.includes(key)) {
          console.log('Deleting fee with id:', dbFee.id);

          await FranchiseOnboardingFee.destroy({
            where: { id: dbFee.id },
            transaction
          });
        }
      }
    if (franchiseData.fees && Array.isArray(franchiseData.fees)) {
      for (const fee of franchiseData.fees) {
        const existingFee = await FranchiseOnboardingFee.findOne({
          where: {
            franchise_onboarding_id: franchiseOnboardingId,
            category_id: fee.category_id,
            fee_id: fee.fee_id
          },
          transaction
        });

        const payload = {
          franchise_onboarding_id: franchiseOnboardingId,
          category_id: fee.category_id,
          fee_id: fee.fee_id,
          fees: fee.amount,
          start_date: parseDate(fee.start_date),
          end_date: parseDate(fee.end_date),
          paid_amt: fee.paid_amt || null,
          payment_mode: fee.payment_mode || null,
          payment_reference_number: fee.payment_reference_number || null,
          payment_date: parseDate(fee.payment_date),
          payment_doc: fee.payment_doc || null,
          payment_doc_signed_url: fee.payment_doc_signed_url || null,
          createdBy: userId,
          updatedBy: userId
        };

        if (existingFee) {
          if (!payload.payment_doc && existingFee.payment_doc) {
            payload.payment_doc = existingFee.payment_doc;
            payload.payment_doc_signed_url =
              existingFee.payment_doc_signed_url;
          }

          await FranchiseOnboardingFee.update(payload, {
            where: { id: existingFee.id },
            transaction
          });
        } else {
          await FranchiseOnboardingFee.create(payload, { transaction });
        }
      }
    }


    if (franchiseData.ins_provider && Array.isArray(franchiseData.ins_provider)) {
      const submittedInsuranceIds = franchiseData.ins_provider;

      if (franchiseData.insurance_replace === true) {
        await OnboardingInsuranceDetail.destroy({
          where: {
            franchise_onboarding_id: franchiseOnboardingId,
            insurance_id: { [Op.notIn]: submittedInsuranceIds }
          },
          transaction
        });
      }

      for (const insuranceId of submittedInsuranceIds) {
        const insurancePayload = {
          franchise_onboarding_id: franchiseOnboardingId,
          insurance_id: insuranceId,
          cashless_code: franchiseData[`cashless_code_${insuranceId}`] || null,
          cashless_code_required:
            franchiseData[`cashless_code_required_${insuranceId}`] == 1 ||
            franchiseData[`cashless_code_required_${insuranceId}`] === true ||
            franchiseData[`cashless_code_required_${insuranceId}`] === 'true' ||
            franchiseData[`cashless_code_required_${insuranceId}`] === 'yes',

          cashless_code_needed:
            franchiseData[`cashless_code_needed_${insuranceId}`] == 1 ||
            franchiseData[`cashless_code_needed_${insuranceId}`] === true ||
            franchiseData[`cashless_code_needed_${insuranceId}`] === 'true' ||
            franchiseData[`cashless_code_needed_${insuranceId}`] === 'yes', insurance_pdf: franchiseData[`insurance_pdf_${insuranceId}`] || null,
          insurance_pdf_signed_url: franchiseData[`insurance_pdf_signed_url_${insuranceId}`] || null,
          status: franchiseData[`insurance_pdf_${insuranceId}`] ? 1 : 0,
          updatedBy: userId,
        };

        const existingInsurance = await OnboardingInsuranceDetail.findOne({
          where: {
            franchise_onboarding_id: franchiseOnboardingId,
            insurance_id: insuranceId
          },
          transaction
        });

        if (existingInsurance) {
          if (!insurancePayload.insurance_pdf && existingInsurance.insurance_pdf) {
            insurancePayload.insurance_pdf = existingInsurance.insurance_pdf;
            insurancePayload.insurance_pdf_signed_url = existingInsurance.insurance_pdf_signed_url;
            insurancePayload.status = 1;
          }

          await OnboardingInsuranceDetail.update(insurancePayload, {
            where: { id: existingInsurance.id },
            transaction
          });
        } else {
          insurancePayload.createdBy = userId;
          await OnboardingInsuranceDetail.create(insurancePayload, { transaction });
        }
      }
    }

    if (franchiseData.action === 'approve') {
      await FranchiseOnboarding.update(
        { status: 2 },
        { where: { id: franchiseOnboardingId }, transaction }
      );
    } else if (franchiseData.action === 'reject') {
      await FranchiseOnboarding.update(
        { status: 3 },
        { where: { id: franchiseOnboardingId }, transaction }
      );
    }
    const statusResult = await determineFranchiseStatus(
        franchisePayload,
        franchiseOnboardingId,
        transaction
      );

      await FranchiseOnboarding.update(
        {
          status: statusResult.status,
          statusText: statusResult.text
        },
        {
          where: { id: franchiseOnboardingId },
          transaction
        }
      );
    return franchiseRecord;
  } catch (err) {
    logger.error('FranchiseOnboarding dao upsertFranchiseOnboarding Error:', err);
    throw err;
  }
};

const listFranchiseOnboardings = async (reqData, user) => {
  try {
    const {
      searchKey,
      offset = 0,
      limit = 10,
      status
    } = reqData;

    const whereCondition = {
      createdBy: user.id
    };

    if (status) {
      whereCondition.status = status;
    }

    if (searchKey) {
      whereCondition[Op.or] = [
        { franchise_name: { [Op.like]: `%${searchKey}%` } },
        { franchise_contact_no: { [Op.like]: `%${searchKey}%` } },
        { franchise_email: { [Op.like]: `%${searchKey}%` } }
      ];
    }

    const { count, rows } =
      await FranchiseOnboarding.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: WorkshopCategory,
            as: 'workshopCategory',
            attributes: ['id', 'title']
          },
          {
            model: BusinessCategory,
            as: 'businessCategory',
            attributes: ['id', 'title']
          },
          {
            model: FranchiseOnboardingFee,
            as: 'fees'
          },
          {
            model: OnboardingInsuranceDetail,
            as: 'insuranceDetails',
            include: [
              {
                model: FranchiseInsurance,
                as: 'insurance',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        limit,
        offset,
        order: [['id', 'DESC']]
      });

    return {
      totalItems: count,
      data: rows
    };
  } catch (err) {
    logger.error('FranchiseOnboarding dao list Error:', err);
    throw err;
  }
};

const getSingleFranchiseOnboardingById = async (id, transaction = null) => {
  try {
    const franchise = await FranchiseOnboarding.findByPk(id, {
      include: [
        {
          model: WorkshopCategory,
          as: 'workshopCategory',
          attributes: ['id', 'title']
        },
        {
          model: BusinessCategory,
          as: 'businessCategory',
          attributes: ['id', 'title']
        },
        {
          model: FranchiseOnboardingFee,
          as: 'fees',
          include: [
            {
              model: FranchiseOnboardingFeeMaster,
              as: 'feeMaster',
              attributes: ['id', 'title', 'fees'] // fetch title
            }
          ]
        },
        {
          model: OnboardingInsuranceDetail,
          as: 'insuranceDetails',
          include: [
            {
              model: FranchiseInsurance,
              as: 'insurance',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      transaction
    });

    return franchise;
  } catch (err) {
    logger.error('DAO getSingleFranchiseOnboardingById Error:', err);
    throw err;
  }
};

export const listCombinedOnboardings = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10, status } = reqData;

    const franchiseWhere = { createdBy: user.id };

    if (status) franchiseWhere.status = status;

    if (searchKey) {
      franchiseWhere[Op.or] = [
        { franchise_name: { [Op.like]: `%${searchKey}%` } },
        { franchise_contact_no: { [Op.like]: `%${searchKey}%` } },
        { franchise_email: { [Op.like]: `%${searchKey}%` } }
      ];
    }

    const franchiseData = await FranchiseOnboarding.findAndCountAll({
      where: franchiseWhere,
      include: [
        { model: WorkshopCategory, as: 'workshopCategory' },
        { model: BusinessCategory, as: 'businessCategory' },
        { model: FranchiseOnboardingFee, as: 'fees' },
        {
          model: OnboardingInsuranceDetail,
          as: 'insuranceDetails',
          include: [{ model: FranchiseInsurance, as: 'insurance' }]
        }
      ],
      order: [['id', 'DESC']]
    });

    const mappedNmsaCodes = franchiseData.rows
      .map(f => f.nmsa_code)
      .filter(Boolean);

    const convertedDisposition = await disposition.findOne({
      where: { title: 'Converted' },
      attributes: ['id']
    });

    if (!convertedDisposition) {
      throw new Error('Converted disposition not found');
    }

    const nmsaWhere = {
      createdBy: user.id,
      nmsaCode: {
        [Op.notIn]: mappedNmsaCodes.length ? mappedNmsaCodes : ['']
      }
    };

    if (searchKey) {
      nmsaWhere[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } }
      ];
    }

    const nmsaData = await NmsaAgent.findAndCountAll({
      where: nmsaWhere,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    const agentIds = nmsaData.rows.map(a => a.id);

    let convertedAgentMap = {};

    if (agentIds.length) {
      const followups = await NmsaFollowupLog.findAll({
        where: {
          nmsaAgentId: { [Op.in]: agentIds },
          dispositionId: convertedDisposition.id
        },
        order: [['created_at', 'DESC']]
      });

      followups.forEach(f => {
        if (!convertedAgentMap[f.nmsaAgentId]) {
          convertedAgentMap[f.nmsaAgentId] = true;
        }
      });
    }

    const finalNmsa = nmsaData.rows
      .filter(agent => convertedAgentMap[agent.id])
      .map(agent => ({
        ...agent.toJSON(),
        status: 'Converted',
        type: 'nmsa'
      }));

    const finalFranchise = franchiseData.rows.map(f => ({
      ...f.toJSON(),
      type: 'franchise'
    }));

    return {
      totalItems: finalFranchise.length + finalNmsa.length,
      data: [...finalFranchise, ...finalNmsa]
    };

  } catch (err) {
    console.error('Combined DAO Error:', err);
    throw err;
  }
};



export const listCombinedOnboardingsHeader = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10, status } = reqData;
    const employees = await Employee.findAll({
      where: {
        outletId: user.outlet.id,
      },
      attributes: ['id'],
      raw: true,
    });

    const employeeIds = employees.map(e => e.id);

    const users = await User.findAll({
      where: {
        employeeId: {
          [Op.in]: employeeIds,
        },
      },
      attributes: ['id'],
      raw: true,
    });

    const userIds = users.map(u => u.id);

    const franchiseWhere = {
      createdBy: {
        [Op.in]: userIds
      }
    };
    if (user.roleid === 15) {
      franchiseWhere.handingover_status = 1;
    }

    if (status) franchiseWhere.status = status;

    if (searchKey) {
      franchiseWhere[Op.or] = [
        { franchise_name: { [Op.like]: `%${searchKey}%` } },
        { franchise_contact_no: { [Op.like]: `%${searchKey}%` } },
        { franchise_email: { [Op.like]: `%${searchKey}%` } }
      ];
    }

    const franchiseData = await FranchiseOnboarding.findAndCountAll({
      where: franchiseWhere,
      attributes: [
        'id',
        'franchise_code',
        'franchise_name',
        'franchise_contact_no',
        'status',
        'statusText',
        'nmsa_code'
      ],
      order: [['id', 'DESC']],
      raw: true
    });

    const mappedNmsaCodes = franchiseData.rows
      .map(f => f.nmsa_code)
      .filter(Boolean);

    const convertedDisposition = await disposition.findOne({
      where: { title: 'Converted' },
      attributes: ['id'],
      raw: true
    });

    if (!convertedDisposition) {
      throw new Error('Converted disposition not found');
    }

    const nmsaWhere = {
      createdBy: {
        [Op.in]: userIds
      },
      nmsaCode: {
        [Op.notIn]: mappedNmsaCodes.length ? mappedNmsaCodes : ['']
      }
    };

    if (searchKey) {
      nmsaWhere[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } }
      ];
    }

    const nmsaData = await NmsaAgent.findAndCountAll({
      where: nmsaWhere,
      attributes: ['id', 'nmsaCode', 'nmsaName', 'mobileNumber'],
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true
    });

    const agentIds = nmsaData.rows.map(a => a.id);

    let followupMap = {};

    if (agentIds.length) {
      const followups = await NmsaFollowupLog.findAll({
        where: {
          nmsaAgentId: { [Op.in]: agentIds },
          dispositionId: convertedDisposition.id
        },
        order: [['created_at', 'DESC']],
        raw: true
      });

      followups.forEach(f => {
        if (!followupMap[f.nmsaAgentId]) {
          followupMap[f.nmsaAgentId] = true;
        }
      });
    }

    const finalNmsa = nmsaData.rows
      .filter(agent => followupMap[agent.id]) 
      .map(agent => ({
        id: `${agent.id}`,
        code: agent.nmsaCode,
        name: agent.nmsaName,
        mobileNumber: agent.mobileNumber,
        status: 'Converted',
        type: 'nmsa'
      }));

    const statusMap = {
      1: 'Open',
      2: 'Approved',
      3: 'Rejected'
    };

    const finalFranchise = franchiseData.rows.map(f => ({
      id: `${f.id}`,
      code: f.franchise_code,
      name: f.franchise_name,
      mobileNumber: f.franchise_contact_no,
      status: f.statusText || 'Unknown',
      type: 'franchise'
    }));

    const combinedData = [...finalFranchise, ...finalNmsa];

    return {
      totalItems: finalFranchise.length + finalNmsa.length,
      data: combinedData
    };

  } catch (err) {
    console.error('Combined DAO Error:', err);
    throw err;
  }
};



const getAllFranchiseOnboardingDropdown = async () => {
  try {
    const employees = await Employee.findAll({
      attributes: ['id', 'employeeName'],
      where: {
        employeeRoleId: [11, 16, 17],
      },
    });

    const franchiseInsurance = await FranchiseInsurance.findAll({
      attributes: ['id', 'name'],
      where: {
        active: 1,
      },
    });

    const workshopCategories = await WorkshopCategory.findAll({
      attributes: ['id', 'title', 'cat1_sqft', 'cat2_sqft'],
      where: {
        status: 1,
      },
    });

    const businessCategory = await BusinessCategory.findAll({
      attributes: ['id', 'title', 'workshop_category_id'],
      where: {
        status: 1,
      },
    });

    const franchiseFees = await FranchiseOnboardingFeeMaster.findAll({
      attributes: ['id', 'title', 'category_id', 'fees'],
      where: {
        active: 1,
      },
    });
    return {
      employees,
      workshopCategories,
      franchiseInsurance,
      businessCategory,
      franchiseFees
    };
  } catch (err) {
    logger.error('FranchiseOnboarding dao getAllFranchiseOnboardingDropdown Error:', err);
    throw err;
  }
};
const updateHandover = async (id, data, userId, transaction = null) => {
  try {
    const payload = {
      handingover_status: data.handingover_status,
      handover_reject_remarks: data.handover_reject_remarks || null,
      updatedBy: userId,
    };

        // Handover Accepted
    if (data.handingover_status === 1) {
      payload.status = STATUS.BACKOFFICE_PENDING;
      payload.statusText = "Backoffice Pending";
    }

    // Handover Rejected
    else if (data.handingover_status === 2) {
      payload.status = STATUS.HANDOVER_REJECTED;
      payload.statusText = "Handover Rejected";
    }

    else {
      console.log("Invalid handover status:", data.handingover_status);
      return false;
    }

    const [updatedCount] = await FranchiseOnboarding.update(payload, {
      where: { id },
      transaction,
    });

    return updatedCount > 0;
  } catch (err) {
    logger.error('FranchiseOnboarding DAO updateHandover Error:', err);
    throw err;
  }
};
const updateAcceptOrReject = async (id,data,userId,transaction = null) => {
  try {
    const payload = {
      updatedBy: userId,
    };

    // Backoffice Accepted
    if (data.status === 1) {
      payload.status = STATUS.BACKOFFICE_COMPLETED;
      payload.statusText = "Backoffice Completed";
    }

    // Backoffice Rejected
    else if (data.status === 2) {
      payload.status = STATUS.BACKOFFICE_REJECTED;
      payload.statusText = "Backoffice Rejected";
    }

    else {
      console.log("Invalid backoffice status:", data.status);
      return false;
    }

    const [updatedCount] = await FranchiseOnboarding.update(
      payload,
      {
        where: { id },
        transaction,
      }
    );

    return updatedCount > 0;

  } catch (err) {
    logger.error(
      'FranchiseOnboarding DAO updateAcceptOrReject Error:',
      err
    );
    throw err;
  }
};

const getAllExistingFranchise = async () => {
  try {
    return await FranchiseOnboarding.findAll({
      attributes: ['id', 'franchise_name', 'franchise_code'],
    });
  } catch (err) {
    logger.error('FranchiseOnboarding dao Error:', err);
    throw err;
  }
};

const updateFeeApprove = async (id,data,userId,transaction = null) => {
  try {
  
    const payload = {
      fee_approve: data.fee_approve,
      fee_rejection_remarks: data.fee_approve === 2 ? data.fee_reject_remarks : null,
      updatedBy: userId
    };

    const [updatedCount] =
      await FranchiseOnboardingFee.update(
        payload,
        {
          where: { id },
          transaction
        }
      );

    return updatedCount > 0;

  } catch (err) {
    logger.error(
      'FranchiseOnboarding DAO updateFeeApprove Error:',
      err
    );
    throw err;
  }
};

const handleApproval = async (id, data, userId, transaction = null) => {
  try {
    let updatePayload = {
      updatedBy: userId,
    };

    // NM Approval
    if (data.level === "NM") {
      updatePayload.nm_approval = data.status;

      if (data.status === 1) {
        updatePayload.nm_rejection_remarks = null;

        updatePayload.status = STATUS.ZM_PENDING;
        updatePayload.statusText = "ZM Approval Pending";
      }

      else if (data.status === 2) {
        updatePayload.nm_rejection_remarks = data.remarks || null;

        updatePayload.status = STATUS.NM_REJECTED;
        updatePayload.statusText = "NM Rejected";
      }

      else {
        console.log("Invalid NM status received:", data.status);
        return false;
      }
    }

    // ZM Approval
    if (data.level === "ZM") {
      updatePayload.zm_approval = data.status;

      // ZM Approved
      if (data.status === 1) {
        updatePayload.zm_rejection_remarks = null;

        updatePayload.status = STATUS.HANDOVER_PENDING;
        updatePayload.statusText = "Handover Pending";
      }

      // ZM Rejected
      else if (data.status === 2) {
        updatePayload.zm_rejection_remarks = data.remarks || null;

        updatePayload.status = STATUS.ZM_REJECTED;
        updatePayload.statusText = "ZM Rejected";
      }

      else {
        console.log("Invalid ZM status received:", data.status);
        return false;
      }
    }

    const [updatedCount] = await FranchiseOnboarding.update(
      updatePayload,
      {
        where: { id },
        transaction,
      }
    );

    return updatedCount > 0;

  } catch (err) {
    logger.error(
      "FranchiseOnboarding DAO updateAcceptOrReject Error:",
      err
    );
    throw err;
  }
};

export default {
  upsertFranchiseOnboarding,
  isExpired,
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
