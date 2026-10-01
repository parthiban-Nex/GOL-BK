import { check } from 'express-validator';
import sourceService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';

export const sourceRules = {
  create: [
    check('sourceName')
      .notEmpty()
      .withMessage('please enter the sourceName')
      .bail()
      .custom(async (sourceName) => {
        return sourceService.findByCode(sourceName).then((exists) => {
          if (exists) {
            return Promise.reject('source name must be unique');
          }
        });
      })
      .withMessage('source name must be unique'),
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
    check('sourceName')
      .notEmpty()
      .withMessage('please enter the source name')
      .bail()
      .custom(async (sourceName, { req }) => {
        return Dao.checkUnique(sourceName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('DisPosition Code must be unique');
          }
        });
      })
      .withMessage('DisPosition Code must be unique'),
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
