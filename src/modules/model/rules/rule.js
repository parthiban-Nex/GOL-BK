import { check } from 'express-validator';
import ModelDao from '../dao.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';

export const modelRules = {
  create: [
    check('modelName') 
      .notEmpty()
      .withMessage('please enter a Model Name')
      .bail()
      .custom(async (modelName) => {
        return ModelDao.findByName(modelName).then((exists) => {
          if (exists) {
            return Promise.reject('Model must be unique');
          }
        });
      })
      .withMessage('Model must be unique'),

    check('makeId').notEmpty().withMessage('please select a Make '),
    check('vehicletypeId')
      .notEmpty()
      .withMessage('please select a vehicletype '),
    // check('varientId').notEmpty().withMessage('please select a varient '),

    check('status').notEmpty().withMessage('please select a status'),
    check('segment').notEmpty().withMessage('please Enter a Segment'),
  ],

  update: [
    check('modelName')
      .notEmpty()
      .withMessage('please enter a Model Name')
      .bail()
      .custom(async (modelName, { req }) => {
        return ModelDao.findByName_Id(modelName, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Model must be unique');
          }
        });
      })
      .withMessage('Model must be unique'),
    check('makeId').notEmpty().withMessage('please select a Make '),
    check('vehicletypeId')
      .notEmpty()
      .withMessage('please select a vehicletype '),
    // check('varientId').notEmpty().withMessage('please select a varient '),

    check('status').notEmpty().withMessage('please select a status'),
    check('segment').notEmpty().withMessage('please Enter a Segment'),
  ],
};
