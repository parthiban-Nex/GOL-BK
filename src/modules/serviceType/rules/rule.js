import { check } from 'express-validator';
import ServiceTypeService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';
export const serviceTypeRules = {
  create: [
    check('serviceTypeName')
      .notEmpty()
      .withMessage('Please enter the service type name')
      .bail()
      .custom(async (serviceTypeName) => {
        return ServiceTypeService.findByCode(serviceTypeName).then((exists) => {
          if (exists) {
            return Promise.reject('service type name must be unique');
          }
        });
      })
      .withMessage('service type name must be unique'),
    check('status').notEmpty().withMessage('please select the status'),

    check('companyId')
      .notEmpty()
      .withMessage('please select the company')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),
  ],

  update: [
    check('serviceTypeName')
      .notEmpty()
      .withMessage('Please enter the service type name')
      .bail()
      .custom(async (serviceTypeName, { req }) => {
        return Dao.checkUnique(serviceTypeName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('service type name must be unique');
          }
        });
      })
      .withMessage('service type name must be unique'),

    check('status').notEmpty().withMessage('please select the status'),

    check('companyId')
      .notEmpty()
      .withMessage('please select the company')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),
  ],
};
