import express from 'express';
import multer from 'multer';
import controller from './controller.js';
import partsCatalogueController from '../Parts/partsCatalogue/controller.js';
import globalController from './Global/controller.js';
import globalCatelogRouter from './Global/routes.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

// Master list endpoint for dynamic filters
router.post('/partsmart/getMasterList', JwtMiddleware.checkToken, controller.getMasterList);

// General Search endpoint
router.post('/partsmart/generalSearch', globalController.generalSearch);

// Parts list endpoint
router.post('/partsmart/getPartsList', JwtMiddleware.checkToken, controller.getPartsList);

// Image proxy endpoint
router.get('/partsmart/image', controller.proxyImage);

// Cart endpoints
router.get('/getCart', JwtMiddleware.checkToken, controller.getCart);
router.get('/getCartItems', JwtMiddleware.checkToken, controller.getCart);
router.post('/addCart', JwtMiddleware.checkToken, controller.addCart);
router.post('/addToCart', JwtMiddleware.checkToken, partsCatalogueController.addToCart);
router.post('/updateQuantity', JwtMiddleware.checkToken, partsCatalogueController.updateQty);
router.post('/removeItem', JwtMiddleware.checkToken, partsCatalogueController.deleteCartItem);

// Orders / Enquiries endpoints
router.get('/orders', JwtMiddleware.checkToken, controller.getOrders);
router.get('/getOrderHistories', JwtMiddleware.checkToken, partsCatalogueController.getOrderHistories);
router.post('/placeOrderNew', JwtMiddleware.checkToken, partsCatalogueController.placeOrderNew);
router.post('/getOrderStatus', JwtMiddleware.checkToken, partsCatalogueController.getOrderStatus);
router.post('/partsmart/order/direct-enquiry/create', JwtMiddleware.checkToken, controller.createDirectEnquiryOrder);
router.post('/partsmart/order/direct-enquiry/status', JwtMiddleware.checkToken, controller.getDirectEnquiryOrderStatus);

// Top 20 Cars endpoints
router.get('/top20cars', JwtMiddleware.checkToken, controller.getTop20Cars);
router.post('/top20cars', JwtMiddleware.checkToken, controller.createTop20Car);

// Vahan & Vehicle Resolve Endpoints
router.post('/vehicleResolve', controller.resolveVehicle);
router.get('/getVahanDetails', controller.getVahanDetails);

// Lubes Products endpoints
router.get('/list', controller.getLubesProducts);
router.post('/list', controller.getLubesProducts);
router.get('/LubesProducts/list', controller.getLubesProducts);
router.post('/LubesProducts/list', controller.getLubesProducts);

router.post('/upload', upload.single('file'), controller.uploadLubesProducts);
router.post('/LubesProducts/upload', upload.single('file'), controller.uploadLubesProducts);

router.post('/seed', controller.seedLubesProducts);
router.post('/LubesProducts/seed', controller.seedLubesProducts);

router.patch('/update', controller.updateLubesProduct);
router.patch('/LubesProducts/update', controller.updateLubesProduct);
router.post('/update', controller.updateLubesProduct);
router.post('/LubesProducts/update', controller.updateLubesProduct);

router.post('/create', controller.createLubesProduct);
router.post('/insert', controller.createLubesProduct);
router.post('/LubesProducts/create', controller.createLubesProduct);
router.post('/LubesProducts/insert', controller.createLubesProduct);

// Global Catalog routes
router.use('/global', globalCatelogRouter);

const catelogRouter = router;
export default catelogRouter;



