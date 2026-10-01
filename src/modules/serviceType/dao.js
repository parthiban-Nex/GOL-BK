import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import companyService from '../company/service.js';
import { Op } from 'sequelize';

const ServiceType = db.servicetypes;
const ServiceTypeCompanyMap = db.servicetypecompanymaps;

const addServiceType = async (servicetype, userId) => {
  try {
    return await ServiceType.create({
      serviceTypeName: servicetype.serviceTypeName,
      status: servicetype.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('ServiceType dao addServiceType Error:', err);
    next(err);
  }
};

const addServiceTypeCompanyMap = async (companyId, serviceTypeId) => {
  try {
    return companyId.forEach((value) => {
      const reqObj = {
        companyId: value,
        serviceTypeId: serviceTypeId,
      };
      ServiceTypeCompanyMap.create(reqObj).then((res) => {
        return res;
      });
    });
  } catch (err) {
    logger.error('ServiceType dao addServiceTypeCompanyMap Error:', err);
    next(err);
  }
};

const getAllServiceTypeOld = async () => {
  try {
    const data = await ServiceType.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'serviceTypeName', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('ServiceType dao getAllServiceType Error:', err);
    next(err);
  }
};

const getAllServiceType = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'serviceTypeName', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: ServiceTypeCompanyMap,
          as: 'servicetypecompanymap',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await ServiceType.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('ServiceType dao getAllServiceType Error:', err);
    next(err);
  }
};

const getServiceType = async (id) => {
  try {
    const servicetype = await ServiceType.findOne({
      where: { id: id },
      include: [{ model: ServiceTypeCompanyMap, as: 'servicetypecompanymap' }],
    });
    if (!servicetype) {
      throw new notFoundException();
    }
    return servicetype;
  } catch (err) {
    logger.error('ServiceType dao getServiceType Error:', err);
    next(err);
  }
};

const updateServiceType = async (id, serviceTypeName, status, userId) => {
  try {
    return await ServiceType.update(
      {
        serviceTypeName: serviceTypeName,
        status: status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('ServiceType dao updateServiceType Error:', err);
    next(err);
  }
};

const removeServiceTypeCompanyMap = async (id) => {
  try {
    return await ServiceTypeCompanyMap.destroy({
      where: { serviceTypeId: id },
    });
  } catch (err) {
    logger.error('ServiceType dao removeServiceTypeCompanyMap Error:', err);
    next(err);
  }
};

const findByCode = async (serviceTypeName) => {
  try {
    return await ServiceType.findOne({
      where: { serviceTypeName: serviceTypeName },
    });
  } catch (err) {
    logger.error('ServiceType dao findByCode Error:', err);
    next(err);
  }
};

const deleteServiceType = async (id) => {
  try {
    const data = await ServiceType.destroy({ where: { id: id } });
    return data;
  } catch (err) {
    logger.error('ServiceType dao deleteServiceType Error:', err);
    next(err);
  }
};

const listServiceTypes = async (reqBody) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ serviceTypeName: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};

    const count = await db.servicetypes.count({ where: searchCondition });

    const rows = await db.servicetypes.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'serviceTypeName', 'status'],
      include: [{ model: ServiceTypeCompanyMap, as: 'servicetypecompanymap' }],
    });

    const resultList = [];

    for (const element of rows) {
      const resObj = {
        id: element.id,
        serviceTypeName: element.serviceTypeName,
        status: element.status,
      };

      let companyname = '';
      for (const companyMap of element.servicetypecompanymap) {
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
    logger.error('ServiceType dao listServiceTypes Error:', err);
    next(err);
  }
};

const checkUnique = async (serviceTypeName, id) => {
  let data = '';
  try {
    data = await ServiceType.findOne({
      where: {
        serviceTypeName: serviceTypeName,
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
  addServiceType,
  addServiceTypeCompanyMap,
  getAllServiceType,
  getServiceType,
  updateServiceType,
  removeServiceTypeCompanyMap,
  findByCode,
  listServiceTypes,
  deleteServiceType,
  checkUnique,
};

export default dao;
