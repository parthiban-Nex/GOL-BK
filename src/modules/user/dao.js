import db from '../index.js';
import logger from '../../config/logger.js';
import notFoundException from '../../shared/notFoundException.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import utils from '../Utils/Utils.js';


const User = db.users;
const Role = db.role;
const Employee = db.employees;
const UserRoleMap = db.userrolemaps;
const Reference = db.reference;
const passwordHistory = db.passwordHistory; 

const findByUserId = async (userId) => {
    return await User.findOne({
        where: {user_id: userId},
        include: [{
            model: Employee, 
            as: 'employee',
            attributes: ['id', 'employeeName'],
          }], 
    });
}

const findUserById = async (userId) => {
  return await User.findOne({ where: { id: userId } });
};

const findUserByEmpId = async (empId) => {
  return await User.findOne({ where: { employeeId: empId, status: 1 } });
};

const findUniqueUserId = async (userId, id) => {
  let data = {};
  try {
    data = await User.findOne({
      where: {
        user_id: userId,
        id: {
          [Op.ne]: id,
        },
      },
    });
  } catch (err) {
    console.log('rule erroer ----', err);
  }
  return data;
};

const addUser = async (body, user) => {
  const DateTime = new Date();
  let data = '';
  const hashedPassword = body.password 
  ? bcrypt.hashSync(body.password, 10) 
  : null;
  try {
    let info = {
      user_id: body.user_id,
      password: hashedPassword, //hash value
      mobile_password: hashedPassword, 
      status: body.status,
      employeeId: body.employeeId,
      mobile_token: body.mobile_token ? body.mobile_token : '',
      fcm_tocken: body.fcm_tocken ? body.fcm_tocken : '',
      appversion: body.appversion ? body.appversion : '',
      phonemodel: body.phonemodel ? body.phonemodel : '',
      status: body.status ? body.status : '',
      phonemanufacture: body.phonemanufacture ? body.phonemanufacture : '',
      sdk_version: body.sdk_version ? body.sdk_version : '',
      networktype: body.networktype ? body.networktype : '',
      referesh_required: body.referesh_required ? body.referesh_required : 1,
      announcement: body.announcement ? body.announcement : '',
      mobile_token_date: body.mobile_token_date
        ? body.mobile_token_date
        : DateTime,
      createdBy: user.employeeCode ? user.employeeCode : '',
      wrong_count:body.wrong_count
    };
    data = User.create(info);
  } catch (error) {
    logger.error('User Dao addUser(): ', error);
  }
  return data;
};

const updateUser = async (body, user) => {
  let data = '';
  const DateTime = new Date();
  try {
    let info = {
      user_id: body.user_id,
      password: body.password ? bcrypt.hashSync(body.password, 10) : null, //hash value
      status: body.status,
      employeeId: body.employeeId,
      mobile_token: body.mobile_token ? body.mobile_token : '',
      fcm_tocken: body.fcm_tocken ? body.fcm_tocken : '',
      appversion: body.appversion ? body.appversion : '',
      phonemodel: body.phonemodel ? body.phonemodel : '',
      status: body.status ? body.status : '',
      phonemanufacture: body.phonemanufacture ? body.phonemanufacture : '',
      sdk_version: body.sdk_version ? body.sdk_version : '',
      networktype: body.networktype ? body.networktype : '',
      referesh_required: body.referesh_required ? body.referesh_required : 1,
      announcement: body.announcement ? body.announcement : '',
      mobile_token_date: body.mobile_token_date
        ? body.mobile_token_date
        : DateTime,
      updatedBy: user.employeeCode ? user.employeeCode : '',
      wrong_count:body.wrong_count
    };
    data = User.update(info, { where: { id: body.id } });
  } catch (error) {
    // logger.error("User Dao addUser(): ",error);
    console.log('User Dao addUser(): ', error);
  }
  return data;
};

// const updateUserPassword = async (body, user) => {
//   let data = '';
//   try {
//     let info = {
//       password: body.password ? bcrypt.hashSync(body.password, 10) : null, //hash value
//       user_pin_hash: body.user_pin_hash ? bcrypt.hashSync(body.user_pin_hash, 10) : null, //hash value
//       password_changed_at : DateTime,
//       is_first_login : 1 
//     };

//     let passwordHistoryInfo = { 
//       user_id: body.id,
//       password_hash: info.password,

//     };
//     await passwordHistory.create(passwordHistoryInfo);   
//     data = User.update(info, { where: { id: body.id } });
//   } catch (error) {
//     // logger.error("User Dao addUser(): ",error);
//     console.log('User Dao addUser(): ', error);
//   }
//   return data;
// };



const updateUserPassword = async (body, user) => {
  let data = '';
  const DateTime = new Date();

  try {
    let info = {
      password: body.password ? bcrypt.hashSync(body.password, 10) : null, //hash value
      user_pin_hash: body.user_pin_hash ? bcrypt.hashSync(body.user_pin_hash, 10) : null, //hash value
      password_changed_at : DateTime,
      is_first_login : 1
    };

    let passwordHistoryInfo = {
      user_id: body.id,
      password_hash: info.password,

    };
    await passwordHistory.create(passwordHistoryInfo);  
    data = User.update(info, { where: { id: body.id } });
  } catch (error) {
    // logger.error("User Dao addUser(): ",error);
    console.log('User Dao addUser(): ', error);
  }
  return data;
};
const getAllRoles = async () => {
  const data = await Role.findAll({
    attributes: ['id', 'roleName', 'description', 'status'],
  });

  return data;
};

const getSecondryRoles = async (reqData) => {
  let data = {};
  try {
    data = await Role.findAll({
      attributes: ['id', 'roleName', 'description', 'status'],
      where: {
        id: {
          [Op.ne]: reqData.id,
        },
      },
    });
  } catch (err) {
    console.log(err);
  }

  return data;
};


const getLastPasswordHistory = async (userId) => {
  return await passwordHistory.findAll({
    where: { user_id: userId },
    order: [['id', 'DESC']],
    limit: 3,
    raw: true,
  });
}

const listUsers = async (reqData) => {
  let count = {};
  let rows = {};
  try {
    const { searchKey, offset, limit } = reqData;
    const searchCondition = searchKey
      ? {
          [Op.or]: [{ user_id: { [Op.like]: `%${searchKey}%` } }],
        }
      : {};
    const combinedCondition = {
      ...searchCondition,
      status: true,
    };

    count = await User.count({ where: combinedCondition });

    rows = await User.findAll({
      where: combinedCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'user_id',
        'employeeId',
        // 'mobile_token',
        'token',
        'fcm_tocken',
        'appversion',
        'phonemodel',
        'status',
        'phonemanufacture',
        'sdk_version',
        'networktype',
        'referesh_required',
        'announcement',
        'mobile_token_date',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'wrong_count',
      ],
      include: [
        { model: Employee, as: 'employee' },
        { model: UserRoleMap, as: 'userrolemaps' },
      ],
    });

    return {
      totalItems: count,
      data: rows,
    };
  } catch (err) {
    logger.error('Users dao listUsers Error:', err);
    next(err);
  }
};
const deleteUser = async (id, user) => {
  let data = {};
  try {
    data = await User.update(
      {
        status: false,
        UPDATED_BY: user.employeeCode ? user.employeeCode : '',
      },
      { where: { id: id } }
    );
  } catch (err) {
    logger.error('User dao deleteUser Error:', err);
    next(err);
  }
  return data;
};

const deleteUserRoleMap = async (id, user) => {
  let data = {};
  try {
    data = await UserRoleMap.destroy({
      where: {
        userId: id,
      },
    });
  } catch (err) {
    console.log('User Dao  deleteUserRoleMap', err);
    logger.error('User Dao  deleteUserRoleMap', err);
  }
  return data;
};

const getAppConfig = async () => {
  const data = await Reference.findAll({
    //attributes: ['id', 'roleName', 'description', 'status'],
  });

  return data;
};


// const CreateGmsRedirctUrl = async (req) => {
//  try{
//   //find employee details
//   const user = req.user;

//   let tokenUserId;

//   if (req.query.type == 4) {
//     tokenUserId = user.employeeCode;
//   } 
//   else {
//     const employeeData = await db.employees.findOne({
//       where: {
//         outletId: user.outlet.id,
//       },
//       include: [
//         {
//           model: db.users,
//           as: 'user',
//           required: true,
//           include: [
//             {
//               model: db.userrolemaps,
//               as: 'userrolemaps',
//               required: true,
//               where: {
//                 roleId: 4
//               },
//             },
//           ],
//         },
//       ],
//     });
//     if (!employeeData) {
//       throw new Error('Parts Incharge Not Found for this outlet');
//     }
//     tokenUserId = employeeData?.user?.user_id;
//   }

//   //create redirect token
//   const redirectToken = await crypto.randomUUID();
//   //store in gms_token table
//   const gmsTokenData = {
//     user_id: tokenUserId,
//     token: redirectToken,
//     expire_at: new Date(new Date().getTime() + 5 * 60000),
//     createdBy: user.id,
//     type: req.query.type
//   }
//   const gmsToken = await db.gmsToken.create(gmsTokenData);
//   let redirectUrl = process.env.GMS_REDIRECT_URL + "?token=" + redirectToken
//   return redirectUrl

//  }
//  catch(err){
//   console.log("User Dao CreateGmsRedirctUrl Error:",err)
//   logger.error("User Dao CreateGmsRedirctUrl Error:",err)
//  }
// };

const CreateGmsRedirctUrl = async (req) => {
 try{
  //find employee details
  const user = req.user;

  let tokenUserId;

  if (req.query.type == 4) {
    tokenUserId = user.employeeCode;
     //create redirect token
  const redirectToken = await crypto.randomUUID();
  //store in gms_token table
  const gmsTokenData = {
    user_id: tokenUserId,
    token: redirectToken,
    expire_at: new Date(new Date().getTime() + 5 * 60000),
    createdBy: user.id,
    type: req.query.type
  }
  const gmsToken = await db.gmsToken.create(gmsTokenData);
  let redirectUrl = process.env.GMS_REDIRECT_URL + "?token=" + redirectToken
  return redirectUrl
}
   else if (req.query.type == 1) {
    let redirectUrl = `https://dms.mytvs.in/tvsfit/spare/grns/index?token=3uLvwBdTXMej4dgWSVieezQtF9bZSdjI1dSXsqx5SzjgH71z3qFl33dK1BZ1IvSH&code=${user.outlet.outletCode}`
  return redirectUrl
 }
 else if (req.query.type == 2) {
    let redirectUrl = `https://dms.mytvs.in/tvsfit/spare/parts_indents?token=3uLvwBdTXMej4dgWSVieezQtF9bZSdjI1dSXsqx5SzjgH71z3qFl33dK1BZ1IvSH&code=${user.outlet.outletCode}`
  return redirectUrl
 }
 else if( req.query.type == 3) {
    // const employeeData = await db.employees.findOne({
    //   where: {
    //     outletId: user.outlet.id,
    //   },
    //   include: [
    //     {
    //       model: db.users,
    //       as: 'user',
    //       required: true,
    //       include: [
    //         {
    //           model: db.userrolemaps,
    //           as: 'userrolemaps',
    //           required: true,
    //           where: {
    //             roleId: 4
    //           },
    //         },
    //       ],
    //     },
    //   ],
    // });
    // if (!employeeData) {
    //   throw new Error('Parts Incharge Not Found for this outlet');
    // }
    // tokenUserId = employeeData?.user?.user_id;
     //create redirect token
         tokenUserId = user.employeeCode;
  const redirectToken = await crypto.randomUUID();
  //store in gms_token table
  const gmsTokenData = {
    user_id: tokenUserId,
    token: redirectToken,
    expire_at: new Date(new Date().getTime() + 5 * 60000),
    createdBy: user.id,
    type: req.query.type
  }
  const gmsToken = await db.gmsToken.create(gmsTokenData);
  let redirectUrl = process.env.GMS_REDIRECT_URL + "?token=" + redirectToken
  return redirectUrl
  }
 }
 catch(err){
  console.log("User Dao CreateGmsRedirctUrl Error:",err)
  logger.error("User Dao CreateGmsRedirctUrl Error:",err)
 }
};

const verifyGmsToken = async (token) => {
  const data = await db.gmsToken.findOne({
    where: {
      token: token,
      expire_at: {
        [Op.gt]: new Date()
      }
    }
  });

  return data;
};

const saveattendence = async (req) => {
  console.log('req', req);
  const save = await db.saveuserAttendance.create({
    USER_ID: req.userId,
    PRESENTDATE: utils.getDateTime(),
    STATUS: req.status,
    LATITUDE: req.latitude,
    LONGITUDE: req.longitude,
    ADDRESS: req.address,
    CREATED_BY: req.userId,
    CREATED_DATE: utils.getDateTime(),
    UPDATED_BY: req.userId,
    UPDATED_DATE: utils.getDateTime()
  })

  console.log('save',save);

  if (save) {
    return {
      staus : true
    }
  } else {
    return {
      status :false
    }
  }
}

const CreatePartsCatalogueRedirctUrl = async (req) => {
 try{
  //find employee details
  const outletCode = req.body.outletCode;
  console.log("outletCode",outletCode)
  const secretKey = req.body.secretKey;
  if (secretKey !== process.env.PARTS_CATALOGUE_SECRET) {
    throw new Error('Invalid Secret Key');
  }

  // const outlet = await db.outlets.findOne({
  //   where: {
  //       outletCode: outletCode
  //   }
  // });
  // if (!outlet) {
  //   throw new Error('Outlet Not Found');
  // }
  
//   const employeeData = await db.employees.findOne({
//   where: {
//     outletId: outlet.id,
//   },
//   include: [
//     {
//       model: db.users,
//       as: 'user',
//       required: true,
//       include: [
//         {
//           model: db.userrolemaps,
//           as: 'userrolemaps',
//           required: true,
//           where: {
//             roleId: 4
//           },
//         },
//       ],
//     },
//   ],
// });

    //  console.log("employeeData",employeeData)
    // if(!employeeData){
    //   throw new Error('Parts Incharge Not Found for this outlet')
    // }
    //create redirect token
    const redirectToken = await crypto.randomUUID();
    //store in dms_token table
    const dmsTokenData = {
      outlet_code:outletCode,
      token:redirectToken,
      expire_at:new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
      createdBy:null,
      type:req.query.type
    }
    const dmsToken = await db.dmsToken.create(dmsTokenData);
    // let redirectUrl ="http://localhost:7000/PartsCatalogueDms?token="+redirectToken
    let redirectUrl ="https://uatfitdmspv.mytvs.in/PartsCatalogueDms?token="+redirectToken
    return  redirectUrl

 }
 catch(err){
  console.log("User Dao CreaetPartsCatalogueRedirctUrl Error:",err)
  logger.error("User Dao CreaetPartsCatalogueRedirctUrl Error:",err)
 }
};

const verifyDmsToken = async (token) => {

  return await db.dmsToken.findOne({

    where: {
      token,
      expire_at: {
        [Op.gt]: new Date()
      }
    },

    attributes: [
      'token',
      'outlet_code'
    ]

  });

};

const dao = {
  findByUserId,
  addUser,
  getAllRoles,
  listUsers,
  findUniqueUserId,
  deleteUser,
  deleteUserRoleMap,
  getSecondryRoles,
  updateUser,
  findUserById,
  getLastPasswordHistory,
  updateUserPassword,
  findUserByEmpId,
  getAppConfig,
  CreateGmsRedirctUrl,
  verifyGmsToken,
  saveattendence,
  CreatePartsCatalogueRedirctUrl,
  verifyDmsToken
};

export default dao;
