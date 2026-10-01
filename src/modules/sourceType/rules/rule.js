import { check } from 'express-validator';
import SourceTypeService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';

export const sourceTypeRules = {
  create: [
    check('sourceTypeName')
      .notEmpty()
      .withMessage('please enter the source type name')
      .bail()
      .custom(async (sourceTypeName) => {
        return SourceTypeService.findByCode(sourceTypeName).then((exists) => {
          if (exists) {
            return Promise.reject('source type name must be unique');
          }
        });
      })
      .withMessage('source type name must be unique'),

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

    check('status').notEmpty().withMessage('please select the status'),
  ],

  update: [
    check('sourceTypeName')
      .notEmpty()
      .withMessage('please enter the source type name')
      .bail()
      .custom(async (sourceTypeName, { req }) => {
        return Dao.checkUnique(sourceTypeName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('source type name must be unique');
          }
        });
      })
      .withMessage('source type name must be unique'),

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

    check('status').notEmpty().withMessage('please select the status'),
  ],
};
