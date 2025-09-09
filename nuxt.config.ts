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
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
      tbsAuth: process.env.TBS_DEENA_AUTH,
      otpSecret: process.env.TBS_DEENA_OTP_SECRET,
      otpKey: process.env.TBS_DEENA_OTP_KEY,
      lineAccessToken: process.env.LINE_ACCESS_TOKEN,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
      jwtSecret: process.env.JWT_SECRET,
      projectBaseUrl: process.env.PROJECT_BASE_URL,
    },
  },

  ssr: false,
});
