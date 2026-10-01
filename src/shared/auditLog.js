import { Op } from 'sequelize';
import db from '../modules/index.js';
import commonLogic from './commonLogics.js';

const auditLog = db.auditlogs;
const sequelize = db.sequelize;

function createAuditLog(req, auditData) {
  if (auditData.isClient) {
    auditLog.create({
      userId: req.user.id,
      roleId: req.user.roleid,
      username: req.user.employeeCode,
      url: auditData.url,
      menu_name: auditData.menu_name,
      submenu_name: auditData.submenu_name,
      message: auditData.message,
      action: auditData.action,
      result: auditData.result,

      access: !auditData.access ? 'portal' : auditData.access,
      createdBy: req.user.id,
    });
  } else {
    auditLog.create({
      userId: req.user.id,
      roleId: req.user.roleid,
      username: req.user.employeeCode,
      url: req.originalUrl,
      menu_name: auditData.menu_name,
      submenu_name: auditData.submenu_name,
      message: auditData.message,
      action: auditData.action,
      result: auditData.result,
      access: !auditData.access ? 'portal' : auditData.access,
      createdBy: req.user.id,
    });
  }
}

const getAuditLog = async (req) => {
  let date = new Date();
  let month = date.getMonth();
  let year = date.getFullYear().toString();
  let actualMonth = (month+1).toString().padStart(2, '0');
  let end = '';
  let isleap = isLeapYear(date.getFullYear());
  if (month === 3 || month === 5 || month === 8 || month === 10) {
    end = actualMonth + '-30';
  } else if (month === 1) {
    if (isleap) {
      end = actualMonth + '-29';
    } else {
      end = actualMonth + '-28';
    }
  } else {
    end = actualMonth + '-31';
  }
  const offset = req.body.offset;
  const limit = req.body.limit;
  const searchKey = '%' + req.body.searchKey + '%';
  const action = '%' + req.body.action + '%';
  const access = '%' + req.body.access + '%';
  const startDate =
    req.body.startDate === ''
      ? year+'-' + (actualMonth) + '-01 00:00:00'
      : req.body.startDate + ' 00:00:00';
  const endDate =
    req.body.endDate === ''
      ? year+'-' + end + ' 23:59:59'
      : req.body.endDate + ' 23:59:59';

  const currentMonth = commonLogic.getCurrentMonthTableName();
  const prevMonth = commonLogic.getPreviousMonthTableName();
  const prev2ndMonth = commonLogic.get2ndPreviousMonthTableName();

  let queryStr = '';

  if(Number.parseInt(startDate.slice(5,7)) === month + 1 || Number.parseInt(endDate.slice(5,7)) === month + 1) {
    queryStr = queryStr + `SELECT * FROM ${currentMonth} 
      WHERE ((${currentMonth}.createdAt BETWEEN "${startDate}" AND "${endDate}") AND (${currentMonth}.access LIKE "${access}") AND (${currentMonth}.action LIKE "${action}") AND (${currentMonth}.message LIKE "${searchKey}"))`
  }
  
  if(Number.parseInt(startDate.slice(5,7)) === ( month === 0 ? 12 : month ) || Number.parseInt(endDate.slice(5,7)) === (month === 0 ? 12 : month ) || (Number.parseInt(startDate.slice(5,7)) <= ( month === 0 ? 12 : month ) || Number.parseInt(endDate.slice(5,7)) >= (month === 0 ? 12 : month ))){
    if(queryStr != '' ){
      queryStr = queryStr + ' union all ';
    }
    queryStr = queryStr + `select * from ${prevMonth}
      WHERE ((${prevMonth}.createdAt BETWEEN "${startDate}" AND "${endDate}") AND (${prevMonth}.access LIKE "${access}") AND (${prevMonth}.action LIKE "${action}") AND (${prevMonth}.message LIKE "${searchKey}"))`
  }
  
  if(Number.parseInt(startDate.slice(5,7)) === (month-1 > 0 ? month-1 : (month - 1 === 0 ? 12 : 11 )) || Number.parseInt(endDate.slice(5,7)) === (month-1 > 0 ? month-1 : (month -1 === 0 ? 12 : 11 ))){
    if(queryStr != '' ){
      queryStr = queryStr + ' union all ';
    }
    queryStr = queryStr + `select * from ${prev2ndMonth}
    WHERE ((${prev2ndMonth}.createdAt BETWEEN "${startDate}" AND "${endDate}") AND (${prev2ndMonth}.access LIKE "${access}") AND (${prev2ndMonth}.action LIKE "${action}") AND (${prev2ndMonth}.message LIKE "${searchKey}"))`
  }

  const rows = await sequelize.query(queryStr + `ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`);
  const count = await sequelize.query(`SELECT COUNT(*) AS total FROM (` + queryStr + `) AS combined`);

  return {
    totalItems: count[0][0].total,
    data: rows[0],
  };
};

function isLeapYear(year) {
  if (year % 400 === 0) {
    return true;
  }
  if (year % 100 === 0) {
    return false;
  }
  if (year % 4 === 0) {
    return true;
  }
  return false;
}
const auditLogApi = {
  createAuditLog,
  getAuditLog,
};
export default auditLogApi;
