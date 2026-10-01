import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import express from 'express';

const router = express.Router();

// Pickup
router.post('/pickupList', JwtMiddleware.checkToken, controller.listPickup);
router.post('/getPickup', JwtMiddleware.checkToken, controller.getPickup);
router.post('/savePickup', JwtMiddleware.checkToken, controller.savePickup);

// Dropoff (booking based)
router.post('/dropoffList', JwtMiddleware.checkToken, controller.listDropoff);
router.post('/getDropoff', JwtMiddleware.checkToken, controller.getDropoff);
router.post('/saveDropoff', JwtMiddleware.checkToken, controller.saveDropoff);

// Dropoff (job card / transaction based)
router.post('/getJcDropoff', JwtMiddleware.checkToken, controller.getJcDropoff);
router.post('/saveJcDropoff', JwtMiddleware.checkToken, controller.saveJcDropoff);

// Shared
router.post('/drivers', JwtMiddleware.checkToken, controller.listDrivers);
router.post('/setDropStatus', JwtMiddleware.checkToken, controller.setDropStatus);

const pickupDropoffRouter = router;

export default pickupDropoffRouter;
