import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { userRules } from './rules/rule.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import express from 'express';
// import {progressiveLoginRateLimiter} from '../../config/loginRateLimiter.js';
// import { doubleCsrfProtection } from '../../config/csrfmiddleware.js';
//import express, { Router,} from "express";
const router = express.Router();
// use routers
router.post('/register', userRules['forRegister'], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }
  return await controller.addUser(req, res);
});

router.post(
  '/createUser',
  userRules['forRegister'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createUser(req, res);
  }
);

router.post(
  '/updateUser',
  userRules['forUpdate'],
  JwtMiddleware.checkToken,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateUser(req, res);
  }
);

router.post('/login',
  // progressiveLoginRateLimiter
  // ,doubleCsrfProtection,
  controller.login);

router.post('/login_mobile', controller.loginMobile);
router.all('/login_mobile', (req, res) => {
 
  if (req.method !== 'POST') {
    //  console.log('route path trigger');
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.post('/validate', controller.validateToken);
router.post('/menuList', JwtMiddleware.checkToken, controller.menuList);
router.post('/getAppConfig', JwtMiddleware.checkToken, controller.getAppConfig);
router.post('/getUserRoles', JwtMiddleware.checkToken, controller.getUserRoles);

router.post('/logout', JwtMiddleware.checkToken, controller.logout);
router.post('/getUserLogs', JwtMiddleware.checkToken, controller.getUserLog);

// Users router
router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneUser
);

router.post(
  '/employeeRoleMapping',
  userRules['employeeRoleMap'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.employeeRoleMapping(req, res, next);
  }
);

router.post('/getRoles', JwtMiddleware.checkToken, controller.getRoles);
router.post(
  '/getSecondryRoles',
  JwtMiddleware.checkToken,
  controller.getSecondryRoles
);
router.post('/listUsers', JwtMiddleware.checkToken, controller.listUsers);
router.post('/deleteUser', JwtMiddleware.checkToken, async (req, res, next) => {
  return await controller.deleteUser(req, res, next);
});

router.post('/forgetPassword', controller.emailToForgotPwd); 
router.post('/resetPassword', controller.resetPassword); 
router.post('/gmsLogin', controller.gmsLogin);
//router.post('/employeeRoleMapping', controller.employeeRoleMapping);
router.post('/gmsmenuList',JwtMiddleware.checkToken, controller.gmsmenuList);
router.post('/bridge_login', controller.bridge_login);
router.post('/CreatePartsCatalogueRedirctUrl', controller.CreatePartsCatalogueRedirctUrl);
router.post('/dmsLogin', controller.dmsPartsCatalogueLogin);



router.post('/authV2',controller.checkSecretPin);

//module.exports = router;

const userRouter = router;

export default userRouter;
