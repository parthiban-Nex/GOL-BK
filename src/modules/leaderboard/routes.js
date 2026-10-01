import express from 'express';
import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';

const router = express.Router();

router.get('/filters', JwtMiddleware.checkToken, controller.filters);
router.post('/serviceAdvisor', JwtMiddleware.checkToken, controller.serviceAdvisor);
router.post('/technician', JwtMiddleware.checkToken, controller.technician);
router.post('/partsIncharge', JwtMiddleware.checkToken, controller.partsIncharge);

export default router;
