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
  // Works around a Nuxt regression where `nuxt generate` fails whenever
  // app.baseURL isn't '/' (only true in CI, for the GitHub Pages subpath) —
  // https://github.com/nuxt/nuxt/issues/30367
  experimental: { appManifest: false },
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
