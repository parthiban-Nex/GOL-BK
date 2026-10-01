import controller from './controller.js';
import JwtMiddleware from '../../config/jwtMiddleware.js';
import { menuRules, subMenuRules } from './rules/rule.js';
import express from 'express';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';

const router = express.Router();

router.post('/getMenuList', JwtMiddleware.checkToken, controller.getMenuList);
router.post(
  '/getMenuListGrid',
  JwtMiddleware.checkToken,
  controller.getMenuListGrid
);

router.post(
  '/getSubMenuList',
  JwtMiddleware.checkToken,
  controller.getSubMenuList
);
router.post(
  '/getMenuListByRole',
  JwtMiddleware.checkToken,
  controller.getMenuListByRole
);
router.post(
  '/getSubMenuListGrid',
  JwtMiddleware.checkToken,
  controller.getSubMenuListGrid
);

router.post(
  '/createMenu',
  JwtMiddleware.checkToken,
  menuRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createMenu(req, res, next);
  }
);
router.post(
  '/updateMenu',
  JwtMiddleware.checkToken,
  menuRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateMenu(req, res, next);
  }
);

router.post(
  '/createSubMenu',
  JwtMiddleware.checkToken,
  subMenuRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.createSubMenu(req, res, next);
  }
);
router.post(
  '/updateSubMenu',
  JwtMiddleware.checkToken,
  subMenuRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateSubMenu(req, res, next);
  }
);

router.post(
  '/createRoleMenu',
  JwtMiddleware.checkToken,
  controller.createRoleMenu
);
router.post(
  '/createRoleSubMenu',
  JwtMiddleware.checkToken,
  controller.createRoleSubMenu
);

router.post(
  '/getSubmenuData',
  JwtMiddleware.checkToken,
  controller.getSubmenuData
);
router.post(
  '/addRoleMenuTab',
  JwtMiddleware.checkToken,
  controller.addRoleMenuTab
);
router.post(
  '/getRoleMenuTabs',
  JwtMiddleware.checkToken,
  controller.getRoleMenuTabs
);
router.post(
  '/deleteRoleMenuTab',
  JwtMiddleware.checkToken,
  controller.deleteRoleMenuTab
);
router.post(
  '/updateRoleMenuTab',
  JwtMiddleware.checkToken,
  controller.updateRoleMenuTab
);

const menuSettingsRouter = router;

export default menuSettingsRouter;
