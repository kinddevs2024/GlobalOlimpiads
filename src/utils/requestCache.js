/**
 * Request deduplication and caching utility
 */

const pendingRequests = new Map();
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

/**
 * Generate cache key from request config
 */
const getCacheKey = (method, url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${method}:${url}${sortedParams ? `?${sortedParams}` : ''}`;
};

/**
 * Get cached response if available and not expired
 */
export const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Set cached response
 */
export const setCachedResponse = (key, data, ttl = CACHE_TTL) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Clear cache for a specific key or all cache
 */
export const clearCache = (key = null) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Deduplicate concurrent requests
 * If the same request is already in progress, return the existing promise
 */
export const deduplicateRequest = (key, requestFn) => {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  // Create new request promise
  const requestPromise = Promise.resolve(requestFn())
    .then(response => {
      pendingRequests.delete(key);
      return response;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });
  
  pendingRequests.set(key, requestPromise);
  return requestPromise;
};

/**
 * Request with caching and deduplication
 */
export const cachedRequest = async (
  requestFn,
  options = {}
) => {
  const {
    method = 'GET',
    url = '',
    params = {},
    useCache = true,
    useDeduplication = true,
    cacheTTL = CACHE_TTL,
    skipCache = false
  } = options;
  
  const cacheKey = getCacheKey(method, url, params);
  
  // Check cache first (only for GET requests and if cache is enabled)
  if (useCache && method === 'GET' && !skipCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Execute request with deduplication
  const executeRequest = async () => {
    try {
      const response = await requestFn();
      
      // Cache successful GET responses
      if (useCache && method === 'GET' && response) {
        setCachedResponse(cacheKey, response, cacheTTL);
      }
      
      return response;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
  
  if (useDeduplication) {
    return deduplicateRequest(cacheKey, executeRequest);
  }
  
  return executeRequest();
};

/**
 * Clear all pending requests (useful for cleanup)
 */
export const clearPendingRequests = () => {
  pendingRequests.clear();
};

export default {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  deduplicateRequest,
  cachedRequest,
  clearPendingRequests
};

