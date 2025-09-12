export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required userId field",
      });
    }

    let messages;

    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      messages = [{ type: "text", text: body.message }];
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required message or messages field",
      });
    }

    const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
    const LINE_CHANNEL_ACCESS_TOKEN = useRuntimeConfig().public.lineAccessToken;

    const payload = {
      to: body.userId,
      messages: messages,
    };

    const response = await $fetch(LINE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    return { message: `Message sent successfully`, data: response };
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Failed to send message" };
  }
});
