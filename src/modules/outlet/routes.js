import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { outletRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createOutlet',
  outletRules['create'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addOutlet(req, res, next);
  }
);

router.post(
  '/createReturnable',
  JwtMiddleware.checkToken,
   controller.addReturnable
  
);

router.get(
  '/getallOutlets',
  JwtMiddleware.checkToken,
  controller.getAllOutlets
);
// router.get(
//   '/:id',
//   idNumberControl,
//   JwtMiddleware.checkToken,
//   controller.getOneOutlet
// );

router.post(
  '/editOutlet',
  idNumberBodyControl,
  outletRules['update'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateOutlet(req, res, next);
  }
);

router.post('/listOutlets', JwtMiddleware.checkToken, controller.listOutlets);
router.post('/listReturnable', JwtMiddleware.checkToken, controller.listReturnable);
router.get('/returnablePDF', JwtMiddleware.checkToken, controller.returnablePDF); 

router.post('/listOutletsandwarehouse', JwtMiddleware.checkToken, controller.listOutletsandWarehouse);
router.post('/listOutletsforstocktransferreq', JwtMiddleware.checkToken, controller.listOutletsforstocktransferreq);


const outletRouter = router;

export default outletRouter;
