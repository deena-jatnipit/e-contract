import liff from "@line/liff";

export const useLiff = () => {
  const initialized = ref(false);
  const permissionStatus = ref(null);
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

  const getIDToken = async () => {
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

  const getPermissionList = () => {
    liff.permission.getGrantedAll().then((scopes) => {
      // ["profile", "chat_message.write", "openid", "email"]
      console.log(scopes);
    });
  };

  const requestPermission = () => {
    liff.permission.query("profile").then((permissionStatus) => {
      permissionStatus = { state: "granted" };
    });
  };

  return {
    init,
    getIDToken,
    getDecodedIDToken,
    isLoggedIn,
    getPermissionList,
    requestPermission,
    error,
    initialized,
  };
};
