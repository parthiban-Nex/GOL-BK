import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import CustomerService from './service.js';



const validateCustomer = async (req, res, next) => {
  try {
    logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Customer bulk upload';
    auditData['action'] = ACTION_ADD;
    let  { result, exceptionData, successData } = await CustomerService.validateBulkCustomer(req,req.user,req.file);
    if (result == 'success') {
      auditData['message'] = 'validate Bulk customer ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        exceptionData : exceptionData,
        successData : successData,
        message: 'Data Validated Successfully',
      });
    } else {
      auditData['message'] = 'Validation failed';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData : exceptionData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Customer controller validateCustomer Error:',
      err
    );
    next(err);
  }
};


const addBulkCustomer = async (req, res, next) => {
  try {
    logger.info('Customer Controller addCustomer requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Customer bulk upload';
    auditData['action'] = ACTION_ADD;
    let result = await CustomerService.addBulkCustomer(req,req.user,req.file);
    if (result == 'success') {
      auditData['message'] = 'Bulk customer added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'customer not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Customer controller addBulkCustomer Error:',
      err
    );
    next(err);
  }
};

const addCustomer = async (req, res, next) => {
  try {
    logger.info(
      'Customer Controller addCustomer requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer & Vehicle Account';
    auditData['action'] = ACTION_ADD;
    let result = await CustomerService.addCustomer(req.body, req.user, req.files);
    if (result == 'success') {
      auditData['message'] = 'Customer added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Customer not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Customer controller addCustomer', err);
    next(err);
  }
};

const quickAddCustomer = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Accounts',
      submenu_name: 'Customer & Vehicle Account',
      action: ACTION_ADD,
      message: 'Customer and vehicle added successfully',
      result: 'success',
    };
    const data = await CustomerService.quickAddCustomer(req.body, req.user);
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Data Saved successfully',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      customerCode: data.customerCode,
    });
  } catch (err) {
    logger.error('Customer Controller quickAddCustomer Error:', err);
    next(err);
  }
};

const searchCustomerVehicle = async (req, res, next) => {
  try {
    const data = await CustomerService.searchCustomerVehicle(req.body, req.user);
    return res.status(200).send({ requestSuccessful: true, ...data });
  } catch (err) {
    logger.error('Customer Controller searchCustomerVehicle Error:', err);
    next(err);
  }
};

const createPortalCustomer = async (req, res, next) => {
  try {
    const data = await CustomerService.createPortalCustomer(req.body, req.user);
    auditLog.createAuditLog(req, {
      menu_name: 'Accounts',
      submenu_name: 'Customer & Vehicle Account',
      action: ACTION_ADD,
      message: 'Customer created for staged vehicle entry',
      result: 'success',
    });
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Customer created successfully. Continue to add vehicle details.',
      customerId: data.customerId,
      customerCode: data.customerCode,
    });
  } catch (err) {
    logger.error('Customer Controller createPortalCustomer Error:', err);
    next(err);
  }
};

const quickAddVehicleForCustomer = async (req, res, next) => {
  try {
    const data = await CustomerService.quickAddVehicleForCustomer(req.body, req.user);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Vehicle linked to customer successfully',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
    });
  } catch (err) {
    logger.error('Customer Controller quickAddVehicleForCustomer Error:', err);
    next(err);
  }
};

const updateCustomerVehicleDetails = async (req, res, next) => {
  try {
    const data = await CustomerService.updateCustomerVehicleDetails(req.body, req.user);
    const auditData = {
      menu_name: 'Accounts',
      submenu_name: 'Customer & Vehicle Account',
      action: ACTION_UPDATE,
      message: 'Customer and vehicle details updated successfully',
      result: 'success',
    };
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Data updated successfully',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
    });
  } catch (err) {
    logger.error('Customer Controller updateCustomerVehicleDetails Error:', err);
    next(err);
  }
};

const updateCustomerVehicleInsurance = async (req, res, next) => {
  try {
    const data = await CustomerService.updateCustomerVehicleInsurance(req.body, req.user);
    auditLog.createAuditLog(req, {
      menu_name: 'Accounts',
      submenu_name: 'Customer Vehicle Insurance',
      action: ACTION_UPDATE,
      message: 'Vehicle insurance details updated successfully',
      result: 'success',
    });
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Insurance details updated successfully',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
    });
  } catch (err) {
    logger.error('Customer Controller updateCustomerVehicleInsurance Error:', err);
    next(err);
  }
};

const getCustomerVehicleNumbers = async (req, res, next) => {
  try {
    const vehicleNumbers = await CustomerService.getCustomerVehicleNumbers(
      req.body.customerId,
      req.user
    );
    const auditData = {
      menu_name: 'Accounts',
      submenu_name: 'Customer Vehicle Numbers',
      action: ACTION_GET,
      message: 'Customer vehicle numbers fetched successfully',
      result: 'success',
    };
    auditLog.createAuditLog(req, auditData);
    return res.status(200).send({
      requestSuccessful: true,
      customerId: Number(req.body.customerId),
      totalVehicles: vehicleNumbers.length,
      vehicleNumbers,
    });
  } catch (err) {
    logger.error('Customer Controller getCustomerVehicleNumbers Error:', err);
    next(err);
  }
};

const addCustomerMobile = async (req, res, next) => { 
  try {
    logger.info(
      'Customer Controller addCustomer requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Customer Mobile Create';
    auditData['action'] = ACTION_ADD;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if(usId === req.body.userId){
      let result = await CustomerService.addCustomerMobile(req.body, req.user);

      if (result.success) {
        auditData['message'] = 'From Mobile_API Customer added successfully';
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
  
        return res.status(200).send({
          requestSuccessful: true,
          customerID: result.customerId.toString(),
        });
      } else {
        auditData['message'] = 'From Mobile_API Customer not added';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
  
        return res.status(500).send({
          requestSuccessful: false,
          message: 'Data not Saved ',
        });
      }
    } else {
      auditData['message'] = 'From Mobile_API Customer not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Customer controller addCustomerMobile', err);
    next(err);
  }
};

const listCustomers = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'List Customer data ';
    const data = await CustomerService.listCustomers(req.body, req.user, req.files);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        customerData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        customerData: data,
      });
    }
  } catch (err) {
    logger.error('Customer controller listCustomers', err);
    next(err);
  }
};


// const listCustomersMobile = async (req, res, next) => {
//   try {
//     const auditData = {};
//     auditData['menu_name'] = 'Mobile_API';
//     auditData['submenu_name'] = 'Customer Mobile List';
//     auditData['action'] = ACTION_GET;
//     auditData['access'] = 'Mobile';

//     let usId = req.user.id.toString();
//     if(usId === req.body.userId){
//       const data = await CustomerService.listCustomersMobile(req.body, req.user); 
//       if (data) {
//         auditData['message'] = 'From Mobile_API Customer fetched successfully';
//         auditData['result'] = 'success ';
//         auditLog.createAuditLog(req, auditData);
//         res.status(200).send({
//           requestSuccessful: true,
//           customerDetails: data,
//         });
//       } else {
//         auditData['message'] = 'From Mobile_API Customer not fetched';
//         auditData['result'] = 'failed ';
//         auditLog.createAuditLog(req, auditData);
//         res.status(500).send({
//           requestSuccessful: false,
//           customerDetails: data,
//         });
//       }
//     } else {
//       auditData['message'] = 'From Mobile_API Customer not fetched';
//       auditData['result'] = 'failed ';
//       auditLog.createAuditLog(req, auditData);
//       res.status(200).send({
//         requestSuccessful: true,
//         message: "User Id is mis-matched"
//       });
//     }
//   } catch (err) {
//     logger.error('Customer controller listCustomers', err);
//     next(err);
//   }
// };


const listCustomersMobile = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Mobile_API',
      submenu_name: 'Customer Mobile List',
      action: ACTION_GET,
      access: 'Mobile',
    };

    const usId = req.user.id.toString();

    if (usId !== req.body.userId) {
      auditData.message = 'From Mobile_API Customer fetch - User ID mismatch';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }

    const data = await CustomerService.listCustomersMobile(req.body, req.user);
    // console.log("customer search data-------------", data);

    const isEmpty =
  !data ||
  (Array.isArray(data) && data.length === 0) ||
  (!Array.isArray(data) && typeof data === 'object' && Object.keys(data).length === 0);


    
    if (isEmpty) {
      auditData.message = 'From Mobile_API No Customer Found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        errorDescription: "No Customer Found"
      });
    }

    auditData.message = 'From Mobile_API Customer fetched successfully';
    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).send({
      requestSuccessful: true,
      customerDetails: data,
    });

  } catch (err) {
    logger.error('Customer controller listCustomers', err);
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    logger.info(
      'Customer Controller updateCustomer requestData:' +
        JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer';
    auditData['action'] = ACTION_UPDATE;

    const id = req.body.id;
    let result = await CustomerService.updateCustomer(id, req.body, req.user, req.files);
    if (result == 'success') {
      auditData['message'] = 'Customer Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Customer not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Customer not Updated',
      });
    }
  } catch (err) {
    logger.error('Customer controller updateCustomer', err);
    next(err);
  }
};

const updateCustomerMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Customer Mobile Update';
    auditData['action'] = ACTION_UPDATE;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if(usId === req.body.userId){
      const id = req.body.id;
      let data = await CustomerService.updateCustomerMobile(id, req.body, req.user);
      if (data) {
        auditData['message'] = 'From Mobile_API Customer Updated successfully';
        auditData['result'] = 'success';
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          customerID: id,
        });
      } else {
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Customer not Updated',
        });
      }
    } else {
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Customer controller updateCustomerMobile', err);
    next(err);
  }
};

const getAllCustomertypes = async (req, res, next) => {
  try {
    const data = await CustomerService.getAllCustomertypes();
    res.status(200).send({
      requestSuccessful: true,
      customertypesData: data,
    });
  } catch (err) {
    logger.error('Customer controller getAllCustomertypes', err);
    next(err);
  }
};

const getAllBilltypes = async (req, res, next) => {
  try {
    const data = await CustomerService.getAllBilltypes();
    res.status(200).send({
      requestSuccessful: true,
      billTypesData: data,
    });
  } catch (err) {
    logger.error('Customer controller getAllBilltypes', err);
    next(err);
  }
};

const getAllCustomercategory = async (req, res, next) => {
  try {
    const data = await CustomerService.getAllCustomercategory();
    res.status(200).send({
      requestSuccessful: true,
      customercategoryData: data,
    });
  } catch (err) {
    logger.error('Customer controller getAllCustomercategory', err);
    next(err);
  }
};

const getAllCustomers = async (req, res, next) => {
  try {
    const data = await CustomerService.getAllCustomers(req.body.customerId);
    res.status(200).send({
      requestSuccessful: true,
      customerData: data,
    });
  } catch (err) {
    logger.error('Customer controller getAllCustomers Error:', err);
    next(err);
  }
};

const getAllSearchedCustomers = async (req, res, next) => {
  try {
    const { customerId, searchKey, offset, limit } = req.body;

    const customerData = await CustomerService.getAllSearchedCustomers({
      customerId,
      searchKey,
      offset,
      limit,
    });

    return res.status(200).json({
      requestSuccessful: true,
      customerData,
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerData = async (req, res, next) => {
  try {
    const data = await CustomerService.getCustomerData(req.body.customerCode);
    res.status(200).send({
      requestSuccessful: true,
      data: data,
    });
  } catch (err) {
    logger.error('Customer controller getCustomerData Error:', err);
    next(err);
  }
};

const searchCustomer = async (req, res, next) => {
  try {
    const data = await CustomerService.searchCustomer(req.body, req.user);
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    }
  } catch (err) {
    logger.error('Customer Controller searchCustomer Error:', err);
    next(err);
  }
};

const createManyCustomers = async (req, res, next) => {
  let data = {};
  try {
    const count = req.body.count;
    for( let i=0; i<count; i++){
      const custData = {
        firstName: "test"+i,
        status: 1,
        lastName: "nesh",
        address1: "test",
        address2: "test",
        pincode: "600001",
        mobileNumber: (1300000000+i).toString(),
        emailId: "tester"+i+"@email.com",
        contactPerson: "sffdas",
        contactPersonNumber: (2300000000+i).toString(),
        gstinNumber: 1000+i,
        oraclAccountNumber: "",
        oraclSiteNumber: "",
        sourceId: 11,
        sourceTypeId: 3,
        customerCategory: "B2B",
        billType: "Credit",
        customerType: "Corporate",
        state: "TAMIL NADU",
        city: "CHENNAI",
        pinCode: "600001",
      }
      data = await CustomerService.addCustomer(custData, req.user);
    }
    if (data) {
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    }
  } catch (err) {
    logger.error('Customer Controller createManyCustomers Error:', err);
    next(err);
  }
}

const approveCustomer = async (req, res, next) => {
  let data = {};
  try {
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Approve customers status change';
    data = await CustomerService.approveCustomer(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "customer approved",
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "customer not approved",
      });
    }
  } catch (err) {
    logger.error('Customer Controller approveCustomer Error:', err);
    next(err);
  }
}

const getCustomerImages = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Customer Images ';
    const data = await CustomerService.getCustomerImages(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        customerData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        customerData: data,
      });
    }
  } catch (err) {
    logger.error('Customer controller getCustomerImages', err);
    next(err);
  }
};

const updatecustomervisit = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Accounts';
    auditData['submenu_name'] = 'Customer';
    auditData['action'] = ACTION_UPDATE;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Update Customer Data ';
    const data = await CustomerService.updatecustomervisit(req.body, req.user);
    if (data.status) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        status : 'success'
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        ErrorDescription : data.data.message
      });
    }
  } catch (err) {
    logger.error('Customer controller updatecustomervisit', err);
    next(err);
  }
}

const oracleCodeSearch = async (req, res, next) => {
  try {
    const { customerCode } = req.body;
    if (!customerCode) {
      return res.status(200).json({
        requestSuccessful: false,
        message: 'Something went wrong',
      });
    }
    const data = await CustomerService.oracleCodeSearch(customerCode.trim());
    if (!data) {
      return res.status(200).json({
        requestSuccessful: false,
        message: 'Customer code not found',
      });
    }
    return res.status(200).json({
      requestSuccessful: true,
      data: {
        id: data.id,
        customerCode: data.customerCode,
        oracleCustomerCode: data.oracleCustomerCode,
        siteNumber: data.siteNumber,
      },
    });
  } catch (err) {
    logger.error('Customer Controller oracleCodeSearch Error:', err);
    next(err);
  }
};

const oracleCodeUpdate = async (req, res, next) => {
  try {
    const { customerId, oracleCustomerCode, siteNumber } = req.body;
    if (!customerId) {
      return res.status(200).json({
        requestSuccessful: false,
        message: 'Something went wrong',
      });
    }
    const result = await CustomerService.oracleCodeUpdate(
      customerId,
      oracleCustomerCode ? oracleCustomerCode.trim() : null,
      siteNumber ? siteNumber.trim() : null
    );
    if (result) {
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Updated successfully',
      });
    } else {
      return res.status(200).json({
        requestSuccessful: false,
        message: 'Update failed',
      });
    }
  } catch (err) {
    logger.error('Customer Controller oracleCodeUpdate Error:', err);
    next(err);
  }
};

const oracleCodeFetch = async (req, res, next) => {
  try {
    const { customerCode, mobileNumber } = req.body;
    if (!customerCode || !mobileNumber) {
      return res.status(200).json({
        requestSuccessful: false,
        message: 'Something went wrong',
      });
    }
    const result = await CustomerService.oracleCodeFetch(customerCode.trim(), mobileNumber.trim());
    return res.status(200).json({
      requestSuccessful: result.success,
      message: result.message,
    });
  } catch (err) {
    logger.error('Customer Controller oracleCodeFetch Error:', err);
    next(err);
  }
};

const controller = {
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
  getAllCustomercategory,
  getAllBilltypes,
  getAllCustomers,
  getCustomerData,
  searchCustomer,
  createManyCustomers,
  addBulkCustomer,
  validateCustomer,
  addCustomerMobile,
  listCustomersMobile,
  updateCustomerMobile,
  approveCustomer,
  getCustomerImages,
  updatecustomervisit,
  oracleCodeSearch,
  oracleCodeUpdate,
  getAllSearchedCustomers,
  oracleCodeFetch
};

export default controller;
