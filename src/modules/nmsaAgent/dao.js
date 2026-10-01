import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { Storage } from '@google-cloud/storage';
import { raw } from 'mysql2';

const storage = new Storage({
  projectId: "prj-stag-gobumpr-service-6567",
  keyFilename: "prj-stag-gobumpr-service-6567.json",
});

const bucketName = "bkt-dearo-prod";
const bucket = storage.bucket(bucketName);

const NmsaAgent = db.nmsaAgents;
const NmsaFollowupLog = db.nmsaFollowupLog;
const Employee = db.employees;
const WorkshopCategory = db.workshopCategory;
const disposition = db.dispositions;
const BeatPlan = db.beatPlan;
const Dsaagentcompanymap = db.dsaagentcompanymaps;
const Bank = db.banks;
const BusinessCategory = db.businessCategory;
const NmsaDropdownMaster = db.nmsaDropdownMasters;
const sequelize = db.sequelize;
const User = db.users;

const isExpired = (signedUrl) => {
  if (!signedUrl || !signedUrl.includes('Expires=')) return true;
  const ts = parseInt(signedUrl.split('Expires=')[1].split('&')[0]) * 1000;
  return Date.now() > ts;
};

const generateNmsaCode = async (transaction) => {
  const year = new Date().getFullYear().toString().slice(-2); // 25

  const lastAgent = await NmsaAgent.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction,
  });

  const nextId = lastAgent ? lastAgent.id + 1 : 1;

  return `NMSA${year}-${nextId}`;
};
const normalizeDate = (value) => {
  if (!value || value === 'null' || value === '') {
    return null;
  }
  return value;
};
const addNmsaAgentWithFollowup = async (nmsaAgent, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const nmsaCode = await generateNmsaCode(transaction);

    const agent = await NmsaAgent.create(
      {
        nmsaCode,
        nmsaName: nmsaAgent.nmsaName,
        address1: nmsaAgent.address1,
        pincode: nmsaAgent.pincode,
        state: nmsaAgent.state,
        city: nmsaAgent.city,
        area: nmsaAgent.area,
        mobileNumber: nmsaAgent.mobileNumber,
        fbmId: nmsaAgent.fbmId,
        having_car_workshop: nmsaAgent.having_car_workshop,
        zone: nmsaAgent.zone,
        workshopCategoryId: nmsaAgent.workshopCategoryId,
        having_land: nmsaAgent.having_land,
        landType: nmsaAgent.landType,
        landSize: nmsaAgent.landSize,
        invest25: nmsaAgent.invest25,
        buildWorkshop: nmsaAgent.buildWorkshop,
        supportBankLoan: nmsaAgent.supportBankLoan,
        planId: nmsaAgent.planId,
        currentLocation: nmsaAgent.currentLocation,
        image1: nmsaAgent.image1 ?? null,
        image1_signed_url: nmsaAgent.image1_signed_url ?? null,
        image2: nmsaAgent.image2 ?? null,
        image2_signed_url: nmsaAgent.image2_signed_url ?? null,
        from_mobile: nmsaAgent.from_mobile,
        createdBy: userId,
      },
      { transaction }
    );

    const hasFollowupData =
      nmsaAgent.dispositionId ||
      nmsaAgent.next_followup ||
      nmsaAgent.schedule_start_time ||
      nmsaAgent.appointment_booked_date ||
      nmsaAgent.phonecall_notes;

    if (hasFollowupData) {
      await NmsaFollowupLog.create(
        {
          nmsaAgentId: agent.id,
          dispositionId: nmsaAgent.dispositionId ?? null,
          appointment_status: nmsaAgent.appointment_status ?? 1,
          schedule_start_time: normalizeDate(nmsaAgent.schedule_start_time),
          schedule_end_time: normalizeDate(nmsaAgent.schedule_end_time),
          next_followup: normalizeDate(nmsaAgent.next_followup),
          appointment_booked_date: normalizeDate(nmsaAgent.appointment_booked_date),
          phonecall_notes: nmsaAgent.phonecall_notes ?? null,
          createdBy: userId,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return agent;
  } catch (err) {
    await transaction.rollback();
    logger.error('NmsaAgent dao addNmsaAgentWithFollowup Error:', err);
    throw err;
  }
};

const addNmsaAgentMobileWithFollowup = async (nmsaAgent, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const nmsaCode = await generateNmsaCode(transaction);

    const agent = await NmsaAgent.create(
      {
        nmsaCode,
        nmsaName: nmsaAgent.nmsaName,
        address1: nmsaAgent.address1,
        pincode: nmsaAgent.pincode,
        state: nmsaAgent.state,
        city: nmsaAgent.city,
        area: nmsaAgent.area,
        mobileNumber: nmsaAgent.mobileNumber,
        fbmId: nmsaAgent.fbmId,
        having_car_workshop: nmsaAgent.having_car_workshop,
        zone: nmsaAgent.zone,
        workshopCategoryId: nmsaAgent.workshopCategoryId,
        having_land: nmsaAgent.having_land,
        landType: nmsaAgent.landType,
        landSize: nmsaAgent.landSize,
        invest25: nmsaAgent.invest25,
        buildWorkshop: nmsaAgent.buildWorkshop,
        supportBankLoan: nmsaAgent.supportBankLoan,
        planId: nmsaAgent.planId,
        currentLocation: nmsaAgent.currentLocation,
        image1: nmsaAgent.image1 ?? null,
        image1_signed_url: nmsaAgent.image1_signed_url ?? null,
        image2: nmsaAgent.image2 ?? null,
        image2_signed_url: nmsaAgent.image2_signed_url ?? null,
        from_mobile: nmsaAgent.from_mobile,
        contactedTypeId: nmsaAgent.contactedTypeId ?? null,
        contactedPersonName: nmsaAgent.contactedPersonName ?? null,
        visitDate: normalizeDate(nmsaAgent.visitDate),
        visitTypeId: nmsaAgent.visitTypeId ?? null,
        workshopTypeId: nmsaAgent.workshopTypeId ?? null,
        leadTypeId: nmsaAgent.leadTypeId ?? null,
        leadSourceId: nmsaAgent.leadSourceId ?? null,
        availableToolsId: nmsaAgent.availableToolsId ?? null,
        newToolsInterested: nmsaAgent.newToolsInterested ?? 1,
        createdBy: userId,
      },
      { transaction }
    );

    const hasFollowupData =
      nmsaAgent.dispositionId ||
      nmsaAgent.next_followup ||
      nmsaAgent.schedule_start_time ||
      nmsaAgent.appointment_booked_date ||
      nmsaAgent.phonecall_notes;

    if (hasFollowupData) {
      await NmsaFollowupLog.create(
        {
          nmsaAgentId: agent.id,
          dispositionId: nmsaAgent.dispositionId ?? null,
          appointment_status: nmsaAgent.appointment_status ?? 1,
          schedule_start_time: normalizeDate(nmsaAgent.schedule_start_time),
          schedule_end_time: normalizeDate(nmsaAgent.schedule_end_time),
          next_followup: normalizeDate(nmsaAgent.next_followup),
          appointment_booked_date: normalizeDate(nmsaAgent.appointment_booked_date),
          phonecall_notes: nmsaAgent.phonecall_notes ?? null,
          createdBy: userId,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return agent;
  } catch (err) {
    await transaction.rollback();
    logger.error('NmsaAgent dao addNmsaAgentMobileWithFollowup Error:', err);
    throw err;
  }
};

const getAllNmsaDropdown = async () => {
  try {
    const employees = await Employee.findAll({
      attributes: ['id', 'employeeName'],
      where: {
        id: [32, 35, 37],
      },
    });

    const workshopCategories = await WorkshopCategory.findAll({
      attributes: ['id', 'title'],
      where: {
        status: 1,
      },
    });

    const workshopTypes = await BusinessCategory.findAll({
      attributes: ['id', 'title'],
      where: {
        status: 1,
        id: [1, 2],
      },
    });

    const dispositions = await disposition.findAll({
      attributes: ['id', 'title'],
      where: {
        dispositionType: 'NMSA',
        status: 1,
      },
    });

    const contactedType = await NmsaDropdownMaster.findAll({
      attributes: ['id', 'value'],
      where: {
        title: 'contacted_type',
        status: 1,
      },
    });

    const visitType = await NmsaDropdownMaster.findAll({
      attributes: ['id', 'value'],
      where: {
        title: 'visit_type',
        status: 1,
      },
    });

    const leadType = await NmsaDropdownMaster.findAll({
      attributes: ['id', 'value'],
      where: {
        title: 'lead_type',
        status: 1,
      },
    });

    const leadSource = await NmsaDropdownMaster.findAll({
      attributes: ['id', 'value'],
      where: {
        title: 'lead_source',
        status: 1,
      },
    });

    const availableTools = await NmsaDropdownMaster.findAll({
      attributes: ['id', 'value'],
      where: {
        title: 'available_tools',
        status: 1,
      },
    });


    return {
      employees,
      workshopCategories,
      dispositions,
      workshopTypes,
      contactedType,
      visitType,
      leadType,
      leadSource,
      availableTools,

    };
  } catch (err) {
    logger.error('NmsaAgent dao getAllNmsaDropdown Error:', err);
    throw err;
  }
};

export const listNmsaAgents = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;
    const employees = await Employee.findAll({
      where: {
        outletId: user.outlet.id,
      },
      attributes: ['id'],
      raw: true,
    });

    const employeeIds = employees.map(e => e.id);
    const users = await User.findAll({
      where: {
        employeeId: {
          [Op.in]: employeeIds,
        },
      },
      attributes: ['id'],
      raw: true,
    });

    const userIds = users.map(u => u.id);

    const whereCondition = {
      createdBy: {
        [Op.in]: userIds,
      },
    };
    if (searchKey) {
      whereCondition[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } },
      ];
    }

    const { count, rows } = await NmsaAgent.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true,
    });

    if (!rows.length) {
      return { totalItems: 0, data: [] };
    }

    for (const agent of rows) {
      const updates = {};

      for (const field of ['image1', 'image2']) {
        const normalUrl = agent[field];
        const signedField = `${field}_signed_url`;

        if (!normalUrl) continue;

        if (isExpired(agent[signedField])) {
          const filePath = normalUrl.split(`${bucketName}/`)[1];
          if (!filePath) continue;

          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          updates[signedField] = signedUrl;
          agent[signedField] = signedUrl;
        }
      }

      if (Object.keys(updates).length) {
        await NmsaAgent.update(updates, { where: { id: agent.id } });
      }
    }

    const agentIds = rows.map(r => r.id);

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: { [Op.in]: agentIds } },
      order: [['created_at', 'DESC']],
    });

    const followupMap = {};
    followups.forEach(f => {
      if (!followupMap[f.nmsaAgentId]) {
        followupMap[f.nmsaAgentId] = f.dispositionId;
      }
    });

    const dispList = await disposition.findAll({
      where: { id: Object.values(followupMap) },
      attributes: ['id', 'title'],
    });

    const dispMap = {};
    dispList.forEach(d => (dispMap[d.id] = d.title));

    const finalData = rows.map(agent => ({
      ...agent,
      dispositionId: followupMap[agent.id] || null,
      dispositionTitle:
        dispMap[followupMap[agent.id]] || null,
    }));

    return {
      totalItems: count,
      data: finalData,
    };
  } catch (err) {
    logger.error('NmsaAgent dao listNmsaAgents Error:', err);
    throw err;
  }
};

export const listNmsaAgentsByPlanId = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    if (!reqData.planId) {
      throw new notFoundException();
    }
    const whereCondition = {
      createdBy: user.id
    };

    if (reqData.planId !== undefined && reqData.planId !== null) {
      whereCondition.planId = reqData.planId;
    }

    if (searchKey) {
      whereCondition[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } },
      ];
    }

    const { count, rows } = await NmsaAgent.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true,
    });

    if (!rows.length) {
      return { totalItems: 0, data: [] };
    }

    for (const agent of rows) {
      const updates = {};

      for (const field of ['image1', 'image2']) {
        const normalUrl = agent[field];
        const signedField = `${field}_signed_url`;

        if (!normalUrl) continue;

        if (isExpired(agent[signedField])) {
          const filePath = normalUrl.split(`${bucketName}/`)[1];
          if (!filePath) continue;

          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          updates[signedField] = signedUrl;
          agent[signedField] = signedUrl;
        }
      }

      if (Object.keys(updates).length) {
        await NmsaAgent.update(updates, { where: { id: agent.id } });
      }
    }

    const agentIds = rows.map(r => r.id);

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: { [Op.in]: agentIds } },
      order: [['created_at', 'DESC']],
    });

    const followupMap = {};
    followups.forEach(f => {
      if (!followupMap[f.nmsaAgentId]) {
        followupMap[f.nmsaAgentId] = f.dispositionId;
      }
    });

    const dispList = await disposition.findAll({
      where: { id: Object.values(followupMap) },
      attributes: ['id', 'title'],
    });

    const dispMap = {};
    dispList.forEach(d => (dispMap[d.id] = d.title));

    const finalData = rows.map(agent => ({
      ...agent,
      dispositionId: followupMap[agent.id] || null,
      dispositionTitle:
        dispMap[followupMap[agent.id]] || null,
    }));

    return {
      totalItems: count,
      data: finalData,
    };
  } catch (err) {
    logger.error('NmsaAgent dao listNmsaAgentsByPlanId Error:', err);
    throw err;
  }
};

export const getDashboard = async (reqData, user) => {
  try {
    const beatPlans = await BeatPlan.findAll({
      where: {
        createdBy: user.id
      },
      attributes: ['id'],
      raw: true
    });

    const beatPlanIds = beatPlans.map(bp => bp.id);

    const visitPlanCount = beatPlanIds.length;

    if (!visitPlanCount) {
      return {
        visit_plan: 0,
        visited: 0,
        pending_to: 0,
        new_leads: 0,
        followup: 0,
        converted: 0,
        cancelled: 0,
        deffered: 0
      };
    }

    const visitedCount = await NmsaAgent.count({
      where: {
        planId: {
          [Op.in]: beatPlanIds
        }
      },
      distinct: true,
      col: 'planId'
    });

    const pendingTo = visitPlanCount - visitedCount;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const newLeadsCount = await NmsaAgent.count({
      where: {
        createdBy: user.id,
        planId: {
          [Op.in]: beatPlanIds
        },
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    const agents = await NmsaAgent.findAll({
      where: {
        createdBy: user.id,
        planId: { [Op.in]: beatPlanIds }
      },
      attributes: ['id'],
      raw: true
    });

    const agentIds = agents.map(a => a.id);

    if (!agentIds.length) {
      return {
        visit_plan: visitPlanCount,
        visited: visitedCount,
        pending_to: pendingTo,
        new_leads: newLeadsCount,
        followup: 0,
        converted: 0,
        cancelled: 0,
        deferred: 0
      };
    }

    const followups = await NmsaFollowupLog.findAll({
      where: {
        nmsaAgentId: { [Op.in]: agentIds }
      },
      attributes: ['dispositionId'],
      raw: true
    });

    const followupCount = followups.length;
    const dispositionIds = followups.map(f => f.dispositionId);

    if (!dispositionIds.length) {
      return {
        visit_plan: visitPlanCount,
        visited: visitedCount,
        pending_to: pendingTo,
        new_leads: newLeadsCount,
        followup: followupCount,
        converted: 0,
        cancelled: 0
      };
    }

    const dispositions = await disposition.findAll({
      where: {
        id: { [Op.in]: dispositionIds }
      },
      attributes: ['id', 'title'],
      raw: true
    });

    let convertedCount = 0;
    let cancelledCount = 0;

    const dispositionMap = {};
    dispositions.forEach(d => {
      dispositionMap[d.id] = d.title;
    });

    followups.forEach(f => {
      const title = dispositionMap[f.dispositionId];
      if (title === 'Converted') convertedCount++;
      if (title === 'Follow Up Close') cancelledCount++;
    });
    let deferredCount = 0;
    deferredCount = followupCount - convertedCount - cancelledCount;

    return {
      visit_plan: visitPlanCount,
      visited: visitedCount,
      pending_to: pendingTo,
      new_leads: newLeadsCount,
      followup: followupCount,
      converted: convertedCount,
      cancelled: cancelledCount,
      deferred: deferredCount
    };

  } catch (err) {
    logger.error('NmsaAgent DAO getDashboard Error:', err);
    throw err;
  }
};

const getOneNmsaAgent = async (id) => {
  try {
    const nmsaAgent = await NmsaAgent.findOne({
      where: { id },
    });

    if (!nmsaAgent) {
      throw new notFoundException();
    }

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: id },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'dispositionId',
        'appointment_status',
        'schedule_start_time',
        'schedule_end_time',
        'next_followup',
        'appointment_booked_date',
        'phonecall_notes',
        'created_at',
      ],
    });

    const dispositionIds = [
      ...new Set(followups.map(f => f.dispositionId).filter(Boolean)),
    ];

    let dispositionMap = {};
    if (dispositionIds.length) {
      const dispositionList = await disposition.findAll({
        where: { id: { [Op.in]: dispositionIds } },
        attributes: ['id', 'title'],
      });

      dispositionList.forEach(d => {
        dispositionMap[d.id] = d.title;
      });
    }

    const followupLogs = followups.map(f => ({
      id: f.id,
      dispositionId: f.dispositionId,
      dispositionTitle: f.dispositionId
        ? dispositionMap[f.dispositionId]
        : null,
      appointment_status: f.appointment_status,
      schedule_start_time: f.schedule_start_time,
      schedule_end_time: f.schedule_end_time,
      next_followup: f.next_followup,
      appointment_booked_date: f.appointment_booked_date,
      phonecall_notes: f.phonecall_notes,
      created_at: f.created_at,
    }));

    return {
      agent: nmsaAgent,
      followupLogs,
    };
  } catch (err) {
    logger.error('NmsaAgent dao getOneNmsaAgent Error:', err);
    throw err;
  }
};
// const updateNmsaAgent = async (id, nmsaAgent, userId) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const existingAgent = await NmsaAgent.findOne({ where: { id }, transaction });
//     if (!existingAgent) {
//       throw new notFoundException('NmsaAgent not found');
//     }

//     const updatedAgent = await NmsaAgent.update(
//       {
//         nmsaName: nmsaAgent.nmsaName,
//         address1: nmsaAgent.address1,
//         pincode: nmsaAgent.pincode,
//         state: nmsaAgent.state,
//         city: nmsaAgent.city,
//         mobileNumber: nmsaAgent.mobileNumber,
//         fbmId: nmsaAgent.fbmId,
//         having_car_workshop: nmsaAgent.having_car_workshop,
//         zone: nmsaAgent.zone,
//         workshopCategoryId: nmsaAgent.workshopCategoryId,
//         having_land: nmsaAgent.having_land,
//         landType: nmsaAgent.landType,
//         landSize: nmsaAgent.landSize,
//         invest25: nmsaAgent.invest25,
//         buildWorkshop: nmsaAgent.buildWorkshop,
//         supportBankLoan: nmsaAgent.supportBankLoan,
//         planId: nmsaAgent.planId,
//         currentLocation: nmsaAgent.currentLocation,
//         image1: nmsaAgent.image1,
//         image2: nmsaAgent.image2,
//         from_mobile: nmsaAgent.from_mobile,
//         updatedBy: userId,
//       },
//       { where: { id }, transaction }
//     );

//     const hasFollowupData =
//       nmsaAgent.dispositionId ||
//       nmsaAgent.next_followup ||
//       nmsaAgent.schedule_start_time ||
//       nmsaAgent.schedule_end_time ||
//       nmsaAgent.appointment_booked_date ||
//       nmsaAgent.phonecall_notes;

//     if (hasFollowupData) {
//       console.log('hasfollowupdata' + hasFollowupData);
//       await NmsaFollowupLog.create(
//         {
//           nmsaAgentId: id,
//           dispositionId: nmsaAgent.dispositionId ?? null,
//           appointment_status: nmsaAgent.appointment_status ?? 1,
//           schedule_start_time: nmsaAgent.schedule_start_time ?? null,
//           schedule_end_time: nmsaAgent.schedule_end_time ?? null,
//           next_followup: nmsaAgent.next_followup ?? null,
//           appointment_booked_date: nmsaAgent.appointment_booked_date ?? null,
//           phonecall_notes: nmsaAgent.phonecall_notes ?? null,
//           createdBy: userId,
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();
//     return updatedAgent;
//   } catch (err) {
//     await transaction.rollback();
//     logger.error('NmsaAgent dao updateNmsaAgent Error:', err);
//     throw err;
//   }
// };

const updateNmsaAgent = async (id, nmsaAgent, userId) => {
  const transaction = await sequelize.transaction();
  try {
    const existingAgent = await NmsaAgent.findOne({ where: { id }, transaction });
    if (!existingAgent) {
      throw new notFoundException('NmsaAgent not found');
    }

    const updates = {
      nmsaName: nmsaAgent.nmsaName,
      address1: nmsaAgent.address1,
      pincode: nmsaAgent.pincode,
      state: nmsaAgent.state,
      city: nmsaAgent.city,
      area: nmsaAgent.area,
      mobileNumber: nmsaAgent.mobileNumber,
      fbmId: nmsaAgent.fbmId,
      having_car_workshop: nmsaAgent.having_car_workshop,
      zone: nmsaAgent.zone,
      workshopCategoryId: nmsaAgent.workshopCategoryId,
      having_land: nmsaAgent.having_land,
      landType: nmsaAgent.landType,
      landSize: nmsaAgent.landSize,
      invest25: nmsaAgent.invest25,
      buildWorkshop: nmsaAgent.buildWorkshop,
      supportBankLoan: nmsaAgent.supportBankLoan,
      planId: nmsaAgent.planId,
      currentLocation: nmsaAgent.currentLocation,
      from_mobile: nmsaAgent.from_mobile,
      updatedBy: userId,
    };

    for (const field of ['image1', 'image2']) {
      const value = nmsaAgent[field];

      // Skip if empty, null, or not a string
      if (!value || typeof value !== 'string') continue;

      updates[field] = value;

      const signedField = `${field}_signed_url`;
      let oldSignedUrl = existingAgent[signedField];

      if (!oldSignedUrl || isExpired(oldSignedUrl)) {
        const filePath = value.split(`${bucketName}/`)[1];
        if (filePath) {
          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          updates[signedField] = signedUrl;
        }
      } else {
        updates[signedField] = oldSignedUrl;
      }
    }


    await NmsaAgent.update(updates, { where: { id }, transaction });

    const hasFollowupData =
      nmsaAgent.dispositionId ||
      nmsaAgent.next_followup ||
      nmsaAgent.schedule_start_time ||
      nmsaAgent.schedule_end_time ||
      nmsaAgent.appointment_booked_date ||
      nmsaAgent.phonecall_notes;

    if (hasFollowupData) {
      await NmsaFollowupLog.create(
        {
          nmsaAgentId: id,
          dispositionId: nmsaAgent.dispositionId ?? null,
          appointment_status: nmsaAgent.appointment_status ?? 1,
          schedule_start_time: normalizeDate(nmsaAgent.schedule_start_time),
          schedule_end_time: normalizeDate(nmsaAgent.schedule_end_time),
          next_followup: normalizeDate(nmsaAgent.next_followup),
          appointment_booked_date: normalizeDate(nmsaAgent.appointment_booked_date),
          phonecall_notes: nmsaAgent.phonecall_notes ?? null,
          createdBy: userId,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const updatedAgent = await NmsaAgent.findOne({ where: { id } });
    return updatedAgent;
  } catch (err) {
    await transaction.rollback();
    logger.error('NmsaAgent dao updateNmsaAgent Error:', err);
    throw err;
  }
};

const updateNmsaAgentMobile = async (id, nmsaAgent, userId) => {
  const transaction = await sequelize.transaction();
  try {
    const existingAgent = await NmsaAgent.findOne({ where: { id }, transaction });
    if (!existingAgent) {
      throw new notFoundException('NmsaAgent not found');
    }

    const updates = {
      nmsaName: nmsaAgent.nmsaName,
      address1: nmsaAgent.address1,
      pincode: nmsaAgent.pincode,
      state: nmsaAgent.state,
      city: nmsaAgent.city,
      area: nmsaAgent.area,
      mobileNumber: nmsaAgent.mobileNumber,
      fbmId: nmsaAgent.fbmId,
      having_car_workshop: nmsaAgent.having_car_workshop,
      zone: nmsaAgent.zone,
      workshopCategoryId: nmsaAgent.workshopCategoryId,
      having_land: nmsaAgent.having_land,
      landType: nmsaAgent.landType,
      landSize: nmsaAgent.landSize,
      invest25: nmsaAgent.invest25,
      buildWorkshop: nmsaAgent.buildWorkshop,
      supportBankLoan: nmsaAgent.supportBankLoan,
      planId: nmsaAgent.planId,
      currentLocation: nmsaAgent.currentLocation,
      from_mobile: nmsaAgent.from_mobile,
      contactedTypeId: nmsaAgent.contactedTypeId ?? null,
      contactedPersonName: nmsaAgent.contactedPersonName ?? null,
      visitDate: normalizeDate(nmsaAgent.visitDate),
      visitTypeId: nmsaAgent.visitTypeId ?? null,
      workshopTypeId: nmsaAgent.workshopTypeId ?? null,
      leadTypeId: nmsaAgent.leadTypeId ?? null,
      leadSourceId: nmsaAgent.leadSourceId ?? null,
      availableToolsId: nmsaAgent.availableToolsId ?? null,
      newToolsInterested: nmsaAgent.newToolsInterested ?? 1,
      updatedBy: userId,
    };

    for (const field of ['image1', 'image2']) {
      const value = nmsaAgent[field];

      if (!value || typeof value !== 'string') continue;

      updates[field] = value;

      const signedField = `${field}_signed_url`;
      let oldSignedUrl = existingAgent[signedField];

      if (!oldSignedUrl || isExpired(oldSignedUrl)) {
        const filePath = value.split(`${bucketName}/`)[1];
        if (filePath) {
          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          updates[signedField] = signedUrl;
        }
      } else {
        updates[signedField] = oldSignedUrl;
      }
    }

    await NmsaAgent.update(updates, { where: { id }, transaction });

    const hasFollowupData =
      nmsaAgent.dispositionId ||
      nmsaAgent.next_followup ||
      nmsaAgent.schedule_start_time ||
      nmsaAgent.schedule_end_time ||
      nmsaAgent.appointment_booked_date ||
      nmsaAgent.phonecall_notes;

    if (hasFollowupData) {
      await NmsaFollowupLog.create(
        {
          nmsaAgentId: id,
          dispositionId: nmsaAgent.dispositionId ?? null,
          appointment_status: nmsaAgent.appointment_status ?? 1,
          schedule_start_time: normalizeDate(nmsaAgent.schedule_start_time),
          schedule_end_time: normalizeDate(nmsaAgent.schedule_end_time),
          next_followup: normalizeDate(nmsaAgent.next_followup),
          appointment_booked_date: normalizeDate(nmsaAgent.appointment_booked_date),
          phonecall_notes: nmsaAgent.phonecall_notes ?? null,
          createdBy: userId,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const updatedAgent = await NmsaAgent.findOne({ where: { id } });
    return updatedAgent;
  } catch (err) {
    await transaction.rollback();
    logger.error('NmsaAgent dao updateNmsaAgentMobile Error:', err);
    throw err;
  }
};

export const listNmsaAgentsMobile = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    const whereCondition = {
      createdBy: user.id,
    };

    if (searchKey) {
      whereCondition[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } },
      ];
    }

    const { count, rows } = await NmsaAgent.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true,
    });

    if (!rows.length) {
      return { totalItems: 0, data: [] };
    }

    for (const agent of rows) {
      const updates = {};

      for (const field of ['image1', 'image2']) {
        const normalUrl = agent[field];
        const signedField = `${field}_signed_url`;

        if (!normalUrl) continue;

        if (isExpired(agent[signedField])) {
          const filePath = normalUrl.split(`${bucketName}/`)[1];
          if (!filePath) continue;

          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          updates[signedField] = signedUrl;
          agent[signedField] = signedUrl;
        }
      }

      if (Object.keys(updates).length) {
        await NmsaAgent.update(updates, { where: { id: agent.id } });
      }
    }

    const agentIds = rows.map(r => r.id);

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: { [Op.in]: agentIds } },
      order: [['created_at', 'DESC']],
    });

    const followupMap = {};
    followups.forEach(f => {
      if (!followupMap[f.nmsaAgentId]) {
        followupMap[f.nmsaAgentId] = f.dispositionId;
      }
    });

    const dispList = await disposition.findAll({
      where: { id: Object.values(followupMap) },
      attributes: ['id', 'title'],
    });

    const dispMap = {};
    dispList.forEach(d => (dispMap[d.id] = d.title));

    const finalData = rows.map(agent => ({
      ...agent,
      dispositionId: followupMap[agent.id] || null,
      dispositionTitle:
        dispMap[followupMap[agent.id]] || null,
    }));

    return {
      totalItems: count,
      data: finalData,
    };
  } catch (err) {
    logger.error('NmsaAgent dao listNmsaAgentsMobile Error:', err);
    throw err;
  }
};

const getOneNmsaAgentMobile = async (id) => {
  try {
    const nmsaAgent = await NmsaAgent.findOne({
      where: { id },
    });

    if (!nmsaAgent) {
      throw new notFoundException();
    }

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: id },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'dispositionId',
        'appointment_status',
        'schedule_start_time',
        'schedule_end_time',
        'next_followup',
        'appointment_booked_date',
        'phonecall_notes',
        'created_at',
      ],
    });

    const dispositionIds = [
      ...new Set(followups.map(f => f.dispositionId).filter(Boolean)),
    ];

    let dispositionMap = {};
    if (dispositionIds.length) {
      const dispositionList = await disposition.findAll({
        where: { id: { [Op.in]: dispositionIds } },
        attributes: ['id', 'title'],
      });

      dispositionList.forEach(d => {
        dispositionMap[d.id] = d.title;
      });
    }

    const followupLogs = followups.map(f => ({
      id: f.id,
      dispositionId: f.dispositionId,
      dispositionTitle: f.dispositionId
        ? dispositionMap[f.dispositionId]
        : null,
      appointment_status: f.appointment_status,
      schedule_start_time: f.schedule_start_time,
      schedule_end_time: f.schedule_end_time,
      next_followup: f.next_followup,
      appointment_booked_date: f.appointment_booked_date,
      phonecall_notes: f.phonecall_notes,
      created_at: f.created_at,
    }));

    return {
      agent: nmsaAgent,
      followupLogs,
    };
  } catch (err) {
    logger.error('NmsaAgent dao getOneNmsaAgentMobile Error:', err);
    throw err;
  }
};

export const listNmsaAgentsByPlanIdMobile = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    if (!reqData.planId) {
      throw new notFoundException();
    }
    const whereCondition = {
      createdBy: user.id
    };

    if (reqData.planId !== undefined && reqData.planId !== null) {
      whereCondition.planId = reqData.planId;
    }

    if (searchKey) {
      whereCondition[Op.or] = [
        { nmsaCode: { [Op.like]: `%${searchKey}%` } },
        { nmsaName: { [Op.like]: `%${searchKey}%` } },
        { mobileNumber: { [Op.like]: `%${searchKey}%` } },
      ];
    }

    const { count, rows } = await NmsaAgent.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true,
    });

    if (!rows.length) {
      return { totalItems: 0, data: [] };
    }

    for (const agent of rows) {
      const updates = {};

      for (const field of ['image1', 'image2']) {
        const normalUrl = agent[field];
        const signedField = `${field}_signed_url`;

        if (!normalUrl) continue;

        if (isExpired(agent[signedField])) {
          const filePath = normalUrl.split(`${bucketName}/`)[1];
          if (!filePath) continue;

          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          updates[signedField] = signedUrl;
          agent[signedField] = signedUrl;
        }
      }

      if (Object.keys(updates).length) {
        await NmsaAgent.update(updates, { where: { id: agent.id } });
      }
    }

    const agentIds = rows.map(r => r.id);

    const followups = await NmsaFollowupLog.findAll({
      where: { nmsaAgentId: { [Op.in]: agentIds } },
      order: [['created_at', 'DESC']],
    });

    const followupMap = {};
    followups.forEach(f => {
      if (!followupMap[f.nmsaAgentId]) {
        followupMap[f.nmsaAgentId] = f.dispositionId;
      }
    });

    const dispList = await disposition.findAll({
      where: { id: Object.values(followupMap) },
      attributes: ['id', 'title'],
    });

    const dispMap = {};
    dispList.forEach(d => (dispMap[d.id] = d.title));

    const finalData = rows.map(agent => ({
      ...agent,
      dispositionId: followupMap[agent.id] || null,
      dispositionTitle:
        dispMap[followupMap[agent.id]] || null,
    }));

    return {
      totalItems: count,
      data: finalData,
    };
  } catch (err) {
    logger.error('NmsaAgent dao listNmsaAgentsByPlanIdMobile Error:', err);
    throw err;
  }
};

const dao = {
  addNmsaAgentWithFollowup,
  addNmsaAgentMobileWithFollowup,
  getAllNmsaDropdown,
  listNmsaAgents,
  getOneNmsaAgent,
  updateNmsaAgent,
  updateNmsaAgentMobile,
  listNmsaAgentsByPlanId,
  getDashboard,
  listNmsaAgentsMobile,
  getOneNmsaAgentMobile,
  listNmsaAgentsByPlanIdMobile,
};

export default dao;
