import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const DisPosition = db.dispositions;
const DisPositionCompanyMap = db.dispositioncompanymaps;

const addDisPosition = async (disposition, userId) => {
  let data = {};
  try {
    data = await DisPosition.create({
      title: disposition.title,
      disPositionCode: disposition.disPositionCode,
      disPositionType: disposition.disPositionType,
      status: disposition.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('DisPosition dao addDisPosition', err);
    next(err);
  }
  return data;
};

const addDisPositionCompanyMap = async (companyId, dispositionId) => {
  let data = {};
  try {
    data = await companyId.forEach((value) => {
      const reqObj = {
        dispositionId: dispositionId,
        companyId: value.id,
        name: value.name,
      };
      DisPositionCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('DisPosition dao addDisPositionCompanyMap', err);
    next(err);
  }
  return data;
};

const updateDisPosition = async (id, disPosition, userId) => {
  let data = {};
  try {
    data = await DisPosition.update(
      {
        title: disPosition.title,
        disPositionType: disPosition.disPositionType,
        disPositionCode: disPosition.disPositionCode,
        status: disPosition.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('DisPosition dao updateDisPosition', err);
    next(err);
  }
  return data;
};

const removeDisPositionCompanyMap = async (id) => {
  let data = {};
  try {
    data = await DisPositionCompanyMap.destroy({
      where: { dispositionId: id },
    });
  } catch (err) {
    logger.error('DisPosition dao removeDisPositionCompanyMap', err);
    next(err);
  }
  return data;
};

const getDisPosition = async (id) => {
  try {
    const disposition = await DisPosition.findOne({
      where: { id: id },
      include: [{ model: DisPositionCompanyMap, as: 'dispositioncompanymap' }],
    });
    if (!disposition) {
      throw new notFoundException();
    }
    return disposition;
  } catch (err) {
    logger.error('DisPosition dao getDisPosition', err);
    next(err);
  }
};

const listDisPositions = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { disPositionCode: { [Op.like]: `%${searchKey}%` } },
            { title: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const count = await DisPosition.count({
      where: searchCondition,
    });
    const rows = await DisPosition.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'title',
        'disPositionCode',
        'disPositionType',
        'status',
      ],
      include: [{ model: DisPositionCompanyMap, as: 'dispositioncompanymap' }],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('DisPosition dao listDisPositions', err);
    console.log(err);
  }
};

const getCustomerDisPositions = async (reqbody) => {
  try {
    const data = await DisPosition.findAll({
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'title',
        'disPositionCode',
        'disPositionType',
        'psf_status',
      ],
      where:{customer_satisfaction:reqbody.id}
    });
    return data;
  } catch (err) {
    logger.error('DisPosition dao getAllDisPositions', err);
    console.log(err);
  }
};
const getAllDisPositions = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'title',
        'disPositionCode',
        'disPositionType',
        'status',
      ],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: DisPositionCompanyMap,
          as: 'dispositioncompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await DisPosition.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Source Dao getAllSourceByCompanyIdAndRoleId Error:', err);
    next(err);
  }
};

const findByCode = async (disPositionCode) => {
  try {
    const data = await DisPosition.findOne({
      where: { disPositionCode: disPositionCode },
    });
    return data;
  } catch (err) {
    logger.error('DisPosition dao findByCode', err);
    console.log(err);
  }
};

const deleteDisPosition = async (id) => {
  try {
    const data = await DisPosition.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('DisPosition dao deleteDisPosition', err);
    console.log(err);
  }
};

const checkUnique = async (disPositionCode, id) => {
  let data = '';
  try {
    data = await DisPosition.findOne({
      where: {
        disPositionCode: disPositionCode,
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

const getDisPositionsByType = async (reqbody) => {
  try {
    const data = await DisPosition.findAll({
      attributes: [
        'id',
        'title',
      ],
      where:{disPositionType:reqbody.disPositionType}
    });
    return data;
  } catch (err) {
    logger.error('DisPosition dao getAllDisPositions', err);
    console.log(err);
  }
};
const dao = {
  addDisPosition,
  addDisPositionCompanyMap,
  updateDisPosition,
  removeDisPositionCompanyMap,
  getDisPosition,
  listDisPositions,
  getAllDisPositions,
  findByCode,
  deleteDisPosition,
  checkUnique,
  getCustomerDisPositions,
  getDisPositionsByType
};

export default dao;
