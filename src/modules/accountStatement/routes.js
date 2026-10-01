import express from 'express';
import AccountStatementController from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// Cron job endpoint - can be called via URL (no auth for cron)
router.get('/download-statement', AccountStatementController.downloadStatement);

// Get mapped outlets for the logged-in user
router.get('/mapped-outlets', JwtMiddleware.checkToken, AccountStatementController.getMappedOutlets);

// Outlet endpoints
router.post('/outlet/list', JwtMiddleware.checkToken, AccountStatementController.getStatementsByOutlet);
router.post('/outlet/approve', JwtMiddleware.checkToken, AccountStatementController.approveStatement);
router.get('/outlet/download/:id', JwtMiddleware.checkToken, AccountStatementController.downloadStatementFile);

// Finance endpoints
router.get('/finance/download/:id', JwtMiddleware.checkToken, AccountStatementController.downloadStatementFile);

// Notification endpoints (shared - detects user type in controller)
router.get('/notifications/count', JwtMiddleware.checkToken, AccountStatementController.getNotificationCount);
router.get('/notifications/list', JwtMiddleware.checkToken, AccountStatementController.getNotifications);
router.post('/outlet/mark-read', JwtMiddleware.checkToken, AccountStatementController.markNotificationReadOutlet);
router.post('/fbm/mark-read', JwtMiddleware.checkToken, AccountStatementController.markNotificationReadFbm);

// FBM export endpoint
router.post('/fbm/export-csv', JwtMiddleware.checkToken, AccountStatementController.exportFbmStatementsCsv);

// Chat endpoints (shared by outlet and fbm)
router.post('/chat/send', JwtMiddleware.checkToken, upload.single('file'), AccountStatementController.sendStatementChat);
router.post('/chat/list', JwtMiddleware.checkToken, AccountStatementController.getStatementChats);

export default router;
