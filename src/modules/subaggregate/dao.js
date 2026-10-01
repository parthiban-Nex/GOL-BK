import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import companyService from '../company/service.js';
import { Op } from 'sequelize';

const SubAggregate = db.subaggregates;
const Aggregate = db.aggregates;

const addSubAggregate = async (subAggregate, userId) => {
  try {
    return await SubAggregate.create({
      subAggregateName: subAggregate.subAggregateName,
      status: subAggregate.status,
      aggregateId: subAggregate.aggregateId,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('SubAggregate dao addSubAggregate Error:', err);
    next(err);
  }
};

const findByName = async (subaggregateName) => {
  try {
    return await SubAggregate.findOne({
      where: { subaggregateName: subaggregateName },
    });
  } catch (err) {
    logger.error('SubAggregate dao findByName Error:', err);
    next(err);
  }
};

const getSubAggregate = async (id) => {
  try {
    const subaggregate = await SubAggregate.findOne({ where: { id: id } });
    if (!subaggregate) {
      throw new notFoundException();
    }
    return subaggregate;
  } catch (err) {
    logger.error('SubAggregate dao getSubAggregate Error:', err);
    next(err);
  }
};

const updateSubAggregate = async (
  id,
  subAggregateName,
  status,
  aggregateId,
  userId
) => {
  try {
    return await SubAggregate.update(
      {
        subAggregateName: subAggregateName,
        status: status,
        aggregateId: aggregateId,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('SubAggregate dao updateSubAggregate Error:', err);
    next(err);
  }
};

const getAllsubAggregates = async () => {
  try {
    const data = await SubAggregate.findAll({
      attributes: ['id', 'subAggregateName', 'status', 'aggregateId'],
      include: [
        {
          model: Aggregate,
          as: 'aggregate',
          attributes: ['id', 'aggregateName', 'status'],
        },
      ],
    });
    return data;
  } catch (err) {
    logger.error('SubAggregate dao getAllsubAggregates Error:', err);
    next(err);
  }
};

const findByAggregateId = async (id) => {
  try {
    const aggregate = await Aggregate.findOne({ where: { id: id } });
    if (!aggregate) {
      throw new notFoundException();
    }
    return aggregate;
  } catch (err) {
    logger.error('SubAggregate dao findByAggregateId Error:', err);
    next(err);
  }
};

const listSubAggregates = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ subAggregateName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const count = await SubAggregate.count();
    const rows = await SubAggregate.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'subAggregateName', 'status', 'aggregateId'],
      include: [
        {
          model: Aggregate,
          as: 'aggregate',
          attributes: ['id', 'aggregateName', 'status'],
        },
      ],
    });
    const resultList = [];
    rows.forEach((element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['subAggregateName'] = element.subAggregateName;
      resObj['status'] = element.status;
      resObj['aggregateId'] = element.aggregateId;
      resObj['aggregateName'] = element.aggregate.aggregateName;
      resultList.push(resObj);
    });

    return {
      totalItems: count,
      data: resultList,
    };
  } catch (err) {
    logger.error('SubAggregate dao listSubAggregates Error:', err);
    next(err);
  }
};

const getSubAggregatesByAggregateId = async (reqBody) => {
  let data;
  try {
    const aggreateId = reqBody.id;
    console.log('aggreateId' + aggreateId);
    data = await SubAggregate.findAll({
      attributes: ['id', 'subAggregateName', 'status', 'aggregateId'],
      where: {
        aggregateId: aggreateId,
      },
    });
  } catch (err) {
    logger.error('SubAggregate dao getSubAggregatesByAggregateId Error:', err);
    next(err);
  }
  return data;
};

const checkUnique = async (subAggregateName, id) => {
  let data = '';
  try {
    data = await SubAggregate.findOne({
      where: {
        subAggregateName: subAggregateName,
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
  addSubAggregate,
  findByName,
  getSubAggregate,
  updateSubAggregate,
  getAllsubAggregates,
  findByAggregateId,
  listSubAggregates,
  getSubAggregatesByAggregateId,
  checkUnique,
};

export default dao;
