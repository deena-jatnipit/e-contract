export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const msisdn = body.msisdn;

  const config = useRuntimeConfig();

  const API_URL = "https://otp.thaibulksms.com/v2/otp/request";

  const params = new URLSearchParams();
  params.set("msisdn", msisdn);
  params.set("secret", config.public.otpSecret);
  params.set("key", config.public.otpKey);

  try {
    const response = await $fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    return response;
  } catch (error) {
    return { error: error.message };
  }
});
