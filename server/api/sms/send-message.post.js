export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const {
    msisdn,
    message,
    sender = "DeenaSure",
    force = "corporate",
  } = body || {};

  const config = useRuntimeConfig();

  const API_URL = "https://api-v2.thaibulksms.com/sms";
  const API_AUTH = `Basic ${config.public.tbsAuth}`;
  // const API_AUTH = `Basic`;

  const params = new URLSearchParams();
  params.set("msisdn", msisdn);
  params.set("message", message);
  params.set("sender", sender);
  params.set("force", force);

  try {
    const response = await $fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        authorization: API_AUTH,
      },
      body: params,
    });
    return response;
  } catch (error) {
    return { error: error.message || "Failed to send SMS" };
  }
});
