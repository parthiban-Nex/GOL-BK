import express from 'express';
import multer from 'multer';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import controller from './controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

router.post(
  '/adminOutletUpload',
  JwtMiddleware.checkToken,
  upload.single('file'),
  async (req, res, next) => controller.adminOutletUpload(req, res, next)
);

router.post(
  '/validateFranchiseUpload',
  JwtMiddleware.checkToken,
  upload.single('file'),
  async (req, res, next) => controller.validateFranchiseUpload(req, res, next)
);

const franchiseRouter = router;
export default franchiseRouter;
