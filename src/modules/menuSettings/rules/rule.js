import { check } from 'express-validator';
import service from '../service.js';

export const menuRules = {
  create: [
    check('title')
      .notEmpty()
      .withMessage('please enter a title')
      .bail()
      .custom(async (title) => {
        return service.findByTitle(title).then((exists) => {
          if (exists) {
            return Promise.reject('title must be unique');
          }
        });
      })
      .withMessage('Title must be unique'),
  ],
  update: [
    check('title')
      .notEmpty()
      .withMessage('please enter title')
      .bail()
      .custom(async (title, { req }) => {
        return service.findByTitle_Id(title, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Title must be unique');
          }
        });
      })
      .withMessage('Title must be unique'),
  ],
};

export const subMenuRules = {
  create: [
    check('title')
      .notEmpty()
      .withMessage('please enter title')
      .bail()
      .custom(async (title) => {
        return service.findSubByTitle(title).then((exists) => {
          if (exists) {
            return Promise.reject('Title must be unique');
          }
        });
      })
      .withMessage('Title must be unique'),
  ],
  update: [
    check('title')
      .notEmpty()
      .withMessage('please enter title')
      .bail()
      .custom(async (title, { req }) => {
        return service.findSubByTitle_Id(title, req.body.id).then((exists) => {
          if (exists) {
            return Promise.reject('Title must be unique');
          }
        });
      })
      .withMessage('Title must be unique'),
  ],
};
