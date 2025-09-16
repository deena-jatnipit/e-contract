export default defineEventHandler(async (event) => {
  try {
    // Rate limiting: 10 SMS per minute per IP
    const clientIP = getClientIP(event);
    const rateLimitResult = rateLimit(`sms_${clientIP}`, 10, 60000);

    if (!rateLimitResult.allowed) {
      throw createApiError(
        429,
        "Too many SMS requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await readBody(event);

    // Validate required fields
    validateRequestBody(body, ["msisdn", "message"]);

    const { msisdn, message, sender = "DeenaSure", force = "corporate" } = body;

    // Validate and sanitize phone number
    const phoneValidation = validatePhoneNumber(msisdn);
    if (!phoneValidation.isValid) {
      throw createApiError(400, phoneValidation.error, "INVALID_PHONE_NUMBER");
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(message);

    const config = useRuntimeConfig();
    const API_AUTH = `Basic ${config.tbsAuth}`; // Server-side only

    if (!config.tbsAuth) {
      throw createApiError(
        500,
        "SMS service configuration missing",
        "MISSING_CONFIG"
      );
    }

    const params = new URLSearchParams();
    params.set("msisdn", phoneValidation.cleaned);
    params.set("message", sanitizedMessage);
    params.set("sender", sender);
    params.set("force", force);

    const response = await $fetch("https://api-v2.thaibulksms.com/sms", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        authorization: API_AUTH,
      },
      body: params,
    });

    return createSuccessResponse(response, "SMS sent successfully");
  } catch (error) {
    const handledError = handleApiError(error, "send-sms");
    return createErrorResponse(handledError, "Failed to send SMS");
  }
});
