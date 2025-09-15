export const createApiError = (statusCode, message, code = null) => {
  return createError({
    statusCode,
    statusMessage: message,
    data: { code, timestamp: new Date().toISOString() },
  });
};

export const handleApiError = (error, context = "") => {
  console.error(`API Error in ${context}:`, {
    message: error.message,
    status: error.statusCode,
    stack: error.stack,
  });

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === "production") {
    return createApiError(500, "Internal server error", "INTERNAL_ERROR");
  }

  return error;
};

export const validateRequestBody = (body, requiredFields = []) => {
  if (!body || typeof body !== "object") {
    throw createApiError(400, "Invalid request body", "INVALID_BODY");
  }

  for (const field of requiredFields) {
    if (!body[field]) {
      throw createApiError(
        400,
        `Missing required field: ${field}`,
        "MISSING_FIELD"
      );
    }
  }

  return true;
};
