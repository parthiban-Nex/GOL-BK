import { check } from 'express-validator';
import MakeService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';

export const makeRules = {
  create: [
    check('makeName')
      .notEmpty()
      .withMessage('please enter a Make')
      .bail()
      .custom(async (makeName) => {
        return MakeService.findByName(makeName).then((exists) => {
          if (exists) {
            return Promise.reject('Make must be unique');
          }
        });
      })
      .withMessage('Make must be unique'),

    check('companyId')
      .notEmpty()
      .withMessage('please enter a company id')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId.map((company) => company.id)).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('makeName')
      .notEmpty()
      .withMessage('please enter a Make')
      .bail()
      .custom(async (makeName, { req }) => {
        return MakeService.findByName_Id(makeName, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Make must be unique');
            }
          }
        );
      })
      .withMessage('Make must be unique'),
    check('status').notEmpty().withMessage('please select a status'),

    check('companyId')
      .notEmpty()
      .withMessage('please enter a company id')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId.map((company) => company.id)).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),
  ],
};
