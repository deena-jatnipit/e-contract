export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const config = useRuntimeConfig();

  const API_URL = "https://email-api.thaibulksms.com/email/v1/otp/send";
  const API_AUTH = `Basic ${config.tbsAuth}`;

  const bodyData = {
    template_uuid: config.public.emailTemplateUuid,
    recipient_email: body.email,
  };

  try {
    const response = await $fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        authorization: API_AUTH,
      },
      body: JSON.stringify({ ...bodyData }),
    });
    return response;
  } catch (error) {
    return { error: error.message };
  }
});
