import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import multer from 'multer';
import express from 'express';

const router = express.Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });


router.post(
  '/saveInventoryImage',
  JwtMiddleware.checkToken,
  upload.single('picture'),
  async (req, res, next) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return next(new ValidationException(errors.array()));
    // }
    return await controller.addImage(req, res, next);
  }
);

const mobileImageRouter = router;
export default mobileImageRouter;
