import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";
import utils from '../Utils/Utils.js';
import encryptConfig from '../../config/encrypt.js';


const GateinVehicleInventory = db.gateinVehicleInventory;
const InputType = db.inputTypes;
const ServiceBookingModel = db.servicebookings;
const DriverPickpDropModel = db.DriverPickUpDrop
const JobCard = db.jobCard;
const Customer = db.customers;
const Vehicle = db.vehicles;
const User = db.users;
const Pincode = db.pincodes;
const FuelType = db.fueltypes;
const MasterGateInInventory = db.gateinVehicleInventory
const BatteryModel = db.batteryOem

const addVehicleInventory = async (data, user) => {
  try {
    return await GateinVehicleInventory.create({
      NAME: data.label,
      CONTENT: data.inputValues ? JSON.stringify(data.inputValues) : '',
      INPUT_TYPE: data.inputType,
      IS_MANDATORY: data.isMandatory,
      IS_ACTIVE: data.status ? data.status : 1,
      CREATED_BY: user.employeeCode,
    });
  } catch (err) {
    logger.error('DockAbuseField dao addDockAbuseField Error:', err);
  }
};

const updateVehicleInventory = async (reqData, user) => {
  let data = {};
  try {
    data = await GateinVehicleInventory.update(
      {
        NAME: reqData.label,
        CONTENT: reqData.inputValues ? JSON.stringify(reqData.inputValues) : '',
        INPUT_TYPE: reqData.inputType,
        IS_MANDATORY: reqData.isMandatory,
        IS_ACTIVE: reqData.status ? reqData.status : 1,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: reqData.id } }
    );
  } catch (err) {
    console.log(err);
    logger.error(
      'GateinVehicleInventory dao updateVehicleInventory Error:',
      err
    );
  }
  return data;
};

const getGateInVehicleInventory = async (id) => {
  try {
    const dockFields = await GateinVehicleInventory.findOne({
      where: { ID: id, IS_ACTIVE: 1 },
    });
    if (!dockFields) {
      throw new notFoundException();
    }
    return dockFields;
  } catch (err) {
    logger.error('DockAbuseField dao getDockFields', err);
  }
};

const listVehicleInventory = async (reqData) => {
  const { searchKey, offset, limit } = reqData;
  const searchCondition = searchKey
    ? {
      [Op.or]: [{ NAME: { [Op.like]: `%${searchKey}%` } }],
    }
    : {};
  try {
    const { count, rows } = await GateinVehicleInventory.findAndCountAll({
      limit,
      offset,
      where: {
        ...searchCondition,
        IS_ACTIVE: 1,
      },
      order: [['ID', 'DESC']],
      attributes: [
        'ID',
        ['NAME', 'LABEL'],
        'INPUT_TYPE',
        ['CONTENT', 'INPUT_VALUES'],
        'IS_MANDATORY',
        ['IS_ACTIVE', 'STATUS'],
      ],
    });
    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('DockAbuseField dao listDockFields', err);
    console.log(err);
  }
};

const deleteVehicleInventory = async (id, user) => {
  let data = {};
  try {
    data = await GateinVehicleInventory.update(
      {
        IS_ACTIVE: 0,
        UPDATED_BY: user.employeeCode,
      },
      { where: { ID: id } }
    );
  } catch (err) {
    logger.error('DockAbuseField dao deleteDockFields Error:', err);
    next(err);
  }
  return data;
};

const findByName = async (label) => {
  return await GateinVehicleInventory.findOne({
    where: {
      NAME: label,
      IS_ACTIVE: 1,
    },
  });
};

const findByName_Id = async (label, id) => {
  let data = '';
  try {
    data = await GateinVehicleInventory.findOne({
      where: {
        NAME: label,
        IS_ACTIVE: 1,
        ID: {
          [Op.ne]: id,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const updateleadfitstatus = async (req) => {

  let updateServiceBooking = "";

  if ('PICKUP_DATETIME' in req) {
    updateServiceBooking = await ServiceBookingModel.update({
      pickup_date: req.PICKUP_DATETIME,
      pickup_time: req.PICKUP_DATETIME,
      fit_status: "Rescheduled",
      updatedBy: req.userId
    }, {
      where: {
        id: req.DMS_BOOKING_ID
      }
    })
  } else {
    console.log("before");
    updateServiceBooking = await ServiceBookingModel.update({
      fit_status: req.FIT_STATUS,
      updatedBy: req.userId,
      pickup_status: 1,
      assigned_pickup_id: req.userId
    }, {
      where: {
        id: req.DMS_BOOKING_ID
      }
    })
  }
  console.log("After");

  if (req.FIT_STATUS == "DELIVERED") {

    const giFcmToken = await User.findOne({
      where: {
        id: req.userId
      }
    })

    await sendNotificationDataToToken(
      giFcmToken.fcm_tocken,
      {
        title: "Vehcile delivered",
        body: "Vehicle delivered. click to stop for tracking",
        tab: "",
        visitID: ""
      }
    )
  }

  // DRIVER_PICKUP_STARTED , DRIVER_DROPOFF_STARTED , DELIVERED
  const updateDriverPickupDrop = await DriverPickpDropModel.create({
    DMS_BOOKING_ID: req.DMS_BOOKING_ID,
    EVENT: req.FIT_STATUS,
    EVENT_TIME: utils.getDateTime(),
    LATITUDE: req.latitude,
    LONGITUDE: req.longitude,
    USER: req.userId,
    CREATED_DATE: utils.getDateTime()
  })

  if (updateServiceBooking[0] == 1) {
    return {
      status: true
    }
  } else {
    return {
      status: false
    }
  }
}

const getvisitgateindata = async (req) => {

  let inventory = [];
  let dentScratch = [];
  let inventoryPhotos = [];
  let signaturePhotos = [];

  const vehicleDetails = await JobCard.findOne({
    where: {
      id: req.VISIT_ID
    },
    include: [
      {
        model: Customer,
        as: 'jobcardcustomer',
        attributes: [
          'pinCode',
          'address1',
          'address2',
          'state',
          'city',
          [
            db.Sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
            ),
            'firstName'
          ],
          [
            db.Sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(customer_mobileNumber), '${encryptConfig.code}') AS CHAR)`
            ),
            'customer_mobileNumber'
          ],
          [
            db.Sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
            ),
            'emailId'
          ]
        ],
        include: [
          {
            model: Pincode,
            as: 'pincodeDetailsMany',
            limit: 1,
            separate: true
          }
        ],
      },
      {
        model: Vehicle,
        as: 'vehicle',
        include: [
          {
            model: FuelType,
            as: 'fuelTypeDetails'
          }
        ]
      },
      {
        model: User,
        as: 'user_sa'
      }
    ]
  })

  if (vehicleDetails) {
    inventory = await utils.getInventory(req.VISIT_ID);
    dentScratch = await utils.getDentAndScrarch(req.VISIT_ID);
    inventoryPhotos = await utils.getShortendImagesInventory(req.VISIT_ID);
    signaturePhotos = await utils.getShortendImagesSignature(req.VISIT_ID);

    return {
      status: true,
      data: vehicleDetails,
      inventory: inventory,
      dentScratch: dentScratch,
      inventoryPhotos: inventoryPhotos,
      signaturePhotos: signaturePhotos,
    }
  } else {
    return {
      status: false,
      data: 'No data found'
    }
  }
}

const gateinVehicleInventory = async (req) => {

  let response = [];

  try {
    /* 1️⃣ Get Battery OEMs */
    const batteryResults = await BatteryModel.findAll();

    let batteryOEMs = {};
    if (batteryResults && batteryResults.length > 0) {
      batteryResults.forEach(row => {
        batteryOEMs[row.id] = row.OEM_NAME;
      });
    }

    /* 2️⃣ Get Vehicle Inventory */
    const selectResults = await MasterGateInInventory.findAll();

    console.log("selectResults", selectResults && selectResults.length > 0);

    if (selectResults && selectResults.length > 0) {

      response = selectResults.map(item => {
        let content = "";

        if (item.NAME == "Battery Make") {
          content = batteryOEMs;
        } else {
          if (item.CONTENT) {
            content = JSON.parse(item.CONTENT);
          } else {
            content = "";
          }
        }
        return {
          NAME: item.NAME,
          CONTENT: content,
          INPUT_TYPE: item.INPUT_TYPE,
          IS_MANDATORY: item.IS_MANDATORY
        }
      });

      console.log("response", response);
      return {
        status: true,
        gateinVehicle: response
      }
    } else {
      return {
        status: false
      }
    }

  } catch (error) {
    return {
      status: false
    }
  }
}

const dao = {
  addVehicleInventory,
  getGateInVehicleInventory,
  updateVehicleInventory,
  listVehicleInventory,
  deleteVehicleInventory,
  findByName,
  findByName_Id,
  updateleadfitstatus,
  getvisitgateindata,
  gateinVehicleInventory,
};

export default dao;
