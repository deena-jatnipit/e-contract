export default defineEventHandler(async (event) => {
  try {
    // Rate limiting: 5 OTP requests per minute per IP
    const clientIP = getClientIP(event);
    const rateLimitResult = rateLimit(`otp_send_${clientIP}`, 5, 60000);

    if (!rateLimitResult.allowed) {
      throw createApiError(
        429,
        "Too many OTP requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await readBody(event);
    validateRequestBody(body, ["msisdn"]);

    // Validate and sanitize phone number
    const phoneValidation = validatePhoneNumber(body.msisdn);
    if (!phoneValidation.isValid) {
      throw createApiError(400, phoneValidation.error, "INVALID_PHONE_NUMBER");
    }

    const config = useRuntimeConfig();

    if (!config.otpSecret || !config.otpKey) {
      throw createApiError(
        500,
        "OTP service configuration missing",
        "MISSING_CONFIG"
      );
    }

    const API_URL = "https://otp.thaibulksms.com/v2/otp/request";

    const params = new URLSearchParams();
    params.set("msisdn", phoneValidation.cleaned);
    params.set("secret", config.otpSecret);
    params.set("key", config.otpKey);

    const response = await $fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    return createSuccessResponse(response, "OTP sent successfully");
  } catch (error) {
    const handledError = handleApiError(error, "send-otp");
    return createErrorResponse(handledError, "Failed to send OTP");
  }
});
