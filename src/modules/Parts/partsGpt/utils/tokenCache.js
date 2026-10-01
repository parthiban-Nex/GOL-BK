let cachedToken = null;
let tokenExpiry = null;

export const getCachedToken = () => {
  if (!cachedToken) return null;

  if (tokenExpiry && Date.now() > tokenExpiry) {
    cachedToken = null;
    return null;
  }

  return cachedToken;
};

export const setCachedToken = (token, exp) => {
  cachedToken = token;
  tokenExpiry = exp * 1000;
};