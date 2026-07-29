const cache = new Map();
const ttlMs = 20_000;

export const readCachedAnalytics = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const writeCachedAnalytics = (key, value) => {
  cache.set(key, { value, timestamp: Date.now() });
};

export const fetchActiveAnalytics = async (api, headers) => {
  const token = headers?.headers?.Authorization || "";
  const cacheKey = `analytics:${token}`;
  const cached = readCachedAnalytics(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const response = await api.get("/datasets/active/analytics", headers);
  writeCachedAnalytics(cacheKey, response.data.analytics);
  return { data: response.data.analytics, fromCache: false };
};
