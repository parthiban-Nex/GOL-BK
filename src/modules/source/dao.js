import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import companyService from '../company/service.js';
import { Op } from 'sequelize';
const Source = db.sources;
const SourceTypes = db.sourcetypes;
const SourceCompanyMap = db.sourcecompanymaps;

const addSource = async (source, userId) => {
  
  try {
    return await Source.create({
      sourceName: source.sourceName,
      status: source.status,
      bridge_status : source.bridgeStatus,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Source Dao addSource Error:', err);
    next(err);
  }
};

const addSourceCompanyMap = async (companyId, sourceId) => {
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value,
        sourceId: sourceId,
      };
      SourceCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('Source Dao addSourceCompanyMap Error:', err);
    next(err);
  }
};

const getAllSourceOld = async (companyId) => {
  try {
    const data = await Source.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceName', 'status'],
      include: [
        {
          model: db.sourcecompanymaps,
          as: 'sourcecompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ],
    });
    return data;
  } catch (err) {
    logger.error('Source Dao getAllSource Error:', err);
    next(err);
  }
};

const getAllSource = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceName', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: db.sourcecompanymaps,
          as: 'sourcecompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await Source.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Source Dao getAllSourceByCompanyIdAndRoleId Error:', err);
    next(err);
  }
};

const removeSourceCompanyMap = async (id) => {
  try {
    return await SourceCompanyMap.destroy({ where: { sourceId: id } });
  } catch (err) {
    logger.error('Source Dao removeSourceCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (sourceName) => {
  try {
    return await Source.findOne({ where: { sourceName: sourceName } });
  } catch (err) {
    logger.error('Source Dao findByCode Error:', err);
    next(err);
  }
};

const getSource = async (id) => {
  try {
    const source = await Source.findOne({
      where: { id: id },
      include: [{ model: SourceCompanyMap, as: 'sourcecompanymap' }],
    });
    if (!source) {
      throw new notFoundException();
    }
    return source;
  } catch (err) {
    logger.error('Source Dao getSource Error:', err);
    next(err);
  }
};

const getSourceByName = async (sourceName) => {
  try {
    const source = await Source.findOne({
      where: { sourceName: sourceName },
      include: [{ model: SourceTypes, as: 'sourcetypes',
        where: { status: 1 }
       }],
    });
    return source;
  } catch (err) {
    logger.error('Source Dao getSource Error:', err);
    next(err);
  }
};

const updateSource = async (id, sourceName, status,bridgeStatus, userId) => {
  try {
    return await Source.update(
      {
        sourceName: sourceName,
        status: status,
        bridge_status:bridgeStatus,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Source Dao updateSource Error:', err);
    next(err);
  }
};

const deleteSource = async (id) => {
  try {
    const data = await Source.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Source Dao deleteSource Error:', err);
    next(err);
  }
};

const listSources = async (reqBody) => {
  try {
    const { searchKey, offset, limit,bridge_status } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ sourceName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
      //alter this api to match bridge requirement 
        if (
      reqBody.hasOwnProperty('bridge_status') &&
      (bridge_status === true ||
        bridge_status === 1 ||
        bridge_status === '1')
    ) {
      searchCondition.bridge_status = true;
    }

    const count = await Source.count({
      where: searchCondition,
    });
    const rows = await Source.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceName', 'status','bridge_status'],
      //  attributes: ['id', 'sourceName', 'status'],
      include: [{ model: SourceCompanyMap, as: 'sourcecompanymap' }],
    });


    const resultList = [];

    for (const element of rows) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['sourceName'] = element.sourceName;
      resObj['status'] = element.status;
      resObj['bridge_status'] = element.bridge_status;

      const companyMaps = element.sourcecompanymap;
      let companyname = '';

      for (const companyMap of companyMaps) {
        const companyData = await companyService.findById(companyMap.companyId);
        companyname += companyData.name + ',';
      }

      resObj['companies'] = companyname.slice(0, -1);

      resultList.push(resObj);
    }
// console.log(resultList)
    return {
      totalItems: count,
      data: resultList,
    };
  } catch (err) {
    logger.error('source dao listServiceTypes Error:', err);
    next(err);
  }
};

const checkUnique = async (sourceName, id) => {
  let data = '';
  try {
    data = await Source.findOne({
      where: {
        sourceName: sourceName,
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

const dao = {
  addSource,
  addSourceCompanyMap,
  getAllSource,
  removeSourceCompanyMap,
  findByCode,
  getSource,
  updateSource,
  deleteSource,
  listSources,
  checkUnique,
  getSourceByName
};

export default dao;
