import axios from "axios";
import https from "https";
console.log("PARTS GPT BASE URL:", process.env.PARTS_GPT_BASE_URL || "https://api.partsgpt.in");
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const partsGptClient = axios.create({
  baseURL: process.env.PARTS_GPT_BASE_URL || "https://api.partsgpt.in",
  httpsAgent,
  headers: {
    "Content-Type": "application/json"
  }
});

export default partsGptClient;