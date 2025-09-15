export const createSuccessResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

export const createErrorResponse = (error, message = "An error occurred") => {
  return {
    success: false,
    error: message,
    code: error.code || "UNKNOWN_ERROR",
    timestamp: new Date().toISOString(),
  };
};
