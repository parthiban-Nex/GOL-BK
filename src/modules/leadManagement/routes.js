import JwtMiddleware from '../../config/jwtMiddleware.js';
import express from 'express';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import controller from "./controller.js";
import { leadRules } from "./rules/rule.js";

const router = express.Router();

router.post('/listLead', JwtMiddleware.checkToken, controller.listLeads);

router.post(
    '/createLead',
    leadRules['create'],
    JwtMiddleware.checkToken,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationException(errors.array()));
        }
        return await controller.createLead(req, res, next);
    }
);

router.post(
    '/editLead',
    idNumberBodyControl,
    leadRules['update'],
    JwtMiddleware.checkToken,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationException(errors.array()));
        }
        return await controller.updateLead(req, res, next);
    }
);

const leadRouter = router;

export default leadRouter;