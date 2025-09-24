import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // Get the raw body from the request
    const body = await readBody(event);

    // Verify Line signature (you should implement this)
    const signature = getHeader(event, "x-line-signature");
    if (!signature) {
      throw createError({
        statusCode: 401,
        statusMessage: "Missing Line signature",
      });
    }

    // Handle different event types
    if (Array.isArray(body.events)) {
      for (const lineEvent of body.events) {
        switch (lineEvent.type) {
          case "follow":
            await handleFollowEvent(lineEvent);
            break;
          default:
            console.log(`Unhandled event type: ${lineEvent.type}`);
        }
      }
    }

    // Return 200 OK to acknowledge receipt
    return { status: "ok" };
  } catch (error) {
    console.error("Line webhook error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message,
    });
  }
});

async function handleFollowEvent(event) {
  // Handle when user follows your LINE Official Account
  console.log("New follower:", event.source.userId);
  // Add your follow event handling logic here
}
