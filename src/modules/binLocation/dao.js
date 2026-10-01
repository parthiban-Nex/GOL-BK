import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const BinLocation = db.binLocations;

const addBinLocation = async (binLocation, userId) => {
  try {
    return await BinLocation.create({
      binLocation: binLocation.binLocation,
      binLocationDescription: binLocation.binLocationDescription,
      outletCode: binLocation.outletCode,
      status: binLocation.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('BinLocation dao addBinLocation Error:', err);
    next(err);
  }
};
const updateBinLocation = async (id, binLocation, userId) => {
  let data = {};
  try {
    data = await BinLocation.update(
      {
        binLocation: binLocation.binLocation,
        binLocationDescription: binLocation.binLocationDescription,
        outletCode: binLocation.outletCode,
        status: binLocation.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('BinLocation dao updateBinLocation Error:', err);
    next(err);
  }
  return data;
};

const getBinLocation = async (id) => {
  try {
    const binlocation = await BinLocation.findOne({
      where: { id: id },
    });
    if (!binlocation) {
      throw new notFoundException();
    }
    return binlocation;
  } catch (err) {
    logger.error('BinLocation dao getBinLocation', err);
    next(err);
  }
};

const listBinLocations = async (reqData,user) => {
  try {
    const { searchKey, offset, limit,isPartUser } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { binLocation: { [Op.like]: `%${searchKey}%` } },
            { binLocationDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        
        }
      : {};
      let outletCondition= isPartUser ? {
            outletCode: user.outlet.outletCode
      }:{}
    const count = await BinLocation.count({
      where: {...searchCondition,...outletCondition},
    });
    const rows = await BinLocation.findAll({
      where: {...searchCondition,...outletCondition},
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'binLocation',
        'binLocationDescription',
        'outletCode',
        'status',
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('BinLocation dao listBinLocations', err);
    console.log(err);
  }
};

const findByBinLocation = async (binLocation) => {
  try {
    return await BinLocation.findOne({ where: { binLocation: binLocation } });
  } catch (err) {
    logger.error('BinLocation dao findByBinLocation Error:', err);
    next(err);
  }
};

const checkUnique = async (binLocation, id) => {
  let data = '';
  try {
    data = await BinLocation.findOne({
      where: {
        binLocation: binLocation,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const listBinLocationsForOutlet = async (reqData,user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { binLocation: { [Op.like]: `%${searchKey}%` } },
            { binLocationDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};
   
    const rows = await BinLocation.findAll({
      where: {...searchCondition},
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'binLocation',
        'binLocationDescription',
        'outletCode',
        'status',
      ],
    });
    return rows
    
  } catch (err) {
    logger.error('BinLocation dao listBinLocations', err);
    console.log(err);
  }
};

const getAllBinLocationByBinlocaionAndOutletCode = async (binarray) => {
  try {
    const binlocation = await BinLocation.findAll({
      where: { binLocation: { [Op.in]: binarray.map(bin => bin.binLocation) }, outletCode: { [Op.in]: binarray.map(bin => bin.outletCode) } },
    });
    
    return binlocation;
  } catch (err) {
    logger.error('BinLocation dao getBinLocation', err);
    next(err);
  }
};

const bulkCreateBinLocation = async (binarray) => {
  try {
    return await BinLocation.bulkCreate(binarray);
  } catch (err) {
    logger.error('BinLocation dao addBinLocation Error:', err);
    next(err);
  }
};
const dao = {
  addBinLocation,
  updateBinLocation,
  getBinLocation,
  listBinLocations,
  findByBinLocation,
  checkUnique,
  listBinLocationsForOutlet,
  getAllBinLocationByBinlocaionAndOutletCode,
  bulkCreateBinLocation
};

export default dao;
