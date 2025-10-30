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
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = event.node.req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIp = event.node.req.headers["x-real-ip"];
  if (realIp) {
    return realIp;
  }

  // Fallback to socket remote address
  const remoteAddress = event.node.req.socket?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  return "unknown";
};
