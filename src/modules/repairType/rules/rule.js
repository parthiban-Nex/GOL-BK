import { check } from 'express-validator';
import RepairTypeService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';
export const repairTypeRules = {
  create: [
    check('repairTypeName')
      .notEmpty()
      .withMessage('please enter the repairTypeName')
      .bail()
      .custom(async (repairTypeName) => {
        return RepairTypeService.findByCode(repairTypeName).then((exists) => {
          if (exists) {
            return Promise.reject('RepairType Name must be unique');
          }
        });
      })
      .withMessage('RepairType Name must be unique'),

    check('scheme').notEmpty().withMessage('please enter the scheme'),

    check('status').notEmpty().withMessage('please select the status'),
    check('companyId')
      .notEmpty()
      .withMessage('please select company')
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
    check('repairTypeName')
      .notEmpty()
      .withMessage('please enter the repairTypeName')
      .bail()
      .custom(async (repairTypeName, { req }) => {
        return Dao.checkUnique(repairTypeName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('RepairType Name must be unique');
          }
        });
      })
      .withMessage('RepairType Name must be unique'),
    check('scheme').notEmpty().withMessage('please enter the scheme'),

    check('status').notEmpty().withMessage('please select the status'),
    check('companyId')
      .notEmpty()
      .withMessage('please select company')
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
