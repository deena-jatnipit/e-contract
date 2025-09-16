export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate required fields
    validateRequestBody(body, ["userId"]);

    // Validate message content
    if (!body.messages && !body.message) {
      throw createApiError(
        400,
        "Missing required message or messages field",
        "MISSING_MESSAGE"
      );
    }

    // Process messages
    let messages;
    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      messages = [{ type: "text", text: body.message }];
    }

    // Get LINE access token from server-side config
    const config = useRuntimeConfig();
    const LINE_CHANNEL_ACCESS_TOKEN = config.lineAccessToken; // Server-side only

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw createApiError(
        500,
        "LINE access token not configured",
        "MISSING_CONFIG"
      );
    }

    const payload = {
      to: body.userId,
      messages: messages,
    };

    const response = await $fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    return createSuccessResponse(response, "Message sent successfully");
  } catch (error) {
    const handledError = handleApiError(error, "send-line-message");
    return createErrorResponse(handledError, "Failed to send message");
  }
});
