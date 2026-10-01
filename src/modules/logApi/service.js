import auditLog from '../../shared/auditLog.js';
import logger from '../../config/logger.js';
import moment from 'moment-timezone';

function createAuditLog(req, auditData) {
  try {
    auditLog.createAuditLog(req, auditData);
  } catch (error) {
    logger.error('Audit log creation failed', error);
  }
}

const getAuditLog = async (req) => {
  try {
    const { totalItems, data } = await auditLog.getAuditLog(req);
    let data1 = [];
    data.forEach((record) => {
      // Convert UTC to IST
      let record1 = {};
      const istTime = moment(record.createdAt)
        .tz('Asia/Kolkata')
        .format('YYYY-MM-DD HH:mm:ss');
      record1['id'] = record.id;
      record1['userId'] = record.userId;
      record1['roleId'] = record.roleId;
      record1['message'] = record.message;
      record1['url'] = record.url;
      record1['menu_name'] = record.menu_name;
      record1['action'] = record.action;
      record1['result'] = record.result;
      record1['createdBy'] = record.createdBy;
      record1['username'] = record.username;
      record1['access'] = record.access;
      record1['submenu_name'] = record.submenu_name;
      record1['createdAt'] = istTime;
      data1.push(record1);
    });
    return {
      totalItems: totalItems,
      rows: data1,
    };
  } catch (error) {
    logger.error('Audit log creation failed', error);
  }
};

const auditLogApi = {
  createAuditLog,
  getAuditLog,
};
export default auditLogApi;
