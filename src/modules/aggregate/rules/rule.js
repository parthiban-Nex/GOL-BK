import { check } from 'express-validator';
import AggregateService from '../service.js';

export const aggregateRules = {
  create: [
    check('aggregateName')
      .notEmpty()
      .withMessage('please enter a aggregate name')
      .bail()
      .custom(async (aggregateName) => {
        return AggregateService.findByName(aggregateName).then((exists) => {
          if (exists) {
            return Promise.reject('Aggregate name must be unique');
          }
        });
      })
      .withMessage('Aggregate name must be unique'),

    check('status').notEmpty().withMessage('please select a status'),
  ],

  update: [
    check('aggregateName')
      .notEmpty()
      .withMessage('please enter a aggregate name')
      .bail()
      .custom(async (aggregateName, { req }) => {
        return AggregateService.findByCode_Id(aggregateName, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Aggregate Name must be unique');
            }
          }
        );
      })
      .withMessage('Aggregate Name must be unique'),
  ],
};
