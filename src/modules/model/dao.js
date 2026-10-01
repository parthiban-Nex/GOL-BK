import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';

const Make = db.makes;
const Model = db.models;
const ModelCompanyMap = db.modelcompanymaps;
const ModelVarientMap = db.modelvarientmaps;
const Varient = db.varients;
const CompanList = db.companies;
const RecentAcivity = db.recentActivity;
const addModel = async (model, user) => { 
  let data = {};
  try {
    data = await Model.create({
      makeId: model.makeId,
      modelName: model.modelName,
      modelDescription: model.modelDescription,
      segment: model.segment.segment,
      varientId: 0,
      vehicletypeId: model.vehicletypeId,
      status: model.status,
      createdBy: user.id,
    });
  } catch (err) {
    logger.error('Model Dao addModel', err);
  }

  return data;
};

const findByName = async (modelName) => {
  return await Model.findOne({ where: { modelName: modelName } });
};
const findByName_Id = async (modelName, id) => {
  let data = '';
  try {
    data = await Model.findOne({
      where: {
        modelName: modelName,
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

const removeModelCompanyMap = async (id) => {
  return await ModelCompanyMap.destroy({ where: { modelId: id } });
};
const removeModelvarientMap = async (id) => {
  return await ModelVarientMap.destroy({ where: { modelId: id } });
};

const getModelCompanyMap = async (id) => {
  return await ModelCompanyMap.findAll({ where: { modelId: id } });
};

const findOne = async (id) => {
  return await Model.findOne({ where: { id: id } });
};

const addModelCompanyMap = async (companyIds, modelId, userId) => {
  try {
    const promises = companyIds.map(async (value) => {
      const reqObj = {
        companyId: value.id,
        companyName: value.name,
        modelId: modelId,
      };
      const res = await ModelCompanyMap.create(reqObj);
      return res;
    });
    const results = await Promise.all(promises);

    return results;
  } catch (error) {
    logger.error('Error creating ModelCompanyMap entries:', error);
    throw error;
  }
};

const addModelVarientMap = async (varientName, modelId, userId) => {
  try {
    const promises = varientName.map(async (value) => {
      const reqObj = {
        varientId: value.id,
        modelId: modelId,
      };
      const res = await ModelVarientMap.create(reqObj);
      return res;
    });
    const results = await Promise.all(promises);

    return results;
  } catch (error) {
    logger.error('Error creating ModelCompanyMap entries:', error);
    throw error;
  }
};

const updateModel = async (id, model, userId) => {
  let data = {};
  try {
    data = await Model.update(
      {
        makeId: model.makeId,
        modelName: model.modelName,
        modelDescription: model.modelDescription,
        segment: model.segment.segment,
        varientId: 0,
        vehicletypeId: model.vehicletypeId,
        status: model.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Model Dao updateModel', err);
  }
  return data;
};

// const updateModelCompanyMap = async (companyIds, modelId) => {
//   ;
//   let prevData = [];
//   let newData = [];
//   try {
//     let existingData = await getModelCompanyMap(modelId);
//     let existingCompanyIds = existingData.map(item => item.companyId);
//     let existingOne = existingData.filter(item => existingCompanyIds.includes(item.companyId));
//     let newOne = companyIds.filter(item => !existingCompanyIds.includes(item.id));

//     if (companyIds.length > existingData.length) {
//       prevData = companyIds.slice(0, existingData.length);
//       newData = companyIds.slice(existingData.length);
//     };

//     if (prevData.length > 0) {
//       for (const existingComp of existingData) {
//         for (const updateCompany of prevData) {
//           if (updateCompany.name === existingComp.companyName) {
//             await ModelCompanyMap.update({
//               modelId: modelId,
//               companyId: updateCompany.id,
//               companyName: updateCompany.name
//             }, { where: { id: existingComp.id } });
//           }
//         }
//       };
//     };

//     if (existingData.length === companyIds.length) {
//       for (const existingComp of existingData) {
//         for (const updateCompany of companyIds) {
//           if (updateCompany.name === existingComp.companyName) {
//             await ModelCompanyMap.update({
//               modelId: modelId,
//               companyId: updateCompany.id,
//               companyName: updateCompany.name
//             }, { where: { id: existingComp.id } });
//           }
//         }
//       };
//     };


//     if (newData.length > 0) {
//       for (const newOne of newData) {
//         await ModelCompanyMap.create({
//           modelId: modelId,
//           companyId: newOne.id,
//           companyName: newOne.name
//         });
//       }
//     };

//     if (companyIds.length < existingData.length) {
//       let remRec = existingData.filter(item => !companyIds.some(data => data.id === item.companyId));
//       for (const rem of remRec) {
//         await ModelCompanyMap.destroy({where: { id: rem.id }});
//       };
//     };
//   } catch (err) {
//     logger.error("Model Dao updateModelCompanyMap", err);
//   };
// };

const getAllModelsOld = async () => {
  const data = await Model.findAll({
    attributes: ['id', 'modelName', 'status'],
  });
  return data;
};

const getAllModels = async (companyId, roleId) => {
  try {
    const queryOptions = {
      order: [['id', 'DESC']],
      attributes: ['id', 'modelName', 'status'],
    };

    if (roleId !== 1) {
      queryOptions.include = [
        {
          model: ModelCompanyMap,
          as: 'modelcompanymaps',
          where: { companyId: companyId },
          attributes: [],
        },
      ];
    }

    const data = await Model.findAll(queryOptions);
    return data;
  } catch (err) {
    logger.error('Model Dao getAllModels Error:', err);
    next(err);
  }
};

const getAllModelList = async (reqData) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { modelName: { [Op.like]: `%${searchKey}%` } },
          { modelDescription: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};
    const count = await Model.count({
      where: searchCondition,
    });
    const rows = await Model.findAll({
      where: searchCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'makeId',
        'modelName',
        'modelDescription',
        'segment',
        'varientId',
        'status',
      ],
      
      include: [
        { model: ModelCompanyMap, as: 'modelcompanymaps',
          include:[{model:CompanList, as :"companies"}]
         },
       {
          model: Varient,
          as: 'multipleVarients', 
          attributes: ['id', 'varientName', 'status'],
          through: { attributes: [] },
        },
        {
          model: Make,
          as: 'make',
          attributes: ['id', 'makeName'],
        },
        // {
        //   model: Varient,
        //   as: 'varients',
        //   attributes: ['id', 'varientName', 'status'],
        // },
      ],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    console.log(err);
  }
};

const getAllModelsByMake = async (makeId) => {
  const data = await Model.findAll({
    where: { makeId: makeId },
    attributes: ['id', 'makeId', 'modelName', 'modelDescription', 'status','segment'],
  });
  return data;
};
const getAllVarientByModel = async (modelId) => {
  const data = await ModelVarientMap.findAll({
    where: { modelId },
    include: [
      {
        model: db.varients,
        as: "varient",
        attributes: ["id", "varientName", "varientDescription", "status"],
      },
    ],
    attributes: ["id", "modelId", "varientId"],
    raw: false, // must be false to access included models
  });

  // Flatten result to single-level structure
  const flattened = data.map((item) => ({
    modelVarientMappingID: item.id,
    modelId: item.modelId,
    id: item.varientId,
    varientName: item.varient?.varientName || null,
    varientDescription: item.varient?.varientDescription || null,
    status: item.varient?.status || null,
  }));
console.log(flattened);
  return flattened;
};


const getOneModel = async (id) => {
  const make = await Model.findOne({
    where: { id: id },
    include: [{ model: ModelCompanyMap, as: 'modelcompanymaps' }],
  });
  if (!make) {
    throw new notFoundException();
  }
  return make;
};

const ModelDao = {
  addModel,
  findByName,
  addModelCompanyMap,
  removeModelCompanyMap,
  findOne,
  updateModel,
  getAllModels,
  getOneModel,
  getAllModelsByMake,
  getAllModelList,
  getModelCompanyMap,
  findByName_Id,
  addModelVarientMap,
  removeModelvarientMap,
  getAllVarientByModel
  // updateModelCompanyMap
};

export default ModelDao;
