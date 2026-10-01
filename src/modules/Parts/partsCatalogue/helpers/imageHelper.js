import axios from "axios";

const STORAGE_BASE_URL =
  "https://websprint.mytvspartsmart.in/storage-service/api/v1/storage";

const STORAGE_LIST_URL = `${STORAGE_BASE_URL}/oci/list`;

const STORAGE_USERNAME = "NR9S7kZ9DYKgiCiE";
const STORAGE_PASSWORD = "WRdFtDXfp2BLeKoO7QX523cWtSacx04b";

const AUTH_HEADER =
  "Basic " +
  Buffer.from(
    `${STORAGE_USERNAME}:${STORAGE_PASSWORD}`
  ).toString("base64");

let categoryImageMap = {};
let subCategoryImageMap = {};

const CATEGORY_PATH =
  "Partsmart/PartsmartImages/PV/Categories";

const SUBCATEGORY_PATH =
  "Partsmart/PartsmartImages/PV/SubCategory";

const normalizeName = (name = "") => {
  return name
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

const loadCategoryImages = async () => {
  try {
    const response = await axios.post(
      STORAGE_LIST_URL,
      {
        path: CATEGORY_PATH,
      },
      {
        headers: {
          Authorization: AUTH_HEADER,
        },
      }
    );

    const files = response?.data?.files || [];

    const map = {};

    files.forEach((file) => {
      const normalized = file
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      map[normalized] = file;
    });

    categoryImageMap = map;

    console.log("Category images loaded");
  } catch (err) {
    console.error("Category image load error", err.message);
  }
};

const loadSubCategoryImages = async () => {
  try {
    const response = await axios.post(
      STORAGE_LIST_URL,
      {
        path: SUBCATEGORY_PATH,
      },
      {
        headers: {
          Authorization: AUTH_HEADER,
        },
      }
    );

    const files = response?.data?.files || [];

    const map = {};

    files.forEach((file) => {
      const normalized = file
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      map[normalized] = file;
    });

    subCategoryImageMap = map;

    console.log("Subcategory images loaded");
  } catch (err) {
    console.error("Subcategory image load error", err.message);
  }
};

export const initializeImageMaps = async () => {
  await Promise.all([
    loadCategoryImages(),
    loadSubCategoryImages(),
  ]);
};

export const getCategoryImagePath = (name) => {

  if (!name) {
    return `${CATEGORY_PATH}/No Image.png`;
  }

  const normalized = normalizeName(name);

  const matchedKey = Object.keys(categoryImageMap).find((key) =>
    key.includes(normalized) ||
    normalized.includes(key)
  );

  console.log("CATEGORY SEARCH");
  console.log("INPUT:", normalized);
  console.log("MATCH:", matchedKey);

  const fileName =
    categoryImageMap[matchedKey] || "No Image.png";

  return `${CATEGORY_PATH}/${fileName}`;
};

export const getSubCategoryImagePath = (name) => {

  if (!name) {
    return `${SUBCATEGORY_PATH}/No_Image.png`;
  }

  const normalized = normalizeName(name);

  const matchedKey = Object.keys(subCategoryImageMap).find((key) =>
    key.includes(normalized) ||
    normalized.includes(key)
  );

  console.log("SUBCATEGORY SEARCH");
  console.log("INPUT:", normalized);
  console.log("MATCH:", matchedKey);

  const fileName =
    subCategoryImageMap[matchedKey] || "No_Image.png";

  return `${SUBCATEGORY_PATH}/${fileName}`;
};

export const getAuthHeader = () => {
  return AUTH_HEADER;
};

export const getStorageReadUrl = () => {
  return `${STORAGE_BASE_URL}/oci/read`;
};