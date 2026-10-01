import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Aggregate = db.aggregates;

const addAggregate = async (aggregate, userId) => {
  try {
    return await Aggregate.create({
      aggregateName: aggregate.aggregateName,
      status: aggregate.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Aggregate dao addAggregate Error:', err);
    next(err);
  }
};

const findByName = async (aggregateName) => {
  try {
    return await Aggregate.findOne({ where: { aggregateName: aggregateName } });
  } catch (err) {
    logger.error('Aggregate dao findByName Error:', err);
    next(err);
  }
};

const getAllAggregates = async () => {
  try {
    const data = await Aggregate.findAll({
      attributes: ['id', 'aggregateName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Aggregate dao getAllAggregates Error:', err);
    next(err);
  }
};

const getAggregate = async (id) => {
  try {
    const aggregate = await Aggregate.findOne({ where: { id: id } });
    if (!aggregate) {
      throw new notFoundException();
    }
    return aggregate;
  } catch (err) {
    logger.error('Aggregate dao getAggregate Error:', err);
    next(err);
  }
};

const updateAggregate = async (id, aggregateName, status, userId) => {
  try {
    return await Aggregate.update(
      {
        aggregateName: aggregateName,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Aggregate dao updateAggregate Error:', err);
    next(err);
  }
};

const deleteAggregate = async (id) => {
  try {
    const data = await Aggregate.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Aggregate dao deleteAggregate Error:', err);
    next(err);
  }
};

const listAllAggregates = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ aggregateName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};

    const { count, rows } = await Aggregate.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'aggregateName', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Aggregate dao listAllAggregates Error:', err);
    next(err);
  }
};

const findByCode_Id = async (aggregateName, id) => {
  let data = '';
  try {
    data = await Aggregate.findOne({
      where: {
        aggregateName: aggregateName,
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
  addAggregate,
  findByName,
  getAllAggregates,
  getAggregate,
  updateAggregate,
  deleteAggregate,
  listAllAggregates,
  findByCode_Id,
};

export default dao;
