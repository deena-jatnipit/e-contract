import {
  createApiError,
  handleApiError,
  validateRequestBody,
} from "~/server/utils/errorHandler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "~/server/utils/responseHandler.js";
import { validateUserId, sanitizeInput } from "~/server/utils/validators.js";
import { rateLimit, getClientIP } from "~/server/utils/rateLimiter.js";

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting: 5 requests per minute per IP
    const clientIP = getClientIP(event);
    const rateLimitResult = rateLimit(`line_${clientIP}`, 5, 60000);

    if (!rateLimitResult.allowed) {
      throw createApiError(
        429,
        "Too many requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await readBody(event);
    validateRequestBody(body, ["userId"]);

    // Validate and sanitize userId
    const userIdValidation = validateUserId(body.userId);
    if (!userIdValidation.isValid) {
      throw createApiError(400, userIdValidation.error, "INVALID_USER_ID");
    }

    // Validate message content
    if (!body.messages && !body.message) {
      throw createApiError(
        400,
        "Missing required message or messages field",
        "MISSING_MESSAGE"
      );
    }

    // Process and sanitize messages
    let messages;
    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages.map((msg) => ({
        ...msg,
        text: msg.text ? sanitizeInput(msg.text) : msg.text,
      }));
    } else if (body.message) {
      messages = [
        {
          type: "text",
          text: sanitizeInput(body.message),
        },
      ];
    }

    const config = useRuntimeConfig();
    const LINE_CHANNEL_ACCESS_TOKEN = config.lineAccessToken;

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw createApiError(
        500,
        "LINE access token not configured",
        "MISSING_CONFIG"
      );
    }

    const payload = {
      to: userIdValidation.cleaned,
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
