import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';

import express from 'express';

const router = express.Router();
router.post('/saveAuditLog', JwtMiddleware.checkToken, controller.saveAuditLog);
router.post('/getAuditLog', JwtMiddleware.checkToken, controller.getAuditLog);

const logApiRouter = router;

export default logApiRouter;
