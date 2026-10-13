import express from 'express';
import controller from './controller.js';
import partsCatalogueController from '../../Parts/partsCatalogue/controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';

const router = express.Router();

// Global Catalog General Search endpoint
router.post('/partsmart/generalSearch', controller.generalSearch);

// Global Catalog getMasterList endpoint (defaults customerCode to "0046")
router.post('/partsmart/getMasterList', JwtMiddleware.checkToken, controller.getGlobalMasterList);

// Global Catalog getPartsList endpoint (defaults customerCode to "0046")
router.post('/partsmart/getPartsList', JwtMiddleware.checkToken, controller.getGlobalPartsList);

// Global Catalog Cart endpoints
router.get('/getCart', JwtMiddleware.checkToken, controller.getGlobalCart);
router.get('/getCartItems', JwtMiddleware.checkToken, controller.getGlobalCart);
router.post('/addCart', JwtMiddleware.checkToken, controller.addGlobalCart);
router.post('/addToCart', JwtMiddleware.checkToken, partsCatalogueController.addToCart);
router.post('/updateQuantity', JwtMiddleware.checkToken, partsCatalogueController.updateQty);
router.post('/removeItem', JwtMiddleware.checkToken, partsCatalogueController.deleteCartItem);
router.get('/getOrderHistories', JwtMiddleware.checkToken, partsCatalogueController.getOrderHistories);
router.post('/placeOrderNew', JwtMiddleware.checkToken, partsCatalogueController.placeOrderNew);

// Vahan & Vehicle Resolve Endpoints
router.post('/vehicleResolve', controller.resolveVehicle);
router.get('/getVahanDetails', controller.getVahanDetails);

const globalCatelogRouter = router;
export default globalCatelogRouter;

