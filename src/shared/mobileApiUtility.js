import axios from 'axios';

// import MobileApiTrackDao from '../dao/MobileApiTrackDao';

import MobileApiTrackDao from '../modules/mobileApis/dao.js';
import logger from '../config/logger.js';

export const datapushMaster = async () => {
  try {

     // for cv different loginPayload 
    const loginPayload = {
      username: 'DMS-USER-NEWPV',
      password: 'Tvs123$',
    };
// PV login below
    //  const loginPayload = {
    //   username: 'kitara_sa',
    //   password: '123456',
    // };

    // const loginResponse = await axios.post(
    //   'https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/fitlogin.php',
    //   loginPayload,
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // );

     const loginResponse = await axios.post(
      'https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/fitlogin.php',
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { authenticationToken, isLoginSuccessfull } = loginResponse.data;
    const userID = loginResponse.data['userID '];
   

    if (authenticationToken && isLoginSuccessfull == 1) {
      const pushPayload = {
        userId: userID?.trim?.() || userID,
        authenticationToken,
      };

      

      // const pushResponse = await axios.post(
      //   'https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/masterdataupdated.php',
      //   pushPayload,
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      const pushResponse = await axios.post(
        'https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/masterdataupdated.php',
        pushPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        message: 'Master push successful',
        data: pushResponse.data,
      };
    } else {
      return {
        success: false,
        message: 'Login failed or missing token',
        data: loginResponse.data,
      };
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Unknown error',
      data: null,
    };
  }
};


export const getRemoteToken = async () => {
  try {
    // const response = await axios.post('https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/fitlogin.php', {
    //   username: 'kitara_sa',
    //   password: '123456'
    // }, {
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // });

     const response = await axios.post('https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/fitlogin.php', {
      username: 'DMS-USER-NEWPV',
      password: 'Tvs123$'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    if (data.isLoginSuccessfull && data.authenticationToken) {
      return {
        token: data.authenticationToken,
        userId: (data["userID "]?.trim?.() || data["userID "]) ?? ''
      };
    }
  } catch (err) {
    console.error('Login to remote API failed', err);
  }
  return null;
};




export const pushEstimateDataToRemote = async (payload) => {

  try {
    const response = await axios.post('https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/saveestimatedetails.php', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });  

    return response.data;
  } catch (err) {
    console.error('Failed to push estimate data', err);
  }
  return null;
};


export const pushJobCardDataToRemote = async (payload) => { 
  try {
    const response = await axios.post('https://tvsfit.mytvs.in/reporting/vrm/api/test_new_temp/dms/savejcdetails.php', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (err) {
    console.error('Failed to push JC update data', err);
  }
  return null;
};

export const createMobileApiRemoteReq = async (remotePayload, remoteResponse, user, endpoint) => {
  try {
    const payload = {
      user_id: user?.id || null,
      api_url: endpoint,
      action: 'POST',
      request_json: JSON.stringify(remotePayload),
      response_json: JSON.stringify(remoteResponse),
      user_role_id: user?.roleid || null,
      ip_address: 'dms-web-application',
      user_agent: 'internal-server-operation',
    };

    return await MobileApiTrackDao.createMobileApiReq(payload);
  } catch (err) {
    logger.error('Mobile API Remote Tracking Error:', err);
    return null;
  }
};
