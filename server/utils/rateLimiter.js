const rateLimitStore = new Map();

export const rateLimit = (key, maxRequests = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);

  // Remove old requests outside the window
  const validRequests = requests.filter((timestamp) => timestamp > windowStart);
  rateLimitStore.set(key, validRequests);

  if (validRequests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: validRequests[0] + windowMs,
    };
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);

  return {
    allowed: true,
    remaining: maxRequests - validRequests.length,
    resetTime: now + windowMs,
  };
};

export const getClientIP = (event) => {
  return getClientIP(event) || "unknown";
};
