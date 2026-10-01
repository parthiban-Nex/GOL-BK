import controller from './controller.js';
import DmsToken from '../../../config/dmsToken.js';
import express from 'express';
const router = express.Router();

router.post('/general_search',DmsToken.checkCatalogueToken,controller.generalSearch)  
router.post('/getPartsList',DmsToken.checkCatalogueToken,controller.getPartsList)
router.post('/getVehicleCompatibility',DmsToken.checkCatalogueToken,controller.getVehicleCompatibility)
router.post('/getStock', DmsToken.checkCatalogueToken,controller.getStock)
router.post('/addToCart', DmsToken.checkCatalogueToken,controller.addToCart)
router.get('/getCartItems', DmsToken.checkCatalogueToken, controller.getCartItems);
router.post('/updateQuantity', DmsToken.checkCatalogueToken,controller.updateQty)
router.post('/removeItem', DmsToken.checkCatalogueToken,controller.deleteCartItem)
router.post('/placeOrder', DmsToken.checkCatalogueToken,controller.placeOrder)
router.get('/getOrderHistories', DmsToken.checkCatalogueToken,controller.getOrderHistories)
router.post('/getOrderStatus', DmsToken.checkCatalogueToken,controller.getOrderStatus)
router.post('/getMasterList', DmsToken.checkCatalogueToken,controller.getMasterList)
router.post('/catalogueLogin', DmsToken.checkCatalogueToken,controller.catalogueLogin)
router.post('/placeOrderNew', DmsToken.checkCatalogueToken,controller.placeOrderNew)

router.post('/getPartsListForJc',DmsToken.checkCatalogueToken,controller.getPartsListForJc)
router.get('/getCategoryImage', DmsToken.checkCatalogueToken, controller.getCategoryImage);
router.get('/getSubCategoryImage', DmsToken.checkCatalogueToken, controller.getSubCategoryImage);
router.post(
  "/vehicleFuzzyMatch",
  DmsToken.checkCatalogueToken,
  controller.vehicleFuzzyMatch
);
router.post('/vehicleResolve', DmsToken.checkCatalogueToken, controller.vehicleResolve);

const partsCatalogueRouter = router;

export default partsCatalogueRouter;
