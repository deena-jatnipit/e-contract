export const useLiff = () => {
  const initialized = ref(false);
  const error = ref(null);

  const init = async () => {
    try {
      const config = useRuntimeConfig();
      await liff.init({ liffId: config.public.liffId });
      initialized.value = true;
    } catch (err) {
      error.value = err;
      console.error("LIFF initialization failed:", err);
    }
  };

  const getEmail = async () => {
    if (!initialized.value) {
      await init();
    }

    if (liff.isLoggedIn()) {
      const decodedIdToken = liff.getDecodedIDToken();
      return decodedIdToken?.email;
    }
    return null;
  };

  return {
    init,
    getEmail,
    error,
    initialized,
  };
};
