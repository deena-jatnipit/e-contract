import {
  createApiError,
  handleApiError,
  validateRequestBody,
} from "~/server/utils/errorHandler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "~/server/utils/responseHandler.js";
import { sanitizeInput } from "~/server/utils/validators.js";

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

    const { message, documentId = null } = body;
    const sanitizedMessage = sanitizeInput(message);

    // Add document ID to message if provided
    const fullMessage = documentId
      ? `เอกสาร ${documentId} ได้รับการเซ็นลายเซ็นเรียบร้อยแล้ว\n\n${sanitizedMessage}`
      : sanitizedMessage;

    const response = await $fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          chat_id: chatId,
          text: fullMessage,
          parse_mode: "HTML",
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
