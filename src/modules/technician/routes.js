import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { technicianRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/create',
  JwtMiddleware.checkToken,
  technicianRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addTechnician(req, res, next);
  }
);

router.post('/getAllTechnicians', JwtMiddleware.checkToken, controller.getAllTechnicians);

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneTechnician
);

router.post(
  '/editTechnician',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  technicianRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateTechnician(req, res, next);
  }
);

const technicianRouter = router;

export default technicianRouter;
