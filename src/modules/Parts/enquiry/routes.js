import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
import multer from 'multer';
import EnquiryService from './service.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

router.post(
  '/CreateEnquiry',
  JwtMiddleware.checkToken,upload.single("file"),EnquiryService.CreateOrGetEnquiryToken,
  controller.CreateEnquiry
);

router.post(
  '/GetEnquiryIndent',
  JwtMiddleware.checkToken,EnquiryService.CreateOrGetEnquiryToken,
  controller.GetEnquiryIndent
);

router.post(
  '/GetEnquiryChat',
  JwtMiddleware.checkToken,
  controller.GetEnquiryChat
);

router.post(
  '/CreateEnquiryChat',
  JwtMiddleware.checkToken,upload.single("file"),EnquiryService.CreateOrGetEnquiryToken,
  controller.CreateEnquiryChat
);

router.post(
  '/WebhookEnquiryChat',
  EnquiryService.WebhookEnquiryChat
);

router.post(
  '/GetEnquiry',
  JwtMiddleware.checkToken,
  controller.GetEnquiry
);

router.post(
  '/CreateEnquiryOnly',
  JwtMiddleware.checkToken,EnquiryService.CreateOrGetEnquiryToken,
  controller.CreateEnquiryOnly
);

router.post(
  '/CreateOrGetEnquiryToken',
  JwtMiddleware.checkToken,controller.CreateOrGetEnquiryTokenForSocket
)

const enquiryRouter = router;

export default enquiryRouter;