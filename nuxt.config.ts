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
      link: [],
      script: [],
    },
  },

  runtimeConfig: {
    lineAccessToken: process.env.LINE_ACCESS_TOKEN,
    tbsAuth: process.env.TBS_AUTH,
    otpSecret: process.env.TBS_OTP_SECRET,
    otpKey: process.env.TBS_OTP_KEY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
      projectBaseUrl: process.env.PROJECT_BASE_URL,
    },
  },

  ssr: false,

  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/login",
      exclude: [
        "/auth/accept-invitation",
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
