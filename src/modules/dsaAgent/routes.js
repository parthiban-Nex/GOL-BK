import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { dsaAgentRules } from './rules/rule.js';
import commonLogics from '../../shared/commonLogics.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createDsaAgent',
  dsaAgentRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addDsaAgent(req, res, next);
  }
);

router.get('/getall', JwtMiddleware.checkToken, controller.getAllDsaAgent);

router.post(
  '/editDsaAgent',
  idNumberBodyControl,
  dsaAgentRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateDsaAgent(req, res, next);
  }
);

router.post(
  '/listDsaAgents',
  JwtMiddleware.checkToken,
  controller.listDsaAgents
);
router.get('/getAllBanks', JwtMiddleware.checkToken, controller.getAllBanks);
router.post(
  '/getAllDsaAgents',
  JwtMiddleware.checkToken,
  controller.getAllDsaAgents
);
// router.delete('/:id', idNumberControl, JwtMiddleware.checkToken, controller.deleteDsaAgent);
// router.post('/import', JwtMiddleware.checkToken, controller.bulkImportOnCsvFilesDSAAgent);
// router.get('/xlsxfiledownload', controller.downloadXlsxFile);

const dsaAgentRouter = router;

export default dsaAgentRouter;
