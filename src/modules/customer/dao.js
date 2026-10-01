import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, literal } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import utils from '../Utils/Utils.js';

const Customer = db.customers;
const Source = db.sources;
const SourceType = db.sourcetypes;
const Outlet = db.outlets;
const Vehicles = db.vehicles;

const Customertypes = db.customertypes;
const Customercategory = db.customercategory;
const Billtypes = db.billtypes;
const sequelize = db.sequelize;
const Employee = db.employees;
const JobCard = db.jobCard;
const Users = db.users;
const Insurances = db.insurances;

const addCustomer = async (customer, userId, outlet, links) => {
  let data = {};
  const transaction = await db.sequelize.transaction();
  let emailIdEncrypted = null;

  try {
    const customerCode = await generateCustomerCode(outlet.outletCode, transaction);
    logger.info('Customer dao addCustomer customerCode ' + customerCode);

    const firstNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.firstName}', '${encryptConfig.code}'))`);
    const lastNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.lastName}', '${encryptConfig.code}'))`);
    const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.mobileNumber}', '${encryptConfig.code}'))`);
    if (customer.emailId) {
      emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.emailId}', '${encryptConfig.code}'))`);
    }
    const contactPerson = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPerson}', '${encryptConfig.code}'))`);
    const contactPersonNum = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPersonNumber}', '${encryptConfig.code}'))`);

    data = await Customer.create(
      {
        firstName: firstNameEncrypted,
        lastName: lastNameEncrypted,
        address1: customer.address1,
        address2: customer.address2,
        state: customer.state,
        city: customer.city,
        pinCode: customer.pinCode,
        mobileNumber: mobileNumberEncrypted,
        sourceId: customer.sourceId,
        sourceTypeId: customer.sourceTypeId,
        customerCategory: customer.customerCategory,
        customerType: customer.customerType,
        billType: customer.billType,
        emailId: emailIdEncrypted ? emailIdEncrypted : null,
        contactPerson: contactPerson,
        contactPersonNumber: contactPersonNum,
        gstinNumber: customer.gstFileNumber === "" ? null : customer.gstFileNumber,
        transportName: customer.transportName === "" ? null : customer.transportName,
        fleetSize: customer.fleetSize === "" ? null : customer.fleetSize,
        status: customer.status,
        outletId: outlet.id,
        customerCode: customerCode,
        createdBy: userId,
        aadharLink: links.find(image => image.name === "aadharFile")?.link || null,
        rcLink: links.find(image => image.name === "rcFile")?.link || null,
        gstLink: links.find(image => image.name === "gstFile")?.link || null,
        panLink: links.find(image => image.name === "panFile")?.link || null,
        aadharNumber: customer.aadharNumber === "" ? null : customer.aadharNumber,
        rcNumber: customer.rcNumber === "" ? null : customer.rcNumber,
        panNumber: customer.panNumber === "" ? null : customer.panNumber,
        organization: customer.organization === "" ? null : customer.organization,
        gender: customer.gender === "" ? null : customer.gender,
        maritalStatus: customer.maritalStatus === "" ? null : customer.maritalStatus,
        dateOfBirth: customer.dateOfBirth === "" ? null : customer.dateOfBirth,
        dateOfAnniversary: customer.dateOfAnniversary === "" ? null : customer.dateOfAnniversary,
        discountOptions: customer.discountOptions === "" ? null : customer.discountOptions,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao addCustomer' + err);
    console.log(err);
  }

  return data;
};

const quickAddCustomer = async (customer, user) => {
  const transaction = await db.sequelize.transaction();

  try {
    const make = await db.makes.findByPk(customer.makeId, { transaction });
    const vehicleModel = await db.models.findByPk(customer.modelId, { transaction });
    const existingVehicle = await Vehicles.findOne({
      where: { registrationNumber: customer.registrationNumber },
      transaction,
    });

    if (!make) {
      const err = new Error('Make not found');
      err.status = 400;
      throw err;
    }
    if (!vehicleModel || Number(vehicleModel.makeId) !== Number(customer.makeId)) {
      const err = new Error('Model does not belong to the selected make');
      err.status = 400;
      throw err;
    }
    if (existingVehicle) {
      const err = new Error('Registration Number must be unique');
      err.status = 400;
      throw err;
    }

    const customerCode = await generateCustomerCode(user.outlet.outletCode, transaction);
    const customerData = await Customer.create({
      firstName: db.Sequelize.fn(
        'HEX',
        db.Sequelize.fn('AES_ENCRYPT', customer.firstName, encryptConfig.code)
      ),
      lastName: customer.lastName
        ? db.Sequelize.fn(
          'HEX',
          db.Sequelize.fn('AES_ENCRYPT', customer.lastName, encryptConfig.code)
        )
        : null,
      mobileNumber: db.Sequelize.fn(
        'HEX',
        db.Sequelize.fn('AES_ENCRYPT', customer.mobileNumber, encryptConfig.code)
      ),
      address1: customer.address1,
      pinCode: customer.pinCode,
      outletId: user.outlet.id,
      customerCode,
      createdBy: user.id,
    }, { transaction });

    const vehicleData = await Vehicles.create({
      customerId: customerData.id,
      registrationNumber: customer.registrationNumber,
      makeId: customer.makeId,
      modelId: customer.modelId,
      fuelType: customer.fuelType,
      createdBy: user.id,
    }, { transaction });

    await transaction.commit();
    return {
      customerId: customerData.id,
      vehicleId: vehicleData.id,
      customerCode,
    };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao quickAddCustomer', err);
    throw err;
  }
};

const quickAddPortalCustomer = async (customer, user) => {
  const transaction = await db.sequelize.transaction();
  try {
    const customerCode = await generateCustomerCode(user.outlet.outletCode, transaction);
    const customerData = await Customer.create({
      firstName: db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.firstName, encryptConfig.code)),
      lastName: customer.lastName
        ? db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.lastName, encryptConfig.code))
        : null,
      mobileNumber: db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.mobileNumber, encryptConfig.code)),
      pinCode: customer.pinCode || null,
      address1: customer.address1 || null,
      outletId: user.outlet.id,
      customerCode,
      createdBy: user.id,
    }, { transaction });
    await transaction.commit();
    return { customerId: customerData.id, customerCode };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao quickAddPortalCustomer', err);
    throw err;
  }
};

const createStagedPortalCustomer = async (customer, user) => {
  const transaction = await db.sequelize.transaction();
  try {
    const existingCustomer = await Customer.findOne({
      where: sequelize.where(
        sequelize.col('mobileNumber'),
        db.Sequelize.fn(
          'HEX',
          db.Sequelize.fn('AES_ENCRYPT', customer.mobileNumber, encryptConfig.code)
        )
      ),
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existingCustomer) {
      const err = new Error('Mobile number is already registered');
      err.status = 409;
      throw err;
    }

    const customerCode = await generateCustomerCode(user.outlet.outletCode, transaction);
    const customerData = await Customer.create({
      firstName: db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.firstName, encryptConfig.code)),
      lastName: customer.lastName
        ? db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.lastName, encryptConfig.code))
        : null,
      mobileNumber: db.Sequelize.fn('HEX', db.Sequelize.fn('AES_ENCRYPT', customer.mobileNumber, encryptConfig.code)),
      pinCode: customer.pinCode || null,
      address1: customer.address1 || null,
      outletId: user.outlet.id,
      customerCode,
      createdBy: user.id,
    }, { transaction });

    await transaction.commit();
    return { customerId: customerData.id, customerCode };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao createStagedPortalCustomer', err);
    throw err;
  }
};

const searchCustomerVehicle = async (mobileNumber, registrationNumber, outletId) => {
  try {
    const customer = await Customer.findOne({
      where: {
        outletId,
        [Op.and]: [sequelize.where(
          sequelize.col('mobileNumber'),
          db.Sequelize.fn(
            'HEX',
            db.Sequelize.fn('AES_ENCRYPT', mobileNumber, encryptConfig.code)
          )
        )],
      },
      attributes: {
        include: [
          [sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`), 'decryptedFirstName'],
          [sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`), 'decryptedLastName'],
          [sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`), 'decryptedMobileNumber'],
        ],
      },
    });

    const vehicle = await Vehicles.findOne({
      where: { registrationNumber },
      include: [{ model: Customer, as: 'customer' }, { model: db.models, as: 'model' }],
    });
    const vehicleInOutlet = Number(vehicle?.customer?.outletId) === Number(outletId);
    const availableVehicle = vehicleInOutlet ? vehicle : null;
    const customerData = customer ? {
      customerId: customer.id,
      customerCode: customer.customerCode,
      name: [customer.dataValues.decryptedFirstName, customer.dataValues.decryptedLastName].filter(Boolean).join(' '),
      mobileNumber: customer.dataValues.decryptedMobileNumber,
      address1: customer.address1,
      pinCode: customer.pinCode,
    } : null;
    const vehicleData = availableVehicle ? {
      vehicleId: availableVehicle.id,
      customerId: availableVehicle.customerId,
      registrationNumber: availableVehicle.registrationNumber,
      makeId: availableVehicle.makeId,
      modelId: availableVehicle.modelId,
      modelSegment: availableVehicle.model?.segment || null,
      fuelType: availableVehicle.fuelType,
    } : null;

    return {
      customer: customerData,
      vehicle: vehicleData,
      customerExists: Boolean(customerData),
      vehicleExists: Boolean(vehicle),
      matched: Boolean(customerData && vehicleData && Number(customerData.customerId) === Number(vehicleData.customerId)),
    };
  } catch (err) {
    logger.error('Customer dao searchCustomerVehicle', err);
    throw err;
  }
};

const quickAddVehicleForCustomer = async (customer, user) => {
  const transaction = await db.sequelize.transaction();

  try {
    const customerData = await Customer.findByPk(customer.customerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!customerData) {
      const err = new Error('Customer not found');
      err.status = 404;
      throw err;
    }

    const existingVehicle = await Vehicles.findOne({
      where: { registrationNumber: customer.registrationNumber },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existingVehicle) {
      if (Number(existingVehicle.customerId) !== Number(customerData.id)) {
        const err = new Error('Registration Number is already linked to another customer');
        err.status = 409;
        throw err;
      }
      await transaction.commit();
      return { customerId: customerData.id, vehicleId: existingVehicle.id };
    }

    const make = await db.makes.findByPk(customer.makeId, { transaction });
    const vehicleModel = await db.models.findByPk(customer.modelId, { transaction });
    if (!make) {
      const err = new Error('Make not found');
      err.status = 400;
      throw err;
    }
    if (!vehicleModel || Number(vehicleModel.makeId) !== Number(customer.makeId)) {
      const err = new Error('Model does not belong to the selected make');
      err.status = 400;
      throw err;
    }

    const vehicleData = await Vehicles.create({
      customerId: customerData.id,
      registrationNumber: customer.registrationNumber,
      makeId: customer.makeId,
      modelId: customer.modelId,
      fuelType: customer.fuelType,
      createdBy: user.id,
    }, { transaction });

    await transaction.commit();
    return { customerId: customerData.id, vehicleId: vehicleData.id };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao quickAddVehicleForCustomer', err);
    throw err;
  }
};

const updateCustomerVehicleDetails = async (details, userId) => {
  const transaction = await db.sequelize.transaction();
  const emptyToNull = value => value === '' || value === undefined ? null : value;
  const insurance = details.insurance || {};
  const otherDetails = details.otherDetails || {};

  try {
    const customer = await Customer.findByPk(details.customerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const vehicle = await Vehicles.findOne({
      where: { id: details.vehicleId, customerId: details.customerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!customer || !vehicle) {
      const err = new Error('Customer or linked vehicle not found');
      err.status = 404;
      throw err;
    }

    const [duplicateMobiles] = await db.sequelize.query(
      'SELECT id FROM customers WHERE mobileNumber = HEX(AES_ENCRYPT(:mobileNumber, :encryptionKey)) AND id <> :customerId LIMIT 1',
      {
        replacements: {
          mobileNumber: details.mobileNumber,
          encryptionKey: encryptConfig.code,
          customerId: details.customerId,
        },
        transaction,
      }
    );
    if (duplicateMobiles.length) {
      const err = new Error('mobileNumber must be unique');
      err.status = 400;
      throw err;
    }

    const duplicateVehicle = await Vehicles.findOne({
      where: {
        registrationNumber: details.registrationNumber,
        id: { [Op.ne]: details.vehicleId },
      },
      transaction,
    });
    if (duplicateVehicle) {
      const err = new Error('Registration Number must be unique');
      err.status = 400;
      throw err;
    }

    const vehicleModel = await db.models.findByPk(details.modelId, { transaction });
    if (!vehicleModel || Number(vehicleModel.makeId) !== Number(details.makeId)) {
      const err = new Error('Model does not belong to the selected make');
      err.status = 400;
      throw err;
    }

    let insuranceName = null;
    if (insurance.insuranceProviderId) {
      const insuranceProvider = await Insurances.findByPk(insurance.insuranceProviderId, { transaction });
      if (!insuranceProvider) {
        const err = new Error('Insurance provider not found');
        err.status = 400;
        throw err;
      }
      insuranceName = insuranceProvider.insuranceName;
    }

    await Customer.update({
      firstName: db.Sequelize.fn(
        'HEX',
        db.Sequelize.fn('AES_ENCRYPT', details.firstName, encryptConfig.code)
      ),
      lastName: details.lastName
        ? db.Sequelize.fn(
          'HEX',
          db.Sequelize.fn('AES_ENCRYPT', details.lastName, encryptConfig.code)
        )
        : null,
      mobileNumber: db.Sequelize.fn(
        'HEX',
        db.Sequelize.fn('AES_ENCRYPT', details.mobileNumber, encryptConfig.code)
      ),
      pinCode: emptyToNull(details.pinCode),
      address1: emptyToNull(details.address1),
      customerCategory: emptyToNull(details.customerCategory),
      state: emptyToNull(details.state),
      city: emptyToNull(details.city),
      updatedBy: userId,
    }, { where: { id: details.customerId }, transaction });

    await Vehicles.update({
      registrationNumber: details.registrationNumber,
      makeId: details.makeId,
      modelId: details.modelId,
      fuelType: emptyToNull(details.fuelType),
      chassisNumber: emptyToNull(details.chassisNumber),
      engineNumber: emptyToNull(details.engineNumber),
      manufacturingYear: emptyToNull(details.manufacturingYear),
      insuranceName,
      insuranceProviderId: insurance.insuranceProviderId || null,
      insuranceLocation: emptyToNull(insurance.location),
      insuranceAreaName: emptyToNull(insurance.areaName),
      insurancePincode: emptyToNull(insurance.pincode),
      insuranceCity: emptyToNull(insurance.city),
      insuranceClaimNo: emptyToNull(insurance.claimNo),
      insuranceGstinNumber: emptyToNull(insurance.gstinNumber),
      insurance_policy_no: emptyToNull(insurance.policyNo),
      insuranceExpDate: emptyToNull(insurance.expiryDate),
      permitDue: emptyToNull(otherDetails.permitDue),
      taxDue: emptyToNull(otherDetails.taxDue),
      contranceFlag: emptyToNull(otherDetails.contranceFlag),
      nextDueDateFC: emptyToNull(otherDetails.fcRenewalDate),
      hypothecationAmount: emptyToNull(otherDetails.hypothecationAmount),
      updatedBy: userId,
    }, { where: { id: details.vehicleId, customerId: details.customerId }, transaction });

    await transaction.commit();
    return { customerId: customer.id, vehicleId: vehicle.id };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao updateCustomerVehicleDetails', err);
    throw err;
  }
};

const updateCustomerVehicleInsurance = async (details, userId) => {
  const transaction = await db.sequelize.transaction();
  const insurance = details.insurance;
  const emptyToNull = value => value === '' ? null : value;

  try {
    const vehicle = await Vehicles.findOne({
      where: { id: details.vehicleId, customerId: details.customerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!vehicle) {
      const err = new Error('Customer or linked vehicle not found');
      err.status = 404;
      throw err;
    }

    const updateData = { updatedBy: userId };
    const insuranceFields = {
      location: 'insuranceLocation',
      areaName: 'insuranceAreaName',
      pincode: 'insurancePincode',
      city: 'insuranceCity',
      claimNo: 'insuranceClaimNo',
      gstinNumber: 'insuranceGstinNumber',
      policyNo: 'insurance_policy_no',
      expiryDate: 'insuranceExpDate',
    };
    for (const [requestField, modelField] of Object.entries(insuranceFields)) {
      if (Object.prototype.hasOwnProperty.call(insurance, requestField)) {
        updateData[modelField] = emptyToNull(insurance[requestField]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(insurance, 'insuranceProviderId')) {
      if (insurance.insuranceProviderId) {
        const insuranceProvider = await Insurances.findByPk(insurance.insuranceProviderId, { transaction });
        if (!insuranceProvider) {
          const err = new Error('Insurance provider not found');
          err.status = 400;
          throw err;
        }
        updateData.insuranceProviderId = insuranceProvider.id;
        updateData.insuranceName = insuranceProvider.insuranceName;
      } else {
        updateData.insuranceProviderId = null;
        updateData.insuranceName = null;
      }
    }

    await Vehicles.update(updateData, {
      where: { id: details.vehicleId, customerId: details.customerId },
      transaction,
    });
    await transaction.commit();
    return { customerId: Number(details.customerId), vehicleId: Number(details.vehicleId) };
  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao updateCustomerVehicleInsurance', err);
    throw err;
  }
};

const getCustomerVehicleNumbers = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    attributes: ['id'],
  });
  if (!customer) {
    throw new notFoundException();
  }

  return await Vehicles.findAll({
    where: { customerId: customerId },
    attributes: ['id', 'registrationNumber'],
    order: [['id', 'DESC']],
  });
};

const addCustomerMobile = async (customer, userId, outlet) => {

  // console.log('customer pass data',customer);
  // return false;
  let data = {};
  const transaction = await db.sequelize.transaction();
  let emailIdEncrypted = null;

  try {
    // const pincodeDetails = await db.pincodes.findOne({
    //   where: {
    //     Pincode: customer.visitMetadata.pinCode,
    //     status: 1,
    //     cv_cityId: { [Op.ne]: 0 },
    //     cv_stateId: { [Op.ne]: 0 }
    //   },
    //   raw: true
    // })
    const customerCode = await generateCustomerCode(outlet.outletCode, transaction);
    logger.info('Customer dao addCustomer customerCode ' + customerCode);

    const firstNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.firstName}', '${encryptConfig.code}'))`);
    const lastNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.lastName}', '${encryptConfig.code}'))`);
    const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.mobileNumber}', '${encryptConfig.code}'))`);
    if (customer.emailId) {
      emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.emailId}', '${encryptConfig.code}'))`);
    }
    const contactPerson = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPerson}', '${encryptConfig.code}'))`);
    const contactPersonNum = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPersonNumber}', '${encryptConfig.code}'))`);

    data = await Customer.create(
      {

        firstName: firstNameEncrypted,
        address1: customer.address,
        state: customer.state,
        city: customer.city,
        // state: pincodeDetails.StateName ? pincodeDetails.StateName : null,
        // city: pincodeDetails.District ? pincodeDetails.District : null,
        pinCode: customer.visitMetadata.pinCode,
        mobileNumber: mobileNumberEncrypted,
        emailId: emailIdEncrypted ? emailIdEncrypted : null,
        sourceId: customer.source,
        sourceTypeId: customer.sourceType,
        contactPersonNumber: contactPersonNum,
        transportName: customer.transportName,
        contactPerson: customer.transportIncharge,
        contactPersonNumber: customer.transportMobileNumber,
        customerCategory: customer.customerCategory === 1 ? "B2B" : "B2C",
        gstinNumber: customer.gstinNumber,
        dob: "",
        doa: "",
        outletId: outlet.id,
        customerCode: customerCode,

        createdBy: userId,
      },
      { transaction }
    );

    await transaction.commit();

    return data.id;

  } catch (err) {
    await transaction.rollback();
    logger.error('Customer dao addCustomer ' + err);
    console.log(err);
    throw err;
  }
};

const addBulkCustomer = async (customer, userId, outlet) => {
  let data = {};
  try {
    // const customerCode = await generateCustomerCodeBulk(outlet.outletCode);
    //logger.info('Customer dao addCustomer customerCode ' + customerCode);
    data = await Customer.create(
      {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address1: customer.address1,
        address2: customer.address2,
        state: customer.state,
        city: customer.city,
        pinCode: customer.pinCode,
        mobileNumber: customer.mobileNumber,
        sourceId: customer.sourceId,
        sourceTypeId: customer.sourceTypeId,
        customerCategory: customer.customerCategory,
        customerType: customer.customerType,
        billType: customer.billType,
        emailId: customer.emailId,
        contactPerson: customer.contactPerson,
        contactPersonNumber: customer.contactPersonNumber,
        gstinNumber: customer.gstinNumber,
        oraclAccountNumber: customer.oraclAccountNumber,
        oraclSiteNumber: customer.oraclSiteNumber,
        status: customer.status,
        outletId: outlet.id,
        customerCode: customer.customerCode,
        createdBy: userId,
      }
    );
  } catch (err) {
    logger.error('Customer dao addCustomer' + err);
    console.log(err)
  }
  return data;
};

const listCustomers = async (reqData, user) => {
  try {
    const { searchKey, offset, limit } = reqData;

    const queryOptions = user.reportAccess === 1
      ? ' c.outletId IN (SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId) '
      : ' c.outletId = :outletId ';
    const replacements = {
      employeeId: user.employeeId,
      outletId: user.outlet.id,
      userId: user.id,
      searchPattern: `%${searchKey || ''}%`,
      offset: Number.isInteger(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0,
      limit: Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 25,
    };
    const countQueryOptions = user.reportAccess === 1
      ? ' c.outletId IN (SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId) AND c.createdBy = :userId '
      : ' c.outletId = :outletId ';
    const searchOptions = searchKey
      ? ` AND (c.customerCode LIKE :searchPattern
        OR CAST(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}') AS CHAR) LIKE :searchPattern
        OR CAST(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}') AS CHAR) LIKE :searchPattern
        OR CAST(AES_DECRYPT(UNHEX(c.mobileNumber), '${encryptConfig.code}') AS CHAR) LIKE :searchPattern
        OR vehicle.registrationNumber LIKE :searchPattern)`
      : '';

    const [countRows] = await sequelize.query(
      'SELECT COUNT(DISTINCT c.id) AS totalItems FROM customers AS c ' +
      'LEFT JOIN vehicles AS vehicle ON vehicle.customerId = c.id ' +
      'WHERE ' + countQueryOptions + searchOptions,
      { replacements }
    );
    const count = countRows[0]?.totalItems || 0;

    let sqlQry =
      'SELECT c.id, ' +
      `CAST(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}') AS CHAR) AS firstName, ` +
      `CAST(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}') AS CHAR) AS lastName, ` +
      `CONCAT(CAST(AES_DECRYPT(UNHEX(c.firstName), '${encryptConfig.code}') AS CHAR), " ", CAST(AES_DECRYPT(UNHEX(c.lastName), '${encryptConfig.code}') AS CHAR)) AS customerName, ` +
      `c.address1, c.address2, c.state, c.city, c.pinCode, CAST(AES_DECRYPT(UNHEX(c.mobileNumber), '${encryptConfig.code}') AS CHAR) AS mobileNumber, c.sourceId, c.sourceTypeId, c.customerCategory, ` +
      `c.customerType, c.billType, CAST(AES_DECRYPT(UNHEX(c.emailId), '${encryptConfig.code}') AS CHAR) AS emailId, ` +
      `CAST(AES_DECRYPT(UNHEX(c.contactPerson), '${encryptConfig.code}') AS CHAR) AS contactPerson, ` +
      `CAST(AES_DECRYPT(UNHEX(c.contactPersonNumber), '${encryptConfig.code}') AS CHAR) AS contactPersonNumber, ` +
      'c.gstinNumber, c.transportName, ' +
      'c.fleetSize, c.status, c.outletId, c.customerCode, ' +
      ' c.aadharLink, ' + ' c.rcLink,' + ' c.gstLink,' + ' c.panLink,' + ' c.aadharNumber,' +
      ' c.rcNumber,' + ' c.panNumber, ' + ' c.aprrovalStatus, ' +
      ' c.organization,' + ' c.gender,' + ' c.maritalStatus,' + ' c.dateOfBirth,' + ' c.dateOfAnniversary,' + ' c.discountOptions, ' +
      's.id AS sourceId, s.sourceName, ' +
      'st.id AS sourceTypeId, st.sourceTypeName, ' +
      'ot.id AS outletId, ot.outletCode, ot.outletName, ' +
      'GROUP_CONCAT(vehicle.registrationNumber) AS regNo, ' +
      'JSON_ARRAYAGG(IF(vehicle.id IS NULL, NULL, JSON_OBJECT( ' +
      '\'id\', vehicle.id, ' +
      '\'registrationNumber\', vehicle.registrationNumber, ' +
      '\'makeId\', vehicle.makeId, ' +
      '\'makeName\', make.makeName, ' +
      '\'modelId\', vehicle.modelId, ' +
      '\'modelName\', vehicleModel.modelName, ' +
      '\'variantId\', vehicle.variantId, ' +
      '\'variantName\', variant.varientName, ' +
      '\'fuelType\', vehicle.fuelType, ' +
      '\'odometer\', vehicle.odometer, ' +
      '\'chassisNumber\', vehicle.chassisNumber, ' +
      '\'engineNumber\', vehicle.engineNumber, ' +
      '\'color\', vehicle.color, ' +
      '\'manufacturingYear\', vehicle.manufacturingYear, ' +
      '\'insurance\', JSON_OBJECT( ' +
      '\'insuranceProviderId\', NULL, ' +
      '\'insuranceName\', vehicle.insuranceName, ' +
      '\'location\', NULL, ' +
      '\'areaName\', NULL, ' +
      '\'pincode\', NULL, ' +
      '\'city\', NULL, ' +
      '\'claimNo\', NULL, ' +
      '\'gstinNumber\', NULL, ' +
      '\'policyNo\', vehicle.insurance_policy_no, ' +
      '\'expiryDate\', vehicle.insuranceExpDate ' +
      '), ' +
      '\'otherDetails\', JSON_OBJECT( ' +
      '\'permitDue\', NULL, ' +
      '\'taxDue\', NULL, ' +
      '\'contranceFlag\', NULL, ' +
      '\'fcRenewalDate\', vehicle.nextDueDateFC, ' +
      '\'hypothecationAmount\', NULL ' +
      ') ' +
      '))) AS vehicleData ' +
      'FROM customers AS c ' +
      'LEFT OUTER JOIN sources AS s ON c.sourceId = s.id ' +
      'LEFT OUTER JOIN sourcetypes AS st ON c.sourceTypeId = st.id ' +
      'LEFT OUTER JOIN outlets AS ot ON c.outletId = ot.id ' +
      'LEFT OUTER JOIN vehicles AS vehicle ON vehicle.customerId = c.id ' +
      'LEFT OUTER JOIN makes AS make ON vehicle.makeId = make.id ' +
      'LEFT OUTER JOIN models AS vehicleModel ON vehicle.modelId = vehicleModel.id ' +
      'LEFT OUTER JOIN varients AS variant ON vehicle.variantId = variant.id ' +
      'WHERE ' + queryOptions;

    sqlQry += searchOptions;

    let groupBy = ' GROUP BY c.id ';
    let orderBy = ' ORDER BY c.id DESC LIMIT :offset, :limit';

    let finalSqlQry = sqlQry + groupBy + orderBy;
    const [results, metadata] = await sequelize.query(finalSqlQry, { replacements });

    return {
      totalItems: count,
      data: results,
    };
  } catch (err) {
    logger.error('Customer dao listCustomers', err);
  }
};

const listCustomersMobile = async (reqData, user) => {
  const fieldsToDecrypt = [
    { field: 'firstName', alias: 'decryptedFirstName' },
    { field: 'lastName', alias: 'decryptedLastName' },
    { field: 'mobileNumber', alias: 'decryptedMobileNumber' },
    { field: 'contactPerson', alias: 'decryptedContactPerson' },
    { field: 'contactPersonNumber', alias: 'decryptedContactPersonNumber' },
    { field: 'emailId', alias: 'decryptedEmailId' },
  ];

  const decryptedAttributes = fieldsToDecrypt.map(item => [
    db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
    item.alias
  ]);

  try {
    const { searchKey } = reqData;

    // const searchCondition = searchKey ? {
    //   [Op.or]: [
    //     // db.sequelize.where(db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), "mytvs_dms") AS CHAR)`), { [Op.like]: `%${searchKey}%` }),
    //     // db.sequelize.where(db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), "mytvs_dms") AS CHAR)`), { [Op.like]: `%${searchKey}%` }),
    //     db.sequelize.where(db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(mobileNumber), "mytvs_dms") AS CHAR)`), { [Op.like]: `%${searchKey}%` }),
    //     // db.sequelize.where(db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(customerCode), "mytvs_dms") AS CHAR)`), { [Op.like]: `%${searchKey}%` }),
    //   ],
    // } : {};

    const searchCondition = {
      [Op.or]: [
        { customerCode: { [Op.eq]: searchKey } },
        db.sequelize.where(
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
          ),
          { [Op.eq]: searchKey }
        ),
        db.sequelize.where(
          db.sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`
          ),
          { [Op.eq]: searchKey }
        ),
      ],
    };

    const userCondition = { createdBy: reqData.userId }; //user.id

    let rows = await Customer.findAll({
      where: { ...searchCondition },  //...userCondition,
      attributes: {
        include: decryptedAttributes
      }
    });

    const filteredRows = [];
    for (const row of rows) {
      let isMatching = false;
      for (const field of fieldsToDecrypt) {
        if (row.dataValues[field.alias]?.toLowerCase().includes(searchKey.toLowerCase())) {
          isMatching = true;
          break;
        }
      }

      if (isMatching) {
        filteredRows.push(row);
      }
    }

    if (filteredRows.length > 0) {
      rows = filteredRows;
    }

    for (const element of rows) {
      for (const field of fieldsToDecrypt) {
        element.dataValues[field.field] = element.dataValues[field.alias];
        delete element.dataValues[field.alias];
      }
    }

    // rows = rows.filter(row => {
    //   const isMatching = fieldsToDecrypt.some(field => {
    //     return row.dataValues[field.alias]?.toLowerCase().includes(searchKey.toLowerCase());
    //   });
    //   return isMatching;
    // });

    // rows.forEach(element => {
    //   fieldsToDecrypt.forEach(field => {
    //     element.dataValues[field.field] = element.dataValues[field.alias];
    //     delete element.dataValues[field.alias];
    //   });
    // });

    // return rows[0];
    // console.log('dao customer',rows)
    return rows;
  } catch (err) {
    logger.error('Customer dao listCustomersMobile', err);
  }
};

const updateCustomer = async (id, customer, userId, customerExists, links) => {
  console.log("update customer details --------------------", customer)
  let data = {};
  try {
    const firstNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.firstName}', '${encryptConfig.code}'))`);
    const lastNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.lastName}', '${encryptConfig.code}'))`);
    const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.mobileNumber}', '${encryptConfig.code}'))`);
    const emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.emailId}', '${encryptConfig.code}'))`);
    const contactPerson = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPerson}', '${encryptConfig.code}'))`);
    const contactPersonNum = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPersonNumber}', '${encryptConfig.code}'))`);

    let gstLink = null;
    let panLink = null;
    let aadharLink = null;
    let rcLink = null;
    if (customer.customerCategory === "B2C" && customer.customerCategory !== customerExists.customerCategory) {
      panLink = links.find(image => image.name === "panFile")?.link || null;
      aadharLink = links.find(image => image.name === "aadharFile")?.link || null;
      rcLink = links.find(image => image.name === "rcFile")?.link || null;
    }
    else if (customer.customerCategory === "B2B" && customer.customerCategory !== customerExists.customerCategory) {
      rcLink = links.find(image => image.name === "rcFile")?.link || null;
      gstLink = links.find(image => image.name === "gstFile")?.link || null;
      panLink = links.find(image => image.name === "panFile")?.link || null;
    }
    else if (customer.customerCategory === "B2C" && customer.customerCategory === customerExists.customerCategory) {
      panLink = links.find(image => image.name === "panFile")?.link || customerExists.panLink;
      aadharLink = links.find(image => image.name === "aadharFile")?.link || customerExists.aadharLink;
      rcLink = links.find(image => image.name === "rcFile")?.link || customerExists.rcLink;
    }
    else if (customer.customerCategory === "B2B" && customer.customerCategory === customerExists.customerCategory) {
      panLink = links.find(image => image.name === "panFile")?.link || customerExists.panLink;
      gstLink = links.find(image => image.name === "gstFile")?.link || customerExists.gstLink;
    }

    data = await Customer.update(
      {
        firstName: firstNameEncrypted,
        lastName: lastNameEncrypted,
        address1: customer.address1,
        address2: customer.address2,
        state: customer.state,
        city: customer.city,
        pinCode: customer.pinCode,
        mobileNumber: mobileNumberEncrypted,
        sourceId: customer.sourceId,
        sourceTypeId: customer.sourceTypeId,
        customerCategory: customer.customerCategory,
        customerType: customer.customerType,
        billType: customer.billType,
        emailId: emailIdEncrypted,
        contactPerson: contactPerson,
        contactPersonNumber: contactPersonNum,
        gstinNumber: customer.gstFileNumber === "" ? null : customer.gstFileNumber,
        transportName: customer.transportName === "" ? null : customer.transportName,
        fleetSize: customer.fleetSize === "" ? null : customer.fleetSize,
        status: customer.status,
        updatedBy: userId,
        aadharLink: aadharLink,
        rcLink: rcLink,
        gstLink: gstLink,
        panLink: panLink,
        aadharNumber: customer.aadharNumber === "" ? null : customer.aadharNumber,
        rcNumber: customer.rcNumber === "" ? null : customer.rcNumber,
        panNumber: customer.panNumber === "" ? null : customer.panNumber,
        organization: customer.organization === "" ? null : customer.organization,
        gender: customer.gender === "" ? null : customer.gender,
        maritalStatus: customer.maritalStatus === "" ? null : customer.maritalStatus,
        dateOfBirth: customer.dateOfBirth === "" ? null : customer.dateOfBirth,
        dateOfAnniversary: customer.dateOfAnniversary === "" ? null : customer.dateOfAnniversary,
        discountOptions: customer.discountOptions === "" ? null : customer.discountOptions,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Customer dao updateCustomer', err);
    next(err);
  }
  return data;
};

const updateCustomerMobile = async (id, customer, userId, outlet) => {
  console.log('customer update from mobile api -------------------', customer);
  let data = {};
  try {
    const firstNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.firstName}', '${encryptConfig.code}'))`);
    const lastNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.lastName}', '${encryptConfig.code}'))`);
    const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.mobileNumber}', '${encryptConfig.code}'))`);
    const emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.emailId}', '${encryptConfig.code}'))`);
    const contactPerson = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPerson}', '${encryptConfig.code}'))`);
    const contactPersonNum = db.Sequelize.literal(`HEX(AES_ENCRYPT('${customer.contactPersonNumber}', '${encryptConfig.code}'))`);

    // const pincodeDetails = await db.pincodes.findOne({
    //   where: {
    //     Pincode: customer.pinCode,
    //     status: 1,
    //     cv_cityId: { [Op.ne]: 0 },
    //     cv_stateId: { [Op.ne]: 0 }
    //   },
    //   raw: true
    // })
    // console.log('customer update from mobile api pincode details from table -------------------', pincodeDetails);
    data = await Customer.update(
      {
        firstName: firstNameEncrypted,
        address1: customer.address,
         pinCode: customer.pinCode,
        // state: pincodeDetails.StateName ? pincodeDetails.StateName : null,
        // city: pincodeDetails.District ? pincodeDetails.District : null,
        state: customer.state,
        city: customer.city,
        mobileNumber: mobileNumberEncrypted,
        sourceId: customer.source,
        sourceTypeId: customer.sourceType,
        emailId: emailIdEncrypted,
        contactPersonNumber: contactPersonNum,
        dob: "",
        doa: "",
        customerCategory: customer.customerCategory === 1 ? "B2B" : "B2C",
        outletId: outlet.id,
        createdBy: userId,
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('Customer dao updateCustomerMobile', err);
    next(err);
  }
  return data;
};

const findByCustomerId = async (id) => {
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
    return await Customer.findOne({
      where: { id: id },
      attributes: {
        include: decryptedAttributes
      }
    });
  } catch (err) {
    logger.error('Customer dao findByCustomerId', err);
    next(err);
  }
};

const getAllCustomertypes = async () => {
  try {
    const data = await Customertypes.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'customerType', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Customer dao getAllCustomertypes', err);
    next(err);
  }
};

const getAllCustomercategory = async () => {
  try {
    const data = await Customercategory.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'customerCategory', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Customer dao getAllCustomercategory', err);
    next(err);
  }
};

const getAllBilltypes = async () => {
  try {
    const data = await Billtypes.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'billType', 'status'],
    });
    return data;
  } catch (err) {
    logger.error('Customer dao getAllBilltypes', err);
    next(err);
  }
};

const findByMobileNumber = async (mobileNumber) => {
  try {
    return await Customer.findOne({
      where: sequelize.where(
        sequelize.col('mobileNumber'),
        db.Sequelize.fn(
          'HEX',
          db.Sequelize.fn('AES_ENCRYPT', mobileNumber, encryptConfig.code)
        )
      ),
    });
  } catch (err) {
    logger.error('Customer dao findByMobileNumber', err);
    next(err);
  }
};
const findByEmail = async (emailId) => {
  try {
    return await Customer.findOne({
      where: sequelize.literal(
        `emailId = HEX(AES_ENCRYPT('${emailId}', '${encryptConfig.code}'))`
      )
    });
  } catch (err) {
    logger.error('Customer dao findByEmail', err);
    next(err);
  }
};


const findByCustomerCode = async (customerCode) => {
  try {
    return await Customer.findOne({ where: { customerCode: customerCode } });
  } catch (err) {
    logger.error('Customer dao findByEmail', err);
    next(err);
  }
};

const findByGstNo = async (gstinNumber) => {
  try {
    return await Customer.findOne({ where: { gstinNumber: gstinNumber } });
  } catch (err) {
    logger.error('Customer dao findByGstNo', err);
    next(err);
  }
};

const getAllCustomers = async (customerId) => {
  let data = {};
  try {
    if (customerId == 0) {
      data = await Customer.findAll({
        order: [['id', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'customerCode', 'status'],
      });
    } else {
      data = await Customer.findAll({
        where: { id: customerId },
        attributes: ['id', 'firstName', 'lastName', 'customerCode', 'status'],
      });
    }
    return data;
  } catch (err) {
    logger.error('Customer dao getAllCustomers Error:', err);
    throw err;
  }
};


const getAllSearchedCustomers = async ({ customerId, searchKey, offset = 0, limit = 20 }) => {
  try {
    let whereCondition = {};

    // dynamic for future if needed include customerId
    // if (customerId && Number(customerId) !== 0) {
    //   whereCondition.id = customerId;
    // } else if (searchKey && searchKey.trim()) {
    //   whereCondition.customerCode = {
    //     [Op.like]: `${searchKey.trim()}%`
    //   };
    // } else {
    //   return [];
    // }

    if(searchKey && searchKey.trim()) {
      whereCondition[Op.or] = [
        { customerCode: { [Op.like]: `${searchKey.trim()}%` } }
        // sequelize.where(
        //   sequelize.literal(`CAST(AES_DECRYPT(UNHEX(firstName), '${encryptConfig.code}') AS CHAR)`),
        //   { [Op.like]: `${searchKey.trim()}%` }
        // ),
        // sequelize.where(
        //   sequelize.literal(`CAST(AES_DECRYPT(UNHEX(lastName), '${encryptConfig.code}') AS CHAR)`),
        //   { [Op.like]: `${searchKey.trim()}%` }
        // )
      ];
    }


    const data = await Customer.findAll({
      where: whereCondition,
      attributes: ['id', 'firstName', 'lastName', 'customerCode', 'status'],
      order: [['id', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    return data;
  } catch (err) {
    logger.error('Customer dao getAllCustomers Error:', err);
    throw err;
  }
};

// const generateCustomerCode = async (outletCode, transaction) => {
//   const lastCustomer = await Customer.findOne({
//     where: {
//       customerCode: {
//         [Op.like]: `${outletCode}-%`,
//       },
//     },
//     order: [['id', 'DESC']],
//     transaction,
//   });

//   let newCodeNumber = 1;
//   if (lastCustomer) {
//     const lastCode = lastCustomer.customerCode;
//     const lastNumber = parseInt(lastCode.split('-')[1], 10);
//     newCodeNumber = lastNumber + 1;
//   }

//   return `${outletCode}-${newCodeNumber}`;
// };



const generateCustomerCode = async (outletCode, transaction) => {
  const THRESHOLD_ID = 643081;

  // Step 1: Get last inserted record (to decide format)
  const lastCustomer = await Customer.findOne({
    order: [['id', 'DESC']],
    transaction,
  });

  let newCodeNumber = 1;
  let separator = '-';

  // 🔥 If new logic applies
  if (lastCustomer && lastCustomer.id >= THRESHOLD_ID) {
    separator = '_';

    // Only check "_" format records
    const lastUnderscoreCustomer = await Customer.findOne({
      where: {
        customerCode: {
          [Op.like]: `${outletCode}_%`,
        },
      },
      order: [['id', 'DESC']],
      transaction,
    });

    if (lastUnderscoreCustomer) {
      const lastCode = lastUnderscoreCustomer.customerCode;

      // const lastNumber = parseInt(lastCode.split('_')[1], 10) || 0;
      // newCodeNumber = lastNumber + 1;

      const parts = lastCode.split('_');
      const lastNumber = parseInt(parts[parts.length - 1], 10) || 0;
      newCodeNumber = lastNumber + 1;
    } else {
      newCodeNumber = 1; // start fresh
    }

  } else {
    // OLD LOGIC (for "-")
    const lastDashCustomer = await Customer.findOne({
      where: {
        customerCode: {
          [Op.like]: `${outletCode}-%`,
        },
      },
      order: [['id', 'DESC']],
      transaction,
    });

    if (lastDashCustomer) {
      const lastCode = lastDashCustomer.customerCode;
      const lastNumber = parseInt(lastCode.split('-')[1], 10) || 0;
      newCodeNumber = lastNumber + 1;
    }
  }

  return `${outletCode}${separator}${newCodeNumber}`;
};

const generateCustomerCodeBulk = async (outletCode) => {
  const lastCustomer = await Customer.findOne({
    where: {
      customerCode: {
        [Op.like]: `${outletCode}-%`,
      },
    },
    order: [['id', 'DESC']]
  });

  let newCodeNumber = 1;
  if (lastCustomer) {
    const lastCode = lastCustomer.customerCode;
    const lastNumber = parseInt(lastCode.split('-')[1], 10);
    newCodeNumber = lastNumber + 1;
  }

  return `${outletCode}-${newCodeNumber}`;
};
const checkUniqueForMobile = async (mobileNumber, id) => {
  let data = '';
  try {
    data = await Customer.findOne({
      where: {
        [Op.and]: [
          sequelize.literal(
            `mobileNumber = HEX(AES_ENCRYPT('${mobileNumber}', '${encryptConfig.code}'))`
          ),
          {
            id: {
              [Op.ne]: id,
            }
          },
        ]
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const checkUniqueForEmail = async (emailId, id) => {
  let data = '';
  try {
    data = await Customer.findOne({
      where: {
        [Op.and]: [
          sequelize.literal(
            `emailId = HEX(AES_ENCRYPT('${emailId}', '${encryptConfig.code}'))`
          ),
          {
            id: {
              [Op.ne]: id,
            },
          }
        ]
      },
    });
  } catch (error) {
    console.log(error);
  }
  return data;
};

const checkUniqueForGstIn = async (gstinNumber, id) => {
  let data = '';
  try {
    if (gstinNumber == '' || gstinNumber == null) {
      gstinNumber = '0000000000000';
    }
    data = await Customer.findOne({
      where: {
        gstinNumber: gstinNumber,
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

const getCustomerData = async (customerCode) => {
  try {
    return await Customer.findOne({
      where: { customerCode: customerCode },
      attributes: [
        "id",
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
        "address1",
        [
          db.Sequelize.literal(`IFNULL(\`customer\`.\`address2\`, '')`),
          "address2",
        ],
        "state",
        "city",
        "pinCode",
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(mobileNumber), '${encryptConfig.code}') AS CHAR)`
          ),
          "mobileNumber",
        ],
        "sourceId",
        "sourceTypeId",
        "customerCategory",
        "customerType",
        "billType",
        [
          db.Sequelize.literal(
            `CAST(AES_DECRYPT(UNHEX(emailId), '${encryptConfig.code}') AS CHAR)`
          ),
          "emailId",
        ],
[
  db.Sequelize.literal(
    `CAST(AES_DECRYPT(UNHEX(\`customer\`.\`contactPerson\`), '${encryptConfig.code}') AS CHAR)`
  ),
  "contactPerson",
],
[
  db.Sequelize.literal(
    `CAST(AES_DECRYPT(UNHEX(\`customer\`.\`contactPersonNumber\`), '${encryptConfig.code}') AS CHAR)`
  ),
  "contactPersonNumber",
],
        "gstinNumber",
        "transportName",
        "fleetSize",
        "status",
        "aprrovalStatus",
        "outletId",
        "customerCode",
        "createdBy",
        "updatedBy",
        "aadharLink",
        "rcLink",
        "gstLink",
        "panLink",
        "aadharNumber",
        "rcNumber",
        "panNumber",
        "oracleCustomerCode",
        "siteNumber",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Source,
          attributes: ["sourceName"],
          as: "source"
        },
        {
          model: SourceType,
          attributes: ["sourceTypeName"],
          as: "sourceType"
        },
        {
          model: Outlet,
          attributes: ["companyId"],
          as: "outlets"
        }
      ]

    });
  } catch (err) {
    logger.error('Customer dao getCustomerData', err);
    next(err);
  }
};

// const searchCustomer = async (reqData, user) => {
//   let rows;
//   let searchKey = reqData.customerCode;
//   let whereCondition = {
//     // createdby: user.id,
//     ...(searchKey && searchKey.length >= 3
//       ? {
//         [Op.or]: [
//           { customerCode: { [Op.like]: `%${searchKey}%` } },
//           { firstName: { [Op.like]: `%${searchKey}%` } },
//           { lastName: { [Op.like]: `%${searchKey}%` } },
//         ],
//       }
//       : {}),
//   };

//   try {
//     const queryOptions = {
//       where: whereCondition,
//       order: [['id', 'DESC']],
//       attributes: [
//         'id',
//         'customerCode',
//         'firstName',
//         'lastName',
//         'address1',
//         'city',
//         'outletId',
//       ],
//     };

//     if (user.reportAccess === 1) {
//       queryOptions.where.outletId = {
//         [Op.in]: literal(
//           `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
//         ),
//       };
//     }

//     rows = await Customer.findAll(queryOptions);
//     return rows;
//   } catch (err) {
//     logger.error('Customer dao searchCustomer', err);
//     console.log(err);
//   }
// };

const searchCustomer = async (reqData, user) => {
  let rows;
  let searchKey = reqData.customerCode;
  let whereCondition = {
    // createdby: user.id,
    ...(searchKey && searchKey.length >= 3
      ? {
        [Op.or]: [
          { customerCode: { [Op.like]: `%${searchKey}%` } },
          { firstName: { [Op.like]: `%${searchKey}%` } },
          { lastName: { [Op.like]: `%${searchKey}%` } },
        ],
      }
      : {}),
  };

  try {
    const queryOptions = {
      where: whereCondition,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'customerCode',
        'firstName',
        'lastName',
        'address1',
        'city',
        'outletId',
      ],
    };

    if (user.reportAccess === 1) {
      queryOptions.where.outletId = {
        [Op.in]: literal(
          `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
        ),
      };
    }

    rows = await Customer.findAll(queryOptions);
    return rows;
  } catch (err) {
    logger.error('Customer dao searchCustomer', err);
    console.log(err);
  }
};

const approveCustomer = async (reqData, user) => {
  let data = {};
  try {
    let queryOptions = {}

    if (user.reportAccess === 1) {
      queryOptions = {
        outletId:
        {
          [Op.in]: literal(
            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
          )
        },
        id: reqData.id
      }
    }
    else {
      queryOptions = {
        id: reqData.id,
        outletId: user.outlet.id
      }
    }
    data = await Customer.update(
      { aprrovalStatus: reqData.approvalStatus },
      { where: queryOptions }
    )
  } catch (err) {
    logger.error('Customer dao approveCustomer error:', err);
    console.log(err);
  }
  return data;
}

const updatecustomervisit = async (req) => {
  const currentDate = new Date();

  const firstNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.firstName}', '${encryptConfig.code}'))`);
  const lastNameEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.lastName}', '${encryptConfig.code}'))`);
  const mobileNumberEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.mobileNumber}', '${encryptConfig.code}'))`);
  const emailIdEncrypted = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.emailId}', '${encryptConfig.code}'))`);
  const contactPerson = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.contactPerson}', '${encryptConfig.code}'))`);
  const contactPersonNum = db.Sequelize.literal(`HEX(AES_ENCRYPT('${req.contactPersonNumber}', '${encryptConfig.code}'))`);

  const customerType = await Customertypes.findOne({
    where: {
      id: req.visitMetadata.customerCategory,
    },
    raw: true,
  })

  const getOutletId = await Users.findOne({
    where: {
      id: req.userId
    },
    include: [{
      model: Employee,
      as: 'employee',
      include: [{
        model: db.outlets,
        as: 'outlet'
      }]
    }]
  })

  const pincodeDetails = await db.pincodes.findOne({
    where: {
      Pincode: req.visitMetadata.pinCode,
      status: 1,
      cv_cityId: { [Op.ne]: 0 },
      cv_stateId: { [Op.ne]: 0 }
    },
    raw: true
  })

  const customerData = await findByMobileNumber(req.mobileNumber);
  const vehicleData = await Vehicles.findOne({
    where: {
      registrationNumber: req.registrationNumber
    }
  })

  console.log("customerData", customerData);

  const jobcardupdatepayload = {
    outlet_id: getOutletId.employee.outletId,
    outlet_code: getOutletId.employee.outlet.outletCode,
    document_type: "",
    job_card_no: "",
    customer_id: customerData.id,
    customer_code: customerData.customerCode,
    customer_name: req.firstName + " " + req.lastName,
    customer_address: req.address,
    // customer_state: pincodeDetails.StateName ? pincodeDetails.StateName : null,
    // customer_city: pincodeDetails.District ? pincodeDetails.District : null,
    customer_state: req.state,
    customer_city: req.city,
    customer_pincode: req.visitMetadata.pinCode,
    customer_type: customerType.customerType,
    vehicle_id: req.vehicleId,
    customer_mobileNumber: req.mobileNumber,
    customer_email: req.emailId,
    odometer: req.odometer,
    source: req.source,
    source_type: req.sourceType,
    reg_no: req.registrationNumber,
    work_end_date_time: currentDate,
    assigned_sa_id: req.userId,
    status: 0,
    fit_status: req.Parent[0].VISIT_STATUS,
    created_by: req.userId,
    updated_by: req.userId,
    updatedAt: utils.getDateTime,
    vehicle_monthly_usage: req.Parent[0].VEHICLE_MONTHLY_USAGE,
    partOrAggregate: req.visitMetadata.partAggregate ? req.visitMetadata.partAggregate : null,
    dsa_agent_id: req.visitMetadata.AgentId != "" ? req.visitMetadata.AgentId : null,
    dsa_agent: req.visitMetadata.AgentCode != "" ? req.visitMetadata.AgentCode : null
  }

  const updateJobCard = await JobCard.update(
    jobcardupdatepayload,
    {
      where: { id: req.VisitId }
    }
  );

  console.log("updateJobCard", updateJobCard);
  if (updateJobCard[0] == 1) {
    const customerUpdate = await Customer.update({
      firstName: firstNameEncrypted,
      address1: req.address,
      // state: pincodeDetails.StateName ? pincodeDetails.StateName : null,
      // city: pincodeDetails.District ? pincodeDetails.District : null,
      state: req.state,
      city: req.city,
      pinCode: req.visitMetadata.pinCode,
      mobileNumber: mobileNumberEncrypted,
      emailId: emailIdEncrypted,
      sourceId: req.source,
      sourceTypeId: req.sourceType,
      contactPersonNumber: contactPersonNum,
      transportName: req.transportName,
      customerType: customerType.customerType,
      contactPerson: req.transportIncharge,
      contactPersonNumber: req.transportMobileNumber,
      customerCategory: req.visitMetadata.customerCategory === 1 ? "B2B" : "B2C",
      gstinNumber: req.visitMetadata.gstinNumber,
      dob: "",
      doa: "",
      outletId: getOutletId.employee.outletId,
      customerCode: customerData.customerCode,
      createdBy: req.userId,
    },
      {
        where: {
          id: customerData.id
        }
      })

    if (customerUpdate[0] == 1) {
      let insurance = "";
      if (req.insuranceProvider) {
        insurance = await Insurances.findOne({
          where: { id: req.insuranceProvider }
        });
      };

      // console.log("insurance",insurance);
      const updateVehicle = await Vehicles.update({
        customerId: customerData.id,
        registrationNumber: req.registrationNumber,
        makeId: req.makeId,
        modelId: req.modelId,
        variantId: req.variantId,
        odometer: req.odometer,
        fuelType: req.fuelType === 1 ? "Petrol" : "Diesel",
        chassisNumber: req.chassisNumber,
        engineNumber: req.engineNumber,
        insuranceName: insurance ? insurance.insuranceName : null,
        insuranceExpDate: req.insuranceExpDate,
        createdBy: req.userId,
        updatedBy: req.userId,
        updatedAt: utils.getDateTime,
        manufacturingYear: req.visitMetadata.manufacturingYear
      }, {
        where: {
          id: vehicleData.id
        }
      })

      console.log("updateVehicle", updateVehicle);
      const updateVisitAuditTrail = await utils.updateAuditTrail(
        req.VisitId,
        req.Parent[0].VISIT_STATUS,
        req.userId,
        ""
      )

      if (updateVehicle[0] == 1) {
        return {
          status: true,
        }
      } else {
        return {
          status: false,
          message: "Vehicle Update Failed"
        }
      }
    } else {
      return {
        status: false,
        message: "Customer Update Failed"
      }
    }
  } else {
    return {
      status: false,
      message: "Job Card Update Failed"
    }
  }
}

const findOracleByCustomerCode = async (customerCode) => {
  try {
    return await Customer.findOne({
      where: { customerCode: customerCode },
      attributes: ['id', 'customerCode', 'oracleCustomerCode', 'siteNumber'],
    });
  } catch (err) {
    logger.error('Customer dao findOracleByCustomerCode', err);
    throw err;
  }
};

const updateOracleCode = async (id, oracleCustomerCode, siteNumber) => {
  try {
    const result = await Customer.update(
      { oracleCustomerCode, siteNumber },
      { where: { id } }
    );
    return result[0] > 0;
  } catch (err) {
    logger.error('Customer dao updateOracleCode', err);
    throw err;
  }
};

const dao = {
  addCustomer,
  quickAddCustomer,
  quickAddPortalCustomer,
  createStagedPortalCustomer,
  searchCustomerVehicle,
  quickAddVehicleForCustomer,
  updateCustomerVehicleDetails,
  updateCustomerVehicleInsurance,
  getCustomerVehicleNumbers,
  listCustomers,
  updateCustomer,
  findByCustomerId,
  getAllCustomertypes,
  getAllCustomercategory,
  getAllBilltypes,
  findByMobileNumber,
  findByEmail,
  findByGstNo,
  getAllCustomers,
  checkUniqueForMobile,
  checkUniqueForEmail,
  checkUniqueForGstIn,
  getCustomerData,
  searchCustomer,
  addBulkCustomer,
  generateCustomerCodeBulk,
  findByCustomerCode,
  addCustomerMobile,
  listCustomersMobile,
  updateCustomerMobile,
  approveCustomer,
  getAllSearchedCustomers,
  updatecustomervisit,
  findOracleByCustomerCode,
  updateOracleCode
};

export default dao;
