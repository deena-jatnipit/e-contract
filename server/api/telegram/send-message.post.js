export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, documentId = null } = body;

  const config = useRuntimeConfig();
  const botToken = config.telegramBotToken;
  const chatId = config.telegramAdminChatId;

  // Add document ID to message if provided
  const fullMessage = documentId
    ? `เอกสาร ${documentId} ได้รับการเซ็นลายเซ็นเรียบร้อยแล้ว\n\n${message}`
    : message;

  try {
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
        },
      }
    );

    if (response.ok) {
      return { message: "Telegram message sent successfully", data: response };
    } else {
      return { error: "Failed to send Telegram message" };
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return { error: "Failed to send Telegram message" };
  }
});
