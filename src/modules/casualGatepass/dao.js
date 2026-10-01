import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const CasualGatePass = db.casualGatePass;
const Employee = db.employees;
const Makes = db.makes;
const Models = db.models;

const createCasualGatePass = async (docNumber, reqData, user) => {
    let data = {};
    try {
        data = await CasualGatePass.create({
            reg_no: reqData.registrationNumber ? reqData.registrationNumber : "",
            makeId: reqData.makeId,
            modelId: reqData.modelId,
            technicianId: reqData.technician !== "" ? reqData.technician : null,
            customerName: reqData.customerName ? reqData.customerName : "",
            customerMobileNumber: reqData.customerMobileNumber ? reqData.customerMobileNumber : "",
            reason: reqData.reason ? reqData.reason : "",
            gateInTime: reqData.gateinDateTime,
            nextAppointmentDate: reqData.NextAppointmentDateTime,
            remarks: reqData.remarks ? reqData.remarks : "",
            createdBy: user.id,
            document_no: docNumber,
            outlet_id: user.outlet.id
        });
    } catch (err) {
        console.log(err);
        logger.error("Casual_Gate_Pass dao createCasualGatePass", err);
    };

    return data;
};


const listCasualGatePass = async (reqData,user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { reg_no: { [Op.like]: `%${searchKey}%` } },
            { customerName: { [Op.like]: `%${searchKey}%` } },
            { customerMobileNumber: { [Op.like]: `%${searchKey}%` } },
          ],
        }
      : {};

    const count = await CasualGatePass.count();
    const rows = await CasualGatePass.findAll({
      where: {...searchCondition, outlet_id: user.outlet.id},
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'reg_no',
        'customerName',
        'customerMobileNumber',
        'reason',
        'gateInTime',
        'nextAppointmentDate',
        'remarks',
        'document_no'
      ],
      include: [
        { model: Makes, as: 'makes', attributes: ["makeName"] },
        { model: Models, as: 'models', attributes: ["modelName"] },
        { model: Employee, as: 'employees'}
      ],
    },
  );

  const formattedRows = rows.map(row => ({
    ...row.dataValues,
    makes: row.makes ? row.makes.makeName : null,
    models: row.models ? row.models.modelName : null,
  }));

    return {
      totalItems: count,
      data: formattedRows,
    };
  } catch (err) {
    logger.error('Casual_Gate_Pass dao listEmployee', err);
    console.log(err);
  }
};

const getTechnician = async (outletId, employeeId) => {
      try {
        const rows = await Employee.findAll({
            where: { outletId: outletId, employeeRoleId: 4 }
        });
        return rows;
    } catch (err) {
        logger.error("Casual_Gate_Pass dao getTechnician", err);
        console.log(err);
    }
  };


const downloadCasualGatePass = async (registrationNo) => {
    try {
    const rows = await CasualGatePass.findOne({
      where: { reg_no: registrationNo},
      include: [
        { model: Makes, as: 'makes', attributes: ["makeName"] },
        { model: Models, as: 'models', attributes: ["modelName"] },
      ],
    });

    return rows;
    } catch (err) {
        console.log(err);
        logger.error("Casual Gate Pass", err);
    };
};

const getRecentDocNumber = async (documentType, outletCode, year) => {
  const documentNumber = CasualGatePass.findOne({
        where: {
            document_no: {
                [Op.like]: `${documentType}-${outletCode}${year}%`
            }
        },
        order: [["createdAt", "DESC"]],
    });

    return documentNumber;
};

const CasualGatePassReport = async (reqData, user) => {
  try {
    let outletCondition = "";

    if (user.reportAccess === 1) {
      outletCondition = `
        cgp.outlet_id IN (
          SELECT outlet_id
          FROM employee_outlet_map
          WHERE emp_id = ${user.employeeId}
        )
      `;
    } else {
      outletCondition = `cgp.outlet_id = ${user.outlet.id}`;
    }

    const query = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY cgp.id DESC) AS autoId,
        cgp.id,
        cgp.reg_no,
        cgp.customerName,
        cgp.customerMobileNumber,
        cgp.reason,
        DATE_FORMAT(cgp.gateInTime, '%Y-%m-%d %l:%i:%s %p') AS gateInTime,
        DATE_FORMAT(cgp.nextAppointmentDate, '%Y-%m-%d %l:%i:%s %p') AS nextAppointmentDate,
        cgp.remarks,
        cgp.document_no,
        DATE_FORMAT(cgp.createdAt, '%Y-%m-%d %l:%i:%s %p') AS created_date,
        DATE_FORMAT(cgp.createdAt, '%Y-%m-%d %l:%i:%s %p') AS gateOutTime,
        mk.makeName AS makeName,
        md.modelName AS modelName,
        o.outletCode AS outlet_code,
        tech.employeeName AS technicianName,
        sa.employeeName AS serviceAdvisor
      FROM casual_gate_passes cgp
      LEFT JOIN makes mk
        ON mk.id = cgp.makeId
      LEFT JOIN models md
        ON md.id = cgp.modelId
        LEFT JOIN outlets o
        ON o.id = cgp.outlet_id
        LEFT JOIN employees tech
        ON tech.id = cgp.technicianId
        LEFT JOIN users u
        ON u.id = cgp.createdBy
        LEFT JOIN employees sa
        ON sa.id = u.employeeId
      WHERE
        ${outletCondition}
        AND cgp.createdAt BETWEEN :startDate AND :endDate
      ORDER BY cgp.id DESC
    `;

    const rows = await db.sequelize.query(query, {
      replacements: {
        startDate: `${reqData.startDate} 00:00:00`,
        endDate: `${reqData.endDate} 23:59:59`,
      },
      type: db.sequelize.QueryTypes.SELECT,
    });

    const totalItems = rows.length;
        return {
            totalItems: totalItems,
            data: rows
        };
  } catch (err) {
    logger.error("Casual_Gate_Pass dao listEmployee", err);
    console.log(err);
  }
};

const casualGatePassDao = {
    createCasualGatePass,downloadCasualGatePass,getTechnician,listCasualGatePass,
    getRecentDocNumber,CasualGatePassReport
  };

export default casualGatePassDao;
