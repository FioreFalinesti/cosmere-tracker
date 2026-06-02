export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseKey: '',
    },
  },
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: [
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css',
    '~/assets/css/main.css',
  ],
  devServer: {
    port: 1616,
  },
  vite: {
    resolve: {
      alias: {
        '@supabase/functions-js': '@supabase/functions-js/dist/main/index.js',
      },
    },
  },
})
