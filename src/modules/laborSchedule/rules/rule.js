import { check } from 'express-validator';
import Service from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';
import Dao from '../dao.js';

export const laborScheduleRules = {
  create: [
    check('laborCode')
      .notEmpty()
      .withMessage('please enter the laborCode')
      .bail()
      .custom(async (laborCode) => {
        return Service.findLaborCode(laborCode).then((exists) => {
          if (exists) {
            return Promise.reject('LaborCode must be unique');
          }
        });
      })
      .withMessage('LaborCode must be unique'),

    check('laborDescription')
      .notEmpty()
      .withMessage('please enter the laborDescription'),
    check('sacCode').notEmpty().withMessage('please enter the sacCode'),
    check('taxPercentage')
      .notEmpty()
      .withMessage('please enter the taxPercentage'),
    check('osl').notEmpty().withMessage('please enter the osl'),
    check('stdhrsA').notEmpty().withMessage('please enter the stdhrsA'), 
    check('stdhrsB').notEmpty().withMessage('please enter the stdhrsB'),
    check('stdhrsC').notEmpty().withMessage('please enter the stdhrsC'),
    check('stdhrsD').notEmpty().withMessage('please enter the stdhrsD'),
    check('stdhrsE').notEmpty().withMessage('please enter the stdhrsE'),
    check('citySegmentA')
      .notEmpty()
      .withMessage('please enter the citySegmentA'),
    check('citySegmentB')
      .notEmpty()
      .withMessage('please enter the citySegmentB'),
    check('citySegmentC')
      .notEmpty()
      .withMessage('please enter the citySegmentC'),
    check('citySegmentD')
      .notEmpty()
      .withMessage('please enter the citySegmentD'),
  ],

  update: [
    check('laborCode')
      .notEmpty()
      .withMessage('please enter the laborCode')
      .bail()
      .custom(async (laborCode, { req }) => {
        return Dao.checkUnique(laborCode, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Labor Code must be unique');
          }
        });
      })
      .withMessage('Labor Code must be unique'),
  ],
  get: [
    check('modelSegment') 
      .notEmpty()
      .withMessage(
        'Please enter the vehicle registration number to get the labour details'
      ),
  ],
};
