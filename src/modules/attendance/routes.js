import express from 'express';
import multer from 'multer'; 
import path from 'path';
import fs from 'fs';
import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';

const uploadDir = path.resolve('src/uploads/attendance');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `regularisation-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG and JPG/JPEG images are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

const uploadAttachment = (req, res, next) => {
  upload.fields([
    { name: 'attachment', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          requestSuccessful: false,
          message: 'Attachment file size exceeds 5MB limit.',
        });
      }
      return res.status(400).json({
        requestSuccessful: false,
        message: err.message || 'File upload error',
      });
    }
    if (req.files) {
      req.file = req.files['attachment']?.[0] || req.files['file']?.[0] || req.files['image']?.[0] || null;
    }
    next();
  });
};

const router = express.Router();

// Disable disk and browser caching for attendance API endpoints
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// 1. Employees under logged-in person
router.get('/employees', JwtMiddleware.checkToken, controller.getEmployees);

// 2. Regularisations
router.post('/regularisations', JwtMiddleware.checkToken, uploadAttachment, controller.submitRegularisation);

// 3. Mark Attendance list & bulk save
router.get('/mark', JwtMiddleware.checkToken, controller.getTodayMarkList);
router.post('/mark', JwtMiddleware.checkToken, controller.saveMarksBulk);

// 4. Analytics & Excel Export
router.get('/analytics', JwtMiddleware.checkToken, controller.getAnalytics);
router.get('/analytics/export', JwtMiddleware.checkToken, controller.exportAnalytics);

// 5. Details Table & Excel Export
router.get('/details/export', JwtMiddleware.checkToken, controller.exportDetails);
router.get('/details', JwtMiddleware.checkToken, controller.getDetailsTable);

export default router;
