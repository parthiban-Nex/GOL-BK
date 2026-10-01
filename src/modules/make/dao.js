import db from '../index.js';
import companyService from '../company/service.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const Make = db.makes;
const MakeCompanyMap = db.makecompanymaps;

const addMake = async (make, userId) => {
  try {
    return await Make.create({
      makeName: make.makeName,
      makeDescription: make.makeDescription,
      status: make.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Make dao addMake Error:', err);
    next(err);
  }
};

const addMakeCompanyMap = async (companyId, makeId, userId) => {
  // console.log('test');
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value.id,
        makeId: makeId,
        createdBy: userId,
      };
      MakeCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('Make dao addMakeCompanyMap Error:', err);
    next(err);
  }
};

const findByName = async (makeName) => {
  try {
    return await Make.findOne({ where: { makeName: makeName } });
  } catch (err) {
    logger.error('Make dao findByName Error:', err);
    next(err);
  }
};

const findByName_Id = async (makeName, id) => {
  let data = '';
  try {
    data = await Make.findOne({
      where: {
        makeName: makeName,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (err) {
    logger.error('Make dao findByName Error:', err);
  }
  return data;
};

const removeMakeCompanyMap = async (id) => {
  try {
    return await MakeCompanyMap.destroy({ where: { makeId: id } });
  } catch (err) {
    logger.error('Make dao removeMakeCompanyMap Error:', err);
    next(err);
  }
};

const findOne = async (id) => {
  try {
    return await Make.findOne({ where: { id: id } });
  } catch (err) {
    logger.error('Make dao findOne Error:', err);
    next(err);
  }
};

const updateMake = async (id, makeName, makeDescription, status, userId) => {
  // console.log('update');
  try {
    return await Make.update(
      {
        makeName: makeName,
        makeDescription: makeDescription,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Make dao updateMake Error:', err);
    next(err);
  }
};

const getAllMakes = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { makeName: { [Op.like]: `%${searchKey}%` } },
            { makeDescription: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const count = await Make.count({ where: searchCondition });

    const rows = await Make.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'makeName', 'makeDescription', 'status'],
      include: [{ model: MakeCompanyMap, as: 'makecompanymaps' }],
    });

    const resultList = [];

    for (const element of rows) {
      const resObj = {
        id: element.id,
        makeName: element.makeName,
        makeDescription: element.makeDescription,
        status: element.status,
        companylist: element.makecompanymaps
      };

      let companyname = '';
      for (const companyMap of element.makecompanymaps) {
        const companyData = await companyService.findById(companyMap.companyId);
        companyname += companyData.name + ',';
      }

      resObj['companies'] = companyname.slice(0, -1);

      resultList.push(resObj);
    }

    return {
      totalItems: count,
      data: resultList,
    };
  } catch (err) {
    logger.error('Make dao getAllMakes Error:', err);
    next(err);
  }
};
const listMakesOld = async () => {
  try {
    const data = await Make.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'makeName', 'makeDescription', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Make dao listMakes Error:', err);
    next(err);
  }
};

const listMakes = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'makeName', 'makeDescription', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: MakeCompanyMap,
          as: 'makecompanymaps',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await Make.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Make dao listMakes Error:', err);
    next(err);
  }
};

const getOneMake = async (id) => {
  try {
    const make = await Make.findOne({
      where: { id: id },
      include: [{ model: MakeCompanyMap, as: 'makecompanymaps' }],
    });
    if (!make) {
      throw new notFoundException();
    }
    return make;
  } catch (err) {
    logger.error('Make dao getOneMake Error:', err);
    next(err);
  }
};

const addMakeCompanyById = async (companyId, makeId, userId) => {
  try {
    return await MakeCompanyMap.create({
      companyId: companyId,
      makeId: makeId,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Make dao addMakeCompanyById Error:', err);
    next(err);
  }
}

const deleteMakeCompanyById = async (id) => {
  try {
    return await MakeCompanyMap.destroy({ where: { id: id }});
  } catch (err) {
    logger.error('Make dao deleteMakeCompanyById Error:', err);
    next(err);
  }
}

const updateMakeCompanyById = async (companyId, makeId, userId) => {
  try {
    return await MakeCompanyMap.update({
      companyId: companyId,
      makeId: makeId,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Make dao updateMakeCompanyById Error:', err);
    next(err);
  }
}

const dao = {
  addMake,
  addMakeCompanyMap,
  findByName,
  removeMakeCompanyMap,
  findOne,
  updateMake,
  getAllMakes,
  listMakes,
  getOneMake,
  findByName_Id,
  addMakeCompanyById,
  deleteMakeCompanyById,
  updateMakeCompanyById
};

export default dao;
