import MobileApiTrackDao from "./dao.js";
import logger from "../../config/logger.js";

const createMobileApiReq = async (req, user) => { 
   
  try {
    const ip_address =
      req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'] || 'unknown';

    const payload = {
      user_id: user?.id || null,
      api_url: req.originalUrl?req.originalUrl:'', 
      action: req.method?req.method:'', 
      request_json: JSON.stringify(req.body),
      response_json: null,
      user_role_id:user.roleid?user.roleid:null,
      ip_address,
      user_agent,
    };
    return await MobileApiTrackDao.createMobileApiReq(payload);


  } catch (err) {
    logger.error('Mobile API Track Service Error:', err);
    return null;
  }
};


const bookingApiTrack = async (reqBody,method,endPoint,from,user) => { 
   
  try {
    const ip_address =
     from;
    const user_agent = from;

    const payload = {
      user_id: user?.id || null,
      api_url: endPoint, 
      action: method, 
      request_json: JSON.stringify(reqBody),
      response_json: null,
      user_role_id:user.roleid?user.roleid:null,
      ip_address,
      user_agent,
    };
    return await MobileApiTrackDao.createMobileApiReq(payload);


  } catch (err) {
    logger.error('Mobile API Track Service Error:', err);
    return null;
  }
};



const updateMobileApiRes = async (id, response) => {
  try {
    await MobileApiTrackDao.updateMobileApiRes(id, response);
  } catch (err) {
    logger.error(' update mobile api response error:', err);
  }
};

const MobileApiTrackService = {
  createMobileApiReq,
  updateMobileApiRes,
  bookingApiTrack
};

export default MobileApiTrackService;
