import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, literal } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import utils from '../Utils/Utils.js';
import CarpmDao from '../carpm/dao.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";

const Vehicle = db.vehicles;
const Vehiclecolor = db.vehiclecolors;
const Customer = db.customers;
const Make = db.makes;
const Varient = db.varients;
const Model = db.models;
const Insurances = db.insurances;
const Pincodes = db.pincodes;
const User = db.users;
const Employee = db.employees;
const OutletSettings = db.outletSettings;
const SecurityGateIn = db.securityGateIn;
const SecurityGateOut = db.securityGateOut;
const Outlet = db.outlets;
const JobCard = db.jobCard;
const SaveCheckListType = db.saveCheckListType;
const SaveInventoryCheckList = db.saveInventoryCheckList;
const SaveGiInventoryChecklist = db.InventoryGIChecklist;
const SaveDentAndScratch = db.saveDentAndScratch;
const SaveGIDentAndScratch = db.saveGIDentAndScratch;
const ServiceBooking = db.servicebookings
const DriverPickpDropModel = db.DriverPickUpDrop
const FlaData = db.flaData;
const saveDriverLocation = db.saveDriverLocation
const addVehicle = async (vehicle, userId) => {
  let data = {};
  try {
    data = await Vehicle.create({
      customerId: vehicle.customerId,
      registrationNumber: vehicle.registrationNumber,
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      fuelType: vehicle.fuelType,
      odometer: vehicle.odometer,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      color: vehicle.color,
      insuranceName: vehicle.insuranceName,
      insuranceExpDate: vehicle.insuranceExpDate,
      stageNorms: vehicle.stageNorms ? vehicle.stageNorms : null,
      axle: vehicle.axle ? vehicle.axle : null,
      application: vehicle.application ? vehicle.application : null,
      nextDueDateFC: vehicle.fc ? vehicle.fc : null,
      engineOilCapacity: vehicle.engineOilCapacity ? vehicle.engineOilCapacity : null,
      status: vehicle.status,
      driverName: vehicle.driverName === "" ? null : vehicle.driverName,
      driverMobileNumber: vehicle.driverMobileNumber === "" ? null : vehicle.driverMobileNumber,
      warrantyStatus: vehicle.warrantyStatus === "" ? null : vehicle.warrantyStatus.value === 1 ? true : false,
      dateOfSale: vehicle.dateOfSale ? vehicle.dateOfSale : null,
      dateOfRegistration: vehicle.dateOfRegistration ? vehicle.dateOfRegistration : null,
      createdBy: userId,
    });
  } catch (err) {
    console.log(err);
    logger.error('Vehicle dao addVehicle', err);
  }
  return data;
};

const createVehicle = async (vehicle, userId) => {
  let data = {};
  let insurance = "";
  if (vehicle.insuranceProvider) {
    insurance = await Insurances.findOne({
      where: { id: vehicle.insuranceProvider }
    });
  };

  try {
    data = await Vehicle.create({
      customerId: vehicle.customerId,
      registrationNumber: vehicle.registrationNumber,
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      odometer: vehicle.odometer,
      fuelType: vehicle.fuelType === 1 ? "Petrol" : "Diesel",
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      insuranceName: insurance ? insurance.insuranceName : null,
      insuranceExpDate: vehicle.insuranceExpDate,
      createdBy: vehicle.userId,
      manufacturingYear: vehicle.visitMetadata.manufacturingYear,
      motor_number: vehicle.visitMetadata.motorNumber ? vehicle.visitMetadata.motorNumber : "",
      mcu: vehicle.visitMetadata.controllerNumber ? vehicle.visitMetadata.controllerNumber : ""
    });
  } catch (err) {
    console.log(err);
    logger.error('Vehicle dao addVehicle', err);
  };
  return data.id;
};

const listVehicles = async (reqData, user) => {
  let customerId = 0;
  let count = 0;
  let rows = {};
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
          { chassisNumber: { [Op.like]: `%${searchKey}%` } },
          { engineNumber: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};
    // const userCondition = { createdBy: user.id };
    if (reqData.customerId) {
      customerId = reqData.customerId;
      count = await Vehicle.count({
        where: { customerId: customerId, ...searchCondition }, //...userCondition,
      });
      rows = await Vehicle.findAll({
        limit,
        offset,
        where: { customerId: customerId, ...searchCondition }, // ...userCondition,
        order: [['id', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          { model: Make, as: 'make' },
          { model: Varient, as: 'variant' },
          { model: Model, as: 'model' },
        ],
        attributes: {
          include: [[
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
            'decryptedFirstName'
          ], [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
            'decryptedLastName'
          ], [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`),
            'decryptedMobileNumber'
          ]]
        }
      });
    } else {
      count = await Vehicle.count({
        where: { ...searchCondition }, // ...userCondition
      });
      rows = await Vehicle.findAll({
        where: { ...searchCondition }, // ...userCondition
        limit,
        offset,
        order: [['id', 'DESC']],
        include: [
          { model: Customer, as: 'customer' },
          { model: Make, as: 'make' },
          { model: Varient, as: 'variant' },
          { model: Model, as: 'model' },
        ],
        attributes: {
          include: [[
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`),
            'decryptedCustomerName'
          ], [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`),
            'decryptedCustomerMobileNumber'
          ]]
        }
      });
    }

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Vehicle dao listVehicles', err);
    console.log(err);
  }
};

const vehicleSearch = async (reqData, user) => {
  let customerId = 0;
  let count = 0;
  let rows = {};

  const fieldsToDecrypt = [
    { field: 'firstName', alias: 'decryptedFirstName' },
    { field: 'lastName', alias: 'decryptedLastName' },
    { field: 'mobileNumber', alias: 'decryptedMobileNumber' },
    { field: 'emailId', alias: 'decryptedEmailId' },
    { field: 'contactPerson', alias: 'decryptedContactPerson' },
    { field: 'contactPersonNumber', alias: 'decryptedContactPersonNumber' }
  ];

  const decryptedAttributes = fieldsToDecrypt.map(item => [
    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
    item.alias
  ]);

  try {
    const { searchKey } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { registrationNumber: { [Op.eq]: searchKey } },
          { chassisNumber: { [Op.eq]: searchKey } },
        ],
      }
      : {};
    // const userCondition = { createdBy: reqData.userId }; //user
    if (reqData.customerId) {
      customerId = reqData.customerId;
      count = await Vehicle.count({
        where: { customerId: customerId }, // ...userCondition 
      });
      rows = await Vehicle.findAll({
        where: { customerId: customerId }, // ...userCondition
        order: [['id', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: {
              include: decryptedAttributes
            }
          },
          { model: Make, as: 'make' },
          { model: Varient, as: 'variant' },
          { model: Model, as: 'model' },
        ],
      });
    } else {
      count = await Vehicle.count({
        where: { ...searchCondition }, // ...userCondition
      });
      rows = await Vehicle.findAll({
        where: { ...searchCondition }, // ...userCondition 
        order: [['id', 'DESC']],
        include: [
          {
            model: Customer, as: 'customer',
            attributes: {
              include: decryptedAttributes
            },
            include: [
              {
                model: db.pincodes,
                as: 'pincodeDetails',
                where: {
                  status: 1,
                  cv_cityId: { [Op.ne]: 0 },
                  cv_stateId: { [Op.ne]: 0 }
                },
                required: false,
                attributes: ['Pincode', 'District', 'cv_cityId', 'cv_stateId']
              }
            ]

          },
          { model: Make, as: 'make' },
          { model: Varient, as: 'variant' },
          { model: Model, as: 'model' },
          {
            model: db.fueltypes,
            as: 'fuelTypeDetails',
            attributes: ['id', 'fuelTypeName']
          },
          {
            model: db.insurances,
            as: 'insuranceNameDetails',
            attributes: ['id', 'insuranceName']
          },


        ],
        // attributes: {
        //   include: [[
        //     db.sequelize.literal('CAST(AES_DECRYPT(UNHEX(customerName), "mytvs_dms") AS CHAR)'),
        //     'decryptedCustomerName'
        //   ], [
        //     db.sequelize.literal('CAST(AES_DECRYPT(UNHEX(customerMobileNumber), "mytvs_dms") AS CHAR)'),
        //     'decryptedCustomerMobileNumber'
        //   ]]
        // }
      });
    };
    // console.log(rows)
    return rows;
  } catch (err) {
    logger.error('Vehicle dao vehicleSearch', err);
  };
};

const findByVehicleId = async (id) => {
  try {
    return await Vehicle.findOne({
      where: { id: id },
    });
  } catch (err) {
    logger.error('Vehicle dao findByVehicleId', err);
    next(err);
  }
};

const updateVehicle = async (id, vehicle, userId) => {
  let data = {};
  try {
    data = await Vehicle.update(
      {
        customerId: vehicle.customerId,
        registrationNumber: vehicle.registrationNumber,
        makeId: vehicle.makeId,
        modelId: vehicle.modelId,
        variantId: vehicle.variantId,
        fuelType: vehicle.fuelType,
        odometer: vehicle.odometer,
        chassisNumber: vehicle.chassisNumber,
        engineNumber: vehicle.engineNumber,
        color: vehicle.color,
        insuranceName: vehicle.insuranceName,
        insuranceExpDate: vehicle.insuranceExpDate,
        stageNorms: vehicle.stageNorms ? vehicle.stageNorms : null,
        axle: vehicle.axle ? vehicle.axle : null,
        application: vehicle.application ? vehicle.application : null,
        nextDueDateFC: vehicle.fc ? vehicle.fc : null,
        engineOilCapacity: vehicle.engineOilCapacity ? vehicle.engineOilCapacity : null,
        driverName: vehicle.driverName === "" ? null : vehicle.driverName,
        driverMobileNumber: vehicle.driverMobileNumber === "" ? null : vehicle.driverMobileNumber,
        warrantyStatus: vehicle.warrantyStatus === "" ? null : vehicle.warrantyStatus.value === 1 ? true : false,
        dateOfSale: vehicle.dateOfSale ? vehicle.dateOfSale : null,
        dateOfRegistration: vehicle.dateOfRegistration ? vehicle.dateOfRegistration : null,
        status: vehicle.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Vehicle dao updateVehicle', err);
    next(err);
  }
  return data;
};

const updateVehicleMobile = async (id, vehicle, userId) => {
  let data = {};
  try {
    data = await Vehicle.update(
      {
        customerId: vehicle.customerId,
        registrationNumber: vehicle.registrationNumber,
        makeId: vehicle.makeId,
        modelId: vehicle.modelId,
        variantId: vehicle.variantId,
        fuelType: vehicle.fuelType,
        odometer: vehicle.odometer,
        chassisNumber: vehicle.chassisNumber,
        engineNumber: vehicle.engineNumber,
        color: vehicle.color,
        insuranceName: vehicle.insuranceName,
        insuranceExpDate: vehicle.insuranceExpDate,
        stageNorms: vehicle.stageNorms ? vehicle.stageNorms : null,
        axle: vehicle.axle ? vehicle.axle : null,
        application: vehicle.application ? vehicle.application : null,
        nextDueDateFC: vehicle.fc ? vehicle.fc : null,
        engineOilCapacity: vehicle.engineOilCapacity ? vehicle.engineOilCapacity : null,
        status: vehicle.status,
        updatedBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Vehicle dao updateVehicleMobile', err);
    next(err);
  }
  return data;
};

const findByRegistrationNumber = async (registrationNumber) => {
  try {
    return await Vehicle.findOne({
      where: { registrationNumber: registrationNumber },
    });
  } catch (err) {
    logger.error('Vehicle dao findByRegistrationNumber', err);
    next(err);
  }
};
const findByChassisNumber = async (chassisNumber) => {
  try {
    return await Vehicle.findOne({ where: { chassisNumber: chassisNumber } });
  } catch (err) {
    logger.error('Vehicle dao findByChassisNumber', err);
    next(err);
  }
};

const findByEngineNumber = async (engineNumber) => {
  try {
    return await Vehicle.findOne({ where: { engineNumber: engineNumber } });
  } catch (err) {
    logger.error('Vehicle dao findByEngineNumber', err);
    next(err);
  }
};

const getAllVechicleColors = async () => {
  try {
    const data = await Vehiclecolor.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'color', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Vehicle dao getAllVechicleColors', err);
    next(err);
  }
};

const checkUnique = async (registrationNumber, id) => {
  let data = '';
  try {
    data = await Vehicle.findOne({
      where: {
        registrationNumber: registrationNumber,
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

const checkUniqueForEngineNumber = async (engineNumber, id) => {
  let data = '';
  try {
    data = await Vehicle.findOne({
      where: {
        engineNumber: engineNumber,
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

const checkUniqueForChassisNumber = async (chassisNumber, id) => {
  let data = '';
  try {
    data = await Vehicle.findOne({
      where: {
        chassisNumber: chassisNumber,
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

const addVehicleTest = async (vehicle, userId) => {
  let data = {};
  try {
    data = await Vehicle.create({
      customerId: vehicle.customerId,
      registrationNumber: vehicle.registrationNumber,
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      variantId: vehicle.variantId,
      fuelType: vehicle.fuelType,
      odometer: vehicle.odometer,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      color: vehicle.color,
      insuranceName: vehicle.insuranceName,
      insuranceExpDate: vehicle.insuranceExpDate,
      status: vehicle.status,
      createdBy: userId,
    });
  } catch (err) {
    logger.error('Vehicle dao addVehicleTest', err);
    next(err);
  }
  return data;
};

const getVehicleDetails = async (registrationNumber) => {
  try {
    let rows = await Vehicle.findOne({
      where: { registrationNumber: registrationNumber },
      include: [
        { model: Customer, as: 'customer' },
        { model: Model, as: 'model' },
      ],
      attributes: {
        include: [[
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
          'decryptedFirstName'
        ], [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
          'decryptedLastName'
        ], [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`),
          'decryptedMobileNumber'
        ], [
          db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`),
          'decryptedEmailId'
        ]]
      }
    });

    return rows;
  } catch (err) {
    logger.error('Vehicle dao getVehicleDetails', err);
    next(err);
  }
};


const searchGateinVehicleStatus = async (req) => {
  let searchGateinVehicleStatus;
  let VALUE = false;
  const UserData = await User.findOne({
    where: {
      id: req.body.userId
    },
    include: [{
      model: Employee,
      as: 'employee',
      include: [{
        model: OutletSettings,
        as: 'outletSetting',
        required: false,
        where: {
          CONFIG: 'GATE_IN_RESTRICTION'
        }
      }]
    }]
  })

  const gateConfig = UserData?.employee?.outletSetting?.CONFIG;
  if (gateConfig) {
    VALUE = UserData.employee.outletSetting.VALUE
  }

  if (gateConfig == 'GATE_IN_RESTRICTION' && VALUE == 'TRUE') {
    if (req.body.Gate_Status == "gateOut" || req.body.Gate_Status == "gateInCheck") {

      searchGateinVehicleStatus = await SecurityGateIn.findOne({
        where: {
          vehicle_reg_no: req.body.Vehicle_Number,
          gate_out_type: null
        }
      })

      if (searchGateinVehicleStatus) {
        if (req.body.Gate_Status == "gateInCheck") {
          if (searchGateinVehicleStatus.visit_id == null || searchGateinVehicleStatus.visit_id == "") {
            return {
              success: true,
              status: 'Vehcile Number Found',
              visitId: searchGateinVehicleStatus.visit_id,
              allowRegister: true
            }
          } else {
            const OutletData = await User.findOne({
              where: {
                id: searchGateinVehicleStatus.created_by
              },
              include: [{
                model: Employee,
                as: 'employee',
                include: [{
                  model: Outlet,
                  as: 'outlets'
                }]
              }]
            })
            return {
              success: true,
              status: 'Vehcile Number Found',
              message: `Previous job card was opened at ${OutletData.employee.outlets.outletCode}, and the gate-out process is not yet completed.`
            }
          }
        } else {

          let visit_id = searchGateinVehicleStatus.visit_id ? searchGateinVehicleStatus.visit_id : searchGateinVehicleStatus.id;

          return {
            success: true,
            status: 'Vehcile Number Found',
            visitId: searchGateinVehicleStatus.visit_id,
            allowRegister: true
          }
        }
      } else {
        return {
          success: true,
          status: "Vehcile Number Not Found",
          message: "Gate in for vehicle is not done. Please complete Security Gate in to proceed.",
          allowRegister: false
        }
      }
    } else {
      const securityCheck = await SecurityGateIn.findOne({
        where: {
          vehicle_reg_no: req.body.Vehicle_Number,
          [Op.or]: [
            { gate_out_type: null },
            { gate_out_type: '' },
          ]
        }
      })

      if (securityCheck) {
        if ((securityCheck.visit_id == null || securityCheck.visit_id == "") && securityCheck.gate_out_type == null) {
          const OutletData = await User.findOne({
            where: {
              id: securityCheck.created_by
            },
            include: [{
              model: Employee,
              as: 'employee',
              include: [{
                model: Outlet,
                as: 'outlets'
              }]
            }]
          })

          return {
            success: true,
            status: `Vehcile Number Found Job Card Opened in Outlet ${OutletData.employee.outlets.outletCode}, Please do Gate Out`,
            allowRegister: false
          }
        } else {
          const SecurityGateOutdata = await SecurityGateOut.findOne({
            where: {
              vehicle_reg_no: req.body.Vehicle_Number,
            },
            order: [['id', 'DESC']],
            include: [{
              model: JobCard,
              as: 'securityGateOutId',
            },
            {
              model: User,
              as: 'securityGateOutUserId',
              include: [{
                model: Employee,
                as: 'employee',
                include: [{
                  model: Outlet,
                  as: 'outlets'
                }]
              }]
            }]
          })
          if (SecurityGateOutdata) {
            if (SecurityGateOutdata.gate_out_type == null) {
              return {
                success: true,
                status: `Vehcile Number Found and Security Gate Out is Not finished in  ${SecurityGateOutdata.securityGateOutId.securityGateOutUserId.employee.outlets.outletCode}, Please do Gate Out`,
                allowRegister: false
              }
            } else if (SecurityGateOutdata.securityGateOutId.status_value !== 'DELIVERED') {
              return {
                success: true,
                status: `Vehcile Number Found and JC is Not Completed in ${SecurityGateOutdata.securityGateOutId.securityGateOutUserId.employee.outlets.outletCode}, Please do Gate Out`,
                allowRegister: false
              }
            } else {
              return {
                success: true,
                status: 'Vehcile Delivered and Completed Gate Out',
                allowRegister: false
              }
            }
          } else {
            return {
              success: true,
              status: 'Vehcile Gate Out Need to Be Done',
              allowRegister: true
            }
          }
        }
      } else {
        return {
          success: true,
          status: 'Vehcile Delivered and Completed Gate Out',
          allowRegister: true
        }
      }
    }
  } else {
    return {
      success: true,
      status: "Outlet Not Compulsory",
      VisitId: "",
      allowRegister: true
    }
  }
}


const saveCustomerVoice = async (req) => {
  let result = '';
  let data = {};
  let insertChecklist = -1;
  let insertRecord = -1;
  let partOrAggregate = await JobCard.findOne({
    where: {
      id: req.VISIT_ID
    }
  })

  try {
    if (req.Parent.VISIT_STATUS == 'GATEIN_COMPLETE') {
      insertChecklist = 1

      const outletId = await User.findOne({
        where: { id: req.userId },
        include: [{
          model: Employee,
          as: 'employee',
          attributes: ['outletId']
        }]
      });
      console.log("four");
      console.log("outletId.employee.outletIdfor", outletId.employee.outletId);

      const managerData = await Employee.findAll({
        where: {
          outletId: outletId.employee.outletId
        },
        include: [
          {
            model: db.employeeroles,
            as: 'employeerole'
          },
          {
            model: db.users,
            as: 'user',   // alias defined in association
            required: true,
            include: [
              {
                model: db.userrolemaps,
                as: 'userrolemaps',
                required: true,
                where: {
                  role_name: "Manger"
                }
              }
            ]   // ensures only employees with user record are returned
          }
        ]
      })

      const regNo = await JobCard.findOne({
        where: {
          id: req.VISIT_ID
        }
      })
      for (const element of managerData) {
        console.log("Reg no", element.user.fcm_tocken)
        await sendNotificationDataToToken(
          element.user.fcm_tocken,
          {
            title: "Gate in Completed",
            body: "Gate in Completed the " + regNo.reg_no + " . Please Assign the SA",
            tab: "ASSIGN_SA",
            visitID: req.VISIT_ID.toString()
          }
        );
      }
      console.log("four");
      const updateDmsDetails = await JobCard.update({
        fit_status: req.Parent.VISIT_STATUS,
        updated_by: req.userId,
        updatedAt: utils.getDateTime()
      }, { where: { id: req.VISIT_ID } })

      if (updateDmsDetails[0] === 0) {
        return { status: "Error", message: "Dms Details Saved Failed!" };
      }

    } else {
      // Dms Details 

      let dmsDetails = req.dmsDetails;
      const Dmslength = dmsDetails ? Object.keys(dmsDetails).length : 0;

      if (Dmslength > 0) {

        const techUserId = await User.findOne({
          where: {
            employeeId: req.Parent.ASSIGNED_TECH_USER_ID
          }
        })

        const updateDmsDetails = await JobCard.update({
          document_type: req.dmsDetails.docType,
          service_type: req.dmsDetails.serviceType,
          repair_type: req.dmsDetails.repairType,
          jobType: req.dmsDetails.jobType,
          fit_status: req.Parent.VISIT_STATUS,
          customer_voice: req.Parent.CUSTOMER_VOICE,
          assigned_tech_id: req.Parent.ASSIGNED_TECH_USER_ID, // Need to change to user_id from id 
          // assigned_tech_id: techUserId.id,
          assigned_sa_id: req.userId,
          fuel_level: req.Parent.FUEL_LEVEL,
        }, { where: { id: req.VISIT_ID } })

        if (updateDmsDetails[0] === 0) {
          return { status: "Error", message: "Dms Details Saved Failed!" };
        }
      }

      // CheckList Type Details

      if (req.ChecklistTypes.length >= 0) {
        const checkListType = req.ChecklistTypes;
        const rowsToInsert = checkListType.map(item => ({
          VISIT_ID: item.VISIT_ID,
          CHECKLIST_TYPE_CODE: item.CHECKLIST_TYPE_CODE,
        }));

        const deleteOld = await SaveCheckListType.destroy({
          where: {
            VISIT_ID: req.VISIT_ID
          }
        })

        const checkListTypeSaved = await SaveCheckListType.bulkCreate(rowsToInsert);

        if (checkListTypeSaved[0] === 0) {
          return { status: "Error", message: "CheckList Type Saved Failed!" };
        } else {
          insertChecklist = 1;
        }
      }

    }

    // Gate In Vehicle 
    if ('gateinVehicle' in req) {

      const dataToInsert = [];
      const gateInData = JSON.parse(req.gateinVehicle);

      for (const item of gateInData) {
        for (const key in item) {
          dataToInsert.push({
            VISIT_ID: req.VISIT_ID,
            NAME: key,
            CONTENT: item[key],
            CREATED_BY: req.userId,
            CREATED_DATE: new Date(),
            UPDATED_BY: req.userId,
            UPDATED_DATE: new Date()
          });
        }
      }

      const deleteOldOne = await db.VehicleGatein.destroy({
        where: {
          VISIT_ID: req.VISIT_ID
        }
      })

      const gateInInventory = await db.VehicleGatein.bulkCreate(dataToInsert);
    }

    if (insertChecklist == 1) {
      // Inventory Details 

      console.log("req.InventoryChecklist.length", req.InventoryChecklist.length);

      if (req.InventoryChecklist.length >= 1) {
        const inventoryCheckList = req.InventoryChecklist;
        const rowsToInsert = inventoryCheckList.map(item => ({
          visit_id: item.VISIT_ID,
          vehicle_inv_ver: item.VEHICLE_INV_VER,
          inventory_code: item.INVENTORY_CODE,
          inventory_type: item.INVENTORY_TYPE,
          inventory_condition: item.INVENTORY_CONDITION,
          remarks: item.REMARKS || null,
          created_date: new Date()
        }));

        let InventorySaved = '';
        console.log("check Outside");
        console.log("rowsToInsert Outside", rowsToInsert);



        if ('gateinVehicle' in req) {
          console.log("check");
          await SaveGiInventoryChecklist.destroy({
            where: {
              visit_id: req.VISIT_ID
            }
          });

          console.log("rowsToInsert", rowsToInsert);

          InventorySaved = await SaveGiInventoryChecklist.bulkCreate(rowsToInsert);
        } else {

          console.log("check Inside 2");
          console.log("rowsToInsert Inside 2", rowsToInsert);
          // To destroy old one and add new one 
          await SaveInventoryCheckList.destroy({
            where: { visit_id: req.VISIT_ID }
          });

          InventorySaved = await SaveInventoryCheckList.bulkCreate(rowsToInsert);
        }

        if (InventorySaved[0] === 0) {
          return { status: "Error", message: "Inventory Saved Failed!" };
        } else {
          insertRecord = 1;
        }
      }

      if (insertRecord == 1) {
        // Dent and Scratch Details 

        if (req.DentScratch.length >= 1) {
          const dentAndScratch = req.DentScratch;
          const rowsToInsert = dentAndScratch.map(item => ({
            VISIT_ID: item.VISIT_ID,
            X_POINT: item.X_POINT,
            Y_POINT: item.Y_POINT,
            TYPE: item.TYPE,
            COLOR_HEX: item.COLOR_HEX,
            CREATED_DATE: new Date()
          }));

          let dentAndScratchSaved = "";

          if ('gateinVehicle' in req) {
            // To destroy old one and add new one 
            await SaveGIDentAndScratch.destroy({
              where: { VISIT_ID: req.VISIT_ID }
            });

            dentAndScratchSaved = await SaveGIDentAndScratch.bulkCreate(rowsToInsert);

            const updateServiceBooking = await ServiceBooking.update({
              fit_status: req.fitStatus,
              pickup_status: 2,
              pickup_date: utils.getDateTime(),
              pickup_time: utils.getDateTime(),
              status: "Open"
            }, {
              where: {
                id: req.DMS_BOOKING_ID
              }
            })

            const updateDriverPickupDrop = await DriverPickpDropModel.create({
              DMS_BOOKING_ID: req.DMS_BOOKING_ID,
              EVENT: req.fit_status,
              EVENT_TIME: utils.getDateTime(),
              LATTITUDE: req.LATTITUDE,
              LONGITUDE: req.LONGITUDE,
              USER: req.userId,
              CREATED_DATE: utils.getDateTime()
            })
          } else {
            // To destroy old one and add new one 
            await SaveDentAndScratch.destroy({
              where: { VISIT_ID: req.VISIT_ID }
            });

            dentAndScratchSaved = await SaveDentAndScratch.bulkCreate(rowsToInsert);

          }

          if (dentAndScratchSaved[0] === 0) {
            return { status: "Error", message: "Dent And Scratch Saved Failed!" };
          }
        }
      }
    } else {
      return {
        message: 'Insert for ChecklistTypes failed!'
      }
    }

    if (insertChecklist == -1) {
      return {
        message: 'Mandatory parameters missing!'
      }
    }

    const auditRemark = {};
    const payload = req.Parent; // or wherever payload comes from

    auditRemark.assignedTechnician = payload.ASSIGNED_TECH_USER_ID;

    const updateVisitAuditTrail = await utils.updateAuditTrail(
      req.VISIT_ID,
      req.Parent.VISIT_STATUS,
      req.userId,
      auditRemark
    )

    const addImageCount = await db.imageCount.upsert({
      VISIT_ID: req.VISIT_ID,
      INVENTORY_PHOTO_COUNT: req.InventoryPhotoCount ? req.InventoryPhotoCount : 0,
      INSPECTION_PHOTO_COUNT: 0,
      SIGNATURE_PHOTO_COUNT: req.SignatureCaptured ? req.SignatureCaptured : 0
    })

    return { status: "Success", VisitId: req.VISIT_ID };

    // console.log("saveCustomerVoice-->", req.InventoryChecklist);
  } catch (err) {
    logger.error('Vehicle dao saveCustomerVoice', err);
  }
}

const managerassignsa = async (req) => {
  console.log("Parent Outside", req.Parent[0]);
  const updateAssigned = await utils.updateParentTable(req.userId, req.VisitId, req.Parent[0], 'Parent');

  if (updateAssigned) {
    return {
      status: true,
      message: "SA Assigned Successfully"
    }
  } else {
    return {
      status: false,
      message: "SA Assigned Failed"
    }
  }

}

const managergateinassignsa = async (req) => {
  const updateAssigned = await utils.updateParentTable(req.userId, req.VisitId, req, 'Security Gate In');

  if (updateAssigned) {
    return {
      status: true,
      message: "SA Assigned Successfully"
    }
  } else {
    return {
      status: false,
      message: "SA Assigned Failed"
    }
  }

}

const updatebookingdetails = async (req) => {
  const updateAssigned = await utils.updateParentTable(req.userId, "", req, 'Service Booking');

  if (updateAssigned) {
    return {
      status: true,
      message: "SA Assigned Successfully"
    }
  } else {
    return {
      status: false,
      message: "SA Assigned Failed"
    }
  }

}

const saveSecurityGateIn = async (req) => {
  let data = {};
  try {
    data = await SecurityGateIn.create({
      vehicle_reg_no: req.Vehicle_Number,
      vehicle_km_reading: req.Km,
      vehicle_make_id: req.Make,
      vehicle_model_id: req.Model,
      gate_out_type: req.gate_out_type,
      pick_up_by: req.Pickup_by,
      assigned_sa: req.assigned_sa,
      active: "1",
      created_by: req.userId,
      updated_by: req.userId
    })

    const updateService = await ServiceBooking.update({
      fit_status: "VEHICLE_IN_GARAGE"
    }, {
      where: {
        registrationNumber: req.Vehicle_Number,
        pickup_status: 2,
        fit_status: "PICKUP_DONE"
      }
    })

    if (updateService[0] !== 0) {

      const giFcmToken = await ServiceBooking.findOne({
        where: {
          registrationNumber: req.Vehicle_Number,
          fit_status: "VEHICLE_IN_GARAGE"
        },
        include: [
          {
            model: User,
            as: 'serviceBookingUsers'
          }
        ]
      })

      await sendNotificationDataToToken(giFcmToken.serviceBookingUsers.fcm_tocken,
        {
          title: "Vehcile is in Garage",
          body: "Vehicle is in Garage. Click to stop of the location tracking",
          tab: "",
          visitID: ""
        }
      )
    }

  } catch (err) {
    logger.error('Vehicle dao securityGateIn', err);
    next(err);
  }
  return data;
}

const saveSecurityGateOut = async (req) => {
  let result = '';
  let data = {};
  let securityGateinUpdate = '';
  try {
    data = await SecurityGateOut.create({
      vehicle_reg_no: req.Vehicle_Number,
      visit_id: (req.Visit_Id == "null" || req.Visit_Id == "") ? "0" : req.Visit_Id,
      gate_out_type: (req.Visit_Id == "null" || req.Visit_Id == "") ? "Casual" : "Delivered",
      pick_up_by: req.Pickup_by,
      created_by: req.userId,
      updated_by: req.userId
    })

    const latestGateIn = await SecurityGateIn.findOne({
      where: { vehicle_reg_no: req.Vehicle_Number },
      order: [['createdAt', 'DESC']],
      attributes: ['id']
    });

    if (latestGateIn) {
      securityGateinUpdate = await SecurityGateIn.update(
        {
          gate_out_type: (req.Visit_Id == "null" || req.Visit_Id == "") ? "Casual" : "Delivered",
          updated_by: req.userId
        },
        {
          where: { id: latestGateIn.id }
        }
      );
    }
    console.log("securityGateinUpdate-->", securityGateinUpdate);
  } catch (err) {
    logger.error('Vehicle dao securityGateOut', err);
  }
  if (securityGateinUpdate !== '') {
    return result = { status: true, message: 'Vehicle Gate Out Successfully', data: data };
  } else if (Object.keys(data).length === 0) {
    return result = { status: false, message: 'Vehicle Gate Out Failed' };
  } else if (securityGateinUpdate === '') {
    return result = { status: false, message: 'Vehicle Gate In Not Found' };
  }
}

const getsecuritytasklist = async (req) => {
  console.log("three");
  const outletId = await User.findOne({
    where: { id: req.userId },
    include: [{
      model: Employee,
      as: 'employee',
      attributes: ['outletId']
    }]
  });
  console.log("four");
  console.log("outletId.employee.outletIdfor", outletId.employee.outletId);


  const gateinSecurity = await JobCard.findAll({
    where: {
      fit_status: "GATEIN_COMPLETE",
      outlet_id: outletId.employee.outletId,
      [Op.not]: literal(
        `NOT EXISTS (SELECT 1 FROM vrm_trans_security_gateins S WHERE S.visit_id = transactions.id)`
      )
    },
    include: [
      {
        model: Vehicle,
        as: 'vehicleDetails',
      }
    ]
  })
  console.log("five");

  const gateOutSecurity = await JobCard.findAll({
    where: {
      fit_status: "POST_INSPECTION_COMPLETED",
      status_value: "DELIVERED",
      outlet_id: outletId.employee.outletId,
      [Op.not]: literal(
        `NOT EXISTS (SELECT 1 FROM vrm_trans_security_gateouts S WHERE S.visit_id = transactions.id)`
      )
    },
    include: [
      {
        model: Vehicle,
        as: 'vehicleDetails',
      }
    ]
  })

  console.log("gateinSecurity", gateinSecurity);
  console.log("gateOutSecurity", gateOutSecurity);
  if (gateinSecurity && gateOutSecurity) {
    return {
      status: true,
      securitytasklist: gateinSecurity,
      gateOutSecurity: gateOutSecurity
    }
  } else if (gateinSecurity) {
    return {
      status: true,
      gateinSecurity: gateinSecurity
    }
  } else if (gateOutSecurity) {
    return {
      status: true,
      gateOutSecurity: gateOutSecurity
    }
  } else {
    return {
      status: false,
      message: "No Data Found"
    }
  }
}

const getVahanData = async (req) => {

  let FLAPresent = false;
  let FLAResponseModel = {};
  let FLAResponseServer = {};


  const FLAData = await FlaData.findOne({
    where: {
      VEHICLE_REGISTRATION_NUMBER: req.VehicleRegNo
    }
  })

  if (!FLAData) {
    const FLAResults = await CarpmDao.callflaAPI("GET", req.VehicleRegNo);

    if (FLAResults) {
      FLAResponseServer = FLAResults;

      if (FLAResults.status == 100) {
        FLAPresent = true;

        const flaVehicle = FLAResults.results[0].vehicle;
        const hypth = FLAResults.results[0].hypth;
        const insurance = FLAResults.results[0].insurance;

        const getValue = (obj, key) => obj?.[key] ?? '';


        const vehicleFlaAdd = await FlaData.create({
          ACCESS_TOKEN: "TVST410PROD",
          VEHICLE_REGISTRATION_NUMBER: getValue(flaVehicle, 'regn_no'),
          VEHICLE_STATE_CODE: getValue(flaVehicle, 'state_cd'),
          VEHICLE_RTO_CODE: getValue(flaVehicle, 'rto_cd'),
          VEHICLE_RTO_NAME: getValue(flaVehicle, 'rto_name'),
          VEHICLE_CHASI_NO: getValue(flaVehicle, 'chasi_no'),
          VEHICLE_ENGINE_NO: getValue(flaVehicle, 'eng_no'),
          VEHICLE_REGISTERED_DATE: getValue(flaVehicle, 'regn_dt'),
          VEHICLE_AGE: getValue(flaVehicle, 'vehicle_age'),
          VEHICLE_PURCHASE_DATE: getValue(flaVehicle, 'purchase_dt'),
          VEHICLE_CLASS_DESCRIPTION: getValue(flaVehicle, 'vh_class_desc'),
          VEHICLE_OWNER_SR: getValue(flaVehicle, 'owner_sr'),
          VEHICLE_PUCC_NO: getValue(flaVehicle, 'pucc_no'),
          VEHICLE_PERMANENT_ADDRESS: getValue(flaVehicle, 'pAddress'),
          VEHICLE_CURRENT_ADDRESS: getValue(flaVehicle, 'cAddress'),
          VEHICLE_MAKE: getValue(flaVehicle, 'maker_desc'),
          VEHICLE_MODEL: getValue(flaVehicle, 'maker_model'),
          VEHICLE_COLOR: getValue(flaVehicle, 'color'),
          VEHICLE_FUEL_TYPE: getValue(flaVehicle, 'fuel_type_desc'),
          VEHICLE_CUBIC_CAPACITY: getValue(flaVehicle, 'cubic_cap'),
          VEHICLE_MANUFACTURE_YEAR: getValue(flaVehicle, 'manu_yr'),
          VEHICLE_SEAT_CAPACITY: getValue(flaVehicle, 'seat_cap'),
          VEHICLE_FLA_RTO_GEO: getValue(flaVehicle, 'fla_rto_geo'),
          VEHICLE_BLACKLIST_FLAG: getValue(flaVehicle, 'blacklist_flag'),
          VEHICLE_BLACKLIST_STATUS: getValue(flaVehicle, 'blacklist_status'),
          VEHICLE_FIT_UPTO: getValue(flaVehicle, 'fit_upto'),
          VEHICLE_MANUFACTURE_MONTH_YEAR: getValue(flaVehicle, 'manu_month_yr'),
          VEHICLE_NOC_DETAILS: getValue(flaVehicle, 'noc_details'),
          VEHICLE_PERMIT_ISSUE_DATE: getValue(flaVehicle, 'permit_issue_dt'),
          VEHICLE_PERMIT_NUMBER: getValue(flaVehicle, 'permit_no'),
          VEHICLE_PERMIT_TYPE: getValue(flaVehicle, 'permit_type'),
          VEHICLE_COMMERCIAL_FLAG: getValue(flaVehicle, 'commercial_flag'),
          VEHICLE_PERMIT_VALID_FROM: getValue(flaVehicle, 'permit_valid_from'),
          VEHICLE_PERMIT_VALID_UPTO: getValue(flaVehicle, 'permit_valid_upto'),
          VEHICLE_PUCC_UPTO: getValue(flaVehicle, 'pucc_upto'),
          VEHICLE_REGISTERED_AT: getValue(flaVehicle, 'registered_at'),
          VEHICLE_TAX_UPTO: getValue(flaVehicle, 'tax_upto'),
          VEHICLE_FATHER_NAME: getValue(flaVehicle, 'father_name'),
          VEHICLE_OWNER_NAME: getValue(flaVehicle, 'owner_name'),
          HYPTH_FNCR_NAME: getValue(hypth, 'fncr_name'),
          HYPTH_PUCC_NO: getValue(hypth, 'pucc_no'),
          INSURANCE_POLICY_NUMBER: getValue(insurance, 'insurance_policy_no'),
          INSURANCE_ISEXPIRED: getValue(insurance, 'insurance_expired'),
          INSURANCE_COMPANY: getValue(insurance, 'insurance_comp'),
          INSURANCE_PUCC_NO: getValue(insurance, 'pucc_no'),
          INSURANCE_EXPIRY_DATE: getValue(insurance, 'insurance_upto'),
          CREATED_BY: req.userId,
          UPDATED_BY: req.userId
        });
      }
    } else {
      return {
        status: false
      }
    }

    console.log("FLAResults", FLAResults);
  } else {
    FLAPresent = true;
    FLAResponseModel = FLAData;
  }
  return {
    status: true,
    FLAPresent: FLAPresent,
    FLAResponseModel: FLAResponseModel,
    FLAResponseServer: FLAResponseServer
  }
}

const getvehiclehistory = async (req) => {

  const vehicleDetails = await JobCard.findAll({
    where: {
      fit_status: "POST_INSPECTION_COMPLETED",
      reg_no: req.VehicleNumber
    },
    include: [
      {
        model: User,
        as: 'user_sa',
        required: false,
        include: [{
          model: Employee,
          as: 'employee'
        }]
      },
      {
        model: Pincodes,
        as: 'pincodeDetailsJoCard',
        required: false,
        limit: 1,
        separate: true
      },
      {
        model: Outlet,
        as: 'outlet'
      },
      {
        model: PartsIndent,
        as: 'partsIndent'
      }
    ]
  })

  if (vehicleDetails) {
    return {
      status: true,
      vehicleDetails: vehicleDetails
    }
  } else {
    return {
      status: false,
      message: "No result found"
    }
  }
}

const getvehiclehistorybyvisitid = async (req) => {

  let inventoryResponse = [];
  let inspectionResponse = [];
  let checkListType = "";

  const vehicleDetails = await JobCard.findOne({
    where: {
      id: req.VISIT_ID,
      fit_status: "POST_INSPECTION_COMPLETED"
    },
    include: [
      {
        model: User,
        as: 'user_tech'
      },
      {
        model: User,
        as: "user_sa"
      },
      {
        model: Outlet,
        as: 'outlet'
      },
      {
        model: PartsIndent,
        as: 'partsIndent'
      },
      {
        model: OslSchedules,
        as: 'oslSchedules'
      },
      {
        model: Schedules,
        as: 'schedules'
      },
      {
        model: checkListTypeMobile,
        as: "checklistType",
      }
    ]
  })


  if (vehicleDetails) {
    inventoryResponse = await utils.getInventory(req.VISIT_ID);
    let checkListTypeCode = vehicleDetails.checklistType.CHECKLIST_TYPE_CODE;
    if (checkListTypeCode == "CHK_LIST_MAJOR") {
      checkListType = "MajorChecklist";
    } else if (checkListTypeCode == "CHK_LIST_MINOR") {
      checkListType = "MinorChecklist";
    }
    inspectionResponse = await utils.getInspection(req.VISIT_ID, checkListType);

  }

  if (vehicleDetails) {
    return {
      status: true,
      vehicleDetails: vehicleDetails,
      pastcheckListType: checkListType,
      inventoryResponse: inventoryResponse,
      inspectionResponse: inspectionResponse
    }
  } else {
    return {
      status: false,
      message: "No result found"
    }
  }
}

const savedriverlocation = async (req) => {
  const saveLocation = await saveDriverLocation.create({
    USER_ID: req.userId,
    DMS_BOOKING_ID: req.DMS_BOOKING_ID,
    LATITUDE: req.latitude,
    LONGITUDE: req.longitude,
    CREATED_TIMESTAMP: utils.getDateTime()
  });

  if (saveLocation) {
    return {
      status: true,
      data: saveLocation
    }
  } else {
    return {
      status: false,
      message: "Location Save Failed"
    }
  }
}

const listVehicleForCustomerComplaint = async (reqData, user) => {

  let rows = {};
  try {
    const { searchKey } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};

    rows = await Vehicle.findAll({
      where: { ...searchCondition, },
      order: [['id', 'DESC']],
      include: [
        {
          model: Customer, as: 'customer',
          attributes: [
            [
              db.Sequelize.literal(
                `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
              ),
              "firstName",
            ],
            [
              db.Sequelize.literal(
                `IFNULL(
      CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR),
      ''
    )`
              ),
              "lastName",
            ],
          ],
        },

      ],
      attributes: [
        "registrationNumber"
      ]
    });


    return rows;
  } catch (err) {
    logger.error('Vehicle dao listVehicles', err);
    console.log(err);
  }
};
const dao = {
  addVehicle,
  listVehicles,
  findByVehicleId,
  updateVehicle,
  findByRegistrationNumber,
  findByChassisNumber,
  findByEngineNumber,
  getAllVechicleColors,
  checkUnique,
  checkUniqueForEngineNumber,
  checkUniqueForChassisNumber,
  addVehicleTest,
  vehicleSearch,
  createVehicle,
  updateVehicleMobile,
  getVehicleDetails,
  listVehicleForCustomerComplaint,
  searchGateinVehicleStatus,
  saveCustomerVoice,
  managerassignsa,
  managergateinassignsa,
  savedriverlocation,
  updatebookingdetails,
  saveSecurityGateIn,
  saveSecurityGateOut,
  getVahanData,
  getvehiclehistory,
  getvehiclehistorybyvisitid,
  getsecuritytasklist,
};

export default dao;
