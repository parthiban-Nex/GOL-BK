import logger from '../../config/logger.js';
import VehicleDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import CustomerDao from '../customer/dao.js'
import MakeDao from '../make/dao.js'
import ModelDao from '../model/dao.js';
import VarientDao from '../varient/dao.js'
import xlsx from 'xlsx'



const validateBulkVehicle = async (req, user) => {
  let result = '';
  let successData = [];
  let exceptionData = [];
  let exceptionMessage = '';

  try {
    const filePath = req.file.buffer;
    const workbook = xlsx.read(filePath, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const element of sheetData) {
      try {
        const customerExists = await CustomerDao.findByCustomerCode(element.customer);
        const makeExists = await MakeDao.findByName(element.make);
        const modelExists = await ModelDao.findByName(element.model);
        const variantExists = await VarientDao.findByvarientName(element.variant);
        const vehicleExists = await VehicleDao.findByRegistrationNumber(element.registrationNumber);
        const chassisExists = await VehicleDao.findByChassisNumber(element.chassisNumber);
        const engineExists = await VehicleDao.findByEngineNumber(element.engineNumber);

        if (customerExists) {
          element['customerId'] = customerExists.id;
        } else {
          exceptionMessage = exceptionMessage + " Customer not exist,";
        }
        if (makeExists) {
          element['makeId'] = makeExists.id;
        } else {
          exceptionMessage = exceptionMessage + " Make does not exist,";
        }
        if (modelExists) {
          element['modelId'] = modelExists.id;
        } else {
          exceptionMessage = exceptionMessage + " Model does not exist,";
        }
        if (variantExists) {
          element['variantId'] = variantExists.id;
        } else {
          exceptionMessage = exceptionMessage + " Varient does not exist,";
        }

        if (vehicleExists) {
          exceptionMessage = exceptionMessage + " Vehicle already exist,";
        }
        if (chassisExists) {
          exceptionMessage = exceptionMessage + " Chassis already exist,";
        }
        if (engineExists) {
          exceptionMessage = exceptionMessage + " Engine already exist,";
        }


        if (
          customerExists &&
          makeExists &&
          modelExists &&
          variantExists &&
          !vehicleExists &&
          !chassisExists &&
          !engineExists
        ) {
          element['makeId'] = makeExists.id;
          element['modelId'] = modelExists.id;
          element['variantId'] = variantExists.id;
          element['customerId'] = customerExists.id;
          successData.push(element)
        } else {
          element['message'] = exceptionMessage
          exceptionData.push(element);
          exceptionMessage = '';
        }
      } catch (innerError) {
        exceptionData.push(element);
      }
    }

    result = successData.length > 0 ? 'success' : 'failed';
  } catch (err) {
    result = 'failed';
    console.log(err);
    logger.error('Error in addBulkVehicle:', err);
  }

  return { result, successData, exceptionData };
};


const addBulkVehicle = async (req, user) => {
  let result = '';
  let successData = [];
  let exceptionData = [];

  try {
    const filePath = req.file.buffer;
    const workbook = xlsx.read(filePath, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const element of sheetData) {
      try {
        const customerExists = await CustomerDao.findByCustomerCode(element.customer);
        const makeExists = await MakeDao.findByName(element.make);
        const modelExists = await ModelDao.findByName(element.model);
        const variantExists = await VarientDao.findByvarientName(element.variant);
        const vehicleExists = await VehicleDao.findByRegistrationNumber(element.registrationNumber);
        const chassisExists = await VehicleDao.findByChassisNumber(element.chassisNumber);
        const engineExists = await VehicleDao.findByEngineNumber(element.engineNumber);

        if (
          customerExists &&
          makeExists &&
          modelExists &&
          variantExists &&
          !vehicleExists &&
          !chassisExists &&
          !engineExists
        ) {
          element['makeId'] = makeExists.id;
          element['modelId'] = modelExists.id;
          element['variantId'] = variantExists.id;
          element['customerId'] = customerExists.id;

          const data = await VehicleDao.addVehicle(element, user.id);
          if (data) {
            successData.push(element);
          } else {
            exceptionData.push({ element, error: 'Failed to add vehicle' });
          }
        } else {
          exceptionData.push({ element, error: 'Validation failed' });
        }
      } catch (innerError) {
        exceptionData.push({ element, error: innerError.message });
      }
    }

    result = successData.length > 0 ? 'success' : 'failed';
  } catch (err) {
    result = 'failed';
    console.log(err);
    logger.error('Error in addBulkVehicle:', err);
  }

  return { result, successData, exceptionData };
};

const addVehicle = async (vehicle, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await VehicleDao.addVehicle(vehicle, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Vehicle';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        vehicle.registrationNumber + ' Vehicle is created ';
      const recent =
        await RecentAcivityService.addRecentActivity(recentActivityData);
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service addVehicle', err);
    next(err);
  }
  return result;
};

const createVehicle = async (vehicle, user) => {
  let result = '';
  let recentActivityData = {};
  try {
    let data = await VehicleDao.createVehicle(vehicle, user.id);
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Vehicle';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        vehicle.registrationNumber + ' Vehicle is created ';
      await RecentAcivityService.addRecentActivity(recentActivityData);
      result = { success: true, vehicleId: data };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service addVehicle', err);
    next(err);
  }
  return result;
};

const listVehicles = async (reqData, user) => {
  const resultList = [];
  try {
    const { totalItems, data } = await VehicleDao.listVehicles(reqData, user);
    data.forEach(async (element) => {
      const resObj = {};
      let firstName = element.dataValues.decryptedFirstName;
      let lastName = element.dataValues.decryptedLastName ? element.dataValues.decryptedLastName : '';
      resObj['id'] = element.id;
      resObj['registrationNumber'] = element.registrationNumber;
      resObj['fuelType'] = element.fuelType;
      resObj['odometer'] = element.odometer;
      resObj['address2'] = element.address2;
      resObj['chassisNumber'] = element.chassisNumber;
      resObj['engineNumber'] = element.engineNumber;
      resObj['color'] = element.color;
      resObj['insuranceName'] = element.insuranceName;
      resObj['insuranceExpDate'] = element.insuranceExpDate;
      resObj['status'] = element.status;
      resObj['customer'] = element.customer.customerCode;
      resObj['customerName'] = firstName + ' ' + lastName;
      resObj['make'] = element.make.makeName;
      resObj['model'] = element.model ? element.model.modelName : '';
      resObj['variant'] = element.variant.varientName;
      resObj['stageNorms'] = element.stageNorms;
      resObj['axle'] = element.axle;
      resObj['application'] = element.application;
      resObj['nextDueDateFC'] = element.nextDueDateFC;
      resObj['engineOilCapacity'] = element.engineOilCapacity;
      resObj['driverName'] = element.driverName;
      resObj['driverMobileNumber'] = element.driverMobileNumber;
      resObj['warrantyStatus'] = element.warrantyStatus === null ? null : element.warrantyStatus === true ? 1 : 0;
      resObj['dateOfSale'] = element.dateOfSale ? element.dateOfSale : null;
      resObj['dateOfRegistration'] = element.dateOfRegistration ? element.dateOfRegistration : null;
      resultList.push(resObj);
    });
    return {
      totalItems: totalItems,
      data: resultList,
    };
  } catch (err) {
    logger.error('Vehicle service listVehicles', err);
    next(err);
  }
};

const vehicleSearch = async (reqData, user) => {
  let vehicleDetails = [];
  let customerDetails = [];
  try {
    let data = await VehicleDao.vehicleSearch(reqData, user.id);
    // console.log('from servie  ',data.length)

    if (!data || data.length === 0) {
      // Nothing to process
      return {
        vehicleDetails: [],
        customerDetails: []
      };
    }


    for (const element of data) {
      console.log("Vehicle Record:", JSON.stringify(element));

      // data.forEach(async (element) => {
      const resVehicles = {};

      resVehicles['vehicleID'] = element.id.toString();
      resVehicles['vehicleNumber'] = element.registrationNumber;
      resVehicles['chassisNumber'] = element.chassisNumber;
      resVehicles['engineNumber'] = element.engineNumber;
      resVehicles['makeId'] = element.make.id.toString();
      resVehicles['modelId'] = element.model.id.toString();
      resVehicles['variantId'] = element.variant.id.toString();
      resVehicles['segment'] = element.model.segment.toString();
      resVehicles['odometerReading'] = element.odometer.toString();
      resVehicles['insuranceProvider'] = element.insuranceNameDetails.id.toString();
      resVehicles['insuranceExpDate'] = element.insuranceExpDate;
      resVehicles['fuelType'] = element.fuelTypeDetails.id.toString();

      vehicleDetails.push(resVehicles);
      // });


      const resCustomers = {};
      const fieldsToMap = [
        { decryptedField: 'decryptedFirstName', originalField: 'firstName' },
        { decryptedField: 'decryptedLastName', originalField: 'lastName' },
        { decryptedField: 'decryptedMobileNumber', originalField: 'mobileNumber' },
        { decryptedField: 'decryptedEmailId', originalField: 'emailId' },
        { decryptedField: 'decryptedContactPerson', originalField: 'contactPerson' },
        { decryptedField: 'decryptedContactPersonNumber', originalField: 'contactPersonNumber' }
      ];

      fieldsToMap.forEach(field => {
        data[0].customer.dataValues[field.originalField] = data[0].customer.dataValues[field.decryptedField];
        delete data[0].customer.dataValues[field.decryptedField];
      });

      resCustomers['customerID'] = data[0].customer.dataValues.id.toString();
      resCustomers['customerFirstName'] = data[0].customer.dataValues.firstName;
      resCustomers['customerLastName'] = data[0].customer.dataValues.lastName;
      resCustomers['customerCode'] = data[0].customer.dataValues.customerCode;
      resCustomers['phoneNumber'] = data[0].customer.dataValues.mobileNumber;
      resCustomers['emailId'] = data[0].customer.dataValues.emailId;
      resCustomers['addressLine1'] = data[0].customer.dataValues.address1;
      resCustomers['addressLine2'] = data[0].customer.dataValues.address2;
      // resCustomers['state1'] = data[0].customer.dataValues.state;
      resCustomers['state'] = data[0].customer.pincodeDetails.cv_stateId.toString();
      // resCustomers['city'] = data[0].customer.dataValues.city;
      resCustomers['city'] = data[0].customer.pincodeDetails.cv_cityId.toString();
      resCustomers['pinCode'] = data[0].customer.dataValues.pinCode;
      resCustomers['source'] = data[0].customer.dataValues.sourceId.toString();
      resCustomers['sourceType'] = data[0].customer.dataValues.sourceTypeId.toString();
      resCustomers['gstinNumber'] = data[0].customer.dataValues.gstinNumber;
      resCustomers['customerCategory'] = data[0].customer.dataValues.customerCategory === "B2B" ? "1" : "2";
      resCustomers['contactPersonNumber'] = data[0].customer.dataValues.contactPersonNumber != "" ? data[0].customer.dataValues.contactPersonNumber : "null";
      resCustomers['transportMobileNumber'] = data[0].customer.dataValues.contactPersonNumber;
      resCustomers['transportName'] = data[0].customer.dataValues.transportName;
      resCustomers['transportIncharge'] = data[0].customer.dataValues.contactPerson;

      customerDetails.push(resCustomers);

    };



    return {
      vehicleDetails,
      customerDetails
    };

  } catch (err) {
    logger.error('Vehicle service vehicleSearch', err);
  }
};

// const vehicleSearch = async (reqData, user) => {
//   let vehicleDetails = [];
//   let customerDetails = [];
//   try {
//     let data = await VehicleDao.vehicleSearch(reqData, user.id);

//     data.forEach(async (element) => {
//       const resVehicles = {};

//       resVehicles['vehicleID'] = element.id.toString();
//       resVehicles['vehicleNumber'] = element.registrationNumber;
//       resVehicles['chassisNumber'] = element.chassisNumber;
//       resVehicles['engineNumber'] = element.engineNumber;
//       resVehicles['makeId'] = element.make.id.toString();
//       resVehicles['modelId'] = element.model.id.toString();
//       resVehicles['variantId'] = element.variant.id.toString();
//       resVehicles['segment'] = element.variant.id.toString();
//       resVehicles['odometerReading'] = element.odometer.toString();
//       resVehicles['insuranceProvider'] = element.insuranceName;
//       resVehicles['insuranceExpDate'] = element.insuranceExpDate;

//       vehicleDetails.push(resVehicles);
//     });

//     if (!reqData.customerId) {
//       data.forEach((item) => {
//         const resCustomers = {};

//         const fieldsToMap = [
//           { decryptedField: 'decryptedFirstName', originalField: 'firstName' },
//           { decryptedField: 'decryptedLastName', originalField: 'lastName' },
//           { decryptedField: 'decryptedMobileNumber', originalField: 'mobileNumber' },
//           { decryptedField: 'decryptedEmailId', originalField: 'emailId' },
//           { decryptedField: 'decryptedContactPerson', originalField: 'contactPerson' },
//           { decryptedField: 'decryptedContactPersonNumber', originalField: 'contactPersonNumber' }
//         ];

//         fieldsToMap.forEach(field => {
//           item.customer.dataValues[field.originalField] = item.customer.dataValues[field.decryptedField];
//           delete item.customer.dataValues[field.decryptedField];
//         });

//         resCustomers['customerID'] = item.customer.dataValues.id.toString();
//         resCustomers['customerFirstName'] = item.customer.dataValues.firstName;
//         resCustomers['customerLastName'] = item.customer.dataValues.lastName;
//         resCustomers['customerCode'] = item.customer.dataValues.customerCode;
//         resCustomers['phoneNumber'] = item.customer.dataValues.mobileNumber;
//         resCustomers['emailId'] = item.customer.dataValues.emailId;
//         resCustomers['addressLine1'] = item.customer.dataValues.address1;
//         resCustomers['addressLine2'] = item.customer.dataValues.address2;
//         resCustomers['state'] = item.customer.dataValues.state;
//         resCustomers['city'] = item.customer.dataValues.city;
//         resCustomers['pinCode'] = item.customer.dataValues.pinCode;
//         resCustomers['contactPersonNumber'] = item.customer.dataValues.contactPersonNumber;
//         resCustomers['gstinNumber'] = item.customer.dataValues.gstinNumber ?? null;
//         resCustomers['customerCategory'] = item.customer.dataValues.customerCategory === "B2B" ? "1" : "2";

//         customerDetails.push(resCustomers);
//       });
//     } else {
//       const resCustomers = {};
//       const fieldsToMap = [
//         { decryptedField: 'decryptedFirstName', originalField: 'firstName' },
//         { decryptedField: 'decryptedLastName', originalField: 'lastName' },
//         { decryptedField: 'decryptedMobileNumber', originalField: 'mobileNumber' },
//         { decryptedField: 'decryptedEmailId', originalField: 'emailId' },
//         { decryptedField: 'decryptedContactPerson', originalField: 'contactPerson' },
//         { decryptedField: 'decryptedContactPersonNumber', originalField: 'contactPersonNumber' }
//       ];

//       fieldsToMap.forEach(field => {
//         data[0].customer.dataValues[field.originalField] = data[0].customer.dataValues[field.decryptedField];
//         delete data[0].customer.dataValues[field.decryptedField];
//       });

//       resCustomers['customerID'] = data[0].customer.dataValues.id.toString();
//       resCustomers['customerFirstName'] = data[0].customer.dataValues.firstName;
//       resCustomers['customerLastName'] = data[0].customer.dataValues.lastName;
//       resCustomers['customerCode'] = data[0].customer.dataValues.customerCode;
//       resCustomers['phoneNumber'] = data[0].customer.dataValues.mobileNumber;
//       resCustomers['emailId'] = data[0].customer.dataValues.emailId;
//       resCustomers['addressLine1'] = data[0].customer.dataValues.address1;
//       resCustomers['addressLine2'] = data[0].customer.dataValues.address2;
//       resCustomers['state'] = data[0].customer.dataValues.state;
//       resCustomers['city'] = data[0].customer.dataValues.city;
//       resCustomers['pinCode'] = data[0].customer.dataValues.pinCode;
//       resCustomers['contactPersonNumber'] = data[0].customer.dataValues.contactPersonNumber;
//       resCustomers['gstinNumber'] = data[0].customer.dataValues.gstinNumber?? null;
//       resCustomers['customerCategory'] = data[0].customer.dataValues.customerCategory === "B2B" ? "1" : "2";

//       customerDetails.push(resCustomers);
//     }

//     if (vehicleDetails.length > 1 || vehicleDetails.length === 0) {
//       return {
//         vehicleDetails,
//         customerDetails
//       };
//     } else {
//       return {
//         vehicleDetails: vehicleDetails[0],
//         customerDetails: customerDetails[0]
//       };
//     }

//   } catch (err) {
//     logger.error('Vehicle service vehicleSearch', err);
//   }
// };

const updateVehicle = async (id, vehicle, user) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    const vehicleExists = await VehicleDao.findByVehicleId(id);
    if (vehicleExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Vehicle';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (vehicleExists.registrationNumber != vehicle.registrationNumber) {
        message =
          message +
          ' registrationNumber changed from ' +
          vehicleExists.registrationNumber +
          ' to ' +
          vehicle.registrationNumber +
          ' ,';
      }
      if (vehicleExists.fuelType != vehicle.fuelType) {
        message =
          message +
          ' fuelType changed from ' +
          vehicleExists.fuelType +
          ' to ' +
          vehicle.fuelType +
          ' ,';
      }
      if (vehicleExists.odometer != vehicle.odometer) {
        message =
          message +
          ' odometer changed from ' +
          vehicleExists.odometer +
          ' to ' +
          vehicle.odometer +
          ' ,';
      }
      if (vehicleExists.chassisNumber != vehicle.chassisNumber) {
        message =
          message +
          ' chassisNumber changed from ' +
          vehicleExists.chassisNumber +
          ' to ' +
          vehicle.chassisNumber +
          ' ,';
      }
      if (vehicleExists.engineNumber != vehicle.engineNumber) {
        message =
          message +
          ' engineNumber changed from ' +
          vehicleExists.engineNumber +
          ' to ' +
          vehicle.engineNumber +
          ' ,';
      }
      if (vehicleExists.color != vehicle.color) {
        message =
          message +
          ' color changed from ' +
          vehicleExists.color +
          ' to ' +
          vehicle.color +
          ' ,';
      }
      if (vehicleExists.insuranceName != vehicle.insuranceName) {
        message =
          message +
          ' insuranceName changed from ' +
          vehicleExists.insuranceName +
          ' to ' +
          vehicle.insuranceName +
          ' ,';
      }
      if (vehicleExists.insuranceExpDate != vehicle.insuranceExpDate) {
        message =
          message +
          ' insuranceExpDate changed from ' +
          vehicleExists.insuranceExpDate +
          ' to ' +
          vehicle.insuranceExpDate +
          ' ,';
      }
      if (vehicleExists.status != vehicle.status) {
        message =
          message +
          ' status changed from ' +
          vehicleExists.status +
          ' to ' +
          vehicle.status +
          ' ,';
      }

      if (vehicleExists.dateOfSale != vehicle.dateOfSale) {
        message =
          message +
          ' dateOfSale changed from ' +
          vehicleExists.dateOfSale +
          ' to ' +
          vehicle.dateOfSale +
          ' ,';
      }
      if (vehicleExists.dateOfRegistration != vehicle.dateOfRegistration) {
        message =
          message +
          ' dateOfRegistration changed from ' +
          vehicleExists.dateOfRegistration +
          ' to ' +
          vehicle.dateOfRegistration +
          ' ,';
      }

      message = message.slice(0, -1);
      let data = await VehicleDao.updateVehicle(id, vehicle, user.id);
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
    logger.error('Vehicle service updateVehicle', err);
    next(err);
  }
  return result;
};

const updateVehicleMobile = async (id, vehicle, user) => {
  try {
    const vehicleExists = await VehicleDao.findByVehicleId(id);
    if (vehicleExists) {
      let data = await VehicleDao.updateVehicleMobile(id, vehicle, user.id);
      return data;
    }
  } catch (err) {
    logger.error('Vehicle service updateVehicle', err);
    next(err);
  }
};

const getAllVechicleColors = async () => {
  try {
    const data = await VehicleDao.getAllVechicleColors();
    return data;
  } catch (err) {
    logger.error('Vehicle service getAllVechicleColors', err);
    next(err);
  }
};

const addVehicleTest = async (user) => {
  let count = 1000;
  const vehicles = [];

  for (let i = 0; i < count; i++) {
    const vehicle = {
      customerId: 21 + i,
      registrationNumber: `TN${Math.floor(1000 + Math.random() * 9000)}AL${1000 + i}`, // Ensures unique registrationNumber
      makeId: 6,
      modelId: 6,
      variantId: 1,
      fuelType: 'petrol',
      odometer: (Math.floor(Math.random() * 10000) + 1).toString(),
      chassisNumber: `TESTCHASSIS${1000 + i}`,
      engineNumber: `TESTENGINE${1000 + i}`,
      insuranceName: 'TestInsurance',
      insuranceExpDate: '31-03-2030',
      color: 'black',
      status: true,
    };

    vehicles.push(vehicle);
  }

  // Add vehicles in bulk to test performance
  for (let i = 0; i < vehicles.length; i++) {
    try {
      await VehicleDao.addVehicleTest(vehicles[i], user.id);
      console.log(`Vehicle ${i + 1} added successfully`);
    } catch (error) {
      console.error(`Error adding vehicle ${i + 1}:`, error);
    }
  }

  console.log(`All ${vehicles.length} vehicles added.`);
};

const getVehicleDetails = async (registrationNumber) => {
  const resultList = [];
  const resObj = {};
  try {
    const data = await VehicleDao.getVehicleDetails(registrationNumber);
    if (data) {
      const customerName = [
        data.dataValues.decryptedFirstName,
        data.dataValues.decryptedLastName,
      ].filter(Boolean).join(' ');
      const customerData = {
        customerId: data.customer.id,
        name: customerName,
        mobileNumber: data.dataValues.decryptedMobileNumber,
        emailId: data.dataValues.decryptedEmailId,
        address1: data.customer.address1,
        address2: data.customer.address2,
        state: data.customer.state,
        city: data.customer.city,
        pinCode: data.customer.pinCode,
        customerCategory: data.customer.customerCategory,
        customerType: data.customer.customerType,
        billType: data.customer.billType,
        customerCode: data.customer.customerCode,
        gstinNumber: data.customer.gstinNumber,
      };

      resObj['registrationNumber'] = data.registrationNumber;
      resObj['vehicleId'] = data.id;
      resObj['makeId'] = data.makeId;
      resObj['modelId'] = data.modelId;
      resObj['modelSegment'] = data.model.segment;
      resObj['customeId'] = data.customer.id;
      resObj['customerName'] = customerData.name;
      resObj['customerMobileNumber'] = customerData.mobileNumber;
      resObj['customerEmailId'] = customerData.emailId;
      resObj['customerAddress'] = data.customer.address1;
      resObj['customerState'] = data.customer.state;
      resObj['customerCity'] = data.customer.city;
      resObj['pincode'] = data.customer.pinCode;
      resObj['customerData'] = customerData;
      resObj['insurance'] = data.insuranceName;
      resObj['insuranceExpDate'] = data.insuranceExpDate;
      resObj['application'] = data.application;
      resObj['stageNorms'] = data.stageNorms;
      resObj['nextDueDateFC'] = data.nextDueDateFC;
      resObj['engineNumber'] = data.engineNumber;
      resObj['gstinNumber'] = data.customer.gstinNumber;
      resObj['customerStatus'] = 2;
      resObj['message'] = 'Existing customer';
    } else {
      resObj['customerStatus'] = 1;
      resObj['message'] = 'New customer';
    }
    resultList.push(resObj);
  } catch (err) {
    logger.error('Vehicle service getVehicleDetails', err);
    next(err);
  }
  return resultList;
};

const listVehiclesForCustomerComplaint = async (reqData, user) => {
  const resultList = [];
  try {
    const  data = await VehicleDao.listVehicleForCustomerComplaint(reqData, user);

    console.log('listVehiclesForCustomerComplaint service  ',data)
    data.forEach(async (element) => {
      const resObj = {};
      
      resObj['registrationNumber'] = element.registrationNumber;
      resObj['customerName'] = element.customer.firstName + ' ' + element.customer.lastName;
      
      resultList.push(resObj);
    });
    return resultList
  } catch (err) {
    logger.error('Vehicle service listVehicles for customer complaint', err);
    next(err);
  }
};
const searchGateinVehicleStatus = async (req) => {
  const searchGateinVehicleStatus = await VehicleDao.searchGateinVehicleStatus(req);
  if (searchGateinVehicleStatus.success) {
    return {
      success: searchGateinVehicleStatus.success,
      status: searchGateinVehicleStatus.status,
      allowRegister: searchGateinVehicleStatus.allowRegister,
      VisitId: searchGateinVehicleStatus.visitId ? searchGateinVehicleStatus.visitId : "",
      message: searchGateinVehicleStatus.message
    }
  } else {
    return {
      success: searchGateinVehicleStatus.success,
      allowRegister: false
    }
  }
}

const saveCustomerVoice = async (req) => {
  let result = '';
  try {
    const data = await VehicleDao.saveCustomerVoice(req);
    // console.log("data->",data);
    if (data.status) {
      result = { success: true, data: data };
    } else if (data.status == "Error") {
      result = { success: false, message: data.message };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service saveCustomerVoice', err);
  }
  return result;
}

const managerassignsa = async (req) => {
  const saAssigned = await VehicleDao.managerassignsa(req);

  if (saAssigned.status) {
    return {
      success: true
    }
  } else {
    return {
      success: false
    }
  }
}
const managergateinassignsa = async (req) => {
  const saAssigned = await VehicleDao.managergateinassignsa(req);

  if (saAssigned.status) {
    return {
      success: true
    }
  } else {
    return {
      success: false
    }
  }
}

const updatebookingdetails = async (req) => {
  const saAssigned = await VehicleDao.updatebookingdetails(req);

  if (saAssigned.status) {
    return {
      success: true
    }
  } else {
    return {
      success: false
    }
  }
}

const saveSecurityGateIn = async (req) => {
  let result = '';
  try {
    const data = await VehicleDao.saveSecurityGateIn(req);
    if (data) {
      result = { success: true, data: data };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service saveSecurityGateIn', err);
    next(err);
  }
  return result;
}

const saveSecurityGateOut = async (req) => {
  let result = '';
  try {
    const data = await VehicleDao.saveSecurityGateOut(req);
    // console.log("data->",data);
    if (data.status) {
      result = { success: true, data: data };
    } else if (data.status == false) {
      result = { success: false, message: data.message };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service saveSecurityGateOut', err);
  }
  return result;
}

const getsecuritytasklist = async (req) => {
  let GateinDetails = [];
  let GateoutDetails = [];
  console.log("two");
  try {
    const data = await VehicleDao.getsecuritytasklist(req);
    console.log("data->", data);
    if (data.status) {

      GateinDetails = data.securitytasklist.map(securitytasklist => {


        const date = new Date(securitytasklist.createdAt);

        const formatted =
          date.getFullYear() + "-" +
          String(date.getMonth() + 1).padStart(2, '0') + "-" +
          String(date.getDate()).padStart(2, '0') + " " +
          String(date.getHours()).padStart(2, '0') + ":" +
          String(date.getMinutes()).padStart(2, '0') + ":" +
          String(date.getSeconds()).padStart(2, '0');
        return {
          VisitId: securitytasklist.id,
          Vehicle_Number: securitytasklist.reg_no,
          Kilometer: securitytasklist.odometer,
          Make_Id: securitytasklist.vehicleDetails.makeId,
          Model_Id: securitytasklist.vehicleDetails.modelId,
          Assigned_SA: securitytasklist?.assigned_sa_id || "",
          TimeStamp: formatted
        }
      });

      GateoutDetails = data.gateOutSecurity.map(gateOutSecurity => {

        const date = new Date(gateOutSecurity.createdAt);

        const formatted =
          date.getFullYear() + "-" +
          String(date.getMonth() + 1).padStart(2, '0') + "-" +
          String(date.getDate()).padStart(2, '0') + " " +
          String(date.getHours()).padStart(2, '0') + ":" +
          String(date.getMinutes()).padStart(2, '0') + ":" +
          String(date.getSeconds()).padStart(2, '0');

        return {
          VisitId: gateOutSecurity.id,
          Vehicle_Number: gateOutSecurity.reg_no,
          Kilometer: gateOutSecurity.odometer,
          Make_Id: gateOutSecurity.vehicleDetails.makeId,
          Model_Id: gateOutSecurity.vehicleDetails.modelId,
          Assigned_SA: gateOutSecurity?.assigned_sa_id || "",
          TimeStamp: formatted
        }
      });

      return {
        success: true,
        GateinDetails: GateinDetails,
        GateoutDetails: GateoutDetails
      }

    } else if (data.status == "Error") {
      result = { success: false, message: data.message };
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service getsecuritytasklist', err);
  }
}

const getVahanData = async (req) => {
  let FLAResponse = {};

  try {
    const results = await VehicleDao.getVahanData(req);
    // console.log("data->",data);
    if (results.FLAPresent) {
      if (Object.keys(results.FLAResponseServer).length > 0) {
        const FLAData = results.FLAResponseServer;

        FLAResponse = {
          status: FLAData.status,
          found_by: FLAData.found_by,
          timestamp: FLAData.timestamp,
          error_code: FLAData.error_code,
          description: FLAData.description,
          vehicleClass: FLAData.vehicleClass,
          vehicleClassStatus: FLAData.vehicleClassStatus,
          apiSuccess: FLAData.apiSuccess,
          httpcode: FLAData.httpcode,
          result: FLAData.results[0]
        }
      } else if (Object.keys(results.FLAResponseModel).length > 0) {
        const FLAData = results.FLAResponseModel;

        const now = new Date();
        const timestamp = now.toString(); // Example: "Fri Nov 07 2025 12:42:55 GMT+0530 (India Standard Time)"

        // To make it look exactly like: Fri Nov 07 12:42:55 IST 2025
        const formatted = timestamp
          .replace("GMT+0530 (India Standard Time)", "IST");

        FLAResponse = {
          status: "100",
          found_by: "regn_no",
          timestamp: formatted,
          description: "Record found",
          apiSuccess: "true",
          httpcode: "200",
          result: {
            vehicle: {
              regn_no: req.VehicleRegNo,
              state_cd: FLAData.VEHICLE_STATE_CODE,
              rto_cd: FLAData.VEHICLE_RTO_CODE,
              rto_name: FLAData.VEHICLE_RTO_NAME,
              chasi_no: FLAData.VEHICLE_CHASI_NO,
              eng_no: FLAData.VEHICLE_ENGINE_NO,
              regn_dt: FLAData.VEHICLE_REGISTERED_DATE,
              vehicle_age: FLAData.VEHICLE_AGE,
              purchase_dt: FLAData.VEHICLE_PURCHASE_DATE,
              vh_class_desc: FLAData.VEHICLE_CLASS_DESCRIPTION,
              owner_sr: FLAData.VEHICLE_OWNER_SR,
              pucc_no: FLAData.VEHICLE_PUCC_NO,
              p_address: FLAData.VEHICLE_PERMANENT_ADDRESS,
              C_address: FLAData.VEHICLE_CURRENT_ADDRESS,
              maker_desc: FLAData.VEHICLE_MAKE,
              maker_model: FLAData.VEHICLE_MODEL,
              color: FLAData.VEHICLE_COLOR,
              fuel_type_desc: FLAData.VEHICLE_FUEL_TYPE,
              cubic_cap: FLAData.VEHICLE_CUBIC_CAPACITY,
              manu_yr: FLAData.VEHICLE_MANUFACTURE_YEAR,
              seat_cap: FLAData.VEHICLE_SEAT_CAPACITY,
              fla_rto_geo: FLAData.VEHICLE_FLA_RTO_GEO,
              blacklist_flag: FLAData.VEHICLE_BLACKLIST_FLAG,
              blacklist_status: FLAData.VEHICLE_BLACKLIST_STATUS,
              fit_upto: FLAData.VEHICLE_FIT_UPTO,
              manu_month_yr: FLAData.VEHICLE_MANUFACTURE_MONTH_YEAR,
              noc_details: FLAData.VEHICLE_NOC_DETAILS,
              permit_issue_dt: FLAData.VEHICLE_PERMIT_ISSUE_DATE,
              permit_no: FLAData.VEHICLE_PERMIT_NUMBER,
              permit_type: FLAData.VEHICLE_PERMIT_TYPE,
              commercial_flag: FLAData.VEHICLE_COMMERCIAL_FLAG,
              permit_valid_from: FLAData.VEHICLE_PERMIT_VALID_FROM,
              permit_valid_upto: FLAData.VEHICLE_PERMIT_VALID_UPTO,
              pucc_upto: FLAData.VEHICLE_PUCC_UPTO,
              registered_at: FLAData.VEHICLE_REGISTERED_AT,
              tax_upto: FLAData.VEHICLE_TAX_UPTO,
              father_name: FLAData.VEHICLE_FATHER_NAME,
              owner_name: FLAData.VEHICLE_OWNER_NAME,
            },
            hypth: {
              fncr_name: FLAData.HYPTH_FNCR_NAME,
              pucc_no: FLAData.HYPTH_PUCC_NO
            },
            insurance: {
              insurance_policy_no: FLAData.INSURANCE_POLICY_NUMBER,
              insurance_expired: FLAData.INSURANCE_ISEXPIRED,
              pucc_no: FLAData.INSURANCE_PUCC_NO,
              insurance_comp: FLAData.INSURANCE_COMPANY,
              insurance_upto: FLAData.INSURANCE_EXPIRY_DATE,
            },
          }
        }
      }
    }

    if (results.status) {
      if (Object.keys(FLAResponse).length > 0) {
        return {
          success: true,
          vahanData: FLAResponse
        }
      } else {
        return {
          success: false,
          message: "No data found"
        }
      }
    } else {
      return {
        success: false,
        message: "No data found"
      }
    }
  } catch (err) {
    result = 'failed';
    logger.error('Vehicle service getVahanData', err);
  }
}

const getvehiclehistory = async (req) => {
  let VisitDetails = [];
  let Estimation = [];

  try {
    const results = await VehicleDao.getvehiclehistory(req);

    if (results.status) {

      if (results.vehicleDetails) {
        VisitDetails = results.vehicleDetails.map(VisitDetails => {

          let PartsEstimationDetails = [];
          let LabourEstimationDetails = [];
          let OSLEstimationDetails = [];


          if (VisitDetails.partsIndent && VisitDetails.partsIndent.length > 0) {
            PartsEstimationDetails = VisitDetails.partsIndent.map(EstimationDetails => ({
              ESTIMATE_ID: VisitDetails.service_estimate_id,
              ESTIMATION_APPROVAL_STATUS: EstimationDetails.status,
              ESTIMATION_TYPE: "PARTS",
              ESTIMATION_OBJECT_ID: EstimationDetails.item_code,
              UPDATED_DATETIME: EstimationDetails.updatedAt,
              ESTIMATION_OBJECT: {
                id: EstimationDetails,
                igst: EstimationDetails.igst,
                rate: EstimationDetails.amount,
                partId: EstimationDetails.item_id,
                partNo: EstimationDetails.item_code,
                status: EstimationDetails.status,
                hsnCode: EstimationDetails.hsn_code,
                partTotal: EstimationDetails.part_total,
                discountAmount: "",
                partDescription: EstimationDetails.item_name,
                additionalMargin: "",
                requestedQuantity: EstimationDetails.received_quantity,
                serviceRecommendation: false
              }
            }))

            Estimation.push(PartsEstimationDetails)
          }

          return {
            VISIT_ID: VisitDetails.id,
            JC_NUMBER: VisitDetails?.job_card_no || "",
            USER_NAME: VisitDetails.user_sa.employee.employeeName,
            STATE: VisitDetails.pincodeDetailsJoCard[0].cv_stateId,
            ASSIGNED_SA_USER_ID: VisitDetails.user_sa.user_id,
            CREATED_DATE: VisitDetails.createdAt,
            OUTLET_NAME: VisitDetails.outlet.outletName,
            OUTLET_ADDRESS: VisitDetails.outlet.address1 + " " + VisitDetails.outlet.address2
          }
        })
      }

      if (Object.keys(VisitDetails).length > 0) {
        return {
          success: true,
          VisitDetails: VisitDetails
        }
      } else {
        return {
          success: false,
          message: results.message
        };
      }
    } else {
      return {
        success: false,
        message: results.message
      };
    }

  } catch (err) {
    return {
      success: true,
    }
    logger.error('Vehicle service getvehiclehistory', err);
  }
}

const getvehiclehistorybyvisitid = async (req) => {

  let VisitDetails = {};
  let Estimation = [];
  const results = await VehicleDao.getvehiclehistorybyvisitid(req);

  if (results.status) {

    VisitDetails = {
      CUSTOMER_VOICE: results.vehicleDetails?.customer_voice || "",
      ASSIGNED_TECH_USER_ID: results.vehicleDetails.user_tech.user_id,
      ASSIGNED_SA_USER_ID: results.vehicleDetails.user_sa.user_id,
      OUTLET_NAME: results.vehicleDetails.outlet.outletName,
      OUTLET_ADDRESS: `${results.vehicleDetails?.outlet?.address1 || ""} ${results.vehicleDetails?.outlet?.address2 || ""}`,
      VEHICLE_KM_READING: results.vehicleDetails.odometer
    };

    if (results.vehicleDetails.partsIndent && results.vehicleDetails.partsIndent.length > 0) {
      Estimation.push(...results.vehicleDetails.partsIndent.map(EstimationDetails => ({
        ESTIMATE_ID: EstimationDetails.id,
        ESTIMATION_APPROVAL_STATUS: EstimationDetails.status,
        ESTIMATION_TYPE: "PARTS",
        ESTIMATION_OBJECT_ID: EstimationDetails.item_code,
        UPDATED_DATETIME: EstimationDetails.updatedAt,
        ESTIMATION_OBJECT: {
          id: EstimationDetails.id,
          igst: EstimationDetails.igst,
          rate: EstimationDetails.amount,
          partId: EstimationDetails.item_id,
          partNo: EstimationDetails.item_code,
          status: EstimationDetails.status,
          hsnCode: EstimationDetails.hsn_code,
          partTotal: EstimationDetails.part_total,
          discountAmount: "",
          partDescription: EstimationDetails.item_name,
          additionalMargin: "",
          requestedQuantity: EstimationDetails.received_quantity,
          serviceRecommendation: false
        }
      })))
    }

    if (results.vehicleDetails.schedules && results.vehicleDetails.schedules.length > 0) {
      Estimation.push(...results.vehicleDetails.schedules.map(EstimationDetails => ({
        ESTIMATE_ID: EstimationDetails.id,
        ESTIMATION_APPROVAL_STATUS: EstimationDetails.status,
        ESTIMATION_TYPE: "LABOUR",
        ESTIMATION_OBJECT_ID: EstimationDetails.rot_code,
        UPDATED_DATETIME: EstimationDetails.updatedAt,
        ESTIMATION_OBJECT: {
          id: EstimationDetails.id,
          igst: EstimationDetails.igst,
          rate: 0.0,
          laborId: EstimationDetails.rot_id,
          sacCode: "",
          quantity: EstimationDetails.quantity,
          laborCode: EstimationDetails.rot_code,
          laborTotal: EstimationDetails.laborTotal,
          singleAmount: EstimationDetails.singleAmount,
          discountAmount: EstimationDetails.discount_percentage,
          additionalMargin: EstimationDetails.additionalMargin,
          laborDescription: EstimationDetails.description,
          serviceRecommendation: false
        }
      })))
    }

    if (results.vehicleDetails.oslSchedules && results.vehicleDetails.oslSchedules.length > 0) {
      Estimation.push(...results.vehicleDetails.oslSchedules.map(EstimationDetails => ({
        ESTIMATE_ID: EstimationDetails.id,
        ESTIMATION_APPROVAL_STATUS: EstimationDetails.status,
        ESTIMATION_TYPE: "OSL",
        ESTIMATION_OBJECT_ID: EstimationDetails.rot_code,
        UPDATED_DATETIME: EstimationDetails.updatedAt,
        ESTIMATION_OBJECT: {
          id: EstimationDetails.id,
          cgst: EstimationDetails.cgst,
          sgst: EstimationDetails.sgst,
          rate: 0.0,
          laborId: EstimationDetails.rot_id,
          sacCode: "",
          vendorId: EstimationDetails.vendorId,
          quantity: EstimationDetails.quantity,
          laborCode: EstimationDetails.rot_code,
          laborTotal: EstimationDetails.laborTotal,
          singleAmount: EstimationDetails.singleAmount,
          discountAmount: EstimationDetails.discount_percentage,
          additionalMargin: EstimationDetails.additionalMargin,
          laborDescription: EstimationDetails.description,
          serviceRecommendation: false
        }
      })))
    }


    if (Object.keys(VisitDetails).length > 0) {
      return {
        success: true,
        VisitDetails: VisitDetails,
        InventoryReport: results.inventoryResponse,
        pastcheckListType: results.pastcheckListType,
        inspectionResponse: results.inspectionResponse,
        EstimationDetails: Estimation
      }
    } else {
      return {
        success: false,
        message: results.message
      };
    }
  } else {
    return {
      success: false,
      message: results.message
    };
  }
}

const savedriverlocation = async (req) => {
  const savedriverlocation = await VehicleDao.savedriverlocation(req);

  if (savedriverlocation.status) {
    return {
      success: true
    }
  } else {
    return {
      success: false
    }
  }
}

const VehicleService = {
  addVehicle,
  listVehicles,
  updateVehicle,
  getAllVechicleColors,
  addVehicleTest,
  addBulkVehicle,
  validateBulkVehicle,
  vehicleSearch,
  createVehicle,
  updateVehicleMobile,
  getVehicleDetails,
  listVehiclesForCustomerComplaint,
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

export default VehicleService;
