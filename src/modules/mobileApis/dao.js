import db from '../index.js';
import logger from '../../config/logger.js';

const MobileApiTrack = db.MobileApiTrackData;

const createMobileApiReq = async (payload) => { 
  try {
    const result = await MobileApiTrack.create(payload);
       return result?.id || null;
  } catch (err) {
    logger.error('Mobile API Track DAO Create Error:', err);
    return null;
  }
};

const updateMobileApiRes = async (id, response) => {
  try {
    await MobileApiTrack.update(
      {
        response_json: JSON.stringify(response),
      },
      {
        where: { id },
      }
    );
  } catch (err) {
    logger.error('ServiceEstimateLog DAO update error:', err);
  }
};


const MobileApiTrackDao = {
  createMobileApiReq,
  updateMobileApiRes,
};

export default MobileApiTrackDao;

