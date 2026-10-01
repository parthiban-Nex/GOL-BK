import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, where } from 'sequelize';
import outletsService from '../outlet/service.js';

const Employee = db.employees;
const Outlet = db.outlets;
const EmployeeRole = db.employeeroles;
const EmployeeOutletMap = db.employeeoutletmap
const PincodeData = db.pincodes;
const Companies = db.companies;

const addEmployee = async (emp, userId) => {

  let data = {};
  try {
    data = await Employee.create({
      outletId: emp.outletId,
      employeeRoleId: emp.employeeRoleId,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      mobileNumber: emp.mobileNumber,
      email: emp.email,
      status: emp.status,
      reports: emp.reports,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Employee dao addEmployee', err);
    next(err);
  }
  return data;
};

const addEmployeeOutletMap = async (empId, outletIds, outletId, reports) => {

  try {
    const idsToMap = reports === 1 ? outletIds : [outletId];

    const promises = idsToMap.map((outletId) => {
      const reqObj = { outlet_id: outletId, emp_id: empId };
      return EmployeeOutletMap.create(reqObj);
    });

    const results = await Promise.all(promises);
    return results;

  } catch (error) {
    console.error('Error creating employee-outlet maps:', error);
    throw error;
  }
};

const listEmployee = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { employeeName: { [Op.like]: `%${searchKey}%` } },
          { employeeCode: { [Op.like]: `%${searchKey}%` } },
          { mobileNumber: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};

    const count = await Employee.count({
      where: searchCondition,
    });
    const rows = await Employee.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'employeeName',
        'employeeCode',
        'mobileNumber',
        'email',
        'status',
        'reports'
      ],
      include: [
        { model: EmployeeRole, as: 'employeerole' },
        { model: EmployeeOutletMap, as: 'employee_outlet_map' },
        { model: Outlet, as: 'outlets' }
      ],
    },
    );

    const resultList = [];

    for (const element of rows) {
      let outletCode = '';
      const resObj = {
        id: element.id,
        employeeName: element.employeeName,
        employeeCode: element.employeeCode,
        mobileNumber: element.mobileNumber,
        email: element.email,
        status: element.status,
        reports: element.reports,
        employeeRole: element.employeerole.employeeRole,
      };

      if (element.employee_outlet_map.length >= 1) {
        for (const outletMap of element.employee_outlet_map) {
          const outletData = await outletsService.findById(outletMap.outlet_id);
          outletCode += outletData.outletCode + ',';
        };
        resObj['outletCode'] = outletCode.slice(0, -1);
        resultList.push(resObj);
      } else {
        resObj['outletCode'] = element.outlets.outletCode
        resultList.push(resObj);
      }
    };
    return {
      totalItems: count,
      data: resultList,
    };
  } catch (err) {
    logger.error('Employee dao listEmployee', err);
    console.log(err);
  }
};

const getMechanics = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { employeeName: { [Op.like]: `%${searchKey}%` } },
          { employeeCode: { [Op.like]: `%${searchKey}%` } },
          { mobileNumber: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};
    const count = await Employee.count({
      where: { employeeRoleId: 5, outletId: reqData.outletId },
    });
    const rows = await Employee.findAll({
      where: { employeeRoleId: 5, outletId: reqData.outletId },
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'employeeName',
        'employeeCode',
        'mobileNumber',
        'email',
        'status',
      ],
      include: [
        { model: EmployeeRole, as: 'employeerole' },
        { model: Outlet, as: 'outlet' },
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Employee dao listEmployee', err);
    console.log(err);
  }
};

const updateEmployee = async (id, emp, userId) => {
  let data = {};
  try {
    data = await Employee.update(
      {
        outletId: emp.outletId,
        employeeRoleId: emp.employeeRoleId,
        employeeName: emp.employeeName,
        employeeCode: emp.employeeCode,
        mobileNumber: emp.mobileNumber,
        email: emp.email,
        status: emp.status,
        reports: emp.reports,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Employee dao updateEmployee', err);
    next(err);
  }
  return data;
};

const getEmployeeOutletMap = async (empId, outletIds) => {
  try {
    const employeeOutlets = await EmployeeOutletMap.findAll({
      where: {
        emp_id: empId
      },
    });
    const outletIds = employeeOutlets.map(entry => entry.outlet_id);

    return outletIds;
  } catch (error) {
    console.error('Error getting employee-outlet-maps:', error);
    throw error;
  }
};

const findByemployeeCode = async (employeecode) => {
  try {
    return await Employee.findOne({ where: { employeeCode: employeecode } });
  } catch (err) {
    logger.error('Employee dao findByemployeeName', err);
    next(err);
  }
};

const getAllEmployee = async () => {
  try {
    const data = await Employee.findAll();
    return data;
  } catch (err) {
    logger.error('Employee dao getAllEmployee', err);
    next(err);
  }
};

const getServiceAdvisors = async (outletId) => {
  try {
    return await Employee.findAll({
      where: { outletId, status: 1 },
      attributes: [
        'id',
        'employeeName',
        'employeeCode',
        'mobileNumber',
        'email',
        'status',
        'outletId',
      ],
      include: [{
        model: EmployeeRole,
        as: 'employeerole',
        attributes: ['employeeRole'],
        where: { employeeRole: 'Service Advisor', status: 1 },
        required: true,
      }],
      order: [['employeeName', 'ASC']],
    });
  } catch (err) {
    logger.error('Employee dao getServiceAdvisors', err);
    throw err;
  }
};

const findByMobileNumber = async (mobileNumber) => {
  try {
    return await Employee.findOne({ where: { mobileNumber: mobileNumber } });
  } catch (err) {
    logger.error('Employee dao findByMobileNumber', err);
    next(err);
  }
};
const findByEmail = async (email) => {
  try {
    return await Employee.findOne({ where: { email: email } });
  } catch (err) {
    logger.error('Employee dao findByEmail', err);
    next(err);
  }
};

const findByemployeeRoleById = async (id) => {
  try {
    const empRole = await EmployeeRole.findOne({ where: { id: id } });
    return empRole;
  } catch (err) {
    logger.error('Employee dao findByemployeeRoleById Error:', err);
    next(err);
  }
};

const getOutlet = async (id) => {
  try {
    const outlet = await Outlet.findOne({ where: { id: id } });
    if (!outlet) {
      throw new notFoundException();
    }
    return outlet;
  } catch (err) {
    logger.error('Employee dao getOutlet Error:', err);
    next(err);
  }
};

const findByemployeeById = async (id) => {

  try {
    return await Employee.findOne({
      where: { id: id },
      include: [
        {
          model: Outlet, as: 'outlet',
          include: [
            {
              model : Companies,
              as : 'company',
            }
          ]
        },
        {
          model: EmployeeRole,
          as: 'employeerole'
        },
        {
          model: db.outletSettings,
          as: 'outletSettingMany'
        },
      ],
    });
  } catch (err) {
    logger.error('Employee dao findByemployeeById', err);
  }
};

const checkUnique = async (employeeCode, id) => {
  let data = '';
  try {
    data = await Employee.findOne({
      where: {
        employeeCode: employeeCode,
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

const checkMobileUnique = async (mobileNumber, id) => {
  let data = '';
  try {
    data = await Employee.findOne({
      where: {
        mobileNumber: mobileNumber,
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

const checkEmailUnique = async (email, id) => {
  let data = '';
  try {
    data = await Employee.findOne({
      where: {
        email: email,
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

// const updateEmployeeOutlets = async (empId, outletIds) => {
// 
//   try {
//     const currentMappings = await EmployeeOutletMap.findAll({
//       where: { emp_id: empId }
//     });

//     const currentOutletIds = currentMappings.map(mapping => mapping.outlet_id);

//     const outletsToRemove = currentOutletIds.filter(outletId => !outletIds.includes(outletId));

//     //Remove if common
//     if (outletsToRemove.length > 0) {
//       await EmployeeOutletMap.destroy({
//         where: {
//           emp_id: empId,
//           outlet_id: { [Op.in]: outletsToRemove }
//         }
//       });
//       console.log(`Removed ${outletsToRemove.length} outdated outlet mappings.`);
//     }

//     const outletsToAdd = outletIds.filter(outletId => !currentOutletIds.includes(outletId));

//     //Add If New
//     if (outletsToAdd.length > 0) {
//       const promises = outletsToAdd.map(outletId => {
//         return EmployeeOutletMap.create({
//           emp_id: empId,
//           outlet_id: outletId
//         });
//       });

//       await Promise.all(promises);
//       console.log(`Added ${outletsToAdd.length} new outlet mappings.`);
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Error updating employee-outlet-maps:', error);
//     throw error;
//   }
// };



const updateEmployeeOutlets = async (empId, outletIds) => {

  try {

    await EmployeeOutletMap.destroy({
      where: { emp_id: empId }
    });

    if (outletIds.length > 0) {
      const newMappings = outletIds.map(outletId => ({
        emp_id: empId,
        outlet_id: outletId
      }));

      await EmployeeOutletMap.bulkCreate(newMappings);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating employee-outlet-maps:', error);
    throw error;
  }
};

const getOutletEmployee = async (outletId) => {
  try {
    const data = await Employee.findAll({ where: { outletId: outletId, employeeRoleId: 6 } });
    return data;
  } catch (err) {
    logger.error('Employee dao getAllEmployee', err);
    next(err);
  }
};

const dao = {
  addEmployee,
  listEmployee,
  updateEmployee,
  findByemployeeById,
  findByemployeeCode,
  getAllEmployee,
  getServiceAdvisors,
  findByMobileNumber,
  findByEmail,
  findByemployeeRoleById,
  getOutlet,
  checkUnique,
  checkMobileUnique,
  checkEmailUnique,
  getMechanics,
  addEmployeeOutletMap,
  getEmployeeOutletMap,
  updateEmployeeOutlets,
  getOutletEmployee
};

export default dao;
