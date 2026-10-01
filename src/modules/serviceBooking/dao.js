import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import { normalizeServiceBookingStatus } from './status.js';

const ServiceBooking = db.servicebookings;
const ServiceBookingActivity = db.servicebookingactivities;
const MakeCompanyMap = db.makecompanymaps;
const ModelCompanyMap = db.modelcompanymaps;
const Vehicle = db.vehicles;
const Customer = db.customers;
const Outlet = db.outlets;
const Employee = db.employees;
const Make = db.makes;
const Model = db.models;
const DispositionCompanyMap = db.dispositioncompanymaps;
const DisPosition = db.dispositions;
const sequelize = db.sequelize;
const SourceType = db.sourcetypes;
const Source = db.sources;
const Pincode = db.pincodes;

const isEnabled = value => value === true || Number(value) === 1;

const validateActiveDriver = async (driverId, transaction) => {
  if (!driverId) return;
  const driver = await db.driverMaster.findOne({
    where: { id: driverId, status: 1 },
    transaction,
  });
  if (!driver) {
    const err = new Error('Selected pickup/drop-off driver is not active or does not exist');
    err.status = 400;
    throw err;
  }
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
        ]]
      }
    });

    return rows;
  } catch (err) {
    logger.error('ServiceBooking dao getVehicleDetails', err);
    throw err;
  }
};

const addServiceBooking = async (serviceBooking, user, employee) => {

  console.log('serviceBooking dao addServiceBooking', serviceBooking);

  let data = {};
  const currentDate = new Date();
  const documentType = 'SBK';
  const transaction = await db.sequelize.transaction();
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

  // const make = await Make.findOne({
  //   where: { makeName: serviceBooking.make?.toUpperCase().trim() },
  //   attributes: ['id', 'makeName'],
  //   transaction
  // }); 
  // const model = await Model.findOne({
  //   where: { modelName: serviceBooking.model?.toUpperCase().trim() },
  //   attributes: ['id', 'modelName'],
  //   transaction
  // });

  let make = null;
  let model = null;

  const safeUpper = (val) =>
  typeof val === "string" ? val.toUpperCase().trim() : null;

if (!serviceBooking.makeId) {
  const mName = safeUpper(serviceBooking.make);
  if (mName) {
    make = await Make.findOne({
      where: { makeName: mName },
      attributes: ['id', 'makeName'],
      transaction
    });
  }
}

if (!serviceBooking.modelId) {
  const mdName = safeUpper(serviceBooking.model);
  if (mdName) {
    model = await Model.findOne({
      where: { modelName: mdName },
      attributes: ['id', 'modelName'],
      transaction
    });
  }
}
  const requestedStatusDetails = normalizeServiceBookingStatus(serviceBooking.status);
  let fromBridge = !serviceBooking.statusFlag && !requestedStatusDetails;

  if (fromBridge) {
    serviceBooking.booking_track = 'Bridge_api_created';
    serviceBooking.customerStatus = 2;
  }


  try {
    if(serviceBooking.customerName == "" || serviceBooking.customerName == null || serviceBooking.customerName == undefined){
      serviceBooking.customerName = "unknown";
    }
    const customerName = db.sequelize.literal(`HEX(AES_ENCRYPT('${serviceBooking.customerName}', '${encryptConfig.code}'))`);
    // const customerMobileNumber = db.sequelize.literal(`HEX(AES_ENCRYPT('${serviceBooking.customerMobileNumber}', '${encryptConfig.code}'))`);
    const mobile = serviceBooking.customerMobileNumber || serviceBooking.mobileNumber;
    const customerMobileNumber = db.sequelize.literal(`HEX(AES_ENCRYPT('${mobile}', '${encryptConfig.code}'))`);

    // Auto-resolve vehicleId from registrationNumber if not provided
    let resolvedVehicleId = serviceBooking.vehicleId ?? null;
    if (!resolvedVehicleId && serviceBooking.registrationNumber) {
      const vehicleRow = await Vehicle.findOne({
        where: { registrationNumber: serviceBooking.registrationNumber },
        attributes: ['id'],
        transaction
      });
      if (vehicleRow) {
        resolvedVehicleId = vehicleRow.id;
      }
    }

    // Auto-resolve outletId from outletName if provided
    let resolvedOutletId = null;
    if (serviceBooking.outletName) {
      const outletRow = await Outlet.findOne({
        where: { outletCode: serviceBooking.outletName },
        attributes: ['id'],
        transaction
      });
      if (outletRow) {
        resolvedOutletId = outletRow.id;
      }
    }

    // Auto-resolve dmsSourceId if not provided
    if (!serviceBooking.dmsSourceId) {
      const sourceRow = await Source.findOne({
        where: { sourceName: 'Digital' },
        attributes: ['id'],
        transaction
      });
      if (sourceRow) {
        serviceBooking.dmsSourceId = sourceRow.id;
      }
    }

    if (isEnabled(serviceBooking.pickupStatus)) {
      await validateActiveDriver(serviceBooking.pickupDriverId, transaction);
    }
    if (isEnabled(serviceBooking.dropoffStatus)) {
      await validateActiveDriver(serviceBooking.dropoffDriverId, transaction);
    }

    // Auto-resolve dmsSourceTypeId if not provided
    if (!serviceBooking.dmsSourceTypeId && serviceBooking.source && serviceBooking.dmsSourceId) {
      const sourceTypeRow = await SourceType.findOne({
        where: { sourceTypeName: serviceBooking.source, sourceId: serviceBooking.dmsSourceId },
        attributes: ['id'],
        transaction
      });
      if (sourceTypeRow) {
        serviceBooking.dmsSourceTypeId = sourceTypeRow.id;
      }
    }

    // pass req outlet code direct to generate number 03-04-2026
    const bookingNumber = await generateBookingNumber( 
      documentType,
      employee.outlet.outletCode,
      transaction
    );


    if (requestedStatusDetails) {
      serviceBooking.status = requestedStatusDetails.status;
      serviceBooking.statusFlag = requestedStatusDetails.statusFlag;
    } else {
      serviceBooking.status = 'Inprogress';
      serviceBooking.statusFlag = 2;
    }

    if(fromBridge == true){
      serviceBooking.statusFlag=2;
      serviceBooking.status="Inprogress";
      const despositionValue = await getDispositionByCode("BOOK", user);
      serviceBooking.dispositionId = despositionValue ? despositionValue.id : 27;
    }

 
    data = await ServiceBooking.create(
      { 
        // outletId: employee.outletId,
        outletId: resolvedOutletId || employee.outletId,
        serviceBookingNumber: bookingNumber,
        status: serviceBooking.status ? serviceBooking.status : "",
        statusFlag: serviceBooking.statusFlag ? serviceBooking.statusFlag : 1,
        registrationNumber: serviceBooking.registrationNumber?serviceBooking.registrationNumber:null,
        vehicleId: resolvedVehicleId?resolvedVehicleId:null,
        vehicleMakeId: Number(serviceBooking.makeId) || make?.id || null,
        vehicleModelId: Number(serviceBooking.modelId) || model?.id || null,
        odometer: Number(serviceBooking.odometer) || null,
        customeId: serviceBooking.customeId ?? serviceBooking.customerId ?? null,
        customerName: customerName,
        customerMobileNumber: customerMobileNumber,
        customerAddress: serviceBooking.customerAddress,
        customerState: serviceBooking.customerState,
        customerCity: serviceBooking.customerCity,
        pincode: serviceBooking.pincode ?? serviceBooking.pinCode,
        customerStatus: serviceBooking.customerStatus,
        source: serviceBooking.source?serviceBooking.source:null,
        dmsSourceId: serviceBooking.dmsSourceId ?? null,
        dmsSourceTypeId: serviceBooking.dmsSourceTypeId ?? null,
        dispositionId: serviceBooking.dispositionId?serviceBooking.dispositionId:null,
        serviceType: serviceBooking.serviceType ?? serviceBooking.b2bServiceType,
        phoneCallNotes: serviceBooking.phoneCallNotes,
        appointmentDate: serviceBooking.appointmentDate ?serviceBooking.appointmentDate: formattedDate,
        // add remaining col from sb 
        payment_id: serviceBooking.paymentId?serviceBooking.paymentId:null,
        txnid: serviceBooking.txnId?serviceBooking.txnId:null,
        advance_amount : serviceBooking.amount?serviceBooking.amount:null,
        pickup_date : serviceBooking.pickupDateTime?serviceBooking.pickupDateTime:null,
        pickup_time : serviceBooking.pickupDateTime?serviceBooking.pickupDateTime:null,
        pick_up_address : serviceBooking.pickupAddress?serviceBooking.pickupAddress:null,
        utm_source: serviceBooking.utmSource?serviceBooking.utmSource:null,
        payment_response: serviceBooking.paymentResponse?serviceBooking.paymentResponse:null,
        payment_remarks: serviceBooking.paymentRemarks?serviceBooking.paymentRemarks:null,
        payment_date: serviceBooking.paymentDate?serviceBooking.paymentDate:null,
        coupon_code: serviceBooking.couponCode?serviceBooking.couponCode:null,
        coupon_amount: serviceBooking.couponAmount?serviceBooking.couponAmount:null,
        validity_till: serviceBooking.validityTill?serviceBooking.validityTill:null,
        coupon_flag: serviceBooking.couponFlag?serviceBooking.couponFlag:null,
        coupon_description: serviceBooking.couponDesc?serviceBooking.couponDesc:null,
        booking_track: serviceBooking.booking_track?serviceBooking.booking_track:null,
// ends

        nextFollowupDate: serviceBooking.nextFollowupDate,
        scheduledStartDate: serviceBooking.scheduledStartDate,
        scheduledEndDate: serviceBooking.scheduledEndDate,
        createdBy: user?.id ?? "",
        bookingId: serviceBooking.bookingId ?? null,
        b2bBookingId: serviceBooking.b2bBookingId ?? null,
        pickup_status: serviceBooking.pickupStatus == null ? null : (isEnabled(serviceBooking.pickupStatus) ? 1 : 0),
        dropoff_status: serviceBooking.dropoffStatus == null ? null : (isEnabled(serviceBooking.dropoffStatus) ? 1 : 0),
        pickup_date: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupDateTime : null,
        pickup_time: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupDateTime : null,
        pick_up_date: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupDateTime : null,
        pickup_driver_id: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupDriverId : null,
        dropoff_driver_id: isEnabled(serviceBooking.dropoffStatus) ? serviceBooking.dropoffDriverId : null,
        drop_off_date: isEnabled(serviceBooking.dropoffStatus) ? serviceBooking.dropOffDateTime : null,
        drop_off_address: isEnabled(serviceBooking.dropoffStatus) ? serviceBooking.dropOffAddress : null,
        pick_up_address: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupAddress : null,
        service_description: serviceBooking.serviceDescription? serviceBooking.serviceDescription : null,
        total_amount: serviceBooking.totalAmount ?? null,
        final_amount: serviceBooking.finalAmount ?? null,
        mytvs_coin: serviceBooking.mytvsCoin ?? null,
        agent_discount: serviceBooking.agentDiscount ?? null,
        accident_location: serviceBooking.accident_location ?? null,
        policy_number: serviceBooking.policy_number ?? null,
        insurance_company: serviceBooking.insurance_company ?? null,
        policy_type: serviceBooking.policy_type ?? null,
        accident_date: serviceBooking.accident_date ?? null,
        accident_time: serviceBooking.accident_time ?? null,
        accident_location_details: serviceBooking.accident_location_details ?? null,

      },
      { transaction }
    );
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error('ServiceBooking dao addServiceBooking', err);
    // if (next) next(err);
    throw err;
  }
  return data;
};

const addServiceBookingMobile = async (serviceBooking, user, employee) => {
  let data = {};
  const documentType = 'SBK';
  const transaction = await db.sequelize.transaction();
  let date = serviceBooking.pickupDateTime.split(" ")[0];
  let time = serviceBooking.pickupDateTime.split(" ")[1];
  // let date = serviceBooking.appointmentDate.split(" ")[0];
  // let time = serviceBooking.appointmentDate.split(" ")[1];
  try {
    const customerName = db.sequelize.literal(`HEX(AES_ENCRYPT('${serviceBooking.customerName}', '${encryptConfig.code}'))`);
    const customerMobileNumber = db.sequelize.literal(`HEX(AES_ENCRYPT('${serviceBooking.mobileNumber}', '${encryptConfig.code}'))`);

    const bookingNumber = await generateBookingNumber(
      documentType,
      employee.outlet.outletCode,
      transaction
    );

    let sourceData = await Source.findAll({
      where: { sourceName: serviceBooking.source }
    });

    let modelData = await Model.findAll({
      where: { modelName: serviceBooking.model }
    });

    let vehicleData = await Vehicle.findAll({
      where: { modelId: modelData[0].id }
    });

    data = await ServiceBooking.create(
      {
        outletId: employee.outletId,
        serviceBookingNumber: bookingNumber,
        status: serviceBooking.status === 3 ? "Completed" : "Inprogress",
        statusFlag: serviceBooking.pickup_status,
        registrationNumber: serviceBooking.registrationNumber,
        vehicleId: vehicleData[0].id,
        vehicleMakeId: modelData[0].makeId,
        vehicleModelId: modelData[0].id,
        odometer: serviceBooking.odometer !== "" ? serviceBooking.odometer : null,
        customeId: vehicleData[0].customerId,
        customerName: customerName,
        customerMobileNumber: customerMobileNumber,
        customerAddress: serviceBooking.customerAddress,
        customerState: serviceBooking.customerState,
        customerCity: serviceBooking.customerCity,
        pincode: serviceBooking.pinCode,
        customerStatus: serviceBooking.pickup_status,
        source: serviceBooking.source,
        dmsSourceId: sourceData[0].dataValues.id,
        dmsSourceTypeId: serviceBooking.dmsSourceTypeId ?? null,
        dispositionId: serviceBooking.dispositionId,
        serviceType: serviceBooking.serviceType,
        phoneCallNotes: serviceBooking.phoneCallNotes,
        appointmentDate: serviceBooking.appointmentDate,
        nextFollowupDate: serviceBooking.nextFollowupDate,
        scheduledStartDate: serviceBooking.scheduledStartDate,
        scheduledEndDate: serviceBooking.scheduledEndDate,
        createdBy: user.id,
        bookingId: serviceBooking.bookingId ? serviceBooking.bookingId : 0,
        b2bBookingId: serviceBooking.b2bBookingId ? serviceBooking.b2bBookingId : 0,
        pickup_status: serviceBooking.pickup_status ? serviceBooking.pickup_status : 0,
        pickup_date: serviceBooking.pickupDateTime ? date : "",
        pickup_time: serviceBooking.pickupDateTime ? date : "",
        service_description: serviceBooking.serviceDescription ? serviceBooking.serviceDescription : "",
      },
      { transaction }
    );
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error('ServiceBooking dao addServiceBooking', err);
    if (next) next(err);
    throw err;
  }
  return data.id;
};

const findByemployeeById = async (id) => {
  try {
    return await Employee.findOne({
      where: { id: id },
      include: [{ model: Outlet, as: 'outlet' }],
    });
  } catch (err) {
    logger.error('ServiceBooking dao findByemployeeById', err);
    next(err);
  }
};

const generateBookingNumber = async (documentType, outletCode, transaction) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  }
  else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const lastBooking = await ServiceBooking.findOne({
    where: {
      serviceBookingNumber: {
        [Op.like]: `${documentType}-${outletCode}${currentYear}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let sequenceNumber = 1;
  if (lastBooking) {
    const lastNumber = lastBooking.serviceBookingNumber.split('-')[2];
    console.log('lastNumber    ' + lastNumber);
    sequenceNumber = parseInt(lastNumber, 10) + 1;
  }

  const formattedSequenceNumber = sequenceNumber.toString().padStart(6, '0');
  return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};



const generateBookingNumberBridge = async (documentType, outletCode, transaction) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let fyYear;
  if (currentDate.getMonth() >= 3) {
    fyYear = year + 1;
  }
  else {
    fyYear = year;
  }
  const currentYear = fyYear.toString().slice(-2);
  const lastBooking = await ServiceBooking.findOne({
    where: {
      serviceBookingNumber: {
        [Op.like]: `${documentType}-${outletCode}${currentYear}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let sequenceNumber = 1;
  if (lastBooking) {
    const lastNumber = lastBooking.serviceBookingNumber.split('-')[2];
    console.log('lastNumber    ' + lastNumber);
    sequenceNumber = parseInt(lastNumber, 10) + 1;
  }

  const formattedSequenceNumber = sequenceNumber.toString().padStart(6, '0');
  return `${documentType}-${outletCode}${currentYear}-${formattedSequenceNumber}`;
};

const getDispositionDetails = async (id, user) => {
  try {
    const row = await DisPosition.findOne({
      where: { id: id, status: 1 },
      include: [
        {
          model: DispositionCompanyMap,
          as: "dispositioncompanymap",
          required: false,
        }
      ]
    });

    return row;

  } catch (err) {
    logger.error("getDispositionDetails Error in Dao:", err);
    throw err;
  }
};


const getDispositionByCode = async (code, user) => {
  try {
    const row = await DisPosition.findOne({
      where: { disPositionCode: code, status: 1 },
      raw: true,
    });

    return row;

  } catch (err) {
    logger.error("getDispositionDetails Error in Dao:", err);
    throw err;
  }
};


const listServiceBookings = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
        [Op.or]: [
          { serviceBookingNumber: { [Op.like]: `%${searchKey}%` } },
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
          { customerName: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {};
    const userCondition = { createdBy: user.id, outletId: user.outlet.id };
    const count = await ServiceBooking.count({
      where: { ...searchCondition, ...userCondition },
    });
    let rows = await ServiceBooking.findAll({
      where: { ...searchCondition, ...userCondition },
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: DisPosition, as: 'disposition' },
        { model: Make, as: 'make' },
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
    logger.error('ServiceBooking dao listServiceBookings', err);
    throw err;
  }
};

const listAppointments = async (filters, user) => {
  try {
    const replacements = {
      outletId: user.outlet.id,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
    let filterSql = '';

    if (filters.advisorId !== undefined && filters.advisorId !== null && filters.advisorId !== '') {
      filterSql += ' AND e.id = :advisorId';
      replacements.advisorId = filters.advisorId;
    }
    if (filters.serviceType) {
      filterSql += ' AND sb.serviceType = :serviceType';
      replacements.serviceType = filters.serviceType;
    }
    if (filters.status) {
      filterSql += ' AND COALESCE(latestActivity.status, sb.status) = :status';
      replacements.status = filters.status;
    }

    const [rows] = await sequelize.query(
      `SELECT sb.id, sb.serviceBookingNumber AS bookingNumber, sb.customeId AS customerId,
        CAST(AES_DECRYPT(UNHEX(sb.customerName), :encryptKey) AS CHAR) AS customerName,
        CAST(AES_DECRYPT(UNHEX(sb.customerMobileNumber), :encryptKey) AS CHAR) AS customerMobileNumber,
        sb.vehicleId, sb.registrationNumber, sb.serviceType, e.id AS advisorId,
        e.employeeName AS advisorName, sb.appointmentDate, sb.scheduledStartDate,
        sb.scheduledEndDate, COALESCE(latestActivity.status, sb.status) AS status,
        sb.status AS bookingStatus,
        sb.pickup_status AS pickupStatus, sb.pickup_date AS pickupDateTime,
        sb.pick_up_address AS pickupAddress, sb.pickup_driver_id AS pickupDriverId,
        sb.dropoff_status AS dropoffStatus, sb.drop_off_date AS dropOffDateTime,
        sb.drop_off_address AS dropOffAddress, sb.dropoff_driver_id AS dropoffDriverId
      FROM servicebookings sb
      LEFT JOIN users u ON u.id = sb.createdBy
      LEFT JOIN employees e ON e.id = u.employeeId
      LEFT JOIN (
        SELECT activity.serviceBookingId, activity.status
        FROM servicebookingactivities activity
        INNER JOIN (
          SELECT serviceBookingId, MAX(id) AS latestId
          FROM servicebookingactivities
          GROUP BY serviceBookingId
        ) latest ON latest.latestId = activity.id
      ) latestActivity ON latestActivity.serviceBookingId = sb.id
      WHERE sb.outletId = :outletId
        AND DATE(sb.appointmentDate) BETWEEN :fromDate AND :toDate${filterSql}
      ORDER BY sb.appointmentDate, sb.scheduledStartDate, sb.id`,
      { replacements: { ...replacements, encryptKey: encryptConfig.code } }
    );

    return rows;
  } catch (err) {
    logger.error('ServiceBooking dao listAppointments', err);
    throw err;
  }
};

const getServiceBookingActivityHistoryByIds = async (bookingIds) => {
  if (!bookingIds.length) return [];
  return ServiceBookingActivity.findAll({
    where: { serviceBookingId: { [Op.in]: bookingIds } },
    attributes: [
      'id', 'serviceBookingId', 'status', 'reason', 'remarks', 'followupDate',
      'serviceProvider', 'saleDetails', 'correctContactNumber', 'createEstimate',
      'estimateId', 'jobCardId', 'createdBy', 'createdAt',
    ],
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
    raw: true,
  });
};

const findByServiceBookingId = async (id, desc = false) => {

  try {
    const options = {
      where: { id: id },
      attributes: {
        include: [
          [
            db.sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
            ),
            "descryptCustomerName"
          ],
          [
            db.sequelize.literal(
              `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
            ),
            "decryptedMobile"
          ]
        ],
  
      },
            include: [
  {
    model: Pincode,
    as: "pincodeDetails",
    where: {
      cv_cityId: { [db.Sequelize.Op.ne]: 0 },
      cv_stateId: { [db.Sequelize.Op.ne]: 0 }
    },
    required: false, // if no match, still return serviceBooking

    attributes: [
      "id",
      "Pincode",
      "District",
      "OfficeName",
      "StateName",
      "CircleName",
   
      "Longitude",
      "status",
      "cv_cityId",
      "cv_stateId"
    ]
  }
]
    } 
      ;

    if (desc) {
      options.order = [["id", "DESC"]];
    }

    return await ServiceBooking.findOne(options);

  } catch (err) {
    logger.error('ServiceBooking dao findByServiceBookingId', err);
    throw err;
  }
};

const updateServiceBooking = async (id, serviceBooking, userId, activityData = null) => {
  let data = {};
  const transaction = await sequelize.transaction();
  try {
    if (isEnabled(serviceBooking.pickupStatus)) {
      await validateActiveDriver(serviceBooking.pickupDriverId, transaction);
    }
    if (isEnabled(serviceBooking.dropoffStatus)) {
      await validateActiveDriver(serviceBooking.dropoffDriverId, transaction);
    }
    const customerName = db.sequelize.fn(
      'HEX',
      db.sequelize.fn('AES_ENCRYPT', serviceBooking.customerName, encryptConfig.code)
    );
    const customerMobileNumber = db.sequelize.fn(
      'HEX',
      db.sequelize.fn('AES_ENCRYPT', serviceBooking.customerMobileNumber, encryptConfig.code)
    );

    data = await ServiceBooking.update(
      {
        serviceBookingNumber: serviceBooking.bookingNumber,
        status: serviceBooking.status,
        statusFlag: serviceBooking.statusFlag,
        registrationNumber: serviceBooking.registrationNumber,
        vehicleId: serviceBooking.vehicleId,
        vehicleMakeId: serviceBooking.makeId,
        vehicleModelId: serviceBooking.modelId,
        odometer: serviceBooking.odometer,
        customeId: serviceBooking.customeId,
        customerName: customerName,
        customerMobileNumber: customerMobileNumber,
        customerAddress: serviceBooking.customerAddress,
        customerState: serviceBooking.customerState,
        customerCity: serviceBooking.customerCity,
        pincode: serviceBooking.pincode,
        customerStatus: serviceBooking.customerStatus,
        source: serviceBooking.source,
        dmsSourceId: serviceBooking.dmsSourceId,
        dmsSourceTypeId: serviceBooking.dmsSourceTypeId,
        dispositionId: serviceBooking.dispositionId,
        serviceType: serviceBooking.serviceType,
        phoneCallNotes: serviceBooking.phoneCallNotes,
        appointmentDate: serviceBooking.appointmentDate,
        nextFollowupDate: serviceBooking.nextFollowupDate,
        scheduledStartDate: serviceBooking.scheduledStartDate,
        scheduledEndDate: serviceBooking.scheduledEndDate,
        updatedBy: userId,
        bookingId: serviceBooking.bookingId ?? null,
        b2bBookingId: serviceBooking.b2bBookingId ? serviceBooking.b2bBookingId : null,
        pickup_status: serviceBooking.pickupStatus == null ? null : (isEnabled(serviceBooking.pickupStatus) ? 1 : 0),
        dropoff_status: serviceBooking.dropoffStatus == null ? null : (isEnabled(serviceBooking.dropoffStatus) ? 1 : 0),
        pickup_date: isEnabled(serviceBooking.pickupStatus) ? (serviceBooking.pickupDateTime ?? serviceBooking.pickup_date) : null,
        pickup_time: isEnabled(serviceBooking.pickupStatus) ? (serviceBooking.pickupDateTime ?? serviceBooking.pickup_time) : null,
        pick_up_date: isEnabled(serviceBooking.pickupStatus) ? (serviceBooking.pickupDateTime ?? serviceBooking.pick_up_date) : null,
        pick_up_address: isEnabled(serviceBooking.pickupStatus) ? (serviceBooking.pickupAddress ?? serviceBooking.pick_up_address) : null,
        pickup_driver_id: isEnabled(serviceBooking.pickupStatus) ? serviceBooking.pickupDriverId : null,
        dropoff_driver_id: isEnabled(serviceBooking.dropoffStatus) ? serviceBooking.dropoffDriverId : null,
        drop_off_date: isEnabled(serviceBooking.dropoffStatus) ? (serviceBooking.dropOffDateTime ?? serviceBooking.drop_off_date) : null,
        drop_off_address: isEnabled(serviceBooking.dropoffStatus) ? (serviceBooking.dropOffAddress ?? serviceBooking.drop_off_address) : null,
        service_description: serviceBooking.service_description ? serviceBooking.service_description : null,
      },
      { where: { id: id }, transaction }
    );
    if (activityData) {
      await ServiceBookingActivity.create(
        { ...activityData, serviceBookingId: id, createdBy: userId },
        { transaction }
      );
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error('ServiceBooking dao updateServiceBooking', err);
    throw err;
  }
  return data;
};
const findInProgressServiceBooking = async (registrationNumber) => {
  try {
    const rows = await ServiceBooking.findOne({
      where: { registrationNumber: registrationNumber, status: 'Inprogress' },
    });
    return rows;
  } catch (err) {
    logger.error('ServiceBooking dao findInProgressServiceBooking', err);
  }
};

const exportServiceBookings1 = async (reqData, user) => {
  try {
    const startDate = reqData.startDate + ' 00:00:00';
    const endDate = reqData.endDate + ' 23:59:59';

    const data = await ServiceBooking.findAll({
      where: {
        createdby: user.id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['id', 'DESC']],
      include: [
        { model: DisPosition, as: 'disposition' },
        { model: Make, as: 'make' },
        { model: Model, as: 'model' },
      ],
      attributes: [
        'serviceBookingNumber',
        'status',
        'registrationNumber',
        'customerMobileNumber',
        'customerName',
        'phoneCallNotes',
        'createdAt',
        'scheduledStartDate',
        'scheduledEndDate',
      ],
    });

    return data;
  } catch (err) {
    logger.error('ServiceBooking dao getOpenEstimates Error:', err);
    next(err);
  }
};

const exportServiceBookings = async (reqData, user) => {
  try {
    const startDate = reqData.startDate + ' 00:00:00';
    const endDate = reqData.endDate + ' 23:59:59';

    const queryOptions = {
      where: {
        createdby: user.id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['id', 'DESC']],
      include: [
        { model: DisPosition, as: 'disposition' },
        { model: Make, as: 'make' },
        { model: Model, as: 'model' },
      ],
      attributes: [
        'serviceBookingNumber',
        'status',
        'registrationNumber',
        'customerMobileNumber',
        'customerName',
        'phoneCallNotes',
        'createdAt',
        'scheduledStartDate',
        'scheduledEndDate',
      ],
    };

    if (reqData.limit && reqData.offset !== undefined) {
      queryOptions.limit = reqData.limit;
      queryOptions.offset = reqData.offset;

      if (reqData.searchKey) {
        const searchKey = reqData.searchKey.trim();
        queryOptions.where[Op.or] = [
          { serviceBookingNumber: { [Op.like]: `%${searchKey}%` } },
          { registrationNumber: { [Op.like]: `%${searchKey}%` } },
          { customerMobileNumber: { [Op.like]: `%${searchKey}%` } },
          { customerName: { [Op.like]: `%${searchKey}%` } },
        ];
      }
    };

    const totalItems = await ServiceBooking.count(queryOptions);
    const data = await ServiceBooking.findAll(queryOptions);

    return {
      totalItems: totalItems,
      rows: data
    };

  } catch (err) {
    logger.error('ServiceBooking dao exportServiceBookings Error:', err);
    next(err);
  }
};

const getOutletDetails = async (id) => {
  try {
    return await Outlet.findOne({
      where: { id: id }
    })

  } catch (err) {
    logger.error('service booking dao.js file error', err);
  }
}

const getOutletDetailsbyName = async (code) => {
  try {
    return await Outlet.findOne({
      where: { outletCode: code }
    })

  } catch (err) {
    logger.error('service booking dao.js file error', err);
  }
}

const getOpenBookings = async (user) => {
  try {
    const userCondition = {
      createdby: user.id,
      outletId: user.outlet.id,
      statusFlag: {
        [Op.in]: [1, 2],
      },
    };
    const data = await ServiceBooking.findAll({
      where: userCondition,
      order: [['id', 'DESC']],
      attributes: ['id', 'serviceBookingNumber', 'registrationNumber', 'status', 'statusFlag'],
    });
    return data;
  } catch (err) {
    logger.error('ServiceBooking dao getOpenBookings Error:', err);
    next(err);
  }
};

const getOpenBookingbyMobileNumber = async (number) => {
  try {
    return await ServiceBooking.findOne({
      where: db.sequelize.literal(
        `customerMobileNumber = HEX(AES_ENCRYPT('${number}', '${encryptConfig.code}'))
         AND statusFlag IN (1, 2)`
      ),
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'serviceBookingNumber',
        'registrationNumber',
        [
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
          ),
          'decryptedMobile'
        ]
      ]
    });

  } catch (err) {
    logger.error('ServiceBooking dao getOpenBookings Error:', err);
    throw err;
  }
};


const getCustomerByMobileNumber = async (number) => {
  try {
    const data = await Customer.findOne({
      where: db.sequelize.literal(
        `mobileNumber = HEX(AES_ENCRYPT('${number}', '${encryptConfig.code}'))`
      ),
      attributes: [
        'id',
        'firstName',
        [
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
          ),
          'decryptedMobile'
        ],
        'firstName',
        'address1',
        'city',
        'state',
        'pinCode'
      ]
    });

    return data;

  } catch (err) {
    logger.error('Error getting customer details in service Booking dao.js:', err);
    throw err;
  }
};





const getServiceBookingData = async (id) => {
  try {
    const data = await ServiceBooking.findOne({
      where: { id: id },
      include: [
        { model: DisPosition, as: 'disposition' },
        { model: Make, as: 'make' },
        { model: Model, as: 'model' },
        { model: SourceType, as: 'sourcetype' },
        { model: Source, as: 'dmsSource' },
      ],
    });
    return data;
  } catch (err) {
    logger.error('ServiceBooking dao getOpenBookings Error:', err);
    console.log(err);
  }
};

const findMakeName = async (makeName, companyId) => {
  try {
    return await Make.findOne({
      where: { makeName },
      include: [
        {
          model: MakeCompanyMap,
          as: 'makecompanymaps',
          where: { companyId },
          required: true
        }
      ]
    });

  } catch (err) {
    logger.error('Make dao findByName Error:', err);
    throw err;
  }
};


const findModelName = async (modelName, companyId) => {
  try {
    return await Model.findOne({
      where: { modelName },
      include: [
        {
          model: ModelCompanyMap,
          as: 'modelcompanymaps',
          where: { companyId },
          required: true
        }
      ]


    });

  } catch (err) {
    logger.error('Make dao findByName Error:', err);
    throw err;
  }
};


const dao = {
  getVehicleDetails,
  addServiceBooking,
  getOutletDetails,
  getDispositionDetails,
  findByemployeeById,
  generateBookingNumber,
  listServiceBookings,
  listAppointments,
  getServiceBookingActivityHistoryByIds,
  findByServiceBookingId,
  updateServiceBooking,
  findInProgressServiceBooking,
  exportServiceBookings,
  getOpenBookings,
  getOutletDetailsbyName,
  getServiceBookingData,
  addServiceBookingMobile,
  getOpenBookingbyMobileNumber,
  getCustomerByMobileNumber,
  findMakeName,
  getDispositionByCode,
  findModelName
};

export default dao;
