import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import { companyRules } from './rules/rule.js';
import express from 'express';

// router
const router = express.Router();

// use routers
router.post(
  '/create',
  companyRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addCompany(req, res, next);
  }
);

router.get(
  '/getAllCompany', 
  JwtMiddleware.checkToken,
  controller.getAllCompany
);
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneCompany
);

router.put(
  '/:id',
  idNumberControl,
  companyRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateCompany(req, res, next);
  }
);


const companyRouter = router;
export default companyRouter;
