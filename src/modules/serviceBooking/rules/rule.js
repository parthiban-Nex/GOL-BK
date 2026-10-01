import { check } from 'express-validator';
import dao from '../dao.js';
import {
  isValidServiceBookingStatus,
  normalizeServiceBookingActivityStatus,
} from '../status.js';

const isEnabled = value =>
  value === true || value === 1 || value === '1' ||
  (typeof value === 'string' && value.trim().toLowerCase() === 'true');

const validateTransportFields = (field, { dateField, addressField, driverField }) => [
  check(field).optional({ nullable: true }).custom((value, { req }) => {
    if (value === true || value === false || value === 1 || value === 0 || value === '1' || value === '0' ||
      (typeof value === 'string' && ['true', 'false'].includes(value.trim().toLowerCase()))) {
      req.body[field] = isEnabled(value) ? 1 : 0;
      return true;
    }
    return Promise.reject(`${field} must be true or false`);
  }),
  check(dateField).custom((value, { req }) => {
    if (isEnabled(req.body[field]) && (!value || Number.isNaN(Date.parse(value)))) {
      return Promise.reject(`please enter a valid ${dateField}`);
    }
    return true;
  }),
  check(addressField).custom((value, { req }) => {
    if (isEnabled(req.body[field]) && !String(value || '').trim()) {
      return Promise.reject(`please enter the ${addressField}`);
    }
    return true;
  }),
  check(driverField).custom((value, { req }) => {
    if (isEnabled(req.body[field]) && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
      return Promise.reject(`please select a valid ${driverField}`);
    }
    return true;
  }),
];

export const serviceBookingRules = {
  create: [
    ...validateTransportFields('pickupStatus', {
      dateField: 'pickupDateTime', addressField: 'pickupAddress', driverField: 'pickupDriverId',
    }),
    ...validateTransportFields('dropoffStatus', {
      dateField: 'dropOffDateTime', addressField: 'dropOffAddress', driverField: 'dropoffDriverId',
    }),
    check('registrationNumber')
      .notEmpty() 
      .withMessage('please enter the RegistrationNumber')
      .bail()
      .custom(async (registrationNumber) => {
        return dao
          .findInProgressServiceBooking(registrationNumber)
          .then((exists) => {
            if (exists) {
              return Promise.reject(
                'A service booking is already in progress with the given registration number'
              );
            }
          });
      })
      .withMessage(
        'A service booking is already in progress with the given registration number'
      ),
    check('status')
      .notEmpty()
      .withMessage('please select the status')
      .bail()
      .custom((status) => {
        if (!isValidServiceBookingStatus(status)) {
          return Promise.reject(
            'status must be Confirmed, Pending, Cancelled, Completed, or Move to Estimate'
          );
        }

        return true;
      }),

    check('customerName')
      .notEmpty()
      .withMessage('please enter the customerName'),
    check('customerMobileNumber').custom((value, { req }) => {
      const mobileNumber = value || req.body.mobileNumber;
      if (mobileNumber === undefined || mobileNumber === null || String(mobileNumber).trim() === '') {
        return Promise.reject('please enter the customerMobileNumber');
      }

      req.body.customerMobileNumber = String(mobileNumber).trim();
      return true;
    }),
    // check('dmsSourceId').notEmpty().withMessage('please enter the dmsSourceId'),
    // check('dmsSourceTypeId')
    //   .notEmpty()
    //   .withMessage('please enter the dmsSourceTypeId'),
  ],
  update: [
    ...validateTransportFields('pickupStatus', {
      dateField: 'pickupDateTime', addressField: 'pickupAddress', driverField: 'pickupDriverId',
    }),
    ...validateTransportFields('dropoffStatus', {
      dateField: 'dropOffDateTime', addressField: 'dropOffAddress', driverField: 'dropoffDriverId',
    }),
    check('status')
      .optional({ nullable: true })
      .custom((status) => {
        if (!isValidServiceBookingStatus(status) && !normalizeServiceBookingActivityStatus(status)) {
          return Promise.reject(
            'status must be a valid service booking status or activity status'
          );
        }
        return true;
      }),
    check('followupDate').custom((value, { req }) => {
      const status = normalizeServiceBookingActivityStatus(req.body.status);
      if (['Appointment Rescheduled', 'Call Back/Under Follow Up'].includes(status) && !value) {
        return Promise.reject('please enter the followupDate');
      }
      return true;
    }),
    check('remarks').custom((value, { req }) => {
      const status = normalizeServiceBookingActivityStatus(req.body.status);
      if (['Others', 'Appointment Rescheduled'].includes(status) && !String(value || '').trim()) {
        return Promise.reject('please enter the remarks');
      }
      return true;
    }),
    check('reason').custom((value, { req }) => {
      const status = normalizeServiceBookingActivityStatus(req.body.status);
      if (['Not Contactable', 'Hung Up/Refuse to Speak', 'Appointment Cancelled'].includes(status) && !String(value || '').trim()) {
        return Promise.reject('please enter the reason');
      }
      return true;
    }),
    check('serviceProvider').custom((value, { req }) => {
      if (normalizeServiceBookingActivityStatus(req.body.status) === 'Service Done from Outside' && !String(value || '').trim()) {
        return Promise.reject('please enter the serviceProvider');
      }
      return true;
    }),
    check('saleDetails').custom((value, { req }) => {
      if (normalizeServiceBookingActivityStatus(req.body.status) === 'Vehicle Sold' && !value) {
        return Promise.reject('please enter the saleDetails');
      }
      return true;
    }),
    check('correctContactNumber').custom((value, { req }) => {
      if (normalizeServiceBookingActivityStatus(req.body.status) === 'Wrong Number' && !String(value || '').trim()) {
        return Promise.reject('please enter the correctContactNumber');
      }
      return true;
    }),
    check('createEstimate').custom((value, { req }) => {
      if (normalizeServiceBookingActivityStatus(req.body.status) === 'Proceed to Jobcard' && typeof value !== 'boolean') {
        return Promise.reject('please enter createEstimate as true or false');
      }
      return true;
    }),
  ],
    create_policybazaar: [
    check('registrationNumber')
      .notEmpty()
      .withMessage('please enter the RegistrationNumber')
      .bail()
      .custom(async (registrationNumber) => {
        return dao
          .findInProgressServiceBooking(registrationNumber)
          .then((exists) => {
            if (exists) {
              return Promise.reject(
                'A service booking is already in progress with the given registration number'
              );
            }
          });
      })
      .withMessage(
        'A service booking is already in progress with the given registration number'
      ),

    check('customerName')
      .notEmpty()
      .withMessage('please enter the customerName'),
      
    check('customerAddress')
      .notEmpty()
      .withMessage('please enter the customerAddress'),
          check('customerState')
      .notEmpty()
      .withMessage('please enter the customerState'),
            check('customerCity')
      .notEmpty()
      .withMessage('please enter the customerCity'),
                check('pinCode')
      .notEmpty()
      .withMessage('please enter the pinCode'),
                  check('pinCode')
      .notEmpty()
      .withMessage('please enter the pinCode'),
    check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber'),
       check('mobileNumber')
      .notEmpty()
      .withMessage('please enter the mobileNumber'),
       check('make')
      .notEmpty()
      .withMessage('please enter the make'),
         check('model')
      .notEmpty()
      .withMessage('please enter the model'),
          check('outletName')
      .notEmpty()
      .withMessage('please enter the outletName'),
         check('b2bBookingId')
      .notEmpty()
      .withMessage('please enter the b2bBookingId')
  ],
};
