import MastersController from "./controller.js";
import JwtMiddleware from "../../config/jwtMiddleware.js";
import express from 'express';

const router = express.Router();

router.post('/', JwtMiddleware.checkToken,MastersController.getMastersData);

const mastersRouter = router;

export default mastersRouter;