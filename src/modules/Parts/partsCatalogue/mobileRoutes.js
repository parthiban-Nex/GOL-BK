import controller from './controller.js';
import JwtMiddleware from '../../../config/jwtMiddleware.js';
import express from 'express';
const router = express.Router();

router.post('/getOrderStatus', JwtMiddleware.MobileCheckToken,controller.getOrderStatus)
router.get('/getOrderHistoriesForGms', JwtMiddleware.MobileCheckToken,controller.getOrderHistoriesForGms)

const partsCatalogueMobileRouter = router;

export default partsCatalogueMobileRouter;
