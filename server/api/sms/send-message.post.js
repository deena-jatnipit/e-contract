export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate required fields
    validateRequestBody(body, ["msisdn", "message"]);

    const { msisdn, message, sender = "DeenaSure", force = "corporate" } = body;

    const config = useRuntimeConfig();
    const API_AUTH = `Basic ${config.tbsAuth}`; // Server-side only

    const params = new URLSearchParams();
    params.set("msisdn", msisdn);
    params.set("message", message);
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
