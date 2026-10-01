import jwt from "jsonwebtoken";
import partsGptClient from "../../../../config/partsGptClient.js";
import db from "../../../index.js";
import qs from "qs";
import { getCachedToken, setCachedToken } from "./tokenCache.js";

const User = db.users;

export const getPartsGptToken = async (userId) => {

  //Check memory cache first
  const cached = getCachedToken();
  if (cached) {
    return cached;
  }

  const user = await User.findOne({
    where: { id: userId },
    attributes: ["id", "part_gpt_token"]
  });

  let token = user?.part_gpt_token;

  if (token) {
    try {
      const decoded = jwt.decode(token);

      if (decoded?.exp && decoded.exp * 1000 > Date.now()) {
        setCachedToken(token, decoded.exp);
        return token;
      }
    } catch (error) {
      console.log("JWT decode failed");
    }
  }

  // console.log("Token expired, requesting new token...");

  const authResponse = await partsGptClient.post(
    "/api/auth/oauth/token",
    qs.stringify({
      client_id: process.env.PART_CLIENT_ID,
      client_secret: process.env.PART_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "search:text search:image search:hybrid"
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  const newToken = authResponse.data.access_token;

  const decoded = jwt.decode(newToken);
  setCachedToken(newToken, decoded.exp);

  await User.update(
    { part_gpt_token: newToken },
    { where: { id: userId } }
  );

  return newToken;
};