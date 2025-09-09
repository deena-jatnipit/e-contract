export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    if (!body.userId || !body.message) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
    const LINE_CHANNEL_ACCESS_TOKEN = useRuntimeConfig().public.lineAccessToken;

    const payload = {
      to: body.userId,
      messages: [{ type: "text", text: body.message }],
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
