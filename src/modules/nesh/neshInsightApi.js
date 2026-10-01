import axios from "axios";

async function callNeshInsightAPI(method, url, data = {}, bearerToken = null) {
    try {
        let headers = {
            'Content-Type': 'application/json'
        };

        if (bearerToken) {
            headers['Authorization'] = bearerToken; // e.g. "Bearer xxx"
        }

        let response;

        if (method === 'POST') {
            response = await axios.post(url, data, { headers });
        } else {
            response = await axios.get(url, {
                headers,
                params: data
            });
        }

        let result = response.data;

        // Clean response (similar to PHP preg_replace)
        if (typeof result === 'string') {
            result = result.replace(/[\x00-\x1F\x80-\xFF]/g, '');
            result = JSON.parse(result);
        }

        result.apiSuccess = true;
        result.httpcode = response.status;

        return result;

    } catch (error) {
        let httpcode = error.response ? error.response.status : 500;
        let result = {};

        if (httpcode === 404) {
            result = {
                apiSuccess: false,
                message: "URL not found"
            };
        } else if (httpcode === 403) {
            result = {
                apiSuccess: false,
                message: "Authentication error"
            };
        } else {
            let errorData = error.response?.data || {};

            result.apiSuccess = false;
            result.message = errorData.error || "Error response in Insight API";
        }

        result.httpcode = httpcode;

        return result;
    }
}

const nesh = {
  callNeshInsightAPI
}

export default nesh;