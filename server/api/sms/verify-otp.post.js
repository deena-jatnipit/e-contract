export default defineEventHandler(async (event) => {
  try {
    // Rate limiting: 10 OTP verification attempts per minute per IP
    const clientIP = getClientIP(event);
    const rateLimitResult = rateLimit(`otp_verify_${clientIP}`, 10, 60000);

    if (!rateLimitResult.allowed) {
      throw createApiError(
        429,
        "Too many OTP verification attempts. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await readBody(event);
    validateRequestBody(body, ["pin", "token"]);

    const { pin, token } = body;

    // Validate PIN format (typically 4-6 digits)
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      throw createApiError(400, "PIN must be 4-6 digits", "INVALID_PIN_FORMAT");
    }

    // Validate token format (should not be empty)
    if (!token || typeof token !== "string" || token.trim() === "") {
      throw createApiError(400, "Token is required", "INVALID_TOKEN");
    }

    const config = useRuntimeConfig();

    if (!config.otpSecret || !config.otpKey) {
      throw createApiError(
        500,
        "OTP service configuration missing",
        "MISSING_CONFIG"
      );
    }

    const API_URL = "https://otp.thaibulksms.com/v2/otp/verify";

    const params = new URLSearchParams();
    params.set("key", config.otpKey);
    params.set("secret", config.otpSecret);
    params.set("token", token.trim());
    params.set("pin", pin);

    const response = await $fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    return createSuccessResponse(response, "OTP verified successfully");
  } catch (error) {
    const handledError = handleApiError(error, "verify-otp");
    return createErrorResponse(handledError, "Failed to verify OTP");
  }
});
