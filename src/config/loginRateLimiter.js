// { ip: { attempts, banLevel, blockUntil }, employeeCode: { attempts, banLevel, blockUntil } }
const loginAttempts = new Map();

const banDurations = [
  0,               // banLevel 0 → no ban
  60 * 5,          // 5 minutes
  60 * 30,         // 30 minutes
  60 * 60,         // 1 hour
  60 * 60 * 24     // 1 day
];

const AUTO_COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupOldLoginAttempts = () => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.lastAttemptAt && now - value.lastAttemptAt > AUTO_COOLDOWN_DURATION) {
      loginAttempts.delete(key);
    }
  }
};
let lastCleanupTime = 0;

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanupTime > 1000 * 60 * 60) { // every 1 hour
    cleanupOldLoginAttempts();
    lastCleanupTime = now;
  }
}

export const progressiveLoginRateLimiter = (req, res, next) => {
  maybeCleanup();
  const ip = req.ip;
  const employeeCode = req.body?.employeeCode;
  const now = Date.now();

  const ipRecord = loginAttempts.get(ip);
  const userKey = employeeCode ? `${ip}_${employeeCode}` : null;
  const userRecord = userKey ? loginAttempts.get(userKey) : null;

  if (ipRecord?.blockUntil && now < ipRecord.blockUntil) {
    return respondWithRateLimit(res, ipRecord.blockUntil, now, 'Too many attempts from this device.');
  }

  if (userRecord?.blockUntil && now < userRecord.blockUntil) {
    return respondWithRateLimit(res, userRecord.blockUntil, now, `Too many failed login attempts for ${employeeCode}.`);
  }

  // Reset expired IP block
  if (ipRecord?.blockUntil && now >= ipRecord.blockUntil) {
    ipRecord.attempts = 0;
    ipRecord.blockUntil = null;
  }

  // Reset expired user block
  if (userRecord?.blockUntil && now >= userRecord.blockUntil) {
    userRecord.attempts = 0;
    userRecord.blockUntil = null;
  }

  next();
};


function respondWithRateLimit(res, blockUntil, now, messagePrefix) {
  const retrySecs = Math.ceil((blockUntil - now) / 1000);
  let timeMessage = '';

  if (retrySecs >= 3600) {
    const hours = Math.ceil(retrySecs / 3600);
    timeMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.ceil(retrySecs / 60);
    timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return res.status(429).set('Retry-After', retrySecs).json({
    message: `${messagePrefix} Try again in ${timeMessage}.`,
  });
}

// ❌ Call this on login failure
export const recordLoginFailure = (ip, employeeCode = null, isValidUser = false) => {
  const now = Date.now();

  const ipKey = ip;
  const userKey = isValidUser && employeeCode ? `${ip}_${employeeCode}` : null;

  // Handle IP-based tracking (always)
  const ipRecord = loginAttempts.get(ipKey) || {
    attempts: 0,
    banLevel: 0,
    blockUntil: null,
    lastAttemptAt: 0
  };
  ipRecord.attempts += 1;
  ipRecord.lastAttemptAt = now;
  if (ipRecord.attempts >= 5) {
    ipRecord.banLevel = Math.min(ipRecord.banLevel + 1, banDurations.length - 1);
    ipRecord.blockUntil = now + banDurations[ipRecord.banLevel] * 1000;
    ipRecord.attempts = 0;
  }
  loginAttempts.set(ipKey, ipRecord);

  // Handle user-based tracking only if user is valid
  if (userKey) {
    const userRecord = loginAttempts.get(userKey) || {
      attempts: 0,
      banLevel: 0,
      blockUntil: null,
      lastAttemptAt: 0
    };
    userRecord.attempts += 1;
    userRecord.lastAttemptAt = now;
    if (userRecord.attempts >= 5) {
      userRecord.banLevel = Math.min(userRecord.banLevel + 1, banDurations.length - 1);
      userRecord.blockUntil = now + banDurations[userRecord.banLevel] * 1000;
      userRecord.attempts = 0;
    }
    loginAttempts.set(userKey, userRecord);
  }
};


// ✅ Call this on login success (only reset user count, not IP)
export const resetUserLoginAttempts = (ip, employeeCode) => {
  loginAttempts.delete(`${ip}_${employeeCode}`);
};

