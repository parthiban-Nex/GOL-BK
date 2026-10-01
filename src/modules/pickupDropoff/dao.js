import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';

const ServiceBooking = db.servicebookings;
const Transaction = db.jobCard;
const ServiceEstimate = db.servicEstimates;
const Vehicle = db.vehicles;
const Customer = db.customers;
const DriverMaster = db.driverMaster;
const PickupDropoffLog = db.pickupDropoffLogs;
const Outlet = db.outlets;
const DisPosition = db.dispositions;
const Make = db.makes;
const Model = db.models;
const sequelize = db.sequelize;

const decryptedBookingAttrs = {
  include: [
    [
      sequelize.literal(
        `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
      ),
      'decryptedCustomerName',
    ],
    [
      sequelize.literal(
        `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
      ),
      'decryptedCustomerMobileNumber',
    ],
  ],
};

const applyBookingDecryption = (row) => {
  row.dataValues.customerName = row.dataValues.decryptedCustomerName;
  row.dataValues.customerMobileNumber = row.dataValues.decryptedCustomerMobileNumber;
  delete row.dataValues.decryptedCustomerName;
  delete row.dataValues.decryptedCustomerMobileNumber;
  return row;
};

const toTime = (value) => (value ? new Date(value).getTime() : null);

// ---------------------------------------------------------------- PICKUP LIST
const listPickup = async (reqData, user) => {
  try {
    console.log("user:", user);
    const { searchKey, offset, limit } = reqData;
    const like = `%${searchKey}%`;
    // Pickup Status is the driver_status label shown in the grid; match the search
    // text against the labels and search the matching driver_status codes (mirrors legacy).
    const driverStatusLabels = {
      'pickup scheduled': 1,
      'pickup rescheduled': 2,
      'dropoff scheduled': 3,
      'dropoff rescheduled': 4,
    };
    const matchedDriverStatuses = searchKey
      ? Object.entries(driverStatusLabels)
          .filter(([label]) => label.includes(String(searchKey).toLowerCase()))
          .map(([, code]) => code)
      : [];
    // customerName / customerMobileNumber are AES-encrypted, so search the DECRYPTED value;
    // serviceBookingNumber / registrationNumber / pick_up_address are plaintext;
    // Branch Name/Code come from the joined outlet; Pickup Status maps to driver_status.
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { serviceBookingNumber: { [Op.like]: like } },
            { registrationNumber: { [Op.like]: like } },
            { pick_up_address: { [Op.like]: like } },
            { '$outlet.outletName$': { [Op.like]: like } },
            { '$outlet.outletCode$': { [Op.like]: like } },
            ...(matchedDriverStatuses.length
              ? [{ driver_status: { [Op.in]: matchedDriverStatuses } }]
              : []),
            sequelize.where(
              sequelize.literal(
                `CAST(AES_DECRYPT(UNHEX(customerName), '${encryptConfig.code}') AS CHAR)`
              ),
              { [Op.like]: like }
            ),
            sequelize.where(
              sequelize.literal(
                `CAST(AES_DECRYPT(UNHEX(customerMobileNumber), '${encryptConfig.code}') AS CHAR)`
              ),
              { [Op.like]: like }
            ),
          ],
        }
      : {};
    // Match legacy finance_pickup_index_pg: pickup_status=1 AND appointment status (statusFlag) NOT IN Completed(3)/Cancelled(4)
    // No outlet / createdBy scoping (legacy was a global finance queue).
    const baseCondition = {
      pickup_status: 1,
      statusFlag: { [Op.notIn]: [3, 4] },
    };

    const where = { ...baseCondition, ...searchCondition };

    // count must include the outlet join because the search can filter on $outlet.*$.
    const count = await ServiceBooking.count({
      where,
      include: [{ model: Outlet, as: 'outlet', attributes: [], required: false }],
      distinct: true,
      col: 'id',
    });
    let rows = await ServiceBooking.findAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      subQuery: false,
      attributes: { ...decryptedBookingAttrs },
      // Joins for the extra columns ported from legacy finance_pickup_index_pg:
      // Branch Name/Code (outlet), Disposition, Make, Model.
      include: [
        { model: Outlet, as: 'outlet', attributes: ['id', 'outletName', 'outletCode'], required: false },
        { model: DisPosition, as: 'disposition', attributes: ['id', 'title'], required: false },
        { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
        { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
      ],
    });

    rows = rows.map(applyBookingDecryption);

    // Flatten to the exact fields the grid renders (legacy column order).
    const data = rows.map((row) => {
      const b = row.dataValues;
      return {
        id: b.id,
        branchName: b.outlet ? b.outlet.outletName : null,
        branchCode: b.outlet ? b.outlet.outletCode : null,
        sourceOfLeads: b.source,
        serviceBookingNumber: b.serviceBookingNumber,
        createdAt: b.createdAt,
        customerName: b.customerName,
        customerMobileNumber: b.customerMobileNumber,
        registrationNumber: b.registrationNumber,
        make: b.make ? b.make.makeName : null,
        model: b.model ? b.model.modelName : null,
        customerCity: b.customerCity,
        product: b.product,
        nextFollowupDate: b.nextFollowupDate,
        disposition: b.disposition ? b.disposition.title : null,
        appointmentStatus: b.statusFlag,
        pick_up_address: b.pick_up_address,
        pickup_date: b.pickup_date,
        driver_status: b.driver_status,
        serviceDesc: b.service_description,
        goBumprBookingId: b.goBumpr_id,
        serviceType: b.serviceType,
      };
    });

    return { totalItems: count, data };
  } catch (err) {
    logger.error('pickupDropoff dao listPickup', err);
    throw err;
  }
};

// ------------------------------------------------------------------ GET PICKUP
const getPickup = async (id) => {
  try {
    let booking = await ServiceBooking.findOne({
      where: { id },
      attributes: { ...decryptedBookingAttrs },
      // Joins to resolve the read-only context labels shown on the legacy pickup page.
      include: [
        { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
        { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
        { model: DisPosition, as: 'disposition', attributes: ['id', 'title'], required: false },
        { model: db.sources, as: 'dmsSource', attributes: ['id', 'sourceName'], required: false },
        { model: db.sourcetypes, as: 'sourcetype', attributes: ['id', 'sourceTypeName'], required: false },
      ],
    });
    if (!booking) return null;
    booking = applyBookingDecryption(booking);

    // Resolve Created By (servicebookings.createdBy -> users.employeeId -> employees.employeeName)
    let createdByName = null;
    if (booking.createdBy) {
      const u = await db.users.findByPk(booking.createdBy, { attributes: ['id', 'employeeId'] });
      if (u && u.employeeId) {
        const emp = await db.employees.findByPk(u.employeeId, {
          attributes: ['id', 'employeeName'],
        });
        createdByName = emp ? emp.employeeName : null;
      }
    }

    // Flatten resolved labels onto the booking so the form can read them directly.
    const customerStatusLabels = { 1: 'New Customer', 2: 'Existing Customer' };
    const appointmentStatusLabels = { 1: 'Open', 2: 'In Progress', 3: 'Completed', 4: 'Cancelled' };
    booking.dataValues.makeName = booking.make ? booking.make.makeName : null;
    booking.dataValues.modelName = booking.model ? booking.model.modelName : null;
    booking.dataValues.dispositionTitle = booking.disposition ? booking.disposition.title : null;
    booking.dataValues.sourceName = booking.dmsSource ? booking.dmsSource.sourceName : null;
    booking.dataValues.sourceTypeName = booking.sourcetype ? booking.sourcetype.sourceTypeName : null;
    booking.dataValues.createdByName = createdByName;
    booking.dataValues.customerStatusLabel = customerStatusLabels[booking.customerStatus] || null;
    booking.dataValues.appointmentStatusLabel = appointmentStatusLabels[booking.statusFlag] || null;

    // resolve isdrop via serviceEstimate -> transaction.dropoff_status
    let isdrop = null;
    const estimate = await ServiceEstimate.findOne({
      where: { serviceBookingId: id },
      attributes: ['id'],
    });
    if (estimate) {
      const transaction = await Transaction.findOne({
        where: { service_estimate_id: estimate.id },
        attributes: ['id', 'dropoff_status'],
      });
      isdrop = transaction ? transaction.dropoff_status : null;
    }

    const lastLog = await PickupDropoffLog.findOne({
      where: { service_booking_id: id },
      order: [['id', 'DESC']],
    });

    return {
      booking,
      isdrop,
      remark: lastLog ? lastLog.remark : null,
    };
  } catch (err) {
    logger.error('pickupDropoff dao getPickup', err);
    throw err;
  }
};

// ----------------------------------------------------------------- SAVE PICKUP
const savePickup = async (reqData) => {
  try {
    const { bookingId, pickup_driver_id, pick_up_address, pick_up_date, remark } =
      reqData;

    const current = await ServiceBooking.findByPk(bookingId);
    if (!current) return { success: false, message: 'Service booking not found' };

    const existing = await PickupDropoffLog.findOne({
      where: { service_booking_id: bookingId },
      order: [['id', 'DESC']],
    });

    let isEdited = false;
    if (existing) {
      if (
        String(pickup_driver_id) !== String(existing.pickup_driver_id) ||
        (pick_up_address || '') !== (existing.pick_up_address || '') ||
        toTime(pick_up_date) !== toTime(existing.pick_up_date)
      ) {
        isEdited = true;
      }
    }

    const driver_status = !isEdited && current.driver_status != 2 ? 1 : 2;

    await ServiceBooking.update(
      {
        pickup_driver_id,
        pick_up_address,
        pickup_date: pick_up_date || null,
        pickup_time: pick_up_date || null,
        driver_status,
      },
      { where: { id: bookingId } }
    );

    await PickupDropoffLog.create({
      service_booking_id: bookingId,
      pickup_driver_id,
      pick_up_address,
      pick_up_date: pick_up_date || null,
      remark,
    });

    return { success: true, driver_status };
  } catch (err) {
    logger.error('pickupDropoff dao savePickup', err);
    throw err;
  }
};

// --------------------------------------------------------------- DROPOFF LIST
const listDropoff = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;
    const like = `%${searchKey}%`;

    // Joins shared by count + findAll so the search can reference them.
    // serviceBooking carries the extra columns (outlet/make/model/disposition);
    // the transaction's vehicle resolves make/model for jc-only rows.
    const searchIncludes = [
      {
        model: ServiceEstimate,
        as: 'serviceEstimate',
        attributes: ['id', 'serviceBookingId'],
        required: false,
        include: [
          {
            model: ServiceBooking,
            as: 'serviceBooking',
            required: false,
            include: [
              { model: Outlet, as: 'outlet', attributes: ['id', 'outletCode'], required: false },
              { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
              { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
              { model: DisPosition, as: 'disposition', attributes: ['id', 'title'], required: false },
            ],
          },
        ],
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['id', 'registrationNumber', 'makeId', 'modelId'],
        required: false,
        include: [
          { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
          { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
        ],
      },
      { model: Customer, as: 'jcCustomerMapping', attributes: ['id'], required: false },
    ];

    // Drop Off Status search → driver_status codes (mirror legacy text search).
    const driverStatusLabels = {
      'pickup scheduled': 1,
      'pickup rescheduled': 2,
      'dropoff scheduled': 3,
      'dropoff rescheduled': 4,
    };
    const matchedDriverStatuses = searchKey
      ? Object.entries(driverStatusLabels)
          .filter(([label]) => label.includes(String(searchKey).toLowerCase()))
          .map(([, code]) => code)
      : [];

    // Appointment Status search → serviceBooking.statusFlag codes.
    const appointmentStatusLabels = {
      open: 1,
      'in progress': 2,
      completed: 3,
      cancelled: 4,
    };
    const matchedAppointmentStatuses = searchKey
      ? Object.entries(appointmentStatusLabels)
          .filter(([label]) => label.includes(String(searchKey).toLowerCase()))
          .map(([, code]) => code)
      : [];

    // transactions.customer_* are commonLogic-encrypted (not SQL-searchable);
    // search the AES-encrypted customers table (via customer_id) for name/mobile instead.
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { job_card_no: { [Op.like]: like } },
            { reg_no: { [Op.like]: like } },
            { outlet_code: { [Op.like]: like } },
            { '$serviceEstimate.serviceBooking.serviceBookingNumber$': { [Op.like]: like } },
            { '$serviceEstimate.serviceBooking.drop_off_address$': { [Op.like]: like } },
            { '$serviceEstimate.serviceBooking.outlet.outletCode$': { [Op.like]: like } },
            { '$serviceEstimate.serviceBooking.disposition.title$': { [Op.like]: like } },
            ...(matchedDriverStatuses.length
              ? [
                  // Drop Off Status shown = booking.driver_status for booking rows, else transaction's.
                  { driver_status: { [Op.in]: matchedDriverStatuses } },
                  { '$serviceEstimate.serviceBooking.driver_status$': { [Op.in]: matchedDriverStatuses } },
                ]
              : []),
            ...(matchedAppointmentStatuses.length
              ? [{ '$serviceEstimate.serviceBooking.statusFlag$': { [Op.in]: matchedAppointmentStatuses } }]
              : []),
            sequelize.where(
              sequelize.literal(
                `CAST(AES_DECRYPT(UNHEX(\`jcCustomerMapping\`.\`mobileNumber\`), '${encryptConfig.code}') AS CHAR)`
              ),
              { [Op.like]: like }
            ),
            sequelize.where(
              sequelize.literal(
                `CONCAT_WS(' ', CAST(AES_DECRYPT(UNHEX(\`jcCustomerMapping\`.\`firstName\`), '${encryptConfig.code}') AS CHAR), CAST(AES_DECRYPT(UNHEX(\`jcCustomerMapping\`.\`lastName\`), '${encryptConfig.code}') AS CHAR))`
              ),
              { [Op.like]: like }
            ),
          ],
        }
      : {};

    // Match legacy finance_dropoff_index_pg: only dropoff_status=1 (no status / outlet / createdBy scoping).
    const where = {
      dropoff_status: 1,
      ...searchCondition,
    };

    const count = await Transaction.count({
      where,
      include: searchIncludes,
      distinct: true,
      col: 'id',
    });
    const rows = await Transaction.findAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      subQuery: false,
      include: searchIncludes,
    });

    const data = [];
    for (const row of rows) {
      const booking = row.serviceEstimate && row.serviceEstimate.serviceBooking;
      const hasServiceBooking = !!booking;

      let driver_status;
      let drop_off_address;
      let drop_off_date;

      if (hasServiceBooking) {
        driver_status = booking.driver_status;
        drop_off_address = booking.drop_off_address;
        drop_off_date = booking.drop_off_date;
      } else {
        driver_status = row.driver_status;
        const lastLog = await PickupDropoffLog.findOne({
          where: { transaction_id: row.id },
          order: [['id', 'DESC']],
        });
        drop_off_address = lastLog ? lastLog.drop_off_address : null;
        drop_off_date = lastLog ? lastLog.drop_off_date : null;
      }

      const vehicle = row.vehicle;
      data.push({
        transId: row.id,
        serviceBookingId: hasServiceBooking ? booking.id : null,
        hasServiceBooking,
        jobCardNo: row.job_card_no,
        // Branch Code: transaction's own outlet_code, else the booking's outlet.
        branchCode: row.outlet_code || (hasServiceBooking && booking.outlet ? booking.outlet.outletCode : null),
        sourceOfLeads: hasServiceBooking ? booking.source : null,
        serviceBookingNumber: hasServiceBooking ? booking.serviceBookingNumber : null,
        bookingDate: hasServiceBooking ? booking.createdAt : row.createdAt,
        customerName: row.customer_name, // auto-decrypted via model getter
        customerMobileNumber: row.customer_mobileNumber,
        registrationNumber: row.reg_no || (vehicle && vehicle.registrationNumber),
        make: hasServiceBooking
          ? (booking.make ? booking.make.makeName : null)
          : (vehicle && vehicle.make ? vehicle.make.makeName : null),
        model: hasServiceBooking
          ? (booking.model ? booking.model.modelName : null)
          : (vehicle && vehicle.model ? vehicle.model.modelName : null),
        customerCity: hasServiceBooking ? booking.customerCity : row.customer_city,
        product: hasServiceBooking ? booking.product : null,
        nextFollowupDate: hasServiceBooking ? booking.nextFollowupDate : null,
        disposition: hasServiceBooking && booking.disposition ? booking.disposition.title : null,
        appointmentStatus: hasServiceBooking ? booking.statusFlag : null,
        drop_off_address,
        drop_off_date,
        driver_status,
        serviceDesc: hasServiceBooking ? booking.service_description : null,
        goBumprBookingId: hasServiceBooking ? booking.goBumpr_id : null,
        serviceType: hasServiceBooking ? booking.serviceType : null,
      });
    }

    return { totalItems: count, data };
  } catch (err) {
    logger.error('pickupDropoff dao listDropoff', err);
    throw err;
  }
};

// --------------------------------------------------- GET DROPOFF (booking based)
const getDropoff = async (id) => {
  try {
    let booking = await ServiceBooking.findOne({
      where: { id },
      attributes: { ...decryptedBookingAttrs },
      // Same joins as getPickup so the read-only context labels resolve.
      include: [
        { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
        { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
        { model: DisPosition, as: 'disposition', attributes: ['id', 'title'], required: false },
        { model: db.sources, as: 'dmsSource', attributes: ['id', 'sourceName'], required: false },
        { model: db.sourcetypes, as: 'sourcetype', attributes: ['id', 'sourceTypeName'], required: false },
      ],
    });
    if (!booking) return null;
    booking = applyBookingDecryption(booking);

    // Resolve Created By (createdBy -> users.employeeId -> employees.employeeName)
    let createdByName = null;
    if (booking.createdBy) {
      const u = await db.users.findByPk(booking.createdBy, { attributes: ['id', 'employeeId'] });
      if (u && u.employeeId) {
        const emp = await db.employees.findByPk(u.employeeId, { attributes: ['id', 'employeeName'] });
        createdByName = emp ? emp.employeeName : null;
      }
    }

    // Resolve the read-only Pick Up driver name shown on the legacy dropoff form.
    // Append "/ OutletCode" to match the driver dropdown label format (listDrivers).
    let pickupDriverName = null;
    if (booking.pickup_driver_id) {
      const drv = await DriverMaster.findByPk(booking.pickup_driver_id, {
        attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'outlet_id'],
      });
      if (drv) {
        const base = `${drv.first_name || ''} ${drv.last_name || ''} - ${drv.mobile_number || ''}`.trim();
        let code = null;
        if (drv.outlet_id) {
          const o = await Outlet.findByPk(drv.outlet_id, { attributes: ['id', 'outletCode'] });
          code = o ? o.outletCode : null;
        }
        pickupDriverName = code ? `${base} / ${code}` : base;
      }
    }

    const customerStatusLabels = { 1: 'New Customer', 2: 'Existing Customer' };
    const appointmentStatusLabels = { 1: 'Open', 2: 'In Progress', 3: 'Completed', 4: 'Cancelled' };
    booking.dataValues.makeName = booking.make ? booking.make.makeName : null;
    booking.dataValues.modelName = booking.model ? booking.model.modelName : null;
    booking.dataValues.dispositionTitle = booking.disposition ? booking.disposition.title : null;
    booking.dataValues.sourceName = booking.dmsSource ? booking.dmsSource.sourceName : null;
    booking.dataValues.sourceTypeName = booking.sourcetype ? booking.sourcetype.sourceTypeName : null;
    booking.dataValues.createdByName = createdByName;
    booking.dataValues.pickupDriverName = pickupDriverName;
    booking.dataValues.customerStatusLabel = customerStatusLabels[booking.customerStatus] || null;
    booking.dataValues.appointmentStatusLabel = appointmentStatusLabels[booking.statusFlag] || null;

    const lastLog = await PickupDropoffLog.findOne({
      where: { service_booking_id: id },
      order: [['id', 'DESC']],
    });

    return { booking, remark: lastLog ? lastLog.remark : null };
  } catch (err) {
    logger.error('pickupDropoff dao getDropoff', err);
    throw err;
  }
};

// -------------------------------------------------- SAVE DROPOFF (booking based)
const saveDropoff = async (reqData) => {
  try {
    const { bookingId, dropoff_driver_id, drop_off_address, drop_off_date, remark } =
      reqData;

    const current = await ServiceBooking.findByPk(bookingId);
    if (!current) return { success: false, message: 'Service booking not found' };

    const existing = await PickupDropoffLog.findOne({
      where: { service_booking_id: bookingId },
      order: [['id', 'DESC']],
    });

    let isEdited = false;
    if (existing) {
      if (
        (String(dropoff_driver_id) !== String(existing.dropoff_driver_id) &&
          existing.dropoff_driver_id !== null) ||
        ((drop_off_address || '') !== (existing.drop_off_address || '') &&
          existing.drop_off_address !== null) ||
        (toTime(drop_off_date) !== toTime(existing.drop_off_date) &&
          existing.drop_off_date !== null)
      ) {
        isEdited = true;
      }
    }

    const driver_status = !isEdited && current.driver_status != 4 ? 3 : 4;

    await ServiceBooking.update(
      {
        dropoff_driver_id,
        drop_off_address,
        drop_off_date: drop_off_date || null,
        driver_status,
      },
      { where: { id: bookingId } }
    );

    await PickupDropoffLog.create({
      service_booking_id: bookingId,
      pickup_driver_id: current.pickup_driver_id,
      pick_up_address: current.pick_up_address,
      pick_up_date: current.pickup_date,
      dropoff_driver_id,
      drop_off_address,
      drop_off_date: drop_off_date || null,
      remark,
    });

    return { success: true, driver_status };
  } catch (err) {
    logger.error('pickupDropoff dao saveDropoff', err);
    throw err;
  }
};

// --------------------------------------------- GET JC DROPOFF (transaction based)
const getJcDropoff = async (transId) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: transId },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'registrationNumber', 'makeId', 'modelId'],
          include: [
            { model: Make, as: 'make', attributes: ['id', 'makeName'], required: false },
            { model: Model, as: 'model', attributes: ['id', 'modelName'], required: false },
          ],
        },
      ],
    });
    if (!transaction) return null;

    const lastLog = await PickupDropoffLog.findOne({
      where: { transaction_id: transId },
      order: [['id', 'DESC']],
    });

    const vehicle = transaction.vehicle;
    return {
      transId: transaction.id,
      vehicle_id: transaction.vehicle_id,
      registrationNumber: transaction.reg_no || (vehicle && vehicle.registrationNumber),
      make: vehicle && vehicle.make ? vehicle.make.makeName : null,
      model: vehicle && vehicle.model ? vehicle.model.modelName : null,
      customerName: transaction.customer_name, // auto-decrypted getter
      customerMobileNumber: transaction.customer_mobileNumber,
      customerAddress: transaction.customer_address,
      customerCity: transaction.customer_city,
      customerState: transaction.customer_state,
      pincode: transaction.customer_pincode,
      dropoff_driver_id: lastLog ? lastLog.dropoff_driver_id : null,
      drop_off_address: lastLog ? lastLog.drop_off_address : null,
      drop_off_date: lastLog ? lastLog.drop_off_date : null,
      remark: lastLog ? lastLog.remark : null,
    };
  } catch (err) {
    logger.error('pickupDropoff dao getJcDropoff', err);
    throw err;
  }
};

// -------------------------------------------- SAVE JC DROPOFF (transaction based)
const saveJcDropoff = async (reqData) => {
  try {
    const { transId, dropoff_driver_id, drop_off_address, drop_off_date, remark } =
      reqData;

    const current = await Transaction.findByPk(transId);
    if (!current) return { success: false, message: 'Job card not found' };

    const existing = await PickupDropoffLog.findOne({
      where: { transaction_id: transId },
      order: [['id', 'DESC']],
    });

    let isEdited = false;
    if (existing) {
      if (
        (String(dropoff_driver_id) !== String(existing.dropoff_driver_id) &&
          existing.dropoff_driver_id !== null) ||
        ((drop_off_address || '') !== (existing.drop_off_address || '') &&
          existing.drop_off_address !== null) ||
        (toTime(drop_off_date) !== toTime(existing.drop_off_date) &&
          existing.drop_off_date !== null)
      ) {
        isEdited = true;
      }
    }

    const driver_status = !isEdited && current.driver_status != 4 ? 3 : 4;

    await Transaction.update(
      { driver_status },
      { where: { id: transId } }
    );

    await PickupDropoffLog.create({
      transaction_id: transId,
      dropoff_driver_id,
      drop_off_address,
      drop_off_date: drop_off_date || null,
      remark,
    });

    return { success: true, driver_status };
  } catch (err) {
    logger.error('pickupDropoff dao saveJcDropoff', err);
    throw err;
  }
};

// --------------------------------------------------------------------- DRIVERS
const listDrivers = async () => {
  try {
    const drivers = await DriverMaster.findAll({
      where: { status: 1 },
      order: [['id', 'ASC']],
    });
    // Resolve outlet codes for the drivers' outlet_id to append "/ OutletCode" to each label.
    const outletIds = [...new Set(drivers.map((d) => d.outlet_id).filter(Boolean))];
    const outlets = outletIds.length
      ? await Outlet.findAll({
          where: { id: { [Op.in]: outletIds } },
          attributes: ['id', 'outletCode'],
        })
      : [];
    const outletCodeById = {};
    outlets.forEach((o) => {
      outletCodeById[o.id] = o.outletCode;
    });
    return drivers.map((d) => {
      const base = `${d.first_name || ''} ${d.last_name || ''} - ${d.mobile_number || ''}`.trim();
      const code = outletCodeById[d.outlet_id];
      return {
        id: d.id,
        label: code ? `${base} / ${code}` : base,
      };
    });
  } catch (err) {
    logger.error('pickupDropoff dao listDrivers', err);
    throw err;
  }
};

// ------------------------------------------------------------- SET DROP STATUS
const setDropStatus = async (transactionId, isDrop) => {
  try {
    await Transaction.update(
      { dropoff_status: isDrop ? 1 : null },
      { where: { id: transactionId } }
    );
    return { success: true };
  } catch (err) {
    logger.error('pickupDropoff dao setDropStatus', err);
    throw err;
  }
};

export default {
  listPickup,
  getPickup,
  savePickup,
  listDropoff,
  getDropoff,
  saveDropoff,
  getJcDropoff,
  saveJcDropoff,
  listDrivers,
  setDropStatus,
};
