import logger from "../../config/logger.js";
import axios from "axios";
import db from '../index.js';
import CarpmDao from "./dao.js";
import { Op, Sequelize } from 'sequelize';

const carpmRecordsDao = db.carpmRecords;

async function getCarpmAPI(method, url, headers, data = null) {
  const fullUrl = "https://carpm.in/" + url;

  try {
    const response = await axios({
      method,
      url: fullUrl,
      headers,
      data
    });

    return { ...response.data, apiSuccess: true, httpcode: response.status };
  } catch (error) {

    let result = { apiSuccess: false, httpcode: 0 };

    if (error.response) {
      result.httpcode = error.response.status;
      switch (result.httpcode) {
        case 404:
          result.message = "URL not found";
          break;
        case 403:
          result.message = "Authentication error";
          break;
        default:
          result.message =
            error.response.data?.error || "Error response in Carpm API";
      }
    } else {
      result.message = error.message || "Unknown error";
    }

    return result;
  }
}

const carpmScanRequired = async(req) => {
    const result = await CarpmDao.carpmScanRequired(req);

    if (result.status == "Error") {
      return { status: "Not Enabled", message: "CARPM scanning is not enabled" };
    } else {
        const carpmRecords = await carpmRecordsDao.findOne({
            where: {
                [db.Sequelize.Op.and]: [
                    {
                        [db.Sequelize.Op.or]: [
                            { IS_SUCCESS: 0 },
                            { IS_SUCCESS: null }
                        ]
                    },
                    { VISIT_ID : req.body.VISIT_ID, } 
                ]
                
            },
             order: [["createdAt", "DESC"]]
        });

    
        if(carpmRecords !== null ){
            return { status: "scanning is done", "allowInspection" : true };
        } else {
            return { status: "Please Scan the Vehicle", message: "Scan the Vehicle before Inspection", "allowInspection" : false };
        }


    }
}

const carpmscanvalidcheck = async(req) => {
    const daoCarpmScanValidCheck = await CarpmDao.carpmscanvalidcheck(req);
    if(daoCarpmScanValidCheck.status == "Success"){
        return { status : daoCarpmScanValidCheck.status , message : daoCarpmScanValidCheck.message};
    } else {
        return { status : daoCarpmScanValidCheck.status , message : daoCarpmScanValidCheck.message}
    }
}

const savecarpmstatus = async(req) => {
    const results = await CarpmDao.savecarpmstatus(req.body);
    if(results.status == "Success"){
        return { status : "Success"};
    } else {
        return { status : false}
    }
}

const CarpmService = {
    getCarpmAPI,
    carpmScanRequired,
    carpmscanvalidcheck,
    savecarpmstatus
};

export default CarpmService;


// const [result] = await sequelize.query(
//   `
//   SELECT u.id as userId,
//          e.outletId,
//          os.OUTLET_ID,
//          os.CONFIG,
//          os.VALUE,
//          c.CHECKLIST_TYPE_CODE
//   FROM vrm_master_user_details u
//   LEFT JOIN employees e 
//          ON u.id = e.userId
//   LEFT JOIN vrm_master_outlet_settings os
//          ON e.outletId = os.OUTLET_ID
//   LEFT JOIN vrm_trans_customer_visit_checklist c
//          ON c.VISIT_ID = :visitId
//   WHERE u.id = :userId
//     AND os.CONFIG = 'CARPM SCANNING_MANDATORY'
//     AND os.VALUE = 'true'
//     AND c.CHECKLIST_TYPE_CODE = 'CHK_LIST_MAJOR'
//   `,
//   {
//     replacements: { userId: req.body.userId, visitId: req.body.VISIT_ID },
//     type: sequelize.QueryTypes.SELECT
//   }
// );