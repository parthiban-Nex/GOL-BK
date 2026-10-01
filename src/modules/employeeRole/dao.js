import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const employeeRole = db.employeeroles;

const addEmployeeRole = async (req, userId) => {
  let data = {};
  try {
    data = await employeeRole.create({
      employeeRole: req.employeeRole,
      status: req.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('EmployeeRole dao addEmployeeRole Error:', err);
    next(err);
  }
  return data;
};

const updateEmployeeRole = async (id, req, userId) => {
  let data = {};
  try {
    data = await employeeRole.update(
      {
        employeeRole: req.employeeRole,
        status: req.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('EmployeeRole dao updateEmployeeRole Error:', err);
    next(err);
  }
  return data;
};

const findByemployeeRoleById = async (id) => {
  try {
    return await employeeRole.findOne({ where: { id: id } });
  } catch (err) {
    logger.error('EmployeeRole dao findByemployeeRoleById Error:', err);
    next(err);
  }
};

const getAllEmployeeRole = async () => {
  try {
    const data = await employeeRole.findAll({
      attributes: ['id', 'employeeRole', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('EmployeeRole dao getAllEmployeeRole Error:', err);
    next(err);
  }
};

const listEmployeeRoles = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ employeeRole: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const { count, rows } = await employeeRole.findAndCountAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: ['id', 'employeeRole', 'status'],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('EmployeeRole dao listEmployeeRoles Error:', err);
    console.log(err);
  }
};

const findByemployeeRoleName = async (empRole) => {
  try {
    return await employeeRole.findOne({ where: { employeeRole: empRole } });
  } catch (err) {
    logger.error('EmployeeRole dao findByemployeeRoleName Error:', err);
    console.log(err);
  }
};

const checkUnique = async (empRole, id) => {
  let data = '';
  try {
    data = await employeeRole.findOne({
      where: {
        employeeRole: empRole,
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
  addEmployeeRole,
  findByemployeeRoleById,
  updateEmployeeRole,
  getAllEmployeeRole,
  listEmployeeRoles,
  findByemployeeRoleName,
  checkUnique,
};

export default dao;
