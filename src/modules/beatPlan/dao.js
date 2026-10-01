import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { Storage } from '@google-cloud/storage';


const ActivityPlan = db.activityPlan;
const BeatPlan = db.beatPlan;
const BeatActivity = db.beatActivity;
const Franchise = db.franchiseOnboarding;
const BeatPlanFranchiseUpdate = db.beatPlanFranchiseUpdate;

const BEAT_PLAN_STATUS = {
  1: 'Open',
  2: 'In Progress',
  3: 'Completed',
  4: 'Cancelled',
};
const storage = new Storage({
  projectId: "prj-stag-gobumpr-service-6567",
  keyFilename: "prj-stag-gobumpr-service-6567.json",
});

const bucketName = "bkt-dearo-prod";
const bucket = storage.bucket(bucketName);

const isExpired = (signedUrl) => {
  if (!signedUrl || !signedUrl.includes('Expires=')) return true;
  const ts = parseInt(signedUrl.split('Expires=')[1].split('&')[0]) * 1000;
  return Date.now() > ts;
};

const getAllActivityPlans = async () => {
  try {
    return await ActivityPlan.findAll({
      attributes: ['id', 'title', 'is_new'],
    });
  } catch (err) {
    logger.error('ActivityPlan dao Error:', err);
    throw err;
  }
};


const addBeatPlan = async (beatPlanData, userId) => {
  try {
    const beatPlan = await BeatPlan.create({
      franchise_type: beatPlanData.franchise_type, // 1 = new, 0 = existing
      start_date: beatPlanData.start_date,
      end_date: beatPlanData.end_date,
      pincode: beatPlanData.pincode,
      state: beatPlanData.state,
      city: beatPlanData.city,
      area: beatPlanData.area,
      planned_leads: beatPlanData.planned_leads,
      status: beatPlanData.status,
      createdBy: userId,
    });

    if (
      beatPlanData.activityPlanIds &&
      Array.isArray(beatPlanData.activityPlanIds) &&
      beatPlanData.activityPlanIds.length > 0
    ) {

      if (
        beatPlanData.franchiseIds &&
        Array.isArray(beatPlanData.franchiseIds) &&
        beatPlanData.franchiseIds.length > 0
      ) {

        const beatActivityData = [];

        beatPlanData.activityPlanIds.forEach((activityPlanId) => {
          beatPlanData.franchiseIds.forEach((franchiseId) => {
            beatActivityData.push({
              beatPlanId: beatPlan.id,
              activityPlanId,
              franchiseId,
              createdBy: userId,
            });
          });
        });

        await db.beatActivity.bulkCreate(beatActivityData);

      } else {

        const activityMappings = beatPlanData.activityPlanIds.map(
          (activityPlanId) => ({
            beatPlanId: beatPlan.id,
            activityPlanId,
            createdBy: userId,
          })
        );

        await db.beatActivity.bulkCreate(activityMappings);
      }
    }

    return beatPlan;
  } catch (err) {
    logger.error('BeatPlan dao addBeatPlan Error:', err);
    throw err;
  }
};
const getAllBeatPlans = async (userId) => {
  try {
    const beatPlans = await BeatPlan.findAll({
      where: { createdBy: userId },
      order: [['created_at', 'DESC']],
      raw: true,
    });

    if (!beatPlans.length) return [];

    const beatPlanIds = beatPlans.map(bp => bp.id);

    const beatActivities = await BeatActivity.findAll({
      where: {
        beatPlanId: {
          [Op.in]: beatPlanIds,
        },
      },
      raw: true,
    });

    const activityPlanIds = [
      ...new Set(beatActivities.map(a => a.activityPlanId)),
    ];

    const activityPlans = activityPlanIds.length
      ? await ActivityPlan.findAll({
        where: { id: { [Op.in]: activityPlanIds } },
        attributes: ['id', 'title', 'is_new'],
        raw: true,
      })
      : [];

    const activityPlanMap = {};
    activityPlans.forEach(ap => {
      activityPlanMap[ap.id] = ap;
    });

    const franchiseIds = [
      ...new Set(
        beatActivities
          .filter(a => a.franchiseId)
          .map(a => a.franchiseId)
      ),
    ];
    const franchises = franchiseIds.length
      ? await Franchise.findAll({
        where: { id: { [Op.in]: franchiseIds } },
        attributes: ['id', 'franchise_name'],
        raw: true,
      })
      : [];

    const franchiseMap = {};
    franchises.forEach(f => {
      franchiseMap[f.id] = f;
    });


    return beatPlans.map(bp => {

      const activitiesOfBeat = beatActivities.filter(
        a => a.beatPlanId === bp.id
      );

      const groupedFranchises = {};

      activitiesOfBeat.forEach(a => {

        if (!a.franchiseId) return;

        if (!groupedFranchises[a.franchiseId]) {
          groupedFranchises[a.franchiseId] = {
            franchiseId: a.franchiseId,
            franchise: franchiseMap[a.franchiseId] || null,
            beatPlanUpdateFranchiseId: a.beatPlanUpdateFranchiseId || null,
            activities: []
          };
        }

        const alreadyExists = groupedFranchises[a.franchiseId]
          .activities
          .some(act => act.activityPlanId === a.activityPlanId);

        if (!alreadyExists) {
          groupedFranchises[a.franchiseId].activities.push({
            activityPlanId: a.activityPlanId,
            activity: activityPlanMap[a.activityPlanId] || null
          });
        }

      });

      return {
        ...bp,
        status_text: BEAT_PLAN_STATUS[bp.status] || 'Unknown',

        activities: activitiesOfBeat.map(a => ({
          activityPlanId: a.activityPlanId,
          activity: activityPlanMap[a.activityPlanId] || null,
          franchiseId: a.franchiseId || null,
          franchise: a.franchiseId
            ? franchiseMap[a.franchiseId] || null
            : null,
        })),

        groupedFranchises: Object.values(groupedFranchises)
      };

    });

  } catch (err) {
    logger.error('BeatPlan dao getAllBeatPlans Error:', err);
    throw err;
  }
};
const getBeatPlanById = async (beatPlanId, userId) => {
  try {
    const beatPlan = await BeatPlan.findOne({
      where: {
        id: beatPlanId,
        createdBy: userId,
      },
      raw: true,
    });

    if (!beatPlan) {
      return null;
    }

    const beatActivities = await BeatActivity.findAll({
      where: { beatPlanId },
      raw: true,
    });

    const activityPlanIds = [
      ...new Set(beatActivities.map(a => a.activityPlanId)),
    ];

    const activityPlans = activityPlanIds.length
      ? await ActivityPlan.findAll({
        where: { id: { [Op.in]: activityPlanIds } },
        attributes: ['id', 'title', 'is_new'],
        raw: true,
      })
      : [];

    const activityPlanMap = {};
    activityPlans.forEach(ap => {
      activityPlanMap[ap.id] = ap;
    });

    const franchiseIds = [
      ...new Set(
        beatActivities
          .filter(a => a.franchiseId)
          .map(a => a.franchiseId)
      ),
    ];

    const franchises = franchiseIds.length
      ? await Franchise.findAll({
        where: { id: { [Op.in]: franchiseIds } },
        attributes: ['id', 'franchise_name'],
        raw: true,
      })
      : [];

    const franchiseMap = {};
    franchises.forEach(f => {
      franchiseMap[f.id] = f;
    });

    const groupedFranchises = {};

    beatActivities.forEach(a => {

      if (!a.franchiseId) return;

      if (!groupedFranchises[a.franchiseId]) {
        groupedFranchises[a.franchiseId] = {
          franchiseId: a.franchiseId,
          franchise: franchiseMap[a.franchiseId] || null,
          beatPlanUpdateFranchiseId: a.beatPlanUpdateFranchiseId || null,
          activities: []
        };
      }

      const alreadyExists = groupedFranchises[a.franchiseId]
        .activities
        .some(act => act.activityPlanId === a.activityPlanId);

      if (!alreadyExists) {
        groupedFranchises[a.franchiseId].activities.push({
          activityPlanId: a.activityPlanId,
          activity: activityPlanMap[a.activityPlanId] || null
        });
      }

    });


    return {
      ...beatPlan,
      statusText: BEAT_PLAN_STATUS[beatPlan.status] || 'Unknown',
      activities: beatActivities.map(a => ({
        activityPlanId: a.activityPlanId,
        activity: activityPlanMap[a.activityPlanId] || null,
        franchiseId: a.franchiseId || null,
        franchise: a.franchiseId
          ? franchiseMap[a.franchiseId] || null
          : null,
      })),
      groupedFranchises: Object.values(groupedFranchises)
    };
  } catch (err) {
    logger.error('BeatPlan dao getBeatPlanById Error:', err);
    throw err;
  }
};

const addBeatPlanFranchiseUpdate = async (beatPlan, userId) => {
  try {

    if (beatPlan.id) {

      await BeatPlanFranchiseUpdate.update(
        {
          beatPlanId: beatPlan.beatPlanId,
          franchiseId: beatPlan.franchiseId,
          collection_of_payment: beatPlan.collection_of_payment,
          date: beatPlan.date,
          reference_number: beatPlan.reference_number,
          amt_received: beatPlan.amt_received,
          current_location: beatPlan.current_location,
          image1: beatPlan.image1,
          image1_signed_url: beatPlan.image1_signed_url,
          image2: beatPlan.image2,
          image2_signed_url: beatPlan.image2_signed_url,
          updatedBy: userId,
        },
        {
          where: { id: beatPlan.id },
        }
      );

      const updatedData = await BeatPlanFranchiseUpdate.findOne({
        where: { id: beatPlan.id },
        raw: true,
      });

      return updatedData;
    }

    const createdData = await BeatPlanFranchiseUpdate.create({
      beatPlanId: beatPlan.beatPlanId,
      franchiseId: beatPlan.franchiseId,
      collection_of_payment: beatPlan.collection_of_payment,
      date: beatPlan.date,
      reference_number: beatPlan.reference_number,
      amt_received: beatPlan.amt_received,
      current_location: beatPlan.current_location,
      image1: beatPlan.image1 ?? null,
      image1_signed_url: beatPlan.image1_signed_url ?? null,
      image2: beatPlan.image2 ?? null,
      image2_signed_url: beatPlan.image2_signed_url ?? null,
      createdBy: userId,
    });

    await BeatActivity.update(
      {
        beatPlanUpdateFranchiseId: createdData.id
      },
      {
        where: {
          beatPlanId: createdData.beatPlanId,
          franchiseId: createdData.franchiseId
        }
      }
    );

    return createdData;

  } catch (err) {
    logger.error(
      'BeatPlanFranchiseUpdate dao addBeatPlanFranchiseUpdate Error:',
      err
    );
    throw err;
  }
};


export const getOneBeatPlanFranchiseUpdateById = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    const whereCondition = {
      createdBy: user.id
    };

    if (reqData.planId !== undefined && reqData.planId !== null) {
      whereCondition.planId = reqData.planId;
    }
    if (reqData.franchiseId !== undefined && reqData.franchiseId !== null) {
      whereCondition.franchiseId = reqData.franchiseId;
    }
    if (reqData.id !== undefined && reqData.id !== null) {
      whereCondition.id = reqData.id;
    }

    const { count, rows } = await BeatPlanFranchiseUpdate.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true,
    });

    if (!rows.length) {
      return { totalItems: 0, data: [] };
    }

    for (const beatPlanFranchiseUpdate of rows) {
      const updates = {};

      for (const field of ['image1', 'image2']) {
        const normalUrl = beatPlanFranchiseUpdate[field];
        const signedField = `${field}_signed_url`;

        if (!normalUrl) continue;

        if (isExpired(beatPlanFranchiseUpdate[signedField])) {
          const filePath = normalUrl.split(`${bucketName}/`)[1];
          if (!filePath) continue;

          const file = bucket.file(filePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          updates[signedField] = signedUrl;
          beatPlanFranchiseUpdate[signedField] = signedUrl;
        }
      }

      if (Object.keys(updates).length) {
        await BeatPlanFranchiseUpdate.update(updates, { where: { id: beatPlanFranchiseUpdate.id } });
      }
    }
    const beatPlanIds = [...new Set(rows.map(r => r.beatPlanId))];
    const franchiseIds = [...new Set(rows.map(r => r.franchiseId))];

    const beatPlans = await BeatPlan.findAll({
      where: { id: { [Op.in]: beatPlanIds } },
      raw: true,
    });

    const franchises = await Franchise.findAll({
      where: { id: { [Op.in]: franchiseIds } },
      attributes: ['id', 'franchise_name'],
      raw: true,
    });

    const beatActivities = await BeatActivity.findAll({
      where: {
        beatPlanId: { [Op.in]: beatPlanIds },
        franchiseId: { [Op.in]: franchiseIds }
      },
      raw: true,
    });
    const activityPlanIds = [
      ...new Set(beatActivities.map(a => a.activityPlanId))
    ];
    const activityPlans = activityPlanIds.length
      ? await ActivityPlan.findAll({
        where: { id: { [Op.in]: activityPlanIds } },
        attributes: ['id', 'title'],
        raw: true,
      })
      : [];
    const activityPlanMap = {};
    activityPlans.forEach(ap => {
      activityPlanMap[ap.id] = ap;
    });

    const beatActivityGrouped = {};

    beatActivities.forEach(a => {
      const key = `${a.beatPlanId}_${a.franchiseId}`;

      if (!beatActivityGrouped[key]) {
        beatActivityGrouped[key] = [];
      }

      beatActivityGrouped[key].push(a);
    });


    const beatPlanMap = {};
    beatPlans.forEach(bp => {
      beatPlanMap[bp.id] = bp;
    });

    const franchiseMap = {};
    franchises.forEach(f => {
      franchiseMap[f.id] = f;
    });

    const finalData = rows.map(row => {
      const key = `${row.beatPlanId}_${row.franchiseId}`;
      const activities = beatActivityGrouped[key] || [];

      const activityDetails = activities.map(a => ({
        activityPlanId: a.activityPlanId,
        title: activityPlanMap[a.activityPlanId]?.title || null
      }));

      return {
        ...row,
        beatPlan: beatPlanMap[row.beatPlanId] || null,
        franchise: franchiseMap[row.franchiseId] || null,
        activities: activityDetails
      };
    });


    return {
      totalItems: count,
      data: finalData,
    };
  } catch (err) {
    logger.error('BeatPlanFranchiseUpdate dao getOneBeatPlanFranchiseUpdateById Error:', err);
    throw err;
  }
};



const dao = {
  getAllActivityPlans,
  addBeatPlan,
  getAllBeatPlans,
  getBeatPlanById,
  addBeatPlanFranchiseUpdate,
  getOneBeatPlanFranchiseUpdateById,
};

export default dao;