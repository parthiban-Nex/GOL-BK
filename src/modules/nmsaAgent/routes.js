import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';


const router = express.Router();

router.post(
  '/createNmsaAgent',
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addNmsaAgent(req, res, next);
  }
);

router.get(
    '/getNmsaDropdownData',
    JwtMiddleware.checkToken,
    controller.getAllNmsaDropdown
  );

router.post(
  '/editNmsaAgent',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateNmsaAgent(req, res, next);
  }
);

router.post(
  '/listNmsaAgents',
  JwtMiddleware.checkToken,
  controller.listNmsaAgents
);
router.get(
    '/getOneNmsaAgent/:id',
    JwtMiddleware.checkToken,
    controller.getOneNmsaAgent
  );
  
const nmsaAgentRouter = router;

export default nmsaAgentRouter;
