import { check } from 'express-validator';
import dao from '../dao.js';

export const jobCardRules = {
  updateLineApproval: [
    check('jobCardId').isInt({ min: 1 }).withMessage('Please enter a valid jobCardId'),
    check('lineType').trim().toUpperCase().isIn(['PART', 'LABOUR', 'OSL']).withMessage('lineType must be PART, LABOUR, or OSL'),
    check('lineId').isInt({ min: 1 }).withMessage('Please enter a valid lineId'),
    check('approvalStatus').trim().toUpperCase().isIn(['APPROVED', 'REJECTED', 'PENDING']).withMessage('approvalStatus must be APPROVED, REJECTED, or PENDING'),
  ],
  createInitialPortal: [
    check('documentType')
      .optional()
      .customSanitizer((value) => String(value).trim().toUpperCase())
      .isIn(['RJC', 'AJC', 'MINOR', 'MAJOR'])
      .withMessage('documentType must be RJC, AJC, MINOR, or MAJOR'),
    check('name').trim().notEmpty().withMessage('Please enter the customer name'),
    check('mobileNumber').trim().notEmpty().withMessage('Please enter the mobile number'),
    check('registrationNumber').trim().notEmpty().withMessage('Please enter the registration number'),
    check('makeId').isInt({ min: 1 }).withMessage('Please select a valid make'),
    check('modelId').isInt({ min: 1 }).withMessage('Please select a valid model'),
  ],
  savePortalInspection: [
    check('jobCardId').isInt({ min: 1 }).withMessage('Please enter a valid jobCardId'),
    check('odometer').isInt({ min: 0 }).withMessage('Please enter a valid odometer reading'),
    check('fuelLevel')
      .isInt({ min: 0, max: 100 })
      .withMessage('Please enter a fuelLevel percentage between 0 and 100'),
    check('inventory').isArray().withMessage('inventory must be an array'),
    check('inspection').isArray().withMessage('inspection must be an array'),
    check('inventory.*.code').notEmpty().withMessage('Each inventory item must include a code'),
    check('inspection.*.paramCode').notEmpty().withMessage('Each inspection item must include a paramCode'),
    check('inspection.*.ratingReasonCode').notEmpty().withMessage('Each inspection item must include a ratingReasonCode'),
    check('complaintAdvice').optional().isArray().withMessage('complaintAdvice must be an array'),
    check('complaintAdvice.*.customerComplaint').trim().notEmpty().withMessage('Each complaintAdvice item must include a customerComplaint'),
    check('complaintAdvice.*.serviceAdvice').optional({ nullable: true }).isString().withMessage('serviceAdvice must be a string'),
    check('complaintAdvice.*.attended').isBoolean().withMessage('attended must be true or false'),
  ],
  createFromServiceBooking: [
    check('serviceBookingId')
      .isInt({ min: 1 })
      .withMessage('Please enter a valid serviceBookingId'),
    check('serviceTypeId')
      .isInt({ min: 1 })
      .withMessage('Please enter a valid serviceTypeId'),
    check('repairTypeId')
      .isInt({ min: 1 })
      .withMessage('Please enter a valid repairTypeId'),
    check('labor')
      .isArray({ min: 1 })
      .withMessage('Please provide at least one labour item'),
    check('labor.*.laborId')
      .isInt({ min: 1 })
      .withMessage('Each labour item must include a valid laborId'),
    check('labor.*.laborCode')
      .notEmpty()
      .withMessage('Each labour item must include a laborCode'),
  ],
  create: [
    check('registrationNumber')
      .notEmpty()
      .withMessage('Please enter the Registration Number')
      .bail()
      .custom(async (registrationNumber) => {
        return dao.findJobCardByStatus(registrationNumber).then((exists) => {
          if (exists) {
            return Promise.reject(
              'JobCard already in progress with the given Registration Number'
            );
          }
        });
      })
      .withMessage(
        'JobCard already in progress with the given Registration Number'
      ),
  ],
  add: [
    check('transactionId')
      .notEmpty()
      .withMessage('Please enter the Transaction Id')
      .bail()
      .custom(async (transactionId) => {
        return dao.getInsurance(transactionId).then((exists) => {
          if (exists) {
            return Promise.reject('Insurance Already added for this job card');
          }
        });
      })
      .withMessage('Insurance Already added for this job card'),
  ],
};
