import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import express from 'express';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
const images = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
]);

const router = express.Router();

router.post(
  '/createNmsaAgent',
  JwtMiddleware.MobileCheckToken,images,
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
    JwtMiddleware.MobileCheckToken,
    controller.getAllNmsaDropdown
  );

router.post(
  '/editNmsaAgent',
  JwtMiddleware.MobileCheckToken,images,
  idNumberBodyControl,
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
  JwtMiddleware.MobileCheckToken,
  controller.listNmsaAgents
);
router.get(
    '/getOneNmsaAgent/:id',
    JwtMiddleware.MobileCheckToken,
    controller.getOneNmsaAgent
  );

router.post(
  '/listNmsaAgentsByPlanId',
  JwtMiddleware.MobileCheckToken,
  controller.listNmsaAgentsByPlanId
);

router.get(
  '/getDashboard',
  JwtMiddleware.MobileCheckToken,
  controller.getDashboard
);


router.post(
  '/createNmsaAgentMobile',
  JwtMiddleware.MobileCheckToken, images,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addNmsaAgentMobile(req, res, next);
  }
);

router.post(
  '/editNmsaAgentMobile',
  JwtMiddleware.MobileCheckToken, images,
  idNumberBodyControl,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateNmsaAgentMobile(req, res, next);
  }
);

router.post(
  '/listNmsaAgentsMobile',
  JwtMiddleware.MobileCheckToken,
  controller.listNmsaAgentsMobile
);

router.get(
  '/getOneNmsaAgentMobile/:id',
  JwtMiddleware.MobileCheckToken,
  controller.getOneNmsaAgentMobile
);

router.post(
  '/listNmsaAgentsByPlanIdMobile',
  JwtMiddleware.MobileCheckToken,
  controller.listNmsaAgentsByPlanIdMobile
);

const mobileNmsaAgentRouter = router;

export default mobileNmsaAgentRouter;
