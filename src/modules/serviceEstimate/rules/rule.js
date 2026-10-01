import { check } from 'express-validator';
import ServiceEstimateDao from '../dao.js';

export const serviceEstimateRules = {
  shareEstimateOnWhatsApp: [
    check('estimateId').isInt({ min: 1 }).withMessage('please provide a valid estimateId'),
  ],
  approveServiceEstimate: [
    check('estimateId').isInt({ min: 1 }).withMessage('please provide a valid estimateId'),
  ],
  update: [
    check('gstStatus').optional().isBoolean().withMessage('gstStatus must be a boolean'),
  ],
  searchEstimateLineItems: [
    check('searchQuery').custom((value, { req }) => {
      const searchQuery = value ?? req.body.searchKey;
      if (typeof searchQuery !== 'string' || searchQuery.trim().length < 3) {
        return Promise.reject('searchQuery must contain at least 3 characters');
      }
      req.body.searchQuery = searchQuery.trim();
      return true;
    }),
  ],
  getEstimateLineItemDetails: [
    check('customerState').trim().notEmpty().withMessage('please enter the customerState'),
    check('lineItems').custom((value, { req }) => {
      const lineItems = Array.isArray(value)
        ? value
        : [{ lineItemType: req.body.lineItemType, lineItemCode: req.body.lineItemCode }];
      if (lineItems.length === 0) {
        return Promise.reject('Please select at least one line item');
      }
      for (const item of lineItems) {
        const lineItemType = String(item?.lineItemType || '').trim().toUpperCase();
        const lineItemCode = String(item?.lineItemCode || '').trim();
        if (!['LABOUR', 'PART', 'OSL'].includes(lineItemType)) {
          return Promise.reject('Each lineItemType must be LABOUR, PART, or OSL');
        }
        if (!lineItemCode) {
          return Promise.reject('Each selected line item must include a lineItemCode');
        }
        item.lineItemType = lineItemType;
        item.lineItemCode = lineItemCode;
      }
      const hasLabour = lineItems.some(item => item.lineItemType === 'LABOUR');
      const modelSegment = String(req.body.modelSegment || '').trim().toUpperCase();
      if (hasLabour && !['A', 'B', 'C', 'D', 'E'].includes(modelSegment)) {
        return Promise.reject('modelSegment must be A, B, C, D, or E when a LABOUR item is selected');
      }
      if (hasLabour) req.body.modelSegment = modelSegment;
      req.body.isBatchLineItems = Array.isArray(value);
      req.body.lineItems = lineItems;
      return true;
    }),
  ],
  create: [
    check('gstStatus').optional().isBoolean().withMessage('gstStatus must be a boolean'),
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter a RegistrationNumber')
      .bail(),
    check('name').trim().notEmpty().withMessage('please enter the name'),
    check('customerMobileNumber')
      .custom((value, { req }) => {
        const mobileNumber = value || req.body.mobileNumber;
        if (mobileNumber === undefined || mobileNumber === null || String(mobileNumber).trim() === '') {
          return Promise.reject('please enter the customerMobileNumber');
        }

        req.body.customerMobileNumber = String(mobileNumber).trim();
        req.body.mobileNumber = req.body.customerMobileNumber;
        return true;
      })
      .bail()
      .custom(async (value, { req }) => {
        const customerMobileNumber = req.body.customerMobileNumber || req.body.mobileNumber;
        const serviceBooking = await ServiceEstimateDao.findActiveServiceBookingForEstimate(
          req.body.registrationNumber,
          customerMobileNumber
        );
        if (serviceBooking) {
          return Promise.reject('Service booking is available');
        }
        return true;
      }),
    check('pinCode').notEmpty().withMessage('please enter the pinCode'),
    check('address1').notEmpty().withMessage('please enter the address1'),
    check('makeId').isInt({ min: 1 }).withMessage('please select a valid make'),
    check('modelId').isInt({ min: 1 }).withMessage('please select a valid model'),
    check('fuelType').trim().notEmpty().withMessage('please select the fuelType'),
    check('registrationNumber').custom(async (registrationNumber) => {
      const exists = await ServiceEstimateDao.findOpenServiceEstimate(registrationNumber);
      if (exists) {
        return Promise.reject('A service estimate is already open with the given RegistrationNumber');
      }
      return true;
    }),
  ],
};
