import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import VehicleService from './service.js';


const validateBulkVehicle = async (req, res, next) => {
  try {
    logger.info('Vehicle Controller addBulkVehicle requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Create bulk vehicle';
    auditData['action'] = ACTION_ADD;
    let { result, successData, exceptionData } = await VehicleService.validateBulkVehicle(req, req.user);
    console.log(result);
    if (result == 'success') {
      auditData['message'] = 'Bulk vehicle added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successData: successData,
        exceptionData: exceptionData,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'vehicle not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Vehicle controller  addBulkvehicle Error:',
      err
    );
    next(err);
  }
};


const addBulkVehicle = async (req, res, next) => {
  try {
    logger.info('Vehicle Controller addBulkVehicle requestData:' + JSON.stringify(req.body));
    const auditData = {};
    auditData['menu_name'] = 'Bulk Upload';
    auditData['submenu_name'] = 'Create bulk vehicle';
    auditData['action'] = ACTION_ADD;
    let { result, successData, exceptionData } = await VehicleService.addBulkVehicle(req, req.user);
    console.log(result);
    if (result == 'success') {
      auditData['message'] = 'Bulk vehicle added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        successData: successData,
        exceptionData: exceptionData,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'vehicle not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        exceptionData: exceptionData,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error(
      'Vehicle controller  addBulkvehicle Error:',
      err
    );
    next(err);
  }
};

const addVehicle = async (req, res, next) => {
  try {
    logger.info(
      'Vehicle Controller addVehicle requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vehicle';
    auditData['action'] = ACTION_ADD;
    let result = await VehicleService.addVehicle(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Vehicle added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved successfully',
      });
    } else {
      auditData['message'] = 'Vehicle not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Vehicle controller addVehicle', err);
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    // logger.info(
    //   'Vehicle Controller addVehicle requestData:' + JSON.stringify(req.body)
    // );
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Vehicle Mobile Create';
    auditData['action'] = ACTION_ADD;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if (usId === req.body.userId) {
      let result = await VehicleService.createVehicle(req.body, req.user);
      if (result.success) {
        auditData['message'] = 'From Mobile_API Vehicle added successfully ';
        auditData['result'] = 'success ';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          vehicleID: result.vehicleId.toString(),
        });
      } else {
        auditData['message'] = 'Vehicle not added';
        auditData['result'] = 'failed ';
        auditLog.createAuditLog(req, auditData);
        return res.status(500).send({
          requestSuccessful: false,
          message: 'Data not Saved ',
        });
      }
    } else {
      auditData['message'] = 'Vehicle not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Vehicle controller addVehicle', err);
    next(err);
  }
};

const listVehicles = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vehicle';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Vehicle data ';
    const data = await VehicleService.listVehicles(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vehicleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(500).send({
        requestSuccessful: true,
        vehicleData: data,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller listVehicles', err);
    next(err);
  }
};

// const vehicleSearch = async (req, res, next) => {
//   try{
//     const auditData = {};
//     auditData['menu_name'] = 'Mobile_API';
//     auditData['submenu_name'] = 'Vehicle Mobile List';
//     auditData['action'] = ACTION_GET;
//     auditData['access'] = 'Mobile';

//     let usId = req.user.id.toString();
//     if(usId === req.body.userId){
//       const data = await VehicleService.vehicleSearch(req.body, req.user);
//       if(data){
//         auditData['message'] = 'From Mobile_API Vehicle fetched successfully';
//         auditData['result'] = 'success ';
//         auditLog.createAuditLog(req, auditData);

//         res.status(200).send({
//           requestSuccessful: true,
//           vehicleDetails: data.vehicleDetails ? data.vehicleDetails : [],
//           customerDetails: data.customerDetails ? data.customerDetails : []
//         });
//       } else {
//         auditData['message'] = 'From Mobile_API Vehicle fetch';
//         auditData['result'] = 'failed ';
//         auditLog.createAuditLog(req, auditData);
//         res.status(500).send({
//           requestSuccessful: false,
//         });
//       }
//     } else {
//       auditData['message'] = 'From Mobile_API Vehicle fetch';
//       auditData['result'] = 'failed ';
//       auditLog.createAuditLog(req, auditData);
//       res.status(200).send({
//         requestSuccessful: true,
//         message: "User Id is mis-matched"
//       });
//     }
//   } catch (err) {
//     logger.error('Vehicle controller vehicleSearch', err);
//   }
// };


const vehicleSearch = async (req, res, next) => {
  try {
    const auditData = {
      menu_name: 'Mobile_API',
      submenu_name: 'Vehicle Mobile List',
      action: ACTION_GET,
      access: 'Mobile',
    };

    // let usId = req.user.id.toString();

    // if (usId !== req.body.userId) {
    //   auditData.message = 'From Mobile_API Vehicle fetch - User ID mismatch';
    //   auditData.result = 'failed';
    //   auditLog.createAuditLog(req, auditData);
    //   return res.status(200).send({
    //     requestSuccessful: true,
    //     message: "User Id is mis-matched"
    //   });
    // }

    const data = await VehicleService.vehicleSearch(req.body, req.user);
    // console.log('wwwwwwwwwwwww',data)

    if (!data || !data.vehicleDetails || (Array.isArray(data.vehicleDetails) && data.vehicleDetails.length === 0)) {
      auditData.message = 'From Mobile_API No Vehicle Found';
      auditData.result = 'failed';
      auditLog.createAuditLog(req, auditData);

      return res.status(400).send({
        requestSuccessful: false,
        errorDescription: "No Vehicle Found"
      });
    }

    auditData.message = 'From Mobile_API Vehicle fetched successfully';
    auditData.result = 'success';
    auditLog.createAuditLog(req, auditData);

    return res.status(200).send({
      requestSuccessful: true,
      vehicleDetails: data.vehicleDetails[0],
      customerDetails: data.customerDetails[0]
    });

  } catch (err) {
    logger.error('Vehicle controller vehicleSearch', err);
    return res.status(500).send({
      requestSuccessful: false
    });
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    logger.info(
      'Vehicle Controller updateVehicle requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vehicle';
    auditData['action'] = ACTION_UPDATE;

    const id = req.body.id;
    let result = await VehicleService.updateVehicle(id, req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'Vehicle Updated successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    } else {
      auditData['message'] = 'Vehicle not Updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Vehicle not Updated',
      });
    }
  } catch (err) {
    logger.error('Vehicle controller updateVehicle', err);
    next(err);
  }
};

const updateVehicleMobile = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Mobile_API';
    auditData['submenu_name'] = 'Vehicle Mobile Update';
    auditData['action'] = ACTION_UPDATE;
    auditData['access'] = 'Mobile';

    let usId = req.user.id.toString();
    if (usId === req.body.userId) {
      const id = req.body.id;
      let data = await VehicleService.updateVehicleMobile(id, req.body, req.user);
      if (data) {
        auditData['message'] = 'From Mobile_API Vehicle Updated successfully';
        auditData['result'] = 'success';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          vehicleID: id
        });
      } else {
        auditData['message'] = 'From Mobile_API Vehicle not Updated ';
        auditData['result'] = 'failed';
        auditLog.createAuditLog(req, auditData);
        return res.status(200).send({
          requestSuccessful: true,
          message: 'Vehicle not Updated',
        });
      }
    } else {
      auditData['message'] = 'From Mobile_API Vehicle not Updated ';
      auditData['result'] = 'failed';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: "User Id is mis-matched"
      });
    }
  } catch (err) {
    logger.error('Vehicle controller updateVehicle', err);
    next(err);
  }
};

const getAllVechicleColors = async (req, res, next) => {
  try {
    const data = await VehicleService.getAllVechicleColors();
    res.status(200).send({
      requestSuccessful: true,
      vehicleColorsData: data,
    });
  } catch (err) {
    logger.error('Vehicle controller getAllVechicleColors', err);
    next(err);
  }
};


const addVehicleTest = async (req, res, next) => {
  try {
    let result = await VehicleService.addVehicleTest(req.user);
    return res.status(200).send({
      requestSuccessful: true,
      message: 'Data Saved successfully',
    });
  } catch (err) {
    logger.error('Vehicle controller addVehicleTest', err);
    next(err);
  }
};

const getVehicleDetails = async (req, res, next) => {
  try {
    const data = await VehicleService.getVehicleDetails(
      req.body.registrationNumber
    );
    res.status(200).send({
      requestSuccessful: true,
      vehicleData: data,
    });
  } catch (err) {
    logger.error('Vehicle controller getVehicleDetails', err);
    next(err);
  }
};

const searchGateinVehicleStatus = async (req, res, next) => {
  try {
    const searchGateinVehicleStatus = await VehicleService.searchGateinVehicleStatus(req);
    if (searchGateinVehicleStatus.success) {
      res.status(200).send({
        success: searchGateinVehicleStatus.success,
        status: searchGateinVehicleStatus.status,
        allowRegister: searchGateinVehicleStatus.allowRegister,
        VisitId: searchGateinVehicleStatus.VisitId ? searchGateinVehicleStatus.VisitId : "",
        message: searchGateinVehicleStatus.message
      })
    } else {
      res.status(400).send({
        ErrorDescription: "Error in Loading Search Gate in Status "
      })
    }

  } catch (err) {
    logger.error('Vehicle controller searchGateinVehicleStatus', err);
    next(err);
  }
}

const saveCustomerVoice = async (req, res, next) => {
  try {
    const auditData = {};
    const result = await VehicleService.saveCustomerVoice(req.body);
    auditData["menu_name"] = "Vehicle";
    auditData["submenu_name"] = "Save Customer Voice";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Save Customer Voice Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      // console.log("data->",result);
      res.status(200).send({
        requestSuccessful: true,
        visit_id: result.data.VisitId
      });
    } else {
      auditData['message'] = 'Save Customer Voice Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        message: result.message,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller saveCustomerVoice', err);
    next(err);
  }
}

const managerassignsa = async (req, res, next) => {
  const auditData = {};

  if (req.body.VisitId) {
    try {
      const result = await VehicleService.managerassignsa(req.body);
      auditData["menu_name"] = "Vehicle";
      auditData["submenu_name"] = "managerassignsa";
      auditData["access"] = "Mobile";

      if (result.success) {
        auditData['message'] = 'Get managerassignsa Success ';
        auditData['result'] = 'success ';
        auditData["action"] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        let checkList = result.pastcheckListType;

        res.status(200).send({
          requestSuccessful: true,
          Status: 'Success'
        });
      } else {
        auditData['message'] = 'Get managerassignsa Failed ';
        auditData['result'] = 'failed ';
        auditData["action"] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        return res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "SA Assigned Failed"
        });
      }
    } catch (err) {
      logger.error('Vehicle controller managerassignsa', err);
      next(err);
    }
  } else {
    auditData['message'] = 'Get managerassignsa Failed ';
    auditData['result'] = 'failed ';
    auditData["action"] = ACTION_UPDATE;
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send({
      requestSuccessful: false,
      ErrorDescription: "Mandatory Parameter Missing "
    });
  }
}

const updatebookingdetails = async (req, res, next) => {
  const auditData = {};

  try {
    const result = await VehicleService.updatebookingdetails(req.body);
    auditData["menu_name"] = "Vehicle";
    auditData["submenu_name"] = "updatebookingdetails";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Get updatebookingdetails Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      let checkList = result.pastcheckListType;

      res.status(200).send({
        requestSuccessful: true,
        Status: 'Success'
      });
    } else {
      auditData['message'] = 'Get updatebookingdetails Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_UPDATE;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: "SA Assigned Failed"
      });
    }
  } catch (err) {
    logger.error('Vehicle controller updatebookingdetails', err);
    next(err);
  }
}
const managergateinassignsa = async (req, res, next) => {
  const auditData = {};

  if (req.body.VisitId) {
    try {
      const result = await VehicleService.managergateinassignsa(req.body);
      auditData["menu_name"] = "Vehicle";
      auditData["submenu_name"] = "managergateinassignsa";
      auditData["access"] = "Mobile";

      if (result.success) {
        auditData['message'] = 'Get managergateinassignsa Success ';
        auditData['result'] = 'success ';
        auditData["action"] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        let checkList = result.pastcheckListType;

        res.status(200).send({
          requestSuccessful: true,
          Status: 'Success'
        });
      } else {
        auditData['message'] = 'Get managergateinassignsa Failed ';
        auditData['result'] = 'failed ';
        auditData["action"] = ACTION_UPDATE;
        auditLog.createAuditLog(req, auditData);
        return res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "SA Assigned Failed"
        });
      }
    } catch (err) {
      logger.error('Vehicle controller managergateinassignsa', err);
      next(err);
    }
  } else {
    auditData['message'] = 'Get managergateinassignsa Failed ';
    auditData['result'] = 'failed ';
    auditData["action"] = ACTION_UPDATE;
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send({
      requestSuccessful: false,
      ErrorDescription: "Mandatory Parameter Missing "
    });
  }
}

const saveSecurityGateIn = async (req, res, next) => {
  try {
    const auditData = {};
    const result = await VehicleService.saveSecurityGateIn(req.body);
    auditData["menu_name"] = "Vehicl";
    auditData["submenu_name"] = "Security Gate In";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Security Gate in Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
        visitId: result.data.id
      });
    } else {
      auditData['message'] = 'Security Gate in Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('Vehicle controller saveSecurityGateIn', err);
    next(err);
  }
}

const saveSecurityGateOut = async (req, res, next) => {
  try {
    const auditData = {};
    const result = await VehicleService.saveSecurityGateOut(req.body);
    auditData["menu_name"] = "Vehicl";
    auditData["submenu_name"] = "Security Gate Out";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Security Gate Out Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: result.data.message,
        vehicle_id: (req.body.Visit_Id == null || req.body.Visit_Id == "") ? result.data.data.id : req.body.Visit_Id
      });
    } else {
      auditData['message'] = 'Security Gate Out Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_ADD;
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: result.message,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller saveSecurityGateOut', err);
    next(err);
  }
}



const getsecuritytasklist = async (req, res, next) => {
  try {
    const auditData = {};
    console.log("one");
    const result = await VehicleService.getsecuritytasklist(req.body);
    auditData["menu_name"] = "Vehicle";
    auditData["submenu_name"] = "getsecuritytasklist";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Get getsecuritytasklist Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      if (Object.keys(result.GateinDetails).length > 0 && Object.keys(result.GateoutDetails).length > 0) {
        res.status(200).send({
          requestSuccessful: true,
          GateinDetails: result.GateinDetails,
          GateoutDetails: result.GateoutDetails
        });
      } else if (Object.keys(result.GateinDetails).length > 0) {
        res.status(200).send({
          requestSuccessful: true,
          GateinDetails: result.GateinDetails,
          ErrorDescription: "No results found for GateoutDetails"
        });
      } else if (Object.keys(result.GateoutDetails).length > 0) {
        res.status(200).send({
          requestSuccessful: true,
          ErrorDescription: "No results found for GateinDetails",
          GateoutDetails: result.GateoutDetails
        });
      } else {
        res.status(200).send({
          requestSuccessful: true,
          ErrorDescription: "No results found"
        });
      }
    } else {
      auditData['message'] = 'Get getsecuritytasklist Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        message: result.message,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller getsecuritytasklist', err);
    next(err);
  }
}

const getVahanData = async (req, res, next) => {
  try {
    const auditData = {};
    const result = await VehicleService.getVahanData(req.body);
    auditData["menu_name"] = "Vehicle";
    auditData["submenu_name"] = "getVahanData";
    auditData["access"] = "Mobile";

    if (result.success) {
      auditData['message'] = 'Get getVahanData Success ';
      auditData['result'] = 'success ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vahanData: result.vahanData
      });
    } else {
      auditData['message'] = 'Get getVahanData Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        message: result.message,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller getVahanData', err);
    next(err);
  }
}

const getvehiclehistory = async (req, res, next) => {
  try {
    const auditData = {};
    if (req.body.VehicleNumber) {
      const result = await VehicleService.getvehiclehistory(req.body);
      auditData["menu_name"] = "Vehicle";
      auditData["submenu_name"] = "getvehiclehistory";
      auditData["access"] = "Mobile";

      if (result.success) {
        auditData['message'] = 'Get getvehiclehistory Success ';
        auditData['result'] = 'success ';
        auditData["action"] = ACTION_GET;
        auditLog.createAuditLog(req, auditData);
        res.status(200).send({
          requestSuccessful: true,
          VisitDetails: result.VisitDetails,
        });
      } else {
        auditData['message'] = 'Get getvehiclehistory Failed ';
        auditData['result'] = 'failed ';
        auditData["action"] = ACTION_GET;
        auditLog.createAuditLog(req, auditData);
        return res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "No visit id found"
        });
      }
    } else {
      auditData['message'] = 'Get getvehiclehistory Failed ';
      auditData['result'] = 'failed ';
      auditData["action"] = ACTION_GET;
      auditLog.createAuditLog(req, auditData);
      return res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: "Mandatory Parameters Missing "
      });
    }

  } catch (err) {
    logger.error('Vehicle controller getvehiclehistory', err);
    next(err);
  }
}


const getvehiclehistorybyvisitid = async (req, res, next) => {
  if (req.body.VISIT_ID) {
    try {
      const auditData = {};
      const result = await VehicleService.getvehiclehistorybyvisitid(req.body);
      auditData["menu_name"] = "Vehicle";
      auditData["submenu_name"] = "getvehiclehistorybyvisitid";
      auditData["access"] = "Mobile";

      if (result.success) {
        auditData['message'] = 'Get getvehiclehistorybyvisitid Success ';
        auditData['result'] = 'success ';
        auditData["action"] = ACTION_GET;
        auditLog.createAuditLog(req, auditData);
        let checkList = result.pastcheckListType;

        if (Object.keys(result.inspectionResponse).length > 0) {
          res.status(200).send({
            requestSuccessful: true,
            VisitDetails: result.VisitDetails,
            InventoryReport: result.InventoryReport,
            EstimationDetails: result.EstimationDetails,
            [checkList]: result.inspectionResponse
          });
        } else {
          res.status(200).send({
            requestSuccessful: true,
            VisitDetails: result.VisitDetails,
            InventoryReport: result.InventoryReport,
            EstimationDetails: result.EstimationDetails,
          });
        }
      } else {
        auditData['message'] = 'Get getvehiclehistorybyvisitid Failed ';
        auditData['result'] = 'failed ';
        auditData["action"] = ACTION_GET;
        auditLog.createAuditLog(req, auditData);
        return res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "No visit id found"
        });
      }
    } catch (err) {
      logger.error('Vehicle controller getvehiclehistorybyvisitid', err);
      next(err);
    }
  } else {
    return res.status(400).send({
      requestSuccessful: false,
      ErrorDescription: "Mandantory Parameter Missing"
    });
  }
}

const savedriverlocation = async (req, res, next) => {
  const auditData = {};

  if (req.body.DMS_BOOKING_ID) {
    try {
      const result = await VehicleService.savedriverlocation(req.body);
      auditData["menu_name"] = "Vehicle";
      auditData["submenu_name"] = "savedriverlocation";
      auditData["access"] = "Mobile";

      if (result.success) {
        auditData['message'] = 'Get savedriverlocation Success ';
        auditData['result'] = 'success ';
        auditData["action"] = ACTION_ADD;
        auditLog.createAuditLog(req, auditData);

        res.status(200).send({
          requestSuccessful: true,
          Status: 'Success'
        });
      } else {
        auditData['message'] = 'Get savedriverlocation Failed ';
        auditData['result'] = 'failed ';
        auditData["action"] = ACTION_ADD;
        auditLog.createAuditLog(req, auditData);
        return res.status(400).send({
          requestSuccessful: false,
          ErrorDescription: "Save Driver Location Failed"
        });
      }
    } catch (err) {
      logger.error('Vehicle controller savedriverlocation', err);
      next(err);
    }
  } else {
    auditData['message'] = 'Get savedriverlocation Failed ';
    auditData['result'] = 'failed ';
    auditData["action"] = ACTION_ADD;
    auditLog.createAuditLog(req, auditData);
    return res.status(400).send({
      requestSuccessful: false,
      ErrorDescription: "Mandatory Parameter Missing "
    });
  }
}

const listVehiclesForCustomerComplaint = async (req, res, next) => {
  try {
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Vehicle';
    auditData['action'] = ACTION_GET;
    auditData['access'] = 'Portal';
    auditData['message'] = 'Get Vehicle data for customer complaint';
    const data = await VehicleService.listVehiclesForCustomerComplaint(req.body, req.user);
    if (data) {
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        vehicleData: data,
      });
    } else {
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(500).send({
        requestSuccessful: true,
        vehicleData: data,
      });
    }
  } catch (err) {
    logger.error('Vehicle controller listVehicles', err);
    next(err);
  }
};
const controller = {
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
  updatebookingdetails,
  saveSecurityGateIn,
  saveSecurityGateOut,
  getVahanData,
  getvehiclehistory,
  getvehiclehistorybyvisitid,
  getsecuritytasklist,
  savedriverlocation
};

export default controller;
