import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const Employee = db.employees;
const Outlet = db.outlets;
const EmployeeOutletMap = db.employeeoutletmap;

const TECHNICIAN_ROLE_ID = 4;

const addTechnician = async (tech, userId) => {
  try {
    return await Employee.create({
      outletId: tech.outletId,
      employeeRoleId: TECHNICIAN_ROLE_ID,
      employeeName: tech.employeeName,
      employeeCode: tech.employeeCode,
      mobileNumber: tech.mobileNumber,
      email: tech.email || null,
      status: tech.status,
      reports: 0,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Technician dao addTechnician Error:', err);
    throw err;
  }
};

const addOutletMap = async (empId, outletId) => {
  try {
    return await EmployeeOutletMap.create({
      emp_id: empId,
      outlet_id: outletId,
    });
  } catch (err) {
    logger.error('Technician dao addOutletMap Error:', err);
    throw err;
  }
};

const updateTechnician = async (id, tech, userId) => {
  try {
    return await Employee.update(
      {
        outletId: tech.outletId,
        employeeName: tech.employeeName,
        employeeCode: tech.employeeCode,
        mobileNumber: tech.mobileNumber,
        email: tech.email || null,
        status: tech.status,
        updatedBy: userId,
      },
      { where: { id: id, employeeRoleId: TECHNICIAN_ROLE_ID } }
    );
  } catch (err) {
    logger.error('Technician dao updateTechnician Error:', err);
    throw err;
  }
};

const replaceOutletMap = async (empId, outletId) => {
  try {
    await EmployeeOutletMap.destroy({ where: { emp_id: empId } });
    return await EmployeeOutletMap.create({
      emp_id: empId,
      outlet_id: outletId,
    });
  } catch (err) {
    logger.error('Technician dao replaceOutletMap Error:', err);
    throw err;
  }
};

const findById = async (id) => {
  try {
    return await Employee.findOne({
      where: { id: id, employeeRoleId: TECHNICIAN_ROLE_ID },
    });
  } catch (err) {
    logger.error('Technician dao findById Error:', err);
    throw err;
  }
};

const findByEmployeeCode = async (employeeCode) => {
  try {
    return await Employee.findOne({
      where: { employeeCode: employeeCode },
    });
  } catch (err) {
    logger.error('Technician dao findByEmployeeCode Error:', err);
    throw err;
  }
};

const findByEmployeeCodeAndOutlet = async (employeeCode, outletId) => {
  try {
    return await Employee.findOne({
      where: {
        employeeCode: employeeCode,
        outletId: outletId,
        employeeRoleId: TECHNICIAN_ROLE_ID,
      },
    });
  } catch (err) {
    logger.error('Technician dao findByEmployeeCodeAndOutlet Error:', err);
    throw err;
  }
};

const findByEmployeeCodeNotId = async (employeeCode, id) => {
  try {
    return await Employee.findOne({
      where: {
        employeeCode: employeeCode,
        id: { [Op.ne]: id },
      },
    });
  } catch (err) {
    logger.error('Technician dao findByEmployeeCodeNotId Error:', err);
    throw err;
  }
};

const findByEmployeeCodeAndOutletNotId = async (employeeCode, outletId, id) => {
  try {
    return await Employee.findOne({
      where: {
        employeeCode: employeeCode,
        outletId: outletId,
        employeeRoleId: TECHNICIAN_ROLE_ID,
        id: { [Op.ne]: id },
      },
    });
  } catch (err) {
    logger.error('Technician dao findByEmployeeCodeAndOutletNotId Error:', err);
    throw err;
  }
};

const findByMobileNumber = async (mobileNumber, roleId) => {
  try {
    return await Employee.findOne({
      where: { mobileNumber: mobileNumber, employeeRoleId: roleId },
    });
  } catch (err) {
    logger.error('Technician dao findByMobileNumber Error:', err);
    throw err;
  }
};

const findByMobileNumberNotId = async (mobileNumber, id, roleId) => {
  try {
    return await Employee.findOne({
      where: {
        mobileNumber: mobileNumber,
        employeeRoleId: roleId,
        id: { [Op.ne]: id },
      },
    });
  } catch (err) {
    logger.error('Technician dao findByMobileNumberNotId Error:', err);
    throw err;
  }
};

const findByEmail = async (email) => {
  try {
    return await Employee.findOne({ where: { email: email } });
  } catch (err) {
    logger.error('Technician dao findByEmail Error:', err);
    throw err;
  }
};

const findByEmailNotId = async (email, id) => {
  try {
    return await Employee.findOne({
      where: {
        email: email,
        id: { [Op.ne]: id },
      },
    });
  } catch (err) {
    logger.error('Technician dao findByEmailNotId Error:', err);
    throw err;
  }
};

const getAllTechnicians = async (reqBody, user) => {
  try {
    const { searchKey, offset, limit } = reqBody;
    const baseCondition = { employeeRoleId: TECHNICIAN_ROLE_ID };
    if (user?.roleid === 9) {
      baseCondition.outletId = user.outlet.id;
    }
    const searchCondition = searchKey
      ? {
          ...baseCondition,
          [Op.or]: [
            { employeeName: { [Op.like]: `%${searchKey}%` } },
            { employeeCode: { [Op.like]: `%${searchKey}%` } },
            { mobileNumber: { [Op.like]: `%${searchKey}%` } },
            { email: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : baseCondition;

    const count = await Employee.count({ where: searchCondition });

    const rows = await Employee.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'outletId',
        'employeeName',
        'employeeCode',
        'mobileNumber',
        'email',
        'status',
      ],
      include: [{ model: Outlet, as: 'outlet' }],
    });

    const data = rows.map((row) => ({
      id: row.id,
      outletId: row.outletId,
      outletCode: row.outlet ? row.outlet.outletCode : '',
      outletName: row.outlet ? row.outlet.outletName : '',
      employeeName: row.employeeName,
      employeeCode: row.employeeCode,
      mobileNumber: row.mobileNumber,
      email: row.email,
      status: row.status,
    }));

    return {
      totalItems: count,
      data,
    };
  } catch (err) {
    logger.error('Technician dao getAllTechnicians Error:', err);
    throw err;
  }
};

const getOneTechnician = async (id) => {
  try {
    const tech = await Employee.findOne({
      where: { id: id, employeeRoleId: TECHNICIAN_ROLE_ID },
      include: [{ model: Outlet, as: 'outlet' }],
    });
    if (!tech) {
      throw new notFoundException();
    }
    return tech;
  } catch (err) {
    logger.error('Technician dao getOneTechnician Error:', err);
    throw err;
  }
};

const dao = {
  addTechnician,
  addOutletMap,
  updateTechnician,
  replaceOutletMap,
  findById,
  findByEmployeeCode,
  findByEmployeeCodeAndOutlet,
  findByEmployeeCodeNotId,
  findByEmployeeCodeAndOutletNotId,
  findByMobileNumber,
  findByMobileNumberNotId,
  findByEmail,
  findByEmailNotId,
  getAllTechnicians,
  getOneTechnician,
};

export default dao;
