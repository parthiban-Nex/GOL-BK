//import db from '../index';
import db from '../index.js';
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import JwtConfig from '../../config/jwtConfig.js';
import UsersService from './service.js';
import auditLog from '../../shared/auditLog.js';
import logger from '../../config/logger.js';
import EmpoyeeDao from '../employee/dao.js';
import { recordLoginFailure, resetUserLoginAttempts } from '../../config/loginRateLimiter.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import sendNotificationDataToToken from "../../shared/fbnotificationFit.js";

import _ from 'lodash';

// create main Model
const User = db.users;

const role = db.role;

// main work

// 1. create user

const addUser = async (req, res) => {
  try {
    logger.info(
      'User Controller addUser requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Fit Master';
    auditData['submenu_name'] = 'Users';
    auditData['action'] = ACTION_ADD;
    let result = await UsersService.addUser(req.body, '');
    if (result == 'success') {
      auditData['message'] = 'User added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'User not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('User Controller addUser Error:', err);
  }
};

const createUser = async (req, res) => {
  try {
    logger.info(
      'User Controller CreateUser requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Users';
    auditData['action'] = ACTION_ADD;
    let result = await UsersService.addUser(req.body, req.user);
    if (result == 'success') {
      auditData['message'] = 'User added successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'User not added';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('User Controller CreateUser Error:', err);
  }
};

const getRoles = async (req, res, next) => {
  const data = await UsersService.getRoles();
  res.status(200).send({
    requestSuccessful: true,
    menuList: data,
  });
};

const updateUser = async (req, res) => {
  try {
    logger.info(
      'User Controller CreateUser requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Master';
    auditData['submenu_name'] = 'Users';
    auditData['action'] = ACTION_UPDATE;
    let result = await UsersService.updateUser(req.body, req.user);
    console.log('test result---', result);
    if (result == 'success') {
      auditData['message'] = 'User updated successfully ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    } else {
      auditData['message'] = 'User not updated';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'Data not Saved ',
      });
    }
  } catch (err) {
    logger.error('User Controller CreateUser Error:', err);
  }
};

//2. login api

// const login = async (req, res) => {
//   try {
//     const user = await UsersService.findByUserId(req.body.employeeCode);

//     if (user) {
//             const LOCK_TIME = 30 * 60 * 1000; // 30 mins
//       const lastFailedTime = user.last_login
//         ? new Date(user.last_login).getTime()
//         : 0;

//       if (
//         user.wrong_count >= 3 &&
//         Date.now() - lastFailedTime > LOCK_TIME
//       ) {
//         await User.update(
//           { wrong_count: 0 },
//           { where: { id: user.id } }
//         );
//         user.wrong_count = 0; 
//       }

// if (
//   user.wrong_count >= 3 &&
//   new Date(user.last_login).getTime() + (1000 * 60 * 30) > Date.now()
// ){
//            return res.status(500).json({ 
//           resultCode: 1,
//           resultText: "failed",
//           message: "You entered the wrong password 3 times. Your account suspended For 30 mins. Contact admin for more details",
//         });
//       }

// const PASSWORD_EXPIRY_DAYS = 30; 

// const passwordChangedAt = new Date(user.password_changed_at).getTime();
// const now = Date.now();
// const diffInDays = (now - passwordChangedAt) / (1000 * 60 * 60 * 24);
// // console.log('diffInDays', diffInDays);


//       if (req.body.password ? bcrypt.compareSync(req.body.password, user.password) : null) {

//         if(user.is_first_login == 0){
//             let userToken = JWT.sign({   
//         user_id :  req.body.employeeCode,      
//         id: user.id,
//         }, JwtConfig.secret, {
//             expiresIn: '30m', // this will be in ms, here 30 mins is the limit
//             notBefore: 0, // after 0 min we are able to use this token value
//             algorithm: 'HS256'
//         });

//         return res.status(301).json({
//           resultCode: 2,
//           resultText: "password_expired",
//           message: "Welcome,Please Create Your Own Password for Privacy.",
//           token: userToken
//         });
//       }



//         if (diffInDays >= PASSWORD_EXPIRY_DAYS) {
//         // create token with user.id and send it into response so that frontend can use that token to call change password API

//         let userToken = JWT.sign({   
//         user_id :  req.body.employeeCode,      
//         id: user.id,
//         }, JwtConfig.secret, {
//             expiresIn: '30m', // this will be in ms, here 30 mins is the limit
//             notBefore: 0, // after 0 min we are able to use this token value
//             algorithm: 'HS256'
//         });

//         return res.status(500).json({
//           resultCode: 2,
//           resultText: "password_expired",
//           message: "Your password has expired. Please change your password.",
//           token: userToken
//         });
//       }

//         // const userrole = await UsersService.getUserRole(user.id);
//         // const userLogData = await UsersService.addUserLog(req, user);
//         // const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

//         // const userToken = JWT.sign({
//         //   id: user.id,
//         //   employeeCode: user.user_id,
//         //   employeeName: user.employee.employeeName,
//         //   employeeId: user.employeeId,
//         //   reportAccess: employee.reports === false ? 0 : 1,
//         //   outlet: employee.outlet,
//         //   roleid: userrole.roleId,
//         //   roleName: userrole.role_name,
//         //   loginId: userLogData.id
//         // }, JwtConfig.secret, {
//         //   expiresIn: JwtConfig.expiresIn, // 55 minutes
//         //   notBefore: JwtConfig.notBefore,
//         //   algorithm: JwtConfig.algorithm
//         // });
//     // let reqdata={token:userToken}
//     let reqdata={};
//     if(req.body.fcm_tocken){
//       reqdata.fcm_tocken=req.body.fcm_tocken;
//             const saveToken = await User.update(reqdata, { where: { id: user.id } });

//         if (saveToken[0] === 0) {
//           return res.status(500).json({
//             resultCode: 1,
//             resultText: "failed",
//             message: "Fcm not saved"
//           });
//         }
//     }

//       //  resetUserLoginAttempts(req.ip,req.body.employeeCode);
// //        res.cookie('auth_token', userToken, {
// //   path: '/',
// //   httpOnly: true,
// //   secure: process.env.NODE_ENV === 'production', // true in production
// //   sameSite: 'Strict', // Or 'Lax' depending on your needs
// //   maxAge: JwtConfig.expiresIn*1000, // same as token expiry, 55 minutes
// // });
// const resetloginCount= await User.update({
//                   wrong_count:0,
//                 }, { where: { id: user.id } });



//         return res.status(200).json({
//           resultCode: 0,
//           resultText: "Success",
//           requestSuccessful: true,
//           message: "Details Match",
//           id: user.id,
//           // roleId: userrole.roleId,
//           // roleName: userrole.role_name,
//           // email: user.email,
//           employeeCode: user.user_id,
//           // employeeName: user.employee.employeeName,
//           // phone: user.phone,
//           // employeeId: user.employeeId,
//           // reportAccess: employee.reports === false ? 0 : 1,
//           // outlet: employee.outlet,
//           // token: userToken
//         });
//       } else {
//         // recordLoginFailure(req.ip, req.body.employeeCode,true);
//                 const recordwrongcount = await User.update({
//                   wrong_count:user.wrong_count+1,
//                   last_login:new Date()
//                 }, { where: { id: user.id } });
//                 console.log(recordwrongcount,"login failure")
//         return res.status(500).json({
//           resultCode: 1,
//           resultText: "failed",
//           message: "Password didn't match"
//         });
//       }
//     } else {
//       // recordLoginFailure(req.ip,null,false);
//       logger.error('User Controller: User does not exist with this employee code');
//       return res.status(500).json({
//         resultCode: 1,
//         resultText: "failed",
//         message: "User does not exist with this employee code"
//       });
//     }
//   } catch (error) {
//     logger.error('User Controller: Error in login process', error);
//     return res.status(500).json({
//       resultCode: 1,
//       resultText: "failed",
//       message: "Employee code or password not found",
//     });
//   }
// };



const login = async (req, res) => {
  try {
    const user = await UsersService.findByUserId(req.body.employeeCode);

    if (user) {

      if (user.user_type == 1) {

        const isPasswordValid = req.body.password
          ? await bcrypt.compareSync(req.body.password, user.password)
          : false;

        if (!isPasswordValid) {
          return res.status(401).json({
            resultCode: 1,
            resultText: "failed",
            message: "Password didn't match"
          });
        }

        // ⬇️ Generate Full Token
        const userrole = await UsersService.getUserRole(user.id);
        const userLogData = await UsersService.addUserLog(req, user);
        const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

        // console.log('DMS_PV Login →', {
        //   id: user.id,
        //   employeeCode: user.user_id,
        //   employeeName: user.employee?.employeeName,
        //   employeeId: user.employeeId,
        //   userType: user.user_type,
        //   phone: user.phone,
        //   roleId: userrole.roleId,
        //   roleName: userrole.role_name,
        //   outlet: employee.outlet,
        //   reportAccess: employee.reports === false ? 0 : 1,
        // });

        const userToken = JWT.sign({
          id: user.id,
          employeeCode: user.user_id,
          employeeName: user.employee.employeeName,
          employeeId: user.employeeId,
          reportAccess: employee.reports === false ? 0 : 1,
          outlet: employee.outlet,
          roleid: userrole.roleId,
          roleName: userrole.role_name,
          loginId: userLogData.id
        }, JwtConfig.secret, {
          expiresIn: JwtConfig.expiresIn,
          notBefore: JwtConfig.notBefore,
          algorithm: JwtConfig.algorithm
        });

        return res.status(200).json({
          resultCode: 0,
          resultText: "Success",
          requestSuccessful: true,
          message: "Login Successfully",
          id: user.id,
          roleId: userrole.roleId,
          roleName: userrole.role_name,
          // email: user.email,
          employeeCode: user.user_id,
          employeeName: user.employee.employeeName,
          phone: user.phone,
          employeeId: user.employeeId,
          reportAccess: employee.reports === false ? 0 : 1,
          // outlet: employee.outlet,
          token: userToken
        });
      }
      const LOCK_TIME = 30 * 60 * 1000; // 30 mins
      const lastFailedTime = user.last_login
        ? new Date(user.last_login).getTime()
        : 0;

      if (
        user.wrong_count >= 3 &&
        Date.now() - lastFailedTime > LOCK_TIME
      ) {
        await User.update(
          { wrong_count: 0 },
          { where: { id: user.id } }
        );
        user.wrong_count = 0;
      }

      if (
        user.wrong_count >= 3 &&
        new Date(user.last_login).getTime() + (1000 * 60 * 30) > Date.now()
      ) {
        return res.status(500).json({
          resultCode: 1,
          resultText: "failed",
          message: "You entered the wrong password 3 times. Your account suspended For 30 mins. Contact admin for more details",
        });
      }

      const PASSWORD_EXPIRY_DAYS = 30;

      const passwordChangedAt = new Date(user.password_changed_at).getTime();
      const now = Date.now();
      const diffInDays = (now - passwordChangedAt) / (1000 * 60 * 60 * 24);
      console.log('diffInDays', diffInDays);


      if (req.body.password ? bcrypt.compareSync(req.body.password, user.password) : null) {

        if (user.is_first_login == 0) {
          let userToken = JWT.sign({
            user_id: req.body.employeeCode,
            id: user.id,
          }, JwtConfig.secret, {
            expiresIn: '30m', // this will be in ms, here 30 mins is the limit
            notBefore: 0, // after 0 min we are able to use this token value
            algorithm: 'HS256'
          });

          return res.status(301).json({
            resultCode: 2,
            resultText: "password_expired",
            message: "Welcome,Please Create Your Own Password for Privacy.",
            token: userToken
          });
        }



        if (diffInDays >= PASSWORD_EXPIRY_DAYS) {
          // create token with user.id and send it into response so that frontend can use that token to call change password API

          let userToken = JWT.sign({
            user_id: req.body.employeeCode,
            id: user.id,
          }, JwtConfig.secret, {
            expiresIn: '30m', // this will be in ms, here 30 mins is the limit
            notBefore: 0, // after 0 min we are able to use this token value
            algorithm: 'HS256'
          });

          return res.status(500).json({
            resultCode: 2,
            resultText: "password_expired",
            message: "Your password has expired. Please change your password.",
            token: userToken
          });
        }

        // const userrole = await UsersService.getUserRole(user.id);
        // const userLogData = await UsersService.addUserLog(req, user);
        // const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

        // const userToken = JWT.sign({
        //   id: user.id,
        //   employeeCode: user.user_id,
        //   employeeName: user.employee.employeeName,
        //   employeeId: user.employeeId,
        //   reportAccess: employee.reports === false ? 0 : 1,
        //   outlet: employee.outlet,
        //   roleid: userrole.roleId,
        //   roleName: userrole.role_name,
        //   loginId: userLogData.id
        // }, JwtConfig.secret, {
        //   expiresIn: JwtConfig.expiresIn, // 55 minutes
        //   notBefore: JwtConfig.notBefore,
        //   algorithm: JwtConfig.algorithm
        // });
        // let reqdata={token:userToken}
        let reqdata = {};
        if (req.body.fcm_tocken) {
          reqdata.fcm_tocken = req.body.fcm_tocken;
          const saveToken = await User.update(reqdata, { where: { id: user.id } });

          if (saveToken[0] === 0) {
            return res.status(500).json({
              resultCode: 1,
              resultText: "failed",
              message: "Fcm not saved"
            });
          }
        }

        //  resetUserLoginAttempts(req.ip,req.body.employeeCode);
        //        res.cookie('auth_token', userToken, {
        //   path: '/',
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production', // true in production
        //   sameSite: 'Strict', // Or 'Lax' depending on your needs
        //   maxAge: JwtConfig.expiresIn*1000, // same as token expiry, 55 minutes
        // });
        const resetloginCount = await User.update({
          wrong_count: 0,
        }, { where: { id: user.id } });

        const loginUserRole = await UsersService.getUserRole(user.id);

        console.log('DMS_PV Login →', {
          id: user.id,
          employeeCode: user.user_id,
          employeeName: user.employee?.employeeName,
          employeeId: user.employeeId,
          userType: user.user_type,
          phone: user.phone,
          roleId: loginUserRole?.roleId,
          roleName: loginUserRole?.role_name,
        });

        return res.status(200).json({
          resultCode: 0,
          resultText: "Success",
          requestSuccessful: true,
          message: "Details Match",
          id: user.id,
          // roleId: userrole.roleId,
          // roleName: userrole.role_name,
          // email: user.email,
          employeeCode: user.user_id,
          // employeeName: user.employee.employeeName,
          // phone: user.phone,
          // employeeId: user.employeeId,
          // reportAccess: employee.reports === false ? 0 : 1,
          // outlet: employee.outlet,
          // token: userToken
        });
      } else {
        // recordLoginFailure(req.ip, req.body.employeeCode,true);
        // const recordwrongcount = await User.update({
        //   wrong_count: user.wrong_count + 1,
        //   last_login: new Date()
        // }, { where: { id: user.id } });
        // console.log(recordwrongcount, "login failure")
        return res.status(500).json({
          resultCode: 1,
          resultText: "failed",
          message: "Password didn't match"
        });
      }
    } else {
      // recordLoginFailure(req.ip,null,false);
      logger.error('User Controller: User does not exist with this employee code');
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "User does not exist with this employee code"
      });
    }
  } catch (error) {
    logger.error('User Controller: Error in login process', error);
    return res.status(500).json({
      resultCode: 1,
      resultText: "failed",
      message: "Employee code or password not found",
    });
  }
};



const bridge_login = async (req, res) => {
  try {
    const user = await UsersService.findByUserId(req.body.employeeCode);
    if (user) {
      if (req.body.password ? bcrypt.compareSync(req.body.password, user.password) : null) {

        const userrole = await UsersService.getUserRole(user.id);
        const userLogData = await UsersService.addUserLog(req, user);
        const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

        const userToken = JWT.sign({
          id: user.id,
          employeeCode: user.user_id,
          employeeName: user.employee.employeeName,
          employeeId: user.employeeId,
          reportAccess: employee.reports === false ? 0 : 1,
          outlet: employee.outlet,
          roleid: userrole.roleId,
          roleName: userrole.role_name,
          loginId: userLogData.id
        }, JwtConfig.secret, {
          expiresIn: "30d", // 55 minutes
          notBefore: JwtConfig.notBefore,
          algorithm: JwtConfig.algorithm
        });
        let reqdata = { token: userToken }
        if (req.body.fcm_tocken) {
          reqdata.fcm_tocken = req.body.fcm_tocken
        }
        const saveToken = await User.update(reqdata, { where: { id: user.id } });

        if (saveToken[0] === 0) {
          return res.status(500).json({
            resultCode: 1,
            resultText: "failed",
            message: "Token not saved"
          });
        }
        //  resetUserLoginAttempts(req.ip,req.body.employeeCode);
        //        res.cookie('auth_token', userToken, {
        //   path: '/',
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production', // true in production
        //   sameSite: 'Strict', // Or 'Lax' depending on your needs
        //   maxAge: JwtConfig.expiresIn*1000, // same as token expiry, 55 minutes
        // });
        return res.status(200).json({
          resultCode: 0,
          resultText: "Success",
          requestSuccessful: true,
          message: "User Logged In Successfully",
          id: user.id,
          roleId: userrole.roleId,
          // roleName: userrole.role_name,
          // email: user.email,
          // employeeCode: user.user_id,
          // employeeName: user.employee.employeeName,
          // phone: user.phone,
          // employeeId: user.employeeId,
          // reportAccess: employee.reports === false ? 0 : 1,
          // outlet: employee.outlet,
          token: userToken
        });
      } else {
        // recordLoginFailure(req.ip, req.body.employeeCode,true);
        return res.status(500).json({
          resultCode: 1,
          resultText: "failed",
          message: "Password didn't match"
        });
      }
    } else {
      // recordLoginFailure(req.ip,null,false);
      logger.error('User Controller: User does not exist with this employee code');
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "User does not exist with this employee code"
      });
    }
  } catch (error) {
    logger.error('User Controller: Error in login process', error);
    return res.status(500).json({
      resultCode: 1,
      resultText: "failed",
      message: "Employee code or password not found",
    });
  }
};

// const loginMobile = async (req, res) => {
//   await sendNotificationDataToToken("dVeloM7_QkGZE_UaVcO_Aw:APA91bGkay8NkRkzvKNY_VD6lXeRj-3M1Z_p0OpHxcMmp-Ntuaaebc2adRUS-77MJxFE1vyo0UCg-cAedOFKCZvl8eLuyeCtN_4ku3sk0qO9AENvEpBUk_s",
//     {
//       title: "login",
//       body: "Login done for the user " + req.body.userId,
//       tab: "SAA",
//       visitID: "53"
//     }
//   )
// }

const loginMobile = async (req, res) => {

  console.log('entering inisde loginMobile');
  console.log('user id', req.body.userId);

  try {

    const user = await UsersService.findByUserId(req.body.userId);
    if (user) {
      console.log('user details', user);
      if (req.body.password ? bcrypt.compareSync(req.body.password, user.password) : null) {

        const userrole = await UsersService.getUserRole(user.id);
        const userLogData = await UsersService.addUserLog(req, user);
        const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);
        // const customerAccountId = await UsersService.getCustomerAccountId(user.customer_account_id)

        const userToken = JWT.sign({
          id: user.id,
          employeeCode: user.user_id,
          employeeName: user.employee.employeeName,
          employeeId: user.employeeId,
          outlet: employee.outlet,
          roleid: userrole.roleId,
          roleName: userrole.role_name,
          loginId: userLogData.id
        }, JwtConfig.secret, {
          expiresIn: '30d',  //Expires in 1 months for the mobile login API alone
          notBefore: JwtConfig.notBefore,
          algorithm: JwtConfig.algorithm
        });

        const saveToken = await User.update({
          mobile_token: userToken,
          appversion: req.body.AppVersion,
          phonemodel: req.body.MODEL,
          version_code: req.body.VersionCode,
          phonemanufacture: req.body.MANUFACTURER,
          fcm_tocken: req.body.FCM_TOKEN,
          networktype: req.body.NETWORK_TYPE,
          sdk_version: req.body.SDK_VERSION,
          updatedBy: req.body.userId
        }, { where: { id: user.id } });

        if (saveToken[0] === 0) {
          return res.status(500).json({
            resultCode: 1,
            resultText: "failed",
            message: "Token not saved"
          });
        }


        let userRole = "";
        if (userrole.role_name == "manger") {
          userRole = "ROLE_MGR"
        } else if (userrole.role_name == "Service Advisor") {
          userRole = "ROLE_SA"
        } else if (userrole.role_name == "Technician") {
          userRole = "ROLE_TS"
        } else if (userrole.role_name == "Security") {
          userRole = "ROLE_SEC"
        } else if (userrole.role_name == "Floor Incharge") {
          userRole = "ROLE_QI"
        } else if (userrole.role_name == "GateIN") {
          userRole = "ROLE_GI"
        } else if (userrole.role_name == "Audit") {
          userRole = "ROLE_MOVE_AUDIT"
        }

        let OutletCategory = "FRANCHISEE";

        // if (employee.outlet.companyName == "FOCO") {
        //   OutletCategory = "FRANCHISEE"
        // } else if (employee.outlet.companyName == "COCO") {
        //   OutletCategory = "DEALERSHIP"
        // }

        let userDetail = {
          userId: user.id.toString(),
          UserRole: userRole,
          // userType: "",
          firstName: employee.employeeName, //employee.outlet.employeeName,
          // lastName: "",
          email: employee.email, //user.email,
          mobileNumber: employee.mobileNumber.toString(), //user.phone,
          segment: employee.outlet.outletSegment,
          branch: employee.outlet.branch,
          companyId: employee.outlet.companyId.toString(),
        };

        let carpmscanRequired = false;
        let agentCodeRequired = false;
        let inspectionPhotosRequired = false;

        console.log(employee.outletSettingMany);
        employee.outletSettingMany.forEach(element => {
          if (element.CONFIG == 'CARPM SCANNING') {
            if (element.VALUE == 'true') {
              carpmscanRequired = true
            }
          }
          if (element.CONFIG == 'DSA_AGENT_DETAILS_MANDATORY') {
            if (element.VALUE == 'true') {
              agentCodeRequired = true
            }
          }
          if (element.CONFIG == 'INSPECTION_PHOTO_MANDATORY') {
            if (element.VALUE == 'true') {
              inspectionPhotosRequired = true
            }
          }
        });

        return res.status(200).json({
          requestSuccessful: true,
          authenticationToken: userToken,
          OutletCategory: OutletCategory,
          OutletCode: employee.outlet.outletCode,
          AutosolCompanyID: "",
          AutosolCode: "",
          OutletSegment: employee.outlet.outletSegment,
          OutletAddress: employee.outlet.address1,
          OutletName: employee.outlet.outletName,
          OutletCity: employee.outlet.city,
          OutletState: employee.outlet.state,
          OutletId: employee.outlet.id,
          CustomerAccountType: employee.outlet.company.customer_account_type,
          MaxLabourDiscount: employee.outlet.maxLabourDiscountPercentage,
          MaxPartDiscount: employee.outlet.maxPartDiscountPercentage,
          carpmscanRequired: carpmscanRequired,
          agentCodeRequired: agentCodeRequired,
          inspectionPhotosRequired: inspectionPhotosRequired,
          userDetails: userDetail,
        });
      } else {
        return res.status(400).json({
          resultCode: 1,
          resultText: "failed",
          ErrorDescription: "Authentication failed Password didn't match"
        });
      }
    } else {
      console.log('user details failed');
      logger.error('User Controller: User does not exist with this employee code');
      return res.status(400).json({
        resultCode: 1,
        resultText: "failed",
        // message: "User does not exist with this employee code"
        ErrorDescription: " Authentication failed User does not exist with this employee code"
      });
    }
  } catch (error) {
    console.log('catch err', error);
    logger.error('User Controller: Error in login process', error);
    return res.status(400).json({
      resultCode: 1,
      resultText: "failed",
      ErrorDescription: " Authentication failed User does not exist with this employee code"
    });
  }
};

const menuList = async (req, res, next) => {
  try {
    const auditData = {};
    const menulist = await UsersService.getMenulist(req.body.roleId);
    auditData['message'] = 'Get Menu list ';
    auditData['result'] = 'success ';
    auditData['menu_name'] = '';
    auditData['submenu_name'] = '';
    auditData['action'] = 'GET';
    auditLog.createAuditLog(req, auditData);
    res.status(200).send({
      requestSuccessful: true,
      menuList: menulist,
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const getUserRoles = async (req, res, next) => {
  try {
    const auditData = {};
    const roles = await UsersService.getUserRoles(req.user.id);
    auditData['message'] = 'Get All user roles';
    auditData['result'] = 'success ';
    auditData['menu_name'] = '';
    auditData['submenu_name'] = '';
    auditData['action'] = 'GET';
    auditLog.createAuditLog(req, auditData);
    res.status(200).send({
      requestSuccessful: true,
      roleList: roles,
    });
  } catch (err) {
    logger.error('User Controller getUserRoles Error:', err);
    next(err);
  }
};

const getSecondryRoles = async (req, res, next) => {
  const data = await UsersService.getSecondryRoles(req.body);
  res.status(200).send({
    requestSuccessful: true,
    menuList: data,
  });
};

// validate token api
const validateToken = async (req, res) => {
  // console.log(req.headers);
  let userToken = req.headers['authorization'];

  if (userToken) {
    // we have token
    JWT.verify(userToken, JwtConfig.secret, (error, decoded) => {
      if (error) {
        // console.log(error);
        res.status(500).json({
          message: 'Invalid Token',
          data: error,
        });
      } else {
        // console.log(decoded);
        res.status(200).json({
          message: 'Token is valid',
          data: decoded,
        });
      }
    });
  } else {
    // not getting token value
    res.status(500).json({
      message: 'Please provide authentication token value',
    });
  }
};

const getOneUser = async (req, res, next) => {
  console.log('inside route getOneUser')
  try {
    const user = await UsersService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    logger.error('User Controller getOneUser Error:', err);
    next(err);
  }
};

const employeeRoleMapping = async (req, res, next) => {
  try {
    let { employeeId, roleId } = req.body;

    let employeeDetails = await UsersService.findEmployee(employeeId);
    if (employeeDetails) {
      console.log(employeeDetails);
      const user = await UsersService.createEmployeeRoleMap(employeeDetails);
      const userRole = await UsersService.createUserRoleMap(user, roleId).then(
        async () => {
          return await UsersService.createUserOutletMap(
            user.id,
            employeeDetails.outletId
          );
        }
      );

      return res.status(200).json({
        requestSuccessful: true,
        message: 'Data Saved Successfully',
      });
    }
  } catch (err) {
    logger.error('User Controller employeeRoleMapping Error:', err);
    console.log(err);
    next(err);
  }
};

const logout = async (req, res, next) => {
  let data = {};
  try {
    data = await UsersService.logout(req);
    //    await res.clearCookie('auth_token', {
    //         path: '/',
    //       httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production', // true in production
    //   sameSite: 'Strict', // Or 'Lax' depending on your needs
    // });

    // await res.clearCookie('x-csrf-token', {
    //     sameSite: "strict",
    //     path: "/",
    //     secure: process.env.NODE_ENV === "production",
    //     httpOnly: false,
    // });

    return res.status(200).json({
      requestSuccessful: true,
      message: 'User logged out Successfully',
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  let data = {};
  try {
    data = await UsersService.listUsers(req);

    return res.status(200).json({
      requestSuccessful: true,
      userdata: data,
    });
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const getUserLog = async (req, res, next) => {
  let data = {};
  try {
    const auditData = {};
    data = await UsersService.getUserLog(req);
    auditData['menu_name'] = 'Log';
    auditData['submenu_name'] = 'User logs';
    auditData['access'] = 'Portal';
    auditData['action'] = 'View';
    if (data) {
      auditData['message'] = 'Get user logs ';
      auditData['result'] = 'success ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    } else {
      auditData['message'] = 'Get user logs';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        data: data,
      });
    }
  } catch (err) {
    logger.error('User Controller menuList Error:', err);
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    logger.info(
      'User Controller deleteUser requestData:' + JSON.stringify(req.body)
    );
    const auditData = {};
    auditData['menu_name'] = 'Log';
    auditData['submenu_name'] = 'User logs';
    auditData['action'] = ACTION_UPDATE;
    const id = req.body.id;
    let result = await UsersService.deleteUser(id, req.user);
    if (result == 'success') {
      auditData['message'] = 'User deleted successfully ';
      auditData['result'] = 'success';
      auditLog.createAuditLog(req, auditData);
      res.status(200).send({
        requestSuccessful: true,
        message: 'User deleted successfully',
      });
    } else {
      auditData['message'] = 'User not deleted';
      auditData['result'] = 'failed ';
      auditLog.createAuditLog(req, auditData);
      return res.status(200).send({
        requestSuccessful: true,
        message: 'User not deleted',
      });
    }
  } catch (err) {
    logger.error('User Controller deleteUser Error:', err);
    next(err);
  }
};

const emailToForgotPwd = async (req, res, next) => {
  try {
    let response = await UsersService.emailToForgotPwd(req, res);
    if (response.result == 'success') {
      return res.status(200).send({
        requestSuccessful: true,
        result: response.result,
        message: response.message,
      });
    } else {
      return res.status(200).send({
        requestSuccessful: true,
        result: response.result,
        message: response.message,
      });
    }
  } catch (err) {
    logger.error('Uom Controller emailTest Error:', err);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    let response = await UsersService.resetPassword(req, res);
    if (response.result == 'success') {
      return res.status(200).send({
        requestSuccessful: true,
        result: response.result,
        message: response.message,
      });
    } else {
      return res.status(401).send({
        requestSuccessful: false,
        result: response.result,
        message: response.message,
      });
    }
  } catch (err) {
    logger.error('Uom Controller emailTest Error:', err);
    next(err);
  }
};

const checkSecretPin = async (req, res, next) => {
  // console.log('req from frontend',req.body)
  try {
    const user = await UsersService.findByUserId(req.body.userId);
    //  console.log('dddddddddddd',user)
    if (req.body.pin ? bcrypt.compareSync(req.body.pin, user.user_pin_hash) : null) {

      //  if (req.body.password ? bcrypt.compareSync(req.body.password, user.password) : null) {

      const userrole = await UsersService.getUserRole(user.id);
      const userLogData = await UsersService.addUserLog(req, user);
      const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

      const userToken = JWT.sign({
        id: user.id,
        employeeCode: user.user_id,
        employeeName: user.employee.employeeName,
        employeeId: user.employeeId,
        reportAccess: employee.reports === false ? 0 : 1,
        outlet: employee.outlet,
        roleid: userrole.roleId,
        roleName: userrole.role_name,
        loginId: userLogData.id
      }, JwtConfig.secret, {
        expiresIn: JwtConfig.expiresIn, // 55 minutes
        notBefore: JwtConfig.notBefore,
        algorithm: JwtConfig.algorithm
      });
      let reqdata = { token: userToken }
      if (req.body.fcm_tocken) {
        reqdata.fcm_tocken = req.body.fcm_tocken
      }
      const saveToken = await User.update(reqdata, { where: { id: user.id } });

      if (saveToken[0] === 0) {
        return res.status(500).json({
          resultCode: 1,
          resultText: "failed",
          message: "Token not saved"
        });
      }

      return res.status(200).json({
        resultCode: 0,
        resultText: "Success",
        requestSuccessful: true,
        message: "User Logged In Successfully",
        id: user.id,
        roleId: userrole.roleId,
        roleName: userrole.role_name,
        email: user.email,
        employeeCode: user.user_id,
        employeeName: user.employee.employeeName,
        phone: user.phone,
        employeeId: user.employeeId,
        reportAccess: employee.reports === false ? 0 : 1,
        outlet: employee.outlet,
        token: userToken
      });
    } else {
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "Secret Pin didn't match"
      });
    }

  } catch (err) {
    logger.error('Uom Controller Secret Pin Error:', err);
    next(err);
  }
};

const getAppConfig = async (req, res, next) => {
  try {
    const auditData = {};
    const roles = await UsersService.getAppConfig();
    auditData['message'] = 'Get All configuration';
    auditData['result'] = 'success ';
    auditData['menu_name'] = '';
    auditData['submenu_name'] = '';
    auditData['action'] = 'GET';
    auditLog.createAuditLog(req, auditData);
    res.status(200).send({
      requestSuccessful: true,
      roleList: roles,
    });
  } catch (err) {
    logger.error('User Controller getAppConfig Error:', err);
    next(err);
  }
};

const CreateGmsRedirctUrl = async (req, res, next) => {
  try {
    let redirectUrl = await UsersService.CreateGmsRedirctUrl(req);
    if (!req.query.type) {
      return res.status(400).send({
        requestSuccessful: false,
        message: "Type query param is required"
      });
    }
    if (!redirectUrl) {
      return res.status(500).send({
        requestSuccessful: false,
        message: "Error in creating redirect URL"
      });
    }
    return res.status(200).send({
      requestSuccessful: true,
      message: "Redirect URL created successfully",
      redirectUrl
    });

  } catch (err) {
    logger.error('User Controller Create Gms Redirct Url Error:', err);
    next(err);
  }
};

const gmsLogin = async (req, res) => {
  try {
    let gmstoken = req.body.token;
    if (!gmstoken) {
      return res.status(400).json({
        resultCode: 1,
        resultText: "failed",
        message: "GMS token is required"
      });
    }
    const verifyGmsToken = await UsersService.verifyGmsToken(gmstoken);
    if (!verifyGmsToken) {
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "Invalid or expired GMS token"
      });
    }

    const user = await UsersService.findByUserId(verifyGmsToken.user_id);
    if (user) {

      const userrole = await UsersService.getUserRole(user.id);
      const userLogData = await UsersService.addUserLog(req, user);
      const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

      const userToken = JWT.sign({
        id: user.id,
        employeeCode: user.user_id,
        employeeName: user.employee.employeeName,
        employeeId: user.employeeId,
        reportAccess: employee.reports === false ? 0 : 1,
        outlet: employee.outlet,
        roleid: userrole.roleId,
        roleName: userrole.role_name,
        loginId: userLogData.id,
        type: verifyGmsToken.type
      }, JwtConfig.secret, {
        expiresIn: JwtConfig.expiresIn, // 55 minutes
        notBefore: JwtConfig.notBefore,
        algorithm: JwtConfig.algorithm
      });
      let reqdata;
      if (verifyGmsToken.type === 4) {
        reqdata = { token: userToken }
      }else{
        reqdata = { mobile_token: userToken }
      }

      const saveToken = await User.update(reqdata, { where: { id: user.id } });

      if (saveToken[0] === 0) {
        return res.status(500).json({
          resultCode: 1,
          resultText: "failed",
          message: "Token not saved"
        });
      }
      //  resetUserLoginAttempts(req.ip,req.body.employeeCode);
      //        res.cookie('auth_token', userToken, {
      //   path: '/',
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production', // true in production
      //   sameSite: 'Strict', // Or 'Lax' depending on your needs
      //   maxAge: JwtConfig.expiresIn*1000, // same as token expiry, 55 minutes
      // });


      return res.status(200).json({
        resultCode: 0,
        resultText: "Success",
        requestSuccessful: true,
        message: "User Logged In Successfully",
        id: user.id,
        roleId: userrole.roleId,
        roleName: userrole.role_name,
        email: user.email,
        employeeCode: user.user_id,
        employeeName: user.employee.employeeName,
        phone: user.phone,
        employeeId: user.employeeId,
        reportAccess: employee.reports === false ? 0 : 1,
        outlet: employee.outlet,
        token: userToken
      });

    } else {
      // recordLoginFailure(req.ip,null,false);
      logger.error('User Controller: User does not exist with this employee code');
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "User does not exist with this employee code"
      });
    }
  } catch (error) {
    logger.error('User Controller: Error in login process', error);
    return res.status(500).json({
      resultCode: 1,
      resultText: "failed",
      message: "Employee code or password not found",
    });
  }
};

const GMS_PURCHASE_SUBMENU_PATHS = [
  "/grn",
  "/oracleAutoGrn",
  "/partsMartGrn",
  "/taslAutoGrn"
];
const GMS_SALES_SUBMENU_PATHS = [
  "/spareIssue",
  "/spareReturn",
]
const gmsmenuList = async (req, res, next) => {
  try {
    const auditData = {};
    let menulist = await UsersService.getMenulist(req.body.roleId);
    console.log(menulist,"menulistt")
    if (req.user.type == 1) {
      menulist = menulist
        .filter(menu => menu.title.trim().toLowerCase() === "purchase")
        .map(menu => ({
          ...menu,
          submenu: menu.submenu.filter(sub =>
            GMS_PURCHASE_SUBMENU_PATHS.includes(sub.path)
          )
        }));
    }
    else if (req.user.type == 2) {
      menulist = menulist
        .filter(menu => menu.title.trim().toLowerCase() === "sales")
        .map(menu => ({
          ...menu,
          submenu: menu.submenu.filter(sub =>
            GMS_SALES_SUBMENU_PATHS.includes(sub.path)
          )
        }));
    }
    else if (req.user.type == 3) {
      menulist = menulist
        .filter(menu => menu.title === "Parts Catalogue New")
      // .map(menu => ({
      //   ...menu,
      //   submenu: menu.submenu.filter(sub =>
      //     GMS_PART_CATOLOGUE.includes(sub.path)
      //   )
      // }));
    }
    else if (req.user.type == 4) {
      menulist = menulist.filter(
        menu => menu.path == "/accountStatement" || menu.title=="SOA"
      );
    }
    else {
      menulist = [];
    }

    auditData.message = "Get GMS Menu list";
    auditData.result = "success";
    auditData.menu_name = "Purchase";
    auditData.submenu_name = "GRN related";
    auditData.action = "GET";

    auditLog.createAuditLog(req, auditData);

    res.status(200).send({
      requestSuccessful: true,
      menuList: menulist
    });
  } catch (err) {
    logger.error("User Controller gmsmenuList Error:", err);
    next(err);
  }
};

const saveattendence = async (req, res, next) => {
  try {
    const auditData = {};
    const attendance = await UsersService.saveattendence(req, res);
    auditData['message'] = 'Save Attendance';
    auditData['result'] = 'success ';
    auditData['menu_name'] = '';
    auditData['submenu_name'] = '';
    auditData['action'] = 'POST';
    auditLog.createAuditLog(req, auditData);
    if (attendance.status) {
      res.status(200).send({
        requestSuccessful: true,
        status: "Success"
      });
    } else {
      res.status(400).send({
        requestSuccessful: false,
        ErrorDescription: attendance.message
      });
    }
  } catch (err) {
    logger.error('User Controller saveattendence Error:', err);
    next(err);
  }
}

const CreatePartsCatalogueRedirctUrl = async (req, res, next) => {
  try {
    console.log('CreatePartsCatalogueRedirctUrl req.query', req.query);
    let redirectUrl = await UsersService.CreatePartsCatalogueRedirctUrl(req);
    if (!req.query.type) {
      return res.status(400).send({
        requestSuccessful: false,
        message: "Type query param is required"
      });
    }
    if (!redirectUrl) {
      return res.status(500).send({
        requestSuccessful: false,
        message: "Error in creating redirect URL"
      });
    }
    return res.status(200).send({
      requestSuccessful: true,
      message: "Redirect URL created successfully",
      redirectUrl
    });

  } catch (err) {
    logger.error('User Controller Create Gms Redirct Url Error:', err);
    next(err);
  }
};

const dmsPartsCatalogueLogin = async (req, res) => {
  try {
    let dmstoken = req.body.token;
    if (!dmstoken) {
      return res.status(400).json({
        resultCode: 1,
        resultText: "failed",
        message: "DMS token is required"
      });
    }
    const verifyDmsToken = await UsersService.verifyDmsToken(dmstoken);
    if (!verifyDmsToken) {
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: "Invalid or expired DMS token"
      });
    }

    return res.status(200).json({
      resultCode: 0,
      resultText: "Success",
      requestSuccessful: true,
      message: "DMS token verified successfully",
      tokenData: verifyDmsToken
    });

    // const user = await UsersService.findByUserId(verifyDmsToken.user_id);
    // if (user) {

    //   const userrole = await UsersService.getUserRole(user.id);
    //   const userLogData = await UsersService.addUserLog(req, user);
    //   const employee = await EmpoyeeDao.findByemployeeById(user.employeeId);

    //   const userToken = JWT.sign({
    //     id: user.id,
    //     employeeCode: user.user_id,
    //     employeeName: user.employee.employeeName,
    //     employeeId: user.employeeId,
    //     reportAccess: employee.reports === false ? 0 : 1,
    //     outlet: employee.outlet,
    //     roleid: userrole.roleId,
    //     roleName: userrole.role_name,
    //     loginId: userLogData.id,
    //     type: verifyDmsToken.type
    //   }, JwtConfig.secret, {
    //     expiresIn: JwtConfig.expiresIn, // 55 minutes
    //     notBefore: JwtConfig.notBefore,
    //     algorithm: JwtConfig.algorithm
    //   });
    //   let reqdata = { token: userToken }

    //   const saveToken = await User.update(reqdata, { where: { id: user.id } });

    //   if (saveToken[0] === 0) {
    //     return res.status(500).json({
    //       resultCode: 1,
    //       resultText: "failed",
    //       message: "Token not saved"
    //     });
    //   }
    //   //  resetUserLoginAttempts(req.ip,req.body.employeeCode);
    //   //        res.cookie('auth_token', userToken, {
    //   //   path: '/',
    //   //   httpOnly: true,
    //   //   secure: process.env.NODE_ENV === 'production', // true in production
    //   //   sameSite: 'Strict', // Or 'Lax' depending on your needs
    //   //   maxAge: JwtConfig.expiresIn*1000, // same as token expiry, 55 minutes
    //   // });


    //   return res.status(200).json({
    //     resultCode: 0,
    //     resultText: "Success",
    //     requestSuccessful: true,
    //     message: "User Logged In Successfully",
    //     id: user.id,
    //     roleId: userrole.roleId,
    //     roleName: userrole.role_name,
    //     email: user.email,
    //     employeeCode: user.user_id,
    //     employeeName: user.employee.employeeName,
    //     phone: user.phone,
    //     employeeId: user.employeeId,
    //     reportAccess: employee.reports === false ? 0 : 1,
    //     outlet: employee.outlet,
    //     token: userToken
    //   });

    // } else {
    //   // recordLoginFailure(req.ip,null,false);
    //   logger.error('User Controller: User does not exist with this employee code');
    //   return res.status(500).json({
    //     resultCode: 1,
    //     resultText: "failed",
    //     message: "User does not exist with this employee code"
    //   });
    // }
  } catch (error) {
    logger.error('User Controller: Error in login process', error);
    return res.status(500).json({
      resultCode: 1,
      resultText: "failed",
      message: "Token not found",
    });
  }
};

const controller = {
  addUser,
  login,
  validateToken,
  getOneUser,
  employeeRoleMapping,
  menuList,
  logout,
  getUserLog,
  getUserRoles,
  getRoles,
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  getSecondryRoles,
  emailToForgotPwd,
  resetPassword,
  getAppConfig,
  checkSecretPin,
  loginMobile,
  CreateGmsRedirctUrl,
  gmsLogin,
  bridge_login,
  gmsmenuList,
  saveattendence,
  CreatePartsCatalogueRedirctUrl,
  dmsPartsCatalogueLogin,
};
export default controller;
