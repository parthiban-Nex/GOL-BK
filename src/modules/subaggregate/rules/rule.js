import { check } from 'express-validator';
import SubAggregateService from '../service.js';

export const subAggregateRules = {
  create: [
    check('subAggregateName')
      .notEmpty()
      .withMessage('please enter the subaggregate name')
      .bail()
      .custom(async (subaggregateName) => {
        return SubAggregateService.findByName(subaggregateName).then(
          (exists) => {
            if (exists) {
              return Promise.reject(' SubAggregate name must be unique');
            }
          }
        );
      })
      .withMessage('SubAggregate name must be unique'),

    check('status').notEmpty().withMessage('please select a status'),

    check('aggregateId').notEmpty().withMessage('please select a aggregateId'),
  ],
  update: [
    check('aggregateId').notEmpty().withMessage('please enter the aggregateId'),
    check('subAggregateName')
      .notEmpty()
      .withMessage('please enter the subaggregate name')
      .bail()
      .custom(async (subAggregateName, { req }) => {
        return SubAggregateService.checkUnique(
          subAggregateName,
          req.body.id
        ).then((exists) => {
          if (exists) {
            return Promise.reject('SubAggregate name must be unique');
          }
        });
      })
      .withMessage('SubAggregate name must be unique'),
  ],
};
