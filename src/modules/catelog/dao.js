import db from '../index.js';

const getCatelogModel = () => db.catelogs;
const getTop20CarsModel = () => db.top20Cars;

export const getAllMakesFromDb = async () => {
  if (!db.makes) return [];
  const makes = await db.makes.findAll({
    where: { status: true },
    attributes: ['id', 'makeName'],
    order: [['makeName', 'ASC']],
  });
  return makes.map((m) => ({ masterName: m.makeName }));
};

export const getModelsFromDb = async (makeId = null, makeName = null) => {
  if (!db.models) return [];
  const whereClause = { status: true };

  if (makeId) {
    whereClause.makeId = makeId;
  } else if (makeName && db.makes) {
    const makeRecord = await db.makes.findOne({ where: { makeName } });
    if (makeRecord) {
      whereClause.makeId = makeRecord.id;
    }
  }

  const models = await db.models.findAll({
    where: whereClause,
    attributes: ['id', 'modelName'],
    order: [['modelName', 'ASC']],
  });

  return models.map((m) => ({ masterName: m.modelName }));
};

export const getVarientsFromDb = async () => {
  if (!db.varients) return [];
  const varients = await db.varients.findAll({
    where: { status: true },
    attributes: ['id', 'varientName'],
    order: [['varientName', 'ASC']],
  });
  return varients.map((v) => ({ masterName: v.varientName }));
};

export const getAllCatelogs = async () => {
  const Catelog = getCatelogModel();
  if (!Catelog) return [];
  return await Catelog.findAll({ where: { status: true } });
};

export const createCatelog = async (data) => {
  const Catelog = getCatelogModel();
  if (!Catelog) return null;
  return await Catelog.create(data);
};

export const getTop20Cars = async () => {
  const Top20Cars = getTop20CarsModel();
  if (!Top20Cars) return [];
  return await Top20Cars.findAll({
    where: { status: true },
    order: [['popularityRank', 'ASC']],
  });
};

export const createTop20Car = async (data) => {
  const Top20Cars = getTop20CarsModel();
  if (!Top20Cars) return null;
  return await Top20Cars.create(data);
};

export const saveOrderEnquiry = async (data) => {
  if (!db.partsmartOrderEnquiries) return null;
  return await db.partsmartOrderEnquiries.create(data);
};

export const getOrderEnquiries = async (workshopId = null, userId = null) => {
  if (!db.partsmartOrderEnquiries) return [];
  const whereClause = {};
  if (workshopId) whereClause.workshopId = String(workshopId);
  if (userId) whereClause.createdBy = String(userId);

  return await db.partsmartOrderEnquiries.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });
};

export default {
  getAllMakesFromDb,
  getModelsFromDb,
  getVarientsFromDb,
  getAllCatelogs,
  createCatelog,
  getTop20Cars,
  createTop20Car,
  saveOrderEnquiry,
  getOrderEnquiries,
};
