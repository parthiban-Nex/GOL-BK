import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import express from 'express';
import multer from 'multer';
const router = express.Router();

// Same memory-storage / 2 MB config as the web routes (routes.js) — used by chat/send.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});


 router.post('/getStatementsByOutletForGms',JwtMiddleware.MobileCheckToken,controller.getStatementsByOutletForGms)

// ===== Mobile SOA routes (full parity with web /api/accountStatement) =====
// Namespaced under /soa to avoid path collisions on the shared /api/apis mount.
// All use MobileCheckToken (validates mobile_token) and reuse the SAME controllers as web.

// Mapped outlets for the logged-in user
router.get('/soa/mapped-outlets', JwtMiddleware.MobileCheckToken, controller.getMappedOutlets);

// Outlet endpoints
router.post('/soa/outlet/list', JwtMiddleware.MobileCheckToken, controller.getStatementsByOutlet);
router.post('/soa/outlet/approve', JwtMiddleware.MobileCheckToken, controller.approveStatement);
router.get('/soa/outlet/download/:id', JwtMiddleware.MobileCheckToken, controller.downloadStatementFile);

// Finance endpoint (same controller as outlet download)
router.get('/soa/finance/download/:id', JwtMiddleware.MobileCheckToken, controller.downloadStatementFile);

// Notification endpoints (detect user type inside the controller)
router.get('/soa/notifications/count', JwtMiddleware.MobileCheckToken, controller.getNotificationCount);
router.get('/soa/notifications/list', JwtMiddleware.MobileCheckToken, controller.getNotifications);
router.post('/soa/outlet/mark-read', JwtMiddleware.MobileCheckToken, controller.markNotificationReadOutlet);
router.post('/soa/fbm/mark-read', JwtMiddleware.MobileCheckToken, controller.markNotificationReadFbm);

// FBM export endpoint
router.post('/soa/fbm/export-csv', JwtMiddleware.MobileCheckToken, controller.exportFbmStatementsCsv);

// Chat endpoints (shared by outlet and fbm); chat/send accepts one optional file attachment
router.post('/soa/chat/send', JwtMiddleware.MobileCheckToken, upload.single('file'), controller.sendStatementChat);
router.post('/soa/chat/list', JwtMiddleware.MobileCheckToken, controller.getStatementChats);

const mobileSoaRouter = router;

export default mobileSoaRouter;
