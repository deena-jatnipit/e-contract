import {
  createApiError,
  handleApiError,
  validateRequestBody,
} from "~/server/utils/errorHandler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "~/server/utils/responseHandler.js";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    validateRequestBody(body, ["msisdn"]);

    const config = useRuntimeConfig();
    const API_URL = "https://otp.thaibulksms.com/v2/otp/request";

    const params = new URLSearchParams();
    params.set("msisdn", body.msisdn);
    params.set("secret", config.otpSecret); // Server-side only
    params.set("key", config.otpKey); // Server-side only

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
