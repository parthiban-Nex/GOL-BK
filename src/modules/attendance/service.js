import AttendanceDAO from './dao.js';



const createRegularisation = async (payload, user) => {
  return await AttendanceDAO.createRegularisation(payload, user);
};

const getTodayMarkList = async (params, user) => {
  return await AttendanceDAO.getTodayMarkList(params, user);
};

const getEmployeesUnderManager = async (params, user) => {
  return await AttendanceDAO.getEmployeesUnderManager(user, params);
};

const saveMarksBulk = async (payload, user) => {
  return await AttendanceDAO.saveMarksBulk(payload, user);
};

const getAnalytics = async (params, user) => {
  return await AttendanceDAO.getAnalytics(params, user);
};

const getDetailsTable = async (params, user) => {
  return await AttendanceDAO.getDetailsTable(params, user);
};



const AttendanceService = {
  createRegularisation,
  getTodayMarkList,
  getEmployeesUnderManager,
  saveMarksBulk,
  getAnalytics,
  getDetailsTable,
};

export default AttendanceService;
