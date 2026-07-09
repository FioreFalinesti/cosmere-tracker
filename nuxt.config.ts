export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      adminEmails: '',
    },
  },
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  experimental: {
    viteEnvironmentApi: true,
  },
  modules: ['@nuxt/ui'],
  css: [
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css',
    '~/assets/css/main.css',
  ],
  devServer: {
    port: 1616,
  },
})
