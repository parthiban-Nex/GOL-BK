// middlewares/recursiveSanitize.js
import xss from "xss";
const sanitizeRecursive = (obj) => {
  if (typeof obj === "string") return xss(obj.trim());
  if (Array.isArray(obj)) return obj.map(sanitizeRecursive);
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeRecursive(v)])
    );
  }
  return obj;
};

export const xsssanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeRecursive(req.body);
  }
  if (req.query) req.query = sanitizeRecursive(req.query);
  if (req.params) req.params = sanitizeRecursive(req.params);
  next();
};
