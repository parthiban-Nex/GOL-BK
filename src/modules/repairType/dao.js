import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import companyService from '../company/service.js';
import { Op } from 'sequelize';

const RepairTypes = db.repairtypes;
const RepairTypeCompanyMap = db.repairtypecompanymaps;

const addRepairTypes = async (repairtype, userId) => {
  try {
    return await RepairTypes.create({
      repairTypeName: repairtype.repairTypeName,
      scheme: repairtype.scheme,
      status: repairtype.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Repairtype Dao addRepairTypes Error:', err);
    next(err);
  }
};

const addRepairTypeCompanyMap = async (companyId, repairTypeId) => {
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value,
        repairTypeId: repairTypeId,
      };
      RepairTypeCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('Repairtype Dao addRepairTypeCompanyMap Error:', err);
    next(err);
  }
};

const getAllRepairTypesOld = async () => {
  try {
    const data = await RepairTypes.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'repairTypeName', 'scheme', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Repairtype Dao getAllRepairTypes Error:', err);
    next(err);
  }
};

const getAllRepairTypes = async (companyId, roleId) => {
  try {
    const queryOptions = {
      // order: [['id', 'DESC']],
      attributes: ['id', 'repairTypeName', 'scheme', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: RepairTypeCompanyMap,
          as: 'repairtypecompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await RepairTypes.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Source Dao getAllSourceByCompanyIdAndRoleId Error:', err);
    next(err);
  }
};

const getRepairTypes = async (id) => {
  try {
    const repairtype = await RepairTypes.findOne({
      where: { id: id },
      include: [{ model: RepairTypeCompanyMap, as: 'repairtypecompanymap' }],
    });
    if (!repairtype) {
      throw new notFoundException();
    }
    return repairtype;
  } catch (err) {
    logger.error('Repairtype Dao getRepairTypes Error:', err);
    next(err);
  }
};

const updateRepairTypes = async (
  id,
  repairTypeName,
  scheme,
  status,
  userId
) => {
  try {
    return await RepairTypes.update(
      {
        repairTypeName: repairTypeName,
        scheme: scheme,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Repairtype Dao updateRepairTypes Error:', err);
    next(err);
  }
};

const removeRepairTypeCompanyMap = async (id) => {
  try {
    return await RepairTypeCompanyMap.destroy({ where: { repairTypeId: id } });
  } catch (err) {
    logger.error('Repairtype Dao removeRepairTypeCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (repairTypeName) => {
  try {
    return await RepairTypes.findOne({
      where: { repairTypeName: repairTypeName },
    });
  } catch (err) {
    logger.error('Repairtype Dao findByCode Error:', err);
    next(err);
  }
};

const deleteRepairTypes = async (id) => {
  try {
    const data = await RepairTypes.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('Repairtype Service deleteRepairTypes Error:', err);
    next(err);
  }
};

const listRepairTypes = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ repairTypeName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};

    const count = await RepairTypes.count({ where: searchCondition });

    const rows = await RepairTypes.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'repairTypeName', 'scheme', 'status'],
      include: [{ model: RepairTypeCompanyMap, as: 'repairtypecompanymap' }],
    });

    const resultList = [];

    for (const element of rows) {
      const resObj = {
        id: element.id,
        repairTypeName: element.repairTypeName,
        scheme: element.scheme,
        status: element.status,
      };

      let companyname = '';
      for (const companyMap of element.repairtypecompanymap) {
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
    logger.error('Repairtype Dao listRepairTypes Error:', err);
    next(err);
  }
};

const checkUnique = async (repairTypeName, id) => {
  let data = '';
  try {
    data = await RepairTypes.findOne({
      where: {
        repairTypeName: repairTypeName,
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
  addRepairTypes,
  addRepairTypeCompanyMap,
  getAllRepairTypes,
  getRepairTypes,
  updateRepairTypes,
  removeRepairTypeCompanyMap,
  findByCode,
  deleteRepairTypes,
  listRepairTypes,
  checkUnique,
};

export default dao;
