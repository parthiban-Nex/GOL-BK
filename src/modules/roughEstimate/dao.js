import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, fn, col } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import moment from "moment";

const RoughEstimate = db.roughEstimate;
const RoughLabourEstimate = db.laborRoughEstimate;
const RoughPartsEstimate = db.partsRoughEstimate;

const Model = db.models;
const Make = db.makes;
const Vehicle = db.vehicles;
const Customer = db.customers;
const ServiceType = db.servicetypes;
const ServiceBooking = db.servicebookings;
const Source = db.sources;
const SourceType = db.sourcetypes;
const RepairType = db.repairtypes;
const vehicleContract = db.vehicleContract;
const vehicleContractScheme = db.vehicleContractScheme;
const Scheme = db.scheme;
const Schedules = db.schedules;
const oslLaborSchedules = db.oslSchedules;
const partsIndent = db.partsIndent
const JobCard = db.jobCard;

const createRoughEstimate = async (estimateData, user) => {
    let data = {};
    const currentDate = new Date();
    console.log(currentDate);
    try {
        const customerName = db.sequelize.literal(`HEX(AES_ENCRYPT('${estimateData.customerName}', '${encryptConfig.code}'))`);
        const customerMobileNumber = db.sequelize.literal(`HEX(AES_ENCRYPT('${estimateData.customerMobileNumber}', '${encryptConfig.code}'))`);

        data = await RoughEstimate.create({
            outletId: user.outlet.id,
            roughEstimateNumber: estimateData.roughEstimateNumber,
            //   status: estimateData.status ? estimateData.status : 1,
            vehicleId: estimateData.vehicleId,
            registrationNumber: estimateData.registrationNumber,
            vehicleMakeId: estimateData.makeId,
            vehicleModelId: estimateData.modelId,
            customerId: estimateData.customerId,
            customerName: customerName,
            customerMobileNumber: customerMobileNumber,
            customerAddress: estimateData.customerAddress,
            customerState: estimateData.customerState,
            customerCity: estimateData.customerCity,
            customerPincode: estimateData.pincode,
            customerVoice: estimateData.customerVoice,

            km: estimateData.km ? parseInt(estimateData.km) : 0,
            insuranceId: estimateData.insuranceName?.id || null,
            insuranceName: estimateData.insuranceName?.insuranceName || null,
            insurancePolicyNumber: estimateData.policyNumber,
            chassisNumber: estimateData.chassisNumber,
            engineNumber: estimateData.engineNumber,
            gstinNumber: estimateData.gstNumber,

            document_type: 'EST',
            estimateId: estimateData.estimateId
                ? estimateData.estimateId
                : null,
            createdby: user.id,
            modifiedBy: user.id,
        });
    } catch (err) {
        console.log(err);
        logger.error('Model Dao addModel', err);
    }

    return data;
};

const createRoughLabourEstimate = async (estimateData, user) => {
    const currentDate = new Date();
    try {
        const data = await RoughLabourEstimate.create({
            roughEstimateId: estimateData.roughEstimateId,
            laborDescription: estimateData.laborDescription,
            quantity: estimateData.quantity,
            rate: estimateData.rate,
            tax: estimateData.tax ? estimateData.tax : '0',
            laborTotal: estimateData.laborTotal,
            showOrder: estimateData.showOrder,
        });
        // console.log('createServiceLabourEstimate data', data.id);
        return data;

    } catch (err) {
        console.log(err);
        logger.error('Rough Estimate Dao createRoughLabourEstimate', err);
    }

    return null;
};

const createRoughPartsEstimate = async (partData, user) => {
    console.log('parts req payload in dao', partData);
    let data = {};
    const currentDate = new Date();
    try {
        data = await RoughPartsEstimate.create({
            roughEstimateId: partData.roughEstimateId,
            partDescription: partData.partDescription,
            quantity: partData.quantity,
            rate: partData.rate,
            tax: partData.tax ? partData.tax : '0',
            partTotal: partData.partTotal,
        });
        return data;
    }
    catch (err) {
        console.log(err);
        logger.error('Rough Estimate Dao createRoughPartsEstimate', err);
    }
    return data;
};

const getRecentRoughEstimate = async (documentType, outletCode, year) => {
    const recentEstimate = RoughEstimate.findOne({
        where: {
            roughEstimateNumber: {
                [Op.like]: `${documentType}-${outletCode}${year}%`,
            },
        },
        order: [['id', 'DESC']],
    });

    return recentEstimate;
};

const listRoughEstimate = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { roughEstimateNumber: { [Op.like]: `%${searchKey}%` } },
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          ),
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR) LIKE '%${searchKey}%'`
          ),
        ],
      }
      : {};
    const userCondition = { createdby: user.id, outletId: user.outlet.id };
    const count = await RoughEstimate.count({
      where: { ...searchCondition, ...userCondition },
    });
    let rows = await RoughEstimate.findAll({
      where: { ...searchCondition, ...userCondition },
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: RoughLabourEstimate, as: 'laborRoughEstimate' },
        { model: RoughPartsEstimate, as: 'partsRoughEstimate' },
        //   {
        //         model: Make,
        //         as: 'make',
        //         attributes: ['makeName']
        //     },

        //     {
        //         model: Model,
        //         as: 'model',
        //         attributes: ['modelName']
        //     },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['chassisNumber'],
          include: [
            { model: Model, as: 'model', attributes: ['modelName'] },
            { model: Make, as: 'make', attributes: ['makeName'] },
          ],
        },
      ],
      attributes: {
        include: [[
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`),
          'decryptedCustomerName'
        ], [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`),
          'decryptedCustomerMobileNumber'
        ], [
          fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'createdAtFormat'
        ]]
      }
    });

    rows = rows.map(row => {
      row.dataValues.customerName = row.dataValues.decryptedCustomerName;
      row.dataValues.customerMobileNumber = row.dataValues.decryptedCustomerMobileNumber;

      delete row.dataValues.decryptedCustomerName;
      delete row.dataValues.decryptedCustomerMobileNumber;

      return row;
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Rough Estimate Dao listRoughEstimate', err);
    console.log(err);
  }
};

const findOpenRoughEstimateByEstimateId = async (roughEstimateId) => {
  const fieldsToDecrypt = [
    { field: 'customerName', alias: 'decryptedCustomerName' },
    { field: 'customerMobileNumber', alias: 'decryptedCustomerMobileNumber' }
  ];

  const decryptedAttributes = fieldsToDecrypt.map(item => [
    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
    item.alias
  ]);

  try {
    const rows = await RoughEstimate.findOne({
      include: [
        { model: RoughLabourEstimate, as: 'laborRoughEstimate' },
        { model: RoughPartsEstimate, as: 'partsRoughEstimate' },
      ],
        where: { id: roughEstimateId },
      attributes: {
        include: decryptedAttributes
      }
    });
    return rows;
  } catch (err) {
    logger.error(
      'RoughEstimate dao findOpenRoughEstimateByEstimateId',
      err
    );
    console.log(err);
  }
};

const updateRoughEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  console.log(currentDate);
  try {
    const customerName = db.sequelize.literal(`HEX(AES_ENCRYPT('${estimateData.customerName}', '${encryptConfig.code}'))`);
    const customerMobileNumber = db.sequelize.literal(`HEX(AES_ENCRYPT('${estimateData.customerMobileNumber}', '${encryptConfig.code}'))`);

    data = await RoughEstimate.update(
      {
            outletId: user.outlet.id,
            roughEstimateNumber: estimateData.roughEstimateNumber,
            //   status: estimateData.status ? estimateData.status : 1,
            vehicleId: estimateData.vehicleId,
            registrationNumber: estimateData.registrationNumber,
            vehicleMakeId: estimateData.makeId,
            vehicleModelId: estimateData.modelId,
            customerId: estimateData.customerId,
            customerName: customerName,
            customerMobileNumber: customerMobileNumber,
            customerAddress: estimateData.customerAddress,
            customerState: estimateData.customerState,
            customerCity: estimateData.customerCity,
            customerPincode: estimateData.pincode,
            customerVoice: estimateData.customerVoice,

            km: estimateData.km ? parseInt(estimateData.km) : 0,
            insuranceId: estimateData.insuranceName?.id || null,
            insuranceName: estimateData.insuranceName?.insuranceName || null,
            insurancePolicyNumber: estimateData.policyNumber,
            chassisNumber: estimateData.chassisNumber,
            engineNumber: estimateData.engineNumber,
            gstinNumber: estimateData.gstNumber,

            document_type: 'EST',
            estimateId: estimateData.estimateId
                ? estimateData.estimateId
                : null,
            createdby: user.id,
            modifiedBy: user.id,
      },
      { where: { id: estimateData.id } }
    );
  } catch (err) {
    console.log(err);
    logger.error('Rough Estimate Dao updateRoughEstimate', err);
  }

  return data;
};

const deleteRoughLabourEstimate = async (roughEstimateId) => {
  let data = {};
  try {
    data = await RoughLabourEstimate.destroy({
      where: {
        id: roughEstimateId,
      },
    });
  } catch (err) {
    console.log(err);
    logger.error('Rough Estimate Dao deleteRoughLabourEstimate', err);
  }

  return data;
};
const updateRoughLabourEstimate = async (estimateData, user) => {
  let data = {};
  const currentDate = new Date();
  try {
    if (estimateData.laborId !== "" && estimateData.laborId !== undefined && estimateData.laborId !== null) {

      const existingLabour = await RoughLabourEstimate.findOne({ where: { id: estimateData.id } });

      if (!existingLabour) return null;

      const mergedData = {
            roughEstimateId: estimateData.roughEstimateId,
            laborDescription: estimateData.laborDescription,
            quantity: estimateData.quantity,
            rate: estimateData.rate,
            tax: estimateData.tax ? estimateData.tax : '0',
            laborTotal: estimateData.laborTotal,
            showOrder: estimateData.showOrder,
      };
      await RoughLabourEstimate.update(mergedData, { where: { id: estimateData.id } });

      const updatedRecord = await RoughLabourEstimate.findOne({ where: { id: estimateData.id } });
      console.log('labour estimat ', updatedRecord.id);
      return updatedRecord;
    };
  } catch (err) {
    console.log(err);
    logger.error('Rough Estimate Dao updateRoughLabourEstimate', err);
  }
  return data;
};

const deleteRoughPartsEstimate = async (roughEstimateId) => {
  let data = {};
  try {
    data = await RoughPartsEstimate.destroy({
      where: {
        id: roughEstimateId,
      },
    });
  } catch (err) {
    logger.error('Rough Estimate Dao deleteRoughPartsEstimate', err);
  }

  return data;
};
const updateRoughPartsEstimate = async (partData, user) => {
  console.log('update rough estimate parts payload', partData);
  let updatedPart = null;
  try {
    if (partData.partId !== "" && partData.partId !== undefined && partData.partId !== null) {
      const existingPart = await RoughPartsEstimate.findOne({ where: { id: partData.id } });
      if (!existingPart) return null;

      const mergedData = {
            roughEstimateId: partData.roughEstimateId,
            partDescription: partData.partDescription,
            quantity: partData.quantity,
            rate: partData.rate ?? existingPart.rate ?? 0,
            tax: partData.tax ? partData.tax : existingPart.tax ?? '0',
            partTotal: partData. partTotal ?? existingPart.partTotal ?? 0,
      };

      await RoughPartsEstimate.update(mergedData, { where: { id: partData.id } });
      updatedPart = await RoughPartsEstimate.findOne({ where: { id: partData.id } });
      console.log('Updated Part Record:', updatedPart.id);
      return updatedPart;
    }
  } catch (err) {
    console.log(err);
    logger.error('Rough Estimate Dao updateRoughPartsEstimate', err);
  }
  return updatedPart;
};
const getRoughEstimate = async (id) => {
  try {
    console.log('getRoughEstimate dao id', id);
    const data = await RoughEstimate.findOne({
      where: { id: id },
        attributes: {
        include: [
          [
            db.sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
            ),
            'decryptedCustomerName'
          ],
          [
            db.sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
            ),
            'decryptedCustomerMobileNumber'
          ],
        ]
      },
      include: [
        { model: RoughLabourEstimate, as: 'laborRoughEstimate' },
        { model: RoughPartsEstimate, as: 'partsRoughEstimate' },
        { model: Make, as: 'make' },
        { model: Model, as: 'model' },
        // {
        //   model: Customer,
        //   as: 'customer',
        //   attributes: {
        //     include: [[
        //       db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
        //       'decryptedFirstName'
        //     ], [
        //       db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
        //       'decryptedLastName'
        //     ]]
        //   }
        // },
      ],
    });
    console.log('getRoughEstimate dao data', data);
    return data;
  } catch (err) {
    logger.error('Rough Estimate dao getRoughEstimate', err);
    console.log(err);
  }
};

const RoughEstimateDao = {
    createRoughEstimate,
    createRoughLabourEstimate,
    createRoughPartsEstimate,
    getRecentRoughEstimate,
    listRoughEstimate,
    findOpenRoughEstimateByEstimateId,
    updateRoughEstimate,
    deleteRoughLabourEstimate,
    updateRoughLabourEstimate,
    deleteRoughPartsEstimate,
    updateRoughPartsEstimate,
    getRoughEstimate
};

export default RoughEstimateDao;
