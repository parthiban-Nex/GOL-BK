import partsGptClient from "../../../../config/partsGptClient.js";
import { getPartsGptToken } from "./partsGptAuth.js";
import FormData from "form-data";

export const callPartsGptApi = async ({
  userId,
  endpoint,
  data = {},
  params = {},
  method,
  images = []
}) => {

  const token = await getPartsGptToken(userId);

  let requestData = data;
  let headers = {
    Authorization: `Bearer ${token}`
  };

  if (images && images.length > 0) {

    const form = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "object") {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });

    images.forEach((file) => {
      form.append("images", file.buffer, file.originalname);
    });

    requestData = form;
    headers = {
      ...headers,
      ...form.getHeaders()
    };
  }

  const config = {
    url: endpoint,
    method,
    headers,
    data: requestData,
    params
  };

  try {
    const response = await partsGptClient.request(config);
    return response.data;
  } catch (error) {
    console.error("PartsGPT API Error:", error?.response?.data || error.message);
    throw error;
  }
};