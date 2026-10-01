import db from '../index.js';
import CarpmService from "./service.js";
import { Op, Sequelize, fn, col, where } from 'sequelize';

// wanted for this Page 
const Credentials = db.otherCredentialsSettings;
const WebhookUpdate = db.carpmWebHookRecords;
const CarpmRecord = db.carpmRecords;

const carpmcallback = async (req,res) => {
    try {
    const data = req.body;
    console.log("Carpm callback invoked", JSON.stringify(data));

    const success = await updateWebhook(data);

    if (success) {
      return res.status(200).json({ status: "Success" });
    } else {
      return res
        .status(400)
        .json({ ErrorDescription: "Insert error", Error: 400 });
    }
  } catch (err) {
    console.error("Callback error:", err.message);
    return res.status(500).json({ ErrorDescription: "Server error" });
  }
}

async function updateWebhook(data) {
  const { function_used, function_id, job_id, report_url, mechanic_email, license_plate } =
    data;
    try {
        // 1. Insert/Update webhook record
        await WebhookUpdate.create({
            FUNCTION_TYPE: function_used,
            FUNCTION_ID: function_id,
            JOB_ID: job_id,
            URL: report_url,
            MECHANIC_EMAIL: mechanic_email,
            LICENSE_PLATE: license_plate,
            CREATED_DATE: new Date()
        });

        // 2. Fetch record details from Carpm API
        const response = await getRecordDetails(function_id, function_used);

        if (response.success) {
        // 3. Save report data in records table
        await CarpmRecord.create({
            VISIT_ID: job_id,
            REPORT_ID: function_id,
            REPORT_DATA: JSON.stringify(response.vehicleRecords),
            CREATED_BY: mechanic_email,
            CREATED_DATE: new Date(),
            UPDATED_BY: mechanic_email,
            UPDATED_DATE: new Date()
        });
            return true;
        } else {
            console.error("Carpm API error:", response.message);
            return false;
        }
    } catch (err) {
        console.error("updateWebhook error:", err.message);
        return false;
    }
}

async function getRecordDetails(recordId, type)  {
    const loginDetails = getCarpm();
    const email = loginDetails.user.email;

    const record = await Credentials.findOne({
        where: { TYPE: "CARPM" }
    });

    const authToken = record ? record.AUTHTOKEN : "";
    let headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-User-Email": email,
        "X-User-Token": authToken
    };
    
    let result;

    if (type === "report") {
        result = await CarpmService.getCarpmAPI(
            "GET",
            `mechanic/reports/get_report?report_id=${recordId}`,
            headers
        );
    } else {
        result = await CarpmService.getCarpmAPI(
            "GET",
            `mechanic/reports/get_live_data?report_id=${recordId}`,
            headers
        );
    }

    // If token expired → login again
    if (result.httpcode === 401) {
        const loginHeaders = {
            "Content-Type": "application/json",
            Accept: "application/json"
        };

        const loginRes = await CarpmService.getCarpmAPI(
            "POST",
            "users/sign_in",
            loginHeaders,
            JSON.stringify(loginDetails.loginDetails)
        );

        if (loginRes.apiSuccess) {
        await updateToken(loginRes.authentication_token);

        headers["X-User-Token"] = loginRes.authentication_token;

        if (type === "report") {
            result = await CarpmService.getCarpmAPI(
                "GET",
                `mechanic/reports/get_report?report_id=${recordId}`,
                headers
            );
        } else {
            result = await CarpmService.getCarpmAPI(
                "GET",
                `mechanic/reports/get_live_data?report_id=${recordId}`,
                headers
            );
        }
        } else {
        return {
            success: false,
            httpcode: 400,
            message: "Error in Carpm login, " + loginRes.message
        };
        }
    }

    // Return final result
    if (result.apiSuccess) {
        return { success: true, vehicleRecords: result };
    } else {
        return {
            success: false,
            httpcode: result.httpcode,
            message: result.message || "No Message"
        };
    }

}

async function updateToken(newToken) {
  await Credential.update(
    { AUTHTOKEN: newToken },
    { where: { TYPE: "CARPM" } }
  );
}

function getCarpm() {
  return {
    user: {
      email: "harman.singh+prod@tvs.in",
      password: "eLWgv0JEMmLy2Cg"
    }
  };
}

const carpmScanRequired = async (req,res) => {
    try {
    const data = req.body;
    console.log("Carpm Scan Required invoked", JSON.stringify(data));

    // TODO : Check if visitID is empty return Missing Parameter

    if(req.body.VISIT_ID == null ){
        return res.status(400).json({ "ErrorDescription": "Missing Parameter VISIT_ID"});

    } else {

        const success = await CarpmService.carpmScanRequired(req);

        console.log("controller ---> ", success);
        if (success.status == "scanning is done") {
            return res.status(200).json({ status: "scanning is done", "allowInspection" : true  });
        } else  if (success.status == "Please Scan the Vehicle") {
            return res.status(200).json({ status: "Please Scan the Vehicle", message : success.message,  "allowInspection" : false });
        } else  if (success.status == "Not Enabled") {
            return res.status(200).json({ status: "CARPM scanning is not enabled",  "allowInspection" : true });
        } else {
            return res
                .status(400)
                .json({ ErrorDescription: "Carpm Scan error", Error: 400 });
        }
    }

  } catch (err) {
    console.error("Callback error:", err.message);
    return res.status(500).json({ ErrorDescription: "Server error" });
  }
}

const carpmscanvalidcheck = async (req,res) => {
    const servciceCarpmScanValidCheck = await CarpmService.carpmscanvalidcheck(req);
    if(servciceCarpmScanValidCheck.status == "Success"){
        return res.status(200).json({ status: servciceCarpmScanValidCheck.status, "description" : servciceCarpmScanValidCheck.message });
    } else {
        return res.status(400).json({ status: servciceCarpmScanValidCheck.status, "description" : servciceCarpmScanValidCheck.message });
    }
}

const savecarpmstatus = async (req,res) => {
    const results = await CarpmService.savecarpmstatus(req);
    if(results.status == "Success"){
        return res.status(200).json({ status: "Success"});
    } else {
        return res.status(400).json({ status: false,ErrorDescription : "Saving status failed!"});
    }
}



const CarpmController = {
    getRecordDetails,
    carpmcallback,
    carpmScanRequired,
    carpmscanvalidcheck,
    savecarpmstatus
}

export default CarpmController;