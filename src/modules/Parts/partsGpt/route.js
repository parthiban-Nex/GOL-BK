import controller from './controller.js';
import multer from 'multer';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

const uploadMiddleware = upload.any();

router.get('/suggestions',JwtMiddleware.checkToken,controller.getSuggestions)  
router.post('/searchParts',JwtMiddleware.checkToken,controller.searchParts) 
router.post('/searchPartsWithImage',JwtMiddleware.checkToken,uploadMiddleware,controller.searchPartsWithImage) 
router.post('/searchVehicleSpecifications',JwtMiddleware.checkToken,controller.searchVehicleSpecifications) 

const partsGptRouter = router;

export default partsGptRouter;
