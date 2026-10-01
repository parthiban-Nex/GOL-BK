import db from '../index.js';
import NotFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op, where } from 'sequelize';
import UserDao from './dao.js';
import bcrypt from 'bcrypt';
import RecentAcivityService from '../recentActivity/service.js';
import employeeDao from '../employee/dao.js';
import emailConfig from '../../config/emailConfig.js';
import JwtConfig from '../../config/jwtConfig.js';
import nodemailer from 'nodemailer';
import JWT from 'jsonwebtoken';

const User = db.users;
const UserRoleMap = db.userrolemaps;
const menu=db.menudatas;
const subMenu=db.subMenudatas;
const roleSettings=db.rolesettingsdatas;
const userLog= db.userlog;
const RoleSubmenuButtons=db.roleSubmenuButtons;
const sequelize=db.sequelize
 const Employee = db.employees;
 //const UserRoleMap = db.userrolemaps;
 const UserOutletMap = db.useroutletmaps;
 const Role=db.role;
 const customerAccountId = db.MasterCustomerAccount;



const findByUserId = async (userId) => {
  //const data= await UserDao.findByUserId(userId);
  return await UserDao.findByUserId(userId);
};

const findUniqueUserId = async (userId, id) => {
  //const data= await UserDao.findUniqueUserId(userId);
  return await UserDao.findUniqueUserId(userId, id);
};

const addUser = async (body, user) => {
  let recentActivityData = {};
  let data = {};
  let result = '';
  try {
    data = await UserDao.addUser(body, user);
    if (data && body.role) {
      await createUserRoleMap(data, body, 1);
      if (body.roles) {
        let roleList = body.roles;
        roleList.forEach(async (element) => {
          if (element.id != body.role) {
            let roledata1 = {};
            roledata1['role'] = element.id;
            roledata1['roleName'] = element.roleName;
            await createUserRoleMap(data, roledata1, 0);
          }
        });
      }

      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'Users';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] = body.user_id + ' User is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error('User Service addUser Error:', err);
  }
  return result;
};

const updateUser = async (body, user) => {
  let recentActivityData = {};
  let data = {};
  let result = '';
  let message = '';
  try {
    const userExist = await UserDao.findUserById(body.id);
    const userPrimaryRole = await getUserRole(body.id);
    if (userExist) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'Users';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;

      if (userExist.user_id != body.user_id) {
        message =
          message +
          ' user_id changed from ' +
          userExist.user_id +
          ' to ' +
          body.user_id +
          ' ,';
      }
      if (userExist.status != body.status) {
        message =
          message +
          ' status changed from ' +
          userExist.status +
          ' to ' +
          body.status +
          ' ,';
      }
      if (userExist.employeeId != body.employeeId) {
        message =
          message +
          ' EmployeeId changed from ' +
          userExist.employeeId +
          ' to ' +
          body.employeeId +
          ' ,';
      }
      if (userPrimaryRole.roleId != body.role) {
        message =
          message +
          ' Role changed from ' +
          userPrimaryRole.roleId +
          ' to ' +
          body.role +
          ' ,';
      }

      message = message.slice(0, -1);
      data = await UserDao.updateUser(body, user);
      if (data && body.role) {
        await UserDao.deleteUserRoleMap(body.id, user);
        const user1 = {};
        (user1['id'] = body.id), await createUserRoleMap(user1, body, 1);
        if (body.roles) {
          let roleList = body.roles;
          roleList.forEach(async (element) => {
            if (element.id != body.role) {
              let roledata1 = {};
              roledata1['role'] = element.id;
              roledata1['roleName'] = element.roleName;
              await createUserRoleMap(user1, roledata1, 0);
            }
          });
        }
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addRecentActivity(recentActivityData);
        }
        result = 'success';
      }
    }
  } catch (err) {
    result = 'failed';
    console.log('User Service addUser Error:', err);
    logger.error('User Service addUser Error:', err);
  }
  return result;
};

const getRoles = async () => {
  const data = await UserDao.getAllRoles();
  return data;
};
const getSecondryRoles = async (reqData) => {
  const data = await UserDao.getSecondryRoles(reqData);
  return data;
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const findByEmployeeCode = async (employeeCode) => {
  return await User.findOne({ where: { employeeCode: employeeCode } });
};

const findByEployeeId = async (employeeId) => {
  return await User.findOne({ where: { employeeId: employeeId, status: 1 } });
};
  const findUniqueEployeeId = async (employeeId,userid) => {
    let data={};
    try {
     data= await User.findOne({
        where: {
            employeeId: employeeId,
          id: {
            [Op.ne] : userid
          },
          status: 1
      }});
      
    } catch (error) {
      console.log("testemp-------",error);
    }
    return data;
  }





const getUser = async (id) => {
  const user = await User.findOne({ where: { id: id } });
  if (!user) {
    throw new NotFoundException();
  }
  return user;
};

const getCustomerAccountId = async (id) => {
  const customerAccountIdresutls = await customerAccountId.findOne({
    where: { CUSTOMER_ACCOUNT_ID: id }
  });
  if (!customerAccountIdresutls) {
    throw new NotFoundException();
  }
  return customerAccountIdresutls;
}

const findEmployee = async (employeeId) => {
  let employee = await Employee.findOne({ where: { id: employeeId } });
  return employee;
};

const getEmployee = async (id) => {
  let employee = await Employee.findOne({ where: { id: id } });
  if (!employee) {
    throw new NotFoundException();
  }
  return employee;
};

const createEmployeeRoleMap = async (employeeDetails) => {
  return await User.create({
    email: employeeDetails.email,
    password: employeeDetails.mobileNumber,
    phone: employeeDetails.mobileNumber,
    employeeCode: employeeDetails.employeeCode,
  });
};

const createUserRoleMap = async (user, roleData, primary) => {
  const reqObj = {
    userId: user.id,
    roleId: roleData.role,
    role_name: roleData.roleName,
    primary_role: primary,
  };

  const res = UserRoleMap.create(reqObj);
  return res;

  // return roleId.forEach(roleId => {
  //   const reqObj = {
  //     userId: user.id,
  //     roleId: roleId,
  //     primary_role : 1
  //   }

  //   // const reqObj = {
  //   //   userId: user.id,
  //   //   roleId: roleId,
  //   //   primary_role : 1
  //   // }

  //   UserRoleMap.create(reqObj).then((res) => {
  //     return res;
  //   })
  // })
};

const createUserOutletMap = async (userId, outletId) => {
  return await UserOutletMap.create({
    userId: userId,
    outletId: outletId,
  });
};

const getUserRole = async (id) => {
  const userRole = await UserRoleMap.findOne({
    where: {userId: id, primary_role :1 },
    include: [{
      model: Role, 
      as: 'rolemap',
      attributes: ['id', 'roleName'],
    }],
  });
  if(!userRole) {
    throw new NotFoundException();
  }
  return userRole;
}

const getRoleSettings = async (id) => {
  const data = await roleSettings.findAll({
    where: { roleId: id, status: 'Active' },
    order: ['menuId'],
  });
  return data;
};

const getMenus = async (id) => {
  const data = menu.findOne({
    where: { id: id },
  });
  return data;
};
const getSubMenus = async (id, roleid) => {
  const data = subMenu.findOne({
    include: [
      {
        model: RoleSubmenuButtons,
        as: 'submenuButtonsMap',
        where: { roleId: roleid },
      },
    ],
    where: { id: id },
  });
  return data;
};

const getUserRoles = async (id) => {
  const roleList = UserRoleMap.findAll({ where: { userId: id } });
  return roleList;
};

const getMenuTabs = async (menuId, roleId) => {
  const [results, metadata] = await sequelize.query(
    'SELECT id, tab_name,tab_menu_operation as buttons FROM role_menu_tab_settings where roleId=' +
      roleId +
      ' and menuId=' +
      menuId
  );
  return results;
};

const getSubMenuTabs = async (menuId, roleId) => {
  const [results, metadata] = await sequelize.query(
    'SELECT id, tab_name,tab_menu_operation as buttons FROM role_menu_tab_settings where roleId=' +
      roleId +
      ' and submenuId=' +
      menuId
  );
  return results;
};

const getMenulist = async (id) => {
  const menuData = [];

  const roleAccess = await getRoleSettings(id);

  for (const roleData of roleAccess) {
    const obj = {};
    const menuData1 = await getMenus(roleData.menuId);
    const menuTab = await getMenuTabs(roleData.menuId, id);

    obj['id'] = menuData1?.id;
    obj['title'] = menuData1?.title;
    obj['icon'] = menuData1?.icon;
    obj['activeIcon'] = menuData1?.activeIcon;
    obj['path'] = menuData1?.path;
    obj['buttons'] = roleData?.menu_operation;

    if (menuTab) {
      obj['menuTab'] = menuTab;
    }

    if (roleData.submenuIds && roleData.submenuIds !== '0') {
      const subMenuListId = roleData.submenuIds.split(',');
      const submenuList = [];

      for (const element of subMenuListId) {
        const obj1 = {};
        const submenuItem = await getSubMenus(element, id);
        const subMenuTabs = await getSubMenuTabs(element, id);
        const subbutton = submenuItem?.submenuButtonsMap ?? null;

        obj1['id'] = submenuItem?.id || null;
        obj1['title'] = submenuItem?.title || null;
        obj1['path'] = submenuItem?.path || null;
        obj1['buttons'] = subbutton ? subbutton[0]?.button_operation || null : null;

        if (subMenuTabs) {
          obj1['menuTab'] = subMenuTabs;
        }

        if(submenuItem?.id){
          submenuList.push(obj1);
        }
      }

      obj['submenu'] = submenuList;
    }
    if(menuData1.id){
      menuData.push(obj);
    }
  }

  const bulkUploadMenu = menuData.find(
    (menuItem) => String(menuItem?.title || '').toLowerCase() === 'bulk upload'
  );
  if (bulkUploadMenu) {
    const submenu = Array.isArray(bulkUploadMenu.submenu) ? bulkUploadMenu.submenu : [];
    const exists = submenu.some((item) => item?.path === '/franchiseUpload');
    if (!exists) {
      submenu.push({
        id: null,
        title: 'Franchise Upload',
        path: '/franchiseUpload',
        buttons: null,
      });
      bulkUploadMenu.submenu = submenu;
    }
  }

  return menuData;
};

const addUserLog = async (req, user) => {
  let data = {};
  try {
    data = userLog.create({
      user_id: user.id,
      username: user.user_id,
      login_time: new Date(),
      access: 'Portal',
    });
  } catch (err) {
    logger.error('Model Dao addModel', err);
  }

  return data;
};

const logout = async (req) => {
  let data = {};
  try {
    const endTime = new Date();
    const userLogData = await userLog.findOne({
      where: { id: req.user.loginId },
    });
    const setActive = await User.update({ active: 0 }, { where: { id: req.user.id } });
    const durationInMilliseconds = endTime - userLogData.login_time;
    const durationInSeconds = Math.floor(durationInMilliseconds / 1000);
    data = await userLog.update(
      {
        logout_time: endTime,
        time_duration: durationInSeconds,
      },
      { where: { id: req.user.loginId } }
    );
  } catch (err) {
    logger.error('User Service logout Error:', err);
    next(err);
  }
  return data;
};

const listUsers = async (req) => {
  let resultData = {};
  let total = {};
  let result = [];
  try {
    const { totalItems, data } = await UserDao.listUsers(req.body);
    total = totalItems;
    resultData = data;
    data.forEach(async (element) => {
      const role = element.userrolemaps[0];
      const roles = element.userrolemaps;
      let primaryRole = '';
      let secondryRoles = '';
      roles.forEach((role) => {
        if (role.primary_role == 1) primaryRole = role.role_name;
        else secondryRoles = secondryRoles + role.role_name + ',';
      });
      const userObj = {};
      userObj['id'] = element.id;
      userObj['user_id'] = element.user_id;
      userObj['employeeId'] = element.employeeId;
      userObj['status'] = element.status;
      userObj['createdBy'] = element.createdBy;
      userObj['employeeName'] = element.employee.employeeName
        ? element.employee.employeeName
        : '';
      userObj['roleName'] = primaryRole; //role.role_name ? role.role_name : "";
      userObj['secondryRoleName'] = secondryRoles.slice(0, -1); //role.role_name ? role.role_name : "";
      userObj['wrong_count']=element.wrong_count
      result.push(userObj);
    });
  } catch (err) {
    logger.error('User Service listUsers Error:', err);
    next(err);
  }
  return { total, result };
};

const getUserLog = async (req) => {
  let data = {};

  try {
    const offset = req.body.offset;
    const limit = req.body.limit;
    data = await userLog.findAndCountAll({
      limit,
      offset,
      order: [['id', 'DESC']],
    });
  } catch (err) {
    logger.error('User Service getUserLog :', err);
    next(err);
  }
  return data;
};

const deleteUser = async (id, user) => {
  let result = 'failed';
  try {
    let data = await UserDao.deleteUser(id, user);
    if (data) {
      await UserDao.deleteUserRoleMap(id, user);
      result = 'success';
    }
  } catch (err) {
    logger.error('User service deleteUser', err);
    next(err);
  }
  return result;
};

// const emailToForgotPwd = async (req,res) => {
//   let message="";
// let result="";
//   try {
// let userEmail=req.body.email;
// let empDetail=await employeeDao.findByEmail(userEmail);
// if(empDetail){
// let userDetail = await UserDao.findUserByEmpId(empDetail.id);
// if(userDetail){
// const transporter = nodemailer.createTransport({
//   service: emailConfig.service,
//   host: emailConfig.host,
//   port: emailConfig.port,
//   secure: emailConfig.secure,
//   auth: emailConfig.auth,
//  });
//  let userToken = JWT.sign({   
//   email :  userEmail,      
//   id: userDetail.id,
// }, JwtConfig.secret, {
//     expiresIn: '30m', // this will be in ms, here 10 mins is the limit
//     notBefore: 0, // after 1 min we are able to use this token value
//     algorithm: 'HS256'
// });
// let token=userToken ;
// let urlReset='http://'+req.hostname+'/userActivation?userId='+userDetail.id + '&token=' +token;

// //  let html1= '<a href="'+urlReset+'">'+ urlReset +'</a>';


// let html1 = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Account Activation</title>
//     <style>
//         body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//             background-color: #f4f4f4;
//         }
//         .email-container {
//             max-width: 600px;
//             margin: 0 auto;
//             background-color: #ffffff;
//             border-radius: 8px;
//             box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//             overflow: hidden;
//         }
//         .header {
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             padding: 30px 20px;
//             text-align: center;
//             color: white;
//         }
//         .header h1 {
//             margin: 0;
//             font-size: 28px;
//             font-weight: 600;
//         }
//         .content {
//             padding: 40px 30px;
//         }
//         .greeting {
//             font-size: 18px;
//             color: #333;
//             margin-bottom: 20px;
//             font-weight: 500;
//         }
//         .message { 
//             font-size: 15px;
//             color: #666;
//             line-height: 1.8;
//             margin-bottom: 30px;
//         }
//         .activation-section {
//             background-color: #f8f9fa;
//             padding: 5px;
//             border-radius: 3px;
//             text-align: center;
//             margin: 5px 0;
//         }
//         .cta-button {
//             display: inline-block;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white !important;
//             text-decoration: none;
//             padding: 7px 20px;
//             border-radius: 3px;
//             font-weight: 400;
//             font-size: 12px;
//             margin: 10px 0;
//             transition: transform 0.2s;
//         }
//         .cta-button:hover {
//             transform: scale(1.05);
//         }
//         .link-text {
//             font-size: 12px;
//             color: #999;
//             margin-top: 15px;
//             word-break: break-all;
//         }
//         .link-text a {
//             color: #667eea;
//             text-decoration: none;
//         }
//         .footer {
//             background-color: #f8f9fa;
//             padding: 25px 30px;
//             text-align: center;
//             border-top: 1px solid #e0e0e0;
//             font-size: 13px;
//             color: #999;
//         }
//         .footer-links {
//             margin-bottom: 15px;
//         }
//         .footer-links a {
//             color: #667eea;
//             text-decoration: none;
//             margin: 0 10px;
//         }
//         .security-note {
//             background-color: #fff3cd;
//             border-left: 4px solid #ffc107;
//             padding: 15px;
//             margin: 20px 0;
//             border-radius: 4px;
//             font-size: 14px;
//             color: #856404;
//         }
//         .divider {
//             height: 1px;
//             background-color: #e0e0e0;
//             margin: 30px 0;
//         }
//     </style>
// </head>
// <body>
//     <div class="email-container">
//         <!-- Header -->
//         <div class="header">
//             <h1>Password Reset Info</h1>
//         </div>

//         <!-- Content -->
//         <div class="content">
//             <div class="greeting">Hi ${userDetail.user_id},</div>
            
//             <div class="message">
//                We received a request to reset your password.
//             </div>

//             <!-- Activation Section -->
//             <div class="activation-section">
//                 <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
//                     Please clicking the button below :
//                 </p>
//                 <a href="${urlReset}" class="cta-button">
//                     Reset Your Password
//                 </a>
                
//             </div>

//             <div class="divider"></div>

//             <!-- Security Note -->
//             <div class="security-note">
//                 ⚠️ <strong>Security Notice:</strong> If you didn't make this request,Please contact admin ASAP
//                 This link expires in 30Mins.
//             </div>

//             <div class="message" style="font-size: 14px; margin-top: 25px;">
//                 If you have any questions or need assistance, feel free to reach out to our support team.
//             </div>
//         </div>

//         <!-- Footer -->
//         <div class="footer">
//             <p style="margin: 10px 0; color: #bbb;">
//                 © ${new Date().getFullYear()} TVS Automobile Solutions Private Limited. All rights reserved.
//             </p>
//         </div>
//     </div>
// </body>
// </html>
// `;

// // let html1= '<a href="http://localhost:3000/userActivation?userId='+userDetail.id + '&token=' +
// // token +
// // '">http://localhost:3000/userActivation?userId='+userDetail.id + '&token=' +
// // token +
// // '</a>';

// console.log(token);

// const mailOptions = {
//   from: emailConfig.auth.user,
//   to: 'raghu.simhachalam@nesh.live',
//   subject: 'Email verification',
//   html:html1
//   };
//   const emailResponse = await transporter.sendMail(mailOptions);
//   if(emailResponse){
//       logger.info('Email sent: ' + emailResponse);
//       message = 'Email sent successfully';
//       result = "success";
//   }
// }else{
//   message="User not available with this email";
//   result="failed"
// }
// }else{
// message="Employee dose not  Exist"
// result="failed"

// }
//   } catch (err) {
//     console.log(err);
//     logger.error("User service emailToForgotPwd ", err);
//     message="Error in service"
// result="failed"
//       next(err);
//   }
//   return {result,message}
// }


const emailToForgotPwd = async (req,res) => {
  let message="";
let result="";
  try {
let userEmail=req.body.email;
let empDetail=await employeeDao.findByEmail(userEmail);
if(empDetail){
let userDetail = await UserDao.findUserByEmpId(empDetail.id);
if(userDetail){
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
   port: emailConfig.port,
     secure: emailConfig.secure,
  auth: emailConfig.auth,
   tls: {
      rejectUnauthorized: false,
    },
 }); 

//  const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: false,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });

 let userToken = JWT.sign({   
  email :  userEmail,      
  id: userDetail.id,
}, JwtConfig.secret, {
    expiresIn: '30m', // this will be in ms, here 10 mins is the limit
    notBefore: 0, // after 1 min we are able to use this token value
    algorithm: 'HS256'
});
let token=userToken ;
let urlReset='http://'+req.hostname+'/userActivation?userId='+userDetail.id + '&token=' +token;

//  let html1= '<a href="'+urlReset+'">'+ urlReset +'</a>';


let html1 = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            font-size: 15px;
            color: #666;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .activation-section {
            background-color: #f8f9fa;
            padding: 5px;
            border-radius: 3px;
            text-align: center;
            margin: 5px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            padding: 7px 20px;
            border-radius: 3px;
            font-weight: 400;
            font-size: 12px;
            margin: 10px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: scale(1.05);
        }
        .link-text {
            font-size: 12px;
            color: #999;
            margin-top: 15px;
            word-break: break-all;
        }
        .link-text a {
            color: #667eea;
            text-decoration: none;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            font-size: 13px;
            color: #999;
        }
        .footer-links {
            margin-bottom: 15px;
        }
        .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>Password Reset Info</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hi ${userDetail.user_id},</div>
            
            <div class="message">
               We received a request to reset your password.
            </div>

            <!-- Activation Section -->
            <div class="activation-section">
                <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                    Please clicking the button below :
                </p>
                <a href="${urlReset}" class="cta-button">
                    Reset Your Password
                </a>
                
            </div>

            <div class="divider"></div>

            <!-- Security Note -->
            <div class="security-note">
                ⚠️ <strong>Security Notice:</strong> If you didn't make this request,Please contact admin ASAP
                This link expires in 30Mins.
            </div>

            <div class="message" style="font-size: 14px; margin-top: 25px;">
                If you have any questions or need assistance, feel free to reach out to our support team.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 10px 0; color: #bbb;">
                © ${new Date().getFullYear()} TVS Automobile Solutions Private Limited. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

// let html1= '<a href="http://localhost:3000/userActivation?userId='+userDetail.id + '&token=' +
// token +
// '">http://localhost:3000/userActivation?userId='+userDetail.id + '&token=' +
// token +
// '</a>';

// console.log(token);

const mailOptions = {
  from: emailConfig.auth.user,
  to: userEmail,
  bcc :"sadam.hussain@tvs.in",
  subject: 'Password Reset request',
  html:html1
  };
  const emailResponse = await transporter.sendMail(mailOptions);
  if(emailResponse){
      logger.info('Email sent: ' + emailResponse);
      message = `If an account exists with this email, you’ll receive a reset link.`;
      result = "success";
  }
}else{
  message="User not available with this email";
  result="failed"
}
}else{
message="Employee dose not  Exist"
result="failed"

}
  } catch (err) {
    console.log(err);
    logger.error("User service emailToForgotPwd ", err);
    message="Error in service"
result="failed"
      next(err);
  }
  return {result,message}
}


const resetPassword = async (req) => {
  try {
    const userToken = req.body.token;

    if (!userToken) {
      return {
        result: "failed",
        message: "Token missing",
      };
    }
    const newPassword = req.body.confirmPassword;

    let isPasswordUsedBefore = false;


  
    const decoded = JWT.verify(userToken, JwtConfig.secret, {
      algorithm: "HS256",
    });
   const passwordHistory =   await UserDao.getLastPasswordHistory(decoded.id); 

    console.log('222222222222222',passwordHistory);

   for (const row of passwordHistory) { 
      const match = bcrypt.compareSync(newPassword, row.password_hash);
      if (match) {
        isPasswordUsedBefore = true;
        break;
      }
    }

    if(isPasswordUsedBefore == true){ 
      return {
      result: "failed",
      message: "New password must not match your last 3 passwords",
    };
    }

    const userData = {
      password: req.body.confirmPassword,
      user_pin_hash: req.body.secretPin,
      is_first_login : 1,
      id: decoded.id,
    };

    await UserDao.updateUserPassword(userData, ""); 

    return {
      result: "success",
      message: "Password and PIN updated successfully",
    };

  } catch (error) {
    console.log("JWT Error:", error);

    if (error.name === "TokenExpiredError") {
      return {
        result: "failed",
        message: "Token expired. Please login again",
      };
    }

    return {
      result: "failed",
      message: "Token is not valid",
    };
  }
};


const checkSecretPin = async (req,res) => {
  let message="";
let result="";
  try {

    let userToken = req.body.token;
    if(userToken) {
      // token value
      JWT.verify(userToken, JwtConfig.secret, {
          algorithm: 'HS256'
      }, async (error, data) => {
          if(error) {
                  message= "Token is not valid";
                  result="failed"
          }
          else {

            let ueserData={
              password : req.body.confirmPassword,
              id :req.body.userId
            }
            message= "Password updated successfully";
            result="success";
           let data1 =await UserDao.updateUserPassword(ueserData,"");
           await delay(5000);
            
          
            message= "Token is valid1";
            result="success"; 
          }
      })
  }
  else { 
          message= "Please provide authentication token value";
           result= "failed";
  }
  } catch (err) {
    console.log(err);
    logger.error('User service emailToForgotPwd ', err);
    message = 'Error in service';
    result = 'failed';
  }
  return { result, message };
};

const getAppConfig = async () => { 
  const data = await UserDao.getAppConfig()
  return data;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CreateGmsRedirctUrl = async (req) => { 
  const data = await UserDao.CreateGmsRedirctUrl(req);
  return data;
};

const verifyGmsToken = async (token) => { 
  const data = await UserDao.verifyGmsToken(token);
  return data;
};

const saveattendence = async (req, res) => {
  const saved = await UserDao.saveattendence(req.body)

  if (saved.status) {
    return { status: true, message: 'Attendance saved successfully' }
  } else {
    return { status: false, message: 'Attendance not saved' }
  }
}

const CreatePartsCatalogueRedirctUrl = async (req) => { 
  const data = await UserDao.CreatePartsCatalogueRedirctUrl(req);
  return data;
};

const verifyDmsToken = async (token) => { 
  const data = await UserDao.verifyDmsToken(token);
  return data;
};

const UsersService = {
  findByEmail,
  findByEmployeeCode,
  findByEployeeId,
  getUser,
  findEmployee,
  createEmployeeRoleMap,
  createUserRoleMap,
  createUserOutletMap,
  getEmployee,
  getUserRole,
  getMenulist,
  addUserLog,
  logout,
  getUserLog,
  getUserRoles,
  findByUserId,
  addUser,
  getRoles,
  listUsers,
  findUniqueUserId,
  findUniqueEployeeId,
  deleteUser,
  getSecondryRoles,
  updateUser,
  emailToForgotPwd,
  resetPassword,
  checkSecretPin,
  getAppConfig,
  CreateGmsRedirctUrl,
  verifyGmsToken,
  getCustomerAccountId,
  saveattendence,
  CreatePartsCatalogueRedirctUrl,
  verifyDmsToken
};
export default UsersService;
