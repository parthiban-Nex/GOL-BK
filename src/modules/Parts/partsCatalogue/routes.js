import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post('/general_search',JwtMiddleware.checkToken,controller.generalSearch)  
router.post('/getPartsList',JwtMiddleware.checkToken,controller.getPartsList)
router.post('/getVehicleCompatibility',JwtMiddleware.checkToken,controller.getVehicleCompatibility)
router.post('/getStock', JwtMiddleware.checkToken,controller.getStock)
router.post('/addToCart', JwtMiddleware.checkToken,controller.addToCart)
router.get('/getCartItems', JwtMiddleware.checkToken, controller.getCartItems);
router.post('/updateQuantity', JwtMiddleware.checkToken,controller.updateQty)
router.post('/removeItem', JwtMiddleware.checkToken,controller.deleteCartItem)
router.post('/placeOrder', JwtMiddleware.checkToken,controller.placeOrder)
router.get('/getOrderHistories', JwtMiddleware.checkToken,controller.getOrderHistories)
router.post('/getOrderStatus', JwtMiddleware.checkToken,controller.getOrderStatus)
router.post('/getMasterList', JwtMiddleware.checkToken,controller.getMasterList)
router.post('/catalogueLogin', JwtMiddleware.checkToken,controller.catalogueLogin)
router.post('/placeOrderNew', JwtMiddleware.checkToken,controller.placeOrderNew)

router.post('/getPartsListForJc',JwtMiddleware.checkToken,controller.getPartsListForJc)
router.get('/getCategoryImage', JwtMiddleware.checkToken, controller.getCategoryImage);
router.get('/getSubCategoryImage', JwtMiddleware.checkToken, controller.getSubCategoryImage);
router.post(
  "/vehicleFuzzyMatch",
  JwtMiddleware.checkToken,
  controller.vehicleFuzzyMatch
);
router.post('/vehicleResolve', JwtMiddleware.checkToken, controller.vehicleResolve);
router.get('/getOrderHistoriesForGms', JwtMiddleware.checkToken,controller.getOrderHistoriesForGms)

const partsCatalogueRouter = router;

export default partsCatalogueRouter;
