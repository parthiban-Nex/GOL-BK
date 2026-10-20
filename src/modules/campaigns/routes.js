import express from 'express';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';

const router = express.Router();

router.get('/constants', JwtMiddleware.checkToken, controller.getConstants);

router.get('/templates', JwtMiddleware.checkToken, controller.listTemplates);
router.post('/templates', JwtMiddleware.checkToken, controller.createTemplate);
router.get('/templates/:id', JwtMiddleware.checkToken, controller.getTemplateById);
router.patch('/templates/:id', JwtMiddleware.checkToken, controller.updateTemplate);
router.delete('/templates/:id', JwtMiddleware.checkToken, controller.deleteTemplate);
router.post('/templates/:id/preview', JwtMiddleware.checkToken, controller.previewTemplate);

router.post('/send', JwtMiddleware.checkToken, controller.sendCampaign);

router.get('/customers', JwtMiddleware.checkToken, controller.getCustomers);

export default router;
