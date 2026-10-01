import schemeController from "./controller.js";
import express from 'express';
import JwtMiddleware from "../../config/jwtMiddleware.js";

const router = express.Router();

router.post('/createScheme', JwtMiddleware.checkToken, schemeController.createScheme);

router.post('/getScheme', JwtMiddleware.checkToken, schemeController.getSchemeData);

router.post('/createSchemeLabor', JwtMiddleware.checkToken, schemeController.createSchemeLabor);

router.post('/getSchemeLabor', JwtMiddleware.checkToken, schemeController.getSchemeLaborData);

router.post('/createSchemePart', JwtMiddleware.checkToken, schemeController.createSchemePart);

router.post('/getSchemePart', JwtMiddleware.checkToken, schemeController.getSchemePartData);

const schemeRouter = router;

export default schemeRouter;