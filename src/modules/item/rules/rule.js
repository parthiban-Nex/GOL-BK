import { check } from 'express-validator';
import ItemService from '../service.js';
import validateCompanyMap from '../../../shared/validateCompanyMap.js';

export const itemRules = {
  create: [
    check('itemCode')
      .notEmpty()
      .withMessage('please enter a Item Code')
      .bail()
      .custom(async (itemCode) => {
        return ItemService.findByCode(itemCode).then((exists) => {
          if (exists) {
            return Promise.reject('Item Code must be unique');
          }
        });
      })
      .withMessage('Item Code must be unique'),

    check('itemName').notEmpty().withMessage('please enter a Item Name'),
    check('itemDescription')
      .notEmpty()
      .withMessage('please enter a Item Description '),

    check('itemgroupId').notEmpty().withMessage('please select a Item Group '),
    check('uomId').notEmpty().withMessage('please select a Uom '),
    check('itemcategoryId')
      .notEmpty()
      .withMessage('please select a Item Category'),
    check('hsnId').notEmpty().withMessage('please select a Model '),
    check('hsnCode').notEmpty().withMessage('please select a Model '),
    check('makeId').notEmpty().withMessage('please select a Model '),
    check('makeId').notEmpty().withMessage('please select a Make '),
    check('aggregateId').notEmpty().withMessage('please select a Aggregate '),
    check('subaggregateId')
      .notEmpty()
      .withMessage('please select a Sub Aggregate '),
    check('vehicletypeId')
      .notEmpty()
      .withMessage('please select a vehicletype '),

    check('list').notEmpty().withMessage('please Enter List Price '),
    check('list').isDecimal().withMessage('please Enter Decimal Price '),
    check('mrp').notEmpty().withMessage('please Enter mrp'),
    check('mrp').isDecimal().withMessage('please Enter Decimal Price '),
    check('cost').notEmpty().withMessage('please Enter Cost Price '),
    check('cost').isDecimal().withMessage('please Enter Decimal Price '),
    check('taxPercentage').notEmpty().withMessage('please Enter Tax '),
    check('taxPercentage')
      .isDecimal()
      .withMessage('please Enter Decimal Price '),

    check('status').notEmpty().withMessage('please select a status'),

    check('companyId')
      .notEmpty()
      .withMessage('please enter a company id')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),
  ],

  update: [
    check('itemCode')
      .notEmpty()
      .withMessage('please enter a Item Code')
      .bail()
      .custom(async (itemCode, { req }) => {
        return ItemService.findByCode_Id(itemCode, req.body.id).then(
          (exists) => {
            if (exists) {
              return Promise.reject('Item Code must be unique');
            }
          }
        );
      })
      .withMessage('Item Code must be unique'),
    check('itemName').notEmpty().withMessage('please enter a Item Name'),
    check('itemDescription')
      .notEmpty()
      .withMessage('please enter a Item Description '),

    check('itemgroupId').notEmpty().withMessage('please select a Item Group '),
    check('uomId').notEmpty().withMessage('please select a Uom '),
    check('itemcategoryId')
      .notEmpty()
      .withMessage('please select a Item Category'),
    check('hsnId').notEmpty().withMessage('please select a Model '),
    check('hsnCode').notEmpty().withMessage('please select a Model '),
    check('makeId').notEmpty().withMessage('please select a Model '),
    check('makeId').notEmpty().withMessage('please select a Make '),
    check('aggregateId').notEmpty().withMessage('please select a Aggregate '),
    check('subaggregateId')
      .notEmpty()
      .withMessage('please select a Sub Aggregate '),
    check('vehicletypeId')
      .notEmpty()
      .withMessage('please select a vehicletype '),

    check('list').notEmpty().withMessage('please Enter List Price '),
    check('list').isDecimal().withMessage('please Enter Decimal Price '),
    check('mrp').notEmpty().withMessage('please Enter mrp'),
    check('mrp').isDecimal().withMessage('please Enter Decimal Price '),
    check('cost').notEmpty().withMessage('please Enter Cost Price '),
    check('cost').isDecimal().withMessage('please Enter Decimal Price '),
    check('taxPercentage').notEmpty().withMessage('please Enter Tax '),
    check('taxPercentage')
      .isDecimal()
      .withMessage('please Enter Decimal Price '),

    check('status').notEmpty().withMessage('please select a status'),

    check('companyId')
      .notEmpty()
      .withMessage('please enter a company id')
      .bail()
      .custom(async (companyId) => {
        return validateCompanyMap.findByCompanyId(companyId).then((exists) => {
          if (exists.length !== companyId.length) {
            return Promise.reject('company Id not found');
          }
        });
      })
      .withMessage('company Id not found'),
  ],
};
