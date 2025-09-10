import liff from "@line/liff";

export const useTestLiff = () => {
  const initialized = ref(false);
  const error = ref(null);

  const init = async () => {
    try {
      const config = useRuntimeConfig();
      await liff.init({ liffId: config.public.liffTestId });
      initialized.value = true;
      console.log("LIFF initialized successfully");
    } catch (err) {
      error.value = err;
      console.error("LIFF initialization failed:", err);
    }
  };

  const getIdToken = async () => {
    if (!initialized.value) {
      await init();
    }

    if (!liff.isLoggedIn()) {
      console.log("User not logged in, redirecting to LINE login");
      liff.login();
      return null;
    }

    const idToken = liff.getIDToken();
    console.log("ID Token:", idToken);
    return idToken;
  };

  const getDecodedIDToken = async () => {
    if (!initialized.value) {
      await init();
    }

    // Check if user is logged in, if not, redirect to login
    if (!liff.isLoggedIn()) {
      console.log("User not logged in, redirecting to LINE login");
      liff.login();
      return null;
    }

    const decodedIdToken = liff.getDecodedIDToken();
    console.log("Decoded ID Token:", decodedIdToken);
    return decodedIdToken;
  };

  const isLoggedIn = () => {
    return initialized.value && liff.isLoggedIn();
  };

  return {
    init,
    getDecodedIDToken,
    isLoggedIn,
    getIdToken,
    error,
    initialized,
  };
};
