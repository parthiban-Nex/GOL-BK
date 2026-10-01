import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import companyService from '../company/service.js';
import { Op } from 'sequelize';

const SourceType = db.sourcetypes;
const Source = db.sources;
const SourceTypeCompanyMap = db.sourcetypecompanymaps;

const addSourceType = async (sourcetype, userId) => {
  try {
    return await SourceType.create({
      sourceTypeName: sourcetype.sourceTypeName,
      sourceId: sourcetype.sourceId,
      status: sourcetype.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('SourceType Dao addSourceType Error:', err);
    next(err);
  }
};

const addSourceTypeCompanyMap = async (companyId, sourceTypeId) => {
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value,
        sourceTypeId: sourceTypeId,
      };
      SourceTypeCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('SourceType Dao addSourceTypeCompanyMap Error:', err);
    next(err);
  }
};

const getSourceType = async (id) => {
  try {
    const sourcetype = await SourceType.findOne({
      where: { id: id },
      include: [{ model: SourceTypeCompanyMap, as: 'sourcetypecompanymap' }],
    });
    if (!sourcetype) {
      throw new notFoundException();
    }
    return sourcetype;
  } catch (err) {
    logger.error('SourceType Dao getSourceType Error:', err);
    next(err);
  }
};

const updateSourceType = async (
  id,
  sourceTypeName,
  sourceId,
  status,
  userId
) => {
  try {
    return await SourceType.update(
      {
        sourceTypeName: sourceTypeName,
        sourceId: sourceId,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('SourceType Dao updateSourceType Error:', err);
    next(err);
  }
};

const removeSourceTypeCompanyMap = async (id) => {
  try {
    return await SourceTypeCompanyMap.destroy({ where: { sourceTypeId: id } });
  } catch (err) {
    logger.error('SourceType Dao removeSourceTypeCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (sourceTypeName) => {
  try {
    return await SourceType.findOne({
      where: { sourceTypeName: sourceTypeName },
    });
  } catch (err) {
    logger.error('SourceType Dao addSourceType Error:', err);
    next(err);
  }
};

const findBySourceId = async (sourceId) => {
  try {
    return await Source.findOne({ where: { id: sourceId } });
  } catch (err) {
    logger.error('SourceType Dao findBySourceId Error:', err);
    next(err);
  }
};

const getAllSourceTypeOld = async () => {
  try {
    const data = await SourceType.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceTypeName', 'sourceId', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('SourceType Dao addSourceType Error:', err);
    next(err);
  }
};

const getAllSourceType = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceTypeName', 'sourceId', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: SourceTypeCompanyMap,
          as: 'sourcetypecompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await SourceType.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('SourceType Dao addSourceType Error:', err);
    next(err);
  }
};

const deleteSourceType = async (id) => {
  try {
    const data = await SourceType.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('SourceType Dao addSourceType Error:', err);
    next(err);
  }
};

const listSourceTypes = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ sourceTypeName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};

    const count = await SourceType.count({
      where: searchCondition,
    });

    const rows = await SourceType.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceTypeName', 'status'],
      include: [
        { model: SourceTypeCompanyMap, as: 'sourcetypecompanymap' },
        { model: Source, as: 'sources', attributes: ['sourceName'] },
      ],
    });

    const resultList = [];

    for (const element of rows) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['sourceTypeName'] = element.sourceTypeName;
      resObj['status'] = element.status;
      resObj['sourceName'] = element.sources
        ? element.sources.sourceName
        : null;

      const companyMaps = element.sourcetypecompanymap;
      let companyname = '';

      for (const companyMap of companyMaps) {
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
    logger.error('SourceType dao listSourceTypes Error:', err);
    next(err);
  }
};

const checkUnique = async (sourceTypeName, id) => {
  let data = '';
  try {
    data = await SourceType.findOne({
      where: {
        sourceTypeName: sourceTypeName,
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

const getSourceTypesBySource = async (sourceId) => {
  try {
    const data = await SourceType.findAll({
      where: { sourceId: sourceId },
      order: [['id', 'DESC']],
      attributes: ['id', 'sourceTypeName', 'sourceId'],
    });
    return data;
  } catch (err) {
    logger.error('SourceType Dao getSourceTypesBySource Error:', err);
    next(err);
  }
};

const dao = {
  addSourceType,
  addSourceTypeCompanyMap,
  getSourceType,
  updateSourceType,
  removeSourceTypeCompanyMap,
  findByCode,
  findBySourceId,
  getAllSourceType,
  deleteSourceType,
  listSourceTypes,
  checkUnique,
  getSourceTypesBySource,
};

export default dao;
