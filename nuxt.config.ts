// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/supabase",
  ],

  app: {
    head: {
      script: [
        {
          src: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
          type: "text/javascript",
        },
        {
          src: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js",
          type: "text/javascript",
        },
      ],
    },
  },

  runtimeConfig: {
    // Server-side only (sensitive data)
    lineAccessToken: process.env.LINE_ACCESS_TOKEN,
    tbsAuth: process.env.TBS_AUTH,
    otpSecret: process.env.TBS_OTP_SECRET,
    otpKey: process.env.TBS_OTP_KEY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,

    // Public (safe for client-side)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
      projectBaseUrl: process.env.PROJECT_BASE_URL,
    },
  },

  ssr: false,

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/login",
      exclude: [
        "/user/sign",
        "/user/sign-success",
        "/user/sms/otp",
        "/user/sms/contract1",
        "/user/sms/contract2",
        "/user/email/otp",
        "/user/email/contract1",
        "/user/email/contract2",
        "/user",
        "/user/*",
      ],
    },
  },
});
