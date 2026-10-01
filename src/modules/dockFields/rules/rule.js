import { check } from 'express-validator';
import DockFieldDao from '../dao.js';

export const DockFieldRules = {
  create: [
    check('label')
      .notEmpty()
      .withMessage('please enter a label')
      .bail()
      .custom(async (label) => {
        return DockFieldDao.findByDockLabel(label).then((exists) => {
          if (exists) {
            return Promise.reject('Label  must be unique');
          }
        });
      })
      .withMessage('Label  must be unique'),
  ],
  update: [
    check('label')
      .notEmpty()
      .withMessage('please enter a label')
      .bail()
      .custom(async (label, { req }) => {
        return DockFieldDao.findByDockLabel_Id(label, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Label  must be unique');
            }
          }
        );
      })
      .withMessage('Label  must be unique'),
  ],
};
