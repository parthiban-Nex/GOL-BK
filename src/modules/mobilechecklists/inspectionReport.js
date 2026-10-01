import axios from 'axios';
import GoogleController from './google.js';

async function callMinorApi(method, data = null, accessToken) {
  const baseurl =
    'https://us-central1-aiplatform.googleapis.com/v1/projects/prj-tvs-prod-dms/locations/us-central1/endpoints/1479218072823791616:generateContent'

  //   const accessToken = await GoogleController.AccessToken();
  const url = baseurl;
const cleanToken = accessToken.replace(/[\r\n"]/g, '').trim();

  try {
    let response;

    if (method === 'POST') {
      response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        }
      });
    } else {
      response = await axios.get(url, {
        params: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`
        }
      });
    }

    // console.log("response", response)
    // ✅ success
    return {
      ...response.data,
      apiSuccess: true,
      httpcode: response.status
    };

  } catch (error) {
    const httpcode = error.response?.status || 500;
    const errorData = error.response?.data || {};
    // console.log("response", httpcode, error.code)
    // console.log("response Data", data)

    // ❌ Match PHP behavior
    if (httpcode === 404) {
      return {
        apiSuccess: false,
        message: 'URL not found',
        httpcode
      };
    }

    if (httpcode === 401) {
      return {
        apiSuccess: false,
        message: 'Authentication error',
        httpcode
      };
    }

    return {
      apiSuccess: false,
      message:
        errorData?.errorDescription ||
        errorData?.error?.message ||
        'Error response in API',
      httpcode
    };
  }
}

const inspectionController = {
  callMinorApi
}

export default inspectionController;
