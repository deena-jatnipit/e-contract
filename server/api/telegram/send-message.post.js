export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    validateRequestBody(body, ["message"]);

    const config = useRuntimeConfig();
    const botToken = config.telegramBotToken; // Server-side only
    const chatId = config.telegramAdminChatId; // Server-side only

    if (!botToken || !chatId) {
      throw createApiError(
        500,
        "Telegram configuration missing",
        "MISSING_CONFIG"
      );
    }

    const { message, parseMode = "HTML" } = body;
    const sanitizedMessage = sanitizeInput(message);

    const response = await $fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          chat_id: chatId,
          text: sanitizedMessage,
          parse_mode: parseMode,
        },
      }
    );

    if (!response.ok) {
      throw createApiError(
        500,
        "Failed to send Telegram message",
        "TELEGRAM_SEND_FAILED"
      );
    }

    return createSuccessResponse(
      response,
      "Telegram message sent successfully"
    );
  } catch (error) {
    const handledError = handleApiError(error, "send-telegram-message");
    return createErrorResponse(handledError, "Failed to send Telegram message");
  }
});
