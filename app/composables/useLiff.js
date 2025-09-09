import liff from "@line/liff";

export const useLiff = () => {
  const initialized = ref(false);
  const error = ref(null);

  const init = async () => {
    try {
      const config = useRuntimeConfig();
      await liff.init({ liffId: config.public.liffId });
      initialized.value = true;
      console.log("LIFF initialized successfully");
    } catch (err) {
      error.value = err;
      console.error("LIFF initialization failed:", err);
    }
  };

  const getDecodedIDToken = async () => {
    if (!initialized.value) {
      await init();
    }

    if (liff.isLoggedIn()) {
      const decodedIdToken = liff.getDecodedIDToken();
      console.log("Decoded ID Token:", decodedIdToken);
      return decodedIdToken;
    }
    return null;
  };

  return {
    init,
    getDecodedIDToken,
    error,
    initialized,
  };
};
