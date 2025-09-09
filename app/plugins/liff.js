import liff from "@line/liff";

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig();
  const liffId = config.public.liffId;

  const { userAgent } = navigator;

  const redirect = async () => {
    const liffUrl = await liff.permanentLink.createUrlBy(window.location.href);
    window.location.href = liffUrl;
  };

  try {
    await liff.init({ liffId: liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
    }

    if (!liff.isInClient() && userAgent.includes("Line")) {
      redirect();
    }

    nuxtApp.provide("liff", liff);
  } catch (error) {
    console.error(error);
  }
});
