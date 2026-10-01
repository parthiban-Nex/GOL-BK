/**
 * @swagger
 * /getItems:
 *   post:
 *     summary: Get all items
 *     description: Retrieves a list of all items in the system.
 *     tags:
 *       - Items
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: A list of all items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The auto-generated id of the item
 *                   title:
 *                     type: string
 *                     description: The title of the item
 *                   description:
 *                     type: string
 *                     description: A description of the item
 *                   published:
 *                     type: boolean
 *                     description: Whether the item has been finished or published
 *       401:
 *         description: Unauthorized. No valid token provided.
 *       500:
 *         description: Internal server error
 */

import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';
import { validationResult } from 'express-validator';
import ValidationException from '../../shared/validationException.js';
import idNumberControl from '../../shared/idNumberControl.js';
import idNumberBodyControl from '../../shared/idNumberBodyControl.js';
import { itemRules } from './rules/rule.js';
import express from 'express';

const router = express.Router();

router.post(
  '/createItem',
  JwtMiddleware.checkToken,
  itemRules['create'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.addItem(req, res, next);
  }
);

router.post('/getItems', JwtMiddleware.checkToken, controller.getAllItems);

router.post('/parts_master', JwtMiddleware.checkToken, controller.getAllItemsMobile);
router.all('/parts_master', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});

router.get(
  '/:id',
  idNumberControl,
  JwtMiddleware.checkToken,
  controller.getOneItem
);

router.post(
  '/updateItem',
  idNumberBodyControl,
  JwtMiddleware.checkToken,
  itemRules['update'],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    return await controller.updateItem(req, res, next);
  }
);

router.post(
  '/searchItemDetails',
  JwtMiddleware.checkToken,
  controller.searchItemDetails
);

router.post(
  '/getItemDetails',
  JwtMiddleware.checkToken,
  controller.getItemDetails
);

router.post(
  '/poSearchItemDetails',
  JwtMiddleware.checkToken,
  controller.poSearchItemDetails
);

const itemRouter = router;

export default itemRouter;
