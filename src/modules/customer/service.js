import logger from '../../config/logger.js';
import axios from 'axios';
import CustomerDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import ServiceBookingDao from '../serviceBooking/dao.js';
import SourceDao from '../source/dao.js'
import JobCardService from '../jobCard/service.js';
import xlsx from 'xlsx';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedPromise = promisify(finished);

const validateBulkCustomer = async (req, user, files) => {
  let result = '';
  let exceptionData = [];
  let successData = [];

  try {
    // Check if the request contains a file
    if (req.file && req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      // Extract the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Process each row in the sheet data
      for (const element of sheetData) {
        try {
          const sourceData = await SourceDao.getSourceByName(element.source);

          if (sourceData) {
            const sourceTypeData = sourceData.sourcetypes?.[0];
            if (!sourceTypeData) {
              element['Message'] = 'Source type not available';
              exceptionData.push(element);
              continue;
            }

            element['sourceId'] = sourceData.id;
            element['sourceTypeId'] = sourceTypeData.id;

            const mobileExist = await CustomerDao.findByMobileNumber(element.mobileNumber);
            const emailExist = await CustomerDao.findByEmail(element.emailId);
            const gstExist = await CustomerDao.findByGstNo(element.gstinNumber);

            if (mobileExist || emailExist || gstExist) {
              element['Message'] = 'Mobile, email, and GST must be unique';
              exceptionData.push(element);
            } else {
              successData.push(element); // Push valid data to success array
            }
          } else {
            element['Message'] = 'Source not available';
            exceptionData.push(element);
          }
        } catch (innerError) {
          element['Message'] = `Error processing row: ${innerError.message}`;
          exceptionData.push(element);
        }
      }

      result = 'success';
    } else {
      throw new Error('File not provided or invalid.');
    }
  } catch (err) {
    result = 'failed';
    logger.error('Error in validateBulkCustomer:', err);
  }

  return { result, exceptionData, successData };
};


const addBulkCustomer = async (req, user, files) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  let exceptionData = [];
  let sourceData1 = [];
  try {
    if (data) {
      result = 'success';
      const filePath = req.file.buffer;
      const workbook = xlsx.read(filePath, { type: 'buffer' });
      //const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      sheetData.forEach(async (element) => {

        let sourceData = await SourceDao.getSourceByName(element.source);
        if (sourceData) {
          sourceData1 = sourceData;
          let sourceTypeData = sourceData.sourcetypes[0]
          // let data = await CustomerDao.addCustomer(element, user.id, user.outlet);
          element['sourceId'] = sourceData.id;
          element['sourceTypeId'] = sourceTypeData.id;
          let mobileExist = await CustomerDao.findByMobileNumber(element.mobileNumber);
          let emaiExist = await CustomerDao.findByEmail(element.emailId);
          let gstExist = await CustomerDao.findByGstNo(element.gstinNumber);

          // console.log("mobileExist: ", mobileExist);
          // console.log("emaiExist: ", emaiExist);
          // console.log("gstExist: ", gstExist)
          if (mobileExist || emaiExist || gstExist) {
            exceptionData.push(element);
            console.log(exceptionData);
          } else {
            await delay(500);
            const customerCode = await CustomerDao.generateCustomerCodeBulk(user.outlet.outletCode);
            element['customerCode'] = customerCode;
            let data = await CustomerDao.addBulkCustomer(element, user.id, user.outlet);
            // console.log(element);
          }
        } else {
          exceptionData.push(element)
        }

      });
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'InventoryPhotoCategory service addInventoryPhotoCategory Error:',
      err
    );
  }
  return result;
};

const addCustomer = async (customer, user, files) => {
  let result = '';
  let recentActivityData = {};
  let resultLinks = [];
  let date = new Date();
  try {
    if (!files) {
      let data = await CustomerDao.addCustomer(customer, user.id, user.outlet, resultLinks);
      if (data) {
        recentActivityData['activity_type'] = 'Create';
        recentActivityData['menu_name'] = 'Customer';
        recentActivityData['createdBy'] = user.id;
        recentActivityData['username'] = user.employeeCode;
        recentActivityData['message'] =
          customer.firstName + ' Customer is created ';
        const recent =
          await RecentAcivityService.addRecentActivity(recentActivityData);
        result = 'success';
      }
    }
    const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod'; // The name of your Cloud Storage bucket
    const bucket = storage.bucket(bucketName);
    for (const image of files) {
      const buffer = image.buffer;
      let newName =
        date.getTime().toString() +
        Math.random().toString(36).slice(2, 7) +
        image.originalname.replace(/\ /g, '_');
      const blob = bucket.file(`DMS/${newName}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });


      blobStream.on('error', (err) => {
        return "failed"
      });

      blobStream.on('finish', () => {
        // console.log(
        //   'file------------',
        //   `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
        // );
        const imageData = {
          name: image.fieldname,
          link: `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
        }

        resultLinks.push(imageData);
      });

      // Upload the file to Google Cloud Storage
      blobStream.end(buffer);

      await finishedPromise(blobStream);
    };
    let data = await CustomerDao.addCustomer(customer, user.id, user.outlet, resultLinks);

    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Customer';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        customer.firstName + ' Customer is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Customer service addCustomer', err);
    next(err);
  }
  return result;
};

const quickAddCustomer = async (customer, user) => {
  try {
    const [firstName, ...lastNameParts] = customer.name.trim().split(/\s+/);
    return await CustomerDao.quickAddCustomer({
      ...customer,
      firstName,
      lastName: lastNameParts.join(' ') || null,
      makeId: Number(customer.makeId),
      modelId: Number(customer.modelId),
    }, user);
  } catch (err) {
    logger.error('Customer service quickAddCustomer', err);
    throw err;
  }
};

const searchCustomerVehicle = async (reqData, user) => {
  return await CustomerDao.searchCustomerVehicle(
    reqData.mobileNumber.trim(),
    reqData.registrationNumber.trim(),
    user.outlet.id
  );
};

const createPortalCustomer = async (customer, user) => {
  const [firstName, ...lastNameParts] = customer.name.trim().split(/\s+/);
  return await CustomerDao.createStagedPortalCustomer({
    ...customer,
    firstName,
    lastName: lastNameParts.join(' ') || null,
    mobileNumber: customer.mobileNumber.trim(),
  }, user);
};

const quickAddVehicleForCustomer = async (vehicle, user) => {
  try {
    return await CustomerDao.quickAddVehicleForCustomer({
      ...vehicle,
      customerId: Number(vehicle.customerId),
      makeId: Number(vehicle.makeId),
      modelId: Number(vehicle.modelId),
    }, user);
  } catch (err) {
    logger.error('Customer service quickAddVehicleForCustomer', err);
    throw err;
  }
};

const updateCustomerVehicleDetails = async (details, user) => {
  try {
    const [firstName, ...lastNameParts] = details.name.trim().split(/\s+/);
    return await CustomerDao.updateCustomerVehicleDetails({
      ...details,
      firstName,
      lastName: lastNameParts.join(' ') || null,
      customerId: Number(details.customerId),
      vehicleId: Number(details.vehicleId),
      makeId: Number(details.makeId),
      modelId: Number(details.modelId),
    }, user.id);
  } catch (err) {
    logger.error('Customer service updateCustomerVehicleDetails', err);
    throw err;
  }
};

const updateCustomerVehicleInsurance = async (details, user) => {
  try {
    return await CustomerDao.updateCustomerVehicleInsurance({
      ...details,
      customerId: Number(details.customerId),
      vehicleId: Number(details.vehicleId),
    }, user.id);
  } catch (err) {
    logger.error('Customer service updateCustomerVehicleInsurance', err);
    throw err;
  }
};

const getCustomerVehicleNumbers = async (customerId, user) => {
  try {
    const vehicles = await CustomerDao.getCustomerVehicleNumbers(Number(customerId));
    return await Promise.all(vehicles.map(async vehicle => ({
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      serviceHistory: vehicle.registrationNumber
        ? await JobCardService.vehicleHistory(
          { registrationNumber: vehicle.registrationNumber },
          user
        )
        : [],
    })));
  } catch (err) {
    logger.error('Customer service getCustomerVehicleNumbers', err);
    throw err;
  }
};

const addCustomerMobile = async (customer, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let customerId = await CustomerDao.addCustomerMobile(customer, user.id, user.outlet);

    if (customerId) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Customer';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        customer.firstName + ' Customer is created ';
      await RecentAcivityService.addRecentActivity(recentActivityData);

      result = { success: true, customerId: customerId };
    }
  } catch (err) {
    result = { success: false, message: 'Failed to add customer' };
    logger.error('Customer service addCustomer', err);
    throw err;
  }
  return result;
};

const listCustomers = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await CustomerDao.listCustomers(reqData, user);

    const customerVehicleData = data.flatMap(item => {
      if (typeof item.vehicleData === 'string') {
        try {
          item.vehicleData = JSON.parse(item.vehicleData);
        } catch (err) {
          item.vehicleData = [];
        }
      }
      item.vehicleData = Array.isArray(item.vehicleData)
        ? item.vehicleData.filter(vehicle => vehicle && vehicle.id !== null)
        : [];

      const customerName = [item.firstName, item.lastName].filter(Boolean).join(' ');
      const vehicles = item.vehicleData.length ? item.vehicleData : [null];

      return vehicles.map(vehicle => ({
        customerId: item.id,
        vehicleId: vehicle?.id ?? null,
        name: customerName,
        mobileNumber: item.mobileNumber,
        pinCode: item.pinCode,
        address1: item.address1,
        customerCategory: item.customerCategory,
        state: item.state,
        city: item.city,
        registrationNumber: vehicle?.registrationNumber ?? null,
        makeId: vehicle?.makeId ?? null,
        makeName: vehicle?.makeName ?? null,
        modelId: vehicle?.modelId ?? null,
        modelName: vehicle?.modelName ?? null,
        variantId: vehicle?.variantId ?? null,
        variantName: vehicle?.variantName ?? null,
        fuelType: vehicle?.fuelType ?? null,
        chassisNumber: vehicle?.chassisNumber ?? null,
        engineNumber: vehicle?.engineNumber ?? null,
        manufacturingYear: vehicle?.manufacturingYear ?? null,
        insurance: vehicle?.insurance ?? {
          insuranceProviderId: null,
          insuranceName: null,
          location: null,
          areaName: null,
          pincode: null,
          city: null,
          claimNo: null,
          gstinNumber: null,
          policyNo: null,
          expiryDate: null,
        },
        otherDetails: vehicle?.otherDetails ?? {
          permitDue: null,
          taxDue: null,
          contranceFlag: null,
          fcRenewalDate: null,
          hypothecationAmount: null,
        },
      }));
    });

    return {
      totalItems: totalItems,
      data: customerVehicleData,
    };
  } catch (err) {
    logger.error('Customer service listCustomers', err);
    next(err);
  }
};

const getCustomerImages = async (reqData, user) => {
  let resultList = {
    aadharImage: null,
    rcImage: null,
    gstImage: null,
    panImage: null,
  };
  try {
    const item = await CustomerDao.findByCustomerId(reqData.id);

    if (item === undefined || item === null) {
      return resultList;
    }

    const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod';

    const processBlobStream = async (srcFileName) => {
      return new Promise((resolve, reject) => {
        const file = storage.bucket(bucketName).file(srcFileName);

        const readStream = file.createReadStream();

        let blob = Buffer.alloc(0);
        // console.log(blob);
        readStream
          .on('error', (err) => {
            console.error('Error reading the file:', err);
            reject(err);
          })
          .on('data', (chunk) => {
            blob = Buffer.concat([blob, chunk]); // Process the chunk (convert to string if text)
          })
          .on('end', () => {
            // console.log('File stream processing complete.', blob);
            resolve(blob.toString("base64"));
          });
      });
    }

    if (item.aadharLink !== undefined && item.aadharLink !== null) {
      const name = item.aadharLink.substring(56);
      resultList.aadharImage = await processBlobStream(`DMS/${name}`);
    }
    if (item.rcLink !== undefined && item.rcLink !== null) {
      const name = item.rcLink.substring(56);
      resultList.rcImage = await processBlobStream(`DMS/${name}`);
    }
    if (item.gstLink !== undefined && item.gstLink !== null) {
      const name = item.gstLink.substring(56);
      resultList.gstImage = await processBlobStream(`DMS/${name}`);
    }
    if (item.panLink !== undefined && item.panLink !== null) {
      const name = item.panLink.substring(56);
      resultList.panImage = await processBlobStream(`DMS/${name}`);
    }


    return resultList;
  } catch (err) {
    logger.error('Customer service getCustomerImages', err);
    next(err);
  }
}

const listCustomersMobile = async (reqData, user) => {
  try {
    let allData = {};

    const datas = await CustomerDao.listCustomersMobile(reqData, user);
    // console.log(datas)

    if (datas && datas.length > 0) {

      const data = datas[0];
      // console.log(data.pincodeDetails)
      let resCustomers = {};
      resCustomers['customerID'] = data.dataValues.id.toString();
      resCustomers['customerFirstName'] = data.dataValues.firstName;
      resCustomers['customerLastName'] = data.dataValues.lastName;
      resCustomers['customerCode'] = data.dataValues.customerCode;
      resCustomers['phoneNumber'] = data.dataValues.mobileNumber;
      resCustomers['emailId'] = data.dataValues.emailId;
      resCustomers['addressLine1'] = data.dataValues.address1;
      resCustomers['addressLine2'] = data.dataValues.address2;
      resCustomers['state'] = data.dataValues.state;
      //  resCustomers['state'] = data.pincodeDetails.cv_stateId.toString();
      resCustomers['city'] = data.dataValues.city;
      //  resCustomers['city'] = data.pincodeDetails.cv_cityId.toString();
      resCustomers['pinCode'] = data.dataValues.pinCode;
      resCustomers['source'] = data.dataValues.sourceId.toString();
      resCustomers['sourceType'] = data.dataValues.sourceTypeId.toString();
      resCustomers['contactPersonNumber'] = data.dataValues.contactPersonNumber;
      resCustomers['gstinNumber'] = data.dataValues.gstinNumber;
      resCustomers['customerCategory'] = data.dataValues.customerCategory === "B2B" ? "1" : "2";
      resCustomers['transportMobileNumber'] = data.dataValues.contactPersonNumber;
      resCustomers['transportName'] = data.dataValues.transportName;
      resCustomers['transportIncharge'] = data.dataValues.contactPerson;
      resCustomers['RJCTASL'] = data.dataValues.is_b2b === 1 ? true : false;

      allData = resCustomers;

    };

    return allData;
  } catch (err) {
    logger.error('Customer service listCustomers', err);
  }
};

const updateCustomer = async (id, customer, user, files) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  let resultLinks = [];
  let date = new Date();
  try {
    let customerExists = await CustomerDao.findByCustomerId(id);
    if (Array.isArray(customerExists)) {
      customerExists.forEach(async (element) => {
        const fieldsToMap = [
          { decryptedField: 'decryptedFirstName', originalField: 'firstName' },
          { decryptedField: 'decryptedLastName', originalField: 'lastName' },
          { decryptedField: 'decryptedMobileNumber', originalField: 'mobileNumber' },
          { decryptedField: 'decryptedEmailId', originalField: 'emailId' },
          { decryptedField: 'decryptedContactPerson', originalField: 'contactPerson' },
          { decryptedField: 'decryptedContactPersonNumber', originalField: 'contactPersonNumber' }
        ];

        fieldsToMap.forEach(field => {
          element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
          delete element.dataValues[field.decryptedField];
        });
      });
    } else if (customerExists && typeof customerExists === 'object') {
      const element = customerExists;
      const fieldsToMap = [
        { decryptedField: 'decryptedFirstName', originalField: 'firstName' },
        { decryptedField: 'decryptedLastName', originalField: 'lastName' },
        { decryptedField: 'decryptedMobileNumber', originalField: 'mobileNumber' },
        { decryptedField: 'decryptedEmailId', originalField: 'emailId' },
        { decryptedField: 'decryptedContactPerson', originalField: 'contactPerson' },
        { decryptedField: 'decryptedContactPersonNumber', originalField: 'contactPersonNumber' }
      ];

      fieldsToMap.forEach(field => {
        element.dataValues[field.originalField] = element.dataValues[field.decryptedField];
        delete element.dataValues[field.decryptedField];
      });
    } else {
      console.error("No customer data found");
    }

    if (customerExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Customer';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (customerExists.firstName != customer.firstName) {
        message =
          message +
          ' firstName changed from ' +
          customerExists.firstName +
          ' to ' +
          customer.firstName +
          ' ,';
      }
      if (customerExists.lastName != customer.lastName) {
        message =
          message +
          ' lastName changed from ' +
          customerExists.lastName +
          ' to ' +
          customer.lastName +
          ' ,';
      }
      if (customerExists.address1 != customer.address1) {
        message =
          message +
          ' address1 changed from ' +
          customerExists.address1 +
          ' to ' +
          customer.address1 +
          ' ,';
      }
      if (customerExists.address2 != customer.address2) {
        message =
          message +
          ' address2 changed from ' +
          customerExists.address2 +
          ' to ' +
          customer.address2 +
          ' ,';
      }
      if (customerExists.state != customer.state) {
        message =
          message +
          ' state changed from ' +
          customerExists.state +
          ' to ' +
          customer.state +
          ' ,';
      }
      if (customerExists.city != customer.city) {
        message =
          message +
          ' city changed from ' +
          customerExists.city +
          ' to ' +
          customer.city +
          ' ,';
      }
      if (customerExists.pinCode != customer.pinCode) {
        message =
          message +
          ' pinCode changed from ' +
          customerExists.pinCode +
          ' to ' +
          customer.pinCode +
          ' ,';
      }
      if (customerExists.mobileNumber != customer.mobileNumber) {
        message =
          message +
          ' mobileNumber changed from ' +
          customerExists.mobileNumber +
          ' to ' +
          customer.mobileNumber +
          ' ,';
      }
      if (customerExists.customerCategory != customer.customerCategory) {
        message =
          message +
          ' customerCategory changed from ' +
          customerExists.customerCategory +
          ' to ' +
          customer.customerCategory +
          ' ,';
      }
      if (customerExists.customerType != customer.customerType) {
        message =
          message +
          ' customerType changed from ' +
          customerExists.customerType +
          ' to ' +
          customer.customerType +
          ' ,';
      }
      if (customerExists.billType != customer.billType) {
        message =
          message +
          ' billType changed from ' +
          customerExists.billType +
          ' to ' +
          customer.billType +
          ' ,';
      }
      if (customerExists.emailId != customer.emailId) {
        message =
          message +
          ' emailId changed from ' +
          customerExists.emailId +
          ' to ' +
          customer.emailId +
          ' ,';
      }
      if (customerExists.contactPerson != customer.contactPerson) {
        message =
          message +
          ' contactPerson changed from ' +
          customerExists.contactPerson +
          ' to ' +
          customer.contactPerson +
          ' ,';
      }
      if (customerExists.contactPersonNumber != customer.contactPersonNumber) {
        message =
          message +
          ' contactPersonNumber changed from ' +
          customerExists.contactPersonNumber +
          ' to ' +
          customer.contactPersonNumber +
          ' ,';
      }
      if (customerExists.gstinNumber != customer.gstinNumber) {
        message =
          message +
          ' gstinNumber changed from ' +
          customerExists.gstinNumber +
          ' to ' +
          customer.gstinNumber +
          ' ,';
      }
      if (customerExists.transportName != customer.transportName) {
        message =
          message +
          ' transportName changed from ' +
          customerExists.transportName +
          ' to ' +
          customer.transportName +
          ' ,';
      }
      if (customerExists.fleetSize != customer.fleetSize) {
        message =
          message +
          ' fleetSize changed from ' +
          customerExists.fleetSize +
          ' to ' +
          customer.fleetSize +
          ' ,';
      }
      if (customerExists.status != customer.status) {
        message =
          message +
          ' status changed from ' +
          customerExists.status +
          ' to ' +
          customer.status +
          ' ,';
      }
      if (customerExists.organization != customer.organization) {
        message =
          message +
          ' organization changed from ' +
          customerExists.organization +
          ' to ' +
          customer.organization +
          ' ,';
      }
      if (customerExists.gender != customer.gender) {
        message =
          message
          +
          ' gender changed from ' +
          customer
            .gender +
          ' to ' +
          customer.gender +
          ' ,';
      }
      if (customerExists.maritalStatus != customer.maritalStatus) {
        message =
          message +
          ' maritalStatus changed from ' +
          customerExists.maritalStatus +
          ' to ' +
          customer.maritalStatus +
          ' ,';
      }
      if (customerExists.dateOfBirth != customer.dateOfBirth) {
        message =
          message +
          ' dateOfBirth changed from ' +
          customerExists.dateOfBirth +
          ' to ' +
          customer.dateOfBirth +
          ' ,';
      }
      if (customerExists.dateOfAnniversary != customer.dateOfAnniversary) {
        message =
          message +
          ' dateOfAnniversary changed from ' +
          customerExists.dateOfAnniversary +
          ' to ' +
          customer.dateOfAnniversary +
          ' ,';
      }
      if (customerExists.discountOptions != customer.discountOptions) {
        message =
          message +
          ' discountOptions changed from ' +
          customerExists.discountOptions +
          ' to ' +
          customer.discountOptions +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = {};

      if (customer.customerCategory === "B2C" && customer.customerCategory !== customerExists.customerCategory) {
        await deleteGcsImage(customerExists.gstLink?.substring(56));
        await deleteGcsImage(customerExists.panLink?.substring(56));
      }
      else if (customer.customerCategory === "B2B" && customer.customerCategory !== customerExists.customerCategory) {
        await deleteGcsImage(customerExists.aadharLink?.substring(56));
        await deleteGcsImage(customerExists.panLink?.substring(56));
        await deleteGcsImage(customerExists.rcLink?.substring(56));
      }

      if (!files) {
        data = await CustomerDao.updateCustomer(id, customer, user.id, customerExists, resultLinks);
      }
      else {
        const storage = new Storage({
          projectId: 'prj-stag-gobumpr-service-6567',
          keyFilename: 'prj-stag-gobumpr-service-6567.json',
        });

        const bucketName = 'bkt-dearo-prod'; // The name of your Cloud Storage bucket
        const bucket = storage.bucket(bucketName);

        for (const image of files) {

          if (image.fieldname === 'aadharFile' && customer.customerCategory === customerExists.customerCategory) {
            await deleteGcsImage(customerExists.aadharLink?.substring(56));
          }
          else if (image.fieldname === 'rcFile' && customer.customerCategory === customerExists.customerCategory) {
            await deleteGcsImage(customerExists.rcLink?.substring(56));
          }
          else if (image.fieldname === 'gstFile' && customer.customerCategory === customerExists.customerCategory) {
            await deleteGcsImage(customerExists.gstLink?.substring(56));
          }
          else if (image.fieldname === 'panFile' && customer.customerCategory === customerExists.customerCategory) {
            await deleteGcsImage(customerExists.panLink?.substring(56));
          }

          const buffer = image.buffer;
          let newName =
            date.getTime().toString() +
            Math.random().toString(36).slice(2, 7) +
            image.originalname.replace(/\ /g, '_');
          const blob = bucket.file(`DMS/${newName}`);
          const blobStream = blob.createWriteStream({
            resumable: false,
          });


          blobStream.on('error', (err) => {
            return "failed"
          });

          blobStream.on('finish', () => {
            // console.log(
            //   'file------------',
            //   `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
            // );
            const imageData = {
              name: image.fieldname,
              link: `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
            }

            resultLinks.push(imageData);
          });

          // Upload the file to Google Cloud Storage
          blobStream.end(buffer);

          await finishedPromise(blobStream);
        }
        // console.log(resultLinks);
        data = await CustomerDao.updateCustomer(id, customer, user.id, customerExists, resultLinks);
      }
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        result = 'success';
      }
    }
  } catch (err) {
    logger.error('Customer service updateCustomer', err);
    next(err);
  }
  return result;
};


const updateCustomerMobile = async (id, customer, user) => {
  try {
    let customerExists = await CustomerDao.findByCustomerId(id);
    if (customerExists) {
      let data = await CustomerDao.updateCustomerMobile(id, customer, user.id, user.outlet);
      return data;
    }
  } catch (err) {
    logger.error('Customer service updateCustomerMobile', err);
  }
};

const getAllCustomertypes = async () => {
  try {
    const data = await CustomerDao.getAllCustomertypes();
    return data;
  } catch (err) {
    logger.error('Customer service getAllCustomertypes', err);
    next(err);
  }
};
const getAllCustomercategory = async () => {
  try {
    const data = await CustomerDao.getAllCustomercategory();
    return data;
  } catch (err) {
    logger.error('Customer service getAllCustomercategory', err);
    next(err);
  }
};
const getAllBilltypes = async () => {
  try {
    const data = await CustomerDao.getAllBilltypes();
    return data;
  } catch (err) {
    logger.error('Customer service getAllBilltypes', err);
    next(err);
  }
};

const getAllCustomers = async (customerId) => {
  const resultList = [];
  try {
    const data = await CustomerDao.getAllCustomers(customerId);
    data.forEach(async (element) => {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['customerName'] = element.firstName + ' ' + element.lastName;
      resObj['customerCode'] = element.customerCode;
      resObj['status'] = element.status;
      resultList.push(resObj);
    });
    return resultList;
  } catch (err) {
    logger.error('Customer service getAllCustomers Error:', err);
    next(err);
  }
};


const getAllSearchedCustomers = async (payload) => {
  try {
    const data = await CustomerDao.getAllSearchedCustomers(payload);

    return data.map((element) => ({
      id: element.id,
      customerName: `${element.firstName || ''} ${element.lastName || ''}`.trim(),
      customerCode: element.customerCode,
      status: element.status,
    }));
  } catch (err) {
    logger.error('Customer service getAllSearchedCustomers Error:', err);
    throw err;
  }
};

const getCustomerData = async (customerCode) => {
  const resultList = [];
  try {
    const data = await CustomerDao.getCustomerData(customerCode);
    // console.log(data, "data")
    return data;
  } catch (err) {
    logger.error('Customer service getCustomerData Error:', err);
    next(err);
  }
};

const searchCustomer = async (reqData, user) => {
  const resultList = [];
  try {
    const data = await CustomerDao.searchCustomer(reqData, user);
    for (const element of data) {
      const resObj = {};
      resObj['id'] = element.id;
      resObj['customerCode'] = element.customerCode;
      resObj['address'] = element.address1 + ' ' + element.city;
      resObj['name'] = element.firstName + ' ' + element.lastName;
      resObj['outletId'] = element.outletId;
      resultList.push(resObj);
    }
    return resultList;
  } catch (err) {
    logger.error('Customer service searchCustomer', err);
    throw err;
  }
};

const deleteGcsImage = async (link) => {
  if (!link && link === "") {
    logger.error("Invalid link for deletion");
    return false;
  };

  try {
    const storage = new Storage({
      projectId: 'prj-stag-gobumpr-service-6567',
      keyFilename: 'prj-stag-gobumpr-service-6567.json',
    });

    const bucketName = 'bkt-dearo-prod'; // The name of your Cloud Storage bucket
    const bucket = storage.bucket(bucketName);

    await bucket.file(`DMS/${link}`).delete();
    logger.info(
      `deleted------------- https://storage.googleapis.com/${bucketName}/DMS/${link}`
    );
    return true;
  } catch (err) {
    logger.error(`Failed to delete image: ${err.message}`);
    return false;
  };
};

const approveCustomer = async (reqData, user) => {
  let data = {};
  try {
    data = await CustomerDao.approveCustomer(reqData, user);
  } catch (err) {
    logger.error('Customer service approveCustomer', err);
    throw err;
  }
  return data;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updatecustomervisit = async (req) => {
  try {
    const data = await CustomerDao.updatecustomervisit(req);
    if (data.status) {
      return {
        status: 'success',
        data: data
      }
    } else {
      return {
        status: 'failure'
      }
    }
  } catch (err) {
    logger.error('Customer service updatecustomervisit', err);
    throw err;
  }
}

const oracleCodeSearch = async (customerCode) => {
  try {
    const data = await CustomerDao.findOracleByCustomerCode(customerCode);
    return data;
  } catch (err) {
    logger.error('Customer service oracleCodeSearch', err);
    throw err;
  }
};

const oracleCodeUpdate = async (customerId, oracleCustomerCode, siteNumber) => {
  try {
    const result = await CustomerDao.updateOracleCode(customerId, oracleCustomerCode, siteNumber);
    return result;
  } catch (err) {
    logger.error('Customer service oracleCodeUpdate', err);
    throw err;
  }
};

const oracleCodeFetch = async (customerCode, mobileNumber) => {
  try {
    // Check if oracle data already exists
    const existing = await CustomerDao.findOracleByCustomerCode(customerCode);
    if (!existing) {
      return { success: false, message: 'Customer code not found' };
    }
    if (existing.oracleCustomerCode && existing.siteNumber) {
      return { success: false, message: 'Oracle Customer Code and Site Number is Already Available' };
    }

    // Call Oracle Cloud API
    const buName = 'Ki Mobility Solutions Services';
    const url = `https://tasl-prod-oic-nrykozbvnktn-bo.integration.ocp.oraclecloud.com:443/ic/api/integration/v1/flows/rest/INT002_DMS_CUSTOM_MASTER_OUTBOU/1.0/getcustomermasterdata?Date_From=&Date_To=&Bu_Name=${encodeURIComponent(buName)}&Account_Number=&Account_Description=${encodeURIComponent(customerCode)}&Mobile_Number=${encodeURIComponent(mobileNumber)}`;

    const response = await axios.get(url, {
      auth: {
        username: 'OICProdAdmin',
        password: '0!CpR0D@dm!n',
      },
      timeout: 30000,
    });
    
    // console.log('Oracle API Response:', JSON.stringify(response.data, null, 2)); 

    const oracleData = response.data;
    
    if (!oracleData?.data || oracleData.data.length === 0) {
      return { success: false, message: 'Oracle Customer code is Not Created in Oracle' };
    }

    const oracleCustomerCode = oracleData.data[0].accountNumber;
    const oracleSiteNumber = oracleData.data[0].siteNumber;

    if (!oracleCustomerCode || !oracleSiteNumber) {
      return { success: false, message: 'Oracle Customer code is Not Created in Oracle' };
    }

    // Update customer record
    await CustomerDao.updateOracleCode(existing.id, oracleCustomerCode, oracleSiteNumber);

    return { success: true, message: `Oracle Details Successfully Updated to ${customerCode}` };
  } catch (err) {
    logger.error('Customer service oracleCodeFetch', err);
    throw err;
  }
};

const CustomerService = {
  addCustomer,
  quickAddCustomer,
  searchCustomerVehicle,
  createPortalCustomer,
  quickAddVehicleForCustomer,
  updateCustomerVehicleDetails,
  updateCustomerVehicleInsurance,
  getCustomerVehicleNumbers,
  listCustomers,
  updateCustomer,
  getAllCustomertypes,
  getAllBilltypes,
  getAllCustomercategory,
  getAllCustomers,
  getCustomerData,
  searchCustomer,
  addBulkCustomer,
  validateBulkCustomer,
  addCustomerMobile,
  listCustomersMobile,
  updateCustomerMobile,
  approveCustomer,
  getAllSearchedCustomers,
  getCustomerImages,
  updatecustomervisit,
  oracleCodeSearch,
  oracleCodeUpdate,
  oracleCodeFetch
};

export default CustomerService;
