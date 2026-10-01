import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';

const router = express.Router();

router.post('/create_alert', JwtMiddleware.checkToken, controller.createServiceReminder);

// router.post('/list_alert', JwtMiddleware.checkToken, controller.listServiceReminderAlert);
router.post('/list_alert', JwtMiddleware.checkToken, controller.getServiceReminderAlert);

router.post('/get_service_reminder', JwtMiddleware.checkToken, controller.getServiceReminderAlert);

router.post('/getServiceReminderReport', JwtMiddleware.checkToken, controller.getServiceReminderData);

router.post('/exportServiceReminder', JwtMiddleware.checkToken, controller.exportServiceReminderReport);

const serviceReminderRouter = router;

export default serviceReminderRouter;
