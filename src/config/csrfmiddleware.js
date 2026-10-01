import { doubleCsrf } from "csrf-csrf";
import JwtConfig from '../config/jwtConfig.js';
export const {
  doubleCsrfProtection,
  generateCsrfToken,
  validateRequest,
  invalidCsrfTokenError,
} = doubleCsrf({
  // Use JWT's `sub` (user ID) if available, else fall back to IP + User-Agent
  getSessionIdentifier: (req) => {
    // If using JWT (e.g., from `Authorization: Bearer <token>`)
    const token = req.cookies?.auth_token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user.id // Use JWT's user ID
      } catch (err) {
        // Invalid JWT → fall back to fingerprint
      }
    }
    return "guest"

    // // Fallback: Hash IP + User-Agent (for anonymous requests)
    // const fingerprint = `${req.ip}-${req.headers["user-agent"]}`;
    // return require("crypto").createHash("sha256").update(fingerprint).digest("hex");
  },

  // Rest of the config remains the same
  getSecret: () => process.env.CSRF_SECRET || "fallback-secret",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    maxAge:JwtConfig.expiresIn*1000
  },
  size: 32,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] || req.body?._csrf,
});