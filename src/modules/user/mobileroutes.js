import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { userRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import express from 'express';
//import express, { Router,} from "express";
const router = express.Router();
// use routers


router.post('/login', controller.loginMobile);
router.all('/login', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post('/CreateGmsRedirctUrl',JwtMiddleware.MobileCheckToken ,controller.CreateGmsRedirctUrl);
router.all('/CreateGmsRedirctUrl', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post('/saveattendence', JwtMiddleware.MobileCheckToken,controller.saveattendence);


const mobileUserRouter = router;

export default mobileUserRouter;
